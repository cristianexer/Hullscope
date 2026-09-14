# Authoring and quality workflow

Blender MCP is the required Blender interface for this project. Inspect a scene before editing. Preserve unrelated objects, scenes, and unsaved user work. Live-scene mutations are serialized; multiple producers must not share active-object or active-scene state concurrently.

MCP's isolated background-file tools may be used when its server has `BLENDER_PATH` set to the installed Blender executable. If that worker is unavailable, use the live MCP connection with a dedicated yacht scene and explicit scene ownership. Do not substitute native computer use or silently fall back to an unmanaged Blender process.

## Geometry authority

The edited `.blend` master is authoritative. Original authoring scripts describe how a draft was constructed; running one again is not an export operation and must never silently replace an edited master. Save only the owned yacht scene and its dependencies. Keep recoverable backups for revisions.

Each visible mesh or curve belongs to a stable `componentId`, directly or through an ancestor. Multiple render meshes can belong to one selectable assembly. The scene stores a JSON `hullscopeManifest` with explicit components, physical parents, enclosures, decks, rooms and cameras. Manifest vectors use glTF coordinates in metres: Blender `[x, y, z]` becomes glTF `[x, z, -y]`, with bow along +X and up along +Y.

PBR finishes must survive glTF export. Bake unsupported procedural shaders to original embedded textures when needed. Never embed downloaded reference photographs, brochures, third-party meshes, or logos without separately verified redistribution rights. Keep actual surface detail—upholstery seams, teak joints, trim—grouped or instanced where independent selection has no useful purpose.

## Useful inventory, not a part quota

Independently review applicable hull, superstructure, electrical power, fuel, freshwater/sanitation, ventilation/HVAC, safety and mooring assemblies. Include each actual deck, room, engine, drive, helm and independently useful optional item. Mark genuinely absent systems not-applicable with a reason; unknown installation details are not proof of absence.

Share fittings, furniture construction and materials where appropriate. Hull stations, superstructure, glazing and room layouts remain individually authored unless reference evidence establishes actual commonality. Do not scale one generic hull across model names.

## Export through MCP

Use the MCP code-execution tool only for operations without a purpose-built equivalent. In an isolated owned scene, invoke the provided `export_master(master_path, exchange_path)` function from `export_blender.py`. The exporter verifies that its master remains unchanged and writes separate exterior/interior GLBs plus `authoring.json` containing its master checksum. No master is saved or replaced by export.

In the Hullscope repository, the non-Blender optimizer consumes that MCP-produced exchange:

```sh
node --import tsx scripts/yachts/export.ts CANONICAL_GENERATION_ID
```

It rejects stale exchanges, undeclared mesh owners, external texture dependencies, missing assemblies, and missing evidence citations. It produces conservative lower-detail geometry and authored high detail, preserves PBR materials, computes real world-space bounds, and records separate selectable-assembly, mesh, triangle, draw-call and byte counts. It does not approve visual quality.

For local application QA only:

```sh
node --import tsx scripts/yachts/preview.ts CANONICAL_GENERATION_ID
HULLSCOPE_YACHT_PREVIEW=1 npm run dev
```

Local assets remain outside `public/`. Draft catalogs are not eligible for production builds. Inspect all required exterior views, every room/deck preset and disassembly states in Blender and the actual application. Confirm measurement endpoints before applying the 1% length/beam tolerance.

An independent reviewer writes the quality record against exact master/manifest checksums and reviewed images. Any defect or changed master invalidates approval. The dataset stager requires complete source-row dispositions and every included model's valid independent review; it is intentionally unable to publish a work-in-progress collection.
