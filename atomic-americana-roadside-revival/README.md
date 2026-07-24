# Atomic Americana: Roadside Revival

A mobile-friendly restoration game set at Moonbeam Junction. The town is the main game: play short match-3 work sessions to gather materials, then spend those supplies to repair and reopen the Moonbeam Diner.

## Gameplay loop

1. Explore Moonbeam Junction and inspect the diner at any time.
2. Choose **Earn Supplies** to open the match-3 workshop.
3. Every valid match immediately awards and saves resources.
4. Finish the 20-move shift for a bonus, or return early and keep everything already earned.
5. Spend Bottle Caps, Scrap, and Wrenches on five visible diner upgrades.

There are no score targets, failed levels, or restoration access gates.

## Match rewards

- Match of 3: 3 Bottle Caps
- Match of 4: 6 Bottle Caps and 1 Scrap
- Match of 5 or more: 10 Bottle Caps and 1 Wrench
- Cascades: an increasing Bottle Cap bonus after the first clear
- Large or intersecting combinations: a chance for an extra Wrench
- Full 20-move session: 10 bonus Bottle Caps
- First successful match on a new save: 2 starter Scrap, ensuring the first repair is available after four ordinary matches

Rewards appear above the board, update the persistent HUD, and are written to `localStorage` after every resolved match.

## Diner upgrades

| Upgrade | Cost |
| --- | --- |
| Clear the debris | 10 Caps, 2 Scrap |
| Patch the exterior | 20 Caps, 4 Scrap |
| Repair the neon | 30 Caps, 5 Scrap, 1 Wrench |
| Restore the parking lot | 50 Caps, 8 Scrap, 2 Wrenches |
| Grand reopening | 80 Caps, 12 Scrap, 3 Wrenches |

## Controls

- Tap the Moonbeam Diner to inspect restoration projects.
- Tap one tile and then an adjacent tile, or swipe a tile, to make a match.
- **Show Hint** highlights a legal swap.
- **New Board** reshuffles the current board without discarding session earnings.
- **Junction** ends the current work session early and shows the saved supply summary.
- **Play Again** starts a fresh 20-move session.

## Save behavior

Progress is stored under the versioned `atomicAmericanaSaveV1` key. It includes resources, diner stage, completed sessions, best score, tutorial state, starter grant state, and settings. Existing version-one saves retain their resources, diner stage, best score, tutorial, and settings; the new Scrap balance defaults to zero. The former `atomicAmericanaBest` key is still migrated when available.

## File structure

- `index.html` — HUD, overworld, workshop, supply summary, panels, and tutorial
- `styles.css` — responsive Atomic Americana visuals, restoration stages, and reward effects
- `data.js` — landmarks, diner costs, work-session economy, and tile types
- `save.js` — save defaults, migration, persistence, and reset
- `game.js` — view routing, restoration, session rewards, and preserved match-3 engine

All paths are relative and require no framework, dependency, or build step.

## Test locally

From the repository root:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/atomic-americana-roadside-revival/`.

Full-loop check:

1. Reset progress and confirm the overworld appears immediately.
2. Inspect the diner and confirm the first repair costs 10 Caps and 2 Scrap.
3. Enter **Earn Supplies** and make at least four ordinary matches.
4. Confirm the HUD and session tally update after each clear.
5. Select **Junction** before using all 20 moves.
6. Confirm the supply summary and return to the map.
7. Upgrade the diner and confirm its debris and weeds change.
8. Refresh and verify both remaining resources and the Cleanup stage persist.
9. Complete all 20 moves and confirm the 10-Cap completion bonus appears once in that session.

## Adding content

Add future landmarks and restoration stages in `data.js`; visual landmark markup uses matching `data-landmark` attributes. Adjust the match economy in `WORK_SESSION` without changing engine code. New CSS artwork can replace `.diner-building` and `.stage-0` through `.stage-5` while leaving restoration and save logic intact.

## Placeholder artwork

The overworld, diner, road, signs, scenery, and match tiles use original CSS shapes, gradients, text, and emoji-style placeholders. They are deliberately separated from restoration data so final artwork can be introduced later.
