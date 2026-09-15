# Hullscope yacht fleet — independent QA pass 51

**Audit date:** 2026-09-15  
**Scope:** the exact 20 IDs in `research/yachts/release-selection.json` — 10 Princess and 10 Sunseeker.  
**Disposition:** **NOT RELEASABLE.** Structural packaging is mostly sound, but the visual acceptance bar is not met for any of the 20 yachts.

## Evidence reviewed

I enumerated the canonical evidence under `.tools/yachts/review` for all 20 selected IDs, including the current full-exterior and full-room render paths, and inspected representative current exterior/interior images. I also inspected the current `technical-review.json` files and the current quality records. This pass does not carry forward the earlier master/export hash warning: the current master bindings pass.

Representative images inspected:

- [Princess R35 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-r35-gen1-2018/renders/full-review-starboard-three-quarter.png) and [galley/living room](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-r35-gen1-2018/renders/full-room-galley-living-area.png)
- [Princess F65 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-f65-gen1-2022/renders/full-review-starboard-three-quarter.png) and [main saloon](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-f65-gen1-2022/renders/full-room-main-saloon.png)
- [Princess V55 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-v55-gen2-2019/renders/full-review-starboard-three-quarter.png) and [owner cabin](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-v55-gen2-2019/renders/full-room-full-beam-owner.png)
- [Sunseeker Superhawk 55 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-superhawk-55-gen1-2023/renders/full-review-starboard-three-quarter.png) and [owner master](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-superhawk-55-gen1-2023/renders/full-room-view-owner-master.png)
- [Sunseeker Predator 74 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-predator-74-gen2-2018/renders/full-review-starboard-three-quarter.png) and [main-deck saloon](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-predator-74-gen2-2018/renders/full-room-main-deck-saloon.png)

## Gate summary

| Gate | Result | Evidence |
|---|---|---|
| Exact release selection | **PASS** | 20/20 selected IDs; 10 Princess + 10 Sunseeker |
| Identity and manifest linkage | **PASS** | 20/20 manifest IDs and technical-review IDs match selection |
| Masters and GLBs present | **PASS** | 20/20 masters; 84 referenced GLBs present and readable |
| Current master/export binding | **PASS** | 20/20 current masters match current technical/exchange bindings |
| Dimensions | **PASS** | 20/20 pass the documented 1% length/beam tolerance with calibrated endpoints |
| LOD reduction | **PASS** | 42/42 LOD pairs reduce triangles; 0 byte-identical pairs |
| Exterior evidence coverage | **PASS, evidence-only** | Required exterior view records exist for all 20; this does not imply visual approval |
| Room/deck/camera coverage | **PASS, coverage-only** | 111 rooms, 59 decks, 272 camera presets across the selection |
| Review image path integrity | **PASS** | 370 listed screenshot paths exist |
| Review image freshness | **FAIL** | Only 344/370 quality-record screenshot hashes match current PNGs; Portofino 48 is 6/18 and Predator 57 is 5/19 |
| Current technical readiness | **FAIL** | 20/20 `technical-review.json` files remain `visualReview: pending` and `publicationReady: false` |
| Visual acceptance | **FAIL** | All 20 current quality records are `changes-required`; direct inspection agrees |

## Visual gates

| Visual gate | Result |
|---|---|
| Distinctive exterior geometry | **FAIL — 0/20 approved** |
| Furnished rooms | **FAIL — 0/20 approved** |
| No visible intersections | **FAIL — 0/20 approved** |
| No floating fittings | **FAIL — 0/20 approved** |
| Closed/clean seams | **FAIL — 0/20 approved** |
| Texture quality and mapping | **FAIL — 0/20 approved** |
| Camera clipping/occlusion | **FAIL — 0/20 approved** |
| Physical supports | **FAIL — 0/20 approved** |
| Materials in all required views | **FAIL — 0/20 approved** |

The inspected renders remain reference-informed blockouts: slab-like hulls, boxy superstructures, thin detached-looking rails/trim, sparse equipment, and open room vignettes. Interiors generally show floors/walls plus a few furniture primitives rather than complete enclosed, furnished spaces with convincing joinery, fixtures, doors, stairs, and supported fittings. Materials remain basic and inconsistent, and the same failure pattern appears across brands. The recent flybridge-shoulder source change is present, but it does not bring the silhouettes to reference-faithful quality.

## Per-yacht disposition

Every selected yacht is **CHANGES REQUIRED**. The notes below are the highest-priority remaining defects visible in the current evidence.

| Brand | ID | Remaining blockers |
|---|---|---|
| Princess | `princess-r35-gen1-2018` | Flat/dark hull; long side strips and rails read detached; upper works generic; galley/living room is an open sparse vignette. |
| Princess | `princess-v40-gen2-2017` | Generic slab hull and flybridge; side bands lack convincing glazing/deck construction; rooms remain sparse/open. |
| Princess | `princess-v55-gen2-2019` | Custom render is heavily occluded/dark; layered deck/hardtop elements read planar; owner cabin is effectively bed plus blocks. |
| Princess | `princess-f45-gen1-2019` | Generic flybridge cruiser silhouette; thin rails/trim lack support; interior enclosure and furnishing incomplete. |
| Princess | `princess-f55-gen1-2017` | Boxy flybridge stack and slab hull; blue side band is not convincing glazing; rooms lack complete architectural detail. |
| Princess | `princess-f65-gen1-2022` | Faceted/slab hull and stacked deck plates; main saloon is an open room shell with sparse furniture and weak materials. |
| Princess | `princess-y85-gen1-2019` | Large-yacht proportions and superstructure remain generic; deck equipment/supports and interior enclosure are incomplete. |
| Princess | `princess-x95-gen1-2020` | Distinctive super-flybridge character is not resolved; exterior reads as stacked boxes; rooms remain under-authored. |
| Princess | `princess-s65-gen1-2015` | Generic performance-cruiser hull and glazing; detached-looking trim/rails; incomplete room shells and fittings. |
| Princess | `princess-s72-gen1-2014` | Same slab/box treatment; distinctive roofline/deck arrangement not established; interior and support-detail failures remain. |
| Sunseeker | `sunseeker-hawk-38-gen1-2018` | Performance silhouette is generic and incomplete; only limited room evidence; fittings/supports and materials fail visual gates. |
| Sunseeker | `sunseeker-superhawk-55-gen1-2023` | Large planar hardtop and side strip dominate; cabin/deck supports are not convincing; owner master is sparse and not enclosed. |
| Sunseeker | `sunseeker-portofino-48-gen1-2010` | Generic exterior/interior defects plus **stale current review hashes (6/18)**, so the visual evidence record must be regenerated/reconciled. |
| Sunseeker | `sunseeker-predator-57-gen2-2017` | Generic slab hull and boxy upper deck; sparse open interior; **stale current review hashes (5/19)** require evidence reconciliation. |
| Sunseeker | `sunseeker-predator-74-gen2-2018` | Exterior remains a white/blue slab form with generic upper works; saloon is an open shell with sparse furniture. |
| Sunseeker | `sunseeker-predator-84-gen1-2008` | Distinctive Predator proportions and hardware are not sufficiently modeled; support/seam/material and interior failures remain. |
| Sunseeker | `sunseeker-manhattan-55-gen2-2021` | Generic flybridge/hull construction; rails and deck plates read unsupported; rooms lack complete furnishing/enclosure. |
| Sunseeker | `sunseeker-manhattan-63-gen1-2010` | Boxy upper works and slab hull do not establish the Manhattan silhouette; interiors and fittings remain blockout-level. |
| Sunseeker | `sunseeker-manhattan-73-gen1-2012` | Large-yacht silhouette, deck equipment, and glazing are generic; interior support and material quality are insufficient. |
| Sunseeker | `sunseeker-90-ocean-gen1-2020` | Ocean proportions/superstructure remain flat and generic; room shells, fittings, materials, and camera-clearance issues remain. |

## Highest-priority release blockers

1. Rebuild the exterior geometry around reference-specific hull, glazing, roofline, deck, and equipment features; current models are not recognizable enough for visual approval.
2. Replace open room shells and furniture primitives with enclosed, navigable, furnished interiors with real wall/ceiling boundaries, doors, stairs, fixtures, and physical supports.
3. Resolve floating/intersecting fittings, open seams, camera clipping, and material/texture failures across all exterior and interior view sets.
4. Regenerate and re-record the Portofino 48 and Predator 57 quality evidence so the quality records match the current PNGs.
5. Keep all technical reports at `publicationReady: false` until an independent visual review passes; structural completeness alone is not sufficient.

**Final QA decision:** the fleet is structurally assembled and dimension/LOD checks pass, but **0/20 yachts are visually releasable**. Do not publish or promote this revision as the completed deliverable.
