(function (global) {
  'use strict';
  const base=new URL('./art/',document.currentScript.src);
  const categories={attack:'category-attack.webp',instinct:'category-instinct.webp',companion:'category-instinct.webp',preparation:'category-preparation.webp',trap:'category-trap.webp',survival:'category-survival.webp',guard:'category-survival.webp',tactic:'category-tactic.webp',precision:'category-tactic.webp',synchronized:'category-synchronized.webp',synchronize:'category-synchronized.webp'};
  const legendary={'shared-pulse':'legendary-shared-pulse.webp','done-here':'legendary-done-here.webp','black-road-myth':'legendary-black-road-myth.webp','forge-black-forge-oath':'legendary-black-forge-oath.webp','forge-mercy-blade':'legendary-mercy-blade.webp','forge-last-door':'legendary-last-door.webp'};
  const url=file=>new URL(file,base).href;
  global.SystemaCardAssets = Object.freeze({ categories,legendary,fallback:url(categories.preparation), resolve(card) { if(card?.artwork?.src)return card.artwork.src;const id=String(card?.id||'');if(String(card?.rarity||'').toLowerCase()==='legendary'&&legendary[id])return url(legendary[id]);const type=String(card?.type||'preparation').toLowerCase();return url(categories[type]||categories.preparation); } });
})(window);
