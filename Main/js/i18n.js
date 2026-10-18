// Переводы: t("ключ") берёт строку из lang/ru.js или lang/en.js,
// tr({ ru: "...", en: "..." }) — текст прямо из файла уровня.
import ru from "../lang/ru.js";
import en from "../lang/en.js";

const langs = { ru, en };
let current = "ru";

export function setLang(l) { if (langs[l]) current = l; document.documentElement.lang = current; }
export function getLang() { return current; }

export function t(key, vars = {}) {
  let s = langs[current][key] ?? langs.ru[key] ?? key;
  for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
  return s;
}

export function tr(obj) {
  if (obj == null) return "";
  if (typeof obj === "string") return t(obj);
  return obj[current] ?? obj.ru ?? "";
}

// Подставляет переводы во все элементы с атрибутом data-t
export function applyDom(root = document) {
  root.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
}
