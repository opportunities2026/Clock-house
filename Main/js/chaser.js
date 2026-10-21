// Общий «мозг» для преследователей (сова, ворона): маршрут по клеткам,
// плавное движение без рывков, столкновения со стенами, зрение и слух.
import * as THREE from "three";
import { CELL } from "./world.js";

export class Chaser {
  constructor({ cfg, world, G, getPlayer, onSpotted, onLost, onCaught }) {
    this.cfg = cfg; this.world = world; this.G = G;
    this.getPlayer = getPlayer; this.onSpotted = onSpotted; this.onLost = onLost; this.onCaught = onCaught;
    this.radius = cfg.radius ?? 0.35;
    this.vel = new THREE.Vector2();
  }

  // летающим (сова, ворона) вода не мешает — только стены и чужие клетки
  allowed(cx, cz) {
    if (!this.cfg.cells.includes(this.world.at(cx, cz))) return false;
    return this.cfg.flies || !this.G.isBlocked(cx, cz);
  }
  cellOf(x, z) { return [Math.floor(x / CELL), Math.floor(z / CELL)]; }
  center(c) { return [(c[0] + 0.5) * CELL, (c[1] + 0.5) * CELL]; }

  // Поиск пути по клеткам (в ширину)
  path(from, to) {
    const key = (c) => c[0] + "," + c[1];
    if (!this.allowed(...to)) return null;
    const prev = new Map([[key(from), null]]);
    const q = [from];
    while (q.length) {
      const c = q.shift();
      if (c[0] === to[0] && c[1] === to[1]) {
        const out = [];
        for (let k = key(c); k; k = prev.get(k)) out.unshift(k.split(",").map(Number));
        return out;
      }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [c[0] + dx, c[1] + dz];
        if (!prev.has(key(n)) && this.allowed(...n)) { prev.set(key(n), key(c)); q.push(n); }
      }
    }
    return null;
  }

  setRoute(path) {
    this.route = path ? path.slice() : [];
    // первая клетка — та, где мы уже стоим: не возвращаемся к её центру
    if (this.route.length > 1) this.route.shift();
  }

  // Свободна ли «труба» шириной 2r между двумя точками (для срезания углов)
  clear(ax, az, bx, bz, r = this.radius) {
    const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz);
    if (d < 1e-3) return true;
    const nx = -dz / d, nz = dx / d, n = Math.ceil(d / 0.2);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = ax + dx * t, z = az + dz * t;
      for (const s of [-r, 0, r]) {
        if (!this.allowed(...this.cellOf(x + nx * s, z + nz * s))) return false;
      }
    }
    return true;
  }

  // Видно ли точку (тонкий луч, стены загораживают)
  canSee(x, z) {
    const p = this.mesh.position;
    const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz), n = Math.ceil(d / 0.2);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (this.world.isWall(...this.cellOf(p.x + dx * t, p.z + dz * t))) return false;
    }
    return true;
  }

  // Плавное движение к точке с разгоном и торможением
  steer(dt, tx, tz, speed, accel = 5) {
    const p = this.mesh.position;
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    const want = d > 1e-3 ? Math.min(speed, d * 3) : 0;
    const vx = d > 1e-3 ? (dx / d) * want : 0, vz = d > 1e-3 ? (dz / d) * want : 0;
    const k = Math.min(1, dt * accel);
    this.vel.x += (vx - this.vel.x) * k;
    this.vel.y += (vz - this.vel.y) * k;
    p.x += this.vel.x * dt; p.z += this.vel.y * dt;
    this.pushOut();
    const sp = this.vel.length();
    if (sp > 0.05) this.turnTo(Math.atan2(this.vel.x, this.vel.y), dt);
    return d;
  }

  turnTo(want, dt, rate = 5) {
    let diff = want - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.yaw += diff * Math.min(1, dt * rate);
  }

  // Не даём залететь в стену
  pushOut() {
    const p = this.mesh.position, r = this.radius;
    for (let it = 0; it < 2; it++) {
      const [cx, cz] = this.cellOf(p.x, p.z);
      for (let j = cz - 1; j <= cz + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) {
        if (this.allowed(i, j)) continue;
        const minX = i * CELL, minZ = j * CELL, maxX = minX + CELL, maxZ = minZ + CELL;
        const qx = Math.max(minX, Math.min(p.x, maxX)), qz = Math.max(minZ, Math.min(p.z, maxZ));
        const dx = p.x - qx, dz = p.z - qz, d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 < 1e-8) { // внутри стены — возвращаем в центр своей клетки
          const [ox, oz] = this.center(this.lastGood || [cx, cz]);
          p.x = ox; p.z = oz; continue;
        }
        const d = Math.sqrt(d2), k = (r - d) / d;
        p.x += dx * k; p.z += dz * k;
        // гасим скорость, направленную в стену
        const nx = dx / d, nz = dz / d, vn = this.vel.x * nx + this.vel.y * nz;
        if (vn < 0) { this.vel.x -= vn * nx; this.vel.y -= vn * nz; }
      }
    }
    const c = this.cellOf(p.x, p.z);
    if (this.allowed(...c)) this.lastGood = c;
  }

  // Следуем по маршруту, срезая углы там, где это безопасно
  followRoute(dt, speed) {
    const p = this.mesh.position;
    if (!this.route || !this.route.length) { this.steer(dt, p.x, p.z, 0); return true; }
    while (this.route.length > 1) {
      const [nx, nz] = this.center(this.route[1]);
      if (this.clear(p.x, p.z, nx, nz)) this.route.shift(); else break;
    }
    const [tx, tz] = this.center(this.route[0]);
    const d = this.steer(dt, tx, tz, speed);
    if (d < 0.3 && this.route.length) this.route.shift();
    return !this.route.length && d < 0.3;
  }

  // Общая логика патруля/погони/поиска. Возвращает true, если преследует.
  think(dt) {
    const cfg = this.cfg, p = this.mesh.position, pl = this.getPlayer();
    const oc = this.cellOf(p.x, p.z), pc = this.cellOf(pl.x, pl.z);
    if (this.state === "patrol" || this.state === "return") {
      if (!this.route || !this.route.length) {
        if (this.state === "return") this.state = "patrol";
        else this.routeIdx = (this.routeIdx + 1) % cfg.route.length;
        this.setRoute(this.path(oc, cfg.route[this.routeIdx]));
      }
      this.followRoute(dt, cfg.speed);
    } else if (this.state === "chase") {
      const seen = !pl.hidden && this.allowed(...pc) && this.canSee(pl.x, pl.z);
      if (seen) { this.lostTime = 0; this.lastSeenCell = pc; } else this.lostTime += dt;
      this.repath -= dt;
      const d = Math.hypot(pl.x - p.x, pl.z - p.z);
      if (seen && this.clear(p.x, p.z, pl.x, pl.z, this.radius * 0.8)) {
        // прямая видимость и свободный проход — летим прямо на Роберта
        this.route = null;
        this.steer(dt, pl.x, pl.z, cfg.chaseSpeed, 7);
      } else {
        if (this.repath <= 0 || !this.route || !this.route.length) {
          this.repath = 0.35;
          const goal = this.allowed(...pc) && !pl.hidden ? pc : this.lastSeenCell || oc;
          this.setRoute(this.path(oc, goal));
        }
        this.followRoute(dt, cfg.chaseSpeed);
      }
      if (pl.hidden || this.lostTime > 4 || !this.allowed(...pc)) {
        this.state = "search";
        this.searchTime = 3.5;
        this.setRoute(this.path(oc, this.lastSeenCell || oc));
        this.onAlert?.(false);
        this.onLost?.();
      } else if (d < (cfg.catchDist ?? 0.75)) {
        this.state = "caught";
        this.onCaught?.();
      }
      return true;
    } else if (this.state === "search") {
      if (this.followRoute(dt, cfg.speed * 1.2)) {
        this.searchTime -= dt;
        this.yaw += dt * 1.6; // осматривается
        if (this.searchTime <= 0) {
          this.state = "return";
          let best = 0, bd = 1e9;
          cfg.route.forEach((c, i) => { const dd = Math.hypot((c[0] + 0.5) * CELL - p.x, (c[1] + 0.5) * CELL - p.z); if (dd < bd) { bd = dd; best = i; } });
          this.routeIdx = best;
          this.setRoute(this.path(oc, cfg.route[best]));
        }
      }
    }
    // заметить Роберта
    if (this.state === "patrol" || this.state === "return" || this.state === "search") {
      this.seeTimer -= dt;
      if (this.seeTimer <= 0) {
        this.seeTimer = 0.15;
        const dx = pl.x - p.x, dz = pl.z - p.z, d = Math.hypot(dx, dz);
        if (!pl.hidden && this.allowed(...pc) && d < cfg.sight) {
          const look = this.yaw + (this.lookOffset?.() || 0);
          const cos = (Math.sin(look) * dx + Math.cos(look) * dz) / Math.max(d, 1e-3);
          const heard = pl.running && d < (cfg.hearing || 0);
          if ((cos > (cfg.fov ?? 0.35) || d < 2.4 || heard) && this.canSee(pl.x, pl.z)) {
            this.state = "chase"; this.lostTime = 0; this.lastSeenCell = pc; this.route = null; this.repath = 0;
            this.onAlert?.(true);
            this.onSpotted?.();
          }
        }
      }
    }
    return this.state === "chase";
  }

  resetChaser() {
    const [sx, sz] = this.cfg.start;
    this.mesh.position.x = (sx + 0.5) * CELL; this.mesh.position.z = (sz + 0.5) * CELL;
    this.vel.set(0, 0);
    this.state = "patrol"; this.routeIdx = 0; this.route = null; this.yaw = 0;
    this.lostTime = 0; this.searchTime = 0; this.repath = 0; this.seeTimer = 0;
    this.lastGood = [sx, sz];
  }
}
