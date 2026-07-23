(function (global) {
  'use strict';
  const entries = [
    ['bleed','Bleed','Takes damage at the end of each round.','Takes damage equal to the Bleed value at the end of each round.'],
    ['exposed','Exposed','Takes additional damage.','Takes additional damage while Exposed is active.'],
    ['flanked','Flanked','Open to coordinated attacks.','Enables cards and attacks that punish a flanked target.'],
    ['root','Root','Cannot move.','Cannot move while Root is active.'],
    ['terrified','Terrified','Acts less effectively.','Fear disrupts this unit and enables fear-based effects.'],
    ['weakened','Weakened','Deals less damage.','The next affected attack deals reduced damage.'],
    ['dodge','Dodge','Avoids incoming damage.','Prevents the next applicable incoming attack.'],
    ['guard','Guard','Absorbs incoming damage.','Guard is spent before Health when damage is received.'],
    ['instinct','Instinct','A Lady companion action.','Instinct cards command Lady or use the hunters’ bond.'],
    ['trap','Trap','Triggers when enemies move.','A prepared battlefield effect that triggers on enemy movement.'],
    ['moving','Moving','This intent counts as movement.','Movement can trigger traps and movement-based effects.'],
    ['not-acted','Not Acted','Has not acted this round.','Bonuses against enemies that have not acted can apply.'],
    ['exhaust','Exhaust','Removed for this combat.','After use, this card is unavailable for the rest of combat.'],
    ['draw','Draw','Adds cards to your hand.','Move the stated number of cards from the draw pile to your hand.'],
    ['heal','Heal','Restores Health.','Restores the stated amount of Health, up to maximum Health.']
  ];
  const registry = Object.freeze(Object.fromEntries(entries.map(([id,label,short,full]) => [id,{id,label,short,full}])));
  function slug(value='') { return String(value).trim().toLowerCase().replace(/\s+/g,'-'); }
  const aliases={bleeding:'bleed',weaken:'weakened',traps:'trap'};
  global.SystemaCardKeywords = Object.freeze({ all: registry, get(value) { const id=slug(value); return registry[aliases[id]||id] || null; }, slug });
})(window);
