/* Roadster Ramp — a drivable 3D Tesla Roadster stunt ramp.
   Pitch-black void, J-shaped neon-edged ramp, truss tower, runway.
   Drive with WASD/arrows, launch off the lip, fire cold-gas thrusters.
   Custom arcade physics: ground driving, ramp surface tracking with
   fan-suction downforce, ballistic flight, boost and lift thrusters. */

import * as THREE from "three";

export interface RampHud {
  speedKmh: number;
  fanOn: boolean;
  contactG: number;
  zone: "ground" | "ramp" | "air";
}

export interface RoadsterRampOptions {
  onHud?: (hud: RampHud) => void;
  onExit?: () => void;
}

/** Mutable touch-control state, written by the React overlay. */
export interface TouchState {
  left: boolean;
  right: boolean;
  gas: boolean;
  brake: boolean;
  boost: boolean;
  lift: boolean;
}

const RAMP_X0 = 0; // ramp curve starts here (flat approach for x < x0)
const RAMP_R = 30; // curve radius
const RAMP_W = 16; // ramp width
const RAMP_PHI_MAX = (102 * Math.PI) / 180; // hooks just past vertical
const CAR_CLEAR = 0.55; // ride height of car origin above surface
const G = 9.8;

const tmpV1 = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
const tmpV3 = new THREE.Vector3();
const tmpM = new THREE.Matrix4();

export class RoadsterRamp {
  touch: TouchState = { left: false, right: false, gas: false, brake: false, boost: false, lift: false };

  private container: HTMLElement;
  private opts: RoadsterRampOptions;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private car = new THREE.Group();
  private wheels: THREE.Mesh[] = [];
  private headSpots: THREE.SpotLight[] = [];
  private headlampMats: THREE.MeshBasicMaterial[] = [];
  private thrusterTips: THREE.MeshBasicMaterial[] = [];
  private blobShadow: THREE.Mesh;
  private flameLight = new THREE.PointLight(0xff7a2a, 0, 40, 2);

  private keys = new Set<string>();
  private raf = 0;
  private clock = new THREE.Clock();
  private disposed = false;
  private hudTick = 0;

  // --- vehicle state ---
  private pos = new THREE.Vector3(-105, CAR_CLEAR, 0);
  private vel = new THREE.Vector3();
  private yaw = 0;
  private mode: "ground" | "ramp" | "air" = "ground";
  private phi = 0; // position along ramp curve
  private u = 0; // speed along ramp tangent
  private fanOn = true;
  private lampsOn = true;
  private camMode = 0;
  private camPos = new THREE.Vector3(-120, 8, 14);
  private lastBoost = -10;
  private elapsed = 0;
  private muted = false;

  // --- particles ---
  private pGeo!: THREE.BufferGeometry;
  private pPos!: Float32Array;
  private pCol!: Float32Array;
  private pVel: THREE.Vector3[] = [];
  private pLife = new Float32Array(600);
  private pMaxLife = new Float32Array(600);
  private pCursor = 0;
  private readonly P_MAX = 600;

  // --- audio ---
  private audioCtx: AudioContext | null = null;
  private engOsc: OscillatorNode | null = null;
  private engGain: GainNode | null = null;
  private windGain: GainNode | null = null;

  constructor(container: HTMLElement, opts: RoadsterRampOptions = {}) {
    this.container = container;
    this.opts = opts;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    Object.assign(this.renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 130, 340);

    this.camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.camPos);

    this.buildLights();
    this.buildEnvironment();
    this.buildCar();
    this.blobShadow = this.buildBlobShadow();
    this.scene.add(this.flameLight);
    this.buildParticles();
    this.initAudio();
    this.bindInput();

    const loop = () => {
      if (this.disposed) return;
      this.step();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /* --------------------------------- lights --------------------------------- */

  private buildLights() {
    this.scene.add(new THREE.AmbientLight(0x2a3a55, 0.85));
    const moon = new THREE.DirectionalLight(0xbfd4ff, 1.5);
    moon.position.set(40, 80, 50);
    this.scene.add(moon);
    // Red neon wash near the ramp.
    const neon1 = new THREE.PointLight(0xff2d12, 900, 90, 2);
    neon1.position.set(RAMP_X0 + 18, 14, 0);
    this.scene.add(neon1);
    const neon2 = new THREE.PointLight(0xff2d12, 500, 70, 2);
    neon2.position.set(-40, 6, 0);
    this.scene.add(neon2);
  }

  /* ------------------------------- environment ------------------------------ */

  private buildEnvironment() {
    const darkConcrete = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.95 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.45, metalness: 0.75 });
    const neonMat = new THREE.MeshBasicMaterial({ color: 0xff3517 });

    // Infinite dark ground (safety net beyond the platforms).
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.scene.add(ground);

    // Runway platform: long dark slab.
    const runway = new THREE.Mesh(new THREE.BoxGeometry(150, 1, 26), darkConcrete);
    runway.position.set(-81, -0.5, 0);
    this.scene.add(runway);
    // Red neon edge strips.
    for (const z of [-13.2, 13.2]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(150, 0.18, 0.5), neonMat);
      strip.position.set(-81, 0.09, z);
      this.scene.add(strip);
    }
    // Marker lights along the far edge.
    const markerRed = new THREE.MeshBasicMaterial({ color: 0xff2211 });
    const markerWhite = new THREE.MeshBasicMaterial({ color: 0xdde6ff });
    const markerGeo = new THREE.SphereGeometry(0.32, 10, 10);
    for (let i = 0; i <= 12; i++) {
      const m = new THREE.Mesh(markerGeo, i % 2 === 0 ? markerRed : markerWhite);
      m.position.set(-150 + i * 12, 0.35, 14.5);
      this.scene.add(m);
    }

    // Square pad under the ramp.
    const pad = new THREE.Mesh(new THREE.BoxGeometry(76, 1, 64), darkConcrete);
    pad.position.set(RAMP_X0 + 20, -0.5, 0);
    this.scene.add(pad);
    for (const z of [-32.2, 32.2]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(76, 0.18, 0.5), neonMat);
      strip.position.set(RAMP_X0 + 20, 0.09, z);
      this.scene.add(strip);
    }

    this.buildRamp(neonMat);
    this.buildTruss(steel);
  }

  /** J-shaped ramp: flat lead-in, then a curve through vertical, hooking past it. */
  private rampPoint(s: number): { p: THREE.Vector3; phi: number } {
    // s = arc distance from curve start (negative = on the flat lead-in)
    if (s <= 0) {
      return { p: new THREE.Vector3(RAMP_X0 + s, 0, 0), phi: 0 };
    }
    const phi = Math.min(s / RAMP_R, RAMP_PHI_MAX);
    return {
      p: new THREE.Vector3(
        RAMP_X0 + RAMP_R * Math.sin(phi),
        RAMP_R * (1 - Math.cos(phi)),
        0
      ),
      phi,
    };
  }

  private buildRamp(neonMat: THREE.Material) {
    const leadIn = 18;
    const arcLen = RAMP_R * RAMP_PHI_MAX;
    const segs = 64;
    const hw = RAMP_W / 2;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const s = -leadIn + ((leadIn + arcLen) * i) / segs;
      const { p } = this.rampPoint(s);
      positions.push(p.x, p.y, -hw, p.x, p.y, hw);
      if (i < segs) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x8f959d,
      roughness: 0.85,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
    this.scene.add(new THREE.Mesh(geo, rampMat));

    // Neon tubes along both ramp edges.
    for (const z of [-hw - 0.25, hw + 0.25]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const s = -leadIn + ((leadIn + arcLen) * i) / 40;
        const { p } = this.rampPoint(s);
        pts.push(new THREE.Vector3(p.x, p.y + 0.22, z));
      }
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.22, 8, false),
        neonMat
      );
      this.scene.add(tube);
    }
    // Neon strip across the top lip.
    const lip = this.rampPoint(arcLen).p;
    const lipStrip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, RAMP_W + 0.9), neonMat);
    lipStrip.position.set(lip.x, lip.y + 0.25, 0);
    this.scene.add(lipStrip);

    // Support columns under the high part of the ramp.
    const steel = new THREE.MeshStandardMaterial({ color: 0x2c313a, roughness: 0.5, metalness: 0.7 });
    for (const frac of [0.45, 0.7, 0.9]) {
      const { p } = this.rampPoint(arcLen * frac);
      const h = p.y;
      if (h < 3) continue;
      for (const z of [-hw + 1.5, hw - 1.5]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 1.2), steel);
        col.position.set(p.x, h / 2, z);
        this.scene.add(col);
      }
    }
  }

  private buildTruss(steel: THREE.Material) {
    const towerX = RAMP_X0 + RAMP_R + 16;
    const H = 58;
    const w = 5;
    const group = new THREE.Group();
    // Four legs.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.9, H, 0.9), steel);
        leg.position.set((sx * w) / 2, H / 2, (sz * w) / 2);
        group.add(leg);
      }
    }
    // Horizontal + diagonal braces.
    const braceT = 0.45;
    for (let y = 4; y < H; y += 8) {
      for (const sz of [-w / 2, w / 2]) {
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(w, braceT, braceT), steel);
        hBar.position.set(0, y, sz);
        group.add(hBar);
      }
      for (const sx of [-w / 2, w / 2]) {
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(braceT, braceT, w), steel);
        hBar.position.set(sx, y, 0);
        group.add(hBar);
      }
      // Diagonals on the two wide faces.
      for (const sz of [-w / 2, w / 2]) {
        const diag = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(w, 8), braceT, braceT), steel);
        diag.position.set(0, y + 4, sz);
        diag.rotation.z = Math.atan2(8, w);
        group.add(diag);
      }
    }
    group.position.set(towerX, 0, 0);
    this.scene.add(group);

    // Guy wires to ground anchors.
    const wireMat = new THREE.LineBasicMaterial({ color: 0x4a525e });
    const top = new THREE.Vector3(towerX, H - 2, 0);
    for (const [ax, az] of [
      [towerX + 26, 20],
      [towerX + 26, -20],
      [towerX - 26, 20],
      [towerX - 26, -20],
    ]) {
      const g = new THREE.BufferGeometry().setFromPoints([top, new THREE.Vector3(ax, 0, az)]);
      this.scene.add(new THREE.Line(g, wireMat));
    }
  }

  /* ----------------------------------- car ----------------------------------- */

  private buildCar() {
    // Sleek white coupe, modeled facing +x, ~4.6 long.
    const paint = new THREE.MeshPhysicalMaterial({
      color: 0xf2f4f6,
      roughness: 0.22,
      metalness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x0b1018,
      roughness: 0.06,
      metalness: 0.85,
    });
    const darkTrim = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.55 });

    // Body: extruded side profile.
    const s = new THREE.Shape();
    s.moveTo(-2.3, 0.34);
    s.lineTo(2.28, 0.34);
    s.quadraticCurveTo(2.42, 0.5, 2.3, 0.62); // nose
    s.quadraticCurveTo(1.5, 0.72, 1.05, 0.8); // hood
    s.quadraticCurveTo(0.45, 0.92, 0.1, 1.0); // windshield base
    s.quadraticCurveTo(-0.6, 1.08, -1.15, 0.98); // roof
    s.quadraticCurveTo(-1.9, 0.9, -2.28, 0.78); // tail
    s.quadraticCurveTo(-2.38, 0.55, -2.3, 0.34);
    const bodyGeo = new THREE.ExtrudeGeometry(s, {
      depth: 1.86,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.08,
      bevelSegments: 2,
      steps: 1,
    });
    bodyGeo.translate(0, 0, -0.93);
    this.car.add(new THREE.Mesh(bodyGeo, paint));

    // Glass canopy.
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), glass);
    canopy.scale.set(1.05, 0.42, 0.78);
    canopy.position.set(-0.25, 0.92, 0);
    this.car.add(canopy);

    // Wheels.
    const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.36, 20);
    wheelGeo.rotateX(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.38, 12);
    hubGeo.rotateX(Math.PI / 2);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x6a7078, roughness: 0.3, metalness: 0.9 });
    for (const [wx, wz] of [
      [1.45, 0.98],
      [1.45, -0.98],
      [-1.45, 0.98],
      [-1.45, -0.98],
    ]) {
      const wheel = new THREE.Mesh(wheelGeo, darkTrim);
      wheel.position.set(wx, 0.44, wz);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.position.copy(wheel.position);
      this.car.add(wheel, hub);
      this.wheels.push(wheel);
    }

    // Full-width red taillight bar.
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.14, 1.72),
      new THREE.MeshBasicMaterial({ color: 0xff1e1e })
    );
    tail.position.set(-2.36, 0.72, 0);
    this.car.add(tail);

    // Headlights (emissive boxes + real spotlights, toggled with L).
    for (const hz of [-0.62, 0.62]) {
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xd9ecff });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.42), lampMat);
      lamp.position.set(2.36, 0.58, hz);
      this.car.add(lamp);
      this.headlampMats.push(lampMat);
      const spot = new THREE.SpotLight(0xcfe4ff, 350, 55, 0.55, 0.45, 1.6);
      spot.position.set(2.3, 0.7, hz);
      spot.target.position.set(14, -0.5, hz * 2);
      this.car.add(spot, spot.target);
      this.headSpots.push(spot);
    }

    // Corner thruster pods with glowing tips.
    const podGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.5, 10);
    podGeo.rotateZ(Math.PI / 2);
    for (const [px, pz] of [
      [1.7, 1.02],
      [1.7, -1.02],
      [-1.7, 1.02],
      [-1.7, -1.02],
    ]) {
      const pod = new THREE.Mesh(podGeo, darkTrim);
      pod.position.set(px, 0.42, pz);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x1a2530 });
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), tipMat);
      tip.position.set(px - 0.28, 0.42, pz);
      this.car.add(pod, tip);
      this.thrusterTips.push(tipMat);
    }

    this.car.position.copy(this.pos);
    this.scene.add(this.car);
  }

  private buildBlobShadow(): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    this.scene.add(m);
    return m;
  }

  /* -------------------------------- particles -------------------------------- */

  private buildParticles() {
    this.pGeo = new THREE.BufferGeometry();
    this.pPos = new Float32Array(this.P_MAX * 3);
    this.pCol = new Float32Array(this.P_MAX * 3);
    for (let i = 0; i < this.P_MAX; i++) {
      this.pVel.push(new THREE.Vector3());
      this.pLife[i] = 0;
      this.pMaxLife[i] = 1;
      this.pPos[i * 3 + 1] = -100;
    }
    this.pGeo.setAttribute("position", new THREE.BufferAttribute(this.pPos, 3));
    this.pGeo.setAttribute("color", new THREE.BufferAttribute(this.pCol, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.85,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const pts = new THREE.Points(this.pGeo, mat);
    pts.frustumCulled = false;
    this.scene.add(pts);
  }

  private spawnParticle(
    x: number, y: number, z: number,
    vx: number, vy: number, vz: number,
    life: number, r: number, g: number, b: number
  ) {
    const i = this.pCursor;
    this.pCursor = (this.pCursor + 1) % this.P_MAX;
    this.pPos[i * 3] = x;
    this.pPos[i * 3 + 1] = y;
    this.pPos[i * 3 + 2] = z;
    this.pVel[i].set(vx, vy, vz);
    this.pCol[i * 3] = r;
    this.pCol[i * 3 + 1] = g;
    this.pCol[i * 3 + 2] = b;
    this.pLife[i] = life;
    this.pMaxLife[i] = life;
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < this.P_MAX; i++) {
      if (this.pLife[i] <= 0) continue;
      this.pLife[i] -= dt;
      if (this.pLife[i] <= 0) {
        this.pPos[i * 3 + 1] = -100;
        continue;
      }
      const damp = 1 - 1.6 * dt;
      this.pVel[i].multiplyScalar(Math.max(damp, 0));
      this.pPos[i * 3] += this.pVel[i].x * dt;
      this.pPos[i * 3 + 1] += this.pVel[i].y * dt;
      this.pPos[i * 3 + 2] += this.pVel[i].z * dt;
      // Fade toward black as it dies (additive blending fades it out).
      // pCol holds the spawn color; the attribute carries the faded color.
      const t = this.pLife[i] / this.pMaxLife[i];
      const f = t * t;
      this.pGeo.attributes.color.setXYZ(i,
        this.pCol[i * 3] * f,
        this.pCol[i * 3 + 1] * f,
        this.pCol[i * 3 + 2] * f
      );
    }
    this.pGeo.attributes.position.needsUpdate = true;
    this.pGeo.attributes.color.needsUpdate = true;
  }

  /** Exhaust burst behind the car (boost / thrusters). */
  private exhaust(n: number, spread: number, power: number, hot: boolean) {
    const f = this.forward();
    for (let i = 0; i < n; i++) {
      const bx = this.pos.x - f.x * 2.4 + (Math.random() - 0.5) * 0.8;
      const by = this.pos.y + 0.3 + (Math.random() - 0.5) * 0.5;
      const bz = this.pos.z - f.z * 2.4 + (Math.random() - 0.5) * 1.6;
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * spread;
      if (hot) {
        // orange-white flame
        const w = Math.random();
        this.spawnParticle(bx, by, bz,
          -f.x * power + Math.cos(a) * sp, (Math.random() - 0.3) * 2, -f.z * power + Math.sin(a) * sp,
          0.5 + Math.random() * 0.5, 1, 0.45 + w * 0.4, 0.15 + w * 0.5);
      } else {
        // cold-gas plume: pale blue-white
        this.spawnParticle(bx, by, bz,
          -f.x * power * 0.5 + Math.cos(a) * sp, -1 - Math.random() * 3, -f.z * power * 0.5 + Math.sin(a) * sp,
          0.7 + Math.random() * 0.6, 0.65, 0.8, 1);
      }
    }
  }

  /* ---------------------------------- audio ---------------------------------- */

  private initAudio() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctx();
      const ctx = this.audioCtx;
      this.engOsc = ctx.createOscillator();
      this.engOsc.type = "sawtooth";
      this.engOsc.frequency.value = 55;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 420;
      this.engGain = ctx.createGain();
      this.engGain.gain.value = 0;
      this.engOsc.connect(filt).connect(this.engGain).connect(ctx.destination);
      this.engOsc.start();
      // Wind: looped noise through bandpass.
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 0.6;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0;
      noise.connect(bp).connect(this.windGain).connect(ctx.destination);
      noise.start();
    } catch {
      this.audioCtx = null;
    }
  }

  private updateAudio(speed: number, throttle: number) {
    if (!this.audioCtx || !this.engOsc || !this.engGain || !this.windGain) return;
    if (this.audioCtx.state === "suspended") void this.audioCtx.resume();
    const t = this.audioCtx.currentTime;
    const target = this.muted ? 0 : 0.035 + throttle * 0.05 + Math.min(speed / 40, 1) * 0.03;
    this.engGain.gain.setTargetAtTime(target, t, 0.1);
    this.engOsc.frequency.setTargetAtTime(48 + speed * 3.2 + throttle * 26, t, 0.08);
    this.windGain.gain.setTargetAtTime(this.muted ? 0 : Math.min(speed / 45, 1) * 0.05, t, 0.2);
  }

  toggleMute() {
    this.muted = !this.muted;
  }

  /* ---------------------------------- input ---------------------------------- */

  private onKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    this.keys.add(e.code);
    if (e.code === "Escape") this.opts.onExit?.();
    if (e.code === "KeyR") this.reset();
    if (e.code === "KeyC") this.camMode = (this.camMode + 1) % 4;
    if (e.code === "KeyF") this.fanOn = !this.fanOn;
    if (e.code === "KeyM") this.toggleMute();
    if (e.code === "KeyL") this.setLamps(!this.lampsOn);
    if (e.code === "KeyB") this.doBoost();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private bindInput() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onResize);
  }

  private setLamps(on: boolean) {
    this.lampsOn = on;
    this.headSpots.forEach((s) => (s.visible = on));
    this.headlampMats.forEach((m) => m.color.set(on ? 0xd9ecff : 0x2a3542));
  }

  private reset() {
    this.pos.set(-105, CAR_CLEAR, 0);
    this.vel.set(0, 0, 0);
    this.yaw = 0;
    this.mode = "ground";
    this.phi = 0;
    this.u = 0;
  }

  private forward(): THREE.Vector3 {
    return tmpV1.set(Math.cos(this.yaw), 0, Math.sin(this.yaw)).clone();
  }

  private doBoost() {
    if (this.elapsed - this.lastBoost < 1.4) return;
    this.lastBoost = this.elapsed;
    const f = this.forward();
    if (this.mode === "ramp") {
      this.u += 17;
    } else {
      this.vel.addScaledVector(f, 17);
      if (this.mode === "air") this.vel.y += 2.5;
    }
    this.exhaust(46, 3.2, 9, true);
    this.flameLight.intensity = 260;
    this.flameLight.position.copy(this.pos).addScaledVector(f, -3);
    // FOV punch.
    this.camera.fov = 70;
    this.camera.updateProjectionMatrix();
  }

  /* --------------------------------- physics --------------------------------- */

  private readInput() {
    const k = this.keys;
    const t = this.touch;
    return {
      throttle:
        (k.has("KeyW") || k.has("ArrowUp") || t.gas ? 1 : 0) -
        (k.has("KeyS") || k.has("ArrowDown") || t.brake ? 1 : 0),
      steer:
        (k.has("KeyA") || k.has("ArrowLeft") || t.left ? 1 : 0) -
        (k.has("KeyD") || k.has("ArrowRight") || t.right ? 1 : 0),
      lift: k.has("KeyE") || t.lift,
      drop: k.has("Space"),
      boostTap: t.boost,
    };
  }

  private step() {
    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    this.elapsed += dt;
    const input = this.readInput();
    if (input.boostTap) {
      this.touch.boost = false;
      this.doBoost();
    }

    const speed = this.mode === "ramp" ? Math.abs(this.u) : Math.hypot(this.vel.x, this.vel.z);

    if (this.mode === "ground") this.stepGround(dt, input, speed);
    else if (this.mode === "ramp") this.stepRamp(dt, input);
    else this.stepAir(dt, input);

    // Thruster tip glow while lifting/boosting.
    const thrusterActive = input.lift || this.elapsed - this.lastBoost < 0.5;
    this.thrusterTips.forEach((m) => m.color.set(thrusterActive ? 0x9fd8ff : 0x1a2530));
    this.flameLight.intensity *= Math.max(1 - 6 * dt, 0);
    if (Math.abs(this.camera.fov - 62) > 0.2) {
      this.camera.fov += (62 - this.camera.fov) * Math.min(4 * dt, 1);
      this.camera.updateProjectionMatrix();
    }

    this.updateParticles(dt);
    this.updateCarTransform(dt, input);
    this.updateCamera(dt);
    this.updateAudio(speed, Math.max(0, input.throttle));

    // Wheel spin.
    const spin = speed * dt * 2.2;
    this.wheels.forEach((w) => (w.rotation.z -= spin));

    // HUD at ~15 Hz.
    if (++this.hudTick % 4 === 0) {
      const contactG =
        this.mode === "air"
          ? 0
          : 1 + (this.fanOn ? 2 : 0) + (this.mode === "ramp" ? (this.u * this.u) / (RAMP_R * G) : 0);
      this.opts.onHud?.({
        speedKmh: Math.round(speed * 3.6),
        fanOn: this.fanOn,
        contactG: Math.round(contactG * 100) / 100,
        zone: this.mode,
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  private stepGround(dt: number, input: ReturnType<RoadsterRamp["readInput"]>, speed: number) {
    const f = this.forward();
    // Throttle / brake.
    const accel = input.throttle >= 0 ? 15 : 22;
    this.vel.addScaledVector(f, input.throttle * accel * dt);
    // Drag + rolling resistance.
    this.vel.multiplyScalar(Math.max(1 - (0.35 + speed * 0.012) * dt, 0));
    const maxSp = 40;
    const sp = this.vel.length();
    if (sp > maxSp) this.vel.multiplyScalar(maxSp / sp);
    // Steering scales with speed.
    const steerAuthority = Math.min(sp / 8, 1) * (input.throttle < 0 ? -1 : 1);
    this.yaw += input.steer * 1.9 * steerAuthority * dt;

    this.pos.addScaledVector(this.vel, dt);
    this.pos.y = CAR_CLEAR;
    // Soft world bounds.
    this.pos.x = Math.max(-148, Math.min(this.pos.x, RAMP_X0 + RAMP_R + 40));
    if (Math.abs(this.pos.z) > 48) {
      this.pos.z = Math.sign(this.pos.z) * 48;
      this.vel.z *= 0.4;
    }

    // Enter the ramp.
    if (
      this.pos.x > RAMP_X0 - 1.5 &&
      Math.abs(this.pos.z) < RAMP_W / 2 &&
      this.vel.x > 1
    ) {
      this.mode = "ramp";
      this.phi = 0;
      this.u = Math.max(this.vel.dot(tmpV2.set(1, 0, 0)), 3);
      this.vel.set(0, 0, 0);
    }
  }

  private stepRamp(dt: number, input: ReturnType<RoadsterRamp["readInput"]>) {
    // Drive along the curve tangent t = (cosφ, sinφ).
    const driveForce = input.throttle >= 0 ? 13 : 18;
    this.u += input.throttle * driveForce * dt;
    this.u -= G * Math.sin(this.phi) * dt; // gravity along the slope
    this.u *= Math.max(1 - 0.12 * dt, 0); // rolling drag
    if (this.u < -6) this.u = -6;

    // Rolling back off the base?
    if (this.phi <= 0.001 && this.u < 0) {
      this.mode = "ground";
      this.pos.set(RAMP_X0 - 2, CAR_CLEAR, this.pos.z);
      this.vel.set(this.u, 0, 0);
      this.yaw = this.u >= 0 ? 0 : Math.PI;
      this.u = 0;
      return;
    }

    // Fan suction keeps it glued; too fast without enough downforce → flies off.
    const neededG = (this.u * this.u) / (RAMP_R * G);
    const availG = 1 * Math.cos(this.phi) + (this.fanOn ? 2 : 0);
    if (neededG > availG + 0.6 && this.u > 4) {
      // Launch!
      const t = tmpV1.set(Math.cos(this.phi), Math.sin(this.phi), 0);
      this.mode = "air";
      this.vel.copy(t).multiplyScalar(this.u);
      this.syncPosFromRamp();
      return;
    }

    this.phi += (this.u / RAMP_R) * dt;
    // Lateral drift on the ramp.
    this.pos.z += input.steer * 5 * dt * -1; // steer left/right across the ramp
    this.pos.z = Math.max(-RAMP_W / 2 + 1.2, Math.min(RAMP_W / 2 - 1.2, this.pos.z));

    if (this.phi >= RAMP_PHI_MAX) {
      // Off the lip — ballistic.
      const t = tmpV1.set(Math.cos(RAMP_PHI_MAX), Math.sin(RAMP_PHI_MAX), 0);
      this.mode = "air";
      this.vel.copy(t).multiplyScalar(Math.max(this.u, 6));
      this.syncPosFromRamp();
      // face travel direction
      this.yaw = Math.atan2(this.vel.z, this.vel.x);
      return;
    }
    this.syncPosFromRamp();
  }

  private syncPosFromRamp() {
    const { p } = this.rampPoint(Math.min(this.phi, RAMP_PHI_MAX) * RAMP_R);
    const n = tmpV3.set(-Math.sin(this.phi), Math.cos(this.phi), 0);
    this.pos.set(p.x, p.y, this.pos.z).addScaledVector(n, CAR_CLEAR);
  }

  private stepAir(dt: number, input: ReturnType<RoadsterRamp["readInput"]>) {
    // Cold-gas lift thrusters.
    if (input.lift) {
      this.vel.y += 30 * dt;
      if (this.vel.y > 16) this.vel.y = 16;
      this.exhaust(3, 1.6, 4, false);
    }
    // Space = drop: kill lift, slam down.
    if (input.drop) {
      this.vel.y = Math.min(this.vel.y, -9);
    }
    // Air steering: gentle yaw + slight forward thrust with throttle.
    const f = this.forward();
    this.yaw += input.steer * 1.1 * dt;
    if (input.throttle > 0) this.vel.addScaledVector(f, 4 * dt);

    this.vel.y -= G * dt;
    this.pos.addScaledVector(this.vel, dt);

    // Landing?
    if (this.pos.y <= CAR_CLEAR && this.vel.y <= 0) {
      const overRamp =
        this.pos.x > RAMP_X0 - 2 &&
        this.pos.x < RAMP_X0 + RAMP_R + 3 &&
        Math.abs(this.pos.z) < RAMP_W / 2;
      if (overRamp) {
        const phi = Math.asin(
          Math.max(0, Math.min(1, (this.pos.x - RAMP_X0) / RAMP_R))
        );
        if (phi < RAMP_PHI_MAX) {
          this.mode = "ramp";
          this.phi = phi;
          const t = tmpV2.set(Math.cos(phi), Math.sin(phi), 0);
          this.u = Math.max(this.vel.dot(t), 2);
          this.vel.set(0, 0, 0);
          this.syncPosFromRamp();
          this.exhaust(14, 2.5, 2, false); // touchdown puff
          return;
        }
      }
      this.mode = "ground";
      this.pos.y = CAR_CLEAR;
      // keep some forward roll
      const sp = Math.hypot(this.vel.x, this.vel.z);
      if (sp > 1) {
        this.yaw = Math.atan2(this.vel.z, this.vel.x);
        this.vel.y = 0;
      } else {
        this.vel.set(0, 0, 0);
      }
      this.exhaust(10, 2, 1.5, false);
    }
  }

  /* ------------------------------ presentation ------------------------------ */

  private updateCarTransform(dt: number, input: ReturnType<RoadsterRamp["readInput"]>) {
    this.car.position.copy(this.pos);
    if (this.mode === "ramp") {
      const t = tmpV1.set(Math.cos(this.phi), Math.sin(this.phi), 0);
      const n = tmpV2.set(-Math.sin(this.phi), Math.cos(this.phi), 0);
      const zAxis = tmpV3.crossVectors(t, n); // (0,0,1)
      tmpM.makeBasis(t, n, zAxis);
      this.car.quaternion.setFromRotationMatrix(tmpM);
    } else {
      // Lean into steering + pitch with acceleration; slight hover bob in air.
      const lean = -input.steer * 0.06;
      const pitch = this.mode === "air" ? Math.max(-0.35, Math.min(0.35, -this.vel.y * 0.02)) : 0;
      this.car.rotation.set(pitch, -this.yaw, lean, "YXZ");
      if (this.mode === "air") {
        this.car.position.y += Math.sin(this.elapsed * 7) * 0.06;
      }
    }
    // Blob shadow tracks x/z at ground level.
    this.blobShadow.position.set(this.pos.x, 0.03, this.pos.z);
    const h = Math.max(this.pos.y - CAR_CLEAR, 0);
    const s = Math.max(1 - h / 60, 0.25);
    this.blobShadow.scale.set(s, s, 1);
    (this.blobShadow.material as THREE.MeshBasicMaterial).opacity = 0.42 * s;
    void dt;
  }

  private updateCamera(dt: number) {
    const f = this.forward();
    const up =
      this.mode === "ramp"
        ? tmpV1.set(-Math.sin(this.phi), Math.cos(this.phi), 0).clone()
        : tmpV1.set(0, 1, 0).clone();
    let desired = tmpV2;
    let look = tmpV3;
    if (this.camMode === 0) {
      // Chase.
      desired.copy(this.pos).addScaledVector(f, -11).addScaledVector(up, 4.6);
      look.copy(this.pos).addScaledVector(f, 7).addScaledVector(up, 1);
    } else if (this.camMode === 1) {
      // Hood.
      desired.copy(this.pos).addScaledVector(f, 1.4).addScaledVector(up, 1.7);
      look.copy(this.pos).addScaledVector(f, 24);
    } else if (this.camMode === 2) {
      // Cinematic orbit around the ramp.
      const a = this.elapsed * 0.14;
      desired.set(RAMP_X0 + 24 + Math.cos(a) * 62, 26 + Math.sin(a * 0.7) * 8, Math.sin(a) * 62);
      look.copy(this.pos);
    } else {
      // Top.
      desired.copy(this.pos).addScaledVector(up, 72).addScaledVector(f, 0.5);
      look.copy(this.pos);
    }
    const k = this.camMode === 1 ? 1 : Math.min(5 * dt, 1);
    this.camPos.lerp(desired, k);
    this.camera.position.copy(this.camPos);
    this.camera.up.copy(up);
    this.camera.lookAt(look);
  }

  /* --------------------------------- teardown -------------------------------- */

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("resize", this.onResize);
    if (this.audioCtx) void this.audioCtx.close().catch(() => {});
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
