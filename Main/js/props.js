// Мебель и предметы. Каждый строитель собирает объект из простых фигур
// и (если нужно) подключает к нему загадку.
// Правило: объект стоит в точке (0,0,0) на полу и «смотрит» в сторону +Z.
import * as THREE from "three";
import { RoundedBoxGeometry } from "../lib/addons/RoundedBoxGeometry.js";
import * as T from "./textures.js";
import { sfx, addTicking, addFire } from "./audio.js";
import { tr, t } from "./i18n.js";
import { HEIGHT } from "./world.js";

// ------------------------------------------------------------ помощники
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
export function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), mat);
  m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, parent, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
function sphere(r, mat, x = 0, y = 0, z = 0, parent, seg = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), mat);
  m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
function plane(w, h, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); if (parent) parent.add(m); return m;
}

const M = {};
function mats() {
  if (M.ready) return M;
  M.dark = T.woodMaterial("#3a2212", { seed: 3 });
  M.mid = T.woodMaterial("#5e3c22", { seed: 4 });
  M.light = T.woodMaterial("#8a6a44", { seed: 5, rough: 0.7 });
  M.oak = T.woodMaterial("#6e4a2a", { seed: 6, vertical: false });
  M.brass = T.metal("#c09a5c", 0.3);
  M.gold = T.metal("#c9a25a", 0.45);
  M.iron = T.metal("#45464a", 0.55);
  M.black = T.plain("#0b0908", 0.9);
  M.paper = T.plain("#e9dcbc", 0.9);
  M.candle = T.plain("#f1e6cc", 0.6, { emissive: "#ffcf8a", emissiveIntensity: 0.15 });
  M.flame = new THREE.MeshBasicMaterial({ color: "#ffd38a" });
  M.glass = new THREE.MeshStandardMaterial({ color: "#a8c0c8", roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.18, depthWrite: false });
  M.ready = true;
  return M;
}

// Мягкая тень под мебелью — заменяет дорогие настоящие тени
let shadowTex;
export function blobShadow(w, d, parent, opacity = 0.55) {
  if (!shadowTex) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.6, "rgba(0,0,0,0.6)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.35, d * 1.35),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false, color: 0x000000 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.004; m.renderOrder = -1;
  parent.add(m);
  return m;
}

function candle(parent, x, y, z, h = 0.14) {
  const m = mats();
  cyl(0.025, 0.035, 0.03, M.brass, x, y + 0.015, z, parent);
  cyl(0.016, 0.016, h, m.candle, x, y + 0.03 + h / 2, z, parent);
  const f = sphere(0.012, m.flame, x, y + 0.04 + h, z, parent, 8);
  f.scale.set(1, 2, 1);
  f.userData.flicker = true;
  return f;
}

// Шестерёнка с зубцами (экструзия контура)
const gearCache = new Map();
export function gearGeometry(r, thick = 0.02) {
  const key = r + ":" + thick;
  if (gearCache.has(key)) return gearCache.get(key);
  const teeth = Math.max(8, Math.round(r * 160));
  const sh = new THREE.Shape(), ro = r, ri = r - 0.016;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, step = (Math.PI * 2) / teeth;
    const pts = [[ri, a0], [ro, a0 + step * 0.15], [ro, a0 + step * 0.45], [ri, a0 + step * 0.6]];
    pts.forEach(([rr, a], k) => { const px = Math.cos(a) * rr, py = Math.sin(a) * rr; (i === 0 && k === 0) ? sh.moveTo(px, py) : sh.lineTo(px, py); });
  }
  sh.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.18, 0, Math.PI * 2, true); sh.holes.push(hole);
  // спицы-окошки
  const holes = r > 0.08 ? 5 : 0;
  for (let k = 0; k < holes; k++) {
    const a = (k / holes) * Math.PI * 2, rr = r * 0.55;
    const p = new THREE.Path(); p.absarc(Math.cos(a) * rr, Math.sin(a) * rr, r * 0.17, 0, Math.PI * 2, true); sh.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -thick / 2);
  gearCache.set(key, g);
  return g;
}

export function gearMesh(r, mat) {
  const m = new THREE.Mesh(gearGeometry(r), mat || mats().brass);
  return m;
}

export function keyMesh() {
  const m = mats();
  const g = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 20), m.brass);
  bow.position.x = -0.05; g.add(bow);
  const shaft = cyl(0.004, 0.004, 0.09, m.brass, 0.0, 0, 0, g, 8); shaft.rotation.z = Math.PI / 2;
  box(0.012, 0.018, 0.004, m.brass, 0.035, -0.011, 0, g);
  box(0.006, 0.012, 0.004, m.brass, 0.02, -0.008, 0, g);
  return g;
}

// Невидимая «зона нажатия» побольше самого предмета — маленькие вещи легко взять пальцем
export function hitProxy(obj, minRadius = 0.07) {
  obj.updateMatrixWorld(true);
  const inv = obj.matrixWorld.clone().invert();
  const box = new THREE.Box3();
  obj.traverse((c) => {
    if (!c.isMesh) return;
    c.geometry.computeBoundingBox();
    box.union(c.geometry.boundingBox.clone().applyMatrix4(inv.clone().multiply(c.matrixWorld)));
  });
  const scale = obj.getWorldScale(new THREE.Vector3()).x || 1;
  const r = Math.max(minRadius / scale, (box.getSize(new THREE.Vector3()).length() / 2) * 1.25);
  const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  box.getCenter(p.position);
  obj.add(p);
  return p;
}

// Сделать предмет «подбираемым»
// isOpen — для предметов внутри ящиков и шкатулок: пока закрыто, взять нельзя
function pickable(G, mesh, itemId, owner, isOpen = () => true) {
  if (G.has(itemId) || G.is("got:" + itemId)) { mesh.visible = false; return; }
  const proxy = hitProxy(mesh);
  G.every(() => { proxy.visible = isOpen(); });
  G.onTap(mesh, () => {
    if (!mesh.visible || !isOpen()) return false;
    mesh.visible = false;
    G.give(itemId);
    return true;
  }, { owner });
}

// ------------------------------------------------------------ строители
export const BUILDERS = {

  rug(def) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.d), new THREE.MeshStandardMaterial({ map: T.rugTexture(def.pattern || "red"), roughness: 1 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.006;
    g.add(m);
    return { group: g, noCollide: true };
  },

  chandelier(def, G) {
    const m = mats(), g = new THREE.Group();
    const y = HEIGHT - 0.75;
    cyl(0.008, 0.008, 0.6, m.brass, 0, HEIGHT - 0.3, 0, g, 6);
    cyl(0.12, 0.05, 0.1, m.brass, 0, HEIGHT - 0.05, 0, g);
    sphere(0.08, m.brass, 0, y, 0, g);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.012, 8, 40), m.brass);
    ring.rotation.x = Math.PI / 2; ring.position.y = y - 0.02; g.add(ring);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, x = Math.cos(a) * 0.34, z = Math.sin(a) * 0.34;
      const arm = cyl(0.008, 0.008, 0.34, m.brass, x / 2, y - 0.02, z / 2, g, 6);
      arm.rotation.z = Math.PI / 2; arm.rotation.y = -a;
      G.flames.push(candle(g, x, y - 0.02, z, 0.08));
    }
    const light = G.light("#ffc07a", 13, 14, [0, y - 0.25, 0], g);
    light.userData.flicker = 0.06;
    return { group: g, noCollide: true };
  },

  dresser(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.2, D = 0.5, Hh = 0.95;
    box(0.03, Hh - 0.1, D, m.mid, -W / 2 + 0.015, 0.1 + (Hh - 0.1) / 2, 0, g);
    box(0.03, Hh - 0.1, D, m.mid, W / 2 - 0.015, 0.1 + (Hh - 0.1) / 2, 0, g);
    box(W, Hh - 0.1, 0.02, m.mid, 0, 0.1 + (Hh - 0.1) / 2, -D / 2 + 0.01, g);
    rbox(W + 0.06, 0.035, D + 0.05, 0.01, m.dark, 0, Hh, 0.01, g);
    box(W, 0.1, D - 0.02, m.dark, 0, 0.05, 0, g);
    for (const yy of [0.37, 0.64]) box(W - 0.04, 0.015, D - 0.03, m.mid, 0, yy, 0, g);
    for (const s of [-1, 1]) cyl(0.03, 0.02, 0.05, m.dark, s * (W / 2 - 0.05), 0.025, D / 2 - 0.05, g);
    blobShadow(W, D, g);
    // декор: подсвечник и рамка с фото
    G.flames.push(candle(g, -0.4, Hh + 0.02, 0, 0.16));
    const frame = rbox(0.18, 0.22, 0.02, 0.005, m.gold, 0.3, Hh + 0.13, -0.1, g);
    frame.rotation.x = -0.15;
    const photo = plane(0.14, 0.18, new THREE.MeshStandardMaterial({ map: T.paintingTexture("portrait"), roughness: 0.6 }), 0, 0, 0.011, frame);
    photo.rotation.set(0, 0, 0);

    const drawers = [];
    (def.drawers || [null, null, null]).forEach((itemId, i) => {
      const dg = new THREE.Group();
      const yC = 0.1 + 0.135 + (2 - i) * 0.27;
      dg.position.set(0, yC, 0);
      g.add(dg);
      rbox(W - 0.06, 0.24, 0.025, 0.006, m.oak, 0, 0, D / 2 - 0.0125, dg);
      box(W - 0.1, 0.012, D - 0.06, m.light, 0, -0.1, 0.0, dg);
      for (const s of [-1, 1]) box(0.012, 0.16, D - 0.06, m.light, s * (W / 2 - 0.06), -0.03, 0, dg);
      box(W - 0.1, 0.16, 0.012, m.light, 0, -0.03, -D / 2 + 0.04, dg);
      for (const s of [-1, 1]) {
        const k = sphere(0.018, m.brass, s * 0.3, 0, D / 2 + 0.012, dg, 12);
        k.scale.z = 0.7;
      }
      const state = { open: false, item: null, g: dg };
      if (itemId) {
        const k = keyMesh(); k.position.set(0.05, -0.085, 0.02); k.rotation.set(-Math.PI / 2, 0, 0.4);
        k.scale.setScalar(1.6);
        dg.add(k);
        state.item = k;
        pickable(G, k, itemId, def.id, () => state.open);
      }
      drawers.push(state);
      G.onTap(dg, () => {
        state.open = !state.open;
        sfx.drawer(G.worldPos(dg), state.open);
        const from = dg.position.z, to = state.open ? 0.3 : 0;
        G.tween(0.4, (k) => { dg.position.z = from + (to - from) * k; });
        if (state.open && (!state.item || !state.item.visible)) G.say("empty", null, 900);
        return true;
      }, { owner: def.id });
    });
    G.addInspect(def.id, g, { pos: [0, 1.35, 0.95], target: [0, 0.45, 0.1] });
    return { group: g, w: W + 0.06, d: D };
  },

  grandfatherClock(def, G) {
    const m = mats(), g = new THREE.Group();
    rbox(0.56, 0.4, 0.36, 0.01, m.dark, 0, 0.2, 0, g);
    rbox(0.46, 1.2, 0.3, 0.01, m.mid, 0, 1.0, 0, g);
    rbox(0.56, 0.55, 0.36, 0.01, m.dark, 0, 1.87, 0, g);
    box(0.6, 0.06, 0.4, m.dark, 0, 2.17, 0, g);
    const crest = cyl(0.12, 0.12, 0.38, m.dark, 0, 2.2, 0.0, g, 20); crest.rotation.x = Math.PI / 2; crest.scale.set(1.5, 1, 0.4);
    // циферблат
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshStandardMaterial({ map: T.clockFace(), roughness: 0.5 }));
    face.position.set(0, 1.88, 0.181); g.add(face);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.012, 8, 40), m.brass);
    bezel.position.copy(face.position); g.add(bezel);
    const hands = new THREE.Group(); hands.position.set(0, 1.88, 0.19); g.add(hands);
    const hourHand = new THREE.Group(); hourHand.rotation.z = -0.9; hands.add(hourHand);
    box(0.012, 0.11, 0.004, M.black, 0, 0.045, 0, hourHand);
    const mh = new THREE.Group(); hands.add(mh); box(0.008, 0.16, 0.004, M.black, 0, 0.07, 0.003, mh);
    // окошко с маятником
    plane(0.26, 0.8, m.glass, 0, 0.95, 0.152, g);
    box(0.3, 0.84, 0.02, m.black, 0, 0.95, 0.135, g).scale.set(1, 1, 0.5);
    const pend = new THREE.Group(); pend.position.set(0, 1.32, 0.13); g.add(pend);
    box(0.012, 0.55, 0.006, m.brass, 0, -0.275, 0, pend);
    const bob = cyl(0.07, 0.07, 0.015, m.brass, 0, -0.58, 0, pend, 24); bob.rotation.x = Math.PI / 2;
    G.every((dt, time) => { pend.rotation.z = Math.sin(time * Math.PI) * 0.13; mh.rotation.z = -time * 0.01; });
    addTicking(G.worldPos(face), { loud: 1.2, pitch: 0.8 });
    blobShadow(0.56, 0.36, g);
    G.onTap(g, () => { G.say("clockMsg"); return true; });
    return { group: g, w: 0.56, d: 0.36 };
  },

  sideTable(def, G) {
    const m = mats(), g = new THREE.Group();
    cyl(0.32, 0.32, 0.03, m.dark, 0, 0.7, 0, g, 32);
    cyl(0.03, 0.04, 0.66, m.mid, 0, 0.36, 0, g, 12);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = box(0.03, 0.03, 0.26, m.mid, Math.sin(a) * 0.11, 0.04, Math.cos(a) * 0.11, g);
      leg.rotation.y = a;
    }
    G.flames.push(candle(g, 0.15, 0.715, -0.1, 0.12));
    blobShadow(0.6, 0.6, g);
    if (def.note) {
      const p = plane(0.18, 0.24, new THREE.MeshStandardMaterial({ map: T.paperTexture(10), roughness: 0.9 }), -0.05, 0.717, 0.05, g);
      p.rotation.x = -Math.PI / 2; p.rotation.z = 0.3;
      hitProxy(p, 0.14); G.onTap(p, () => { G.showNote(def.note); return true; });
    }
    return { group: g, w: 0.6, d: 0.6 };
  },

  coatRack(def, G) {
    const m = mats(), g = new THREE.Group();
    cyl(0.02, 0.025, 1.8, m.dark, 0, 0.9, 0, g, 10);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = box(0.03, 0.03, 0.32, m.dark, Math.sin(a) * 0.14, 0.03, Math.cos(a) * 0.14, g); leg.rotation.y = a;
      const hook = cyl(0.008, 0.008, 0.16, m.brass, Math.sin(a) * 0.06, 1.72, Math.cos(a) * 0.06, g, 6);
      hook.rotation.x = Math.cos(a) * 0.9; hook.rotation.z = -Math.sin(a) * 0.9;
    }
    const coat = cyl(0.13, 0.24, 1.0, T.fabricMaterial("#2a2620"), 0, 1.2, 0.08, g, 16);
    coat.scale.z = 0.6;
    cyl(0.1, 0.12, 0.12, T.fabricMaterial("#1e1c1a"), 0.06, 1.86, -0.02, g, 16);
    cyl(0.19, 0.19, 0.01, T.fabricMaterial("#1e1c1a"), 0.06, 1.8, -0.02, g, 24);
    blobShadow(0.4, 0.4, g);
    G.onTap(g, () => { G.say("coatMsg"); return true; });
    return { group: g, w: 0.45, d: 0.45 };
  },

  frontDoor(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.4, Hd = 2.5;
    box(W + 0.2, 0.1, 0.08, m.dark, 0, Hd + 0.05, 0.04, g);
    for (const s of [-1, 1]) box(0.1, Hd, 0.08, m.dark, s * (W / 2 + 0.05), Hd / 2, 0.04, g);
    for (const s of [-1, 1]) {
      const leaf = box(W / 2 - 0.01, Hd, 0.04, m.mid, s * W / 4, Hd / 2, 0.02, g);
      for (const yy of [0.6, 1.6]) rbox(W / 2 - 0.2, yy === 0.6 ? 0.7 : 1.0, 0.03, 0.01, m.oak, s * W / 4, yy + (yy === 0.6 ? 0 : 0.15), 0.045, g);
      sphere(0.03, m.brass, s * 0.08, 1.05, 0.07, g, 12);
      leaf.userData.front = true;
    }
    plane(0.5, 0.25, new THREE.MeshStandardMaterial({ map: T.windowTexture(), emissive: "#30446a", emissiveIntensity: 0.4 }), 0, Hd - 0.2, 0.05, g);
    G.onTap(g, () => { G.say("frontDoor"); sfx.locked(G.worldPos(g)); return true; });
    return { group: g, noCollide: true };
  },

  painting(def, G) {
    const m = mats(), g = new THREE.Group();
    const w = def.w || 0.8, h = def.h || 0.6, y = def.y || 1.7;
    rbox(w + 0.12, h + 0.12, 0.05, 0.015, m.gold, 0, y, 0.025, g);
    plane(w, h, new THREE.MeshStandardMaterial({ map: T.paintingTexture(def.art || "landscape"), roughness: 0.55 }), 0, y, 0.052, g);
    G.onTap(g, () => { G.say("paintingMsg"); return true; });
    return { group: g, noCollide: true };
  },

  sconce(def, G) {
    const m = mats(), g = new THREE.Group();
    rbox(0.08, 0.16, 0.02, 0.01, m.brass, 0, 1.9, 0.01, g);
    const arm = cyl(0.008, 0.008, 0.14, m.brass, 0, 1.88, 0.08, g, 6); arm.rotation.x = Math.PI / 2;
    G.flames.push(candle(g, 0, 1.88, 0.15, 0.1));
    const shade = cyl(0.05, 0.08, 0.1, new THREE.MeshStandardMaterial({ color: "#f3dfb8", emissive: "#ffb060", emissiveIntensity: 0.6, roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), 0, 2.07, 0.15, g, 16);
    shade.material.depthWrite = false;
    if (def.light !== false && G.zoneOf(def) !== "hall") {
      const l = G.light("#ffb878", 6, 7, [0, 2.0, 0.25], g); l.userData.flicker = 0.08;
    }
    return { group: g, noCollide: true };
  },

  fireplace(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.8, Hf = 1.25, D = 0.5;
    const stone = T.stoneMaterial();
    box(0.4, Hf, D, stone, -W / 2 + 0.2, Hf / 2, 0, g);
    box(0.4, Hf, D, stone, W / 2 - 0.2, Hf / 2, 0, g);
    box(W, 0.35, D, stone, 0, Hf - 0.175, 0, g);
    rbox(W + 0.2, 0.08, D + 0.12, 0.015, m.dark, 0, Hf + 0.04, 0.03, g);
    box(W - 0.8, Hf - 0.35, 0.05, M.black, 0, (Hf - 0.35) / 2, -D / 2 + 0.03, g);
    box(W - 0.8, 0.02, D, stone, 0, 0.01, 0, g);
    box(W + 0.3, 0.04, 0.4, stone, 0, 0.02, D / 2 + 0.18, g); // плита перед камином
    // поленья
    for (const [x, a] of [[-0.12, 0.3], [0.1, -0.25], [0, 0.05]]) {
      const log = cyl(0.05, 0.055, 0.6, m.mid, x, 0.08 + (a === 0.05 ? 0.07 : 0), 0, g, 10);
      log.rotation.z = Math.PI / 2; log.rotation.y = a;
    }
    // языки пламени — анимированные «спрайты»
    const fc = document.createElement("canvas"); fc.width = 64; fc.height = 128;
    const fx = fc.getContext("2d");
    const gr = fx.createRadialGradient(32, 96, 2, 32, 80, 60);
    gr.addColorStop(0, "rgba(255,250,210,1)"); gr.addColorStop(0.25, "rgba(255,190,80,0.9)"); gr.addColorStop(0.6, "rgba(230,90,20,0.5)"); gr.addColorStop(1, "rgba(120,20,0,0)");
    fx.fillStyle = gr; fx.beginPath(); fx.moveTo(32, 0); fx.bezierCurveTo(70, 60, 64, 128, 32, 128); fx.bezierCurveTo(0, 128, -6, 60, 32, 0); fx.fill();
    const fmat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const flames = [];
    for (let i = 0; i < 7; i++) {
      const f = plane(0.18 + Math.random() * 0.1, 0.35 + Math.random() * 0.15, fmat, -0.25 + i * 0.085, 0.3, 0.02 + (i % 2) * 0.04, g);
      f.userData.base = f.position.y; f.userData.ph = Math.random() * 10; f.rotation.y = (Math.random() - 0.5) * 0.6;
      flames.push(f);
    }
    const light = G.light("#ff8a3a", 9, 9, [0, 0.45, 0.55], g);
    G.every((dt, time) => {
      for (const f of flames) {
        const k = Math.sin(time * 9 + f.userData.ph) * 0.5 + Math.sin(time * 23 + f.userData.ph * 2) * 0.3;
        f.scale.set(1 + k * 0.1, 1 + k * 0.25, 1);
        f.position.y = f.userData.base + k * 0.02;
      }
      light.intensity = light.userData.base * (0.85 + Math.sin(time * 11) * 0.06 + Math.sin(time * 27) * 0.05 + Math.random() * 0.06);
    });
    addFire(G.worldPos(g, [0, 0.3, 0.2]));
    // на каминной полке
    G.flames.push(candle(g, -0.75, Hf + 0.08, 0.03, 0.18));
    G.flames.push(candle(g, 0.75, Hf + 0.08, 0.03, 0.18));
    const mclock = rbox(0.2, 0.16, 0.08, 0.02, m.dark, 0.48, Hf + 0.16, 0, g);
    const mface = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), new THREE.MeshStandardMaterial({ map: T.clockFace() }));
    mface.position.set(0, 0, 0.041); mclock.add(mface);
    blobShadow(W, D, g, 0.4);
    G.onTap(g, () => { G.say("fireMsg"); return true; });
    return { group: g, w: W + 0.2, d: D + 0.4 };
  },

  portrait(def, G) {
    const m = mats(), g = new THREE.Group();
    const w = 0.7, h = 0.9, y = 2.12;
    rbox(w + 0.16, h + 0.16, 0.06, 0.02, m.gold, 0, y, 0.03, g);
    rbox(w + 0.06, h + 0.06, 0.07, 0.01, T.metal("#8a6a30", 0.5), 0, y, 0.03, g);
    plane(w, h, new THREE.MeshStandardMaterial({ map: T.paintingTexture("portrait"), roughness: 0.5 }), 0, y, 0.067, g);
    const plaqueMat = new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.35 });
    const plaque = rbox(0.46, 0.13, 0.012, 0.004, plaqueMat, 0, y - h / 2 - 0.15, 0.01, g);
    const draw = () => {
      const lines = tr(G.level.notes[def.note].text).replace(/[«»“”]/g, "").split("\n");
      plaqueMat.map?.dispose();
      plaqueMat.map = T.textTexture(lines, { w: 1024, h: 288, font: "bold 64px Georgia, serif" });
      plaqueMat.needsUpdate = true;
    };
    draw(); G.onLang(draw);
    G.addInspect(def.id, g, { pos: [0, 1.95, 1.25], target: [0, 1.92, 0] }, () => {
      G.addNote(def.note);
    });
    G.onTap(g, () => { G.say("portraitMsg"); return true; }, { owner: def.id });
    G.onTap(plaque, () => { G.showNote(def.note); return true; }, { owner: def.id });
    return { group: g, noCollide: true };
  },

  bookshelf(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.8, Hb = 2.4, D = 0.4;
    for (const s of [-1, 1]) box(0.04, Hb, D, m.dark, s * (W / 2 - 0.02), Hb / 2, 0, g);
    box(W, 0.04, D, m.dark, 0, Hb - 0.02, 0, g);
    rbox(W + 0.08, 0.08, D + 0.04, 0.01, m.dark, 0, Hb + 0.02, 0.01, g);
    box(W, Hb, 0.02, m.mid, 0, Hb / 2, -D / 2 + 0.01, g);
    box(W, 0.1, D, m.dark, 0, 0.05, 0, g);
    const shelves = 6, sp = (Hb - 0.14) / shelves;
    const books = [];
    const r = T.rng(Math.floor(def.x * 100 + def.z * 7));
    const colors = ["#5a1a14", "#1e3a2a", "#1a2a4a", "#4a3a1a", "#3a1a3a", "#6a4a2a", "#2a2a2a", "#7a2a1a", "#264a4a"];
    for (let s = 0; s < shelves; s++) {
      const y0 = 0.1 + s * sp;
      box(W - 0.08, 0.025, D - 0.02, m.dark, 0, y0, 0.01, g);
      let x = -W / 2 + 0.06;
      while (x < W / 2 - 0.08) {
        if (r() < 0.06) { x += 0.08 + r() * 0.15; continue; }
        const bw = 0.025 + r() * 0.04, bh = Math.min(sp - 0.04, 0.2 + r() * 0.13), bd = 0.2 + r() * 0.1;
        books.push({ x: x + bw / 2, y: y0 + 0.0125 + bh / 2, z: D / 2 - bd / 2 - 0.03 - r() * 0.03, w: bw, h: bh, d: bd, c: colors[Math.floor(r() * colors.length)], tilt: r() < 0.05 ? 0.2 : 0 });
        x += bw + 0.003;
      }
    }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: T.bookSpineTexture(), roughness: 0.7 }), books.length);
    const o = new THREE.Object3D(), col = new THREE.Color();
    books.forEach((b, i) => {
      o.position.set(b.x, b.y, b.z); o.rotation.set(0, Math.PI / 2, b.tilt); o.scale.set(b.d, b.h, b.w); o.updateMatrix();
      im.setMatrixAt(i, o.matrix); im.setColorAt(i, col.set(b.c));
    });
    g.add(im);
    blobShadow(W, D, g, 0.4);
    G.onTap(g, () => { G.say("bookshelfMsg"); return true; });
    return { group: g, w: W, d: D };
  },

  armchair(def, G) {
    const m = mats(), g = new THREE.Group(), L = T.leatherMaterial("#5a1a14");
    rbox(0.8, 0.22, 0.75, 0.06, L, 0, 0.32, 0, g);
    rbox(0.66, 0.12, 0.6, 0.05, L, 0, 0.48, 0.05, g);
    const back = rbox(0.8, 0.75, 0.18, 0.07, L, 0, 0.75, -0.3, g); back.rotation.x = -0.12;
    for (const s of [-1, 1]) rbox(0.14, 0.32, 0.75, 0.06, L, s * 0.36, 0.55, 0.0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.025, 0.02, 0.2, m.dark, sx * 0.33, 0.1, sz * 0.3, g, 8);
    blobShadow(0.85, 0.8, g);
    G.onTap(g, () => { G.say("armchairMsg"); return true; });
    return { group: g, w: 0.85, d: 0.8 };
  },

  desk(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.4, D = 0.7, Hd = 0.76;
    rbox(W, 0.04, D, 0.01, m.dark, 0, Hd - 0.02, 0, g);
    const leather = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.3, D - 0.2), T.leatherMaterial("#1e3a2a"));
    leather.rotation.x = -Math.PI / 2; leather.position.set(0, Hd + 0.001, 0); g.add(leather);
    for (const s of [-1, 1]) {
      box(0.4, Hd - 0.04, D - 0.04, m.mid, s * (W / 2 - 0.22), (Hd - 0.04) / 2, 0, g);
      for (let i = 0; i < 3; i++) {
        rbox(0.36, 0.18, 0.02, 0.005, m.oak, s * (W / 2 - 0.22), 0.14 + i * 0.2, D / 2 - 0.01, g);
        sphere(0.012, m.brass, s * (W / 2 - 0.22), 0.14 + i * 0.2, D / 2 + 0.005, g, 8);
      }
    }
    box(W - 0.84, 0.3, 0.02, m.mid, 0, Hd - 0.2, -D / 2 + 0.03, g);
    // лампа с зелёным абажуром
    const lampG = new THREE.Group(); lampG.position.set(0.45, Hd, -0.15); g.add(lampG);
    cyl(0.07, 0.08, 0.02, m.brass, 0, 0.01, 0, lampG);
    cyl(0.01, 0.01, 0.32, m.brass, 0, 0.17, 0, lampG, 8);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.08, 24, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: "#1f6a3a", emissive: "#1f6a3a", emissiveIntensity: 0.5, roughness: 0.2, side: THREE.DoubleSide }));
    shade.rotation.z = Math.PI / 2; shade.rotation.y = 0; shade.position.set(0, 0.34, 0); lampG.add(shade);
    const bulb = cyl(0.015, 0.015, 0.16, new THREE.MeshBasicMaterial({ color: "#fff2d0" }), 0, 0.32, 0, lampG, 8);
    bulb.rotation.z = Math.PI / 2;
    G.light("#ffd9a0", 4, 5, [0.45, Hd + 0.25, 0.0], g);
    // книги, чернильница, перо
    for (let i = 0; i < 3; i++) rbox(0.22 - i * 0.02, 0.04, 0.16, 0.004, T.leatherMaterial(["#4a1a14", "#1a2a4a", "#3a2a14"][i]), -0.5, Hd + 0.02 + i * 0.04, -0.15, g).rotation.y = i * 0.2;
    cyl(0.025, 0.03, 0.05, T.plain("#101418", 0.1, { metalness: 0.3 }), -0.25, Hd + 0.025, -0.2, g, 12);
    const pen = cyl(0.002, 0.004, 0.18, T.plain("#f0f0e8", 0.7), -0.22, Hd + 0.1, -0.2, g, 6); pen.rotation.z = 0.5;
    // записка
    if (def.note) {
      const p = plane(0.2, 0.26, new THREE.MeshStandardMaterial({ map: T.paperTexture(8), roughness: 0.9 }), 0.0, Hd + 0.004, 0.08, g);
      p.rotation.x = -Math.PI / 2; p.rotation.z = -0.15;
      hitProxy(p, 0.14); G.onTap(p, () => { G.showNote(def.note); return true; });
    }
    // стул
    const ch = new THREE.Group(); ch.position.set(0, 0, -0.55); ch.rotation.y = Math.PI; g.add(ch);
    rbox(0.45, 0.06, 0.42, 0.02, T.leatherMaterial("#3a1a10"), 0, 0.46, 0, ch);
    rbox(0.42, 0.5, 0.04, 0.02, m.dark, 0, 0.74, -0.2, ch);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.035, 0.44, 0.035, m.dark, sx * 0.19, 0.22, sz * 0.18, ch);
    blobShadow(W, D + 0.6, g, 0.45).position.z = -0.2;
    G.onTap(g, () => { G.say("deskMsg"); return true; });
    return { group: g, w: W, d: D + 1.0, offsetZ: -0.25 };
  },

  globe(def, G) {
    const m = mats(), g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = cyl(0.015, 0.02, 0.62, m.dark, Math.sin(a) * 0.14, 0.3, Math.cos(a) * 0.14, g, 8);
      leg.rotation.x = Math.cos(a) * 0.25; leg.rotation.z = -Math.sin(a) * 0.25;
    }
    const ballG = new THREE.Group(); ballG.position.y = 0.92; ballG.rotation.z = 0.4; g.add(ballG);
    const ball = sphere(0.26, new THREE.MeshStandardMaterial({ map: T.globeTexture(), roughness: 0.4 }), 0, 0, 0, ballG, 32);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.008, 6, 48), m.brass); ballG.add(ring);
    const hor = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 48), m.dark); hor.rotation.x = Math.PI / 2; hor.position.y = 0.92; g.add(hor);
    let spin = 0;
    G.every((dt) => { if (spin > 0) { ball.rotation.y += spin * dt; spin *= Math.pow(0.4, dt); if (spin < 0.05) spin = 0; } });
    blobShadow(0.6, 0.6, g);
    G.onTap(g, () => { spin = 9; sfx.spin(G.worldPos(g)); G.say("globeMsg", null, 1500); return true; });
    return { group: g, w: 0.6, d: 0.6 };
  },

  window(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 0.9, Hw = 1.5, y = 1.55;
    plane(W, Hw, new THREE.MeshStandardMaterial({ map: T.windowTexture(), emissive: "#ffffff", emissiveMap: T.windowTexture(), emissiveIntensity: 0.55, roughness: 0.1 }), 0, y, 0.02, g);
    for (const s of [-1, 1]) box(0.06, Hw + 0.12, 0.08, m.dark, s * (W / 2 + 0.03), y, 0.04, g);
    for (const yy of [y - Hw / 2 - 0.03, y + Hw / 2 + 0.03]) box(W + 0.12, 0.06, 0.08, m.dark, 0, yy, 0.04, g);
    box(0.03, Hw, 0.04, m.dark, 0, y, 0.04, g);
    for (const k of [-0.25, 0.25]) box(W, 0.025, 0.04, m.dark, 0, y + k * Hw, 0.04, g);
    rbox(W + 0.3, 0.05, 0.2, 0.01, m.dark, 0, y - Hw / 2 - 0.08, 0.1, g);
    const cur = T.fabricMaterial("#4a1a24");
    for (const s of [-1, 1]) {
      rbox(0.3, 2.3, 0.06, 0.03, cur, s * (W / 2 + 0.2), 1.6, 0.06, g);
    }
    box(W + 0.9, 0.03, 0.03, m.brass, 0, 2.78, 0.06, g);
    G.onTap(g, () => { G.say("windowMsg"); return true; });
    return { group: g, noCollide: true };
  },

  workbench(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 2.0, D = 0.75, Hb = 0.9;
    rbox(W, 0.07, D, 0.01, T.woodMaterial("#7a5a3a", { seed: 9, vertical: false, rough: 0.8 }), 0, Hb - 0.035, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.08, Hb - 0.07, 0.08, m.mid, sx * (W / 2 - 0.08), (Hb - 0.07) / 2, sz * (D / 2 - 0.08), g);
    box(W - 0.1, 0.03, D - 0.1, m.mid, 0, 0.18, 0, g);
    // ящики под верстаком
    for (let i = 0; i < 3; i++) rbox(0.3, 0.2, 0.25, 0.01, T.metal("#5a3a2a", 0.6), -0.6 + i * 0.4, 0.3, 0, g);
    // тиски
    box(0.14, 0.1, 0.16, m.iron, W / 2 - 0.2, Hb + 0.05, D / 2 - 0.1, g);
    box(0.14, 0.08, 0.04, m.iron, W / 2 - 0.2, Hb + 0.05, D / 2 + 0.02, g);
    const screw = cyl(0.01, 0.01, 0.2, m.iron, W / 2 - 0.2, Hb + 0.05, D / 2 + 0.1, g, 8); screw.rotation.x = Math.PI / 2;
    // инструменты
    const h1 = cyl(0.012, 0.012, 0.25, m.mid, -0.2, Hb + 0.015, 0.18, g, 8); h1.rotation.z = Math.PI / 2; h1.rotation.y = 0.3;
    box(0.04, 0.03, 0.09, m.iron, -0.32, Hb + 0.02, 0.22, g).rotation.y = 0.3;
    for (let i = 0; i < 3; i++) {
      const sd = cyl(0.006, 0.006, 0.16, m.iron, 0.25 + i * 0.05, Hb + 0.01, -0.15, g, 6); sd.rotation.x = Math.PI / 2;
      cyl(0.012, 0.012, 0.07, T.plain(["#8a1a1a", "#1a4a8a", "#e0b020"][i], 0.5), 0.25 + i * 0.05, Hb + 0.012, -0.03, g, 8).rotation.x = Math.PI / 2;
    }
    // мелкие шестерёнки-декор
    const r = T.rng(12);
    for (let i = 0; i < 6; i++) {
      const dg = gearMesh(0.02 + r() * 0.02, T.metal("#9a7a4a", 0.5));
      dg.rotation.x = -Math.PI / 2; dg.position.set(-0.75 + r() * 0.35, Hb + 0.012, -0.2 + r() * 0.3); g.add(dg);
    }
    // лупа на штативе
    cyl(0.05, 0.06, 0.02, m.iron, 0.75, Hb + 0.01, -0.2, g);
    const arm = cyl(0.006, 0.006, 0.3, m.iron, 0.75, Hb + 0.16, -0.2, g, 6); void arm;
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 24), m.brass); lens.position.set(0.75, Hb + 0.32, -0.12); lens.rotation.x = -0.6; g.add(lens);
    // шестерёнка-предмет
    if (def.item) {
      const it = G.items[def.item];
      const gm = gearMesh(it.size || 0.07);
      gm.rotation.x = -Math.PI / 2; gm.position.set(0.05, Hb + 0.012, 0.15);
      g.add(gm);
      pickable(G, gm, def.item);
      // блик, чтобы шестерёнку было легче заметить
      G.every((dt, time) => { gm.rotation.z = Math.sin(time * 0.8) * 0.15; });
    }
    if (def.note) {
      const p = plane(0.2, 0.26, new THREE.MeshStandardMaterial({ map: T.paperTexture(9), roughness: 0.9 }), -0.45, Hb + 0.004, 0.12, g);
      p.rotation.x = -Math.PI / 2; p.rotation.z = 0.25;
      hitProxy(p, 0.14); G.onTap(p, () => { G.showNote(def.note); return true; });
    }
    blobShadow(W, D, g, 0.45);
    G.onTap(g, () => { G.say("workbenchMsg"); return true; });
    return { group: g, w: W, d: D };
  },

  hangingLamp(def, G) {
    const m = mats(), g = new THREE.Group();
    const y = 2.25;
    cyl(0.005, 0.005, HEIGHT - y, M.black, 0, (HEIGHT + y) / 2, 0, g, 4);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, 0.18, 24, 1, true), new THREE.MeshStandardMaterial({ color: "#2a3a2a", metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }));
    shade.position.y = y; g.add(shade);
    sphere(0.04, new THREE.MeshBasicMaterial({ color: "#fff0c8" }), 0, y - 0.06, 0, g);
    G.light("#ffd8a0", 16, 11, [0, y - 0.12, 0], g);
    return { group: g, noCollide: true };
  },

  toolShelf(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.4, Hs = 1.9, D = 0.35;
    for (const s of [-1, 1]) box(0.04, Hs, D, m.mid, s * (W / 2 - 0.02), Hs / 2, 0, g);
    box(W, Hs, 0.02, m.dark, 0, Hs / 2, -D / 2 + 0.01, g);
    const r = T.rng(77);
    for (let i = 0; i < 4; i++) {
      const y = 0.1 + i * 0.55;
      box(W - 0.06, 0.03, D, m.mid, 0, y, 0, g);
      if (i === 3) break;
      let x = -W / 2 + 0.12;
      while (x < W / 2 - 0.12) {
        const k = r();
        if (k < 0.4) { // банка
          const jr = 0.04 + r() * 0.03, jh = 0.1 + r() * 0.08;
          cyl(jr, jr, jh, new THREE.MeshStandardMaterial({ color: "#a8b8a0", transparent: true, opacity: 0.55, roughness: 0.1 }), x, y + 0.015 + jh / 2, 0, g, 12);
          cyl(jr + 0.003, jr + 0.003, 0.02, m.brass, x, y + 0.015 + jh, 0, g, 12);
          x += jr * 2 + 0.05;
        } else if (k < 0.7) { // коробочка
          const bw = 0.12 + r() * 0.1;
          rbox(bw, 0.08 + r() * 0.06, 0.2, 0.005, T.plain(["#6a4a2a", "#3a4a5a", "#7a6a4a"][Math.floor(r() * 3)], 0.8), x + bw / 2 - 0.05, y + 0.07, 0, g);
          x += bw + 0.04;
        } else { // шестерёнка или часы
          const dg = gearMesh(0.04 + r() * 0.04, T.metal("#8a6a3a", 0.5));
          dg.position.set(x, y + 0.1, -0.1); dg.rotation.y = 0.2; g.add(dg);
          x += 0.15;
        }
      }
    }
    blobShadow(W, D, g, 0.4);
    G.onTap(g, () => { G.say("toolShelfMsg"); return true; });
    return { group: g, w: W, d: D };
  },

  crate(def, G) {
    const m = mats(), g = new THREE.Group();
    const wood = T.woodMaterial("#8a6a48", { seed: 21, vertical: false, rough: 0.9 });
    box(0.6, 0.48, 0.58, wood, 0, 0.24, 0, g);
    for (const s of [-1, 1]) for (const yy of [0.06, 0.42]) box(0.62, 0.06, 0.02, m.mid, 0, yy, s * 0.3, g);
    box(0.62, 0.02, 0.6, m.mid, 0, 0.49, 0, g);
    blobShadow(0.6, 0.6, g);
    G.onTap(g, () => { G.say("crateMsg"); return true; });
    return { group: g, w: 0.62, d: 0.62 };
  },

  toolbox(def, G) {
    const m = mats(), g = new THREE.Group();
    const red = T.metal("#8a1a14", 0.45);
    const W = 0.46, Hh = 0.18, D = 0.22;
    box(W, 0.01, D, red, 0, 0.005, 0, g);
    box(W, Hh, 0.01, red, 0, Hh / 2, D / 2 - 0.005, g);
    box(W, Hh, 0.01, red, 0, Hh / 2, -D / 2 + 0.005, g);
    for (const s of [-1, 1]) box(0.01, Hh, D, red, s * (W / 2 - 0.005), Hh / 2, 0, g);
    box(W - 0.03, 0.005, D - 0.03, T.plain("#2a1a14", 0.9), 0, 0.012, 0, g);
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, Hh, -D / 2); g.add(lidPivot);
    const lid = rbox(W + 0.01, 0.04, D + 0.01, 0.008, red, 0, 0.02, D / 2, lidPivot);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 20, Math.PI), m.iron);
    handle.position.set(0, 0.04, D / 2); lidPivot.add(handle);
    for (const s of [-1, 1]) box(0.03, 0.04, 0.012, m.brass, s * 0.15, -0.01, D + 0.008, lidPivot);
    void lid;
    if (def.item) {
      const gm = gearMesh(G.items[def.item].size || 0.09);
      gm.rotation.x = -Math.PI / 2; gm.position.set(0.04, 0.03, 0); g.add(gm);
      pickable(G, gm, def.item, def.id, () => open);
    }
    // гаечный ключ внутри — для красоты
    box(0.25, 0.008, 0.025, m.iron, -0.08, 0.02, 0.06, g).rotation.y = 0.3;
    let open = G.is("open:" + def.id);
    if (open) lidPivot.rotation.x = -1.9;
    G.onTap(lidPivot, () => {
      if (open) return false;
      open = true; G.flag("open:" + def.id);
      sfx.lidOpen(G.worldPos(g));
      G.tween(0.6, (k) => { lidPivot.rotation.x = -1.9 * (1 - Math.pow(1 - k, 3)); });
      return true;
    }, { owner: def.id });
    G.addInspect(def.id, g, { pos: [0, 0.62, 0.55], target: [0, 0.08, 0] }, () => { if (!open) G.say("toolboxClosed", null, 1600); });
    return { group: g, noCollide: true };
  },

  chalkboard(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 1.5, Hc = 0.95, y = 1.5;
    rbox(W + 0.1, Hc + 0.1, 0.04, 0.01, m.mid, 0, y, 0.02, g);
    plane(W, Hc, new THREE.MeshStandardMaterial({ map: T.chalkboardTexture(def.symbols || ["moon", "star", "sun"]), roughness: 0.95 }), 0, y, 0.042, g);
    box(W, 0.03, 0.07, m.mid, 0, y - Hc / 2 - 0.05, 0.05, g);
    for (let i = 0; i < 3; i++) cyl(0.006, 0.006, 0.06, T.plain("#f0f0e8"), -0.3 + i * 0.1, y - Hc / 2 - 0.03, 0.05, g, 6).rotation.z = Math.PI / 2;
    G.addInspect(def.id, g, { pos: [0, y, 1.25], target: [0, y, 0] }, () => { G.addNote(def.note); G.say("chalkMsg", null, 1800); });
    G.onTap(g, () => { G.showNote(def.note); return true; }, { owner: def.id });
    return { group: g, noCollide: true };
  },

  smallTable(def, G) {
    const m = mats(), g = new THREE.Group();
    rbox(0.6, 0.04, 0.6, 0.01, m.mid, 0, 0.73, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, 0.71, 0.04, m.dark, sx * 0.25, 0.355, sz * 0.25, g);
    blobShadow(0.6, 0.6, g);
    return { group: g, w: 0.6, d: 0.6 };
  },

  symbolBox(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 0.36, Hh = 0.14, D = 0.26;
    const wood = T.woodMaterial("#5a2a1a", { seed: 33, vertical: false, rough: 0.4 });
    box(W, 0.012, D, wood, 0, 0.006, 0, g);
    box(W, Hh, 0.012, wood, 0, Hh / 2, D / 2 - 0.006, g);
    box(W, Hh, 0.012, wood, 0, Hh / 2, -D / 2 + 0.006, g);
    for (const s of [-1, 1]) box(0.012, Hh, D, wood, s * (W / 2 - 0.006), Hh / 2, 0, g);
    box(W - 0.03, 0.004, D - 0.03, T.fabricMaterial("#4a0a14"), 0, 0.014, 0, g);
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, Hh, -D / 2); g.add(lidPivot);
    rbox(W + 0.012, 0.03, D + 0.012, 0.008, wood, 0, 0.015, D / 2, lidPivot);
    const inlay = gearMesh(0.06, m.gold); inlay.rotation.x = -Math.PI / 2; inlay.position.set(0, 0.032, D / 2); lidPivot.add(inlay);
    for (const s of [-1, 1]) for (const sz of [-1, 1]) sphere(0.012, m.brass, s * (W / 2 - 0.01), 0.008, sz * (D / 2 - 0.01), g, 8);
    if (def.item) {
      const gm = gearMesh(G.items[def.item].size || 0.12);
      gm.rotation.x = -Math.PI / 2; gm.position.set(0, 0.03, 0); g.add(gm);
      pickable(G, gm, def.item, def.id, () => open);
    }
    let open = G.is("open:" + def.id);
    if (open) lidPivot.rotation.x = -1.8;
    // кнопки с символами на передней стенке
    const pressed = [];
    const buttons = (def.buttons || ["sun", "moon", "star"]).map((sym, i) => {
      const bg = new THREE.Group(); bg.position.set(-0.1 + i * 0.1, Hh / 2, D / 2); g.add(bg);
      rbox(0.07, 0.07, 0.01, 0.004, m.brass, 0, 0, 0.005, bg);
      const btn = cyl(0.028, 0.028, 0.02, m.brass, 0, 0, 0.02, bg, 24); btn.rotation.x = Math.PI / 2;
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.027, 24), new THREE.MeshStandardMaterial({ map: T.symbolTexture(sym), metalness: 0.6, roughness: 0.35 }));
      face.position.z = 0.0305; bg.add(face);
      const press = new THREE.Group(); press.add(btn); press.add(face); bg.add(press);
      const b = { sym, press, down: false };
      G.onTap(bg, () => {
        if (open || b.down) return false;
        b.down = true; press.position.z = -0.012; sfx.buttonPress(G.worldPos(bg));
        pressed.push(sym);
        if (pressed.length === def.order.length) {
          const ok = pressed.every((s, k) => s === def.order[k]);
          setTimeout(() => {
            if (ok) {
              open = true; G.flag("open:" + def.id);
              sfx.lidOpen(G.worldPos(g));
              G.tween(0.8, (k) => { lidPivot.rotation.x = -1.8 * (1 - Math.pow(1 - k, 3)); });
              G.say("boxOpened");
            } else {
              sfx.wrong(G.worldPos(g));
              G.say("wrongOrder", null, 2200);
              buttons.forEach((bb) => { bb.down = false; bb.press.position.z = 0; });
            }
            pressed.length = 0;
          }, 350);
        }
        return true;
      }, { owner: def.id });
      return b;
    });
    if (open) buttons.forEach((b) => { b.down = true; b.press.position.z = -0.012; });
    G.addInspect(def.id, g, { pos: [0, 0.42, 0.48], target: [0, 0.06, 0.03] }, () => { if (!open) G.say("symbolBoxMsg", null, 2000); });
    return { group: g, noCollide: true };
  },

  wallClocks(def, G) {
    const m = mats(), g = new THREE.Group();
    const spots = [[-0.6, 1.9, 0.16], [-0.15, 1.65, 0.11], [0.3, 2.0, 0.14], [0.65, 1.6, 0.1], [0.1, 2.35, 0.09]];
    const hands = [];
    spots.forEach(([x, y, r], i) => {
      const body = cyl(r + 0.03, r + 0.03, 0.05, i % 2 ? m.dark : m.gold, x, y, 0.025, g, 32); body.rotation.x = Math.PI / 2;
      const face = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshStandardMaterial({ map: T.clockFace(), roughness: 0.5 }));
      face.position.set(x, y, 0.052); g.add(face);
      const hg = new THREE.Group(); hg.position.set(x, y, 0.055); g.add(hg);
      box(0.004, r * 0.8, 0.002, M.black, 0, r * 0.4, 0, hg);
      hands.push({ hg, speed: 0.5 + i * 0.37 });
    });
    G.every((dt, time) => { for (const h of hands) h.hg.rotation.z = -Math.floor(time * h.speed * 2) * 0.1; });
    addTicking(G.worldPos(g, [-0.3, 1.8, 0.1]), { loud: 0.6, pitch: 1.3, fast: true });
    addTicking(G.worldPos(g, [0.4, 1.8, 0.1]), { loud: 0.5, pitch: 1.1 });
    G.onTap(g, () => { G.say("wallClocksMsg"); return true; });
    return { group: g, noCollide: true };
  },

  gearDecor(def, G) {
    const g = new THREE.Group();
    const parts = [[0, 1.7, 0.35, 1], [0.48, 1.25, 0.2, -1], [-0.36, 1.12, 0.16, -1], [0.3, 2.35, 0.17, -1]];
    const mat = T.metal("#8a6a3a", 0.45);
    const gears = parts.map(([x, y, r, dir]) => {
      const gm = gearMesh(r, mat); gm.position.set(x, y, 0.03); g.add(gm);
      return { gm, w: (dir * 0.3 * 0.35) / r };
    });
    G.every((dt) => { for (const k of gears) k.gm.rotation.z += k.w * dt; });
    G.onTap(g, () => { G.say("gearDecorMsg"); return true; });
    return { group: g, noCollide: true };
  },

  lamp(def, G) {
    const g = new THREE.Group();
    G.light(def.color || "#ffb36b", def.power || 5, 8, [0, 2.2, 0], g);
    return { group: g, noCollide: true };
  },
};
