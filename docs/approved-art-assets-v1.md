# Approved Art Assets v1

Status: **LOCKED for Map Schema 1.0**

This pack contains the accepted visual set used by the no-flagship balance-test build. The runtime map is composed from **36 unique island variants + 4 unique faction bases**. No island image is repeated.

## Binary materialization

The repository stores the binaries as deterministic base64 parts:

- `app/src/main/assets/art-src/map/map_01.b64 … map_09.b64`
- `app/src/main/assets/art-src/atlas/atlas_01.b64 … atlas_09.b64`

CI reconstructs:

- `art/approved_map_v1.webp` — 1600×900 runtime map; SHA-256 `01b896b10fd46edc523ce1ded411690b1dc84fd0d730904813eba80141c14a1d`; 521,468 bytes.
- `art/approved_assets_atlas_v1.webp` — source atlas of all 40 accepted assets; SHA-256 `7c2c52440e8afa202ac78324f9b410409c941bf984096dd823640597af2889cf`; 538,756 bytes.

The map background is based on the approved turquoise-sea parchment-on-wood artwork. Islands are rendered without their own surrounding water so they visually belong to the same sea.

## Schema 1.0 assignment

### L1 — 16 unique variants
Territories: **1, 2, 4, 5, 6, 7, 12, 13, 24, 25, 30, 31, 32, 33, 35, 36**.

Atlas cells **0–15** contain the final 16 variants selected from the accepted 19-island L1 sheet. Each has a simple hut/pier silhouette and no fortification tier above L1.

### L2 — 12 unique variants
Territory → source variant:

- #3 → `forteresse_tropicale_sur_îlot_rocheux.png`
- #8 → `imagegen.png`
- #9 → `isometric_tropeninsel_mit_palisadenfort.png`
- #11 → `izometrisches_tropenfort_mit_holzsteg.png`
- #17 → `островной_форпост_среди_тропиков.png`
- #18 → `тропический_островной_аванпост.png`
- #19 → `тропический_островной_форпост.png`
- #20 → `тропический_островной_форпост_с_доком.png`
- #26 → `тропический_островной_форпост_с_причалом.png`
- #28 → `тропический_островной_форт_с_пирсом.png`
- #29 → `тропический_островной_форт_с_причалом.png`
- #34 → `укреплённый_тропический_остров_второго_уровня.png`

Atlas cells **16–27**.

### L3 — 8 unique variants
Territory → source variant:

- #10 → `tropical_island_fort_diorama.png`
- #14 → `tropikāla_sala_ar_koka_cietoksni.png`
- #15 → `изометрический_форт_на_тропическом_острове.png`
- #16 → `крепость_пиратского_острова_с_причалом.png`
- #21 → `пиратская_крепость_на_тропическом_острове.png`
- #22 → `тропическая_крепость_на_острове_с_причалом.png`
- #23 → `тропическая_крепость_с_доком.png`
- #27 → `тропическая_пиратская_крепость_на_острове.png`

Atlas cells **28–35**.

### Bases — 4 unique architectures
- A / Red / upper-left → atlas cell 36.
- B / Blue / upper-right → atlas cell 37.
- C / Green / lower-left → atlas cell 38.
- D / Purple / lower-right → atlas cell 39.

The four bases intentionally differ in architecture, not only flag color.

## Rules

1. Map Schema 1.0 determines territory numbers, levels, positions, and graph links.
2. Art Pack v1 only changes visuals; it must not modify balance topology.
3. No duplicate island artwork is allowed inside the 36-island runtime composition.
4. Replacing an accepted asset requires an explicit Art Pack version bump.
