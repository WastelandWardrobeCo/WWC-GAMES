(function () {
  'use strict';

  const script = document.currentScript;
  if (!script || document.querySelector('.systema-app-shell')) return;

  const repositoryRoot = new URL('../../', script.src);
  const activeWorkspace = document.body.dataset.workspace || '';
  const destinations = [
    ['hunt', 'Hunt', 'hunt/'],
    ['card-studio', 'Card Studio', 'card-studio/'],
    ['forge', "Jonas' Forge", 'forge/'],
    ['trading-cards', 'Trading Cards', 'trading-cards/'],
    ['wwc-games', 'WWC Games', 'index.html']
  ];

  if (!document.querySelector('[data-systema-shell-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('shared/css/app-shell.css', repositoryRoot).href;
    stylesheet.dataset.systemaShellStyles = '';
    document.head.append(stylesheet);
  }

  const header = document.createElement('header');
  header.className = 'systema-app-shell';
  header.innerHTML = `
    <div class="systema-app-brand">
      <strong>Systema Obscura</strong>
      <span>Lady &amp; Delilah™ Game Workspace</span>
    </div>
    <div class="systema-hunter-chip" data-hunter-chip hidden>
      <span>Active Hunter</span>
      <strong data-hunter-name>None</strong>
      <small data-hunter-progress></small>
    </div>
    <nav class="systema-app-nav" aria-label="Systema Obscura workspaces">
      ${destinations.map(([id, label, path]) => {
        const current = id === activeWorkspace ? ' aria-current="page"' : '';
        return `<a href="${new URL(path, repositoryRoot).href}"${current}>${label}</a>`;
      }).join('')}
    </nav>`;
  document.body.prepend(header);

  function renderHunter(profile) {
    const chip = header.querySelector('[data-hunter-chip]');
    if (!chip) return;
    if (!profile) {
      chip.hidden = true;
      return;
    }
    chip.hidden = false;
    chip.querySelector('[data-hunter-name]').textContent = profile.hunterName || 'Unnamed Hunter';
    chip.querySelector('[data-hunter-progress]').textContent = `Rank ${profile.rank || 1} · ${Number(profile.marks || 0).toLocaleString()} Marks`;
    chip.title = `${profile.completedHunts?.length || 0} hunts completed · ${profile.forgedCardCount || 0} forged cards`;
  }

  function connectProfileRuntime() {
    if (!window.SystemaHunterProfile) return;
    renderHunter(window.SystemaHunterProfile.current());
    window.SystemaHunterProfile.subscribe(renderHunter);
  }

  if (window.SystemaHunterProfile) {
    connectProfileRuntime();
  } else {
    const profileScript = document.createElement('script');
    profileScript.src = new URL('shared/persistence/hunter-profile.js', repositoryRoot).href;
    profileScript.addEventListener('load', connectProfileRuntime, { once: true });
    document.head.append(profileScript);
  }
})();
