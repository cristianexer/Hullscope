# Yacht collection audit 05 — independent QA

## Verdict

**Changes required. Do not release or publish the 20-yacht selection.**

All 20 selected IDs were reviewed against the latest regenerated assets and evidence: 10 Princess and 10 Sunseeker. File integrity, GLB declarations, dimensions, evidence coverage and quality screenshot hashes pass. The release gate still fails on reference fidelity, room completeness, camera/lighting, LOD quality, metadata consistency and independent approval. No model is publication-ready.

The regenerated release is materially better than audit 04 in two technical respects: all 84 GLBs now contain embedded material/texture/image payloads, and exterior LOD1 has fewer triangles for 19 of 20 yachts. Those changes do not make the collection releasable. All 20 quality records remain `changes-required`; Superhawk's metrics file still reports `renderedViews: []`; and the visual evidence still reads as generic blockout geometry. The Superhawk room evidence is especially severe: all four room frames are near-black.

## Read-only results

| Check | Result |
|---|---:|
| Selected IDs / brand split | 20 / 10 Princess + 10 Sunseeker |
| Current masters present | 20/20 |
| Manifest v2 records | 20/20 |
| Manifest asset byte/SHA checks | 84/84 pass |
| Technical asset declarations vs parsed GLBs | 84/84 pass |
| Length/beam within 1% | 20/20 pass |
| Parsed GLBs | 84 |
| GLBs with textures / images | 84 / 84 |
| Embedded texture records / image records | 626 / 626 |
| Sampled embedded image payload | 32x32 PNG authored-albedo images |
| Manifest components / `shape=box` | 459 / 443 |
| Quality screenshot path + SHA checks | 370/370 pass |
| Declared room evidence | 111/111 covered |
| Declared deck evidence | 59/59 covered |
| Exploded 0/50/100 evidence | 60/60 covered |
| Render evidence files | 842 |
| Metrics files with zero rendered views | 1/20 (Superhawk) |
| Quality status `changes-required` | 20/20 |
| Independent approvals | 0/20 |

### Visual gate

The exterior fleet remains dominated by a repeated slab/box vocabulary: generic hulls, broad rectangular glazing, flat rooflines, layered sunpads and isolated deck furniture. Princess V55 has some primitive variation and Superhawk has the strongest silhouette/material differentiation, but neither is reference-faithful enough for release.

The 111 room files exist, but the rooms are generally open cutaway boards with beds, benches, partitions, cylinders and sparse engine-room spaces rather than contained interiors with resolved joinery, fixtures, machinery and physical supports. Predator 57 and Manhattan 63 have room views visibly clipped into the exterior hull/sidewall.

Every below-hull frame is near-black. Across all 370 current quality screenshots, 50 are below 8% mean luminance. Deck evidence also contains unusable dark frames. Superhawk has four near-black room frames covering its master, VIP, lobby and engine room, plus a near-black lower-deck frame.

### LOD gate

Exterior LODs improved for 19/20 pairs, but Superhawk remains `3300 -> 3300` triangles. All 22 interior pairs have the same triangle count; 16 are byte-identical and the other six differ in bytes without reducing triangles. The interior LOD gate therefore fails for the full collection.

### Metadata gate

The current technical payloads and the review records are not fully self-consistent. All 20 metrics files are present, but Superhawk alone reports an empty `renderedViews` array despite 28 current render files. The quality records still carry the draft `textures` and `materials-in-all-views` failures after the GLB payload regeneration, so they require regeneration and fresh review rather than being interpreted as current approvals.

Superhawk has an additional contradiction: its current `scene_report.json` declares an empty manifest asset list and empty `renderOutputs`, while the current manifest/technical set contains six GLBs and the review directory contains 28 render files.

## Collection blockers

- **VIS-001 — reference fidelity:** 443 of 459 manifest components are boxes, 19 yachts are entirely box-component assemblies, and the visual review does not demonstrate model-specific hull, glazing, roofline and deck geometry.
- **VIS-002 — rooms and supports:** all 111 rooms have evidence, but the rooms are sparse blockouts with unresolved enclosures, joinery, fixtures, machinery, supports and seam closure. The draft checks for furnished rooms, intersections, floating fittings, closed seams and physical supports fail on all 20 records.
- **VIS-003 — materials:** texture/image payload presence is now technically confirmed, but the sampled payloads are 32x32 authored-albedo swatches, material treatment remains flat/simplified, and current quality records still fail `textures` and `materials-in-all-views`.
- **VIS-004 — cameras and lighting:** every below-hull frame is near-black; deck evidence includes dark unusable views; Predator 57 and Manhattan 63 have room clipping; all four Superhawk room views are near-black.
- **TECH-001 — LODs:** all interior pairs have unchanged triangle counts, and Superhawk has no exterior triangle reduction.
- **META-001 — review metadata:** Superhawk's metrics file reports zero rendered views despite current render files, and the quality records were not regenerated to reconcile the current technical payloads and visual evidence.
- **META-002 — Superhawk scene report:** the current scene report declares empty assets and render outputs despite current verified GLBs and render files.
- **APP-001 — approval:** no selected yacht has explicit independent approval; publication remains blocked.

## Per-yacht dispositions

All rows are `changes-required`. The dimensional pass below does not override the visual, metadata, LOD or approval blockers.

| ID | Measured L × B m; error % | Inventory | Current visual/technical findings | Blockers |
|---|---|---|---|---|
| `princess-r35-gen1-2018` | 10.873 × 3.284; 0.160 / 0.419 | 21 components; 4 rooms; 3 decks; 4 GLBs | All components boxes; sparse room cutaway; below-hull near-black; deck frame dark; LOD `4736 -> 4350`; 30 embedded material/texture/image records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-v40-gen2-2017` | 12.959 × 3.832; 0.160 / 0.571 | 23; 6 rooms; 3 decks; 4 GLBs | Generic F/V-family exterior and isolated cabin/saloon slabs; sparse rooms; below-hull/deck dark; LOD `4960 -> 4556`; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-v55-gen2-2019` | 17.892 × 4.640; 0.459 / 0.214 | 34; 10 rooms; 3 decks; 6 GLBs | Most component-rich Princess entry and only varied primitive mix, but hardtop/glazing/decks remain broad blockout forms; two deck frames near-black; exterior LOD only `17794 -> 17748`; interior pair has no triangle reduction; 50 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-f45-gen1-2019` | 14.327 × 4.283; 0.160 / 0.536 | 22; 5 rooms; 3 decks; 4 GLBs | Generic F/V-family blockout; open-plane furniture and sparse engine room; below-hull/deck dark; LOD `5936 -> 5168`; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-f55-gen1-2017` | 17.572 × 4.903; 0.160 / 0.672 | 23; 6 rooms; 3 decks; 4 GLBs | Exterior interchangeable with adjacent Princess entries; cabins are beds/partitions/cubes; below-hull/deck dark; LOD `5952 -> 5126`; 28 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-f65-gen1-2022` | 20.267 × 5.127; 0.160 / 0.733 | 23; 6 rooms; 3 decks; 4 GLBs | Scaled generic blockout; open-plane cabin views and effectively empty engine room; below-hull/deck dark; LOD `5952 -> 5058`; 28 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-y85-gen1-2019` | 26.158 × 6.339; 0.160 / 0.617 | 23; 6 rooms; 3 decks; 4 GLBs | Scaled generic template without resolved Y85-specific glazing/deck treatment; sparse rooms; below-hull, one room and deck dark; LOD `5936 -> 5010`; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-x95-gen1-2020` | 29.063 × 6.815; 0.160 / 0.667 | 22; 4 rooms; 3 decks; 4 GLBs | Scaled generic hull; four sparse open-plane rooms; below-hull/deck near-black; LOD `6376 -> 5432`; 26 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-s65-gen1-2015` | 20.088 × 5.112; 0.160 / 0.639 | 23; 6 rooms; 3 decks; 4 GLBs | No convincing S65-specific hull/window/deck identity; unsupported furniture slabs; below-hull/deck dark; LOD `5944 -> 5084`; 28 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `princess-s72-gen1-2014` | 22.534 × 5.412; 0.160 / 0.601 | 23; 6 rooms; 3 decks; 4 GLBs | Generic scaled hull and furniture layers; incomplete room architecture; below-hull/deck dark; LOD `5944 -> 5032`; interior pair has no triangle reduction; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-hawk-38-gen1-2018` | 11.831 × 3.027; 0.160 / 0.555 | 20; 2 rooms; 3 decks; 4 GLBs | Generic boxy sports-yacht blockout; only one named habitable room plus engine room, both sparse; below-hull/deck dark; LOD `5948 -> 5104`; 28 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-superhawk-55-gen1-2023` | 17.100 × 4.943; 0.175 / 0.266 | 18; 4 rooms; 2 decks; 6 GLBs | Strongest exterior differentiation but still planar box hull/hardtop/glazing; all four room frames near-black; lower deck near-black; scene report empty assets/render outputs; LOD `3300 -> 3300`; interior pairs have no triangle reduction; 52 embedded records | VIS-001/002/003/004, TECH-001, META-001/002, APP-001 |
| `sunseeker-portofino-48-gen1-2010` | 16.144 × 4.329; 0.160 / 0.676 | 22; 5 rooms; 3 decks; 4 GLBs | Generic Sunseeker/Princess slab hull and rectangular superstructure; sparse open-plane rooms; below-hull/deck dark; LOD `4968 -> 4528`; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-predator-57-gen2-2017` | 18.211 × 4.728; 0.160 / 0.602 | 23; 6 rooms; 3 decks; 4 GLBs | Generic Predator profile; room frames clipped into exterior hull/sidewall; below-hull, one room and deck dark; LOD `4960 -> 4518`; interior pair has no triangle reduction; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-predator-74-gen2-2018` | 22.784 × 5.422; 0.160 / 0.783 | 24; 6 rooms; 3 decks; 4 GLBs | Scaled generic box/sunpad composition; room blocks lack enclosure and machinery; below-hull/deck dark; LOD `6268 -> 5348`; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-predator-84-gen1-2008` | 26.438 × 6.389; 0.160 / 0.769 | 24; 6 rooms; 3 decks; 4 GLBs | Interchangeable with generic Predator/Manhattan baseline; guest rooms/day head are slabs; below-hull, one room and deck dark; LOD `6268 -> 5342`; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-manhattan-55-gen2-2021` | 17.182 × 4.900; 0.160 / 0.615 | 23; 6 rooms; 3 decks; 4 GLBs | Generic profile with box cabin and dark glazing; sparse rooms and minimal engine-room evidence; below-hull/deck dark; LOD `5944 -> 5144`; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-manhattan-63-gen1-2010` | 21.036 × 5.166; 0.160 / 0.706 | 23; 6 rooms; 3 decks; 4 GLBs | Generic scaled Manhattan; room frames clipped into exterior hull/sidewall; below-hull, one room and deck dark; LOD `5944 -> 5060`; 28 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-manhattan-73-gen1-2012` | 22.564 × 5.766; 0.160 / 0.625 | 23; 6 rooms; 3 decks; 4 GLBs | Generic scaled template without convincing Manhattan 73-specific treatment; sparse master/VIP/guest/galley rooms; below-hull/deck dark; LOD `5936 -> 5084`; 28 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |
| `sunseeker-90-ocean-gen1-2020` | 27.057 × 7.207; 0.160 / 0.654 | 22; 5 rooms; 3 decks; 4 GLBs | Distinctive enclosed-ocean architecture is not adequately represented; rooms are sparse cutaway slabs; below-hull/deck dark; LOD `5936 -> 5022`; 30 embedded records | VIS-001/002/003/004, TECH-001, META-001, APP-001 |

## Required next gate

Regenerate the selected models with reference-faithful hull and interior geometry, complete room assemblies and materials, fix camera/lighting evidence, produce genuinely decreasing interior LODs and the Superhawk exterior LOD, regenerate metrics/scene/quality metadata, and repeat this review independently. Keep publication state untouched until every selected ID has zero blocking failures and an explicit independent approval.

Files reviewed include the current masters under `.tools/yachts/masters/`, manifests and technical reviews under `.tools/yachts/assets/models/`, exchanges under `.tools/yachts/exchange/`, and evidence under `.tools/yachts/review/`. No application code, credentials or publication state was modified. Audit 04 was preserved; this report is the fresh audit 05 result.
