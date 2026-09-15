"""Create a reference-informed, MCP-safe authored yacht generation.

This generator is deliberately conservative: it creates an editable Blender
master from the audited research record and leaves manufacturer-specific facts
in the catalog. Blender is run by the coordinating agent through Blender MCP;
the script never opens another .blend file and never touches the recovered
original scene.
"""
from __future__ import annotations

import argparse
import bmesh
import hashlib
import json
import math
import os
import re
import sys
from pathlib import Path
from typing import Any

import bpy
from mathutils import Vector

ROOT = Path("/Users/cristianexer/Hyperdrive/Hullscope")
MCP_SAFE = os.environ.get("HULLSCOPE_BLENDER_MCP") == "1"
ID_RE = re.compile(r"^[a-z0-9-]+$")

VESSEL_ID = ""
MODEL: dict[str, Any] = {}
SCENE = None
COMPONENTS: dict[str, dict[str, Any]] = {}
MATERIALS: dict[str, bpy.types.Material] = {}
RENDER_DIR = Path(os.environ.get("HULLSCOPE_RENDER_DIR", str(ROOT / ".tools" / "yachts" / "review")))
MASTER_DIR = Path(os.environ.get("HULLSCOPE_MASTER_DIR", str(ROOT / ".tools" / "yachts" / "masters")))
METRICS_DIR = Path(os.environ.get("HULLSCOPE_METRICS_DIR", str(ROOT / ".tools" / "yachts" / "review")))
SCENE_SUFFIX = os.environ.get("HULLSCOPE_SCENE_SUFFIX", "")
CAMERAS: list[dict[str, Any]] = []


def cid(key: str) -> str:
    return f"{VESSEL_ID}_{key}"


def safe_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")[:44] or "room"


def source_urls() -> list[str]:
    return [str(source["url"]) for source in MODEL["sources"]]


def first_source() -> str:
    return source_urls()[0]


def authored_albedo(name: str, color: tuple[float, float, float, float]) -> bpy.types.Image:
    """Create a self-contained, medium-resolution authored albedo texture."""
    image_name = f"{VESSEL_ID} | {name} | authored albedo"
    texture_size = 128
    image = bpy.data.images.get(image_name)
    if image is not None and tuple(image.size) != (texture_size, texture_size):
        bpy.data.images.remove(image)
        image = None
    image = image or bpy.data.images.new(image_name, width=texture_size, height=texture_size, alpha=True)
    pixels: list[float] = []
    lower = name.lower()
    for y in range(texture_size):
        for x in range(texture_size):
            u = x / (texture_size - 1)
            v = y / (texture_size - 1)
            variation = 0.96 + 0.04 * ((x * 17 + y * 11) % 19) / 18.0
            if "teak" in lower or "wood" in lower:
                grain = 0.5 + 0.5 * math.sin(y * 0.34 + math.sin(x * 0.045) * 2.8)
                variation = 0.74 + 0.26 * grain
                if y % 17 in (0, 1):
                    variation *= 0.72
            elif "glass" in lower or "glazing" in lower:
                variation = 0.82 + 0.14 * (0.35 * u + 0.65 * (1.0 - v))
            elif "cloth" in lower or "upholstery" in lower:
                weave = ((x % 7) / 6.0 + (y % 9) / 8.0) * 0.5
                variation = 0.90 + 0.08 * weave
            pixels.extend([min(1.0, color[0] * variation), min(1.0, color[1] * variation), min(1.0, color[2] * variation), color[3]])
    image.pixels = pixels
    image.pack()
    return image


def material(name: str, color: tuple[float, float, float, float], metallic: float = 0.0, roughness: float = 0.42) -> bpy.types.Material:
    if name in MATERIALS:
        return MATERIALS[name]
    mat = bpy.data.materials.new(f"Hullscope | {name}")
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    if shader:
        shader.inputs["Base Color"].default_value = color
        shader.inputs["Metallic"].default_value = metallic
        shader.inputs["Roughness"].default_value = roughness
        image_node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        image_node.name = f"{name} authored albedo"
        image_node.image = authored_albedo(name, color)
        texcoord = mat.node_tree.nodes.new("ShaderNodeTexCoord")
        mat.node_tree.links.new(texcoord.outputs["UV"], image_node.inputs["Vector"])
        mat.node_tree.links.new(image_node.outputs["Color"], shader.inputs["Base Color"])
        # A small authored normal response keeps the 3D review from reading
        # as flat colour blocks.  The albedo remains self-contained and
        # exportable; this procedural micro-detail is intentionally shared by
        # material family rather than copied into every selectable component.
        lower = name.lower()
        if "glass" in lower or "glazing" in lower:
            # Opaque near-black glazing made every generic cabin read as a
            # disconnected slab in the review renders. Keep it visibly blue
            # and reflective, with a restrained transmission response that
            # still behaves consistently in Eevee and in the glTF viewer.
            shader.inputs["Metallic"].default_value = 0.05
            shader.inputs["Roughness"].default_value = 0.16
            transmission = shader.inputs.get("Transmission Weight") or shader.inputs.get("Transmission")
            if transmission:
                transmission.default_value = 0.18
            if shader.inputs.get("IOR"):
                shader.inputs["IOR"].default_value = 1.46
            if shader.inputs.get("Coat Weight"):
                shader.inputs["Coat Weight"].default_value = 0.28
            if shader.inputs.get("Coat Roughness"):
                shader.inputs["Coat Roughness"].default_value = 0.12
            if shader.inputs.get("Emission Color"):
                shader.inputs["Emission Color"].default_value = (color[0] * 0.22, color[1] * 0.30, color[2] * 0.34, 1.0)
            if shader.inputs.get("Emission Strength"):
                shader.inputs["Emission Strength"].default_value = 0.55
        if "glass" not in lower and "glazing" not in lower:
            noise = mat.node_tree.nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 18.0 if any(token in lower for token in ("teak", "wood", "cloth", "upholstery")) else 7.0
            noise.inputs["Detail"].default_value = 3.0
            noise.inputs["Roughness"].default_value = 0.72
            bump = mat.node_tree.nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = 0.10 if any(token in lower for token in ("teak", "wood")) else 0.055
            bump.inputs["Distance"].default_value = 0.055 if any(token in lower for token in ("teak", "wood")) else 0.025
            mat.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
            mat.node_tree.links.new(bump.outputs["Normal"], shader.inputs["Normal"])
        if shader.inputs.get("Coat Weight"):
            shader.inputs["Coat Weight"].default_value = 0.18 if "gelcoat" in lower else 0.0
        if shader.inputs.get("Coat Roughness"):
            shader.inputs["Coat Roughness"].default_value = 0.20
    MATERIALS[name] = mat
    return mat


def register_component(key: str, name: str, system: str, parent: str | None, interior: bool, decorative: bool, purpose: str, enclosure: str, deck: str | None = None, room: str | None = None, fidelity: str = "reference-informed", explode: tuple[float, float, float] = (0.0, 0.0, 0.0)) -> str:
    component_id = cid(key)
    if component_id not in COMPONENTS:
        COMPONENTS[component_id] = {
            "id": component_id,
            "name": name,
            "systemId": system,
            "assembly": name,
            "parentId": cid(parent) if parent else None,
            "interior": interior,
            "decorative": decorative,
            "purpose": purpose,
            "enclosure": enclosure,
            "deckId": cid(deck) if deck else None,
            "roomId": cid(room) if room else None,
            "fidelity": fidelity,
            "explode": list(explode),
            "objects": [],
        }
    return component_id


def root_for(key: str, name: str, system: str = "structure", parent: str | None = None, interior: bool = False, decorative: bool = False, purpose: str = "Authored vessel assembly.", enclosure: str = "equipment", deck: str | None = None, room: str | None = None, fidelity: str = "reference-informed", explode: tuple[float, float, float] = (0.0, 0.0, 0.0)) -> bpy.types.Object:
    component_id = register_component(key, name, system, parent, interior, decorative, purpose, enclosure, deck, room, fidelity, explode)
    root = bpy.data.objects.new(f"{VESSEL_ID} | {name} | assembly", None)
    root.empty_display_type = "CUBE"
    root.empty_display_size = 0.15
    root["componentId"] = component_id
    root["interior"] = interior
    root["deck_id"] = cid(deck) if deck else None
    root["room_id"] = cid(room) if room else None
    SCENE.collection.objects.link(root)
    if parent:
        # Keep the authored Blender scene roots transform-independent. The
        # authoritative physical hierarchy is carried by ``parentId`` in the
        # v2 manifest; parenting empties here makes review/explode restores
        # accumulate offsets across repeated MCP renders.
        root["parentComponentId"] = cid(parent)
    COMPONENTS[component_id]["root"] = root
    return root


def attach(obj: bpy.types.Object, component_id: str, root: bpy.types.Object, mat: bpy.types.Material, name: str, decorative: bool | None = None) -> bpy.types.Object:
    obj.name = f"{VESSEL_ID} | {name}"
    obj.parent = root
    obj["componentId"] = component_id
    obj["interior"] = bool(COMPONENTS[component_id]["interior"])
    obj["enclosure"] = COMPONENTS[component_id]["enclosure"]
    if COMPONENTS[component_id].get("deckId"):
        obj["deck_id"] = COMPONENTS[component_id]["deckId"]
    if COMPONENTS[component_id].get("roomId"):
        obj["room_id"] = COMPONENTS[component_id]["roomId"]
    if decorative is not None:
        obj["decorative"] = decorative
    if obj.type == "MESH":
        # Keep a bounded UV channel on every mesh so authored albedos survive glTF export.
        uv = obj.data.uv_layers.get("UVMap") or obj.data.uv_layers.new(name="UVMap")
        xs = [vertex.co.x for vertex in obj.data.vertices] or [0.0]
        ys = [vertex.co.y for vertex in obj.data.vertices] or [0.0]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        span_x = max(max_x - min_x, 1e-6)
        span_y = max(max_y - min_y, 1e-6)
        for loop in obj.data.loops:
            vertex = obj.data.vertices[loop.vertex_index].co
            uv.data[loop.index].uv = ((vertex.x - min_x) / span_x, (vertex.y - min_y) / span_y)
    obj.data.materials.append(mat)
    COMPONENTS[component_id]["objects"].append(obj)
    return obj


def box(name: str, center: tuple[float, float, float], size: tuple[float, float, float], mat: bpy.types.Material, component_id: str, root: bpy.types.Object, bevel: float = 0.04, decorative: bool | None = None) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=center)
    obj = bpy.context.object
    obj.scale = (size[0] / 2.0, size[1] / 2.0, size[2] / 2.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Soft authored edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    return attach(obj, component_id, root, mat, name, decorative)


def cylinder(name: str, center: tuple[float, float, float], radius: float, depth: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object, rotation: tuple[float, float, float] = (0.0, 0.0, 0.0), decorative: bool | None = None) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=depth, location=center, rotation=rotation)
    return attach(bpy.context.object, component_id, root, mat, name, decorative)


def sphere(name: str, center: tuple[float, float, float], scale: tuple[float, float, float], mat: bpy.types.Material, component_id: str, root: bpy.types.Object, decorative: bool | None = None) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=center)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return attach(obj, component_id, root, mat, name, decorative)


def create_mesh(name: str, vertices: list[tuple[float, float, float]], faces: list[tuple[int, ...]], mat: bpy.types.Material, component_id: str, root: bpy.types.Object, bevel: float = 0.0, decorative: bool | None = None) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{VESSEL_ID} | {name} mesh")
    mesh.from_pydata(vertices, [], faces)
    # Procedural shells and glazing are authored from section loops. Recompute
    # their winding here so Blender, glTF and Three.js agree on which side is
    # the visible exterior instead of silently dropping a cabin face.
    mesh.validate(clean_customdata=False)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    SCENE.collection.objects.link(obj)
    if bevel:
        modifier = obj.modifiers.new("Hull edge softening", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    return attach(obj, component_id, root, mat, name, decorative)


def tapered_prism(name: str, x_front: float, x_aft: float, z_bottom: float, z_top: float, bottom_half_beam: float, top_half_beam: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object) -> bpy.types.Object:
    """Create a sloped deckhouse with real corners instead of a rectangular block."""
    vertices = [
        (x_front, -bottom_half_beam, z_bottom), (x_front, bottom_half_beam, z_bottom),
        (x_aft, bottom_half_beam, z_bottom), (x_aft, -bottom_half_beam, z_bottom),
        (x_front - 0.02, -top_half_beam, z_top), (x_front - 0.02, top_half_beam, z_top),
        (x_aft + 0.02, top_half_beam, z_top), (x_aft + 0.02, -top_half_beam, z_top),
    ]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    return create_mesh(name, vertices, faces, mat, component_id, root, bevel=0.10)


def canopy_shell(name: str, x_front: float, x_aft: float, z_bottom: float, z_top: float, bottom_half_beam: float, top_half_beam: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object) -> bpy.types.Object:
    """Create a shallow, overhanging canopy with a tapered plan and soft stations.

    A cube is a poor stand-in for a yacht hardtop: it reads as a floating slab
    as soon as the camera sees the underside. This deliberately shallow shell
    keeps a readable underside, a smaller upper footprint, and a slightly
    curved leading/trailing edge while remaining one inexpensive render mesh.
    """
    stations = [
        (x_front, bottom_half_beam * 0.90, top_half_beam * 0.78, z_bottom + 0.02, z_top - 0.015),
        ((x_front + x_aft) * 0.50, bottom_half_beam, top_half_beam, z_bottom, z_top),
        (x_aft, bottom_half_beam * 0.94, top_half_beam * 0.82, z_bottom + 0.012, z_top - 0.02),
    ]
    vertices: list[tuple[float, float, float]] = []
    for x, bottom, top, low, high in stations:
        chamfer = min(0.08, max(0.028, (high - low) * 0.28))
        vertices.extend([
            (x, -bottom, low), (x, bottom, low),
            (x, bottom * 1.015, low + chamfer),
            (x, top, high - chamfer), (x, top, high),
            (x, -top, high), (x, -top, high - chamfer),
            (x, -bottom * 1.015, low + chamfer),
        ])
    faces: list[tuple[int, ...]] = []
    for index in range(len(stations) - 1):
        a = index * 8
        b = (index + 1) * 8
        for side in range(8):
            nxt = (side + 1) % 8
            faces.append((a + side, b + side, b + nxt, a + nxt))
    faces.append(tuple(range(7, -1, -1)))
    faces.append(tuple((len(stations) - 1) * 8 + side for side in range(8)))
    return create_mesh(name, vertices, faces, mat, component_id, root, bevel=0.035)


def curved_cabin(name: str, x_front: float, x_aft: float, z_bottom: float, z_top: float, bottom_half_beam: float, top_half_beam: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object) -> bpy.types.Object:
    """Create a three-station, chamfered wheelhouse instead of a single box.

    The bow station is narrower and more strongly raked, the middle station
    carries the shoulder, and the aft station tapers into the cockpit.  This
    small amount of longitudinal curvature is one of the highest-value visual
    differences between the documented yacht families.
    """
    stations = [
        (x_front, bottom_half_beam * 0.82, top_half_beam * 0.68, z_bottom + 0.08, z_top - 0.12),
        ((x_front + x_aft) * 0.48, bottom_half_beam, top_half_beam, z_bottom, z_top),
        (x_aft, bottom_half_beam * 0.92, top_half_beam * 0.82, z_bottom + 0.02, z_top - 0.06),
    ]
    vertices: list[tuple[float, float, float]] = []
    for x, bottom, top, low, high in stations:
        chamfer = min(0.12, max(0.045, (high - low) * 0.16))
        vertices.extend([
            (x, -bottom, low), (x, bottom, low),
            (x, bottom * 1.02, low + chamfer),
            (x, top, high - chamfer), (x, top, high),
            (x, -top, high), (x, -top, high - chamfer),
            (x, -bottom * 1.02, low + chamfer),
        ])
    faces: list[tuple[int, ...]] = []
    for index in range(len(stations) - 1):
        a = index * 8
        b = (index + 1) * 8
        for side in range(8):
            nxt = (side + 1) % 8
            faces.append((a + side, b + side, b + nxt, a + nxt))
    faces.append(tuple(range(7, -1, -1)))
    faces.append(tuple((len(stations) - 1) * 8 + side for side in range(8)))
    obj = create_mesh(name, vertices, faces, mat, component_id, root, bevel=0.045)
    # Smooth the authored station transitions without adding selectable
    # assemblies. A single render-level subdivision keeps the cabin shoulder
    # and roofline continuous in the browser while remaining inexpensive in
    # the exported LODs.
    subdivision = obj.modifiers.new("Cabin shoulder smoothing", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 1
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def window_band(name: str, x_aft: float, x_front: float, y_aft: float, y_front: float, z_bottom: float, z_top: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object) -> bpy.types.Object:
    """A shallow, tapered solid glazing pane following the cabin stations.

    A paper-thin n-gon was valid enough for Blender but was inconsistently
    classified by the glTF exporter/browser path. Give each pane a small
    physical thickness so it survives selection, compression and both winding
    directions as an authored render mesh.
    """
    inset = 0.008 if y_front >= 0 else -0.008
    y0, y1 = y_aft + inset, y_front + inset
    thickness = -0.028 if y0 >= 0 else 0.028
    front = [(x_aft, y0, z_bottom), (x_front, y1, z_bottom + 0.03), (x_front, y1, z_top), (x_aft, y0, z_top - 0.02)]
    back = [(x, y + thickness, z) for x, y, z in front]
    vertices = front + back
    faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    return create_mesh(name, vertices, faces, mat, component_id, root, bevel=0.012, decorative=True)


def knife_window_band(name: str, x_aft: float, x_front: float, y_aft: float, y_front: float, z_bottom: float, z_top: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object) -> bpy.types.Object:
    """Create a rising, tapered hull window instead of a rectangular strip."""
    inset = 0.008 if y_front >= 0 else -0.008
    y0, y1 = y_aft + inset, y_front + inset
    thickness = -0.028 if y0 >= 0 else 0.028
    rise = min(0.16, max(0.06, (z_top - z_bottom) * 0.28))
    front = [
        (x_aft, y0, z_bottom + 0.035),
        (x_front, y1, z_bottom + rise),
        (x_front, y1, z_top + rise * 0.45),
        (x_aft, y0, z_top - 0.025),
    ]
    back = [(x, y + thickness, z) for x, y, z in front]
    vertices = front + back
    faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    return create_mesh(name, vertices, faces, mat, component_id, root, bevel=0.012, decorative=True)


def hull_stations(profile: str = "flybridge") -> list[tuple[float, float, float]]:
    """Return normalized longitudinal stations shared by hull and deck shells."""
    stations = [
        (-0.50, 0.10, 0.44), (-0.46, 0.38, 0.56), (-0.38, 0.70, 0.68),
        (-0.24, 0.92, 0.78), (0.00, 1.00, 0.84), (0.23, 0.96, 0.90),
        (0.40, 0.80, 0.98), (0.48, 0.52, 1.08), (0.50, 0.08, 1.18),
    ]
    if profile == "sports":
        stations = [
            (-0.50, 0.06, 0.34), (-0.46, 0.30, 0.46), (-0.38, 0.63, 0.60),
            (-0.24, 0.88, 0.72), (0.00, 1.00, 0.78), (0.23, 0.94, 0.84),
            (0.40, 0.76, 0.92), (0.48, 0.46, 1.04), (0.50, 0.07, 1.12),
        ]
    elif profile == "ocean":
        stations = [
            (-0.50, 0.16, 0.54), (-0.46, 0.44, 0.63), (-0.38, 0.76, 0.73),
            (-0.24, 0.96, 0.82), (0.00, 1.00, 0.86), (0.23, 0.99, 0.92),
            (0.40, 0.88, 1.00), (0.48, 0.64, 1.10), (0.50, 0.15, 1.20),
        ]
    elif profile == "open":
        stations = [
            (-0.50, 0.04, 0.30), (-0.46, 0.27, 0.43), (-0.38, 0.60, 0.57),
            (-0.24, 0.86, 0.68), (0.00, 1.00, 0.74), (0.23, 0.92, 0.80),
            (0.40, 0.72, 0.88), (0.48, 0.42, 0.98), (0.50, 0.05, 1.08),
        ]
    return stations


def hull_mesh(length: float, beam: float, draft: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object, profile: str = "flybridge") -> bpy.types.Object:
    # A denser station grid and rounded chine profile keeps the authored shell
    # readable as a yacht hull at review distance instead of a stack of slabs.
    # The sheer rises into both transom and bow instead of reading as a
    # horizontal slab in profile. The bow rise is intentionally stronger
    # on the forward stations because it is one of the most visible
    # recognition cues in the reference views.
    stations = hull_stations(profile)
    # The families share a construction language but not one universal hull
    # silhouette.  Keep the same audited envelope while varying the bow entry,
    # fullness and sheer so a Predator, sportscruiser and flybridge yacht do
    # not collapse into one procedural shell.
    verts: list[tuple[float, float, float]] = []
    for xn, width, top in stations:
        x = xn * length
        half = beam * width / 2.0
        # Real planing and flybridge hulls carry rocker: the keel is deepest
        # around midships and rises toward the transom and bow. A constant
        # bottom line was one of the reasons the side view read as a plate.
        end_fraction = min(1.0, abs(xn) / 0.50)
        keel = -draft * (0.86 + 0.14 * (1.0 - end_fraction))
        chine = keel * 0.62
        verts.extend([
            (x, -half, top),
            (x, -half * 0.95, top - draft * 0.23),
            (x, -half * 0.68, chine),
            (x, -half * 0.25, keel),
            (x, half * 0.25, keel),
            (x, half * 0.68, chine),
            (x, half * 0.95, top - draft * 0.23),
            (x, half, top),
        ])
    faces: list[tuple[int, ...]] = []
    for i in range(len(stations) - 1):
        a = i * 8
        b = (i + 1) * 8
        for side in range(8):
            next_side = (side + 1) % 8
            faces.append((a + side, b + side, b + next_side, a + next_side))
    faces.extend([(tuple(range(7, -1, -1))), tuple((len(stations) - 1) * 8 + side for side in range(8))])
    # Keep the visual chine soft without letting the bevel expand the measured
    # envelope beyond the audited beam on the smaller open boats.
    obj = create_mesh("continuous station hull", verts, faces, mat, component_id, root, bevel=min(0.03, beam * 0.012))
    subdivision = obj.modifiers.new("Continuous hull smoothing", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 1
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def deck_shell(name: str, length: float, beam: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object, profile: str) -> bpy.types.Object:
    """Create a thin deck cap that follows the hull sheer instead of a cuboid."""
    stations = hull_stations(profile)
    vertices: list[tuple[float, float, float]] = []
    deck_beam = beam * 0.93
    for xn, width, top in stations:
        x = xn * length
        half = min(deck_beam * width * 0.50, beam * 0.48)
        z = top + 0.045
        vertices.extend([(x, -half, z), (x, half, z), (x, half, z - 0.085), (x, -half, z - 0.085)])
    faces: list[tuple[int, ...]] = []
    for index in range(len(stations) - 1):
        a = index * 4
        b = (index + 1) * 4
        faces.extend([
            (a, b, b + 1, a + 1),
            (a + 3, a + 2, b + 2, b + 3),
            (a, a + 3, b + 3, b),
            (a + 1, b + 1, b + 2, a + 2),
        ])
    faces.extend([(3, 2, 1, 0), tuple((len(stations) - 1) * 4 + offset for offset in (0, 1, 2, 3))])
    return create_mesh(name, vertices, faces, mat, component_id, root, bevel=0.018)


def add_curve_rail(name: str, points: list[tuple[float, float, float]], radius: float, mat: bpy.types.Material, component_id: str, root: bpy.types.Object) -> bpy.types.Object:
    curve = bpy.data.curves.new(f"{VESSEL_ID} | {name} curve", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, co in zip(spline.bezier_points, points):
        point.co = co
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    SCENE.collection.objects.link(obj)
    return attach(obj, component_id, root, mat, name, True)


def load_model(model_id: str) -> None:
    global VESSEL_ID, MODEL
    if not ID_RE.match(model_id):
        raise ValueError("Unsafe yacht generation id")
    VESSEL_ID = model_id
    paths = sorted((ROOT / "research" / "yachts").glob("*-batch-*.json"))
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        for model in data.get("models", []):
            if model.get("id") == model_id:
                MODEL = model
                return
    raise ValueError(f"No audited research record for {model_id}")


def scene_setup() -> None:
    global SCENE
    scene_name = f"{VESSEL_ID}{SCENE_SUFFIX}"
    SCENE = bpy.data.scenes.get(scene_name) or bpy.data.scenes.new(scene_name)
    for obj in list(SCENE.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for child in list(SCENE.collection.children):
        SCENE.collection.children.unlink(child)
        if child.users == 0:
            bpy.data.collections.remove(child)
    for window in bpy.context.window_manager.windows:
        window.scene = SCENE
    SCENE.unit_settings.system = "METRIC"
    SCENE.unit_settings.length_unit = "METERS"
    SCENE.unit_settings.scale_length = 1.0
    SCENE.render.engine = "BLENDER_EEVEE"
    SCENE.render.resolution_x = 560
    SCENE.render.resolution_y = 380
    SCENE.render.resolution_percentage = 100
    SCENE.render.image_settings.file_format = "PNG"
    SCENE.render.film_transparent = False
    SCENE.render.image_settings.color_mode = "RGBA"
    SCENE.render.image_settings.color_depth = "8"
    SCENE.view_settings.look = "AgX - Medium High Contrast"
    world = bpy.data.worlds.new(f"{VESSEL_ID} | world") if not SCENE.world else SCENE.world
    SCENE.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.006, 0.012, 0.024, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.30


def create_geometry() -> None:
    target_length = float(MODEL["dimensions"].get("lengthM") or 12.0)
    target_beam = float(MODEL["dimensions"].get("beamM") or target_length * 0.28)
    # The authored anchor/platform overhangs add roughly four percent to the
    # station envelope; leave room for those authored details while keeping
    # the exported overall dimensions within the catalog tolerance.
    length = target_length * 0.96
    draft = float(MODEL["dimensions"].get("draftM") or max(0.65, length * 0.07))
    long = length / 2.0
    range_name = str(MODEL.get("range", "")).lower()
    model_name = str(MODEL.get("name", "")).lower()
    model_type = str(MODEL.get("type", "")).lower()
    visual = MODEL.get("visual", {})
    visual_text = " ".join(str(visual.get(key, "")) for key in ("hullDescription", "superstructureDescription", "glazingDescription", "distinctiveFeatures")).lower()
    is_open_dayboat = any(token in model_name for token in ("hawk 38", "r35"))
    is_sportscruiser = range_name in {"v class", "predator", "portofino"} or "sportscruiser" in model_type
    is_flybridge = range_name in {"manhattan", "f class", "y class", "s class", "ocean", "x class"} or "flybridge" in model_type or ("flybridge" in visual_text and "no flybridge" not in visual_text)
    is_super_flybridge = range_name == "x class"
    is_large_predator = range_name == "predator" and target_length > 24.0
    is_opening_roof = is_sportscruiser and not is_open_dayboat
    brand_name = str(MODEL.get("brand", "")).lower()
    is_sunseeker = "sunseeker" in brand_name
    is_predator = range_name == "predator"
    is_portofino = range_name == "portofino"
    is_manhattan = range_name == "manhattan"
    is_ocean = range_name == "ocean"
    is_x_class = range_name == "x class"
    # Calibrate the shared authored envelope against the final exported AABB.
    # Flybridge families have a wider fixed upper-deck envelope, while the
    # Ocean profile adds a larger fixed side transition. Keep those allowances
    # family-specific so the audited beam remains within one percent.
    beam_factor = 1.025 if is_ocean else 1.04 if is_flybridge else 1.058 if "hawk 38" in model_name else 1.05
    beam = target_beam * beam_factor
    hull = root_for("hull_shell", "Hull shell", "structure", purpose="Reference-informed hull form and underwater volume.", enclosure="shell", explode=(0.0, 0.0, -0.9))
    deck = root_for("deck_main", "Main deck", "structure", "hull_shell", purpose="Main deck surface and deck edge.", enclosure="envelope", deck="deck_main")
    super_root = root_for("superstructure", "Superstructure", "structure", "deck_main", purpose="Reference-informed wheelhouse and superstructure.", enclosure="shell", deck="deck_main", explode=(0.0, 0.0, 0.8))
    glazing = root_for("glazing", "Glazing", "structure", "superstructure", purpose="Windshield, side glazing and hull windows.", enclosure="shell", deck="deck_main", decorative=True)
    cockpit = root_for("cockpit", "Cockpit and social deck", "accommodation", "deck_main", purpose="Open aft cockpit, seating and social equipment.", enclosure="equipment", deck="deck_main")
    helm = root_for("helm", "Helm station", "navigation", "superstructure", purpose="Helm console, steering position and displays.", enclosure="equipment", deck="deck_main")
    propulsion = root_for("propulsion", "Propulsion", "propulsion", "hull_shell", purpose="Documented propulsion family represented as authored machinery and drives.", enclosure="equipment", explode=(0.0, 0.0, -1.2))
    electrical = root_for("electrical", "Electrical power", "electrical", "hull_shell", purpose="Batteries, distribution and generator family placeholder where details are unknown.", enclosure="equipment", fidelity="reconstructed")
    fuel = root_for("fuel", "Fuel system", "fuel", "hull_shell", purpose="Fuel tank and service system envelope.", enclosure="equipment", fidelity="reconstructed")
    freshwater = root_for("freshwater", "Freshwater and sanitation", "utilities", "hull_shell", purpose="Freshwater and sanitation service envelope.", enclosure="equipment", fidelity="reconstructed")
    ventilation = root_for("ventilation", "Ventilation and HVAC", "utilities", "superstructure", purpose="Ventilation and HVAC service equipment envelope.", enclosure="equipment", fidelity="reconstructed")
    safety = root_for("safety", "Safety equipment", "safety", "deck_main", purpose="Liferaft, extinguisher and navigation safety equipment.", enclosure="equipment", deck="deck_main")
    mooring = root_for("mooring", "Mooring equipment", "mooring", "deck_main", purpose="Anchor, windlass, cleats and rails.", enclosure="equipment", deck="deck_main")
    swim = root_for("swim_platform", "Swim platform", "structure", "hull_shell", purpose="Aft bathing platform or transom step.", enclosure="envelope", deck="deck_main", decorative=True)

    brand_prefix = "Sunseeker" if is_sunseeker else "Princess"
    # Keep the authored surfaces legible in both Blender review renders and
    # the browser's environment lighting. Earlier values made the glazing
    # collapse into a black silhouette and the deckhouse read as disconnected
    # slabs on software-rendered paths.
    gelcoat_color = (0.82, 0.88, 0.96, 1) if is_sunseeker else (0.94, 0.95, 0.93, 1)
    # Keep the navy/glass family visibly blue under the viewer's neutral
    # environment. Near-black glass loses the windshield and side-window
    # landmarks entirely in a software renderer.
    glazing_color = (0.14, 0.36, 0.58, 1) if is_sunseeker else (0.15, 0.39, 0.62, 1)
    white = material(f"{brand_prefix} gelcoat ivory", gelcoat_color, roughness=0.24)
    dark = material(f"{brand_prefix} glazing deep blue", glazing_color, metallic=0.02, roughness=0.12)
    # R35 carbon remains dark and technical, but it must still expose the
    # hull chine and sheer under the browser's neutral environment lighting.
    carbon = material("R35 carbon composite", (0.13, 0.22, 0.28, 1), metallic=0.06, roughness=0.34)
    teak = material("teak", (0.38, 0.16, 0.055, 1), roughness=0.58)
    graphite = material("graphite", (0.12, 0.19, 0.25, 1), metallic=0.12, roughness=0.28)
    steel = material("stainless steel", (0.32, 0.38, 0.42, 1), metallic=0.85, roughness=0.2)
    cushion = material("interior upholstery", (0.56, 0.65, 0.73, 1), roughness=0.64)
    wood = material("interior walnut", (0.22, 0.075, 0.025, 1), roughness=0.45)
    engine_mat = material("machinery blue", (0.015, 0.12, 0.23, 1), metallic=0.32, roughness=0.35)
    orange = material("safety orange", (0.75, 0.16, 0.02, 1), roughness=0.5)

    hull_profile = "open" if is_open_dayboat else ("sports" if is_sportscruiser else ("ocean" if is_ocean else "flybridge"))
    # The authored bevel contributes a small evaluated width to the exported
    # AABB. Compensate at the hull surface so the release measurement remains
    # inside the audited beam envelope without narrowing decks or fittings.
    hull_surface = carbon if model_name == "r35" else white
    hull_mesh(length, beam * 0.987, draft, hull_surface, cid("hull_shell"), hull, hull_profile)
    for side in (-1, 1):
        box(f"hull boot stripe {side}", (-length * 0.06, side * beam * 0.46, 0.25), (length * 0.60, 0.035, 0.12), graphite, cid("hull_shell"), hull, 0.02, True)
        box(f"upper sheer rail {side}", (-length * 0.02, side * beam * 0.475, 0.66), (length * 0.74, 0.028, 0.055), steel, cid("hull_shell"), hull, 0.012, True)
        box(f"lower chine highlight {side}", (-length * 0.08, side * beam * 0.39, -draft * 0.28), (length * 0.48, 0.022, 0.045), graphite, cid("hull_shell"), hull, 0.01, True)
        # A continuous shoulder below the windows makes the freeboard read as
        # one built hull side instead of a thin floating window strip.
        box(f"painted hull shoulder {side}", (length * 0.02, side * beam * 0.455, 0.82), (length * 0.52, 0.035, 0.20), hull_surface, cid("hull_shell"), hull, 0.025, True)
    deck_shell("continuous sheer-following main deck", length, beam, teak if model_name != "r35" else carbon, cid("deck_main"), deck, hull_profile)
    box("foredeck cap", (length * 0.27, 0.0, 0.80), (length * 0.28, beam * 0.72, 0.10), hull_surface, cid("deck_main"), deck, 0.035, True)
    # Narrow inlaid deck lines make the teak treatment read as a built deck
    # rather than a single colored slab while remaining one selectable deck
    # assembly.
    for index in range(7):
        x = -length * 0.28 + index * length * 0.085
        box(f"foredeck inlay {index}", (x, 0.0, 0.858), (0.018, beam * 0.70, 0.012), graphite, cid("deck_main"), deck, 0.002, True)
    # The station hull already supplies the transom. Keep only a slim fascia
    # so the rounded stern remains visible instead of reading as a detached
    # rectangular wall in profile and three-quarter views.
    box("aft transom cap", (-length * 0.47, 0.0, 0.54), (0.06, beam * 0.70, 0.28), white, cid("deck_main"), deck, 0.028, True)
    box("bow roller", (length * 0.49, 0.0, 1.00), (0.26, 0.16, 0.10), steel, cid("mooring"), mooring, 0.025, True)
    for side in (-1, 1):
        add_curve_rail(f"foredeck guard {side}", [(length * 0.26, side * beam * 0.39, 1.00), (length * 0.42, side * beam * 0.25, 1.06), (length * 0.49, side * beam * 0.08, 1.10)], 0.014, steel, cid("mooring"), mooring)
    height_lift = max(0.0, min(0.34, (target_length - 18.0) * 0.022))
    if is_open_dayboat:
        # The R35/Hawk 38 are open performance boats, not miniature flybridge
        # yachts. Keep the center console low and let the hull/deck dominate.
        # A tapered console and sloping windscreen provide the actual visual
        # center of an open boat; the previous low cube was easy to lose behind
        # the gunwales in a three-quarter browser view.
        tapered_prism("low center-console body", length * 0.18, -length * 0.02, 0.88, 1.38, beam * 0.27, beam * 0.20, hull_surface, cid("superstructure"), super_root)
        tapered_prism("sloping center-console windscreen", length * 0.18, length * 0.02, 1.34, 1.62, beam * 0.21, beam * 0.15, dark, cid("glazing"), glazing)
        box("low console cowl", (length * 0.08, 0.0, 1.08), (length * 0.20, beam * 0.52, 0.16), white, cid("superstructure"), super_root, 0.06)
        box("central helm screen", (length * 0.15, 0.0, 1.47), (0.035, beam * 0.31, 0.16), dark, cid("glazing"), glazing, 0.018, True)
        box("port wind deflector", (length * 0.10, -beam * 0.32, 1.20), (length * 0.16, 0.035, 0.22), dark, cid("glazing"), glazing, 0.02, True)
        box("starboard wind deflector", (length * 0.10, beam * 0.32, 1.20), (length * 0.16, 0.035, 0.22), dark, cid("glazing"), glazing, 0.02, True)
    else:
        # Give the main cabin enough beam and longitudinal run to read as a
        # continuous yacht volume. The previous narrow, fixed-size cabin
        # exposed too much deck on the larger boats and looked like a box
        # suspended between horizontal plates.
        cabin_top = (1.62 if is_sportscruiser else 2.02) + height_lift
        cabin_front = length * (0.30 if is_sportscruiser else 0.32)
        cabin_aft = -length * (0.12 if is_sportscruiser else 0.16)
        cabin_bottom_half = beam * (0.38 if is_sportscruiser else 0.42)
        cabin_top_half = beam * (0.32 if is_sportscruiser else 0.36)
        curved_cabin("sloped wheelhouse volume", cabin_front, cabin_aft, 0.88, cabin_top, cabin_bottom_half, cabin_top_half, white, cid("superstructure"), super_root)
        roof_z = cabin_top + 0.07
        # Flybridge yachts read more cleanly when the wheelhouse roof is a
        # shallow cap tucked under the upper deck. A full-width second canopy
        # here created three visually separate horizontal slabs: cabin roof,
        # flybridge deck, and flybridge hardtop. Sportscruisers retain the
        # larger integrated hardtop because it is part of their identity.
        if not is_flybridge:
            canopy_shell(
                "integrated hardtop canopy",
                cabin_front + 0.06,
                cabin_aft - 0.06,
                roof_z - 0.08,
                roof_z + 0.05,
                beam * (0.42 if is_sportscruiser else 0.46),
                beam * (0.34 if is_sportscruiser else 0.38),
                graphite if is_sunseeker else white,
                cid("superstructure"),
                super_root,
            )
        else:
            canopy_shell(
                "wheelhouse roof cap",
                cabin_front + 0.11,
                cabin_aft - 0.11,
                roof_z - 0.025,
                roof_z + 0.025,
                beam * 0.36,
                beam * 0.30,
                graphite if is_sunseeker else white,
                cid("superstructure"),
                super_root,
            )
        if is_opening_roof:
            box("opening roof aperture", (length * 0.13, 0.0, roof_z + 0.052), (length * 0.18, beam * 0.42, 0.018), dark, cid("glazing"), glazing, 0.01, True)
        screen_z = 1.42 if is_sportscruiser else 1.65
        screen_h = 0.40 if is_sportscruiser else 0.55
        box("port windshield", (length * 0.20, -beam * 0.37, screen_z), (length * 0.22, 0.035, screen_h), dark, cid("glazing"), glazing, 0.02, True)
        box("starboard windshield", (length * 0.20, beam * 0.37, screen_z), (length * 0.22, 0.035, screen_h), dark, cid("glazing"), glazing, 0.02, True)
        box("forward windshield", (length * 0.27, 0.0, screen_z + 0.03), (0.04, beam * 0.66, screen_h), dark, cid("glazing"), glazing, 0.02, True)
        for side in (-1, 1):
            y_factor = 0.315 if is_sportscruiser else 0.31
            # The lower shoulder is a visible painted transition between the
            # deck and the panoramic glass. It is intentionally not a full
            # hull shell: the authored cabin remains inspectable as one
            # selectable superstructure assembly.
            shoulder_y = 0.37 if is_sportscruiser else 0.405
            glass_y = 0.36 if is_sportscruiser else 0.415
            box(f"saloon painted lower shoulder {side}", (length * 0.05, side * beam * shoulder_y, 1.08), (length * 0.34, 0.10, 0.27), white, cid("superstructure"), super_root, 0.035, True)
            # The side of the curved cabin tapers inward toward the roof. Put
            # the solid pane on that outer slope; the earlier 0.31 offset
            # buried most of the glazing inside larger Princess cabins, which
            # made the superstructure read as an unlit black box.
            window_band(f"saloon side glazing {side}", cabin_aft + 0.08, cabin_front - 0.08, side * beam * (glass_y - 0.012), side * beam * (glass_y + 0.012), 1.35 if is_sportscruiser else 1.40, 1.69 if is_sportscruiser else 1.82, dark, cid("glazing"), glazing)
            # Slender mullions separate the broad glazed band into real panes;
            # they are visually important but intentionally non-selectable.
            for mullion in (-0.09, 0.02, 0.13):
                box(f"saloon glazing mullion {side} {mullion}", (length * mullion, side * beam * (0.332 if is_sportscruiser else 0.354), 1.52 if is_sportscruiser else 1.60), (0.022, 0.040, 0.38 if is_sportscruiser else 0.48), steel, cid("glazing"), glazing, 0.006, True)
            # White upper fascia and front/rear jambs keep the large panes
            # visually seated in the cabin shell; the earlier pane-only
            # treatment made the glass look like a loose blue board.
            box(f"saloon glazing upper fascia {side}", (length * 0.05, side * beam * (0.395 if is_sportscruiser else 0.445), (1.76 if is_sportscruiser else 1.92) + height_lift * 0.35), (length * 0.34, 0.09, 0.11), white, cid("superstructure"), super_root, 0.025, True)
            box(f"saloon glazing aft jamb {side}", (cabin_aft + 0.07, side * beam * (0.398 if is_sportscruiser else 0.445), 1.58 if is_sportscruiser else 1.69), (0.10, 0.09, 0.55 if is_sportscruiser else 0.68), white, cid("superstructure"), super_root, 0.022, True)
            box(f"saloon glazing forward jamb {side}", (cabin_front - 0.07, side * beam * (0.398 if is_sportscruiser else 0.445), 1.58 if is_sportscruiser else 1.69), (0.10, 0.09, 0.55 if is_sportscruiser else 0.68), white, cid("superstructure"), super_root, 0.022, True)
        if is_sportscruiser or is_large_predator:
            box("aft patio glass", (-length * 0.06, 0.0, 1.20), (0.035, beam * 0.58, 0.48), dark, cid("glazing"), glazing, 0.02, True)
    if length > 12 and not is_open_dayboat:
        hull_window_length = length * (0.42 if is_sportscruiser else 0.34)
        hull_window_height = 0.62 if is_sportscruiser else 0.46
        hull_window_z = 0.60 if is_sportscruiser else 0.48
        for side in (-1, 1):
            knife_window_band(f"hull side window {side}", -hull_window_length * 0.44, hull_window_length * 0.56, side * beam * 0.43, side * beam * 0.455, hull_window_z - hull_window_height * 0.50, hull_window_z + hull_window_height * 0.50, dark, cid("glazing"), glazing)
            box(f"hull window lower sill {side}", (length * 0.02, side * beam * 0.445, hull_window_z - hull_window_height * 0.53), (hull_window_length * 1.05, 0.04, 0.055), steel, cid("glazing"), glazing, 0.012, True)
            if is_x_class:
                # X-class identity is the almost continuous, floor-to-ceiling
                # side glass running through the long main deck. The generic
                # cabin band is deliberately retained at the bow, while this
                # extended pane carries the distinctive aft window sweep.
                window_band(
                    f"X95 continuous main-deck glazing {side}",
                    -length * 0.37,
                    length * 0.36,
                    side * beam * 0.425,
                    side * beam * 0.452,
                    1.38,
                    1.93,
                    dark,
                    cid("glazing"),
                    glazing,
                )
                for mullion in (-0.24, -0.05, 0.14, 0.30):
                    box(f"X95 long-glass mullion {side} {mullion}", (length * mullion, side * beam * 0.445, 1.66), (0.025, 0.045, 0.52), steel, cid("glazing"), glazing, 0.008, True)
    else:
        for side in (-1, 1):
            box(f"side wind deflector {side}", (length * 0.06, side * beam * 0.40, 1.18), (length * 0.15, 0.035, 0.28), dark, cid("glazing"), glazing, 0.02, True)
    box("aft cockpit deck", (-length * 0.27, 0.0, 0.84), (length * 0.34, beam * 0.86, 0.10), teak, cid("cockpit"), cockpit, 0.03)
    for index in range(5):
        box(f"cockpit deck inlay {index}", (-length * 0.39 + index * length * 0.06, 0.0, 0.895), (0.016, beam * 0.80, 0.012), graphite, cid("cockpit"), cockpit, 0.002, True)
    box("port cockpit settee", (-length * 0.28, -beam * 0.28, 1.10), (length * 0.24, beam * 0.22, 0.38), cushion, cid("cockpit"), cockpit, 0.08)
    box("starboard cockpit settee", (-length * 0.28, beam * 0.28, 1.10), (length * 0.24, beam * 0.22, 0.38), cushion, cid("cockpit"), cockpit, 0.08)
    box("cockpit table", (-length * 0.28, 0.0, 1.34), (length * 0.16, beam * 0.23, 0.08), wood, cid("cockpit"), cockpit, 0.025, True)
    cylinder("cockpit table pedestal", (-length * 0.28, 0.0, 1.16), 0.045, 0.32, steel, cid("cockpit"), cockpit, decorative=True)
    # Flybridge boats carry the primary helm upstairs; a large outboard
    # console on the main deck looked like a detached black block in profile.
    helm_y = beam * (0.17 if is_flybridge else 0.30)
    helm_width = beam * (0.105 if is_flybridge else 0.16)
    box("helm console", (length * 0.14, helm_y, 1.28), (length * 0.16, helm_width, 0.42), graphite, cid("helm"), helm, 0.06)
    for i in range(3):
        box(f"helm display {i}", (length * 0.11 + i * 0.22, helm_y + helm_width * 0.52, 1.52), (0.15, 0.035, 0.13), dark, cid("helm"), helm, 0.015, True)
    for side in (-1, 1):
        box(f"engine bay {side}", (-length * 0.22, side * beam * 0.20, -draft * 0.16), (length * 0.20, beam * 0.20, 0.64), engine_mat, cid("propulsion"), propulsion, 0.06)
        cylinder(f"propulsion exhaust {side}", (-length * 0.38, side * beam * 0.31, -draft * 0.02), 0.07, 0.38, steel, cid("propulsion"), propulsion, (0.0, math.pi / 2.0, 0.0), True)
    box("battery bank", (-length * 0.03, 0.0, -draft * 0.30), (length * 0.14, beam * 0.24, 0.28), graphite, cid("electrical"), electrical, 0.04)
    box("fuel tank", (-length * 0.12, 0.0, -draft * 0.48), (length * 0.25, beam * 0.32, 0.24), graphite, cid("fuel"), fuel, 0.05)
    box("freshwater tank", (length * 0.10, 0.0, -draft * 0.45), (length * 0.18, beam * 0.26, 0.22), white, cid("freshwater"), freshwater, 0.05)
    # Keep the service trunk inside the below-deck service envelope. The
    # former roof datum became a long floating bar after the proportional
    # superstructure pass and was the most obvious “missing piece” in the
    # browser screenshots. It remains selectable and appears in cutaway/
    # systems views without polluting the exterior silhouette.
    vent_z = -draft * 0.28
    vent_depth = length * (0.12 if is_open_dayboat else 0.15)
    cylinder("ventilation trunk", (length * 0.05, 0.0, vent_z), 0.055, vent_depth, steel, cid("ventilation"), ventilation, (0.0, math.pi / 2.0, 0.0), True)
    box("liferaft canister", (-length * 0.38, -beam * 0.40, 1.20), (length * 0.14, beam * 0.11, 0.16), orange, cid("safety"), safety, 0.04, True)
    box("anchor", (length * 0.49, 0.0, 0.48), (0.20, 0.12, 0.42), steel, cid("mooring"), mooring, 0.025, True)
    for side in (-1, 1):
        add_curve_rail(f"side rail {side}", [(length * 0.12, side * beam * 0.44, 0.96), (length * 0.32, side * beam * 0.42, 1.02), (length * 0.47, side * beam * 0.24, 0.84)], 0.018, steel, cid("mooring"), mooring)
        for index, x in enumerate((0.16, 0.25, 0.34, 0.42)):
            rail_z = 0.94 if x < 0.37 else 0.88
            cylinder(f"side rail stanchion {side} {index}", (length * x, side * beam * (0.435 if x < 0.37 else 0.34), rail_z), 0.014, 0.22 if x < 0.37 else 0.16, steel, cid("mooring"), mooring, decorative=True)
    box("bathing platform", (-length * 0.48, 0.0, 0.18), (length * 0.12, beam * 0.78, 0.10), teak, cid("swim_platform"), swim, 0.025, True)

    if is_flybridge:
        flybridge = root_for("flybridge", "Flybridge and upper deck", "accommodation", "superstructure", purpose="Reference-informed upper helm, seating and deck volume.", enclosure="equipment", deck="deck_main", explode=(0.0, 0.0, 1.0))
        fly_z = 2.72 if is_super_flybridge else 2.42 + (0.22 if target_length > 20 else 0.0) + height_lift * 0.55
        # A long-range X95 carries an unusually long “super fly” deck. The
        # ordinary F/Y/S/Manhattan/Ocean families still need a substantial
        # aft flybridge so their upper deck reads as a supported volume rather
        # than a short floating slab.
        fly_len = 0.78 if is_super_flybridge else 0.48 if (is_manhattan or is_ocean or target_length > 24.0) else 0.42
        fly_beam = 0.82 if is_super_flybridge else 0.70
        canopy_shell(
            "flybridge deck shell",
            length * fly_len * 0.48,
            -length * fly_len * 0.52,
            fly_z - 0.05,
            fly_z + 0.055,
            beam * fly_beam * 0.50,
            beam * fly_beam * 0.43,
            teak,
            cid("flybridge"),
            flybridge,
        )
        box("flybridge helm console", (length * 0.10, beam * 0.18, fly_z + 0.30), (length * 0.12, beam * 0.16, 0.38), graphite, cid("flybridge"), flybridge, 0.05)
        box("flybridge port settee", (-length * 0.04, -beam * 0.22, fly_z + 0.30), (length * 0.20, beam * 0.16, 0.30), cushion, cid("flybridge"), flybridge, 0.06)
        box("flybridge starboard settee", (-length * 0.04, beam * 0.22, fly_z + 0.30), (length * 0.20, beam * 0.16, 0.30), cushion, cid("flybridge"), flybridge, 0.06)
        box("flybridge windscreen", (length * 0.19, 0.0, fly_z + 0.34), (0.035, beam * 0.54, 0.42), dark, cid("flybridge"), flybridge, 0.02, True)
        # Keep the upper glazing grouped under the single flybridge assembly;
        # the authored supports supply physical continuity below the deck.
        box("flybridge wetbar", (-length * 0.12, beam * 0.10, fly_z + 0.23), (length * 0.12, beam * 0.20, 0.30), wood, cid("flybridge"), flybridge, 0.045, True)
        box("flybridge barbecue worktop", (-length * 0.12, beam * 0.10, fly_z + 0.40), (length * 0.14, beam * 0.22, 0.06), steel, cid("flybridge"), flybridge, 0.018, True)
        box("flybridge port aft sunpad", (-length * 0.18, -beam * 0.19, fly_z + 0.25), (length * 0.16, beam * 0.15, 0.22), cushion, cid("flybridge"), flybridge, 0.05, True)
        box("flybridge starboard aft sunpad", (-length * 0.18, beam * 0.19, fly_z + 0.25), (length * 0.16, beam * 0.15, 0.22), cushion, cid("flybridge"), flybridge, 0.05, True)
        # The upper deck is structurally carried by visible bridge supports;
        # without them the flybridge reads as a floating stack of slabs in
        # the browser even though its deck dimensions are correct.
        bridge_base = locals().get("cabin_top", 1.45)
        support_height = max(0.28, fly_z - bridge_base - 0.04)
        support_z = bridge_base + 0.04 + support_height * 0.5
        for side in (-1, 1):
            box(f"flybridge forward support {side}", (length * 0.16, side * beam * 0.285, support_z), (0.18, 0.14, support_height), white, cid("flybridge"), flybridge, 0.035, True)
            box(f"flybridge aft support {side}", (-length * 0.12, side * beam * 0.285, support_z), (0.18, 0.14, support_height), white, cid("flybridge"), flybridge, 0.035, True)
            # Side cheeks visually tie the supports into the cabin shoulder;
            # these are grouped with the flybridge and remain independently
            # inspectable without adding another selectable assembly.
            box(f"flybridge side cheek {side}", (length * 0.02, side * beam * 0.30, bridge_base + support_height * 0.30), (length * 0.28, 0.10, 0.12), white, cid("flybridge"), flybridge, 0.025, True)
        box("flybridge stair housing", (-length * 0.14, 0.0, bridge_base + support_height * 0.34), (0.42, beam * 0.20, support_height * 0.62), white, cid("flybridge"), flybridge, 0.05, True)
        if not is_super_flybridge:
            # Current F/Manhattan/S flybridges are usually shaded by a slim
            # hardtop. Adding the canopy and its four narrow legs closes the
            # visual gap above the seating without turning the deck into an
            # enclosed box or adding another selectable assembly.
            fly_canopy_z = fly_z + 0.52
            canopy_shell(
                "flybridge hardtop canopy",
                length * 0.18,
                -length * 0.18,
                fly_canopy_z - 0.08,
                fly_canopy_z + 0.05,
                beam * 0.40,
                beam * 0.33,
                graphite if is_sunseeker else white,
                cid("flybridge"),
                flybridge,
            )
            canopy_support_height = fly_canopy_z - fly_z - 0.09
            canopy_support_z = fly_z + 0.09 + canopy_support_height * 0.50
            for side in (-1, 1):
                box(f"flybridge canopy forward leg {side}", (length * 0.15, side * beam * 0.285, canopy_support_z), (0.10, 0.08, canopy_support_height), steel, cid("flybridge"), flybridge, 0.018, True)
                box(f"flybridge canopy aft leg {side}", (-length * 0.14, side * beam * 0.285, canopy_support_z), (0.10, 0.08, canopy_support_height), steel, cid("flybridge"), flybridge, 0.018, True)
        # Radar and antenna hardware gives the larger flybridge families a
        # recognizable navigation profile and anchors the otherwise light
        # canopy silhouette. It remains decorative within the flybridge
        # assembly so interaction stays efficient.
        mast_height = 0.72 if target_length < 22 else 0.92
        mast_x = length * 0.14
        cylinder("flybridge radar mast", (mast_x, 0.0, fly_z + 0.42 + mast_height * 0.5), 0.035, mast_height, steel, cid("flybridge"), flybridge, decorative=True)
        box("flybridge radar bar", (mast_x, 0.0, fly_z + 0.42 + mast_height), (0.62 if target_length < 22 else 0.78, 0.045, 0.045), steel, cid("flybridge"), flybridge, 0.012, True)
        if target_length >= 18:
            sphere("flybridge radar dome port", (mast_x - 0.18, 0.0, fly_z + 0.42 + mast_height + 0.12), (0.16, 0.16, 0.09), graphite, cid("flybridge"), flybridge, True)
            sphere("flybridge radar dome starboard", (mast_x + 0.18, 0.0, fly_z + 0.42 + mast_height + 0.12), (0.16, 0.16, 0.09), graphite, cid("flybridge"), flybridge, True)
        if is_super_flybridge:
            upper = root_for("sky_lounge", "Enclosed sky lounge", "accommodation", "flybridge", purpose="Reference-informed enclosed super-flybridge lounge and raised pilothouse.", enclosure="shell", deck="deck_main", fidelity="reference-informed", explode=(0.0, 0.0, 1.25))
            box("sky lounge volume", (length * 0.05, 0.0, fly_z + 0.78), (length * 0.27, beam * 0.48, 0.72), white, cid("sky_lounge"), upper, 0.08)
            box("sky lounge forward glass", (length * 0.19, 0.0, fly_z + 0.78), (0.035, beam * 0.40, 0.42), dark, cid("glazing"), glazing, 0.02, True)
            for side in (-1, 1):
                box(f"sky lounge side glazing {side}", (length * 0.03, side * beam * 0.245, fly_z + 0.78), (length * 0.20, 0.028, 0.34), dark, cid("glazing"), glazing, 0.018, True)

    # Family signatures keep the authored masters visibly distinct while
    # staying inside the audited length/beam envelope. These are deliberately
    # grouped as one selectable assembly so the detail remains efficient in
    # the viewer and can still be hidden or exploded as a unit.
    if not is_open_dayboat:
        signature = root_for(
            "family_signature",
            "Family-specific exterior details",
            "structure",
            "deck_main",
            purpose="Reference-informed family signature details; small joinery and offsets are reconstructed where public references do not expose them.",
            enclosure="equipment",
            deck="deck_main",
            fidelity="reference-informed",
            explode=(0.0, 0.0, 0.28),
        )
        signature_id = cid("family_signature")
        if model_name == "v40":
            # V40 is a low, open sportscruiser: its identity comes from the
            # swept windshield, low side blades and broad aft sunpad rather
            # than the taller cabin treatment used by Princess flybridge
            # families.
            box("V40 swept windshield brow", (length * 0.20, 0.0, 1.70), (length * 0.24, beam * 0.72, 0.08), white, signature_id, signature, 0.035, True)
            for side in (-1, 1):
                box(f"V40 side blade {side}", (-length * 0.02, side * beam * 0.44, 0.88), (length * 0.28, 0.035, 0.16), graphite, signature_id, signature, 0.018, True)
            box("V40 aft sunpad", (-length * 0.32, 0.0, 1.16), (length * 0.30, beam * 0.56, 0.12), cushion, signature_id, signature, 0.045)
            box("V40 bathing step", (-length * 0.47, 0.0, 0.36), (length * 0.10, beam * 0.66, 0.18), teak, signature_id, signature, 0.025, True)
        elif model_name in {"f45", "f55", "f65"}:
            # The F family has a tall social flybridge with a readable brow,
            # side coamings and a substantial aft stair landing. Scale the
            # treatment by model so the three generations do not collapse into
            # one repeated upper box.
            scale = {"f45": 0.86, "f55": 1.0, "f65": 1.14}[model_name]
            box(f"{model_name} flybridge aft landing", (-length * 0.18, 0.0, fly_z + 0.16), (length * 0.24 * scale, beam * 0.60, 0.10), teak, signature_id, signature, 0.025, True)
            for side in (-1, 1):
                box(f"{model_name} flybridge coaming {side}", (-length * 0.12, side * beam * 0.31, fly_z + 0.26), (length * 0.28 * scale, beam * 0.07, 0.18), teak, signature_id, signature, 0.025, True)
        elif model_name == "y85":
            box("Y85 raised pilothouse brow", (length * 0.02, 0.0, fly_z + 0.55), (length * 0.38, beam * 0.84, 0.10), white, signature_id, signature, 0.04, True)
            for side in (-1, 1):
                box(f"Y85 wraparound side glass {side}", (length * 0.00, side * beam * 0.34, 1.76), (length * 0.40, 0.035, 0.30), dark, signature_id, signature, 0.02, True)
                box(f"Y85 pilothouse mullion {side}", (length * 0.12, side * beam * 0.36, 1.78), (0.025, 0.045, 0.32), steel, signature_id, signature, 0.008, True)
            box("Y85 aft stair coaming", (-length * 0.27, 0.0, 1.05), (length * 0.14, beam * 0.64, 0.16), teak, signature_id, signature, 0.03, True)
        elif model_name == "x95":
            # The X95 is the most volumetric Princess in this scope: retain a
            # visibly enclosed upper sky lounge and add a second brow rather
            # than treating it as a scaled F-class flybridge.
            box("X95 sky lounge lower sill", (length * 0.03, 0.0, fly_z + 0.50), (length * 0.34, beam * 0.52, 0.10), white, signature_id, signature, 0.03, True)
            box("X95 sky lounge upper brow", (length * 0.04, 0.0, fly_z + 1.20), (length * 0.34, beam * 0.60, 0.10), graphite, signature_id, signature, 0.035, True)
            for side in (-1, 1):
                box(f"X95 sky lounge side mullion {side}", (length * 0.02, side * beam * 0.27, fly_z + 0.82), (0.025, 0.045, 0.48), steel, signature_id, signature, 0.008, True)
        elif model_name in {"s65", "s72"}:
            scale = 0.92 if model_name == "s65" else 1.08
            box(f"{model_name} sportsbridge aft arch", (length * 0.00, 0.0, fly_z + 0.62), (length * 0.24 * scale, beam * 0.68, 0.09), graphite, signature_id, signature, 0.03, True)
            for side in (-1, 1):
                box(f"{model_name} sportsbridge blade {side}", (-length * 0.18, side * beam * 0.43, 1.02), (length * 0.22 * scale, 0.035, 0.14), graphite, signature_id, signature, 0.018, True)
            box(f"{model_name} aft sunpad", (-length * 0.32, 0.0, 1.16), (length * 0.24 * scale, beam * 0.54, 0.12), cushion, signature_id, signature, 0.045)
        elif is_predator:
            # Low, dark brow, side air intakes, and an aft sunpad are the
            # readable cues of the performance-oriented Predator profile.
            box("predator brow", (length * 0.19, 0.0, 1.84), (length * 0.25, beam * 0.76, 0.08), graphite, signature_id, signature, 0.035, True)
            for side in (-1, 1):
                box(f"predator side air intake {side}", (-length * 0.04, side * beam * 0.445, 0.77), (length * 0.18, 0.035, 0.22), graphite, signature_id, signature, 0.025, True)
            box("predator aft sunpad", (-length * 0.36, 0.0, 1.18), (length * 0.23, beam * 0.52, 0.12), cushion, signature_id, signature, 0.045)
            for side in (-1, 1):
                cylinder(f"predator transom exhaust {side}", (-length * 0.43, side * beam * 0.31, 0.40), 0.055, 0.16, steel, signature_id, signature, (0.0, math.pi / 2.0, 0.0), True)
            if "84" in model_name:
                box("predator 84 raised radar brow", (length * 0.14, 0.0, 2.16), (length * 0.30, beam * 0.78, 0.10), graphite, signature_id, signature, 0.04, True)
            elif "74" in model_name:
                box("predator 74 aft cockpit arch", (-length * 0.10, 0.0, 1.68), (length * 0.18, beam * 0.66, 0.08), graphite, signature_id, signature, 0.03, True)
            elif "57" in model_name:
                box("predator 57 low windscreen brow", (length * 0.20, 0.0, 1.76), (length * 0.18, beam * 0.72, 0.08), graphite, signature_id, signature, 0.03, True)
        elif is_portofino:
            # Portofino's open sports-cruiser language benefits from a long
            # side window, a low radar arch, and a clean aft garage line.
            for side in (-1, 1):
                box(f"portofino side window band {side}", (length * 0.02, side * beam * 0.445, 1.02), (length * 0.30, 0.03, 0.22), dark, signature_id, signature, 0.025, True)
                box(f"portofino radar arch support {side}", (-length * 0.02, side * beam * 0.30, 1.87), (0.08, 0.06, 0.45), graphite, signature_id, signature, 0.025, True)
            box("portofino radar arch", (-length * 0.02, 0.0, 2.08), (length * 0.18, beam * 0.62, 0.08), graphite, signature_id, signature, 0.03, True)
            box("portofino aft garage seam", (-length * 0.45, 0.0, 0.54), (0.035, beam * 0.58, 0.38), dark, signature_id, signature, 0.015, True)
        elif is_manhattan:
            # Manhattan flybridges are taller and more social than the
            # low-profile sports ranges; add a hardtop eyebrow, supports and
            # the aft stair/seat rhythm visible in profile.
            upper_z = fly_z if is_flybridge else 2.45
            box("manhattan flybridge eyebrow", (length * 0.02, 0.0, upper_z + 0.50), (length * 0.30, beam * 0.76, 0.10), graphite, signature_id, signature, 0.04, True)
            for side in (-1, 1):
                box(f"manhattan hardtop support {side}", (length * 0.12, side * beam * 0.30, upper_z + 0.38), (0.06, 0.06, 0.68), steel, signature_id, signature, 0.02, True)
                box(f"manhattan aft step {side}", (-length * 0.30, side * beam * 0.34, 1.08), (length * 0.08, beam * 0.09, 0.10), teak, signature_id, signature, 0.02, True)
            cylinder("manhattan radar mast", (length * 0.13, 0.0, upper_z + 1.02), 0.035, 0.70, steel, signature_id, signature, decorative=True)
            box("manhattan radar bar", (length * 0.13, 0.0, upper_z + 1.36), (0.34, 0.04, 0.04), steel, signature_id, signature, 0.01, True)
        elif is_ocean:
            # The Ocean profile is defined by broad, near-vertical glazing and
            # an aft beach-club/transom relationship rather than a sharp
            # sportscruiser brow.
            for side in (-1, 1):
                box(f"ocean vertical window bay {side}", (length * 0.03, side * beam * 0.445, 0.82), (length * 0.24, 0.03, 0.34), dark, signature_id, signature, 0.025, True)
                box(f"ocean side rub rail {side}", (-length * 0.14, side * beam * 0.47, 0.58), (length * 0.35, 0.035, 0.06), steel, signature_id, signature, 0.015, True)
            box("ocean beach club transom", (-length * 0.46, 0.0, 0.34), (length * 0.08, beam * 0.70, 0.24), teak, signature_id, signature, 0.035, True)
            box("ocean aft glazing", (-length * 0.39, 0.0, 0.90), (0.03, beam * 0.62, 0.44), dark, signature_id, signature, 0.02, True)
        elif is_x_class:
            # X-class is the super-flybridge branch: emphasize the enclosed
            # upper volume and its large side glass, without changing the
            # published footprint.
            for side in (-1, 1):
                box(f"x class upper window band {side}", (length * 0.02, side * beam * 0.26, fly_z + 0.80), (length * 0.22, 0.03, 0.36), dark, signature_id, signature, 0.02, True)
            box("x class upper brow", (length * 0.02, 0.0, fly_z + 1.18), (length * 0.24, beam * 0.54, 0.08), graphite, signature_id, signature, 0.035, True)
            cylinder("x class radar mast", (length * 0.15, 0.0, fly_z + 1.42), 0.035, 0.62, steel, signature_id, signature, decorative=True)
        elif "princess" in brand_name and range_name == "s class":
            # The S-class sportsbridge sits between a low sportscruiser and a
            # full flybridge. Give it the characteristic swept bridge screen,
            # compact aft arch and low-profile side blades.
            box("princess sportsbridge arch", (length * 0.02, 0.0, fly_z + 0.62), (length * 0.22, beam * 0.62, 0.09), graphite, signature_id, signature, 0.03, True)
            box("princess sportsbridge screen", (length * 0.18, 0.0, fly_z + 0.34), (0.035, beam * 0.46, 0.34), dark, signature_id, signature, 0.018, True)
            for side in (-1, 1):
                box(f"princess sportsbridge side blade {side}", (-length * 0.14, side * beam * 0.42, 1.00), (length * 0.20, 0.035, 0.14), graphite, signature_id, signature, 0.018, True)
        elif "princess" in brand_name and range_name == "f class":
            # F-class is intentionally upright and social. The common
            # flybridge supplies the actual deck and canopy; keep only a
            # compact side screen and aft landing here so the family reads as
            # one supported volume instead of stacked duplicate plates.
            box("princess f class aft landing", (-length * 0.16, 0.0, fly_z + 0.16), (length * 0.22, beam * 0.58, 0.10), teak, signature_id, signature, 0.025, True)
            for side in (-1, 1):
                box(f"princess f class side screen {side}", (length * 0.17, side * beam * 0.27, fly_z + 0.30), (0.035, 0.04, 0.34), dark, signature_id, signature, 0.014, True)
        elif "princess" in brand_name and range_name == "y class":
            # Y-class uses a raised, long-range profile with a more pronounced
            # brow and continuous dark side glazing.
            box("princess y class brow", (length * 0.04, 0.0, fly_z + 0.70), (length * 0.32, beam * 0.80, 0.11), white, signature_id, signature, 0.04, True)
            for side in (-1, 1):
                box(f"princess y class side glass extension {side}", (-length * 0.02, side * beam * 0.34, 1.74), (length * 0.34, 0.035, 0.28), dark, signature_id, signature, 0.02, True)
        elif is_flybridge:
            # The Princess F/Y/S and smaller Manhattan-style silhouettes get
            # a family-specific flybridge brow and upright screen so they do
            # not collapse into one rectangular generic cabin.
            box("flybridge signature brow", (length * 0.08, 0.0, fly_z + 0.47), (length * 0.22, beam * 0.72, 0.08), graphite if is_sunseeker else white, signature_id, signature, 0.035, True)
            box("flybridge signature screen", (length * 0.18, 0.0, fly_z + 0.33), (0.035, beam * 0.48, 0.36), dark, signature_id, signature, 0.02, True)
            for side in (-1, 1):
                box(f"flybridge signature console wing {side}", (length * 0.02, side * beam * 0.26, fly_z + 0.28), (length * 0.12, beam * 0.08, 0.12), teak, signature_id, signature, 0.02, True)
        else:
            box("sportscruiser signature side blade", (-length * 0.10, -beam * 0.45, 0.66), (length * 0.22, 0.035, 0.12), graphite, signature_id, signature, 0.02, True)
            box("sportscruiser signature aft seat", (-length * 0.30, 0.0, 1.25), (length * 0.15, beam * 0.48, 0.10), cushion, signature_id, signature, 0.035, True)

    rooms = MODEL.get("layout", {}).get("rooms", [])
    cabin_count = MODEL.get("layout", {}).get("cabins") or 0
    has_lower = cabin_count > 0 or any(any(word in str(room).lower() for word in ("lower", "cabin", "head", "bath", "saloon", "galley", "berth", "lobby", "living", "room")) for room in rooms)
    lower = None
    if has_lower:
        lower = root_for("deck_lower", "Lower accommodation deck", "structure", "hull_shell", interior=True, purpose="Lower accommodation deck and room boundaries.", enclosure="envelope", deck="deck_lower", explode=(0.0, 0.0, -0.7))
        box("lower deck floor", (0.0, 0.0, -0.58), (length * 0.72, beam * 0.70, 0.08), wood, cid("deck_lower"), lower, 0.025)
        room_names = [str(room) for room in rooms if any(word in str(room).lower() for word in ("cabin", "saloon", "galley", "head", "berth", "lobby", "living"))]
        room_names = room_names[:5] or ["lower accommodation"]
        usable_start = -length * 0.31
        usable_length = length * 0.62
        room_segment = usable_length / max(1, len(room_names))
        for index, room_name in enumerate(room_names):
            room_key = f"room_{safe_name(room_name)}_{index}"
            room_label = room_name[:42]
            room_root = root_for(room_key, room_label, "accommodation", "deck_lower", interior=True, purpose=f"Authored {room_label} arrangement from the audited deck description.", enclosure="equipment", deck="deck_lower", room=room_key, fidelity="reference-informed")
            x = usable_start + room_segment * (index + 0.5)
            y = -beam * 0.16 if index % 2 == 0 else beam * 0.16
            room_lower = room_name.lower()
            is_sleeping = any(word in room_lower for word in ("cabin", "berth", "master", "vip", "owner", "stateroom"))
            is_social = any(word in room_lower for word in ("saloon", "living", "lounge", "dining"))
            is_galley = any(word in room_lower for word in ("galley", "kitchen"))
            is_head = any(word in room_lower for word in ("head", "bath", "ensuite", "toilet"))
            if is_sleeping:
                room_length = max(2.60, length * 0.16)
            elif is_social:
                room_length = max(3.10, length * 0.20)
            elif is_galley:
                room_length = max(2.40, length * 0.13)
            elif is_head:
                room_length = max(1.70, length * 0.09)
            else:
                room_length = max(2.00, length * 0.12)
            # Keep each room inside a distinct longitudinal bay.  The prior
            # fixed x increment caused larger saloons and cabins to overlap,
            # which made the cutaway render read as floating blockout props.
            room_length = min(room_length, room_segment * 0.84)
            room_width = max(1.35, min(beam * 0.42, room_length * 0.80))
            # Resolve each room as a small contained volume. These authored
            # partitions are intentionally grouped with the room assembly so
            # cutaway and selection remain physically meaningful.
            box(f"{room_key} floor", (x, y, -0.54), (room_length, room_width, 0.06), wood, cid(room_key), room_root, 0.02, True)
            port_wall = box(f"{room_key} port wall", (x, y - room_width * 0.50, -0.20), (room_length, 0.06, 0.68), wood, cid(room_key), room_root, 0.025, True)
            port_wall["roomCutaway"] = True
            starboard_wall = box(f"{room_key} starboard wall", (x, y + room_width * 0.50, -0.20), (room_length, 0.06, 0.68), wood, cid(room_key), room_root, 0.025, True)
            starboard_wall["roomCutaway"] = True
            forward_bulkhead = box(f"{room_key} forward bulkhead", (x + room_length * 0.50, y, -0.20), (0.06, room_width, 0.68), wood, cid(room_key), room_root, 0.025, True)
            forward_bulkhead["roomCutaway"] = True
            aft_bulkhead = box(f"{room_key} aft bulkhead", (x - room_length * 0.50, y, -0.20), (0.06, room_width, 0.68), wood, cid(room_key), room_root, 0.025, True)
            aft_bulkhead["roomCutaway"] = True
            # Give every reconstructed room a readable architectural envelope:
            # headliner, joinery rails, and a wall accent prevent the cutaway
            # from reading as isolated furniture floating in space.
            box(f"{room_key} headliner", (x, y, 0.18), (room_length, room_width, 0.045), wood, cid(room_key), room_root, 0.018, True)
            for side in (-1, 1):
                box(f"{room_key} wall trim {side}", (x - room_length * 0.34, y + side * room_width * 0.49, -0.02), (0.035, 0.028, 0.54), teak, cid(room_key), room_root, 0.008, True)
            box(f"{room_key} wall feature panel", (x + room_length * 0.12, y + room_width * 0.49, -0.16), (room_length * 0.28, 0.025, 0.30), dark, cid(room_key), room_root, 0.012, True)
            light_data = bpy.data.lights.new(f"{VESSEL_ID} | {room_key} ceiling light", "AREA")
            light_data.energy = 240
            light_data.shape = "DISK"
            light_data.size = 1.2
            light_data.color = (1.0, 0.78, 0.58)
            light_obj = bpy.data.objects.new(f"{VESSEL_ID} | {room_key} ceiling light", light_data)
            SCENE.collection.objects.link(light_obj)
            light_obj.location = (x, y, 0.34)
            light_obj["interiorLight"] = True
            if is_sleeping:
                box(f"{room_key} berth", (x, y, -0.36), (max(0.9, room_length * 0.78), max(0.65, room_width * 0.70), 0.20), cushion, cid(room_key), room_root, 0.07)
                box(f"{room_key} berth runner", (x - room_length * 0.18, y, -0.245), (room_length * 0.22, max(0.35, room_width * 0.58), 0.035), teak, cid(room_key), room_root, 0.012, True)
                box(f"{room_key} headboard", (x + room_length * 0.32, y, -0.10), (0.12, max(0.55, room_width * 0.76), 0.62), wood, cid(room_key), room_root, 0.03, True)
                box(f"{room_key} bedside port", (x - room_length * 0.22, y - room_width * 0.43, -0.12), (0.24, 0.20, 0.28), wood, cid(room_key), room_root, 0.025, True)
                box(f"{room_key} bedside starboard", (x - room_length * 0.22, y + room_width * 0.43, -0.12), (0.24, 0.20, 0.28), wood, cid(room_key), room_root, 0.025, True)
            elif is_social:
                box(f"{room_key} area rug", (x, y, -0.03), (max(0.85, room_length * 0.82), room_width * 0.72, 0.025), teak, cid(room_key), room_root, 0.008, True)
                box(f"{room_key} port sofa", (x, y - room_width * 0.29, -0.23), (max(0.9, room_length * 0.76), room_width * 0.28, 0.38), cushion, cid(room_key), room_root, 0.07)
                box(f"{room_key} starboard sofa", (x, y + room_width * 0.29, -0.23), (max(0.9, room_length * 0.76), room_width * 0.28, 0.38), cushion, cid(room_key), room_root, 0.07)
                box(f"{room_key} coffee table", (x, y, -0.02), (max(0.55, room_length * 0.44), room_width * 0.34, 0.08), wood, cid(room_key), room_root, 0.025, True)
                cylinder(f"{room_key} table pedestal", (x, y, -0.12), 0.035, 0.24, steel, cid(room_key), room_root, decorative=True)
                box(f"{room_key} media console", (x + room_length * 0.38, y, -0.18), (0.12, room_width * 0.42, 0.38), wood, cid(room_key), room_root, 0.03, True)
                for chair_side in (-1, 1):
                    box(f"{room_key} lounge chair {chair_side}", (x - room_length * 0.28, y + chair_side * room_width * 0.16, -0.23), (0.28, 0.20, 0.36), cushion, cid(room_key), room_root, 0.05, True)
            elif is_galley:
                box(f"{room_key} counter", (x, y + room_width * 0.28, -0.18), (max(0.8, room_length * 0.68), 0.28, 0.55), white, cid(room_key), room_root, 0.05)
                box(f"{room_key} overhead cabinet", (x + room_length * 0.10, y + room_width * 0.28, 0.12), (max(0.60, room_length * 0.52), 0.22, 0.20), wood, cid(room_key), room_root, 0.025, True)
                box(f"{room_key} island", (x, y - room_width * 0.18, -0.15), (max(0.55, room_length * 0.48), 0.24, 0.42), wood, cid(room_key), room_root, 0.04, True)
                for burner in range(2):
                    cylinder(f"{room_key} burner {burner}", (x - 0.12 + burner * 0.24, y + room_width * 0.28, 0.12), 0.045, 0.02, steel, cid(room_key), room_root, decorative=True)
                box(f"{room_key} refrigerator", (x + room_length * 0.34, y + room_width * 0.28, -0.02), (0.18, 0.24, 0.60), graphite, cid(room_key), room_root, 0.025, True)
                cylinder(f"{room_key} sink", (x - 0.10, y + room_width * 0.28, 0.15), 0.10, 0.035, steel, cid(room_key), room_root, decorative=True)
            elif is_head:
                box(f"{room_key} vanity", (x, y + room_width * 0.28, -0.18), (max(0.45, room_length * 0.42), 0.22, 0.42), white, cid(room_key), room_root, 0.04)
                box(f"{room_key} vanity mirror", (x, y + room_width * 0.275, 0.22), (max(0.36, room_length * 0.34), 0.018, 0.24), dark, cid(room_key), room_root, 0.012, True)
                cylinder(f"{room_key} basin", (x, y + room_width * 0.28, 0.08), 0.12, 0.06, steel, cid(room_key), room_root, decorative=True)
                box(f"{room_key} shower screen", (x + room_length * 0.28, y - room_width * 0.28, 0.04), (0.025, room_width * 0.42, 0.50), dark, cid(room_key), room_root, 0.02, True)
                box(f"{room_key} toilet pedestal", (x - room_length * 0.28, y - room_width * 0.25, -0.24), (0.28, 0.30, 0.30), white, cid(room_key), room_root, 0.06, True)
                cylinder(f"{room_key} towel rail", (x + room_length * 0.20, y - room_width * 0.28, 0.14), 0.018, 0.30, steel, cid(room_key), room_root, (math.pi / 2.0, 0.0, 0.0), True)
            else:
                box(f"{room_key} storage bench", (x, y, -0.22), (max(0.7, room_length * 0.42), room_width * 0.20, 0.38), wood, cid(room_key), room_root, 0.05)
                box(f"{room_key} wardrobe", (x + room_length * 0.30, y + room_width * 0.32, -0.02), (0.22, 0.28, 0.66), wood, cid(room_key), room_root, 0.035, True)
            box(f"{room_key} ceiling cove port", (x, y - room_width * 0.44, 0.145), (room_length * 0.72, 0.028, 0.055), teak, cid(room_key), room_root, 0.008, True)
            box(f"{room_key} ceiling cove starboard", (x, y + room_width * 0.44, 0.145), (room_length * 0.72, 0.028, 0.055), teak, cid(room_key), room_root, 0.008, True)
            if not is_head:
                box(f"{room_key} starboard window recess", (x + room_length * 0.14, y + room_width * 0.485, -0.08), (room_length * 0.34, 0.022, 0.24), dark, cid(room_key), room_root, 0.008, True)
                box(f"{room_key} window lower trim", (x + room_length * 0.14, y + room_width * 0.50, -0.235), (room_length * 0.36, 0.026, 0.035), steel, cid(room_key), room_root, 0.006, True)
            for light_index in range(2):
                cylinder(f"{room_key} downlight {light_index}", (x - room_length * 0.20 + light_index * room_length * 0.34, y, 0.155), 0.035, 0.018, steel, cid(room_key), room_root, decorative=True)
            if is_sleeping:
                for lamp_side in (-1, 1):
                    cylinder(f"{room_key} bedside lamp {lamp_side}", (x - room_length * 0.22, y + lamp_side * room_width * 0.43, 0.10), 0.035, 0.16, steel, cid(room_key), room_root, decorative=True)
                    box(f"{room_key} bedside lamp shade {lamp_side}", (x - room_length * 0.22, y + lamp_side * room_width * 0.43, 0.20), (0.13, 0.13, 0.08), cushion, cid(room_key), room_root, 0.025, True)
                box(f"{room_key} footboard", (x - room_length * 0.46, y, -0.18), (0.10, room_width * 0.62, 0.30), wood, cid(room_key), room_root, 0.025, True)
            elif is_social:
                for sofa_side in (-1, 1):
                    box(f"{room_key} sofa back {sofa_side}", (x + room_length * 0.06, y + sofa_side * room_width * 0.255, -0.06), (max(0.9, room_length * 0.64), 0.10, 0.26), cushion, cid(room_key), room_root, 0.045, True)
                    box(f"{room_key} sofa arm {sofa_side}", (x - room_length * 0.32, y + sofa_side * room_width * 0.20, -0.14), (0.12, 0.20, 0.34), cushion, cid(room_key), room_root, 0.045, True)
                box(f"{room_key} media screen", (x + room_length * 0.45, y, 0.00), (0.025, room_width * 0.22, 0.26), dark, cid(room_key), room_root, 0.008, True)
            elif is_galley:
                for handle in range(3):
                    box(f"{room_key} cabinet handle {handle}", (x - room_length * 0.25 + handle * room_length * 0.18, y + room_width * 0.355, -0.18), (0.07, 0.018, 0.018), steel, cid(room_key), room_root, 0.004, True)
                box(f"{room_key} galley backsplash", (x, y + room_width * 0.21, 0.15), (max(0.8, room_length * 0.62), 0.025, 0.28), dark, cid(room_key), room_root, 0.008, True)
            elif is_head:
                box(f"{room_key} mirror light", (x, y + room_width * 0.17, 0.36), (max(0.34, room_length * 0.45), 0.025, 0.035), steel, cid(room_key), room_root, 0.006, True)
                box(f"{room_key} towel hook", (x + room_length * 0.28, y - room_width * 0.19, 0.10), (0.08, 0.035, 0.035), steel, cid(room_key), room_root, 0.006, True)
            # Repeated architectural details make each room feel fitted-out:
            # a framed entry, overhead downlights and a low joinery plinth.
            box(f"{room_key} entry casing", (x - room_length * 0.47, y, -0.02), (0.07, room_width * 0.56, 0.58), wood, cid(room_key), room_root, 0.018, True)
            box(f"{room_key} joinery plinth", (x + room_length * 0.18, y + room_width * 0.47, -0.43), (room_length * 0.34, 0.045, 0.08), teak, cid(room_key), room_root, 0.008, True)
            if is_sleeping:
                box(f"{room_key} port pillow", (x - room_length * 0.20, y - room_width * 0.16, -0.18), (0.30, 0.22, 0.08), cushion, cid(room_key), room_root, 0.035, True)
                box(f"{room_key} starboard pillow", (x - room_length * 0.20, y + room_width * 0.16, -0.18), (0.30, 0.22, 0.08), cushion, cid(room_key), room_root, 0.035, True)
                box(f"{room_key} wardrobe door", (x + room_length * 0.30, y + room_width * 0.47, -0.03), (room_length * 0.16, 0.035, 0.55), wood, cid(room_key), room_root, 0.012, True)
        lower_walls = root_for("lower_partitions", "Lower partitions", "structure", "deck_lower", interior=True, purpose="Low room-divider partitions; exact joinery is reconstructed.", enclosure="envelope", deck="deck_lower", fidelity="reconstructed")
        for index in range(max(1, min(4, len(room_names) - 1))):
            x = -length * 0.26 + index * length * 0.11
            box(f"lower partition {index}", (x, 0.0, -0.17), (0.06, beam * 0.64, 0.52), wood, cid("lower_partitions"), lower_walls, 0.025, True)
        engine = root_for("engine_room", "Engine room", "propulsion", "deck_lower", interior=True, purpose="Reference-informed machinery space with authored service details.", enclosure="equipment", deck="deck_lower", room="room_engine", fidelity="reconstructed")
        for side in (-1, 1):
            box(f"interior engine {side}", (-length * 0.30, side * beam * 0.20, -0.30), (length * 0.15, beam * 0.18, 0.55), engine_mat, cid("engine_room"), engine, 0.05)
            for nozzle in range(2):
                cylinder(f"engine turbo {side}-{nozzle}", (-length * 0.26 + nozzle * 0.24, side * beam * 0.20, 0.05), 0.055, 0.18, steel, cid("engine_room"), engine, decorative=True)

    # A few family signatures that are visible in exterior review views.
    if model_name == "r35":
        foil = root_for("active_foil", "Active foil system", "propulsion", "hull_shell", purpose="Reference-informed active-foil appendage system.", enclosure="equipment", fidelity="reference-informed", explode=(0.0, 0.0, -0.45))
        for side in (-1, 1):
            box(f"active foil strut {side}", (length * 0.10, side * beam * 0.36, -draft * 0.20), (0.10, 0.06, 0.48), steel, cid("active_foil"), foil, 0.02, True)
            box(f"active foil plane {side}", (length * 0.10, side * beam * 0.42, -draft * 0.42), (length * 0.22, beam * 0.12, 0.05), steel, cid("active_foil"), foil, 0.02, True)
        wing = root_for("r35_sportsbridge", "R35 sportsbridge", "structure", "deck_main", purpose="Reference-informed low sportsbridge and wind deflector treatment.", enclosure="shell", deck="deck_main", fidelity="reference-informed", explode=(0.0, 0.0, 0.32))
        box("R35 sportsbridge brow", (length * 0.02, 0.0, 1.56), (length * 0.22, beam * 0.62, 0.08), graphite, cid("r35_sportsbridge"), wing, 0.03, True)
        for side in (-1, 1):
            box(f"R35 aft wind deflector {side}", (-length * 0.10, side * beam * 0.29, 1.30), (length * 0.18, 0.03, 0.26), dark, cid("glazing"), glazing, 0.018, True)
    if model_name == "hawk 38":
        outboards = root_for("outboard_propulsion", "Twin outboard propulsion", "propulsion", "hull_shell", purpose="Reference-informed twin outboard propulsion arrangement.", enclosure="equipment", fidelity="reference-informed", explode=(0.0, 0.0, -0.65))
        for side in (-1, 1):
            box(f"outboard cowling {side}", (-length * 0.47, side * beam * 0.20, 0.24), (0.36, 0.34, 0.62), engine_mat, cid("outboard_propulsion"), outboards, 0.08)
            cylinder(f"outboard leg {side}", (-length * 0.47, side * beam * 0.20, -0.12), 0.05, 0.48, steel, cid("outboard_propulsion"), outboards, decorative=True)
    if is_opening_roof:
        garage = root_for("tender_garage", "Tender garage and transom", "accommodation", "hull_shell", purpose="Reference-informed tender garage, lowering platform and bathing transom.", enclosure="equipment", deck="deck_main", fidelity="reference-informed", explode=(0.0, 0.0, -0.35))
        box("tender garage door", (-length * 0.47, 0.0, 0.46), (0.05, beam * 0.56, 0.58), dark, cid("tender_garage"), garage, 0.02, True)

    # Keep the authored superstructure at its family-calibrated proportions.
    # Scaling each mesh independently by overall vessel length separates fixed
    # signature details from the cabin and flybridge, producing the floating
    # stack seen in earlier review renders. The audited length/beam envelope is
    # already carried by the hull; large-yacht visual differentiation belongs
    # in the family-specific authored geometry above.

    # Attach deck/room metadata to objects and ensure every semantic assembly
    # has at least one renderable object. Small system envelopes are intentional.
    for component in COMPONENTS.values():
        if component["objects"]:
            continue
        root = component["root"]
        box(f"{safe_name(component['name'])} service envelope", (0.0, 0.0, -0.25), (0.18, 0.18, 0.18), graphite, component["id"], root, 0.02, True)


def add_lights() -> None:
    length = float(MODEL["dimensions"].get("lengthM") or 12.0)
    def area(name: str, location: tuple[float, float, float], energy: float, size: float) -> None:
        data = bpy.data.lights.new(f"{VESSEL_ID} | {name}", "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        obj = bpy.data.objects.new(name, data)
        SCENE.collection.objects.link(obj)
        obj.location = location
        obj.rotation_euler = (math.radians(28), 0, math.radians(32))
    area("key", (5.0, -6.0, 8.0), 1800, 6.0)
    area("fill", (-5.0, 5.0, 6.0), 1500, 5.0)
    area("interior fill", (0.0, 0.0, 3.0), 900, 3.0)
    data = bpy.data.lights.new(f"{VESSEL_ID} | sun", "SUN")
    data.energy = 2.2
    sun = bpy.data.objects.new("sun", data)
    SCENE.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(28), math.radians(-25), math.radians(-22))
    below_data = bpy.data.lights.new(f"{VESSEL_ID} | below hull fill", "POINT")
    below_data.energy = 12000
    below_data.color = (0.34, 0.52, 0.78)
    below = bpy.data.objects.new(f"{VESSEL_ID} | below hull fill", below_data)
    SCENE.collection.objects.link(below)
    below.location = (0.0, 0.0, -2.2)
    below_area_data = bpy.data.lights.new(f"{VESSEL_ID} | below hull area", "AREA")
    below_area_data.energy = 6500
    below_area_data.shape = "DISK"
    below_area_data.size = 10.0
    below_area = bpy.data.objects.new(f"{VESSEL_ID} | below hull area", below_area_data)
    SCENE.collection.objects.link(below_area)
    below_area.location = (0.0, 0.0, -6.0)
    below_area.rotation_euler = (math.pi, 0.0, 0.0)
    side_data = bpy.data.lights.new(f"{VESSEL_ID} | starboard hull fill", "POINT")
    side_data.energy = 4200
    side_data.color = (0.42, 0.58, 0.82)
    side = bpy.data.objects.new(f"{VESSEL_ID} | starboard hull fill", side_data)
    SCENE.collection.objects.link(side)
    side.location = (0.0, length * 0.85, 1.6)
    port_data = bpy.data.lights.new(f"{VESSEL_ID} | port hull fill", "POINT")
    port_data.energy = 2600
    port_data.color = (0.30, 0.48, 0.72)
    port = bpy.data.objects.new(f"{VESSEL_ID} | port hull fill", port_data)
    SCENE.collection.objects.link(port)
    port.location = (0.0, -length * 0.85, 1.6)


def point_camera(camera: bpy.types.Object, target: tuple[float, float, float]) -> None:
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def add_camera(camera_id: str, name: str, position: tuple[float, float, float], target: tuple[float, float, float], deck: str | None = None, room: str | None = None, lens: float = 50.0) -> None:
    data = bpy.data.cameras.new(f"{VESSEL_ID} | {name} camera")
    data.lens = lens
    camera = bpy.data.objects.new(name, data)
    SCENE.collection.objects.link(camera)
    camera.location = position
    point_camera(camera, target)
    CAMERAS.append({"id": camera_id, "name": name, "position": position, "target": target, "deck": cid(deck) if deck else None, "room": cid(room) if room else None, "object": camera})


def add_cameras() -> None:
    length = float(MODEL["dimensions"].get("lengthM") or 12.0)
    beam = float(MODEL["dimensions"].get("beamM") or length * 0.28)
    # The old length-scaled camera heights were too high on the larger
    # flybridge boats: the review saw a stack of decks from above and hid the
    # freeboard behind the water plane. Keep the presentation eye-level while
    # preserving a useful high/above pair for inspection.
    eye_z = max(2.10, length * 0.18)
    profile_z = max(1.85, length * 0.14)
    # Leave a deliberate margin around every review view. Tight cameras made
    # complete hulls look truncated in the app, especially on the long X/Y,
    # Manhattan and Ocean generations.
    add_camera("exterior_bow", "Review | Bow quarter", (length * 1.08, -length * 0.92, eye_z), (0, 0, 0.62), "deck_main", lens=48)
    add_camera("exterior_port_profile", "Review | Port profile", (0, -length * 1.48, profile_z), (0, 0, 0.50), "deck_main", lens=48)
    add_camera("exterior_starboard_profile", "Review | Starboard profile", (0, length * 1.48, profile_z), (0, 0, 0.50), "deck_main", lens=48)
    add_camera("exterior_stern", "Review | Stern quarter", (-length * 1.08, length * 0.92, eye_z), (0, 0, 0.66), "cockpit", lens=48)
    add_camera("exterior_high", "Review | High bow", (length * 0.66, 0, length * 1.34), (0, 0, 0.25), "deck_main", lens=48)
    add_camera("exterior_above", "Review | Above plan", (length * 0.07, -length * 0.07, length * 2.08), (0, 0, 0.0), "deck_main", lens=50)
    # Keep the under-hull inspection camera close enough to read the keel and
    # running gear. A vessel-length offset made this state mostly black and
    # visually useless on the larger generations.
    add_camera("exterior_below", "Review | Below hull", (-length * 1.08, length * 0.84, -length * 0.62), (0, 0, -0.35), "deck_lower", lens=42)
    add_camera("exterior_three_quarter", "Review | Starboard three-quarter", (length * 1.16, length * 1.12, eye_z), (0, 0, 0.58), "deck_main", lens=48)
    rooms = [key for key, value in COMPONENTS.items() if value.get("roomId") and value["interior"]]
    usable_start = -length * 0.31
    room_segment = length * 0.62 / max(1, len(rooms))
    for index, component_id in enumerate(rooms):
        comp = COMPONENTS[component_id]
        room_key = (comp.get("roomId") or component_id).removeprefix(f"{VESSEL_ID}_")
        root = comp["root"]
        # Room cameras sit outside the furniture envelope and look diagonally
        # across the authored arrangement, preventing bed/floor clipping.
        x = usable_start + room_segment * (index + 0.5)
        y = -beam * 0.16 if index % 2 == 0 else beam * 0.16
        # Use a raised diagonal cutaway camera. The review renderer removes the
        # room headliner and shared lower-deck floor, so this view reads the
        # authored arrangement from above instead of looking into a ceiling or
        # clipping through a sofa at the room entrance.
        room_name = comp["name"].lower()
        if any(word in room_name for word in ("cabin", "berth", "master", "vip", "owner", "stateroom")):
            room_length = max(2.60, length * 0.16)
        elif any(word in room_name for word in ("saloon", "living", "lounge", "dining")):
            room_length = max(3.10, length * 0.20)
        elif any(word in room_name for word in ("galley", "kitchen")):
            room_length = max(2.40, length * 0.13)
        elif any(word in room_name for word in ("head", "bath", "ensuite", "toilet")):
            room_length = max(1.70, length * 0.09)
        else:
            room_length = max(2.00, length * 0.12)
        room_length = min(room_length, room_segment * 0.84)
        room_width = max(1.35, min(beam * 0.42, room_length * 0.80))
        room_z = 0.92
        add_camera(
            f"room_{index}",
            f"Room | {comp['name']}",
            (x - room_length * 1.28, y - room_width * 1.28, room_z),
            (x, y, -0.18),
            "deck_lower",
            room_key,
            lens=38,
        )


def scale_upper_superstructure(target_length: float, is_open_dayboat: bool) -> None:
    """Restore believable size relationships above the measured hull.

    The catalog dimensions are authoritative for the hull envelope. The old
    generator used nearly fixed cabin/flybridge heights, which made the large
    Princess and Sunseeker entries look like low platforms. Stretch only
    above-deck assemblies around the main-deck datum; underwater systems,
    hull/deck measurements, and reconstructed lower rooms remain unchanged.
    """
    if is_open_dayboat:
        return
    scale = max(1.0, min(2.25, target_length / 12.0))
    base = 0.78
    fixed = {
        "hull_shell", "deck_main", "cockpit", "swim_platform", "deck_lower",
        "propulsion", "electrical", "fuel", "freshwater", "engine_room",
        "lower_partitions",
    }
    for obj in SCENE.objects:
        if obj.type not in {"MESH", "CURVE"} or obj.get("interior"):
            continue
        component_id = str(obj.get("componentId") or "")
        key = component_id.removeprefix(f"{VESSEL_ID}_")
        if key in fixed:
            continue
        obj.scale.z *= scale
        obj.location.z = base + (obj.location.z - base) * scale


def set_render_visibility(interior: bool) -> None:
    for obj in SCENE.objects:
        if obj.type not in {"MESH", "CURVE"}:
            continue
        if obj.get("reviewEnvironment"):
            obj.hide_render = bool(interior)
            continue
        if interior and obj.get("roomCutaway"):
            obj.hide_render = True
            continue
        obj.hide_render = (not bool(obj.get("interior", False))) if interior else False


def render_reviews() -> list[str]:
    out_dir = RENDER_DIR / VESSEL_ID / "renders"
    out_dir.mkdir(parents=True, exist_ok=True)
    rendered: list[str] = []
    for camera in CAMERAS:
        interior = camera["id"].startswith("room_")
        set_render_visibility(interior)
        SCENE.camera = camera["object"]
        output = out_dir / f"{camera['id']}.png"
        SCENE.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        rendered.append(str(output.relative_to(ROOT)))
    set_render_visibility(False)
    return rendered


def create_review_water() -> None:
    mat = material("review water", (0.01, 0.04, 0.08, 1), roughness=0.18)
    box("review water", (0, 0, -0.12), (80, 60, 0.05), mat, cid("hull_shell"), COMPONENTS[cid("hull_shell")]["root"], 0.0, True)
    water = SCENE.objects.get(f"{VESSEL_ID} | review water")
    if water:
        water["reviewEnvironment"] = True
        water["componentId"] = None


def bounds_for(component: dict[str, Any]) -> tuple[list[float], list[float]]:
    objects = [obj for obj in component["objects"] if obj.type in {"MESH", "CURVE"}]
    if not objects:
        return [0.0, 0.0, 0.0], [0.01, 0.01, 0.01]
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    lo = Vector((min(point.x for point in points), min(point.z for point in points), min(point.y for point in points)))
    hi = Vector((max(point.x for point in points), max(point.z for point in points), max(point.y for point in points)))
    return list((lo + hi) * 0.5), [max(0.01, value) for value in hi - lo]


def build_manifest() -> dict[str, Any]:
    def shape_for(component: dict[str, Any]) -> str:
        key = str(component["id"]).removeprefix(f"{VESSEL_ID}_")
        if key == "hull_shell":
            return "hull"
        if key in {"deck_main", "deck_lower", "cockpit", "flybridge"}:
            return "deck"
        if key in {"superstructure", "glazing", "sky_lounge", "tender_garage"}:
            return "chamferedBox"
        if component["systemId"] == "propulsion":
            return "cylinder"
        return "box"

    components = []
    for component in sorted(COMPONENTS.values(), key=lambda item: item["id"]):
        position, size = bounds_for(component)
        entry = {
            "id": component["id"], "vesselId": VESSEL_ID, "name": component["name"], "systemId": component["systemId"],
            "assembly": component["assembly"], "parentId": component["parentId"], "shape": shape_for(component), "position": position,
            "size": size, "rotation": [0.0, 0.0, 0.0], "color": "#8b9298", "explode": component["explode"],
            "localExplode": component["explode"], "interior": component["interior"], "decorative": component["decorative"],
            "fidelity": component["fidelity"], "purpose": component["purpose"], "sourceIds": source_urls(), "enclosure": component["enclosure"],
        }
        if component.get("deckId"):
            entry["deckId"] = component["deckId"]
        if component.get("roomId"):
            entry["roomId"] = component["roomId"]
        components.append(entry)
    decks = [{"id": cid("deck_main"), "name": "Main deck", "componentId": cid("deck_main")}, {"id": cid("cockpit"), "name": "Aft cockpit", "componentId": cid("cockpit")}]
    if cid("deck_lower") in COMPONENTS:
        decks.append({"id": cid("deck_lower"), "name": "Lower accommodation deck", "componentId": cid("deck_lower")})
    rooms = []
    for component in COMPONENTS.values():
        if component.get("roomId"):
            rooms.append({"id": component["roomId"], "name": component["name"], "deckId": component.get("deckId") or cid("deck_main"), "componentId": component["id"], "fidelity": component["fidelity"], "note": component["purpose"], "sourceIds": source_urls()})
    cameras = []
    for camera in CAMERAS:
        entry = {"id": camera["id"], "name": camera["name"], "position": [camera["position"][0], camera["position"][2], -camera["position"][1]], "target": [camera["target"][0], camera["target"][2], -camera["target"][1]]}
        if camera.get("deck"):
            entry["deckId"] = camera["deck"]
        if camera.get("room"):
            entry["roomId"] = camera["room"]
        cameras.append(entry)
    return {"vesselId": VESSEL_ID, "version": 2, "units": "metres", "components": components, "meaningfulCount": sum(1 for component in components if not component["decorative"]), "lods": [], "assets": [], "decks": decks, "rooms": rooms, "cameras": cameras, "fidelity": f"Original reference-informed reconstruction of {MODEL['brand']} {MODEL['name']} ({MODEL['generation']}). Silhouette and published dimensions are anchored to the audited dossier; interior joinery, hull offsets and service equipment are reconstructed where the sources do not expose them."}


def save_master(manifest: dict[str, Any]) -> None:
    SCENE["vesselId"] = VESSEL_ID
    SCENE["hullscopeManifest"] = json.dumps(manifest, separators=(",", ":"), sort_keys=True)
    path = MASTER_DIR / f"{VESSEL_ID}.blend"
    path.parent.mkdir(parents=True, exist_ok=True)
    if MCP_SAFE:
        bpy.data.libraries.write(str(path), {SCENE}, compress=True)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True)


def write_metrics(rendered: list[str]) -> None:
    length = float(MODEL["dimensions"].get("lengthM") or 12.0)
    beam = float(MODEL["dimensions"].get("beamM") or length * 0.28)
    payload = {"vesselId": VESSEL_ID, "masterPath": str((MASTER_DIR / f"{VESSEL_ID}.blend").relative_to(ROOT)), "semanticComponentCount": len(COMPONENTS), "meaningfulCount": sum(1 for component in COMPONENTS.values() if not component["decorative"]), "targetDimensionsM": {"lengthM": length, "beamM": beam, "draftM": MODEL["dimensions"].get("draftM")}, "renderedViews": rendered, "selfReviewStatus": "not QA-approved", "uncertainties": MODEL.get("uncertainties", [])}
    out = METRICS_DIR / VESSEL_ID / "metrics.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("model_id")
    parser.add_argument("--no-render", action="store_true")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])


def main() -> None:
    args = parse_args()
    load_model(args.model_id)
    scene_setup()
    COMPONENTS.clear(); MATERIALS.clear(); CAMERAS.clear()
    create_geometry()
    # Calibrate the above-deck volume after the hull and signature geometry
    # exist. The audited length remains the hull authority; this pass restores
    # the proportion of wheelhouse, hardtop and flybridge on the larger
    # generations without changing the measured footprint.
    target_length = float(MODEL["dimensions"].get("lengthM") or 12.0)
    model_name = str(MODEL.get("name", "")).lower()
    scale_upper_superstructure(target_length, any(token in model_name for token in ("hawk 38", "r35")))
    add_lights()
    add_cameras()
    create_review_water()
    manifest = build_manifest()
    save_master(manifest)
    rendered = [] if args.no_render else render_reviews()
    set_render_visibility(False)
    save_master(manifest)
    write_metrics(rendered)
    print(json.dumps({"vesselId": VESSEL_ID, "semanticComponentCount": len(COMPONENTS), "meaningfulCount": manifest["meaningfulCount"], "renderedViews": rendered, "master": str((MASTER_DIR / f"{VESSEL_ID}.blend").relative_to(ROOT))}, indent=2))


if __name__ == "__main__":
    main()
