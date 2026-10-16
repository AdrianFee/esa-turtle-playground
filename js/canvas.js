/* TurtleCanvas: receives drawing commands from the Python worker and
   animates them on an HTML canvas, turtle-style. */

const SHAPES = {
  turtle: [[0,16],[-2,14],[-1,10],[-4,7],[-7,9],[-9,8],[-6,5],[-7,1],[-5,-3],[-8,-6],[-6,-8],[-4,-5],[0,-7],[4,-5],[6,-8],[8,-6],[5,-3],[7,1],[6,5],[9,8],[7,9],[4,7],[1,10],[2,14]],
  classic: [[0,0],[-5,-9],[0,-7],[5,-9]],
  arrow: [[-10,0],[10,0],[0,10]],
  triangle: [[10,-5.77],[0,11.55],[-10,-5.77]],
  square: [[10,-10],[10,10],[-10,10],[-10,-10]],
  circle: "circle",
};

const SPRITE_SCALE = 1.35;

// Pixels per second and degrees per second for each speed 1..10. Speed 0 = instant.
function pxPerSec(speed) { return 110 * Math.pow(1.36, speed - 1); }
function degPerSec(speed) { return 100 * Math.pow(1.3, speed - 1); }

export class TurtleCanvas {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.W = opts.width || 640;
    this.H = opts.height || 480;
    this.onIdle = opts.onIdle || (() => {});
    this.onTitle = opts.onTitle || (() => {});
    this.turbo = false;
    this.layer = document.createElement("canvas");
    this._setupSize();
    this.reset();
    this._tick = this._tick.bind(this);
  }

  _setupSize() {
    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;
    for (const c of [this.canvas, this.layer]) {
      c.width = this.W * dpr;
      c.height = this.H * dpr;
    }
    this.canvas.style.aspectRatio = `${this.W} / ${this.H}`;
    this.ctx = this.canvas.getContext("2d");
    this.lctx = this.layer.getContext("2d");
  }

  reset() {
    this.ops = [];          // persistent drawing ops, in order
    this.turtles = new Map();
    this.queue = [];
    this.current = null;    // command being animated
    this.progress = 0;
    this.bg = "white";
    this.tracer = 1;
    this.running = false;
    this.title = "";
    this.onTitle("");
    this._redrawLayer();
    this._render();
  }

  // ---- public ----

  push(cmds) {
    for (const c of cmds) this.queue.push(c);
    this._ensureLoop();
  }

  /** Called when the Python program has finished so we know when we're truly idle. */
  programFinished() {
    this.finished = true;
    this._ensureLoop();
  }

  programStarted() {
    this.finished = false;
  }

  /** Drop everything still waiting to be drawn (used by the Stop button). */
  halt() {
    this.queue = [];
    this.current = null;
    this.finished = true;
    this._render();
  }

  flushInstantly() {
    while (this.queue.length) this._apply(this.queue.shift(), true);
    this.current = null;
    this._render();
  }

  toDataURL() {
    const out = document.createElement("canvas");
    out.width = this.canvas.width; out.height = this.canvas.height;
    const c = out.getContext("2d");
    c.fillStyle = this.bg; c.fillRect(0, 0, out.width, out.height);
    c.drawImage(this.layer, 0, 0);
    return out.toDataURL("image/png");
  }

  // ---- geometry ----

  tx(x) { return (this.W / 2 + x) * this.dpr; }
  ty(y) { return (this.H / 2 - y) * this.dpr; }

  // ---- animation loop ----

  _ensureLoop() {
    if (!this.running) {
      this.running = true;
      this.lastT = performance.now();
      requestAnimationFrame(this._tick);
    }
  }

  _tick(now) {
    let dt = Math.min((now - this.lastT) / 1000, 0.1);
    this.lastT = now;
    const instantAll = this.turbo || this.tracer === 0 || this.queue.length > 1500;

    // Spend up to dt seconds consuming commands.
    let budget = dt;
    let guard = 0;
    while (guard++ < 100000) {
      if (!this.current) {
        if (!this.queue.length) break;
        this.current = this.queue.shift();
        this.progress = 0;
        const c = this.current;
        const t = this.turtles.get(c.id);
        const spd = t ? t.speed : 3;
        const instant = instantAll || spd === 0;
        if (c.t === "m" && !instant) {
          const len = Math.hypot(c.x1 - c.x0, c.y1 - c.y0);
          this.current._dur = len / pxPerSec(spd);
        } else if (c.t === "r" && !instant) {
          this.current._dur = Math.abs(c.da) / degPerSec(spd);
        } else {
          this.current._dur = 0;
        }
      }
      const c = this.current;
      if (c._dur <= 0) {
        this._apply(c, true);
        this.current = null;
        continue;
      }
      const remaining = c._dur * (1 - this.progress);
      if (budget >= remaining) {
        budget -= remaining;
        this._apply(c, true);
        this.current = null;
      } else {
        this.progress += budget / c._dur;
        budget = 0;
        break;
      }
    }

    this._render();

    if (this.queue.length || this.current) {
      requestAnimationFrame(this._tick);
    } else {
      this.running = false;
      if (this.finished) this.onIdle();
    }
  }

  // ---- applying commands ----

  _turtle(id) {
    let t = this.turtles.get(id);
    if (!t) {
      t = { id, x: 0, y: 0, h: 0, vis: true, shape: "turtle", c: "black", f: "black", speed: 3, sw: 1, sl: 1 };
      this.turtles.set(id, t);
    }
    return t;
  }

  _apply(c, complete) {
    switch (c.t) {
      case "new": {
        const t = this._turtle(c.id);
        t.shape = c.shape; t.vis = c.vis; t.c = c.c; t.f = c.f;
        break;
      }
      case "clone": {
        const t = this._turtle(c.id);
        t.x = c.x; t.y = c.y; t.h = c.h; t.c = c.c; t.f = c.f;
        break;
      }
      case "m": {
        const t = this._turtle(c.id);
        t.x = c.x1; t.y = c.y1; t.h = c.h;
        if (c.pen) {
          const op = { k: "line", id: c.id, x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, c: c.c, w: c.w };
          this.ops.push(op);
          this._drawOp(this.lctx, op);
        }
        break;
      }
      case "r": {
        const t = this._turtle(c.id);
        t.h = c.h;
        break;
      }
      case "d": {
        const op = { k: "dot", id: c.id, x: c.x, y: c.y, s: c.s, c: c.c };
        this.ops.push(op); this._drawOp(this.lctx, op);
        break;
      }
      case "s": {
        const t = this._turtle(c.id);
        const op = { k: "stamp", id: c.id, x: c.x, y: c.y, h: c.h, shape: c.shape, c: c.c, f: c.f, sw: t.sw, sl: t.sl };
        this.ops.push(op); this._drawOp(this.lctx, op);
        break;
      }
      case "w": {
        const op = { k: "text", id: c.id, x: c.x, y: c.y, text: c.text, align: c.align, font: c.font, c: c.c };
        this.ops.push(op); this._drawOp(this.lctx, op);
        break;
      }
      case "fb": {
        const t = this._turtle(c.id);
        t.fillStart = this.ops.length;
        break;
      }
      case "f": {
        const t = this._turtle(c.id);
        const op = { k: "fill", id: c.id, pts: c.pts, c: c.c };
        const at = t.fillStart != null ? t.fillStart : this.ops.length;
        this.ops.splice(at, 0, op);
        t.fillStart = null;
        this._redrawLayer();
        break;
      }
      case "pc": this._turtle(c.id).c = c.c; break;
      case "fc": this._turtle(c.id).f = c.c; break;
      case "sp": this._turtle(c.id).speed = c.v; break;
      case "v": this._turtle(c.id).vis = c.vis; break;
      case "sh": this._turtle(c.id).shape = c.shape; break;
      case "ss": { const t = this._turtle(c.id); t.sw = c.w; t.sl = c.l; break; }
      case "bg": this.bg = c.c; break;
      case "title": this.title = c.text; this.onTitle(c.text); break;
      case "tr": this.tracer = c.n; break;
      case "clr": {
        this.ops = this.ops.filter((o) => o.id !== c.id);
        this._redrawLayer();
        break;
      }
      case "clrall": this.ops = []; this._redrawLayer(); break;
      case "reset": {
        const t = this._turtle(c.id);
        t.x = 0; t.y = 0; t.h = 0; t.vis = true; t.c = "black"; t.f = "black";
        break;
      }
    }
  }

  // ---- drawing ----

  _redrawLayer() {
    const c = this.lctx;
    c.clearRect(0, 0, this.layer.width, this.layer.height);
    for (const op of this.ops) this._drawOp(c, op);
  }

  _drawOp(c, op) {
    const d = this.dpr;
    c.save();
    switch (op.k) {
      case "line":
        c.strokeStyle = op.c; c.lineWidth = Math.max(op.w, 0.5) * d; c.lineCap = "round"; c.lineJoin = "round";
        c.beginPath(); c.moveTo(this.tx(op.x0), this.ty(op.y0)); c.lineTo(this.tx(op.x1), this.ty(op.y1)); c.stroke();
        break;
      case "dot":
        c.fillStyle = op.c; c.beginPath(); c.arc(this.tx(op.x), this.ty(op.y), (op.s / 2) * d, 0, Math.PI * 2); c.fill();
        break;
      case "fill":
        if (op.pts.length < 3) break;
        c.fillStyle = op.c; c.beginPath();
        c.moveTo(this.tx(op.pts[0][0]), this.ty(op.pts[0][1]));
        for (let i = 1; i < op.pts.length; i++) c.lineTo(this.tx(op.pts[i][0]), this.ty(op.pts[i][1]));
        c.closePath(); c.fill();
        break;
      case "stamp":
        this._drawShape(c, op.x, op.y, op.h, op.shape, op.c, op.f, op.sw, op.sl);
        break;
      case "text": {
        const [family, size, style] = op.font;
        const weight = /bold/i.test(style) ? "bold " : "";
        const italic = /italic/i.test(style) ? "italic " : "";
        c.font = `${italic}${weight}${size * d * 1.33}px ${family}, sans-serif`;
        c.fillStyle = op.c;
        c.textAlign = op.align === "center" ? "center" : op.align === "right" ? "right" : "left";
        c.textBaseline = "bottom";
        c.fillText(op.text, this.tx(op.x), this.ty(op.y) + 2 * d);
        break;
      }
    }
    c.restore();
  }

  _drawShape(c, x, y, heading, shape, stroke, fill, sw = 1, sl = 1) {
    const d = this.dpr;
    c.save();
    c.translate(this.tx(x), this.ty(y));
    // Shapes point "up" (positive y) at heading 90; canvas y is flipped.
    c.rotate(-(heading - 90) * Math.PI / 180);
    c.scale(sl * d * SPRITE_SCALE, sw * d * SPRITE_SCALE);
    c.beginPath();
    if (shape === "circle") {
      c.arc(0, 0, 10, 0, Math.PI * 2);
    } else {
      const pts = SHAPES[shape] || SHAPES.turtle;
      c.moveTo(pts[0][0], -pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], -pts[i][1]);
      c.closePath();
    }
    c.fillStyle = fill;
    c.fill();
    // A light halo then the pen-colour outline keeps the sprite visible on any background.
    c.lineJoin = "round";
    c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = stroke; c.lineWidth = 1; c.stroke();
    c.restore();
  }

  _render() {
    const c = this.ctx;
    c.fillStyle = this.bg;
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.drawImage(this.layer, 0, 0);

    // Partially-complete command (moving line or turning).
    const cur = this.current;
    const temp = new Map();
    if (cur && cur._dur > 0) {
      const t = this._turtle(cur.id);
      if (cur.t === "m") {
        const p = this.progress;
        const x = cur.x0 + (cur.x1 - cur.x0) * p, y = cur.y0 + (cur.y1 - cur.y0) * p;
        if (cur.pen) this._drawOp(c, { k: "line", x0: cur.x0, y0: cur.y0, x1: x, y1: y, c: cur.c, w: cur.w });
        temp.set(t.id, { ...t, x, y, h: cur.h });
      } else if (cur.t === "r") {
        const from = cur.h - cur.da;
        temp.set(t.id, { ...t, h: from + cur.da * this.progress });
      }
    }
    for (const t of this.turtles.values()) {
      const s = temp.get(t.id) || t;
      if (s.vis) this._drawShape(c, s.x, s.y, s.h, s.shape, s.c, s.f, s.sw, s.sl);
    }
  }
}
