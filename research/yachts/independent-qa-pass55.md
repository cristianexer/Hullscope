# Hullscope yacht fleet — independent QA pass 55

**Audit date:** 2026-09-15  
**Scope:** exact `research/yachts/release-selection.json` selection: 20 yachts, 10 Princess and 10 Sunseeker.  
**Decision:** **NOT RELEASABLE.** Pass 55 resolves the two blank Princess V55 room images, but the collection still fails the visual-quality gates.

## Verification summary

| Check | Result | Evidence |
|---|---|---|
| Selection identity | **PASS** | 20/20 exact IDs; 10 Princess + 10 Sunseeker |
| Current masters/exchange | **PASS** | 20/20 master hashes and 20/20 exchange bindings match |
| Optimized GLBs | **PASS** | 84/84 referenced files present with valid GLB headers |
| LODs | **PASS** | 42/42 LOD1 assets have fewer triangles than LOD0 |
| Dimensions | **PASS** | 20/20 within 1%; length errors 0.159–0.459%, beam errors 0.001–0.940% |
| Manifest coverage | **PASS, structural only** | 474 components, 111 rooms, 59 decks, 272 camera presets |
| Review screenshot freshness | **FAIL** | 368/370 quality screenshot hashes match; the two stale entries are the refreshed V55 guest-head-aft and starboard-helm images |
| Thumbnail freshness | **PASS visually** | All 20 thumbnails exist and are pixel-identical to current primary exterior renders |
| V55 blank-room fix | **PASS for blank removal** | Both refreshed V55 PNGs contain visible content; neither remains background-only |
| Technical release state | **FAIL** | 20/20 reports remain `visualReview: pending`, `publicationReady: false` |

The two V55 renders are no longer blank, but they expose additional quality problems: the guest-head image is an extreme close-up of a crude oversized fixture with weak enclosure, and the helm image shows disconnected furniture/partitions, large dark voids, and incomplete helm architecture.

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

Pass 55 improves the shared-family silhouettes relative to earlier passes by reducing overly tall upper works and raised strip artifacts. The 18 shared-family yachts are still near-identical slab/box reconstructions across different ranges and lengths: flat hulls, planar glazing bands, stacked deck plates, thin rails, minimal hardware, and weak support relationships. The preserved bespoke V55 and Superhawk models are more differentiated but remain incomplete and blockout-level.

The refreshed room set is now populated, but most rooms remain isolated floors/partial walls with rounded furniture blocks, exposed edges, missing ceilings/doors/stairs/joinery/fixtures, and inconsistent material detail. Engine-room renders are visible after the fix but show only primitive machinery blocks rather than complete service spaces.

## Per-yacht disposition

Every selected yacht is **CHANGES REQUIRED**.

| Brand | ID | Remaining visual blockers |
|---|---|---|
| Princess | `princess-r35-gen1-2018` | Active Foil/Pininfarina styling, curved windscreen, side deflectors, and recognizable R35 hull treatment are not resolved; exterior trim/supports and interiors remain primitive. |
| Princess | `princess-v40-gen2-2017` | Opening hardtop, long hull-side portlights, wet-bar cockpit, and deep-V profile are not convincing; generic stacked deckwork and sparse rooms. |
| Princess | `princess-v55-gen2-2019` | Drop-down patio/opening-roof and knife-shaped hull-window identity remain weak; owner room is bed-level blockout; refreshed aft guest head and helm are visible but crudely modeled, disconnected, and poorly framed. |
| Princess | `princess-f45-gen1-2019` | Three-level arrangement, aft galley/cockpit relationship, scissor-berth cabin, and full-beam owner are not visibly established; sparse rooms and primitive machinery. |
| Princess | `princess-f55-gen1-2017` | Flybridge seating/sunbed, aft galley, panoramic glazing, and three-cabin identity read as generic boxes; incomplete enclosure and supports. |
| Princess | `princess-f65-gen1-2022` | Three-level flagship layout, separate saloon/helm, four-cabin arrangement, and deck equipment are not recognizable; open room shells and primitive machinery. |
| Princess | `princess-y85-gen1-2019` | Full-length flybridge, wet bar, panoramic glazing, foredeck seating, and four-cabin/crew zoning are not resolved; generic upper works and sparse rooms. |
| Princess | `princess-x95-gen1-2020` | Super Flybridge/sky-lounge architecture, full-length decks, and X Class hull-window identity are absent; stacked boxes and insufficient interior architecture. |
| Princess | `princess-s65-gen1-2015` | Concealed sportsbridge, opening roof, tender garage, and aft galley/cockpit connection are not recognizable; thin unsupported plates and sparse interiors. |
| Princess | `princess-s72-gen1-2014` | Concealed sportsbridge, wraparound saloon glass, tender garage, aft sunpad, and three-cabin arrangement are not resolved; generic exterior/interior blockout. |
| Sunseeker | `sunseeker-hawk-38-gen1-2018` | Open high-performance dayboat silhouette and helm/deck hardware remain generic; only two rooms, both primitive; engine room visible but not authored. |
| Sunseeker | `sunseeker-superhawk-55-gen1-2023` | Hardtop/windscreen, wet bar, hydraulic platform, tender garage, and two-cabin identity remain planar; owner master is bed-plus-blocks. |
| Sunseeker | `sunseeker-portofino-48-gen1-2010` | Raised cockpit/helm, tender garage, aft full-beam master, and open/hardtop distinction are not convincing; sparse rooms and primitive engine space. |
| Sunseeker | `sunseeker-predator-57-gen2-2017` | Opening roof, cockpit/saloon connection, three-cabin arrangement, tender garage, and support geometry are generic; sparse interior. |
| Sunseeker | `sunseeker-predator-74-gen2-2018` | Pillarless-window/opening-roof character, full-beam master, tender garage, and main-deck social space are not resolved; open sparse rooms. |
| Sunseeker | `sunseeker-predator-84-gen1-2008` | Large Predator proportions, optional flybridge, stern garage, and crew/service zoning are not sufficiently authored; primitive machinery and interiors. |
| Sunseeker | `sunseeker-manhattan-55-gen2-2021` | Three-level flybridge and Beach Club transom identity are missing; repeated hull/upper works, unsupported-looking fittings, and sparse rooms. |
| Sunseeker | `sunseeker-manhattan-63-gen1-2010` | Flybridge, aft galley, four-cabin/crew arrangement, and large-yacht glazing are not established; open room shells and primitive machinery. |
| Sunseeker | `sunseeker-manhattan-73-gen1-2012` | Large flybridge, wet bar, four-cabin layout, and crew zone remain generic; saloon/rooms lack complete enclosure and joinery. |
| Sunseeker | `sunseeker-90-ocean-gen1-2020` | X-TEND transom, two-tier aft terrace, broad Ocean volume, and open flybridge are not resolved; generic superstructure and incomplete interiors. |

## Highest-priority blockers

1. Reconcile the two V55 `quality.json` screenshot hashes after the refreshed room images; the pixels are correct but the evidence record is stale.
2. Complete the V55 aft guest head and starboard helm as enclosed, correctly framed, physically supported spaces rather than isolated primitives.
3. Replace the repeated shared-family exteriors with reference-specific hull, glazing, roofline, deck, garage/platform, and equipment geometry.
4. Finish every room and engine space with real enclosure, joinery, fixtures, machinery, support relationships, clean seams, camera clearance, and material continuity.
5. Keep all publication flags false until an independent visual pass can approve all required views and disassembly states.

**Final QA decision:** pass 55 passes structural packaging, dimensions, LOD reduction, thumbnail pixel freshness, and removal of blank engine-room output. It fails visual fidelity and release readiness for all 20 yachts.
