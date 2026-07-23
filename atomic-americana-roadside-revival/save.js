"use strict";

window.AtomicSave = (() => {
  const KEY = "atomicAmericanaSaveV1";
  const LEGACY_BEST_KEY = "atomicAmericanaBest";

  function freshSave() {
    return {
      version: 1,
      resources: { wrenches: 0, caps: 0, stars: 0 },
      dinerStage: 0,
      completedLevelCount: 0,
      highestUnlockedLevel: 1,
      bestScore: Number(localStorage.getItem(LEGACY_BEST_KEY) || 0),
      claimedRewards: {},
      settings: { motion: true },
      tutorialSeen: false,
      updatedAt: Date.now()
    };
  }

  function normalize(raw) {
    const base = freshSave();
    if (!raw || raw.version !== 1) return base;
    return {
      ...base,
      ...raw,
      resources: { ...base.resources, ...(raw.resources || {}) },
      claimedRewards: { ...(raw.claimedRewards || {}) },
      settings: { ...base.settings, ...(raw.settings || {}) },
      bestScore: Math.max(Number(raw.bestScore || 0), base.bestScore)
    };
  }

  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); }
    catch (_) { return freshSave(); }
  }

  function write(state) {
    state.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.setItem(LEGACY_BEST_KEY, String(state.bestScore));
    return state;
  }

  function reset() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_BEST_KEY);
    return write(freshSave());
  }

  return { KEY, load, write, reset };
})();
