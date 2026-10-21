// СТРАЖ — заводная латунная сова. Облетает лабиринт, замечает Роберта,
// гонится за ним и уносит обратно ко входу. Засыпает в нужное время.
import * as THREE from "three";
import * as T from "./textures.js";
import { sfx, movingLoop } from "./audio.js";
import { CELL } from "./world.js";
import { gearMesh } from "./props.js";
import { Chaser } from "./chaser.js";

const FLY_Y = 1.85;

export class Owl extends Chaser {
  constructor(opts) {
    super({ ...opts, cfg: { flies: true, radius: 0.32, ...opts.cfg } });
    const { scene, G } = opts;
    this.mesh = this.build();
    scene.add(this.mesh);
    this.sound = null;
    this.reset();
    if (G.is(this.cfg.sleepFlag)) {
      this.sleepNow();
      // если игру закрыли, пока сова летела в гнездо, — ключ всё равно должен упасть
      if (!G.is("owl_landed")) G.afterBuild(() => G.flag("owl_landed"));
    }
    G.onFlag(this.cfg.sleepFlag, () => this.goToSleep());
  }

  // ------------------------------------------------------------ внешний вид
  build() {
    const g = new THREE.Group();
    const brass = T.metal("#a07a3e", 0.38), dark = T.metal("#3a2c18", 0.5), light = T.metal("#d8b878", 0.3), iron = T.metal("#2a2622", 0.55);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), dark);
    body.scale.set(1, 1.18, 0.92); g.add(body);
    // чешуя-перья из латунных пластин
    for (let row = 0; row < 5; row++) {
      const y = 0.16 - row * 0.085, rr = 0.235 * Math.sqrt(1 - Math.pow(y / 0.3, 2));
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2 + row * 0.22;
        if (Math.cos(a) > 0.55 && row < 4) continue; // спереди — грудная пластина
        const f = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.095, 0.012), row % 2 ? brass : light);
        f.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr * 0.92);
        f.rotation.y = a; f.rotation.x = 0.35;
        g.add(f);
      }
    }
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12, -0.9, 1.8, 0.5, 1.9), light);
    chest.scale.set(1, 1.2, 1); chest.position.z = 0.05; g.add(chest);
    const chestGear = gearMesh(0.065, brass); chestGear.position.set(0, -0.03, 0.215); g.add(chestGear);
    this.chestGear = chestGear;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: "#ff8030" }));
    glow.position.set(0, -0.03, 0.212); g.add(glow);
    this.glow = glow;

    const head = new THREE.Group(); head.position.y = 0.3; g.add(head); this.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 22, 16), brass);
    skull.scale.set(1.18, 0.95, 1); head.add(skull);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.155, 28), dark);
    face.position.z = 0.158; face.scale.x = 1.3; head.add(face);
    this.eyeMat = new THREE.MeshStandardMaterial({ color: "#ffd060", emissive: "#ffb020", emissiveIntensity: 2.2, roughness: 0.2 });
    this.brows = [];
    for (const s of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.014, 8, 24), light);
      ring.position.set(s * 0.08, 0.01, 0.165); head.add(ring);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 6, 20), iron);
      ring2.position.set(s * 0.08, 0.01, 0.168); head.add(ring2);
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.056, 24), this.eyeMat);
      eye.position.set(s * 0.08, 0.01, 0.166); head.add(eye);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.02, 16), new THREE.MeshBasicMaterial({ color: "#100400" }));
      pupil.position.set(s * 0.08, 0.01, 0.17); head.add(pupil);
      // злые брови — опускаются в погоне
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.04), T.plain("#0a0806", 0.6));
      brow.position.set(s * 0.08, 0.08, 0.18); head.add(brow);
      this.brows.push({ brow, s });
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.15, 4), dark);
      tuft.position.set(s * 0.13, 0.16, 0.02); tuft.rotation.z = -s * 0.55; head.add(tuft);
    }
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.09, 6), iron);
    beak.position.set(0, -0.055, 0.185); beak.rotation.x = Math.PI / 2 + 0.9; head.add(beak);

    this.wings = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.19, 0.1, -0.03); g.add(pivot);
      const wing = new THREE.Group(); pivot.add(wing);
      for (let k = 0; k < 6; k++) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(0.42 - k * 0.05, 0.016, 0.085), k % 2 ? dark : brass);
        f.position.set(s * (0.2 - k * 0.018), -k * 0.03, -k * 0.022);
        f.rotation.y = -s * k * 0.06;
        wing.add(f);
      }
      this.wings.push({ pivot, s });
    }
    // лапы с когтями
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 6), iron);
      leg.position.set(s * 0.07, -0.29, 0.03); g.add(leg);
      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.06, 5), iron);
        claw.position.set(s * 0.07 + c * 0.02, -0.34, 0.06); claw.rotation.x = 1.9; g.add(claw);
      }
    }
    this.light = new THREE.PointLight("#ffb040", 2.5, 6, 2);
    this.light.position.set(0, -0.1, 0.7); g.add(this.light);
    g.traverse((o) => { o.userData.noRay = true; });
    return g;
  }

  lookOffset() { return this.head.rotation.y; }

  onAlert(on) {
    this.eyeMat.emissive.set(on ? "#ff2a08" : "#ffb020");
    this.eyeMat.color.set(on ? "#ff5a30" : "#ffd060");
    this.light.color.set(on ? "#ff3a20" : "#ffb040");
    this.light.intensity = on ? 3.2 : 2.5;
    this.glow.material.color.set(on ? "#ff2a10" : "#ff8030");
    for (const b of this.brows) { b.brow.rotation.z = on ? b.s * 0.6 : 0; b.brow.position.y = on ? 0.065 : 0.08; }
    if (on) sfx.owlScreech(this.mesh.position.clone());
  }

  reset() {
    this.resetChaser();
    this.mesh.position.y = FLY_Y;
    this.hootTimer = 8 + Math.random() * 8;
    this.flapTimer = 0;
    this.onAlert(false);
  }

  sleepNow() {
    const [px, pz] = this.cfg.perch;
    this.mesh.position.set(px * CELL, 1.95, pz * CELL);
    this.state = "sleep";
    this.onAlert(false);
    this.eyeMat.emissiveIntensity = 0.05;
    this.light.intensity = 0;
    this.yaw = 0;
  }

  goToSleep() {
    if (this.state === "sleep") return;
    if (this.state === "chase") this.onLost?.();
    this.onAlert(false);
    this.state = "toPerch";
    const [px, pz] = this.cfg.perch;
    this.setRoute(this.path(this.cellOf(this.mesh.position.x, this.mesh.position.z), [Math.floor(px), Math.floor(pz)]));
    sfx.owl(this.mesh.position.clone());
  }

  update(dt, time) {
    const cfg = this.cfg, p = this.mesh.position;
    if (!this.sound) this.sound = movingLoop();
    const awake = this.state !== "sleep";

    if (this.state === "toPerch") {
      if (this.followRoute(dt, cfg.speed * 1.6)) {
        const [px, pz] = cfg.perch;
        const d = this.steer(dt, px * CELL, pz * CELL, 1.2);
        p.y += (1.95 - p.y) * Math.min(1, dt * 2);
        if (d < 0.08) { this.sleepNow(); this.G.flag("owl_landed"); }
      }
    } else if (awake && this.state !== "caught") {
      this.think(dt);
      if (this.state === "patrol") {
        this.hootTimer -= dt;
        if (this.hootTimer <= 0) { this.hootTimer = 14 + Math.random() * 10; sfx.owl(p.clone()); }
      }
    }

    // ---------------- анимация
    const chasing = this.state === "chase";
    this.mesh.rotation.y = this.yaw;
    // наклон в полёте — чем быстрее, тем сильнее
    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, Math.min(0.4, this.vel.length() * 0.12), Math.min(1, dt * 4));
    if (awake) {
      if (this.state !== "toPerch") p.y = FLY_Y + Math.sin(time * 3) * 0.06 - (chasing ? 0.25 : 0);
      const flapSpeed = chasing ? 17 : 9;
      for (const w of this.wings) w.pivot.rotation.z = w.s * (Math.sin(time * flapSpeed) * 0.75 + 0.2);
      this.head.rotation.y = chasing ? Math.sin(time * 23) * 0.04 : Math.sin(time * 0.9) * 0.7; // в погоне голову трясёт
      this.chestGear.rotation.z += dt * (chasing ? 8 : 2);
      this.eyeMat.emissiveIntensity = chasing ? 3 + Math.sin(time * 18) * 0.8 : 2.2;
      this.flapTimer -= dt;
      if (this.flapTimer <= 0) { this.flapTimer = chasing ? 0.35 : 0.75; sfx.flap(p.clone()); }
    } else {
      for (const w of this.wings) w.pivot.rotation.z = w.s * -0.15;
      this.head.rotation.y = 0;
      this.head.rotation.x = 0.35 + Math.sin(time * 0.8) * 0.03; // клюёт носом во сне
    }
    if (this.sound) {
      this.sound.setPos(p);
      this.sound.setGain(awake ? (chasing ? 1.0 : 0.5) : 0.05);
      this.sound.setPitch(chasing ? 1.45 : awake ? 1 : 0.6);
    }
  }
}
