# tools/

Helper scripts (Node >= 18, no dependencies). The game itself has no build
step; these only regenerate shipped data files.

## build-map.mjs — Bangladesh map data

Generates `js/data/map-bd.js` from Natural Earth 10m Admin 0 Countries.

Source (public domain): download
`ne_10m_admin_0_countries.geojson`, e.g. from
`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson`
Then:

```bash
node tools/build-map.mjs <path-to-ne_10m_admin_0_countries.geojson> [--tolerance 0.02] [--preview <file.svg>]
```

Writes `js/data/map-bd.js` (`MAINLAND` with `I`/`M`/`C` edge tags,
`ISLANDS`, `MYANMAR_OUTLINE`). `--preview <file.svg>` writes a review SVG
(mainland strokes I=green, M=orange, C=blue; islands grey; Myanmar light
grey; Dhaka dot). Do not edit `js/data/map-bd.js` by hand — rerun this script.
