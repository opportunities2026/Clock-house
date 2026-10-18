// Двери с замками: ключ, кодовый замок, механизм из шестерёнок.
import * as THREE from "three";
import { CELL, HEIGHT } from "./world.js";
import { box, rbox, cyl, gearMesh, keyMesh, blobShadow } from "./props.js";
import * as T from "./textures.js";
import { sfx } from "./audio.js";

const SIDE_ROT = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };
const LEAF_W = 1.1, LEAF_H = 2.25, OPEN = Math.PI / 2 * 0.96;

export function buildDoor(def, G) {
  const g = new THREE.Group();
  const [cx, cz] = def.cell;
  g.position.set((cx + 0.5) * CELL, 0, (cz + 0.5) * CELL);
  g.rotation.y = SIDE_ROT[def.side] ?? 0;

  const wood = T.woodMaterial("#4a2a16", { seed: 41 });
  const trim = T.woodMaterial("#2e1a0c", { seed: 42 });
  const brass = T.metal("#c09a5c", 0.3);
  const wallMat = T.roomMaterials("doorway").wall;

  // стенка с проёмом (косяки и перемычка)
  const side = (CELL - LEAF_W) / 2;
  for (const s of [-1, 1]) box(side, HEIGHT, 0.16, wallMat, s * (LEAF_W / 2 + side / 2), HEIGHT / 2, 0, g);
  box(LEAF_W, HEIGHT - LEAF_H, 0.16, wallMat, 0, LEAF_H + (HEIGHT - LEAF_H) / 2, 0, g);
  // наличники с обеих сторон
  for (const z of [0.09, -0.09]) {
    for (const s of [-1, 1]) box(0.09, LEAF_H + 0.09, 0.03, trim, s * (LEAF_W / 2 + 0.045), (LEAF_H + 0.09) / 2, z, g);
    box(LEAF_W + 0.18, 0.09, 0.03, trim, 0, LEAF_H + 0.045, z, g);
  }

  // створка на петлях
  const pivot = new THREE.Group(); pivot.position.set(-LEAF_W / 2, 0, 0); g.add(pivot);
  const leaf = new THREE.Group(); leaf.position.x = LEAF_W / 2; pivot.add(leaf);
  box(LEAF_W - 0.01, LEAF_H - 0.01, 0.05, wood, 0, LEAF_H / 2, 0, leaf);
  for (const z of [0.027, -0.027]) {
    for (const [px, py, pw, ph] of [[-0.24, 0.55, 0.4, 0.7], [0.24, 0.55, 0.4, 0.7], [-0.24, 1.55, 0.4, 0.95], [0.24, 1.55, 0.4, 0.95]]) {
      rbox(pw, ph, 0.02, 0.008, wood, px, py, z, leaf);
    }
  }
  for (const z of [0.05, -0.05]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), brass);
    knob.position.set(LEAF_W / 2 - 0.1, 1.0, z); leaf.add(knob);
    cyl(0.03, 0.03, 0.012, brass, LEAF_W / 2 - 0.1, 1.0, z * 0.6, leaf).rotation.x = Math.PI / 2;
  }
  for (const y of [0.3, 1.95]) cyl(0.012, 0.012, 0.12, brass, -LEAF_W / 2 + 0.005, y, 0.03, leaf, 8);
  // номер двери
  rbox(0.16, 0.1, 0.01, 0.01, new THREE.MeshStandardMaterial({ map: T.textTexture([String(def.number)], { w: 256, h: 160, font: "bold 110px Georgia, serif" }), metalness: 0.8, roughness: 0.35 }), 0, 1.85, 0.034, leaf);
  blobShadow(CELL, 0.5, g, 0.35);

  const flag = "open:" + def.id;
  const door = { def, g, pivot, isOpen: G.is(flag) };
  G.setBlocked(cx, cz, !door.isOpen);
  if (door.isOpen) pivot.rotation.y = OPEN;

  door.open = () => {
    if (door.isOpen) return;
    door.isOpen = true;
    G.flag(flag);
    G.setBlocked(cx, cz, false);
    setTimeout(() => {
      sfx.doorCreak(G.worldPos(g, [0, 1.2, 0]));
      G.tween(1.5, (k) => { pivot.rotation.y = OPEN * (1 - Math.pow(1 - k, 2.4)); });
    }, 250);
    G.exitInspect(700);
    G.say("doorOpened", null, 2000);
    G.onDoorOpened?.(def);
  };

  const lock = def.lock || { type: "none" };
  const id = def.id;
  const lockG = new THREE.Group(); leaf.add(lockG);
  if (lock.type === "key") keyLock(door, lock, lockG, G, brass);
  else if (lock.type === "code") codeLock(door, lock, lockG, G, brass);
  else if (lock.type === "gears") gearLock(door, lock, lockG, G, brass);

  // Нажатие на саму створку
  G.onTap(leaf, () => {
    if (door.isOpen || door.solving) return false;
    if (lock.type === "key") {
      if (G.has(lock.item) && door.useKey) return door.useKey();
      sfx.locked(G.worldPos(g, [0, 1, 0])); G.say("lockedKey");
    }
    else if (lock.type === "code") G.say("lockedCode", null, 2500);
    else if (lock.type === "gears") G.say("lockedGears");
    return true;
  }, { owner: id });

  const views = {
    key: { pos: [0.38, 1.05, 0.6], target: [0.38, 0.95, 0] },
    code: { pos: [0.1, 1.17, 0.55], target: [0.1, 1.12, 0] },
    gears: { pos: [0, 1.3, 1.05], target: [0, 1.3, 0] },
  };
  if (!door.isOpen) G.addInspect(id, g, views[lock.type] || views.key, null, () => !door.isOpen);
  return door;
}

function keyLock(door, lock, lg, G, brass) {
  const x = 0.38 - 0.0, y = 0.95, z = 0.03;
  const esc = rbox(0.07, 0.17, 0.012, 0.01, brass, x, y, z, lg);
  const hole = cyl(0.009, 0.009, 0.014, T.plain("#050403", 1), x, y + 0.02, z + 0.002, lg, 12); hole.rotation.x = Math.PI / 2;
  box(0.007, 0.03, 0.014, T.plain("#050403", 1), x, y - 0.002, z + 0.002, lg);
  const key = keyMesh(); key.visible = false; key.rotation.order = "ZYX"; key.rotation.y = Math.PI / 2; key.position.set(x, y + 0.01, z + 0.06);
  lg.add(key);
  const tap = () => {
    if (door.isOpen || door.solving) return false;
    if (!G.has(lock.item)) {
      sfx.locked(G.worldPos(esc)); G.say("lockedKey");
      return true;
    }
    door.solving = true;
    G.take(lock.item);
    key.visible = true;
    sfx.click(G.worldPos(esc), 0.7);
    G.say("keyTurned", null, 1200);
    G.tween(0.5, (k) => { key.position.z = z + 0.06 - 0.04 * k; }, () => {
      G.tween(0.5, (k) => { key.rotation.x = (Math.PI / 2) * k; }, () => {
        sfx.unlock(G.worldPos(esc));
        door.open();
      });
    });
    return true;
  };
  // весь замок (накладка, скважина) отвечает на нажатие
  G.onTap(lg, tap, { owner: door.def.id });
  door.useKey = tap;
}

// невидимая прямоугольная зона нажатия
function hitProxyBox(obj, w, h, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  m.position.z = d / 2;
  obj.add(m);
  return m;
}

function codeLock(door, lock, lg, G, brass) {
  const code = String(lock.code);
  const n = code.length, step = 0.066, R = 0.036;
  const x0 = 0.1, y = 1.12, z = 0.03;
  const bodyW = n * step + 0.07;
  rbox(bodyW, 0.13, 0.05, 0.012, brass, x0, y, z + 0.02, lg);
  box(bodyW - 0.03, 0.08, 0.02, T.plain("#120c06", 1), x0, y, z + 0.04, lg);
  // накладки сверху и снизу: видна только одна цифра на каждом колесе
  for (const s of [-1, 1]) rbox(bodyW - 0.02, 0.03, 0.01, 0.004, brass, x0, y + s * 0.033, z + 0.05 + R, lg);
  const digits = [];
  const strip = T.digitStrip();
  for (let i = 0; i < n; i++) {
    const dx = x0 + (i - (n - 1) / 2) * step;
    const geo = new THREE.CylinderGeometry(R, R, 0.05, 30, 1, true);
    geo.rotateZ(Math.PI / 2);
    const dialMat = new THREE.MeshStandardMaterial({ map: strip, metalness: 0.5, roughness: 0.4 });
    const dial = new THREE.Mesh(geo, dialMat);
    const holder = new THREE.Group(); holder.position.set(dx, y, z + 0.05); lg.add(holder);
    holder.add(dial);
    for (const s of [-1, 1]) cyl(R + 0.002, R + 0.002, 0.004, brass, s * 0.027, 0, 0, holder, 24).rotation.z = Math.PI / 2;
    hitProxyBox(holder, 0.06, 0.1, 0.08);
    const d = { value: 0, dial, target: -Infinity };
    digits.push(d);
    setDial(d, 0, true);
    G.onTap(holder, () => {
      if (door.isOpen || door.solving) return false;
      d.value = (d.value + 1) % 10;
      setDial(d, d.value);
      sfx.click(G.worldPos(holder), 1 + i * 0.05);
      if (digits.map((q) => q.value).join("") === code) {
        door.solving = true;
        setTimeout(() => { sfx.unlock(G.worldPos(holder)); door.open(); }, 450);
      }
      return true;
    }, { owner: door.def.id });
  }
  // Плавная прокрутка барабанов
  G.every((dt) => {
    for (const d of digits) d.dial.rotation.x += (d.target - d.dial.rotation.x) * Math.min(1, dt * 14);
  });
  if (door.isOpen) digits.forEach((d, i) => setDial(d, +code[i], true));

  function setDial(d, v, instant) {
    // Цифра i на текстуре стоит под углом (i + 0.5) * 36°. Поворачиваем колесо так,
    // чтобы нужная цифра смотрела на игрока, и всегда крутим в одну сторону.
    let tgt = (v + 0.5) * (Math.PI / 5);
    while (tgt < d.target - 1e-4) tgt += Math.PI * 2;
    d.target = tgt;
    if (instant) d.dial.rotation.x = tgt;
  }
}

function gearLock(door, lock, lg, G, brass) {
  const cx = 0, cy = 1.3, z = 0.03;
  const plateMat = T.metal("#7a6034", 0.5);
  rbox(0.82, 0.62, 0.02, 0.02, plateMat, cx, cy, z + 0.01, lg);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const r = cyl(0.012, 0.012, 0.01, brass, cx + sx * 0.37, cy + sy * 0.27, z + 0.025, lg, 10); r.rotation.x = Math.PI / 2;
  }
  const sizes = lock.items.map((it) => G.items[it]?.size || 0.08);
  const rF = 0.1;
  // ведущая шестерёнка (уже на месте) и позиции для трёх недостающих
  const F = { x: -0.06, y: 0, r: rF, dir: 1 };
  const mesh = (a, b) => a + b - 0.012;
  const L = { r: sizes[2] }; const ang1 = Math.PI / 6;
  L.x = F.x + Math.cos(ang1) * mesh(rF, L.r); L.y = F.y + Math.sin(ang1) * mesh(rF, L.r); L.dir = -1;
  const Md = { r: sizes[1] }; const ang2 = -Math.PI / 3;
  Md.x = L.x + Math.cos(ang2) * mesh(L.r, Md.r); Md.y = L.y + Math.sin(ang2) * mesh(L.r, Md.r); Md.dir = 1;
  const S = { r: sizes[0] }; const ang3 = Math.PI * 1.1;
  S.x = F.x + Math.cos(ang3) * mesh(rF, S.r); S.y = F.y + Math.sin(ang3) * mesh(rF, S.r); S.dir = -1;
  const slots = [
    { item: lock.items[0], ...S },
    { item: lock.items[1], ...Md },
    { item: lock.items[2], ...L },
  ];
  const fixed = gearMesh(rF, brass); fixed.position.set(cx + F.x, cy + F.y, z + 0.04); lg.add(fixed);
  const all = [{ m: fixed, r: rF, dir: 1 }];
  const ringMat = new THREE.MeshBasicMaterial({ color: "#2a1c0a", transparent: true, opacity: 0.55 });
  slots.forEach((s) => {
    const peg = cyl(0.012, 0.012, 0.05, T.metal("#3a3a3a", 0.5), cx + s.x, cy + s.y, z + 0.04, lg, 12); peg.rotation.x = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(s.r - 0.006, s.r, 40), ringMat);
    ring.position.set(cx + s.x, cy + s.y, z + 0.021); lg.add(ring);
    const gm = gearMesh(s.r, brass); gm.position.set(cx + s.x, cy + s.y, z + 0.04); gm.visible = false; lg.add(gm);
    s.gm = gm; s.ring = ring;
    s.placed = G.is("placed:" + s.item) || door.isOpen;
    if (s.placed) { gm.visible = true; ring.visible = false; }
    all.push({ m: gm, r: s.r, dir: s.dir });
    const tap = () => {
      if (door.isOpen || s.placed) return false;
      if (G.has(s.item)) {
        G.take(s.item); G.flag("placed:" + s.item);
        s.placed = true; gm.visible = true; ring.visible = false;
        gm.position.z = z + 0.12;
        G.tween(0.35, (k) => { gm.position.z = z + 0.12 - 0.08 * k; }, () => sfx.metal(G.worldPos(gm)));
        if (slots.every((q) => q.placed)) {
          spinning = true;
          setTimeout(() => sfx.gearsTurning(G.worldPos(lg), 2.2), 400);
          setTimeout(() => { sfx.unlock(G.worldPos(lg)); spinning = false; door.open(); }, 2700);
        } else G.say("gearPlaced", null, 1500);
      } else if (lock.items.some((it) => G.has(it))) {
        sfx.wrong(G.worldPos(peg)); G.say("wrongGear", null, 2400);
      } else {
        G.say("needGear", null, 2000);
      }
      return true;
    };
    G.onTap(peg, tap, { owner: door.def.id });
    G.onTap(ring, tap, { owner: door.def.id });
  });
  let spinning = false;
  G.every((dt) => {
    if (!spinning) return;
    for (const a of all) a.m.rotation.z += a.dir * (0.9 * rF / a.r) * dt * 2.5;
  });
}
