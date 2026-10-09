# Layered Map Runtime v1.2

Status: **corrective refactor**

This revision fixes the rendering architecture without changing Map Schema 1.0.

## Why v1.1 was wrong

v1.1 displayed a precomposed raster containing islands and bases. Moving DOM hitboxes therefore did not move the visible artwork, and the dedicated red base asset was packaged but never rendered.

## v1.2 architecture

- Outer wood/frame: existing high-resolution approved map composition.
- Playable sea: independent clean runtime layer covering all baked territories.
- Routes: live SVG graph layer.
- Islands: 36 independent atlas sprites.
- Bases B/C/D: independent atlas sprites.
- Base A: independent approved dedicated red-base asset.
- Turn order: lives inside `mapScene` and has no panel/background.
- HUD: independent overlay.

## Layout

Logical scene: **1800 × 900**.

Island grid:
- X: 290, 530, 770, 1030, 1270, 1510
- Y: 150, 270, 390, 510, 630, 750

Bases:
- A: 120,135
- B: 1680,135
- C: 120,765
- D: 1680,765

The initial view uses cover scaling:
`max(viewportWidth / 1800, viewportHeight / 900)`.
This intentionally removes side bands; small top/bottom cropping is allowed on extra-wide phones.

## Balance invariant

Map Schema 1.0 is unchanged: same 36 territory numbers, same 16/12/8 level split, same graph, same bases.
