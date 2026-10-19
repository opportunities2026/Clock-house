// Интерфейс поверх 3D: сообщения, инвентарь, записки, дневник, меню.
import { t, tr, applyDom } from "./i18n.js";

const $ = (id) => document.getElementById(id);

export const ICONS = {
  key: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d38a"/><stop offset="1" stop-color="#8a6326"/></linearGradient></defs><circle cx="18" cy="32" r="11" fill="none" stroke="url(#gk)" stroke-width="6"/><rect x="28" y="29" width="28" height="6" rx="2" fill="url(#gk)"/><rect x="46" y="35" width="5" height="10" fill="url(#gk)"/><rect x="38" y="35" width="4" height="7" fill="url(#gk)"/></svg>`,
  gear: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d38a"/><stop offset="1" stop-color="#8a6326"/></linearGradient></defs><g fill="url(#gg)" transform="translate(32 32)">${Array.from({ length: 10 }, (_, i) => `<rect x="-4" y="-27" width="8" height="10" rx="1.5" transform="rotate(${i * 36})"/>`).join("")}<circle r="19"/></g><circle cx="32" cy="32" r="6" fill="#2a1c0a"/></svg>`,
  lantern: `<svg viewBox="0 0 64 64"><path d="M24 10a8 8 0 0 1 16 0" fill="none" stroke="#8a6326" stroke-width="3"/><rect x="20" y="14" width="24" height="6" rx="2" fill="#4a3a2a"/><rect x="22" y="20" width="20" height="28" rx="3" fill="#ffd27a" stroke="#4a3a2a" stroke-width="3"/><path d="M32 28c4 5 3 10 0 12-3-2-4-7 0-12z" fill="#ff8a20"/><rect x="18" y="48" width="28" height="6" rx="2" fill="#4a3a2a"/></svg>`,
  valve: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="none" stroke="#b02a1e" stroke-width="6"/><path d="M32 10v44M10 32h44M17 17l30 30M47 17L17 47" stroke="#b02a1e" stroke-width="4"/><circle cx="32" cy="32" r="7" fill="#7a1a12"/></svg>`,
  hand: `<svg viewBox="0 0 64 64"><path d="M30 58h4l1-40h6L32 4 23 18h6z" fill="#2a2018" stroke="#c9a25a" stroke-width="1.5"/><circle cx="32" cy="32" r="4" fill="none" stroke="#c9a25a" stroke-width="2"/></svg>`,
  weight: `<svg viewBox="0 0 64 64"><rect x="26" y="8" width="12" height="10" rx="3" fill="none" stroke="#c9a25a" stroke-width="3"/><path d="M16 20h32l6 34H10z" fill="#55504a" stroke="#2a2622" stroke-width="2"/></svg>`,
  note: `<svg viewBox="0 0 64 64"><path d="M14 8h28l10 10v38H14z" fill="#e9dcbc" stroke="#8a7350" stroke-width="2"/><path d="M20 26h24M20 33h24M20 40h18" stroke="#5a4a80" stroke-width="2.5"/></svg>`,
};

let toastTimer = 0;
export function toast(text, ms = 2600) {
  const el = $("toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

export function renderInventory(list, defs, onTap, selected = null) {
  const el = $("inventory");
  el.innerHTML = "";
  for (const id of list) {
    const def = defs[id] || {};
    const b = document.createElement("button");
    b.className = "slot" + (id === selected ? " selected" : "");
    b.setAttribute("aria-label", tr(def.name));
    b.innerHTML = ICONS[def.icon] || ICONS.note;
    if (def.label) { const s = document.createElement("span"); s.className = "badge"; s.textContent = def.label; b.appendChild(s); }
    if (def.icon === "gear" && def.size) b.firstChild.style.transform = `scale(${0.6 + def.size * 3})`;
    b.addEventListener("click", (e) => { e.stopPropagation(); onTap(id); });
    el.appendChild(b);
  }
  el.classList.toggle("empty", list.length === 0);
}

export function flashSlot(index) {
  const el = $("inventory").children[index];
  if (!el) return;
  el.classList.remove("new"); void el.offsetWidth; el.classList.add("new");
}

// Записка на «бумаге». Возвращает Promise, который выполняется при закрытии.
export function showNote(title, text) {
  return new Promise((resolve) => {
    const ov = $("note-overlay");
    $("note-title").textContent = title;
    $("note-text").textContent = text;
    ov.classList.add("show");
    const close = (e) => {
      e?.stopPropagation();
      ov.classList.remove("show");
      ov.removeEventListener("click", close);
      resolve();
    };
    setTimeout(() => ov.addEventListener("click", close), 300);
  });
}

export function showDiary(notes, defs, onOpen) {
  const ov = $("diary-overlay"), list = $("diary-list");
  list.innerHTML = "";
  if (!notes.length) {
    const p = document.createElement("p"); p.className = "muted"; p.textContent = t("diaryEmpty"); list.appendChild(p);
  }
  for (const id of notes) {
    const b = document.createElement("button");
    b.className = "diary-entry";
    b.innerHTML = ICONS.note + `<span></span>`;
    b.querySelector("span").textContent = tr(defs[id]?.title);
    b.addEventListener("click", () => onOpen(id));
    list.appendChild(b);
  }
  ov.classList.add("show");
}
export function hideDiary() { $("diary-overlay").classList.remove("show"); }

export function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("show", s.id === "screen-" + name));
}
export function hideScreens() { document.querySelectorAll(".screen").forEach((s) => s.classList.remove("show")); }

export function confirmDialog(text) {
  return new Promise((resolve) => {
    const d = $("confirm");
    $("confirm-text").textContent = text;
    d.classList.add("show");
    const done = (v) => { d.classList.remove("show"); yes.onclick = no.onclick = null; resolve(v); };
    const yes = $("confirm-yes"), no = $("confirm-no");
    yes.onclick = () => done(true); no.onclick = () => done(false);
  });
}

export function fade(on, ms = 600) {
  const f = $("fade");
  f.style.transitionDuration = ms + "ms";
  f.classList.toggle("on", on);
  return new Promise((r) => setTimeout(r, ms));
}

export function setInspectUI(on) {
  document.body.classList.toggle("inspecting", on);
}

export function refreshTexts() { applyDom(); }
