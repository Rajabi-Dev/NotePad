(function () {
  "use strict";
  const NOTES_KEY = "mahdi-notes-v8-static";
  const CURRENT_KEY = "mahdi-notes-v8-current";
  const SESSION_DOC_KEY = "mahdi-notes-v8-session-doc";
  const RECOVERY_KEY = "mahdi-notes-v8-recovery";
  const SETTINGS_KEY = "mahdi-notes-v8-settings";
  const DEFAULT_SESSION_DAYS = 90;
  const defaults = { autoSave: true, autoSaveMs: 250, jokeEnabled: true, jokeMinutes: 10, split: 50, sessionDays: DEFAULT_SESSION_DAYS, theme: "default", font: "Tahoma", fontSize: 16 };

  function settings() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")); }
    catch (_) { return Object.assign({}, defaults); }
  }
  function setSettings(next) {
    const merged = Object.assign({}, settings(), next || {});
    merged.autoSaveMs = Math.max(100, Math.min(5000, Number(merged.autoSaveMs) || 250));
    merged.jokeMinutes = [5, 10, 15, 30].includes(Number(merged.jokeMinutes)) ? Number(merged.jokeMinutes) : 10;
    merged.split = Math.max(25, Math.min(75, Number(merged.split) || 50));
    merged.sessionDays = [7,30,90,180,365].includes(Number(merged.sessionDays)) ? Number(merged.sessionDays) : DEFAULT_SESSION_DAYS;
    merged.theme = ["default","midnight","forest","violet","light"].includes(String(merged.theme)) ? String(merged.theme) : "default";
    merged.font = String(merged.font || "Tahoma");
    merged.fontSize = [14,15,16,17,18,20,22].includes(Number(merged.fontSize)) ? Number(merged.fontSize) : 16;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged)); } catch (_) {}
    return merged;
  }
  function readAll() {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}"); } catch (_) { return {}; }
  }
  function writeAll(all) { try { localStorage.setItem(NOTES_KEY, JSON.stringify(all)); } catch (_) {} }
  function save(doc) {
    const cfg = settings();
    const all = readAll(); all[doc.id] = doc; writeAll(all);
    try { sessionStorage.setItem(CURRENT_KEY, doc.id); sessionStorage.setItem(SESSION_DOC_KEY, JSON.stringify(doc)); } catch (_) {}
    try { localStorage.setItem(RECOVERY_KEY, JSON.stringify({ savedAt: Date.now(), expiresAt: Date.now() + cfg.sessionDays * 86400000, doc: doc })); } catch (_) {}
    setCurrentCookie(doc.id);
  }
  function load(id) {
    const cfg = settings();
    let target = id || null;
    try { if (!target) target = sessionStorage.getItem(CURRENT_KEY); } catch (_) {}
    if (!target) target = getCurrentCookie();
    const all = readAll();
    if (target && all[target]) return all[target];
    try {
      const sessionDoc = JSON.parse(sessionStorage.getItem(SESSION_DOC_KEY) || "null");
      if (sessionDoc && (!target || sessionDoc.id === target)) return sessionDoc;
    } catch (_) {}
    try {
      const recovery = JSON.parse(localStorage.getItem(RECOVERY_KEY) || "null");
      if (recovery && Number(recovery.expiresAt || 0) > Date.now() && recovery.doc) return recovery.doc;
      if (recovery) localStorage.removeItem(RECOVERY_KEY);
    } catch (_) {}
    return null;
  }
  function all() { return readAll(); }
  function remove(id) {
    const all = readAll(); delete all[id]; writeAll(all);
    try {
      if (sessionStorage.getItem(CURRENT_KEY) === id) { sessionStorage.removeItem(CURRENT_KEY); sessionStorage.removeItem(SESSION_DOC_KEY); }
    } catch (_) {}
    try {
      const recovery = JSON.parse(localStorage.getItem(RECOVERY_KEY) || "null");
      if (recovery && recovery.doc && recovery.doc.id === id) localStorage.removeItem(RECOVERY_KEY);
    } catch (_) {}
    if (getCurrentCookie() === id) clearCurrentCookie();
  }
  function clearAll() {
    try { localStorage.removeItem(NOTES_KEY); localStorage.removeItem(RECOVERY_KEY); } catch (_) {}
    try { sessionStorage.removeItem(CURRENT_KEY); sessionStorage.removeItem(SESSION_DOC_KEY); } catch (_) {}
    clearCurrentCookie();
  }
  function setCurrentCookie(id) { document.cookie = encodeURIComponent("mahdi-notes-current") + "=" + encodeURIComponent(id) + "; max-age=31536000; path=/; SameSite=Lax"; }
  function getCurrentCookie() {
    const key = encodeURIComponent("mahdi-notes-current") + "=";
    const item = document.cookie.split("; ").find(x => x.indexOf(key) === 0);
    return item ? decodeURIComponent(item.slice(key.length)) : null;
  }
  function clearCurrentCookie() { document.cookie = encodeURIComponent("mahdi-notes-current") + "=; max-age=0; path=/; SameSite=Lax"; }
  function download(name, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function exportJSON(doc) { download((doc.title || "note") + ".json", JSON.stringify(doc, null, 2), "application/json;charset=utf-8"); }
  function exportAllJSON() { download("mahdi-notes-backup.json", JSON.stringify({ version: 8, exportedAt: new Date().toISOString(), notes: readAll() }, null, 2), "application/json;charset=utf-8"); }
  function importJSON(raw) {
    const parsed = JSON.parse(raw);
    const imported = parsed.notes && typeof parsed.notes === "object" ? parsed.notes : (parsed.id ? { [parsed.id]: parsed } : null);
    if (!imported) throw new Error("فرمت JSON پشتیبانی نمی‌شود");
    const current = readAll();
    Object.keys(imported).forEach(function (id) {
      const n = imported[id]; if (!n || typeof n !== "object") return;
      current[n.id || id] = { id: n.id || id, title: typeof n.title === "string" ? n.title : "یادداشت واردشده", tags: Array.isArray(n.tags) ? n.tags : [], created: n.created || new Date().toISOString(), modified: n.modified || new Date().toISOString(), blocks: Array.isArray(n.blocks) ? n.blocks : [] };
    });
    writeAll(current);
    return Object.values(imported).filter(Boolean);
  }
  function exportTXT(text, title) { download((title || "note") + ".txt", text, "text/plain;charset=utf-8"); }
  function exportHTML(html, title) { download((title || "note") + ".html", '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>' + window.MahdiRenderer.escapeHTML(title || "note") + '</title><style>body{font-family:Tahoma,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;line-height:1.9}pre{direction:ltr;text-align:left;background:#111;color:#eee;padding:15px;overflow:auto}</style><body>' + html + '</body></html>', "text/html;charset=utf-8"); }
  window.MahdiStorage = { save, load, all, remove, clearAll, settings, setSettings, exportJSON, exportAllJSON, importJSON, exportTXT, exportHTML, NOTES_KEY, CURRENT_KEY, SETTINGS_KEY };
})();
