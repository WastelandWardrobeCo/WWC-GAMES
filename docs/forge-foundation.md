# Lady & Delilah™ Forge Foundation

The Forge is a permanent progression system where exceptional accomplishments award the right to create a balanced, player-authored card.

## Runtime API

`forge-core.js` exposes `window.LadyDelilahForge`.

Core operations:

- `beginRun(runNumber)` starts isolated run reward storage.
- `endRun()` clears unspent run-only Forge Tokens.
- `awardForgeToken({ scope, source, reason })` awards a permanent or run token.
- `tokenBalance()` reports permanent, run, and total tokens.
- `evaluateCard(card)` scores a proposed card against its energy-cost budget and returns Jonas dialogue.
- `forgeCard(card, metadata)` validates the card, consumes one token, adds immutable forge metadata, and stores it in the permanent Vault.
- `grantReward(reward, context)` provides one reward pipeline for gold, relics, cards, Forge Tokens, unlocks, and cosmetics.
- `awardOnce(key, reward, context)` prevents duplicate achievement rewards.
- `listForgedCards()` returns the permanent forged collection.

## Persistence

Forge data is intentionally separate from battle and deck storage:

- `lady-delilah-forge-profile-v1`
- `lady-delilah-forge-vault-v1`
- `lady-delilah-forge-run-v1`

Starting a new battle or run cannot erase the permanent Vault. The public API deliberately refuses forged-card deletion.

## Budget rules

Card energy cost determines its available effect budget. Damage, armor, healing, statuses, draw, energy, conditional damage, and execute each have independent weights. Conditions and Exhaust reduce the effective budget cost.

A forged card may have no more than three structured effects. The engine returns one of five Jonas verdicts:

- invalid
- over-budget
- tempered
- balanced
- under-forged

The exact point values are an internal balancing tool and can evolve through versioned Forge schemas.

## Forge metadata

Every completed forged card records:

- `isForged`
- Forge schema version
- player name
- date forged
- run number and run ID
- accomplishment reason
- consumed token scope
- budget and spent value
- artwork pool and assigned artwork ID

Players select mechanics. The game assigns artwork separately from an approved art pool.

## Events

The foundation emits browser events for future UI, audio, analytics, and achievement systems:

- `forge:token-awarded`
- `forge:token-consumed`
- `forge:reward-granted`
- `forge:card-created`

The next milestone can build Jonas' Forge interface entirely on this contract without rewriting battle or deck storage.
