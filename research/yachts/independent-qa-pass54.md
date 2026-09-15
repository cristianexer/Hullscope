# Hullscope yacht fleet — independent QA pass 54

**Audit date:** 2026-09-15  
**Scope:** the exact 20 IDs in `research/yachts/release-selection.json` — 10 Princess and 10 Sunseeker.  
**Release decision:** **NOT RELEASABLE.** Pass 54 fixes the widespread blank engine-room renders and synchronizes the review records, but the models still fail the required visual-quality bar.

## Evidence reviewed

I enumerated the current pass-54 manifests, technical reports, masters, optimized GLBs, thumbnails, full-exterior renders, and all 111 full-room renders for the exact 20 selected IDs. I inspected one current starboard three-quarter exterior for every selected yacht, the blank-room detections, and representative furnished-room renders. I also checked the current research dossiers for model-specific geometry and layout requirements. Blender MCP inspection confirmed the 18 pass-54 shared-family scenes and the preserved bespoke V55 scene; file hashes and technical reports cover the full 20.

Representative evidence:

- [Princess R35 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-r35-gen1-2018/renders/full-review-starboard-three-quarter.png) and [engine room](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-r35-gen1-2018/renders/full-room-engine-room.png)
- [Princess F65 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-f65-gen1-2022/renders/full-review-starboard-three-quarter.png) and [main saloon](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-f65-gen1-2022/renders/full-room-main-saloon.png)
- [Princess V55 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-v55-gen2-2019/renders/full-review-starboard-three-quarter.png), [owner room](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-v55-gen2-2019/renders/full-room-full-beam-owner.png), and [blank aft guest head](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/princess-v55-gen2-2019/renders/full-room-guest-head-aft.png)
- [Sunseeker Superhawk 55 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-superhawk-55-gen1-2023/renders/full-exterior-starboard-three-quarter.png) and [owner master](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-superhawk-55-gen1-2023/renders/full-room-view-owner-master.png)
- [Sunseeker Manhattan 73 exterior](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-manhattan-73-gen1-2012/renders/full-review-starboard-three-quarter.png) and [main saloon](/Users/cristianexer/Hyperdrive/Hullscope/.tools/yachts/review/sunseeker-manhattan-73-gen1-2012/renders/full-room-main-saloon.png)

## Technical gates

| Gate | Result | Evidence |
|---|---|---|
| Exact release selection | **PASS** | 20/20 selected; 10 Princess + 10 Sunseeker |
| Manifest identity/version | **PASS** | 20/20 manifest IDs and version 2 |
| Manifest coverage | **PASS, structural only** | 474 components, 111 rooms, 59 decks, 272 camera presets |
| Masters and exchange binding | **PASS** | 20/20 current master hashes and 20/20 exchange bindings match |
| GLB presence/integrity | **PASS, structural only** | 84/84 referenced GLBs exist, have valid `glTF` headers, and are listed by technical reports |
| LOD reduction | **PASS** | 42/42 LOD pairs reduce triangles; 0 byte-identical pairs |
| Length/beam tolerance | **PASS** | 20/20 within 1%; length error 0.159–0.459%, beam error 0.001–0.940% |
| Exterior evidence presence | **PASS, evidence-only** | Required seven-view record exists for every selected yacht; at least eight full-exterior renders each |
| Room/deck evidence presence | **PASS, evidence-only** | 111 full-room renders correspond to 111 manifest rooms |
| Technical release state | **FAIL** | 20/20 `technical-review.json` files remain `visualReview: pending` and `publicationReady: false` |

## Freshness and camera-fix gates

| Gate | Result | Evidence |
|---|---|---|
| Quality-record screenshot hashes | **PASS** | 370/370 current PNG hashes match `quality.json` |
| Thumbnail visual freshness | **PASS** | All 20 thumbnails exist and are pixel-identical to their current primary three-quarter render |
| Thumbnail byte provenance | **WARNING** | Only 2/20 thumbnail files have identical bytes; 18 differ despite 20/20 pixel equality, consistent with PNG metadata/encoding differences |
| Engine-room camera fix | **PASS for blank-render removal** | The previous blank engine-room failure is cleared for 18 shared-family yachts; their engine-room images now contain visible geometry |
| V55 bespoke blank rooms | **FAIL** | `full-room-guest-head-aft.png` and `full-room-starboard-helm.png` remain effectively the dark background (mean RGB about 49.47; average channel spread about 0.48) |

The camera fix changed the pixels, not just metadata. However, the newly visible shared-family engine rooms are generally only two or a few rectangular machinery blocks; they are not complete, reference-informed machinery spaces and do not pass the furnished-room, support, materials, or distinctive-detail gates.

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

Pass 54 is visibly cleaner than pass 52: the shared-family upper works are less tall and the raised strip artifacts are reduced. It is still a stylized blockout set. The 18 shared-family exteriors remain highly repetitive: flat/slab hulls, planar blue glazing bands, stacked deck plates, boxy cabins, thin rails with weak support relationships, and minimal model-specific equipment. V55 and Superhawk are more individualized, but their hardtops, glazing, deck furniture, and interiors remain incomplete and block-like.

The room evidence repeatedly shows isolated floors and partial walls with rounded furniture primitives, missing ceilings/doors/stairs/joinery/fixtures, exposed edges, and inconsistent materials. The V55 owner room is essentially a bed and headboard; the Superhawk master is a bed surrounded by rectangular blocks. The engine-room fix removed blank output for most yachts but did not produce complete machinery spaces.

## Per-yacht disposition

All 20 are **CHANGES REQUIRED**.

| Brand | ID | Remaining blockers |
|---|---|---|
| Princess | `princess-r35-gen1-2018` | Active Foil/Pininfarina styling, curved windscreen, side deflectors, and recognizable R35 hull treatment are not resolved; detached-looking rails/side trim; rooms and engine machinery remain primitive. |
| Princess | `princess-v40-gen2-2017` | Opening hardtop, long hull-side portlights, wet-bar cockpit, and deep-V profile are not convincingly modeled; generic stacked deckwork; sparse rooms. |
| Princess | `princess-v55-gen2-2019` | Drop-down patio/opening-roof and knife-shaped hull-window identity are weak; dark planar exterior; owner room is bed-only; two required room renders are blank. |
| Princess | `princess-f45-gen1-2019` | Three-level arrangement, aft galley/cockpit relationship, and scissor-berth cabin are not visibly established; open sparse rooms and primitive engine space. |
| Princess | `princess-f55-gen1-2017` | Flybridge U-seating/sunbed, aft galley, panoramic glazing, and three-cabin arrangement read as generic boxes; incomplete room enclosure and supports. |
| Princess | `princess-f65-gen1-2022` | Three-level flagship layout, separate saloon/helm, four-cabin arrangement, and deck equipment are not recognizable; open room shells and primitive machinery. |
| Princess | `princess-y85-gen1-2019` | Full-length flybridge, wet bar, panoramic glazing, foredeck seating, and four-cabin/crew zoning are not resolved; generic upper works and sparse rooms. |
| Princess | `princess-x95-gen1-2020` | Super Flybridge/sky-lounge architecture, full-length decks, and X Class hull-window identity are absent; stacked boxes and insufficient interior architecture. |
| Princess | `princess-s65-gen1-2015` | Concealed sportsbridge, opening roof, tender garage, and aft galley/cockpit connection are not recognizable; thin unsupported plates and sparse interiors. |
| Princess | `princess-s72-gen1-2014` | Concealed sportsbridge, wraparound saloon glass, tender garage, aft sunpad, and three-cabin arrangement are not resolved; generic exterior/interior blockout. |
| Sunseeker | `sunseeker-hawk-38-gen1-2018` | Open high-performance dayboat silhouette and helm/deck hardware remain generic; only two rooms, both primitive; engine room now visible but not authored. |
| Sunseeker | `sunseeker-superhawk-55-gen1-2023` | Hardtop/windscreen, central wet bar, hydraulic bathing platform, tender garage, and two-cabin identity remain planar; owner master is bed-plus-blocks. |
| Sunseeker | `sunseeker-portofino-48-gen1-2010` | Raised cockpit/helm, tender garage, aft full-beam master, and open/hardtop distinction are not convincing; sparse rooms and primitive engine space. |
| Sunseeker | `sunseeker-predator-57-gen2-2017` | Opening roof, cockpit/saloon connection, three-cabin arrangement, tender garage, and support geometry are generic; sparse interior. |
| Sunseeker | `sunseeker-predator-74-gen2-2018` | Pillarless-window/opening-roof character, full-beam master, tender garage, and main-deck social space are not resolved; open sparse rooms. |
| Sunseeker | `sunseeker-predator-84-gen1-2008` | Large Predator proportions, optional flybridge, stern garage, and crew/service zoning are not sufficiently authored; primitive machinery and interiors. |
| Sunseeker | `sunseeker-manhattan-55-gen2-2021` | Three-level flybridge and Beach Club transom identity are missing; repeated hull/upper works, unsupported-looking fittings, and sparse rooms. |
| Sunseeker | `sunseeker-manhattan-63-gen1-2010` | Flybridge, aft galley, four-cabin/crew arrangement, and large-yacht glazing are not established; open room shells and primitive machinery. |
| Sunseeker | `sunseeker-manhattan-73-gen1-2012` | Large flybridge, wet bar, four-cabin layout, and crew zone remain generic; saloon/rooms lack complete enclosure and joinery. |
| Sunseeker | `sunseeker-90-ocean-gen1-2020` | X-TEND transom, two-tier aft terrace, broad Ocean volume, and open flybridge are not resolved; generic superstructure and incomplete interiors. |

## Highest-priority blockers

1. Replace the repeated shared-family blockouts with reference-specific hull, glazing, roofline, deck, garage/platform, and equipment geometry.
2. Finish every room as an enclosed, navigable, furnished space with ceilings/walls, doors, stairs, joinery, fixtures, and supported equipment.
3. Rebuild the V55 blank guest-head-aft and starboard-helm render states, then independently recheck all V55 rooms.
4. Turn the now-visible engine-room blocks into complete, supported machinery spaces; validate intersections, seams, camera clearance, and material continuity in every view.
5. Preserve the now-fresh screenshot records; if exact byte provenance is required, regenerate the 18 thumbnail hashes after confirming pixel identity.

**Final QA decision:** pass 54 passes selection, master/GLB presence, dimensions, LOD reduction, screenshot freshness, and blank-engine-room removal. It fails distinctive geometry, furnished/enclosed interiors, intersections, floating fittings, seams, textures, camera clipping, physical supports, materials-in-all-views, and publication readiness for all 20 yachts.
