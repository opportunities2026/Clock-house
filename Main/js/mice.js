// МЕХАНИЧЕСКИЕ МЫШИ — целая стая. Пока их не потревожили, они сидят в норах.
// Потом выбегают и бегут к Роберту по кратчайшему пути. Шагом от них не уйти!
import * as THREE from "three";
import { mergeGeometries } from "../lib/addons/BufferGeometryUtils.js";
import * as T from "./textures.js";
import { sfx } from "./audio.js";
import { CELL } from "./world.js";

const R = 0.13; // «толщина» мышки

function mouseGeometry() {
  const parts = [];
  const body = new THREE.SphereGeometry(0.1, 10, 8); body.scale(0.8, 0.62, 1.25); body.translate(0, 0.07, 0); parts.push(body);
  const head = new THREE.SphereGeometry(0.06, 8, 6); head.scale(0.9, 0.8, 1.2); head.translate(0, 0.08, 0.13); parts.push(head);
  const nose = new THREE.ConeGeometry(0.025, 0.06, 6); nose.rotateX(Math.PI / 2); nose.translate(0, 0.075, 0.2); parts.push(nose);
  for (const s of [-1, 1]) { const ear = new THREE.CylinderGeometry(0.035, 0.035, 0.008, 10); ear.rotateX(Math.PI / 2); ear.translate(s * 0.04, 0.13, 0.12); parts.push(ear); }
  const tail = new THREE.CylinderGeometry(0.006, 0.01, 0.22, 5); tail.rotateX(Math.PI / 2 - 0.3); tail.translate(0, 0.07, -0.21); parts.push(tail);
  for (const s of [-1, 1]) for (const zz of [-0.05, 0.07]) { const leg = new THREE.CylinderGeometry(0.008, 0.008, 0.05, 4); leg.translate(s * 0.05, 0.025, zz); parts.push(leg); }
  return mergeGeometries(parts.map((g) => g.toNonIndexed()));
}

export class MiceSwarm {
  constructor({ cfg, world, G, scene, getPlayer, onSpotted, onLost, onCaught }) {
    this.cfg = { count: 24, speed: 2.6, catchDist: 0.55, ...cfg };
    this.world = world; this.G = G; this.getPlayer = getPlayer;
    this.onSpotted = onSpotted; this.onLost = onLost; this.onCaught = onCaught;
    this.geo = mouseGeometry();
    this.mat = new THREE.MeshStandardMaterial({ color: "#8a8a90", metalness: 0.85, roughness: 0.35 });
    this.im = new THREE.InstancedMesh(this.geo, this.mat, this.cfg.count);
    this.im.frustumCulled = false;
    this.im.userData.noRay = true;
    scene.add(this.im);
    // красные глаза-бусинки — отдельным набором
    const eyeGeo = mergeGeometries([-1, 1].map((s) => { const e = new THREE.SphereGeometry(0.012, 6, 4); e.translate(s * 0.03, 0.105, 0.17); return e.toNonIndexed(); }));
    this.eyes = new THREE.InstancedMesh(eyeGeo, new THREE.MeshBasicMaterial({ color: "#ff2a10" }), this.cfg.count);
    this.eyes.frustumCulled = false; this.eyes.userData.noRay = true;
    scene.add(this.eyes);
    this.mesh = new THREE.Object3D(); // точка ближайшей мыши — для тряски экрана
    this.mice = [];
    for (let i = 0; i < this.cfg.count; i++) this.mice.push({ x: 0, z: 0, vx: 0, vz: 0, yaw: 0, delay: 0, phase: Math.random() * 10, home: i % this.cfg.holes.length });
    this.dist = null; this.flowTimer = 0; this.squeak = 0;
    this.reset();
    if (G.is(this.cfg.trigger)) this.wake(0.5);
    G.onFlag(this.cfg.trigger, () => this.wake(1.2));
  }

  allowed(cx, cz) { return this.cfg.cells.includes(this.world.at(cx, cz)) && !this.G.isBlocked(cx, cz); }
  cellOf(x, z) { return [Math.floor(x / CELL), Math.floor(z / CELL)]; }

  holePos(i) {
    const [hx, hz, rot = 0] = this.cfg.holes[i];
    const a = THREE.MathUtils.degToRad(rot);
    // нора у стены: мышь появляется чуть впереди
    return [hx * CELL + Math.sin(a) * 0.25, hz * CELL + Math.cos(a) * 0.25];
  }

  reset() {
    this.state = this.G.is(this.cfg.trigger) ? "wait" : "idle";
    this.mice.forEach((m, i) => {
      const [x, z] = this.holePos(m.home);
      m.x = x + (Math.random() - 0.5) * 0.2; m.z = z + (Math.random() - 0.5) * 0.2;
      m.vx = m.vz = 0; m.inside = true; m.delay = 2.5 + (i / this.mice.length) * 2;
    });
    this.hiddenTime = 0;
    this.render(0);
  }

  wake(delay) {
    this.state = "wait";
    this.mice.forEach((m, i) => { m.delay = delay + (i / this.mice.length) * 1.5; });
    sfx.squeakSwarm?.(this.mesh.position.clone());
  }

  // Карта расстояний до Роберта: каждая мышь бежит туда, где расстояние меньше
  flow(target) {
    const W = this.world.W, H = this.world.H;
    const dist = new Int16Array(W * H).fill(-1);
    const q = [target];
    dist[target[1] * W + target[0]] = 0;
    while (q.length) {
      const [x, z] = q.shift(), d = dist[z * W + x];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (nx < 0 || nz < 0 || nx >= W || nz >= H || dist[nz * W + nx] >= 0 || !this.allowed(nx, nz)) continue;
        dist[nz * W + nx] = d + 1; q.push([nx, nz]);
      }
    }
    this.dist = dist;
  }

  nextStep(m) {
    const W = this.world.W, [cx, cz] = this.cellOf(m.x, m.z);
    const here = this.dist[cz * W + cx];
    if (here <= 0) return null;
    let best = null, bd = here;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const d = this.dist[(cz + dz) * W + (cx + dx)];
      if (d >= 0 && d < bd) { bd = d; best = [(cx + dx + 0.5) * CELL, (cz + dz + 0.5) * CELL]; }
    }
    return best;
  }

  pushOut(m) {
    const [cx, cz] = this.cellOf(m.x, m.z);
    for (let j = cz - 1; j <= cz + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) {
      if (this.allowed(i, j)) continue;
      const qx = Math.max(i * CELL, Math.min(m.x, (i + 1) * CELL)), qz = Math.max(j * CELL, Math.min(m.z, (j + 1) * CELL));
      const dx = m.x - qx, dz = m.z - qz, d2 = dx * dx + dz * dz;
      if (d2 >= R * R) continue;
      if (d2 < 1e-8) continue;
      const d = Math.sqrt(d2), k = (R - d) / d;
      m.x += dx * k; m.z += dz * k;
    }
  }

  update(dt, time) {
    const pl = this.getPlayer();
    const pc = this.cellOf(pl.x, pl.z);
    const playerHere = this.allowed(...pc);
    if (this.state === "idle") { this.render(time); return; }

    if (this.state === "wait" && this.mice.every((m) => m.delay <= 0)) {
      this.state = "chase";
      this.onSpotted?.();
    }
    // спрятался в шкаф — мыши покрутятся рядом и уйдут в норы
    if (this.state === "chase" && pl.hidden) { this.state = "hidden"; this.hiddenTime = 0; this.onLost?.(); }
    if (this.state === "hidden") {
      this.hiddenTime += dt;
      if (!pl.hidden && this.hiddenTime < 5) { this.state = "chase"; this.onSpotted?.(); }
      else if (this.hiddenTime > 5) { this.state = "retreat"; }
    }
    if (this.state === "retreat" && !pl.hidden && playerHere && this.mice.every((m) => m.inside)) {
      this.wake(2.5); // снова почуяли!
    }

    this.flowTimer -= dt;
    if (this.flowTimer <= 0) {
      this.flowTimer = 0.25;
      if ((this.state === "chase" || this.state === "hidden") && playerHere) this.flow(pc);
    }
    const speed = this.cfg.speed;
    let nearest = 1e9, nm = null;
    for (let i = 0; i < this.mice.length; i++) {
      const m = this.mice[i];
      if (m.delay > 0) { m.delay -= dt; if (m.delay > 0) continue; m.inside = false; }
      let tx = m.x, tz = m.z;
      if (this.state === "retreat") {
        [tx, tz] = this.holePos(m.home);
        if (Math.hypot(tx - m.x, tz - m.z) < 0.15) { m.inside = true; continue; }
        // к своей норе — по той же карте не получится, просто бежим и упираемся в стены
        const step = this.homeStep(m); if (step) [tx, tz] = step;
      } else if (this.dist && playerHere) {
        const step = this.nextStep(m);
        if (step) [tx, tz] = step; else { tx = pl.x; tz = pl.z; }
        if (pl.hidden) { tx += Math.sin(time * 2 + i) * 0.6; tz += Math.cos(time * 1.7 + i) * 0.6; }
      } else {
        // Роберт ушёл туда, куда мыши не могут: ждут у порога
        tx = m.x + Math.sin(time * 3 + i) * 0.3; tz = m.z + Math.cos(time * 2.6 + i) * 0.3;
      }
      // немного «бегают зигзагом» и не налезают друг на друга
      let ax = tx - m.x, az = tz - m.z;
      const al = Math.hypot(ax, az) || 1;
      ax /= al; az /= al;
      for (let j = 0; j < this.mice.length; j++) {
        if (j === i) continue;
        const o = this.mice[j], dx = m.x - o.x, dz = m.z - o.z, d2 = dx * dx + dz * dz;
        if (d2 < 0.09 && d2 > 1e-6) { const d = Math.sqrt(d2); ax += (dx / d) * (0.3 - d) * 4; az += (dz / d) * (0.3 - d) * 4; }
      }
      const wob = Math.sin(time * 9 + m.phase) * 0.35;
      const sp = speed * (0.85 + 0.3 * ((i * 37) % 10) / 10);
      const k = Math.min(1, dt * 8);
      m.vx += ((ax - az * wob) * sp - m.vx) * k;
      m.vz += ((az + ax * wob) * sp - m.vz) * k;
      m.x += m.vx * dt; m.z += m.vz * dt;
      this.pushOut(m);
      if (Math.hypot(m.vx, m.vz) > 0.1) m.yaw = Math.atan2(m.vx, m.vz);
      const d = Math.hypot(pl.x - m.x, pl.z - m.z);
      if (d < nearest) { nearest = d; nm = m; }
    }
    if (nm) this.mesh.position.set(nm.x, 0.3, nm.z);
    if (this.state === "chase" && !pl.hidden && nearest < this.cfg.catchDist) {
      this.state = "caught";
      this.onCaught?.();
    }
    // писк и топот
    this.squeak -= dt;
    if (this.squeak <= 0 && (this.state === "chase" || this.state === "hidden") && nm) {
      this.squeak = 0.25 + Math.random() * 0.4;
      sfx.squeak?.(new THREE.Vector3(nm.x, 0.2, nm.z));
    }
    this.state === "caught" || this.render(time);
  }

  // Шаг к своей норе: ищем путь по клеткам один раз и запоминаем
  homeStep(m) {
    const [hx, hz] = this.holePos(m.home);
    const hc = this.cellOf(hx, hz), mc = this.cellOf(m.x, m.z);
    if (hc[0] === mc[0] && hc[1] === mc[1]) return [hx, hz];
    if (!m.homeDist || m.homeFor !== m.home) {
      const saved = this.dist; this.flow(hc); m.homeDist = this.dist; m.homeFor = m.home; this.dist = saved;
    }
    const saved = this.dist; this.dist = m.homeDist;
    const s = this.nextStep(m);
    this.dist = saved;
    return s;
  }

  render(time) {
    const o = new THREE.Object3D();
    this.mice.forEach((m, i) => {
      const hidden = m.inside || m.delay > 0;
      o.position.set(m.x, hidden ? -5 : Math.abs(Math.sin(time * 22 + m.phase)) * 0.02, m.z);
      o.rotation.set(0, m.yaw, 0);
      o.scale.setScalar(1);
      o.updateMatrix();
      this.im.setMatrixAt(i, o.matrix);
      this.eyes.setMatrixAt(i, o.matrix);
    });
    this.im.instanceMatrix.needsUpdate = true;
    this.eyes.instanceMatrix.needsUpdate = true;
  }

  // Для скримера: куча мышей прямо перед глазами
  scareObject() {
    if (!this.scareGroup) {
      this.scareGroup = new THREE.Group();
      const eyeMat = new THREE.MeshBasicMaterial({ color: "#ff2a10" });
      for (let i = 0; i < 16; i++) {
        const m = new THREE.Mesh(this.geo, this.mat);
        m.position.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.3);
        m.rotation.set(-1.2 + Math.random() * 0.4, Math.PI + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.6);
        m.scale.setScalar(1.6 + Math.random());
        for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), eyeMat); e.position.set(s * 0.03, 0.105, 0.17); m.add(e); }
        this.scareGroup.add(m);
      }
      this.scareGroup.traverse((x) => { x.userData.noRay = true; });
      this.holder = new THREE.Group(); this.holder.add(this.scareGroup);
    }
    return this.holder;
  }
  get scareScale() { return 1; }
  onScare(on) { if (!on) this.holder?.removeFromParent(); }
}
