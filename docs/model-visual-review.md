# Model visual review — 8 September 2026

## Scope and evidence

Reviewed the refreshed production screenshots for all 28 vessels in the **Below** and **Stern** camera presets, assembled at 0% disassembly. The Below preset removes water, exposing the shell. Evidence is stored in `output/playwright/fleet/{vessel-id}-{below,stern}.png`; comparative sheets are `output/playwright/below-contact-sheet.png` and `output/playwright/stern-contact-sheet.png`.

All 56 panels were visually inspected. Full-resolution images were also inspected for the first seven Below views, the first four Stern views, and the Below views of Sleipnir, Francisco, Sparky and HMS Defender. These additional checks distinguish intentional twin hulls, support columns, propulsors and rudders from the previously reported overlapping lower-shell artifacts.

Separately inspected full-resolution exteriors for Berge Olympus, NLV Pharos, S. A. Agulhas II and Sparky against the specific public photographs documented in their dossiers. This is a visual coherence review of original educational geometry, not certification of replica accuracy, hydrostatics or real equipment placement.

## Hull result

The reviewed views show continuous external bottom surfaces and closed end silhouettes. None shows the previous detached lower-hull blade, overlapping paint shell or open slit at the upper/lower paint junction. Hull shading and paint boundaries stay continuous through the bow and rounded bilge. Small propulsor, shaft and rudder projections are intentionally separate equipment.

| Vessel | Below / Stern finding |
|---|---|
| Ever Ace | Continuous green/red shell and closed transom; propeller/rudder distinct. |
| Berge Olympus | Continuous red paint transition and rounded aft body; no detached underside. |
| BBC Bangkok | Closed blue/red body; attached aft appendages. |
| BOKA Vanguard | Closed rectangular transport-hull envelope; planar underside is deliberate. |
| Höegh Aurora | Continuous rounded lower body beneath vehicle decks; aft ramp distinct. |
| DHT Bronco | Continuous red shell through stern and bow; no seam gap. |
| Bow Pioneer | Continuous orange/red envelope; closed transom. |
| Christophe de Margerie | Continuous lower body and closed stern; azimuth equipment remains separate. |
| Icon of the Seas | Continuous light-blue/red shell beneath full deck envelope. |
| Stena Estrid | Continuous cream/red body; stern ramp and twin appendages distinct. |
| Bourbon Orca | Continuous compact red body; no bottom split at broad bow. |
| ONE GUYANA | Continuous dark/red envelope; no detached bottom strips. |
| Voltaire | Closed main hull; four legs and spudcans intentionally project below it. |
| Nexans Aurora | Continuous yellow/red body; closed aft end. |
| Sleipnir | Both red pontoons closed and continuous; the separation between them and supporting columns is intentional. |
| Spartacus | Continuous green/red hull; cutter ladder/head are separate mission equipment. |
| Sparky | Continuous rounded blue/red body; paired nozzle/propulsor assemblies distinct from the shell. |
| NLV Pharos | Continuous dark/red body with closed stern; no seam slit. |
| S. A. Agulhas II | Continuous red hull and closed end silhouettes; aft flight-deck structure remains distinct. |
| RRS Sir David Attenborough | Continuous red body beneath forward house; twin appendages distinct. |
| Kirkella | Continuous compact dark/red body and closed transom. |
| Ocean Drover | Continuous cream/red lower body beneath livestock deck envelope. |
| Sendo Liner | Continuous shallow dark/red shell; no lower strip detached from the bow. |
| Octopus | Continuous dark/red yacht body; stern closes without a seam gap. |
| Francisco | Both white catamaran hulls are closed; the central tunnel and separate waterjet outlines are intentional. |
| Abeille Bourbon | Continuous orange/red compact hull; attached aft appendages. |
| HMS Defender | Continuous grey/red hull; paired propellers and rudders remain visibly separate equipment. |
| Yara Birkeland | Continuous blue/red body through compact bow and stern. |

## Photo-informed exterior findings

- **Berge Olympus:** the exterior visibly contains four wings with three-part faces and a red hull/deck, matching the conspicuous features of the owner's October 2023 delivered-refit photograph. Sail positions, detailed airfoil geometry and house furnishings remain reconstructed.
- **Sparky:** the updated blue hull, green deckhouse, dark panoramic wheelhouse glazing, heavy black forebody fenders, continuous rubbing belt and foredeck tow drums read clearly. The smaller dark rescue craft no longer dominates the side elevation. The mast has supports and signal yards; it and the wheelhouse remain simplified compared with Damen's August 2022 delivery photograph. The visible auxiliary uptakes do not imply a diesel main propulsion engine.
- **S. A. Agulhas II:** the white forward cargo crane and raised aft helicopter deck are visible and separated from the red hull. The long white house, crane machinery and hangar details remain broad reconstructions rather than detailed replicas.
- **NLV Pharos:** the forward helicopter deck and aft buoy working deck are visible. The initial production exterior revealed an actual crane/deckhouse collision, described below.

## NLV Pharos defect and correction

The reviewed crane boom ran from normalized X=-20 to X=-5 while the deckhouse begins at X=-13. Its forward end therefore penetrated the house and the crane almost disappeared in the default exterior. This was a geometry configuration defect, not ordinary camera occlusion.

The boom now points aft from X=-20 to X=-35, with its hydraulic ram running from X=-21 to X=-29 into the open working-deck area. The operator photograph supports this working-deck arrangement; the precise boom articulation remains illustrative. Only NLV Pharos geometry was regenerated, preserving its 680 meaningful component IDs/count. Both GLB detail levels and the Blender authoring file were regenerated successfully. All 28 assets pass structural validation after that change.

The initial 85-case production run used a frozen `dist`, so the correction was intentionally followed by a targeted rebuilt-production NLV five-view check rather than invalidating or silently replacing the original screenshots. The refreshed targeted exterior, Stern and Below images were visually checked at full resolution after the rebuild (captures refreshed at 15:29 on 8 September). The boom now extends visibly aft over the working deck; its pedestal is partly occluded by the house from the default three-quarter camera, while the Stern view shows the crane assembly clearly. No new hull seam defect appeared. This closes the reported crane penetration finding.

## Limits

These captures establish that the reported gross shell overlap is no longer visible in the reviewed camera views. They cannot prove absence of every occluded geometric intersection or establish survey-accurate hull offsets. Several vessels retain simplified planar superstructures, repeated schematic cabin glazing and simplified mission equipment. Physical component counts describe the educational inventory, not a verified bill of materials. Unsupported interior arrangements remain labelled reconstructed.
