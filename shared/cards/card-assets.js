(function (global) {
  'use strict';
  const base = new URL('./art/', document.currentScript.src);
  const categories = Object.freeze({
    attack: 'category-attack.webp',
    instinct: 'category-instinct.webp',
    companion: 'category-instinct.webp',
    preparation: 'category-preparation.webp',
    legend: 'category-preparation.webp',
    trap: 'category-trap.webp',
    survival: 'category-survival.webp',
    guard: 'category-survival.webp',
    tactic: 'category-tactic.webp',
    precision: 'category-tactic.webp',

    // Lady is a four-legged Dire Wolf. The generated Synchronize image is
    // intentionally not selected because it depicts a humanoid wolf form.
    synchronized: 'category-attack.webp',
    synchronize: 'category-attack.webp'
  });
  const legendary = Object.freeze({
    'shared-pulse': 'legendary-shared-pulse.webp',
    'done-here': 'legendary-done-here.webp',
    'forge-black-forge-oath': 'legendary-black-forge-oath.webp',
    'forge-mercy-blade': 'legendary-mercy-blade.webp'
  });
  const url = file => new URL(file, base).href;

  function resolve(card) {
    if (card?.artwork?.src) return card.artwork.src;

    const id = String(card?.id || '');
    if (String(card?.rarity || '').toLowerCase() === 'legendary' && legendary[id]) {
      return url(legendary[id]);
    }

    const type = String(card?.type || 'preparation').toLowerCase();
    return url(categories[type] || categories.preparation);
  }

  global.SystemaCardAssets = Object.freeze({
    categories,
    legendary,
    fallback: url(categories.preparation),
    resolve
  });
})(window);
