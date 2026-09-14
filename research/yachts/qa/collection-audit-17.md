# Collection audit 17

## Verdict

The beam-compensated promotion is **technically materialized**, but the collection remains **visually changes-required** and **not releasable**.

The 18-id validated beam-compensated reference set matches the canonical masters byte-for-byte, and all 20 selected yachts have current canonical masters, exchange, manifests, technical reviews, GLBs, review renders and thumbnails. The dimension correction is real: all 20 recomputed length/beam checks are within one percent.

The visual gate still fails. The seven requested representative pairs remain dominated by simplified plate/box exteriors and sparse room cutaways. The promotion fixed technical proportion evidence; it did not yet establish reference-faithful geometry, complete interiors or convincing material response.

## Promotion and technical verification

| Gate | Result |
|---|---:|
| Selected scope | 20 yachts — 10 Princess, 10 Sunseeker |
| Beam-compensated validation masters matching canonical | 18/18 |
| Beam-compensated validation exchange files matching canonical | 54/54 |
| Canonical master hash linked to exchange authoring | 20/20 |
| Canonical master hash linked to technical review | 20/20 |
| Current manifests / technical reviews | 20 / 20 |
| Canonical GLBs | 84 |
| Manifest asset SHA/byte checks | 84/84 |
| Technical asset byte checks | 84/84 |
| Recomputed dimension checks within 1% | 20/20 |
| Maximum recomputed length / beam error | 0.459% / 0.417% |
| LOD pairs | 42 — 20 exterior, 22 interior |
| LOD pairs reduced / byte-identical | 42 / 0 |
| GLBs parsed / malformed | 84 / 0 |
| Embedded materials / textures / images | 738 / 738 / 738 |
| Embedded images / buffers | 738 / 168 |
| Components / meaningful components | 476 / 431 |
| Components with source IDs | 476/476 |
| Current canonical render batch | 391 — 161 exterior, 111 room, 59 deck, 60 exploded |
| Metrics / scene render records | 842 / 842 |
| Current render path coverage | 391/391 in both records |
| Current room sets / frames | 20 / 111 |
| Thumbnails | 20/20 present and non-empty |

V55 and Superhawk are explicitly treated as inherited current sets because they are not present in the 18-id beam-compensated validation reference directory. Their canonical master, exchange, technical-review, manifest, GLB and thumbnail links still pass the current technical checks.

## Desktop LOD and preview routes

`src/viewer/AuthoredShip.tsx:73-78` selects authored LOD0 for the desktop path and LOD1 for low-detail compatibility/mobile rendering. The coordinator browser suite verified `data-loaded-lod=0` for the desktop representative-asset flow.

Preview integration also passes:

- Browser discovery passed with 21 cards: 20 preview yachts plus the preserved Octopus entry.
- Preview brand counts are 10 Princess / 10 Sunseeker.
- The coordinator browser suite passed 3 tests and explicitly skipped only the HF network test.
- Direct hash-route checks loaded all seven requested representative ids.
- Production `src/data/yachts/release.json` remains empty and unpromoted.

## Representative visual review

| Yacht | Exterior | Room | Disposition |
|---|---|---|---|
| Princess R35 | Smoother low sportsboat hull and clearer profile, but layered deck plates, box fittings and generic glazing remain. | Brown wall/floor slab and white furniture block dominate; shell, joinery, fixtures and supports are unresolved. | Changes required |
| Princess F65 | Raised flybridge and family proportion are visible, but cabin/glazing/roofline remain hard-edged slabs. | Narrow cutaway with large white box/bench volumes and brown partitions; still a layout blockout. | Changes required |
| Princess X95 | Long multi-deck arrangement is present, but the hull, window bands and transitions remain broad plates and dark rectangles. | Large blue/white rectangular volume under slab roof; enclosure, joinery and supports are missing. | Changes required |
| Sunseeker Predator 74 | Sportsbridge and aft cushion cues exist, but hull/glazing/deck read as shallow generic plate stacks. | Large blue furniture block behind partition and roof slab; shell, equipment and support logic incomplete. | Changes required |
| Sunseeker Manhattan 73 | Tall family roofline is recognizable, but hull curvature, glazing transitions and fittings remain weak. | Repeated blue furniture/brown partition/thin slab language; no resolved interior architecture. | Changes required |
| Sunseeker 90 Ocean | Enclosed multi-deck intent is visible, but Ocean identity remains broad layered slabs with limited detail. | Main saloon is a blue rectangular volume under slabs; joinery, furnishings and room enclosure are missing. | Changes required |
| Sunseeker Superhawk 55 | Strongest differentiated exterior: low sportscruiser, dark hardtop, brown side and cockpit; still coarse in rails/glazing/fittings. | Bed surrounded by isolated furniture blocks with no enclosing shell, service detail or convincing supports. | Changes required |

Reviewed canonical render pairs:

- R35: `full-review-starboard-three-quarter.png` + `full-room-galley-living-area.png`
- F65: `full-review-starboard-three-quarter.png` + `full-room-main-saloon.png`
- X95: `full-review-starboard-three-quarter.png` + `full-room-main-deck-saloon.png`
- Predator 74: `full-review-starboard-three-quarter.png` + `full-room-main-deck-saloon.png`
- Manhattan 73: `full-review-starboard-three-quarter.png` + `full-room-main-saloon.png`
- Ocean 90: `full-review-starboard-three-quarter.png` + `full-room-main-deck-saloon.png`
- Superhawk 55: `full-exterior-starboard-three-quarter.png` + `full-room-view-owner-master.png`

## Remaining release blockers

- **VIS-001 — exterior fidelity:** the dimension correction passes, but the inspected silhouettes still use simplified plate/box construction, generic glazing bands and insufficient model-specific fittings.
- **VIS-002 — room completeness:** 111/111 room frames are present, but rooms remain sparse cutaway blockouts with weak shells, joinery, fixtures, supports and sometimes overly tight framing.
- **VIS-003 — material response:** embedded payloads pass, but gelcoat, glazing, teak and interior materials still render as low-detail color blocks.
- **APP-001 — independent approval:** all 20 quality records remain changes-required and pending independent QA; `publicationReady` is false for all 20.

Next gate: deepen the seven representative geometry/material/room patterns across the fleet, rerun the full canonical visual review, and only then update quality records through a separate independent approval pass.

Only these audit artifacts were added by this audit: `collection-audit-17.json` and `collection-audit-17.md`.
