# Atomic Americana: Roadside Revival

A mobile-friendly, vanilla HTML5 restoration game set at Moonbeam Junction. Complete match-3 supply runs, earn restoration currency, and rebuild the ruined Moonbeam Diner through six visible states (abandoned plus five upgrades).

## Current features

- Scroll-free roadside overworld with three physically placed landmarks and animated scenery
- Moonbeam Diner with abandoned, cleanup, exterior repair, neon, parking lot, and grand reopening visuals
- Data-driven restoration costs, landmark definitions, and six supply-run levels
- Preserved 8×8 match-3 play: tap or swipe swaps, cascades, score, hints, and automatic reshuffling
- Win, failure, retry, reward, return, and upgrade flows
- Wrenches, Bottle Caps, and Atomic Stars
- One-time level rewards with duplicate-claim protection
- Versioned `atomicAmericanaSaveV1` local save and legacy best-score migration
- First-run four-step tutorial, settings, reduced-motion support, and confirmed progress reset
- Responsive layouts and large touch targets for phones, tablets, and desktop

## Controls

- Tap a landmark to inspect it.
- Tap one tile and then an adjacent tile, or swipe a tile, to make a match.
- **Show Hint** highlights a legal swap.
- **Restart Level** starts the current supply run again.
- Use **Junction** or the logo to return to the map.

## Save behavior

Progress is stored automatically in browser `localStorage` under the single versioned key `atomicAmericanaSaveV1`. It includes resources, diner stage, completed and unlocked levels, best score, claimed rewards, tutorial state, and settings. The former `atomicAmericanaBest` value is migrated into the save when available. Clearing site data or choosing **Settings → Reset Progress** removes progress.

## File structure

- `index.html` — semantic structure for the HUD, map, level, results, panels, and tutorial
- `styles.css` — Atomic Americana visuals, responsive rules, building stages, and lightweight animations
- `data.js` — landmarks, diner stages and costs, levels, rewards, and tile types
- `save.js` — save defaults, normalization, migration, persistence, and reset
- `game.js` — view routing, UI rendering, restoration loop, rewards, and match-3 engine

All paths are relative and require no framework, package install, or build step.

## Test locally

You can open `index.html` directly, or serve the repository root:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000/atomic-americana-roadside-revival/`.

Suggested full-loop test:

1. Complete or skip through the tutorial and tap the ruined diner.
2. Start Level 1, reach 1,500 points, and return from the reward screen.
3. Confirm the HUD shows 1 Wrench and 25 Caps.
4. Upgrade to Cleanup and confirm the debris/weeds visibly change.
5. Refresh and confirm the resources, stage, level progress, best score, and tutorial state persist.
6. Replay a claimed level (by restarting before advancing during development) and confirm it cannot award twice.
7. Run out of moves below the target and confirm Retry and Return award nothing.
8. Check the layout around 375×667 and a wider desktop viewport.

## Add a landmark

Add an entry to `LANDMARKS` in `data.js` with an ID, name, lock state, position metadata, and (for a restorable location) a stages array. Add its semantic map markup with the matching `data-landmark` value. Reusable locked-landmark behavior is already delegated through that attribute; restorable landmark panels can follow the Moonbeam renderer pattern.

## Add a level

Append an object to `LEVELS` in `data.js`:

```js
{
  id: 7,
  name: "New Supply Run",
  targetScore: 4500,
  moves: 23,
  rewards: { wrenches: 2, caps: 160, stars: 1 }
}
```

The level selector, objective display, rewards, progression, and one-time claim guard read from this data automatically.

## Placeholder artwork

The map, diner stages, road, signs, scenery, and effects are original CSS shapes, gradients, text, and emoji-style placeholders. Each diner appearance is controlled by `.stage-0` through `.stage-5`, so future artwork can replace the building layer without changing restoration or save logic. Match tiles are also emoji placeholders configured in `data.js`.
