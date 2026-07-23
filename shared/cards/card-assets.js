(function (global) {
  'use strict';
  global.SystemaCardAssets = Object.freeze({ fallback:'', resolve(card) { return card?.artwork?.src || this.fallback; } });
})(window);
