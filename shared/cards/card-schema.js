(function (global) {
  'use strict';

  const SCHEMA_VERSION = 3;
  const typeAliases = {
    precision: 'Tactic', tactic: 'Tactic', trap: 'Trap',
    instinct: 'Instinct', companion: 'Instinct',
    guard: 'Survival', survival: 'Survival',
    preparation: 'Preparation', synchronized: 'Synchronized',
    synchronize: 'Synchronized', legend: 'Synchronized', attack: 'Attack'
  };
  const rarityAliases = {
    common: 'Roadworn', roadworn: 'Roadworn',
    uncommon: 'Sharp', sharp: 'Sharp',
    rare: 'Blackmark', blackmark: 'Blackmark', epic: 'Blackmark',
    legendary: 'Legendary', mythic: 'Legendary', forged: 'Forged'
  };
  const keywordPattern = /\b(Bleed(?:ing)?|Execute|Exposed|Flanked|Root(?:ed)?|Terrified|Weakened|Dodge|Guard|Instinct|Trap|Moving|Not Acted|Exhaust|Draw|Heal|Recover)\b/gi;

  const text = (value = '') => String(value ?? '').trim();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max, fallback) => Math.min(max, Math.max(min, number(value, fallback)));
  const unique = values => [...new Set(values.map(text).filter(Boolean))];

  function normalizeArtwork(value, embedded) {
    const source = embedded || value;
    if (typeof source === 'string') return { src: source, focalX: 50, focalY: 50, zoom: 1 };
    return {
      src: text(source?.src),
      focalX: clamp(source?.focalX, 0, 100, 50),
      focalY: clamp(source?.focalY, 0, 100, 50),
      zoom: clamp(source?.zoom, 1, 3, 1)
    };
  }

  function normalizeRule(rule) {
    if (typeof rule === 'string') return { kind: 'text', text: rule };
    if (!rule || typeof rule !== 'object') return null;
    return { ...rule, kind: text(rule.kind || rule.action || rule.type || 'text') };
  }

  function rulesTextFrom(card, rules) {
    const direct = text(card.rulesText || card.text);
    if (direct) return direct;
    return rules.map(rule => text(rule.text)).filter(Boolean).join(' ') || 'No rules text provided.';
  }

  function normalizeGame(card) {
    const game = card.game && typeof card.game === 'object' ? card.game : {};
    const effects = Array.isArray(game.effects) ? game.effects
      : Array.isArray(card.effects) ? card.effects
      : [];
    return {
      ...game,
      target: text(game.target || card.target || 'enemy'),
      power: number(game.power ?? card.power, 0),
      exhaust: Boolean(game.exhaust ?? card.exhaust),
      upgradeable: Boolean(game.upgradeable ?? card.upgradeable),
      effects: effects.map(effect => ({ ...effect }))
    };
  }

  function normalize(card = {}) {
    const rawType = text(card.type || card.archetype || 'Preparation');
    const rawRarity = text(card.rarity || 'Common');
    const rules = (Array.isArray(card.rules) ? card.rules : [])
      .map(normalizeRule)
      .filter(Boolean);
    const rulesText = rulesTextFrom(card, rules);
    if (!rules.length) rules.push({ kind: 'text', text: rulesText });
    const inferred = (rulesText.match(keywordPattern) || [])
      .map(value => value.replace(/^Bleeding$/i, 'Bleed').replace(/^Rooted$/i, 'Root'));
    const normalized = {
      ...card,
      schemaVersion: SCHEMA_VERSION,
      id: text(card.id || card.cardId || `card-${Date.now()}`),
      name: text(card.name || card.title || 'Untitled Card'),
      cardNumber: text(card.cardNumber),
      cost: Math.max(0, number(card.cost ?? card.energy, 0)),
      type: typeAliases[rawType.toLowerCase()] || rawType,
      archetype: text(card.archetype || rawType),
      rarity: rarityAliases[rawRarity.toLowerCase()] || rawRarity,
      set: text(card.set || card.setName),
      source: text(card.source || (card.forge || card.forgeOnly ? 'forge' : 'base')),
      artwork: normalizeArtwork(card.artwork || card.art || card.artData, card.artData),
      rules,
      rulesText,
      flavorText: text(card.flavorText || card.flavor),
      keywords: unique([...(Array.isArray(card.keywords) ? card.keywords : []), ...inferred]),
      layout: { template: 'premium-v1', ...(card.layout || {}) },
      snapshot: card.snapshot && typeof card.snapshot === 'object' ? { ...card.snapshot } : null,
      game: normalizeGame(card),
      artworkPrompt: text(card.artworkPrompt || card.artPrompt),
      developerNotes: text(card.developerNotes),
      upgraded: Boolean(card.upgraded),
      forged: Boolean(card.forged || card.forge || card.forgeOnly),
      locked: Boolean(card.locked),
      temporary: Boolean(card.temporary),
      owner: text(card.owner),
      intent: Boolean(card.intent),
      metadata: card.metadata && typeof card.metadata === 'object' ? { ...card.metadata } : {}
    };
    delete normalized.text;
    delete normalized.title;
    delete normalized.art;
    delete normalized.artData;
    delete normalized.effects;
    return normalized;
  }

  function normalizeCatalog(value) {
    const source = Array.isArray(value) ? value : Array.isArray(value?.cards) ? value.cards : [];
    return {
      schemaVersion: SCHEMA_VERSION,
      catalogId: text(value?.catalogId || 'lady-delilah-hunt'),
      cards: source.map(normalize)
    };
  }

  async function loadCatalog(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Card catalog request failed (${response.status}).`);
    return normalizeCatalog(await response.json());
  }

  function serialize(value) {
    const normalized = Array.isArray(value) || Array.isArray(value?.cards)
      ? normalizeCatalog(value)
      : normalize(value);
    return JSON.stringify(normalized, null, 2);
  }

  global.SystemaCardSchema = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    loadCatalog,
    normalize,
    normalizeCatalog,
    serialize,
    typeAliases: Object.freeze(typeAliases),
    rarityAliases: Object.freeze(rarityAliases)
  });
})(window);
