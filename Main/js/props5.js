// Предметы главы 5 «Механическая оранжерея»: пятнашки, цветы в горшках,
// фонтан, насос, свечи, канал с подъёмным мостом и другое.
import * as THREE from "three";
import * as T from "./textures.js";
import { sfx } from "./audio.js";
import { CELL } from "./world.js";
import { BUILDERS, box, rbox, cyl, sphere, plane, mats, blobShadow, hitProxy, pickable } from "./props.js";
import { itemMesh, ITEM_MESHES } from "./props2.js";

const brass = () => T.metal("#c09a5c", 0.3);
const iron = () => T.metal("#2a2a2c", 0.55);
const terracotta = () => new THREE.MeshStandardMaterial({ color: "#9a4a2a", roughness: 0.9 });

// Рукоятка (для насоса и рычага моста)
function handleMesh() {
  const g = new THREE.Group();
  const bar = cyl(0.016, 0.016, 0.32, iron(), 0, 0, 0, g, 8); bar.rotation.z = Math.PI / 2;
  const grip = cyl(0.026, 0.026, 0.11, T.woodMaterial("#5a2a14", { seed: 8 }), 0.19, 0, 0, g, 10); grip.rotation.z = Math.PI / 2;
  const hub = cyl(0.03, 0.03, 0.04, brass(), -0.16, 0, 0, g, 6); hub.rotation.x = Math.PI / 2;
  return g;
}

Object.assign(ITEM_MESHES, {
  handle() { const g = new THREE.Group(), h = handleMesh(); h.position.y = 0.03; g.add(h); return g; },
});

// Картинка для пятнашек: роза в круге
function roseCanvas() {
  const S = 768, c = document.createElement("canvas"); c.width = c.height = S;
  const ctx = c.getContext("2d"), r = T.rng(5);
  const g = ctx.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S * 0.7);
  g.addColorStop(0, "#f0e2c0"); g.addColorStop(1, "#b89a64");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = 10; ctx.strokeRect(14, 14, S - 28, S - 28);
  // стебель и листья
  ctx.strokeStyle = "#2a5a2a"; ctx.lineWidth = 16; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(S / 2, S - 60); ctx.bezierCurveTo(S / 2 - 60, S * 0.7, S / 2 + 40, S * 0.55, S / 2, S * 0.42); ctx.stroke();
  ctx.fillStyle = "#3a7a34";
  for (const [x, y, a] of [[S / 2 - 70, S * 0.72, -0.6], [S / 2 + 60, S * 0.6, 0.7]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, 70, 28, 0, 0, 7); ctx.fill(); ctx.restore(); }
  // бутон
  for (let k = 0; k < 7; k++) {
    const rr = 150 - k * 19, a0 = k * 0.9;
    ctx.fillStyle = `hsl(${352 + k * 2}, ${70 + k * 3}%, ${30 + k * 5}%)`;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) { const a = a0 + (i / 5) * Math.PI * 2; ctx.quadraticCurveTo(S / 2 + Math.cos(a - 0.6) * rr * 1.25, S * 0.33 + Math.sin(a - 0.6) * rr * 1.1, S / 2 + Math.cos(a) * rr, S * 0.33 + Math.sin(a) * rr * 0.9); }
    ctx.fill();
  }
  ctx.fillStyle = "#3a1a10"; ctx.font = "italic bold 54px Georgia, serif"; ctx.textAlign = "center";
  ctx.fillText("Rosa mechanica", S / 2, S - 30);
  for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(60,40,10,${r() * 0.06})`; ctx.fillRect(r() * S, r() * S, 3, 3); }
  return c;
}

// Насос / рычаг: деталь-рукоятку нужно вставить, а потом покрутить
function crankMachine(def, G, g, socket, { turn, view, needMsg, placedMsg, doneMsg, turnSec = 2.4 }) {
  const placedFlag = "placed:" + def.item;
  const h = handleMesh(); g.add(h); h.position.copy(socket);
  const isPlaced = () => G.is(placedFlag) || G.is(def.flag);
  h.visible = isPlaced();
  let busy = false;
  const tap = () => {
    if (G.is(def.flag) || busy) { if (G.is(def.flag)) { G.say(doneMsg, null, 2000); return true; } return false; }
    if (!isPlaced()) {
      if (!G.has(def.item)) { sfx.locked(G.worldPos(h)); G.say(needMsg, null, 2800); return true; }
      G.take(def.item); G.flag(placedFlag); h.visible = true;
      sfx.metal(G.worldPos(h)); G.say(placedMsg, null, 2400);
      return true;
    }
    busy = true;
    turn(h, turnSec, () => { busy = false; G.flag(def.flag); G.exitInspect(1200); });
    return true;
  };
  G.onTap(g, tap, { owner: def.id });
  hitProxy(h, 0.14);
  G.addInspect(def.id, g, view);
  return h;
}

Object.assign(BUILDERS, {

  // Пятнашки 3×3 на крышке шкатулки. Собери розу — крышка откроется.
  slidingBox(def, G) {
    const m = mats(), g = new THREE.Group();
    const W = 0.54, Hh = 0.16, y0 = 0.78;
    const wood = T.woodMaterial("#3a1a10", { seed: 51, vertical: false, rough: 0.4 });
    // столик
    rbox(0.8, 0.04, 0.6, 0.01, m.mid, 0, 0.74, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, 0.72, 0.04, m.dark, sx * 0.34, 0.36, sz * 0.24, g);
    blobShadow(0.8, 0.6, g, 0.45);
    // шкатулка
    box(W, 0.012, W, wood, 0, y0 + 0.006, 0, g);
    for (const s of [-1, 1]) { box(W, Hh, 0.014, wood, 0, y0 + Hh / 2, s * (W / 2 - 0.007), g); box(0.014, Hh, W, wood, s * (W / 2 - 0.007), y0 + Hh / 2, 0, g); }
    box(W - 0.03, 0.004, W - 0.03, T.fabricMaterial("#2a0a10"), 0, y0 + 0.014, 0, g);
    const lid = new THREE.Group(); lid.position.set(0, y0 + Hh, -W / 2); g.add(lid);
    rbox(W + 0.016, 0.03, W + 0.016, 0.008, wood, 0, 0.015, W / 2, lid);
    const N = 3, cell = (W - 0.08) / N;
    const tex = new THREE.CanvasTexture(roseCanvas()); tex.colorSpace = THREE.SRGBColorSpace;
    const flag = def.flag || "open:" + def.id;
    let solved = G.is(flag);
    // поле: board[i] = номер плитки или -1 (пусто)
    const r = T.rng(def.seed || 77);
    let board = [...Array(N * N).keys()]; board[N * N - 1] = -1;
    if (!solved) {
      let e = N * N - 1, prev = -1;
      for (let k = 0; k < (def.moves || 70); k++) {
        const ex = e % N, ez = Math.floor(e / N);
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [ex + dx, ez + dz]).filter(([x, z]) => x >= 0 && z >= 0 && x < N && z < N).map(([x, z]) => z * N + x).filter((i) => i !== prev);
        const n = opts[Math.floor(r() * opts.length)];
        board[e] = board[n]; board[n] = -1; prev = e; e = n;
      }
    }
    const tiles = [];
    const slotPos = (i) => [(i % N - (N - 1) / 2) * cell, (Math.floor(i / N) - (N - 1) / 2) * cell];
    for (let t = 0; t < N * N; t++) {
      const mat = new THREE.MeshStandardMaterial({ map: tex.clone(), roughness: 0.6 });
      mat.map.repeat.set(1 / N, 1 / N); mat.map.offset.set((t % N) / N, 1 - (Math.floor(t / N) + 1) / N); mat.map.needsUpdate = true;
      const tg = new THREE.Group(); lid.add(tg);
      rbox(cell - 0.006, 0.014, cell - 0.006, 0.004, T.woodMaterial("#6a4020", { seed: 60 + t }), 0, 0.007, 0, tg);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(cell - 0.012, cell - 0.012), mat);
      face.rotation.x = -Math.PI / 2; face.position.y = 0.0145; tg.add(face);
      tiles.push(tg);
      G.onTap(tg, () => {
        if (solved || moving) return true;
        const i = board.indexOf(t), e = board.indexOf(-1);
        const near = Math.abs((i % N) - (e % N)) + Math.abs(Math.floor(i / N) - Math.floor(e / N)) === 1;
        if (!near) { sfx.click(G.worldPos(tg), 0.6); return true; }
        board[e] = t; board[i] = -1;
        const [ax, az] = slotPos(i), [bx, bz] = slotPos(e);
        moving = true;
        sfx.click(G.worldPos(tg), 1.3);
        G.tween(0.15, (k) => tg.position.set(ax + (bx - ax) * k, 0.03, W / 2 + az + (bz - az) * k), () => { moving = false; check(); });
        return true;
      }, { owner: def.id });
    }
    let moving = false;
    const place = () => board.forEach((t, i) => { if (t >= 0) { const [x, z] = slotPos(i); tiles[t].position.set(x, 0.03, W / 2 + z); } });
    place();
    tiles[N * N - 1].visible = solved;
    if (solved) lid.rotation.x = -1.9;
    const check = () => {
      if (solved || !board.every((t, i) => t === i || (t === -1 && i === N * N - 1))) return;
      solved = true;
      const last = tiles[N * N - 1]; const [x, z] = slotPos(N * N - 1);
      last.position.set(x, 0.12, W / 2 + z); last.visible = true;
      sfx.crystal(G.worldPos(lid));
      G.tween(0.4, (k) => { last.position.y = 0.12 - 0.09 * k; }, () => {
        G.flag(flag);
        setTimeout(() => { sfx.lidOpen(G.worldPos(lid)); G.tween(1.0, (k) => { lid.rotation.x = -1.9 * k; }); G.say("sliderDone", null, 2600); }, 500);
      });
    };
    G.debug = { ...(G.debug || {}), slider: { board, tiles } };
    (def.contents || []).forEach((id, i) => {
      const it = itemMesh(id, G.items);
      it.position.set((i - ((def.contents.length - 1) / 2)) * 0.16, y0 + 0.02, 0.02);
      g.add(it);
      pickable(G, it, id, def.id, () => G.is(flag));
    });
    G.addInspect(def.id, g, { pos: [0, 1.5, 0.42], target: [0, y0 + 0.1, 0.02] }, () => { if (!solved) G.say("sliderHint", null, 3200); });
    return { group: g, w: 0.8, d: 0.6 };
  },

  // Глиняный горшок. Цветок нужного цвета, а на горшке нарисован знак.
  flowerPot(def, G) {
    const g = new THREE.Group();
    const pts = [[0.0, 0], [0.13, 0], [0.17, 0.3], [0.19, 0.31], [0.19, 0.35], [0.0, 0.35]].map(([x, y]) => new THREE.Vector2(x, y));
    const pot = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), terracotta()); g.add(pot);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.17, 18), T.plain("#2a1a10", 1)); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.33; g.add(soil);
    if (def.symbol) {
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const ctx = c.getContext("2d"); ctx.strokeStyle = ctx.fillStyle = "#f0e6d0"; ctx.lineWidth = 7; ctx.lineCap = "round";
      T.drawSymbol(ctx, def.symbol, 64, 64, 46);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9 }));
      sign.position.set(0, 0.18, 0.162); sign.rotation.x = -0.13; g.add(sign);
    }
    const stemMat = T.plain("#2a5a24", 0.8);
    if (def.color) {
      const stem = cyl(0.008, 0.01, 0.5, stemMat, 0, 0.58, 0, g, 6); stem.rotation.z = 0.05;
      for (const s of [-1, 1]) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), T.plain("#3a7a30", 0.7)); leaf.scale.set(1.4, 0.2, 0.6); leaf.position.set(s * 0.05, 0.5 + s * 0.06, 0); leaf.rotation.z = s * 0.5; g.add(leaf); }
      const petalMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.6, emissive: def.color, emissiveIntensity: 0.08 });
      const head = new THREE.Group(); head.position.set(0.02, 0.84, 0); head.rotation.x = 0.5; g.add(head);
      for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), petalMat); p.scale.set(1, 0.3, 0.55); p.position.set(Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05); p.rotation.y = -a; head.add(p); }
      sphere(0.025, T.plain("#e0b020", 0.6), 0, 0.015, 0, head, 8);
      G.every((dt, time) => { head.rotation.z = Math.sin(time * 0.7 + def.x * 3) * 0.06; });
    } else {
      for (let k = 0; k < 6; k++) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), T.plain("#2e5a28", 0.7)); leaf.scale.set(0.35, 1.3, 0.12); leaf.position.set(Math.cos(k) * 0.05, 0.48, Math.sin(k) * 0.05); leaf.rotation.set(Math.sin(k) * 0.4, k, Math.cos(k) * 0.4); g.add(leaf); }
    }
    if (def.item) {
      const it = itemMesh(def.item, G.items); it.position.set(0.06, 0.335, 0.05); it.scale.setScalar(0.7); g.add(it);
      pickable(G, it, def.item);
    }
    G.onTap(pot, () => { G.say(def.color ? "potMsg" : "potNoFlower", null, 2400); return true; });
    blobShadow(0.45, 0.45, g);
    return { group: g, w: 0.4, d: 0.4 };
  },

  // Большое растение в кадке (украшение)
  bigPlant(def, G) {
    const g = new THREE.Group(), r = T.rng(Math.floor(def.x * 13 + def.z * 7));
    cyl(0.3, 0.24, 0.45, T.woodMaterial("#4a2e1a", { seed: 70 }), 0, 0.225, 0, g, 16);
    for (const y of [0.08, 0.38]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29 - y * 0.1, 0.012, 6, 24), iron()); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring); }
    const leafMat = new THREE.MeshStandardMaterial({ color: "#2a5a28", roughness: 0.7, side: THREE.DoubleSide });
    for (let k = 0; k < (def.leaves || 11); k++) {
      const a = r() * Math.PI * 2, len = 0.7 + r() * 0.7;
      const pv = new THREE.Group(); pv.position.y = 0.45; pv.rotation.y = a; pv.rotation.x = 0.4 + r() * 0.7; g.add(pv);
      cyl(0.01, 0.014, len, T.plain("#3a5a20", 0.8), 0, len / 2, 0, pv, 5);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6), leafMat); leaf.scale.set(0.9, 0.05, 2.2 * (0.6 + r() * 0.5)); leaf.position.set(0, len, 0.25); leaf.rotation.x = -0.6; pv.add(leaf);
    }
    G.every((dt, time) => { g.rotation.z = Math.sin(time * 0.4 + def.x) * 0.006; });
    blobShadow(0.8, 0.8, g, 0.4);
    return { group: g, w: 0.6, d: 0.6 };
  },

  // Садовая скамейка
  bench(def, G) {
    const g = new THREE.Group(), wood = T.woodMaterial("#5a3a20", { seed: 81, vertical: false });
    for (let i = 0; i < 4; i++) box(1.4, 0.03, 0.09, wood, 0, 0.45, -0.15 + i * 0.1, g);
    for (let i = 0; i < 3; i++) { const b = box(1.4, 0.08, 0.025, wood, 0, 0.65 + i * 0.11, -0.22, g); b.rotation.x = -0.15; }
    for (const s of [-1, 1]) { box(0.05, 0.45, 0.4, iron(), s * 0.62, 0.225, 0, g); box(0.05, 0.4, 0.05, iron(), s * 0.62, 0.68, -0.22, g); }
    blobShadow(1.4, 0.5, g, 0.4);
    return { group: g, w: 1.4, d: 0.5 };
  },

  // Свеча на подставке. Пламя клонится туда, откуда тянет сквозняк.
  candle(def, G) {
    const g = new THREE.Group(), b = brass();
    cyl(0.12, 0.15, 0.03, b, 0, 0.015, 0, g, 18);
    cyl(0.02, 0.025, 0.95, b, 0, 0.5, 0, g, 8);
    cyl(0.07, 0.04, 0.04, b, 0, 0.99, 0, g, 16);
    cyl(0.025, 0.025, 0.16, T.plain("#efe6cf", 0.6), 0, 1.09, 0, g, 12);
    const flame = new THREE.Group(); flame.position.y = 1.18; g.add(flame);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffd070" }));
    fl.scale.set(1, 2.4, 1); fl.position.y = 0.035; flame.add(fl);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), new THREE.MeshBasicMaterial({ color: "#fff8e0" }));
    core.scale.set(1, 2, 1); core.position.y = 0.025; flame.add(core);
    flame.traverse((o) => { o.userData.noRay = true; });
    const light = G.light("#ffb060", def.power || 1.6, 5, [0, 1.25, 0], g);
    // куда клонится пламя (в клетках мира)
    let lean = 0;
    if (def.leanTo) {
      const dx = def.leanTo[0] - def.x, dz = def.leanTo[1] - def.z;
      flame.rotation.order = "YXZ";
      flame.rotation.y = Math.atan2(dx, dz) - THREE.MathUtils.degToRad(def.rot || 0);
      lean = 0.75;
    }
    G.every((dt, time) => {
      const f = Math.sin(time * 17 + def.x) * 0.5 + Math.sin(time * 7.3) * 0.5;
      flame.rotation.x = lean * (0.85 + f * 0.25) + (lean ? 0 : f * 0.04);
      fl.scale.y = 2.4 + f * 0.3;
      if (light) light.intensity = (def.power || 1.6) * (0.85 + f * 0.12);
    });
    G.onTap(g, () => { G.say(def.leanTo ? "candleDraft" : "candleMsg", null, 2600); return true; });
    blobShadow(0.3, 0.3, g);
    return { group: g, w: 0.3, d: 0.3 };
  },

  // Фонтан. Ключ лежит на дне, но вода ледяная и глубокая — нужно откачать её насосом.
  fountain(def, G) {
    const g = new THREE.Group(), stone = T.stoneMaterial();
    const R = 1.0, Hb = 0.55;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.1, 10, 40), stone); ring.rotation.x = Math.PI / 2; ring.position.y = Hb; g.add(ring);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.05, R + 0.1, Hb, 40, 1, true), stone); wall.position.y = Hb / 2; g.add(wall);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.07, R - 0.07, Hb, 40, 1, true), new THREE.MeshStandardMaterial({ color: "#3a3a34", roughness: 0.9, side: THREE.BackSide })); inner.position.y = Hb / 2; g.add(inner);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(R - 0.06, 40), new THREE.MeshStandardMaterial({ color: "#56625a", roughness: 0.8 })); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.05; g.add(bottom);
    // колонна и механическая рыба
    cyl(0.12, 0.18, 1.1, stone, 0, 0.55, 0, g, 16);
    cyl(0.32, 0.28, 0.08, stone, 0, 1.12, 0, g, 24);
    const fish = new THREE.Group(); fish.position.set(0, 1.3, 0); g.add(fish);
    const fb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), brass()); fb.scale.set(0.6, 0.8, 1.4); fish.add(fb);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 4), brass()); tail.rotation.x = -Math.PI / 2; tail.position.z = -0.2; fish.add(tail);
    fish.rotation.x = -0.5;
    // струйка воды
    const jetMat = new THREE.MeshStandardMaterial({ color: "#9ac0c8", transparent: true, opacity: 0.55, roughness: 0.05 });
    const jet = cyl(0.012, 0.03, 0.75, jetMat, 0, 0.92, 0.32, g, 8); jet.rotation.x = 0.35;
    const wtex = T.waterTexture();
    const waterMat = new THREE.MeshStandardMaterial({ color: "#16302e", roughness: 0.06, metalness: 0.3, transparent: true, opacity: 0.8, bumpMap: wtex, bumpScale: 1.0 });
    const water = new THREE.Mesh(new THREE.RingGeometry(0.19, R - 0.06, 40), waterMat); water.rotation.x = -Math.PI / 2; g.add(water);
    const flag = def.flag;
    let level = G.is(flag) ? 0 : 1;
    const apply = () => { water.position.y = 0.06 + 0.42 * level; water.visible = level > 0.02; jet.visible = level > 0.5; };
    apply();
    // ключ на дне
    let key = null;
    if (def.item) {
      key = itemMesh(def.item, G.items); key.position.set(-0.5, 0.07, -0.35); key.rotation.y = 0.7; key.scale.setScalar(1.3); g.add(key);
      pickable(G, key, def.item, def.id, () => level < 0.05);
    }
    G.every((dt, time) => { wtex.offset.set(time * 0.03, time * 0.02); fish.rotation.z = Math.sin(time * 0.8) * 0.05; });
    G.onTap(water, () => { if (level < 0.05) return false; sfx.splash(G.worldPos(water)); G.say("fountainDeep", null, 3000); return true; }, { owner: def.id });
    G.onTap(g, () => { G.say(level > 0.05 ? "fountainMsg" : "fountainEmpty", null, 2600); return true; }, { owner: def.id });
    G.onFlag(flag, () => {
      sfx.drain(G.worldPos(water), 4);
      G.tween(4, (k) => { level = 1 - k; apply(); });
    });
    G.addInspect(def.id, g, { pos: [0, 2.4, 0.9], target: [-0.3, 0, -0.3] });
    return { group: g, w: 2.3, d: 2.3 };
  },

  // Насос у стены. Нужна рукоятка, потом — крутить.
  pump(def, G) {
    const g = new THREE.Group(), cu = T.metal("#8a5a3a", 0.4), ir = iron(), b = brass();
    rbox(0.7, 0.12, 0.5, 0.02, ir, 0, 0.06, 0, g);
    cyl(0.22, 0.22, 0.9, cu, -0.12, 0.6, -0.02, g, 20);
    for (const y of [0.25, 0.6, 0.95]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.015, 6, 24), b); r.rotation.x = Math.PI / 2; r.position.set(-0.12, y, -0.02); g.add(r); }
    sphere(0.22, cu, -0.12, 1.05, -0.02, g, 16).scale.y = 0.5;
    const gauge = cyl(0.08, 0.08, 0.03, b, 0.2, 1.0, 0.1, g, 20); gauge.rotation.x = Math.PI / 2;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.065, 20), T.plain("#efe6cf", 0.6)); face.position.set(0.2, 1.0, 0.117); g.add(face);
    const ng = new THREE.Group(); ng.position.set(0.2, 1.0, 0.12); g.add(ng);
    box(0.005, 0.055, 0.004, T.plain("#a01010", 0.5), 0, 0.025, 0, ng);
    // труба уходит в стену (к фонтану)
    cyl(0.06, 0.06, 1.5, cu, -0.12, 1.75, -0.02, g, 12);
    const p2 = cyl(0.06, 0.06, 0.5, cu, -0.12, 2.5, -0.25, g, 12); p2.rotation.x = Math.PI / 2;
    // гнездо для рукоятки и маховик
    const axle = cyl(0.04, 0.04, 0.14, b, 0.22, 0.6, 0.15, g, 12); axle.rotation.x = Math.PI / 2;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 24), ir); wheel.position.set(0.22, 0.6, 0.22); g.add(wheel);
    const socket = new THREE.Vector3(0.22 + 0.16, 0.6, 0.26);
    ng.rotation.z = G.is(def.flag) ? -1.2 : 1.2;
    crankMachine(def, G, g, socket, {
      view: { pos: [0.5, 1.1, 1.1], target: [0.15, 0.75, 0.1] },
      needMsg: "pumpNoHandle", placedMsg: "pumpHandlePlaced", doneMsg: "pumpDone",
      turn: (hm, sec, done) => {
        sfx.gearsTurning(G.worldPos(g, [0, 0.6, 0]), sec);
        G.tween(sec, (k) => {
          const a = -k * Math.PI * 6;
          hm.position.set(0.22 + Math.cos(a) * 0.16, 0.6 + Math.sin(a) * 0.16, 0.26); hm.rotation.z = a;
          wheel.rotation.z = a; ng.rotation.z = 1.2 - 2.4 * k;
        }, done);
      },
    });
    G.onFlag(def.flag, () => setTimeout(() => G.say("pumpWorked", null, 3200), 600));
    blobShadow(0.7, 0.5, g, 0.45);
    return { group: g, w: 0.7, d: 0.5 };
  },

  // Канал с тёмной водой и подъёмный мост через него
  canal(def, G) {
    const g = new THREE.Group(), stone = T.stoneMaterial();
    const wtex = T.waterTexture();
    const mat = new THREE.MeshStandardMaterial({ color: "#061412", roughness: 0.05, metalness: 0.5, bumpMap: wtex, bumpScale: 1.4 });
    for (const [cx, cz] of def.cells) {
      const p = plane(CELL, CELL - 0.3, mat, (cx + 0.5) * CELL, 0.03, (cz + 0.5) * CELL, g);
      p.rotation.x = -Math.PI / 2;
      // бортики
      for (const s of [-1, 1]) box(CELL, 0.22, 0.15, stone, (cx + 0.5) * CELL, 0.11, (cz + 0.5) * CELL + s * (CELL / 2 - 0.075), g);
      G.onTap(p, () => { sfx.splash(G.worldPos(p)); G.say("canalMsg", null, 2600); return true; });
      G.setBlocked(cx, cz, true);
    }
    G.every((dt, time) => { wtex.offset.set(time * 0.05, time * 0.01); });
    // мост: поднят вертикально у северного бортика
    const [bx, bz] = def.bridge;
    const pivot = new THREE.Group(); pivot.position.set((bx + 0.5) * CELL, 0.24, bz * CELL + 0.1); g.add(pivot);
    const wood = T.woodMaterial("#5a3a20", { seed: 91, vertical: false });
    const deck = new THREE.Group(); pivot.add(deck);
    for (let i = 0; i < 6; i++) box(1.1, 0.05, 0.2, wood, 0, 0.025, 0.12 + i * 0.22, deck);
    for (const s of [-1, 1]) box(0.06, 0.08, 1.35, iron(), s * 0.52, 0.04, 0.68, deck);
    for (const s of [-1, 1]) box(0.1, 1.6, 0.1, iron(), s * 0.62, 0.8, -0.05, pivot);
    const down = () => { pivot.rotation.x = 0; G.setBlocked(bx, bz, false); };
    if (G.is(def.flag)) down(); else pivot.rotation.x = -Math.PI / 2;
    G.onFlag(def.flag, () => {
      sfx.gearsTurning(G.worldPos(pivot), 2.5);
      G.tween(2.5, (k) => { pivot.rotation.x = -Math.PI / 2 * (1 - k * k); }, () => { sfx.bong?.(G.worldPos(pivot), 1); down(); });
    });
    return { group: g, noCollide: true, placed: true };
  },

  // Рычаг моста: в гнездо нужно вставить рукоятку и потянуть
  bridgeLever(def, G) {
    const g = new THREE.Group(), ir = iron(), b = brass();
    rbox(0.4, 1.0, 0.3, 0.03, ir, 0, 0.5, 0, g);
    rbox(0.46, 0.06, 0.36, 0.02, b, 0, 1.02, 0, g);
    const plate = cyl(0.09, 0.09, 0.03, b, 0, 0.75, 0.16, g, 20); plate.rotation.x = Math.PI / 2;
    const hole = cyl(0.03, 0.03, 0.02, T.plain("#050505", 1), 0, 0.75, 0.175, g, 10); hole.rotation.x = Math.PI / 2;
    cyl(0.02, 0.02, 2.0, ir, 0, 2.0, -0.05, g, 6); // цепь к мосту
    const socket = new THREE.Vector3(0.16, 0.75, 0.2);
    crankMachine(def, G, g, socket, {
      view: { pos: [0.3, 1.2, 1.0], target: [0.05, 0.8, 0.1] },
      needMsg: "leverNoHandle", placedMsg: "leverHandlePlaced", doneMsg: "bridgeDown",
      turn: (hm, sec, done) => {
        sfx.lever(G.worldPos(g, [0, 0.8, 0.2]));
        G.tween(sec * 0.5, (k) => { const a = k * 1.4; hm.position.set(Math.cos(a) * 0.16, 0.75 - Math.sin(a) * 0.16, 0.2); hm.rotation.z = -a; }, done);
      },
    });
    blobShadow(0.5, 0.4, g, 0.45);
    return { group: g, w: 0.45, d: 0.35 };
  },

  // Пьедестал с предметом (в тайной комнате)
  pedestal(def, G) {
    const g = new THREE.Group(), stone = T.stoneMaterial();
    cyl(0.22, 0.26, 0.08, stone, 0, 0.04, 0, g, 20);
    cyl(0.15, 0.17, 0.85, stone, 0, 0.5, 0, g, 20);
    cyl(0.25, 0.22, 0.07, stone, 0, 0.96, 0, g, 20);
    if (def.item) { const it = itemMesh(def.item, G.items); it.position.y = 1.0; g.add(it); pickable(G, it, def.item); }
    if (def.note) {
      const p = plane(0.18, 0.24, new THREE.MeshStandardMaterial({ map: T.paperTexture(8), roughness: 0.9 }), -0.05, 1.0, 0.08, g);
      p.rotation.x = -Math.PI / 2; p.rotation.z = 0.3; p.position.y = 1.002;
      hitProxy(p, 0.14); G.onTap(p, () => { G.showNote(def.note); return true; });
    }
    blobShadow(0.5, 0.5, g);
    return { group: g, w: 0.5, d: 0.5 };
  },
});
