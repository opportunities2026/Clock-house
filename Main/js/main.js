// ДОМ ЧАСОВЩИКА — главный файл игры.
// Здесь: 3D-сцена, Роберт (игрок), осмотр предметов, сохранения и меню.
import * as THREE from "three";
import { RoomEnvironment } from "../lib/addons/RoomEnvironment.js";
import { LEVELS, ORDER } from "../levels/index.js";
import { buildWorld, CELL } from "./world.js";
import { BUILDERS } from "./props.js";
import { lanternMesh } from "./props2.js";
import "./props3.js";
import "./props4.js";
import "./props5.js";
import "./props6.js";
import { Owl } from "./owl.js";
import { MiceSwarm } from "./mice.js";
import { Crow } from "./crow.js";
import { buildDoor } from "./doors.js";
import { Controls } from "./controls.js";
import * as T from "./textures.js";
import * as UI from "./ui.js";
import { t, tr, setLang, getLang } from "./i18n.js";
import { sfx, unlockAudio, setVolume, updateListener, tickAudio, suspend } from "./audio.js";
import { loadGame, saveGame, clearGame, loadSettings, saveSettings, loadProgress, unlockChapter, completeChapter } from "./save.js";

const VERSION = "0.6.0";
const EYE = 1.5;            // рост Роберта (высота глаз), метры
const RADIUS = 0.28;        // «толщина» Роберта для столкновений
const WALK = 1.9, RUN = 3.3; // скорость, м/с
const REACH = 2.8;          // как далеко можно дотянуться рукой

const settings = loadSettings();
setLang(settings.lang);

// ---------------------------------------------------------------- какая глава
// Ссылка вида #play-chapter2 запускает главу заново, иначе продолжаем сохранение.
const bootSave = loadGame();
const hashPlay = location.hash.startsWith("#play") ? (location.hash.split("-")[1] || "chapter1") : null;
const level = LEVELS[hashPlay || bootSave?.chapter || "chapter1"] || LEVELS.chapter1;
// Старые сохранения первой главы: если она пройдена, открываем вторую
if (bootSave && !bootSave.chapter && bootSave.flags?.includes("chapter_end")) unlockChapter("chapter2");
// Пройденные главы: всё, что перед последней открытой главой, считаем пройденным
{
  const p = loadProgress();
  ORDER.forEach((id, i) => { if (p.unlocked.includes(ORDER[i + 1])) completeChapter(id); });
  if (bootSave?.chapter && bootSave.flags?.includes("chapter_end")) completeChapter(bootSave.chapter);
}
const savedEnded = !hashPlay && bootSave?.flags?.includes("chapter_end");
const continueNext = savedEnded && level.next ? level.next : null;

// ---------------------------------------------------------------- рендер
const canvas = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
T.setAnisotropy(renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
scene.background = new THREE.Color("#050403");
scene.fog = new THREE.FogExp2("#0b0806", 0.045);
const camera = new THREE.PerspectiveCamera(70, 1, 0.03, 80);
scene.add(camera);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.12;
scene.add(new THREE.HemisphereLight("#6a5a48", "#1a120a", 0.3));

// «Свеча» Роберта: слабый тёплый свет рядом с ним, чтобы в углах не было черно
const handLight = new THREE.PointLight("#ffb070", 1.6, 5, 2);
handLight.position.set(0.25, -0.25, -0.2);
camera.add(handLight);

function applyQuality() {
  const dpr = window.devicePixelRatio || 1;
  renderer.setPixelRatio(settings.quality === "low" ? Math.min(dpr, 1) : Math.min(dpr, 1.6));
  resize();
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 80 : 70;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
applyQuality();

// ---------------------------------------------------------------- состояние игры
const state = { flags: new Set(), inventory: [], notes: [], player: null };
const player = { x: 0, z: 0, yaw: 0, pitch: 0, bob: 0, stepPhase: 0, moving: 0 };
let world = null;
let started = false, paused = true, ended = false;
const updaters = [];
const tweens = [];
const lights = [];
const langListeners = [];
const blocked = new Set();
const colliders = [];   // прямоугольники мебели [minX, minZ, maxX, maxZ]
const inspectables = {};
const pendingPos = [];
let building = false;
let clock = 0;
let inspect = null;      // текущий осматриваемый предмет
let camAnim = null;      // анимация камеры при входе/выходе из осмотра
let uiBusy = false;      // открыта записка или меню — 3D не реагирует
let owl = null;          // Страж (только во второй главе)
const chasers = [];      // все, кто может гнаться за Робертом
const flagListeners = {};
const afterBuildHooks = [];
let heldLantern = null;

function persist() {
  saveGame({
    v: 1, chapter: level.id,
    flags: [...state.flags], inventory: state.inventory, notes: state.notes,
    player: { x: player.x, z: player.z, yaw: player.yaw },
  });
}

// ---------------------------------------------------------------- API для предметов и загадок
const G = {
  level, items: level.items, flames: [],
  is: (f) => state.flags.has(f),
  flag(f) {
    if (state.flags.has(f)) return;
    state.flags.add(f);
    persist();
    (flagListeners[f] || []).forEach((fn) => fn());
  },
  onFlag(f, fn) { (flagListeners[f] ||= []).push(fn); },
  afterBuild(fn) { afterBuildHooks.push(fn); },
  // Место, где можно спрятаться (шкаф). anim.open/close — анимация дверец
  addHide(id, root, view, anim) {
    inspectables[id] = { id, root, view, hide: true, anim, canEnter: () => true };
    root.userData.inspectId = id;
  },
  has: (item) => state.inventory.includes(item),
  selected: () => selectedItem,
  unflag(f) { if (state.flags.delete(f)) persist(); },
  give(item, { quiet = false } = {}) {
    if (!state.inventory.includes(item)) state.inventory.push(item);
    G.flag("got:" + item);
    sfx.pickup();
    if (level.items[item]?.icon === "lantern") takeLantern();
    if (!quiet) UI.toast(t("got", { item: tr(level.items[item]?.name) }));
    renderInv();
    UI.flashSlot(state.inventory.indexOf(item));
    persist();
  },
  take(item) {
    const i = state.inventory.indexOf(item);
    if (i >= 0) state.inventory.splice(i, 1);
    renderInv();
    persist();
  },
  say(key, vars, ms) {
    const text = typeof key === "string" ? t(key, vars || {}) : tr(key);
    UI.toast(text, ms || Math.max(2200, text.length * 55));
  },
  addNote(id) {
    if (state.notes.includes(id)) return;
    state.notes.push(id);
    persist();
    setTimeout(() => UI.toast(t("noteAdded"), 1800), 200);
    document.getElementById("btn-diary").classList.add("pulse");
  },
  async showNote(id) {
    const n = level.notes[id];
    if (!n) return;
    sfx.paper();
    uiBusy = true; controls.reset();
    const had = state.notes.includes(id);
    if (!had) { state.notes.push(id); persist(); }
    await UI.showNote(tr(n.title), tr(n.text));
    uiBusy = false;
    if (!had) { UI.toast(t("noteAdded"), 1600); document.getElementById("btn-diary").classList.add("pulse"); }
  },
  onTap(obj, fn, opts = {}) { obj.userData.tap = { fn, owner: opts.owner || null }; },
  addInspect(id, root, view, onEnter, canEnter) {
    inspectables[id] = { id, root, view, onEnter, canEnter: canEnter || (() => true) };
    root.userData.inspectId = id;
  },
  exitInspect(delay = 0) { setTimeout(() => leaveInspect(), delay); },
  tween(dur, fn, done) { tweens.push({ t: 0, dur, fn, done }); },
  every(fn) { updaters.push(fn); },
  light(color, intensity, distance, pos, parent) {
    const l = new THREE.PointLight(color, intensity, distance, 2);
    l.position.set(...pos);
    l.userData.base = intensity;
    parent.add(l);
    lights.push(l);
    return l;
  },
  worldPos(obj, local = [0, 0, 0]) {
    const v = new THREE.Vector3(...local);
    if (building) pendingPos.push({ obj, v });
    else { obj.updateWorldMatrix(true, false); v.applyMatrix4(obj.matrixWorld); }
    return v;
  },
  isBlocked: (cx, cz) => isBlockedCell(cx, cz),
  addCollider(minX, minZ, maxX, maxZ) { colliders.push([minX, minZ, maxX, maxZ]); },
  setBlocked(cx, cz, on) { const k = cx + "," + cz; if (on) blocked.add(k); else blocked.delete(k); },
  zoneOf(def) { return world.themeOf(Math.floor(def.x), Math.floor(def.z)); },
  onLang(fn) { langListeners.push(fn); },
  onDoorOpened(def) {
    if (def.id === "door3") {
      // Снизу, из подвала, доносится уханье… Роберт пугается.
      setTimeout(() => {
        const [sx, sz] = stairsPos();
        sfx.owl(new THREE.Vector3(sx, -3, sz));
        setTimeout(() => sfx.breath(true, 3), 1500);
      }, 2200);
    }
  },
};

function cellPos(ch) {
  for (let z = 0; z < world.H; z++) for (let x = 0; x < world.W; x++) if (world.at(x, z) === ch) return [(x + 0.5) * CELL, (z + 0.5) * CELL];
  return null;
}
function stairsPos() { return cellPos("e") || [0, 0]; }

// ---------------------------------------------------------------- фонарь
function takeLantern() {
  handLight.intensity = 4.5; handLight.distance = 10; handLight.color.set("#ffb868");
  if (!heldLantern) {
    heldLantern = lanternMesh();
    heldLantern.scale.setScalar(0.7);
    heldLantern.position.set(0.32, -0.46, -0.6);
    heldLantern.traverse((o) => { o.userData.noRay = true; });
    camera.add(heldLantern);
  }
}

// ---------------------------------------------------------------- Страж: погоня и «поймал»
let chased = false, chaseBreath = 0;
function onSpotted(who) {
  chased = true; chaseBreath = 0;
  document.body.classList.add("chased");
  G.say(who?.msgSpotted || "owlSpotted", null, 2600);
  sfx.heartbeat(4, 0.45);
}
function onLost() {
  chased = false;
  document.body.classList.remove("chased");
  if (inspect?.hide) setTimeout(() => sfx.breath(false, 2), 400);
}
// Скример: тот, кто поймал, с криком бросается прямо в экран
let shake = 0, scaring = false;
async function jumpscare(who) {
  scaring = true;
  const m = who.scareObject ? who.scareObject() : who.mesh;
  const parent = m.parent, pos = m.position.clone(), rot = m.rotation.clone(), sc = m.scale.clone();
  camera.add(m);
  m.position.set(0, -0.12, -1.8); m.rotation.set(0.15, 0, 0); m.scale.setScalar(who.scareScale || 1.1);
  who.onScare?.(true);
  sfx.scream(camera.position.clone());
  document.body.classList.add("scare");
  shake = 1;
  await new Promise((r) => { G.tween(0.18, (k) => { m.position.z = -1.8 + 1.35 * k; m.position.y = -0.12 + 0.05 * Math.sin(k * 9); }, r); });
  await new Promise((r) => setTimeout(r, 650));
  document.body.classList.remove("scare");
  who.onScare?.(false);
  if (parent) parent.add(m); else m.removeFromParent();
  m.position.copy(pos); m.rotation.copy(rot); m.scale.copy(sc);
  scaring = false;
}

async function onCaught(who = owl) {
  chased = false;
  document.body.classList.remove("chased");
  uiBusy = true; controls.reset();
  await jumpscare(who);
  await UI.fade(true, 500);
  const cp = [...(level.checkpoints || [])].reverse().find((c) => !c.flag || state.flags.has(c.flag)) || level.start;
  player.x = cp.x * CELL; player.z = cp.z * CELL;
  player.yaw = THREE.MathUtils.degToRad(cp.angle || 0); player.pitch = 0;
  inspect = null; camAnim = null; UI.setInspectUI(false); document.body.classList.remove("hiding");
  if (heldLantern) heldLantern.visible = true;
  controls.walkEnabled = true;
  playerCamera(camera);
  chasers.forEach((c) => c.reset());
  await new Promise((r) => setTimeout(r, 600));
  await UI.fade(false, 700);
  uiBusy = false;
  G.say(who?.msgCaught || "caught", null, 4000);
  persist();
}

// ---------------------------------------------------------------- сборка уровня
function buildLevel() {
  building = true;
  world = buildWorld(level);
  scene.add(world.group);

  for (const def of level.objects) {
    const b = BUILDERS[def.type];
    if (!b) { console.warn("Неизвестный предмет:", def.type); continue; }
    const res = b(def, G) || {};
    const g = res.group;
    if (!res.placed) {
      g.position.set(def.x * CELL, def.y || 0, def.z * CELL);
      if (def.type === "painting" || def.type === "chalkboard") g.position.y = 0;
      g.rotation.y = THREE.MathUtils.degToRad(def.rot || 0);
    }
    scene.add(g);
    if (!res.noCollide && res.w) {
      // прямоугольник мебели с учётом поворота
      const a = g.rotation.y, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
      const hw = (res.w * c + res.d * s) / 2, hd = (res.w * s + res.d * c) / 2;
      const oz = res.offsetZ || 0;
      const cx = g.position.x + Math.sin(a) * oz, cz = g.position.z + Math.cos(a) * oz;
      colliders.push([cx - hw, cz - hd, cx + hw, cz + hd]);
    }
  }
  for (const d of level.doors) scene.add(buildDoor(d, G).g);

  // свет у лестницы: вниз в подвал — холодный, наверх в башню — тёплый
  const down = cellPos("e"), up = cellPos("u");
  if (down) { const glow = new THREE.PointLight("#6a8aff", 4, 6, 2); glow.position.set(down[0], -1.6, down[1]); scene.add(glow); }
  if (up) { const glow = new THREE.PointLight("#ffc070", 6, 7, 2); glow.position.set(up[0], 4.2, up[1]); scene.add(glow); }

  const getPlayer = () => ({ x: player.x, z: player.z, hidden: !!inspect?.hide, running: player.running });
  if (level.owl) {
    owl = new Owl({ cfg: level.owl, world, G, scene, getPlayer, onSpotted: () => onSpotted(owl), onLost, onCaught: () => onCaught(owl) });
    chasers.push(owl);
  }
  if (level.mice) {
    const holes = level.objects.filter((o) => o.type === "mouseHole").map((o) => [o.x, o.z, o.rot || 0]);
    const mice = new MiceSwarm({ cfg: { holes, ...level.mice }, world, G, scene, getPlayer, onSpotted: () => onSpotted(mice), onLost, onCaught: () => onCaught(mice) });
    mice.msgSpotted = "miceSpotted"; mice.msgCaught = "caughtMice";
    chasers.push(mice);
  }
  if (level.crow) {
    const crow = new Crow({ cfg: level.crow, world, G, scene, getPlayer, onSpotted: () => onSpotted(crow), onLost, onCaught: () => onCaught(crow) });
    crow.msgSpotted = "crowSpotted"; crow.msgCaught = "caughtCrow";
    chasers.push(crow);
  }
  // глава может закончиться не на лестнице, а когда случится что-то важное
  if (level.endFlag) G.onFlag(level.endFlag, () => setTimeout(() => { if (!ended) endChapter(); }, 3500));

  scene.updateMatrixWorld(true);
  for (const p of pendingPos) { p.obj.updateWorldMatrix(true, false); p.v.applyMatrix4(p.obj.matrixWorld); }
  pendingPos.length = 0;
  // тени-пятна и пламя не должны мешать нажатиям
  scene.traverse((o) => { if (o.isMesh && o.material && o.material.depthWrite === false) o.userData.noRay = true; });
  building = false;
  afterBuildHooks.forEach((fn) => fn());
}

// ---------------------------------------------------------------- игрок и столкновения
function isBlockedCell(cx, cz) {
  return world.isWall(cx, cz) || blocked.has(cx + "," + cz);
}

function pushOut(px, pz, minX, minZ, maxX, maxZ) {
  const qx = Math.max(minX, Math.min(px, maxX)), qz = Math.max(minZ, Math.min(pz, maxZ));
  const dx = px - qx, dz = pz - qz, d2 = dx * dx + dz * dz;
  if (d2 >= RADIUS * RADIUS) return null;
  if (d2 < 1e-8) { // центр внутри — выталкиваем к ближайшей стороне
    const opts = [[px - minX, -1, 0], [maxX - px, 1, 0], [pz - minZ, 0, -1], [maxZ - pz, 0, 1]].sort((a, b) => a[0] - b[0])[0];
    return [px + opts[1] * (opts[0] + RADIUS), pz + opts[2] * (opts[0] + RADIUS)];
  }
  const d = Math.sqrt(d2), k = (RADIUS - d) / d;
  return [px + dx * k, pz + dz * k];
}

function collide(x, z) {
  for (let it = 0; it < 3; it++) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let j = cz - 1; j <= cz + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) {
      if (!isBlockedCell(i, j)) continue;
      const r = pushOut(x, z, i * CELL, j * CELL, (i + 1) * CELL, (j + 1) * CELL);
      if (r) [x, z] = r;
    }
    for (const c of colliders) {
      if (x < c[0] - 1 || x > c[2] + 1 || z < c[1] - 1 || z > c[3] + 1) continue;
      const r = pushOut(x, z, c[0], c[1], c[2], c[3]);
      if (r) [x, z] = r;
    }
  }
  return [x, z];
}

function updatePlayer(dt) {
  const a = controls.axis();
  const canWalk = !inspect && !camAnim && !uiBusy && !paused && !ended;
  const speed = a.run ? RUN : WALK;
  let vx = 0, vz = 0;
  if (canWalk) {
    const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
    const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
    vx = (fx * a.y + rx * a.x) * speed;
    vz = (fz * a.y + rz * a.x) * speed;
  }
  const ox = player.x, oz = player.z;
  player.running = canWalk && a.run && Math.hypot(vx, vz) > WALK * 0.9;
  [player.x, player.z] = collide(player.x + vx * dt, player.z + vz * dt);
  const moved = Math.hypot(player.x - ox, player.z - oz);
  player.moving += ((moved / Math.max(dt, 1e-4) > 0.2 ? 1 : 0) - player.moving) * Math.min(1, dt * 8);

  // покачивание головы и шаги
  if (moved > 0.0005) {
    const before = Math.floor(player.stepPhase / Math.PI);
    player.stepPhase += (moved / 0.68) * Math.PI;
    if (Math.floor(player.stepPhase / Math.PI) !== before) {
      const cell = world.at(Math.floor(player.x / CELL), Math.floor(player.z / CELL));
      sfx.step(cell === "e" || (level.stoneFloors || "").includes(cell) ? "stone" : "wood", Math.min(1.3, moved / dt / WALK));
    }
  }
  player.bob = Math.sin(player.stepPhase) * 0.035 * player.moving;

  // конец главы — Роберт ступил на лестницу
  if (!ended && (level.endCells || "e").includes(world.at(Math.floor(player.x / CELL), Math.floor(player.z / CELL)))) endChapter();
}

function playerCamera(target) {
  target.position.set(player.x, EYE + player.bob, player.z);
  target.quaternion.setFromEuler(new THREE.Euler(player.pitch, player.yaw, 0, "YXZ"));
}

// ---------------------------------------------------------------- осмотр предметов
// Вспомогательная «камера» для расчёта ракурсов (lookAt у камер направлен по -Z)
const tmpObj = new THREE.PerspectiveCamera();
let orbit = { yaw: 0, pitch: 0 };

function inspectPose(ins, out) {
  const root = ins.root;
  root.updateWorldMatrix(true, false);
  const target = new THREE.Vector3(...ins.view.target).applyMatrix4(root.matrixWorld);
  const pos = new THREE.Vector3(...ins.view.pos).applyMatrix4(root.matrixWorld);
  const off = pos.clone().sub(target);
  off.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit.yaw);
  const right = new THREE.Vector3(0, 1, 0).cross(off).normalize();
  off.applyAxisAngle(right, orbit.pitch);
  out.position.copy(target).add(off);
  out.lookAt(target);
}

function enterInspect(id) {
  const ins = inspectables[id];
  if (!ins || !ins.canEnter()) return false;
  inspect = ins;
  orbit = { yaw: 0, pitch: 0 };
  controls.reset();
  controls.walkEnabled = false;
  inspectPose(ins, tmpObj);
  if (heldLantern) heldLantern.visible = false;
  if (ins.hide) {
    ins.anim?.open();
    document.body.classList.add("hiding");
    startCamAnim(tmpObj.position.clone(), tmpObj.quaternion.clone(), 0.7, () => { ins.anim?.close(); sfx.breath(false, 2); });
  } else {
    startCamAnim(tmpObj.position.clone(), tmpObj.quaternion.clone(), 0.65, () => ins.onEnter?.());
  }
  UI.setInspectUI(true);
  return true;
}

function leaveInspect() {
  if (!inspect) return;
  if (inspect.hide) {
    const a = inspect.anim;
    a?.open(); setTimeout(() => a?.close(), 900);
    document.body.classList.remove("hiding");
  }
  if (heldLantern) heldLantern.visible = true;
  inspect = null;
  controls.walkEnabled = true;
  playerCamera(tmpObj);
  startCamAnim(tmpObj.position.clone(), tmpObj.quaternion.clone(), 0.55);
  UI.setInspectUI(false);
}

function startCamAnim(pos, quat, dur, done) {
  camAnim = { p0: camera.position.clone(), q0: camera.quaternion.clone(), p1: pos, q1: quat, t: 0, dur, done };
}

function updateCamera(dt) {
  if (camAnim) {
    camAnim.t += dt;
    const k = Math.min(1, camAnim.t / camAnim.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    if (inspect) { inspectPose(inspect, tmpObj); camAnim.p1.copy(tmpObj.position); camAnim.q1.copy(tmpObj.quaternion); }
    else { playerCamera(tmpObj); camAnim.p1.copy(tmpObj.position); camAnim.q1.copy(tmpObj.quaternion); }
    camera.position.lerpVectors(camAnim.p0, camAnim.p1, e);
    camera.quaternion.slerpQuaternions(camAnim.q0, camAnim.q1, e);
    if (k >= 1) { const d = camAnim.done; camAnim = null; d?.(); }
    return;
  }
  if (inspect) { inspectPose(inspect, camera); return; }
  playerCamera(camera);
}

// ---------------------------------------------------------------- нажатия на предметы
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function visibleChain(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

function pick(x, y) {
  ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  raycaster.far = inspect ? 6 : REACH + 0.5;
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const h of hits) {
    if (h.object.userData.noRay || !visibleChain(h.object)) continue;
    return h;
  }
  return null;
}

function handleTap(x, y) {
  if (!started || paused || uiBusy || camAnim || ended) return;
  unlockAudio();
  const hit = pick(x, y);
  if (!hit) return;
  if (!inspect && hit.distance > REACH) return;
  for (let o = hit.object; o; o = o.parent) {
    const h = o.userData.tap;
    if (h) {
      if (inspect) {
        if (h.owner === inspect.id && h.fn(hit) !== false) return;
        continue;
      }
      if (h.owner) {
        if (enterInspect(h.owner)) return;
        continue;
      }
      if (h.fn(hit) !== false) return;
    }
    if (!inspect && o.userData.inspectId && enterInspect(o.userData.inspectId)) return;
  }
}

function handleLook(dx, dy, type) {
  if (!started || paused || uiBusy || ended) return;
  const k = (type === "mouse" ? 0.0042 : 0.0055) * settings.sensitivity;
  if (inspect) {
    if (camAnim) return;
    orbit.yaw = THREE.MathUtils.clamp(orbit.yaw - dx * k * 0.6, -0.6, 0.6);
    orbit.pitch = THREE.MathUtils.clamp(orbit.pitch - dy * k * 0.6, -0.4, 0.4);
    return;
  }
  player.yaw -= dx * k;
  player.pitch = THREE.MathUtils.clamp(player.pitch - dy * k, -1.25, 1.25);
}

const controls = new Controls(canvas, { onTap: handleTap, onLook: handleLook });

// Подсветка прицела, когда смотришь на что-то интересное
let aimTimer = 0;
function updateAim(dt) {
  aimTimer -= dt;
  if (aimTimer > 0) return;
  aimTimer = 0.15;
  let active = false;
  if (!inspect && !camAnim) {
    const h = pick(window.innerWidth / 2, window.innerHeight / 2);
    if (h && h.distance <= REACH) {
      for (let o = h.object; o; o = o.parent) {
        if (o.userData.tap || (o.userData.inspectId && inspectables[o.userData.inspectId]?.canEnter())) { active = true; break; }
      }
    }
  }
  document.getElementById("crosshair").classList.toggle("active", active);
}

// ---------------------------------------------------------------- конец главы
async function endChapter() {
  ended = true;
  G.flag("chapter_end");
  controls.reset();
  if (level.id === "chapter1") {
    const [sx, sz] = stairsPos();
    sfx.owl(new THREE.Vector3(sx, -4, sz));
    sfx.heartbeat(7, 0.5);
    setTimeout(() => sfx.breath(true, 4), 600);
  } else {
    sfx.breath(false, 2);
  }
  completeChapter(level.id);
  if (level.next) unlockChapter(level.next);
  await new Promise((r) => setTimeout(r, 2500));
  await UI.fade(true, 1500);
  document.getElementById("end-title").textContent = tr(level.ending.title);
  document.getElementById("end-text").textContent = tr(level.ending.text);
  document.getElementById("btn-end-next").style.display = level.next ? "" : "none";
  UI.showScreen("end");
}

// ---------------------------------------------------------------- главный цикл
let last = performance.now(), saveTimer = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!started) return;
  clock += dt;
  updatePlayer(dt);
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.done?.(); }
  }
  for (const u of updaters) u(dt, clock);
  if (!paused && !ended && !scaring) for (const c of chasers) c.update(uiBusy ? 0 : dt, clock);
  if (chased) {
    chaseBreath -= dt;
    if (chaseBreath <= 0) { chaseBreath = 2.6; sfx.breath(true, 2); }
  }
  for (const f of G.flames) { const s = 0.85 + Math.random() * 0.3; f.scale.set(s, 2 * s, s); }
  for (const l of lights) if (l.userData.flicker) l.intensity = l.userData.base * (1 - l.userData.flicker + Math.random() * l.userData.flicker * 2);
  updateCamera(dt);
  // тряска экрана: при скримере и когда преследователь совсем рядом
  let near = 0;
  for (const c of chasers) if (c.state === "chase" && c.mesh) near = Math.max(near, 1 - c.mesh.position.distanceTo(camera.position) / 4);
  const sh = Math.max(shake, near * 0.35);
  if (sh > 0.01) camera.position.add(new THREE.Vector3((Math.random() - 0.5) * 0.08 * sh, (Math.random() - 0.5) * 0.08 * sh, 0));
  shake = Math.max(0, shake - dt * 1.5);
  updateAim(dt);
  updateListener(camera);
  tickAudio();
  renderer.render(scene, camera);
  saveTimer += dt;
  if (saveTimer > 4 && !ended) { saveTimer = 0; persist(); }
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- интерфейс
// Нажатие на предмет в инвентаре выбирает его (подсвечивается). Выбранный
// предмет используется первым — например, какую гирю положить на весы.
let selectedItem = null;
function renderInv() {
  if (!state.inventory.includes(selectedItem)) selectedItem = null;
  UI.renderInventory(state.inventory, level.items, (id) => {
    const it = level.items[id];
    selectedItem = selectedItem === id ? null : id;
    sfx.click(null, 1.3);
    UI.toast(tr(it.name) + " — " + tr(it.about), 3200);
    renderInv();
  }, selectedItem);
}

// Подсказки. hint может быть списком: сначала намёк, потом (не раньше чем через
// HINT_WAIT секунд) подсказка подробнее.
const HINT_WAIT = 60;
const hintState = { obj: null, level: 0, time: 0 };
function currentHint(ask = false) {
  const o = level.objectives.find((ob) => !state.flags.has(ob.done));
  if (!o) return "";
  const list = Array.isArray(o.hint) ? o.hint : [o.hint];
  const now = performance.now() / 1000;
  if (hintState.obj !== o) { hintState.obj = o; hintState.level = 0; hintState.time = ask ? now : -1e9; return tr(list[0]); }
  if (!ask) return tr(list[hintState.level]);
  if (hintState.time < 0) { hintState.time = now; return tr(list[hintState.level]); }
  if (hintState.level < list.length - 1) {
    const left = Math.ceil(HINT_WAIT - (now - hintState.time));
    if (left > 0) return tr(list[hintState.level]) + "\n" + t("hintWait", { s: left });
    hintState.level++; hintState.time = now;
  }
  return tr(list[hintState.level]);
}

const $ = (id) => document.getElementById(id);
let settingsBack = "menu";

function refreshMenu() {
  const save = loadGame();
  $("btn-continue").style.display = started || (save && save.flags?.length) ? "" : "none";
  $("btn-continue").textContent = started ? t("resume") : continueNext ? tr(LEVELS[continueNext].title) : t("continue");
  $("version").textContent = `${t("version")} ${VERSION}`;
  $("menu-subtitle").textContent = tr(level.title);
  $("btn-chapters").style.display = loadProgress().unlocked.length > 1 ? "" : "none";
  $("btn-pause-chapters").style.display = loadProgress().unlocked.length > 1 ? "" : "none";
}

function playChapter(id) {
  location.hash = "play-" + id;
  location.reload();
}

let chaptersBack = "menu";
function showChapters(from = "menu") {
  chaptersBack = from;
  const list = $("chapter-list");
  list.innerHTML = "";
  const { unlocked, completed } = loadProgress();
  for (const id of ORDER) {
    const b = document.createElement("button");
    b.className = "btn" + (id === level.id ? " primary" : "");
    b.textContent = tr(LEVELS[id].title) + (completed.includes(id) ? "  ✓" : "");
    b.disabled = !unlocked.includes(id);
    if (b.disabled) b.textContent += " 🔒";
    else if (completed.includes(id)) b.title = t("replay");
    b.addEventListener("click", async () => {
      if (loadGame()?.flags?.length && !(await UI.confirmDialog(t("chapterConfirm")))) return;
      playChapter(id);
    });
    list.appendChild(b);
  }
  UI.showScreen("chapters");
}

function setLanguage(l) {
  settings.lang = l; saveSettings(settings);
  setLang(l);
  UI.refreshTexts();
  langListeners.forEach((fn) => fn());
  document.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === l));
  document.title = t("title");
  refreshMenu();
  renderInv();
}

function openSettings(from) {
  settingsBack = from;
  $("set-volume").value = settings.volume;
  $("set-sens").value = settings.sensitivity;
  document.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === getLang()));
  document.querySelectorAll("[data-quality]").forEach((b) => b.classList.toggle("on", b.dataset.quality === settings.quality));
  UI.showScreen("settings");
}

async function startGame(fresh) {
  unlockAudio();
  setVolume(settings.volume);
  try {
    const el = document.documentElement;
    if (matchMedia("(pointer: coarse)").matches && !document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      else el.webkitRequestFullscreen?.();
    }
  } catch { /* полноэкранный режим не обязателен */ }
  if (started) { resume(); return; }
  UI.showScreen("loading");
  await new Promise((r) => setTimeout(r, 50));
  const save = fresh ? null : loadGame();
  if (fresh) clearGame();
  if (save) {
    save.flags.forEach((f) => state.flags.add(f));
    state.inventory = save.inventory || [];
    state.notes = save.notes || [];
  }
  buildLevel();
  const s = level.start;
  if (state.flags.has("got:lantern")) takeLantern();
  if (save?.player) { player.x = save.player.x; player.z = save.player.z; player.yaw = save.player.yaw; }
  else { player.x = s.x * CELL; player.z = s.z * CELL; player.yaw = THREE.MathUtils.degToRad(s.angle || 0); }
  playerCamera(camera);
  renderInv();
  // один кадр, чтобы видеокарта всё подготовила
  renderer.compile(scene, camera);
  started = true;
  UI.hideScreens();
  document.body.classList.add("playing");
  paused = false;
  if (!save) {
    G.flag("started");
    if (level.introNote) await G.showNote(level.introNote);
    else UI.toast(tr(level.title), 3500);
    UI.showScreen("howto");
    paused = true;
  } else {
    UI.toast(currentHint(), 4000);
  }
}

function pause() {
  if (!started || ended) return;
  paused = true; controls.reset();
  persist();
  refreshMenu();
  UI.showScreen("pause");
}
function resume() {
  UI.hideScreens();
  paused = false;
  suspend(false);
}

$("btn-new").addEventListener("click", async () => {
  if (started || loadGame()?.flags?.length) {
    if (!(await UI.confirmDialog(t("resetConfirm")))) return;
  }
  clearGame();
  if (started || level.id !== "chapter1") { playChapter("chapter1"); return; }
  startGame(true);
});
$("btn-continue").addEventListener("click", () => { if (!started && continueNext) playChapter(continueNext); else startGame(false); });
$("btn-chapters").addEventListener("click", () => showChapters("menu"));
$("btn-pause-chapters").addEventListener("click", () => showChapters("pause"));
$("btn-chapters-back").addEventListener("click", () => UI.showScreen(chaptersBack));
$("btn-end-next").addEventListener("click", () => { if (level.next) playChapter(level.next); });
$("btn-settings").addEventListener("click", () => openSettings("menu"));
$("btn-resume").addEventListener("click", resume);
$("btn-pause-settings").addEventListener("click", () => openSettings("pause"));
$("btn-tomenu").addEventListener("click", () => { refreshMenu(); UI.showScreen("menu"); });
$("btn-settings-back").addEventListener("click", () => UI.showScreen(settingsBack));
$("btn-howto-ok").addEventListener("click", () => { resume(); UI.toast(currentHint(), 5000); });
$("btn-end-menu").addEventListener("click", async () => { location.hash = ""; location.reload(); });
$("btn-reset").addEventListener("click", async () => {
  if (!(await UI.confirmDialog(t("resetConfirm")))) return;
  clearGame();
  if (started) playChapter(level.id);
  else location.reload();
});
document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLanguage(b.dataset.lang)));
document.querySelectorAll("[data-quality]").forEach((b) => b.addEventListener("click", () => {
  settings.quality = b.dataset.quality; saveSettings(settings); applyQuality();
  document.querySelectorAll("[data-quality]").forEach((q) => q.classList.toggle("on", q.dataset.quality === settings.quality));
}));
$("set-volume").addEventListener("input", (e) => { settings.volume = +e.target.value; setVolume(settings.volume); saveSettings(settings); });
$("set-sens").addEventListener("input", (e) => { settings.sensitivity = +e.target.value; saveSettings(settings); });

$("btn-pause").addEventListener("click", (e) => { e.stopPropagation(); pause(); });
$("btn-back").addEventListener("click", (e) => { e.stopPropagation(); leaveInspect(); });
$("btn-hint").addEventListener("click", (e) => { e.stopPropagation(); sfx.click(null, 0.6); UI.toast(currentHint(true), 7000); });
$("btn-diary").addEventListener("click", (e) => {
  e.stopPropagation();
  $("btn-diary").classList.remove("pulse");
  uiBusy = true; controls.reset();
  sfx.paper();
  UI.showDiary(state.notes, level.notes, async (id) => {
    const n = level.notes[id];
    UI.hideDiary();
    await UI.showNote(tr(n.title), tr(n.text));
    uiBusy = false;
  });
});
$("btn-diary-close").addEventListener("click", () => { UI.hideDiary(); uiBusy = false; });
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") { if (inspect) leaveInspect(); else if (!paused) pause(); }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { if (started) persist(); suspend(true); }
  else if (started && !paused) suspend(false);
});
// Звук на iPad включается только после касания — пробуем на всех видах нажатий
for (const ev of ["pointerdown", "touchend", "click"]) document.addEventListener(ev, () => unlockAudio(), { capture: true });
// Двойное касание на iPad не должно увеличивать страницу
document.addEventListener("dblclick", (e) => e.preventDefault());
document.addEventListener("gesturestart", (e) => e.preventDefault());

setLanguage(settings.lang);
refreshMenu();
if (hashPlay) {
  history.replaceState(null, "", location.pathname + location.search);
  startGame(true);
} else {
  UI.showScreen("menu");
}

// Для отладки и для Кирилла: в консоли браузера можно писать game.state и т.п.
window.game = { state, player, G, scene, camera, level, chasers, get owl() { return owl; }, enterInspect, leaveInspect, handleTap, inspectables, pick, get inspect() { return inspect; }, get started() { return started; }, get debug() { return { paused, uiBusy, camAnim: !!camAnim, ended }; } };
