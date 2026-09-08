# Functional vessel-detail pass — 8 September 2026

The two detail passes now add **2,358 meaningful selectable components** to the earlier educational fleet: **27,348 across all 28 models**, with a minimum of **719 per vessel**. Combined compressed GLB assets are **54.61 MiB**, up from 42.69 MiB. The increase is equipment with distinct physical roles, not extra containers, bolts, grille bars or rail segments.

## Exterior detail and mast correction

The follow-up pass adds 1,631 components above the first pass below. All 268 new external weather doors use real metre dimensions: each is at most 1.9 m high and fits inside its particular deck enclosure. Louver assemblies and escape lights follow that same enclosure during disassembly. Individual louver blades, door frames, handles and glazing remain decorative. Working-deck service stations have type-specific purposes, including hatch operation, scientific deployment, anchor handling, cable handling, cargo-deck water services and tender handling. Exact equipment numbers and installations remain reconstructed.

The previous anchor equipment looked oversized on large ships because its dimensions followed the vessel-length envelope. Anchor windlasses now use metre-scale foundations, cylindrical motors and chain wheels, distinct brakes, clutches and chain stoppers. Anchor shanks and flukes sit at the forward shell; repeated chain links are decorative. These changes preserve the original component IDs and do not imply a verified windlass manufacturer or installation drawing.

HMS Defender's mast originally ended 1.75 m above its supporting house. The mast now extends into its support and a shoulder fairing provides a continuous transition. A new chamfered-box geometry gives the forward house, wheelhouse and bridge visor angled corners; flat normals preserve the planar faces of the mast and uptake housings. The bridge now has discrete glazing, mullions, wing repeaters and bearing compasses. Its boat-bay screen is an opening frame around a recessed bay; the previously duplicated internal boat now represents the physical cradle. Added mast service enclosures, supported yardarms, radome neck, hangar vents/doors, radar pedestal and raft launch stations remain illustrative service equipment.

The inspected primary photograph is [MOD image 45155236 by LA(Phot) Chris Mumby](https://www.flickr.com/photos/defenceimages/8614177368), taken **25 July 2012** and published **2 April 2013**. The date and author were independently matched to the image EXIF. Its continuous mast shoulder, angled bridge glazing, visor, yards, recessed boat area and foredeck anchor arrangement inform the silhouette. It does not verify the model's panel, antenna or raft inventory. A later Royal Navy 2022-photo page was researched but its image endpoint returned HTTP403, so it is not claimed as inspected visual evidence.

Close labels-off HMS exterior and port-side captures were inspected at 1920×1080 in `output/playwright/hms-detail/`. They show the mast support meeting the house, separate bridge panes, raft stations, visible boat/cradle and continuous hull. The full exterior, cutaway, exploded, stern and below preview also passed. Final flat-face naval shading is included in the subsequent production export.

| Vessel | Current meaningful count | Follow-up addition |
|---|---:|---:|
| Ever Ace | 1,233 | 70 |
| Berge Olympus | 1,135 | 70 |
| BBC Bangkok | 752 | 52 |
| BOKA Vanguard | 1,033 | 28 |
| Höegh Aurora | 1,208 | 80 |
| DHT Bronco | 1,198 | 70 |
| Bow Pioneer | 1,243 | 64 |
| Christophe de Margerie | 1,291 | 70 |
| Icon of the Seas | 1,481 | 104 |
| Stena Estrid | 1,288 | 62 |
| Bourbon Orca | 814 | 52 |
| ONE GUYANA | 1,358 | 64 |
| Voltaire | 743 | 58 |
| Nexans Aurora | 741 | 58 |
| Sleipnir | 1,057 | 28 |
| Spartacus | 719 | 46 |
| Sparky | 724 | 40 |
| NLV Pharos | 750 | 52 |
| S. A. Agulhas II | 835 | 58 |
| RRS Sir David Attenborough | 823 | 58 |
| Kirkella | 731 | 52 |
| Ocean Drover | 1,302 | 74 |
| Sendo Liner | 771 | 40 |
| Octopus | 739 | 58 |
| Francisco | 909 | 44 |
| Abeille Bourbon | 820 | 52 |
| HMS Defender | 874 | 81 |
| Yara Birkeland | 776 | 46 |

The new chamfered geometry has exact unit bounds, positive enclosed volume, closed merged topological edges and outward-facing normals. The independently added geometry and mast-support regressions pass. Final production browser coverage follows the full fleet regeneration; it is not inferred from the targeted HMS preview.

## First functional pass

Every vessel gains two weather-ventilation assemblies (coaming, fan casing, motor, isolation damper, weather hood and electrical isolator) and two physical searchlights (pedestal, housing and lens): 18 counted components. Locations and installation quantities are reconstructed. Original aft-mooring equipment now uses cylindrical motor, gear, brake and warping-head forms in place of undifferentiated cubes; these shape changes add no components.

| Priority vessel | Previous meaningful count | New count | Increase | Substantive work |
|---|---:|---:|---:|---|
| Ever Ace | 1,110 | 1,163 | 53 | Seven inter-bay lashing access bridges with ladders and securing lockers; platforms align with authored container gaps. |
| Ocean Drover | 1,107 | 1,228 | 121 | Roof ventilation banks, stores crane, raised forward accommodation crown, drinking-water regulators/risers, feed routes and waste gutters. |
| Christophe de Margerie | 1,161 | 1,221 | 60 | Pitched insulated tank-cover sides, elevated pipe racks, tank relief masts, pressure/gas monitoring and paired transfer manifolds with ESD valves/actuators. |
| Icon of the Seas | 1,337 | 1,377 | 40 | Internal pool-treatment equipment, Sports Court and FlowRider outlines; treatment plant is inside a service deck rather than exposed beside sunbathers. |
| HMS Defender | 759 | 793 | 34 | Illustrative external close-in mounts, radomes, supporting platforms, RHIBs and davits; narrower amidships enclosure provides boat clearance. |
| Sparky | 661 | 684 | 23 | Shore charging cabinet, coupler/interlock and towing-winch motor/brake actuator, supplementing the earlier livery/fendering refinement. |

Other families each gain the 18 functional support-equipment pieces described above. Their established mission layouts and continuous hull surfaces were preserved.

## Reference checks and limits

- **Ocean Drover:** inspected the photographer's [November 2022 Fremantle image](https://commons.wikimedia.org/wiki/File:Livestock_Carrier_Ocean_Drover_in_Fremantle_Harbour,_November_2022_01.jpg). It shows the grey lower hull, white ventilated deck exterior, forward bridge and rooftop machinery. A separate historical Wellard image still carrying the name *Becrux* was identified and excluded as dated-configuration evidence. The fleet record now explicitly identifies the November 2022 exterior reference; Wellard technical-sheet particulars retain their own source scope. Roof ventilation quantities and internal husbandry equipment remain reconstructed.
- **Ever Ace:** inspected the original [8 September 2021 Hamburg photograph](https://commons.wikimedia.org/wiki/File:Ever_Ace_C_Hamburg_08-09-2021_(7).jpg), which clearly shows inter-bay lashing structures. The access geometry and exact spacing in this model are reconstructed, with repeated support bars excluded from component totals.
- **Christophe de Margerie:** inspected ABB's [5 June 2020 onboard deck photograph](https://new.abb.com/news/detail/63301/abb-provides-247-remote-support-to-sovcomflots-trailblazing-lng-carrier-on-the-northern-sea-route). It supports pitched tank-cover sides, elevated deck piping and vent-mast silhouettes. Pipe dimensions, branch counts, sensors and valve positions in the model are illustrative, not a reproduced installation drawing.
- **Icon of the Seas:** the [operator activity catalogue](https://www.royalcaribbean.com/cruise-ships/icon-of-the-seas/things-to-do) identifies the Sports Court and FlowRider. Exact placement, pool plant and equipment arrangements remain schematic. No proprietary attraction mechanics are reproduced.
- **HMS Defender:** the [Royal Navy's November 2023 Phalanx article](https://www.royalnavy.mod.uk/news/2023/november/02/20231102-phalanx-gun-system-receives-18m-revamp) identifies the system on the Type 45 class. The model contains only simplified exterior housings, a radome and a shroud; no internal weapon design or operational specifications. Boat stowage and davits remain reconstructed.
- **Sparky:** the earlier inspected [Damen August 2022 delivery photograph](https://www.damen.com/insights-center/news/damen-s-first-all-electric-tug-sparky-delivered-to-ports-of-auckland) supplies livery and exterior cues. Operator descriptions establish charging as part of its duty cycle. The charging hardware geometry and precise position are reconstructed.

Reference photographs are linked for evidence and inspection only. No third-party photo or ship mesh is embedded in the app or Blender assets.

## Geometry and validation

All existing component IDs were retained. Ocean Drover's misleading displayed “window” names became “ventilation opening” names while their stable IDs, decorative status and support hierarchy remained intact. Its dark opening surfaces continue to follow the corresponding deck enclosure during disassembly.

Added equipment follows the physical supporting floor or roof, including cross-system children. The raised Ocean Drover bridge follows its accommodation crown; rooftop fan coamings and hood clearances account for both global and assembly disassembly vectors. Internal Icon treatment equipment fits below its supporting weather roof. Ever Ace's new lashing platforms occupy actual authored bay gaps, and the hull-facing ends adapt to local beam. QA caught the port HMS Defender boat initially moving inward through its enclosure under the generic safety-system vector. Both boats, their consoles and davits now follow that supporting enclosure while moving outward on their own side; full three-dimensional clearance checks at every 10% disassembly step pass.

The authoring pass passed TypeScript and lint checks, all 28 exported-model structural validations, and 408 additional checks that new coamings stay above supporting surfaces at 0%, 40% and 100% disassembly in vessel and assembly scopes. The final unit run passes all 237 tests, including 32 new equipment checks. All 28 Blender authoring files were regenerated successfully. Final browser visual/performance results are recorded by the independent QA pass after the shared viewer rendering changes; this document does not claim they passed before that run.

Model hulls remain educational station-surface approximations. The increased inventory does not establish a real vessel's bill of materials, internal layout, survey accuracy or hydrostatic validity.
