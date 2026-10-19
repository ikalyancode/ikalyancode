import Matter from 'matter-js';

/**
 * Roadster Run — a tiny 2D physics game.
 * A flying roadster smashes drifting words. Small words pop in one hit,
 * big words take a beating. Built on Matter.js, rendered on canvas.
 */

export interface RoadsterRunOptions {
  onScore?: (score: number, best: number) => void;
}

interface LetterMeta {
  word: string;
  hp: number;
  maxHp: number;
  size: number;
  color: string;
  points: number;
  halfW: number;
  halfH: number;
  lastHit: number;
  flash: number;
  seed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
}

interface TrailDot {
  x: number;
  y: number;
  angle: number;
  life: number;
}

const WORDS = [
  'Python', 'TypeScript', 'React', 'Vertex AI', 'GCP', 'Go',
  'Java', 'Docker', 'Kubernetes', 'GraphQL', 'SQL', 'Node.js',
  'Terraform', 'FastAPI', 'Agile', 'API',
];

// Tier by font size: small = 1 hit, medium = 2, big = 3.
const TIERS = [
  { min: 24, max: 34, hp: 1, color: '#5eead4', points: 10 },
  { min: 46, max: 60, hp: 2, color: '#a5b4fc', points: 25 },
  { min: 82, max: 100, hp: 3, color: '#fda4af', points: 50 },
];

const TARGET_LETTERS = 7;
const BEST_KEY = 'roadster-run-best';

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export class RoadsterRun {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onScore?: (score: number, best: number) => void;

  private engine: Matter.Engine;
  private car!: Matter.Body;
  private walls: Matter.Body[] = [];
  private letters = new Map<number, LetterMeta>();
  private particles: Particle[] = [];
  private floatTexts: FloatText[] = [];
  private trail: TrailDot[] = [];

  private raf = 0;
  private running = false;
  private W = 0;
  private H = 0;
  private dpr = 1;

  private pointer = { x: 0, y: 0, active: false, down: false };
  private keys = new Set<string>();
  private boostCooldownUntil = 0;
  private boostingUntil = 0;
  private shake = 0;
  private score = 0;
  private best = 0;
  private respawnAt: number[] = [];
  private measureCtx: CanvasRenderingContext2D;
  private time = 0;

  private onCollision = (e: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of e.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      const carBody = a.label === 'car' ? a : b.label === 'car' ? b : null;
      const letterBody = a.label === 'letter' ? a : b.label === 'letter' ? b : null;
      if (carBody && letterBody) this.hitLetter(letterBody, carBody);
    }
  };

  private gameInView() {
    const r = this.canvas.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  private onResize = () => this.resize();
  private onVisibility = () => {
    this.running = !document.hidden;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.gameInView()) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    this.keys.add(e.key.toLowerCase());
    if (e.key === ' ') this.tryBoost();
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onPointerMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = e.clientX - r.left;
    this.pointer.y = e.clientY - r.top;
    this.pointer.active = true;
  };
  private onPointerDown = (e: PointerEvent) => {
    this.onPointerMove(e);
    this.pointer.down = true;
    this.tryBoost();
  };
  private onPointerUp = () => {
    this.pointer.down = false;
  };

  constructor(canvas: HTMLCanvasElement, opts: RoadsterRunOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    this.onScore = opts.onScore;
    this.best = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;

    const mc = document.createElement('canvas').getContext('2d');
    if (!mc) throw new Error('no measure context');
    this.measureCtx = mc;

    this.engine = Matter.Engine.create();
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;

    this.resize();
    this.buildCar();
    this.buildWalls();
    for (let i = 0; i < TARGET_LETTERS; i++) this.spawnLetter(true);

    Matter.Events.on(this.engine, 'collisionStart', this.onCollision);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', () => {
      this.pointer.active = false;
    });

    // Start the car in the middle; pointer starts there too.
    this.pointer.x = this.W / 2;
    this.pointer.y = this.H / 2;

    this.running = !document.hidden;
    this.loop();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    Matter.Events.off(this.engine, 'collisionStart', this.onCollision);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    Matter.Engine.clear(this.engine);
  }

  // ---------- setup ----------

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.W = Math.max(280, rect.width);
    this.H = Math.max(300, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.buildWalls();
  }

  private buildCar() {
    this.car = Matter.Bodies.rectangle(this.W / 2, this.H / 2, 96, 44, {
      label: 'car',
      frictionAir: 0.07,
      restitution: 0.35,
      density: 0.004,
      chamfer: { radius: 18 },
    });
    Matter.World.add(this.engine.world, this.car);
  }

  private buildWalls() {
    for (const w of this.walls) Matter.World.remove(this.engine.world, w);
    this.walls = [];
    const t = 140;
    const opts: Matter.IChamferableBodyDefinition = { isStatic: true, restitution: 1, label: 'wall' };
    this.walls = [
      Matter.Bodies.rectangle(this.W / 2, -t / 2, this.W + t * 2, t, opts),
      Matter.Bodies.rectangle(this.W / 2, this.H + t / 2, this.W + t * 2, t, opts),
      Matter.Bodies.rectangle(-t / 2, this.H / 2, t, this.H + t * 2, opts),
      Matter.Bodies.rectangle(this.W + t / 2, this.H / 2, t, this.H + t * 2, opts),
    ];
    Matter.World.add(this.engine.world, this.walls);
  }

  private fontFor(size: number) {
    return `800 ${size}px -apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, "Helvetica Neue", sans-serif`;
  }

  private spawnLetter(anywhere = false) {
    const word = pick(WORDS);
    const tier = pick(TIERS);
    let size = rand(tier.min, tier.max);
    this.measureCtx.font = this.fontFor(size);
    let tw = this.measureCtx.measureText(word).width;
    const maxW = Math.min(520, this.W * 0.66);
    if (tw > maxW) {
      size = Math.max(18, size * (maxW / tw));
      this.measureCtx.font = this.fontFor(size);
      tw = this.measureCtx.measureText(word).width;
    }
    const padX = 26;
    const padY = 18;
    const w = tw + padX * 2;
    const h = size + padY * 2;

    let x: number;
    let y: number;
    let vx: number;
    let vy: number;
    if (anywhere) {
      x = rand(w, this.W - w);
      y = rand(h, this.H - h);
      const a = rand(0, Math.PI * 2);
      const sp = rand(1.2, 2.8);
      vx = Math.cos(a) * sp;
      vy = Math.sin(a) * sp;
    } else {
      const edge = Math.floor(rand(0, 4));
      const sp = rand(1.6, 3.2);
      const inward = rand(-0.6, 0.6);
      if (edge === 0) { x = rand(w, this.W - w); y = -h; vx = inward * sp; vy = sp; }
      else if (edge === 1) { x = rand(w, this.W - w); y = this.H + h; vx = inward * sp; vy = -sp; }
      else if (edge === 2) { x = -w; y = rand(h, this.H - h); vx = sp; vy = inward * sp; }
      else { x = this.W + w; y = rand(h, this.H - h); vx = -sp; vy = inward * sp; }
    }

    const body = Matter.Bodies.rectangle(x, y, w, h, {
      label: 'letter',
      frictionAir: 0.008,
      restitution: 0.92,
      density: 0.0006,
      chamfer: { radius: 16 },
    });
    Matter.Body.setVelocity(body, { x: vx, y: vy });
    Matter.Body.setAngularVelocity(body, rand(-0.02, 0.02));
    this.letters.set(body.id, {
      word, hp: tier.hp, maxHp: tier.hp, size,
      color: tier.color, points: tier.points,
      halfW: w / 2, halfH: h / 2,
      lastHit: 0, flash: 0, seed: Math.random() * 100,
    });
    Matter.World.add(this.engine.world, body);
  }

  // ---------- gameplay ----------

  private tryBoost() {
    const now = performance.now();
    if (now < this.boostCooldownUntil) return;
    this.boostCooldownUntil = now + 950;
    this.boostingUntil = now + 200;
    const a = this.car.angle;
    const boost = { x: Math.cos(a) * 13, y: Math.sin(a) * 13 };
    Matter.Body.setVelocity(this.car, {
      x: this.car.velocity.x + boost.x,
      y: this.car.velocity.y + boost.y,
    });
    this.shake = Math.max(this.shake, 3);
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.car.position.x - Math.cos(a) * 52,
        y: this.car.position.y - Math.sin(a) * 52,
        vx: rand(-3, 3) - Math.cos(a) * 5,
        vy: rand(-3, 3) - Math.sin(a) * 5,
        life: 22, maxLife: 22,
        color: pick(['#ffd166', '#ff9f1c', '#ffffff']),
        size: rand(2, 5),
      });
    }
  }

  private hitLetter(letterBody: Matter.Body, carBody: Matter.Body) {
    const meta = this.letters.get(letterBody.id);
    if (!meta) return;
    const now = performance.now();
    if (now - meta.lastHit < 160) return;
    meta.lastHit = now;
    meta.hp -= 1;
    meta.flash = 1;

    // Knockback away from the car, scaled by car speed.
    const dx = letterBody.position.x - carBody.position.x;
    const dy = letterBody.position.y - carBody.position.y;
    const d = Math.hypot(dx, dy) || 1;
    const carSpeed = Math.hypot(carBody.velocity.x, carBody.velocity.y);
    const push = 5 + carSpeed * 0.55;
    Matter.Body.setVelocity(letterBody, {
      x: (dx / d) * push + rand(-1, 1),
      y: (dy / d) * push + rand(-1, 1),
    });
    Matter.Body.setAngularVelocity(letterBody, letterBody.angularVelocity + rand(-0.08, 0.08));
    // The car loses a little steam on impact.
    Matter.Body.setVelocity(carBody, {
      x: carBody.velocity.x * 0.9,
      y: carBody.velocity.y * 0.9,
    });

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: letterBody.position.x + rand(-meta.halfW, meta.halfW) * 0.6,
        y: letterBody.position.y + rand(-meta.halfH, meta.halfH) * 0.6,
        vx: rand(-4, 4), vy: rand(-4, 4),
        life: 20, maxLife: 20, color: meta.color, size: rand(2, 4),
      });
    }

    if (meta.hp <= 0) {
      this.destroyLetter(letterBody, meta);
    }
  }

  private destroyLetter(body: Matter.Body, meta: LetterMeta) {
    Matter.World.remove(this.engine.world, body);
    this.letters.delete(body.id);
    this.score += meta.points;
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem(BEST_KEY, String(this.best));
    }
    this.onScore?.(this.score, this.best);

    for (let i = 0; i < 30; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(1.5, 7);
      this.particles.push({
        x: body.position.x, y: body.position.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(24, 44), maxLife: 44,
        color: Math.random() < 0.3 ? '#ffffff' : meta.color,
        size: rand(2, 6),
      });
    }
    this.floatTexts.push({
      x: body.position.x, y: body.position.y - 10,
      text: `+${meta.points}`, life: 46, maxLife: 46,
    });
    if (meta.maxHp >= 3) this.shake = Math.max(this.shake, 7);
    this.respawnAt.push(performance.now() + rand(500, 1200));
  }

  private steerCar() {
    const pos = this.car.position;
    let tx: number | null = null;
    let ty: number | null = null;

    const k = this.keys;
    const kx = (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0);
    const ky = (k.has('arrowdown') || k.has('s') ? 1 : 0) - (k.has('arrowup') || k.has('w') ? 1 : 0);
    if (kx !== 0 || ky !== 0) {
      tx = pos.x + kx * 120;
      ty = pos.y + ky * 120;
    } else if (this.pointer.active) {
      tx = this.pointer.x;
      ty = this.pointer.y;
    }
    if (tx === null || ty === null) return;

    const dx = tx - pos.x;
    const dy = ty - pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return;
    const boosting = performance.now() < this.boostingUntil;
    const maxSpeed = boosting ? 13 : 8.5;
    const sp = Math.min(maxSpeed, dist * 0.14);
    const tvx = (dx / dist) * sp;
    const tvy = (dy / dist) * sp;
    const v = this.car.velocity;
    Matter.Body.setVelocity(this.car, {
      x: v.x + (tvx - v.x) * 0.22,
      y: v.y + (tvy - v.y) * 0.22,
    });

    const speed = Math.hypot(this.car.velocity.x, this.car.velocity.y);
    if (speed > 1.2) {
      const target = Math.atan2(this.car.velocity.y, this.car.velocity.x);
      let d = target - this.car.angle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      Matter.Body.setAngle(this.car, this.car.angle + d * 0.2);
    }

    if (speed > 4.5) {
      this.trail.push({ x: pos.x, y: pos.y, angle: this.car.angle, life: 16 });
      if (this.trail.length > 40) this.trail.shift();
    }
  }

  // ---------- loop ----------

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.running) return;
    this.time += 1;

    const now = performance.now();
    while (this.respawnAt.length && this.respawnAt[0] <= now) {
      this.respawnAt.shift();
      if (this.letters.size < TARGET_LETTERS + 3) this.spawnLetter(false);
    }

    this.steerCar();
    Matter.Engine.update(this.engine, 1000 / 60);
    this.updateFx();
    this.draw();
  };

  private updateFx() {
    for (const p of this.particles) {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.96; p.vy *= 0.96;
      p.life -= 1;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const t of this.floatTexts) {
      t.y -= 1.1;
      t.life -= 1;
    }
    this.floatTexts = this.floatTexts.filter((t) => t.life > 0);
    for (const t of this.trail) t.life -= 1;
    this.trail = this.trail.filter((t) => t.life > 0);
    for (const meta of this.letters.values()) meta.flash *= 0.88;
    this.shake *= 0.88;
    if (this.shake < 0.2) this.shake = 0;
  }

  // ---------- drawing ----------

  private rr(x: number, y: number, w: number, h: number, r: number) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  private draw() {
    const { ctx, W, H } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Arena background.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b0b12');
    bg.addColorStop(1, '#050508');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid.
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    const gs = 44;
    ctx.beginPath();
    for (let x = gs / 2; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = gs / 2; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    if (this.shake > 0) {
      ctx.translate(rand(-this.shake, this.shake) * 0.5, rand(-this.shake, this.shake) * 0.5);
    }

    // Trail.
    for (const t of this.trail) {
      const a = (t.life / 16) * 0.28;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.fillStyle = `rgba(225, 30, 40, ${a})`;
      this.rr(-46, -16, 92, 32, 14);
      ctx.fill();
      ctx.restore();
    }

    // Letters.
    for (const [id, meta] of this.letters) {
      const body = Matter.Composite.get(this.engine.world, id, 'body') as Matter.Body | null;
      if (!body) continue;
      const { x, y } = body.position;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(body.angle);

      // Chip.
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      ctx.strokeStyle = meta.color + '55';
      ctx.lineWidth = 1.5;
      this.rr(-meta.halfW, -meta.halfH, meta.halfW * 2, meta.halfH * 2, 16);
      ctx.fill();
      ctx.stroke();

      // Word.
      ctx.font = this.fontFor(meta.size);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = meta.color;
      ctx.fillText(meta.word, 0, 2);

      // Damage: flash + cracks.
      if (meta.flash > 0.02) {
        ctx.fillStyle = `rgba(255,255,255,${(meta.flash * 0.65).toFixed(3)})`;
        this.rr(-meta.halfW, -meta.halfH, meta.halfW * 2, meta.halfH * 2, 16);
        ctx.fill();
      }
      const cracks = (meta.maxHp - meta.hp) * 2;
      if (cracks > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < cracks; i++) {
          const a = meta.seed + i * 2.39;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
          ctx.lineTo(Math.cos(a) * meta.halfW * 0.9, Math.sin(a) * meta.halfH * 0.9);
          ctx.stroke();
        }
      }

      // HP pips.
      const pipR = 3;
      const gap = 9;
      const totalW = meta.maxHp * gap - (gap - pipR * 2);
      for (let i = 0; i < meta.maxHp; i++) {
        ctx.beginPath();
        ctx.arc(-totalW / 2 + pipR + i * gap, meta.halfH - 12, pipR, 0, Math.PI * 2);
        ctx.fillStyle = i < meta.hp ? meta.color : 'rgba(255,255,255,0.18)';
        ctx.fill();
      }
      ctx.restore();
    }

    this.drawCar();

    // Particles.
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating score text.
    ctx.textAlign = 'center';
    for (const t of this.floatTexts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.font = '700 20px -apple-system, Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawCar() {
    const { ctx } = this;
    const { x, y } = this.car.position;
    const bob = Math.sin(this.time * 0.08) * 2.5; // hover bob = flying feel

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(this.car.angle);

    // Shadow (offset sells the "flying" look).
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(4, 12, 52, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    const L = 96;
    const Wd = 44;

    // Body.
    const grad = ctx.createLinearGradient(0, -Wd / 2, 0, Wd / 2);
    grad.addColorStop(0, '#ff5a52');
    grad.addColorStop(0.5, '#e11d28');
    grad.addColorStop(1, '#8f1018');
    ctx.fillStyle = grad;
    this.rr(-L / 2, -Wd / 2, L, Wd, 17);
    ctx.fill();

    // Nose taper highlight.
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    this.rr(L / 2 - 26, -Wd / 2 + 7, 20, Wd - 14, 9);
    ctx.fill();

    // Cabin.
    ctx.fillStyle = 'rgba(12,12,16,0.92)';
    this.rr(-14, -Wd / 2 + 8, 34, Wd - 16, 10);
    ctx.fill();
    // Windshield glint.
    ctx.fillStyle = 'rgba(160,200,255,0.35)';
    this.rr(8, -Wd / 2 + 12, 8, Wd - 24, 4);
    ctx.fill();

    // Racing stripe.
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(-L / 2 + 6, -3, L - 12, 6);

    // Headlights (front = +x).
    ctx.save();
    ctx.shadowColor = '#ffe9a8';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath(); ctx.arc(L / 2 - 4, -13, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(L / 2 - 4, 13, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Taillight bar.
    ctx.save();
    ctx.shadowColor = '#ff2d2d';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff3b30';
    this.rr(-L / 2 + 2, -14, 7, 28, 3.5);
    ctx.fill();
    ctx.restore();

    // Wheels (top-down slivers).
    ctx.fillStyle = '#0c0c0e';
    for (const [wx, wy] of [[-30, -Wd / 2 - 3], [30, -Wd / 2 - 3], [-30, Wd / 2 - 3], [30, Wd / 2 - 3]] as const) {
      this.rr(wx - 9, wy, 18, 7, 3);
      ctx.fill();
    }

    ctx.restore();
  }
}
