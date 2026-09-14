"""Export owned geometry from an authoritative yacht master without overwriting it."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys

import bpy

MCP_SAFE = os.environ.get("HULLSCOPE_BLENDER_MCP") == "1"


def owner_id(obj):
    current = obj
    while current:
        if current.get("componentId"):
            return current["componentId"]
        current = current.parent
    return None


def export_master(master: Path, destination: Path):
    original_hash = hashlib.sha256(master.read_bytes()).hexdigest()
    if not MCP_SAFE:
        bpy.ops.wm.open_mainfile(filepath=str(master))
    scene = bpy.context.scene
    if MCP_SAFE and scene.get("vesselId") != master.stem:
        raise ValueError("MCP export scene does not match the requested authoritative master.")
    if "hullscopeManifest" not in scene:
        raise ValueError("Master has no Hullscope semantic manifest.")
    manifest = json.loads(scene["hullscopeManifest"])
    parts = {part["id"]: part for part in manifest["components"]}
    # Review water is a Blender-only render aid. Keep the name guard because
    # library-written masters may not preserve that custom property on the
    # helper object, and leaking the 80x60 m plane into a mobile LOD corrupts
    # the yacht's measured bounds.
    geometry = [obj for obj in scene.objects if obj.type in {"MESH", "CURVE", "SURFACE", "FONT"} and isinstance(obj.get("componentId"), str) and not obj.hide_render and not obj.get("reviewEnvironment") and "review water" not in obj.name.lower()]
    for obj in geometry:
        owner = owner_id(obj)
        if owner not in parts:
            raise ValueError(f"Unowned visible geometry: {obj.name}")
        obj["componentId"] = owner
    groups = {}
    for obj in geometry:
        part = parts[owner_id(obj)]
        key = f"interior-{part.get('deckId', 'service')}" if part["interior"] else "exterior"
        groups.setdefault(key, []).append(obj)
    # Review water is parented to the hull root for render convenience. Some
    # Blender glTF exporter versions include hidden siblings of selected
    # parented objects, so unlink review-only helpers for the duration of the
    # export and restore their original collection membership afterward.
    review_helpers = []
    for candidate in list(scene.objects):
        if candidate.get("reviewEnvironment") or "review water" in candidate.name.lower():
            collections = list(candidate.users_collection)
            review_helpers.append((candidate, collections))
            for collection in collections:
                collection.objects.unlink(candidate)
    destination.mkdir(parents=True, exist_ok=True)
    chunks = []
    try:
        for key, objects in groups.items():
            # Blender's selection state can survive scene switches in an MCP session;
            # clear the active authoritative scene before selecting this chunk.
            # Walking every temporary scene made repeated batches progressively
            # slower and eventually hung the MCP call; other scenes are never part
            # of a selection-based glTF export.
            visibility = []
            active_layer = bpy.context.view_layer
            for candidate in list(active_layer.objects):
                try:
                    was_hidden = candidate.hide_get(view_layer=active_layer)
                    was_selected = candidate.select_get(view_layer=active_layer)
                    candidate.hide_set(True, view_layer=active_layer)
                    candidate.select_set(False, view_layer=active_layer)
                except RuntimeError:
                    # A stale view-layer proxy can remain after an MCP scene
                    # switch. It is not exportable from this active scene.
                    continue
                visibility.append((candidate, was_hidden, was_selected))
            for obj in objects:
                obj.hide_set(False, view_layer=active_layer)
                obj.select_set(True, view_layer=active_layer)
            active_layer.objects.active = objects[0]
            try:
                bpy.ops.export_scene.gltf(
                    filepath=str(destination / f"{key}.glb"),
                    export_format="GLB", use_selection=True, export_extras=True,
                    use_active_scene=True,
                    export_yup=True, export_apply=True, export_animations=False,
                    export_cameras=False, export_lights=False, export_materials="EXPORT",
                )
            finally:
                for candidate, was_hidden, was_selected in visibility:
                    candidate.hide_set(was_hidden, view_layer=active_layer)
                    candidate.select_set(was_selected, view_layer=active_layer)
            chunks.append({"name": key, "kind": "exterior" if key == "exterior" else "interior", "componentIds": sorted({owner_id(obj) for obj in objects}),
                           **({"deckId": parts[owner_id(objects[0])]["deckId"]} if key != "exterior" and parts[owner_id(objects[0])].get("deckId") else {})})
    finally:
        for candidate, collections in review_helpers:
            for collection in collections:
                if collection.objects.get(candidate.name) is None:
                    collection.objects.link(candidate)
    if hashlib.sha256(master.read_bytes()).hexdigest() != original_hash:
        raise ValueError("Master changed during its MCP export; retry from the saved authority.")
    (destination / "authoring.json").write_text(json.dumps({"masterSha256": original_hash, "manifest": manifest, "chunks": chunks}, indent=2), encoding="utf-8")
    print(json.dumps({"vesselId": manifest["vesselId"], "chunks": len(chunks), "masterUnchanged": True}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("master", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    export_master(args.master.resolve(strict=True), args.destination.resolve())
