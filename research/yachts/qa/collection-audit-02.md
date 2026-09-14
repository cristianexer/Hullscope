# Collection audit 02

Date: 2026-09-14

The current authored collection contains 30 researched generation profiles: 16 Sunseeker and 14 Princess. Each has an authoritative Blender master, an optimized exterior/interior exchange, a v2 manifest, and a technical review whose length and beam are within 1% of the audited dimensions.

The camera-completeness repair is clean: all 30 manifests have at least one camera for every declared room. Rendered evidence now exists for the available exterior viewpoints and every available room camera. Draft quality files are present for all 30 generations, but they intentionally remain `changes-required`; none is an independent approval.

The seed audit contains 172 rows. Current exact dispositions are 23 canonical, 6 variants, 3 aliases, 6 announced, and 134 unresolved. The catalog has 134 unresolved release blockers; before counting model approvals, the combined collection gate reports 164 blockers. `src/data/yachts/release.json` remains empty by design, and no Hugging Face revision has been published or promoted.

Visual review found the shared generic authoring layer structurally usable but not yet reference-faithful enough for the requested “look perfect” bar. The next production gate is to expand the source-backed generation catalog, refine model-specific exterior/interior geometry, capture deck and exploded review states, and then repeat independent QA. The application and existing-vessel regression suites remain green.
