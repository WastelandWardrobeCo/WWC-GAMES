(function (global) {
  'use strict';
  const escape = (value='') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const keywordTerms = ['Bleeding','Bleed','Exposed','Flanked','Rooted','Root','Terrified','Weakened','Dodge','Guard','Instinct','Trap','Moving','Not Acted','Exhaust','Draw','Heal'];
  const actionTerms = ['Deal','Apply','Draw','Gain','Recover','Prevent','Execute','Reduce','Remove','Reveal','Increase'];
  const keywordLookup = new Map(keywordTerms.map(term => [term.toLowerCase(), term]));
  const actionLookup = new Set(actionTerms.map(term => term.toLowerCase()));
  const highlightPattern = new RegExp(`\\b(?:${[...keywordTerms, ...actionTerms, 'damage'].sort((a,b)=>b.length-a.length).map(escapeRegExp).join('|')})\\b|\\b\\d+(?=\\s*(?:damage|Health|HP|card|cards|Action|Actions|Bleed|Root|Dodge|Guard|Instinct|turn|turns|round|rounds|\\+|\\.|,|$))`, 'gi');
  function normalizeCard(card) { return global.SystemaCardSchema.normalize(card); }
  function keywordClass(label) {
    const info = global.SystemaCardKeywords.get(label);
    return info ? ` systema-keyword--${slug(info.id)}` : '';
  }
  function keywordsHtml(card) {
    return card.keywords.map(value => { const item=global.SystemaCardKeywords.get(value); const label=item?.label || value; const help=item?.full || `${label} card keyword.`; return `<span class="systema-keyword${keywordClass(label)}" tabindex="0" title="${escape(help)}" aria-label="${escape(`${label}: ${help}`)}">${escape(label)}</span>`; }).join('');
  }
  function emphasizeRules(text='') {
    const prepared = String(text).replace(/([.;])\s+/g, '$1\n');
    return prepared.replace(highlightPattern, match => {
      const escaped = escape(match);
      const lower = match.toLowerCase();
      if (/^\d+$/.test(match)) return `<strong class="systema-rule-number">${escaped}</strong>`;
      if (lower === 'damage') return `<strong class="systema-rule-damage">${escaped}</strong>`;
      if (keywordLookup.has(lower)) {
        const info = global.SystemaCardKeywords.get(keywordLookup.get(lower)) || { id: match };
        return `<strong class="systema-rule-keyword systema-rule-keyword--${slug(info.id)}">${escaped}</strong>`;
      }
      if (actionLookup.has(lower)) return `<strong class="systema-rule-action">${escaped}</strong>`;
      return escaped;
    }).replace(/\n/g, '<br>');
  }
  function html(input, options={}) {
    const card=normalizeCard(input), mode=options.mode || 'collection', compact=card.rulesText.length > (mode==='combat'?78:112) || card.name.length > 23;
    if(card.rulesText.length>220) console.warn(`[CardRenderer] "${card.name}" exceeds the recommended rules length.`);
    const art=global.SystemaCardAssets.resolve(card); const badges=options.badges || {};
    return `<article class="systema-card systema-card--${escape(mode)} systema-card--type-${slug(card.type)} systema-card--rarity-${slug(card.rarity)} ${compact?'systema-card--compact':''} ${options.playable===false?'is-unplayable':''} ${options.selected?'is-selected':''}" data-systema-card data-card-id="${escape(card.id)}" tabindex="${options.tabIndex ?? 0}" aria-label="${escape(`${card.name}, cost ${card.cost}, ${card.type}, ${card.rarity}. ${card.rulesText}`)}">
      <header class="systema-card__header"><span class="systema-card__cost"><small>Cost</small>${card.cost}</span><div class="systema-card__titleblock"><h3>${escape(card.name)}</h3><span class="systema-card__type">${escape(card.type)}</span></div></header>
      <div class="systema-card__art ${art?'has-art':'no-art'}" ${art?`style="background-image:url('${escape(art)}');background-position:${card.artwork.focalX}% ${card.artwork.focalY}%;background-size:${card.artwork.zoom*100}%"`:''}><span aria-hidden="true"></span></div>
      <section class="systema-card__rules"><p>${emphasizeRules(card.rulesText)}</p><div class="systema-card__keywords">${keywordsHtml(card)}</div>${mode==='expanded'&&card.flavor?`<blockquote class="systema-card__flavor">${escape(card.flavor)}</blockquote>`:''}${compact?'<span class="systema-card__inspect-hint">Inspect for full details</span>':''}</section>
      <footer><span>${escape(card.rarity)}</span><span>${card.upgraded?'Upgraded':card.forged?'Forged':card.temporary?'Run Card':''}</span></footer>
      ${badges.owned!=null?`<span class="systema-card__badge systema-card__badge--owned">Owned ${Number(badges.owned)}</span>`:''}${badges.inDeck!=null?`<span class="systema-card__badge systema-card__badge--deck">Deck ${Number(badges.inDeck)}</span>`:''}
    </article>`;
  }
  function createCard(card, options={}) { const template=document.createElement('template'); template.innerHTML=html(card,options); return template.content.firstElementChild; }
  function renderInto(container, card, options={}) { container.replaceChildren(createCard(card,options)); fit(container.firstElementChild); return container.firstElementChild; }
  function fit(root) { if(!root) return; requestAnimationFrame(()=>{const rules=root.querySelector('.systema-card__rules'); if(rules && rules.scrollHeight>rules.clientHeight) root.classList.add('systema-card--compact');}); }
  function ensureDialog() {
    let dialog=document.getElementById('systemaCardPreviewDialog'); if(dialog) return dialog;
    dialog=document.createElement('dialog'); dialog.id='systemaCardPreviewDialog'; dialog.className='systema-card-dialog'; dialog.innerHTML='<button class="systema-card-dialog__close" type="button" aria-label="Close card preview">Close</button><div class="systema-card-dialog__content"></div><section class="systema-card-dialog__glossary"></section>';
    document.body.append(dialog); dialog.querySelector('button').addEventListener('click',()=>dialog.close()); dialog.addEventListener('close',()=>dialog._returnFocus?.focus()); return dialog;
  }
  function openPreview(input, options={}) { const card=normalizeCard(input), dialog=ensureDialog(); dialog._returnFocus=document.activeElement; renderInto(dialog.querySelector('.systema-card-dialog__content'),card,{...options,mode:'expanded'}); dialog.querySelector('.systema-card-dialog__glossary').innerHTML=card.keywords.map(k=>{const d=global.SystemaCardKeywords.get(k);return d?`<p><b>${escape(d.label)}</b> ${escape(d.full)}</p>`:''}).join(''); dialog.showModal(); dialog.querySelector('button').focus(); return dialog; }
  document.addEventListener('dblclick',event=>{const el=event.target.closest('[data-systema-card]'); if(el && global.SystemaCardCatalog?.[el.dataset.cardId]) openPreview(global.SystemaCardCatalog[el.dataset.cardId]);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape') document.getElementById('systemaCardPreviewDialog')?.close(); if((event.key==='i'||event.key==='Enter')&&event.target.matches('[data-systema-card]')) { event.preventDefault(); const card=global.SystemaCardCatalog?.[event.target.dataset.cardId]; if(card)openPreview(card); }});
  global.SystemaCardRenderer=Object.freeze({ createCard, renderInto, openPreview, normalizeCard, getKeywordDefinition:value=>global.SystemaCardKeywords.get(value), html, fit });
})(window);
