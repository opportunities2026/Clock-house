// В-1, ВОРОНА — огромная злая механическая птица. Летает по гнезду под крышей,
// видит в темноте и бросается на Роберта. Обожает всё блестящее:
// положи приманку в клетку — и она сама туда залезет.
import * as THREE from "three";
import * as T from "./textures.js";
import { sfx, movingLoop } from "./audio.js";
import { CELL } from "./world.js";
import { Chaser } from "./chaser.js";

const FLY_Y = 2.05;

export class Crow extends Chaser {
  constructor(opts) {
    super({ ...opts, cfg: { flies: true, radius: 0.5, catchDist: 0.95, ...opts.cfg } });
    const { scene, G } = opts;
    this.mesh = this.build();
    this.scareScale = 0.75;
    scene.add(this.mesh);
    this.sound = null;
    this.reset();
    if (G.is(this.cfg.trapFlag)) this.sitInTrap();
    G.onFlag(this.cfg.baitFlag, () => this.lure());
  }

  build() {
    const g = new THREE.Group();
    const black = T.metal("#141418", 0.4), dark = T.metal("#26262c", 0.45), steel = T.metal("#5a5a62", 0.3), brass = T.metal("#a07a3e", 0.35);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 16), black);
    body.scale.set(0.85, 0.8, 1.45); g.add(body);
    // пластины-перья на спине
    for (let row = 0; row < 6; row++) for (let k = -2; k <= 2; k++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.22), row % 2 ? dark : black);
      f.position.set(k * 0.11, 0.3 - Math.abs(k) * 0.05, 0.35 - row * 0.15); f.rotation.set(-0.25, 0, k * 0.25); g.add(f);
    }
    // открытый бок с шестерёнками и красным светом внутри
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshBasicMaterial({ color: "#ff3010" }));
    core.position.set(0, -0.12, 0.2); g.add(core); this.core = core;
    const head = new THREE.Group(); head.position.set(0, 0.22, 0.62); g.add(head); this.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), black); skull.scale.set(0.9, 0.9, 1.1); head.add(skull);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 8), steel); beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.03, 0.42); beak.scale.set(1, 1, 0.7); head.add(beak);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.07, 0.15); head.add(jaw); this.jaw = jaw;
    const lower = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 8), dark); lower.rotation.x = Math.PI / 2; lower.position.z = 0.22; lower.scale.set(1, 1, 0.5); jaw.add(lower);
    this.eyeMat = new THREE.MeshStandardMaterial({ color: "#ff4020", emissive: "#ff1a00", emissiveIntensity: 2.5 });
    for (const s of [-1, 1]) {
      const socket = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 18), brass); socket.position.set(s * 0.14, 0.06, 0.13); socket.rotation.y = s * 0.7; head.add(socket);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), this.eyeMat); eye.position.set(s * 0.14, 0.06, 0.12); head.add(eye);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.06), black); brow.position.set(s * 0.12, 0.13, 0.15); brow.rotation.z = s * 0.45; head.add(brow);
    }
    // крылья: длинные стальные перья
    this.wings = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.3, 0.15, 0.1); g.add(pivot);
      for (let k = 0; k < 9; k++) {
        const len = 1.1 - k * 0.07;
        const f = new THREE.Mesh(new THREE.BoxGeometry(len, 0.018, 0.12), k % 2 ? dark : black);
        f.position.set(s * (len / 2 + 0.05), -k * 0.01, 0.2 - k * 0.1); f.rotation.y = -s * (k * 0.07 - 0.1);
        pivot.add(f);
      }
      this.wings.push({ pivot, s });
    }
    // хвост веером
    for (let k = -3; k <= 3; k++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.014, 0.7), k % 2 ? dark : black);
      f.position.set(k * 0.06, 0.02, -0.85); f.rotation.y = k * 0.13; f.rotation.x = 0.15; g.add(f);
    }
    // лапы с когтями
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.35, 6), steel); leg.position.set(s * 0.15, -0.45, 0.05); g.add(leg);
      for (let c = -1; c <= 1; c++) { const claw = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.14, 5), steel); claw.position.set(s * 0.15 + c * 0.04, -0.62, 0.12); claw.rotation.x = 1.9; g.add(claw); }
    }
    this.light = new THREE.PointLight("#ff3018", 3, 7, 2); this.light.position.set(0, 0, 1.0); g.add(this.light);
    g.traverse((o) => { o.userData.noRay = true; });
    return g;
  }

  lookOffset() { return this.head.rotation.y; }

  onAlert(on) {
    this.eyeMat.emissiveIntensity = on ? 4 : 2.5;
    this.light.intensity = on ? 5 : 3;
    if (on) sfx.crowCaw?.(this.mesh.position.clone());
  }

  reset() {
    if (this.state === "trapped") return;
    this.resetChaser();
    this.mesh.position.y = FLY_Y;
    this.cawTimer = 6 + Math.random() * 6;
    this.flapTimer = 0;
    this.onAlert(false);
    if (this.G.is(this.cfg.baitFlag)) this.lure(); // приманка уже в клетке
  }

  trapPos() { const [x, z] = this.cfg.trap; return [x * CELL, z * CELL]; }

  // Блестящая приманка в клетке: Ворона забывает о Роберте и летит туда
  lure() {
    if (this.state === "trapped" || this.state === "lured") return;
    if (this.state === "chase") this.onLost?.();
    this.onAlert(false);
    this.state = "lured";
    const [tx, tz] = this.trapPos();
    this.setRoute(this.path(this.cellOf(this.mesh.position.x, this.mesh.position.z), this.cellOf(tx, tz)));
    sfx.crowCaw?.(this.mesh.position.clone());
  }

  sitInTrap() {
    const [tx, tz] = this.trapPos();
    this.mesh.position.set(tx, 0.75, tz);
    this.state = "trapped"; this.vel.set(0, 0);
    this.mesh.scale.setScalar(0.8);
    this.yaw = this.cfg.trapYaw || 0;
    this.onAlert(false);
  }

  update(dt, time) {
    const p = this.mesh.position;
    if (!this.sound) this.sound = movingLoop();
    if (this.state === "lured") {
      if (this.followRoute(dt, this.cfg.speed * 1.5)) {
        const [tx, tz] = this.trapPos();
        const d = this.steer(dt, tx, tz, 1.5);
        p.y += (0.75 - p.y) * Math.min(1, dt * 2);
        if (d < 0.15 && p.y < 0.85) { this.sitInTrap(); this.G.flag(this.cfg.trapFlag); }
      }
    } else if (this.state !== "trapped" && this.state !== "caught") {
      this.think(dt);
      if (this.state === "patrol") {
        this.cawTimer -= dt;
        if (this.cawTimer <= 0) { this.cawTimer = 10 + Math.random() * 10; sfx.crowCaw?.(p.clone(), 0.6); }
      }
    }
    const chasing = this.state === "chase", trapped = this.state === "trapped";
    this.mesh.rotation.y = this.yaw;
    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, trapped ? -0.1 : Math.min(0.35, this.vel.length() * 0.1), Math.min(1, dt * 4));
    if (!trapped) {
      if (this.state !== "lured") p.y = FLY_Y + Math.sin(time * 2.2) * 0.1 - (chasing ? 0.35 : 0);
      const fs = chasing ? 11 : 6;
      for (const w of this.wings) { w.pivot.rotation.z = w.s * (Math.sin(time * fs) * 0.6 + 0.1); w.pivot.rotation.y = 0; }
      this.head.rotation.y = chasing ? Math.sin(time * 19) * 0.05 : Math.sin(time * 0.7) * 0.8;
      this.jaw.rotation.x = chasing ? 0.25 + Math.sin(time * 9) * 0.2 : 0.02;
      this.flapTimer -= dt;
      if (this.flapTimer <= 0) { this.flapTimer = chasing ? 0.42 : 0.9; sfx.flap(p.clone()); sfx.flap(p.clone()); }
    } else {
      // сидит в клетке, крылья сложены, злобно дёргает головой
      for (const w of this.wings) { w.pivot.rotation.z = w.s * -0.15; w.pivot.rotation.y = w.s * 1.35; } // крылья сложены вдоль спины
      this.head.rotation.y = Math.sin(time * 3) * 0.4 + (Math.sin(time * 0.5) > 0.9 ? Math.sin(time * 30) * 0.2 : 0);
      this.jaw.rotation.x = Math.max(0, Math.sin(time * 1.3)) * 0.3;
    }
    this.core.material.color.setHSL(0.02, 1, 0.4 + Math.sin(time * (chasing ? 12 : 3)) * 0.12);
    if (this.sound) {
      this.sound.setPos(p);
      this.sound.setGain(trapped ? 0.25 : chasing ? 1.1 : 0.6);
      this.sound.setPitch(chasing ? 1.1 : trapped ? 0.6 : 0.8);
    }
  }
}
