# Sunseeker Superhawk 55 — original master modeling note

Status: bounded authoring task; model is an original reconstruction and is not release-quality certified.  
Canonical research ID: `sunseeker-superhawk-55-gen1-2023`  
Master script: [`scripts/yachts/models/sunseeker-superhawk-55.py`](../../scripts/yachts/models/sunseeker-superhawk-55.py)

## Source basis

The canonical generation and dimensions come from [`research/yachts/sunseeker-batch-01.json`](./sunseeker-batch-01.json). I visually inspected the official [Sunseeker Superhawk 55 page](https://www.sunseeker.com/range/superhawk-55) and its official [Superhawk 55 brochure](https://uploads.sunseeker.com/uploads/e4ccda224055627bdbe1e1b3112bef1a/en/Sunseeker_Superhawk55_400x225_Web.pdf) in the browser. The page/brochure were used for visual reference only; no source images were copied or redistributed.

The current official page is the dimensional authority for this master: LOA 17.13 m, beam 4.93 m and draft 1.43 m. The older official brochure exposes a conflicting technical block of 17.15 m LOA, 4.95 m beam and 1.27 m draft, and labels general-arrangement pages for side elevation, exterior plan, main deck and lower deck. The modeling target is the current page's 17.13 m × 4.93 m overall envelope; the conflict is documented, not averaged. The 17.13 m overall span is measured over the authored bow/stern envelope, including the modeled aft bathing platform and tapered bow hardware envelope.

Independent evidence comes from the [YachtBuyer Superhawk 55 review](https://www.yachtbuyer.com/en-gb/reviews/sunseeker-superhawk-55-2022), which identifies the reviewed hull as model year 2023, in production, with two cabins and a twin-IPS layout, and the [YachtWorld launch feature](https://www.yachtworld.com/research/sunseeker-superhawk-55-new-legend-on-the-water/) as a secondary silhouette/dimension cross-check. The latter publishes materially different rounded dimensions, so it is not used to drive the body envelope.

## Modeling decisions

- Coordinate system is Blender +X bow, +Y starboard, +Z up. Manifest positions, sizes, camera vectors and explode vectors are emitted in glTF coordinates `[x, z, -y]`.
- The hull is one custom fairing mesh built from longitudinal sections. The side glazing and chine highlight are surface details, not overlapping scaled hull shells.
- The exterior intentionally preserves the model-specific cues visible in the official reference: low open-top performance profile, dark long hull-side windows, sloped forward windscreen, dark hardtop, narrow side decks, open aft cockpit, central wet bar, foredeck sunpad and hydraulic bathing platform/tender-garage zone.
- The lower deck is furnished rather than left as empty blocks: reconstructed aft owner master with berth, headboard, wardrobes and vanity; forward VIP with berth, headboard, bedside furniture and vanity; central lobby/galley with worktop, sink, settee, table and stair connection.
- Twin Volvo Penta IPS 950 engine blocks and pod-drive assemblies are modeled as visible semantic propulsion assemblies. Electrical board, fuel tank envelopes, ventilation trunks, safety equipment and mooring fittings are present only at useful assembly scale; no cargo or ballast is invented.
- PBR materials use Principled BSDF roles for pearl paint, dark paint, blue-black glass, teak, cloth, brushed/polished metals, rubber, ceramic, wood and engine finishes. The scene uses custom meshes and sparse primitives instead of a generic rescaled hull or a service-parts dump.
- All visible mesh objects carry a `componentId` custom property beginning with `sunseeker-superhawk-55-gen1-2023.`. Multiple meshes share an assembly owner by design.
- The scene property `hullscopeManifest` is version 2 with `units: "metres"`, `shape: "box"` AABB selection proxies, physical `parentId` hierarchy, `enclosure`, deck/room/camera metadata and `assets: []`. The lead exporter must populate assets with verified GLB paths, bytes, hashes and complete component coverage.

## Layout evidence and limits

The official page documents two cabins and two en-suites/dayhead and describes an open-plan lower lobby/galley, forward VIP and aft master. The official brochure exposes a lower-deck general arrangement page but does not publish every internal dimension in text. The interior blocking is therefore `reconstructed` and intentionally labeled that way in component/room metadata. Exterior distinctive body, glazing and deck silhouette are `reference-informed`.

The exact hardtop, tender and cockpit furniture configurations vary by option and hull. This master chooses the documented open-top reference configuration with a hardtop/windscreen silhouette, central wet bar, two furnished cabins and twin IPS propulsion. It does not claim builder-supplied hull offsets or an exact production joinery plan.

## Review outputs

The script writes the authoritative master to `.tools/yachts/masters/sunseeker-superhawk-55-gen1-2023.blend` and the review set to `.tools/yachts/review/sunseeker-superhawk-55-gen1-2023/`. It renders seven exterior angles (`starboard-3q`, `port-3q`, `bow`, `stern`, `profile`, `high`, `cockpit`) and three room views (`master`, `vip`, `lobby`). `scene_report.json` records mesh count, component count, render paths, manifest state and limitations.

Review policy: inspect the generated renders for silhouette continuity, glazing placement, cockpit/wet-bar readability, cabin furnishing visibility, camera clipping, accidental occlusion and obvious non-yacht artifacts. Do not treat the script's successful run as release-quality certification. Any defects found during inspection belong in the final handoff summary.

