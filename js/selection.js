(function () {
  "use strict";

  function getSelection(textarea) {
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
    };
  }

  function replaceSelection(textarea, replacement, mode) {
    const s = getSelection(textarea);
    textarea.setRangeText(replacement, s.start, s.end, mode || "end");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  window.MahdiSelection = { getSelection, replaceSelection };
})();
