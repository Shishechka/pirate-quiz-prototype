# Approved Art Assets v1.1

Status: **APPROVED for Map Schema 1.0**

Art Pack 1.1 keeps the canonical Schema 1.0 topology and changes only presentation.

## What changed from v1

- Runtime map resolution increased from 1600×900 to **2400×1350** and is downsampled by the WebView into the 1600×900 logical scene.
- Island positions are aligned to a strict wide 6×6 grid:
  - X: **300, 500, 700, 900, 1100, 1300**
  - Y: **170, 290, 410, 530, 650, 770**
- Bases:
  - A = (150,145)
  - B = (1450,145)
  - C = (150,755)
  - D = (1450,755)
- Random positional jitter is removed.
- The approved dedicated **red fortress** is used for Base A.
- The bottom turn-order strip is integrated visually into the map area.
- The top phase/status card is smaller and translucent.
- Initial fit uses cover scaling so no empty side bands appear.

## Runtime binaries

- `art/approved_map_v1_1.webp`
  - 2400×1350
  - 1,523,324 bytes
  - SHA-256 `f2c96d9eb7f4b95a53d87b3410ec3353af41f0bb57fc86ad80f4920275e7b39a`
- `art/base_A_red_v1_1.webp`
  - authoritative Base A source override
  - 326,066 bytes
  - SHA-256 `6273a3e3bf9400f26dcdb2f61bd9109085d4c547fdb2d0625cee4f2448444fcf`

The remaining accepted island/base sources remain preserved by Art Pack v1's atlas. Base A from that older atlas is superseded by the dedicated v1.1 red source above.

## Balance invariant

Map Schema 1.0 remains unchanged:
- 16 × L1
- 12 × L2
- 8 × L3
- same territory numbers
- same graph links
- same base ownership/corners

Art Pack 1.1 must never change gameplay topology.
