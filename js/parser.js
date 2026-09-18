(function () {
  "use strict";
  const { detectDirection } = window.MahdiDirection;
  const CODE = /^code(?::([A-Za-z0-9_+.-]+))?\s*$/i;
  const CODE_END = /^codeE\s*$/i;

  function parse(text) {
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    const blocks = [];
    const errors = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }

      const code = line.match(CODE);
      if (code) {
        const startLine = i + 1;
        const language = code[1] || "text";
        i++;
        const body = [];
        while (i < lines.length && !CODE_END.test(lines[i])) { body.push(lines[i++]); }
        if (i >= lines.length) {
          errors.push({ code: "UNCLOSED_CODE_BLOCK", message: "بلوک کد با codeE بسته نشده است", line: startLine });
        } else i++;
        blocks.push({ type: "code", language, text: body.join("\n"), dir: "ltr", startLine, endLine: i });
        continue;
      }

      if (/^#{1,6}\s+/.test(line)) {
        const m = line.match(/^(#{1,6})\s+(.*)$/);
        const level = m[1].length;
        blocks.push({ type: "h" + level, text: m[2].trim(), dir: detectDirection(m[2]), startLine: i + 1 });
        i++; continue;
      }

      if (/^[-*_](?:\s*[-*_]){2,}\s*$/.test(line)) {
        blocks.push({ type: "hr", text: "", dir: "ltr", startLine: i + 1 });
        i++; continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        const items = [];
        const startLine = i + 1;
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*+]\s+/, "")); i++;
        }
        const content = items.join("\n");
        blocks.push({ type: "ul", items, text: content, dir: detectDirection(content), startLine, endLine: i });
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        const items = [];
        const startLine = i + 1;
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+[.)]\s+/, "")); i++;
        }
        const content = items.join("\n");
        blocks.push({ type: "ol", items, text: content, dir: detectDirection(content), startLine, endLine: i });
        continue;
      }

      if (/^>\s?/.test(line)) {
        const startLine = i + 1, items = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { items.push(lines[i].replace(/^>\s?/, "")); i++; }
        const content = items.join("\n");
        blocks.push({ type: "blockquote", text: content, dir: detectDirection(content), startLine, endLine: i });
        continue;
      }

      const startLine = i + 1, body = [line]; i++;
      while (i < lines.length && lines[i].trim() && !CODE.test(lines[i]) &&
             !/^#{1,6}\s+/.test(lines[i]) && !/^[-*_](?:\s*[-*_]){2,}\s*$/.test(lines[i]) &&
             !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !/^>\s?/.test(lines[i])) {
        body.push(lines[i++]);
      }
      const content = body.join("\n");
      blocks.push({ type: "text", text: content, dir: detectDirection(content), startLine, endLine: i });
    }
    return { type: "document", blocks, errors };
  }

  function blocksToSource(blocks) {
    return (blocks || []).map(function (b) {
      if (b.type === "code") return "code:" + (b.language || "text") + "\n" + (b.text || "") + "\ncodeE";
      if (/^h[1-6]$/.test(b.type)) return "#".repeat(Number(b.type.slice(1))) + " " + (b.text || "");
      if (b.type === "ul") return (b.items || []).map(x => "- " + x).join("\n");
      if (b.type === "ol") return (b.items || []).map((x, i) => (i + 1) + ". " + x).join("\n");
      if (b.type === "blockquote") return String(b.text || "").split("\n").map(x => "> " + x).join("\n");
      if (b.type === "hr") return "---";
      return b.text || "";
    }).join("\n\n");
  }

  window.MahdiParser = { parse, blocksToSource };
})();

function parseProjectBlocks(text) {
  return String(text || "").split(/\r?\n/).map(function(line) {
    var m = line.match(/^\s*h([1-6])\s+([\s\S]*?)\s+h\1E\s*$/i);
    if (m) return {type:"heading", level:Number(m[1]), text:m[2]};
    if (/^\s*dash(?:\s+|$)/i.test(line)) return {type:"dash", text:line.replace(/^\s*dash(?:\s+)?/i,"")};
    var lm = line.match(/^\s*link\s+([\s\S]*?)\s+linkE\s*$/i);
    if (lm) return {type:"link", text:lm[1].trim()};
    return {type:"text", text:line};
  });
}
