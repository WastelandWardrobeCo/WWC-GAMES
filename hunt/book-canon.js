(function () {
  'use strict';

  const replacements = [
    [/Black Veil Camp/g, 'White Tree'],
    [/BLACK VEIL CAMP/g, 'WHITE TREE'],
    [/Black Veil/g, 'White Tree'],
    [/BLACK VEIL/g, 'WHITE TREE']
  ];

  function replaceText(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      let value = node.nodeValue;
      replacements.forEach(([pattern, replacement]) => { value = value.replace(pattern, replacement); });
      if (value !== node.nodeValue) node.nodeValue = value;
    });

    root.querySelectorAll?.('[aria-label], [title]').forEach(element => {
      ['aria-label', 'title'].forEach(attribute => {
        if (!element.hasAttribute(attribute)) return;
        let value = element.getAttribute(attribute);
        replacements.forEach(([pattern, replacement]) => { value = value.replace(pattern, replacement); });
        element.setAttribute(attribute, value);
      });
    });
  }

  function start() {
    replaceText(document.body);
    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          let value = node.nodeValue;
          replacements.forEach(([pattern, replacement]) => { value = value.replace(pattern, replacement); });
          if (value !== node.nodeValue) node.nodeValue = value;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          replaceText(node);
        }
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
