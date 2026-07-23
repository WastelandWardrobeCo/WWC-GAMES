"use strict";

(() => {
  const { LANDMARKS, LEVELS, TILE_TYPES } = window.AtomicData;
  const ROWS = 8, COLS = 8;
  const $ = id => document.getElementById(id);
  const els = Object.fromEntries([
    "overworldView","levelView","resultView","wrenchCount","capCount","starCount","settingsBtn","homeBtn",
    "dinerLandmark","dinerBuilding","dinerMapStage","panelBackdrop","buildingName","panelStageNumber",
    "panelStageName","panelDescription","stagePips","nextTaskBox","nextTask","taskCost","panelWrenches",
    "panelCaps","affordNote","playLevelBtn","upgradeBtn","closePanelBtn","settingsBackdrop","closeSettingsBtn",
    "motionToggle","resetBtn","resetConfirm","cancelResetBtn","confirmResetBtn","levelTitle","levelReward",
    "score","moves","best","objectiveText","scoreProgress","board","message","hintBtn","restartBtn",
    "leaveLevelBtn","resultSign","resultKicker","resultTitle","resultCopy","resultScore","rewardCrate",
    "rewardWrenches","rewardCaps","rewardStars","retryBtn","returnBtn","tutorial","tutorialCount",
    "tutorialIcon","tutorialTitle","tutorialCopy","tutorialNextBtn","toast","celebration"
  ].map(id => [id, $(id)]));

  let state = window.AtomicSave.load();
  let currentLevel = LEVELS[0];
  let board = [], selected = null, score = 0, moves = 0, busy = false, pointerStart = null;
  let levelFinished = false, tutorialStep = 0, lastFocused = null;

  const tutorials = [
    ["✦", "Welcome to Moonbeam Junction.", "Once a bright stop on the old highway, it needs your help."],
    ["☕", "Tap the ruined diner.", "Open the restoration panel to see what the Moonbeam Diner needs next."],
    ["🎳", "Play match-3 levels.", "Complete supply runs to earn Wrenches and Bottle Caps."],
    ["🔧", "Rebuild the roadside.", "Spend your supplies on upgrades and watch the diner come back to life."]
  ];

  function showView(id) {
    ["overworldView", "levelView", "resultView"].forEach(view => {
      const active = view === id;
      els[view].classList.toggle("active", active);
      els[view].setAttribute("aria-hidden", String(!active));
    });
    window.scrollTo({ top: 0, behavior: state.settings.motion ? "smooth" : "auto" });
  }

  function renderHUD() {
    animateCount(els.wrenchCount, state.resources.wrenches);
    animateCount(els.capCount, state.resources.caps);
    animateCount(els.starCount, state.resources.stars);
    document.body.classList.toggle("motion-off", !state.settings.motion);
  }

  function animateCount(el, value) {
    if (el.textContent !== String(value)) el.classList.add("counter-pop");
    el.textContent = value;
    setTimeout(() => el.classList.remove("counter-pop"), 350);
  }

  function renderOverworld() {
    const stage = LANDMARKS.moonbeamDiner.stages[state.dinerStage];
    els.dinerBuilding.className = `diner-building stage-${state.dinerStage}`;
    els.dinerMapStage.textContent = state.dinerStage === 5 ? "Grand Reopening • Complete" : `${stage.name} • Tap to restore`;
    renderHUD();
  }

  function renderBuildingPanel() {
    const stage = LANDMARKS.moonbeamDiner.stages[state.dinerStage];
    els.panelStageNumber.textContent = `Stage ${state.dinerStage} of 5`;
    els.panelStageName.textContent = stage.name;
    els.panelDescription.textContent = stage.description;
    els.stagePips.innerHTML = Array.from({ length: 6 }, (_, i) =>
      `<i class="${i <= state.dinerStage ? "complete" : ""}" title="Stage ${i}"></i>`).join("");
    els.panelWrenches.textContent = state.resources.wrenches;
    els.panelCaps.textContent = state.resources.caps;

    const complete = state.dinerStage >= 5;
    els.nextTaskBox.hidden = complete;
    els.upgradeBtn.disabled = complete;
    els.upgradeBtn.textContent = complete ? "Restoration Complete" : "Upgrade Diner";
    if (complete) {
      els.affordNote.textContent = "The Moonbeam Diner is open for business!";
    } else {
      els.nextTask.textContent = stage.task;
      els.taskCost.textContent = formatCost(stage.cost);
      const canAfford = hasCost(stage.cost);
      els.upgradeBtn.disabled = !canAfford;
      els.affordNote.textContent = canAfford ? "Supplies ready. The crew can begin." : "Complete supply runs to gather the missing materials.";
    }
    const level = nextLevel();
    els.playLevelBtn.textContent = `Play Level ${level.id}`;
  }

  function formatCost(cost) {
    const parts = [];
    if (cost.wrenches) parts.push(`🔧 ${cost.wrenches} Wrench${cost.wrenches === 1 ? "" : "es"}`);
    if (cost.caps) parts.push(`◉ ${cost.caps} Bottle Caps`);
    return `Cost: ${parts.join(" + ")}`;
  }

  function hasCost(cost) {
    return state.resources.wrenches >= cost.wrenches && state.resources.caps >= cost.caps;
  }

  function nextLevel() {
    const index = Math.min(state.completedLevelCount, LEVELS.length - 1);
    return LEVELS[index];
  }

  function openModal(backdrop) {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add("open"));
    backdrop.querySelector("button")?.focus();
  }

  function closeModal(backdrop) {
    backdrop.classList.remove("open");
    setTimeout(() => { backdrop.hidden = true; lastFocused?.focus(); }, 180);
  }

  function openDiner() {
    renderBuildingPanel();
    openModal(els.panelBackdrop);
  }

  function upgradeDiner() {
    if (state.dinerStage >= 5) return;
    const cost = LANDMARKS.moonbeamDiner.stages[state.dinerStage].cost;
    if (!hasCost(cost)) return;
    state.resources.wrenches -= cost.wrenches;
    state.resources.caps -= cost.caps;
    state.dinerStage += 1;
    window.AtomicSave.write(state);
    renderOverworld();
    renderBuildingPanel();
    celebrate();
    toast(`Moonbeam Diner upgraded: ${LANDMARKS.moonbeamDiner.stages[state.dinerStage].name}!`);
  }

  function startLevel(level = nextLevel()) {
    currentLevel = level;
    closeModal(els.panelBackdrop);
    showView("levelView");
    levelFinished = false;
    selected = null; score = 0; moves = level.moves; busy = false;
    els.levelTitle.textContent = `Level ${level.id}: ${level.name}`;
    els.levelReward.textContent = `🔧 ${level.rewards.wrenches} • ◉ ${level.rewards.caps}`;
    els.objectiveText.textContent = level.targetScore.toLocaleString();
    createBoard();
    renderBoard();
    els.message.textContent = "Swap neighboring roadside icons. Match three or more to clear them.";
  }

  function randomType() { return TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]; }

  function createBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      let type;
      do { type = randomType(); }
      while ((c >= 2 && board[r][c - 1] === type && board[r][c - 2] === type) ||
             (r >= 2 && board[r - 1][c] === type && board[r - 2][c] === type));
      board[r][c] = type;
    }
    if (!findPossibleMove()) createBoard();
  }

  function renderBoard() {
    els.board.innerHTML = "";
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const tile = document.createElement("button");
      tile.className = "tile"; tile.type = "button";
      tile.dataset.row = r; tile.dataset.col = c; tile.textContent = board[r][c] || "";
      tile.setAttribute("aria-label", `${board[r][c] || "Empty"} tile, row ${r + 1}, column ${c + 1}`);
      if (selected?.r === r && selected?.c === c) tile.classList.add("selected");
      tile.addEventListener("click", () => handleSelect(r, c));
      tile.addEventListener("pointerdown", event => pointerDown(event, r, c));
      tile.addEventListener("pointerup", event => pointerUp(event));
      els.board.appendChild(tile);
    }
    els.score.textContent = score.toLocaleString();
    els.moves.textContent = moves;
    els.best.textContent = state.bestScore.toLocaleString();
    els.scoreProgress.style.width = `${Math.min(100, score / currentLevel.targetScore * 100)}%`;
  }

  function pointerDown(event, r, c) { pointerStart = { x: event.clientX, y: event.clientY, r, c }; }
  function pointerUp(event) {
    if (!pointerStart || busy || levelFinished) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { pointerStart = null; return; }
    const from = { r: pointerStart.r, c: pointerStart.c };
    const target = { ...from };
    if (Math.abs(dx) > Math.abs(dy)) target.c += dx > 0 ? 1 : -1;
    else target.r += dy > 0 ? 1 : -1;
    pointerStart = null;
    if (isInside(target.r, target.c)) attemptSwap(from, target);
  }

  function handleSelect(r, c) {
    if (busy || levelFinished) return;
    if (!selected) selected = { r, c };
    else if (selected.r === r && selected.c === c) selected = null;
    else if (isAdjacent(selected, { r, c })) { attemptSwap(selected, { r, c }); return; }
    else selected = { r, c };
    renderBoard();
  }
  const isInside = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const isAdjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  function swap(a, b) { [board[a.r][a.c], board[b.r][b.c]] = [board[b.r][b.c], board[a.r][a.c]]; }

  async function attemptSwap(a, b) {
    if (busy || levelFinished || !isAdjacent(a, b)) return;
    busy = true; selected = null; swap(a, b); renderBoard(); await pause(130);
    const matches = findMatches();
    if (!matches.length) {
      swap(a, b); renderBoard(); els.message.textContent = "No match there. The highway crew puts those pieces back."; busy = false; return;
    }
    moves -= 1;
    await resolveBoard(matches);
    busy = false;
    checkGameState();
  }

  function findMatches() {
    const found = new Set();
    for (let r = 0; r < ROWS; r++) {
      let runStart = 0;
      for (let c = 1; c <= COLS; c++) {
        if (c < COLS && board[r][c] && board[r][c] === board[r][runStart]) continue;
        if (board[r][runStart] && c - runStart >= 3) for (let k = runStart; k < c; k++) found.add(`${r},${k}`);
        runStart = c;
      }
    }
    for (let c = 0; c < COLS; c++) {
      let runStart = 0;
      for (let r = 1; r <= ROWS; r++) {
        if (r < ROWS && board[r][c] && board[r][c] === board[runStart][c]) continue;
        if (board[runStart]?.[c] && r - runStart >= 3) for (let k = runStart; k < r; k++) found.add(`${k},${c}`);
        runStart = r;
      }
    }
    return [...found].map(item => { const [r, c] = item.split(",").map(Number); return { r, c }; });
  }

  async function resolveBoard(initialMatches) {
    let matches = initialMatches, cascade = 1;
    while (matches.length) {
      animateMatches(matches); await pause(230);
      score += matches.length * 100 * cascade;
      state.bestScore = Math.max(state.bestScore, score);
      matches.forEach(({ r, c }) => board[r][c] = null);
      collapseBoard(); refillBoard(); renderBoard(); await pause(180);
      matches = findMatches(); cascade += 1;
    }
    window.AtomicSave.write(state);
    els.message.textContent = cascade > 2 ? `Cascade x${cascade - 1}! The diner sign flickers back to life.` : "Clean match. Another roadside supply is packed.";
  }

  function animateMatches(matches) {
    matches.forEach(({ r, c }) => els.board.children[r * COLS + c]?.classList.add("matched"));
  }
  function collapseBoard() {
    for (let c = 0; c < COLS; c++) {
      let writeRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) if (board[r][c] !== null) {
        board[writeRow][c] = board[r][c];
        if (writeRow !== r) board[r][c] = null;
        writeRow -= 1;
      }
      while (writeRow >= 0) board[writeRow--][c] = null;
    }
  }
  function refillBoard() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c] === null) board[r][c] = randomType();
  }
  function findPossibleMove() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const here = { r, c };
      for (const target of [{ r: r + 1, c }, { r, c: c + 1 }]) {
        if (!isInside(target.r, target.c)) continue;
        swap(here, target); const works = findMatches().length > 0; swap(here, target);
        if (works) return [here, target];
      }
    }
    return null;
  }
  function showHint() {
    if (busy || levelFinished) return;
    const move = findPossibleMove();
    if (!move) { shuffleBoard(); return; }
    move.forEach(({ r, c }) => els.board.children[r * COLS + c]?.classList.add("hint"));
    els.message.textContent = "The old route map points to a promising swap.";
  }
  function shuffleBoard() {
    const flat = board.flat().sort(() => Math.random() - 0.5);
    board = Array.from({ length: ROWS }, (_, r) => flat.slice(r * COLS, (r + 1) * COLS));
    if (findMatches().length || !findPossibleMove()) { shuffleBoard(); return; }
    renderBoard(); els.message.textContent = "No legal moves. The board has been reshuffled.";
  }

  function checkGameState() {
    renderBoard();
    if (score >= currentLevel.targetScore) finishLevel(true);
    else if (moves <= 0) finishLevel(false);
    else if (!findPossibleMove()) shuffleBoard();
  }

  function finishLevel(won) {
    if (levelFinished) return;
    levelFinished = true;
    let newlyClaimed = false;
    if (won && !state.claimedRewards[currentLevel.id]) {
      state.claimedRewards[currentLevel.id] = true;
      state.resources.wrenches += currentLevel.rewards.wrenches;
      state.resources.caps += currentLevel.rewards.caps;
      state.resources.stars += currentLevel.rewards.stars;
      state.completedLevelCount += 1;
      state.highestUnlockedLevel = Math.min(LEVELS.length, Math.max(state.highestUnlockedLevel, currentLevel.id + 1));
      newlyClaimed = true;
    }
    state.bestScore = Math.max(state.bestScore, score);
    window.AtomicSave.write(state);
    renderResult(won, newlyClaimed);
    showView("resultView");
  }

  function renderResult(won, newlyClaimed) {
    els.resultSign.classList.toggle("failed", !won);
    els.resultKicker.textContent = won ? "Supply Run Complete" : "The Crew Came Up Short";
    els.resultTitle.textContent = won ? "Roadside Victory!" : "Out of Moves";
    els.resultCopy.textContent = won
      ? (newlyClaimed ? "The supply truck is loaded. Take your haul back to Moonbeam Junction." : "You beat the target again. This level's one-time supplies were already claimed.")
      : `The target was ${currentLevel.targetScore.toLocaleString()}. Tune up your route and try again.`;
    els.resultScore.textContent = score.toLocaleString();
    els.rewardCrate.hidden = !won;
    els.rewardWrenches.textContent = newlyClaimed ? currentLevel.rewards.wrenches : 0;
    els.rewardCaps.textContent = newlyClaimed ? currentLevel.rewards.caps : 0;
    els.rewardStars.textContent = newlyClaimed ? currentLevel.rewards.stars : 0;
    els.retryBtn.hidden = won;
    els.returnBtn.textContent = won ? "Return to Junction" : "Return to Junction";
    if (won) celebrate();
    renderHUD();
  }

  function returnToJunction() {
    showView("overworldView"); renderOverworld();
  }

  function celebrate() {
    if (!state.settings.motion) return;
    els.celebration.innerHTML = Array.from({ length: 22 }, (_, i) =>
      `<i style="--x:${Math.random() * 100}%;--d:${Math.random() * .8}s;--r:${Math.random() * 360}deg;--c:${i % 3}"></i>`).join("");
    els.celebration.classList.remove("burst"); void els.celebration.offsetWidth; els.celebration.classList.add("burst");
  }

  function toast(text) {
    els.toast.textContent = text; els.toast.classList.add("show");
    setTimeout(() => els.toast.classList.remove("show"), 2800);
  }

  function showTutorial() {
    if (state.tutorialSeen) return;
    tutorialStep = 0; renderTutorial(); els.tutorial.hidden = false; els.tutorialNextBtn.focus();
  }
  function renderTutorial() {
    const [icon, title, copy] = tutorials[tutorialStep];
    els.tutorialCount.textContent = `${tutorialStep + 1} / ${tutorials.length}`;
    els.tutorialIcon.textContent = icon; els.tutorialTitle.textContent = title; els.tutorialCopy.textContent = copy;
    els.tutorialNextBtn.textContent = tutorialStep === tutorials.length - 1 ? "Let's Restore It" : "Next";
  }
  function nextTutorial() {
    if (tutorialStep < tutorials.length - 1) { tutorialStep += 1; renderTutorial(); return; }
    state.tutorialSeen = true; window.AtomicSave.write(state); els.tutorial.hidden = true; els.dinerLandmark.focus();
  }

  function resetProgress() {
    state = window.AtomicSave.reset();
    els.resetConfirm.hidden = true; closeModal(els.settingsBackdrop); returnToJunction(); showTutorial(); toast("Progress reset. Welcome back to Mile 66.");
  }

  function bindEvents() {
    els.dinerLandmark.addEventListener("click", openDiner);
    document.querySelectorAll(".landmark.locked").forEach(el => el.addEventListener("click", () => toast(`${LANDMARKS[el.dataset.landmark].name}: Coming Soon`)));
    els.closePanelBtn.addEventListener("click", () => closeModal(els.panelBackdrop));
    els.panelBackdrop.addEventListener("click", e => { if (e.target === els.panelBackdrop) closeModal(els.panelBackdrop); });
    els.playLevelBtn.addEventListener("click", () => startLevel());
    els.upgradeBtn.addEventListener("click", upgradeDiner);
    els.hintBtn.addEventListener("click", showHint);
    els.restartBtn.addEventListener("click", () => startLevel(currentLevel));
    els.retryBtn.addEventListener("click", () => startLevel(currentLevel));
    els.returnBtn.addEventListener("click", returnToJunction);
    els.leaveLevelBtn.addEventListener("click", returnToJunction);
    els.homeBtn.addEventListener("click", returnToJunction);
    els.settingsBtn.addEventListener("click", () => { els.motionToggle.checked = state.settings.motion; els.resetConfirm.hidden = true; openModal(els.settingsBackdrop); });
    els.closeSettingsBtn.addEventListener("click", () => closeModal(els.settingsBackdrop));
    els.settingsBackdrop.addEventListener("click", e => { if (e.target === els.settingsBackdrop) closeModal(els.settingsBackdrop); });
    els.motionToggle.addEventListener("change", () => { state.settings.motion = els.motionToggle.checked; window.AtomicSave.write(state); renderHUD(); });
    els.resetBtn.addEventListener("click", () => { els.resetConfirm.hidden = false; els.cancelResetBtn.focus(); });
    els.cancelResetBtn.addEventListener("click", () => { els.resetConfirm.hidden = true; els.resetBtn.focus(); });
    els.confirmResetBtn.addEventListener("click", resetProgress);
    els.tutorialNextBtn.addEventListener("click", nextTutorial);
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (!els.panelBackdrop.hidden) closeModal(els.panelBackdrop);
      if (!els.settingsBackdrop.hidden) closeModal(els.settingsBackdrop);
    });
  }

  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  bindEvents(); renderOverworld(); showView("overworldView"); showTutorial();
})();
