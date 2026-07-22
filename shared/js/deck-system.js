(function (global) {
  'use strict';

  const DATABASE_KEY = 'systema-obscura-decks-v1';
  const STUDIO_KEY = 'systema-obscura-card-studio-v3';
  const SCHEMA_VERSION = 1;

  function safeText(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function readDatabase() {
    const stored = readJson(DATABASE_KEY, {});
    return {
      schemaVersion: SCHEMA_VERSION,
      profiles: stored && typeof stored.profiles === 'object' ? stored.profiles : {}
    };
  }

  function writeDatabase(database) {
    localStorage.setItem(DATABASE_KEY, JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      profiles: database.profiles,
      updatedAt: new Date().toISOString()
    }));
  }

  function cleanIds(cardIds) {
    return Array.isArray(cardIds) ? cardIds.filter(id => typeof id === 'string' && id.trim()) : [];
  }

  function cleanCustomCards(customCards) {
    return Array.isArray(customCards)
      ? customCards.filter(card => card && typeof card.id === 'string' && card.id.trim())
      : [];
  }

  function saveProfileDeck(profileId, name, cardIds, customCards) {
    if (!profileId) return null;
    const database = readDatabase();
    const record = {
      id: `profile:${profileId}`,
      profileId,
      name: name || 'Hunt Deck',
      cards: cleanIds(cardIds),
      customCards: cleanCustomCards(customCards),
      updatedAt: new Date().toISOString()
    };
    database.profiles[profileId] = record;
    writeDatabase(database);
    return record;
  }

  function loadProfileDeck(profileId, fallbackIds, knownIds) {
    const fallback = cleanIds(fallbackIds);
    if (!profileId) return { cards: fallback, customCards: [], migrated: false };
    const database = readDatabase();
    const record = database.profiles[profileId];
    const known = knownIds instanceof Set ? knownIds : new Set(knownIds || []);
    const storedCards = cleanIds(record?.cards);
    const storedIsUsable = storedCards.length === 20 && storedCards.every(id => known.has(id));
    if (storedIsUsable) return { ...record, cards: storedCards, customCards: cleanCustomCards(record.customCards), migrated: false };
    const migrated = saveProfileDeck(profileId, record?.name || 'Hunt Deck', fallback, record?.customCards || []);
    return { ...migrated, migrated: true };
  }

  function profileCustomCards(profileId) {
    if (!profileId) return [];
    return cleanCustomCards(readDatabase().profiles[profileId]?.customCards);
  }

  function deleteProfileDeck(profileId) {
    if (!profileId) return;
    const database = readDatabase();
    delete database.profiles[profileId];
    writeDatabase(database);
  }

  function normalizeStudioEffect(effect, defaultTarget) {
    const amount = Math.max(0, Number(effect?.amount) || 0);
    if (effect?.type) return { ...effect, amount, target: effect.target || defaultTarget };
    return {
      action: effect?.action || '',
      amount,
      status: effect?.status || '',
      condition: effect?.condition || 'none',
      target: effect?.target || defaultTarget
    };
  }

  function normalizeStudioCard(card) {
    const target = card?.game?.target || 'enemy';
    const effects = card?.game?.effects || card?.effects || [];
    const supportedTypes = new Set(['Attack', 'Instinct', 'Tactic', 'Preparation', 'Survival', 'Synchronized', 'Legend']);
    const supportedRarities = new Set(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
    return {
      schemaVersion: Number(card?.schemaVersion) || 1,
      id: String(card?.id || '').trim(),
      name: safeText(String(card?.name || '').trim()),
      cost: Math.max(0, Number(card?.cost) || 0),
      type: supportedTypes.has(card?.type) ? card.type : 'Tactic',
      rarity: supportedRarities.has(card?.rarity) ? card.rarity : 'Common',
      rulesText: safeText(card?.rulesText),
      keywords: Array.isArray(card?.keywords) ? card.keywords.filter(Boolean) : [],
      target,
      exhaust: Boolean(card?.exhaust ?? card?.game?.exhaust),
      effects: effects.map(effect => normalizeStudioEffect(effect, target))
    };
  }

  function readStudioCards() {
    const raw = readJson(STUDIO_KEY, []);
    const source = Array.isArray(raw) ? raw : Array.isArray(raw?.cards) ? raw.cards : [];
    const valid = [];
    const rejected = [];
    source.map(normalizeStudioCard).forEach(card => {
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(card.id) || !card.name || !card.rulesText || !card.effects.length) rejected.push(card.name || card.id || 'Untitled card');
      else valid.push(card);
    });
    return { cards: valid, rejected };
  }

  global.SystemaDeckStorage = Object.freeze({
    databaseKey: DATABASE_KEY,
    deleteProfileDeck,
    schemaVersion: SCHEMA_VERSION,
    loadProfileDeck,
    profileCustomCards,
    readStudioCards,
    saveProfileDeck
  });
})(window);
