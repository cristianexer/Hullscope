# Collection audit 13

## Verdict

The collection remains **changes-required / release hold**. Publication is not allowed: `0/20` have independent approval and all 20 draft quality records remain `changes-required` with `independent-qa-pending`.

The latest shared two-side-wall cutaway rule is genuinely present in the renderer and its current output coverage: `20/20` selected yachts and `111/111` current room frames were refreshed after the renderer change. That is a meaningful presentation fix, but it does not pass the visual gate. The room sheet still reads as repeated, sparse furniture/blockout assemblies with shallow or open shells, residual forward/roof/bulkhead occlusion and tight diagonal framing in several views. Exterior identity and material fidelity also remain unproven.

## Evidence and technical gates

| Gate | Result |
|---|---:|
| Selected yachts | 20 — 10 Princess, 10 Sunseeker |
| Current render batch | 391 — 161 exterior, 111 room, 59 deck, 60 exploded |
| Current output freshness | 391/391 at or after `render-qa-states.py` mtime |
| Metrics / scene current-path coverage | 391 / 391 |
| Quality screenshot refs / hashes | 370 / 370 |
| Manifest / master hash matches | 20 / 20 |
| Manifest components / with source IDs | 476 / 476 |
| GLB asset declaration checks | 84 / 84 |
| Embedded material / texture / image records | 702 / 702 / 702 |
| Embedded image payloads | 702 at 128×128 |
| Dimension checks within 1% | 20 / 20 |
| Exterior LOD1 triangle reductions | 20 / 20 |
| Interior LOD1 triangle reductions | 22 / 22 |
| Room frames below 8% mean luminance | 0 / 111 |
| Literal room-camera clipping confirmed | 0 / 111 |

The first selected vessel is preserved: `princess-r35-gen1-2018` remains index 1, its master/manifest/technical IDs match, and its current render, metrics and quality evidence remain present and hashed.

## Shared cutaway-rule verification

The renderer’s shared path at `scripts/yachts/render-qa-states.py:101-115` hides selected-room objects marked `roomCutaway` or named as port/starboard walls, and removes wall/partition/bulkhead context from the shared lower shell. The room-camera call site is at lines 159–161. Every manifest room has a current quality screenshot, every selected yacht has complete room coverage, and all 111 current room images are newer than the updated renderer.

Visual result: rule application is consistent enough to verify, but the presentation is not sufficient for release. Hiding side walls exposes the repeated furniture language; it does not supply missing room architecture, joinery, fixtures, machinery or supports. Some frames still have opaque roof/forward/bulkhead masses and narrow diagonal compositions.

## Blockers

- **VIS-001 — reference-faithful geometry:** the exterior sheet remains dominated by a repeated simplified slab-hull/superstructure vocabulary. Superhawk is the clearest differentiated silhouette, but the fleet as a whole does not demonstrate model-specific hull, glazing, roofline and deck fidelity.
- **VIS-002 — room fidelity and readability:** the two-side-wall rule is applied across all 20 room sets, but all remain blockout-level. Several rooms show beds, sofas, partitions and simple equipment rather than complete interiors; residual occlusion and tight framing remain, and V55 saloon is still furniture-like rather than deck-specific.
- **VIS-003 — materials:** all GLBs have 128×128 texture/image payloads, but the renders still read largely as flat color blocks with weak model-specific material differentiation. The draft `textures` and `materials-in-all-views` checks fail on every record.
- **APP-001 — approval:** no selected yacht has explicit independent approval; technical visual review is pending and `publicationReady` is false for all 20.

## Per-yacht status

Every selected ID carries `VIS-001`, `VIS-002`, `VIS-003` and `APP-001`. Room-rule coverage is complete for each row.

| ID | Components | Rooms | Current files | Room frames | Metrics | Quality refs |
|---|---:|---:|---:|---:|---:|---:|
| `princess-r35-gen1-2018` | 22 | 4 | 18 | 4 | 38 | 17 |
| `princess-v40-gen2-2017` | 24 | 6 | 20 | 6 | 43 | 19 |
| `princess-v55-gen2-2019` | 34 | 10 | 25 | 10 | 71 | 23 |
| `princess-f45-gen1-2019` | 23 | 5 | 19 | 5 | 55 | 18 |
| `princess-f55-gen1-2017` | 24 | 6 | 20 | 6 | 43 | 19 |
| `princess-f65-gen1-2022` | 24 | 6 | 20 | 6 | 43 | 19 |
| `princess-y85-gen1-2019` | 24 | 6 | 20 | 6 | 43 | 19 |
| `princess-x95-gen1-2020` | 23 | 4 | 18 | 4 | 38 | 17 |
| `princess-s65-gen1-2015` | 24 | 6 | 20 | 6 | 43 | 19 |
| `princess-s72-gen1-2014` | 24 | 6 | 20 | 6 | 43 | 19 |
| `sunseeker-hawk-38-gen1-2018` | 20 | 2 | 16 | 2 | 32 | 15 |
| `sunseeker-superhawk-55-gen1-2023` | 18 | 4 | 17 | 4 | 28 | 16 |
| `sunseeker-portofino-48-gen1-2010` | 23 | 5 | 19 | 5 | 41 | 18 |
| `sunseeker-predator-57-gen2-2017` | 24 | 6 | 20 | 6 | 34 | 19 |
| `sunseeker-predator-74-gen2-2018` | 25 | 6 | 20 | 6 | 43 | 19 |
| `sunseeker-predator-84-gen1-2008` | 25 | 6 | 20 | 6 | 43 | 19 |
| `sunseeker-manhattan-55-gen2-2021` | 24 | 6 | 20 | 6 | 43 | 19 |
| `sunseeker-manhattan-63-gen1-2010` | 24 | 6 | 20 | 6 | 34 | 19 |
| `sunseeker-manhattan-73-gen1-2012` | 24 | 6 | 20 | 6 | 43 | 19 |
| `sunseeker-90-ocean-gen1-2020` | 23 | 5 | 19 | 5 | 41 | 18 |

## Required next gate

Retain the verified shared cutaway implementation, then complete model-specific exterior geometry/materials and room architecture, remove residual occlusion, reframe every diagonal room view, and add supported fixtures/machinery. After those changes, regenerate the canonical batch and run a new independent QA review. Do not publish until every selected ID passes the visual checks and receives explicit approval.

Only these audit artifacts were added by this audit: `collection-audit-13.json` and `collection-audit-13.md`.
