# Black Pearl — original fictional model

The Black Pearl is a separate sailing-ship authoring path, not a recoloured modern vessel. The 52 × 14 × 10 m hull envelope is an illustrative input. Neither it nor the 32 cannon positions is asserted to be film canon or a measured prop arrangement.

## Visual reference

The [official Disney franchise page](https://pirates.disney.com/) and its [Black Pearl promotional image](https://lumiere-a.akamaihd.net/v1/images/open-uri20160811-32147-14ux2xx_fb4d499c.jpeg?region=0%2C0%2C1024%2C320) informed the black canvas, tarred wooden hull, raised stern gallery, gunport bands and dense rigging. Geometry, carving, materials and inventory are original. No reference image or downloaded vessel mesh is distributed.

## Authored equipment

The final authoring inventory contains 1,521 meaningful components and 881 decorative pieces. The first slice had 738 meaningful components; expansion added physical carriage wheels and cheeks, bearing saddles, complete gunport linings, rigging blocks, deadeye pairs and lanyards, structural knees, ledges, beam shelves, hatch assemblies and period service fittings. Repeated ratlines, feather ornaments, rail sections and window details remain decorative. Decorative canvas seam cylinders were removed because they became bright, broken lines at normal viewing distances; the material supplies the woven surface detail.

Three masts have independent lower, topmast and topgallant stages, nine billowed square sails, two supported jibs and an after triangular sail. The headsails attach to authored stays and clew sheets. Manual steering, capstan and anchor handling, oil lanterns, fresh-water casks, galley equipment and hand bilge pumps replace modern engines, generators, radar and other incompatible equipment.

## Geometry corrections and checks

- The lower and upper paint regions share one hull surface and matching seam vertices. Sheer deformation is included before the rake calculation, keeping the end caps planar; splitting the paint region does not change the external surface area.
- Curved timber shoulder panels close the raised hull from x = ±36 to ±48 in the normalized authoring coordinates, joining the lower shell to the weather deck. Gunport openings remain genuine gaps in their separate framed bands.
- The bow retains its beam under the forward gun positions, and the forecastle has a curved deck and a supporting timber bulkhead.
- Fresh-water and provision casks occupy separate rows. A duplicate-transform audit found only the intentionally coincident complementary hull paint regions.
- All 181 model tests passed after the hull and framing changes. Type checking, lint and all-vessel manifest/GLB validation passed for the expanded asset before the final visibility-only adjustment.

Both GLB detail levels retain every semantic ID. The Blender file is regenerated from the uncompressed original geometry with metre units, component metadata and authored explode vectors. Runtime visual and interaction results are recorded by the project’s browser QA; this document does not assert measured replica accuracy.

## Remaining limitations

This is a fictional, period-inspired interpretation. Hull offsets, internal arrangements, sail area, cannon inventory and historical equipment installation have not been established from a film-production drawing set. The sailing and storm controls use the application’s illustrative simulation rather than measured Black Pearl performance. Some small fittings and pulling boats remain simplified. No Disney affiliation or endorsement is implied.
