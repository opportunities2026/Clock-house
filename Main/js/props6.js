// Предметы главы 6 «Гнездо Вороны»: ящик с огоньками, клетка-ловушка,
// гнездо с блестяшками, лебёдка, клетка с дедушкой, ящики-укрытия.
import * as THREE from "three";
import * as T from "./textures.js";
import { sfx } from "./audio.js";
import { BUILDERS, box, rbox, cyl, sphere, mats, blobShadow, hitProxy, pickable } from "./props.js";
import { itemMesh, ITEM_MESHES } from "./props2.js";
import { LOCKS } from "./doors.js";

const iron = () => T.metal("#2a2a2c", 0.55);
const gold = () => T.metal("#e0b040", 0.2);

// Золотые карманные часы — блестящая приманка
function watchMesh() {
  const g = new THREE.Group();
  cyl(0.045, 0.045, 0.014, gold(), 0, 0.007, 0, g, 24);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.038, 24), new THREE.MeshStandardMaterial({ map: T.clockFace(), roughness: 0.3 }));
  face.rotation.x = -Math.PI / 2; face.position.y = 0.0145; g.add(face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.004, 6, 12), gold()); ring.position.set(0, 0.007, -0.055); ring.rotation.x = Math.PI / 2; g.add(ring);
  return g;
}

Object.assign(ITEM_MESHES, { watch: () => watchMesh() });

// Блестяшки для гнезда: монеты, ложка, кольцо, колокольчик, напёрсток…
const SHINY = [
  (g) => { cyl(0.035, 0.035, 0.006, gold(), 0, 0.003, 0, g, 18); },
  (g) => { const s = new THREE.Group(); cyl(0.008, 0.008, 0.16, T.metal("#d0d4da", 0.15), 0, 0, 0, s, 6).rotation.z = Math.PI / 2; const b = sphere(0.025, T.metal("#d0d4da", 0.15), 0.09, 0, 0, s, 10); b.scale.set(1.4, 0.4, 1); s.position.y = 0.012; g.add(s); },
  (g) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 20), gold()); r.rotation.x = Math.PI / 2 - 0.3; r.position.y = 0.01; g.add(r); },
  (g) => { const b = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 14, 1, true), T.metal("#c09a5c", 0.2)); b.position.y = 0.03; g.add(b); },
  (g) => { cyl(0.018, 0.022, 0.035, T.metal("#d0d4da", 0.15), 0, 0.017, 0, g, 12); },
  (g) => { const k = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), new THREE.MeshStandardMaterial({ color: "#a0e0ff", metalness: 0.2, roughness: 0.05, emissive: "#204050", emissiveIntensity: 0.3 })); k.position.y = 0.03; g.add(k); },
  (g) => { cyl(0.03, 0.03, 0.006, T.metal("#d0d4da", 0.15), 0, 0.003, 0, g, 18); },
  (g) => { const b = box(0.07, 0.012, 0.03, gold(), 0, 0.006, 0, g); b.rotation.y = 0.4; },
];

Object.assign(BUILDERS, {

  // Ящик с огоньками: нажатие переключает лампочку и её соседей.
  // Зажги все — и ящик откроется.
  lightsBox(def, G) {
    const m = mats(), g = new THREE.Group();
    const N = def.size || 3, W = 0.5, y0 = 0.78;
    rbox(0.8, 0.04, 0.6, 0.01, m.mid, 0, 0.74, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, 0.72, 0.04, m.dark, sx * 0.34, 0.36, sz * 0.24, g);
    blobShadow(0.8, 0.6, g, 0.45);
    const wood = T.woodMaterial("#2a1a10", { seed: 66, vertical: false, rough: 0.4 });
    box(W, 0.14, W, wood, 0, y0 + 0.07, 0, g);
    const lid = new THREE.Group(); lid.position.set(0, y0 + 0.14, -W / 2); g.add(lid);
    rbox(W + 0.02, 0.03, W + 0.02, 0.008, wood, 0, 0.015, W / 2, lid);
    const flag = def.flag || "open:" + def.id;
    let solved = G.is(flag);
    // начальное поле — из «всё горит» несколько нажатий (так оно точно решается)
    const r = T.rng(def.seed || 21);
    const on = new Array(N * N).fill(true);
    const press = (i) => {
      const x = i % N, z = Math.floor(i / N);
      for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (nx >= 0 && nz >= 0 && nx < N && nz < N) on[nz * N + nx] = !on[nz * N + nx];
      }
    };
    if (!solved) { const used = new Set(); while (used.size < (def.presses || 4)) used.add(Math.floor(r() * N * N)); used.forEach(press); }
    const sp = (W - 0.12) / (N - 1);
    const lamps = [];
    for (let i = 0; i < N * N; i++) {
      const x = (i % N - (N - 1) / 2) * sp, z = (Math.floor(i / N) - (N - 1) / 2) * sp;
      const btn = new THREE.Group(); btn.position.set(x, 0.03, W / 2 + z); lid.add(btn);
      cyl(0.05, 0.055, 0.015, T.metal("#c09a5c", 0.3), 0, 0, 0, btn, 18);
      const mat = new THREE.MeshStandardMaterial({ color: "#402010", emissive: "#ffb040", emissiveIntensity: 0, roughness: 0.3 });
      const bulb = sphere(0.035, mat, 0, 0.015, 0, btn, 12); bulb.scale.y = 0.6;
      lamps.push({ mat, btn });
      hitProxy(btn, 0.06);
      G.onTap(btn, () => {
        if (solved) return true;
        press(i); show(); sfx.click(G.worldPos(btn), 1 + (i % 3) * 0.1);
        G.tween(0.12, (k) => { btn.position.y = 0.03 - Math.sin(k * Math.PI) * 0.008; });
        if (on.every(Boolean)) {
          solved = true; G.flag(flag);
          sfx.crystal(G.worldPos(lid));
          setTimeout(() => { sfx.lidOpen(G.worldPos(lid)); G.tween(1.0, (k) => { lid.rotation.x = -1.9 * k; }); G.say("lightsDone", null, 2600); }, 700);
        }
        return true;
      }, { owner: def.id });
    }
    const show = () => lamps.forEach((l, i) => { const lit = solved || on[i]; l.mat.emissiveIntensity = lit ? 2.2 : 0; l.mat.color.set(lit ? "#ffd080" : "#402010"); });
    show();
    if (solved) lid.rotation.x = -1.9;
    G.debug = { ...(G.debug || {}), lights: { on, press } };
    (def.contents || []).forEach((id, i) => {
      const it = itemMesh(id, G.items);
      it.position.set((i - ((def.contents.length - 1) / 2)) * 0.16, y0 + 0.02, 0);
      g.add(it);
      pickable(G, it, id, def.id, () => G.is(flag));
    });
    G.addInspect(def.id, g, { pos: [0, 1.5, 0.45], target: [0, y0 + 0.1, 0.02] }, () => { if (!solved) G.say("lightsHint", null, 3200); });
    return { group: g, w: 0.8, d: 0.6 };
  },

  // Большая клетка-ловушка. Положи внутрь блестящее — и жди.
  trapCage(def, G) {
    const g = new THREE.Group(), ir = iron();
    const R = 0.75, Hc = 1.8;
    cyl(R + 0.05, R + 0.05, 0.08, ir, 0, 0.04, 0, g, 24);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.03, 6, 32), ir); ring.rotation.x = Math.PI / 2; ring.position.y = Hc; g.add(ring);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#2a2a2c", metalness: 0.6, roughness: 0.5, wireframe: true })); dome.position.y = Hc; g.add(dome);
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      if (Math.abs(Math.sin(a / 2 - Math.PI / 2)) < 0.2) continue; // проём спереди
      cyl(0.015, 0.015, Hc, ir, Math.sin(a) * R, Hc / 2, Math.cos(a) * R, g, 6);
    }
    // падающая решётка-дверца спереди
    const door = new THREE.Group(); g.add(door);
    for (let k = -2; k <= 2; k++) cyl(0.017, 0.017, Hc, ir, k * 0.11, Hc / 2, R + 0.02, door, 6);
    for (const y of [0.3, 1.0, 1.6]) box(0.55, 0.03, 0.03, ir, 0, y, R + 0.02, door);
    const rope = cyl(0.01, 0.01, 1.0, T.plain("#8a7050", 0.9), 0, Hc + 0.5, R + 0.02, g, 5);
    const bait = watchMesh(); bait.position.set(0, 0.09, 0); bait.scale.setScalar(1.8); g.add(bait);
    const baitFlag = def.baitFlag, trapFlag = def.trapFlag;
    const up = () => { door.position.y = Hc - 0.15; rope.scale.y = 0.4; rope.position.y = Hc + 0.8; };
    const down = () => { door.position.y = 0; rope.scale.y = 1; rope.position.y = Hc + 0.5; };
    if (G.is(trapFlag)) down(); else up();
    bait.visible = G.is(baitFlag) && !G.is(trapFlag);
    G.every((dt, time) => { if (bait.visible) bait.rotation.y = time * 0.8; });
    G.onFlag(trapFlag, () => {
      bait.visible = false;
      sfx.metal(G.worldPos(g, [0, 1, 0]));
      G.tween(0.25, (k) => { door.position.y = (Hc - 0.15) * (1 - k); }, () => { sfx.bong?.(G.worldPos(g, [0, 1, 0]), 1); down(); G.say("crowTrapped", null, 3500); });
    });
    G.onTap(g, () => {
      if (G.is(trapFlag)) { G.say("crowInCage", null, 2400); return true; }
      if (G.is(baitFlag)) { G.say("baitWaiting", null, 2400); return true; }
      if (!G.has(def.item)) { G.say("trapEmpty", null, 3000); return true; }
      G.take(def.item); G.flag(baitFlag); bait.visible = true;
      sfx.click(G.worldPos(bait), 1.4);
      G.say("baitPlaced", null, 3000);
      return true;
    });
    hitProxy(door, 0.3);
    blobShadow(1.7, 1.7, g, 0.5);
    return { group: g, w: 1.6, d: 1.6 };
  },

  // Гнездо из веток и проволоки. В нём — блестяшки (их можно сосчитать).
  nestPile(def, G) {
    const g = new THREE.Group(), r = T.rng(def.seed || 3);
    const twig = T.plain("#3a2a1a", 0.9), wire = T.metal("#6a6a70", 0.4);
    const R = def.r || 1.0;
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, rr = R * (0.65 + r() * 0.4), len = 0.4 + r() * 0.6;
      const t = cyl(0.012, 0.016, len, r() < 0.2 ? wire : twig, Math.cos(a) * rr, 0.05 + r() * 0.3, Math.sin(a) * rr, g, 4);
      t.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.6, 0, a + Math.PI / 2 + (r() - 0.5) * 0.8);
    }
    const bed = new THREE.Mesh(new THREE.CircleGeometry(R * 0.75, 24), T.plain("#2a1e14", 1)); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.06; g.add(bed);
    const n = def.shiny || 0;
    for (let i = 0; i < n; i++) {
      const sg = new THREE.Group();
      const a = (i / n) * Math.PI * 2 + r() * 0.4, rr = R * (0.2 + r() * 0.4);
      sg.position.set(Math.cos(a) * rr, 0.07, Math.sin(a) * rr); sg.rotation.y = r() * 6; sg.scale.setScalar(1.6);
      SHINY[i % SHINY.length](sg); g.add(sg);
    }
    if (def.item) { const it = itemMesh(def.item, G.items); it.position.set(0, 0.08, 0); g.add(it); pickable(G, it, def.item, def.id); }
    G.onTap(g, () => { G.say("nestMsg", null, 2600); return true; }, { owner: def.id });
    G.addInspect(def.id, g, { pos: [0, 1.7, R + 0.4], target: [0, 0.1, 0] });
    return { group: g, w: R * 1.6, d: R * 1.6 };
  },

  // Большой ящик, в который можно залезть и спрятаться
  hideCrate(def, G) {
    const g = new THREE.Group();
    const W = 1.1, Hh = 1.25, D = 0.9, wood = T.woodMaterial("#5a4028", { seed: 71, vertical: false, rough: 0.9 });
    box(W, 0.05, D, wood, 0, 0.025, 0, g);
    box(W, Hh, 0.04, wood, 0, Hh / 2, -D / 2 + 0.02, g);
    for (const s of [-1, 1]) box(0.04, Hh, D, wood, s * (W / 2 - 0.02), Hh / 2, 0, g);
    box(W, 0.04, D, wood, 0, Hh, 0, g);
    // передняя стенка из досок с щелями
    for (let i = 0; i < 4; i++) box(W, 0.2, 0.03, wood, 0, 0.15 + i * 0.3, D / 2 - 0.015, g);
    const flap = new THREE.Group(); flap.position.set(-W / 2 + 0.05, 0, D / 2 + 0.01); g.add(flap);
    box(0.5, 0.55, 0.03, wood, 0.25, 0.3, 0.01, flap);
    blobShadow(W, D, g, 0.5);
    G.addHide(def.id, g, { pos: [0, 0.75, D / 2 - 0.12], target: [0, 0.8, 2.5] }, {
      open() { sfx.wardrobe(G.worldPos(g, [0, 0.5, 0.4])); G.tween(0.3, (k) => { flap.rotation.y = -1.4 * k; }); },
      close() { G.tween(0.3, (k) => { flap.rotation.y = -1.4 * (1 - k); }); },
    });
    return { group: g, w: W, d: D };
  },

  // Лебёдка: когда щиток подключён, рычаг опускает клетку с дедушкой
  winch(def, G) {
    const g = new THREE.Group(), ir = iron(), b = T.metal("#c09a5c", 0.3);
    rbox(1.0, 0.1, 0.6, 0.02, ir, 0, 0.05, 0, g);
    for (const s of [-1, 1]) box(0.08, 0.9, 0.4, ir, s * 0.42, 0.5, 0, g);
    const drum = new THREE.Group(); drum.position.y = 0.75; g.add(drum);
    const dr = cyl(0.2, 0.2, 0.76, T.woodMaterial("#4a2e1a", { seed: 72 }), 0, 0, 0, drum, 20); dr.rotation.z = Math.PI / 2;
    for (let k = 0; k < 9; k++) { const rr = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 6, 20), T.plain("#8a7050", 0.9)); rr.rotation.y = Math.PI / 2; rr.position.x = -0.3 + k * 0.075; drum.add(rr); }
    const lamp = sphere(0.04, new THREE.MeshStandardMaterial({ color: "#400", emissive: "#f00", emissiveIntensity: 0.4 }), 0.42, 1.0, 0.15, g, 10);
    const lever = new THREE.Group(); lever.position.set(0.55, 0.45, 0.1); g.add(lever);
    cyl(0.02, 0.02, 0.6, ir, 0, 0.3, 0, lever, 8);
    sphere(0.045, T.plain("#8a1e14", 0.5), 0, 0.62, 0, lever, 10);
    lever.rotation.z = 0.5;
    const power = () => G.is(def.powerFlag);
    const setLamp = () => { const p = power(); lamp.material.color.set(p ? "#0a0" : "#400"); lamp.material.emissive.set(p ? "#0f0" : "#f00"); lamp.material.emissiveIntensity = p ? 2 : 0.4; };
    setLamp(); G.onFlag(def.powerFlag, setLamp);
    if (G.is(def.flag)) lever.rotation.z = -0.5;
    G.onTap(g, () => {
      if (G.is(def.flag)) { G.say("winchDone", null, 2000); return true; }
      if (!power()) { sfx.locked(G.worldPos(lever)); G.say("winchNoPower", null, 2800); return true; }
      sfx.lever(G.worldPos(lever));
      G.tween(0.5, (k) => { lever.rotation.z = 0.5 - k; }, () => {
        sfx.gearsTurning(G.worldPos(drum), 4);
        G.tween(4, (k) => { drum.rotation.x = k * Math.PI * 8; });
        G.flag(def.flag);
      });
      return true;
    });
    hitProxy(lever, 0.2);
    blobShadow(1.0, 0.6, g, 0.45);
    return { group: g, w: 1.0, d: 0.6 };
  },

  // Клетка с дедушкой. Висит под потолком; на двери — кодовый замок.
  grandpaCage(def, G) {
    const g = new THREE.Group(), ir = iron(), b = T.metal("#c09a5c", 0.3);
    const cage = new THREE.Group(); g.add(cage);
    const R = 0.65, Hc = 2.0, HIGH = 1.0;
    cyl(R + 0.04, R + 0.04, 0.06, ir, 0, 0.03, 0, cage, 24);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.025, 6, 32), ir); ring.rotation.x = Math.PI / 2; ring.position.y = Hc; cage.add(ring);
    cyl(0.04, 0.04, 0.1, ir, 0, Hc + 0.05, 0, cage, 8);
    for (let k = 0; k < 22; k++) { const a = (k / 22) * Math.PI * 2; if (Math.cos(a) > 0.93) continue; cyl(0.013, 0.013, Hc, ir, Math.sin(a) * R, Hc / 2, Math.cos(a) * R, cage, 6); }
    const chain = cyl(0.02, 0.02, 3, ir, 0, Hc + 1.5, 0, g, 6);
    // дедушка
    const man = new THREE.Group(); man.position.set(0, 0.06, -0.05); cage.add(man);
    const coat = T.fabricMaterial("#3a2a3a"), skin = T.plain("#e0b8a0", 0.8), white = T.plain("#e8e4dc", 0.9);
    cyl(0.2, 0.26, 0.85, coat, 0, 0.45, 0, man, 14); // сидит, поджав ноги
    cyl(0.2, 0.2, 0.5, coat, 0, 1.05, 0, man, 14);
    sphere(0.14, skin, 0, 1.42, 0.02, man, 16);
    const beard = sphere(0.12, white, 0, 1.33, 0.08, man, 12); beard.scale.set(1, 1.2, 0.7);
    const hair = sphere(0.145, white, 0, 1.46, -0.02, man, 14); hair.scale.set(1, 0.7, 1);
    for (const s of [-1, 1]) { const gl = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 14), b); gl.position.set(s * 0.05, 1.45, 0.14); man.add(gl); }
    for (const s of [-1, 1]) { const arm = cyl(0.05, 0.05, 0.5, coat, s * 0.24, 1.0, 0.08, man, 8); arm.rotation.x = -0.6; arm.rotation.z = s * 0.2; }
    // дверца с кодовым замком
    const doorG = new THREE.Group(); doorG.position.set(0, 0, R); cage.add(doorG);
    for (let k = -1; k <= 1; k++) cyl(0.015, 0.015, Hc - 0.1, ir, k * 0.1, Hc / 2, 0.02, doorG, 6);
    const lg = new THREE.Group(); lg.position.set(-0.1, 1.1 - 1.12, 0.03); doorG.add(lg);
    const flag = def.flag;
    const pseudo = {
      def: { id: def.id }, isOpen: G.is(flag), solving: false,
      open() {
        if (this.isOpen) return;
        this.isOpen = true;
        sfx.unlock(G.worldPos(doorG, [0, 1.1, 0]));
        G.tween(0.8, (k) => { doorG.rotation.y = -1.6 * k; }, () => G.flag(flag));
        G.exitInspect(900);
      },
    };
    if (pseudo.isOpen) doorG.rotation.y = -1.6;
    LOCKS.code(pseudo, { code: def.code }, lg, G, b);
    const lowered = () => G.is(def.downFlag);
    const setY = (k) => { cage.position.y = HIGH * (1 - k); chain.scale.y = 1 + 0.33 * k; chain.position.y = Hc + 1.5 - HIGH * k * 0.5; };
    setY(lowered() ? 1 : 0);
    G.onFlag(def.downFlag, () => G.tween(4, (k) => setY(k), () => { sfx.bong?.(G.worldPos(cage), 1); setTimeout(() => G.showNote(def.note), 600); }));
    G.every((dt, time) => { if (!lowered()) cage.rotation.y = Math.sin(time * 0.5) * 0.15; else cage.rotation.y *= 0.95; });
    G.onTap(cage, () => {
      if (pseudo.isOpen) { G.say("grandpaHug", null, 2600); return true; }
      if (!lowered()) { G.say("cageHigh", null, 3000); return true; }
      return false; // опущена — заходим рассмотреть замок
    });
    G.addInspect(def.id, g, { pos: [0.05, 1.2, R + 0.6], target: [-0.1, 1.05, R] }, () => G.say("cageLocked", null, 2600), () => lowered() && !pseudo.isOpen);
    blobShadow(1.4, 1.4, g, 0.5);
    return { group: g, w: 1.4, d: 1.4 };
  },
});
