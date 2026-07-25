(function (global) {
  'use strict';

  // Measured from the approved Card Studio rendering of "C'mon, Lady... We're Done Here"
  // at a 1280 x 720 viewport on 2026-07-24. Values are the canonical premium-v1 geometry.
  const layout = {
    template: 'premium-v1',
    measuredViewport: { width: 1280, height: 720 },
    reference: { width: 218, height: 327, aspectRatio: '2 / 3' },
    border: { width: 2, radius: 13 },
    padding: { outer: 0 },
    header: { height: 91.21875, ratio: 0.278956, padding: [9, 10, 7, 10], gap: 8 },
    cost: { width: 45, height: 51, fontSize: 24.32, border: 2 },
    title: { width: 136, fontSize: 16.576, lineHeight: 16.9075 },
    type: { fontSize: 9.92, letterSpacing: 1.1904 },
    artwork: { height: 88, ratio: 0.269113, objectFit: 'cover', focalX: 50, focalY: 50, zoom: 1 },
    rules: { height: 116.78125, ratio: 0.357129, padding: [11, 12, 9, 12], gap: 6 },
    rulesText: { fontSize: 11.904, lineHeight: 14.2848 },
    keywords: { height: 44, gap: 4 },
    footer: { height: 27, ratio: 0.082569, padding: [6, 10], fontSize: 9.6 },
    modes: {
      combat: { width: 'var(--combat-card-width, 232px)' },
      collection: { width: 'var(--collection-card-width, 240px)' },
      preview: { width: 'var(--preview-card-width, 240px)' },
      expanded: { width: 'min(var(--expanded-card-width, 360px), 100%)' }
    }
  };

  global.SystemaCardLayout = Object.freeze(layout);
})(window);
