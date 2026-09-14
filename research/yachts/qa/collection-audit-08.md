# Yacht collection audit 08 — independent QA

## Verdict

**Changes required. Do not release or publish the 20-yacht selection.**

The current regeneration improved the visual evidence: all 391 canonical current renders are present, all 111 room frames are visible and above the luminance threshold, no current room-camera clipping was confirmed, all deck/exploded/exterior frames also clear the 8% mean-luminance gate, and Princess V55’s previously blank room/deck evidence is now visible.

The release is still blocked. Metrics have regressed to a partial state: only Princess V55 and Superhawk retain rendered views, 99 total, with only 42/391 current paths represented; the other 18 metrics files are empty. The rooms remain blockouts, model-specific geometry and materials remain weak, the Superhawk main interior LOD is unchanged, and no independent approval exists.

## Current-batch basis

The current batch uses the canonical post-regeneration filename families under `.tools/yachts/review/*/renders`: `full-review*`, `full-room*`, `deck-*`, `exploded-*`, and Superhawk’s `full-exterior*` / `full-room-view*`. Legacy `exterior_*`, `full-00*`, `room_*`, and similar files were excluded from current visual counts.

| Current render type | Count |
|---|---:|
| Exterior | 161 |
| Rooms | 111 |
| Decks | 59 |
| Exploded states | 60 |
| **Total** | **391** |

Scene reports contain all 391 current paths and 842 rendered-view records. Metrics contain current paths only for V55 and Superhawk: 42/391, with 99 rendered-view records total and 18 empty metrics files. Quality records are fully current: 370/370 screenshot paths and hashes pass, and all 20 manifest/master hashes match.

## Read-only results

| Check | Result |
|---|---:|
| Selected IDs / brand split | 20 / 10 Princess + 10 Sunseeker |
| Authoring/technical master hash matches | 20/20 |
| Manifest v2 records | 20/20 |
| Manifest asset byte/SHA checks | 84/84 pass |
| Technical declarations vs parsed GLBs | 84/84 pass |
| Length/beam within 1% | 20/20 pass |
| Components / source IDs present | 475 / 475 |
| Component fidelity | 359 reference-informed / 116 reconstructed |
| Component shapes | 284 box / 48 cylinder / 78 deck / 44 chamferedBox / 21 hull |
| GLBs with textures / images | 84 / 84 |
| Embedded materials / textures / images | 806 / 650 / 650 |
| Embedded image payloads | 650 × 32x32 PNG |
| Current render batch | 391/391 present |
| Current batch in scene reports | 391/391 |
| Current batch in metrics | 42/391 |
| Metrics with nonempty rendered views | 2/20 |
| Scene-report rendered views | 842 |
| Metrics rendered views | 99 |
| Quality screenshot records | 370 |
| Quality records referencing current batch | 370/370 |
| Quality referenced-file hashes | 370/370 pass |
| Quality manifest/master hash matches | 20/20 |
| Room-camera clipping confirmed in current batch | 0/111 |
| Current room/deck/exploded frames below 8% luminance | 0/230 |
| Current exterior frames below 8% luminance | 0/161 |
| Quality status `changes-required` | 20/20 |
| Independent approvals | 0/20 |

## Visual findings

The camera and lighting changes are effective at the evidence-gate level. Predator 57 and Manhattan 63 no longer show the prior room-camera hull/sidewall clipping, and no comparable clipping was confirmed in the rest of the current room set. The current V55 room and deck images are no longer blank; the below-hull view is also visible and above threshold.

That improvement does not make the rooms publication-ready. Across the fleet, rooms are still sparse cutaway assemblies—beds, partitions, benches, simple cylinders and basic equipment—with incomplete shells, joinery, fixtures and physical supports. V55’s main/lower deck evidence is visible but remains furniture-like rather than a convincing deck presentation. Superhawk is differentiated at the exterior silhouette level, but its rooms remain coarse primitive assemblies.

Exterior geometry shows more primitive variety than the earlier batch, but many models still share a simplified slab-hull/template vocabulary. Model-specific hull, glazing, roofline and deck treatments remain insufficiently convincing for the distinctive-feature gate. Material payloads exist technically, yet the 32x32 image payloads and flat color-block treatment remain visually weak.

## Metadata and LOD gates

The current metadata split is the primary evidence blocker. Scene reports and quality records are current, internally hashed and complete, but metrics are not: V55 has 71 rendered views, Superhawk has 28, and the other 18 selected IDs have empty `renderedViews`.

LOD evidence improved materially. Exterior LOD1 has fewer triangles for all 20 pairs. Interior LOD1 has fewer triangles for 21/22 pairs; the remaining unchanged pair is Superhawk `interior-main`, `3904 -> 3904`, and it is byte-identical.

## Collection blockers

- **EVID-001 — metrics are incomplete:** only 42/391 current paths and 99 rendered views appear in metrics; 18/20 metrics files are empty.
- **VIS-001 — reference fidelity:** the fleet still reads as a simplified repeated template and all 20 draft distinctive-feature checks fail.
- **VIS-002 — room/deck quality:** camera clipping and luminance are visually improved, but all 20 room sets remain blockouts; V55 deck evidence is visible but not convincingly deck-specific.
- **VIS-003 — materials:** all GLBs carry payloads, but 650 32x32 images and flat material treatment do not meet visual fidelity; textures/materials-in-all-views fail on all 20 draft records.
- **TECH-001 — LOD:** Superhawk interior-main has no triangle reduction and is byte-identical between LODs.
- **APP-001 — approval:** all records remain changes-required and independent-qa-pending; technical visual reviews are pending and publication-ready flags are false.

## Per-yacht dispositions

All rows are `changes-required`. `Current` is the canonical post-regeneration render count; `metrics` is the current metrics rendered-view count; `quality-current` is the number of draft quality screenshot records pointing at current paths.

| ID | L × B m; error % | Components / rooms / decks | Current / metrics / quality-current | Current-batch disposition |
|---|---|---:|---:|---|
| `princess-r35-gen1-2018` | 10.873 × 3.284; 0.160 / 0.419 | 21 / 4 / 3 | 18 / 0 / 17 | Camera/luminance pass visually; sparse rooms, generic geometry and empty metrics. |
| `princess-v40-gen2-2017` | 12.959 × 3.832; 0.160 / 0.571 | 24 / 6 / 3 | 20 / 0 / 19 | No clipping confirmed; generic F/V-family blockout and empty metrics. |
| `princess-v55-gen2-2019` | 17.892 × 4.636; 0.459 / 0.303 | 34 / 10 / 3 | 25 / 71 / 23 | Blank-room/deck and below-hull evidence issues fixed; coarse cutaway rooms/decks and weak profile fidelity remain. |
| `princess-f45-gen1-2019` | 14.327 × 4.283; 0.160 / 0.536 | 23 / 5 / 3 | 19 / 0 / 18 | Current cameras/luminance usable; open-plane rooms, generic family geometry and empty metrics. |
| `princess-f55-gen1-2017` | 17.572 × 4.903; 0.160 / 0.672 | 24 / 6 / 3 | 20 / 0 / 19 | Sparse rooms and family-template exterior; empty metrics. |
| `princess-f65-gen1-2022` | 20.267 × 5.127; 0.160 / 0.733 | 24 / 6 / 3 | 20 / 0 / 19 | Cabins/engine room remain blockouts; empty metrics. |
| `princess-y85-gen1-2019` | 26.158 × 6.339; 0.160 / 0.617 | 24 / 6 / 3 | 20 / 0 / 19 | Y85 identity and room enclosure remain weak; empty metrics. |
| `princess-x95-gen1-2020` | 29.063 × 6.815; 0.160 / 0.667 | 23 / 4 / 3 | 18 / 0 / 17 | Rooms visible but sparse; scaled generic hull and empty metrics. |
| `princess-s65-gen1-2015` | 20.088 × 5.112; 0.160 / 0.639 | 24 / 6 / 3 | 20 / 0 / 19 | Camera/luminance pass; S65 identity and supported room detail remain weak. |
| `princess-s72-gen1-2014` | 22.534 × 5.412; 0.160 / 0.601 | 24 / 6 / 3 | 20 / 0 / 19 | No clipping confirmed; incomplete room architecture and empty metrics. |
| `sunseeker-hawk-38-gen1-2018` | 11.831 × 3.027; 0.160 / 0.555 | 20 / 2 / 3 | 16 / 0 / 15 | Two rooms visible and usable; sports-yacht identity generic and metrics empty. |
| `sunseeker-superhawk-55-gen1-2023` | 17.100 × 4.943; 0.175 / 0.266 | 18 / 4 / 2 | 17 / 28 / 16 | Visible and luminance-clean; rooms coarse, exterior still simplified, interior-main LOD unchanged. |
| `sunseeker-portofino-48-gen1-2010` | 16.144 × 4.329; 0.160 / 0.676 | 23 / 5 / 3 | 19 / 0 / 18 | Cameras/luminance pass; sparse rooms, generic Portofino treatment and empty metrics. |
| `sunseeker-predator-57-gen2-2017` | 18.211 × 4.728; 0.160 / 0.602 | 24 / 6 / 3 | 20 / 0 / 19 | Prior room clipping absent; rooms sparse, Predator identity generic and metrics empty. |
| `sunseeker-predator-74-gen2-2018` | 22.784 × 5.422; 0.160 / 0.783 | 25 / 6 / 3 | 20 / 0 / 19 | No clipping/dark room frame confirmed; room enclosure and model identity weak. |
| `sunseeker-predator-84-gen1-2008` | 26.438 × 6.389; 0.160 / 0.769 | 25 / 6 / 3 | 20 / 0 / 19 | No clipping confirmed; guest rooms/day head remain slabs and metrics empty. |
| `sunseeker-manhattan-55-gen2-2021` | 17.182 × 4.900; 0.160 / 0.615 | 24 / 6 / 3 | 20 / 0 / 19 | Rooms visible without clipping; sparse Manhattan detail and empty metrics. |
| `sunseeker-manhattan-63-gen1-2010` | 21.036 × 5.166; 0.160 / 0.706 | 24 / 6 / 3 | 20 / 0 / 19 | Prior room clipping absent; rooms sparse and metrics empty. |
| `sunseeker-manhattan-73-gen1-2012` | 22.564 × 5.766; 0.160 / 0.625 | 24 / 6 / 3 | 20 / 0 / 19 | No clipping confirmed; model-specific treatment weak and metrics empty. |
| `sunseeker-90-ocean-gen1-2020` | 27.057 × 7.207; 0.160 / 0.654 | 23 / 5 / 3 | 19 / 0 / 18 | Current rooms/decks pass camera/luminance review; identity/completeness and metrics remain weak. |

## Required next gate

Regenerate metrics for all 20 IDs from the settled current render batch, complete model-specific geometry and room/material work, make V55 deck views genuinely deck-specific, produce a lighter Superhawk interior-main LOD, then repeat independent QA. Publication remains blocked until every selected ID has complete current evidence, all draft fail checks are resolved, and explicit independent approval is recorded.

This audit created only `collection-audit-08.json` and `collection-audit-08.md`; it did not modify production assets or quality records. Audit 07 was preserved.
