(function () {
  "use strict";

  const RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/u;
  const LTR = /[A-Za-z\u00C0-\u02AF\u0370-\u052F]/u;
  const NUMBER = /\p{N}/u;

  function detectDirection(line) {
    for (const ch of String(line || "")) {
      if (RTL.test(ch)) return "rtl";
      if (LTR.test(ch)) return "ltr";
      if (NUMBER.test(ch)) return "ltr";
    }
    return "ltr";
  }

  window.MahdiDirection = { detectDirection };
})();
