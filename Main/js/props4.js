// Предметы глав 4–6: телескоп, звёздная карта, фонограф, шкафы с замками,
// порванное письмо, мышиные норы и другое.
import * as THREE from "three";
import * as T from "./textures.js";
import { sfx } from "./audio.js";
import { tr } from "./i18n.js";
import { CELL } from "./world.js";
import { BUILDERS, box, rbox, cyl, sphere, plane, mats, blobShadow, hitProxy, pickable } from "./props.js";
import { itemMesh, ITEM_MESHES } from "./props2.js";
import { LOCKS, hitProxyBox } from "./doors.js";

const brass = () => T.metal("#c09a5c", 0.3);

// Текст записки на «бумаге» — для порванного письма
function letterCanvas(title, text, w = 1024, h = 768) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"), r = T.rng(7);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#efe2c0"); g.addColorStop(1, "#d8c49a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(90,60,20,${r() * 0.05})`; ctx.fillRect(r() * w, r() * h, 3, 3); }
  ctx.fillStyle = "#3a2410"; ctx.textBaseline = "top";
  ctx.font = "bold 46px Georgia, serif";
  ctx.fillText(title, 50, 40);
  ctx.font = "34px Georgia, serif";
  let y = 110;
  for (const para of text.split("\n")) {
    const words = para.split(" "); let line = "";
    for (const wd of words) {
      const test = line ? line + " " + wd : wd;
      if (ctx.measureText(test).width > w - 100) { ctx.fillText(line, 50, y); y += 44; line = wd; } else line = test;
    }
    ctx.fillText(line, 50, y); y += para ? 44 : 26;
  }
  return c;
}

// Как предметы глав 4–6 выглядят, когда лежат в мире
Object.assign(ITEM_MESHES, {
  piece() {
    const g = new THREE.Group();
    const sh = new THREE.Shape(); sh.moveTo(-0.07, -0.05); sh.lineTo(0.06, -0.06); sh.lineTo(0.075, 0.02); sh.lineTo(0.05, 0.055); sh.lineTo(-0.06, 0.05); sh.lineTo(-0.075, -0.01); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ map: T.paperTexture(4), roughness: 0.9, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.004; g.add(m);
    return g;
  },
  record() {
    const g = new THREE.Group();
    cyl(0.12, 0.12, 0.006, T.plain("#0a0a0a", 0.3, { metalness: 0.2 }), 0, 0.004, 0, g, 28);
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), T.plain("#8a1e14", 0.6)); l.rotation.x = -Math.PI / 2; l.position.y = 0.008; g.add(l);
    return g;
  },
  fuse() {
    const g = new THREE.Group();
    const glass = cyl(0.018, 0.018, 0.1, new THREE.MeshStandardMaterial({ color: "#d8e0e8", transparent: true, opacity: 0.7, roughness: 0.1 }), 0, 0.02, 0, g, 12);
    glass.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const c = cyl(0.02, 0.02, 0.018, brass(), s * 0.055, 0.02, 0, g, 12); c.rotation.z = Math.PI / 2; }
    return g;
  },
});

Object.assign(BUILDERS, {

  // Телескоп. В боковом лючке трубы что-то спрятано.
  telescope(def, G) {
    const m = mats(), g = new THREE.Group(), b = brass(), iron = T.metal("#2a2a30", 0.5);
    cyl(0.6, 0.65, 0.12, m.dark, 0, 0.06, 0, g, 32); // помост
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = cyl(0.025, 0.03, 1.25, m.mid, Math.sin(a) * 0.25, 0.7, Math.cos(a) * 0.25, g, 8);
      leg.rotation.x = Math.cos(a) * 0.22; leg.rotation.z = -Math.sin(a) * 0.22;
    }
    const mount = new THREE.Group(); mount.position.y = 1.32; g.add(mount);
    sphere(0.07, b, 0, 0, 0, mount, 14);
    const tube = new THREE.Group(); tube.rotation.x = -0.65; mount.add(tube);
    const body = cyl(0.11, 0.08, 1.7, b, 0, 0, 0.2, tube, 24); body.rotation.x = Math.PI / 2;
    for (const z of [-0.4, 0.3, 0.9]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 24), iron); ring.position.z = z; tube.add(ring); }
    const lens = cyl(0.13, 0.11, 0.12, iron, 0, 0, 1.08, tube, 24); lens.rotation.x = Math.PI / 2;
    const eye = cyl(0.025, 0.03, 0.18, iron, 0, 0, -0.72, tube, 12); eye.rotation.x = Math.PI / 2;
    // лючок сбоку трубы
    const hatchPivot = new THREE.Group(); hatchPivot.position.set(0.1, 0, -0.05); tube.add(hatchPivot);
    const hatch = box(0.012, 0.09, 0.18, iron, 0.006, 0, 0.09, hatchPivot);
    sphere(0.01, b, 0.016, 0, 0.16, hatchPivot, 6);
    hitProxyBox(hatchPivot, 0.06, 0.14, 0.24).position.set(0.02, 0, 0.09);
    void hatch;
    const flag = "open:" + def.id;
    let open = G.is(flag);
    if (open) hatchPivot.rotation.y = 1.8;
    if (def.item) {
      const it = itemMesh(def.item, G.items); it.scale.setScalar(0.7);
      it.position.set(0.05, -0.01, 0.06); it.rotation.set(0, 0, Math.PI / 2);
      tube.add(it);
      pickable(G, it, def.item, def.id, () => open);
    }
    G.onTap(hatchPivot, () => {
      if (open) return false;
      open = true; G.flag(flag);
      sfx.lidOpen(G.worldPos(hatchPivot));
      G.tween(0.5, (k) => { hatchPivot.rotation.y = 1.8 * k; });
      return true;
    }, { owner: def.id });
    G.onTap(g, () => { G.say("telescopeMsg", null, 2600); return true; }, { owner: def.id });
    blobShadow(1.2, 1.2, g, 0.4);
    // вид на лючок
    G.addInspect(def.id, g, { pos: [0.7, 1.45, 0.25], target: [0.1, 1.25, 0.1] });
    return { group: g, w: 1.2, d: 1.2 };
  },

  // Звёздная карта на стене. Если перевернуть — на обороте схема.
  starMap(def, G) {
    const g = new THREE.Group(), m = mats();
    const W = 1.0, Hh = 0.7, y = def.h || 1.6;
    const flip = new THREE.Group(); flip.position.set(0, y, 0.05); g.add(flip);
    rbox(W + 0.08, Hh + 0.08, 0.03, 0.01, m.dark, 0, 0, 0, flip);
    const front = plane(W, Hh, new THREE.MeshStandardMaterial({ map: T.starChartTexture(def.symbols || []), roughness: 0.8 }), 0, 0, 0.017, flip);
    const back = plane(W, Hh, new THREE.MeshStandardMaterial({ map: T.wiringTexture(def.colors || [], def.symbols || [], def.answer || {}), roughness: 0.8 }), 0, 0, -0.017, flip);
    back.rotation.y = Math.PI; void front;
    let flipped = false;
    G.onTap(flip, () => {
      flipped = !flipped;
      sfx.paper();
      const from = flip.rotation.y, to = flipped ? Math.PI : 0;
      G.tween(0.7, (k) => { flip.rotation.y = from + (to - from) * k; flip.position.z = 0.05 + Math.sin(k * Math.PI) * 0.3; });
      if (flipped && def.note) setTimeout(() => G.addNote(def.note), 700);
      return true;
    }, { owner: def.id });
    G.addInspect(def.id, g, { pos: [0, y, 1.2], target: [0, y, 0] }, () => G.say("mapMsg", null, 2600));
    return { group: g, noCollide: true };
  },

  // Фонограф: положи пластинку — и он заговорит дедушкиным голосом
  phonograph(def, G) {
    const m = mats(), g = new THREE.Group(), b = brass();
    rbox(0.45, 0.16, 0.38, 0.02, m.dark, 0, 0.83, 0, g);
    cyl(0.17, 0.17, 0.02, T.plain("#2a1a10", 0.6), 0, 0.92, 0, g, 32);
    const disc = cyl(0.16, 0.16, 0.008, T.plain("#0a0a0a", 0.3, { metalness: 0.2 }), 0, 0.935, 0, g, 32);
    disc.visible = false;
    const label = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), T.plain("#8a1e14", 0.6));
    label.rotation.x = -Math.PI / 2; label.position.y = 0.0045; disc.add(label);
    const arm = new THREE.Group(); arm.position.set(0.18, 0.95, -0.14); g.add(arm);
    box(0.015, 0.015, 0.2, b, -0.05, 0, 0.08, arm).rotation.y = -0.5;
    const hornPts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; hornPts.push(new THREE.Vector2(0.02 + Math.pow(t, 2.4) * 0.26, t * 0.55)); }
    const horn = new THREE.Mesh(new THREE.LatheGeometry(hornPts, 24), new THREE.MeshStandardMaterial({ color: "#c09a5c", metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }));
    horn.position.set(0.15, 0.95, -0.1); horn.rotation.set(-0.9, 0, -0.5); g.add(horn);
    cyl(0.06, 0.06, 0.04, b, 0.24, 0.84, 0.2, g, 12).rotation.z = Math.PI / 2;
    // столик
    rbox(0.6, 0.04, 0.5, 0.01, m.mid, 0, 0.73, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, 0.71, 0.04, m.dark, sx * 0.26, 0.355, sz * 0.21, g);
    blobShadow(0.6, 0.5, g);
    const flag = "played:" + def.id;
    const placed = () => G.is("placed:" + def.item);
    disc.visible = placed();
    let spinning = 0;
    G.every((dt) => { if (spinning > 0) { disc.rotation.y += dt * 4; spinning -= dt; } });
    const play = () => {
      spinning = 6;
      sfx.record?.(G.worldPos(g, [0, 1, 0]));
      setTimeout(() => { G.flag(flag); G.showNote(def.note); }, 1500);
    };
    G.onTap(g, () => {
      if (!placed()) {
        if (!G.has(def.item)) { G.say("phonoEmpty", null, 2600); return true; }
        G.take(def.item); G.flag("placed:" + def.item); disc.visible = true;
        sfx.click(G.worldPos(disc), 0.6);
      }
      play();
      return true;
    });
    return { group: g, w: 0.6, d: 0.5 };
  },

  // Перо огромной механической птицы
  feather(def, G) {
    const g = new THREE.Group();
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.quadraticCurveTo(0.12, 0.25, 0.04, 0.6); sh.quadraticCurveTo(0, 0.68, -0.04, 0.6); sh.quadraticCurveTo(-0.12, 0.25, 0, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false });
    const f = new THREE.Mesh(geo, T.metal("#16161c", 0.35));
    f.rotation.x = -Math.PI / 2; f.rotation.z = def.rot2 || 0.7; f.position.y = 0.01; g.add(f);
    const quill = cyl(0.004, 0.006, 0.7, T.metal("#3a3a40", 0.4), 0, 0.012, -0.3, g, 6); quill.rotation.x = Math.PI / 2; quill.rotation.z = 0.7;
    hitProxy(f, 0.3);
    G.onTap(g, () => { if (def.note) G.showNote(def.note); else G.say("featherMsg"); return true; });
    return { group: g, noCollide: true };
  },

  // Шкаф или ящик с замком. Внутри — предметы.
  cabinet(def, G) {
    const m = mats(), g = new THREE.Group(), b = brass();
    const W = def.w || 0.8, Hh = def.h || 1.0, D = def.d || 0.42, y0 = def.y0 ?? 0.7;
    const wood = T.woodMaterial(def.color || "#4a2e1a", { seed: 121 });
    box(W, Hh, 0.02, wood, 0, y0 + Hh / 2, -D / 2 + 0.01, g);
    for (const s of [-1, 1]) box(0.03, Hh, D, wood, s * (W / 2 - 0.015), y0 + Hh / 2, 0, g);
    box(W, 0.03, D, wood, 0, y0 + 0.015, 0, g);
    rbox(W + 0.04, 0.04, D + 0.03, 0.01, m.dark, 0, y0 + Hh, 0.01, g);
    box(W - 0.06, 0.02, D - 0.04, m.light, 0, y0 + Hh * 0.45, 0, g);
    if (y0 > 0.3) { for (const sx of [-1, 1]) box(0.04, y0, 0.04, m.dark, sx * (W / 2 - 0.05), y0 / 2, D / 2 - 0.05, g); }
    // дверца на петлях
    const pivot = new THREE.Group(); pivot.position.set(-W / 2 + 0.02, 0, D / 2); g.add(pivot);
    const leaf = new THREE.Group(); leaf.position.x = W / 2 - 0.02; pivot.add(leaf);
    rbox(W - 0.04, Hh - 0.04, 0.025, 0.008, wood, 0, y0 + Hh / 2, 0.0125, leaf);
    rbox(W - 0.18, Hh - 0.2, 0.012, 0.006, m.oak, 0, y0 + Hh / 2, 0.03, leaf);
    // замок
    const lock = def.lock || {};
    const cy = y0 + Hh * 0.55;
    const ref = { key: [0.38, 0.95], code: [0.1, 1.12], wires: [0, 1.2], socket: [0.3, 1.05] }[lock.type] || [0, 1];
    const lg = new THREE.Group(); leaf.add(lg);
    const lockX = lock.type === "key" ? W * 0.32 : 0;
    lg.position.set(lockX - ref[0], cy - ref[1], 0.0);
    if (lock.type === "wires") lg.scale.setScalar(Math.min(1, (W - 0.1) / 0.6));
    const flag = def.flag || "open:" + def.id;
    const pseudo = {
      def: { id: def.id }, isOpen: G.is(flag), solving: false,
      open() {
        if (this.isOpen) return;
        this.isOpen = true; G.flag(flag);
        sfx.lidOpen(G.worldPos(g, [0, cy, D / 2]));
        G.tween(0.9, (k) => { pivot.rotation.y = -1.9 * (1 - Math.pow(1 - k, 3)); });
        G.say(def.openMsg || "cabinetOpened", null, 2200);
      },
    };
    if (pseudo.isOpen) pivot.rotation.y = -1.9;
    if (LOCKS[lock.type]) LOCKS[lock.type](pseudo, lock, lg, G, b);
    else if (!lock.type) G.onTap(leaf, () => { pseudo.open(); return true; }, { owner: def.id });
    G.onTap(leaf, () => {
      if (pseudo.isOpen || pseudo.solving) return false;
      if ((lock.type === "key" || lock.type === "socket") && G.has(lock.item) && pseudo.useKey) return pseudo.useKey();
      if (!lock.type) { pseudo.open(); return true; }
      G.say({ key: "lockedKey", code: "lockedCode", wires: "lockedWires", socket: "lockedSocket" }[lock.type] || "lockedKey", null, 2400);
      return true;
    }, { owner: def.id });
    // содержимое
    (def.contents || []).forEach((id, i) => {
      const it = itemMesh(id, G.items);
      const n = def.contents.length;
      it.position.set((i - (n - 1) / 2) * Math.min(0.22, (W - 0.15) / n), y0 + Hh * 0.45 + 0.015, 0.02);
      g.add(it);
      pickable(G, it, id, def.id, () => pseudo.isOpen);
    });
    blobShadow(W, D, g, 0.45);
    G.addInspect(def.id, g, { pos: [0.05, cy + 0.05, D / 2 + 0.75], target: [0, cy - 0.05, 0] });
    return { group: g, w: W, d: D };
  },

  // Книга на полке: если потянуть, из неё что-то выпадет
  secretBook(def, G) {
    const g = new THREE.Group();
    const pivot = new THREE.Group(); pivot.position.y = def.h || 1.2; g.add(pivot);
    const bk = box(0.05, 0.3, 0.24, new THREE.MeshStandardMaterial({ map: T.bookSpineTexture(), color: def.color || "#3a1a50", roughness: 0.7 }), 0, 0.15, 0, pivot);
    const quill = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.16, 4), T.metal("#16161c", 0.4));
    quill.position.set(0, 0.34, 0.06); quill.rotation.z = 0.3; pivot.add(quill);
    hitProxy(bk, 0.15);
    const flag = "got:" + def.item;
    if (G.is(flag)) pivot.rotation.x = 0.35;
    G.onTap(g, () => {
      if (G.is(flag)) { G.say("bookEmpty", null, 2000); return true; }
      sfx.paper();
      G.tween(0.4, (k) => { pivot.rotation.x = 0.35 * k; });
      setTimeout(() => G.give(def.item), 450);
      return true;
    });
    return { group: g, noCollide: true };
  },

  // Масляная лампа на высокой подставке. Бывает потухшей (lit: false).
  oilLamp(def, G) {
    const m = mats(), g = new THREE.Group(), b = brass();
    const lit = def.lit !== false;
    cyl(0.16, 0.2, 0.05, m.dark, 0, 0.025, 0, g, 18);
    cyl(0.02, 0.025, 1.25, b, 0, 0.65, 0, g, 8);
    cyl(0.07, 0.09, 0.1, b, 0, 1.3, 0, g, 16);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({
      color: lit ? "#ffe0a0" : "#3a3a34", emissive: lit ? "#ffb040" : "#000", emissiveIntensity: lit ? 1.6 : 0, transparent: true, opacity: lit ? 0.9 : 0.55, roughness: 0.1 }));
    glass.scale.y = 1.3; glass.position.y = 1.47; g.add(glass);
    cyl(0.04, 0.05, 0.06, b, 0, 1.62, 0, g, 12);
    if (lit) {
      const l = G.light("#ffb060", def.power || 3, 7, [0, 1.5, 0], g);
      G.every((dt, time) => { if (l) l.intensity = (def.power || 3) * (0.92 + Math.sin(time * 13 + def.x) * 0.04 + Math.sin(time * 5.3) * 0.04); });
    } else {
      G.onTap(g, () => { G.say("lampOut", null, 2000); return true; });
    }
    blobShadow(0.4, 0.4, g);
    return { group: g, w: 0.35, d: 0.35 };
  },

  // Мышиная нора у пола. Из неё выбегают мыши.
  mouseHole(def, G) {
    const g = new THREE.Group();
    const sh = new THREE.Shape();
    sh.moveTo(-0.11, 0); sh.lineTo(-0.11, 0.08); sh.absarc(0, 0.08, 0.11, Math.PI, 0, true); sh.lineTo(0.11, 0); sh.closePath();
    const hole = new THREE.Mesh(new THREE.ShapeGeometry(sh, 12), new THREE.MeshBasicMaterial({ color: "#020202" }));
    hole.position.z = 0.012; g.add(hole);
    const eyes = new THREE.Group(); eyes.position.set(0, 0.08, 0.015); g.add(eyes);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.008, 8), new THREE.MeshBasicMaterial({ color: "#ff2010" })); e.position.x = s * 0.022; eyes.add(e); }
    let t0 = Math.random() * 10;
    G.every((dt, time) => { eyes.visible = Math.sin(time * 0.7 + t0) > 0.6 && Math.sin(time * 9 + t0) > -0.9; });
    G.onTap(g, () => { G.say("holeMsg", null, 2200); sfx.squeak(G.worldPos(g)); return true; });
    hitProxy(hole, 0.15);
    return { group: g, noCollide: true };
  },

  // Порванное письмо: собери куски на столе. Нажми на кусок, потом на другой —
  // они поменяются местами. Нажми на тот же кусок второй раз — он повернётся.
  letterBoard(def, G) {
    const m = mats(), g = new THREE.Group();
    const cols = def.cols || 2, rows = def.rows || 2, N = cols * rows;
    const BW = 0.9, BH = 0.66, y = 0.78;
    rbox(1.1, 0.05, 0.8, 0.01, m.mid, 0, 0.75, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.05, 0.73, 0.05, m.dark, sx * 0.48, 0.365, sz * 0.33, g);
    const felt = new THREE.Mesh(new THREE.PlaneGeometry(BW + 0.06, BH + 0.06), T.fabricMaterial("#1e3a2a"));
    felt.rotation.x = -Math.PI / 2; felt.position.y = y; g.add(felt);
    blobShadow(1.1, 0.8, g, 0.45);
    const tw = BW / cols, th = BH / rows;
    const slotPos = (i) => [(i % cols - (cols - 1) / 2) * tw, (Math.floor(i / cols) - (rows - 1) / 2) * th];
    // «рамки» пустых мест
    for (let i = 0; i < N; i++) {
      const [sx, sz] = slotPos(i);
      const fr = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.026, 4), new THREE.MeshBasicMaterial({ color: "#3a5a4a" }));
      fr.rotation.x = -Math.PI / 2; fr.position.set(sx, y + 0.001, sz); g.add(fr);
    }
    let tex = null;
    const makeTex = () => {
      const n = G.level.notes[def.note];
      const c = letterCanvas(tr(n.title), tr(n.text));
      tex?.dispose();
      tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      tiles.forEach((t) => { if (t) { t.mat.map = tex.clone(); t.mat.map.repeat.set(1 / cols, 1 / rows); t.mat.map.offset.set((t.piece % cols) / cols, 1 - (Math.floor(t.piece / cols) + 1) / rows); t.mat.map.needsUpdate = true; t.mat.needsUpdate = true; } });
    };
    const slots = new Array(N).fill(null); // в каждом слоте — кусок {piece, rot, grp}
    const tiles = [];
    G.debug = { ...(G.debug || {}), letter: { slots, tiles } };
    const solved = () => G.is(def.flag);
    const place = (pieceIdx, slot, rot) => {
      const grp = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(tw * 0.97, th * 0.97), mat);
      mesh.rotation.x = -Math.PI / 2; grp.add(mesh);
      const t = { piece: pieceIdx, rot, grp, mat, mesh };
      grp.rotation.y = -rot * Math.PI / 2;
      g.add(grp);
      tiles[pieceIdx] = t; slots[slot] = t;
      setSlot(t, slot);
      G.onTap(grp, () => tapSlot(slots.indexOf(t)), { owner: def.id });
      return t;
    };
    const setSlot = (t, slot) => {
      const [sx, sz] = slotPos(slot);
      t.grp.position.set(sx, y + 0.003, sz);
      // повёрнутые на 90° куски не помещаются в прямоугольник — уменьшим их
      const s = t.rot % 2 ? Math.min(tw, th) / Math.max(tw, th) : 1;
      t.grp.scale.setScalar(s);
    };
    let sel = -1;
    const highlight = () => slots.forEach((t, i) => { if (t) t.grp.position.y = y + (i === sel ? 0.03 : 0.003); });
    const check = () => {
      if (solved()) return;
      if (slots.every((t, i) => t && t.piece === i && t.rot % 4 === 0)) {
        G.flag(def.flag);
        sfx.crystal(G.worldPos(g, [0, 0.9, 0]));
        G.say("letterDone", null, 2500);
        setTimeout(() => G.showNote(def.note), 900);
      }
    };
    const tapSlot = (i) => {
      if (solved()) { G.showNote(def.note); return true; }
      if (sel === -1) { sel = i; sfx.paper(); highlight(); return true; }
      if (sel === i) {
        const t = slots[i]; t.rot = (t.rot + 1) % 4;
        G.tween(0.2, (k) => { t.grp.rotation.y = -(t.rot - 1 + k) * Math.PI / 2; }, () => { setSlot(t, i); check(); });
        sel = -1; highlight(); sfx.paper();
        return true;
      }
      const a = slots[sel], b = slots[i];
      slots[sel] = b; slots[i] = a;
      if (a) setSlot(a, i); if (b) setSlot(b, sel);
      sel = -1; highlight(); sfx.paper(); check();
      return true;
    };
    // кладём на стол все найденные куски
    const addPieces = () => {
      const have = def.pieces.map((p, i) => [p, i]).filter(([p]) => G.has(p));
      if (!have.length) return false;
      for (const [p, i] of have) {
        G.take(p); G.flag("placed:" + p);
        const free = slots.map((t, k) => (t ? -1 : k)).filter((k) => k >= 0);
        const slot = free[Math.floor(Math.random() * free.length)];
        place(i, slot, 1 + Math.floor(Math.random() * 3));
      }
      makeTex(); sfx.paper();
      G.say(def.pieces.every((p) => G.is("placed:" + p)) ? "letterAllPieces" : "letterSomePieces", null, 3000);
      return true;
    };
    // восстановление после загрузки
    if (solved()) def.pieces.forEach((p, i) => place(i, i, 0));
    else {
      const placedIdx = def.pieces.map((p, i) => [p, i]).filter(([p]) => G.is("placed:" + p)).map(([, i]) => i);
      const free = [...Array(N).keys()].sort(() => Math.random() - 0.5);
      placedIdx.forEach((i) => place(i, free.pop(), 1 + Math.floor(Math.random() * 3)));
    }
    makeTex(); G.onLang(makeTex);
    // нажатие на стол: положить куски из кармана
    G.onTap(felt, () => { if (!addPieces()) G.say(solved() ? "letterDone" : "letterNeedPieces", null, 2600); return true; }, { owner: def.id });
    G.onTap(g, () => { if (!addPieces()) G.say(solved() ? "letterDone" : "letterNeedPieces", null, 2600); return true; }, { owner: def.id });
    G.addInspect(def.id, g, { pos: [0, 1.6, 0.55], target: [0, 0.78, 0.02] }, () => { if (!solved()) addPieces(); });
    return { group: g, w: 1.1, d: 0.8 };
  },
});

export { CELL };
