(function () {
  "use strict";
  const Document = window.MahdiDocument, Parser = window.MahdiParser, Renderer = window.MahdiRenderer;
  const Storage = window.MahdiStorage, Commands = window.MahdiCommands, UI = window.MahdiUI;
  const editor = document.getElementById("editor"), title = document.getElementById("title"), preview = document.getElementById("preview"), noteList = document.getElementById("note-list"), fileInput = document.getElementById("file-import");
  let doc = Storage.load() || Document.createDocument(), autoSaveTimer = null, selectedNotes = new Set(), jokeTimer = null;

  const commandDefinitions = [
    ["بولد", "Ctrl+B", () => Commands.toggleBold(editor)], ["ایتالیک", "Ctrl+I", () => Commands.toggleItalic(editor)],
    ["کد درون‌خطی", "", () => Commands.inlineCode(editor)], ["بلوک code", "Ctrl+Alt+C", () => Commands.insertBlock(editor, "text")],
    ["ذخیره", "Ctrl+S", saveNote], ["نوت جدید", "Ctrl+N", newNote], ["پیش‌نمایش", "Ctrl+Shift+P", UI.togglePreview],
    ["حالت تمرکز", "Ctrl+Shift+F", () => document.body.classList.toggle("focus-mode")], ["خروجی JSON", "", exportJSON], ["خروجی TXT", "", exportTXT], ["خروجی HTML", "", exportHTML],
    ["ورود JSON/TXT/MD", "", () => fileInput.click()], ["تنظیمات", "", openSettings], ["راهنما", "", () => UI.showModal("help-modal")]
  ];
  const jokes = [
    "شبکه‌کار گفت پینگ ۲ms است؛ مانیتورینگ گفت پس چرا من ۲۰۰۰ هشدار دارم؟",
    "SOC گفت لاگ‌ها را بررسی کن؛ شبکه‌کار گفت اول بگو چرا کابل از من بیشتر کار می‌کند؟",
    "فایروال گفت من جلوی همه‌چیز را می‌گیرم؛ DNS گفت من فقط اسم‌ها را بلدم.",
    "شبکه‌کار به سوئیچ گفت چرا کندی؟ سوئیچ گفت چون همه‌تان به من وصلید!",
    "Incident آمد؛ شبکه‌کار گفت احتمالاً کابل است. کابل: من هیچ‌وقت دیده نمی‌شوم ولی همیشه متهمم.",
    "شبکه‌کار گفت Route درست است؛ Ping گفت من هنوز قانع نشدم.",
    "وقتی شبکه‌کار می‌گوید «فقط یک تغییر کوچیکه»، بکاپ‌ها خودشون را باز می‌کنند."
  ];

  function hasRealContent() { return editor.value.trim().length > 0 || (title.value.trim() && title.value.trim() !== "یادداشت جدید"); }
  function sourceToDocument() {
    const ast = Parser.parse(editor.value), next = Document.createDocument(doc);
    next.title = title.value.trim() || "یادداشت جدید";
    next.blocks = ast.blocks.map(b => ({ type: b.type, text: b.text, dir: b.dir, ...(b.language ? { language: b.language } : {}), ...(b.items ? { items: b.items } : {}) }));
    next.modified = new Date().toISOString(); return { doc: next, ast };
  }
  function renderCurrent() {
    const result = sourceToDocument(); preview.innerHTML = Renderer.render(result.ast); UI.updateCounts(editor.value);
    UI.setStatus("parse-state", result.ast.errors.length ? "⚠ " + result.ast.errors[0].message : "✓ آماده");
    UI.setStatus("mode", detectMode()); return result;
  }
  function scheduleSave() {
    clearTimeout(autoSaveTimer); const cfg = Storage.settings();
    if (!cfg.autoSave || !hasRealContent()) return;
    UI.setStatus("save-state", "در حال تغییر...");
    autoSaveTimer = setTimeout(saveNote, Math.max(100, Number(cfg.autoSaveMs) || 250));
  }
  function sync() { renderCurrent(); scheduleSave(); }
  function detectMode() { const line = editor.value.slice(0, editor.selectionStart).split("\n").pop() || ""; const m = line.match(/^code(?::([A-Za-z0-9_+.-]+))?\s*$/i); return m ? "CODE:" + (m[1] || "TEXT").toUpperCase() : "NORMAL"; }
  function saveNote() {
    clearTimeout(autoSaveTimer); if (!hasRealContent()) { UI.setStatus("save-state", "چیزی برای ذخیره نیست"); return; }
    const result = sourceToDocument(); doc = result.doc; Storage.save(doc); document.getElementById("current-id").textContent = doc.id; UI.setStatus("save-state", "✓ ذخیره شد"); refreshNotes();
  }
  function loadNote(note) { if (!note) return; clearTimeout(autoSaveTimer); doc = Document.createDocument(note); title.value = doc.title; editor.value = Parser.blocksToSource(doc.blocks); document.getElementById("current-id").textContent = doc.id; renderCurrent(); UI.setStatus("save-state", "✓ ذخیره شد"); refreshNotes(); }
  function newNote() { clearTimeout(autoSaveTimer); doc = Document.createDocument(); title.value = doc.title; editor.value = ""; document.getElementById("current-id").textContent = doc.id; renderCurrent(); UI.setStatus("save-state", "جدید"); refreshNotes(); editor.focus(); }
  function refreshNotes() {
    const q = document.getElementById("note-search").value.trim().toLowerCase();
    const notes = Object.values(Storage.all()).filter(n => !q || String(n.title).toLowerCase().includes(q)).sort((a, b) => String(b.modified).localeCompare(String(a.modified)));
    document.getElementById("note-count").textContent = notes.length; noteList.replaceChildren();
    notes.forEach(n => {
      const item = document.createElement("div"); item.className = "note-item" + (n.id === doc.id ? " active" : "") + (selectedNotes.has(n.id) ? " selected" : "");
      const main = document.createElement("div"); main.className = "note-main";
      const check = document.createElement("input"); check.type = "checkbox"; check.className = "note-check"; check.checked = selectedNotes.has(n.id);
      check.addEventListener("click", e => { e.stopPropagation(); check.checked ? selectedNotes.add(n.id) : selectedNotes.delete(n.id); item.classList.toggle("selected", check.checked); updateBulkButton(); });
      const text = document.createElement("div"); text.className = "note-text"; const name = document.createElement("div"); name.className = "note-title"; name.textContent = n.title || "بدون عنوان"; const date = document.createElement("div"); date.className = "note-date"; date.textContent = new Date(n.modified).toLocaleString(); text.append(name, date); main.append(check, text);
      const actions = document.createElement("div"); actions.className = "note-actions";
      const ex = document.createElement("button"); ex.className = "note-icon"; ex.textContent = "{}"; ex.title = "خروجی JSON"; ex.addEventListener("click", e => { e.stopPropagation(); Storage.exportJSON(n); });
      const del = document.createElement("button"); del.className = "note-icon danger-icon"; del.textContent = "×"; del.title = "حذف"; del.addEventListener("click", e => { e.stopPropagation(); UI.confirm("یادداشت «" + (n.title || "بدون عنوان") + "» حذف شود؟", () => { Storage.remove(n.id); n.id === doc.id ? newNote() : refreshNotes(); }); });
      actions.append(ex, del); item.append(main, actions); item.addEventListener("click", () => loadNote(n)); noteList.appendChild(item);
    });
    updateBulkButton();
  }
  function updateBulkButton() { document.getElementById("delete-selected-notes").disabled = selectedNotes.size === 0; }
  function selectAllNotes() { const notes = Object.values(Storage.all()); const all = notes.length && notes.every(n => selectedNotes.has(n.id)); selectedNotes.clear(); if (!all) notes.forEach(n => selectedNotes.add(n.id)); refreshNotes(); }
  function deleteSelectedNotes() { const ids = [...selectedNotes]; if (!ids.length) return UI.alert("ابتدا یک یادداشت را انتخاب کن", "warning"); UI.confirm(ids.length + " یادداشت حذف شود؟", () => { ids.forEach(id => Storage.remove(id)); selectedNotes.clear(); const remaining = Object.values(Storage.all()).sort((a, b) => String(b.modified).localeCompare(String(a.modified))); remaining.length ? loadNote(remaining[0]) : newNote(); }); }
  function deleteCurrentNote() { const stored = Storage.all()[doc.id]; if (!stored && !hasRealContent()) return newNote(); UI.confirm("یادداشت «" + (doc.title || "بدون عنوان") + "» حذف شود؟", () => { Storage.remove(doc.id); const remaining = Object.values(Storage.all()).sort((a, b) => String(b.modified).localeCompare(String(a.modified))); remaining.length ? loadNote(remaining[0]) : newNote(); }); }
  function openSettings() {
    const c = Storage.settings();
    document.getElementById("opt-autosave").checked = !!c.autoSave;
    document.getElementById("opt-autosave-ms").value = String(c.autoSaveMs);
    document.getElementById("opt-joke-minutes").value = String(c.jokeMinutes);
    document.getElementById("opt-split").value = String(c.split);
    document.getElementById("opt-session-days").value = String(c.sessionDays);
    document.getElementById("opt-theme").value = c.theme;
    document.getElementById("opt-font").value = c.font;
    document.getElementById("opt-font-size").value = String(c.fontSize);
    applySettingsUI(c); UI.showModal("settings-modal");
  }
  function applySettingsUI(c) {
    document.documentElement.style.setProperty("--editor-split", c.split + "%");
    document.documentElement.style.setProperty("--editor-font", '"' + String(c.font).replace(/"/g,"") + '",Tahoma,"Segoe UI",Arial,sans-serif');
    document.documentElement.style.setProperty("--editor-size", c.fontSize + "px");
    document.documentElement.dataset.theme = c.theme === "default" ? "" : c.theme;
    document.getElementById("split-label").textContent = c.split + "٪ / " + (100 - c.split) + "٪";
  }
  function applySettings() {
    const c = Storage.setSettings({
      autoSave: document.getElementById("opt-autosave").checked,
      autoSaveMs: Number(document.getElementById("opt-autosave-ms").value),
      jokeMinutes: Number(document.getElementById("opt-joke-minutes").value),
      split: Number(document.getElementById("opt-split").value),
      sessionDays: Number(document.getElementById("opt-session-days").value),
      theme: document.getElementById("opt-theme").value,
      font: document.getElementById("opt-font").value,
      fontSize: Number(document.getElementById("opt-font-size").value)
    });
    applySettingsUI(c); scheduleSave(); startJokes();
  }
  function exportAllJSON() { Storage.exportAllJSON(); }
  function exportJSON() { Storage.exportJSON(sourceToDocument().doc); }
  function exportTXT() { const r = sourceToDocument(); Storage.exportTXT(editor.value, r.doc.title); }
  function exportHTML() { const r = sourceToDocument(); Storage.exportHTML(Renderer.render(r.ast), r.doc.title); }
  function importFile(file) {
    const reader = new FileReader(); reader.onload = () => { try {
      const raw = String(reader.result || "");
      if (file.name.toLowerCase().endsWith(".json")) { const parsed = JSON.parse(raw); Storage.importJSON(raw); const imported = parsed.notes && typeof parsed.notes === "object" ? Object.values(parsed.notes) : [parsed]; const latest = imported.filter(x => x && x.id).sort((a, b) => String(b.modified || "").localeCompare(String(a.modified || "")))[0]; if (latest) loadNote(Storage.all()[latest.id] || latest); }
      else { doc = Document.createDocument(); title.value = file.name.replace(/\.(txt|md)$/i, ""); editor.value = raw; sync(); saveNote(); }
      UI.alert("فایل با موفقیت وارد شد", "success");
    } catch (_) { UI.alert("فایل قابل خواندن نیست", "error"); } fileInput.value = ""; }; reader.readAsText(file);
  }
  function renderCommands(filter) { const list = document.getElementById("command-list"), q = String(filter || "").trim().toLowerCase(); list.replaceChildren(); commandDefinitions.filter(x => !q || x[0].toLowerCase().includes(q) || x[1].toLowerCase().includes(q)).forEach(item => { const row = document.createElement("div"); row.className = "command-item"; const a = document.createElement("span"); a.textContent = item[0]; const b = document.createElement("span"); b.className = "command-key"; b.textContent = item[1]; row.append(a, b); row.onclick = () => { UI.closeModals(); item[2](); }; list.appendChild(row); }); }
  function scheduleJoke() { const c = Storage.settings(); if (!c.jokeEnabled) return; const delay = Math.max(1, Number(c.jokeMinutes) || 10) * 60000; jokeTimer = setTimeout(() => { UI.alert(jokes[Math.floor(Math.random() * jokes.length)], "info", "شوخی شبکه‌کار"); startJokes(); }, delay); }
  function startJokes() { clearTimeout(jokeTimer); scheduleJoke(); }

  document.querySelector('[data-command="bold"]').onclick = () => Commands.toggleBold(editor); document.querySelector('[data-command="italic"]').onclick = () => Commands.toggleItalic(editor); document.querySelector('[data-command="inlineCode"]').onclick = () => Commands.inlineCode(editor); document.querySelector('[data-command="codeBlock"]').onclick = () => Commands.insertBlock(editor, "text");
  document.getElementById("save").onclick = saveNote; document.getElementById("new-note").onclick = newNote; document.getElementById("select-all-notes").onclick = selectAllNotes; document.getElementById("delete-selected-notes").onclick = deleteSelectedNotes; document.getElementById("preview-toggle").onclick = UI.togglePreview; document.getElementById("focus-toggle").onclick = () => document.body.classList.toggle("focus-mode"); document.getElementById("readOnlyBtn").onclick = () => {
    editor.readOnly = !editor.readOnly;
    document.body.classList.toggle("read-only", editor.readOnly);
    document.getElementById("readOnlyBtn").textContent = editor.readOnly ? "ویرایش" : "مطالعه";
    UI.alert(editor.readOnly ? "حالت مطالعه فعال شد" : "حالت ویرایش فعال شد", "info", "حالت مطالعه");
  }; document.getElementById("delete-note").onclick = deleteCurrentNote; document.getElementById("settings-toggle").onclick = openSettings; document.getElementById("export-all-json").onclick = exportAllJSON; document.getElementById("import-json").onclick = () => fileInput.click(); document.getElementById("clear-storage").onclick = () => UI.confirm("همه یادداشت‌های ذخیره‌شده پاک شوند؟", () => { Storage.clearAll(); selectedNotes.clear(); newNote(); UI.alert("همه ذخیره‌ها پاک شدند", "success"); }); document.getElementById("refresh-storage").onclick = () => { const live = Storage.load(); if (live) loadNote(live); refreshNotes(); UI.alert("ذخیره‌سازی دوباره خوانده شد", "success"); };
  ["opt-autosave", "opt-autosave-ms", "opt-joke-minutes", "opt-split", "opt-session-days", "opt-theme", "opt-font", "opt-font-size"].forEach(id => document.getElementById(id).addEventListener("input", applySettings));
  document.getElementById("command-palette-toggle").onclick = () => { UI.showModal("command-modal"); renderCommands(""); document.getElementById("command-search").focus(); };
  document.getElementById("help-toggle").onclick = () => UI.showModal("help-modal"); document.querySelectorAll("[data-close-modal]").forEach(b => b.onclick = UI.closeModals); document.getElementById("modal-backdrop").addEventListener("click", e => { if (e.target.id === "modal-backdrop") UI.closeModals(); }); document.getElementById("confirm-yes").onclick = UI.runConfirm;
  document.getElementById("note-search").addEventListener("input", refreshNotes); document.getElementById("command-search").addEventListener("input", e => renderCommands(e.target.value)); fileInput.addEventListener("change", () => fileInput.files[0] && importFile(fileInput.files[0]));
  document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (e.ctrlKey && !e.altKey && !e.shiftKey && key === "s") { e.preventDefault(); saveNote(); }
    else if (e.ctrlKey && !e.altKey && !e.shiftKey && key === "n") { e.preventDefault(); newNote(); }
    else if (e.ctrlKey && !e.altKey && key === "b") { e.preventDefault(); Commands.toggleBold(editor); }
    else if (e.ctrlKey && !e.altKey && key === "i") { e.preventDefault(); Commands.toggleItalic(editor); }
    else if (e.ctrlKey && e.altKey && key === "c") { e.preventDefault(); Commands.insertBlock(editor, "text"); }
    else if (e.ctrlKey && e.shiftKey && key === "p") { e.preventDefault(); UI.togglePreview(); }
    else if (e.ctrlKey && e.shiftKey && key === "f") { e.preventDefault(); document.body.classList.toggle("focus-mode"); }
    else if (e.ctrlKey && e.key === "k") { e.preventDefault(); UI.showModal("command-modal"); renderCommands(""); document.getElementById("command-search").focus(); }
  });
  editor.addEventListener("input", sync); editor.addEventListener("keyup", () => UI.setStatus("mode", detectMode())); title.addEventListener("input", sync);

  const workspace = document.getElementById("workspace"), divider = document.getElementById("pane-resizer"); let dragging = false;
  function setSplit(percent) { const c = Storage.setSettings({ split: Math.round(percent) }); applySettingsUI(c); }
  function pointerPercent(e) { const r = workspace.getBoundingClientRect(); return Math.max(25, Math.min(75, ((r.right - e.clientX) / r.width) * 100)); }
  divider.addEventListener("pointerdown", e => { dragging = true; workspace.classList.add("resizing"); divider.setPointerCapture?.(e.pointerId); });
  divider.addEventListener("pointermove", e => { if (dragging) setSplit(pointerPercent(e)); });
  divider.addEventListener("pointerup", () => { dragging = false; workspace.classList.remove("resizing"); });
  divider.addEventListener("keydown", e => { const c = Storage.settings(); if (e.key === "ArrowRight") setSplit(c.split - 2); if (e.key === "ArrowLeft") setSplit(c.split + 2); });

  window.addEventListener("storage", e => { if ([Storage.NOTES_KEY, Storage.CURRENT_KEY, Storage.SETTINGS_KEY].includes(e.key)) { const live = Storage.load(); if (live && live.id !== doc.id) loadNote(live); refreshNotes(); } });
  window.addEventListener("beforeunload", saveNote);
  applySettingsUI(Storage.settings()); loadNote(doc); refreshNotes(); startJokes();
})();
