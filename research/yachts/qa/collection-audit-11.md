# Yacht collection audit 11 — independent QA

## Verdict

**Changes required. Do not release or publish the 20-yacht selection.**

The Superhawk interior LOD blocker is cleared: `interior-main` now reduces from 1,300 to 976 triangles and from 8 to 5 render meshes, with different LOD payloads. All 20 exterior pairs and all 22 interior pairs now reduce triangles.

The release remains blocked by conservative visual findings: rooms are still sparse/blockout assemblies, model-specific geometry and materials remain weak, and no independent approval exists.

## Current-batch basis

The current batch is the canonical post-regeneration filename family under `.tools/yachts/review/*/renders`: `full-review*`, `full-room*`, `deck-*`, `exploded-*`, and Superhawk’s `full-exterior*` / `full-room-view*`. Legacy filenames were excluded from current visual counts.

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
| Components / source IDs present | 475 / 475 |
| Component fidelity | 359 reference-informed / 116 reconstructed |
| Component shapes | 284 box / 48 cylinder / 78 deck / 44 chamferedBox / 21 hull |
| GLBs with textures / images | 84 / 84 |
| Embedded materials / textures / images | 702 / 702 / 702 |
| Embedded image payloads | 702 × 32x32 PNG |
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

## Visual findings

The camera and lighting changes clear the evidence gates. Predator 57 and Manhattan 63 no longer show the prior room-camera hull/sidewall clipping, and no comparable clipping was confirmed in the remaining current room set. All current room, deck, exploded and exterior frames clear the 8% mean-luminance threshold. Princess V55’s room/deck frames are visible rather than blank, and its below-hull view is usable. The refreshed Superhawk exterior and room renders are also visible and luminance-clean.

The visual pass is not a quality approval. Rooms across all 20 yachts remain sparse cutaway assemblies—beds, partitions, benches, simple cylinders and basic equipment—with incomplete shells, joinery, fixtures and physical supports. V55’s main/lower deck evidence remains furniture-like rather than a convincing deck presentation. Superhawk’s exterior silhouette is differentiated, but its rooms remain coarse primitive assemblies.

The fleet still shares a simplified slab-hull/superstructure vocabulary in many exterior views. Distinctive model-specific hull, glazing, roofline and deck treatment remain insufficiently demonstrated. The 32x32 embedded images and flat color-block material treatment do not support a release-quality material verdict.

## LOD gate

Exterior LOD1 is lighter for 20/20 pairs. Interior LOD1 is lighter for 22/22 pairs, with no same-triangle or byte-identical pairs. Superhawk `interior-main` specifically changes from `1300 -> 976` triangles and `8 -> 5` render meshes. The LOD blocker is cleared.

## Collection blockers

- **VIS-001 — reference fidelity:** the fleet still reads as a simplified repeated template and all 20 draft distinctive-feature checks fail.
- **VIS-002 — room/deck quality:** camera clipping and luminance are improved, but all 20 room sets remain blockouts; V55 deck views are visible but not convincingly deck-specific.
- **VIS-003 — materials:** all GLBs carry payloads, but 702 32x32 images and flat treatment do not meet visual fidelity; textures/materials-in-all-views fail on all 20 draft records.
- **APP-001 — approval:** all records remain changes-required and independent-qa-pending; technical visual reviews are pending and publication-ready flags are false.

## Per-yacht dispositions

All rows are `changes-required`. `Current` is the canonical current render count; `metrics` is the current rendered-view count; `quality-current` is the current quality screenshot reference count.

| ID | Components / rooms / decks | Current / metrics / quality-current | Current disposition |
|---|---:|---:|---|
| `princess-r35-gen1-2018` | 21 / 4 / 3 | 18 / 38 / 17 | Sparse rooms and generic geometry. |
| `princess-v40-gen2-2017` | 24 / 6 / 3 | 20 / 43 / 19 | Generic F/V-family blockout. |
| `princess-v55-gen2-2019` | 34 / 10 / 3 | 25 / 71 / 23 | Blank evidence fixed; room/deck fidelity remains coarse. |
| `princess-f45-gen1-2019` | 23 / 5 / 3 | 19 / 55 / 18 | Open-plane rooms and generic family geometry. |
| `princess-f55-gen1-2017` | 24 / 6 / 3 | 20 / 43 / 19 | Sparse rooms and template exterior. |
| `princess-f65-gen1-2022` | 24 / 6 / 3 | 20 / 43 / 19 | Cabins and engine room remain blockouts. |
| `princess-y85-gen1-2019` | 24 / 6 / 3 | 20 / 43 / 19 | Y85 identity and room enclosure remain weak. |
| `princess-x95-gen1-2020` | 23 / 4 / 3 | 18 / 38 / 17 | Sparse rooms and scaled generic hull. |
| `princess-s65-gen1-2015` | 24 / 6 / 3 | 20 / 43 / 19 | S65-specific identity and supported detail remain weak. |
| `princess-s72-gen1-2014` | 24 / 6 / 3 | 20 / 43 / 19 | Incomplete room architecture. |
| `sunseeker-hawk-38-gen1-2018` | 20 / 2 / 3 | 16 / 32 / 15 | Generic sports-yacht identity. |
| `sunseeker-superhawk-55-gen1-2023` | 18 / 4 / 2 | 17 / 28 / 16 | Refreshed LOD passes; coarse rooms and materials remain. |
| `sunseeker-portofino-48-gen1-2010` | 23 / 5 / 3 | 19 / 41 / 18 | Sparse rooms and generic Portofino treatment. |
| `sunseeker-predator-57-gen2-2017` | 24 / 6 / 3 | 20 / 34 / 19 | Prior clipping absent; sparse rooms and generic identity. |
| `sunseeker-predator-74-gen2-2018` | 25 / 6 / 3 | 20 / 43 / 19 | Weak room enclosure and model identity. |
| `sunseeker-predator-84-gen1-2008` | 25 / 6 / 3 | 20 / 43 / 19 | Guest rooms/day head remain slabs. |
| `sunseeker-manhattan-55-gen2-2021` | 24 / 6 / 3 | 20 / 43 / 19 | Sparse Manhattan detail. |
| `sunseeker-manhattan-63-gen1-2010` | 24 / 6 / 3 | 20 / 34 / 19 | Prior clipping absent; sparse rooms. |
| `sunseeker-manhattan-73-gen1-2012` | 24 / 6 / 3 | 20 / 43 / 19 | Weak model-specific treatment. |
| `sunseeker-90-ocean-gen1-2020` | 23 / 5 / 3 | 19 / 41 / 18 | Identity and completeness remain weak. |

## Required next gate

Complete model-specific geometry and room/material work, make V55 deck views genuinely deck-specific, then repeat independent QA. Publication remains blocked until every selected ID passes the draft checks and receives explicit independent approval.

This audit created only `collection-audit-11.json` and `collection-audit-11.md`; it did not modify production assets or quality records. Earlier audits were preserved.
