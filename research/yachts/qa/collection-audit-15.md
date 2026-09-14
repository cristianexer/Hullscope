# Collection audit 15

## Verdict

Integration gates **pass**. The explicit `HULLSCOPE_YACHT_PREVIEW=1` local path serves the 20-vessel preview catalog with 10 Princess and 10 Sunseeker entries; catalog reconciliation has `unresolvedSeedRows=0`; and `stage.ts` carries that value into a staged `release.json`.

The production yacht release remains **empty and unpromoted**. No staged release directory exists and no publication was attempted.

This audit does not approve visual quality or publication. The existing visual hold remains unchanged: **VIS-001**, **VIS-002** and **VIS-003** are still release-blocking, with `0/20` independent approvals.

## Integration gates

| Gate | Result |
|---|---|
| Preview catalog | 20 unique vessels — 10 Princess, 10 Sunseeker |
| Local preview environment | `HULLSCOPE_YACHT_PREVIEW=1` |
| Browser discovery flow | Passed; 21 yacht cards including preserved Octopus |
| Preview brand counts in browser | 10 Princess / 10 Sunseeker |
| Local manifest probe | HTTP 200, JSON |
| Production `src/data/yachts/release.json` | 0 vessels, no repository, no revision |
| Staged release directory | Absent |
| Seed reconciliation | 172/172 assigned; 0 unresolved |
| `stage.ts` propagation | `unresolvedSeedRows` carried at line 97 |
| Release unit tests | 3/3 passed |
| TypeScript check | Passed |

The browser test intentionally expects 21 yacht cards because the existing Octopus entry is preserved alongside the 20 local preview vessels. The preview release itself contains exactly 20 vessels.

## What was verified

`scripts/yachts/devPlugin.ts` enables the preview release only when `HULLSCOPE_YACHT_PREVIEW=1`, replacing the empty production release import with `.tools/yachts/preview/release.json`. The running Vite server served the app and a local yacht manifest successfully. The repository browser integration test confirmed the 20 preview cards and 10/10 brand split, then confirmed the preserved Octopus route still works.

The production snapshot at `src/data/yachts/release.json` contains no vessels and no pinned dataset repository/revision. There is no `.tools/yachts/stages` directory, so no validated staged release is available to promote.

The reconciliation was recomputed from the source seed table and disposition files: 172 rows, all assigned, with `canonical: 27`, `variant: 6`, `deferred: 130`, `announced: 6`, and `alias: 3`. The generated `output/yachts/seed-audit.json` also contains zero unresolved rows.

`scripts/yachts/stage.ts:97` now writes `unresolvedSeedRows: audit.unresolvedSeedRows` into the staged release marker. Its returned result also remains `published: false`; the staging gate requires zero unresolved rows in addition to the other integrity and quality checks.

## Visual hold — intentionally not re-approved

The selected 20 visual quality records remain `changes-required` with `independent-qa-pending`. Technical visual review is pending and `publicationReady` is false for all 20.

- **VIS-001:** exterior geometry has partial model-signature improvements, but reference-faithful hull, glazing, roofline and deck geometry remains unproven.
- **VIS-002:** the shared two-side-wall cutaway path is covered, but room architecture, supports, occlusion and framing remain blockout-level.
- **VIS-003:** material payloads and brand palette separation exist, but rendered gelcoat, glazing, teak and interior materials remain visually insufficient.

The pending Blender MCP rebuild is not counted as completed geometry work in this audit. No masters are considered improved unless the current files independently demonstrate it; this integration audit does not make that visual claim.

Only these audit artifacts were added by this audit: `collection-audit-15.json` and `collection-audit-15.md`.
