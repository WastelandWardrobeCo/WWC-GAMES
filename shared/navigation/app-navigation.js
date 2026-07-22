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
    <nav class="systema-app-nav" aria-label="Systema Obscura workspaces">
      ${destinations.map(([id, label, path]) => {
        const current = id === activeWorkspace ? ' aria-current="page"' : '';
        return `<a href="${new URL(path, repositoryRoot).href}"${current}>${label}</a>`;
      }).join('')}
    </nav>`;
  document.body.prepend(header);
})();
