#!/usr/bin/env python3
"""Author an original, reference-informed Princess V55 Gen2 (2019) Blender master.

The script is intentionally self-contained.  It creates a polished educational
reconstruction in Blender metres, writes a v2 Hullscope manifest into the scene,
renders review views, and never overwrites the authoritative master unless
``--replace`` is supplied.

Coordinate convention:
  Blender: +X bow, +Y starboard, +Z up.
  glTF:    [Blender X, Blender Z, -Blender Y].
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path
from typing import Any, Iterable, Sequence

import bpy
from mathutils import Vector


VESSEL_ID = "princess-v55-gen2-2019"
ROOT = Path(__file__).resolve().parents[3]
MASTER_PATH = ROOT / ".tools" / "yachts" / "masters" / f"{VESSEL_ID}.blend"
REVIEW_DIR = ROOT / ".tools" / "yachts" / "review" / VESSEL_ID
MCP_SAFE = os.environ.get("HULLSCOPE_BLENDER_MCP") == "1"
RENDER_DIR = REVIEW_DIR / "renders"
METRICS_PATH = REVIEW_DIR / "metrics.json"

LOA = 17.81
BEAM = 4.65
DRAFT = 1.44
WATERLINE_Z = 0.0

SRC_OFFICIAL = "https://www.princessyachts.com/our-yachts/v-class/v55/"
SRC_LAUNCH = "https://www.princess.co.uk/news/the-new-princess-v55-the-heart-and-soul-of-the-v-class"
SRC_MAIN_DECK = "https://www.princessyachts.com/media/atud4pbe/v55-main-deck.png?v=1da1ddb46550030"
SRC_LOWER_DECK = "https://www.princessyachts.com/media/414ndr0h/v55-lower-deck.png?v=1da185958e2de70"
SRC_EXTERIOR = "https://www.princessyachts.com/media/gp1ohiew/v55-exterior-carosuel_0000s_0002_v55016-es0a1963-rt.jpg?v=1d9dbf2a04b5380"
SRC_REVIEW = "https://www.yachtbuyer.com/en-us/reviews/princess-v55-2019"
SRC_TIMELINE = "https://www.yachtbuyer.com/en-us/princess/for-sale/princess-v55"


def cid(token: str) -> str:
    return f"{VESSEL_ID}_{token}"


COMPONENTS: dict[str, dict[str, Any]] = {}
OBJECTS_BY_COMPONENT: dict[str, list[bpy.types.Object]] = {}
COLLECTIONS: dict[str, bpy.types.Collection] = {}
MATERIALS: dict[str, bpy.types.Material] = {}


def ensure_collection(name: str) -> bpy.types.Collection:
    if name in COLLECTIONS:
        return COLLECTIONS[name]
    collection = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if collection.name not in {c.name for c in bpy.context.scene.collection.children}:
        bpy.context.scene.collection.children.link(collection)
    COLLECTIONS[name] = collection
    return collection


def add_component(
    component_id: str,
    name: str,
    system: str,
    shape: str,
    parent: str | None = None,
    interior: bool = False,
    decorative: bool = False,
    fidelity: str = "reference-informed",
    purpose: str = "Original reference-informed reconstruction",
    source_ids: Sequence[str] = (SRC_OFFICIAL,),
    enclosure: str = "envelope",
    deck_id: str | None = None,
    room_id: str | None = None,
    explode: Sequence[float] = (0.0, 0.0, 0.0),
    local_explode: Sequence[float] = (0.0, 0.0, 0.0),
) -> dict[str, Any]:
    if component_id not in COMPONENTS:
        COMPONENTS[component_id] = {
            "id": component_id,
            "vesselId": VESSEL_ID,
            "name": name,
            "systemId": system,
            "assembly": name,
            "parentId": parent,
            "shape": shape,
            "interior": interior,
            "decorative": decorative,
            "fidelity": fidelity,
            "purpose": purpose,
            "sourceIds": list(source_ids),
            "enclosure": enclosure,
            "deckId": deck_id,
            "roomId": room_id,
            "explode": list(explode),
            "localExplode": list(local_explode),
            "objects": [],
        }
    return COMPONENTS[component_id]


def mark_object(
    obj: bpy.types.Object,
    component_id: str,
    *,
    name: str,
    system: str,
    shape: str,
    parent: str | None = None,
    interior: bool = False,
    decorative: bool = False,
    fidelity: str = "reference-informed",
    purpose: str = "Original reference-informed reconstruction",
    source_ids: Sequence[str] = (SRC_OFFICIAL,),
    enclosure: str = "envelope",
    deck_id: str | None = None,
    room_id: str | None = None,
    explode: Sequence[float] = (0.0, 0.0, 0.0),
    local_explode: Sequence[float] = (0.0, 0.0, 0.0),
    collection: str = "V55 | structure",
) -> bpy.types.Object:
    comp = add_component(
        component_id,
        name,
        system,
        shape,
        parent,
        interior,
        decorative,
        fidelity,
        purpose,
        source_ids,
        enclosure,
        deck_id,
        room_id,
        explode,
        local_explode,
    )
    obj["componentId"] = component_id
    obj["vesselId"] = VESSEL_ID
    obj["systemId"] = system
    obj["assembly"] = name
    obj["parentId"] = parent or ""
    obj["fidelity"] = fidelity
    obj["interior"] = interior
    obj["decorative"] = decorative
    obj["enclosure"] = enclosure
    obj["deckId"] = deck_id or ""
    obj["roomId"] = room_id or ""
    obj["sourceIds"] = json.dumps(list(source_ids))
    obj["explodeVectorGltf"] = list(explode)
    obj["localExplodeGltf"] = list(local_explode)
    if obj.type in {"MESH", "CURVE"}:
        existing = set(obj.users_collection)
        target = ensure_collection(collection)
        for old in existing:
            old.objects.unlink(obj)
        if obj.name not in target.objects:
            target.objects.link(obj)
    comp["objects"].append(obj)
    OBJECTS_BY_COMPONENT.setdefault(component_id, []).append(obj)
    return obj


def set_input(node: bpy.types.Node, name: str, value: Any) -> None:
    socket = node.inputs.get(name)
    if socket is not None:
        socket.default_value = value


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    metallic: float = 0.0,
    roughness: float = 0.5,
    coat: float = 0.0,
    transmission: float = 0.0,
    procedural: str | None = None,
) -> bpy.types.Material:
    if name in MATERIALS:
        return MATERIALS[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (360, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    set_input(bsdf, "Base Color", color)
    set_input(bsdf, "Metallic", metallic)
    set_input(bsdf, "Roughness", roughness)
    set_input(bsdf, "Coat Weight", coat)
    set_input(bsdf, "Coat Roughness", 0.17)
    set_input(bsdf, "Transmission Weight", transmission)
    # Keep a small, original packed albedo in every authored material. It is
    # deliberately generated here rather than copied from reference imagery,
    # so exported GLBs remain self-contained and legally redistributable.
    texture_size = 128
    image = bpy.data.images.new(f"{VESSEL_ID} | {name} | authored albedo", width=texture_size, height=texture_size, alpha=True)
    rgba: list[float] = []
    lower = name.lower()
    for y in range(texture_size):
        for x in range(texture_size):
            variation = 0.96 + 0.04 * ((x * 17 + y * 11) % 19) / 18.0
            if "teak" in lower or "wood" in lower:
                variation = 0.74 + 0.26 * (0.5 + 0.5 * math.sin(y * 0.34 + math.sin(x * 0.045) * 2.8))
                if y % 17 in (0, 1):
                    variation *= 0.72
            elif "glass" in lower or "glazing" in lower:
                variation = 0.82 + 0.14 * ((x / (texture_size - 1)) * 0.35 + (1.0 - y / (texture_size - 1)) * 0.65)
            elif "cloth" in lower or "upholstery" in lower:
                variation = 0.90 + 0.08 * (((x % 7) / 6.0 + (y % 9) / 8.0) * 0.5)
            rgba.extend([min(1.0, color[0] * variation), min(1.0, color[1] * variation), min(1.0, color[2] * variation), color[3]])
    image.pixels = rgba
    image.pack()
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.name = f"{name} authored albedo"
    image_node.image = image
    texcoord = nodes.new("ShaderNodeTexCoord")
    links.new(texcoord.outputs["UV"], image_node.inputs["Vector"])
    links.new(bsdf.outputs[0], output.inputs[0])
    mat["baseColorFactor"] = list(color)
    mat["metallicFactor"] = metallic
    mat["roughnessFactor"] = roughness
    mat["proceduralMaterial"] = True
    if procedural == "teak":
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 7.5
        noise.inputs["Detail"].default_value = 3.0
        noise.inputs["Roughness"].default_value = 0.72
        ramp = nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (0.11, 0.035, 0.012, 1)
        ramp.color_ramp.elements[1].color = (0.52, 0.20, 0.055, 1)
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.16
        bump.inputs["Distance"].default_value = 0.045
        links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
        links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        mat["proceduralNote"] = "Original procedural teak grain; no external texture."
    elif procedural == "paint":
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 18.0
        noise.inputs["Detail"].default_value = 2.0
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.035
        bump.inputs["Distance"].default_value = 0.018
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
    MATERIALS[name] = mat
    return mat


def material_set(name: str) -> bpy.types.Material:
    palette = {
        "hull_white": ((0.88, 0.92, 0.95, 1), 0.0, 0.23, 0.55, 0.0, "paint"),
        "underwater_navy": ((0.015, 0.035, 0.062, 1), 0.05, 0.38, 0.14, 0.0, "paint"),
        "glazing": ((0.006, 0.018, 0.027, 1), 0.38, 0.13, 0.32, 0.12, None),
        "charcoal": ((0.035, 0.046, 0.058, 1), 0.62, 0.22, 0.48, 0.0, "paint"),
        "silver": ((0.42, 0.46, 0.49, 1), 0.82, 0.23, 0.42, 0.0, None),
        "stainless": ((0.53, 0.59, 0.62, 1), 0.9, 0.19, 0.35, 0.0, None),
        "teak": ((0.27, 0.10, 0.028, 1), 0.0, 0.4, 0.08, 0.0, "teak"),
        "cushion_cream": ((0.73, 0.70, 0.63, 1), 0.0, 0.7, 0.08, 0.0, None),
        "cushion_graphite": ((0.12, 0.14, 0.16, 1), 0.0, 0.63, 0.05, 0.0, None),
        "wood": ((0.19, 0.07, 0.028, 1), 0.0, 0.45, 0.08, 0.0, "teak"),
        "floor": ((0.085, 0.06, 0.045, 1), 0.0, 0.54, 0.05, 0.0, "teak"),
        "wall": ((0.43, 0.43, 0.39, 1), 0.0, 0.6, 0.06, 0.0, None),
        "appliance": ((0.08, 0.10, 0.11, 1), 0.55, 0.26, 0.3, 0.0, None),
        "engine_blue": ((0.025, 0.11, 0.24, 1), 0.46, 0.28, 0.23, 0.0, "paint"),
        "engine_red": ((0.38, 0.04, 0.025, 1), 0.35, 0.34, 0.22, 0.0, "paint"),
        "rubber": ((0.012, 0.014, 0.016, 1), 0.0, 0.82, 0.0, 0.0, None),
        "water": ((0.008, 0.035, 0.06, 1), 0.22, 0.16, 0.5, 0.16, None),
        "warm_light": ((0.84, 0.31, 0.06, 1), 0.0, 0.32, 0.0, 0.0, None),
        "white_light": ((0.8, 0.88, 0.96, 1), 0.0, 0.35, 0.0, 0.0, None),
    }
    color, metallic, rough, coat, trans, procedural = palette[name]
    return make_material(name, color, metallic=metallic, roughness=rough, coat=coat, transmission=trans, procedural=procedural)


def link_object(obj: bpy.types.Object, collection_name: str) -> None:
    target = ensure_collection(collection_name)
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    target.objects.link(obj)


def mesh_object(
    name: str,
    verts: Sequence[Sequence[float]],
    faces: Sequence[Sequence[int]],
    material: bpy.types.Material | Sequence[bpy.types.Material],
    component_id: str,
    *,
    bevel: float = 0.0,
    system: str = "structure",
    component_name: str = "Original assembly",
    shape: str = "box",
    parent: str | None = None,
    interior: bool = False,
    decorative: bool = False,
    fidelity: str = "reference-informed",
    purpose: str = "Original reference-informed reconstruction",
    source_ids: Sequence[str] = (SRC_OFFICIAL,),
    enclosure: str = "envelope",
    deck_id: str | None = None,
    room_id: str | None = None,
    explode: Sequence[float] = (0.0, 0.0, 0.0),
    local_explode: Sequence[float] = (0.0, 0.0, 0.0),
    collection: str = "V55 | structure",
    smooth: bool = False,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(list(verts), [], [tuple(f) for f in faces])
    mesh.update(calc_edges=True)
    uv = mesh.uv_layers.new(name="UVMap")
    xs = [float(vertex.co.x) for vertex in mesh.vertices] or [0.0]
    ys = [float(vertex.co.y) for vertex in mesh.vertices] or [0.0]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    span_x = max(max_x - min_x, 1e-6)
    span_y = max(max_y - min_y, 1e-6)
    for loop in mesh.loops:
        vertex = mesh.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = ((vertex.x - min_x) / span_x, (vertex.y - min_y) / span_y)
    obj = bpy.data.objects.new(name, mesh)
    ensure_collection(collection).objects.link(obj)
    mats = list(material) if isinstance(material, (list, tuple)) else [material]
    for mat in mats:
        mesh.materials.append(mat)
    if smooth:
        for poly in mesh.polygons:
            poly.use_smooth = True
    if bevel:
        modifier = obj.modifiers.new("soft authored edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.limit_method = "ANGLE"
    mark_object(
        obj,
        component_id,
        name=component_name,
        system=system,
        shape=shape,
        parent=parent,
        interior=interior,
        decorative=decorative,
        fidelity=fidelity,
        purpose=purpose,
        source_ids=source_ids,
        enclosure=enclosure,
        deck_id=deck_id,
        room_id=room_id,
        explode=explode,
        local_explode=local_explode,
        collection=collection,
    )
    return obj


def box_mesh(center: Sequence[float], size: Sequence[float]) -> tuple[list[tuple[float, float, float]], list[tuple[int, ...]]]:
    cx, cy, cz = center
    sx, sy, sz = (v / 2.0 for v in size)
    verts = [
        (cx - sx, cy - sy, cz - sz),
        (cx + sx, cy - sy, cz - sz),
        (cx + sx, cy + sy, cz - sz),
        (cx - sx, cy + sy, cz - sz),
        (cx - sx, cy - sy, cz + sz),
        (cx + sx, cy - sy, cz + sz),
        (cx + sx, cy + sy, cz + sz),
        (cx - sx, cy + sy, cz + sz),
    ]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return verts, faces


def box_object(name: str, center: Sequence[float], size: Sequence[float], material: bpy.types.Material, component_id: str, **kwargs: Any) -> bpy.types.Object:
    verts, faces = box_mesh(center, size)
    return mesh_object(name, verts, faces, material, component_id, bevel=min(min(size) * 0.14, kwargs.pop("bevel", 0.08)), **kwargs)


def prism_object(name: str, footprint: Sequence[Sequence[float]], z0: float, z1: float, material: bpy.types.Material, component_id: str, **kwargs: Any) -> bpy.types.Object:
    verts = [(float(x), float(y), z0) for x, y in footprint] + [(float(x), float(y), z1) for x, y in footprint]
    n = len(footprint)
    faces: list[tuple[int, ...]] = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    return mesh_object(name, verts, faces, material, component_id, **kwargs)


def cylinder_object(
    name: str,
    a: Sequence[float],
    b: Sequence[float],
    radius: float,
    material: bpy.types.Material,
    component_id: str,
    *,
    sides: int = 12,
    **kwargs: Any,
) -> bpy.types.Object:
    a_v = Vector(a)
    b_v = Vector(b)
    axis = b_v - a_v
    if axis.length < 1e-5:
        axis = Vector((0, 0, 1))
    axis.normalize()
    basis = axis.cross(Vector((0, 0, 1)))
    if basis.length < 1e-4:
        basis = axis.cross(Vector((0, 1, 0)))
    basis.normalize()
    side = axis.cross(basis).normalized()
    verts: list[tuple[float, float, float]] = []
    for center in (a_v, b_v):
        for i in range(sides):
            theta = math.tau * i / sides
            p = center + radius * (math.cos(theta) * basis + math.sin(theta) * side)
            verts.append(tuple(p))
    faces: list[tuple[int, ...]] = [tuple(reversed(range(sides))), tuple(range(sides, sides * 2))]
    for i in range(sides):
        j = (i + 1) % sides
        faces.append((i, j, sides + j, sides + i))
    return mesh_object(name, verts, faces, material, component_id, smooth=True, **kwargs)


def torus_object(name: str, location: Sequence[float], major: float, minor: float, material: bpy.types.Material, component_id: str, **kwargs: Any) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=24, minor_segments=8, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    kwargs["name"] = kwargs.pop("component_name", "Original torus assembly")
    mark_object(obj, component_id, collection=kwargs.pop("collection", "V55 | fittings"), **kwargs)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def sphere_object(name: str, location: Sequence[float], radius: float, material: bpy.types.Material, component_id: str, **kwargs: Any) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    mark_object(obj, component_id, collection=kwargs.pop("collection", "V55 | fittings"), **kwargs)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def plate_quad(name: str, points: Sequence[Sequence[float]], material: bpy.types.Material, component_id: str, **kwargs: Any) -> bpy.types.Object:
    return mesh_object(name, points, [(0, 1, 2, 3)], material, component_id, **kwargs)


def add_planks(
    prefix: str,
    x0: float,
    x1: float,
    y0: float,
    y1: float,
    z: float,
    component_id: str,
    deck_id: str,
    parent: str,
) -> None:
    width = 0.105
    y = y0
    plank_index = 0
    while y < y1 - 0.02:
        box_object(
            f"{prefix}_plank_{plank_index:02d}",
            ((x0 + x1) * 0.5, y + width * 0.5, z),
            (x1 - x0, min(width * 0.82, y1 - y), 0.035),
            material_set("teak"),
            component_id,
            bevel=0.01,
            system="structure",
            component_name="Teak deck assembly",
            shape="deck",
            parent=parent,
            purpose="Visible teak deck planking reconstructed from the official layout and exterior reference.",
            source_ids=(SRC_EXTERIOR, SRC_MAIN_DECK),
            enclosure="envelope",
            deck_id=deck_id,
            collection="V55 | deck surfaces",
            decorative=True,
        )
        y += width
        plank_index += 1


def hull_beam(x: float) -> float:
    # Closed transom aft, full-bodied midships, tapered bow.  The pulpit extends
    # beyond the stem, so this surface remains a continuous hull rather than a
    # pair of overlapping scaled shells.
    t = max(0.0, min(1.0, (x + 8.72) / 17.34))
    mid = math.sin(math.pi * min(1.0, max(0.0, t * 0.98))) ** 0.34
    stern = 1.22 * (1.0 - t) ** 0.35
    beam = max(0.12, 2.32 * mid * (0.96 + 0.04 * math.cos((t - 0.42) * math.pi)) + stern * 0.10)
    return min(2.30, beam)


def hull_deck_z(x: float) -> float:
    t = max(0.0, min(1.0, (x + 8.72) / 17.34))
    return 1.06 + 0.44 * (t**1.7) + 0.05 * math.sin(t * math.pi)


def create_hull() -> None:
    stations = [-8.72, -8.38, -7.6, -6.2, -4.0, -1.0, 2.0, 4.6, 6.3, 7.55, 8.32, 8.62]
    ring_count = 9
    verts: list[tuple[float, float, float]] = []
    for x in stations:
        b = hull_beam(x)
        deck = hull_deck_z(x)
        ring = [
            (x, b, deck),
            (x, b * 0.985, 0.27 + 0.05 * (x + 8.7) / 17.3),
            (x, b * 0.83, -0.31),
            (x, b * 0.52, -0.93),
            (x, 0.0, -1.34 - 0.04 * (1.0 - min(1.0, abs(x + 1.0) / 10.0))),
            (x, -b * 0.52, -0.93),
            (x, -b * 0.83, -0.31),
            (x, -b * 0.985, 0.27 + 0.05 * (x + 8.7) / 17.3),
            (x, -b, deck),
        ]
        verts.extend(ring)
    faces: list[tuple[int, ...]] = []
    for i in range(len(stations) - 1):
        for j in range(ring_count):
            nj = (j + 1) % ring_count
            faces.append((i * ring_count + j, (i + 1) * ring_count + j, (i + 1) * ring_count + nj, i * ring_count + nj))
    faces.append(tuple(reversed(range(ring_count))))
    end = (len(stations) - 1) * ring_count
    faces.append(tuple(end + j for j in range(ring_count)))
    hull_id = cid("hull_shell")
    obj = mesh_object(
        "V55_Hull_ContinuousStationSurface",
        verts,
        faces,
        [material_set("hull_white"), material_set("underwater_navy")],
        hull_id,
        system="structure",
        component_name="Continuous white topsides and underwater hull",
        shape="hull",
        purpose="Single continuous closed station surface for the V55 hull; painted underwater region is face-assigned, not a second hull shell.",
        source_ids=(SRC_OFFICIAL, SRC_EXTERIOR),
        enclosure="shell",
        explode=(0.0, -0.9, 0.0),
        local_explode=(0.0, -0.25, 0.0),
        collection="V55 | hull shell",
    )
    for poly in obj.data.polygons:
        z_avg = sum(obj.data.vertices[i].co.z for i in poly.vertices) / max(1, len(poly.vertices))
        poly.material_index = 1 if z_avg < -0.12 else 0


def create_glazing() -> None:
    window_id = cid("hull_glazing")
    xs = [-7.75, -6.65, -5.1, -3.0, -0.7, 1.8, 3.9, 5.55, 6.95, 7.65]
    lower = [0.48, 0.37, 0.31, 0.30, 0.30, 0.32, 0.37, 0.48, 0.67, 0.88]
    upper = [1.15, 1.19, 1.23, 1.27, 1.30, 1.34, 1.42, 1.52, 1.66, 1.78]
    verts: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    for sign in (-1.0, 1.0):
        start = len(verts)
        for x, lo, hi in zip(xs, lower, upper):
            y = sign * (hull_beam(x) + 0.018)
            verts.extend([(x, y, lo), (x, y, hi)])
        for i in range(len(xs) - 1):
            j = start + i * 2
            faces.append((j, j + 2, j + 3, j + 1) if sign > 0 else (j + 1, j + 3, j + 2, j))
    mesh_object(
        "V55_Hull_SculptedBlackGlazing",
        verts,
        faces,
        material_set("glazing"),
        window_id,
        system="structure",
        component_name="Sculpted black hull glazing band",
        shape="hull",
        parent=cid("hull_shell"),
        purpose="Almost bow-to-aft dark hull glazing inset visually within white topsides.",
        source_ids=(SRC_EXTERIOR, SRC_OFFICIAL),
        enclosure="shell",
        collection="V55 | glazing",
    )

    side_id = cid("saloon_side_glazing")
    for sign, label in ((-1.0, "port"), (1.0, "starboard")):
        y = sign * 1.68
        plate_quad(
            f"V55_{label}_Saloon_Side_Glazing",
            [(-0.7, y, 2.06), (4.45, y, 2.16), (4.35, y, 3.16), (-0.4, y, 3.12)],
            material_set("glazing"),
            side_id,
            system="structure",
            component_name="Continuous dark saloon side glazing",
            shape="box",
            parent=cid("hardtop_shell"),
            purpose="Raked side glazing under the low charcoal hardtop.",
            source_ids=(SRC_EXTERIOR, SRC_OFFICIAL),
            enclosure="shell",
            deck_id=cid("deck_main"),
            collection="V55 | glazing",
        )
    plate_quad(
        "V55_Raked_Forward_Windshield",
        [(4.42, -1.68, 2.1), (4.42, 1.68, 2.1), (4.88, 1.48, 3.25), (4.88, -1.48, 3.25)],
        material_set("glazing"),
        cid("forward_windshield"),
        system="navigation",
        component_name="Raked forward windshield",
        shape="box",
        parent=cid("hardtop_shell"),
        purpose="Raked forward windscreen reconstructed from the supplied exterior reference.",
        source_ids=(SRC_EXTERIOR, SRC_OFFICIAL),
        enclosure="shell",
        deck_id=cid("deck_main"),
        collection="V55 | glazing",
    )


def create_decks_and_hardtop() -> None:
    main_id = cid("deck_main")
    lower_id = cid("deck_lower")
    cockpit_id = cid("deck_cockpit")
    main_footprint = [
        (-8.62, -1.22), (-6.7, -1.88), (-1.0, -2.02), (4.8, -1.76), (7.15, -1.12),
        (8.3, -0.23), (8.3, 0.23), (7.15, 1.12), (4.8, 1.76), (-1.0, 2.02), (-6.7, 1.88), (-8.62, 1.22),
    ]
    prism_object(
        "V55_Main_Deck_Envelope",
        main_footprint,
        1.08,
        1.18,
        material_set("hull_white"),
        main_id,
        system="structure",
        component_name="Main deck envelope",
        shape="deck",
        parent=cid("hull_shell"),
        purpose="Reference-informed main deck slab following the V55 sheer.",
        source_ids=(SRC_MAIN_DECK, SRC_OFFICIAL),
        enclosure="envelope",
        deck_id=main_id,
        collection="V55 | deck surfaces",
    )
    prism_object(
        "V55_Lower_Deck_Floor",
        [(-6.85, -1.55), (6.65, -1.32), (7.2, 1.32), (-6.85, 1.55)],
        -0.92,
        -0.84,
        material_set("floor"),
        lower_id,
        system="structure",
        component_name="Lower accommodation deck",
        shape="deck",
        parent=cid("hull_shell"),
        interior=True,
        purpose="Lower-deck floor and room datum derived from the supplied lower-deck plan.",
        source_ids=(SRC_LOWER_DECK, SRC_REVIEW),
        enclosure="envelope",
        deck_id=lower_id,
        collection="V55 | interiors",
    )
    prism_object(
        "V55_Cockpit_Teak_Deck",
        [(-8.55, -1.54), (-2.15, -1.72), (-1.2, 1.72), (-8.55, 1.54)],
        1.19,
        1.255,
        material_set("teak"),
        cockpit_id,
        system="structure",
        component_name="Open aft cockpit teak deck",
        shape="deck",
        parent=main_id,
        purpose="Open social cockpit and aft access deck.",
        source_ids=(SRC_EXTERIOR, SRC_MAIN_DECK),
        enclosure="envelope",
        deck_id=cockpit_id,
        collection="V55 | deck surfaces",
    )
    add_planks("V55_Cockpit", -8.45, -2.1, -1.49, 1.49, 1.285, cockpit_id, cockpit_id, cockpit_id)

    platform_id = cid("swim_platform")
    prism_object(
        "V55_Expansive_Teak_Swim_Platform",
        [(-9.0, -1.7), (-8.22, -1.86), (-7.3, -1.86), (-7.3, 1.86), (-8.22, 1.86), (-9.0, 1.7)],
        0.54,
        0.66,
        material_set("teak"),
        platform_id,
        system="mooring",
        component_name="Expansive teak swim platform",
        shape="deck",
        parent=cid("hull_shell"),
        purpose="Large stern swim platform with integrated twin side stair landings.",
        source_ids=(SRC_EXTERIOR, SRC_OFFICIAL),
        enclosure="envelope",
        deck_id=cockpit_id,
        explode=(-0.95, 0.0, -0.6),
        collection="V55 | deck surfaces",
    )
    add_planks("V55_SwimPlatform", -8.92, -7.34, -1.70, 1.70, 0.69, platform_id, cockpit_id, platform_id)

    hardtop_id = cid("hardtop_shell")
    xs = [-0.85, 0.15, 1.25, 2.5, 3.7, 4.75]
    cross_y = [-1.75, -0.9, 0.0, 0.9, 1.75]
    verts: list[tuple[float, float, float]] = []
    for x in xs:
        for y in cross_y:
            arch = 0.14 * (1.0 - (y / 1.75) ** 2) + 0.025 * math.sin((x + 0.85) / 5.6 * math.pi)
            verts.append((x, y, 3.34 + arch))
        for y in cross_y:
            verts.append((x, y, 3.17))
    faces: list[tuple[int, ...]] = []
    width = len(cross_y)
    stride = width * 2
    for i in range(len(xs) - 1):
        a = i * stride
        b = (i + 1) * stride
        for j in range(width - 1):
            faces.append((a + j, b + j, b + j + 1, a + j + 1))
            faces.append((a + width + j + 1, b + width + j + 1, b + width + j, a + width + j))
        faces.append((a, a + width, b + width, b))
        faces.append((a + width - 1, b + width - 1, b + stride - 1, a + stride - 1))
    mesh_object(
        "V55_Low_Continuous_Curved_Hardtop",
        verts,
        faces,
        material_set("charcoal"),
        hardtop_id,
        system="structure",
        component_name="Low charcoal continuous curved hardtop",
        shape="deck",
        parent=cid("deck_main"),
        purpose="Low silver-charcoal curved hardtop and opening-roof shell.",
        source_ids=(SRC_EXTERIOR, SRC_OFFICIAL),
        enclosure="shell",
        deck_id=cid("deck_main"),
        collection="V55 | superstructure",
    )
    pillar_id = cid("hardtop_supports")
    for i, (a, b) in enumerate([
        ((-0.72, -1.66, 1.28), (-0.38, -1.66, 3.20)),
        ((-0.72, 1.66, 1.28), (-0.38, 1.66, 3.20)),
        ((4.55, -1.62, 1.30), (4.64, -1.54, 3.22)),
        ((4.55, 1.62, 1.30), (4.64, 1.54, 3.22)),
    ]):
        cylinder_object(
            f"V55_Hardtop_Pillar_{i}", a, b, 0.055, material_set("charcoal"), pillar_id,
            system="structure", component_name="Hardtop support pillars", shape="cylinder", parent=hardtop_id,
            purpose="Raked hardtop support and windscreen framing.", source_ids=(SRC_EXTERIOR,), enclosure="shell",
            deck_id=cid("deck_main"), collection="V55 | superstructure", decorative=True,
        )


def add_rail_line(prefix: str, points: Sequence[Sequence[float]], component_id: str, parent: str, deck_id: str, *, height: float = 0.42, material: str = "stainless") -> None:
    rail_id = component_id
    for i in range(len(points) - 1):
        a = Vector(points[i])
        b = Vector(points[i + 1])
        top_a = a + Vector((0, 0, height))
        top_b = b + Vector((0, 0, height))
        cylinder_object(
            f"{prefix}_post_{i}", a, top_a, 0.026, material_set(material), rail_id,
            system="mooring", component_name="Stainless deck rail assembly", shape="cylinder", parent=parent,
            purpose="Safety rail reconstructed from the low-profile V Class exterior language.", source_ids=(SRC_EXTERIOR, SRC_OFFICIAL),
            enclosure="equipment", deck_id=deck_id, collection="V55 | fittings", decorative=True,
        )
        if i == len(points) - 2:
            cylinder_object(
                f"{prefix}_post_end", b, top_b, 0.026, material_set(material), rail_id,
                system="mooring", component_name="Stainless deck rail assembly", shape="cylinder", parent=parent,
                purpose="Safety rail reconstructed from the low-profile V Class exterior language.", source_ids=(SRC_EXTERIOR, SRC_OFFICIAL),
                enclosure="equipment", deck_id=deck_id, collection="V55 | fittings", decorative=True,
            )
        cylinder_object(
            f"{prefix}_top_{i}", top_a, top_b, 0.032, material_set(material), rail_id,
            system="mooring", component_name="Stainless deck rail assembly", shape="cylinder", parent=parent,
            purpose="Safety rail reconstructed from the low-profile V Class exterior language.", source_ids=(SRC_EXTERIOR, SRC_OFFICIAL),
            enclosure="equipment", deck_id=deck_id, collection="V55 | fittings", decorative=True,
        )


def create_exterior_details() -> None:
    # Bow pulpits, anchor and rails.
    pulpit_id = cid("bow_pulpit")
    add_rail_line("V55_BowRailPort", [(6.5, -1.35, 1.37), (7.75, -0.72, 1.46), (8.72, -0.09, 1.55)], pulpit_id, cid("deck_main"), cid("deck_main"), height=0.42)
    add_rail_line("V55_BowRailStarboard", [(6.5, 1.35, 1.37), (7.75, 0.72, 1.46), (8.72, 0.09, 1.55)], pulpit_id, cid("deck_main"), cid("deck_main"), height=0.42)
    cylinder_object(
        "V55_Bow_Anchor", (8.18, 0.0, 1.48), (8.82, 0.0, 0.82), 0.10, material_set("stainless"), cid("anchor"),
        system="mooring", component_name="Bow anchor and roller", shape="cylinder", parent=pulpit_id,
        purpose="Visible bow ground tackle reconstructed for exterior readability.", source_ids=(SRC_EXTERIOR,), enclosure="equipment", deck_id=cid("deck_main"), collection="V55 | fittings",
    )
    for y in (-1.24, 1.24):
        box_object(
            f"V55_Bow_Cleat_{'P' if y < 0 else 'S'}", (7.35, y, 1.50), (0.42, 0.12, 0.07), material_set("stainless"), cid("deck_hardware"),
            bevel=0.02, system="mooring", component_name="Deck cleats and hardware", shape="box", parent=cid("deck_main"),
            purpose="Sparse deck hardware for scale and recognition.", source_ids=(SRC_EXTERIOR,), enclosure="equipment", deck_id=cid("deck_main"), collection="V55 | fittings", decorative=True,
        )

    # Cockpit L-seat, table and transom sunpad.
    seat_id = cid("cockpit_l_seat")
    box_object(
        "V55_Cockpit_Port_LSeat_Long", (-5.35, -1.43, 1.58), (4.25, 0.48, 0.38), material_set("cushion_cream"), seat_id,
        system="accommodation", component_name="Port cockpit L-seat", shape="box", parent=cid("deck_cockpit"),
        purpose="Port-side L-seat in the open cockpit, shown on the supplied main-deck plan.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_cockpit"), collection="V55 | furnishings", bevel=0.11,
    )
    box_object(
        "V55_Cockpit_Port_LSeat_Return", (-2.95, -1.12, 1.58), (1.55, 1.08, 0.38), material_set("cushion_cream"), seat_id,
        system="accommodation", component_name="Port cockpit L-seat", shape="box", parent=cid("deck_cockpit"), purpose="Short return of port L-seat.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_cockpit"), collection="V55 | furnishings", bevel=0.11,
    )
    box_object(
        "V55_Cockpit_LSeat_Back", (-5.28, -1.68, 1.92), (4.45, 0.15, 0.58), material_set("cushion_graphite"), seat_id,
        system="accommodation", component_name="Port cockpit L-seat", shape="box", parent=cid("deck_cockpit"), purpose="Upholstered cockpit seat back.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_cockpit"), collection="V55 | furnishings", bevel=0.07, decorative=True,
    )
    cylinder_object(
        "V55_Cockpit_TablePedestal", (-4.25, -0.65, 1.33), (-4.25, -0.65, 1.78), 0.07, material_set("stainless"), cid("cockpit_table"),
        system="accommodation", component_name="Cockpit table", shape="cylinder", parent=seat_id, purpose="Cockpit social table pedestal.", source_ids=(SRC_MAIN_DECK,), enclosure="equipment", deck_id=cid("deck_cockpit"), collection="V55 | furnishings", decorative=True,
    )
    cylinder_object(
        "V55_Cockpit_TableTop", (-4.25, -0.65, 1.78), (-4.25, -0.65, 1.80), 0.54, material_set("teak"), cid("cockpit_table"),
        system="accommodation", component_name="Cockpit table", shape="cylinder", parent=seat_id, purpose="Cockpit teak table top.", source_ids=(SRC_MAIN_DECK,), enclosure="equipment", deck_id=cid("deck_cockpit"), collection="V55 | furnishings", decorative=True,
    )
    sunpad_id = cid("aft_sunpad")
    box_object(
        "V55_Aft_Transom_Sunpad", (-7.22, 0.0, 1.62), (2.55, 2.55, 0.24), material_set("cushion_cream"), sunpad_id,
        system="accommodation", component_name="Aft transom sunpad", shape="box", parent=cid("deck_cockpit"), purpose="Large aft sunpad above the optional garage/crew volume; the model selects the no-crew standard hull.", source_ids=(SRC_EXTERIOR, SRC_OFFICIAL), enclosure="equipment", deck_id=cid("deck_cockpit"), collection="V55 | furnishings", bevel=0.14,
    )
    box_object(
        "V55_Transom_Garage_Door", (-8.765, 0.0, 1.04), (0.06, 1.9, 0.68), material_set("glazing"), cid("transom_garage"),
        system="structure", component_name="Tender garage aperture", shape="box", parent=cid("hull_shell"), purpose="Dark transom garage aperture shown below the aft sunpad; optional crew cabin is not modeled.", source_ids=(SRC_EXTERIOR, SRC_OFFICIAL), enclosure="shell", deck_id=cid("deck_cockpit"), collection="V55 | structure",
    )
    stair_id = cid("swim_stairs")
    for side in (-1.0, 1.0):
        for i in range(3):
            box_object(
                f"V55_Swim_Stair_{'P' if side < 0 else 'S'}_{i}", (-8.05 + i * 0.23, side * (1.72 + i * 0.07), 0.86 - i * 0.13), (0.36, 0.65, 0.10), material_set("teak"), stair_id,
                system="mooring", component_name="Twin swim platform stairs", shape="deck", parent=cid("swim_platform"), purpose="Twin side stairs between cockpit transom and swim platform.", source_ids=(SRC_EXTERIOR,), enclosure="equipment", deck_id=cid("deck_cockpit"), collection="V55 | deck surfaces", decorative=True,
            )

    # Forward lounge bench and separate foredeck sunpad.
    fore_id = cid("foredeck_lounge")
    box_object(
        "V55_Foredeck_Lounge_Bench", (7.08, 0.0, 1.62), (1.45, 2.1, 0.32), material_set("cushion_cream"), fore_id,
        system="accommodation", component_name="Foredeck lounge bench", shape="box", parent=cid("deck_main"), purpose="Separate foredeck bench ahead of the saloon.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_main"), collection="V55 | furnishings", bevel=0.12,
    )
    box_object(
        "V55_Foredeck_Sunpad", (5.48, 0.0, 1.61), (1.78, 2.0, 0.24), material_set("cushion_graphite"), cid("foredeck_sunpad"),
        system="accommodation", component_name="Separate bow sunpad", shape="box", parent=cid("deck_main"), purpose="Dedicated bow sunpad distinct from the forward lounge bench.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_main"), collection="V55 | furnishings", bevel=0.13,
    )

    # Port-side low rubrail and stern corner protection.
    rub_id = cid("rubrail")
    for sign, label in ((-1.0, "P"), (1.0, "S")):
        points = [(-8.25, sign * hull_beam(-8.25), 0.64), (-5.8, sign * hull_beam(-5.8), 0.55), (-1.0, sign * hull_beam(-1.0), 0.52), (3.8, sign * hull_beam(3.8), 0.56), (6.8, sign * hull_beam(6.8), 0.74)]
        for i in range(len(points) - 1):
            cylinder_object(
                f"V55_Rubrail_{label}_{i}", points[i], points[i + 1], 0.02, material_set("rubber"), rub_id,
                system="structure", component_name="Black hull rubrail", shape="cylinder", parent=cid("hull_shell"), purpose="Continuous protective rubrail aligned with the dark hull glazing language.", source_ids=(SRC_EXTERIOR,), enclosure="shell", collection="V55 | hull shell", decorative=True,
            )


def create_upper_furnishings() -> None:
    # Port U-sofa inside the saloon.
    saloon_id = cid("saloon_furnishings")
    for name, center, size in [
        ("V55_Saloon_Sofa_Port", (0.4, -1.02, 1.72), (2.8, 0.55, 0.48)),
        ("V55_Saloon_Sofa_Aft", (-0.78, -0.45, 1.72), (0.55, 1.5, 0.48)),
        ("V55_Saloon_Sofa_Forward", (2.0, -0.45, 1.72), (0.55, 1.3, 0.48)),
    ]:
        box_object(
            name, center, size, material_set("cushion_cream"), saloon_id, system="accommodation", component_name="Port saloon U-sofa", shape="box", parent=cid("deck_main"), interior=True, purpose="Port-side U-sofa reconstructed from the supplied main-deck hallmarks.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_saloon"), collection="V55 | furnishings", bevel=0.12,
        )
    box_object(
        "V55_Saloon_Coffee_Table", (0.52, -0.1, 1.58), (1.15, 0.62, 0.12), material_set("wood"), cid("saloon_table"), system="accommodation", component_name="Saloon coffee table", shape="box", parent=saloon_id, interior=True, purpose="Low saloon table.", source_ids=(SRC_MAIN_DECK,), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_saloon"), collection="V55 | furnishings", bevel=0.04, decorative=True,
    )

    # Starboard aft galley inside the saloon volume.
    galley_id = cid("galley_furnishings")
    box_object(
        "V55_Galley_Counter_Aft_Starboard", (-0.65, 1.12, 1.78), (2.0, 0.55, 0.78), material_set("appliance"), galley_id, system="utilities", component_name="Aft starboard galley", shape="box", parent=cid("deck_main"), interior=True, purpose="Aft starboard galley counter and appliance bank.", source_ids=(SRC_MAIN_DECK, SRC_REVIEW), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_galley"), collection="V55 | interiors", bevel=0.07,
    )
    box_object(
        "V55_Galley_Countertop", (-0.65, 1.12, 2.20), (2.12, 0.62, 0.08), material_set("silver"), galley_id, system="utilities", component_name="Aft starboard galley", shape="box", parent=cid("deck_main"), interior=True, purpose="Galley countertop and cooking line.", source_ids=(SRC_MAIN_DECK,), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_galley"), collection="V55 | interiors", bevel=0.02, decorative=True,
    )
    for i in range(3):
        box_object(
            f"V55_Galley_Appliance_{i}", (-1.25 + i * 0.5, 1.42, 2.08), (0.25, 0.035, 0.28), material_set("stainless"), galley_id, system="utilities", component_name="Aft starboard galley", shape="box", parent=galley_id, interior=True, purpose="Original procedural appliance face details.", source_ids=(SRC_MAIN_DECK,), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_galley"), collection="V55 | interiors", bevel=0.015, decorative=True,
        )

    # Two starboard helm chairs and navigation console.
    helm_id = cid("helm_station")
    box_object(
        "V55_Helm_Console", (2.98, 1.18, 2.14), (1.55, 0.52, 0.80), material_set("charcoal"), helm_id, system="navigation", component_name="Starboard helm station", shape="box", parent=cid("deck_main"), purpose="Twin-helm forward starboard console bank.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_helm"), collection="V55 | fittings", bevel=0.06,
    )
    for i, y in enumerate((0.72, 1.38)):
        box_object(
            f"V55_Helm_Chair_{i}", (2.62, y, 1.64), (0.58, 0.48, 0.48), material_set("cushion_graphite"), helm_id, system="navigation", component_name="Twin starboard helm chairs", shape="box", parent=helm_id, purpose="Two separate helm seats on the starboard forward side.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_helm"), collection="V55 | furnishings", bevel=0.09,
        )
        cylinder_object(
            f"V55_Helm_Chair_Pedestal_{i}", (2.62, y, 1.23), (2.62, y, 1.5), 0.08, material_set("stainless"), helm_id, system="navigation", component_name="Twin starboard helm chairs", shape="cylinder", parent=helm_id, purpose="Helm seat pedestal.", source_ids=(SRC_MAIN_DECK,), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_helm"), collection="V55 | fittings", decorative=True,
        )
    torus_object(
        "V55_Helm_Wheel", (3.42, 1.44, 2.26), 0.22, 0.025, material_set("stainless"), helm_id, system="navigation", component_name="Starboard helm station", shape="torus", parent=helm_id, purpose="Visible wheel and instrument arrangement.", source_ids=(SRC_MAIN_DECK, SRC_EXTERIOR), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_helm"), collection="V55 | fittings", decorative=True,
    )
    for i in range(4):
        box_object(
            f"V55_Helm_Display_{i}", (3.3 + 0.18 * i, 1.46, 2.47), (0.12, 0.025, 0.16), material_set("white_light"), helm_id, system="navigation", component_name="Starboard helm station", shape="box", parent=helm_id, purpose="Original authored instrument display faces.", source_ids=(SRC_MAIN_DECK,), enclosure="equipment", deck_id=cid("deck_main"), room_id=cid("room_helm"), collection="V55 | fittings", bevel=0.01, decorative=True,
        )


def create_interior_room_shells() -> None:
    lower_id = cid("deck_lower")
    # Low partition panels leave the rooms legible in dedicated review cameras.
    wall_id = cid("lower_partition_walls")
    walls = [
        ("V55_Owner_Aft_Bulkhead", (-1.95, 0.0, -0.08), (0.12, 2.85, 1.35)),
        ("V55_Owner_Forward_Bulkhead", (1.3, 0.0, -0.08), (0.12, 2.85, 1.35)),
        ("V55_VIP_Aft_Bulkhead", (3.25, 0.0, -0.08), (0.12, 2.65, 1.30)),
        ("V55_Engine_Forward_Bulkhead", (-4.72, 0.0, -0.1), (0.12, 2.7, 1.42)),
        ("V55_Bunk_Port_Partition", (1.55, -0.45, -0.05), (2.4, 0.10, 1.20)),
    ]
    for name, center, size in walls:
        box_object(
            name, center, size, material_set("wall"), wall_id, system="structure", component_name="Lower-deck partition walls", shape="box", parent=lower_id, interior=True, purpose="Low authored room boundaries preserving the supplied three-cabin/two-head reading.", source_ids=(SRC_LOWER_DECK, SRC_REVIEW), enclosure="envelope", deck_id=lower_id, collection="V55 | interiors", bevel=0.025,
        )

    # Owner cabin: full beam amidships, with bed, bedside tables and upholstered headboard.
    owner_id = cid("owner_cabin_furnishings")
    box_object(
        "V55_Owner_Bed_Base", (-0.25, 0.0, -0.48), (2.55, 2.20, 0.22), material_set("wood"), owner_id, system="accommodation", component_name="Full-beam owner cabin", shape="box", parent=lower_id, interior=True, purpose="Full-beam amidships owner berth.", source_ids=(SRC_LOWER_DECK, SRC_REVIEW), enclosure="equipment", deck_id=lower_id, room_id=cid("room_owner"), collection="V55 | interiors", bevel=0.06,
    )
    box_object(
        "V55_Owner_Mattress", (-0.25, 0.0, -0.31), (2.35, 2.0, 0.22), material_set("cushion_cream"), owner_id, system="accommodation", component_name="Full-beam owner cabin", shape="box", parent=owner_id, interior=True, purpose="Owner berth mattress.", source_ids=(SRC_LOWER_DECK, SRC_REVIEW), enclosure="equipment", deck_id=lower_id, room_id=cid("room_owner"), collection="V55 | interiors", bevel=0.1,
    )
    box_object(
        "V55_Owner_Headboard", (1.02, 0.0, 0.06), (0.16, 2.05, 0.88), material_set("cushion_graphite"), owner_id, system="accommodation", component_name="Full-beam owner cabin", shape="box", parent=owner_id, interior=True, purpose="Owner upholstered headboard.", source_ids=(SRC_REVIEW,), enclosure="equipment", deck_id=lower_id, room_id=cid("room_owner"), collection="V55 | interiors", bevel=0.08,
    )
    for y in (-0.78, 0.78):
        box_object(
            f"V55_Owner_Bedside_{'P' if y < 0 else 'S'}", (0.95, y, -0.02), (0.28, 0.42, 0.40), material_set("wood"), owner_id, system="accommodation", component_name="Full-beam owner cabin", shape="box", parent=owner_id, interior=True, purpose="Owner bedside cabinet.", source_ids=(SRC_REVIEW,), enclosure="equipment", deck_id=lower_id, room_id=cid("room_owner"), collection="V55 | interiors", bevel=0.04, decorative=True,
        )

    # VIP forward cabin and compact starboard bunk cabin.
    vip_id = cid("vip_cabin_furnishings")
    box_object(
        "V55_VIP_Bed_Base", (5.35, 0.0, -0.48), (2.05, 1.68, 0.22), material_set("wood"), vip_id, system="accommodation", component_name="Forward VIP cabin", shape="box", parent=lower_id, interior=True, purpose="Forward VIP/double berth.", source_ids=(SRC_LOWER_DECK, SRC_REVIEW), enclosure="equipment", deck_id=lower_id, room_id=cid("room_vip"), collection="V55 | interiors", bevel=0.06,
    )
    box_object(
        "V55_VIP_Mattress", (5.35, 0.0, -0.31), (1.86, 1.50, 0.20), material_set("cushion_cream"), vip_id, system="accommodation", component_name="Forward VIP cabin", shape="box", parent=vip_id, interior=True, purpose="VIP mattress.", source_ids=(SRC_LOWER_DECK, SRC_REVIEW), enclosure="equipment", deck_id=lower_id, room_id=cid("room_vip"), collection="V55 | interiors", bevel=0.09,
    )
    box_object(
        "V55_VIP_Headboard", (6.3, 0.0, 0.02), (0.12, 1.46, 0.72), material_set("cushion_graphite"), vip_id, system="accommodation", component_name="Forward VIP cabin", shape="box", parent=vip_id, interior=True, purpose="VIP upholstered headboard.", source_ids=(SRC_REVIEW,), enclosure="equipment", deck_id=lower_id, room_id=cid("room_vip"), collection="V55 | interiors", bevel=0.07,
    )
    bunk_id = cid("bunk_cabin_furnishings")
    for z in (-0.33, 0.03):
        box_object(
            f"V55_Bunk_Berth_{z}", (2.0, 1.03, z), (1.4, 0.62, 0.18), material_set("cushion_graphite"), bunk_id, system="accommodation", component_name="Starboard compact bunk cabin", shape="box", parent=lower_id, interior=True, purpose="Compact starboard bunk cabin with two berths.", source_ids=(SRC_LOWER_DECK, SRC_REVIEW), enclosure="equipment", deck_id=lower_id, room_id=cid("room_bunk"), collection="V55 | interiors", bevel=0.06,
        )
    box_object(
        "V55_Bunk_Ladder", (1.32, 1.04, -0.02), (0.08, 0.08, 0.70), material_set("stainless"), bunk_id, system="accommodation", component_name="Starboard compact bunk cabin", shape="cylinder", parent=bunk_id, interior=True, purpose="Bunk access ladder.", source_ids=(SRC_LOWER_DECK,), enclosure="equipment", deck_id=lower_id, room_id=cid("room_bunk"), collection="V55 | interiors", decorative=True,
    )

    # Two port-side heads around the central companionway.
    head_id = cid("guest_heads")
    for i, x in enumerate((1.35, 3.0)):
        box_object(
            f"V55_Port_Head_{i}_Vanity", (x, -1.17, -0.05), (0.72, 0.38, 0.58), material_set("wall"), head_id, system="utilities", component_name="Port guest head", shape="box", parent=lower_id, interior=True, purpose="Port-side guest head around the central companionway.", source_ids=(SRC_LOWER_DECK, SRC_REVIEW), enclosure="equipment", deck_id=lower_id, room_id=cid(f"room_head_{i}"), collection="V55 | interiors", bevel=0.05,
        )
        cylinder_object(
            f"V55_Port_Head_{i}_Sink", (x, -1.39, 0.25), (x, -1.39, 0.31), 0.18, material_set("silver"), head_id, system="utilities", component_name="Port guest head", shape="cylinder", parent=head_id, interior=True, purpose="Guest head washbasin.", source_ids=(SRC_REVIEW,), enclosure="equipment", deck_id=lower_id, room_id=cid(f"room_head_{i}"), collection="V55 | interiors", decorative=True,
        )
        box_object(
            f"V55_Port_Head_{i}_Toilet", (x + 0.2, -1.06, -0.22), (0.34, 0.42, 0.30), material_set("appliance"), head_id, system="utilities", component_name="Port guest head", shape="box", parent=head_id, interior=True, purpose="Guest head sanitary fixture.", source_ids=(SRC_REVIEW,), enclosure="equipment", deck_id=lower_id, room_id=cid(f"room_head_{i}"), collection="V55 | interiors", bevel=0.08, decorative=True,
        )

    # Central companionway and stairs.
    companion_id = cid("companionway")
    for i in range(5):
        box_object(
            f"V55_Companionway_Step_{i}", (2.6, -0.25, -0.78 + i * 0.20), (0.82, 0.62, 0.16), material_set("wood"), companion_id, system="structure", component_name="Central lower-deck companionway", shape="deck", parent=lower_id, interior=True, purpose="Central companionway between main and lower deck.", source_ids=(SRC_LOWER_DECK, SRC_MAIN_DECK), enclosure="equipment", deck_id=lower_id, room_id=cid("room_companionway"), collection="V55 | interiors", bevel=0.025, decorative=True,
        )


def create_engine_room() -> None:
    engine_room_id = cid("engine_room")
    engine_id = cid("twin_diesel_machinery")
    for side, y in (("P", -0.78), ("S", 0.78)):
        box_object(
            f"V55_{side}_D13_Engine_Block", (-5.8, y, -0.48), (1.95, 0.62, 0.92), material_set("engine_blue"), engine_id, system="propulsion", component_name="Twin Volvo D13 engine room machinery", shape="box", parent=engine_room_id, interior=True, purpose="Twin D13 shaft-drive machinery rendered as an externally detailed block, not a service manual.", source_ids=(SRC_REVIEW, SRC_OFFICIAL), enclosure="equipment", deck_id=cid("deck_lower"), room_id=cid("room_engine"), explode=(-1.2, 0.0, -0.6), collection="V55 | machinery", bevel=0.08,
        )
        for i in range(3):
            cylinder_object(
                f"V55_{side}_D13_Turbo_{i}", (-6.35 + i * 0.42, y, 0.02), (-6.35 + i * 0.42, y, 0.23), 0.08, material_set("silver"), engine_id,
                system="propulsion", component_name="Twin Volvo D13 engine room machinery", shape="cylinder", parent=engine_id, interior=True, purpose="Visible engine head/turbo detail.", source_ids=(SRC_REVIEW,), enclosure="equipment", deck_id=cid("deck_lower"), room_id=cid("room_engine"), collection="V55 | machinery", decorative=True,
            )
        cylinder_object(
            f"V55_{side}_Shaft", (-4.82, y, -0.63), (-3.7, y, -0.74), 0.075, material_set("stainless"), cid("shaft_lines"), system="propulsion", component_name="Twin shaft lines", shape="cylinder", parent=engine_id, interior=True, purpose="Twin shaft-line outlines behind the engine blocks.", source_ids=(SRC_OFFICIAL,), enclosure="equipment", deck_id=cid("deck_lower"), room_id=cid("room_engine"), collection="V55 | machinery", decorative=True,
        )
    box_object(
        "V55_Engine_Room_Floor", (-5.45, 0.0, -0.9), (2.9, 2.25, 0.08), material_set("rubber"), engine_room_id, system="structure", component_name="Engine room", shape="deck", parent=cid("deck_lower"), interior=True, purpose="Machinery space aft of the owner cabin.", source_ids=(SRC_LOWER_DECK, SRC_REVIEW), enclosure="equipment", deck_id=cid("deck_lower"), room_id=cid("room_engine"), collection="V55 | machinery",
    )
    for y in (-1.12, 1.12):
        cylinder_object(
            f"V55_Engine_Room_Railing_{'P' if y < 0 else 'S'}", (-6.55, y, -0.56), (-4.35, y, -0.56), 0.025, material_set("stainless"), engine_room_id, system="safety", component_name="Engine room safety rail", shape="cylinder", parent=engine_room_id, interior=True, purpose="Machinery-space safety rail.", source_ids=(SRC_REVIEW,), enclosure="equipment", deck_id=cid("deck_lower"), room_id=cid("room_engine"), collection="V55 | machinery", decorative=True,
        )


def create_review_environment() -> None:
    # The stage is part of the review scene, not the vessel. Keep it outside the
    # semantic manifest and authored asset chunks so it cannot distort yacht
    # dimensions or become selectable in the application.
    verts, faces = box_mesh((0, 0, -0.055), (42, 32, 0.1))
    mesh = bpy.data.meshes.new("V55_Review_Water_Surface_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update(calc_edges=True)
    mesh.materials.append(material_set("water"))
    obj = bpy.data.objects.new("V55_Review_Water_Surface", mesh)
    ensure_collection("V55 | review stage").objects.link(obj)
    obj["reviewEnvironment"] = True


def create_lights() -> None:
    world = bpy.context.scene.world or bpy.data.worlds.new("V55 Review World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.008, 0.014, 0.026, 1)
        bg.inputs["Strength"].default_value = 0.22
    def area(name: str, location: Sequence[float], energy: float, size: float, color: tuple[float, float, float]) -> None:
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = location
        obj.rotation_euler = (math.radians(24), 0, math.radians(-28))
    area("V55_Key_Softbox", (2, -10, 13), 1450, 8.0, (0.88, 0.94, 1.0))
    area("V55_Fill_Softbox", (-5, 8, 7), 1100, 6.0, (0.46, 0.62, 1.0))
    area("V55_Rim_Softbox", (-10, -2, 8), 1750, 5.0, (1.0, 0.52, 0.28))
    area("V55_Interior_Fill_Main", (0.0, 0.0, 3.0), 750, 4.0, (1.0, 0.78, 0.58))
    area("V55_Interior_Fill_Lower", (-1.0, 0.0, 0.65), 900, 3.0, (0.68, 0.80, 1.0))
    area("V55_Interior_Fill_Engine", (-5.4, 0.0, 0.25), 1200, 2.5, (1.0, 0.48, 0.18))
    sun_data = bpy.data.lights.new("V55_Sun", "SUN")
    sun_data.energy = 1.2
    sun_data.angle = math.radians(18)
    sun = bpy.data.objects.new("V55_Sun", sun_data)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(28), math.radians(-20), math.radians(-35))


def look_at(obj: bpy.types.Object, target: Sequence[float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


CAMERAS: list[dict[str, Any]] = []


def create_camera(camera_id: str, name: str, position: Sequence[float], target: Sequence[float], *, deck_id: str | None = None, room_id: str | None = None, lens: float = 52.0) -> None:
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = 36
    cam = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = position
    look_at(cam, target)
    cam["cameraId"] = camera_id
    cam["vesselId"] = VESSEL_ID
    CAMERAS.append({"id": camera_id, "name": name, "position": list(position), "target": list(target), **({"deckId": deck_id} if deck_id else {}), **({"roomId": room_id} if room_id else {})})


def create_cameras() -> None:
    create_camera("exterior_bow_port", "Review | Bow Port Quarter", (18.0, -15.5, 10.0), (0.2, 0, 0.9), deck_id=cid("deck_main"), lens=55)
    create_camera("exterior_bow_starboard", "Review | Bow Starboard Quarter", (17.0, 14.5, 9.0), (0.4, 0, 1.0), deck_id=cid("deck_main"), lens=55)
    create_camera("exterior_port_profile", "Review | Port Profile", (0.0, -27.5, 5.2), (0.0, 0, 0.9), deck_id=cid("deck_main"), lens=55)
    create_camera("exterior_starboard_profile", "Review | Starboard Profile", (0.0, 27.5, 5.2), (0.0, 0, 0.9), deck_id=cid("deck_main"), lens=55)
    create_camera("exterior_stern_port", "Review | Stern Port Quarter", (-17.0, -14.5, 9.0), (-0.6, 0, 0.9), deck_id=cid("deck_cockpit"), lens=55)
    create_camera("exterior_stern_starboard", "Review | Stern Starboard Quarter", (-17.0, 14.5, 9.0), (-0.6, 0, 0.9), deck_id=cid("deck_cockpit"), lens=55)
    create_camera("exterior_high_bow", "Review | High Bow", (12.5, 0.0, 18.5), (0.5, 0, 0.7), deck_id=cid("deck_main"), lens=55)
    create_camera("exterior_three_quarter", "Review | Starboard Three-Quarter", (18.5, 15.5, 10.0), (0.0, 0, 0.9), deck_id=cid("deck_main"), lens=55)
    # Keep the under-hull review far enough outboard to frame the whole keel
    # and running gear. The previous close camera intersected the shell on the
    # V55 because its custom scene uses a larger absolute authoring envelope
    # than the generic family generator.
    create_camera("exterior_below", "Review | Below Hull", (-13.0, 16.0, -11.0), (0.0, 0, -0.2), deck_id=cid("deck_lower"), lens=46)
    create_camera("room_saloon", "Room | Saloon", (-4.35, 0.55, 2.85), (1.15, -0.15, 1.60), deck_id=cid("deck_main"), room_id=cid("room_saloon"), lens=38)
    create_camera("room_owner", "Room | Full-beam Owner", (-1.95, -1.95, 0.62), (0.15, 0.05, -0.12), deck_id=cid("deck_lower"), room_id=cid("room_owner"), lens=28)
    create_camera("room_vip", "Room | Forward VIP", (3.55, 1.75, 0.66), (5.30, 0.0, -0.10), deck_id=cid("deck_lower"), room_id=cid("room_vip"), lens=28)
    create_camera("room_bunk_heads", "Room | Bunk and Heads", (0.55, -0.82, 0.78), (2.05, 1.00, -0.02), deck_id=cid("deck_lower"), room_id=cid("room_bunk"), lens=28)
    create_camera("room_galley", "Room | Aft Galley", (-2.3, 0.35, 2.65), (-0.65, 1.15, 1.95), deck_id=cid("deck_main"), room_id=cid("room_galley"), lens=32)
    create_camera("room_helm", "Room | Starboard Helm", (4.5, 2.65, 2.85), (3.0, 1.2, 1.9), deck_id=cid("deck_main"), room_id=cid("room_helm"), lens=32)
    create_camera("room_head_0", "Room | Guest Head Forward", (1.8, -2.05, 0.72), (1.8, -1.15, -0.05), deck_id=cid("deck_lower"), room_id=cid("room_head_0"), lens=28)
    create_camera("room_head_1", "Room | Guest Head Aft", (0.2, -2.05, 0.72), (0.2, -1.15, -0.05), deck_id=cid("deck_lower"), room_id=cid("room_head_1"), lens=28)
    create_camera("room_companionway", "Room | Central Companionway", (2.95, -1.85, 0.82), (2.6, -0.25, -0.40), deck_id=cid("deck_lower"), room_id=cid("room_companionway"), lens=28)
    create_camera("room_engine", "Room | Engine Space", (-7.65, -1.75, 0.62), (-5.55, 0.0, -0.22), deck_id=cid("deck_lower"), room_id=cid("room_engine"), lens=28)


def gltf_vector(blender_vector: Sequence[float]) -> list[float]:
    return [float(blender_vector[0]), float(blender_vector[2]), float(-blender_vector[1])]


def object_world_bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    lo = Vector((min(v.x for v in corners), min(v.y for v in corners), min(v.z for v in corners)))
    hi = Vector((max(v.x for v in corners), max(v.y for v in corners), max(v.z for v in corners)))
    return lo, hi


def component_bounds(objects: Iterable[bpy.types.Object]) -> tuple[list[float], list[float]]:
    bounds = [object_world_bounds(obj) for obj in objects if obj.type in {"MESH", "CURVE"}]
    if not bounds:
        return [0.0, 0.0, 0.0], [0.01, 0.01, 0.01]
    lo = Vector((min(pair[0].x for pair in bounds), min(pair[0].y for pair in bounds), min(pair[0].z for pair in bounds)))
    hi = Vector((max(pair[1].x for pair in bounds), max(pair[1].y for pair in bounds), max(pair[1].z for pair in bounds)))
    center = (lo + hi) * 0.5
    size = hi - lo
    return gltf_vector(center), [float(size.x), float(size.z), float(size.y)]


def build_manifest() -> dict[str, Any]:
    components: list[dict[str, Any]] = []
    for component_id in sorted(COMPONENTS):
        comp = COMPONENTS[component_id]
        position, size = component_bounds(comp["objects"])
        components.append({
            "id": comp["id"],
            "vesselId": VESSEL_ID,
            "name": comp["name"],
            "systemId": comp["systemId"],
            "assembly": comp["assembly"],
            "parentId": comp["parentId"],
            "shape": comp["shape"],
            "position": position,
            "size": [max(0.01, s) for s in size],
            "rotation": [0.0, 0.0, 0.0],
            "color": "#8b9298",
            "explode": comp["explode"],
            "localExplode": comp["localExplode"],
            "interior": comp["interior"],
            "decorative": comp["decorative"],
            "fidelity": comp["fidelity"],
            "purpose": comp["purpose"],
            "sourceIds": comp["sourceIds"],
            "enclosure": comp["enclosure"],
            **({"deckId": comp["deckId"]} if comp["deckId"] else {}),
            **({"roomId": comp["roomId"]} if comp["roomId"] else {}),
        })
    decks = [
        {"id": cid("deck_main"), "name": "Main deck", "componentId": cid("deck_main")},
        {"id": cid("deck_cockpit"), "name": "Open aft cockpit", "componentId": cid("deck_cockpit")},
        {"id": cid("deck_lower"), "name": "Lower accommodation deck", "componentId": cid("deck_lower")},
    ]
    rooms = [
        {"id": cid("room_saloon"), "name": "Saloon", "deckId": cid("deck_main"), "componentId": cid("saloon_furnishings"), "fidelity": "reference-informed", "note": "Port U-sofa and social saloon reconstructed from supplied main-deck hallmarks.", "sourceIds": [SRC_MAIN_DECK, SRC_EXTERIOR]},
        {"id": cid("room_galley"), "name": "Aft starboard galley", "deckId": cid("deck_main"), "componentId": cid("galley_furnishings"), "fidelity": "reference-informed", "note": "Aft galley position is reference-informed; appliance arrangement is authored.", "sourceIds": [SRC_MAIN_DECK, SRC_REVIEW]},
        {"id": cid("room_helm"), "name": "Twin starboard helm", "deckId": cid("deck_main"), "componentId": cid("helm_station"), "fidelity": "reference-informed", "note": "Two helm chairs and console are visible in the model; instrument details are authored.", "sourceIds": [SRC_MAIN_DECK, SRC_EXTERIOR]},
        {"id": cid("room_owner"), "name": "Full-beam owner cabin", "deckId": cid("deck_lower"), "componentId": cid("owner_cabin_furnishings"), "fidelity": "reference-informed", "note": "Full-beam amidships owner cabin is evidenced; furniture finish is authored.", "sourceIds": [SRC_LOWER_DECK, SRC_REVIEW]},
        {"id": cid("room_vip"), "name": "Forward VIP cabin", "deckId": cid("deck_lower"), "componentId": cid("vip_cabin_furnishings"), "fidelity": "reference-informed", "note": "Forward VIP/double cabin is evidenced; furniture finish is authored.", "sourceIds": [SRC_LOWER_DECK, SRC_REVIEW]},
        {"id": cid("room_bunk"), "name": "Starboard bunk cabin", "deckId": cid("deck_lower"), "componentId": cid("bunk_cabin_furnishings"), "fidelity": "reference-informed", "note": "Compact starboard bunk cabin is reference-informed.", "sourceIds": [SRC_LOWER_DECK, SRC_REVIEW]},
        {"id": cid("room_head_0"), "name": "Port guest head forward", "deckId": cid("deck_lower"), "componentId": cid("guest_heads"), "fidelity": "reference-informed", "note": "One of two port-side guest heads around the companionway.", "sourceIds": [SRC_LOWER_DECK, SRC_REVIEW]},
        {"id": cid("room_head_1"), "name": "Port guest head aft", "deckId": cid("deck_lower"), "componentId": cid("guest_heads"), "fidelity": "reference-informed", "note": "One of two port-side guest heads around the companionway.", "sourceIds": [SRC_LOWER_DECK, SRC_REVIEW]},
        {"id": cid("room_engine"), "name": "Aft engine space", "deckId": cid("deck_lower"), "componentId": cid("engine_room"), "fidelity": "reconstructed", "note": "Machinery aft of the owner cabin; equipment detail is externally legible and not service documentation.", "sourceIds": [SRC_LOWER_DECK, SRC_OFFICIAL]},
        {"id": cid("room_companionway"), "name": "Central companionway", "deckId": cid("deck_lower"), "componentId": cid("companionway"), "fidelity": "reference-informed", "note": "Central stairs connect the main and lower deck views.", "sourceIds": [SRC_MAIN_DECK, SRC_LOWER_DECK]},
    ]
    camera_manifest = []
    for camera in CAMERAS:
        entry = {"id": camera["id"], "name": camera["name"], "position": gltf_vector(camera["position"]), "target": gltf_vector(camera["target"])}
        if camera.get("deckId"):
            entry["deckId"] = camera["deckId"]
        if camera.get("roomId"):
            entry["roomId"] = camera["roomId"]
        camera_manifest.append(entry)
    return {
        "vesselId": VESSEL_ID,
        "version": 2,
        "units": "metres",
        "components": components,
        "meaningfulCount": sum(1 for c in components if not c["decorative"]),
        "lods": [],
        "assets": [],
        "decks": decks,
        "rooms": rooms,
        "cameras": camera_manifest,
        "fidelity": "Original reference-informed reconstruction of the 2019 Princess V55 Gen2 standard three-cabin configuration. Official/independent evidence anchors silhouette, dimensions and deck arrangement; internal furniture, hull offsets and machinery detail are reconstructed. Exporter-owned assets are intentionally empty in the Blender master.",
    }


def scene_setup() -> None:
    # Blender MCP intentionally blocks read_factory_settings because it resets
    # user preferences. The empty homefile reset is equivalent for this clean
    # authoring scene and is permitted by the connected Blender sandbox.
    if MCP_SAFE:
        scene = bpy.data.scenes.get(VESSEL_ID) or bpy.data.scenes.new(VESSEL_ID)
        for obj in list(scene.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        for child in list(scene.collection.children):
            scene.collection.children.unlink(child)
            if child.users == 0:
                bpy.data.collections.remove(child)
        for window in bpy.context.window_manager.windows:
            window.scene = scene
    else:
        bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True)
        scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = str(RENDER_DIR / "_unused.png")
    scene.view_settings.look = "AgX - Medium High Contrast"


def object_is_vessel_mesh(obj: bpy.types.Object) -> bool:
    return obj.type in {"MESH", "CURVE"} and bool(obj.get("componentId"))


def set_render_visibility(interior: bool) -> None:
    for obj in bpy.context.scene.objects:
        if obj.type not in {"MESH", "CURVE"}:
            continue
        if interior:
            obj.hide_render = not bool(obj.get("interior", False))
        else:
            obj.hide_render = obj.name == "V55_Review_Water_Surface" and False


def render_reviews() -> list[str]:
    RENDER_DIR.mkdir(parents=True, exist_ok=True)
    rendered: list[str] = []
    scene = bpy.context.scene
    cameras_by_id = {obj.get("cameraId"): obj for obj in scene.objects if obj.type == "CAMERA"}
    for camera in CAMERAS:
        camera_id = camera["id"]
        cam = cameras_by_id.get(camera_id)
        if not cam:
            continue
        is_interior = camera_id.startswith("room_")
        set_render_visibility(is_interior)
        scene.camera = cam
        scene.render.resolution_x = 960 if not is_interior else 880
        scene.render.resolution_y = 640 if not is_interior else 660
        output = RENDER_DIR / f"{camera_id}.png"
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        rendered.append(str(output.relative_to(ROOT)))
    for obj in bpy.context.scene.objects:
        if object_is_vessel_mesh(obj):
            obj.hide_render = False
    return rendered


def triangle_count() -> int:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    total = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.hide_viewport:
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        total += sum(max(0, len(poly.vertices) - 2) for poly in mesh.polygons)
        evaluated.to_mesh_clear()
    return total


def save_master(manifest: dict[str, Any]) -> None:
    scene = bpy.context.scene
    scene["hullscopeManifest"] = json.dumps(manifest, separators=(",", ":"), sort_keys=True)
    scene["hullscopeManifestVersion"] = 2
    scene["vesselId"] = VESSEL_ID
    scene["sourceCoordinateSystem"] = "Blender metres, +X bow, +Y starboard, +Z up"
    scene["gltfCoordinateConversion"] = "[Blender X, Blender Z, -Blender Y]"
    scene["referenceSources"] = json.dumps([SRC_OFFICIAL, SRC_EXTERIOR, SRC_MAIN_DECK, SRC_LOWER_DECK, SRC_LAUNCH, SRC_REVIEW, SRC_TIMELINE])
    scene["configurationChoice"] = "Standard 3-cabin / 2-guest-ensuite V55 Gen2; optional aft crew cabin intentionally omitted."
    scene["assetContract"] = "assets and lods are reserved for the coordinating exporter; no exported glTF is authored here."
    scene["dimensionReference"] = json.dumps({"loaM": LOA, "beamM": BEAM, "draftM": DRAFT, "draftStatus": "approximate conditional below-water fit"})
    scene["reviewNote"] = "Self-review renders are evidence of authoring progress, not QA approval."
    if MCP_SAFE:
        bpy.data.libraries.write(str(MASTER_PATH), {scene}, compress=True)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=str(MASTER_PATH), compress=True)


def write_metrics(manifest: dict[str, Any], rendered: list[str]) -> None:
    bounds = []
    for obj in bpy.context.scene.objects:
        if not object_is_vessel_mesh(obj):
            continue
        lo, hi = object_world_bounds(obj)
        bounds.extend((lo, hi))
    lo = Vector((min(p.x for p in bounds), min(p.y for p in bounds), min(p.z for p in bounds)))
    hi = Vector((max(p.x for p in bounds), max(p.y for p in bounds), max(p.z for p in bounds)))
    metrics = {
        "vesselId": VESSEL_ID,
        "masterPath": str(MASTER_PATH.relative_to(ROOT)),
        "semanticComponentCount": len(manifest["components"]),
        "meaningfulCount": manifest["meaningfulCount"],
        "triangleCountEvaluated": triangle_count(),
        "boundsBlenderM": {"min": list(lo), "max": list(hi), "size": list(hi - lo)},
        "boundsGltfM": {"min": gltf_vector(lo), "max": gltf_vector(hi), "size": [hi.x - lo.x, hi.z - lo.z, hi.y - lo.y]},
        "renderedViews": rendered,
        "interiorEvidence": "Reference-informed rooms and supplied deck plans; all interior furniture and room partitions are reconstructed.",
        "draftNote": "Underwater hull fit targets official 1.44 m draft approximately; no hydrostatic validation.",
        "selfReviewStatus": "not QA-approved",
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--replace", action="store_true", help="Allow replacing the existing authoritative .blend master.")
    parser.add_argument("--no-render", action="store_true", help="Skip the review render pass.")
    parser.add_argument("--quit", action="store_true", help="Quit Blender after the authoring pass; fallback for GUI execution when background Metal init is unavailable.")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def main() -> None:
    args = parse_args()
    if MASTER_PATH.exists() and not args.replace:
        raise SystemExit(f"Refusing to overwrite existing master: {MASTER_PATH}. Re-run with --replace only when replacement is intentional.")
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    RENDER_DIR.mkdir(parents=True, exist_ok=True)
    scene_setup()
    create_hull()
    create_glazing()
    create_decks_and_hardtop()
    create_exterior_details()
    create_upper_furnishings()
    create_interior_room_shells()
    create_engine_room()
    create_review_environment()
    create_lights()
    create_cameras()
    manifest = build_manifest()
    save_master(manifest)
    rendered = [] if args.no_render else render_reviews()
    # Restore the full authoring scene before saving the master again.  Review
    # renders may hide the exterior temporarily but the master must be complete.
    set_render_visibility(False)
    save_master(manifest)
    write_metrics(manifest, rendered)
    print(json.dumps({
        "masterPath": str(MASTER_PATH.relative_to(ROOT)),
        "semanticComponentCount": len(manifest["components"]),
        "meaningfulCount": manifest["meaningfulCount"],
        "triangleCountEvaluated": triangle_count(),
        "renderedViews": rendered,
        "dimensionsTargetM": {"loa": LOA, "beam": BEAM, "draft": DRAFT},
        "assets": "reserved for coordinating exporter",
    }, indent=2))
    if args.quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
