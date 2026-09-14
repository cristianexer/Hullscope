# Yacht collection audit 12 — independent QA

## Verdict

**Changes required. Do not release or publish the 20-yacht selection.**

The latest technical and evidence refresh is internally complete: 84 GLBs, authored 128×128 texture payloads, 842 rendered views, 391 current render paths, 370 current quality screenshot hashes, complete manifest/master hashes, and full exterior/interior LOD reductions all pass.

The release is still blocked by visual fidelity. The generic interior pass improves room-specific sizing and backs the cameras out, but room review renders still have inconsistent two-side-wall cutaways and tight diagonal framing. Many rooms remain sparse primitive blockouts, model-specific geometry/materials remain weak, and no independent approval exists.

## Current-batch basis

The current batch is the canonical filename family under `.tools/yachts/review/*/renders`: `full-review*`, `full-room*`, `deck-*`, `exploded-*`, and Superhawk’s `full-exterior*` / `full-room-view*`. Legacy filenames were excluded from current visual counts.

| Current render type | Count |
|---|---:|
| Exterior | 161 |
| Rooms | 111 |
| Decks | 59 |
| Exploded states | 60 |
| **Total** | **391** |

## Read-only results

| Check | Result |
|---|---:|
| Selected IDs / brand split | 20 / 10 Princess + 10 Sunseeker |
| Authoring/technical master hash matches | 20/20 |
| Manifest v2 records | 20/20 |
| Manifest asset byte/SHA checks | 84/84 pass |
| Technical declarations vs parsed GLBs | 84/84 pass |
| Length/beam within 1% | 20/20 pass |
| Manifest components / source IDs | 476 / 476 |
| Component fidelity | 360 reference-informed / 116 reconstructed |
| Component shapes | 285 box / 48 cylinder / 78 deck / 44 chamferedBox / 21 hull |
| GLBs with textures / images | 84 / 84 |
| Embedded materials / textures / images | 702 / 702 / 702 |
| Embedded image payloads | 702 × 128x128 PNG |
| Current batch in scene reports / metrics | 391/391 |
| Scene-report / metrics rendered views | 842 / 842 |
| Quality screenshot records | 370 |
| Quality records referencing current batch | 370/370 |
| Quality screenshot-file hashes | 370/370 pass |
| Quality manifest/master hashes | 20/20 pass |
| Room-camera clipping confirmed in current batch | 0/111 |
| Current room/deck/exploded frames below 8% luminance | 0/230 |
| Current exterior frames below 8% luminance | 0/161 |
| Quality status `changes-required` | 20/20 |
| Independent approvals | 0/20 |

The first selected vessel, `princess-r35-gen1-2018`, is preserved: it remains selection index 1, its master/manifest/technical IDs match, and its current evidence is present with 18 renders, 38 metrics views and 17 quality screenshot references.

## Latest interior review

Room-specific proportional sizing is improved: the current rooms are no longer a single uniform scale and larger yachts receive larger room/furniture spans. That is only a partial pass; many assemblies still use shallow slabs and oversized/simple furniture rather than complete room architecture.

Both-side-wall cutaway handling is inconsistent. Some current views open the room enough to read the furniture, while others retain a large opaque side-wall or roof slab across the frame. Several diagonal room views remain tight even after backing the camera out, producing narrow slits or cropping the room rather than giving a dependable review view. This is a visual usability and fidelity blocker even though no literal camera/hull intersection was confirmed.

The camera and lighting gates otherwise pass. Predator 57 and Manhattan 63 no longer show the prior room-camera hull/sidewall clipping, all current room/deck/exploded/exterior frames clear the 8% mean-luminance threshold, and Princess V55’s room/deck frames are visible rather than blank.

## LOD gate

Exterior LOD1 is lighter for 20/20 pairs. Interior LOD1 is lighter for 22/22 pairs, with no same-triangle or byte-identical pairs. Superhawk `interior-main` changes from `1300 -> 976` triangles and `8 -> 5` render meshes. The prior LOD blocker is cleared.

## Collection blockers

- **VIS-001 — reference fidelity:** the fleet still reads as a simplified repeated slab-hull/superstructure vocabulary and all 20 draft distinctive-feature checks fail.
- **VIS-002 — interior fidelity and framing:** proportional sizing improved, but two-side-wall cutaways and backed-out diagonal framing remain inconsistent; all 20 room sets remain blockouts and V55 deck views remain furniture-like rather than convincingly deck-specific.
- **VIS-003 — materials:** 128×128 authored textures are present technically, but current renders still read largely as flat color-block treatments; textures/materials-in-all-views fail on all 20 draft records.
- **APP-001 — approval:** all records remain changes-required and independent-qa-pending; technical visual reviews are pending and publication-ready flags are false.

## Per-yacht dispositions

All rows are `changes-required`. `Current` is the canonical current render count; `metrics` is the current rendered-view count; `quality-current` is the current quality screenshot reference count.

| ID | Components / rooms / decks | Current / metrics / quality-current | Current disposition |
|---|---:|---:|---|
| `princess-r35-gen1-2018` | 22 / 4 / 3 | 18 / 38 / 17 | Preserved first vessel; rooms remain tight/occluded in places. |
| `princess-v40-gen2-2017` | 24 / 6 / 3 | 20 / 43 / 19 | Proportionality improved; cutaway occlusion remains. |
| `princess-v55-gen2-2019` | 34 / 10 / 3 | 25 / 71 / 23 | Blank evidence fixed; rooms/decks remain coarse and furniture-like. |
| `princess-f45-gen1-2019` | 23 / 5 / 3 | 19 / 55 / 18 | Open-plane/blockout rooms and generic family geometry. |
| `princess-f55-gen1-2017` | 24 / 6 / 3 | 20 / 43 / 19 | Sparse rooms and template exterior. |
| `princess-f65-gen1-2022` | 24 / 6 / 3 | 20 / 43 / 19 | Side-wall framing can occlude the saloon; rooms remain blockouts. |
| `princess-y85-gen1-2019` | 24 / 6 / 3 | 20 / 43 / 19 | Y85 identity and room enclosure remain weak. |
| `princess-x95-gen1-2020` | 23 / 4 / 3 | 18 / 38 / 17 | Sparse rooms and scaled generic hull. |
| `princess-s65-gen1-2015` | 24 / 6 / 3 | 20 / 43 / 19 | S65-specific identity and supported detail remain weak. |
| `princess-s72-gen1-2014` | 24 / 6 / 3 | 20 / 43 / 19 | Incomplete room architecture and tight framing. |
| `sunseeker-hawk-38-gen1-2018` | 20 / 2 / 3 | 16 / 32 / 15 | Generic sports-yacht identity. |
| `sunseeker-superhawk-55-gen1-2023` | 18 / 4 / 2 | 17 / 28 / 16 | LOD passes; coarse rooms and materials remain. |
| `sunseeker-portofino-48-gen1-2010` | 23 / 5 / 3 | 19 / 41 / 18 | Sparse rooms and generic Portofino treatment. |
| `sunseeker-predator-57-gen2-2017` | 24 / 6 / 3 | 20 / 34 / 19 | Prior clipping absent; side-wall framing and sparse rooms remain. |
| `sunseeker-predator-74-gen2-2018` | 25 / 6 / 3 | 20 / 43 / 19 | Weak room enclosure and model identity. |
| `sunseeker-predator-84-gen1-2008` | 25 / 6 / 3 | 20 / 43 / 19 | Guest rooms/day head remain slabs. |
| `sunseeker-manhattan-55-gen2-2021` | 24 / 6 / 3 | 20 / 43 / 19 | Sparse Manhattan detail. |
| `sunseeker-manhattan-63-gen1-2010` | 24 / 6 / 3 | 20 / 34 / 19 | Prior clipping absent; framing and sparse rooms remain. |
| `sunseeker-manhattan-73-gen1-2012` | 24 / 6 / 3 | 20 / 43 / 19 | Weak model-specific treatment. |
| `sunseeker-90-ocean-gen1-2020` | 23 / 5 / 3 | 19 / 41 / 18 | Identity and completeness remain weak. |

## Required next gate

Make both-side-wall cutaways consistently readable, back out and reframe diagonal room views per yacht, complete room architecture and supports, strengthen model-specific geometry/materials, then repeat independent QA. Publication remains blocked until every selected ID passes the draft checks and receives explicit independent approval.

This audit created only `collection-audit-12.json` and `collection-audit-12.md`; it did not modify production assets or quality records. Audit 11 was preserved.
