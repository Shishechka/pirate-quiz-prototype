# Pirate Quiz Core v0.2

Core v0.2 is the UI-independent Rules v0.4 implementation branch.

## Source of Truth

Gameplay rules are defined in:

- `docs/PIRATE_QUIZ_RULES_v0.4.md`

If legacy runtime behavior conflicts with Rules v0.4, Rules v0.4 wins.

## Implemented in v0.2

- central GameState;
- random base assignment support;
- 36-island map and topology;
- Stage 2 settlement with 15-second numeric response validation, integer-only answers,
  speed tie-breaks and additional tie-break questions;
- first-neutral-capture boost generation using v0.4 tables;
- EconomySystem;
- FameSystem;
- Flagship model, v0.4 upgrade caps, destruction/return/paid repair;
- CrewSystem storage/purchase/install/sale rules without crew abilities;
- Stage 3 one-minute preparation deadline;
- 8 WAR turns per player plus one final tiebreak round when Fame leaders tie;
- public battle state so observers can see an attack/question but cannot submit answers;
- base Fort → Harbor → Flag persistence;
- first base capture and former-base territory ownership/Fame behavior;
- defined v0.4 boost effects where the rules are explicit.

## Intentionally unresolved

Rules v0.4 deliberately leaves these mechanics undefined, so Core does not invent them:

- exact flagship-vs-flagship Damage/HP exchange sequence;
- effects of Compass, Parrot, Powder Keg, Spare Anchor, Mercenary, Spyglass and Cursed Skull;
- actual abilities of Gunner, Navigator, Carpenter and Quartermaster;
- maximum CrewSlots;
- bot/AI behavior.

Combat exposes a defending-flagship phase, but the exact HP exchange remains blocked on a future rules decision.

## Runtime status

**Core v0.2 is still not connected to the current APK runtime.**

The Android/WebView prototype continues to use legacy `game.js` / UI patches until a separate runtime integration task is approved.

## Tests

From repository root:

```bash
node --test app/src/main/assets/core/tests/*.test.js
```
