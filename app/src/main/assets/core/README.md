# Pirate Quiz Core v0.1

This directory is a parallel, UI-independent core extracted from the current Pirate Quiz prototype.

## Scope of v0.1

Implemented here:

- GameState
- Player
- Territory / Island
- Base
- Ship / Flagship
- Map
- RoundSystem
- TurnSystem

Not migrated yet:

- QuestionSystem
- EconomySystem
- BoostSystem
- CombatSystem
- bot controllers
- conquest / Stage 2 orchestration

Those systems remain in the legacy runtime until they are migrated in separate tasks with regression tests.

## Runtime status

**Core v0.1 is not connected to the current APK runtime.**

The existing files `game.js`, `ui_patch.js` and visual patches remain the active implementation.
The purpose of v0.1 is to establish stable data and turn/map boundaries before gameplay migration.

## Legacy baseline

The runtime baseline for comparison is:

- branch: `legacy/pirates-v1.1`
- commit: `9bf2438322584aae1b643613bdd14d3b11328d31`

## Tests

Run from this directory:

```bash
npm test
```

or from repository root:

```bash
node --test app/src/main/assets/core/tests/*.test.js
```
