// Управление: сенсорный экран (джойстик + обзор) и клавиатура/мышь.
export class Controls {
  constructor(el, { onTap, onLook }) {
    this.el = el;
    this.onTap = onTap;
    this.onLook = onLook;
    this.move = { x: 0, y: 0 };     // -1..1 вперёд/вбок
    this.keys = new Set();
    this.pointers = new Map();
    this.enabled = true;
    this.walkEnabled = true;
    this.joy = document.getElementById("joystick");
    this.knob = document.getElementById("joystick-knob");

    el.addEventListener("pointerdown", (e) => this.down(e));
    window.addEventListener("pointermove", (e) => this.moveP(e));
    window.addEventListener("pointerup", (e) => this.up(e));
    window.addEventListener("pointercancel", (e) => this.up(e, true));
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", (e) => { if (!e.repeat) this.keys.add(e.code); });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => { this.keys.clear(); this.reset(); });
  }

  reset() {
    this.pointers.clear();
    this.move.x = this.move.y = 0;
    this.joy.classList.remove("on");
  }

  down(e) {
    if (!this.enabled) return;
    e.preventDefault();
    this.el.setPointerCapture?.(e.pointerId);
    const leftSide = e.clientX < window.innerWidth * 0.42 && e.pointerType !== "mouse";
    const hasJoy = [...this.pointers.values()].some((p) => p.joy);
    const p = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0, joy: leftSide && !hasJoy && this.walkEnabled };
    this.pointers.set(e.pointerId, p);
    if (p.joy) {
      this.joy.style.left = p.x0 + "px"; this.joy.style.top = p.y0 + "px";
      this.joy.classList.add("on");
      this.knob.style.transform = "translate(-50%, -50%)";
    }
  }

  moveP(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    p.moved = Math.max(p.moved, Math.hypot(p.x - p.x0, p.y - p.y0));
    if (p.joy) {
      const R = 60;
      let jx = p.x - p.x0, jy = p.y - p.y0;
      const len = Math.hypot(jx, jy);
      if (len > R) { jx *= R / len; jy *= R / len; }
      this.knob.style.transform = `translate(calc(-50% + ${jx}px), calc(-50% + ${jy}px))`;
      const dead = 0.12;
      const mx = jx / R, my = -jy / R;
      const m = Math.hypot(mx, my);
      const k = m < dead ? 0 : (m - dead) / (1 - dead) / m;
      this.move.x = mx * k; this.move.y = my * k;
    } else if (p.moved > 6) {
      this.onLook(dx, dy, e.pointerType);
    }
  }

  up(e, cancel = false) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    this.pointers.delete(e.pointerId);
    if (p.joy) {
      this.move.x = this.move.y = 0;
      this.joy.classList.remove("on");
    }
    const quick = performance.now() - p.t0 < 450;
    if (!cancel && quick && p.moved < 12 && this.enabled) this.onTap(p.x0, p.y0);
  }

  // Итоговое движение: джойстик + клавиши
  axis() {
    let x = this.move.x, y = this.move.y;
    // джойстик толкнули до самого края — Роберт бежит
    const runTouch = Math.hypot(x, y) > 0.92;
    this.joy.classList.toggle("run", runTouch);
    const k = this.keys;
    if (k.has("KeyW") || k.has("ArrowUp")) y += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) y -= 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) x -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) x += 1;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, run: runTouch || k.has("ShiftLeft") || k.has("ShiftRight") };
  }
}
