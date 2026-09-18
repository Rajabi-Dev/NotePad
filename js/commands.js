(function () {
  "use strict";

  const { getSelection } = window.MahdiSelection;

  function wrap(textarea, before, after, placeholder) {
    after = after === undefined ? before : after;
    placeholder = placeholder || "متن";
    const s = getSelection(textarea);

    if (s.text) {
      textarea.setRangeText(before + s.text + after, s.start, s.end, "select");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.focus();
      return;
    }

    const value = before + placeholder + after;
    textarea.setRangeText(value, s.start, s.end, "end");
    textarea.setSelectionRange(
      s.start + before.length,
      s.start + before.length + placeholder.length
    );
    textarea.focus();
  }

  function toggleBold(t) { wrap(t, "**", "**", "متن پررنگ"); }
  function toggleItalic(t) { wrap(t, "*", "*", "متن مورب"); }
  function inlineCode(t) { wrap(t, "`", "`", "code"); }

  function insertBlock(t, language) {
    const s = getSelection(t);
    const body = s.text || "کد";
    const replacement = "code:" + (language || "text") + "\n" + body + "\ncodeE";
    t.setRangeText(replacement, s.start, s.end, "select");
    t.dispatchEvent(new Event("input", { bubbles: true }));
    t.focus();
  }

  window.MahdiCommands = {
    toggleBold, toggleItalic, inlineCode, insertBlock
  };
})();
