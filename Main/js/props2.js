// Предметы и мебель главы 2: подвал, лабиринт, гнездо Стража.
import * as THREE from "three";
import * as T from "./textures.js";
import { sfx } from "./audio.js";
import { tr } from "./i18n.js";
import { CELL } from "./world.js";
import {
  BUILDERS, box, rbox, cyl, sphere, plane, mats, candle, blobShadow, gearMesh, keyMesh, hitProxy, pickable,
} from "./props.js";

// ------------------------------------------------------------ предметы для инвентаря
export function lanternMesh() {
  const m = mats(), g = new THREE.Group(), iron = T.metal("#2a2a2a", 0.6);
  cyl(0.07, 0.08, 0.025, iron, 0, 0.0125, 0, g, 16);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    cyl(0.005, 0.005, 0.16, iron, Math.cos(a) * 0.06, 0.105, Math.sin(a) * 0.06, g, 6);
  }
  cyl(0.055, 0.055, 0.15, new THREE.MeshStandardMaterial({ color: "#ffe2a8", emissive: "#ffb050", emissiveIntensity: 0.6, transparent: true, opacity: 0.55, roughness: 0.1 }), 0, 0.1, 0, g, 16);
  const f = sphere(0.014, m.flame, 0, 0.09, 0, g, 8); f.scale.y = 2;
  cyl(0.02, 0.075, 0.05, iron, 0, 0.2, 0, g, 16);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 6, 20, Math.PI), iron);
  handle.position.y = 0.225; g.add(handle);
  return g;
}

export function valveMesh() {
  const g = new THREE.Group(), red = T.metal("#9a1e14", 0.5);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.013, 8, 28), red); g.add(rim);
  cyl(0.022, 0.022, 0.03, red, 0, 0, 0, g, 12).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) { const s = box(0.18, 0.012, 0.012, red, 0, 0, 0, g); s.rotation.z = (i * Math.PI) / 4; }
  return g;
}

export function minuteHandMesh(len = 0.36, mat) {
  const sh = new THREE.Shape();
  sh.moveTo(-0.008, -0.05); sh.lineTo(0.008, -0.05); sh.lineTo(0.006, len - 0.06);
  sh.lineTo(0.022, len - 0.06); sh.lineTo(0, len); sh.lineTo(-0.022, len - 0.06); sh.lineTo(-0.006, len - 0.06); sh.closePath();
  const ring = new THREE.Path(); ring.absarc(0, len * 0.55, 0.018, 0, Math.PI * 2, true); sh.holes.push(ring);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false });
  const hm = mat || T.metal("#1a1612", 0.4);
  const mesh = new THREE.Mesh(geo, hm);
  const g = new THREE.Group(); g.add(mesh);
  const deco = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 6, 16), hm);
  deco.position.set(0, len * 0.55, 0.003); g.add(deco);
  return g;
}

// Другие главы могут добавить свои виды предметов (например, гири)
export const ITEM_MESHES = {};

export function itemMesh(id, items) {
  const it = items[id] || {};
  if (ITEM_MESHES[it.icon]) return ITEM_MESHES[it.icon](it);
  if (it.icon === "lantern") return lanternMesh();
  if (it.icon === "valve") { const v = valveMesh(); v.rotation.x = -Math.PI / 2; const g = new THREE.Group(); v.position.y = 0.015; g.add(v); return g; }
  if (it.icon === "hand") { const h = minuteHandMesh(); h.rotation.x = -Math.PI / 2; const g = new THREE.Group(); h.position.y = 0.005; g.add(h); return g; }
  if (it.icon === "gear") { const gm = gearMesh(it.size || 0.08); gm.rotation.x = -Math.PI / 2; const g = new THREE.Group(); g.add(gm); return g; }
  const k = keyMesh(id.startsWith("silver") ? T.metal("#c8ccd2", 0.25) : undefined);
  k.rotation.x = -Math.PI / 2; k.scale.setScalar(1.6);
  const g = new THREE.Group(); k.position.y = 0.01; g.add(k); return g;
}

function noteOn(G, parent, noteId, x, y, z, rot = 0) {
  const p = plane(0.18, 0.24, new THREE.MeshStandardMaterial({ map: T.paperTexture(8), roughness: 0.9 }), x, y, z, parent);
  p.rotation.x = -Math.PI / 2; p.rotation.z = rot;
  hitProxy(p, 0.14);
  G.onTap(p, () => { G.showNote(noteId); return true; });
  return p;
}

// ------------------------------------------------------------ строители
Object.assign(BUILDERS, {

  stairsDecor(def) {
    const g = new THREE.Group(), stone = T.stoneMaterial();
    const n = 6, depth = CELL / n;
    for (let i = 0; i < n; i++) {
      const h = 0.25 * (n - i);
      box(1.4, h, depth, stone, 0, h / 2, i * depth + depth / 2, g);
    }
    // перила
    const m = mats();
    const rail = cyl(0.025, 0.025, 2.2, m.dark, 0.68, 1.5, CELL / 2, g, 8);
    rail.rotation.x = -Math.atan2(1.5, CELL);
    blobShadow(1.4, CELL, g, 0.3);
    return { group: g, w: 1.4, d: CELL, offsetZ: CELL / 2 };
  },

  shelf(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.2, Hs = 1.6, D = 0.35, wood = T.woodMaterial("#4a3420", { seed: 51, rough: 0.9 });
    for (const s of [-1, 1]) box(0.04, Hs, D, wood, s * (W / 2 - 0.02), Hs / 2, 0, g);
    for (const y of [0.1, 0.6, 1.1, 1.58]) box(W, 0.03, D, wood, 0, y, 0, g);
    const r = T.rng(9);
    for (let i = 0; i < 6; i++) {
      const jr = 0.04 + r() * 0.03, jh = 0.12 + r() * 0.1, y = i < 3 ? 0.115 : 1.115;
      cyl(jr, jr, jh, new THREE.MeshStandardMaterial({ color: ["#6a7a5a", "#8a6a3a", "#5a4a3a"][i % 3], transparent: true, opacity: 0.8, roughness: 0.2 }), -0.45 + (i % 3) * 0.3, y + jh / 2, -0.05, g, 12);
    }
    if (def.item) {
      const it = itemMesh(def.item, G.items);
      it.position.set(0.05, 0.615, 0.04);
      g.add(it);
      pickable(G, it, def.item);
    }
    blobShadow(W, D, g, 0.4);
    return { group: g, w: W, d: D };
  },

  table(def, G) {
    const m = mats(), g = new THREE.Group();
    const wood = T.woodMaterial("#5a4028", { seed: 52, vertical: false, rough: 0.9 });
    rbox(1.0, 0.05, 0.6, 0.01, wood, 0, 0.75, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.06, 0.73, 0.06, m.dark, sx * 0.44, 0.365, sz * 0.24, g);
    G.flames.push(candle(g, 0.35, 0.775, -0.15, 0.1));
    if (def.note) noteOn(G, g, def.note, -0.1, 0.778, 0.05, 0.2);
    blobShadow(1.0, 0.6, g, 0.45);
    return { group: g, w: 1.0, d: 0.6 };
  },

  barrel(def, G) {
    const m = mats(), g = new THREE.Group();
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.27 + Math.sin(t * Math.PI) * 0.05, t * 0.85)); }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), T.woodMaterial("#5a3a20", { seed: 53, rough: 0.85 }));
    g.add(body);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), T.woodMaterial("#4a3018", { seed: 54, vertical: false }));
    top.rotation.x = -Math.PI / 2; top.position.y = 0.85; g.add(top);
    for (const y of [0.1, 0.32, 0.53, 0.75]) {
      const r = 0.27 + Math.sin((y / 0.85) * Math.PI) * 0.05 + 0.004;
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 32), T.metal("#3a3a3a", 0.6));
      hoop.rotation.x = Math.PI / 2; hoop.position.y = y; g.add(hoop);
    }
    if (def.tilt) g.rotation.z = 0.05;
    blobShadow(0.6, 0.6, g);
    G.onTap(g, () => { G.say("barrelMsg"); return true; });
    return { group: g, w: 0.62, d: 0.62 };
  },

  wineRack(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.3, Hr = 1.8, D = 0.35;
    for (const s of [-1, 1]) box(0.05, Hr, D, m.dark, s * (W / 2 - 0.025), Hr / 2, 0, g);
    box(W, 0.04, D, m.dark, 0, Hr, 0, g);
    const rows = 6, cols = 6, bottles = [];
    for (let rI = 0; rI < rows; rI++) {
      box(W - 0.1, 0.02, D, m.mid, 0, 0.1 + rI * 0.28, 0, g);
      for (let c = 0; c < cols; c++) if ((rI * 7 + c * 3) % 5) bottles.push([-W / 2 + 0.15 + c * 0.2, 0.17 + rI * 0.28]);
    }
    const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), new THREE.MeshStandardMaterial({ color: "#1a2a14", roughness: 0.15, metalness: 0.3 }), bottles.length);
    const o = new THREE.Object3D();
    bottles.forEach(([x, y], i) => { o.position.set(x, y, 0); o.rotation.set(Math.PI / 2, 0, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    g.add(im);
    blobShadow(W, D, g, 0.4);
    G.onTap(g, () => { G.say("wineMsg"); return true; });
    return { group: g, w: W, d: D };
  },

  chalkArrows(def, G) {
    const g = new THREE.Group();
    const p = plane(0.9, 0.45, new THREE.MeshBasicMaterial({ map: T.scratchTexture(def.pattern), transparent: true, opacity: 0.9, color: "#bdb6a4" }), 0, 1.35, 0.01, g);
    p.userData.tapPlane = true;
    hitProxy(p, 0.35);
    G.onTap(g, () => { G.showNote(def.note); return true; });
    return { group: g, noCollide: true };
  },

  // Записка, приколотая к стене
  wallNote(def, G) {
    const g = new THREE.Group();
    const p = plane(0.24, 0.32, new THREE.MeshStandardMaterial({ map: T.paperTexture(7), roughness: 0.9, side: THREE.DoubleSide }), 0, def.y || 1.45, 0.012, g);
    p.rotation.z = (def.tilt || 0.08);
    sphere(0.012, T.metal("#8a1e14", 0.4), 0, (def.y || 1.45) + 0.13, 0.02, g, 8);
    hitProxy(p, 0.18);
    G.onTap(g, () => { G.showNote(def.note); return true; });
    return { group: g, noCollide: true };
  },

  // Латунная табличка с надписью на стене
  plaque(def, G) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.35 });
    const p = rbox(0.42, 0.28, 0.015, 0.01, mat, 0, def.y || 1.5, 0.008, g);
    for (const [x, y] of [[-0.18, 0.11], [0.18, 0.11], [-0.18, -0.11], [0.18, -0.11]]) sphere(0.01, T.metal("#5a4426", 0.4), x, (def.y || 1.5) + y, 0.018, g, 6);
    const draw = () => {
      mat.map?.dispose();
      mat.map = T.textTexture(tr(def.lines), { w: 512, h: 340, font: "bold 96px Georgia, serif" });
      mat.needsUpdate = true;
    };
    draw(); G.onLang(draw);
    hitProxy(p, 0.25);
    G.onTap(g, () => { G.showNote(def.note); return true; });
    return { group: g, noCollide: true };
  },

  cobweb(def) {
    const g = new THREE.Group();
    const dir = { nw: [1, 1], ne: [-1, 1], sw: [1, -1], se: [-1, -1] }[def.corner || "nw"];
    const p = plane(1.1, 0.8, new THREE.MeshBasicMaterial({ map: T.cobwebTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide }), 0, 0, 0, g);
    g.position.y = 0; p.position.set(dir[0] * 0.32, 2.62, dir[1] * 0.32);
    p.rotation.y = Math.atan2(dir[0], dir[1]);
    return { group: g, noCollide: true };
  },

  cellarLamp(def, G) {
    const g = new THREE.Group(), iron = T.metal("#2a2622", 0.6);
    box(0.08, 0.2, 0.03, iron, 0, 2.0, 0.015, g);
    const arm = cyl(0.008, 0.008, 0.2, iron, 0, 2.05, 0.1, g, 6); arm.rotation.x = Math.PI / 2;
    const cage = new THREE.Group(); cage.position.set(0, 1.85, 0.2); g.add(cage);
    cyl(0.07, 0.05, 0.02, iron, 0, 0.12, 0, cage, 12);
    cyl(0.05, 0.06, 0.02, iron, 0, -0.08, 0, cage, 12);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; cyl(0.004, 0.004, 0.2, iron, Math.cos(a) * 0.05, 0.02, Math.sin(a) * 0.05, cage, 4); }
    cyl(0.045, 0.045, 0.16, new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ff9a40", emissiveIntensity: 1.2, transparent: true, opacity: 0.8 }), 0, 0.02, 0, cage, 12);
    const l = G.light("#ff9e50", def.power || 5, 8, [0, 1.85, 0.35], g);
    l.userData.flicker = 0.1;
    return { group: g, noCollide: true };
  },

  pipes(def) {
    const g = new THREE.Group(), cu = T.metal("#8a5a3a", 0.45), iron = T.metal("#3a3a3a", 0.55);
    for (const [y, r, mat] of [[2.35, 0.05, cu], [2.6, 0.035, iron]]) {
      const p = cyl(r, r, CELL, mat, 0, y, r + 0.02, g, 12); p.rotation.z = Math.PI / 2;
      for (const x of [-0.6, 0.6]) box(0.03, 0.08, r * 2 + 0.04, iron, x, y, r + 0.02, g);
    }
    const v = cyl(0.04, 0.04, 2.35, cu, 0.4, 1.175, 0.06, g, 12); void v;
    return { group: g, noCollide: true };
  },

  stool(def, G) {
    const m = mats(), g = new THREE.Group();
    cyl(0.2, 0.2, 0.04, m.mid, 0, 0.5, 0, g, 20);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = cyl(0.018, 0.022, 0.5, m.dark, Math.cos(a) * 0.13, 0.25, Math.sin(a) * 0.13, g, 6);
      leg.rotation.z = Math.cos(a) * 0.12; leg.rotation.x = -Math.sin(a) * 0.12;
    }
    if (def.note) noteOn(G, g, def.note, -0.07, 0.523, -0.04, 0.4);
    blobShadow(0.45, 0.45, g);
    return { group: g, w: 0.45, d: 0.45 };
  },

  itemOn(def, G) {
    const g = new THREE.Group();
    const it = itemMesh(def.item, G.items);
    it.position.set(def.dx || 0, 0, def.dz || 0);
    g.add(it);
    pickable(G, it, def.item);
    G.every((dt, time) => { it.rotation.y = Math.sin(time * 0.7) * 0.15; });
    return { group: g, noCollide: true };
  },

  // Шкаф, в котором можно спрятаться от Стража
  wardrobe(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.0, Hw = 2.1, D = 0.55, wood = T.woodMaterial("#4a2e1a", { seed: 61 });
    box(W, Hw, 0.03, wood, 0, Hw / 2, -D / 2 + 0.015, g);
    for (const s of [-1, 1]) box(0.03, Hw, D, wood, s * (W / 2 - 0.015), Hw / 2, 0, g);
    rbox(W + 0.06, 0.08, D + 0.04, 0.01, m.dark, 0, Hw + 0.04, 0, g);
    box(W, 0.1, D, m.dark, 0, 0.05, 0, g);
    const doors = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * (W / 2 - 0.02), 0, D / 2 - 0.01); g.add(pivot);
      const dw = W / 2 - 0.025;
      const leaf = new THREE.Group(); leaf.position.x = -s * dw / 2; pivot.add(leaf);
      // рама створки и щели-жалюзи
      for (const x of [-dw / 2 + 0.03, dw / 2 - 0.03]) box(0.06, Hw - 0.14, 0.025, wood, x, Hw / 2 + 0.02, 0, leaf);
      for (const y of [0.13, Hw - 0.06, 1.05]) box(dw, 0.07, 0.025, wood, 0, y, 0, leaf);
      for (let k = 0; k < 9; k++) {
        const slat = box(dw - 0.1, 0.035, 0.012, wood, 0, 1.17 + k * 0.085, 0, leaf); slat.rotation.x = -0.6;
        const slat2 = box(dw - 0.1, 0.035, 0.012, wood, 0, 0.22 + k * 0.09, 0, leaf); slat2.rotation.x = -0.6;
      }
      sphere(0.018, m.brass, -s * (dw / 2 - 0.06), 1.05, 0.025, leaf, 10);
      doors.push({ pivot, s });
    }
    blobShadow(W, D, g, 0.5);
    const setDoors = (a) => doors.forEach((d) => { d.pivot.rotation.y = -d.s * a; });
    G.addHide(def.id, g, { pos: [0, 1.45, 0.02], target: [0, 1.4, 2.0] }, {
      open() { sfx.wardrobe(G.worldPos(g, [0, 1, 0.3])); G.tween(0.3, (k) => setDoors(1.2 * k)); },
      close() { G.tween(0.35, (k) => setDoors(1.2 * (1 - k))); },
    });
    return { group: g, w: W, d: D };
  },

  // Кот Тик — подсказчик. Сидит в разных местах в зависимости от того, что уже сделано.
  cat(def, G) {
    const g = new THREE.Group();
    const fur = T.fabricMaterial("#2e2a28", 71), light = T.fabricMaterial("#d8d0c4", 72);
    const body = sphere(0.13, fur, 0, 0.14, 0, g, 16); body.scale.set(0.9, 1.1, 1.3);
    const chest = sphere(0.07, light, 0, 0.17, 0.12, g, 12); chest.scale.set(1, 1.3, 0.6);
    for (const s of [-1, 1]) { const paw = sphere(0.035, light, s * 0.05, 0.03, 0.15, g, 8); paw.scale.set(1, 0.6, 1.4); }
    const head = new THREE.Group(); head.position.set(0, 0.32, 0.1); g.add(head);
    const skull = sphere(0.085, fur, 0, 0, 0, head, 16); skull.scale.set(1.1, 0.95, 1);
    const muzzle = sphere(0.04, light, 0, -0.025, 0.065, head, 10); muzzle.scale.set(1.2, 0.8, 0.8);
    sphere(0.01, T.plain("#d88a8a", 0.5), 0, -0.01, 0.1, head, 6);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 4), fur);
      ear.position.set(s * 0.05, 0.08, 0); ear.rotation.z = -s * 0.25; head.add(ear);
      const eye = sphere(0.016, new THREE.MeshStandardMaterial({ color: "#c8e040", emissive: "#90c020", emissiveIntensity: 0.9, roughness: 0.2 }), s * 0.035, 0.012, 0.072, head, 10);
      eye.scale.z = 0.5;
      sphere(0.007, T.plain("#050505", 0.2), s * 0.035, 0.012, 0.08, head, 6).scale.set(0.5, 1.4, 0.5);
    }
    const tail = new THREE.Group(); tail.position.set(0, 0.06, -0.15); g.add(tail);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.08, 0, -0.1), new THREE.Vector3(0.18, 0.02, -0.05), new THREE.Vector3(0.22, 0.08, 0.06)]);
    tail.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.02, 6), fur));
    blobShadow(0.3, 0.4, g, 0.5);
    hitProxy(g, 0.25);

    let spot = null;
    const pick = () => (def.spots || []).find((s) => !s.until || !G.is(s.until)) || null;
    const place = () => {
      const s = pick();
      if (s === spot) return;
      spot = s;
      g.visible = !!s;
      if (!s) return;
      g.position.set(s.x * CELL, 0, s.z * CELL);
      g.rotation.y = THREE.MathUtils.degToRad(s.rot || 0);
    };
    let check = 0;
    G.every((dt, time) => {
      check -= dt;
      if (check <= 0) { check = 0.5; place(); }
      tail.rotation.y = Math.sin(time * 1.6) * 0.35;
      head.rotation.y = Math.sin(time * 0.4) * 0.3;
      head.rotation.z = Math.sin(time * 0.23) * 0.08;
    });
    G.onTap(g, () => {
      if (!spot) return false;
      const p = G.worldPos(head);
      sfx.meow(p);
      setTimeout(() => sfx.purr(p, 2.2), 650);
      G.say(spot.hint, null, 5000);
      return true;
    });
    G.afterBuild(() => place());
    return { group: g, noCollide: true, placed: true };
  },

  // Затопленный проход: вода стоит, пока не повернут вентиль
  water(def, G) {
    const g = new THREE.Group();
    const tex = T.waterTexture();
    const mat = new THREE.MeshStandardMaterial({ color: "#0e2426", roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.88, bumpMap: tex, bumpScale: 1.2 });
    const surfaces = [];
    for (const [cx, cz] of def.cells) {
      const p = plane(CELL, CELL, mat, (cx + 0.5) * CELL, 0.42, (cz + 0.5) * CELL, g);
      p.rotation.x = -Math.PI / 2;
      G.onTap(p, () => { if (G.is(def.flag)) return false; sfx.splash(G.worldPos(p)); G.say("waterDeep"); return true; });
      surfaces.push(p);
    }
    const setBlocked = (on) => def.cells.forEach(([cx, cz]) => G.setBlocked(cx, cz, on));
    let level = 0.42;
    const apply = () => surfaces.forEach((p) => { p.position.y = level; p.visible = level > 0.01; });
    if (G.is(def.flag)) { level = 0; apply(); } else setBlocked(true);
    G.every((dt, time) => { tex.offset.set(time * 0.02, time * 0.013); });
    G.onFlag(def.flag, () => {
      const pos = G.worldPos(surfaces[0]);
      sfx.drain(pos, 3.5);
      G.tween(3.5, (k) => { level = 0.42 * (1 - k); apply(); }, () => { setBlocked(false); });
    });
    return { group: g, noCollide: true, placed: true };
  },

  // Труба с гнездом для вентиля
  valvePipe(def, G) {
    const g = new THREE.Group(), cu = T.metal("#8a5a3a", 0.45), iron = T.metal("#3a3a3a", 0.55);
    cyl(0.06, 0.06, 2.9, cu, -0.3, 1.45, 0.08, g, 14);
    const h = cyl(0.06, 0.06, 1.0, cu, 0.2, 0.95, 0.08, g, 14); h.rotation.z = Math.PI / 2;
    box(0.16, 0.16, 0.16, iron, -0.3, 0.95, 0.08, g);
    const stem = cyl(0.02, 0.02, 0.18, iron, 0.1, 0.95, 0.2, g, 8); stem.rotation.x = Math.PI / 2;
    const flange = cyl(0.085, 0.085, 0.03, iron, 0.1, 0.95, 0.13, g, 16); flange.rotation.x = Math.PI / 2;
    const wheel = valveMesh(); wheel.position.set(0.1, 0.95, 0.27); g.add(wheel);
    const placedFlag = "placed:" + def.item;
    wheel.visible = G.is(placedFlag) || G.is(def.flag);
    // капли воды
    const drip = sphere(0.008, new THREE.MeshStandardMaterial({ color: "#8ab0c0", roughness: 0.05, metalness: 0.3 }), 0.6, 0.88, 0.08, g, 6);
    G.every((dt, time) => { const k = (time * 0.8) % 1; drip.position.y = 0.88 - k * 0.88; drip.visible = !G.is(def.flag); });
    let turning = false;
    const tap = () => {
      if (G.is(def.flag) || turning) return false;
      if (!wheel.visible) {
        if (!G.has(def.item)) { sfx.locked(G.worldPos(stem)); G.say("needValve", null, 2600); return true; }
        G.take(def.item); G.flag(placedFlag);
        wheel.visible = true; wheel.position.z = 0.4;
        G.tween(0.35, (k) => { wheel.position.z = 0.4 - 0.13 * k; }, () => sfx.metal(G.worldPos(wheel)));
        G.say("valvePlaced", null, 2200);
        return true;
      }
      turning = true;
      sfx.lidOpen(G.worldPos(wheel));
      G.tween(2.0, (k) => { wheel.rotation.z = -k * Math.PI * 4; }, () => {
        G.flag(def.flag);
        G.say("waterGone", null, 3000);
        G.exitInspect(800);
      });
      return true;
    };
    G.onTap(g, tap, { owner: def.id });
    hitProxy(wheel, 0.12);
    G.addInspect(def.id, g, { pos: [0.1, 1.15, 0.85], target: [0.1, 0.95, 0.1] }, null, () => !G.is(def.flag));
    return { group: g, noCollide: true };
  },

  // Большие часы в гнезде: поставь 12:00 — и Страж уснёт
  nestClock(def, G) {
    const m = mats(), g = new THREE.Group();
    const R = 0.45, y = 1.85, z = 0.06;
    const caseMesh = cyl(R + 0.08, R + 0.08, 0.1, m.dark, 0, y, 0.05, g, 48); caseMesh.rotation.x = Math.PI / 2;
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.025, 10, 48), m.brass); bezel.position.set(0, y, 0.1); g.add(bezel);
    const face = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshStandardMaterial({ map: T.clockFace(), roughness: 0.5 }));
    face.position.set(0, y, 0.101); g.add(face);
    // маятник под часами
    const pend = new THREE.Group(); pend.position.set(0, y - R - 0.05, 0.06); g.add(pend);
    box(0.015, 0.6, 0.01, m.brass, 0, -0.3, 0, pend);
    const bob = cyl(0.09, 0.09, 0.02, m.brass, 0, -0.62, 0, pend, 24); bob.rotation.x = Math.PI / 2;
    const pin = cyl(0.02, 0.02, 0.04, m.brass, 0, y, 0.12, g, 12); pin.rotation.x = Math.PI / 2;

    const hourG = new THREE.Group(); hourG.position.set(0, y, 0.11); g.add(hourG);
    const handMat = T.metal("#2a1c10", 0.35);
    const hh = minuteHandMesh(0.25, handMat); hh.scale.set(2.2, 1, 1); hourG.add(hh);
    const hourProxy = box(0.12, 0.28, 0.04, new THREE.MeshBasicMaterial({ visible: false }), 0, 0.12, 0.01, hourG);
    const minG = new THREE.Group(); minG.position.set(0, y, 0.125); g.add(minG);
    const mh = minuteHandMesh(0.38, handMat); mh.scale.set(1.6, 1, 1); minG.add(mh);
    const minProxy = box(0.1, 0.42, 0.04, new THREE.MeshBasicMaterial({ visible: false }), 0, 0.2, 0.01, minG);

    const st = { hour: def.hour || 9, minute: def.minute || 30, placed: G.is("placed:" + def.item) };
    const solved = () => G.is(G.level.owl?.sleepFlag || "owl_asleep");
    if (solved()) { st.hour = (def.target || {}).hour || 12; st.minute = (def.target || {}).minute || 0; st.placed = true; }
    minG.visible = st.placed;
    const angH = () => -((st.hour % 12) / 12 + st.minute / 720) * Math.PI * 2;
    const angM = () => -(st.minute / 60) * Math.PI * 2;
    let tH = angH(), tM = angM();
    hourG.rotation.z = tH; minG.rotation.z = tM;
    G.every((dt, time) => {
      hourG.rotation.z += (tH - hourG.rotation.z) * Math.min(1, dt * 10);
      minG.rotation.z += (tM - minG.rotation.z) * Math.min(1, dt * 10);
      pend.rotation.z = Math.sin(time * 2.4) * 0.12;
    });
    const target = def.target || { hour: 12, minute: 0 };
    const check = () => {
      if (st.placed && st.hour === target.hour && st.minute === target.minute && !solved()) {
        setTimeout(() => {
          sfx.bong(G.worldPos(face), 3);
          G.say("midnight", null, 3500);
          G.flag(G.level.owl?.sleepFlag || "owl_asleep");
          G.exitInspect(1500);
        }, 500);
      }
    };
    const id = def.id;
    const placeHand = () => {
      G.take(def.item); G.flag("placed:" + def.item); st.placed = true; minG.visible = true;
      sfx.metal(G.worldPos(face)); G.say("handPlaced", null, 3000);
    };
    G.onTap(hourProxy, () => {
      if (solved()) return false;
      if (!st.placed && G.has(def.item)) { placeHand(); return true; }
      st.hour = (st.hour % 12) + 1; tH = closest(tH, angH());
      sfx.click(G.worldPos(face), 0.8); check(); return true;
    }, { owner: id });
    G.onTap(minProxy, () => {
      if (solved() || !st.placed) return false;
      st.minute = (st.minute + 15) % 60; tM = closest(tM, angM()); tH = closest(tH, angH());
      sfx.click(G.worldPos(face), 1.1); check(); return true;
    }, { owner: id });
    G.onTap(g, () => {
      if (solved()) { G.say("clockDone"); return true; }
      if (!st.placed) {
        if (G.has(def.item)) placeHand();
        else G.say("clockNoHand", null, 3000);
        return true;
      }
      G.say("clockHint", null, 3000);
      return true;
    }, { owner: id });
    G.addInspect(id, g, { pos: [0, y, 1.25], target: [0, y, 0] });
    return { group: g, noCollide: true };

    // ближайший угол к текущему, чтобы стрелка крутилась по часовой
    function closest(cur, target) {
      while (target > cur + 1e-4) target -= Math.PI * 2;
      while (target < cur - Math.PI * 2 + 1e-4) target += Math.PI * 2;
      return target;
    }
  },

  // Гнездо Стража на столбе. Когда сова уснёт, сюда падает ключ.
  perch(def, G) {
    const m = mats(), g = new THREE.Group();
    cyl(0.25, 0.3, 0.08, m.brass, 0, 0.04, 0, g, 24);
    cyl(0.05, 0.06, 1.35, m.dark, 0, 0.72, 0, g, 12);
    const nest = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), T.fabricMaterial("#8a6a3a", 81));
    nest.position.y = 1.62; nest.material.side = THREE.DoubleSide; g.add(nest);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.04, 8, 28), T.fabricMaterial("#7a5a2a", 82));
    rim.rotation.x = Math.PI / 2; rim.position.y = 1.62; g.add(rim);
    blobShadow(0.6, 0.6, g);
    const owlCfg = G.level.owl || {};
    if (owlCfg.dropItem) {
      const key = itemMesh(owlCfg.dropItem, G.items);
      key.scale.setScalar(1.5);
      key.position.set(0.25, 0.01, -0.55);   // падает на сторону, откуда подходит Роберт
      g.add(key);
      key.visible = G.is("owl_landed");
      pickable(G, key, owlCfg.dropItem);
      G.onFlag("owl_landed", () => {
        key.visible = true; key.position.y = 1.5;
        sfx.metal(G.worldPos(g, [0.3, 0.2, 0.3]));
        G.tween(0.5, (k) => { key.position.y = 1.5 - 1.49 * k * k; }, () => sfx.click(G.worldPos(key), 1.4));
      });
    }
    g.userData.perchTop = new THREE.Vector3(0, 1.75, 0);
    G.onTap(g, () => { G.say(G.is("owl_landed") ? "owlSleepsMsg" : "perchMsg"); return true; });
    return { group: g, w: 0.55, d: 0.55 };
  },
});

export { tr };
