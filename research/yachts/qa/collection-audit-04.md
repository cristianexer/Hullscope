# Yacht collection audit 04 — independent QA

## Verdict

**Changes required. Do not release or publish the 20-yacht selection.**

All 20 selected IDs were reviewed: 10 Princess and 10 Sunseeker. The dimensional and file-integrity gates pass, but the visual release gate fails across the collection. No model has independent approval; all 20 existing quality records remain `changes-required`, all technical reviews remain `visualReview=pending`, and all `publicationReady` flags are false.

## Read-only results

| Check | Result |
|---|---:|
| Selected IDs / brand split | 20 / 10 Princess + 10 Sunseeker |
| Current Blender masters present | 20/20 |
| Manifest v2 records | 20/20 |
| Manifest asset byte/SHA checks | 84/84 pass |
| Technical asset declarations vs parsed GLBs | 84/84 pass |
| Length/beam within 1% | 20/20 pass |
| Parsed GLBs | 84 |
| GLBs with textures / images | 0 / 0 |
| Manifest components / `shape=box` | 459 / 459 |
| Canonical quality screenshots path + SHA checks | 370/370 pass |
| Declared room evidence | 111/111 covered |
| Declared deck evidence | 59/59 covered |
| Exploded 0/50/100 evidence | 60/60 covered |
| Independent approvals | 0/20 |

The evidence exists, but it records blockout-quality geometry. The inspected fleet repeats the same slab/box vocabulary: generic hulls, rectangular glazing, flat rooflines, layered sunpads and isolated furniture. Room views are generally open boards with beds, benches, partitions and cylinders rather than contained interiors with resolved joinery, fixtures and machinery.

The LOD gate also fails: all 21 interior LOD pairs are byte-identical; of 20 exterior pairs, 19 have more triangles in LOD1 than LOD0 and one has the same count. No exterior LOD1 is actually lighter by triangle count.

## Collection blockers

- **VIS-001 — reference fidelity:** all 459 semantic components are `shape=box`; all 20 exterior sets are generic or non-reference-faithful at review scale.
- **VIS-002 — rooms:** all 111 rooms have evidence, but the inspected rooms are sparse blockouts with unsupported-looking fittings and incomplete shells. The draft checks for furnished rooms, intersections, floating fittings, closed seams and physical supports fail for every yacht.
- **VIS-003 — materials:** all 84 GLBs contain zero textures and zero images. Flat procedural colors do not meet the materials/texture gate.
- **VIS-004 — cameras/lighting:** every below-hull frame is underlit or near-black. Predator 57 and Manhattan 63 additionally have room views aimed into the exterior hull.
- **TECH-001 — LODs:** the exported LOD pairs are not optimized as release LODs.
- **META-001 — metadata:** 19 `metrics.json` files report zero rendered views despite render files being present; Superhawk 55 has no `metrics.json`, and its `scene_report.json` contradicts the current six-asset manifest/technical review.
- **APP-001 — approval:** no independent approval exists, so publication remains blocked.

## Per-yacht dispositions

All rows are `changes-required`. The measured length/beam values below pass the current 1% gate; that pass does not override the visual blockers.

| ID | Measured L × B m; error % | Inventory | Measured visual/asset failures | Blockers |
|---|---|---|---|---|
| `princess-r35-gen1-2018` | 10.873 × 3.284; 0.160 / 0.419 | 21 components, 4 rooms, 3 decks, 4 GLBs | 21/21 box components; 0 textures/images; 4-room cutaway is sparse; below-hull view near-black; LOD triangles 4332 → 4736 | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-v40-gen2-2017` | 12.959 × 3.832; 0.160 / 0.571 | 23 components, 6 rooms, 3 decks, 4 GLBs | Generic F/V-family exterior; isolated cabin/saloon slabs; 0 textures/images; below-hull near-black; LOD 4542 → 4960 | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-v55-gen2-2019` | 17.892 × 4.640; 0.459 / 0.214 | 34 components, 10 rooms, 3 decks, 6 GLBs | Most component-rich Princess entry, but hardtop/glazing/decks remain broad boxes; rooms lack complete shells/joinery; 0 textures/images; below-hull near-black; both interior LOD pairs identical | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-f45-gen1-2019` | 14.327 × 4.283; 0.160 / 0.536 | 22 components, 5 rooms, 3 decks, 4 GLBs | Generic F/V-family blockout; open-plane furniture and sparse engine room; 0 textures/images; below-hull near-black; LOD 5178 → 5936 | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-f55-gen1-2017` | 17.572 × 4.903; 0.160 / 0.672 | 23 components, 6 rooms, 3 decks, 4 GLBs | Exterior interchangeable with adjacent Princess entries; cabins are beds/partitions/cubes; 0 textures/images; below-hull near-black; LOD 5170 → 5952 | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-f65-gen1-2022` | 20.267 × 5.127; 0.160 / 0.733 | 23 components, 6 rooms, 3 decks, 4 GLBs | Scaled generic blockout; open-plane cabin views and effectively empty engine room; 0 textures/images; below-hull near-black; LOD 5116 → 5952 | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-y85-gen1-2019` | 26.158 × 6.339; 0.160 / 0.617 | 23 components, 6 rooms, 3 decks, 4 GLBs | Large yacht reads as a scaled generic template; no resolved Y85-specific window/deck treatment; sparse rooms; 0 textures/images; below-hull near-black; LOD 5092 → 5936 | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-x95-gen1-2020` | 29.063 × 6.815; 0.160 / 0.667 | 22 components, 4 rooms, 3 decks, 4 GLBs | Scaled generic hull; four room views are sparse open-plane furnishings; 0 textures/images; below-hull near-black; LOD 5522 → 6376 | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-s65-gen1-2015` | 20.088 × 5.112; 0.160 / 0.639 | 23 components, 6 rooms, 3 decks, 4 GLBs | No S65-specific hull/window/deck identity; unsupported furniture slabs; 0 textures/images; below-hull near-black; LOD 5132 → 5944 | VIS-001/002/003/004, TECH-001, APP-001 |
| `princess-s72-gen1-2014` | 22.534 × 5.412; 0.160 / 0.601 | 23 components, 6 rooms, 3 decks, 4 GLBs | Generic scaled hull and furniture layers; incomplete room architecture; 0 textures/images; below-hull near-black; LOD 5110 → 5944 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-hawk-38-gen1-2018` | 11.831 × 3.027; 0.160 / 0.555 | 20 components, 2 rooms, 3 decks, 4 GLBs | Generic boxy sports-yacht blockout; only one named habitable room plus engine room, both sparse; 0 textures/images; below-hull near-black; LOD 5164 → 5948 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-superhawk-55-gen1-2023` | 17.100 × 4.943; 0.175 / 0.266 | 18 components, 4 rooms, 2 decks, 6 GLBs | Best-differentiated silhouette, but hardtop/glazing/hull remain planar boxes; lower rooms are close-up/underfilled and engine-room view is dark; 0 textures/images; exterior LODs both 6600 triangles; interior pairs identical | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-portofino-48-gen1-2010` | 16.144 × 4.329; 0.160 / 0.676 | 22 components, 5 rooms, 3 decks, 4 GLBs | Generic Sunseeker/Princess slab hull and rectangular superstructure; sparse open-plane rooms; 0 textures/images; below-hull near-black; LOD 4518 → 4968 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-predator-57-gen2-2017` | 18.211 × 4.728; 0.160 / 0.602 | 23 components, 6 rooms, 3 decks, 4 GLBs | Generic Predator profile; all inspected room frames are dominated by exterior hull/sidewall clipping rather than usable interiors; 0 textures/images; below-hull near-black; LOD 4518 → 4960 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-predator-74-gen2-2018` | 22.784 × 5.422; 0.160 / 0.783 | 24 components, 6 rooms, 3 decks, 4 GLBs | Scaled generic box/sunpad composition; open-plane room blocks lack enclosure and machinery detail; 0 textures/images; below-hull near-black; LOD 5424 → 6268 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-predator-84-gen1-2008` | 26.438 × 6.389; 0.160 / 0.769 | 24 components, 6 rooms, 3 decks, 4 GLBs | Visually interchangeable with the generic Predator/Manhattan baseline; guest rooms/day head are slabs; 0 textures/images; below-hull near-black; LOD 5432 → 6268 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-manhattan-55-gen2-2021` | 17.182 × 4.900; 0.160 / 0.615 | 23 components, 6 rooms, 3 decks, 4 GLBs | Recurring generic profile with box cabin and dark glazing; sparse rooms and minimal engine-room evidence; 0 textures/images; below-hull near-black; LOD 5174 → 5944 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-manhattan-63-gen1-2010` | 21.036 × 5.166; 0.160 / 0.706 | 23 components, 6 rooms, 3 decks, 4 GLBs | Generic scaled Manhattan; all inspected room frames are clipped into exterior hull/sidewall; 0 textures/images; below-hull near-black; LOD 5124 → 5944 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-manhattan-73-gen1-2012` | 22.564 × 5.766; 0.160 / 0.625 | 23 components, 6 rooms, 3 decks, 4 GLBs | Generic scaled template with no convincing Manhattan 73-specific hull/window treatment; sparse master/VIP/guest/galley rooms; 0 textures/images; below-hull near-black; LOD 5130 → 5936 | VIS-001/002/003/004, TECH-001, APP-001 |
| `sunseeker-90-ocean-gen1-2020` | 27.057 × 7.207; 0.160 / 0.654 | 22 components, 5 rooms, 3 decks, 4 GLBs | Distinctive enclosed-ocean architecture is not adequately represented; rooms are sparse cutaway slabs; 0 textures/images; below-hull near-black; LOD 5100 → 5936 | VIS-001/002/003/004, TECH-001, APP-001 |

## Required next gate

Regenerate the selected models from the current masters with reference-faithful hull and interior geometry, complete the materials and room assemblies, fix camera/lighting evidence, produce genuinely decreasing LODs, regenerate the contradictory metadata, and repeat this review independently. Keep publication state untouched until every selected ID has zero failing quality checks and an explicit independent approval.

Files reviewed include the current masters under `.tools/yachts/masters/`, manifests and technical reviews under `.tools/yachts/assets/models/`, exchanges under `.tools/yachts/exchange/`, and evidence under `.tools/yachts/review/`. No application code, credentials or publication state was modified.
