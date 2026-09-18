(function () {
  "use strict";
  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[ch]));
  }
  function inline(text) {
    let s = escapeHTML(text);
    s = s.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/_([^_]+)_/g, "<em>$1</em>");
    return s;
  }
  function render(ast) {
    return ast.blocks.map(function (b) {
      const dir = b.dir === "rtl" ? "rtl" : "ltr";
      if (/^h[1-6]$/.test(b.type)) return `<${b.type} class="heading" dir="${dir}">${inline(b.text)}</${b.type}>`;
      if (b.type === "text") return `<p class="paragraph" dir="${dir}">${inline(b.text).replace(/\n/g, "<br>")}</p>`;
      if (b.type === "ul" || b.type === "ol") {
        const tag = b.type === "ul" ? "ul" : "ol";
        return `<${tag} class="md-list" dir="${dir}">` + (b.items || []).map(x => `<li>${inline(x)}</li>`).join("") + `</${tag}>`;
      }
      if (b.type === "blockquote") return `<blockquote class="md-quote" dir="${dir}">${inline(b.text).replace(/\n/g,"<br>")}</blockquote>`;
      if (b.type === "hr") return '<hr class="md-hr">';
      if (b.type === "code") return `<pre class="code-wrap"><code class="lang-${escapeHTML(b.language || "text")}" dir="ltr">${escapeHTML(b.text || "")}</code></pre>`;
      return `<p class="paragraph" dir="${dir}">${inline(b.text || "")}</p>`;
    }).join("\n");
  }
  window.MahdiRenderer = { render, escapeHTML };
})();

function renderProjectMarkdown(text) {
  var frag = document.createDocumentFragment();
  var blocks = parseProjectBlocks(text);
  blocks.forEach(function(block) {
    var el;
    if (block.type === "heading") {
      el = document.createElement("h" + block.level);
      el.textContent = block.text;
    } else if (block.type === "dash") {
      el = document.createElement("div");
      el.className = "project-dash";
      el.textContent = "• " + block.text;
    } else if (block.type === "link") {
      el = document.createElement("a");
      el.textContent = block.text;
      var href = block.text;
      if (!/^(?:https?:\/\/|mailto:)/i.test(href)) href = "https://" + href;
      el.href = href;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    } else {
      el = document.createElement("div");
      el.textContent = block.text;
    }
    frag.appendChild(el);
  });
  return frag;
}
