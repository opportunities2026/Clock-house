// Интерфейс поверх 3D: сообщения, инвентарь, записки, дневник, меню.
import { t, tr, applyDom } from "./i18n.js";

const $ = (id) => document.getElementById(id);

export const ICONS = {
  key: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d38a"/><stop offset="1" stop-color="#8a6326"/></linearGradient></defs><circle cx="18" cy="32" r="11" fill="none" stroke="url(#gk)" stroke-width="6"/><rect x="28" y="29" width="28" height="6" rx="2" fill="url(#gk)"/><rect x="46" y="35" width="5" height="10" fill="url(#gk)"/><rect x="38" y="35" width="4" height="7" fill="url(#gk)"/></svg>`,
  gear: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d38a"/><stop offset="1" stop-color="#8a6326"/></linearGradient></defs><g fill="url(#gg)" transform="translate(32 32)">${Array.from({ length: 10 }, (_, i) => `<rect x="-4" y="-27" width="8" height="10" rx="1.5" transform="rotate(${i * 36})"/>`).join("")}<circle r="19"/></g><circle cx="32" cy="32" r="6" fill="#2a1c0a"/></svg>`,
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

export function renderInventory(list, defs, onTap) {
  const el = $("inventory");
  el.innerHTML = "";
  for (const id of list) {
    const def = defs[id] || {};
    const b = document.createElement("button");
    b.className = "slot";
    b.setAttribute("aria-label", tr(def.name));
    b.innerHTML = ICONS[def.icon] || ICONS.note;
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
