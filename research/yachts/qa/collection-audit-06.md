# Yacht collection audit 06 — independent QA

## Verdict

**Changes required. Do not release or publish the 20-yacht selection.**

The refreshed workspace now passes the technical and evidence-integrity gates: authored primitive diversity is preserved, all current GLBs parse and hash correctly, all canonical render paths exist, quality paths resolve to the canonical metrics path set, and Superhawk scene/metrics metadata is synchronized. The visual release gate still fails across the collection. All 20 synchronized quality records remain `changes-required`, all technical visual reviews remain pending, and no yacht has independent approval or `publicationReady: true`.

## Read-only results

| Check | Result |
|---|---:|
| Selected IDs / brand split | 20 / 10 Princess + 10 Sunseeker |
| Current authoring/technical master hash matches | 20/20 |
| Manifest v2 records | 20/20 |
| Manifest asset byte/SHA checks | 84/84 pass |
| Technical asset declarations vs parsed GLBs | 84/84 pass |
| Length/beam within 1% | 20/20 pass |
| Manifest components | 459 |
| Component shapes | 268 box / 48 cylinder / 78 deck / 44 chamferedBox / 21 hull |
| GLBs with textures / images | 84 / 84 |
| Embedded materials / textures / images | 626 / 626 / 626 |
| Embedded image payloads | 626 × 32x32 PNG |
| Canonical metric render paths | 842/842 exist |
| Quality screenshot paths + hashes | 370/370 pass |
| Quality paths in canonical metric set | 370/370 |
| Scene reports matching metrics | 20/20 |
| Declared room evidence | 111/111 covered |
| Declared deck evidence | 59/59 covered |
| Exploded 0/50/100 evidence | 60/60 covered |
| Quality status `changes-required` | 20/20 |
| Independent approvals | 0/20 |

The previous all-box and stale-path/metadata findings are resolved. The current geometry is still visually simplified: hulls, glazing, rooflines, deck furniture and rooms use a repeated authored vocabulary, and the model-specific differences are not yet convincing enough to pass the distinctive-feature gate.

## Current visual findings

The exterior renders now show real hull, deck, chamfer and cylinder variation, with Superhawk the most differentiated. At collection scale, however, many Princess and Sunseeker entries still read as variations of the same slab-hull/template composition. All 20 synchronized quality records continue to fail `distinctive-features`.

All 111 rooms have current canonical evidence, but most are still furniture-and-partition blockouts rather than complete rooms with resolved shells, joinery, fixtures, machinery and supported fittings. Superhawk’s corrected room frames are visible and correctly selected, but remain close-up primitive assemblies. Predator 57 and Manhattan 63 still aim room cameras into the exterior hull/sidewall.

Lighting remains a release blocker. Every canonical below-hull quality frame is near-black. Twenty deck frames are below 8% mean luminance, and 44 of 370 canonical quality screenshots are below 8% overall. The corrected Superhawk room set is no longer blank, but this does not cure the room-completeness or material-fidelity failures.

## LOD and metadata gates

Exterior LOD1 has fewer triangles for 19/20 yachts. Superhawk remains `13200 -> 13200`. All 22 interior pairs retain the same triangle count; 16 are byte-identical and the remaining six differ in bytes without reducing triangles.

The metadata/path refresh passes: all 842 metric render paths exist, all 370 quality paths exist and hash correctly, every quality path is in the current metrics path set, and all 20 scene reports match their metrics render lists. These passes remove the prior synchronization blockers; they do not constitute visual approval.

## Collection blockers

- **VIS-001 — reference fidelity:** authored shape diversity is now present, but the fleet still reads as a simplified repeated template and all 20 quality records fail distinctive features.
- **VIS-002 — rooms and supports:** evidence coverage is complete, but rooms remain blockouts; all 20 records fail furnished rooms, intersections, floating fittings, closed seams and physical supports.
- **VIS-003 — materials:** all GLBs contain texture/image payloads, but the 32x32 images and flat material treatment do not meet visual fidelity; all 20 records fail textures and materials-in-all-views.
- **VIS-004 — cameras and lighting:** every below-hull frame is near-black, 20 deck frames are too dark, and Predator 57 plus Manhattan 63 have room camera clipping.
- **TECH-001 — LODs:** all interior pairs retain their triangle counts, and Superhawk has no exterior triangle reduction.
- **APP-001 — approval:** no independent approval exists; all technical visual reviews are pending and all publication-ready flags are false.

## Per-yacht dispositions

All rows are `changes-required`. Dimensional and file-integrity passes do not override the visual, LOD or approval blockers.

| ID | L × B m; error % | Inventory / shapes | Canonical evidence | LOD triangles | Current findings |
|---|---|---|---|---|---|
| `princess-r35-gen1-2018` | 10.873 × 3.284; 0.160 / 0.419 | 21 comps; 4 rooms; 3 decks; box12/chamfer2/cyl3/deck3/hull1 | 38 renders; 17 quality | 4736 → 4350; interior unchanged | Simplified varied hull/deck; sparse room boards; below-hull and one lower-deck frame near-black. |
| `princess-v40-gen2-2017` | 12.959 × 3.832; 0.160 / 0.571 | 23; 6; 3; box14/chamfer3/cyl2/deck3/hull1 | 43; 19 | 4960 → 4556; interior unchanged | Generic F/V-family profile, sparse cabins/saloon; below-hull and one deck frame near-black. |
| `princess-v55-gen2-2019` | 17.892 × 4.640; 0.459 / 0.214 | 34; 10; 3; box18/cyl6/deck8/hull2 | 71; 23 | 17794 → 17748; 2 interiors unchanged | Component-rich but broad hardtop/glazing/room blockouts; two lower-deck frames near-black. |
| `princess-f45-gen1-2019` | 14.327 × 4.283; 0.160 / 0.536 | 22; 5; 3; box13/chamfer2/cyl2/deck4/hull1 | 55; 18 | 5936 → 5168; interior unchanged | F/V-family blockout, open furniture planes and sparse engine room; below-hull/deck dark. |
| `princess-f55-gen1-2017` | 17.572 × 4.903; 0.160 / 0.672 | 23; 6; 3; box14/chamfer2/cyl2/deck4/hull1 | 43; 19 | 5952 → 5126; interior unchanged | Scaled family template; cabins are sparse beds/partitions; below-hull/deck dark. |
| `princess-f65-gen1-2022` | 20.267 × 5.127; 0.160 / 0.733 | 23; 6; 3; box14/chamfer2/cyl2/deck4/hull1 | 43; 19 | 5952 → 5058; interior unchanged | Generic scaled blockout, open-plane cabins and empty-looking engine room; below-hull/deck dark. |
| `princess-y85-gen1-2019` | 26.158 × 6.339; 0.160 / 0.617 | 23; 6; 3; box14/chamfer2/cyl2/deck4/hull1 | 43; 19 | 5936 → 5010; interior unchanged | Y85-specific glazing/deck identity remains weak; sparse rooms; below-hull, one room and deck dark. |
| `princess-x95-gen1-2020` | 29.063 × 6.815; 0.160 / 0.667 | 22; 4; 3; box12/chamfer3/cyl2/deck4/hull1 | 38; 17 | 6376 → 5432; interior unchanged | Scaled generic hull and four sparse rooms; below-hull/deck near-black. |
| `princess-s65-gen1-2015` | 20.088 × 5.112; 0.160 / 0.639 | 23; 6; 3; box14/chamfer2/cyl2/deck4/hull1 | 43; 19 | 5944 → 5084; interior unchanged | S65-specific hull/window/deck identity remains weak; unsupported furniture slabs; below-hull/deck dark. |
| `princess-s72-gen1-2014` | 22.534 × 5.412; 0.160 / 0.601 | 23; 6; 3; box14/chamfer2/cyl2/deck4/hull1 | 43; 19 | 5944 → 5032; interior unchanged | Generic scaled hull and furniture layers; incomplete room architecture; below-hull/deck dark. |
| `sunseeker-hawk-38-gen1-2018` | 11.831 × 3.027; 0.160 / 0.555 | 20; 2; 3; box10/chamfer2/cyl3/deck4/hull1 | 32; 15 | 5948 → 5104; interior unchanged | Generic sports-yacht blockout; only one named habitable room plus engine room; below-hull/deck dark. |
| `sunseeker-superhawk-55-gen1-2023` | 17.100 × 4.943; 0.175 / 0.266 | 18; 4; 2; box9/chamfer2/cyl4/deck2/hull1 | 28; 16 | 13200 → 13200; 2 interiors unchanged | Best exterior differentiation and corrected room paths, but coarse hull/hardtop/glazing/room primitives; below-hull dark; no exterior LOD reduction. |
| `sunseeker-portofino-48-gen1-2010` | 16.144 × 4.329; 0.160 / 0.676 | 22; 5; 3; box13/chamfer3/cyl2/deck3/hull1 | 41; 18 | 4968 → 4528; interior unchanged | Generic slab hull and rectangular superstructure; sparse rooms; below-hull/deck dark. |
| `sunseeker-predator-57-gen2-2017` | 18.211 × 4.728; 0.160 / 0.602 | 23; 6; 3; box14/chamfer3/cyl2/deck3/hull1 | 34; 19 | 4960 → 4518; interior unchanged | Current room frames still aimed into exterior hull/sidewall; below-hull, one room and deck dark. |
| `sunseeker-predator-74-gen2-2018` | 22.784 × 5.422; 0.160 / 0.783 | 24; 6; 3; box14/chamfer3/cyl2/deck4/hull1 | 43; 19 | 6268 → 5348; interior unchanged | Scaled generic box/sunpad composition; room blocks lack enclosure/machinery; below-hull/deck dark. |
| `sunseeker-predator-84-gen1-2008` | 26.438 × 6.389; 0.160 / 0.769 | 24; 6; 3; box14/chamfer3/cyl2/deck4/hull1 | 43; 19 | 6268 → 5342; interior unchanged | Generic Predator/Manhattan baseline; slab guest rooms/day head; below-hull, one room and deck dark. |
| `sunseeker-manhattan-55-gen2-2021` | 17.182 × 4.900; 0.160 / 0.615 | 23; 6; 3; box14/chamfer2/cyl2/deck4/hull1 | 43; 19 | 5944 → 5144; interior unchanged | Generic profile with box cabin/dark glazing; sparse rooms; below-hull/deck dark. |
| `sunseeker-manhattan-63-gen1-2010` | 21.036 × 5.166; 0.160 / 0.706 | 23; 6; 3; box14/chamfer2/cyl2/deck4/hull1 | 34; 19 | 5944 → 5060; interior unchanged | Current room frames still clipped into exterior hull/sidewall; below-hull, one room and deck dark. |
| `sunseeker-manhattan-73-gen1-2012` | 22.564 × 5.766; 0.160 / 0.625 | 23; 6; 3; box14/chamfer2/cyl2/deck4/hull1 | 43; 19 | 5936 → 5084; interior unchanged | Generic scaled template without convincing Manhattan 73 treatment; sparse rooms; below-hull/deck dark. |
| `sunseeker-90-ocean-gen1-2020` | 27.057 × 7.207; 0.160 / 0.654 | 22; 5; 3; box13/chamfer2/cyl2/deck4/hull1 | 41; 18 | 5936 → 5022; interior unchanged | Enclosed-ocean identity underrepresented; sparse cutaway rooms; below-hull/deck dark. |

## Required next gate

Complete model-specific exterior and interior geometry, resolve room supports and clipping, improve material resolution and visual treatment, fix below-hull/deck lighting, produce genuinely lighter interior LODs and a lighter Superhawk exterior LOD, then repeat independent QA. Keep publication state untouched until every selected ID has zero blocking failures and explicit independent approval.

Files reviewed include current masters and authoring manifests under `.tools/yachts/`, model manifests and technical reviews under `.tools/yachts/assets/models/`, canonical render paths from `.tools/yachts/review/*/metrics.json`, synchronized quality records under `.tools/yachts/review/`, and the selected IDs in `research/yachts/release-selection.json`. No application code, credentials or publication state was modified by this audit; audit 05 was preserved.
