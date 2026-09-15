# Hullscope yacht fleet — independent QA pass 52

**Audit date:** 2026-09-15  
**Scope:** the exact 20 IDs in `research/yachts/release-selection.json` — 10 Princess and 10 Sunseeker.  
**Decision:** **NOT RELEASABLE.** Pass 52 improves the repeated exterior blockouts, but no yacht has evidence strong enough for visual approval.

## Evidence and method

I enumerated the current canonical manifests, GLBs, masters, technical reports, thumbnails, and pass-52 review renders under `.tools/yachts` for every selected ID. I inspected one current full-exterior three-quarter render for all 20 yachts and full-room renders across the selection, including the bespoke V55 and Superhawk sets. I compared the visible results with the audited research dossiers and their model-specific distinctive-feature/layout requirements.

Representative current evidence inspected:

- [Princess R35 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-r35-gen1-2018/renders/full-review-starboard-three-quarter.png) and [head room](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-r35-gen1-2018/renders/full-room-enclosed-head.png)
- [Princess F65 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-f65-gen1-2022/renders/full-review-starboard-three-quarter.png) and [aft galley/dinette](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-f65-gen1-2022/renders/full-room-aft-galley-and-dinette.png)
- [Princess V55 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-v55-gen2-2019/renders/full-review-starboard-three-quarter.png) and [owner room](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-v55-gen2-2019/renders/full-room-full-beam-owner.png)
- [Sunseeker Superhawk 55 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-superhawk-55-gen1-2023/renders/full-exterior-starboard-three-quarter.png) and [owner master](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-superhawk-55-gen1-2023/renders/full-room-view-owner-master.png)
- [Sunseeker Manhattan 73 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-manhattan-73-gen1-2012/renders/full-review-starboard-three-quarter.png) and [main saloon](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-manhattan-73-gen1-2012/renders/full-room-main-saloon.png)

## Structural gates

| Gate | Result | Evidence |
|---|---|---|
| Exact selection | **PASS** | 20/20 selected; 10 Princess + 10 Sunseeker |
| Manifest identity/version | **PASS** | 20/20 selected IDs present with manifest version 2 and matching vessel identity |
| Manifest semantic coverage | **PASS, structural only** | 474 selectable components, 111 rooms, 59 decks, 272 camera presets; parent/enclosure metadata is present |
| Masters | **PASS** | 20/20 `.blend` masters present; current master SHA matches each `technical-review.json` |
| Exchange/master binding | **PASS** | 20/20 current exchange authoring records bind to the current master |
| GLBs | **PASS, structural only** | 84/84 referenced GLBs exist, have valid `glTF` binary headers, and are represented in current technical reports |
| LOD reduction | **PASS** | 42/42 LOD pairs have fewer triangles at LOD1; 0 are byte-identical |
| Dimension tolerance | **PASS** | 20/20 within 1%; length error range 0.159–0.459%, beam error range 0.001–0.940% |
| Exterior evidence presence | **PASS, evidence-only** | Every selected ID has the required seven-view review record and at least eight current full-exterior renders |
| Room/deck evidence presence | **PASS, evidence-only** | Full-room render count equals the 111 manifest room records; coverage is not visual approval |
| Technical publication state | **FAIL** | 20/20 reports remain `visualReview: pending` and `publicationReady: false` |

The current coordinator quality records are explicitly drafts (`author: hullscope-coordinator-draft`, `reviewer: independent-qa-pending`) and must not be treated as independent sign-off.

## Evidence freshness gates

| Gate | Result | Evidence |
|---|---|---|
| Quality-record screenshot freshness | **FAIL** | 306/370 screenshot hashes match current PNGs; 64 are stale |
| Stale screenshot groups | **FAIL** | Princess S65: 4/19 match; Princess S72: 0/19; Sunseeker Hawk 38: 0/15; Sunseeker Portofino 48: 3/18 |
| Thumbnail freshness | **FAIL** | All 20 thumbnails exist, but only 15/20 match the current primary three-quarter render; stale: S65, S72, Hawk 38, Portofino 48, Predator 57 |
| Blank full-room renders | **FAIL** | 20 nearly blank full-room files across 18/20 yachts: the engine-room render is blank-like for 18 yachts; V55 additionally has blank guest-head-aft and starboard-helm renders |

The blank-room finding is based on the actual PNGs: the affected files are effectively the dark background (mean RGB about 49.47 with average channel spread about 0.48), not a rendered room. This is a current pass-52 evidence defect, separate from the earlier ignored master-hash warnings.

## Visual gates

| Gate | Result |
|---|---|
| Distinctive exterior geometry | **FAIL — 0/20 approved** |
| Furnished/enclosed rooms | **FAIL — 0/20 approved** |
| No visible intersections | **FAIL — 0/20 approved** |
| No floating fittings | **FAIL — 0/20 approved** |
| Closed/clean seams | **FAIL — 0/20 approved** |
| Textures | **FAIL — 0/20 approved** |
| Camera clipping/occlusion | **FAIL — 0/20 approved** |
| Physical supports | **FAIL — 0/20 approved** |
| Materials in all views | **FAIL — 0/20 approved** |

Pass 52 removes or reduces some of the most obvious raised deck-strip/over-tall-superstructure cues. The remaining current exteriors are still predominantly slab hulls with repeated boxy upper works, thin rails, planar glazing bands, unsupported-looking deck plates, limited hardware, and insufficient model-specific silhouette. The 18 shared-family outputs are visually very similar across brands and sizes. The V55 and Superhawk bespoke outputs are more differentiated, but still have large planar hardtops/side panels, sparse fittings, weak support relationships, and incomplete cabin geometry.

Room renders are not complete interiors. The shared-family images repeatedly show an isolated floor and partial walls with rounded furniture blocks, missing ceilings/doors/stairs/joinery/fixtures, and exposed edges. The V55 owner image is essentially a bed/headboard; the Superhawk master is a bed surrounded by rectangular blocks. Several expected engine rooms are blank. These conditions independently fail furnishing, enclosure, support, material, and camera-clearance gates.

## Per-yacht disposition

All 20 are **CHANGES REQUIRED**.

| Brand | ID | Highest-priority remaining defects |
|---|---|---|
| Princess | `princess-r35-gen1-2018` | Active Foil/Pininfarina silhouette, curved windscreen and side deflectors are not resolved; detached-looking side strips/rails; open sparse rooms; blank engine-room render. |
| Princess | `princess-v40-gen2-2017` | Opening hardtop, long hull-side portlights and wet-bar/cockpit identity are not convincing; generic stacked upper works; blank engine-room render. |
| Princess | `princess-v55-gen2-2019` | Drop-down patio/opening-roof and knife-shaped hull-window identity are weak; dark planar exterior; owner room is bed-only; guest-head-aft and helm renders are blank-like. |
| Princess | `princess-f45-gen1-2019` | Three-level F45 arrangement, aft galley-to-cockpit relationship and scissor-berth cabin are not visually established; sparse open rooms; blank engine-room render. |
| Princess | `princess-f55-gen1-2017` | Flybridge U-shaped dining/sunbed, aft galley and panoramic glazing are generic/flat; incomplete room enclosure; blank engine-room render. |
| Princess | `princess-f65-gen1-2022` | Flagship three-level layout, separate saloon/helm and four-cabin identity are not readable; open room shells and weak materials; blank engine-room render. |
| Princess | `princess-y85-gen1-2019` | Full-length flybridge, wet bar, panoramic glazing and four-cabin/crew arrangement are not resolved; generic upper works; blank engine-room render. |
| Princess | `princess-x95-gen1-2020` | Super Flybridge/sky-lounge architecture and near-full-length deck identity are absent; stacked boxes and thin plates; room coverage includes a blank engine-room render. |
| Princess | `princess-s65-gen1-2015` | Concealed sportsbridge, opening roof, tender garage and aft galley/cockpit connection are not recognizable; stale quality evidence 4/19 and stale thumbnail; blank engine-room render. |
| Princess | `princess-s72-gen1-2014` | Concealed sportsbridge, wraparound saloon glass, tender garage and aft sunpad are not resolved; stale quality evidence 0/19 and stale thumbnail; blank engine-room render. |
| Sunseeker | `sunseeker-hawk-38-gen1-2018` | Open high-performance dayboat profile and helm/deck hardware remain generic; stale quality evidence 0/15 and stale thumbnail; only two modeled rooms; blank engine-room render. |
| Sunseeker | `sunseeker-superhawk-55-gen1-2023` | Hardtop/windscreen, wet bar, hydraulic platform and tender-garage identity remain planar; owner master is incomplete bed-plus-blocks; support/material defects persist. |
| Sunseeker | `sunseeker-portofino-48-gen1-2010` | Raised cockpit/helm, tender garage and full-beam aft master are not convincing; stale quality evidence 3/18 and stale thumbnail; blank engine-room render. |
| Sunseeker | `sunseeker-predator-57-gen2-2017` | Opening roof, cockpit/saloon connection, three-cabin arrangement and tender garage are generic; stale thumbnail; blank engine-room render. |
| Sunseeker | `sunseeker-predator-74-gen2-2018` | Pillarless-window/opening-roof character, full-beam master and tender garage are not resolved; open sparse rooms; blank engine-room render. |
| Sunseeker | `sunseeker-predator-84-gen1-2008` | Large Predator proportions, optional flybridge, stern garage and crew/service spaces are not sufficiently authored; generic plates/supports; blank engine-room render. |
| Sunseeker | `sunseeker-manhattan-55-gen2-2021` | Three-level flybridge and Beach Club transom identity are missing; repeated generic hull/upper works; blank engine-room render. |
| Sunseeker | `sunseeker-manhattan-63-gen1-2010` | Flybridge, aft galley, four-cabin/crew arrangement and large-yacht glazing are not established; open sparse rooms; blank engine-room render. |
| Sunseeker | `sunseeker-manhattan-73-gen1-2012` | Large flybridge, wet bar, four-cabin layout and crew zone are generic; saloon is an open shell; blank engine-room render. |
| Sunseeker | `sunseeker-90-ocean-gen1-2020` | X-TEND transom, two-tier aft terrace, broad Ocean volume and open flybridge are not resolved; generic superstructure; blank engine-room render. |

## Highest-priority blockers

1. Rebuild the 18 shared-family exteriors around dossier-specific hull, glazing, roofline, deck, garage/platform, and equipment features; the current geometry is too repetitive to identify reliably.
2. Complete every room as a navigable enclosed space with ceilings/walls, doors, stairs, joinery, fixtures, and supported equipment. Replace all 20 blank-like room renders.
3. Resolve intersections, floating fittings, open seams, unsupported deck plates, camera clipping, and material/texture defects in all required views and disassembly states.
4. Regenerate quality records and thumbnails after the final render batch, especially S65, S72, Hawk 38, Portofino 48, and Predator 57.
5. Keep all `technical-review.json` records at `publicationReady: false` until an independent visual pass can verify the complete render set.

**Final QA decision:** structural packaging, master binding, dimensional tolerance, and LOD reduction pass; visual fidelity, interior completeness, evidence freshness, and release readiness fail for the full 20-yacht selection.
