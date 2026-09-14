# Yacht collection audit 07 — independent QA

## Verdict

**Changes required. Do not release or publish the 20-yacht selection.**

This audit uses the new render batch generated after audit 06, rather than treating older legacy filenames as current evidence. The room-camera and room/deck lighting changes materially improved the current batch: all 111 current room frames are reviewable, no current room-camera hull/sidewall clipping was confirmed, and all current room/deck/exploded frames clear the luminance threshold.

The release still fails. Only 2/20 metrics files index renders, only 130/370 draft quality records reference the new batch, only 2/20 quality records match current manifest/master hashes, Princess V55 has 10 blank room frames and 2 blank deck frames, three exterior frames remain too dark, interiors are still blockouts, interior LODs are unchanged, and no independent approval exists.

## Current-batch basis

The current batch is the set of PNG files newer than `research/yachts/qa/collection-audit-06.json`, with the current naming families (`full-review*`, `full-room*`, current deck names, `exploded-*`, and Superhawk’s `full-exterior*` / `full-room-view*`). It contains 391 files:

| Current render type | Count |
|---|---:|
| Exterior | 161 |
| Rooms | 111 |
| Decks | 59 |
| Exploded states | 60 |
| Total | 391 |

All 391 current files are present in the scene reports. Metrics index only 42 of them: 25 for Princess V55 and 17 for Superhawk. The other 18 metrics files currently have `renderedViews: []`.

## Read-only results

| Check | Result |
|---|---:|
| Selected IDs / brand split | 20 / 10 Princess + 10 Sunseeker |
| Authoring/technical master hash matches | 20/20 |
| Manifest v2 records | 20/20 |
| Manifest asset byte/SHA checks | 84/84 pass |
| Technical declarations vs parsed GLBs | 84/84 pass |
| Length/beam within 1% | 20/20 pass |
| Components / source IDs present | 459 / 459 |
| Component fidelity | 343 reference-informed / 116 reconstructed |
| Component shapes | 268 box / 48 cylinder / 78 deck / 44 chamferedBox / 21 hull |
| GLBs with textures / images | 84 / 84 |
| Embedded materials / textures / images | 782 / 626 / 626 |
| Embedded image payloads | 626 × 32x32 PNG |
| Current render batch | 391/391 present |
| Current batch in scene reports | 391/391 |
| Current batch in metrics | 42/391 |
| Quality screenshot records | 370 |
| Quality records referencing current batch | 130/370 |
| Quality referenced-file hashes | 370/370 pass |
| Quality manifest/master hash matches | 2/20 |
| Room-camera clipping confirmed in current batch | 0/111 |
| Current room/deck/exploded frames below 8% luminance | 0/230 |
| Current exterior frames below 8% luminance | 3/161 |
| Quality status `changes-required` | 20/20 |
| Independent approvals | 0/20 |

## Visual findings

The new current room frames correct the prior camera failure: Predator 57 and Manhattan 63 no longer show the room camera inside the exterior hull/sidewall, and no comparable clipping was confirmed in the remaining current room set. The rooms are still blockout assemblies—beds, partitions, benches, cylinders and simple equipment—with incomplete shells, joinery, fixtures and physical supports.

Princess V55 is an independent current-batch failure. Its 10 current room renders are uniform blue/empty frames, and two of its three current deck renders are also uniform blue/empty frames. Its populated exterior frames still show coarse hardtop, glazing and deck geometry. This defect is not represented by the older quality screenshot paths.

The lighting pass is substantially better for rooms, decks and exploded states. Three current exterior frames remain below 8% mean luminance: Princess V55 below-hull, Princess V55 port profile and Superhawk port three-quarter. The current Superhawk room frames are visible, but the rooms remain coarse primitive assemblies.

Across the fleet, exterior geometry has more authored primitive variety than audit 06, but many models still share a simplified slab-hull/template vocabulary. Model-specific hull, glazing, roofline and deck treatments are not sufficiently convincing to pass the distinctive-feature gate.

## Metadata and LOD gates

The current render metadata is internally incomplete. Scene reports contain all 391 current render paths, but metrics contain current paths only for V55 and Superhawk; 18 metrics files are empty. Draft quality records still reference 240 older paths, and only V55/Superhawk quality records match current manifest/master hashes. Referenced legacy file hashes pass, but those records cannot certify the new batch.

Exterior LOD1 is lighter for 19/20 pairs. Superhawk remains `13200 -> 13200`. All 22 interior pairs retain the same triangle count; 16 are byte-identical and six differ in bytes without reducing triangles.

## Collection blockers

- **EVID-001 — current evidence is not fully indexed:** only 42/391 current renders appear in metrics, 130/370 quality records reference current paths, 240 reference older paths, and only 2/20 quality records match current manifest/master hashes.
- **VIS-001 — reference fidelity:** shape diversity is present, but the fleet still reads as a simplified repeated template and distinctive features remain unproven for all 20.
- **VIS-002 — room quality:** current camera clipping is visually resolved, but rooms remain blockouts; V55 has 10 blank current room frames and 2 blank current deck frames.
- **VIS-003 — materials:** all GLBs contain payloads, but the 32x32 image payloads and flat material treatment do not meet visual fidelity; draft records fail textures/materials-in-all-views.
- **VIS-004 — residual exterior evidence:** three current exterior frames remain below the luminance threshold.
- **TECH-001 — LODs:** all interior pairs retain their triangle counts and Superhawk has no exterior triangle reduction.
- **APP-001 — approval:** no independent approval exists; all technical visual reviews remain pending and publication-ready flags are false.

## Per-yacht dispositions

All rows are `changes-required`. `Current` is the post-audit-06 render-batch count; `metrics` is the current `metrics.json` rendered-view count; `quality-current` counts draft quality records whose paths point at the current batch.

| ID | L × B m; error % | Components / rooms / decks | Current / metrics / quality-current | Current-batch disposition |
|---|---|---:|---:|---|
| `princess-r35-gen1-2018` | 10.873 × 3.284; 0.160 / 0.419 | 21 / 4 / 3 | 18 / 0 / 6 | Rooms/cameras pass visually but remain sparse; geometry/materials generic; metadata incomplete. |
| `princess-v40-gen2-2017` | 12.959 × 3.832; 0.160 / 0.571 | 23 / 6 / 3 | 20 / 0 / 6 | No confirmed room clipping; F/V-family geometry and rooms remain generic/blockout; metadata incomplete. |
| `princess-v55-gen2-2019` | 17.892 × 4.640; 0.459 / 0.214 | 34 / 10 / 3 | 25 / 71 / 8 | 10 blank room frames, 2 blank deck frames and 2 dark exterior frames; populated exterior still coarse. |
| `princess-f45-gen1-2019` | 14.327 × 4.283; 0.160 / 0.536 | 22 / 5 / 3 | 19 / 0 / 6 | No confirmed room clipping; open-plane rooms and generic F/V-family blockout; metadata incomplete. |
| `princess-f55-gen1-2017` | 17.572 × 4.903; 0.160 / 0.672 | 23 / 6 / 3 | 20 / 0 / 6 | Rooms visible without confirmed clipping but are sparse beds/partitions; family-template exterior; metadata incomplete. |
| `princess-f65-gen1-2022` | 20.267 × 5.127; 0.160 / 0.733 | 23 / 6 / 3 | 20 / 0 / 6 | Cabins/engine room remain blockouts; current luminance/cameras pass visually; metadata incomplete. |
| `princess-y85-gen1-2019` | 26.158 × 6.339; 0.160 / 0.617 | 23 / 6 / 3 | 20 / 0 / 6 | Y85-specific identity and room enclosure remain weak; no confirmed clipping; metadata incomplete. |
| `princess-x95-gen1-2020` | 29.063 × 6.815; 0.160 / 0.667 | 22 / 4 / 3 | 18 / 0 / 6 | Four rooms are visible but sparse; scaled generic hull; metadata incomplete. |
| `princess-s65-gen1-2015` | 20.088 × 5.112; 0.160 / 0.639 | 23 / 6 / 3 | 20 / 0 / 6 | Luminance/cameras pass visually; S65-specific identity and supported room detail remain weak. |
| `princess-s72-gen1-2014` | 22.534 × 5.412; 0.160 / 0.601 | 23 / 6 / 3 | 20 / 0 / 6 | No confirmed room clipping; scaled hull and incomplete room architecture; metadata incomplete. |
| `sunseeker-hawk-38-gen1-2018` | 11.831 × 3.027; 0.160 / 0.555 | 20 / 2 / 3 | 16 / 0 / 6 | Two rooms are visible but sparse; sports-yacht identity remains generic; metadata incomplete. |
| `sunseeker-superhawk-55-gen1-2023` | 17.100 × 4.943; 0.175 / 0.266 | 18 / 4 / 2 | 17 / 28 / 14 | Corrected rooms are visible without confirmed clipping; one exterior frame is dark; coarse rooms and unchanged exterior LOD remain. |
| `sunseeker-portofino-48-gen1-2010` | 16.144 × 4.329; 0.160 / 0.676 | 22 / 5 / 3 | 19 / 0 / 6 | Current room/deck cameras and luminance pass visually; sparse rooms and generic Portofino exterior; metadata incomplete. |
| `sunseeker-predator-57-gen2-2017` | 18.211 × 4.728; 0.160 / 0.602 | 23 / 6 / 3 | 20 / 0 / 6 | Prior hull/sidewall room clipping is not present in current frames; rooms remain sparse and Predator identity generic. |
| `sunseeker-predator-74-gen2-2018` | 22.784 × 5.422; 0.160 / 0.783 | 24 / 6 / 3 | 20 / 0 / 6 | No confirmed clipping or dark room/deck frames; room enclosure/machinery and model identity remain weak. |
| `sunseeker-predator-84-gen1-2008` | 26.438 × 6.389; 0.160 / 0.769 | 24 / 6 / 3 | 20 / 0 / 6 | No confirmed clipping; guest rooms/day head remain slabs; generic Predator baseline; metadata incomplete. |
| `sunseeker-manhattan-55-gen2-2021` | 17.182 × 4.900; 0.160 / 0.615 | 23 / 6 / 3 | 20 / 0 / 6 | Rooms visible without confirmed clipping but remain sparse; Manhattan-specific detail weak; metadata incomplete. |
| `sunseeker-manhattan-63-gen1-2010` | 21.036 × 5.166; 0.160 / 0.706 | 23 / 6 / 3 | 20 / 0 / 6 | Prior hull/sidewall room clipping is not present in current frames; rooms remain sparse and metadata is empty. |
| `sunseeker-manhattan-73-gen1-2012` | 22.564 × 5.766; 0.160 / 0.625 | 23 / 6 / 3 | 20 / 0 / 6 | No confirmed clipping; Manhattan 73-specific treatment and room architecture remain weak; metadata incomplete. |
| `sunseeker-90-ocean-gen1-2020` | 27.057 × 7.207; 0.160 / 0.654 | 22 / 5 / 3 | 19 / 0 / 6 | Current rooms/decks pass camera/luminance review but enclosed-ocean identity and room completeness remain weak. |

## Required next gate

Regenerate metrics and quality records from the current batch, fix Princess V55’s blank room/deck renders and the three dark exterior frames, complete model-specific room/material/geometry work, produce genuinely lighter interior LODs and a lighter Superhawk exterior LOD, then repeat independent QA. Do not modify production assets or quality records as part of this audit; publication remains blocked until every selected ID has current, internally consistent evidence and explicit independent approval.

Files reviewed include current masters and authoring manifests under `.tools/yachts/`, model manifests and technical reviews under `.tools/yachts/assets/models/`, current post-audit-06 renders under `.tools/yachts/review/*/renders/`, metrics, scene reports and draft quality records under `.tools/yachts/review/`, and `research/yachts/release-selection.json`. No production asset or quality record was modified; audit 06 was preserved.
