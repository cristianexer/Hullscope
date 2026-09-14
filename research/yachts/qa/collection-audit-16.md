# Collection audit 16

## Verdict

The rebuilt 20-yacht preview collection remains **changes-required** and **release-blocked**. The five requested representative pairs show smoother hull silhouettes and stronger family/palette cues, but the exteriors still read as plate-and-block constructions and the rooms remain sparse furniture/slab cutaways. No visual approval is granted.

There is also a materialization blocker: the latest settled edit to `scripts/yachts/models/generate-generation.py` is newer than every selected master, manifest, GLB, canonical render and thumbnail. This audit makes no claim that those latest source edits are present in the current artifacts.

The preview route itself is healthy: the browser discovery test passed with 21 cards (20 preview vessels plus the preserved Octopus), the brand split is 10 Princess / 10 Sunseeker, and all five representative IDs loaded correctly in direct route checks.

## Current artifact and technical checks

| Check | Result |
|---|---:|
| Selected preview vessels | 20 — 10 Princess, 10 Sunseeker |
| Canonical render batch | 391 — 161 exterior, 111 room, 59 deck, 60 exploded |
| Metrics / scene-report render records | 842 / 842 |
| Metrics / scene-report path coverage | 391 / 391 |
| Current room frames / room sets | 111 / 20 |
| Shared two-side-wall cutaway coverage | 111/111 frames, rule verified |
| Masters / manifests | 20 / 20 present; master hashes match technical records |
| Manifest asset checks | 84/84 pass |
| Technical asset declarations | 84/84 pass |
| GLBs / embedded materials / textures / images | 84 / 702 / 702 / 702 |
| Embedded image dimensions | 702 at 128x128 |
| LOD pairs | 42/42 reduced; 0 byte-identical |
| Quality records | 20 changes-required; 20 independent-qa-pending |
| Technical visual review / publication ready | 20 pending / 20 false |
| Quality current-path refs / screenshot hash pass | 370 / 370 |
| Thumbnails | 20/20 present and non-empty |

These checks establish file presence, declarations, hashes, path coverage and route wiring. They do not establish visual approval.

## Latest source materialization gate

The latest settled local mtime for `scripts/yachts/models/generate-generation.py` was `2026-09-14T18:16:31` Europe/London. No selected artifact was at or after that edit:

| Artifact family | At or after generator edit |
|---|---:|
| Masters | 0/20 |
| Manifests | 0/20 |
| GLBs | 0/84 |
| Canonical renders | 0/391 |
| Thumbnails | 0/20 |

This is why the audit does not credit the latest curved-cabin, hull-profile or material-source edits as present in the current masters or exports. The required next step is a fresh Blender MCP rebuild/export/render/thumbnail synchronization followed by another hash and visual check.

## Representative visual review

| Yacht | Exterior finding | Room finding | Result |
|---|---|---|---|
| Princess R35 | Smoother hull entry and raised sheer are visible, but deck/superstructure plates, box glazing and simple cushion/teak slabs remain. | Readable cutaway, but mostly open teak floor, opaque wall slab and sparse furniture volumes; no resolved galley/joinery/supports. | Changes required |
| Princess F65 | Flybridge and brow cues are visible, but the cabin/glazing transitions remain generic slabs and boxes. | Low-poly white bed/bench-like volumes and a dark wall panel; saloon architecture and joinery are incomplete. | Changes required |
| Sunseeker Predator 74 | Sportsbridge, brow and cushion cues are present, but the hull, glazing and deck remain generic plate/block assemblies. | Sparse white furniture against brown wall/roof slabs; room shell, supports and fixtures are incomplete. | Changes required |
| Sunseeker Manhattan 73 | Tall roof/flybridge, mast, rails and teak cues show family identity, but the silhouette is still stepped plates with box glazing. | Sparse cutaway of furniture/partition blocks without resolved joinery, shell transitions or supports. | Changes required |
| Sunseeker Superhawk 55 | Strongest differentiation: low open sportscruiser, dark hardtop, brown hull, cockpit/wet-bar and white cushions; still simplified. | Bed and isolated vertical furniture blocks float in an open cutaway; shell, joinery and supports are unresolved. | Changes required |

The reviewed render pairs were:

- `princess-r35-gen1-2018`: `full-review-starboard-three-quarter.png`, `full-room-galley-living-area.png`
- `princess-f65-gen1-2022`: `full-review-starboard-three-quarter.png`, `full-room-main-saloon.png`
- `sunseeker-predator-74-gen2-2018`: `full-review-starboard-three-quarter.png`, `full-room-main-deck-saloon.png`
- `sunseeker-manhattan-73-gen1-2012`: `full-review-starboard-three-quarter.png`, `full-room-main-saloon.png`
- `sunseeker-superhawk-55-gen1-2023`: `full-exterior-starboard-three-quarter.png`, `full-room-view-owner-master.png`

## Release blockers

- **VIS-001 — exterior fidelity:** model cues are more differentiated, but hull curvature, sheer/chines, glazing boundaries, roofline transitions, deck geometry and distinctive fittings remain too simplified for reference-faithful approval.
- **VIS-002 — room completeness:** all 20 room sets remain blockout-level despite complete two-side-wall cutaway coverage; shells, joinery, fixtures, supports, occlusion handling and framing need another pass.
- **VIS-003 — material quality:** the palette and payload checks pass, but gelcoat, glazing, teak and interior materials still render as low-detail color blocks.
- **SOURCE-001 — source/output mismatch:** the latest generator edits are not materialized in any current selected artifact family.
- **APP-001 — independent approval:** all 20 quality records remain changes-required and pending independent QA; publicationReady is false for all 20.

## Preview integration

The local preview path was rechecked with `HULLSCOPE_YACHT_PREVIEW=1`:

- Browser discovery passed.
- The browser saw 21 cards: 20 preview yachts plus the preserved Octopus route.
- The preview catalog remains 10 Princess / 10 Sunseeker.
- Direct checks loaded the expected vessel id for all five representative routes.
- Production `src/data/yachts/release.json` remains empty and unpromoted.

Only these audit artifacts were added by this audit: `collection-audit-16.json` and `collection-audit-16.md`.
