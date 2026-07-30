const strategies = {
  'attack-heavy': ['spear', 'aimed', 'hamstring', 'spear', 'sync'],
  instinct: ['scent', 'pack', 'growl', 'spear', 'sync'],
  preparation: ['silent', 'poison', 'aimed', 'spear', 'sync'],
  trap: ['funnel', 'snare', 'hamstring', 'spear', 'sync'],
  mixed: ['step', 'scent', 'aimed', 'pack', 'sync']
};

const cards = {
  spear: { type: 'attack', damage: 5, cost: 1, exploit: 'exposed', bonus: 3 },
  aimed: { type: 'attack', damage: 9, cost: 1, applies: 'exposed' },
  hamstring: { type: 'attack', damage: 4, cost: 2, applies: 'bleed', draw: 1 },
  scent: { type: 'instinct', damage: 0, cost: 1, ladyBonus: 3 },
  growl: { type: 'instinct', damage: 0, cost: 1, applies: 'weakened', draw: 1 },
  pack: { type: 'instinct', damage: 5, cost: 1, applies: 'flanked', discount: 1 },
  step: { type: 'survival', damage: 0, cost: 0, attackBonus: 2, draw: 1, prevent: 6 },
  silent: { type: 'preparation', damage: 0, cost: 1, attackBonus: 4, draw: 1 },
  poison: { type: 'preparation', damage: 0, cost: 1, poison: 2 },
  funnel: { type: 'tactic', damage: 0, cost: 1, applies: 'exposed', draw: 1 },
  snare: { type: 'tactic', damage: 7, cost: 1, applies: 'weakened', prevent: 3 },
  sync: { type: 'synchronized', damage: 10, cost: 2, coordinatedBonus: 6 }
};

function run(ids, modern) {
  let enemy = 62;
  let incoming = 0;
  let rounds = 0;
  let cursor = 0;
  let plays = { attack: 0, nonAttack: 0 };
  while (enemy > 0 && rounds < 8) {
    rounds += 1;
    let actions = 3;
    let status = new Set();
    let bonus = 0;
    let ladyBonus = 0;
    let prevention = 0;
    let lady = false;
    let delilah = false;
    let safety = 0;
    while (actions >= 0 && safety++ < 8) {
      const id = ids[cursor++ % ids.length];
      const card = cards[id];
      if (card.cost > actions) continue;
      if (!modern && card.type !== 'attack' && card.type !== 'synchronized') continue;
      actions -= card.cost;
      plays[card.type === 'attack' ? 'attack' : 'nonAttack'] += 1;
      if (['instinct'].includes(card.type)) lady = true;
      if (['attack', 'tactic', 'preparation', 'survival'].includes(card.type)) delilah = true;
      let damage = card.damage || 0;
      if (card.type === 'instinct' && damage) {
        damage += ladyBonus;
        ladyBonus = 0;
      }
      if (card.exploit && status.has(card.exploit)) damage += card.bonus;
      if (card.type === 'attack') {
        damage += bonus;
        bonus = 0;
      }
      if (card.coordinatedBonus && lady && delilah) damage += card.coordinatedBonus;
      enemy -= damage;
      if (card.applies) status.add(card.applies);
      bonus += card.attackBonus || 0;
      ladyBonus += card.ladyBonus || 0;
      prevention += card.prevent || 0;
      if (actions === 0) break;
    }
    if (enemy > 0) incoming += Math.max(0, 7 - prevention);
  }
  const total = plays.attack + plays.nonAttack;
  return {
    rounds,
    attackPlayPercent: Math.round(100 * plays.attack / total),
    nonAttackPlayPercent: Math.round(100 * plays.nonAttack / total),
    incomingDamage: incoming,
    won: enemy <= 0
  };
}

const rows = Object.entries(strategies).map(([strategy, deck]) => ({
  strategy,
  before: run(deck, false),
  after: run(deck, true)
}));

console.table(rows.map(row => ({
  strategy: row.strategy,
  'before attack%': row.before.attackPlayPercent,
  'after attack%': row.after.attackPlayPercent,
  'after non-attack%': row.after.nonAttackPlayPercent,
  'before rounds': row.before.rounds,
  'after rounds': row.after.rounds,
  'damage taken': row.after.incomingDamage,
  won: row.after.won
})));

const ranked = [...rows].sort((a, b) =>
  (a.after.rounds * 5 + a.after.incomingDamage) - (b.after.rounds * 5 + b.after.incomingDamage));
const average = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
console.log({
  strongestStrategy: ranked[0].strategy,
  weakestStrategy: ranked[ranked.length - 1].strategy,
  previouslyIgnored: 'non-Attack setup cards',
  comboSuccessRate: `${Math.round(100 * rows.filter(row => row.after.won).length / rows.length)}%`,
  averageBattleLengthBefore: average(rows.map(row => row.before.rounds)),
  averageBattleLengthAfter: average(rows.map(row => row.after.rounds)),
  averageAttackPlayBefore: `${average(rows.map(row => row.before.attackPlayPercent))}%`,
  averageAttackPlayAfter: `${average(rows.map(row => row.after.attackPlayPercent))}%`,
  infiniteLoopCheck: 'bounded by 3 Actions and an 8-play turn safety cap'
});

if (rows.some(row => !row.after.won || row.after.rounds > 6)) process.exitCode = 1;
