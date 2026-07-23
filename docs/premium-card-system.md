# Premium Shared Card System

The active Hunt, Card Studio, and Jonas' Forge interfaces share the framework-free `window.SystemaCardRenderer` presentation engine in `shared/cards/`.

## Browser API

- `createCard(cardData, options)` returns a card element.
- `renderInto(container, cardData, options)` replaces a container's contents with a card.
- `html(cardData, options)` returns safe card markup for existing template-string views.
- `openPreview(cardData, options)` opens the accessible expanded dialog and returns focus when closed.
- `normalizeCard(cardData)` converts legacy game, Studio, and Forge records without mutating them.
- `getKeywordDefinition(keyword)` returns shared glossary data.

Modes are `combat`, `collection`, `expanded`, and the forward-compatible `enemy` value. Options support `playable`, `selected`, `tabIndex`, and owned/deck badges.

## Normalized schema

```js
{
  id, name, cost, type, rarity,
  artwork: { src, focalX, focalY, zoom },
  rules: [], rulesText, flavor, keywords: [],
  source, upgraded, forged, locked, temporary,
  owner, intent, metadata, original
}
```

Legacy `text`, `effect`, `flavorText`, `artData`, string artwork, `game.effects`, and Forge metadata remain valid. Gameplay effect functions stay on the original record and are never executed or rewritten by the renderer.

## Mappings

Types normalize to the shared visual identities: Attack; Tactic (including Precision); Trap; Instinct (including Companion); Survival (including Guard); Preparation; and Synchronized. Unknown types remain intact.

Rarities normalize as Common/Roadworn → Roadworn, Uncommon/Sharp → Sharp, Rare/Epic/Blackmark → Blackmark, Legendary/Mythic → Legendary, and Forged → Forged.

## Keywords

The registry includes Bleed, Exposed, Flanked, Root, Terrified, Weakened, Dodge, Guard, Instinct, Trap, Moving, Not Acted, Exhaust, Draw, and Heal. Keyword chips are keyboard-focusable and expose definitions through native tooltips and the expanded glossary.

## Renderer audit

Migrated active surfaces:

- Hunt combat hand
- Hunt deck/archive and all-cards collection
- First-deck reveal
- Permanent and campaign card rewards
- Card Studio live preview and saved-card library
- Jonas' Forge live preview and Vault

Intentionally outstanding:

- The Trading Card Maker remains a physical/custom trading-card compositor rather than a gameplay-card surface.
- Enemy intents remain their existing compact intent presentation; the schema already accepts `mode: "enemy"`, `owner`, and `intent` for a later enemy-deck sprint.
- Obsolete prototype layouts remain isolated in `archive/` and are not linked back into the canonical Hunt.

## Readability safeguards

Rules start at the readable default size. A single compact tier is permitted when content exceeds the safe area; no decrement loop exists. Very long rules emit a development warning and display an inspect hint. At narrow viewports cards retain a 185–210px readable width and their parent surfaces scroll instead of compressing them.
