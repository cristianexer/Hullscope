# Yacht implementation ledger

Baseline: `8e73fd4273df9fa0ef45f0db9c7eea5bba8097cb`.

## Approved outcome

Sunseeker and Princess production generations overlapping 2006–2026; original exteriors and furnished interiors; room cameras and existing educational interactions; full collection reviewed before handoff. Publish original data, meshes, materials, Blender masters and documentation as an ungated Hugging Face dataset under CC BY-NC 4.0. Third-party reference media must not be redistributed. GitHub Pages retains the application and its 800 MB artifact limit. Public binaries use a pinned dataset commit and anonymous downloads.

## Agreed interfaces under test

The approved plan establishes these test surfaces: catalog reconciliation and evidence, manifest v1/v2 parsing, asset resolution and cancellation/retry, semantic selection/disassembly, fleet filters and room navigation, dataset staging and release integrity. Tests exercise these interfaces rather than individual modeling helper functions.

## Work status

- [ ] Canonical catalog audit and complete source-row dispositions.
- [ ] Backward-compatible authored manifests and public/local asset delivery.
- [ ] Fleet category, filters, interior navigation and authored-material renderer.
- [ ] Original master assets and independently reviewed models for every generation.
- [ ] Dataset staging, provenance, licenses, checksums and Parquet catalog.
- [ ] Secure publication, anonymous verification and pinned application release.
- [ ] Full functional, visual, accessibility, transfer and hardware performance verification.

No raw research row or generated draft is a verified finished model. Publication is blocked until all included records and assets satisfy the approved quality gates. This ledger must report partial work honestly.

## Delegation

At most three concurrent subagents, all `gpt-5.6-luna` / `xhigh`; two brand researchers/producers and independent QA. Each production assignment covers no more than eight generations. Shared interfaces, integration and credentials remain with the coordinating agent.

User correction, 14 September: use **Blender MCP**, not computer use, for Blender authoring and inspection. The MCP connection is verified. Isolated MCP background-file operations keep producers separate; serialize any interactive-scene edits and preserve the user's existing scene. Earlier headless exports are drafts, not approved assets.

### Safety pause — unsaved Blender scene

The live MCP background worker is unavailable because its server's `BLENDER_PATH` is unset. Despite explicit scene-preservation instructions, the Sunseeker agent used `open_mainfile` in the interactive session and replaced the user's unsaved scene. The agent confirmed this; there is no evidence of an independent user scene change. All Blender mutations are stopped. Do not resume authoring or attempt restoration without user direction.

A same-process autosave from **14 September 2026, 10:38:30 BST** was preserved unchanged at `.tools/blender-recovery/pre-yacht-mcp-44251-autosave.blend`. Original: `/private/var/folders/vv/r0djb7kd4gb965sy0s1jl03r0000gn/T/44251_autosave.blend`. SHA-256: `1b140b5bba6e4b4887ad31a22516af1c33332254f91dc72ac3e753e04f0f62c7`. This recovery copy is outside the dataset asset/staging roots and must never be uploaded. Recovery inspection is read-only; restoration requires the user's approval.

### Verification checkpoint (not completion)

- 327 unit tests pass; typecheck and lint pass.
- 18 browser smoke tests pass, including the original first-vessel transfer regression and serial navigation through all 29 legacy vessels.
- All 29 original vessel model validations pass; Octopus geometry and route are unchanged.
- The first 16 research profiles export to JSON, CSV and a 280-column Parquet catalog with a verified round-trip. At this checkpoint 166 of 172 seed rows remain unresolved after incorrect generation mappings were reopened.
- The first Superhawk draft failed visual review. Neither it nor any Princess yacht is release-approved. The Princess V55 authoring script is a draft without a completed master.
- No Hugging Face repository has been created or uploaded. No application release has been promoted, no git commit/push has been made, and the complete fleet acceptance criteria are not met.

## Component policy

Count useful selectable assemblies, not visual trim. Baseline applicable hull, superstructure, electrical, fuel, freshwater/sanitation, ventilation/HVAC, safety and mooring, plus each actual deck, room, engine, drive, helm and independently useful optional assembly. Every physical support relationship must remain coherent during disassembly. Distinctive hulls, glazing and layouts are model-specific; repeated hardware, furniture construction and materials may be shared.
