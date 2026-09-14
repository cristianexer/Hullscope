# Using a released collection

The dataset viewer shows `catalog/catalog.parquet` directly. For local inspection, replace `OWNER` and `FULL_40_CHARACTER_COMMIT_SHA` below with the released identity and exact revision:

```sh
hf download OWNER/hullscope-yachts catalog/catalog.parquet \
  --repo-type dataset --revision FULL_40_CHARACTER_COMMIT_SHA
```

The public dataset is ungated. Anonymous application downloads do not require a token. Never embed a publisher token in browser code or query parameters.

```js
const repository = 'OWNER/hullscope-yachts';
const revision = 'FULL_40_CHARACTER_COMMIT_SHA';
const path = 'models/GENERATION_ID/manifest.json';
const url = `https://huggingface.co/datasets/${repository}/resolve/${revision}/${path}`;
const response = await fetch(url, { credentials: 'omit', mode: 'cors' });
if (!response.ok) throw new Error(`Asset unavailable: ${response.status}`);
const manifest = await response.json();
```

Select the requested exterior descriptor from `manifest.assets`, then interior chunks for the requested deck/room. Use the same pinned URL root for each descriptor's safe relative `path`. Verify byte length and SHA-256 before parsing. Use a glTF loader with Meshopt support; textures are embedded in each runtime chunk. Keep authored PBR factors, color spaces and material extensions intact.

Components contain world-space metric bounding proxies for selection, not replacement render geometry. Render nodes carry `extras.componentId`; several nodes can belong to one assembly. Preserve their full world matrices. Use explicit semantic parents for disassembly support relationships, and the declared camera position/target for room inspection.

Abort downloads when no active viewer needs them. Respect server `Retry-After` guidance, cap retries, and show specifications/thumbnail with an explicit retry state when geometry is unavailable. Do not repeatedly download all interiors or Blender masters during routine application builds.

Editable `.blend` masters are the geometry authority. Keep a backup before editing; regenerate derived GLBs from the edited master, not by replacing the master with a procedural vessel export. Check the license and record adaptations in your attribution.
