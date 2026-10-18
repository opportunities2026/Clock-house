// СТРАЖ — заводная латунная сова. Облетает лабиринт, замечает Роберта,
// гонится за ним и уносит обратно ко входу. Засыпает в полночь.
import * as THREE from "three";
import * as T from "./textures.js";
import { sfx, movingLoop } from "./audio.js";
import { CELL } from "./world.js";
import { gearMesh } from "./props.js";

const FLY_Y = 1.85;

export class Owl {
  constructor({ cfg, world, G, scene, getPlayer, onSpotted, onLost, onCaught }) {
    this.cfg = cfg; this.world = world; this.G = G;
    this.getPlayer = getPlayer; this.onSpotted = onSpotted; this.onLost = onLost; this.onCaught = onCaught;
    this.allowed = (cx, cz) => cfg.cells.includes(world.at(cx, cz));
    this.mesh = this.build();
    scene.add(this.mesh);
    this.sound = null;
    this.reset();
    if (G.is(cfg.sleepFlag)) {
      this.sleepNow();
      // если игру закрыли, пока сова летела в гнездо, — ключ всё равно должен упасть
      if (!G.is("owl_landed")) G.afterBuild(() => G.flag("owl_landed"));
    }
    G.onFlag(cfg.sleepFlag, () => this.goToSleep());
  }

  // ------------------------------------------------------------ внешний вид
  build() {
    const g = new THREE.Group();
    const brass = T.metal("#b8904e", 0.35), dark = T.metal("#5a4426", 0.5), light = T.metal("#e0c48a", 0.3);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), brass);
    body.scale.set(1, 1.15, 0.9); g.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), light);
    belly.scale.set(1, 1.2, 0.5); belly.position.set(0, -0.03, 0.12); g.add(belly);
    const chestGear = gearMesh(0.06, dark); chestGear.position.set(0, -0.02, 0.2); g.add(chestGear);
    this.chestGear = chestGear;

    const head = new THREE.Group(); head.position.y = 0.27; g.add(head); this.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), brass);
    skull.scale.set(1.15, 0.95, 1); head.add(skull);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), dark);
    face.position.z = 0.15; face.scale.x = 1.25; head.add(face);
    this.eyeMat = new THREE.MeshStandardMaterial({ color: "#ffd060", emissive: "#ffb020", emissiveIntensity: 2.2, roughness: 0.2 });
    this.eyes = [];
    for (const s of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20), light);
      ring.position.set(s * 0.075, 0.01, 0.16); head.add(ring);
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), this.eyeMat);
      eye.position.set(s * 0.075, 0.01, 0.162); head.add(eye);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), new THREE.MeshBasicMaterial({ color: "#120800" }));
      pupil.position.set(s * 0.075, 0.01, 0.165); head.add(pupil);
      this.eyes.push(pupil);
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), brass);
      tuft.position.set(s * 0.12, 0.15, 0.02); tuft.rotation.z = -s * 0.5; head.add(tuft);
    }
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), dark);
    beak.position.set(0, -0.05, 0.18); beak.rotation.x = Math.PI / 2 + 0.6; head.add(beak);

    this.wings = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.18, 0.08, -0.02); g.add(pivot);
      const wing = new THREE.Group(); pivot.add(wing);
      for (let k = 0; k < 4; k++) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(0.34 - k * 0.05, 0.018, 0.11), k % 2 ? dark : brass);
        f.position.set(s * (0.17 - k * 0.02), -k * 0.035, -k * 0.02);
        wing.add(f);
      }
      this.wings.push({ pivot, s });
    }
    for (const s of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6), dark);
      foot.position.set(s * 0.06, -0.27, 0.03); g.add(foot);
    }
    this.light = new THREE.PointLight("#ffb040", 2.5, 6, 2);
    this.light.position.set(0, 0.25, 0.4); g.add(this.light);
    g.traverse((o) => { o.userData.noRay = true; });
    return g;
  }

  // ------------------------------------------------------------ поиск пути по клеткам
  cellOf(x, z) { return [Math.floor(x / CELL), Math.floor(z / CELL)]; }

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

  // видит ли сова точку (стены загораживают)
  canSee(x, z) {
    const p = this.mesh.position;
    const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz), n = Math.ceil(d / 0.25);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (this.world.isWall(...this.cellOf(p.x + dx * t, p.z + dz * t))) return false;
    }
    return true;
  }

  // ------------------------------------------------------------ состояния
  reset() {
    const [sx, sz] = this.cfg.start;
    this.mesh.position.set((sx + 0.5) * CELL, FLY_Y, (sz + 0.5) * CELL);
    this.state = "patrol";
    this.routeIdx = 0;
    this.route = null;
    this.yaw = 0;
    this.lostTime = 0;
    this.searchTime = 0;
    this.repath = 0;
    this.seeTimer = 0;
    this.hootTimer = 8 + Math.random() * 8;
    this.flapTimer = 0;
    this.setAlert(false);
  }

  setAlert(on) {
    this.eyeMat.emissive.set(on ? "#ff5a10" : "#ffb020");
    this.eyeMat.color.set(on ? "#ff8a40" : "#ffd060");
    this.light.color.set(on ? "#ff7a30" : "#ffb040");
    this.light.intensity = on ? 4 : 2.5;
  }

  sleepNow() {
    const [px, pz] = this.cfg.perch;
    this.mesh.position.set(px * CELL, 1.95, pz * CELL);
    this.state = "sleep";
    this.setAlert(false);
    this.eyeMat.emissiveIntensity = 0.05;
    this.light.intensity = 0;
    this.yaw = 0;
  }

  goToSleep() {
    if (this.state === "sleep") return;
    if (this.state === "chase") this.onLost?.();
    this.setAlert(false);
    this.state = "toPerch";
    const [px, pz] = this.cfg.perch;
    this.route = this.path(this.cellOf(this.mesh.position.x, this.mesh.position.z), [Math.floor(px), Math.floor(pz)]);
    sfx.owl(this.mesh.position.clone());
  }

  followRoute(dt, speed) {
    if (!this.route || !this.route.length) return true;
    const [cx, cz] = this.route[0];
    const tx = (cx + 0.5) * CELL, tz = (cz + 0.5) * CELL;
    if (this.moveTo(tx, tz, dt, speed) < 0.15) this.route.shift();
    return !this.route.length;
  }

  moveTo(tx, tz, dt, speed) {
    const p = this.mesh.position;
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d > 0.001) {
      const step = Math.min(d, speed * dt);
      p.x += (dx / d) * step; p.z += (dz / d) * step;
      const want = Math.atan2(dx, dz);
      let diff = want - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 6);
    }
    return d;
  }

  update(dt, time) {
    const cfg = this.cfg, p = this.mesh.position, pl = this.getPlayer();
    if (!this.sound) { this.sound = movingLoop(); }
    const awake = this.state !== "sleep";

    // ---------------- поведение
    if (this.state === "patrol" || this.state === "return") {
      if (!this.route || !this.route.length) {
        if (this.state === "return") this.state = "patrol";
        else this.routeIdx = (this.routeIdx + 1) % cfg.route.length;
        this.route = this.path(this.cellOf(p.x, p.z), cfg.route[this.routeIdx]) || [];
      }
      this.followRoute(dt, cfg.speed);
      this.hootTimer -= dt;
      if (this.hootTimer <= 0) { this.hootTimer = 14 + Math.random() * 10; sfx.owl(p.clone()); }
    } else if (this.state === "chase") {
      this.repath -= dt;
      const pc = this.cellOf(pl.x, pl.z), oc = this.cellOf(p.x, p.z);
      const near = Math.abs(pc[0] - oc[0]) + Math.abs(pc[1] - oc[1]) <= 1;
      if (near && this.canSee(pl.x, pl.z)) {
        this.route = null;
        this.moveTo(pl.x, pl.z, dt, cfg.chaseSpeed);
      } else {
        if (this.repath <= 0 || !this.route || !this.route.length) {
          this.repath = 0.3;
          this.route = this.path(oc, this.allowed(...pc) ? pc : this.lastSeenCell) || this.route;
        }
        this.followRoute(dt, cfg.chaseSpeed);
      }
      const seen = !pl.hidden && this.allowed(...pc) && this.canSee(pl.x, pl.z);
      if (seen) { this.lostTime = 0; this.lastSeenCell = pc; } else this.lostTime += dt;
      if (pl.hidden || this.lostTime > 4 || !this.allowed(...pc)) {
        this.state = "search";
        this.searchTime = 3.5;
        this.route = this.path(oc, this.lastSeenCell || oc);
        this.setAlert(false);
        this.onLost?.();
      }
      const d = Math.hypot(pl.x - p.x, pl.z - p.z);
      if (!pl.hidden && d < 0.75) { this.state = "caught"; this.onCaught?.(); }
    } else if (this.state === "search") {
      if (this.followRoute(dt, cfg.speed * 1.2)) {
        this.searchTime -= dt;
        this.yaw += dt * 1.6; // осматривается
        if (this.searchTime <= 0) {
          this.state = "return";
          let best = 0, bd = 1e9;
          cfg.route.forEach((c, i) => { const dd = Math.hypot(c[0] * CELL - p.x, c[1] * CELL - p.z); if (dd < bd) { bd = dd; best = i; } });
          this.routeIdx = best;
          this.route = this.path(this.cellOf(p.x, p.z), cfg.route[best]) || [];
        }
      }
    } else if (this.state === "toPerch") {
      if (this.followRoute(dt, cfg.speed * 1.6)) {
        const [px, pz] = cfg.perch;
        const d = this.moveTo(px * CELL, pz * CELL, dt, 1.2);
        p.y += (1.95 - p.y) * Math.min(1, dt * 2);
        if (d < 0.05) {
          this.sleepNow();
          this.G.flag("owl_landed");
        }
      }
    }

    // ---------------- заметить Роберта
    if (this.state === "patrol" || this.state === "return" || this.state === "search") {
      this.seeTimer -= dt;
      if (this.seeTimer <= 0) {
        this.seeTimer = 0.15;
        const pc = this.cellOf(pl.x, pl.z);
        const dx = pl.x - p.x, dz = pl.z - p.z, d = Math.hypot(dx, dz);
        if (!pl.hidden && this.allowed(...pc) && d < cfg.sight) {
          const look = this.yaw + this.head.rotation.y;
          const cos = (Math.sin(look) * dx + Math.cos(look) * dz) / Math.max(d, 1e-3);
          if ((cos > 0.35 || d < 2.4) && this.canSee(pl.x, pl.z)) {
            this.state = "chase"; this.lostTime = 0; this.lastSeenCell = pc; this.route = null;
            this.setAlert(true);
            sfx.owlScreech(p.clone());
            this.onSpotted?.();
          }
        }
      }
    }

    // ---------------- анимация
    const chasing = this.state === "chase";
    this.mesh.rotation.y = this.yaw;
    if (awake) {
      if (this.state !== "toPerch") p.y = FLY_Y + Math.sin(time * 3) * 0.06 - (chasing ? 0.2 : 0);
      const flapSpeed = chasing ? 16 : 9;
      for (const w of this.wings) w.pivot.rotation.z = w.s * (Math.sin(time * flapSpeed) * 0.7 + 0.2);
      this.head.rotation.y = chasing ? 0 : Math.sin(time * 0.9) * 0.7;
      this.chestGear.rotation.z += dt * (chasing ? 6 : 2);
      this.flapTimer -= dt;
      if (this.flapTimer <= 0) { this.flapTimer = chasing ? 0.4 : 0.75; sfx.flap(p.clone()); }
    } else {
      for (const w of this.wings) w.pivot.rotation.z = w.s * -0.15;
      this.head.rotation.y = 0;
      this.head.rotation.x = 0.35 + Math.sin(time * 0.8) * 0.03; // клюёт носом во сне
    }
    if (this.sound) {
      this.sound.setPos(p);
      this.sound.setGain(awake ? (chasing ? 0.9 : 0.5) : 0.05);
      this.sound.setPitch(chasing ? 1.35 : awake ? 1 : 0.6);
    }
  }
}
