// Строим дом по карте из файла уровня: пол, стены, потолок.
import * as THREE from "three";
import { roomMaterials } from "./textures.js";

export const CELL = 1.5;     // размер клетки карты в метрах
export const HEIGHT = 3.0;   // высота потолка

// Буквы карты → оформление комнаты. Уровень может добавить свои буквы (level.themes).
const DEFAULT_THEMES = { h: "hall", l: "library", c: "corridor", w: "workshop", D: "doorway", e: "stairs", u: "stairsUp" };

// Набор вершин для одной склеенной геометрии (быстрее рисовать)
class GeoBuilder {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.idx = []; }
  quad(p, n, uv) {
    // p — 4 точки по кругу, n — нормаль; порядок вершин подгоняем под нормаль
    const a = new THREE.Vector3(...p[0]), b = new THREE.Vector3(...p[1]), c = new THREE.Vector3(...p[2]);
    const cr = b.clone().sub(a).cross(c.clone().sub(a));
    const flip = cr.dot(new THREE.Vector3(...n)) < 0;
    const base = this.pos.length / 3;
    for (let i = 0; i < 4; i++) { this.pos.push(...p[i]); this.nor.push(...n); this.uv.push(...uv[i]); }
    if (flip) this.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    else this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

export function buildWorld(level) {
  const THEMES = { ...DEFAULT_THEMES, ...(level.themes || {}) };
  const map = level.map;
  const H = map.length, W = Math.max(...map.map((r) => r.length));
  const at = (x, z) => (z < 0 || z >= H || x < 0 || x >= W ? "#" : map[z][x] || "#");
  const isWall = (x, z) => at(x, z) === "#";

  const doorTheme = (x, z) => {
    for (const [dx, dz] of [[0, -1], [-1, 0], [0, 1], [1, 0]]) {
      const ch = at(x + dx, z + dz);
      if (ch !== "#" && ch !== "D") return THEMES[ch];
    }
    return "hall";
  };
  const themeOf = (x, z) => {
    const ch = at(x, z);
    return ch === "D" ? "doorway" : THEMES[ch] || "hall";
  };

  const builders = {};
  const get = (theme, part) => {
    const k = theme + ":" + part;
    return builders[k] || (builders[k] = { theme, part, b: new GeoBuilder() });
  };

  for (let z = 0; z < H; z++) {
    for (let x = 0; x < W; x++) {
      const ch = at(x, z);
      if (ch === "#") continue;
      const theme = themeOf(x, z);
      const x0 = x * CELL, x1 = x0 + CELL, z0 = z * CELL, z1 = z0 + CELL;
      const fm = 3; // текстура пола повторяется каждые 3 метра
      if (ch !== "e" && ch !== "u") {
        const ft = ch === "D" ? doorTheme(x, z) : theme;
        get(ft, "floor").b.quad(
          [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], [0, 1, 0],
          [[x0 / fm, -z0 / fm], [x1 / fm, -z0 / fm], [x1 / fm, -z1 / fm], [x0 / fm, -z1 / fm]]);
      }
      const cy = ch === "u" ? HEIGHT + 2.5 : HEIGHT;
      get(theme === "doorway" ? doorTheme(x, z) : theme, "ceil").b.quad(
        [[x0, cy, z0], [x1, cy, z0], [x1, cy, z1], [x0, cy, z1]], [0, -1, 0],
        [[x0 / 3, z0 / 3], [x1 / 3, z0 / 3], [x1 / 3, z1 / 3], [x0 / 3, z1 / 3]]);

      const y0 = ch === "e" ? -2.5 : 0, v0 = y0 / HEIGHT;
      const top = ch === "u" ? HEIGHT + 2.5 : HEIGHT;
      const wb = get(theme, "wall").b;
      // [сосед dx,dz] → стена: левая и правая точки (как видно изнутри клетки), нормаль
      if (isWall(x, z - 1)) wb.quad([[x0, y0, z0], [x1, y0, z0], [x1, top, z0], [x0, top, z0]], [0, 0, 1], [[0, v0], [1, v0], [1, 1], [0, 1]]);
      if (isWall(x, z + 1)) wb.quad([[x1, y0, z1], [x0, y0, z1], [x0, top, z1], [x1, top, z1]], [0, 0, -1], [[0, v0], [1, v0], [1, 1], [0, 1]]);
      if (isWall(x - 1, z)) wb.quad([[x0, y0, z1], [x0, y0, z0], [x0, top, z0], [x0, top, z1]], [1, 0, 0], [[0, v0], [1, v0], [1, 1], [0, 1]]);
      if (isWall(x + 1, z)) wb.quad([[x1, y0, z0], [x1, y0, z1], [x1, top, z1], [x1, top, z0]], [-1, 0, 0], [[0, v0], [1, v0], [1, 1], [0, 1]]);
    }
  }

  const group = new THREE.Group();
  for (const k in builders) {
    const { theme, part, b } = builders[k];
    const mats = roomMaterials(theme);
    const mesh = new THREE.Mesh(b.build(), mats[part]);
    mesh.name = k;
    group.add(mesh);
  }

  // Ступени вниз в клетке «e»
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    if (at(x, z) !== "e") continue;
    const stone = roomMaterials("stairs").floor;
    // направление спуска — от двери
    let dir = [1, 0];
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (at(x - d[0], z - d[1]) === "D") dir = d;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.2, CELL / n), stone);
      const along = (i + 0.5) / n - 0.5;
      step.position.set((x + 0.5 + along * dir[0]) * CELL, -0.1 - i * 0.2, (z + 0.5 + along * dir[1]) * CELL);
      if (dir[0] !== 0) step.rotation.y = Math.PI / 2;
      group.add(step);
    }
    const pit = new THREE.Mesh(new THREE.BoxGeometry(CELL, 0.1, CELL), new THREE.MeshStandardMaterial({ color: "#050608", roughness: 1 }));
    pit.position.set((x + 0.5) * CELL, -2.4, (z + 0.5) * CELL);
    group.add(pit);
  }

  // Ступени вверх в клетке «u» (лестница в часовую башню)
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    if (at(x, z) !== "u") continue;
    const stone = roomMaterials("stairsUp").floor;
    let dir = [1, 0];
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (at(x - d[0], z - d[1]) === "D") dir = d;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const h = 0.22 * (i + 1);
      const step = new THREE.Mesh(new THREE.BoxGeometry(CELL, h, CELL / n), stone);
      const along = (i + 0.5) / n - 0.5;
      step.position.set((x + 0.5 + along * dir[0]) * CELL, h / 2, (z + 0.5 + along * dir[1]) * CELL);
      if (dir[0] !== 0) step.rotation.y = Math.PI / 2;
      group.add(step);
    }
  }

  const toCell = (wx, wz) => [Math.floor(wx / CELL), Math.floor(wz / CELL)];
  return { group, W, H, at, isWall, themeOf, toCell, THEMES };
}

// Перевод координат клеток из файла уровня в метры
export const cellToWorld = (cx, cz) => [cx * CELL, cz * CELL];
