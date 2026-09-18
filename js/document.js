(function () {
  "use strict";

  function createDocument(data) {
    data = data || {};
    const now = new Date().toISOString();
    return {
      id: data.id || "note-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      title: typeof data.title === "string" ? data.title : "یادداشت جدید",
      tags: Array.isArray(data.tags) ? data.tags : [],
      created: data.created || now,
      modified: data.modified || now,
      blocks: Array.isArray(data.blocks) ? data.blocks : []
    };
  }

  function documentFromSource(source, base) {
    const doc = createDocument(base);
    doc.blocks = source.blocks || [];
    return doc;
  }

  window.MahdiDocument = { createDocument, documentFromSource };
})();
