(function (global) {
  'use strict';
  const typeAliases = { precision:'Tactic', tactic:'Tactic', trap:'Trap', instinct:'Instinct', companion:'Instinct', guard:'Survival', survival:'Survival', preparation:'Preparation', synchronized:'Synchronized', attack:'Attack' };
  const rarityAliases = { common:'Roadworn', roadworn:'Roadworn', uncommon:'Sharp', sharp:'Sharp', rare:'Blackmark', blackmark:'Blackmark', epic:'Blackmark', legendary:'Legendary', mythic:'Legendary', forged:'Forged' };
  function text(value='') { return String(value ?? '').trim(); }
  function artwork(value) {
    if (typeof value === 'string') return { src:value, focalX:50, focalY:50, zoom:1 };
    return { src:text(value?.src), focalX:Number(value?.focalX ?? 50), focalY:Number(value?.focalY ?? 50), zoom:Number(value?.zoom ?? 1) };
  }
  function normalize(card={}) {
    const rawType = text(card.type || card.archetype || 'Preparation');
    const rawRarity = text(card.rarity || 'Common');
    const structured = Array.isArray(card.rules) ? card.rules : Array.isArray(card.game?.effects) ? card.game.effects : Array.isArray(card.effects) ? card.effects : [];
    const rulesText = text(card.rulesText || card.text || card.rules || 'No rules text provided.');
    const inferred = [...rulesText.matchAll(/\b(Bleed|Exposed|Flanked|Root|Terrified|Weakened|Dodge|Guard|Instinct|Trap|Moving|Not Acted|Exhaust|Draw|Heal)\b/gi)].map(match => match[1]);
    return {
      id:text(card.id || card.cardId || `card-${Date.now()}`), name:text(card.name || card.title || 'Untitled Card'),
      cost:Math.max(0,Number(card.cost ?? card.energy ?? 0) || 0), type:typeAliases[rawType.toLowerCase()] || rawType,
      source:text(card.source || (card.forge ? 'forge' : 'base')), rarity:rarityAliases[rawRarity.toLowerCase()] || rawRarity,
      artwork:artwork(card.artData || card.artwork || card.art || ''), rules:structured, rulesText,
      flavor:text(card.flavor || card.flavorText), keywords:[...new Set([...(card.keywords || []),...inferred].map(text).filter(Boolean))],
      upgraded:Boolean(card.upgraded), forged:Boolean(card.forged || card.forge), locked:Boolean(card.locked), temporary:Boolean(card.temporary),
      owner:text(card.owner), intent:Boolean(card.intent), metadata:{...card.metadata}, original:card
    };
  }
  global.SystemaCardSchema = Object.freeze({ normalize, typeAliases:Object.freeze(typeAliases), rarityAliases:Object.freeze(rarityAliases) });
})(window);
