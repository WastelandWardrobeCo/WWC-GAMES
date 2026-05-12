const $ = id => document.getElementById(id);
const MAX_TURNS = 6;
const MAX_ENEMIES = 3;
const MAX_REINFORCEMENTS = 1;
const LEGACY_SAVE_KEY = 'ladyDelilahHuntSave.v1';
const PROFILE_INDEX_KEY = 'ladyDelilahProfiles.v1';
const ACTIVE_PROFILE_KEY = 'ladyDelilahActiveProfile.v1';
const PROFILE_SAVE_PREFIX = 'ladyDelilahSave_';
const LEGACY_MIGRATED_KEY = 'ladyDelilahLegacyMigrated.v1';

const contracts = [
  { id: 'black-veil', name: 'Black Veil Camp', type: 'Cult Activity', color: 'red', threat: 1, objective: 'Break the cult patrol', env: ['Night Hunt', 'Light Rain', 'Poison Traps'], desc: 'Travelers speak of chanting in the night and offerings made to something unseen. Put an end to their rites.', poster: 'assets/black-veil-background.png' },
  { id: 'frozen', name: 'Frozen Crossing', type: 'Beast Sighting', color: 'blue', threat: 2, objective: 'Drive off the winter pack', env: ['Snow', 'Poor Sight'], desc: 'Something huge circles the crossing. The tracks stop where the screams begin.', poster: 'assets/encounter-reference.png' },
  { id: 'bone', name: 'Bone Pit Tunnels', type: 'Scavenger Stronghold', color: 'orange', threat: 3, objective: 'Clear the bone raiders', env: ['Tunnels', 'Ambush'], desc: 'A raider shrine beneath the road, full of scrap, bones, and bad decisions.', poster: 'assets/card-reference.png' },
  { id: 'hollow', name: 'Whispering Hollow', type: 'Hollowed Presence', color: 'violet', threat: 4, objective: 'Silence the hollowed dead', env: ['Fog', 'Fear'], desc: 'The trees repeat words they should not know. Lady will not look away.', poster: 'assets/encounter-reference.png' },
  { id: 'sawmill', name: 'The Old Sawmill', type: 'Ritual Site', color: 'green', threat: 5, objective: 'Survive the old mill', env: ['Rot', 'Ritual'], desc: 'A silent mill, fresh ash, and a blade still warm from use.', poster: 'assets/hunt-board-reference.png' }
];

const cards = [
  { id: 'spear', name: 'Spear Thrust', type: 'Attack', cost: 1, rarity: 'Roadworn', text: 'Deal 5 damage. Apply Exposed.', effect: g => attack(g, 5, { exposed: 2 }) },
  { id: 'aimed', name: 'Aimed Shot', type: 'Attack', cost: 1, rarity: 'Roadworn', text: 'Deal 6 damage. +2 if target has not acted.', effect: g => attack(g, 6 + (g.target.acted ? 0 : 2)) },
  { id: 'hamstring', name: 'Hamstring Cut', type: 'Attack', cost: 2, rarity: 'Sharp', text: 'Deal 4 damage. Apply Bleed 2 and Root.', effect: g => attack(g, 4, { bleed: 2, root: 1 }) },
  { id: 'throat', name: 'Through the Throat', type: 'Attack', cost: 2, rarity: 'Blackmark', text: 'Deal 10. If target is Terrified, gain 1 Action.', effect: g => { attack(g, 10); if (g.target.status.terrified) gainActions(1, 'terror opening'); } },
  { id: 'scent', name: 'Scent Trail', type: 'Instinct', cost: 1, rarity: 'Roadworn', text: 'Reveal intent. Increase Lady instinct.', effect: () => { state.ladyInstinct += 2; state.intentClear = true; log('Lady reads the camp. Enemy intent is clear.'); } },
  { id: 'growl', name: 'Warning Growl', type: 'Instinct', cost: 1, rarity: 'Roadworn', text: 'Terrify target. Reduce its next damage by 3.', effect: g => { addStatus(g.target, 'terrified', 2); addStatus(g.target, 'weakened', 1); log(`${g.target.name} falters under Lady's growl.`); } },
  { id: 'pack', name: 'Pack Rush', type: 'Instinct', cost: 2, rarity: 'Sharp', text: 'Lady deals 5 damage. Apply Flanked.', effect: g => attack(g, 5 + state.ladyInstinct, { flanked: 2 }, 'Lady') },
  { id: 'lunge', name: 'Protective Lunge', type: 'Survival', cost: 1, rarity: 'Sharp', text: 'Prevent next attack against Delilah.', effect: () => { state.guard += 1; state.ladyInstinct += 1; log('Lady interposes herself. Next hit is guarded.'); } },
  { id: 'snare', name: 'Set Snare', type: 'Tactic', cost: 2, rarity: 'Roadworn', text: 'Place a trap. Moving enemies take 7 and Root.', effect: () => { state.traps += relic('Rusted Trap Kit') && !state.freeTrapUsed ? 2 : 1; state.freeTrapUsed = true; log('Delilah sets wire low in the mud.'); } },
  { id: 'step', name: 'Evasive Step', type: 'Survival', cost: 0, rarity: 'Roadworn', text: 'Gain Dodge. Draw 1.', effect: () => { state.dodge += 1; draw(1); log('Delilah changes the angle.'); } },
  { id: 'funnel', name: 'Funnel Path', type: 'Tactic', cost: 1, rarity: 'Sharp', text: 'Moving enemies become Exposed.', effect: () => { state.funnel = true; log('The only clean path is the one Delilah chose.'); } },
  { id: 'poison', name: 'Poison Coating', type: 'Preparation', cost: 1, rarity: 'Sharp', text: 'Next attack applies Bleed 4.', effect: () => { state.nextBleed += 4; log('The spear darkens with poison.'); } },
  { id: 'silent', name: 'Silent Advance', type: 'Preparation', cost: 1, rarity: 'Blackmark', text: 'First attack next turn deals +4.', effect: () => { state.nextTurnBonus += 4; log('Delilah and Lady disappear into the rain.'); } },
  { id: 'bandage', name: 'Bandage', type: 'Survival', cost: 1, rarity: 'Roadworn', text: 'Recover 6 Health. Remove Bleed.', effect: () => { heal('delilah', 6); state.bleed = 0; log('Bandages, teeth, breath. Still alive.'); } },
  { id: 'sync', name: 'Synchronized Kill', type: 'Synchronized', cost: 2, rarity: 'Rare', text: 'Deal 10. Execute below 25% if Bleeding or Flanked.', effect: g => { attack(g, 10 + (relic('Wolf Fang Charm') ? 2 : 0), {}, 'Delilah and Lady'); if ((g.target.status.bleed || g.target.status.flanked) && g.target.hp <= g.target.max * .25) { g.target.hp = 0; log('Synchronized execution. The hunt is already over.'); } } },
  { id: 'bloodmark', name: 'Blood Mark', type: 'Tactic', cost: 1, rarity: 'Sharp', text: 'Apply Exposed 3. Draw 1.', effect: g => { addStatus(g.target, 'exposed', 3); draw(1); log(`${g.target.name} is marked in blood.`); } },
  { id: 'wolf-feint', name: 'Wolf Feint', type: 'Instinct', cost: 1, rarity: 'Roadworn', text: 'Apply Flanked. Gain 1 Dodge.', effect: g => { addStatus(g.target, 'flanked', 2); state.dodge += 1; log('Lady pulls the enemy off balance.'); } },
  { id: 'rain-bolts', name: 'Rain of Bolts', type: 'Attack', cost: 2, rarity: 'Sharp', text: 'Deal 3 damage to all enemies.', effect: () => { state.enemies.filter(e => e.hp > 0).forEach(e => e.hp = Math.max(0, e.hp - 3)); log('Bolts rake the whole line for 3.'); } },
  { id: 'tripwire', name: 'Tripwire', type: 'Tactic', cost: 1, rarity: 'Roadworn', text: 'Place a light trap. Draw 1.', effect: () => { state.traps += 1; draw(1); log('A light trap waits under wet leaves.'); } },
  { id: 'last-breath', name: 'Last Breath', type: 'Survival', cost: 0, rarity: 'Blackmark', text: 'If Delilah is below half HP, recover 5.', effect: () => { if (state.delilah.hp < state.delilah.max / 2) heal('delilah', 5); log('Delilah forces one more breath.'); } },
  { id: 'obelisk', name: 'Obelisk Breaker', type: 'Attack', cost: 3, rarity: 'Rare', text: 'Deal 14 damage. +4 against Ritual enemies.', effect: g => attack(g, 14 + (g.target.key === 'acolyte' || g.target.key === 'leader' ? 4 : 0)) },
  { id: 'moon-ambush', name: 'Moonlit Ambush', type: 'Preparation', cost: 1, rarity: 'Rare', text: 'Next attack deals +6 and applies Terrified.', effect: () => { state.nextTurnBonus += 6; state.nextTerror += 1; log('The moon gives Delilah one clean angle.'); } },
  { id: 'shared-pulse', name: 'Shared Pulse', type: 'Synchronized', cost: 2, rarity: 'Legendary', text: 'Deal 7 damage. Heal Lady and Delilah 3.', effect: g => { attack(g, 7 + (relic('Wolf Fang Charm') ? 2 : 0), {}, 'Shared Pulse'); heal('delilah', 3); heal('lady', 3); } }
];

cards.push(
  { id: 'low-guard', name: 'Low Guard', type: 'Survival', cost: 1, rarity: 'Common', text: 'Gain 1 Guard. Draw 1.', effect: () => { state.guard += 1; draw(1); log('Lady lowers her shoulder and holds the line.'); } },
  { id: 'clean-cut', name: 'Clean Cut', type: 'Attack', cost: 1, rarity: 'Common', text: 'Deal 4 damage. +3 if target is Exposed.', effect: g => attack(g, 4 + (g.target.status.exposed ? 3 : 0)) },
  { id: 'mud-step', name: 'Mud Step', type: 'Tactic', cost: 0, rarity: 'Common', text: 'Apply Root 1. Lose 1 Action next turn.', effect: g => { addStatus(g.target, 'root', 1); state.nextActionPenalty = (state.nextActionPenalty || 0) + 1; log(`${g.target.name} slips into the killing mud.`); } },
  { id: 'field-dressing', name: 'Field Dressing', type: 'Survival', cost: 1, rarity: 'Common', text: 'Heal Delilah 4. Heal Lady 2.', effect: () => { heal('delilah', 4); heal('lady', 2); log('A fast field dressing keeps both hunters moving.'); } },
  { id: 'wolf-glance', name: 'Wolf Glance', type: 'Instinct', cost: 0, rarity: 'Common', text: 'Reveal intent this turn. Gain 1 Lady instinct.', effect: () => { state.intentClear = true; state.ladyInstinct += 1; log('Lady sees the twitch before the strike.'); } },
  { id: 'rusted-hook', name: 'Rusted Hook', type: 'Attack', cost: 1, rarity: 'Common', text: 'Deal 3 damage. Apply Bleed 1.', effect: g => attack(g, 3, { bleed: 1 }) },
  { id: 'ash-breath', name: 'Ash Breath', type: 'Preparation', cost: 1, rarity: 'Common', text: 'Next attack applies Terrified.', effect: () => { state.nextTerror += 2; log('The air goes cold before the next hit.'); } },
  { id: 'quick-cache', name: 'Quick Cache', type: 'Tactic', cost: 0, rarity: 'Common', text: 'Draw 1. Gain 1 Scrap.', effect: () => { draw(1); state.scrap += 1; log('Delilah pockets a useful scrap of trouble.'); } },
  { id: 'red-thread', name: 'Red Thread', type: 'Tactic', cost: 1, rarity: 'Uncommon', text: 'Apply Exposed 2 and Flanked 1.', effect: g => { addStatus(g.target, 'exposed', 2); addStatus(g.target, 'flanked', 1); log(`${g.target.name} is caught on the red thread.`); } },
  { id: 'spear-wall', name: 'Spear Wall', type: 'Survival', cost: 2, rarity: 'Uncommon', text: 'Gain 2 Guard. Deal 3 to attackers next turn.', effect: () => { state.guard += 2; state.retaliate = (state.retaliate || 0) + 3; log('Delilah sets the spear like a wall.'); } },
  { id: 'black-rain', name: 'Black Rain', type: 'Attack', cost: 2, rarity: 'Uncommon', text: 'Deal 2 damage to all enemies. Apply Bleed 1.', effect: () => { state.enemies.filter(e => e.hp > 0).forEach(e => { e.hp = Math.max(0, e.hp - 2); addStatus(e, 'bleed', 1); }); log('Black rain opens every line.'); } },
  { id: 'pack-angle', name: 'Pack Angle', type: 'Synchronized', cost: 1, rarity: 'Uncommon', text: 'Deal 4 damage. If Flanked, draw 1.', effect: g => { attack(g, 4 + (relic('Wolf Fang Charm') ? 2 : 0), {}, 'Pack Angle'); if (g.target.status.flanked) draw(1); } },
  { id: 'trapline-map', name: 'Trapline Map', type: 'Preparation', cost: 1, rarity: 'Uncommon', text: 'Place 2 light traps.', effect: () => { state.traps += 2; log('The map becomes a trapline.'); } },
  { id: 'bite-command', name: 'Bite Command', type: 'Instinct', cost: 2, rarity: 'Uncommon', text: 'Lady deals 7 damage. Apply Terrified.', effect: g => attack(g, 7 + state.ladyInstinct, { terrified: 2 }, 'Lady') },
  { id: 'hard-pivot', name: 'Hard Pivot', type: 'Tactic', cost: 0, rarity: 'Uncommon', text: 'Gain Dodge. Next attack deals +2.', effect: () => { state.dodge += 1; state.nextTurnBonus += 2; log('Delilah pivots hard into the opening.'); } },
  { id: 'blood-price', name: 'Blood Price', type: 'Attack', cost: 0, rarity: 'Rare', text: 'Take 3 damage. Deal 9 damage.', effect: g => { state.delilah.hp = Math.max(1, state.delilah.hp - 3); attack(g, 9); } },
  { id: 'fear-break', name: 'Fear Break', type: 'Instinct', cost: 2, rarity: 'Rare', text: 'Terrify all enemies. Draw 1.', effect: () => { state.enemies.filter(e => e.hp > 0).forEach(e => addStatus(e, 'terrified', 2)); draw(1); log('The whole camp remembers it can die.'); } },
  { id: 'five-count', name: 'Five Count', type: 'Preparation', cost: 1, rarity: 'Rare', text: 'If you spend all 3 Actions this turn, heal 5 at end turn.', effect: () => { state.fiveCount = true; log('Delilah starts counting to five.'); } },
  { id: 'shatter-rite', name: 'Shatter Rite', type: 'Attack', cost: 3, rarity: 'Rare', text: 'Deal 8 to all enemies. +4 to Ritual enemies.', effect: () => { state.enemies.filter(e => e.hp > 0).forEach(e => e.hp = Math.max(0, e.hp - 8 - (['acolyte','leader'].includes(e.key) ? 4 : 0))); log('The rite shatters across the camp.'); } },
  { id: 'bone-whistle', name: 'Bone Whistle', type: 'Instinct', cost: 1, rarity: 'Rare', text: 'Lady instinct +3. Reveal intent. Draw 1.', effect: () => { state.ladyInstinct += 3; state.intentClear = true; draw(1); log('The bone whistle calls Lady forward.'); } },
  { id: 'kill-lane', name: 'Kill Lane', type: 'Tactic', cost: 2, rarity: 'Rare', text: 'Place 1 trap. All moving enemies become Exposed 3.', effect: () => { state.traps += 1; state.funnel = true; state.killLane = true; log('There is only one lane left, and it belongs to Delilah.'); } },
  { id: 'no-mercy-left', name: 'No Mercy Left', type: 'Attack', cost: 2, rarity: 'Epic', text: 'Deal 12 damage. If this kills, gain 1 Action.', effect: g => { attack(g, 12); if (g.target.hp <= 0) gainActions(1, 'No Mercy Left'); } },
  { id: 'moon-hunt', name: 'Moon Hunt', type: 'Synchronized', cost: 3, rarity: 'Epic', text: 'Deal 8 to all enemies. Heal Lady 5.', effect: () => { state.enemies.filter(e => e.hp > 0).forEach(e => e.hp = Math.max(0, e.hp - 8 - (relic('Wolf Fang Charm') ? 2 : 0))); heal('lady', 5); log('Delilah and Lady move under one moon.'); } },
  { id: 'red-door', name: 'Red Door', type: 'Preparation', cost: 2, rarity: 'Epic', text: 'Next two attacks deal +5.', effect: () => { state.nextAttackCharges = (state.nextAttackCharges || 0) + 2; state.nextAttackChargeBonus = 5; log('The red door opens. Two attacks get teeth.'); } },
  { id: 'wolf-saint', name: 'Wolf Saint', type: 'Instinct', cost: 2, rarity: 'Epic', text: 'Prevent all damage this enemy turn. Draw 1.', effect: () => { state.guardAll = true; draw(1); log('Lady becomes a wall no ritual can cross.'); } },
  { id: 'grave-silence', name: 'Grave Silence', type: 'Tactic', cost: 2, rarity: 'Epic', text: 'Cancel all Reinforcements. Terrify all enemies.', effect: () => { state.silenceReinforcements = true; state.enemies.filter(e => e.hp > 0).forEach(e => addStatus(e, 'terrified', 2)); log('The camp tries to call out. Nothing answers.'); } },
  { id: 'done-here', name: "C'mon, Lady... We're Done Here", type: 'Synchronized', cost: 3, rarity: 'Legendary', text: 'Deal 18 damage. Execute if Bleeding, Flanked, or Terrified below 40%.', effect: g => { attack(g, 18 + (relic('Wolf Fang Charm') ? 2 : 0), {}, 'Delilah and Lady'); if ((g.target.status.bleed || g.target.status.flanked || g.target.status.terrified) && g.target.hp <= g.target.max * .4) { g.target.hp = 0; log("Nothing survives when they're already leaving."); } } },
  { id: 'black-road-myth', name: 'Black Road Myth', type: 'Legend', cost: 2, rarity: 'Legendary', text: 'Draw 3. This turn, Synchronized cards cost 1 less.', effect: () => { draw(3); state.syncDiscount = true; log('The Black Road remembers their names.'); } }
);

const starterDeck = ['spear','spear','aimed','aimed','hamstring','hamstring','scent','growl','pack','lunge','snare','snare','step','step','funnel','poison','silent','bandage','bandage','sync'];

const relics = [
  { name: 'Wolf Fang Charm', text: 'Synchronized cards deal +2 damage.' },
  { name: 'Blood Lantern', text: 'Bleeding enemies reveal next intent.' },
  { name: 'Rusted Trap Kit', text: 'First trap each combat places an extra snare.' },
  { name: 'Hunter’s Compass', text: 'Reward caches show an extra card option.' },
  { name: 'Ritual Bone', text: 'Enemies start Terrified. Delilah starts Exposed.' }
];

const encounters = [
  [{ key: 'cultist' }, { key: 'trapper' }],
  [{ key: 'cultist' }, { key: 'cultist' }],
  [{ key: 'acolyte' }, { key: 'trapper' }],
  [{ key: 'leader', elite: true }]
];

const encounterSets = {
  'black-veil': encounters,
  frozen: [
    [{ key: 'frost-wolf' }, { key: 'ice-stalker' }],
    [{ key: 'frost-wolf' }, { key: 'frost-wolf' }],
    [{ key: 'white-maw' }, { key: 'ice-stalker' }],
    [{ key: 'winter-alpha', elite: true }]
  ],
  bone: [
    [{ key: 'bone-picker' }, { key: 'scrap-thrower' }],
    [{ key: 'bone-picker' }, { key: 'pit-brute' }],
    [{ key: 'scrap-thrower' }, { key: 'pit-brute' }],
    [{ key: 'bone-king', elite: true }]
  ],
  hollow: [
    [{ key: 'hollow-wisp' }, { key: 'veil-touched' }],
    [{ key: 'hollow-wisp' }, { key: 'fear-eater' }],
    [{ key: 'veil-touched' }, { key: 'fear-eater' }],
    [{ key: 'hollow-saint', elite: true }]
  ],
  sawmill: [
    [{ key: 'mill-hand' }, { key: 'hook-carver' }],
    [{ key: 'mill-hand' }, { key: 'saw-priest' }],
    [{ key: 'hook-carver' }, { key: 'saw-priest' }],
    [{ key: 'foreman-red', elite: true }]
  ]
};

const enemyBook = {
  cultist: { name: 'Cultist', max: 14, intent: ['Stab', 'Poison Throw', 'Call Reinforcements'], dmg: 4 },
  acolyte: { name: 'Ritual Acolyte', max: 24, intent: ['Cast Ritual', 'Blood Bolt', 'Defend'], dmg: 5 },
  trapper: { name: 'Cult Trapper', max: 18, intent: ['Lay Trap', 'Knife Rush', 'Retreat'], dmg: 5 },
  leader: { name: 'Ritual Leader', max: 34, intent: ['Blood Obelisk', 'Cull the Weak', 'Call Reinforcements'], dmg: 7 },
  'frost-wolf': { name: 'Frost Wolf', max: 16, intent: ['Lunging Bite', 'Circle Prey', 'Howl'], dmg: 5 },
  'ice-stalker': { name: 'Ice Stalker', max: 20, intent: ['Pounce', 'Whiteout', 'Retreat'], dmg: 6 },
  'white-maw': { name: 'White Maw', max: 28, intent: ['Crushing Bite', 'Howl', 'Guard Den'], dmg: 7 },
  'winter-alpha': { name: 'Winter Alpha', max: 42, intent: ['Pack Command', 'Raking Bite', 'Whiteout'], dmg: 8 },
  'bone-picker': { name: 'Bone Picker', max: 18, intent: ['Hook Jab', 'Scavenge Armor', 'Call Raiders'], dmg: 5 },
  'scrap-thrower': { name: 'Scrap Thrower', max: 20, intent: ['Jagged Toss', 'Pin Down', 'Retreat'], dmg: 6 },
  'pit-brute': { name: 'Pit Brute', max: 30, intent: ['Maul', 'Bone Shield', 'Bellow'], dmg: 7 },
  'bone-king': { name: 'Bone King', max: 46, intent: ['Skull Crown', 'Crush', 'Call Raiders'], dmg: 9 },
  'hollow-wisp': { name: 'Hollow Wisp', max: 18, intent: ['Fear Pulse', 'Drift', 'Drain'], dmg: 5 },
  'veil-touched': { name: 'Veil-Touched', max: 24, intent: ['Panic Touch', 'Fade', 'Split Focus'], dmg: 6 },
  'fear-eater': { name: 'Fear Eater', max: 32, intent: ['Terror Bite', 'Feed on Fear', 'Defend'], dmg: 8 },
  'hollow-saint': { name: 'Hollow Saint', max: 52, intent: ['Unmake Courage', 'Grave Bell', 'Fade'], dmg: 10 },
  'mill-hand': { name: 'Mill Hand', max: 22, intent: ['Cleaver Swing', 'Hook Drag', 'Call Workers'], dmg: 6 },
  'hook-carver': { name: 'Hook Carver', max: 28, intent: ['Deep Cut', 'Chain Pull', 'Retreat'], dmg: 8 },
  'saw-priest': { name: 'Saw Priest', max: 34, intent: ['Rust Rite', 'Blood Saw', 'Defend'], dmg: 9 },
  'foreman-red': { name: 'Foreman Red', max: 62, intent: ['Start the Mill', 'Cull the Weak', 'Call Workers'], dmg: 12 }
};

const enemyArchetypes = {
  cultist: 'aggressive',
  trapper: 'control',
  acolyte: 'escalation',
  leader: 'escalation',
  'frost-wolf': 'aggressive',
  'ice-stalker': 'control',
  'white-maw': 'aggressive',
  'winter-alpha': 'escalation',
  'bone-picker': 'aggressive',
  'scrap-thrower': 'control',
  'pit-brute': 'aggressive',
  'bone-king': 'escalation',
  'hollow-wisp': 'control',
  'veil-touched': 'control',
  'fear-eater': 'escalation',
  'hollow-saint': 'escalation',
  'mill-hand': 'aggressive',
  'hook-carver': 'control',
  'saw-priest': 'control',
  'foreman-red': 'escalation'
};

const behaviorPools = {
  aggressive: [
    { id: 'quick-strike', label: 'Quick Strike', telegraph: 'Fast pressure', weight: 38, kind: 'damage', dmg: 0, moving: true },
    { id: 'heavy-strike', label: 'Heavy Strike', telegraph: 'Heavy attack incoming', weight: 22, kind: 'damage', dmg: 3, moving: true },
    { id: 'dodge-punish', label: 'Cut Off Escape', telegraph: 'Punishes dodge', weight: 18, kind: 'punishDodge', dmg: 1, moving: true },
    { id: 'blood-combo', label: 'Blood Combo', telegraph: 'Aggressive combo', weight: 14, kind: 'combo', dmg: 1, moving: true },
    { id: 'pressure', label: 'Press The Line', telegraph: 'Tempo pressure', weight: 8, kind: 'pressure' }
  ],
  control: [
    { id: 'cleanse', label: 'Cleanse Wounds', telegraph: 'Cleansing debuffs', weight: 26, kind: 'cleanse' },
    { id: 'disrupt-setup', label: 'Disrupt Setup', telegraph: 'Interrupts setup', weight: 24, kind: 'disrupt' },
    { id: 'snare-break', label: 'Sweep The Ground', telegraph: 'Counters traps', weight: 20, kind: 'breakTrap' },
    { id: 'control-hit', label: 'Measured Cut', telegraph: 'Controlled strike', weight: 18, kind: 'damage', dmg: -1 },
    { id: 'blind-angle', label: 'Blind Angle', telegraph: 'Reduces next action', weight: 12, kind: 'actionTax' }
  ],
  escalation: [
    { id: 'build-rite', label: 'Build Rite', telegraph: 'Danger escalates', weight: 30, kind: 'escalate' },
    { id: 'ritual-pulse', label: 'Ritual Pulse', telegraph: 'Ritual damage coming', weight: 22, kind: 'ritual' },
    { id: 'defensive-rite', label: 'Defensive Rite', telegraph: 'Defensive stance', weight: 18, kind: 'defend' },
    { id: 'summon-pressure', label: 'Call The Dark', telegraph: 'Reinforcements possible', weight: 16, kind: 'summon' },
    { id: 'execution-mark', label: 'Execution Mark', telegraph: 'Marks a hunter', weight: 14, kind: 'mark' }
  ]
};

let state;
let selectedContract = contracts[0];
let recommendationsOn = false;
let profileIndex = [];
let activeProfileId = null;
let pendingRevealCards = [];
let revealIndex = 0;
let pendingVictoryFinal = false;

function freshState() {
  return {
    profileId: '', hunterName: '', hunterXP: 0,
    marks: 0, scrap: 0, rank: 1, rep: 'Unknown', bond: 1, battlesWon: 0, deckRating: 0,
    owned: starterOwned(),
    activeDeck: [...starterDeck],
    relics: ['Wolf Fang Charm'],
    completed: [], unlockedHunts: ['black-veil'], difficultyProgress: {}, settings: {},
    firstDeckRevealed: false,
    encounter: 0, turn: 1, actions: 3, maxActions: 3, deck: [], discard: [], hand: [],
    delilah: { hp: 38, max: 38 }, lady: { hp: 32, max: 32 },
    enemies: [], targetId: null, log: [],
    enemyActionEvents: [], debugEvents: [],
    guard: 0, dodge: 0, traps: 0, ladyInstinct: 0, intentClear: false, funnel: false, nextBleed: 0, nextTurnBonus: 0, nextTerror: 0, bleed: 0, freeTrapUsed: false,
    reinforcements: 0, huntLost: false, pendingRewardCard: null, pendingFinal: false
  };
}

function starterOwned() {
  return starterDeck.reduce((owned, id) => {
    owned[id] = (owned[id] || 0) + 1;
    return owned;
  }, {});
}

function profileKey(id) {
  return `${PROFILE_SAVE_PREFIX}${id}`;
}

function readProfileIndex() {
  try {
    const index = JSON.parse(localStorage.getItem(PROFILE_INDEX_KEY) || '[]');
    return Array.isArray(index) ? index.filter(p => p && p.id) : [];
  } catch {
    localStorage.removeItem(PROFILE_INDEX_KEY);
    return [];
  }
}

function writeProfileIndex() {
  localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(profileIndex));
}

function migrateLegacySaveIfNeeded() {
  const existing = readProfileIndex().filter(p => p.id !== 'legacy_hunter');
  localStorage.removeItem(profileKey('legacy_hunter'));
  localStorage.removeItem(LEGACY_SAVE_KEY);
  localStorage.removeItem(LEGACY_MIGRATED_KEY);
  if (localStorage.getItem(ACTIVE_PROFILE_KEY) === 'legacy_hunter') localStorage.removeItem(ACTIVE_PROFILE_KEY);
  localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(existing));
  return existing;
}

function profileSummaryFromState() {
  return {
    id: activeProfileId,
    hunterName: state.hunterName || 'Unnamed Hunter',
    rank: state.rank || 1,
    battlesWon: state.battlesWon || 0,
    updatedAt: new Date().toISOString()
  };
}

function upsertProfileSummary() {
  if (!activeProfileId) return;
  const summary = profileSummaryFromState();
  const i = profileIndex.findIndex(p => p.id === activeProfileId);
  if (i >= 0) profileIndex[i] = { ...profileIndex[i], ...summary };
  else profileIndex.push(summary);
  writeProfileIndex();
}

function sanitizeSave(saved) {
  const starter = starterOwned();
  const owned = { ...starter };
  Object.entries(saved.owned || saved.ownedCards || {}).forEach(([id, count]) => {
    if (card(id)) owned[id] = Math.max(owned[id] || 0, Number(count) || 0);
  });
  const deck = Array.isArray(saved.activeDeck || saved.currentDeck) ? (saved.activeDeck || saved.currentDeck).filter(id => card(id)) : [];
  return {
    profileId: saved.profileId || activeProfileId || '',
    hunterName: saved.hunterName || 'Unnamed Hunter',
    hunterXP: Math.max(0, Number(saved.hunterXP) || 0),
    marks: Math.max(0, Number(saved.marks ?? saved.hunterMarks) || 0),
    scrap: Math.max(0, Number(saved.scrap) || 0),
    battlesWon: Math.max(0, Number(saved.battlesWon) || 0),
    deckRating: Math.max(0, Number(saved.deckRating) || 0),
    rank: Math.max(1, Number(saved.rank ?? saved.hunterRank) || 1),
    rep: saved.rep || saved.reputation || 'Unknown',
    bond: Math.max(1, Number(saved.bond) || 1),
    owned,
    activeDeck: deck.length === 20 ? deck : [...starterDeck],
    relics: Array.isArray(saved.relics) && saved.relics.length ? saved.relics : ['Wolf Fang Charm'],
    completed: Array.isArray(saved.completed || saved.completedHunts) ? (saved.completed || saved.completedHunts) : [],
    unlockedHunts: Array.isArray(saved.unlockedHunts) && saved.unlockedHunts.length ? saved.unlockedHunts : ['black-veil'],
    difficultyProgress: saved.difficultyProgress && typeof saved.difficultyProgress === 'object' ? saved.difficultyProgress : {},
    settings: saved.settings && typeof saved.settings === 'object' ? saved.settings : {},
    firstDeckRevealed: Boolean(saved.firstDeckRevealed)
  };
}

function loadProgress() {
  try {
    profileIndex = migrateLegacySaveIfNeeded();
    activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!activeProfileId || !profileIndex.some(p => p.id === activeProfileId)) return false;
    const saved = JSON.parse(localStorage.getItem(profileKey(activeProfileId)) || 'null');
    if (!saved || typeof saved !== 'object') return false;
    Object.assign(state, sanitizeSave(saved));
    return true;
  } catch {
    if (activeProfileId) localStorage.removeItem(profileKey(activeProfileId));
    return false;
  }
}

function saveProgress(message = '') {
  if (!activeProfileId) return;
  syncProgression();
  const progress = {
    profileId: activeProfileId,
    hunterName: state.hunterName,
    hunterRank: state.rank,
    hunterXP: state.hunterXP,
    hunterMarks: state.marks,
    reputation: state.rep,
    marks: state.marks,
    scrap: state.scrap,
    rank: state.rank,
    rep: state.rep,
    bond: state.bond,
    battlesWon: state.battlesWon,
    deckRating: state.deckRating,
    owned: state.owned,
    ownedCards: state.owned,
    activeDeck: state.activeDeck,
    currentDeck: state.activeDeck,
    relics: state.relics,
    completed: state.completed,
    completedHunts: state.completed,
    unlockedHunts: state.unlockedHunts,
    difficultyProgress: state.difficultyProgress,
    settings: state.settings,
    firstDeckRevealed: state.firstDeckRevealed,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(profileKey(activeProfileId), JSON.stringify(progress));
  upsertProfileSummary();
  if (message && $('ladyNote')) $('ladyNote').textContent = message;
  if (message) showToast(message);
}

function showToast(message) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('show');
    toast.hidden = true;
  }, 2200);
}

function init() {
  state = freshState();
  const hasProfile = loadProgress();
  bind();
  if (!hasProfile) {
    showSplash();
    return;
  }
  renderContracts();
  selectContract('black-veil');
  renderResources();
  renderPrep();
  if (!state.firstDeckRevealed) showFirstDeckReveal();
}

function bind() {
  $('acceptBtn').addEventListener('click', () => showPrep());
  $('allCardsBtn').addEventListener('click', showAllCards);
  $('profilesBtn').addEventListener('click', showProfileGate);
  $('splashBeginBtn').addEventListener('click', showProfileGate);
  $('deckBtn').addEventListener('click', () => showPrep());
  $('prepBtn').addEventListener('click', () => showPrep());
  $('archiveBtn').addEventListener('click', () => showPrep());
  document.querySelectorAll('.map-node').forEach(btn => btn.addEventListener('click', () => {
    selectContract(btn.dataset.contract);
    maybeShowContractTutorialAfterSelection();
  }));
  $('backBoardBtn').addEventListener('click', () => showBoard());
  $('recommendBtn').addEventListener('click', () => {
    recommendationsOn = !recommendationsOn;
    renderPrep();
  });
  $('startHuntBtn').addEventListener('click', startHunt);
  $('saveBtn').addEventListener('click', () => saveProgress('Game saved.'));
  $('endTurnBtn').addEventListener('click', endTurn);
  $('mapReturnBtn').addEventListener('click', () => showBoard());
  $('campBtn').addEventListener('click', camp);
  $('cardsBtn').addEventListener('click', () => showPrep());
  $('journalBtn').addEventListener('click', () => $('journalDialog').showModal());
  $('returnMapBtn').addEventListener('click', () => {
    $('routeDialog').close();
    showBoard();
  });
  $('continueCampBtn').addEventListener('click', () => {
    $('routeDialog').close();
    restoreHunters();
    startEncounter();
    showCombat();
  });
  $('victoryCacheBtn').addEventListener('click', () => {
    $('victoryDialog').close();
    reward(pendingVictoryFinal, true);
  });
  $('defeatMapBtn').addEventListener('click', () => {
    $('defeatDialog').close();
    showBoard();
  });
  $('defeatDeckBtn').addEventListener('click', () => {
    $('defeatDialog').close();
    showPrep();
  });
  $('defeatRetryBtn').addEventListener('click', () => {
    $('defeatDialog').close();
    state.encounter = 0;
    restoreHunters();
    startEncounter();
    showCombat();
  });
  $('createProfileBtn').addEventListener('click', createProfileFromInput);
  $('newProfileBtn').addEventListener('click', () => {
    activeProfileId = null;
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    state = freshState();
    renderProfileList();
  });
  $('deleteProfileBtn').addEventListener('click', deleteActiveProfile);
  $('exportProfileBtn').addEventListener('click', exportActiveProfile);
  $('importProfileBtn').addEventListener('click', () => $('importProfileFile').click());
  $('importProfileFile').addEventListener('change', importProfileFile);
  $('drawOneBtn').addEventListener('click', beginOneAtATimeReveal);
  $('revealAllBtn').addEventListener('click', revealAllFirstDeck);
  $('revealDeckStack').addEventListener('click', revealNextCard);
  $('finishRevealBtn').addEventListener('click', finishFirstDeckReveal);
}

function showSplash() {
  setScreen('splashScreen', 'Lady & Delilah', 'The Hunt');
}

function showProfileGate() {
  profileIndex = readProfileIndex();
  renderProfileList();
  setScreen('profileScreen', 'Local Hunter Save', 'Profiles');
  $('hunterNameInput').focus();
}

function renderProfileList() {
  const list = $('profileList');
  if (!profileIndex.length) {
    list.innerHTML = `<div class="profile-empty">No hunter profiles yet.</div>`;
  } else {
    list.innerHTML = profileIndex.map(p => `
      <div class="profile-card ${p.id === activeProfileId ? 'active' : ''}">
        <div>
          <b>${escapeHtml(p.hunterName || 'Unnamed Hunter')}</b>
          <span>Rank ${p.rank || 1} • ${p.battlesWon || 0} wins</span>
        </div>
        <button class="plain-btn" data-continue-profile="${p.id}" type="button">Continue Profile</button>
      </div>
    `).join('');
  }
  document.querySelectorAll('[data-continue-profile]').forEach(btn => {
    btn.addEventListener('click', () => continueProfile(btn.dataset.continueProfile));
  });
}

function continueProfile(id) {
  activeProfileId = id;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  state = freshState();
  if (!loadProgress()) {
    showToast('Profile could not be loaded.');
    showProfileGate();
    return;
  }
  renderContracts();
  selectContract('black-veil');
  renderResources();
  renderPrep();
  state.firstDeckRevealed ? showBoard() : showFirstDeckReveal();
}

function createProfileFromInput() {
  const input = $('hunterNameInput');
  const hunterName = (input.value || '').trim() || 'Unnamed Hunter';
  const id = `hunter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  activeProfileId = id;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  state = freshState();
  Object.assign(state, { profileId: id, hunterName, firstDeckRevealed: false });
  saveProgress();
  input.value = '';
  renderContracts();
  selectContract('black-veil');
  renderResources();
  renderPrep();
  showFirstDeckReveal();
}

function deleteActiveProfile() {
  if (!activeProfileId) {
    showToast('Choose a profile first.');
    return;
  }
  const profile = profileIndex.find(p => p.id === activeProfileId);
  const name = profile ? profile.hunterName : 'this hunter';
  if (!confirm(`Delete ${name}'s local profile? This cannot be undone.`)) return;
  localStorage.removeItem(profileKey(activeProfileId));
  profileIndex = profileIndex.filter(p => p.id !== activeProfileId);
  writeProfileIndex();
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
  activeProfileId = null;
  state = freshState();
  renderProfileList();
  showToast('Profile deleted.');
}

function exportActiveProfile() {
  if (!activeProfileId) {
    showToast('Choose a profile first.');
    return;
  }
  saveProgress();
  const raw = localStorage.getItem(profileKey(activeProfileId));
  const blob = new Blob([raw], { type: 'application/json' });
  const a = document.createElement('a');
  const safeName = (state.hunterName || 'hunter').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  a.href = URL.createObjectURL(blob);
  a.download = `lady-delilah-${safeName || 'hunter'}-save.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Save exported.');
}

function importProfileFile(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result || '{}'));
      const id = `hunter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      activeProfileId = id;
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
      state = freshState();
      Object.assign(state, sanitizeSave({ ...imported, profileId: id }));
      state.profileId = id;
      saveProgress('Save imported.');
      renderProfileList();
      renderContracts();
      selectContract('black-veil');
      renderResources();
      renderPrep();
      state.firstDeckRevealed ? showBoard() : showFirstDeckReveal();
    } catch {
      showToast('Import failed.');
    }
  };
  reader.readAsText(file);
}

function showFirstDeckReveal() {
  pendingRevealCards = onboardingRevealCards();
  revealIndex = 0;
  $('revealedCards').innerHTML = '';
  $('revealDeckStack').hidden = false;
  $('finishRevealBtn').hidden = true;
  $('drawOneBtn').hidden = false;
  $('revealAllBtn').hidden = false;
  $('revealHint').textContent = 'Delilah lays the first tools on the table.';
  setScreen('firstRevealScreen', 'First Hunt Deck', 'The First Cache');
}

function onboardingRevealCards() {
  const rarePool = ['sync', 'obelisk', 'moon-ambush', 'bone-whistle', 'shatter-rite'];
  const epicPool = ['moon-hunt', 'wolf-saint', 'red-door', 'grave-silence'];
  const finalPool = Math.random() < .14 ? epicPool : rarePool;
  return ['spear', 'aimed', 'pack', 'bandage', shuffle(finalPool)[0]].map(card);
}

function beginOneAtATimeReveal() {
  $('drawOneBtn').hidden = true;
  $('revealAllBtn').hidden = true;
  $('revealHint').textContent = 'Click the deck to draw the next card.';
  revealNextCard();
}

function revealNextCard() {
  if (!$('drawOneBtn').hidden) {
    beginOneAtATimeReveal();
    return;
  }
  if (revealIndex >= pendingRevealCards.length) return;
  const c = pendingRevealCards[revealIndex++];
  $('revealedCards').insertAdjacentHTML('beforeend', revealCardHtml(c, revealIndex));
  if (isBestRevealCard(c)) $('revealHint').textContent = `${c.name}. Good pull. Delilah would keep that close.`;
  playSoundCue('card-flip');
  if (revealIndex >= pendingRevealCards.length) {
    $('revealDeckStack').hidden = true;
    $('finishRevealBtn').hidden = false;
    pulseElement('finishRevealBtn', 5000);
    if (!isBestRevealCard(c)) $('revealHint').textContent = `${bestRevealCard().name} is the prize here. Good pick.`;
  }
}

function revealAllFirstDeck() {
  $('drawOneBtn').hidden = true;
  $('revealAllBtn').hidden = true;
  $('revealDeckStack').hidden = true;
  $('revealedCards').innerHTML = pendingRevealCards.map((c, i) => revealCardHtml(c, i + 1, true)).join('');
  $('finishRevealBtn').hidden = false;
  pulseElement('finishRevealBtn', 5000);
  const best = bestRevealCard();
  $('revealHint').textContent = `${best.name} is your best pull. That one earns its place.`;
  playSoundCue('reveal-all');
}

function revealCardHtml(c, order, all = false) {
  const best = isBestRevealCard(c);
  return `<article class="reveal-card reward-card-preview rarity-${rarityKey(c)} ${cardArtClass(c)} ${all ? 'reveal-all' : ''} ${best ? 'best-pull' : ''}" style="${cardArtStyle(c)};--reveal-order:${order}">
    ${best ? '<div class="best-pull-badge">Best Pull</div>' : ''}
    <div class="card-top"><span class="cost">${c.cost}</span><h3>${c.name}</h3></div>
    <span class="card-type">${c.type} • ${displayRarity(c)}</span>
    <span class="card-scope">${cardScope(c)}</span>
    <p>${c.text}</p>
    <small>${displayRarity(c)} Cache Card</small>
  </article>`;
}

function bestRevealCard() {
  return [...pendingRevealCards].sort((a, b) => cardPower(b) - cardPower(a))[0] || pendingRevealCards[0];
}

function isBestRevealCard(c) {
  const best = bestRevealCard();
  return best && c.id === best.id;
}

function finishFirstDeckReveal() {
  pendingRevealCards.forEach(c => {
    state.owned[c.id] = (state.owned[c.id] || 0) + 1;
  });
  state.firstDeckRevealed = true;
  state.settings = { ...(state.settings || {}), tutorialBoardSeen: false, tutorialPrepSeen: false, tutorialCombatSeen: false };
  saveProgress('First cache saved.');
  renderResources();
  renderPrep();
  showBoard();
}

function playSoundCue(name) {
  document.dispatchEvent(new CustomEvent('ladyDelilahSoundCue', { detail: { name } }));
}

function pulseElement(id, duration = 4500) {
  const el = $(id);
  if (!el) return;
  el.classList.add('pulse-attention');
  setTimeout(() => el.classList.remove('pulse-attention'), duration);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch]);
}

function tutorialEligible() {
  return state && state.firstDeckRevealed && !state.battlesWon && !(state.settings || {}).tutorialDismissed;
}

function showTutorial({ kicker = 'Delilah', title, text, actions }) {
  const dialog = $('tutorialDialog');
  if (!dialog || dialog.open) return;
  $('tutorialKicker').textContent = kicker;
  $('tutorialTitle').textContent = title;
  $('tutorialText').textContent = text;
  $('tutorialActions').innerHTML = actions.map((action, i) => `<button class="${action.primary ? 'blood-btn' : 'plain-btn'}" data-tutorial-action="${i}" type="button">${action.label}</button>`).join('');
  document.querySelectorAll('[data-tutorial-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = actions[Number(btn.dataset.tutorialAction)];
      dialog.close();
      if (action.run) action.run();
    });
  });
  dialog.showModal();
}

function maybeShowBoardTutorial() {
  if (!tutorialEligible() || state.settings.tutorialBoardSeen) return;
  state.settings.tutorialBoardSeen = true;
  saveProgress();
  setTimeout(() => {
    if ($('boardScreen').hidden) return;
    showTutorial({
      title: 'Need a trail marker?',
      text: 'Start with Black Veil Camp when you are ready. It is rated 1 / 5 and built for a first hunt. You can inspect the map first, then open your deck before the fight.',
      actions: [
        { label: 'Select Black Veil', primary: true, run: () => { selectContract('black-veil'); showToast('Black Veil Camp selected. Open your deck when ready.'); } },
        { label: 'Go To Deck', run: () => { selectContract('black-veil'); showPrep(); } },
        { label: 'Keep Exploring', run: () => { showToast('Choose any contract when you are ready.'); } }
      ]
    });
  }, 20000);
}

function showContractTutorial() {
  showTutorial({
    title: 'Prepare before the fight.',
    text: 'Open your archive and choose the 20 cards you want for this battle. Delilah can mark a strong first build if you want her advice.',
    actions: [
      { label: 'Go To Deck', primary: true, run: () => showPrep() },
      { label: 'Stay On Map' }
    ]
  });
}

function maybeShowPrepTutorial() {
  if (!tutorialEligible() || state.settings.tutorialPrepSeen) return;
  state.settings.tutorialPrepSeen = true;
  saveProgress();
  setTimeout(() => showTutorial({
    title: 'Delilah can build this run.',
    text: 'Take a look first. If you want, Delilah can put together a strong 20-card deck from what you own for this hunt. You can still change anything afterward.',
    actions: [
      { label: "Delilah's Build", primary: true, run: () => { autoBuildDeck(); recommendationsOn = true; renderPrep(); cueDeckReady('Delilah chose 20 / 20 cards for this hunt.'); scheduleDeckEditingHint(); } },
      { label: 'I Will Choose', run: () => { saveProgress(); renderPrep(); cueDeckReady('Your deck is already 20 / 20. Swap cards if you want a different build.'); scheduleDeckEditingHint(); } }
    ]
  }), 2000);
}

function cueDeckReady(message) {
  showToast(message);
  pulseElement('deckCount', 5200);
  pulseElement('startHuntBtn', 5200);
}

function scheduleDeckEditingHint() {
  if (state.settings.deckEditHintSeen) return;
  state.settings.deckEditHintSeen = true;
  saveProgress();
  setTimeout(() => {
    if ($('prepScreen').hidden || $('tutorialDialog').open) return;
    showTutorial({
      title: 'Tuning your deck.',
      text: 'You have 20 / 20 cards selected. To swap a card, click its - button first, then add another card with its + button. When the build feels right, click Begin The Hunt.',
      actions: [
        { label: 'Got It', primary: true, run: () => pulseElement('startHuntBtn', 4200) }
      ]
    });
  }, 3500);
}

function maybeShowCombatTutorial() {
  if (!tutorialEligible() || state.settings.tutorialCombatSeen) return;
  state.settings.tutorialCombatSeen = true;
  saveProgress();
  setTimeout(() => showTutorial({
    title: 'Spend actions, then end turn.',
    text: 'Your action points are shown on the left. Card costs are in the top-left corner of each card. Click an enemy to target it, play what you can afford, then end your turn.',
    actions: [
      { label: 'Begin The Hunt', primary: true },
      { label: 'Do Not Show Again', run: () => { state.settings.tutorialDismissed = true; saveProgress(); } }
    ]
  }), 350);
}

function autoBuildDeck() {
  const ownedIds = Object.entries(state.owned || {}).flatMap(([id, count]) => Array.from({ length: count }, () => id)).filter(id => card(id));
  const preferred = recommendedCardIds();
  state.activeDeck = ownedIds
    .sort((a, b) => {
      const ac = card(a), bc = card(b);
      const ar = (preferred.has(a) ? 1000 : 0) + cardPower(ac) - ac.cost * 1.5;
      const br = (preferred.has(b) ? 1000 : 0) + cardPower(bc) - bc.cost * 1.5;
      return br - ar;
    })
    .slice(0, 20);
  while (state.activeDeck.length < 20) state.activeDeck.push(starterDeck[state.activeDeck.length % starterDeck.length]);
  saveProgress();
}

function showBoard() {
  setScreen('boardScreen', 'Choose Your Hunt', 'Hunt Board');
  maybeShowBoardTutorial();
}

function showPrep() {
  renderPrep();
  setScreen('prepScreen', 'Deck Preparation', 'Archive');
  maybeShowPrepTutorial();
}

function showCombat() {
  setScreen('combatScreen', `Hunt: ${selectedContract.name}`, selectedContract.name);
  maybeShowCombatTutorial();
}

function setScreen(id, kicker, title) {
  ['splashScreen', 'profileScreen', 'firstRevealScreen', 'boardScreen', 'prepScreen', 'combatScreen'].forEach(s => $(s).hidden = s !== id);
  $('screenKicker').textContent = kicker;
  $('screenTitle').textContent = title;
}

function renderResources() {
  syncProgression();
  $('rankText').textContent = state.rank;
  $('marksText').textContent = state.marks.toLocaleString();
  $('scrapText').textContent = state.scrap;
  $('repText').textContent = state.rep;
  $('bondText').textContent = state.bond;
  $('combatMarks').textContent = state.marks;
}

function renderContracts() {
  $('contractList').innerHTML = contracts.map(c => `
    <button class="contract-card ${c.id === selectedContract.id ? 'active' : ''}" data-id="${c.id}" type="button">
      <div class="contract-thumb" style="background-image:url('${c.poster}')"></div>
      <div><h3>${c.name}</h3><p>${c.type}</p><div class="pips">${'✥'.repeat(c.threat)}${'◇'.repeat(5 - c.threat)}</div></div>
      <div class="faction-mark">✣</div>
    </button>
  `).join('');
  document.querySelectorAll('.contract-card').forEach(btn => btn.addEventListener('click', () => {
    selectContract(btn.dataset.id);
    maybeShowContractTutorialAfterSelection();
  }));
}

function selectContract(id) {
  selectedContract = contracts.find(c => c.id === id) || contracts[0];
  document.querySelectorAll('.contract-card').forEach(btn => btn.classList.toggle('active', btn.dataset.id === id));
  document.querySelectorAll('.map-node').forEach(btn => btn.classList.toggle('active', btn.dataset.contract === id));
  $('poster').style.backgroundImage = `url("${selectedContract.poster}")`;
  $('detailName').textContent = selectedContract.name;
  $('detailType').textContent = selectedContract.type;
  $('detailDescription').textContent = selectedContract.desc;
  $('detailThreat').textContent = selectedContract.threat >= 4 ? 'Dangerous' : 'Hazardous';
  $('skulls').textContent = '✥'.repeat(selectedContract.threat) + '◇'.repeat(5 - selectedContract.threat);
  $('detailEnv').innerHTML = selectedContract.env.map(e => `<span>${e}</span>`).join('');
  $('ladyNote').textContent = `Lady senses weakness at ${selectedContract.name}.`;
}

function maybeShowContractTutorialAfterSelection() {
  if (!tutorialEligible() || state.settings.tutorialContractSeen || state.settings.tutorialBoardSeen || selectedContract.id !== 'black-veil') return;
  state.settings.tutorialContractSeen = true;
  saveProgress();
  setTimeout(() => {
    if ($('boardScreen').hidden) return;
    showContractTutorial();
  }, 25000);
}

function renderPrep() {
  syncProgression();
  const count = state.activeDeck.length;
  const recommended = recommendedCardIds();
  $('deckCount').textContent = `Deck: ${count} / 20`;
  $('deckWarning').textContent = count === 20 ? 'Ready' : count > 20 ? 'Too many cards' : 'Add cards';
  $('collectionCount').textContent = `Collection: ${ownedCardCount()} cards`;
  $('deckRatingText').textContent = 'Hunter rating recalculated';
  if ($('activeDeck')) $('activeDeck').innerHTML = state.activeDeck.map((id, i) => {
    const c = card(id);
    return `<div class="deck-row"><div><b>${c.name}</b><span>${c.type} · ${c.cost} Action</span></div><button data-remove="${i}" class="plain-btn" type="button">-</button></div>`;
  }).join('');
  $('archiveGrid').innerHTML = cards.map(c => {
    const owned = state.owned[c.id] || 0;
    const used = state.activeDeck.filter(id => id === c.id).length;
    const canAdd = owned && used < owned && count < 20;
    const isRecommended = recommendationsOn && used > 0 && recommended.has(c.id);
    return `<article class="archive-card deck-card rarity-${rarityKey(c)} ${cardArtClass(c)} ${owned ? '' : 'missing'} ${used ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}" style="${cardArtStyle(c)}">
      <div class="card-top"><span class="cost">${c.cost}</span><h3>${c.name}</h3></div>
      <span>${c.type} · ${displayRarity(c)} · Owned ${owned}</span>
      <span class="card-scope">${cardScope(c)}</span>
      <p>${c.text}</p>
      <div class="deck-edit-row">
        <div class="owned-count"><b>Owned</b><span>${owned}</span></div>
        <div class="owned-count"><b>In Deck</b><span>${used}</span></div>
        <div>
          <button class="mini-btn" data-minus-card="${c.id}" type="button" ${used ? '' : 'disabled'}>-</button>
          <button class="mini-btn" data-add="${c.id}" type="button" ${canAdd ? '' : 'disabled'}>+</button>
        </div>
      </div>
    </article>`;
  }).join('');
  $('recommendBtn').classList.toggle('active', recommendationsOn);
  $('recommendLine').hidden = !recommendationsOn;
  $('recommendLine').textContent = recommendationLine();
  $('relicShelf').innerHTML = state.relics.map(name => {
    const r = relics.find(x => x.name === name);
    return `<div class="relic"><b>${name}</b><span>${r ? r.text : ''}</span></div>`;
  }).join('');
  document.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
    state.activeDeck.splice(Number(b.dataset.remove), 1);
    saveProgress();
    renderPrep();
  }));
  document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => addCardToDeck(b.dataset.add)));
  document.querySelectorAll('[data-minus-card]').forEach(b => b.addEventListener('click', () => removeCardFromDeck(b.dataset.minusCard)));
}

function addCardToDeck(id) {
  const owned = state.owned[id] || 0;
  const used = state.activeDeck.filter(x => x === id).length;
  if (!owned || used >= owned || state.activeDeck.length >= 20) return;
  state.activeDeck.push(id);
  syncProgression();
  saveProgress();
  renderPrep();
}

function removeCardFromDeck(id) {
  const index = state.activeDeck.lastIndexOf(id);
  if (index < 0) return;
  state.activeDeck.splice(index, 1);
  syncProgression();
  saveProgress();
  renderPrep();
}

function showAllCards() {
  $('allCardsGrid').innerHTML = cards.map(c => {
    const owned = state.owned[c.id] || 0;
    return `<article class="collection-card rarity-${rarityKey(c)} ${cardArtClass(c)} ${owned ? '' : 'missing'}" style="${cardArtStyle(c)}">
      <div class="card-top"><b>${c.name}</b><span class="cost">${c.cost}</span></div>
      <span>${displayRarity(c)} · ${c.type} · ${cardScope(c)}</span>
      <p>${c.text}</p>
      <small>${owned ? `Owned ${owned}` : 'Missing'}</small>
    </article>`;
  }).join('');
  $('allCardsDialog').showModal();
}

function startHunt() {
  if (state.activeDeck.length !== 20) return;
  state.encounter = 0;
  restoreHunters();
  startEncounter();
  showCombat();
}

function startEncounter() {
  syncProgression();
  restoreHunters();
  state.turn = 1;
  state.maxActions = 3;
  state.actions = 3;
  state.deck = shuffle([...state.activeDeck]);
  state.discard = [];
  state.hand = [];
  state.guard = 0; state.dodge = 0; state.traps = 0; state.ladyInstinct = 0; state.intentClear = false; state.funnel = false; state.nextBleed = 0; state.nextTurnBonus = 0; state.nextTerror = 0; state.freeTrapUsed = false;
  state.enemyActionText = ''; state.enemyActionPulse = ''; state.nextActionPenalty = 0; state.retaliate = 0; state.guardAll = false; state.fiveCount = false; state.killLane = false; state.silenceReinforcements = false; state.nextAttackCharges = 0; state.nextAttackChargeBonus = 0; state.syncDiscount = false;
  state.enemyActionEvents = [];
  state.debugEvents = [];
  state.reinforcements = 0;
  state.huntLost = false;
  state.defeatShown = false;
  state.targetId = null;
  state.enemies = currentEncounters()[state.encounter].map((e, i) => makeEnemy(e.key, i, e.elite));
  if (relic('Ritual Bone')) state.enemies.forEach(e => addStatus(e, 'terrified', 1));
  draw(5);
  log(`Encounter ${state.encounter + 1}: ${state.enemies.map(e => e.name).join(', ')}.`);
  debugEvent(`Encounter starts: ${selectedContract.name}, threat ${selectedContract.threat}, deck rating ${state.deckRating}.`);
  renderCombat();
}

function restoreHunters() {
  state.delilah.hp = state.delilah.max;
  state.lady.hp = state.lady.max;
  state.bleed = 0;
}

function makeEnemy(key, i, elite = false, summoned = false) {
  const base = enemyBook[key];
  const risk = selectedContract.threat || 1;
  const ratingPressure = Math.max(0, state.deckRating - 18);
  const hpScale = Math.floor(ratingPressure / 10) + (risk - 1) * 3;
  const dmgScale = Math.floor(ratingPressure / 18) + Math.floor((risk - 1) / 2);
  const max = summoned ? 10 + state.encounter * 2 + Math.floor(hpScale / 2) : base.max + state.encounter * 2 + hpScale + (elite ? 8 + risk * 2 : 0);
  const archetype = enemyArchetypes[key] || 'aggressive';
  const enemy = { id: `${key}-${Date.now()}-${i}`, key, name: base.name, max, hp: max, dmg: base.dmg + Math.floor(state.encounter / 2) + dmgScale + (elite ? 1 : 0), intent: '', behavior: null, archetype, escalation: 0, status: {}, acted: false, elite, summoned };
  enemy.behavior = chooseEnemyBehavior(enemy);
  enemy.intent = enemy.behavior.label;
  return enemy;
}

function currentEncounters() {
  return encounterSets[selectedContract.id] || encounters;
}

function reinforcementKey() {
  return ({
    'black-veil': 'cultist',
    frozen: 'frost-wolf',
    bone: 'bone-picker',
    hollow: 'hollow-wisp',
    sawmill: 'mill-hand'
  })[selectedContract.id] || 'cultist';
}

function draw(n) {
  for (let i = 0; i < n; i++) {
    if (!state.deck.length) {
      state.deck = shuffle(state.discard);
      state.discard = [];
    }
    const next = state.deck.pop();
    if (next) state.hand.push({ id: next, fresh: true, drawId: `${Date.now()}-${Math.random()}` });
  }
}

function renderCombat() {
  renderResources();
  $('objectiveText').textContent = selectedContract.objective || 'Complete the hunt';
  $('conditionList').innerHTML = selectedContract.env.map(e => `<li>${e}</li>`).join('');
  $('delilahHp').style.width = `${100 * state.delilah.hp / state.delilah.max}%`;
  $('ladyHp').style.width = `${100 * state.lady.hp / state.lady.max}%`;
  $('delilahText').textContent = `${state.delilah.hp}/${state.delilah.max} HP`;
  $('ladyText').textContent = `${state.lady.hp}/${state.lady.max} HP`;
  renderHeroStatuses();
  $('actionText').textContent = `${state.actions} / ${state.maxActions}`;
  $('focusRow').innerHTML = Array.from({ length: state.maxActions }, (_, i) => `<i class="${i >= state.actions ? 'empty' : ''}"></i>`).join('');
  $('turnTrack').innerHTML = Array.from({ length: MAX_TURNS }, (_, i) => `<div class="turn-dot ${i + 1 === state.turn ? 'active' : ''}"><span>${i + 1}</span></div>`).join('');
  $('targetText').textContent = target()?.name || 'None';
  renderBattlefieldStatus();
  renderEnemyActionBanner();
  $('enemyLine').innerHTML = state.enemies.filter(e => e.hp > 0).map(e => enemyHtml(e)).join('');
  $('intentList').innerHTML = state.enemies.filter(e => e.hp > 0).map(e => `<div class="intent-card intent-${e.archetype || 'aggressive'}"><b>${e.name}</b><span>${archetypeLabel(e)}</span><br>${intentText(e)}</div>`).join('');
  $('hand').innerHTML = state.hand.map((entry, i) => cardHtml(card(handCardId(entry)), i, Boolean(entry && entry.fresh))).join('');
  state.hand.forEach(entry => { if (entry && typeof entry === 'object') entry.fresh = false; });
  $('combatLog').innerHTML = state.log.slice(0, 8).map(l => `<div class="log-line">${l}</div>`).join('');
  renderBalanceDebug();
  document.querySelectorAll('.enemy').forEach(el => el.addEventListener('click', () => { state.targetId = el.dataset.id; renderCombat(); }));
  document.querySelectorAll('.card').forEach(el => el.addEventListener('click', () => playCard(Number(el.dataset.index))));
}

function renderBattlefieldStatus() {
  const el = $('battlefieldStatus');
  if (!el) return;
  const notes = [];
  if (state.traps) notes.push(`<span class="trap-active">Trap active: ${state.traps} snare${state.traps === 1 ? '' : 's'} armed. Moving enemies take 7 damage and Root next enemy turn.</span>`);
  if (state.funnel) notes.push(`<span>Funnel path: moving enemies become Exposed.</span>`);
  if (state.killLane) notes.push(`<span>Kill lane: moving enemies become Exposed 3.</span>`);
  el.hidden = !notes.length;
  el.innerHTML = notes.join('');
}

function renderHeroStatuses() {
  const delilah = [];
  const lady = [];
  if (state.bleed) delilah.push({ label: `Bleed ${state.bleed}`, kind: 'bleed' });
  if (state.dodge) delilah.push({ label: `Dodge ${state.dodge}`, kind: 'dodge' });
  if (state.nextBleed) delilah.push({ label: `Poisoned Spear +${state.nextBleed}`, kind: 'buff' });
  if (state.nextTurnBonus) delilah.push({ label: `Ambush +${state.nextTurnBonus}`, kind: 'buff' });
  if (state.nextAttackCharges) delilah.push({ label: `Charged Hit ${state.nextAttackCharges}`, kind: 'buff' });
  if (state.syncDiscount) delilah.push({ label: 'Sync Discount', kind: 'buff' });
  if (state.guard) lady.push({ label: `Guard ${state.guard}`, kind: 'guard' });
  if (state.guardAll) lady.push({ label: 'Wolf Saint', kind: 'guard' });
  if (state.ladyInstinct) lady.push({ label: `Instinct ${state.ladyInstinct}`, kind: 'instinct' });
  renderStatusLine('delilahStatus', delilah);
  renderStatusLine('ladyStatus', lady);
}

function renderStatusLine(id, statuses) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle('empty', !statuses.length);
  el.innerHTML = statuses.length ? statuses.map(s => `<span class="${s.kind}">${s.label}</span>`).join('') : '<span>No status</span>';
}

function renderEnemyActionBanner() {
  const banner = $('enemyActionBanner');
  if (!banner) return;
  const events = state.enemyActionEvents && state.enemyActionEvents.length
    ? state.enemyActionEvents.slice(-4)
    : (state.enemyActionText ? [{ text: state.enemyActionText, pulse: state.enemyActionPulse }] : []);
  banner.hidden = !events.length;
  banner.innerHTML = events.map(e => `<div class="enemy-action-line ${e.pulse || ''}">${e.text}</div>`).join('');
  banner.className = `enemy-action-banner ${state.enemyActionPulse || ''}`;
}

function renderBalanceDebug() {
  const el = $('balanceDebug');
  if (!el) return;
  const enemies = state.enemies.filter(e => e.hp > 0);
  const enemyHp = enemies.reduce((sum, e) => sum + e.hp, 0);
  const playerHp = state.delilah.hp + state.lady.hp;
  const lines = [
    `Round ${state.turn}/${MAX_TURNS} | Encounter ${state.encounter + 1}`,
    `Player HP ${playerHp}/${state.delilah.max + state.lady.max} | Enemy HP ${enemyHp}`,
    `Hand ${state.hand.length} | Draw ${state.deck.length} | Discard ${state.discard.length}`,
    ...enemies.map(e => `${e.name}: ${e.archetype || 'aggressive'} -> ${e.intent}${e.escalation ? ` (+${e.escalation})` : ''}`),
    ...(state.debugEvents || []).slice(0, 4)
  ];
  el.innerHTML = lines.map(line => `<div>${line}</div>`).join('');
}

function enemyHtml(e) {
  const chosen = target()?.id === e.id;
  const statuses = Object.entries(e.status).filter(([,v]) => v > 0).map(([k,v]) => `${k} ${v}`).join(' · ');
  return `<button class="enemy enemy-${enemyFamily(e.key)} enemy-sprite-${enemySprite(e.key)} ${e.elite ? 'elite' : ''} ${chosen ? 'selected' : ''}" data-id="${e.id}" type="button" aria-label="Target ${e.name}">
    <div class="enemy-nameplate"><b>${e.name}</b><span>${e.hp}/${e.max}</span><div class="hpbar"><i style="width:${100 * e.hp / e.max}%"></i></div><div class="status-line">${statuses}</div></div>
    <div class="enemy-body"></div>
  </button>`;
}

function enemySprite(key) {
  if (['frost-wolf', 'white-maw', 'winter-alpha'].includes(key)) return 'frost-wolf';
  if (['ice-stalker'].includes(key)) return 'ice-stalker';
  if (['bone-picker', 'scrap-thrower', 'pit-brute', 'bone-king'].includes(key)) return 'bone-brute';
  if (['hollow-wisp', 'veil-touched', 'fear-eater', 'hollow-saint'].includes(key)) return 'hollow-lantern';
  if (['mill-hand', 'hook-carver', 'saw-priest', 'foreman-red'].includes(key)) return 'bone-brute';
  return 'cultist';
}

function enemyFamily(key) {
  if (['frost-wolf', 'ice-stalker', 'white-maw', 'winter-alpha'].includes(key)) return 'frozen';
  if (['bone-picker', 'scrap-thrower', 'pit-brute', 'bone-king'].includes(key)) return 'bone';
  if (['hollow-wisp', 'veil-touched', 'fear-eater', 'hollow-saint'].includes(key)) return 'hollow';
  if (['mill-hand', 'hook-carver', 'saw-priest', 'foreman-red'].includes(key)) return 'sawmill';
  return 'cult';
}

function handCardId(entry) {
  return typeof entry === 'string' ? entry : entry && entry.id;
}

function cardHtml(c, i, fresh = false) {
  const playCost = effectiveCost(c);
  const disabled = playCost > state.actions;
  return `<button class="card rarity-${rarityKey(c)} ${cardArtClass(c)} ${disabled ? 'disabled' : ''} ${fresh ? 'fresh-draw' : ''}" style="${cardArtStyle(c)}" data-index="${i}" type="button">
    <div class="card-top"><span class="cost">${playCost}</span><h3>${c.name}</h3></div>
    <span class="card-type">${c.type} · ${displayRarity(c)}</span>
    <span class="card-scope">${cardScope(c)}</span>
    <p>${c.text}</p>
  </button>`;
}

function playCard(index) {
  const id = handCardId(state.hand[index]);
  const c = card(id);
  const playCost = c ? effectiveCost(c) : 0;
  if (!c || playCost > state.actions || state.huntLost) return;
  state.actions -= playCost;
  state.hand.splice(index, 1);
  state.discard.push(id);
  const before = target();
  c.effect({ target: before });
  cleanupDead();
  const after = target();
  if (before && before.hp <= 0 && after && before.id !== after.id && cardScope(c) === 'Target') {
    log(`New target: ${after.name}.`);
  }
  if (encounterCleared()) winEncounter();
  renderCombat();
}

function attack(g, base, status = {}, source = 'Delilah') {
  const e = g.target;
  let dmg = base + (e.status.exposed ? 2 : 0) + state.nextTurnBonus;
  if (state.nextAttackCharges > 0) {
    dmg += state.nextAttackChargeBonus || 0;
    state.nextAttackCharges -= 1;
  }
  if (state.nextBleed) status.bleed = (status.bleed || 0) + state.nextBleed;
  if (state.nextTerror) status.terrified = (status.terrified || 0) + state.nextTerror;
  state.nextBleed = 0;
  state.nextTurnBonus = 0;
  state.nextTerror = 0;
  e.hp = Math.max(0, e.hp - dmg);
  Object.entries(status).forEach(([k, v]) => addStatus(e, k, v));
  log(`<b>${source}</b> hits ${e.name} for ${dmg}.`);
}

function target() {
  return state.enemies.find(e => e.id === state.targetId && e.hp > 0) || state.enemies.find(e => e.hp > 0) || state.enemies[0];
}

function cardScope(c) {
  if (['rain-bolts', 'black-rain', 'shatter-rite', 'moon-hunt'].includes(c.id)) return 'All Enemies';
  if (['snare', 'tripwire', 'funnel', 'trapline-map', 'spear-wall', 'kill-lane', 'grave-silence'].includes(c.id)) return 'Battlefield';
  if (['scent', 'lunge', 'step', 'poison', 'silent', 'bandage', 'last-breath', 'low-guard', 'field-dressing', 'wolf-glance', 'ash-breath', 'quick-cache', 'hard-pivot', 'five-count', 'bone-whistle', 'red-door', 'wolf-saint', 'black-road-myth'].includes(c.id)) return 'No Target';
  return 'Target';
}

function effectiveCost(c) {
  if (state.syncDiscount && c.type === 'Synchronized') return Math.max(0, c.cost - 1);
  return c.cost;
}

function normalizedRarity(rarity) {
  return ({ Roadworn: 'Common', Sharp: 'Uncommon', Blackmark: 'Rare' })[rarity] || rarity;
}

function displayRarity(c) {
  return normalizedRarity(c.rarity);
}

function rarityKey(c) {
  return displayRarity(c).toLowerCase();
}

function cardArtType(c) {
  const type = c.type === 'Legend' ? 'Synchronized' : c.type;
  return ['Attack', 'Instinct', 'Tactic', 'Preparation', 'Survival', 'Synchronized'].includes(type) ? type.toLowerCase() : 'tactic';
}

function cardArtUrl(c) {
  return `assets/card-art-${cardArtType(c)}.png`;
}

function cardArtClass(c) {
  return `card-art-${cardArtType(c)}`;
}

function cardArtStyle(c) {
  return `--card-art:url(${cardArtUrl(c)})`;
}

function recommendedCardIds() {
  const shared = ['sync', 'pack-angle', 'pack', 'field-dressing', 'lunge', 'low-guard', 'step'];
  const byContract = {
    'black-veil': ['scent', 'growl', 'poison', 'hamstring', 'bloodmark', 'snare', 'trapline-map', 'kill-lane', 'fear-break', 'grave-silence', 'obelisk', 'shatter-rite', 'bone-whistle', 'done-here'],
    frozen: ['scent', 'wolf-glance', 'pack', 'bite-command', 'lunge', 'field-dressing', 'hard-pivot', 'moon-hunt', 'wolf-saint'],
    bone: ['snare', 'tripwire', 'funnel', 'kill-lane', 'black-rain', 'rain-bolts', 'red-thread', 'spear-wall'],
    hollow: ['scent', 'growl', 'fear-break', 'bone-whistle', 'wolf-saint', 'shared-pulse', 'last-breath'],
    sawmill: ['obelisk', 'shatter-rite', 'silent', 'moon-ambush', 'red-door', 'grave-silence', 'done-here']
  };
  const deckIds = new Set(state.activeDeck);
  return new Set([...(byContract[selectedContract.id] || []), ...shared].filter(id => deckIds.has(id)));
}

function recommendationLine() {
  const count = [...recommendedCardIds()].length;
  const suffix = count ? ` ${count} cards marked from what you brought.` : ' Nothing here worth marking.';
  const line = ({
    'black-veil': 'Ritual site. End it fast.',
    frozen: 'Poor visibility. Stay close.',
    bone: 'Too many moving targets.',
    hollow: "They'll try to split us.",
    sawmill: 'Take bleed. Finish quickly.'
  })[selectedContract.id] || 'Bring traps.';
  return `${line}${suffix}`;
}

function ownedCardCount() {
  return Object.values(state.owned).reduce((sum, count) => sum + count, 0);
}

function cardPower(c) {
  if (!c) return 0;
  const rarity = { Common: 10, Uncommon: 16, Rare: 25, Epic: 38, Legendary: 58 }[displayRarity(c)] || 10;
  const typeBonus = c.type === 'Synchronized' ? 3 : c.type === 'Legend' ? 5 : 0;
  const costBonus = Math.max(0, c.cost - 1);
  return rarity + typeBonus + costBonus;
}

function deckPower() {
  if (!state.activeDeck.length) return 0;
  const activeScore = state.activeDeck.reduce((sum, id) => sum + cardPower(card(id)), 0) / state.activeDeck.length;
  const collectionBonus = Math.min(12, Math.max(0, ownedCardCount() - 20) * .8);
  const winBonus = Math.min(10, state.battlesWon * .7);
  return Math.round(activeScore + collectionBonus + winBonus);
}

function reputationForRank(rank) {
  if (rank >= 10) return 'Mythic';
  if (rank >= 7) return 'Feared';
  if (rank >= 4) return 'Renowned';
  if (rank >= 2) return 'Known';
  return 'Unknown';
}

function syncProgression() {
  state.deckRating = deckPower();
  state.rank = Math.max(1, Math.min(12, Math.floor(Math.max(0, state.deckRating - 12) / 9) + 1));
  state.rep = reputationForRank(state.rank);
}

function addStatus(e, k, v) {
  e.status[k] = Math.max(e.status[k] || 0, v);
}

function gainActions(n, why) {
  state.actions = Math.min(state.maxActions, state.actions + n);
  log(`+${n} Action from ${why}.`);
}

function heal(who, n) {
  const h = state[who];
  h.hp = Math.min(h.max, h.hp + n);
}

function endTurn() {
  if (state.huntLost || !state.enemies.some(e => e.hp > 0)) return;
  enemiesAct();
  tickStatuses();
  if (state.delilah.hp <= 0 || state.lady.hp <= 0) {
    loseHunt('Delilah and Lady are forced out of the fight.');
    renderCombat();
    return;
  }
  if (encounterCleared()) {
    winEncounter();
    renderCombat();
    return;
  }
  if (state.turn >= MAX_TURNS) {
    loseHunt('The ritual completes before Delilah can break the camp.');
    renderCombat();
    return;
  }
  if (state.fiveCount && state.actions === 0) {
    heal('delilah', 5);
    log('Five Count pays off. Delilah recovers 5.');
  }
  state.turn += 1;
  state.actions = Math.max(1, state.maxActions - (state.nextActionPenalty || 0));
  state.nextActionPenalty = 0;
  state.guard = 0;
  state.dodge = 0;
  state.fiveCount = false;
  state.syncDiscount = false;
  draw(Math.max(0, 5 - state.hand.length));
  state.enemies.forEach(e => { e.acted = false; e.intent = nextIntent(e); });
  if (state.delilah.hp <= 0 || state.lady.hp <= 0) loseHunt();
  renderCombat();
}

function enemiesAct() {
  state.enemyActionText = '';
  state.enemyActionPulse = '';
  state.enemyActionEvents = [];
  state.enemies.filter(e => e.hp > 0).forEach(e => {
    if (e.status.root) { log(`${e.name} is rooted and loses position.`); return; }
    if (state.traps && movingIntent(e)) {
      state.traps -= 1;
      e.hp = Math.max(0, e.hp - 7);
      addStatus(e, 'root', 1);
      announceEnemy(e, 'triggers Delilah\'s snare', '7 damage and Root', 'enemy-trap');
      log(`${e.name} triggers a snare for 7.`);
      if (state.funnel) addStatus(e, 'exposed', 2);
      return;
    }
    resolveEnemyBehavior(e);
    e.acted = true;
  });
  state.guardAll = false;
  state.retaliate = 0;
  state.silenceReinforcements = false;
  cleanupDead();
}

function resolveIntent(e) {
  if (e.intent.includes('Defend')) { e.hp = Math.min(e.max, e.hp + 4); announceEnemy(e, 'seals a wound', '+4 HP', 'enemy-heal'); log(`${e.name} seals a wound.`); return; }
  if (e.intent.includes('Reinforcements') || e.intent.includes('Call Raiders') || e.intent.includes('Call Workers') || e.intent.includes('Pack Command')) {
    if (state.silenceReinforcements) {
      announceEnemy(e, 'calls for reinforcements', 'Silenced', 'enemy-block');
      log(`${e.name} calls out, but Grave Silence smothers the sound.`);
      return;
    }
    const living = state.enemies.filter(enemy => enemy.hp > 0).length;
    if (state.reinforcements >= MAX_REINFORCEMENTS || living >= MAX_ENEMIES) {
      announceEnemy(e, 'calls into the trees', 'No answer', 'enemy-block');
      log(`${e.name} calls into the trees. No one else answers.`);
      return;
    }
    state.reinforcements += 1;
    const called = makeEnemy(reinforcementKey(), state.enemies.length, false, true);
    state.enemies.push(called);
    announceEnemy(e, 'calls reinforcements', `+1 ${called.name}`, 'enemy-summon');
    log(`${e.name} calls another enemy from the dark.`);
    return;
  }
  if (e.intent.includes('Trap')) { state.bleed += 1; announceEnemy(e, 'opens a poison trap', 'Bleed +1 to Delilah', 'enemy-trap'); log(`${e.name} opens a poison trap. Delilah gains Bleed.`); return; }
  if (e.intent.includes('Ritual') || e.intent.includes('Obelisk')) { applyDamage('delilah', 3, e, e.intent); applyDamage('lady', 3, e, e.intent); log(`${e.name}'s ritual hurts both hunters.`); return; }
  let dmg = Math.max(0, e.dmg - (e.status.weakened ? 3 : 0));
  if (state.guardAll) { announceEnemy(e, e.intent, 'Blocked', 'enemy-block'); log(`Wolf Saint blocks ${e.name}.`); return; }
  if (state.dodge) { state.dodge -= 1; announceEnemy(e, e.intent, 'Dodged', 'enemy-block'); log(`Delilah dodges ${e.name}.`); return; }
  if (state.guard) { state.guard -= 1; applyDamage('lady', Math.ceil(dmg / 2), e, e.intent); log(`Lady absorbs the strike for ${Math.ceil(dmg / 2)}.`); return; }
  const target = enemyDamageTarget(e);
  applyDamage(target, dmg, e, e.intent);
  if (state.retaliate) {
    e.hp = Math.max(0, e.hp - state.retaliate);
    log(`${e.name} takes ${state.retaliate} from Spear Wall.`);
  }
  log(`${e.name} hits ${target === 'lady' ? 'Lady' : 'Delilah'} for ${dmg}.`);
}

function resolveEnemyBehavior(e) {
  const behavior = e.behavior;
  if (!behavior) {
    resolveIntent(e);
    return;
  }
  debugEvent(`${e.name} executes ${behavior.label}.`);
  if (behavior.kind === 'damage') {
    enemyStrike(e, Math.max(1, e.dmg + (behavior.dmg || 0) + (e.escalation || 0)), behavior.label);
    return;
  }
  if (behavior.kind === 'punishDodge') {
    if (state.dodge) {
      state.dodge = 0;
      enemyStrike(e, Math.max(1, e.dmg + 1 + (e.escalation || 0)), behavior.label);
      log(`${e.name} cuts off Delilah's dodge.`);
    } else {
      enemyStrike(e, Math.max(1, e.dmg - 1 + (e.escalation || 0)), behavior.label);
    }
    return;
  }
  if (behavior.kind === 'combo') {
    const marked = state.enemies.some(enemy => enemy.hp > 0 && (enemy.status.bleed || enemy.status.flanked || enemy.status.exposed));
    enemyStrike(e, Math.max(1, e.dmg + (marked ? 3 : 0) + (e.escalation || 0)), behavior.label);
    if (marked) log(`${e.name} exploits the broken line.`);
    return;
  }
  if (behavior.kind === 'pressure') {
    state.nextActionPenalty = Math.max(state.nextActionPenalty || 0, 1);
    announceEnemy(e, behavior.label, '-1 Action next round', 'enemy-block');
    log(`${e.name} presses Delilah's tempo. Next round starts down 1 Action.`);
    return;
  }
  if (behavior.kind === 'cleanse') {
    const removed = cleanseEnemyStatuses(e);
    e.hp = Math.min(e.max, e.hp + 2);
    announceEnemy(e, behavior.label, removed ? 'cleansed debuffs' : '+2 HP', 'enemy-heal');
    log(`${e.name} cleanses the worst of the hunt.`);
    return;
  }
  if (behavior.kind === 'disrupt') {
    const hitSetup = state.nextBleed || state.nextTurnBonus || state.nextTerror || state.nextAttackCharges || state.syncDiscount;
    state.nextBleed = 0;
    state.nextTurnBonus = Math.max(0, state.nextTurnBonus - 3);
    state.nextTerror = 0;
    state.nextAttackCharges = Math.max(0, (state.nextAttackCharges || 0) - 1);
    state.syncDiscount = false;
    state.ladyInstinct = Math.max(0, state.ladyInstinct - 1);
    announceEnemy(e, behavior.label, hitSetup ? 'setup disrupted' : 'Lady instinct -1', 'enemy-block');
    log(`${e.name} disrupts Delilah's setup.`);
    return;
  }
  if (behavior.kind === 'breakTrap') {
    if (state.traps) {
      const broken = Math.min(state.traps, 1 + (selectedContract.threat >= 4 ? 1 : 0));
      state.traps -= broken;
      announceEnemy(e, behavior.label, `${broken} trap${broken === 1 ? '' : 's'} cleared`, 'enemy-trap');
      log(`${e.name} sweeps the ground and clears ${broken} trap${broken === 1 ? '' : 's'}.`);
    } else {
      enemyStrike(e, Math.max(1, e.dmg - 2), behavior.label);
    }
    return;
  }
  if (behavior.kind === 'actionTax') {
    state.nextActionPenalty = Math.max(state.nextActionPenalty || 0, 1);
    enemyStrike(e, Math.max(1, e.dmg - 2), behavior.label);
    log(`${e.name} forces a bad angle. Next round starts down 1 Action.`);
    return;
  }
  if (behavior.kind === 'escalate') {
    e.escalation = Math.min(5, (e.escalation || 0) + 1);
    addStatus(e, 'terrified', 0);
    announceEnemy(e, behavior.label, `threat +${e.escalation}`, 'enemy-summon');
    log(`${e.name}'s danger escalates.`);
    return;
  }
  if (behavior.kind === 'ritual') {
    const amount = Math.max(2, 2 + (e.escalation || 0) + Math.floor((selectedContract.threat || 1) / 2));
    applyDamage('delilah', amount, e, behavior.label);
    applyDamage('lady', Math.max(1, amount - 1), e, behavior.label);
    log(`${e.name}'s ritual pressures both hunters.`);
    return;
  }
  if (behavior.kind === 'defend') {
    e.hp = Math.min(e.max, e.hp + 4 + (e.escalation || 0));
    addStatus(e, 'weakened', 0);
    announceEnemy(e, behavior.label, `+${4 + (e.escalation || 0)} HP`, 'enemy-heal');
    log(`${e.name} takes a defensive stance.`);
    return;
  }
  if (behavior.kind === 'summon') {
    summonEnemy(e, behavior.label);
    return;
  }
  if (behavior.kind === 'mark') {
    state.bleed += 1;
    enemyStrike(e, Math.max(1, e.dmg - 1 + (e.escalation || 0)), behavior.label);
    log(`${e.name} marks Delilah. Bleed increases.`);
    return;
  }
  resolveIntent(e);
}

function enemyStrike(e, dmg, action) {
  const amount = Math.max(0, dmg - (e.status.weakened ? 3 : 0));
  if (state.guardAll) { announceEnemy(e, action, 'Blocked', 'enemy-block'); log(`Wolf Saint blocks ${e.name}.`); return; }
  if (state.dodge) { state.dodge -= 1; announceEnemy(e, action, 'Dodged', 'enemy-block'); log(`Delilah dodges ${e.name}.`); return; }
  if (state.guard) { state.guard -= 1; applyDamage('lady', Math.ceil(amount / 2), e, action); log(`Lady absorbs the strike for ${Math.ceil(amount / 2)}.`); return; }
  const target = enemyDamageTarget(e);
  applyDamage(target, amount, e, action);
  if (state.retaliate) {
    e.hp = Math.max(0, e.hp - state.retaliate);
    log(`${e.name} takes ${state.retaliate} from Spear Wall.`);
  }
  log(`${e.name} hits ${target === 'lady' ? 'Lady' : 'Delilah'} for ${amount}.`);
}

function summonEnemy(e, action) {
  if (state.silenceReinforcements) {
    announceEnemy(e, action, 'Silenced', 'enemy-block');
    log(`${e.name} calls out, but Grave Silence smothers the sound.`);
    return;
  }
  const living = state.enemies.filter(enemy => enemy.hp > 0).length;
  if (state.reinforcements >= MAX_REINFORCEMENTS || living >= MAX_ENEMIES) {
    announceEnemy(e, action, 'No answer', 'enemy-block');
    log(`${e.name} calls into the trees. No one else answers.`);
    return;
  }
  state.reinforcements += 1;
  const called = makeEnemy(reinforcementKey(), state.enemies.length, false, true);
  state.enemies.push(called);
  announceEnemy(e, action, `+1 ${called.name}`, 'enemy-summon');
  log(`${e.name} calls another enemy from the dark.`);
}

function cleanseEnemyStatuses(e) {
  const keys = ['bleed', 'exposed', 'flanked', 'terrified', 'root', 'weakened'];
  const active = keys.filter(k => e.status[k] > 0);
  active.slice(0, 2).forEach(k => e.status[k] = 0);
  return active.length;
}

function enemyDamageTarget(e) {
  const delilahPressure = 1 - (state.delilah.hp / state.delilah.max);
  const ladyPressure = 1 - (state.lady.hp / state.lady.max);
  if (/Bite|Pounce|Howl|Pack|Wolf|Maw|Stalker/i.test(e.intent) || enemyFamily(e.key) === 'frozen') return 'lady';
  if (/Hook|Chain|Drag|Pin|Touch|Fade|Drift|Pulse/i.test(e.intent)) return Math.random() < .55 ? 'lady' : 'delilah';
  if (delilahPressure > ladyPressure + .22) return 'lady';
  if (ladyPressure > delilahPressure + .32) return 'delilah';
  return Math.random() < .34 ? 'lady' : 'delilah';
}

function applyDamage(who, amount, enemy, action) {
  state[who].hp = Math.max(0, state[who].hp - amount);
  const name = who === 'lady' ? 'Lady' : 'Delilah';
  announceEnemy(enemy, action, `${amount} damage to ${name}`, who === 'lady' ? 'enemy-hit-lady' : 'enemy-hit-delilah');
}

function announceEnemy(enemy, action, result, pulse = '') {
  state.enemyActionText = `${enemy.name}: ${action} - ${result}`;
  state.enemyActionPulse = pulse;
  state.enemyActionEvents = [...(state.enemyActionEvents || []), { text: state.enemyActionText, pulse }].slice(-5);
}

function tickStatuses() {
  if (state.bleed) {
    state.delilah.hp = Math.max(0, state.delilah.hp - state.bleed);
    log(`Bleed costs Delilah ${state.bleed}.`);
  }
  state.enemies.forEach(e => {
    if (e.status.bleed) {
      e.hp = Math.max(0, e.hp - e.status.bleed);
      log(`${e.name} bleeds for ${e.status.bleed}.`);
    }
    Object.keys(e.status).forEach(k => e.status[k] = Math.max(0, e.status[k] - 1));
  });
  cleanupDead();
}

function cleanupDead() {
  state.enemies.forEach(e => { if (e.hp <= 0) e.hp = 0; });
}

function encounterCleared() {
  return !state.enemies.some(e => e.hp > 0 && !e.summoned);
}

function winEncounter() {
  debugEvent(`Victory in ${state.turn} rounds. Delilah ${state.delilah.hp}/${state.delilah.max}, Lady ${state.lady.hp}/${state.lady.max}.`);
  state.battlesWon += 1;
  state.hunterXP += 80 + (selectedContract.threat || 1) * 25 + state.encounter * 15;
  state.scrap += 10 + state.encounter * 5;
  state.difficultyProgress[selectedContract.id] = Math.max(state.difficultyProgress[selectedContract.id] || 0, state.encounter + 1);
  state.unlockedHunts = [...new Set([...(state.unlockedHunts || ['black-veil']), selectedContract.id])];
  syncProgression();
  saveProgress();
  if (state.encounter >= currentEncounters().length - 1) {
    state.completed.push(selectedContract.id);
    syncProgression();
    log('<b>Elite hunt complete.</b> The Black Veil breaks.');
    showVictoryCachePrompt(true);
    return;
  }
  state.encounter += 1;
  showVictoryCachePrompt(false);
}

function loseHunt(reason = 'Return to the board and rebuild.') {
  debugEvent(`Defeat on round ${state.turn}. Reason: ${reason}`);
  log(`<b>The hunt fails.</b> ${reason}`);
  state.actions = 0;
  state.huntLost = true;
  state.defeatReason = reason;
  showDefeatDialog(reason);
}

function showDefeatDialog(reason) {
  if (state.defeatShown) return;
  state.defeatShown = true;
  setTimeout(() => {
    const dialog = $('defeatDialog');
    if (!dialog || dialog.open) return;
    $('defeatTitle').textContent = `${selectedContract.name} holds.`;
    $('defeatText').textContent = `${reason} Return to the map, rebuild your deck, or retry this hunt at full health.`;
    dialog.showModal();
  }, 250);
}

function showVictoryCachePrompt(final) {
  pendingVictoryFinal = final;
  const title = final ? `${selectedContract.name} is broken.` : 'The battle is won.';
  const text = final
    ? `Congratulations. You completed the hunt. Proceed to the winner's cache and claim the card the camp left behind.`
    : `Congratulations. You won the battle. Proceed to the winner's cache and reveal the card you earned.`;
  $('victoryTitle').textContent = title;
  $('victoryText').textContent = text;
  setTimeout(() => {
    if (!$('rewardDialog').open && !$('victoryDialog').open) $('victoryDialog').showModal();
  }, 450);
}

function reward(final, revealFromBack = false) {
  renderResources();
  state.pendingFinal = final;
  state.pendingRewardCard = randomRewardCard();
  if (revealFromBack) renderRewardCardBack();
  else renderCardReward();
  $('rewardDialog').showModal();
  if (revealFromBack) setTimeout(renderCardReward, 1800);
}

function renderRewardCardBack() {
  $('rewardTitle').textContent = 'The winner\'s cache opens...';
  $('rewardChoices').innerHTML = `
    <div class="reward-odds">${formatRewardOdds()}</div>
    <div class="reward-card-wrap">
      <article class="reward-card-preview reward-card-back reveal-cache-card" aria-label="Face-down reward card"></article>
    </div>
  `;
}

function renderCardReward() {
  const c = state.pendingRewardCard;
  $('rewardTitle').textContent = state.pendingFinal ? 'The Ritual Leader falls. Claim your card.' : 'You won a new card.';
  $('rewardChoices').innerHTML = `
    <div class="reward-odds">${formatRewardOdds()}</div>
    ${rewardCardHtml(c)}
    <button class="reward-choice" id="keepRewardBtn" type="button"><b>Keep Card</b><span>Add this card to your permanent archive.</span></button>
    <button class="reward-choice" id="gambleRewardBtn" type="button"><b>Gamble</b><span>Trade it for one of three unknown cards.</span></button>
    <button class="reward-choice" id="scrapRewardBtn" type="button"><b>Scrap For Marks</b><span>Gain ${scrapValue(c)} Hunter Marks instead.</span></button>
  `;
  $('keepRewardBtn').addEventListener('click', () => claimRewardCard(c));
  $('gambleRewardBtn').addEventListener('click', renderGambleReward);
  $('scrapRewardBtn').addEventListener('click', () => scrapRewardCard(c));
}

function renderGambleReward() {
  const picks = Array.from({ length: 3 }, randomRewardCard);
  $('rewardTitle').textContent = 'Choose one unknown card.';
  $('rewardChoices').innerHTML = `<div class="reward-odds">${formatRewardOdds()}</div>${picks.map((_, i) => `<button class="reward-choice face-down" data-pick="${i}" type="button"><b>?</b></button>`).join('')}`;
  document.querySelectorAll('[data-pick]').forEach(btn => {
    btn.addEventListener('click', () => renderGambleResult(picks[Number(btn.dataset.pick)]));
  });
}

function renderGambleResult(c) {
  state.pendingRewardCard = c;
  $('rewardTitle').textContent = `You revealed ${c.name}.`;
  $('rewardChoices').innerHTML = `
    <div class="reward-odds">${formatRewardOdds()}</div>
    ${rewardCardHtml(c)}
    <button class="reward-choice" id="claimGambleBtn" type="button"><b>Keep Card</b><span>Add this gambled card to your archive.</span></button>
    <button class="reward-choice" id="scrapGambleBtn" type="button"><b>Scrap For Marks</b><span>Gain ${scrapValue(c)} Hunter Marks instead.</span></button>
  `;
  $('claimGambleBtn').addEventListener('click', () => claimRewardCard(c));
  $('scrapGambleBtn').addEventListener('click', () => scrapRewardCard(c));
}

function rewardCardHtml(c) {
  return `<div class="reward-card-wrap">
    <article class="reward-card-preview rarity-${rarityKey(c)} ${cardArtClass(c)}" style="${cardArtStyle(c)}">
      <div class="card-top"><span class="cost">${c.cost}</span><h3>${c.name}</h3></div>
      <span class="card-type">${c.type} Â· ${displayRarity(c)}</span>
      <span class="card-scope">${cardScope(c)}</span>
      <p>${c.text}</p>
      <small>Owned: ${state.owned[c.id] || 0}</small>
    </article>
  </div>`;
}

function claimRewardCard(c) {
  state.owned[c.id] = (state.owned[c.id] || 0) + 1;
  log(`${c.name} added to the permanent archive.`);
  finishReward();
}

function scrapRewardCard(c) {
  const marks = scrapValue(c);
  state.marks += marks;
  log(`${c.name} scrapped for ${marks} Hunter Marks.`);
  finishReward();
}

function finishReward() {
  renderResources();
  saveProgress();
  $('rewardDialog').close();
  if (state.pendingFinal) {
    showBoard();
    return;
  }
  showRouteChoice();
}

function showRouteChoice() {
  $('routeTitle').textContent = `Battle ${state.encounter} cleared.`;
  $('routeText').textContent = 'Return to the hunt map or attack the same camp again. Continuing restores Delilah and Lady to full health before the next fight.';
  $('routeDialog').showModal();
}

function randomRewardCard() {
  const roll = Math.random() * 100;
  const odds = rewardOdds();
  let running = 0;
  let rarity = 'Common';
  for (const [name, chance] of Object.entries(odds)) {
    running += chance;
    if (roll <= running) {
      rarity = name;
      break;
    }
  }
  const pool = cards.filter(c => displayRarity(c) === rarity);
  return shuffle(pool.length ? pool : cards)[0];
}

function rewardOdds() {
  const wins = Math.max(1, state.battlesWon || 1);
  const riskBonus = Math.max(0, (selectedContract.threat || 1) - 1);
  const legendary = Math.min(22, 1 + Math.max(0, wins - 1) * 1.75 + riskBonus * 1.8);
  const epic = Math.min(28, 8 + wins * 1.1 + riskBonus * 2.5);
  const rare = Math.min(32, 18 + wins * .8 + riskBonus * 2);
  const uncommon = 34;
  const common = Math.max(5, 100 - legendary - epic - rare - uncommon);
  const total = common + uncommon + rare + epic + legendary;
  return {
    Common: +(common * 100 / total).toFixed(1),
    Uncommon: +(uncommon * 100 / total).toFixed(1),
    Rare: +(rare * 100 / total).toFixed(1),
    Epic: +(epic * 100 / total).toFixed(1),
    Legendary: +(legendary * 100 / total).toFixed(1)
  };
}

function formatRewardOdds() {
  const odds = rewardOdds();
  return `Reward odds: Common ${odds.Common}% | Uncommon ${odds.Uncommon}% | Rare ${odds.Rare}% | Epic ${odds.Epic}% | Legendary ${odds.Legendary}%`;
}

function scrapValue(c) {
  return ({ Common: 20, Uncommon: 35, Rare: 60, Epic: 100, Legendary: 180 })[displayRarity(c)] || 25;
}

function rewardOptions(final) {
  const pool = shuffle(cards.filter(c => (state.owned[c.id] || 0) < 3 && (final || c.rarity !== 'Rare')));
  const opts = pool.slice(0, relic('Hunter’s Compass') ? 3 : 2).map(c => ({
    title: `Add ${c.name}`,
    text: `${c.type}. ${c.text}`,
    take: () => { state.owned[c.id] = (state.owned[c.id] || 0) + 1; state.activeDeck.push(c.id); while (state.activeDeck.length > 20) state.activeDeck.shift(); log(`${c.name} added to the archive.`); }
  }));
  if (final) opts.push({ title: 'Gamble: Blood Relic', text: 'Spend 120 Scrap for a relic. The world gets meaner.', take: () => { state.scrap = Math.max(0, state.scrap - 120); const r = shuffle(relics.filter(x => !state.relics.includes(x.name)))[0]; if (r) state.relics.push(r.name); state.bond += 1; } });
  opts.push({ title: 'Scrap The Cache', text: 'Gain 140 Scrap and 90 Hunter Marks.', take: () => { state.scrap += 140; state.marks += 90; } });
  return opts.slice(0, 3);
}

function camp() {
  if (state.scrap < 15) { log('Camp repair costs 15 scrap.'); renderCombat(); return; }
  state.scrap -= 15;
  heal('delilah', 8);
  heal('lady', 8);
  log('A short camp restores both hunters.');
  renderCombat();
}

function nextIntent(e) {
  e.behavior = chooseEnemyBehavior(e);
  debugEvent(`${e.name} selected ${e.behavior.label} (${e.archetype}).`);
  return e.behavior.label;
}

function intentText(e) {
  const behavior = e.behavior || { label: e.intent, telegraph: e.intent };
  if (!state.intentClear && !e.status.bleed && !relic('Blood Lantern')) return `${e.name}: ${behavior.telegraph || 'Hostile movement'}`;
  return `${e.name}: ${behavior.label} - ${behavior.telegraph || 'Hostile movement'}`;
}

function movingIntent(enemyOrIntent) {
  const behavior = typeof enemyOrIntent === 'object' ? enemyOrIntent.behavior : null;
  const intent = typeof enemyOrIntent === 'string' ? enemyOrIntent : enemyOrIntent.intent;
  return Boolean(behavior && behavior.moving) || /Rush|Retreat|Stab|Cull|Strike|Escape|Combo|Cut/.test(intent);
}

function chooseEnemyBehavior(e) {
  if (e.summoned) {
    const quick = behaviorPools.aggressive.find(b => b.id === 'quick-strike');
    const poison = { id: 'summoned-poison', label: 'Poison Throw', telegraph: 'Poison pressure', weight: 1, kind: 'mark', moving: false };
    return Math.random() < .72 ? quick : poison;
  }
  const pool = behaviorPools[e.archetype] || behaviorPools.aggressive;
  const weighted = pool.map(b => ({ ...b, score: behaviorWeight(e, b) })).filter(b => b.score > 0);
  const total = weighted.reduce((sum, b) => sum + b.score, 0);
  let roll = Math.random() * total;
  for (const b of weighted) {
    roll -= b.score;
    if (roll <= 0) return b;
  }
  return weighted[0] || pool[0];
}

function behaviorWeight(e, behavior) {
  let weight = behavior.weight || 10;
  const statusPressure = Object.values(e.status || {}).some(v => v > 0);
  const setupPressure = state.nextBleed || state.nextTurnBonus || state.nextTerror || state.nextAttackCharges || state.syncDiscount || state.ladyInstinct > 2;
  if (behavior.kind === 'cleanse') weight += statusPressure ? 38 : -16;
  if (behavior.kind === 'breakTrap') weight += state.traps ? 38 : -10;
  if (behavior.kind === 'disrupt') weight += setupPressure ? 30 : -5;
  if (behavior.kind === 'punishDodge') weight += state.dodge ? 34 : -8;
  if (behavior.kind === 'combo') weight += state.enemies.some(enemy => enemy.hp > 0 && (enemy.status.bleed || enemy.status.flanked || enemy.status.exposed)) ? 20 : -4;
  if (behavior.kind === 'escalate') weight += Math.max(0, state.turn - 1) * 8;
  if (behavior.kind === 'ritual') weight += (e.escalation || 0) * 9 + state.turn * 2;
  if (behavior.kind === 'summon') weight += state.reinforcements || state.enemies.filter(enemy => enemy.hp > 0).length >= MAX_ENEMIES ? -30 : 12;
  if (behavior.id === 'heavy-strike') weight += state.turn >= 4 ? 10 : 0;
  if (e.elite) weight += ['escalate', 'ritual', 'heavy-strike', 'disrupt'].includes(behavior.kind) ? 8 : 0;
  return Math.max(1, weight);
}

function archetypeLabel(e) {
  return ({ aggressive: 'Aggressive', control: 'Control', escalation: 'Escalation' })[e.archetype] || 'Aggressive';
}

function debugEvent(message) {
  state.debugEvents = [`[T${state.turn}] ${message}`, ...(state.debugEvents || [])].slice(0, 12);
}

function card(id) { return cards.find(c => c.id === id); }
function relic(name) { return state.relics.includes(name); }
function shuffle(arr) { return [...arr].sort(() => Math.random() - .5); }
function log(msg) { state.log.unshift(msg); state.log = state.log.slice(0, 12); }

init();
