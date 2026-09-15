---
license: cc-by-nc-4.0
language:
  - en
tags:
  - yachts
  - marine
  - 3d
  - gltf
  - blender
  - sunseeker
  - princess
  - educational
pretty_name: Hullscope Yachts
configs:
  - config_name: catalog
    data_files:
      - split: train
        path: catalog/catalog.parquet
---

# Hullscope Yachts

An independently researched, original educational collection of Sunseeker and Princess yacht generations with production overlapping 2006–2026. Earlier introductions continuing into this interval are in scope. Generation identity, not a marketed model name alone, is the unit of the dataset.

## Inspecting the collection

The dataset viewer opens the `catalog` configuration without custom code. Its `train` split is an organizational convention, not a claim that these records are a statistical training sample. `catalog/catalog.json` contains the authoritative structured records; CSV and viewer-friendly Parquet are generated from the same records. Release counts and generation IDs appear in `release.json`.

Each generation has a stable ID, representative configuration, production interval and status, dimensions, recorded specifications, aliases, reference sources, and explicit uncertainties. Names reused in different generations are not automatically merged. Announced-but-unbuilt designs remain separate from production assets. Original source-row dispositions and additional discovered generations are recorded in the provenance files.

Dimensions are in metres. Original specification units and measurement conditions are retained alongside each fact. A JSON/Parquet null means unknown, not zero. CSV uses a blank cell for null and prefixes spreadsheet-formula-like text with an apostrophe. Flat `spec_*_value` columns are strings to preserve mixed numeric/range/text values; their units, status, source URL, and notes are adjacent columns. Structured JSON retains numeric values where known.

## Assets and interaction

- `models/<generation>/manifest.json`: selectable assemblies, physical hierarchy, enclosure roles, rooms/decks, camera presets and both detail levels.
- `models/<generation>/*.glb`: original exterior and separately loadable interior chunks with authored PBR materials and embedded textures.
- `masters/<generation>.blend`: editable authoring authority; exports must not overwrite these masters.
- `thumbnails/`: original rendered previews.
- `quality/<generation>/`: independent review records, measurements, runtime geometry statistics, and reviewed images.
- `provenance/`: source links, row dispositions, and unresolved factual uncertainties.
- `checksums.txt`: SHA-256 integrity list for the release.

For these authored yacht assets, LOD 0 preserves the full exported detail and LOD 1 reduces geometry for mobile and compatibility rendering while preserving semantic ownership. This differs from Hullscope's legacy procedural-vessel convention. One selectable assembly can contain many render meshes. Teak seams, trim, fasteners and similar repetition are not inflated into selectable-part quotas.

## Provenance and limitations

Research combines manufacturer/dealer archives and brochures with independent reviews and reputable brokerage evidence. Sources are linked rather than copied. Production dates may be reported intervals rather than factory build ledgers; launch, announcement, delivery and model-year dates can differ. Performance depends on engine, loading, conditions and configuration and is not guaranteed.

One documented configuration is modeled per generation. Alternative engines and layouts are recorded where supported, not silently mixed into one yacht. Unavailable room dimensions, service routing, equipment placements and finishes are identified as reconstructed. Visual fidelity means recognizable, reference-faithful original reconstruction—not manufacturer-certified CAD accuracy or an exact hull survey.

The collection is suitable for noncommercial education, visualization, comparison of documented configurations, and experimentation with semantic 3D interaction. It is not suitable for vessel navigation, structural calculations, hydrostatics, evacuation planning, construction, or safety-critical simulation. No first-person walkthrough accuracy is promised.

## Rights and reuse

Original contributions use [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). See `LICENSE.md` for attribution and separate third-party-rights notices. Manufacturers have not endorsed or certified this dataset. Referenced photographs, brochures, credentials, caches and unrelated project files are excluded.

Use a full dataset commit SHA for reproducibility. Older referenced releases are retained for rollback; a moving branch is not a stable dependency. See `USAGE.md` for examples.
