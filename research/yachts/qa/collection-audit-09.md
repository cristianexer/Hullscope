# Yacht collection audit 09 — independent QA

## Verdict

**Changes required. Do not release or publish the 20-yacht selection.**

The latest settled pass has complete render metadata again: all 20 metrics files contain 842 rendered views and all 391 current paths are represented. The current visual evidence is also luminance-clean: all 161 exterior, 111 room, 59 deck and 60 exploded frames clear the 8% mean-luminance threshold, no current room-camera clipping was confirmed, and Princess V55’s blank-room/deck failure is fixed.

The release remains blocked by nine stale quality master hashes, sparse/blockout rooms, weak model-specific geometry and materials, one unchanged interior LOD pair, and the absence of independent approval.

## Current-batch basis

The current batch is the canonical post-regeneration filename family under `.tools/yachts/review/*/renders`: `full-review*`, `full-room*`, `deck-*`, `exploded-*`, and Superhawk’s `full-exterior*` / `full-room-view*`. Legacy filenames were excluded from current visual counts.

| Current render type | Count |
|---|---:|
| Exterior | 161 |
| Rooms | 111 |
| Decks | 59 |
| Exploded states | 60 |
| **Total** | **391** |

Scene reports and metrics both contain all 842 rendered-view records and all 391 current paths. Quality records contain 370 current screenshot references, all with passing screenshot-file hashes; all 20 manifest hashes match. Only 11/20 quality master hashes match the current technical masters.

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
| Embedded materials / textures / images | 806 / 650 / 650 |
| Embedded image payloads | 650 × 32x32 PNG |
| Current batch in scene reports | 391/391 |
| Current batch in metrics | 391/391 |
| Scene-report / metrics rendered views | 842 / 842 |
| Quality screenshot records | 370 |
| Quality records referencing current batch | 370/370 |
| Quality screenshot-file hashes | 370/370 pass |
| Quality manifest hashes | 20/20 pass |
| Quality master hashes | 11/20 pass |
| Room-camera clipping confirmed in current batch | 0/111 |
| Current room/deck/exploded frames below 8% luminance | 0/230 |
| Current exterior frames below 8% luminance | 0/161 |
| Quality status `changes-required` | 20/20 |
| Independent approvals | 0/20 |

Quality master-hash mismatches are: Hawk 38, Portofino 48, Predator 57, Predator 74, Predator 84, Manhattan 55, Manhattan 63, Manhattan 73 and 90 Ocean. Princess records and Superhawk match current technical masters.

## Visual findings

The latest camera and lighting pass clears the evidence gates. Predator 57 and Manhattan 63 no longer show the prior room-camera hull/sidewall clipping, and no comparable clipping was confirmed in the rest of the current room set. All current room, deck, exploded and exterior frames are above the luminance threshold. V55 rooms and decks are visible rather than blank, and the below-hull view is usable.

The visual pass is not a quality approval. Rooms across all 20 yachts remain sparse cutaway assemblies—beds, partitions, benches, simple cylinders and basic equipment—with incomplete shells, joinery, fixtures and physical supports. V55’s main/lower deck evidence remains furniture-like rather than a convincing deck presentation. Superhawk has the clearest model-specific exterior silhouette, but its rooms remain coarse primitive assemblies.

The fleet still shares a simplified slab-hull/superstructure vocabulary in many exterior views. Distinctive model-specific hull, glazing, roofline and deck treatment remain insufficiently demonstrated. The 32x32 embedded images and flat color-block material treatment do not support a release-quality material verdict.

## LOD and metadata gates

Exterior LOD1 is lighter for all 20 pairs. Interior LOD1 is lighter for 21/22 pairs; Superhawk `interior-main` remains unchanged at `3904 -> 3904` triangles and is byte-identical.

Render evidence metadata is now complete and internally current. The remaining metadata defect is narrower but release-blocking: nine Sunseeker quality records retain master hashes from before the current technical-master update. Screenshot paths and screenshot-file hashes are current, so those records need master-hash refresh before they can be accepted as current evidence.

## Collection blockers

- **EVID-001 — stale quality master hashes:** 9/20 quality records do not match their current technical master hashes.
- **VIS-001 — reference fidelity:** the fleet still reads as a simplified repeated template and all 20 draft distinctive-feature checks fail.
- **VIS-002 — room/deck quality:** camera clipping and luminance are improved, but all 20 room sets remain blockouts; V55 deck views are visible but not convincingly deck-specific.
- **VIS-003 — materials:** all GLBs carry payloads, but 650 32x32 images and flat treatment do not meet visual fidelity; textures/materials-in-all-views fail on all 20 draft records.
- **TECH-001 — LOD:** Superhawk interior-main has no triangle reduction and is byte-identical between LODs.
- **APP-001 — approval:** all records remain changes-required and independent-qa-pending; technical visual reviews are pending and publication-ready flags are false.

## Per-yacht dispositions

All rows are `changes-required`. `Current` is the canonical current render count; `metrics` is the current rendered-view count; `quality-current` is the current quality screenshot reference count; `master` indicates whether that quality record’s master hash matches the current technical master.

| ID | Components / rooms / decks | Current / metrics / quality-current | Master | LOD exterior | Notes |
|---|---:|---:|:---:|---:|---|
| `princess-r35-gen1-2018` | 21 / 4 / 3 | 18 / 38 / 17 | pass | 4736→2172 | Sparse rooms and generic geometry; no current camera/luminance failure. |
| `princess-v40-gen2-2017` | 24 / 6 / 3 | 20 / 43 / 19 | pass | 5176→2384 | Generic F/V-family blockout; no clipping confirmed. |
| `princess-v55-gen2-2019` | 34 / 10 / 3 | 25 / 71 / 23 | pass | 17794→2672 | Blank evidence fixed; room/deck fidelity remains coarse. |
| `princess-f45-gen1-2019` | 23 / 5 / 3 | 19 / 55 / 18 | pass | 6368→2716 | Open-plane rooms and generic family geometry. |
| `princess-f55-gen1-2017` | 24 / 6 / 3 | 20 / 43 / 19 | pass | 6384→2716 | Sparse rooms and template exterior. |
| `princess-f65-gen1-2022` | 24 / 6 / 3 | 20 / 43 / 19 | pass | 6384→2678 | Cabins and engine room remain blockouts. |
| `princess-y85-gen1-2019` | 24 / 6 / 3 | 20 / 43 / 19 | pass | 6368→2668 | Y85 identity and room enclosure remain weak. |
| `princess-x95-gen1-2020` | 23 / 4 / 3 | 18 / 38 / 17 | pass | 6760→2732 | Sparse rooms and scaled generic hull. |
| `princess-s65-gen1-2015` | 24 / 6 / 3 | 20 / 43 / 19 | pass | 6376→2692 | S65-specific identity and supported detail remain weak. |
| `princess-s72-gen1-2014` | 24 / 6 / 3 | 20 / 43 / 19 | pass | 6376→2674 | Incomplete room architecture. |
| `sunseeker-hawk-38-gen1-2018` | 20 / 2 / 3 | 16 / 32 / 15 | **fail** | 5948→2702 | Generic sports-yacht identity; stale master hash. |
| `sunseeker-superhawk-55-gen1-2023` | 18 / 4 / 2 | 17 / 28 / 16 | pass | 13200→7116 | Visible and luminance-clean; coarse rooms; interior-main LOD unchanged. |
| `sunseeker-portofino-48-gen1-2010` | 23 / 5 / 3 | 19 / 41 / 18 | **fail** | 5616→2390 | Sparse rooms and stale master hash. |
| `sunseeker-predator-57-gen2-2017` | 24 / 6 / 3 | 20 / 34 / 19 | **fail** | 5512→2380 | Prior clipping absent; sparse rooms; stale master hash. |
| `sunseeker-predator-74-gen2-2018` | 25 / 6 / 3 | 20 / 43 / 19 | **fail** | 6820→2778 | Weak room enclosure and stale master hash. |
| `sunseeker-predator-84-gen1-2008` | 25 / 6 / 3 | 20 / 43 / 19 | **fail** | 6820→2784 | Guest rooms/day head remain slabs; stale master hash. |
| `sunseeker-manhattan-55-gen2-2021` | 24 / 6 / 3 | 20 / 43 / 19 | **fail** | 6652→2720 | Sparse Manhattan detail and stale master hash. |
| `sunseeker-manhattan-63-gen1-2010` | 24 / 6 / 3 | 20 / 34 / 19 | **fail** | 6652→2682 | Prior clipping absent; sparse rooms; stale master hash. |
| `sunseeker-manhattan-73-gen1-2012` | 24 / 6 / 3 | 20 / 43 / 19 | **fail** | 6644→2686 | Weak model-specific treatment and stale master hash. |
| `sunseeker-90-ocean-gen1-2020` | 23 / 5 / 3 | 19 / 41 / 18 | **fail** | 6584→2672 | Identity/completeness weak; stale master hash. |

## Required next gate

Refresh the nine affected quality master hashes, complete model-specific geometry and room/material work, make V55 deck views genuinely deck-specific, produce a lighter Superhawk interior-main LOD, then repeat independent QA. Publication remains blocked until every selected ID passes the draft checks and receives explicit independent approval.

This audit created only `collection-audit-09.json` and `collection-audit-09.md`; it did not modify production assets or quality records. Audits 07 and 08 were preserved.
