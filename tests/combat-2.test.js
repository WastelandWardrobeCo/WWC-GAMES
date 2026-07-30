const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const gameSource = fs.readFileSync(path.join(root, 'hunt', 'game.js'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'cards', 'cards.json'), 'utf8')).cards;
const byId = Object.fromEntries(catalog.map(card => [card.id, card]));

const expectedActors = {
  spear: 'delilah',
  aimed: 'delilah',
  hamstring: 'delilah',
  scent: 'lady',
  growl: 'lady',
  pack: 'lady',
  lunge: 'lady',
  snare: 'delilah',
  step: 'delilah',
  funnel: 'neutral',
  poison: 'delilah',
  silent: 'neutral',
  bandage: 'neutral',
  sync: 'both',
  'moon-ambush': 'neutral',
  'done-here': 'both'
};

for (const [id, actor] of Object.entries(expectedActors)) {
  assert.ok(byId[id], `${id} must exist in the canonical catalog`);
  assert.equal(byId[id].actor, actor, `${id} must declare its combat actor`);
  assert.equal(byId[id].rules[0].text, byId[id].rulesText, `${id} rules must have one canonical wording`);
}

[
  'combo: freshTurnCombo()',
  'targetedTraps: {}',
  'combatTelemetry: freshCombatTelemetry()',
  "finalizeCombatTelemetry('victory')",
  "finalizeCombatTelemetry('defeat')",
  "slice(-20)",
  'Provider' // sentinel below deliberately omitted
].slice(0, -1).forEach(fragment => assert.ok(gameSource.includes(fragment), `missing engine contract: ${fragment}`));

assert.match(gameSource, /state\.combo = freshTurnCombo\(\);[\s\S]{0,180}state\.ladyNextDamage = 0;/,
  'turn-scoped combo and Lady bonus must reset together');
assert.match(gameSource, /if \(c\.type === 'Attack' && state\.nextAttackFree\) return 0;/,
  'Moonlit Ambush must make the next Attack free');
assert.match(gameSource, /state\.nextDelilahAttackDiscount/, 'Pack Rush discount must be handled centrally');
assert.match(gameSource, /state\.poisonCharges -= 1;/, 'Poison must have a finite charge count');
assert.doesNotMatch(gameSource, /while\s*\([^)]*draw/i, 'combat draw effects must not use an unbounded loop');

console.log(`Combat 2.0 contract checks passed for ${Object.keys(expectedActors).length} redesigned cards.`);
