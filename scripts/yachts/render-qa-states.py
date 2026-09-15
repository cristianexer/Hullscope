"""Render deck and exploded-state evidence through the live Blender MCP scene.

This script never opens a .blend file. The coordinator executes it in the
already-connected Blender process and restores the original active scene and
all temporary visibility/transforms after each render.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path("/Users/cristianexer/Hyperdrive/Hullscope")
ASSET_ROOT = Path(__import__("os").environ.get("HULLSCOPE_YACHT_ASSET_ROOT", str(ROOT / ".tools" / "yachts")))
REVIEW_ROOT = Path(__import__("os").environ.get("HULLSCOPE_REVIEW_ROOT", str(ROOT / ".tools" / "yachts" / "review")))
SCENE_SUFFIX = __import__("os").environ.get("HULLSCOPE_SCENE_SUFFIX", "")
SELECTION = Path(__import__("os").environ.get("HULLSCOPE_YACHT_SELECTION", str(ROOT / "research" / "yachts" / "release-selection.json")))
SCENE_ALIASES = {
    "sunseeker-superhawk-55-gen1-2023": "Superhawk 55",
}


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def camera_for(scene: bpy.types.Scene, entry: dict) -> bpy.types.Object | None:
    expected = str(entry.get("name", ""))
    expected_id = str(entry.get("id", ""))
    candidates = [obj for obj in scene.objects if obj.type == "CAMERA"]
    exact = next((obj for obj in candidates if obj.name == expected), None)
    if exact:
        return exact
    prefix = next((obj for obj in candidates if obj.name.startswith(expected)), None)
    if prefix:
        return prefix
    token = slug(expected)
    id_token = slug(expected_id)
    return next((obj for obj in candidates if (token and token in slug(obj.name)) or (id_token and id_token in slug(obj.name))), None)


def pick_camera(cameras: dict[str, bpy.types.Object | None], predicate) -> bpy.types.Object | None:
    for camera_id, camera in cameras.items():
        if camera is not None and predicate(camera_id.lower(), camera.name.lower()):
            return camera
    return None


def render(scene: bpy.types.Scene, camera: bpy.types.Object, path: Path, lighting_mode: str = "exterior") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    scene.camera = camera
    scene.render.filepath = str(path)
    scene.render.resolution_x = 640
    scene.render.resolution_y = 420
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    # The authored masters retain a dark, studio-like world for normal use.
    # Review evidence needs a controlled lift for enclosed and under-hull
    # states so the QA images measure geometry rather than near-black pixels.
    world = scene.world
    background = world.node_tree.nodes.get("Background") if world and world.use_nodes else None
    if background is not None:
        if lighting_mode == "below":
            background.inputs["Color"].default_value = (0.055, 0.10, 0.16, 1)
            background.inputs["Strength"].default_value = 0.90
        elif lighting_mode == "interior":
            background.inputs["Color"].default_value = (0.035, 0.065, 0.10, 1)
            background.inputs["Strength"].default_value = 0.78
        else:
            # Keep the studio atmosphere, but lift the exterior fill enough
            # for dark gelcoat, glazing, railwork, and hull chines to remain
            # legible in the independent visual review.
            background.inputs["Color"].default_value = (0.022, 0.045, 0.085, 1)
            background.inputs["Strength"].default_value = 0.72
    bpy.context.window.scene = scene
    bpy.ops.render.render(write_still=True)


def set_render_visibility(scene: bpy.types.Scene, interior: bool, room_id: str | None = None, hide_environment: bool = False) -> None:
    for obj in scene.objects:
        if obj.type not in {"MESH", "CURVE"}:
            continue
        if obj.get("reviewEnvironment") or "review water" in obj.name.lower():
            # The water helper is useful for a live beauty preview, but it
            # produces bright reflection blobs in isolated QA evidence and
            # makes the hull silhouette look damaged. Review images should
            # measure the authored yacht, not the staging plane.
            obj.hide_render = True
        else:
            if not interior:
                obj.hide_render = False
                continue
            # Room evidence is a contained interior inspection. Hide the hull
            # and exterior shell even when an authoring script omitted its
            # interior flag; retain only the selected room and its deck shell.
            # Generic masters use snake_case Blender properties while the
            # bespoke V55 authoring pass retains manifest-style camelCase.
            # Accept both so a valid custom interior is not rendered blank.
            object_room = obj.get("room_id") or obj.get("roomId")
            object_deck = obj.get("deck_id") or obj.get("deckId")
            is_selected_room = room_id is not None and object_room == room_id
            is_shared_lower_shell = object_deck and str(object_deck).endswith("_deck_lower") and not object_room
            # Open both side walls for a dependable cutaway. Keeping only one
            # wall made custom and generic masters disagree visually: one
            # family showed the furniture while another filled the frame with
            # the opposite wall. Walls/partitions remain in the editable and
            # production assets; this is strictly the review presentation.
            object_name = obj.name.lower()
            room_number = int(str(room_id).rsplit("_", 1)[-1]) if room_id and str(room_id).rsplit("_", 1)[-1].isdigit() else 0
            camera_side = "port" if room_number % 2 == 0 else "starboard"
            # Keep the far wall and the forward/aft bulkheads for spatial
            # context. Remove only the wall on the camera side, turning the
            # review into a genuine architectural cutaway instead of a loose
            # furniture turntable.
            room_wall = is_selected_room and (
                (" port wall" in object_name and camera_side == "port")
                or (" starboard wall" in object_name and camera_side == "starboard")
                # Review cameras approach the authored room from aft. Remove
                # that near bulkhead as well; otherwise the camera sees a
                # full-height brown/white panel and the furnished room reads
                # like an empty tray even though the asset is complete.
                or " aft bulkhead" in object_name
            )
            context_wall = is_shared_lower_shell and any(token in object_name for token in ("wall", "partition", "bulkhead"))
            # A room cutaway must expose the furniture from above. The authored
            # headliner and the shared lower-deck floor remain in the Blender
            # master and production GLB, but occlude the evidence camera when
            # left in the review state. Hide only those presentation surfaces;
            # selected floors, joinery, fixtures, and furniture stay visible.
            cutaway_occluder = interior and (
                "headliner" in object_name
                or "entry casing" in object_name
                or (is_shared_lower_shell and "floor" in object_name)
            )
            obj.hide_render = room_wall or context_wall or cutaway_occluder or not bool(obj.get("interior", False) and (is_selected_room or is_shared_lower_shell))


def main() -> None:
    selection = json.loads(SELECTION.read_text(encoding="utf-8"))
    requested = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    selected_ids = [vessel_id for vessel_id in selection["ids"] if not requested or vessel_id in requested]
    previous_scene = bpy.context.window.scene
    result: dict[str, int] = {}

    for vessel_id in selected_ids:
        scene = (
            bpy.data.scenes.get(vessel_id + SCENE_SUFFIX)
            or bpy.data.scenes.get(vessel_id)
            or bpy.data.scenes.get(SCENE_ALIASES.get(vessel_id, "") + SCENE_SUFFIX)
            or bpy.data.scenes.get(SCENE_ALIASES.get(vessel_id, ""))
        )
        if scene is None:
            raise RuntimeError(f"Missing live Blender scene: {vessel_id}")
        manifest_path = ASSET_ROOT / "assets" / "models" / vessel_id / "manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        out_dir = REVIEW_ROOT / vessel_id / "renders"

        # Keep Blender-only stage helpers out of the canonical evidence for
        # the whole pass. Capturing this state as hidden also prevents the
        # final restoration block from re-enabling a water plane that can
        # otherwise appear as bright reflection blobs in later views.
        for obj in scene.objects:
            if obj.type in {"MESH", "CURVE"} and (obj.get("reviewEnvironment") or "review water" in obj.name.lower()):
                obj.hide_render = True

        previous_camera = scene.camera
        previous_visibility = {obj.name: obj.hide_render for obj in scene.objects if obj.type in {"MESH", "CURVE"}}
        previous_locations = {obj.name: obj.location.copy() for obj in scene.objects if obj.type == "EMPTY" and obj.get("componentId")}
        cameras = {entry["id"]: camera_for(scene, entry) for entry in manifest.get("cameras", [])}
        exterior = (
            cameras.get("exterior_three_quarter")
            or cameras.get("exterior-starboard-3q")
            or cameras.get("exterior_bow_starboard")
            or cameras.get("exterior_bow")
            or pick_camera(cameras, lambda camera_id, name: "three" in camera_id or "three" in name or "starboard" in camera_id and "profile" not in camera_id)
        )
        stern = cameras.get("exterior_stern") or cameras.get("exterior-stern") or cameras.get("exterior_stern_starboard") or pick_camera(cameras, lambda camera_id, name: "stern" in camera_id or "stern" in name) or exterior
        high = cameras.get("exterior_high") or cameras.get("exterior-high") or cameras.get("exterior_high_bow") or cameras.get("exterior_above") or pick_camera(cameras, lambda camera_id, name: "high" in camera_id or "high" in name) or exterior
        written = 0

        if exterior is None:
            raise RuntimeError(f"No exterior review camera: {vessel_id}")

        # Refresh the canonical camera evidence against the current master.
        # The filename contains the manifest name because the review writer
        # resolves screenshots by that stable semantic label.
        for camera_entry in manifest.get("cameras", []):
            camera = camera_for(scene, camera_entry)
            if camera is None:
                raise RuntimeError(f"Manifest camera is not present in Blender scene: {vessel_id}/{camera_entry['id']}")
            camera_id = camera_entry["id"]
            set_render_visibility(scene, camera_id.startswith("room"), camera_entry.get("roomId"), camera_id.endswith("below") or "below" in camera_id)
            render_mode = "below" if "below" in camera_id else "interior" if camera_id.startswith("room") else "exterior"
            render(scene, camera, out_dir / f"full-{slug(camera_entry['name'])}.png", render_mode)
            written += 1
        set_render_visibility(scene, False)

        # One inspection render per declared deck. Non-decked hull/system
        # assemblies remain visible so each state is understandable in context.
        for deck in manifest.get("decks", []):
            deck_id = deck["id"]
            for obj in scene.objects:
                if obj.type not in {"MESH", "CURVE"}:
                    continue
                object_deck = obj.get("deck_id") or obj.get("deckId")
                obj.hide_render = bool(object_deck and object_deck != deck_id)
            room_camera = next((camera for entry_id, camera in cameras.items() if camera is not None and entry_id.startswith("room") and next((item for item in manifest.get("cameras", []) if item["id"] == entry_id), {}).get("deckId") == deck_id), None)
            camera = room_camera or (stern if "cockpit" in deck_id else high if "flybridge" in deck_id else exterior)
            room_entry = next((item for item in manifest.get("cameras", []) if item["id"] == next((entry_id for entry_id, candidate in cameras.items() if candidate == room_camera), "")), {})
            set_render_visibility(scene, bool(room_camera), room_entry.get("roomId"))
            render(scene, camera, out_dir / f"deck-{slug(deck_id)}.png", "interior" if room_camera else "exterior")
            written += 1
            set_render_visibility(scene, False)
            for obj in scene.objects:
                if obj.name in previous_visibility:
                    obj.hide_render = previous_visibility[obj.name]

        # Move semantic assembly roots by their manifest explode vectors. The
        # same authored geometry is restored after every state and every yacht.
        explode_by_id = {component["id"]: component.get("explode", [0.0, 0.0, 0.0]) for component in manifest.get("components", [])}
        roots = [obj for obj in scene.objects if obj.type == "EMPTY" and obj.get("componentId") in explode_by_id]
        for percent in (0, 50, 100):
            for obj in roots:
                vector = Vector(explode_by_id[obj.get("componentId")]) * (percent / 100.0)
                obj.location = previous_locations[obj.name] + vector
            render(scene, exterior, out_dir / f"exploded-{percent:03d}.png")
            written += 1

        for obj in scene.objects:
            if obj.name in previous_visibility:
                obj.hide_render = previous_visibility[obj.name]
            if obj.name in previous_locations:
                obj.location = previous_locations[obj.name]
        scene.view_layers.update()
        for obj in roots:
            if obj.name in previous_locations and obj.parent is None:
                obj.matrix_world.translation = previous_locations[obj.name]
        scene.view_layers.update()
        scene.camera = previous_camera
        result[vessel_id] = written

    bpy.context.window.scene = bpy.data.scenes.get("Scene") or previous_scene
    print(json.dumps({"rendered": result, "activeScene": bpy.context.window.scene.name}, indent=2))


if __name__ == "__main__":
    main()
