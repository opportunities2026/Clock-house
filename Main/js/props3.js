// Предметы главы 3: часовая башня — маятник, зеркала и лунный луч, весы с гирями.
import * as THREE from "three";
import * as T from "./textures.js";
import { sfx, addTicking } from "./audio.js";
import { CELL } from "./world.js";
import { BUILDERS, box, rbox, cyl, sphere, plane, mats, blobShadow, keyMesh, hitProxy, pickable } from "./props.js";
import { itemMesh, ITEM_MESHES } from "./props2.js";

// Гиря с цифрой
export function weightMesh(n) {
  const g = new THREE.Group(), iron = T.metal("#4a4642", 0.5), brass = T.metal("#c09a5c", 0.3);
  const r = 0.035 + n * 0.008, h = 0.05 + n * 0.012;
  cyl(r, r * 1.08, h, iron, 0, h / 2, 0, g, 20);
  cyl(r * 0.4, r * 0.5, 0.025, iron, 0, h + 0.012, 0, g, 12);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.35, 0.006, 6, 16), brass);
  ring.position.y = h + 0.035; g.add(ring);
  const label = new THREE.Mesh(new THREE.CircleGeometry(r * 0.75, 20), new THREE.MeshStandardMaterial({ map: T.textTexture([String(n)], { w: 128, h: 128, font: "bold 90px Georgia, serif" }), metalness: 0.7, roughness: 0.35 }));
  label.rotation.x = -Math.PI / 2; label.position.set(r * 0.55, h + 0.001, 0); label.scale.setScalar(0.45);
  // цифра сбоку — её хорошо видно
  const side = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.1, h * 0.8), label.material);
  side.position.set(0, h / 2, r * 1.05 + 0.002); g.add(side);
  return g;
}

ITEM_MESHES.weight = (it) => weightMesh(it.value || 1);

Object.assign(BUILDERS, {

  // Подставка с раскрытой книгой
  lectern(def, G) {
    const m = mats(), g = new THREE.Group();
    cyl(0.2, 0.25, 0.05, m.dark, 0, 0.025, 0, g, 16);
    cyl(0.05, 0.06, 1.0, m.mid, 0, 0.55, 0, g, 12);
    const top = new THREE.Group(); top.position.set(0, 1.08, 0); top.rotation.x = 0.45; g.add(top);
    rbox(0.55, 0.03, 0.4, 0.01, m.dark, 0, 0, 0, top);
    for (const s of [-1, 1]) {
      const page = plane(0.24, 0.32, new THREE.MeshStandardMaterial({ map: T.paperTexture(10 + s), roughness: 0.9 }), s * 0.125, 0.025, 0, top);
      page.rotation.x = -Math.PI / 2; page.rotation.y = s * 0.06;
    }
    rbox(0.52, 0.02, 0.36, 0.008, T.leatherMaterial("#4a1a14"), 0, 0.014, 0, top);
    blobShadow(0.5, 0.5, g);
    hitProxy(top, 0.25);
    G.onTap(g, () => { G.showNote(def.note); return true; });
    return { group: g, w: 0.5, d: 0.5 };
  },

  // Огромный маятник башенных часов
  bigPendulum(def, G) {
    const g = new THREE.Group(), brass = T.metal("#b8904e", 0.35), iron = T.metal("#3a3632", 0.5);
    const pivot = new THREE.Group(); pivot.position.y = 2.95; g.add(pivot);
    box(0.5, 0.08, 0.12, iron, 0, 2.98, 0, g);
    box(0.04, 2.0, 0.02, brass, 0, -1.0, 0, pivot);
    const bob = cyl(0.3, 0.3, 0.05, brass, 0, -2.05, 0, pivot, 40); bob.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 40), iron); rim.position.y = -2.05; pivot.add(rim);
    G.every((dt, time) => { pivot.rotation.z = Math.sin(time * Math.PI / 1.6) * 0.22; });
    addTicking(G.worldPos(g, [0, 2.6, 0]), { loud: 1.6, pitch: 0.55 });
    G.onTap(pivot, () => { G.say("pendulumMsg"); return true; });
    return { group: g, noCollide: true };
  },

  // Зеркала и лунный луч. Нажатие поворачивает зеркало.
  lightPuzzle(def, G) {
    const g = new THREE.Group();
    const Y = 1.35;
    const brass = T.metal("#c09a5c", 0.3);
    const glassMat = new THREE.MeshStandardMaterial({ color: "#d8e4ec", metalness: 1, roughness: 0.04 });
    const mirrors = new Map();
    for (const md of def.mirrors) {
      const [cx, cz] = md.cell;
      const stand = new THREE.Group();
      stand.position.set((cx + 0.5) * CELL, 0, (cz + 0.5) * CELL);
      g.add(stand);
      cyl(0.2, 0.24, 0.05, brass, 0, 0.025, 0, stand, 20);
      cyl(0.025, 0.025, Y - 0.05, brass, 0, Y / 2, 0, stand, 8);
      const head = new THREE.Group(); head.position.y = Y; stand.add(head);
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 40), brass); head.add(frame);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.29, 40), glassMat); head.add(glass);
      const back = new THREE.Mesh(new THREE.CircleGeometry(0.29, 40), T.woodMaterial("#3a2212", { seed: 97 }));
      back.rotation.y = Math.PI; back.position.z = -0.004; head.add(back);
      blobShadow(0.45, 0.45, stand, 0.4);
      const m = { state: G.is(def.flag) ? md.correct || md.state : md.state, head, stand, angle: 0 };
      m.angle = m.state === "/" ? Math.PI / 4 : Math.PI * 3 / 4;
      head.rotation.y = m.angle;
      mirrors.set(cx + "," + cz, m);
      G.addCollider(stand.position.x - 0.25, stand.position.z - 0.25, stand.position.x + 0.25, stand.position.z + 0.25);
      G.onTap(stand, () => {
        if (G.is(def.flag)) { G.say("mirrorDone"); return true; }
        m.state = m.state === "/" ? "\\" : "/";
        const from = m.angle, to = m.angle + Math.PI / 2;
        m.angle = to;
        sfx.mirror(G.worldPos(head));
        G.tween(0.35, (k) => { head.rotation.y = from + (to - from) * k; }, trace);
        return true;
      });
    }

    // луч — набор светящихся цилиндров
    const beamMat = new THREE.MeshBasicMaterial({ color: "#bcd8ff", transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    const coreMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const pool = [];
    const segment = (i) => {
      if (!pool[i]) {
        const s = new THREE.Group();
        s.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10, 1, true), beamMat));
        s.add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1, 6, 1, true), coreMat));
        s.traverse((o) => { o.userData.noRay = true; });
        g.add(s); pool[i] = s;
      }
      return pool[i];
    };
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), coreMat);
    spot.userData.noRay = true; g.add(spot);

    function trace() {
      let [cx, cz] = def.source.cell, [dx, dz] = def.source.dir;
      let start = new THREE.Vector3((cx + 0.5 - dx * 0.5) * CELL, Y, (cz + 0.5 - dz * 0.5) * CELL);
      const pts = [start];
      let hit = false;
      for (let step = 0; step < 80; step++) {
        const m = mirrors.get(cx + "," + cz);
        const t = def.target;
        if (cx === t.cell[0] && cz === t.cell[1] && dx === t.dir[0] && dz === t.dir[1]) hit = true;
        if (m) {
          pts.push(new THREE.Vector3((cx + 0.5) * CELL, Y, (cz + 0.5) * CELL));
          if (m.state === "/") [dx, dz] = [-dz, -dx]; else [dx, dz] = [dz, dx];
        }
        const nx = cx + dx, nz = cz + dz;
        if (G.isBlocked(nx, nz)) {
          pts.push(new THREE.Vector3((cx + 0.5 + dx * 0.5) * CELL, Y, (cz + 0.5 + dz * 0.5) * CELL));
          break;
        }
        cx = nx; cz = nz;
      }
      pool.forEach((s) => { s.visible = false; });
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], s = segment(i);
        const len = a.distanceTo(b);
        s.visible = len > 0.01;
        s.position.copy(a).add(b).multiplyScalar(0.5);
        s.scale.set(1, len, 1);
        s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      }
      spot.position.copy(pts[pts.length - 1]);
      if (hit && !G.is(def.flag)) G.flag(def.flag);
    }
    G.afterBuild(trace);
    G.onFlag("open:" + (def.door || ""), () => setTimeout(trace, 1800));
    G.every((dt, time) => { beamMat.opacity = 0.45 + Math.sin(time * 3) * 0.08; });
    return { group: g, noCollide: true, placed: true };
  },

  // Весы: уравновесь гирю «6» тремя маленькими гирями
  balance(def, G) {
    const m = mats(), g = new THREE.Group(), brass = T.metal("#c09a5c", 0.3), iron = T.metal("#3a3632", 0.5);
    // основание с ящиком
    rbox(0.9, 0.5, 0.5, 0.02, m.dark, 0, 0.25, 0, g);
    const drawer = new THREE.Group(); drawer.position.set(0, 0.25, 0.0); g.add(drawer);
    rbox(0.4, 0.16, 0.02, 0.005, m.oak, 0, 0, 0.255, drawer);
    sphere(0.018, brass, 0, 0, 0.275, drawer, 10);
    box(0.36, 0.01, 0.4, m.light, 0, -0.07, 0.05, drawer);
    cyl(0.04, 0.05, 1.0, brass, 0, 1.0, 0, g, 12);
    const beamPivot = new THREE.Group(); beamPivot.position.y = 1.52; g.add(beamPivot);
    box(1.2, 0.04, 0.04, brass, 0, 0, 0, beamPivot);
    sphere(0.05, brass, 0, 0, 0, beamPivot, 12);
    const needle = box(0.015, 0.25, 0.01, iron, 0, 0.13, 0.03, beamPivot); void needle;
    const pans = [];
    for (const s of [-1, 1]) {
      const hang = new THREE.Group(); hang.position.set(s * 0.58, 0, 0); beamPivot.add(hang);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        const chain = cyl(0.003, 0.003, 0.5, iron, Math.cos(a) * 0.1, -0.25, Math.sin(a) * 0.1, hang, 4);
        chain.rotation.z = Math.cos(a) * 0.2; chain.rotation.x = -Math.sin(a) * 0.2;
      }
      const pan = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 8, 0, Math.PI * 2, Math.PI * 0.65, Math.PI * 0.35), brass);
      pan.material = brass; pan.position.y = -0.38; hang.add(pan);
      const plate = new THREE.Group(); plate.position.y = -0.53; hang.add(plate);
      pans.push({ hang, plate, s });
    }
    // левая чаша: большая гиря
    const big = weightMesh(def.left || 6); big.scale.setScalar(1.25); big.position.y = 0.0; pans[0].plate.add(big);
    blobShadow(1.0, 0.6, g, 0.45);

    const placed = def.items.filter((it) => G.is("placed:" + it));
    const value = (it) => G.items[it]?.value || 1;
    const rightMeshes = [];
    const addRight = (it, i) => {
      const w = weightMesh(value(it));
      w.position.set((i - 1) * 0.11, 0, (i % 2) * 0.04);
      pans[1].plate.add(w);
      rightMeshes.push(w);
    };
    placed.forEach(addRight);
    const total = () => def.items.filter((it) => G.is("placed:" + it)).reduce((a, it) => a + value(it), 0);
    let tilt = 0;
    const targetTilt = () => THREE.MathUtils.clamp(((def.left || 6) - total()) / (def.left || 6), -1, 1) * 0.28;
    tilt = targetTilt();
    // ключ в ящике
    let key = null;
    if (def.reward) {
      key = itemMesh(def.reward, G.items);
      key.position.set(0, -0.06, 0.08); drawer.add(key);
      pickable(G, key, def.reward, def.id, () => G.is(def.flag));
    }
    if (G.is(def.flag)) drawer.position.z = 0.3;
    G.every((dt) => {
      tilt += (targetTilt() - tilt) * Math.min(1, dt * 3);
      beamPivot.rotation.z = tilt;
      for (const p of pans) p.hang.rotation.z = -tilt; // чаши висят ровно
    });
    const tapPan = () => {
      if (G.is(def.flag)) return false;
      const it = def.items.find((x) => G.has(x));
      if (!it) { G.say(total() ? "needMoreWeights" : "balanceEmpty", null, 3000); return true; }
      G.take(it); G.flag("placed:" + it);
      addRight(it, rightMeshes.length);
      sfx.weight(G.worldPos(pans[1].plate));
      if (total() === (def.left || 6)) {
        setTimeout(() => {
          G.flag(def.flag);
          sfx.crystal(G.worldPos(g, [0, 1.5, 0]));
          sfx.drawer(G.worldPos(drawer), true);
          G.tween(0.6, (k) => { drawer.position.z = 0.3 * k; });
          G.say("balanced", null, 3500);
        }, 1200);
      } else G.say("weightPlaced", null, 2200);
      return true;
    };
    for (const p of pans) G.onTap(p.hang, tapPan, { owner: def.id });
    G.onTap(drawer, () => { if (!G.is(def.flag)) { sfx.locked(G.worldPos(drawer)); G.say("drawerLocked"); } return true; }, { owner: def.id });
    G.addInspect(def.id, g, { pos: [0, 1.45, 1.35], target: [0, 1.0, 0] });
    return { group: g, w: 1.2, d: 0.6 };
  },

  itemWeight(def, G) {
    const g = new THREE.Group();
    const w = weightMesh(G.items[def.item]?.value || 1);
    g.add(w);
    pickable(G, w, def.item);
    return { group: g, noCollide: true };
  },
});

export { keyMesh };
