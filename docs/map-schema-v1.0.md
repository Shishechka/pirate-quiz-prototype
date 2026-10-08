# Map Schema 1.0

Status: **LOCKED / canonical**

This document is the single source of truth for the balanced 40-territory map used by the no-flagship balance-test build.

## Topology

- 40 territories total: 4 bases + 36 islands.
- Islands are arranged as a 6 × 6 numbered grid, left-to-right and top-to-bottom.
- Bases:
  - A — upper-left.
  - B — upper-right.
  - C — lower-left.
  - D — lower-right.
- Normal grid graph contains horizontal links between adjacent islands in each row and vertical links between adjacent islands in each column.
- Additional diagonal links:
  - 2–7
  - 5–10
  - 15–22
  - 16–21
  - 16–23
  - 17–22
  - 25–32
  - 26–31
  - 29–34
- Base links:
  - A → 1, 7, 13
  - B → 6, 12, 18
  - C → 25, 31, 32
  - D → 30, 35, 36

## Island levels

| Row | Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 |
|---|---|---|---|---|---|---|
| 1 | #1 L1 | #2 L1 | #3 L2 | #4 L1 | #5 L1 | #6 L1 |
| 2 | #7 L1 | #8 L2 | #9 L2 | #10 L3 | #11 L2 | #12 L1 |
| 3 | #13 L1 | #14 L3 | #15 L3 | #16 L3 | #17 L2 | #18 L2 |
| 4 | #19 L2 | #20 L2 | #21 L3 | #22 L3 | #23 L3 | #24 L1 |
| 5 | #25 L1 | #26 L2 | #27 L3 | #28 L2 | #29 L2 | #30 L1 |
| 6 | #31 L1 | #32 L1 | #33 L1 | #34 L2 | #35 L1 | #36 L1 |

### Fixed sets

- L1 (16): 1, 2, 4, 5, 6, 7, 12, 13, 24, 25, 30, 31, 32, 33, 35, 36
- L2 (12): 3, 8, 9, 11, 17, 18, 19, 20, 26, 28, 29, 34
- L3 (8): 10, 14, 15, 16, 21, 22, 23, 27

## Versioning rule

Schema 1.0 is immutable. Art may change, but island numbers, levels, base positions, and graph links must not.

Any balance-driven topology or level change requires a new explicit schema version.
