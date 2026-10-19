/* Roadster Run — free-roam mode.
   The roadster breaks out of its box and flies over the entire website.
   It follows your cursor across the whole page, smashes floating words
   harvested from the site's own headings, and rattles any heading it
   flies near. Esc (or the launcher) parks it and restores the page. */

import Matter from "matter-js";

const { Engine, World, Bodies, Body, Events, Composite } = Matter;

export interface RoadsterRunOptions {
  onScore?: (score: number, best: number) => void;
  onExit?: () => void;
}

interface WordBody extends Matter.Body {
  plugin: {
    text: string;
    fontSize: number;
    hp: number;
    maxHp: number;
    points: number;
    color: string;
    hitFlash: number;
    driftPhase: number;
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
}

const BEST_KEY = "roadster-run-best";

const FALLBACK_WORDS = [
  "Python", "TypeScript", "React", "Vertex AI", "GCP",
  "Go", "Java", "Docker", "Kubernetes", "GraphQL",
  "SQL", "Node.js", "Terraform", "FastAPI", "Agile",
];

/** Words pulled from the site's own headings — the roadster smashes the site's typography. */
function harvestWords(): string[] {
  try {
    const els = document.querySelectorAll("main h1, main h2, main h3");
    const words: string[] = [];
    els.forEach((el) => {
      (el.textContent || "")
        .split(/\s+/)
        .map((w) => w.replace(/[^\w+.#'-]/g, "").trim())
        .filter((w) => w.length >= 2 && w.length <= 14)
        .forEach((w) => {
          if (!words.includes(w)) words.push(w);
        });
    });
    if (words.length >= 6) return words.slice(0, 18);
  } catch {
    /* fall through */
  }
  return [...FALLBACK_WORDS];
}

export class RoadsterRun {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: Matter.Engine;
  private car!: Matter.Body;
  private raf = 0;
  private running = false;
  private words: string[];
  private wordIndex = 0;
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private score = 0;
  private best = 0;
  private opts: RoadsterRunOptions;
  private pointer = { x: -9999, y: -9999 };
  private keys = new Set<string>();
  private lastBoost = 0;
  private tick = 0;
  private isTouch: boolean;
  private dpr: number;
  private rattleEls: Element[] = [];
  private disposed = false;

  constructor(opts: RoadsterRunOptions = {}) {
    this.opts = opts;
    this.isTouch = window.matchMedia("(pointer: coarse)").matches;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.words = harvestWords();
    for (let i = this.words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
    }
    try {
      this.best = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
    } catch {
      this.best = 0;
    }

    // Full-viewport fixed overlay, created and owned by the game.
    this.canvas = document.createElement("canvas");
    this.canvas.id = "roadster-run-canvas";
    Object.assign(this.canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "40",
      pointerEvents: this.isTouch ? "none" : "auto",
      touchAction: "none",
      cursor: "none",
    });
    document.body.appendChild(this.canvas);
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.resize();

    this.engine = Engine.create({ gravity: { x: 0, y: 0 } });
    this.engine.positionIterations = 8;
    this.engine.velocityIterations = 6;

    this.buildWalls();
    this.spawnCar();
    for (let i = 0; i < 10; i++) this.spawnWord(true);

    this.bindInput();
    Events.on(this.engine, "collisionStart", (e) => this.onCollide(e));
    this.running = true;
    const loop = () => {
      if (!this.running || this.disposed) return;
      this.step();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /* ---------------------------------- setup --------------------------------- */

  private resize() {
    this.canvas.width = Math.floor(window.innerWidth * this.dpr);
    this.canvas.height = Math.floor(window.innerHeight * this.dpr);
  }

  private buildWalls() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const t = 200;
    const walls = [
      Bodies.rectangle(W / 2, -t / 2, W + t * 2, t, { isStatic: true }),
      Bodies.rectangle(W / 2, H + t / 2, W + t * 2, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H / 2, t, H + t * 2, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2, t, H + t * 2, { isStatic: true }),
    ];
    World.add(this.engine.world, walls);
  }

  private spawnCar() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    // Small rocket-car roadster, ~64px long.
    const car = Bodies.rectangle(W / 2, H / 2, 64, 30, {
      frictionAir: 0.045,
      restitution: 0.55,
      density: 0.004,
      label: "car",
    });
    this.car = car;
    World.add(this.engine.world, car);
  }

  private nextWord(): string {
    const w = this.words[this.wordIndex % this.words.length];
    this.wordIndex++;
    return w;
  }

  private spawnWord(anywhere = false) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const text = this.nextWord();
    const roll = Math.random();
    let fontSize: number, hp: number, points: number, color: string;
    if (roll < 0.5) {
      fontSize = 24 + Math.random() * 10; hp = 1; points = 10; color = "#5eead4";
    } else if (roll < 0.82) {
      fontSize = 46 + Math.random() * 14; hp = 2; points = 25; color = "#a5b4fc";
    } else {
      fontSize = 80 + Math.random() * 18; hp = 3; points = 50; color = "#fda4af";
    }
    const w = Math.max(60, text.length * fontSize * 0.62);
    const h = fontSize * 1.5;
    // Spawn from a viewport edge so words drift in over the page.
    let x: number, y: number;
    if (anywhere) {
      x = 60 + Math.random() * (W - 120);
      y = 90 + Math.random() * (H - 180);
    } else {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) { x = -w; y = Math.random() * H; }
      else if (side === 1) { x = W + w; y = Math.random() * H; }
      else if (side === 2) { x = Math.random() * W; y = -h; }
      else { x = Math.random() * W; y = H + h; }
    }
    const body = Bodies.rectangle(x, y, w, h, {
      frictionAir: 0.012,
      restitution: 0.7,
      density: 0.0006,
      label: "word",
    }) as WordBody;
    body.plugin = {
      text, fontSize, hp, maxHp: hp, points, color,
      hitFlash: 0, driftPhase: Math.random() * Math.PI * 2,
    };
    const ang = Math.random() * Math.PI * 2;
    const sp = 0.6 + Math.random() * 1.4;
    Body.setVelocity(body, { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
    World.add(this.engine.world, body);
  }

  /* ---------------------------------- input --------------------------------- */

  private onPointerMove = (e: PointerEvent) => {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  };

  private onPointerDown = (e: PointerEvent) => {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    // Desktop: the canvas captures clicks, so a click is a boost.
    if (!this.isTouch && e.target === this.canvas) this.boost();
  };

  private onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) {
      this.pointer.x = t.clientX;
      this.pointer.y = t.clientY;
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      this.opts.onExit?.();
      return;
    }
    this.keys.add(e.key.toLowerCase());
    if (e.key === " ") {
      e.preventDefault();
      this.boost();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onResize = () => {
    this.resize();
    const statics = Composite.allBodies(this.engine.world).filter((b) => b.isStatic);
    World.remove(this.engine.world, statics);
    this.buildWalls();
    const W = window.innerWidth;
    const H = window.innerHeight;
    Body.setPosition(this.car, {
      x: Math.min(Math.max(this.car.position.x, 40), W - 40),
      y: Math.min(Math.max(this.car.position.y, 40), H - 40),
    });
  };

  private bindInput() {
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("touchmove", this.onTouchMove, { passive: true });
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onResize);
  }

  private unbindInput() {
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("resize", this.onResize);
  }

  /** Rocket boost toward the pointer. Public so the touch BOOST button can call it. */
  boost() {
    const now = performance.now();
    if (now - this.lastBoost < 950) return;
    this.lastBoost = now;
    const dx = this.pointer.x - this.car.position.x;
    const dy = this.pointer.y - this.car.position.y;
    const len = Math.hypot(dx, dy) || 1;
    const power = 0.055 * this.car.mass;
    Body.applyForce(this.car, this.car.position, {
      x: (dx / len) * power,
      y: (dy / len) * power,
    });
    for (let i = 0; i < 22; i++) {
      const a = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.9;
      const sp = 2 + Math.random() * 5;
      this.particles.push({
        x: this.car.position.x - (dx / len) * 34,
        y: this.car.position.y - (dy / len) * 34,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        maxLife: 26 + Math.random() * 18,
        size: 2 + Math.random() * 3.5,
        color: Math.random() < 0.5 ? "#fdba74" : "#f0abfc",
      });
    }
  }

  /* --------------------------------- physics -------------------------------- */

  private onCollide(e: Matter.IEventCollision<Matter.Engine>) {
    for (const pair of e.pairs) {
      const word = [pair.bodyA, pair.bodyB].find(
        (b) => b.label === "word"
      ) as WordBody | undefined;
      const car = [pair.bodyA, pair.bodyB].find((b) => b.label === "car");
      if (!word || !car || !word.plugin) continue;
      const p = word.plugin;
      const impact =
        Math.hypot(car.velocity.x - word.velocity.x, car.velocity.y - word.velocity.y);
      if (impact < 1.6) continue; // gentle touches don't count
      p.hp -= 1;
      p.hitFlash = 8;
      Body.setVelocity(word, {
        x: word.velocity.x + car.velocity.x * 0.35,
        y: word.velocity.y + car.velocity.y * 0.35,
      });
      if (p.hp <= 0) {
        this.smashWord(word);
      } else {
        this.burst(word.position.x, word.position.y, p.color, 10);
      }
    }
  }

  private burst(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 4.5;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        maxLife: 24 + Math.random() * 26,
        size: 1.5 + Math.random() * 3,
        color,
      });
    }
  }

  private smashWord(word: WordBody) {
    const p = word.plugin!;
    this.burst(word.position.x, word.position.y, p.color, 34);
    this.burst(word.position.x, word.position.y, "#ffffff", 12);
    this.floaters.push({
      x: word.position.x,
      y: word.position.y - 10,
      text: `+${p.points}`,
      life: 0,
      maxLife: 55,
      color: p.color,
    });
    this.score += p.points;
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch {
        /* ignore */
      }
    }
    World.remove(this.engine.world, word);
    this.opts.onScore?.(this.score, this.best);
    window.setTimeout(() => {
      if (!this.disposed) this.spawnWord(false);
    }, 900 + Math.random() * 1200);
  }

  /** Headings near the car rattle — the site itself reacts to the roadster. */
  private rattleNearby() {
    try {
      const els = document.querySelectorAll("main h1, main h2, main h3");
      const cx = this.car.position.x;
      const cy = this.car.position.y;
      const next = new Set<Element>();
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        const ex = r.left + r.width / 2;
        const ey = r.top + r.height / 2;
        if (Math.hypot(ex - cx, ey - cy) < 170) {
          next.add(el);
          if (!el.classList.contains("roadster-rattle")) {
            el.classList.add("roadster-rattle");
          }
        }
      });
      this.rattleEls.forEach((el) => {
        if (!next.has(el)) el.classList.remove("roadster-rattle");
      });
      this.rattleEls = [...next];
    } catch {
      /* ignore */
    }
  }

  private step() {
    this.tick++;

    // Steer: seek the pointer; WASD/arrows add thrust.
    const steer = { x: 0, y: 0 };
    if (this.pointer.x > -999) {
      steer.x += (this.pointer.x - this.car.position.x) * 0.0011;
      steer.y += (this.pointer.y - this.car.position.y) * 0.0011;
    }
    if (this.keys.has("arrowup") || this.keys.has("w")) steer.y -= 0.0035;
    if (this.keys.has("arrowdown") || this.keys.has("s")) steer.y += 0.0035;
    if (this.keys.has("arrowleft") || this.keys.has("a")) steer.x -= 0.0035;
    if (this.keys.has("arrowright") || this.keys.has("d")) steer.x += 0.0035;
    const m = this.car.mass;
    Body.applyForce(this.car, this.car.position, { x: steer.x * m, y: steer.y * m });

    const v = this.car.velocity;
    const sp = Math.hypot(v.x, v.y);
    const max = 14;
    if (sp > max) Body.setVelocity(this.car, { x: (v.x / sp) * max, y: (v.y / sp) * max });

    if (sp > 0.6) {
      const target = Math.atan2(v.y, v.x);
      let d = target - this.car.angle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      Body.setAngle(this.car, this.car.angle + d * 0.22);
    }

    for (const b of Composite.allBodies(this.engine.world)) {
      const wb = b as WordBody;
      if (wb.label === "word" && wb.plugin) {
        const ph = wb.plugin.driftPhase + this.tick * 0.012;
        Body.applyForce(wb, wb.position, {
          x: Math.cos(ph) * 0.000012 * wb.mass,
          y: Math.sin(ph * 1.3) * 0.000012 * wb.mass,
        });
        if (wb.plugin.hitFlash > 0) wb.plugin.hitFlash--;
      }
    }

    if (this.tick % 12 === 0) this.rattleNearby();

    Engine.update(this.engine, 1000 / 60);
    this.render();
  }

  /* --------------------------------- rendering ------------------------------- */

  private render() {
    const { ctx } = this;
    const W = window.innerWidth;
    const H = window.innerHeight;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    for (const b of Composite.allBodies(this.engine.world)) {
      const wb = b as WordBody;
      if (wb.label !== "word" || !wb.plugin) continue;
      const p = wb.plugin;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.font = `700 ${p.fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(p.text).width;
      const pw = tw + 28;
      const ph = p.fontSize * 1.35;
      // Soft dark plate so the word reads over page content.
      ctx.fillStyle = "rgba(10, 12, 20, 0.55)";
      ctx.strokeStyle = p.color + "55";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      (ctx as unknown as { roundRect(x: number, y: number, w: number, h: number, r: number): void })
        .roundRect(-pw / 2, -ph / 2, pw, ph, 14);
      ctx.fill();
      ctx.stroke();
      if (p.maxHp > 1) {
        for (let i = 0; i < p.maxHp; i++) {
          ctx.beginPath();
          ctx.arc(-pw / 2 + 16 + i * 14, -ph / 2 + 12, 4, 0, Math.PI * 2);
          ctx.fillStyle = i < p.hp ? p.color : "rgba(255,255,255,0.18)";
          ctx.fill();
        }
      }
      const missing = p.maxHp - p.hp;
      if (missing > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 1.6;
        for (let i = 0; i < missing; i++) {
          const ox = -tw / 2 + ((i + 0.7) / (missing + 0.4)) * tw;
          ctx.beginPath();
          ctx.moveTo(ox, -p.fontSize * 0.42);
          ctx.lineTo(ox + 7, -p.fontSize * 0.1);
          ctx.lineTo(ox - 5, p.fontSize * 0.18);
          ctx.lineTo(ox + 6, p.fontSize * 0.42);
          ctx.stroke();
        }
      }
      ctx.fillStyle = p.hitFlash > 0 ? "#ffffff" : p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.hitFlash > 0 ? 22 : 10;
      ctx.fillText(p.text, 0, 2);
      ctx.restore();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life++;
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.97;
      pt.vy *= 0.97;
      const t = 1 - pt.life / pt.maxLife;
      if (t <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = t;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * t + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life++;
      const t = 1 - f.life / f.maxLife;
      if (t <= 0) {
        this.floaters.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = t;
      ctx.font = "700 20px -apple-system, sans-serif";
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - f.life * 0.7);
    }
    ctx.globalAlpha = 1;

    this.drawCar();
  }

  private drawCar() {
    const { ctx } = this;
    const p = this.car.position;
    const a = this.car.angle;
    const bob = Math.sin(this.tick * 0.09) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(a);

    // Shadow below for a flying feel.
    ctx.save();
    ctx.rotate(-a);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 44, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    const L = 64;
    const Wid = 30;

    const boosting = performance.now() - this.lastBoost < 350;
    if (boosting) {
      const flick = 26 + Math.random() * 16;
      const grad = ctx.createLinearGradient(-L / 2, 0, -L / 2 - flick, 0);
      grad.addColorStop(0, "rgba(255, 240, 200, 0.95)");
      grad.addColorStop(0.4, "rgba(251, 146, 60, 0.8)");
      grad.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-L / 2 + 4, -7);
      ctx.lineTo(-L / 2 - flick, 0);
      ctx.lineTo(-L / 2 + 4, 7);
      ctx.closePath();
      ctx.fill();
    }

    // Glossy red roadster body.
    const bodyGrad = ctx.createLinearGradient(0, -Wid / 2, 0, Wid / 2);
    bodyGrad.addColorStop(0, "#f87171");
    bodyGrad.addColorStop(0.5, "#dc2626");
    bodyGrad.addColorStop(1, "#991b1b");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(L / 2, 0);
    ctx.quadraticCurveTo(L / 4, -Wid / 2 - 2, -L / 6, -Wid / 2);
    ctx.lineTo(-L / 2 + 6, -Wid / 2 + 4);
    ctx.lineTo(-L / 2 + 6, Wid / 2 - 4);
    ctx.lineTo(-L / 6, Wid / 2);
    ctx.quadraticCurveTo(L / 4, Wid / 2 + 2, L / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Glass canopy.
    ctx.fillStyle = "rgba(186, 230, 253, 0.9)";
    ctx.beginPath();
    ctx.ellipse(6, 0, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rocket fins.
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.moveTo(-L / 2 + 10, -Wid / 2 + 2);
    ctx.lineTo(-L / 2 - 6, -Wid / 2 - 10);
    ctx.lineTo(-L / 2 + 2, -Wid / 2 + 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-L / 2 + 10, Wid / 2 - 2);
    ctx.lineTo(-L / 2 - 6, Wid / 2 + 10);
    ctx.lineTo(-L / 2 + 2, Wid / 2 - 8);
    ctx.closePath();
    ctx.fill();

    // Headlight glow.
    ctx.fillStyle = "rgba(254, 240, 138, 0.95)";
    ctx.beginPath();
    ctx.arc(L / 2 - 4, 0, 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* ---------------------------------- teardown ------------------------------- */

  destroy() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.unbindInput();
    this.rattleEls.forEach((el) => el.classList.remove("roadster-rattle"));
    this.rattleEls = [];
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    Matter.Engine.clear(this.engine);
  }

  getScore() {
    return { score: this.score, best: this.best };
  }
}
