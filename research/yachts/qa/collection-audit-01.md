# Yacht collection audit 01

Checked: 14 September 2026  
Method: filesystem-only reconciliation of all research batch JSON, all existing seed disposition inputs, the 172-row seed, runtime release wiring, and every current authored yacht manifest/technical-review pair. No Blender, computer-use, credentials, publication, or shared application-code changes were used. Metadata checks are not visual approval.

## Executive result

The research schema is structurally healthy: all four batch JSON files parse to 30 unique generation IDs. The collection is not publication-ready because disposition ingestion is incomplete, the generated catalog tables are stale relative to research, the runtime release snapshot is empty, and none of the 30 authored models has independent quality evidence.

The authored artifacts are stronger than the catalog state: all 30 current manifests parse, all 30 master hashes match their technical reports, all declared asset bytes and SHA-256 values match, and all 30 dimensional gates report within one percent. Those are structural/export checks only. Thirty `quality.json` files are missing, all 30 technical reports remain `visualReview: pending` and `publicationReady: false`, and 25 manifest rooms lack a camera reference across 21 models.

## Exact counts

| Check | Result |
| --- | ---: |
| Research batch JSON files | 4 |
| Unique researched generations | 30 |
| Princess generations | 14 |
| Sunseeker generations | 16 |
| Seed rows | 172 |
| Explicit disposition files | 1 (`dispositions-princess-01.json`) |
| Explicit disposition entries | 10 |
| Explicit dispositions in the loaded file | 6 canonical, 4 unresolved |
| Applied seed-row dispositions | 6 canonical, 166 unresolved |
| Normalized name/alias candidate rows | 28 |
| Unmapped exact name/alias candidates | 22 |
| Seed rows with no normalized name/alias candidate | 144 |
| Manifest schema failures | 0 |
| Stale master hashes | 0 |
| Asset missing/byte/hash failures | 0 |
| Technical asset-path mismatches | 0 |
| Dimension-gate failures | 0 |
| Missing `quality.json` files | 30 |
| Technical reports still pending visual review | 30 |
| Models with rooms lacking camera references | 21 |
| Rooms lacking camera references | 25 |
| Decks lacking camera references | 0 |

## Research and identity audit

All models in these files pass `yachtResearchSchema` and all IDs are unique:

- [`princess-batch-01.json`](../princess-batch-01.json): 8
- [`princess-batch-02.json`](../princess-batch-02.json): 6
- [`sunseeker-batch-01.json`](../sunseeker-batch-01.json): 8
- [`sunseeker-batch-02.json`](../sunseeker-batch-02.json): 8

### Identity defects and contradictions

1. `princess-y85-gen2-2022` includes the alias `Y85 Mk1 / original`, even though `princess-y85-gen1-2019` is a separate researched generation. This makes normalized alias matching ambiguous and risks reintroducing the generation merge that the batch QA explicitly rejected. The alias belongs on the Gen1 profile, if retained, not Gen2.
2. `sunseeker-predator-74-gen2-2018` includes `Predator 74 XPS` as an alias, while the seed and Sunseeker batch-02 notes treat `Predator 74 XPS` as a later 2021–2024 product/variant candidate. This alias makes row 73 look like an exact match to the 2018 canonical and needs explicit same-generation evidence or removal.
3. Repeated bare names are inherently ambiguous and must retain generation context: F55, Y85, and S65 each resolve to more than one researched generation. The research IDs are unique, but the aliases are not unique across generations.
4. `sunseeker-batch-02.json` contains a `seedDispositions` array of 24 entries, but its disposition strings are not the exact `seedAudit.ts` types. It uses `variant-of-existing-canonical`, `variant-deferred`, `deferred-current-model`, `unresolved-source-conflict`, `distinct-deferred-generation`, `alias-of-existing-canonical`, and `duplicate-seed-row`; none is accepted by `dispositionTypes`. `catalog.ts` does not read this field, so those 24 decisions are not applied to the seed.
5. `princess-batch-02.md` documents canonical mappings for rows 45, 60, 134, 144, 151, and 152, but no batch-02 disposition file exists and the only loaded disposition file still leaves those rows unresolved. The narrative and machine-applied state therefore disagree.

No research ID is orphaned from the authored asset tree: all 30 researched IDs currently have a manifest directory, and no authored manifest ID lacks a research profile.

## Seed reconciliation

The current loader reads only `dispositions-princess-01.json`. Applying that file to the parsed 172-row seed yields:

```text
canonical   6
unresolved 166
```

The 28 rows with a normalized name or alias candidate are not automatic matches. Six are currently canonical assignments; the remaining 22 are next research/disposition targets or deliberate unresolved identity hazards:

| Seed row | Brand | Raw model | Candidate generation(s) | Audit status |
| --- | --- | --- | --- | --- |
| 18 | Sunseeker | Superhawk 55 | `sunseeker-superhawk-55-gen1-2023` | unmapped exact candidate |
| 19 | Sunseeker | Predator 55 | `sunseeker-predator-55-gen2-2024` | unmapped exact candidate |
| 20 | Sunseeker | Predator 65 | `sunseeker-predator-65-gen1-2021` | unmapped exact candidate |
| 26 | Sunseeker | Manhattan 55 | `sunseeker-manhattan-55-gen2-2021` | unmapped exact candidate |
| 28 | Sunseeker | Manhattan 68 | `sunseeker-manhattan-68-gen2-2025` | unmapped exact candidate |
| 29 | Sunseeker | 76 Yacht | `sunseeker-76-yacht-gen1-2017` | unmapped exact candidate |
| 35 | Sunseeker | 82 Ocean Enclosed | `sunseeker-82-ocean-enclosed-gen1-2024` | unmapped exact candidate |
| 37 | Sunseeker | 90 Ocean | `sunseeker-90-ocean-gen1-2020` | unmapped exact candidate |
| 45 | Princess | X95 Vista | `princess-x95-vista-gen2-2024` | unresolved in loaded file; batch-02 narrative says canonical |
| 54 | Princess | F55 | `princess-f55-gen1-2017` / `princess-f55-gen2-2022` | correctly unresolved pending identity evidence |
| 60 | Princess | S65 | `princess-s65-gen1-2015` / `princess-s65-gen2-2024` | unmapped ambiguous generation |
| 62 | Princess | S72 | `princess-s72-gen1-2014` | unmapped; current-range context needs generation check |
| 71 | Sunseeker | 131 Yacht | `sunseeker-131-yacht-gen1-2016` | unmapped exact candidate |
| 73 | Sunseeker | Predator 74 XPS | alias points to `sunseeker-predator-74-gen2-2018` | do not auto-map; alias/variant identity hazard |
| 88 | Sunseeker | Predator 60 Evo | `sunseeker-predator-60-evo-gen1-2019` | unmapped exact candidate |
| 98 | Sunseeker | Predator 84 | `sunseeker-predator-84-gen1-2008` | unmapped exact candidate |
| 99 | Sunseeker | Manhattan 73 | `sunseeker-manhattan-73-gen1-2012` | unmapped exact candidate |
| 105 | Sunseeker | Portofino 48 | `sunseeker-portofino-48-gen1-2010` | unmapped exact candidate |
| 134 | Princess | Y85 | `princess-y85-gen1-2019` / `princess-y85-gen2-2022` | correctly unresolved until Gen1 disposition is loaded |
| 144 | Princess | Princess 55 | `princess-f55-gen1-2017` | unmapped; batch-02 narrative says canonical |
| 151 | Princess | S72 | `princess-s72-gen1-2014` | unmapped; duplicate-name row requires source identity |
| 152 | Princess | S65 | `princess-s65-gen1-2015` / `princess-s65-gen2-2024` | unmapped ambiguous generation |

The five multi-generation candidate rows are 54, 60, 70, 134, and 152. Row 70 is currently mapped to Y85 Gen2, but its ambiguous result is amplified by the erroneous Gen2 alias noted above. All remaining 144 rows need either later research or an explicit unresolved disposition; absence of a normalized match is not evidence that a row is safe to discard.

### Disposition schema gap

The Sunseeker batch-02 `seedDispositions` counts are:

```text
canonical                     8
variant-of-existing-canonical 6
variant-deferred              3
deferred-current-model        1
unresolved-source-conflict    1
distinct-deferred-generation  3
alias-of-existing-canonical   1
duplicate-seed-row             1
```

These are narrative/internal labels, not the exact schema from `src/data/yachts/seedAudit.ts`. They must be translated to `canonical`, `alias`, `variant`, `duplicate`, `out-of-period`, `unresolved`, or `announced`, with `canonicalId` and evidence rules enforced. In particular, a `variant` must be proven to be a configuration within the same generation; a different successor, XPS product, Sport Yacht/SportFly product, or namesake must remain unresolved or receive a separate canonical.

## Catalog and release blockers

### COL-001 — generated catalog tables are stale

`output/yachts/researched-catalog.json` contains 30 models, but `output/yachts/catalog/catalog.json` contains 16. The catalog table is missing all 14 batch-02 IDs:

- `princess-y85-gen1-2019`
- `princess-x95-vista-gen2-2024`
- `princess-f55-gen1-2017`
- `princess-s65-gen1-2015`
- `princess-s65-gen2-2024`
- `princess-s72-gen1-2014`
- `sunseeker-predator-55-gen2-2024`
- `sunseeker-82-ocean-enclosed-gen1-2024`
- `sunseeker-76-yacht-gen1-2017`
- `sunseeker-predator-60-evo-gen1-2019`
- `sunseeker-manhattan-66-gen2-2017`
- `sunseeker-manhattan-73-gen1-2012`
- `sunseeker-portofino-48-gen1-2010`
- `sunseeker-predator-84-gen1-2008`

### COL-002 — runtime release is empty

`src/data/yachts/release.json` has no repository, revision, or vessels. The runtime imports this release snapshot, not the output catalog files. No authored yacht is admitted to the normal runtime fleet until a pinned release is produced.

### COL-003 — collection gate currently reports 196 blockers

Against the current 30-model research set and no approved review IDs, `collectionFailures(...)` reports 166 unresolved seed-row failures and 30 `No approved model` failures. There are no additional production-window failures. This is a deliberate hard gate, not a visual approval result.

## Authored manifest and technical-review audit

The current filesystem contains 30 model manifests and 30 technical-review files. Every one of the following structural checks passed for all 30:

- `authoredManifestSchema` parse;
- current master SHA-256 equals `technical-review.json.masterSha256`;
- every manifest asset exists under `.tools/yachts/assets`, with matching declared bytes and SHA-256;
- manifest and technical-review asset path sets match;
- version-2 asset coverage and component coverage constraints;
- `dimensions.withinOnePercent === true`.

Those passes do not establish visual quality, semantic silhouette accuracy, closed hulls, contained rooms, non-intersection, materials, or camera framing.

### ART-001 — quality evidence is absent for all 30 models

No `.tools/yachts/review/<id>/quality.json` was present for any of the 30 IDs. All 30 technical reports remain `visualReview: "pending"` and `publicationReady: false`. The stage gate requires an approved independent review with all required checks, exterior views, room/deck coverage, exploded views, and inventory dispositions. None is currently satisfied by a quality-review artifact.

### ART-002 — room camera coverage is incomplete

All decks have at least one deck camera, but 25 rooms across 21 models lack any camera whose `roomId` equals the room ID. The authored-manifest schema checks that references are valid, but it does not require every room to have a camera. The independent review/stage gate must either add valid room cameras and evidence or explicitly document why a room is not inspectable; it must not silently treat a neighboring camera as coverage.

### ART-003 — no publication or visual conclusion follows from the passes

No model is visually approved by this audit. Render existence, manifest validity, hash integrity, and dimensional tolerance are necessary checks only. Producer revisions and independent visual inspection remain required, including silhouette, hull closure, room containment, intersections, floating fittings, materials, normals, textures, and crop/clipping checks.

## Required next checks

1. Create exact-schema disposition files for the missing batch-02 decisions, preserving unresolved rows where identity, generation, or same-generation variant evidence is insufficient. Remove cross-generation aliases before applying normalized matching.
2. Rebuild `output/yachts/catalog/catalog.json` from all 30 validated research profiles and verify it matches `output/yachts/researched-catalog.json` by ID set.
3. Resolve the 25 missing room-camera references or document an explicit, reviewable exception for each; then produce room evidence for every manifest room.
4. Produce independent `quality.json` for all intended release models and require `reviewFailures(manifest, review)` to return an empty array.
5. Re-run asset byte/SHA checks and master-hash checks after any MCP export; do not treat a stale or partially regenerated exchange as review-complete.
6. Keep `src/data/yachts/release.json` empty until catalog completeness, exact dispositions, independent quality evidence, and pinned repository/revision admission are all complete.

## Verification run

Focused tests passed after the filesystem audit: `tests/yacht-seed-audit.test.ts`, `tests/yacht-manifest.test.ts`, `tests/yacht-export.test.ts`, `tests/yacht-publication.test.ts`, and `tests/yacht-readiness.test.ts` — 19 tests total. These are public-interface/synthetic-fixture checks and do not approve authored visual quality.

