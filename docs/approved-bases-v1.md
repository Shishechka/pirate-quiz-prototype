# Approved corner bases v1

Status: **APPROVED / LOCKED**

These four base artworks are the approved set for the corner bases. This commit stores them only; it does **not** connect them to the game renderer.

All four source images are 1254×1254 RGB PNGs. Repository copies are high-quality WebP (quality 100) split into deterministic base64 chunks under `app/src/main/assets/art-src/approved-bases-v1/`.

## A — Red — upper-left

- Position: upper-left corner.
- Approved architecture: large red stone/wood pirate fortress.
- Pier direction: **lower-right, toward the sea**.
- Source PNG SHA-256: `c1895f7b0ae7b91664435cbc6a18239f98793dd541792a4de9859a955791240e`
- Source PNG bytes: 2,682,961
- Repository WebP SHA-256: `60f30305792ebe2d3e86301d0000c9c077d9e608c6dca3ab65e1290dc3775163`
- Repository WebP bytes: 685,832

## B — Blue — upper-right

- Position: upper-right corner.
- Approved architecture: blue stone harbor fortress.
- Pier direction: **lower-left, toward the sea**.
- Source PNG SHA-256: `2674c4a2976db849cb6d3cc993624ec724ed770619a69e978603e2527d559a28`
- Source PNG bytes: 2,699,390
- Repository WebP SHA-256: `752f14a61c5025f9138ed0d8dc9146e4dd01027e9ca3172b9c89e89b8f10f0e9`
- Repository WebP bytes: 674,684

## C — Green — lower-left

- Position: lower-left corner.
- Approved architecture: green tropical fortress.
- Pier direction: **upper-right only**.
- The previously generated lower pier is explicitly removed and must not return.
- Source PNG SHA-256: `572cea8d8786e3c5e3f4df3703d48e4b4bfa31d4ce72d861194c85f921084f28`
- Source PNG bytes: 2,696,026
- Repository WebP SHA-256: `b2c1841d4ccf0e2295883b1667ae06a82a55e83e5a771d9b1d2651195b5a7cda`
- Repository WebP bytes: 704,500

## D — Purple — lower-right

- Position: lower-right corner.
- Approved architecture: purple multi-level pirate citadel.
- Pier direction: **upper-left, toward the sea**.
- Source PNG SHA-256: `8527221e66d39f780e1bd7b0dc2a8e6ce8bc06bc3caaf55fa6b228e2d2a66d8c`
- Source PNG bytes: 2,868,282
- Repository WebP SHA-256: `709a92c1d2204ff6b1dc45c1ace11b832f5ac2e729412188414da46d80bc2de6`
- Repository WebP bytes: 740,260

## Reconstruction

Each directory contains ordered `.b64` chunks. To reconstruct a base:

```bash
cat part_*.b64 | tr -d '\n\r' | base64 -d > base.webp
```

The reconstructed file must match the WebP SHA-256 above.

## Integration rule

Do not replace, recolor, rotate, mirror, crop, or substitute these four approved artworks without explicit approval. When they are later connected to the map, only placement/scale may be adjusted as separately approved.
