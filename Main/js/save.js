// Сохранение прогресса и настроек на самом планшете (localStorage).
const SAVE_KEY = "clockhouse.save.v1";
const SETTINGS_KEY = "clockhouse.settings.v1";

function read(key) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
}
function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* приватный режим — просто не сохраняем */ }
}

export function loadGame() { return read(SAVE_KEY); }
export function saveGame(state) { write(SAVE_KEY, state); }
export function clearGame() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ничего */ } }

export function loadSettings() {
  return { lang: "ru", volume: 0.8, sensitivity: 1, quality: "high", ...(read(SETTINGS_KEY) || {}) };
}
export function saveSettings(s) { write(SETTINGS_KEY, s); }
