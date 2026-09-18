(function () {
  "use strict";
  function setStatus(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
  function updateCounts(text) { const v = String(text || ""); setStatus("word-count", (v.trim() ? v.trim().split(/\s+/u).length : 0) + " کلمه"); setStatus("char-count", v.length + " کاراکتر"); }
  function showModal(id) { const backdrop = document.getElementById("modal-backdrop"); document.querySelectorAll("#modal-backdrop > .modal").forEach(m => m.classList.add("hidden")); const modal = document.getElementById(id); if (!modal) return; modal.classList.remove("hidden"); backdrop.classList.remove("hidden"); }
  function closeModals() { const backdrop = document.getElementById("modal-backdrop"); if (backdrop) backdrop.classList.add("hidden"); document.querySelectorAll("#modal-backdrop .modal").forEach(m => m.classList.add("hidden")); }
  function togglePreview() { document.body.classList.toggle("preview-off"); }
  function alert(message, type, title) {
    const box = document.getElementById("app-alert"); if (!box) return;
    box.className = "app-alert " + (type || "info");
    box.querySelector(".alert-title").textContent = title || ({ success: "موفق", warning: "توجه", error: "خطا", info: "پیام" }[type] || "پیام");
    box.querySelector(".alert-message").textContent = message;
    box.classList.remove("hidden"); clearTimeout(box._timer);
    box._timer = setTimeout(() => box.classList.add("hidden"), type === "error" ? 5000 : 3200);
  }
  function confirm(message, onYes) { const modal = document.getElementById("confirm-modal"); if (!modal) return; modal.querySelector(".confirm-message").textContent = message; modal._yes = onYes; showModal("confirm-modal"); }
  function runConfirm() { const modal = document.getElementById("confirm-modal"); const cb = modal && modal._yes; modal._yes = null; closeModals(); if (cb) cb(); }
  document.addEventListener("click", e => { if (e.target.closest(".alert-close")) document.getElementById("app-alert").classList.add("hidden"); });
  window.MahdiUI = { setStatus, updateCounts, showModal, closeModals, togglePreview, alert, confirm, runConfirm };
})();
