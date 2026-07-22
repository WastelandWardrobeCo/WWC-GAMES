(function (global) {
  'use strict';

  const VERSION = 1;
  const KEYS = Object.freeze({
    profileIndex: 'ladyDelilahProfiles.v1',
    activeProfile: 'ladyDelilahActiveProfile.v1',
    profilePrefix: 'ladyDelilahSave_',
    sharedSnapshot: 'systemaHunterProfile.v1',
    forgeProfile: 'lady-delilah-forge-profile-v1',
    forgeVault: 'lady-delilah-forge-vault-v1',
    forgeRun: 'lady-delilah-forge-run-v1',
    legacyPlayerName: 'lady-delilah-player-name'
  });

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function read(key, fallback) {
    return safeParse(localStorage.getItem(key), fallback);
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function activeProfileId() {
    return localStorage.getItem(KEYS.activeProfile) || '';
  }

  function profileKey(id) {
    return `${KEYS.profilePrefix}${id}`;
  }

  function profileIndex() {
    const list = read(KEYS.profileIndex, []);
    return Array.isArray(list) ? list.filter(item => item && item.id) : [];
  }

  function activeSave() {
    const id = activeProfileId();
    if (!id) return null;
    const save = read(profileKey(id), null);
    return save && typeof save === 'object' ? save : null;
  }

  function normalize(save, id) {
    if (!save) return null;
    const forgeProfile = read(KEYS.forgeProfile, {});
    const forgeVault = read(KEYS.forgeVault, { cards: [] });
    const forgeRun = read(KEYS.forgeRun, {});
    const completed = Array.isArray(save.completed || save.completedHunts)
      ? [...new Set(save.completed || save.completedHunts)]
      : [];
    const unlocked = Array.isArray(save.unlockedHunts) && save.unlockedHunts.length
      ? [...new Set(save.unlockedHunts)]
      : ['black-veil'];
    const runHistory = Array.isArray(save.runHistory) ? save.runHistory : [];
    const forgedCards = Array.isArray(forgeVault.cards) ? forgeVault.cards : [];
    const permanentForgeTokens = Math.max(0, Number(forgeProfile.permanentTokens) || 0);
    const runForgeTokens = Math.max(0, Number(forgeRun.tokens) || 0);

    return {
      schemaVersion: VERSION,
      id: id || save.profileId || '',
      hunterName: save.hunterName || 'Unnamed Hunter',
      rank: Math.max(1, Number(save.rank ?? save.hunterRank) || 1),
      hunterXP: Math.max(0, Number(save.hunterXP) || 0),
      reputation: save.rep || save.reputation || 'Unknown',
      marks: Math.max(0, Number(save.marks ?? save.hunterMarks) || 0),
      scrap: Math.max(0, Number(save.scrap) || 0),
      bond: Math.max(1, Number(save.bond) || 1),
      battlesWon: Math.max(0, Number(save.battlesWon) || 0),
      activeDeck: Array.isArray(save.activeDeck || save.currentDeck) ? [...(save.activeDeck || save.currentDeck)] : [],
      ownedCards: { ...(save.owned || save.ownedCards || {}) },
      relics: Array.isArray(save.relics) ? [...save.relics] : [],
      completedHunts: completed,
      unlockedHunts: unlocked,
      runHistory,
      activeRun: save.run && typeof save.run === 'object' ? save.run : null,
      forgeTokens: Math.max(Math.max(0, Number(save.forgeTokens) || 0), permanentForgeTokens + runForgeTokens),
      forgedCardCount: forgedCards.length,
      settings: save.settings && typeof save.settings === 'object' ? { ...save.settings } : {},
      savedAt: save.savedAt || new Date().toISOString()
    };
  }

  function current() {
    const id = activeProfileId();
    const save = activeSave();
    if (save) {
      const snapshot = normalize(save, id);
      write(KEYS.sharedSnapshot, snapshot);
      localStorage.setItem(KEYS.legacyPlayerName, snapshot.hunterName);
      return snapshot;
    }
    const snapshot = read(KEYS.sharedSnapshot, null);
    return snapshot && typeof snapshot === 'object' ? snapshot : null;
  }

  function update(patch) {
    const id = activeProfileId();
    if (!id) return { ok: false, error: 'No active hunter profile.' };
    const save = activeSave();
    if (!save) return { ok: false, error: 'Active hunter save is missing.' };

    const allowed = {
      hunterName: 'hunterName', rank: 'rank', hunterXP: 'hunterXP', reputation: 'rep',
      marks: 'marks', scrap: 'scrap', bond: 'bond', battlesWon: 'battlesWon',
      activeDeck: 'activeDeck', ownedCards: 'owned', relics: 'relics',
      completedHunts: 'completed', unlockedHunts: 'unlockedHunts', runHistory: 'runHistory',
      activeRun: 'run', forgeTokens: 'forgeTokens', settings: 'settings'
    };

    Object.entries(patch || {}).forEach(([key, value]) => {
      const target = allowed[key];
      if (!target) return;
      save[target] = value;
      if (key === 'marks') save.hunterMarks = value;
      if (key === 'rank') save.hunterRank = value;
      if (key === 'reputation') save.reputation = value;
      if (key === 'activeDeck') save.currentDeck = value;
      if (key === 'ownedCards') save.ownedCards = value;
      if (key === 'completedHunts') save.completedHunts = value;
    });

    save.profileId = id;
    save.savedAt = new Date().toISOString();
    write(profileKey(id), save);
    syncIndex(save, id);
    const snapshot = normalize(save, id);
    write(KEYS.sharedSnapshot, snapshot);
    localStorage.setItem(KEYS.legacyPlayerName, snapshot.hunterName);
    dispatch('systema:hunter-profile-updated', snapshot);
    return { ok: true, profile: snapshot };
  }

  function syncIndex(save, id) {
    const index = profileIndex();
    const summary = {
      id,
      hunterName: save.hunterName || 'Unnamed Hunter',
      rank: Math.max(1, Number(save.rank ?? save.hunterRank) || 1),
      battlesWon: Math.max(0, Number(save.battlesWon) || 0),
      updatedAt: new Date().toISOString()
    };
    const position = index.findIndex(item => item.id === id);
    if (position >= 0) index[position] = { ...index[position], ...summary };
    else index.push(summary);
    write(KEYS.profileIndex, index);
  }

  function dispatch(name, detail) {
    global.dispatchEvent(new CustomEvent(name, { detail: JSON.parse(JSON.stringify(detail)) }));
  }

  function sync() {
    const profile = current();
    if (profile) dispatch('systema:hunter-profile-ready', profile);
    return profile;
  }

  function subscribe(callback) {
    if (typeof callback !== 'function') return function () {};
    const handler = event => callback(event.detail);
    global.addEventListener('systema:hunter-profile-ready', handler);
    global.addEventListener('systema:hunter-profile-updated', handler);
    return () => {
      global.removeEventListener('systema:hunter-profile-ready', handler);
      global.removeEventListener('systema:hunter-profile-updated', handler);
    };
  }

  global.addEventListener('storage', event => {
    if (!event.key) return;
    if (event.key === KEYS.activeProfile || event.key === KEYS.profileIndex || event.key.startsWith(KEYS.profilePrefix) || event.key.startsWith('lady-delilah-forge-')) sync();
  });

  const api = Object.freeze({ VERSION, KEYS, current, update, sync, subscribe, activeProfileId, profileIndex });
  global.SystemaHunterProfile = api;
  queueMicrotask(sync);
})(window);
