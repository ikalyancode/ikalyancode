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
  /** Fired once, after the first frame renders — the scene is visibly up. */
  onFirstFrame?: () => void;
  /** 'ramp' starts the car just before the ramp at speed (playtesting). */
  demoStart?: 'ramp';
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

interface InputState {
  throttle: number;
  steer: number;
  lift: boolean;
  drop: boolean;
  boostTap: boolean;
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
  /** When true, an autopilot drives the car (playtesting / demo). Set via constructor opts. */
  demoMode = false;

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
  private firstFrameFired = false;

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
  private camPos = new THREE.Vector3(-46, 26, 92);
  private lastBoost = -10;
  private elapsed = 0;
  private muted = false;
  private smoothLatA = 0;
  private smoothLongA = 0;
  private prevFwd = 0;
  private landingDip = 0;

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

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // Guard: if the container hasn't been laid out yet, fall back to the viewport.
    const cw = container.clientWidth || window.innerWidth;
    const ch = container.clientHeight || window.innerHeight;
    this.renderer.setSize(cw, ch);
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
      cw / ch,
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

    if (opts.demoStart === 'ramp') {
      this.pos.set(RAMP_X0 - 30, CAR_CLEAR, 0);
      this.vel.set(30, 0, 0);
      this.yaw = 0;
      this.demoMode = true;
    }

    // Post-mount resize kick: if layout settled after construction, re-fit.
    requestAnimationFrame(() => {
      if (!this.disposed) this.onResize();
    });

    // The loop never dies on a frame error — it logs and continues.
    const loop = () => {
      if (this.disposed) return;
      try {
        this.step();
      } catch (err) {
        console.error("[roadster-ramp] frame error:", err);
      }
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
    // Gen-2 Tesla Roadster: very low, wide, cab-rearward fastback. Faces +x.
    const paint = new THREE.MeshPhysicalMaterial({
      color: 0xf2f4f6,
      roughness: 0.2,
      metalness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x0b1018,
      roughness: 0.05,
      metalness: 0.9,
    });
    const darkTrim = new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.5 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.28, metalness: 0.95 });

    // Body: sculpted side profile, 4.75 long, 2.0 wide, roofline under 1.0.
    const s = new THREE.Shape();
    s.moveTo(-2.375, 0.3);
    s.lineTo(2.2, 0.3);
    s.quadraticCurveTo(2.42, 0.34, 2.4, 0.46); // low nose tip
    s.quadraticCurveTo(2.1, 0.56, 1.55, 0.6); // nose top / hood leading
    s.quadraticCurveTo(0.9, 0.64, 0.45, 0.74); // long low hood
    s.quadraticCurveTo(0.05, 0.86, -0.35, 0.94); // windshield
    s.quadraticCurveTo(-0.85, 1.0, -1.25, 0.94); // roof peak
    s.quadraticCurveTo(-1.8, 0.86, -2.25, 0.72); // fastback slope
    s.quadraticCurveTo(-2.42, 0.62, -2.375, 0.48); // kamm tail
    s.lineTo(-2.375, 0.3);
    const bodyGeo = new THREE.ExtrudeGeometry(s, {
      depth: 1.84,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.07,
      bevelSegments: 3,
      steps: 1,
    });
    bodyGeo.translate(0, 0, -0.92);
    this.car.add(new THREE.Mesh(bodyGeo, paint));

    // Glasshouse: big wraparound canopy, cab-rearward.
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), glass);
    canopy.scale.set(1.28, 0.46, 0.8);
    canopy.position.set(-0.42, 0.82, 0);
    this.car.add(canopy);

    // Wheels: dark tire + silver rim + red caliper.
    const tireGeo = new THREE.CylinderGeometry(0.47, 0.47, 0.34, 24);
    tireGeo.rotateX(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.36, 16);
    rimGeo.rotateX(Math.PI / 2);
    const spokeGeo = new THREE.BoxGeometry(0.38, 0.09, 0.5);
    const caliperGeo = new THREE.BoxGeometry(0.16, 0.2, 0.12);
    const caliperMat = new THREE.MeshBasicMaterial({ color: 0xc01818 });
    for (const [wx, wz] of [
      [1.5, 1.0],
      [1.5, -1.0],
      [-1.5, 1.0],
      [-1.5, -1.0],
    ]) {
      const wheel = new THREE.Mesh(tireGeo, darkTrim);
      wheel.position.set(wx, 0.47, wz);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.copy(wheel.position);
      this.car.add(wheel, rim);
      for (let i = 0; i < 5; i++) {
        const spoke = new THREE.Mesh(spokeGeo, rimMat);
        spoke.position.copy(wheel.position);
        spoke.rotation.z = (i / 5) * Math.PI * 2;
        spoke.scale.set(0.32, 1, 1);
        this.car.add(spoke);
      }
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(wx - 0.18, 0.52, wz + (wz > 0 ? -0.12 : 0.12));
      this.car.add(caliper);
      this.wheels.push(wheel);
    }

    // Full-width rear light bar.
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.11, 1.78),
      new THREE.MeshBasicMaterial({ color: 0xff1e1e })
    );
    tail.position.set(-2.4, 0.66, 0);
    this.car.add(tail);

    // Slim angular LED headlights sweeping back from the nose.
    for (const hz of [-0.68, 0.68]) {
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xd9ecff });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.3), lampMat);
      lamp.position.set(2.18, 0.56, hz);
      lamp.rotation.y = hz > 0 ? -0.5 : 0.5;
      lamp.rotation.z = 0.08;
      this.car.add(lamp);
      this.headlampMats.push(lampMat);
      const spot = new THREE.SpotLight(0xcfe4ff, 350, 55, 0.55, 0.45, 1.6);
      spot.position.set(2.3, 0.7, hz);
      spot.target.position.set(14, -0.5, hz * 2);
      this.car.add(spot, spot.target);
      this.headSpots.push(spot);
    }

    // Front splitter + side skirts (dark aero).
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 1.9), darkTrim);
    splitter.position.set(2.15, 0.26, 0);
    this.car.add(splitter);
    for (const sz of [-0.98, 0.98]) {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.09, 0.12), darkTrim);
      skirt.position.set(-0.1, 0.27, sz);
      this.car.add(skirt);
    }
    // Rear diffuser with vertical fins.
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 1.8), darkTrim);
    diffuser.position.set(-2.25, 0.3, 0);
    this.car.add(diffuser);
    for (const fz of [-0.6, -0.2, 0.2, 0.6]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.05), darkTrim);
      fin.position.set(-2.25, 0.3, fz);
      this.car.add(fin);
    }
    // Side mirrors.
    for (const mz of [-1.06, 1.06]) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.14), paint);
      mirror.position.set(0.35, 0.86, mz);
      this.car.add(mirror);
    }

    // Corner thruster pods with glowing tips.
    const podGeo = new THREE.CylinderGeometry(0.13, 0.17, 0.5, 10);
    podGeo.rotateZ(Math.PI / 2);
    for (const [px, pz] of [
      [1.75, 1.04],
      [1.75, -1.04],
      [-1.75, 1.04],
      [-1.75, -1.04],
    ]) {
      const pod = new THREE.Mesh(podGeo, darkTrim);
      pod.position.set(px, 0.4, pz);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x1a2530 });
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), tipMat);
      tip.position.set(px - 0.28, 0.4, pz);
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

  /** Exhaust burst behind the car. Boost = tire smoke (gray-white), lift = cold-gas plume. */
  private exhaust(n: number, spread: number, power: number, smoke: boolean) {
    const f = this.forward();
    for (let i = 0; i < n; i++) {
      const bx = this.pos.x - f.x * 2.4 + (Math.random() - 0.5) * 0.8;
      const by = this.pos.y + 0.3 + (Math.random() - 0.5) * 0.5;
      const bz = this.pos.z - f.z * 2.4 + (Math.random() - 0.5) * 1.6;
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * spread;
      if (smoke) {
        // Tire smoke: soft gray-white puffs that billow up and linger.
        const g = 0.55 + Math.random() * 0.3;
        this.spawnParticle(bx, by, bz,
          -f.x * power * 0.6 + Math.cos(a) * sp, 1.2 + Math.random() * 2.2, -f.z * power * 0.6 + Math.sin(a) * sp,
          1.1 + Math.random() * 0.9, g, g, g * 1.02);
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
    if (e.code === "KeyC") this.camMode = (this.camMode + 1) % 3;
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
    // Smoke burst, not fire — tires + cold gas.
    this.exhaust(52, 3.4, 9, true);
    this.flameLight.color.set(0xcfd8e6);
    this.flameLight.intensity = 160;
    this.flameLight.position.copy(this.pos).addScaledVector(f, -3);
    // FOV punch.
    this.camera.fov = 70;
    this.camera.updateProjectionMatrix();
  }

  /* --------------------------------- physics --------------------------------- */

  private readInput(): InputState {
    const k = this.keys;
    const t = this.touch;
    const base = {
      throttle:
        (k.has("KeyW") || k.has("ArrowUp") || t.gas ? 1 : 0) -
        (k.has("KeyS") || k.has("ArrowDown") || t.brake ? 1 : 0),
      // Screen-correct: pressing right (D) yaws the nose toward screen-right.
      steer:
        (k.has("KeyD") || k.has("ArrowRight") || t.right ? 1 : 0) -
        (k.has("KeyA") || k.has("ArrowLeft") || t.left ? 1 : 0),
      lift: k.has("KeyE") || t.lift,
      drop: k.has("Space"),
      boostTap: t.boost,
    };
    if (this.demoMode) return this.demoInput(base);
    return base;
  }

  /** Autopilot: pin the throttle and steer for the ramp mouth. */
  private demoInput(base: InputState): InputState {
    if (this.mode === "ground") {
      const tx = RAMP_X0 - 8;
      const tz = 0;
      const want = Math.atan2(tz - this.pos.z, tx - this.pos.x);
      let d = want - this.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      base.throttle = 1;
      base.steer = Math.max(-1, Math.min(1, d * 2.5));
      // Punch boost once lined up and rolling.
      const sp = Math.hypot(this.vel.x, this.vel.z);
      if (Math.abs(d) < 0.12 && sp > 14 && this.pos.x < RAMP_X0 - 30) this.doBoost();
    } else if (this.mode === "ramp") {
      base.throttle = 1;
      base.steer = 0;
    } else {
      base.throttle = 0;
      base.steer = 0;
    }
    return base;
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

    if (!this.firstFrameFired) {
      this.firstFrameFired = true;
      this.opts.onFirstFrame?.();
    }
  }

  private stepGround(dt: number, input: InputState, speed: number) {
    const f = this.forward();
    // Split velocity into forward + lateral so tires can grip sideways.
    const fwdSpeed = this.vel.dot(f);
    tmpV2.copy(f).multiplyScalar(fwdSpeed);
    const latVel = tmpV3.copy(this.vel).sub(tmpV2);

    // Throttle / brake / reverse along the heading.
    let newFwd = fwdSpeed;
    if (input.throttle > 0) newFwd += 16 * dt * (1 - Math.max(newFwd, 0) / 46);
    else if (input.throttle < 0) {
      if (newFwd > 0.5) newFwd -= 30 * dt; // brake
      else newFwd = Math.max(newFwd - 10 * dt, -13); // reverse, capped
    }
    // Rolling drag + aero (quadratic-ish).
    newFwd *= Math.max(1 - (0.22 + Math.abs(newFwd) * 0.016) * dt, 0);

    // Lateral tire grip: bleed off sideways slide hard (a touch of drift at speed).
    const grip = Math.min(9, 4 + speed * 0.12);
    latVel.multiplyScalar(Math.max(1 - grip * dt, 0));

    this.vel.copy(f).multiplyScalar(newFwd).add(latVel);

    // Steering: needs rolling speed, fades at very high speed, reverses in reverse.
    const dirSign = newFwd >= 0 ? 1 : -1;
    const steerAuthority = Math.min(Math.abs(newFwd) / 7, 1) / (1 + Math.abs(newFwd) * 0.028);
    this.yaw += input.steer * 2.3 * steerAuthority * dirSign * dt;
    // Smoothed lateral/longitudinal accel drives body roll + pitch.
    const latA = latVel.length() * Math.sign(input.steer || 1);
    this.smoothLatA += (latA - this.smoothLatA) * Math.min(6 * dt, 1);
    const longA = (newFwd - this.prevFwd) / Math.max(dt, 1e-4);
    this.prevFwd = newFwd;
    this.smoothLongA += (longA - this.smoothLongA) * Math.min(6 * dt, 1);

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

  private stepRamp(dt: number, input: InputState) {
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
    // Lateral drift on the ramp (D = screen-right).
    this.pos.z += input.steer * 5 * dt;
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

  private stepAir(dt: number, input: InputState) {
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
          this.landingDip = Math.min(1, Math.abs(this.vel.y) / 14);
          this.vel.set(0, 0, 0);
          this.syncPosFromRamp();
          this.exhaust(14, 2.5, 2, false); // touchdown puff
          return;
        }
      }
      this.mode = "ground";
      this.pos.y = CAR_CLEAR;
      this.landingDip = Math.min(1, Math.abs(this.vel.y) / 14);
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

  private updateCarTransform(dt: number, input: InputState) {
    this.car.position.copy(this.pos);
    if (this.mode === "ramp") {
      const t = tmpV1.set(Math.cos(this.phi), Math.sin(this.phi), 0);
      const n = tmpV2.set(-Math.sin(this.phi), Math.cos(this.phi), 0);
      const zAxis = tmpV3.crossVectors(t, n); // (0,0,1)
      tmpM.makeBasis(t, n, zAxis);
      this.car.quaternion.setFromRotationMatrix(tmpM);
    } else {
      // Body roll from lateral accel, pitch from longitudinal accel + flight.
      const roll = Math.max(-0.09, Math.min(0.09, -this.smoothLatA * 0.004));
      const pitch =
        this.mode === "air"
          ? Math.max(-0.35, Math.min(0.35, -this.vel.y * 0.02))
          : Math.max(-0.05, Math.min(0.05, -this.smoothLongA * 0.002));
      this.car.rotation.set(pitch, -this.yaw, roll, "YXZ");
      if (this.mode === "air") {
        this.car.position.y += Math.sin(this.elapsed * 7) * 0.06;
      }
      void input;
    }
    // Suspension dip on landing (decays fast).
    this.landingDip *= Math.max(1 - 4.5 * dt, 0);
    this.car.position.y -= this.landingDip * 0.4;
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
    const up = tmpV1.set(0, 1, 0).clone();
    let desired = tmpV2;
    let look = tmpV3;
    if (this.camMode === 0) {
      // Fixed wide cinematic — the reference look: runway sweeping in from
      // the left, J-ramp towering center-right, truss behind.
      desired.set(-46, 26, 92);
      look.set(-12, 13, 0);
    } else if (this.camMode === 1) {
      // Far chase.
      desired.copy(this.pos).addScaledVector(f, -16).addScaledVector(up, 7);
      look.copy(this.pos).addScaledVector(f, 8).addScaledVector(up, 1.5);
    } else {
      // Top.
      desired.copy(this.pos).addScaledVector(up, 78).addScaledVector(f, 1);
      look.copy(this.pos);
    }
    // Fixed cam snaps; others ease.
    const k = this.camMode === 0 ? 1 : Math.min(5 * dt, 1);
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
