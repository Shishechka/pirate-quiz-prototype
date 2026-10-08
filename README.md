# Pirate Quiz Prototype APK v0.1

A thin native Android WebView shell containing an offline 1-player + 3-bots prototype.

## Implemented in this test build

- 36 islands + 4 bases
- conquest-style randomized starting ownership using adjacency expansion
- 8 war rounds, random turn order each round
- move flagship before attack
- one attack = a series of trivia duels
- Hard Defense: defending flagship must be sunk first
- base assault: flagship -> fort -> harbor -> flag
- Secret Route: bypass adjacency, but not Hard Defense
- +10 coins for captured territory
- ship upgrades: +HP 20, +damage 30
- move surviving flagship again after battle
- 1 human + 3 bots
- offline question bank

## Provisional rule in APK only

A sunk flagship returns at full HP at the start of its owner's next turn. This is not yet a finalized game rule.

## GitHub Actions

Push to `main` or manually run **Build debug APK**. Download artifact `pirate-quiz-v0.1-debug-apk`.


## Canonical map schema

The no-flagship balance-test branch uses **Map Schema 1.0** as the canonical 40-territory layout (4 bases + 36 islands).

Source of truth: `docs/map-schema-v1.0.md`.

The level distribution is fixed at **16 level-I, 12 level-II, 8 level-III islands**. CI rejects builds if the canonical level lists or base connections drift.
