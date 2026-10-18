// Процедурные текстуры: всё рисуется кодом на <canvas>, без файлов-картинок.
// Так игра грузится быстро и работает без интернета.
import * as THREE from "three";

// Детерминированный генератор случайных чисел: при каждом запуске
// узоры получаются одинаковыми.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

// Меняет яркость цвета, сохраняя оттенок
function vary(hex, k) {
  const c = new THREE.Color(hex).multiplyScalar(1 + k);
  return "#" + c.getHexString();
}

function shade(hex, k) {
  const c = new THREE.Color(hex);
  if (k >= 0) c.lerp(new THREE.Color(1, 1, 1), k);
  else c.lerp(new THREE.Color(0, 0, 0), -k);
  return "#" + c.getHexString();
}

let maxAniso = 4;
export function setAnisotropy(n) { maxAniso = Math.min(8, n); }

function tex(c, { repeat = [1, 1], color = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = maxAniso;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Карта рельефа из яркости картинки: тёмные щели становятся углублениями.
function bumpFrom(c, contrast = 1.4) {
  const b = canvas(c.width, c.height);
  const ctx = b.getContext("2d");
  ctx.drawImage(c, 0, 0);
  const img = ctx.getImageData(0, 0, b.width, b.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let v = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
    v = Math.min(1, Math.max(0, (v - 0.5) * contrast + 0.5));
    d[i] = d[i + 1] = d[i + 2] = v * 255;
  }
  ctx.putImageData(img, 0, 0);
  return b;
}

function noise(ctx, w, h, amount, r, size = 1) {
  for (let i = 0; i < (w * h) / (size * size * 6); i++) {
    const v = r() < 0.5 ? 0 : 255;
    ctx.fillStyle = `rgba(${v},${v},${v},${r() * amount})`;
    ctx.fillRect(r() * w, r() * h, size, size);
  }
}

// Древесные волокна в прямоугольнике
function grain(ctx, x, y, w, h, base, r, vertical = true, density = 1) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  const len = vertical ? h : w;
  const across = vertical ? w : h;
  const lines = Math.max(6, (across / 2.2) * density);
  for (let i = 0; i < lines; i++) {
    const off = r() * across;
    const dark = r() < 0.6;
    ctx.strokeStyle = dark ? `rgba(30,15,5,${0.05 + r() * 0.18})` : `rgba(255,230,190,${0.03 + r() * 0.08})`;
    ctx.lineWidth = 0.5 + r() * 1.6;
    ctx.beginPath();
    const ph = r() * 10, amp = 1 + r() * 3, fr = 0.01 + r() * 0.02;
    for (let t = 0; t <= len; t += 8) {
      const o = off + Math.sin(t * fr + ph) * amp;
      if (vertical) (t === 0 ? ctx.moveTo(x + o, y + t) : ctx.lineTo(x + o, y + t));
      else (t === 0 ? ctx.moveTo(x + t, y + o) : ctx.lineTo(x + t, y + o));
    }
    ctx.stroke();
  }
  // сучки
  if (r() < 0.35) {
    const kx = x + r() * w, ky = y + r() * h, kr = 3 + r() * 6;
    const g = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr * 2.5);
    g.addColorStop(0, "rgba(40,20,8,0.7)"); g.addColorStop(0.4, "rgba(60,30,10,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(kx, ky, vertical ? kr : kr * 2.5, vertical ? kr * 2.5 : kr, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ полы
function planks(base, seed, worn = 0) {
  const S = 1024, c = canvas(S, S), ctx = c.getContext("2d"), r = rng(seed);
  const pw = S / 14; // 14 досок на 3 метра
  for (let i = 0; i < 14; i++) {
    let y0 = -r() * S;
    while (y0 < S) {
      const len = S * (0.45 + r() * 0.6);
      const col = vary(base, (r() - 0.5) * 0.35);
      grain(ctx, i * pw, y0, pw, len, col, r);
      ctx.fillStyle = "rgba(10,5,2,0.85)";
      ctx.fillRect(i * pw, y0, pw, 2);
      y0 += len;
    }
    ctx.fillStyle = "rgba(10,5,2,0.9)";
    ctx.fillRect(i * pw, 0, 2, S);
  }
  if (worn) {
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(150,140,120,${r() * 0.04 * worn})`;
      ctx.beginPath(); ctx.ellipse(r() * S, r() * S, 20 + r() * 120, 10 + r() * 60, r() * 3, 0, 7); ctx.fill();
    }
  }
  noise(ctx, S, S, 0.05, r);
  return c;
}

function herringbone(base, seed) {
  const S = 1024, c = canvas(S, S), ctx = c.getContext("2d"), r = rng(seed);
  ctx.fillStyle = "#1a0f08"; ctx.fillRect(0, 0, S, S);
  // «ёлочка»: колонки дощечек, наклонённых то вправо, то влево
  const Wc = 128, h = 64;
  for (let col = 0; col < S / Wc; col++) {
    const x0 = col * Wc, s = col % 2 ? 1 : -1;
    for (let row = -4; row < S / h + 4; row++) {
      const y = row * h;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0 + 1, y + 1); ctx.lineTo(x0 + Wc - 1, y + s * Wc + 1);
      ctx.lineTo(x0 + Wc - 1, y + s * Wc + h - 1); ctx.lineTo(x0 + 1, y + h - 1);
      ctx.closePath(); ctx.clip();
      ctx.translate(x0, y); ctx.transform(1, s, 0, 1, 0, 0);
      grain(ctx, 0, 0, Wc, h, vary(base, (r() - 0.5) * 0.4), r, false, 0.5);
      ctx.restore();
    }
  }
  noise(ctx, S, S, 0.05, r);
  return c;
}

function stoneFloor(seed) {
  const S = 1024, c = canvas(S, S), ctx = c.getContext("2d"), r = rng(seed);
  ctx.fillStyle = "#2a2826"; ctx.fillRect(0, 0, S, S);
  const n = 4, s = S / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = 0.2 + r() * 0.08;
    ctx.fillStyle = new THREE.Color(v, v * 0.94, v * 0.86).getStyle();
    ctx.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
    for (let k = 0; k < 400; k++) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() * 0.04})`;
      ctx.fillRect(i * s + r() * s, j * s + r() * s, 2 + r() * 8, 2 + r() * 8);
    }
  }
  noise(ctx, S, S, 0.12, r, 2);
  return c;
}

// ------------------------------------------------------------------ стены
const WALL_W = 512, WALL_H = 1024, PX_M = WALL_H / 3; // 3 метра в высоту

function wainscot(ctx, r, wood, top = 0.95) {
  const y0 = WALL_H - top * PX_M;
  grain(ctx, 0, y0, WALL_W, WALL_H - y0, wood, r, true, 0.6);
  // филёнка
  const px = 40, py = y0 + 50, pw = WALL_W - 80, ph = WALL_H - y0 - 120;
  ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 6; ctx.strokeRect(px, py, pw, ph);
  ctx.strokeStyle = "rgba(255,220,170,0.18)"; ctx.lineWidth = 3; ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);
  // поручень
  ctx.fillStyle = shade(wood, -0.25); ctx.fillRect(0, y0 - 14, WALL_W, 22);
  ctx.fillStyle = "rgba(255,220,170,0.25)"; ctx.fillRect(0, y0 - 14, WALL_W, 4);
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, y0 + 8, WALL_W, 3);
  // плинтус
  ctx.fillStyle = shade(wood, -0.45); ctx.fillRect(0, WALL_H - 50, WALL_W, 50);
  ctx.fillStyle = "rgba(255,220,170,0.2)"; ctx.fillRect(0, WALL_H - 50, WALL_W, 3);
  return y0;
}

function crown(ctx, color) {
  ctx.fillStyle = color; ctx.fillRect(0, 0, WALL_W, 34);
  ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 34, WALL_W, 5);
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(0, 10, WALL_W, 3);
}

function damask(ctx, x0, y0, w, h, bg, fg, r) {
  ctx.fillStyle = bg; ctx.fillRect(x0, y0, w, h);
  const cw = WALL_W / 2, ch = 190;
  ctx.fillStyle = fg;
  for (let row = 0; row * ch < h + ch; row++) {
    for (let col = -1; col <= 2; col++) {
      const cx = col * cw + (row % 2 ? cw / 2 : 0) + cw / 2;
      const cy = y0 + row * ch;
      ctx.save(); ctx.translate(cx, cy);
      for (const s of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(0, -70);
        ctx.bezierCurveTo(s * 40, -50, s * 50, -10, s * 18, 10);
        ctx.bezierCurveTo(s * 60, 20, s * 50, 60, 0, 75);
        ctx.bezierCurveTo(s * 20, 40, s * 10, 20, 0, 15);
        ctx.fill();
        ctx.beginPath(); ctx.ellipse(s * 46, -30, 9, 16, s * 0.6, 0, 7); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, -78, 7, 0, 7); ctx.fill();
      ctx.restore();
    }
  }
  noise(ctx, WALL_W, WALL_H, 0.035, r);
}

function stripes(ctx, y0, h, bg, fg, gold) {
  ctx.fillStyle = bg; ctx.fillRect(0, y0, WALL_W, h);
  for (let i = 0; i < 4; i++) {
    const x = i * 128;
    ctx.fillStyle = fg; ctx.fillRect(x + 20, y0, 54, h);
    ctx.fillStyle = gold; ctx.fillRect(x + 82, y0, 4, h); ctx.fillRect(x + 12, y0, 3, h);
  }
}

function floral(ctx, y0, h, bg, fg, r) {
  ctx.fillStyle = bg; ctx.fillRect(0, y0, WALL_W, h);
  for (let i = 0; i < 70; i++) {
    const x = (i * 97) % WALL_W, y = y0 + ((i * 151) % h);
    ctx.strokeStyle = fg; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.quadraticCurveTo(x + 14, y + 10, x, y - 20); ctx.stroke();
    ctx.fillStyle = fg;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 8, y - 24 + Math.sin(a) * 8, 6, 4, a, 0, 7); ctx.fill();
    }
  }
  noise(ctx, WALL_W, WALL_H, 0.04, r);
}

function aging(ctx, r, amount = 1) {
  for (let i = 0; i < 6 * amount; i++) {
    const x = r() * WALL_W, y = r() * WALL_H * 0.6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 60 + r() * 140);
    g.addColorStop(0, `rgba(60,40,20,${0.05 + r() * 0.08})`); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, WALL_W, WALL_H);
  }
  // тень у потолка и у пола — даёт объём
  let g = ctx.createLinearGradient(0, 0, 0, 160);
  g.addColorStop(0, "rgba(0,0,0,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, WALL_W, 160);
  g = ctx.createLinearGradient(0, WALL_H - 120, 0, WALL_H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = g; ctx.fillRect(0, WALL_H - 120, WALL_W, 120);
}

function bricks(ctx, r, y0 = 0) {
  ctx.fillStyle = "#3a322c"; ctx.fillRect(0, y0, WALL_W, WALL_H - y0);
  const bh = 26, bw = 86;
  for (let row = 0; y0 + row * bh < WALL_H; row++) {
    for (let col = -1; col * bw < WALL_W; col++) {
      const x = col * bw + (row % 2 ? bw / 2 : 0), y = y0 + row * bh;
      const v = r();
      ctx.fillStyle = new THREE.Color().setHSL(0.025 + r() * 0.035, 0.35 + r() * 0.15, 0.16 + v * 0.1).getStyle();
      ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.06})`; ctx.fillRect(x + 3, y + 3, bw - 6, 3);
    }
  }
  // побелка
  for (let i = 0; i < 25; i++) {
    ctx.fillStyle = `rgba(200,190,170,${r() * 0.07})`;
    ctx.beginPath(); ctx.ellipse(r() * WALL_W, y0 + r() * (WALL_H - y0), 40 + r() * 100, 30 + r() * 80, 0, 0, 7); ctx.fill();
  }
  noise(ctx, WALL_W, WALL_H, 0.08, r, 2);
}

function plasterTex(base, seed, size = 512) {
  const c = canvas(size, size), ctx = c.getContext("2d"), r = rng(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    const v = r() < 0.5 ? 0 : 255;
    ctx.fillStyle = `rgba(${v},${v},${v},${r() * 0.03})`;
    ctx.beginPath(); ctx.ellipse(r() * size, r() * size, 20 + r() * 80, 20 + r() * 80, 0, 0, 7); ctx.fill();
  }
  noise(ctx, size, size, 0.07, r, 2);
  return c;
}

const WALL_STYLES = {
  hall:     (ctx, r) => { damask(ctx, 0, 0, WALL_W, WALL_H, "#24382c", "#2f4a39", r); wainscot(ctx, r, "#4a2c18"); crown(ctx, "#d8cfb8"); aging(ctx, r); },
  library:  (ctx, r) => { stripes(ctx, 0, WALL_H, "#4a1a1c", "#561f22", "#9a7a3a"); noise(ctx, WALL_W, WALL_H, 0.04, r); wainscot(ctx, r, "#3a2212", 1.1); crown(ctx, "#5a3a20"); aging(ctx, r); },
  corridor: (ctx, r) => { floral(ctx, 0, WALL_H, "#3b4450", "#4b5664", r); wainscot(ctx, r, "#3e2a1c"); crown(ctx, "#c9c2b0"); aging(ctx, r, 1.6); },
  workshop: (ctx, r) => { bricks(ctx, r); ctx.fillStyle = "#3a2a1c"; ctx.fillRect(0, WALL_H - 40, WALL_W, 40); aging(ctx, r, 1.4); },
  doorway:  (ctx, r) => { grain(ctx, 0, 0, WALL_W, WALL_H, "#4a2e1a", r, true, 0.7); ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 6; ctx.strokeRect(50, 60, WALL_W - 100, WALL_H - 400); ctx.strokeRect(50, WALL_H - 300, WALL_W - 100, 240); aging(ctx, r); },
  stairs:   (ctx, r) => { bricks(ctx, r); ctx.fillStyle = "rgba(10,12,20,0.55)"; ctx.fillRect(0, 0, WALL_W, WALL_H); aging(ctx, r, 2.5); },
};

const FLOOR_STYLES = {
  hall: () => [herringbone("#6e4426", 11), 2],
  library: () => [planks("#3e2414", 12), 2],
  corridor: () => [planks("#5a3a22", 13, 0.6), 2],
  workshop: () => [planks("#6a5a48", 14, 1.4), 2],
  doorway: () => [planks("#4a2c18", 15), 2],
  stairs: () => [stoneFloor(16), 1.5],
};

const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

// Материалы для стен/пола/потолка комнаты. Пол повторяется каждые N метров.
export function roomMaterials(theme) {
  return cached("room:" + theme, () => {
    const r = rng(theme.length * 31 + 7);
    const wc = canvas(WALL_W, WALL_H);
    (WALL_STYLES[theme] || WALL_STYLES.hall)(wc.getContext("2d"), r);
    const wall = new THREE.MeshStandardMaterial({
      map: tex(wc), bumpMap: tex(bumpFrom(wc), { color: false }), bumpScale: 1.5,
      roughness: theme === "workshop" ? 0.95 : 0.85, metalness: 0,
    });
    const [fc, rep] = (FLOOR_STYLES[theme] || FLOOR_STYLES.hall)();
    const floor = new THREE.MeshStandardMaterial({
      map: tex(fc), bumpMap: tex(bumpFrom(fc, 2), { color: false }), bumpScale: 2,
      roughness: theme === "stairs" ? 0.9 : 0.55, metalness: 0,
    });
    floor.userData.metersPerRepeat = 3 / (rep / 2);
    const cc = plasterTex(theme === "workshop" ? "#8a7c6a" : "#c9bfa9", 99 + theme.length);
    const ceil = new THREE.MeshStandardMaterial({ map: tex(cc), roughness: 1 });
    return { wall, floor, ceil };
  });
}

// ------------------------------------------------------------------ дерево мебели
export function woodMaterial(color = "#5a3a22", { seed = 3, rough = 0.6, vertical = true } = {}) {
  return cached(`wood:${color}:${seed}:${vertical}:${rough}`, () => {
    const S = 512, c = canvas(S, S), r = rng(seed);
    grain(c.getContext("2d"), 0, 0, S, S, color, r, vertical, 0.8);
    noise(c.getContext("2d"), S, S, 0.04, r);
    return new THREE.MeshStandardMaterial({
      map: tex(c), bumpMap: tex(bumpFrom(c), { color: false }), bumpScale: 0.6, roughness: rough, metalness: 0,
    });
  });
}

export function fabricMaterial(color, seed = 5) {
  return cached(`fabric:${color}`, () => {
    const S = 256, c = canvas(S, S), ctx = c.getContext("2d"), r = rng(seed);
    ctx.fillStyle = color; ctx.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 2) { ctx.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.05})`; ctx.fillRect(0, y, S, 1); }
    noise(ctx, S, S, 0.1, r);
    return new THREE.MeshStandardMaterial({ map: tex(c, { repeat: [3, 3] }), roughness: 0.95 });
  });
}

export function leatherMaterial(color = "#5a1a14") {
  return cached(`leather:${color}`, () => {
    const S = 256, c = canvas(S, S), ctx = c.getContext("2d"), r = rng(8);
    ctx.fillStyle = color; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 200},0,${r() * 0.07})`;
      ctx.beginPath(); ctx.arc(r() * S, r() * S, 1 + r() * 4, 0, 7); ctx.fill();
    }
    return new THREE.MeshStandardMaterial({ map: tex(c, { repeat: [2, 2] }), bumpMap: tex(bumpFrom(c, 2), { color: false, repeat: [2, 2] }), bumpScale: 0.8, roughness: 0.55 });
  });
}

export function metal(color = "#b08d57", rough = 0.35) {
  return cached(`metal:${color}:${rough}`, () => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: rough }));
}

export function plain(color, rough = 0.8, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });
}

export function stoneMaterial() {
  return cached("stone", () => {
    const c = stoneFloor(21);
    return new THREE.MeshStandardMaterial({ map: tex(c, { repeat: [0.5, 0.5] }), bumpMap: tex(bumpFrom(c, 2), { color: false, repeat: [0.5, 0.5] }), bumpScale: 2, roughness: 0.9 });
  });
}

export function brickMaterial() {
  return cached("brickmat", () => {
    const c = canvas(WALL_W, WALL_H), r = rng(55);
    bricks(c.getContext("2d"), r);
    return new THREE.MeshStandardMaterial({ map: tex(c), bumpMap: tex(bumpFrom(c), { color: false }), bumpScale: 1.5, roughness: 0.95 });
  });
}

// ------------------------------------------------------------------ ковры
export function rugTexture(pattern) {
  return cached("rug:" + pattern, () => {
    const W = 1024, H = 700, c = canvas(W, H), ctx = c.getContext("2d"), r = rng(pattern.length);
    const pal = pattern === "blue"
      ? { bg: "#1d2b4a", border: "#6b1e1e", accent: "#c9a25a", mid: "#2e4570" }
      : { bg: "#6b1a18", border: "#1d2b4a", accent: "#d4b06a", mid: "#8a2a22" };
    ctx.fillStyle = pal.border; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = pal.accent; ctx.fillRect(30, 30, W - 60, H - 60);
    ctx.fillStyle = pal.bg; ctx.fillRect(50, 50, W - 100, H - 100);
    // орнамент по кайме
    ctx.fillStyle = pal.accent;
    for (let x = 60; x < W - 60; x += 40) { ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + 14, 20); ctx.lineTo(x, 30); ctx.lineTo(x - 14, 20); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, H - 10); ctx.lineTo(x + 14, H - 20); ctx.lineTo(x, H - 30); ctx.lineTo(x - 14, H - 20); ctx.fill(); }
    // медальон
    ctx.save(); ctx.translate(W / 2, H / 2);
    for (let k = 4; k >= 1; k--) {
      ctx.fillStyle = k % 2 ? pal.mid : pal.accent;
      ctx.beginPath();
      for (let a = 0; a <= 32; a++) {
        const ang = (a / 32) * Math.PI * 2, rr = k * 55 * (1 + 0.12 * Math.sin(ang * 8));
        const px = Math.cos(ang) * rr * 1.5, py = Math.sin(ang) * rr;
        a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.fill();
    }
    ctx.restore();
    for (const [cx, cy] of [[120, 120], [W - 120, 120], [120, H - 120], [W - 120, H - 120]]) {
      ctx.fillStyle = pal.mid; ctx.beginPath(); ctx.arc(cx, cy, 50, 0, 7); ctx.fill();
      ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.fill();
    }
    // ворс и потёртости
    for (let i = 0; i < 20000; i++) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() * 0.08})`;
      ctx.fillRect(r() * W, r() * H, 2, 2);
    }
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(200,180,150,${r() * 0.08})`;
      ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 60 + r() * 150, 40 + r() * 80, r() * 3, 0, 7); ctx.fill();
    }
    return tex(c);
  });
}

// ------------------------------------------------------------------ надписи, картины
export function textTexture(lines, { w = 512, h = 256, bg = "#c9a25a", fg = "#3a2610", font = "bold 44px Georgia, serif", engraved = true } = {}) {
  const c = canvas(w, h), ctx = c.getContext("2d");
  if (bg) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, shade(bg, 0.2)); g.addColorStop(0.5, bg); g.addColorStop(1, shade(bg, -0.25));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = font;
  const lh = h / (lines.length + 1);
  lines.forEach((t, i) => {
    if (engraved) { ctx.fillStyle = "rgba(255,240,200,0.5)"; ctx.fillText(t, w / 2 + 1.5, lh * (i + 1) + 1.5); }
    ctx.fillStyle = fg; ctx.fillText(t, w / 2, lh * (i + 1));
  });
  return tex(c);
}

export function clockFace() {
  return cached("clockface", () => {
    const S = 512, c = canvas(S, S), ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S / 2);
    g.addColorStop(0, "#f2e8d0"); g.addColorStop(1, "#cbb68a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.translate(S / 2, S / 2);
    ctx.strokeStyle = "#2a1c10"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 230, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 175, 0, 7); ctx.stroke();
    const rom = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    ctx.fillStyle = "#2a1c10"; ctx.font = "bold 42px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      ctx.lineWidth = i % 5 ? 2 : 5;
      ctx.beginPath(); ctx.moveTo(Math.sin(a) * 222, -Math.cos(a) * 222); ctx.lineTo(Math.sin(a) * (i % 5 ? 212 : 200), -Math.cos(a) * (i % 5 ? 212 : 200)); ctx.stroke();
    }
    rom.forEach((t, i) => {
      const a = (i / 12) * Math.PI * 2;
      ctx.save(); ctx.translate(Math.sin(a) * 150, -Math.cos(a) * 150); ctx.rotate(a); ctx.fillText(t, 0, 0); ctx.restore();
    });
    return tex(c);
  });
}

export function paintingTexture(art) {
  return cached("art:" + art, () => {
    const W = 512, H = 640, c = canvas(W, H), ctx = c.getContext("2d"), r = rng(art.length * 13);
    if (art === "portrait") {
      let g = ctx.createRadialGradient(W * 0.5, H * 0.4, 30, W * 0.5, H * 0.45, 420);
      g.addColorStop(0, "#5a4a32"); g.addColorStop(1, "#14100a");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // плечи и пиджак
      ctx.fillStyle = "#1e1a16";
      ctx.beginPath(); ctx.moveTo(60, H); ctx.bezierCurveTo(80, 470, 170, 430, 256, 425); ctx.bezierCurveTo(342, 430, 432, 470, 452, H); ctx.fill();
      ctx.fillStyle = "#e8e0d0"; // воротник рубашки
      ctx.beginPath(); ctx.moveTo(215, 430); ctx.lineTo(256, 500); ctx.lineTo(297, 430); ctx.fill();
      ctx.fillStyle = "#6a1c1c"; // бабочка
      ctx.beginPath(); ctx.moveTo(256, 455); ctx.lineTo(225, 440); ctx.lineTo(225, 470); ctx.fill();
      ctx.beginPath(); ctx.moveTo(256, 455); ctx.lineTo(287, 440); ctx.lineTo(287, 470); ctx.fill();
      // шея и голова
      ctx.fillStyle = "#c79a7a"; ctx.fillRect(228, 380, 56, 60);
      g = ctx.createRadialGradient(240, 300, 10, 256, 310, 110);
      g.addColorStop(0, "#e2b896"); g.addColorStop(1, "#a8775a");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(256, 310, 82, 104, 0, 0, 7); ctx.fill();
      // седые волосы и борода
      ctx.fillStyle = "#d8d4cc";
      ctx.beginPath(); ctx.ellipse(256, 232, 84, 40, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(178, 290, 18, 46, 0.2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(334, 290, 18, 46, -0.2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(185, 330); ctx.bezierCurveTo(200, 430, 312, 430, 327, 330); ctx.bezierCurveTo(300, 370, 212, 370, 185, 330); ctx.fill();
      ctx.beginPath(); ctx.ellipse(256, 350, 40, 12, 0, 0, 7); ctx.fill(); // усы
      // очки и глаза
      ctx.fillStyle = "#2a1c10";
      ctx.beginPath(); ctx.arc(225, 300, 7, 0, 7); ctx.arc(287, 300, 7, 0, 7); ctx.fill();
      ctx.strokeStyle = "#b08d57"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(225, 300, 22, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(287, 300, 22, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(247, 300); ctx.lineTo(265, 300); ctx.stroke();
      ctx.strokeStyle = "#8a5a40"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(256, 305); ctx.lineTo(250, 335); ctx.lineTo(260, 337); ctx.stroke();
      // монокль-лупа часовщика на лбу
      ctx.fillStyle = "#3a2a18"; ctx.beginPath(); ctx.arc(300, 245, 16, 0, 7); ctx.fill();
      ctx.fillStyle = "#7aa0b0"; ctx.beginPath(); ctx.arc(300, 245, 10, 0, 7); ctx.fill();
      // карманные часы на цепочке
      ctx.strokeStyle = "#c9a25a"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(180, 560); ctx.quadraticCurveTo(220, 600, 270, 570); ctx.stroke();
      ctx.fillStyle = "#c9a25a"; ctx.beginPath(); ctx.arc(176, 566, 14, 0, 7); ctx.fill();
    } else if (art === "ship") {
      let g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#4a5a6a"); g.addColorStop(0.55, "#8a8a7a"); g.addColorStop(0.56, "#2a3a44"); g.addColorStop(1, "#16222a");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { ctx.strokeStyle = `rgba(220,230,240,${r() * 0.3})`; ctx.beginPath(); const y = 370 + r() * 260; ctx.moveTo(r() * W, y); ctx.lineTo(r() * W, y + 4); ctx.stroke(); }
      ctx.fillStyle = "#2a1a10"; ctx.beginPath(); ctx.moveTo(120, 380); ctx.lineTo(400, 380); ctx.lineTo(360, 420); ctx.lineTo(150, 420); ctx.fill();
      ctx.fillStyle = "#e8e0c8";
      ctx.beginPath(); ctx.moveTo(250, 140); ctx.lineTo(250, 370); ctx.lineTo(150, 360); ctx.fill();
      ctx.beginPath(); ctx.moveTo(260, 120); ctx.lineTo(260, 370); ctx.lineTo(370, 355); ctx.fill();
    } else { // landscape
      let g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#c8a070"); g.addColorStop(0.5, "#e8c890"); g.addColorStop(0.51, "#4a5a30"); g.addColorStop(1, "#2a3418");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#6a6a5a"; ctx.beginPath(); ctx.moveTo(0, 330); ctx.lineTo(140, 200); ctx.lineTo(260, 320); ctx.lineTo(380, 180); ctx.lineTo(512, 330); ctx.fill();
      ctx.fillStyle = "#3a2a1a"; ctx.fillRect(300, 330, 60, 60); ctx.beginPath(); ctx.moveTo(290, 335); ctx.lineTo(330, 300); ctx.lineTo(370, 335); ctx.fill();
      for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(30,50,20,${0.5 + r() * 0.5})`; ctx.beginPath(); ctx.arc(r() * W, 350 + r() * 300, 10 + r() * 30, 0, 7); ctx.fill(); }
    }
    // мазки масла и лак
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 220},${r() < 0.5 ? 0 : 150},${r() * 0.05})`; ctx.fillRect(r() * W, r() * H, 3 + r() * 6, 1 + r() * 2); }
    const g = ctx.createRadialGradient(W / 2, H / 2, 150, W / 2, H / 2, 420);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(20,10,0,0.55)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    return tex(c);
  });
}

// Рисунок мелом: символы по порядку
export function chalkboardTexture(symbols) {
  const W = 1024, H = 640, c = canvas(W, H), ctx = c.getContext("2d"), r = rng(9);
  ctx.fillStyle = "#1f2a24"; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(200,210,200,${r() * 0.05})`; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 80 + r() * 200, 30 + r() * 60, r(), 0, 7); ctx.fill(); }
  ctx.strokeStyle = "rgba(235,235,225,0.9)"; ctx.fillStyle = "rgba(235,235,225,0.9)"; ctx.lineWidth = 7; ctx.lineCap = "round";
  const xs = [190, 512, 834];
  symbols.forEach((s, i) => {
    drawSymbol(ctx, s, xs[i], 270, 95, true);
    ctx.font = "bold 64px 'Comic Sans MS', 'Marker Felt', cursive"; ctx.textAlign = "center";
    ctx.fillText(String(i + 1), xs[i], 450);
    if (i < symbols.length - 1) {
      ctx.beginPath(); ctx.moveTo(xs[i] + 105, 270); ctx.lineTo(xs[i + 1] - 105, 270);
      ctx.moveTo(xs[i + 1] - 125, 250); ctx.lineTo(xs[i + 1] - 105, 270); ctx.lineTo(xs[i + 1] - 125, 290); ctx.stroke();
    }
  });
  ctx.lineWidth = 3;
  ctx.font = "40px 'Comic Sans MS', 'Marker Felt', cursive";
  ctx.fillText("?  →  ?  →  ?", 512, 570);
  // шестерёнки-каракули
  for (const [x, y, rr] of [[80, 80, 40], [940, 90, 30], [960, 560, 45]]) {
    ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.stroke();
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); ctx.lineTo(x + Math.cos(a) * (rr + 12), y + Math.sin(a) * (rr + 12)); ctx.stroke(); }
  }
  // меловая пыль
  for (let i = 0; i < 6000; i++) { ctx.fillStyle = `rgba(30,42,36,${r() * 0.5})`; ctx.fillRect(r() * W, r() * H, 2, 2); }
  return tex(c);
}

export function drawSymbol(ctx, s, x, y, R, chalk = false) {
  ctx.save(); ctx.translate(x, y);
  if (s === "sun") {
    ctx.beginPath(); ctx.arc(0, 0, R * 0.45, 0, 7); chalk ? ctx.stroke() : ctx.fill();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6); ctx.lineTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95); ctx.stroke(); }
  } else if (s === "moon") {
    ctx.beginPath(); ctx.arc(0, 0, R * 0.8, Math.PI * 0.3, Math.PI * 1.7, false);
    ctx.bezierCurveTo(-R * 0.15, -R * 0.55, -R * 0.15, R * 0.55, Math.cos(Math.PI * 0.3) * R * 0.8, Math.sin(Math.PI * 0.3) * R * 0.8);
    chalk ? ctx.stroke() : ctx.fill();
  } else if (s === "star") {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? R * 0.4 : R * 0.95; k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); chalk ? ctx.stroke() : ctx.fill();
  }
  ctx.restore();
}

export function symbolTexture(s) {
  return cached("sym:" + s, () => {
    const S = 256, c = canvas(S, S), ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(S * 0.4, S * 0.4, 10, S / 2, S / 2, S / 2);
    g.addColorStop(0, "#e8c87a"); g.addColorStop(1, "#8a6a30");
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = "#3a2610"; ctx.strokeStyle = "#3a2610"; ctx.lineWidth = 12; ctx.lineCap = "round";
    drawSymbol(ctx, s, S / 2, S / 2, S * 0.36);
    return tex(c);
  });
}

// Цифры для барабанов кодового замка: 0..9 по окружности
export function digitStrip() {
  return cached("digits", () => {
    const W = 1024, H = 128, c = canvas(W, H), ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#6a5030"); g.addColorStop(0.5, "#d9b76e"); g.addColorStop(1, "#6a5030");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.font = "bold 92px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 0; i < 10; i++) {
      const x = (i + 0.5) * (W / 10);
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(i * (W / 10), 0, 2, H);
      // цифра повёрнута и сжата, чтобы на круглом колесе выглядеть ровно
      ctx.save(); ctx.translate(x, H / 2); ctx.rotate(Math.PI / 2); ctx.scale(0.55, 1);
      ctx.fillStyle = "#2a1a08"; ctx.fillText(String(i), 0, 6);
      ctx.restore();
    }
    const t = tex(c);
    t.wrapS = THREE.RepeatWrapping;
    return t;
  });
}

export function globeTexture() {
  return cached("globe", () => {
    const W = 1024, H = 512, c = canvas(W, H), ctx = c.getContext("2d"), r = rng(42);
    ctx.fillStyle = "#c8b58a"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#8a7a4a";
    for (let i = 0; i < 9; i++) {
      const cx = r() * W, cy = 80 + r() * (H - 160);
      for (let k = 0; k < 40; k++) { ctx.beginPath(); ctx.ellipse(cx + (r() - 0.5) * 200, cy + (r() - 0.5) * 120, 20 + r() * 50, 15 + r() * 35, r() * 3, 0, 7); ctx.fill(); }
    }
    ctx.strokeStyle = "rgba(60,40,20,0.4)"; ctx.lineWidth = 1.5;
    for (let i = 1; i < 12; i++) { ctx.beginPath(); ctx.moveTo((i * W) / 12, 0); ctx.lineTo((i * W) / 12, H); ctx.stroke(); }
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, (i * H) / 6); ctx.lineTo(W, (i * H) / 6); ctx.stroke(); }
    noise(ctx, W, H, 0.1, r, 2);
    return tex(c);
  });
}

export function bookSpineTexture() {
  return cached("spine", () => {
    const W = 64, H = 256, c = canvas(W, H), ctx = c.getContext("2d"), r = rng(4);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 800; i++) { ctx.fillStyle = `rgba(0,0,0,${r() * 0.08})`; ctx.fillRect(r() * W, r() * H, 2, 2); }
    ctx.fillStyle = "#e0c070";
    for (const y of [24, 34, 210, 220]) ctx.fillRect(0, y, W, 4);
    ctx.fillRect(14, 80, W - 28, 50);
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(0,0,0,0.45)"); g.addColorStop(0.3, "rgba(0,0,0,0)"); g.addColorStop(0.7, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    return tex(c);
  });
}

export function paperTexture(lines = 9) {
  const W = 256, H = 320, c = canvas(W, H), ctx = c.getContext("2d"), r = rng(lines);
  ctx.fillStyle = "#e9dcbc"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(40,30,80,0.7)"; ctx.lineWidth = 3;
  for (let i = 0; i < lines; i++) {
    const y = 40 + i * 28, x1 = 30, x2 = W - 30 - r() * 70;
    ctx.beginPath(); ctx.moveTo(x1, y);
    for (let x = x1; x < x2; x += 6) ctx.lineTo(x, y + Math.sin(x * 0.4 + i) * 2 + (r() - 0.5) * 3);
    ctx.stroke();
  }
  noise(ctx, W, H, 0.08, r);
  return tex(c);
}

export function windowTexture() {
  return cached("window", () => {
    const W = 256, H = 512, c = canvas(W, H), ctx = c.getContext("2d"), r = rng(31);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0e1830"); g.addColorStop(1, "#24344e");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e8eef8"; ctx.beginPath(); ctx.arc(170, 110, 28, 0, 7); ctx.fill(); // луна
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.8})`; ctx.fillRect(r() * W, r() * H * 0.6, 2, 2); }
    ctx.fillStyle = "#070b14"; // силуэты деревьев
    for (let i = 0; i < 6; i++) { const x = r() * W; ctx.beginPath(); ctx.moveTo(x - 50, H); ctx.lineTo(x, H * (0.45 + r() * 0.2)); ctx.lineTo(x + 50, H); ctx.fill(); }
    return tex(c);
  });
}
