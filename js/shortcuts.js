(function () {
  "use strict";

  const bindings = new Map();

  function normalize(e) {
    const parts = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    parts.push(e.key.toUpperCase());
    return parts.join("+");
  }

  function register(key, action) { bindings.set(key, action); }

  window.addEventListener("keydown", function (e) {
    const action = bindings.get(normalize(e));
    if (!action) return;
    e.preventDefault();
    action(e);
  });

  window.MahdiShortcuts = { register };
})();
