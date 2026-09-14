# Yacht QA batch 02 — catalog and authored-artifact audit

Checked: 14 September 2026  
Scope: filesystem-only reconciliation of the current yacht research catalog, seed dispositions, release wiring, Princess V55 artifacts, and Sunseeker Superhawk 55 artifacts. No computer-use tool, Blender MCP call, `.blend` mutation, recovery-file access, or visual approval was performed.

## Result

The research records are structurally valid, but the collection is not releasable and neither authored yacht has independent quality approval. The runtime release snapshot contains zero yacht vessels, while the generated catalog artifacts contain 16 research IDs. The Sunseeker exchange is stale against its master and would be rejected by the exporter.

| Area | Finding | Status |
| --- | --- | --- |
| Research identity | 16 unique Princess/Sunseeker generation IDs parse successfully | pass |
| Seed coverage | 172 seed rows; current disposition result is 6 canonical and 166 unresolved | blocker for publication |
| Runtime release | `src/data/yachts/release.json` has no repository, revision, or vessels | blocker |
| Public runtime assets | No `public/yacht-assets` tree is present | blocker |
| Princess V55 | Version-2 manifest parses; six asset hashes and byte counts match; dimensions are within 1% | structural pass only |
| Princess V55 review | `visualReview: pending`, `publicationReady: false`, no `quality.json` | blocker |
| Sunseeker Superhawk 55 | Three exchange GLBs are readable and assembly ownership is inspectable | structural pre-export pass only |
| Sunseeker Superhawk 55 exchange | Current master hash does not equal `authoring.json.masterSha256` | blocker |
| Sunseeker review | Scene report says inspection required; manifest assets are empty; no exported manifest or technical review | blocker |
| Visual quality | Not approved; metadata cannot replace independent render review | hold |

## Blocking findings

### QA-001 — catalog artifacts are not connected to the runtime release

`output/yachts/researched-catalog.json` and `output/yachts/catalog/catalog.json` each contain 16 unique research IDs, but the application imports `src/data/yachts/release.json`. That file currently has `repository: null`, `revision: null`, and `vessels: []`. `src/assets/yachts.ts` therefore exposes no released yacht records, and `src/data/fleet.ts` adds no authored yachts to the runtime fleet.

The generated catalog is an audit/build artifact, not a runtime admission record. No production release should be inferred from its presence. The local preview path is explicitly separate and must remain preview-only until independent QA passes.

### QA-002 — the seed is not publication-complete

The current research set parses as 16 unique canonical IDs. The 172-row seed, when evaluated with the current disposition assignments, has six canonical rows and 166 unresolved rows. The current disposition file is Princess-only; there is no Sunseeker disposition file in the repository.

This is consistent with the bounded research decisions: unresolved namesakes and generations must not be forced into an existing canonical. It is nevertheless a hard publication blocker because `scripts/yachts/quality.ts` reports every unresolved seed row as a collection failure, and `scripts/yachts/stage.ts` requires zero unresolved rows before staging.

### QA-003 — Sunseeker batch has one canonical with no raw seed row

Seven of the eight Sunseeker batch generations have direct raw seed rows:

| Canonical ID | Seed row | Raw model |
| --- | ---: | --- |
| `sunseeker-superhawk-55-gen1-2023` | 18 | Superhawk 55 |
| `sunseeker-predator-65-gen1-2021` | 20 | Predator 65 |
| `sunseeker-manhattan-55-gen2-2021` | 26 | Manhattan 55 |
| `sunseeker-manhattan-68-gen2-2025` | 28 | Manhattan 68 |
| `sunseeker-90-ocean-gen1-2020` | 37 | 90 Ocean |
| `sunseeker-131-yacht-gen1-2016` | 71 | 131 Yacht |
| `sunseeker-predator-74-gen2-2018` | 85 | Predator 74 Mk II |

`sunseeker-hawk-38-gen1-2018` has no Hawk 38 row in `research/sunseeker-princess-yacht-range.md`; no disposition can be assigned to a nonexistent row. This is a catalog/seed gap, not permission to map a namesake.

Potentially confusable rows remain separate and unresolved: Predator 65 SportFly (21), 65 Sport Yacht (24), 90 Ocean Enclosed (38), Predator 74 XPS (73), Manhattan 68 Mk I (74), and Predator 74 Mk I (100). Their names, configurations, or generations do not establish exact identity with the eight requested canonicals.

### QA-004 — Princess V55 is structurally exported but not independently approved

`.tools/yachts/assets/models/princess-v55-gen2-2019/manifest.json` passes the authored-manifest schema with 34 components, 25 meaningful components, six assets, three decks, ten rooms, and twelve cameras. The six GLB files match manifest byte counts and SHA-256 values. The technical review reports 17.8918 m exported length and 4.6400 m beam against the research target, with both errors under 1%.

Those checks establish export integrity and envelope measurement only. The technical review explicitly reports `visualReview: "pending"` and `publicationReady: false`. The review directory contains `metrics.json` but no `quality.json`; therefore the independent quality gate has not run and no approval is implied.

The exchange `authoring.json` has empty assets because it is an exporter input; the exporter is responsible for producing release assets. That pre-export shape must not be mistaken for a releasable manifest.

### QA-005 — Sunseeker exchange is stale and cannot be exported safely

The three Sunseeker exchange chunks are readable by the filesystem GLB inspection: exterior (8 declared components), lower interior (9), and main interior (1). The inspection found render meshes, materials, normals, finite vertices, and declared assembly ownership for those chunks.

However, the SHA-256 of `.tools/yachts/masters/sunseeker-superhawk-55-gen1-2023.blend` does not equal `masterSha256` in `.tools/yachts/exchange/sunseeker-superhawk-55-gen1-2023/authoring.json`. `scripts/yachts/export.ts` rejects this condition with “Exchange is stale.” The exchange must be regenerated from the current master through the authorized Blender MCP workflow before any export or review result can be trusted.

The existing `scene_report.json` also records `assets: []` and `reviewStatus: "inspection required"`. There is no `.tools/yachts/assets/models/sunseeker-superhawk-55-gen1-2023/manifest.json` or `technical-review.json`, so no exported Sunseeker release artifact exists in the inspected filesystem.

### QA-006 — quality-review artifacts are missing for both authored yachts

`scripts/yachts/stage.ts` requires a parsed `quality.json`, an approved status, an independent reviewer, all required checks, all required exterior views, every manifest room/deck inspection, exploded views at 0/50/100%, and a complete inventory disposition. Neither the V55 nor the Sunseeker review directory contains that file.

The existing renders and metadata are evidence inputs only. They do not establish hull accuracy, room containment, absence of intersections, material quality, camera framing, or visual acceptance. The prior Sunseeker render rejection remains a producer revision hold; it must be rechecked after a fresh MCP export.

## Required checks after the next authorized Blender MCP export

1. Re-export the Sunseeker master/exchange pair and verify the current master SHA-256 equals the regenerated `authoring.json.masterSha256`. Do not bypass the stale-exchange guard.
2. Run the deterministic exporter for each revised model. Require a version-2 manifest, both exterior LOD levels, every declared component covered at both levels, embedded GLB data, safe asset paths, matching bytes/SHA-256 values, and no undeclared mesh owners.
3. Verify envelope measurements against the researched targets: V55 17.81 m / 4.65 m / 1.44 m and Superhawk 55 17.13 m / 4.93 m / 1.43 m. Treat this as dimensional QA, not visual approval.
4. Produce an independent `quality.json` for each model. `reviewFailures(manifest, review)` must return an empty array; author and reviewer must differ; all required checks, seven exterior views, room/deck cameras, 0/50/100% exploded views, and baseline inventory roles must be present.
5. Recheck the rejected Sunseeker views for the flat-box roof, open-hull condition, protruding rooms, and cropped framing. Confirm room geometry remains contained by the hull/deck envelope and that cameras do not clip or crop required evidence.
6. Re-run the filesystem integrity checks after review images are written, including every declared image hash and every GLB hash. Do not call these checks a visual sign-off.
7. Keep `src/data/yachts/release.json` empty until the complete catalog, seed dispositions, approved reviews, and pinned release pair exist. A local preview may be used only through the explicit preview path and must not be treated as publication.

## Checks run

The following focused tests passed: `tests/yacht-seed-audit.test.ts`, `tests/yacht-manifest.test.ts`, `tests/yacht-export.test.ts`, `tests/yacht-publication.test.ts`, and `tests/yacht-readiness.test.ts` — 19 tests total. These tests validate public interfaces and synthetic fixtures; they do not approve yacht visual quality.

