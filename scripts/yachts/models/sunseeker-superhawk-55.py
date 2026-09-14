"""Build the original Sunseeker Superhawk 55 authoring master.

Usage:
  Blender --background --python scripts/yachts/models/sunseeker-superhawk-55.py -- [--replace] [--no-render]

The script is intentionally self-contained. It does not import or edit shared
application modules. The scene manifest uses Blender +X bow / +Y starboard /
+Z up for authoring; manifest vectors are emitted in glTF coordinates
[x, z, -y]. The manifest component ``shape`` is always ``box`` as an AABB
selection proxy; the visible geometry is custom mesh/primitive geometry.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector


CANONICAL_ID = "sunseeker-superhawk-55-gen1-2023"
BRAND = "Sunseeker"
MODEL = "Superhawk 55"
ROOT = Path(__file__).resolve().parents[3]
MASTER_PATH = ROOT / ".tools" / "yachts" / "masters" / f"{CANONICAL_ID}.blend"
REVIEW_PATH = ROOT / ".tools" / "yachts" / "review" / CANONICAL_ID
MCP_SAFE = os.environ.get("HULLSCOPE_BLENDER_MCP") == "1"

OFFICIAL_PAGE = "https://www.sunseeker.com/range/superhawk-55"
OFFICIAL_BROCHURE = "https://uploads.sunseeker.com/uploads/e4ccda224055627bdbe1e1b3112bef1a/en/Sunseeker_Superhawk55_400x225_Web.pdf"
INDEPENDENT_REVIEW = "https://www.yachtbuyer.com/en-gb/reviews/sunseeker-superhawk-55-2022"
INDEPENDENT_LAUNCH = "https://www.yachtworld.com/research/sunseeker-superhawk-55-new-legend-on-the-water/"
SOURCE_IDS = [OFFICIAL_PAGE, OFFICIAL_BROCHURE, INDEPENDENT_REVIEW]

LENGTH_M = 17.13
BEAM_M = 4.93
DRAFT_M = 1.43
HALF_LENGTH = LENGTH_M / 2.0
HALF_BEAM = BEAM_M / 2.0

SYSTEM_COLLECTIONS: dict[str, bpy.types.Collection] = {}
OBJECTS_BY_COMPONENT: dict[str, list[bpy.types.Object]] = {}
MATERIALS: dict[str, bpy.types.Material] = {}


def gltf_vec(v: tuple[float, float, float] | Vector) -> list[float]:
    """Blender +X bow/+Y starboard/+Z up -> glTF +X/+Y up/+Z aft."""
    return [round(float(v[0]), 4), round(float(v[2]), 4), round(float(-v[1]), 4)]


def ensure_collection(system_id: str) -> bpy.types.Collection:
    if system_id in SYSTEM_COLLECTIONS:
        return SYSTEM_COLLECTIONS[system_id]
    collection = bpy.data.collections.new(f"{system_id}-assembly")
    bpy.context.scene.collection.children.link(collection)
    SYSTEM_COLLECTIONS[system_id] = collection
    return collection


def tag(obj: bpy.types.Object, component_id: str, *, interior: bool, decorative: bool,
        fidelity: str, purpose: str, sources: list[str] | None = None) -> bpy.types.Object:
    """Attach stable semantic ownership to every visible geometry object."""
    obj["componentId"] = component_id
    obj["interior"] = bool(interior)
    obj["decorative"] = bool(decorative)
    obj["fidelity"] = fidelity
    obj["purpose"] = purpose
    obj["sourceIds"] = json.dumps(sources or SOURCE_IDS, separators=(",", ":"))
    suffix = component_id.rsplit(".", 1)[-1]
    lower_deck_components = {"lower-deck", "master-cabin", "vip-cabin", "lobby-galley", "engine-room", "engines", "electrical", "fuel", "ventilation"}
    main_deck_components = {"main-deck", "cockpit-wetbar", "helm", "safety", "mooring"}
    room_by_component = {
        "master-cabin": "master", "vip-cabin": "vip", "lobby-galley": "lobby",
        "engine-room": "engine-room", "engines": "engine-room", "electrical": "engine-room",
        "fuel": "engine-room", "ventilation": "engine-room",
    }
    if suffix in lower_deck_components:
        obj["deck_id"] = "lower"
    elif suffix in main_deck_components:
        obj["deck_id"] = "main"
    if suffix in room_by_component:
        obj["room_id"] = room_by_component[suffix]
    OBJECTS_BY_COMPONENT.setdefault(component_id, []).append(obj)
    return obj


def move_to_system_collection(obj: bpy.types.Object, system_id: str) -> None:
    collection = ensure_collection(system_id)
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)


def pbr_material(name: str, color: tuple[float, float, float, float], *, metallic=0.0,
                 roughness=0.45, transmission=0.0, ior=1.45, coat=0.0) -> bpy.types.Material:
    if name in MATERIALS:
        return MATERIALS[name]
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = transmission
        if "IOR" in bsdf.inputs:
            bsdf.inputs["IOR"].default_value = ior
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = coat
        if "Coat Roughness" in bsdf.inputs:
            bsdf.inputs["Coat Roughness"].default_value = 0.12
        texture_size = 128
        image = bpy.data.images.new(f"{CANONICAL_ID} | {name} | authored albedo", width=texture_size, height=texture_size, alpha=True)
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
        material.node_tree.links.new(texcoord.outputs["UV"], image_node.inputs["Vector"])
        material.node_tree.links.new(image_node.outputs["Color"], bsdf.inputs["Base Color"])
    MATERIALS[name] = material
    return material


def materials() -> dict[str, bpy.types.Material]:
    return {
        "hull": pbr_material("Paint / pearl white", (0.78, 0.82, 0.84, 1), roughness=0.22, coat=0.35),
        "hull_lower": pbr_material("Paint / silver lower chine", (0.28, 0.34, 0.38, 1), metallic=0.42, roughness=0.28, coat=0.25),
        # Lift the dark surfaces enough for browser/environment lighting to
        # separate glazing, canopy and hull shoulders at a glance.
        "navy": pbr_material("Paint / midnight navy", (0.060, 0.14, 0.22, 1), roughness=0.22, coat=0.30),
        "glass": pbr_material("Glass / blue-black solar", (0.085, 0.25, 0.40, 1), roughness=0.10, transmission=0.20, ior=1.46, coat=0.18),
        "teak": pbr_material("Teak / warm deck", (0.34, 0.15, 0.055, 1), roughness=0.62),
        "teak_dark": pbr_material("Teak / dark furniture", (0.10, 0.045, 0.018, 1), roughness=0.55),
        "cloth": pbr_material("Cloth / warm ivory", (0.58, 0.54, 0.46, 1), roughness=0.88),
        "cloth_dark": pbr_material("Cloth / charcoal", (0.055, 0.07, 0.08, 1), roughness=0.86),
        "metal": pbr_material("Metal / brushed stainless", (0.30, 0.34, 0.36, 1), metallic=0.9, roughness=0.24),
        "chrome": pbr_material("Metal / polished rail", (0.72, 0.76, 0.78, 1), metallic=0.96, roughness=0.1),
        "rubber": pbr_material("Rubber / fender", (0.012, 0.015, 0.018, 1), roughness=0.72),
        "wood": pbr_material("Wood / satin interior", (0.24, 0.095, 0.035, 1), roughness=0.47),
        "ceramic": pbr_material("Ceramic / sanitary", (0.76, 0.79, 0.78, 1), roughness=0.24),
        "engine": pbr_material("Engine / graphite", (0.12, 0.14, 0.15, 1), metallic=0.72, roughness=0.34),
        "accent": pbr_material("Accent / amber", (0.75, 0.25, 0.035, 1), metallic=0.16, roughness=0.38),
    }


def make_mesh(name: str, verts: list[tuple[float, float, float]], faces: list[tuple[int, ...]],
              material: bpy.types.Material, component_id: str, system_id: str, *, interior=False,
              decorative=False, fidelity="reference-informed", purpose="") -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
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
    ensure_collection(system_id).objects.link(obj)
    obj.data.materials.append(material)
    tag(obj, component_id, interior=interior, decorative=decorative, fidelity=fidelity, purpose=purpose)
    return obj


def make_box(name: str, center: tuple[float, float, float], size: tuple[float, float, float],
             material: bpy.types.Material, component_id: str, system_id: str, *, interior=False,
             decorative=False, fidelity="reference-informed", purpose="", bevel=0.0) -> bpy.types.Object:
    cx, cy, cz = center
    sx, sy, sz = (v / 2.0 for v in size)
    verts = [
        (cx - sx, cy - sy, cz - sz), (cx + sx, cy - sy, cz - sz),
        (cx + sx, cy + sy, cz - sz), (cx - sx, cy + sy, cz - sz),
        (cx - sx, cy - sy, cz + sz), (cx + sx, cy - sy, cz + sz),
        (cx + sx, cy + sy, cz + sz), (cx - sx, cy + sy, cz + sz),
    ]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    obj = make_mesh(name, verts, faces, material, component_id, system_id, interior=interior,
                    decorative=decorative, fidelity=fidelity, purpose=purpose)
    if bevel > 0:
        modifier = obj.modifiers.new("soft authored edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        modifier.limit_method = "ANGLE"
    return obj


def make_prism(name: str, footprint: list[tuple[float, float]], z0: float, z1: float,
               material: bpy.types.Material, component_id: str, system_id: str, *, interior=False,
               decorative=False, fidelity="reference-informed", purpose="", bevel=0.0) -> bpy.types.Object:
    verts = [(x, y, z0) for x, y in footprint] + [(x, y, z1) for x, y in footprint]
    n = len(footprint)
    faces: list[tuple[int, ...]] = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    obj = make_mesh(name, verts, faces, material, component_id, system_id, interior=interior,
                    decorative=decorative, fidelity=fidelity, purpose=purpose)
    if bevel > 0:
        modifier = obj.modifiers.new("soft authored edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    return obj


def make_cylinder(name: str, location: tuple[float, float, float], radius: float, depth: float,
                  material: bpy.types.Material, component_id: str, system_id: str, *, interior=False,
                  decorative=False, vertices=16, rotation=(0.0, 0.0, 0.0), purpose="") -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    move_to_system_collection(obj, system_id)
    obj.data.materials.append(material)
    tag(obj, component_id, interior=interior, decorative=decorative, fidelity="reference-informed", purpose=purpose)
    return obj


def make_torus(name: str, location: tuple[float, float, float], major: float, minor: float,
               material: bpy.types.Material, component_id: str, system_id: str, *, interior=False,
               rotation=(0.0, 0.0, 0.0), purpose="") -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=32,
                                     minor_segments=10, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    move_to_system_collection(obj, system_id)
    obj.data.materials.append(material)
    tag(obj, component_id, interior=interior, decorative=False, fidelity="reference-informed", purpose=purpose)
    return obj


def cylinder_between(name: str, a: tuple[float, float, float], b: tuple[float, float, float], radius: float,
                     material: bpy.types.Material, component_id: str, system_id: str, *, interior=False,
                     decorative=False, purpose="") -> bpy.types.Object:
    va, vb = Vector(a), Vector(b)
    delta = vb - va
    obj = make_cylinder(name, tuple((va + vb) * 0.5), radius, delta.length, material, component_id, system_id,
                        interior=interior, decorative=decorative, purpose=purpose)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = delta.to_track_quat("Z", "Y")
    return obj


def hull_half_beam(x: float) -> float:
    samples = [(-8.55, 0.25), (-8.25, 0.95), (-7.55, 1.85), (-6.2, 2.28), (-4.0, 2.43),
               (0.0, 2.465), (3.6, 2.38), (5.8, 2.18), (7.1, 1.72), (8.0, 0.88), (8.55, 0.08)]
    if x <= samples[0][0]:
        return samples[0][1]
    if x >= samples[-1][0]:
        return samples[-1][1]
    for (x0, b0), (x1, b1) in zip(samples, samples[1:]):
        if x0 <= x <= x1:
            t = (x - x0) / (x1 - x0)
            return b0 + (b1 - b0) * t
    return HALF_BEAM


def hull_section(x: float) -> list[tuple[float, float, float]]:
    b = hull_half_beam(x)
    t = (x + HALF_LENGTH) / LENGTH_M
    bottom = 0.12 + 0.54 * abs(0.5 - t) ** 1.55
    chine = bottom + 0.48 + 0.10 * (1.0 - abs(0.5 - t) * 2.0)
    sheer = 1.62 + 0.50 * max(0.0, (x - 6.0) / 2.55) + 0.12 * max(0.0, (-x - 6.5) / 2.0)
    return [
        (-b * 0.98, sheer, x),
        (-b * 0.96, chine, x),
        (-b * 0.78, bottom + 0.12, x),
        (0.0, bottom, x),
        (b * 0.78, bottom + 0.12, x),
        (b * 0.96, chine, x),
        (b * 0.98, sheer, x),
    ]


def build_hull(m: dict[str, bpy.types.Material]) -> None:
    xs = [-8.55, -8.25, -7.55, -6.2, -4.0, -1.0, 2.0, 4.7, 5.8, 7.1, 8.0, 8.55]
    # The section helper is ordered port-to-starboard but stored as x/y/z.
    verts: list[tuple[float, float, float]] = []
    for x in xs:
        verts.extend([(px, xz, xx) for px, xz, xx in hull_section(x)])
    faces: list[tuple[int, ...]] = []
    n = 7
    for i in range(len(xs) - 1):
        for j in range(n - 1):
            a = i * n + j
            faces.append((a, a + 1, a + 1 + n, a + n))
    faces.append(tuple(range(n - 1, -1, -1)))
    last = (len(xs) - 1) * n
    faces.append(tuple(last + j for j in range(n)))
    # convert the deliberately readable section tuples from (y,z,x) to (x,y,z)
    verts = [(x, y, z) for y, z, x in verts]
    make_mesh("Hull custom fairing", verts, faces, m["hull"], f"{CANONICAL_ID}.hull", "structure",
              fidelity="reference-informed", purpose="single authored outer hull shell; dimensions target official LOA/beam")


def make_side_window(side: float, m: dict[str, bpy.types.Material]) -> None:
    xs = [-5.8, -3.7, -1.3, 1.4, 4.2, 5.65]
    verts: list[tuple[float, float, float]] = []
    for x in xs:
        y = side * (hull_half_beam(x) + 0.018)
        bottom = 1.22 + 0.04 * max(0.0, (x + 3.0) / 8.0)
        top = 1.62 + 0.10 * max(0.0, (x + 2.0) / 7.0)
        verts.extend([(x, y, bottom), (x + 0.04, y, top)])
    faces = []
    for i in range(len(xs) - 1):
        face = (i * 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
        faces.extend([face, tuple(reversed(face))])
    make_mesh(f"{'Starboard' if side > 0 else 'Port'} hull-side glazing", verts, faces, m["glass"],
              f"{CANONICAL_ID}.glazing", "structure", purpose="long dark hull-side window band")


def build_decks_and_exterior(m: dict[str, bpy.types.Material]) -> None:
    hull_id = f"{CANONICAL_ID}.hull"
    deck_id = f"{CANONICAL_ID}.main-deck"
    # Main walking surface keeps the bow taper visible instead of hiding it in a block.
    make_prism("Main teak deck", [(-7.72, -1.88), (-7.72, 1.88), (-1.1, 2.17), (3.7, 1.72),
                                   (8.42, 0.25), (8.42, -0.25), (3.7, -1.72), (-1.1, -2.17)],
               2.35, 2.43, m["teak"], deck_id, "structure", purpose="reference-informed main social deck", bevel=0.02)
    make_prism("Aft teak bathing platform", [(-8.55, -1.86), (-8.55, 1.86), (-7.68, 1.88), (-7.68, -1.88)],
               1.02, 1.16, m["teak"], deck_id, "structure", purpose="hydraulic bathing platform reference")
    make_prism("Foredeck sunpad", [(5.15, -1.46), (7.95, -0.64), (8.42, -0.22), (8.42, 0.22),
                                    (7.95, 0.64), (5.15, 1.46)], 2.43, 2.51, m["cloth_dark"],
               f"{CANONICAL_ID}.main-deck", "structure", purpose="bow sunpad silhouette")
    make_prism("Cockpit teak inset", [(-7.58, -1.82), (-7.58, 1.82), (-0.85, 2.05), (-0.85, -2.05)],
               2.45, 2.51, m["teak"], f"{CANONICAL_ID}.cockpit-wetbar", "structure", purpose="aft cockpit deck")
    # Chine accents are thin, following the hull rather than being extra hull shells.
    for side in (-1.0, 1.0):
        points = []
        for x in (-7.1, -4.0, 0.0, 3.8, 6.4):
            b = hull_half_beam(x) * 0.9
            points.append((x, side * b, 0.86 + 0.08 * max(0, x / 6.4)))
        for a, b in zip(points, points[1:]):
            cylinder_between("lower chine accent", a, b, 0.035, m["hull_lower"], hull_id, "structure",
                             decorative=True, purpose="single lower chine highlight")


def build_superstructure_and_glazing(m: dict[str, bpy.types.Material]) -> None:
    super_id = f"{CANONICAL_ID}.superstructure"
    glass_id = f"{CANONICAL_ID}.glazing"
    # Dark roof canopy with a tapered aft opening: a modeled surface, not a cube.
    make_prism("Hardtop canopy", [(-0.72, -1.62), (4.3, -1.62), (5.18, -1.22), (4.94, 1.22),
                                   (4.3, 1.62), (-0.72, 1.62)], 4.03, 4.18, m["navy"], super_id, "structure",
               purpose="signature low dark hardtop")
    # Side window panels are custom polygons following the hardtop silhouette.
    for side in (-1.0, 1.0):
        y = side * 1.585
        make_mesh(f"{'Starboard' if side > 0 else 'Port'} cabin side glazing",
                  [(-0.48, y, 2.68), (3.98, y, 2.68), (4.72, y, 3.83), (4.08, y, 3.96), (-0.35, y, 3.92)],
                  [(0, 1, 2, 3, 4), (4, 3, 2, 1, 0)], m["glass"], glass_id, "structure", purpose="side cabin glazing")
        # The production boat uses a long glazed side with deliberate frame
        # breaks. These slender mullions prevent the canopy from reading as a
        # single black box in the app while keeping the glazing one assembly.
        for x in (0.55, 2.15, 3.55):
            make_box("cabin side glazing mullion", (x, y + side * 0.018, 3.30), (0.045, 0.075, 1.05),
                     m["metal"], super_id, "structure", decorative=True, purpose="side glazing frame", bevel=0.012)
        make_box("cabin lower glazing sill", (1.90, y + side * 0.020, 2.56), (4.60, 0.08, 0.10),
                 m["hull"], super_id, "structure", decorative=True, purpose="continuous cabin shoulder", bevel=0.025)
        # A pale frame at the side window aft edge gives the reference window break.
        make_box("side window aft mullion", (4.02, y + side * 0.018, 3.29), (0.055, 0.07, 1.18),
                  m["metal"], super_id, "structure", decorative=True, purpose="window frame")
    # Sloped forward windscreen: port and starboard panels, with a central mullion.
    for side in (-1.0, 1.0):
        y0 = side * 1.50
        y1 = side * 1.16
        make_mesh(f"{'Starboard' if side > 0 else 'Port'} forward windscreen",
                  [(4.78, y0, 2.72), (5.36, y1, 2.82), (4.95, y1, 3.91), (4.43, y0, 3.83)],
                  [(0, 1, 2, 3)], m["glass"], glass_id, "structure", purpose="sloped forward windshield")
    make_box("windshield central mullion", (5.18, 0.0, 3.35), (0.07, 0.08, 1.15), m["metal"], super_id,
             "structure", decorative=True, purpose="forward windscreen frame")
    # Four dark support posts define the open cockpit boundary.
    for x, y in [(-0.53, -1.60), (-0.53, 1.60), (4.45, -1.48), (4.45, 1.48)]:
        make_box("hardtop support", (x, y, 3.37), (0.12, 0.11, 1.4), m["navy"], super_id, "structure",
                 decorative=True, purpose="hardtop structural support")
    # A simple low radar/antenna pod preserves the top-line silhouette.
    make_box("radar pod", (2.2, 0.0, 4.38), (0.72, 0.28, 0.12), m["navy"], super_id, "structure",
             decorative=True, purpose="hardtop radar pod", bevel=0.04)
    cylinder_between("antenna", (2.2, 0.0, 4.43), (2.2, 0.0, 4.84), 0.018, m["metal"], super_id, "structure",
                     decorative=True, purpose="short antenna")


def build_cockpit_helm_and_rails(m: dict[str, bpy.types.Material]) -> None:
    cockpit_id = f"{CANONICAL_ID}.cockpit-wetbar"
    helm_id = f"{CANONICAL_ID}.helm"
    safety_id = f"{CANONICAL_ID}.safety"
    mooring_id = f"{CANONICAL_ID}.mooring"
    # Wet bar is centered in the aft cockpit, with a dark worktop and warm wood fascia.
    make_box("central wet bar fascia", (-4.0, 0.0, 2.9), (1.45, 1.08, 0.82), m["wood"], cockpit_id,
             "structure", purpose="reference-informed central cockpit wet bar", bevel=0.09)
    make_box("central wet bar worktop", (-4.0, 0.0, 3.34), (1.55, 1.16, 0.10), m["ceramic"], cockpit_id,
             "structure", purpose="wet bar counter", bevel=0.04)
    make_cylinder("wet bar sink", (-4.0, 0.25, 3.43), 0.22, 0.08, m["metal"], cockpit_id, "structure",
                  vertices=20, purpose="wet bar sink")
    for y in (-1.35, 1.35):
        make_box("cockpit side bench", (-5.2, y, 2.82), (2.1, 0.55, 0.35), m["cloth_dark"], cockpit_id,
                 "structure", purpose="aft cockpit seating", bevel=0.08)
    # Helm console and two seats sit behind the windshield.
    make_prism("helm console", [(2.3, -1.18), (3.46, -1.18), (3.55, -0.68), (2.43, -0.68)],
               2.48, 3.03, m["navy"], helm_id, "navigation", interior=True, purpose="starboard helm console")
    make_box("helm dash", (3.02, -0.95, 3.12), (1.0, 0.10, 0.15), m["metal"], helm_id, "navigation",
             interior=True, purpose="instrument fascia", bevel=0.03)
    # Small independent instrument details give the mobile LOD a real reduction
    # target without removing the helm's structural console or seating.
    make_box("helm display bezel", (2.78, -1.065, 3.20), (0.30, 0.035, 0.18), m["metal"], helm_id, "navigation",
             interior=True, decorative=True, purpose="helm multifunction display bezel", bevel=0.02)
    make_box("helm display glass", (2.78, -1.087, 3.20), (0.23, 0.018, 0.12), m["glass"], helm_id, "navigation",
             interior=True, decorative=True, purpose="helm multifunction display screen", bevel=0.01)
    make_box("helm switch bank", (3.22, -1.065, 3.17), (0.22, 0.035, 0.10), m["accent"], helm_id, "navigation",
             interior=True, decorative=True, purpose="helm switch bank", bevel=0.01)
    make_torus("helm wheel", (2.72, -1.06, 3.3), 0.23, 0.035, m["metal"], helm_id, "navigation",
               interior=True, rotation=(math.radians(90), 0.0, 0.0), purpose="steering wheel")
    for x in (2.0, 3.55):
        make_box("helm seat", (x, -0.98, 2.83), (0.48, 0.52, 0.72), m["cloth"], helm_id, "navigation",
                 interior=True, purpose="helm seating", bevel=0.07)
    # Low safety rails and cleats are deliberately sparse and functional.
    rail_points = [(-7.25, -1.92, 2.52), (0.1, -2.18, 2.58), (6.85, -1.15, 2.74), (8.35, -0.3, 2.84)]
    for a, b in zip(rail_points, rail_points[1:]):
        cylinder_between("port safety rail", a, b, 0.025, m["chrome"], safety_id, "safety", decorative=True,
                         purpose="low side safety rail")
    rail_points = [(x, -y, z) for x, y, z in rail_points]
    for a, b in zip(rail_points, rail_points[1:]):
        cylinder_between("starboard safety rail", a, b, 0.025, m["chrome"], safety_id, "safety", decorative=True,
                         purpose="low side safety rail")
    for x, y in [(-7.35, -1.45), (-7.35, 1.45), (7.72, -0.52), (7.72, 0.52)]:
        make_box("mooring cleat", (x, y, 2.68), (0.34, 0.10, 0.07), m["chrome"], mooring_id, "mooring",
                 decorative=True, purpose="deck mooring cleat", bevel=0.02)
    make_torus("aft safety life ring", (-7.55, 0.0, 2.25), 0.34, 0.07, m["accent"], safety_id, "safety",
               purpose="visible safety equipment")


def build_lower_deck_and_rooms(m: dict[str, bpy.types.Material]) -> None:
    lower_id = f"{CANONICAL_ID}.lower-deck"
    master_id = f"{CANONICAL_ID}.master-cabin"
    vip_id = f"{CANONICAL_ID}.vip-cabin"
    lobby_id = f"{CANONICAL_ID}.lobby-galley"
    engine_room_id = f"{CANONICAL_ID}.engine-room"
    # Approximate reconstructed lower-deck envelope and partial partitions.
    make_prism("Lower accommodation floor", [(-6.7, -1.7), (-6.7, 1.7), (5.8, 1.7), (6.45, 0.45),
                                              (6.45, -0.45), (5.8, -1.7)], 0.74, 0.82, m["teak_dark"],
               lower_id, "structure", interior=True, fidelity="reconstructed", purpose="reconstructed lower-deck floor")
    make_box("lower-deck port side envelope", (-0.15, -1.76, 1.48), (11.5, 0.10, 1.45), m["wood"], lower_id,
             "structure", interior=True, fidelity="reconstructed", purpose="reconstructed lower-deck side lining")
    make_box("lower-deck starboard side envelope", (-0.15, 1.76, 1.48), (11.5, 0.10, 1.45), m["wood"], lower_id,
             "structure", interior=True, fidelity="reconstructed", purpose="reconstructed lower-deck side lining")
    # Master cabin aft, with clear berth, headboard and side furniture.
    make_box("master bed base", (-3.7, 0.0, 1.01), (2.55, 1.58, 0.20), m["wood"], master_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed master berth", bevel=0.05)
    make_box("master mattress", (-3.7, 0.0, 1.17), (2.40, 1.45, 0.18), m["cloth"], master_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed master mattress", bevel=0.09)
    make_box("master headboard", (-4.92, 0.0, 1.69), (0.14, 1.58, 1.10), m["wood"], master_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed master headboard", bevel=0.03)
    for y in (-1.06, 1.06):
        make_box("master nightstand", (-2.75, y, 1.24), (0.45, 0.34, 0.42), m["wood"], master_id, "accommodation",
                 interior=True, fidelity="reconstructed", purpose="reconstructed master bedside furniture", bevel=0.04)
        make_box("master wardrobe", (-1.56, y, 1.48), (0.35, 0.55, 1.25), m["wood"], master_id, "accommodation",
                 interior=True, fidelity="reconstructed", purpose="reconstructed master storage", bevel=0.03)
    # Master en-suite vanity and sanitary fixtures.
    make_box("master vanity", (-1.1, 1.05, 1.20), (0.9, 0.38, 0.68), m["wood"], master_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed master en-suite vanity", bevel=0.04)
    make_cylinder("master basin", (-1.1, 1.25, 1.57), 0.15, 0.08, m["ceramic"], master_id, "accommodation",
                  interior=True, purpose="reconstructed master basin")
    make_box("master shower screen", (-0.8, -1.05, 1.65), (0.04, 1.15, 1.30), m["glass"], master_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed en-suite shower screen")
    # Forward VIP, with an angled bed impression and simple built-ins.
    make_box("VIP bed base", (4.32, 0.0, 1.01), (1.78, 1.42, 0.20), m["wood"], vip_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed VIP berth", bevel=0.05)
    make_box("VIP mattress", (4.32, 0.0, 1.17), (1.66, 1.30, 0.18), m["cloth"], vip_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed VIP mattress", bevel=0.08)
    make_box("VIP headboard", (5.18, 0.0, 1.68), (0.12, 1.42, 1.05), m["wood"], vip_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed VIP headboard", bevel=0.03)
    for y in (-0.91, 0.91):
        make_box("VIP bedside table", (3.65, y, 1.25), (0.34, 0.30, 0.36), m["wood"], vip_id, "accommodation",
                 interior=True, fidelity="reconstructed", purpose="reconstructed VIP bedside furniture", bevel=0.03)
    make_box("VIP wardrobe", (5.6, 0.78, 1.48), (0.32, 0.52, 1.20), m["wood"], vip_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed VIP storage", bevel=0.03)
    make_box("VIP vanity", (5.55, -0.82, 1.18), (0.72, 0.34, 0.62), m["wood"], vip_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed VIP en-suite vanity", bevel=0.04)
    # Lobby/galley sits between the cabins; keep a sightline from the stair into it.
    make_box("galley base", (0.65, 1.18, 1.15), (2.30, 0.42, 0.70), m["wood"], lobby_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed lower lobby galley", bevel=0.05)
    make_box("galley countertop", (0.65, 1.18, 1.54), (2.42, 0.50, 0.10), m["ceramic"], lobby_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed galley worktop", bevel=0.03)
    make_cylinder("galley sink", (0.20, 1.18, 1.62), 0.14, 0.08, m["metal"], lobby_id, "accommodation",
                  interior=True, purpose="reconstructed galley sink")
    make_box("lobby settee", (0.65, -1.06, 1.15), (2.15, 0.54, 0.62), m["cloth_dark"], lobby_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed lobby settee", bevel=0.09)
    make_box("lobby table", (0.65, -0.44, 1.52), (1.55, 0.42, 0.10), m["wood"], lobby_id, "accommodation",
             interior=True, fidelity="reconstructed", purpose="reconstructed lobby table", bevel=0.03)
    # Stairs and lower-deck threshold connect the reconstructed rooms to the main deck.
    for i in range(4):
        make_box("lower stair", (2.25 - i * 0.22, 0.0, 1.02 + i * 0.22), (0.20, 1.05, 0.12), m["teak"],
                 lower_id, "structure", interior=True, fidelity="reconstructed", purpose="reconstructed stair to main deck", bevel=0.02)
    # Engine room sits aft of the master, visible through the stern access in room view.
    make_box("engine-room sole", (-6.1, 0.0, 0.87), (1.75, 2.40, 0.10), m["rubber"], engine_room_id, "propulsion",
             interior=True, fidelity="reconstructed", purpose="reconstructed engine room sole")
    make_box("engine-room bulkhead", (-5.15, 0.0, 1.55), (0.10, 2.48, 1.25), m["wood"], engine_room_id, "propulsion",
             interior=True, fidelity="reconstructed", purpose="reconstructed engine room separation")


def build_propulsion_services(m: dict[str, bpy.types.Material]) -> None:
    engine_id = f"{CANONICAL_ID}.engines"
    drives_id = f"{CANONICAL_ID}.drives"
    fuel_id = f"{CANONICAL_ID}.fuel"
    electrical_id = f"{CANONICAL_ID}.electrical"
    ventilation_id = f"{CANONICAL_ID}.ventilation"
    safety_id = f"{CANONICAL_ID}.safety"
    # Two compact engine blocks; the IPS pods remain the recognizable propulsion cue.
    for y in (-0.78, 0.78):
        make_box("Volvo Penta engine block", (-6.18, y, 1.24), (1.35, 0.58, 0.62), m["engine"], engine_id,
                 "propulsion", interior=True, fidelity="reference-informed", purpose="twin IPS 950 engine reference", bevel=0.08)
        make_cylinder("engine turbo housing", (-6.45, y, 1.58), 0.16, 0.45, m["metal"], engine_id, "propulsion",
                      interior=True, vertices=16, rotation=(0.0, math.radians(90), 0.0), purpose="engine equipment")
        make_box("engine service stripe", (-6.0, y, 1.58), (0.62, 0.61, 0.07), m["accent"], engine_id, "propulsion",
                 interior=True, decorative=True, purpose="engine visual service marking")
        # IPS pods below the hull; no cargo/ballast is invented.
        make_cylinder("IPS pod", (-6.62, y, 0.48), 0.24, 0.70, m["metal"], drives_id, "propulsion",
                      vertices=20, rotation=(0.0, math.radians(90), 0.0), purpose="Volvo IPS pod drive")
        make_box("IPS pod fairing", (-6.72, y, 0.72), (0.48, 0.34, 0.34), m["hull_lower"], drives_id, "propulsion",
                 decorative=True, purpose="pod fairing")
    # Fuel tanks, electrical board and ventilation trunks are modest, plausible service equipment.
    for y in (-1.2, 1.2):
        make_box("fuel tank", (-4.9, y, 0.92), (1.05, 0.42, 0.52), m["metal"], fuel_id, "fuel", interior=True,
                 fidelity="reconstructed", purpose="reconstructed fuel tank envelope", bevel=0.06)
    make_box("electrical distribution board", (-5.25, 1.37, 1.70), (0.55, 0.12, 0.75), m["navy"], electrical_id,
             "electrical", interior=True, fidelity="reconstructed", purpose="reconstructed electrical service board", bevel=0.03)
    for y in (-1.30, 1.30):
        make_cylinder("engine ventilation trunk", (-5.2, y, 2.02), 0.11, 0.90, m["metal"], ventilation_id,
                      "utilities", interior=True, vertices=16, rotation=(0.0, math.radians(90), 0.0),
                      purpose="reconstructed engine-room ventilation trunk")
    make_cylinder("fire extinguisher", (-4.55, -1.35, 1.45), 0.10, 0.58, m["accent"], safety_id, "safety",
                  interior=True, vertices=16, rotation=(0.0, 0.0, math.radians(90)), purpose="visible engine-room safety equipment")


def component_specs() -> list[dict]:
    """Component declarations; positions/sizes are overwritten by actual AABB bounds later."""
    def shape_for(suffix: str) -> str:
        return {
            "hull": "hull", "main-deck": "deck", "lower-deck": "deck",
            "superstructure": "chamferedBox", "glazing": "chamferedBox",
            "drives": "cylinder", "engines": "cylinder", "safety": "cylinder", "mooring": "cylinder",
        }.get(suffix, "box")

    def c(suffix, name, system, parent, color, interior, decorative, fidelity, purpose, *, enclosure=None, deck_id=None, room_id=None):
        return {
            "id": f"{CANONICAL_ID}.{suffix}", "vesselId": CANONICAL_ID, "name": name, "systemId": system,
            "assembly": suffix, "parentId": parent, "shape": shape_for(suffix), "position": [0.0, 0.0, 0.0],
            "size": [1.0, 1.0, 1.0], "rotation": [0.0, 0.0, 0.0], "color": color,
            "explode": [0.0, 0.0, 0.0], "localExplode": [0.0, 0.0, 0.0], "interior": interior,
            "decorative": decorative, "fidelity": fidelity, "purpose": purpose, "sourceIds": SOURCE_IDS,
            **({"enclosure": enclosure} if enclosure else {}), **({"deckId": deck_id} if deck_id else {}),
            **({"roomId": room_id} if room_id else {}),
        }
    return [
        c("hull", "Hull shell", "structure", None, "#d8e0e4", False, False, "reference-informed", "single outer hull shell with official LOA/beam target", enclosure="shell"),
        c("superstructure", "Hardtop superstructure", "structure", f"{CANONICAL_ID}.hull", "#0d1f31", False, False, "reference-informed", "low hardtop and structural framing", enclosure="shell"),
        c("glazing", "Hull and cabin glazing", "structure", f"{CANONICAL_ID}.hull", "#0d344f", False, False, "reference-informed", "long hull windows and forward/side cabin glass", enclosure="envelope"),
        c("main-deck", "Main deck", "structure", f"{CANONICAL_ID}.hull", "#9c5429", False, False, "reference-informed", "main walking deck and foredeck", enclosure="shell", deck_id="main"),
        c("cockpit-wetbar", "Aft cockpit and wet bar", "structure", f"{CANONICAL_ID}.main-deck", "#5e2b17", False, False, "reference-informed", "central wet bar, cockpit furniture and teak inset", enclosure="equipment", deck_id="main"),
        c("lower-deck", "Lower deck envelope", "structure", f"{CANONICAL_ID}.hull", "#32170c", True, False, "reconstructed", "reconstructed lower-deck floor, lining, partitions and stairs", enclosure="envelope", deck_id="lower"),
        c("master-cabin", "Owner master cabin", "accommodation", f"{CANONICAL_ID}.lower-deck", "#80613e", True, False, "reconstructed", "furnished aft master cabin with en-suite approximation", enclosure="envelope", deck_id="lower", room_id="master"),
        c("vip-cabin", "Forward VIP cabin", "accommodation", f"{CANONICAL_ID}.lower-deck", "#80613e", True, False, "reconstructed", "furnished forward VIP cabin with en-suite approximation", enclosure="envelope", deck_id="lower", room_id="vip"),
        c("lobby-galley", "Lower lobby and galley", "accommodation", f"{CANONICAL_ID}.lower-deck", "#8a5a32", True, False, "reconstructed", "reconstructed central lobby/galley and settee", enclosure="equipment", deck_id="lower", room_id="lobby"),
        c("engine-room", "Engine room envelope", "propulsion", f"{CANONICAL_ID}.lower-deck", "#20272c", True, False, "reconstructed", "reconstructed aft service space", enclosure="envelope", deck_id="lower", room_id="engine-room"),
        c("engines", "Twin Volvo Penta IPS 950 engines", "propulsion", f"{CANONICAL_ID}.engine-room", "#1f2426", True, False, "reference-informed", "twin engine blocks and service details", enclosure="equipment", deck_id="lower", room_id="engine-room"),
        c("drives", "Twin IPS pod drives", "propulsion", f"{CANONICAL_ID}.hull", "#9ca7aa", False, False, "reference-informed", "twin Volvo IPS pod assemblies", enclosure="equipment"),
        c("helm", "Helm station", "navigation", f"{CANONICAL_ID}.superstructure", "#101820", True, False, "reference-informed", "helm console, wheel and seats", enclosure="equipment", deck_id="main"),
        c("electrical", "Electrical distribution", "electrical", f"{CANONICAL_ID}.engine-room", "#14232f", True, False, "reconstructed", "reconstructed service board", enclosure="equipment", deck_id="lower", room_id="engine-room"),
        c("fuel", "Fuel tanks", "fuel", f"{CANONICAL_ID}.engine-room", "#555e63", True, False, "reconstructed", "reconstructed fuel tank envelopes", enclosure="equipment", deck_id="lower", room_id="engine-room"),
        c("ventilation", "Engine-room ventilation", "utilities", f"{CANONICAL_ID}.engine-room", "#7c8587", True, False, "reconstructed", "reconstructed ventilation trunks", enclosure="equipment", deck_id="lower", room_id="engine-room"),
        c("safety", "Safety equipment and rails", "safety", f"{CANONICAL_ID}.main-deck", "#c0c9cb", False, False, "reference-informed", "sparse rails, life ring and fire extinguisher", enclosure="equipment", deck_id="main"),
        c("mooring", "Mooring fittings", "mooring", f"{CANONICAL_ID}.main-deck", "#c0c9cb", False, False, "reference-informed", "four visible deck cleats", enclosure="equipment", deck_id="main"),
    ]


def bounds_for_component(component_id: str) -> tuple[Vector, Vector]:
    objects = OBJECTS_BY_COMPONENT.get(component_id, [])
    if not objects:
        return Vector((-0.01, -0.01, 0.01)), Vector((0.01, 0.01, 0.01))
    bpy.context.view_layer.update()
    points: list[Vector] = []
    for obj in objects:
        if obj.type not in {"MESH", "CURVE", "SURFACE"}:
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not points:
        return Vector((-0.01, -0.01, 0.01)), Vector((0.01, 0.01, 0.01))
    min_v = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    max_v = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return min_v, max_v


def build_manifest() -> dict:
    specs = component_specs()
    for component in specs:
        min_v, max_v = bounds_for_component(component["id"])
        center = (min_v + max_v) * 0.5
        size = max_v - min_v
        component["position"] = gltf_vec(center)
        component["size"] = [round(float(size.x), 4), round(float(size.z), 4), round(float(size.y), 4)]
    return {
        "vesselId": CANONICAL_ID,
        "version": 2,
        "units": "metres",
        "components": specs,
        "meaningfulCount": sum(not c["decorative"] for c in specs),
        "lods": [],
        # Lead exporter fills these after verifying GLB bytes and hashes.
        "assets": [],
        "decks": [
            {"id": "main", "name": "Main deck", "componentId": f"{CANONICAL_ID}.main-deck"},
            {"id": "lower", "name": "Lower deck", "componentId": f"{CANONICAL_ID}.lower-deck"},
        ],
        "rooms": [
            {"id": "master", "name": "Owner master cabin", "deckId": "lower", "componentId": f"{CANONICAL_ID}.master-cabin", "fidelity": "reconstructed", "note": "Furnished lower cabin reconstructed from official two-cabin evidence; exact joinery and proportions are not published.", "sourceIds": [OFFICIAL_PAGE, INDEPENDENT_REVIEW]},
            {"id": "vip", "name": "Forward VIP cabin", "deckId": "lower", "componentId": f"{CANONICAL_ID}.vip-cabin", "fidelity": "reconstructed", "note": "Furnished forward guest cabin reconstructed from official and independent descriptions.", "sourceIds": [OFFICIAL_PAGE, INDEPENDENT_REVIEW]},
            {"id": "lobby", "name": "Lower lobby and galley", "deckId": "lower", "componentId": f"{CANONICAL_ID}.lobby-galley", "fidelity": "reconstructed", "note": "Central lower-deck lobby/galley approximation; brochure plan is reference-informed but not dimensioned in the source text.", "sourceIds": [OFFICIAL_PAGE, OFFICIAL_BROCHURE, INDEPENDENT_REVIEW]},
            {"id": "engine-room", "name": "Aft engine room", "deckId": "lower", "componentId": f"{CANONICAL_ID}.engine-room", "fidelity": "reconstructed", "note": "Service-space approximation for the twin IPS 950 installation; exact machinery arrangement is hull-specific.", "sourceIds": [OFFICIAL_PAGE, INDEPENDENT_REVIEW]},
        ],
        "cameras": camera_metadata(),
        "fidelity": "Original reference-informed Superhawk 55 reconstruction: exterior distinctive body and glazing are model-specific; lower-deck furnishings and service systems are clearly reconstructed approximations.",
    }


def camera_metadata() -> list[dict]:
    specs = [
        ("exterior-starboard-3q", "Exterior starboard three-quarter", (13.0, -13.0, 7.0), (0.0, 0.0, 2.0), None, "main"),
        ("exterior-port-3q", "Exterior port three-quarter", (13.0, 13.0, 7.0), (0.0, 0.0, 2.0), None, "main"),
        ("exterior-bow", "Exterior bow", (14.0, 0.0, 4.8), (2.0, 0.0, 2.0), None, "main"),
        ("exterior-stern", "Exterior stern", (-14.0, 0.0, 4.2), (-2.0, 0.0, 1.9), None, "main"),
        ("exterior-profile", "Exterior starboard profile", (0.0, -18.0, 4.4), (0.0, 0.0, 2.0), None, "main"),
        ("exterior-high", "Exterior high oblique", (4.0, -12.0, 13.0), (0.0, 0.0, 1.5), None, "main"),
        ("exterior-below", "Exterior below hull", (-1.0, 2.0, -8.0), (0.0, 0.0, 0.2), None, "lower"),
        ("exterior-cockpit", "Exterior cockpit and wet bar", (-7.0, -8.0, 4.4), (-4.0, 0.0, 2.5), None, "main"),
        ("room-master", "Room view: owner master", (-5.8, -2.4, 2.5), (-2.8, 0.0, 1.25), "master", "lower"),
        ("room-vip", "Room view: forward VIP", (2.3, -2.4, 2.5), (4.7, 0.0, 1.25), "vip", "lower"),
        ("room-lobby", "Room view: lower lobby and galley", (-1.8, -2.4, 2.5), (0.6, 0.0, 1.2), "lobby", "lower"),
        ("room-engine-room", "Room view: aft engine room", (-7.8, -2.6, 2.6), (-5.6, 0.0, 1.3), "engine-room", "lower"),
    ]
    return [{"id": cid, "name": name, "position": gltf_vec(pos), "target": gltf_vec(target), **({"roomId": room} if room else {}), **({"deckId": deck} if deck else {})}
            for cid, name, pos, target, room, deck in specs]


def point_camera(camera: bpy.types.Object, position: tuple[float, float, float], target: tuple[float, float, float]) -> None:
    camera.location = position
    direction = Vector(target) - Vector(position)
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    if camera.type == "CAMERA":
        camera.data.lens = 48
        camera.data.sensor_width = 36
        camera.data.clip_start = 0.02
        camera.data.clip_end = 200.0


def build_cameras_and_lights() -> dict[str, bpy.types.Object]:
    for obj in list(bpy.context.scene.objects):
        if obj.type in {"CAMERA", "LIGHT"}:
            bpy.data.objects.remove(obj, do_unlink=True)
    camera_specs = [
        ("exterior-starboard-3q", (13.0, -13.0, 7.0), (0.0, 0.0, 2.0)),
        ("exterior-port-3q", (13.0, 13.0, 7.0), (0.0, 0.0, 2.0)),
        ("exterior-bow", (14.0, 0.0, 4.8), (2.0, 0.0, 2.0)),
        ("exterior-stern", (-14.0, 0.0, 4.2), (-2.0, 0.0, 1.9)),
        ("exterior-profile", (0.0, -18.0, 4.4), (0.0, 0.0, 2.0)),
        ("exterior-high", (4.0, -12.0, 13.0), (0.0, 0.0, 1.5)),
        ("exterior-below", (-1.0, 2.0, -8.0), (0.0, 0.0, 0.2)),
        ("exterior-cockpit", (-7.0, -8.0, 4.4), (-4.0, 0.0, 2.5)),
        ("room-master", (-5.8, -2.4, 2.5), (-2.8, 0.0, 1.25)),
        ("room-vip", (2.3, -2.4, 2.5), (4.7, 0.0, 1.25)),
        ("room-lobby", (-1.8, -2.4, 2.5), (0.6, 0.0, 1.2)),
        ("room-engine-room", (-7.8, -2.6, 2.6), (-5.6, 0.0, 1.3)),
    ]
    cameras: dict[str, bpy.types.Object] = {}
    for name, pos, target in camera_specs:
        data = bpy.data.cameras.new(name)
        camera = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(camera)
        point_camera(camera, pos, target)
        cameras[name] = camera
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("Superhawk 55 review world")
        bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.008, 0.018, 0.032, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.32
    def area(name, location, energy, size, color):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(obj)
        point_camera(obj, location, (0.0, 0.0, 1.4))
    area("key warm", (5.0, -8.0, 11.0), 1500, 8.0, (1.0, 0.84, 0.68))
    area("fill cool", (-8.0, 7.0, 7.0), 1000, 10.0, (0.56, 0.72, 1.0))
    area("interior soft", (0.0, 0.0, 5.0), 1200, 5.0, (1.0, 0.72, 0.50))
    area("engine room fill", (-6.2, -2.0, 3.4), 2200, 3.0, (0.78, 0.88, 1.0))
    sun_data = bpy.data.lights.new("sun", "SUN")
    sun_data.energy = 1.6
    sun = bpy.data.objects.new("sun", sun_data)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(28), math.radians(-25), math.radians(-32))
    return cameras


def render_review(cameras: dict[str, bpy.types.Object], *, no_render: bool) -> list[str]:
    REVIEW_PATH.mkdir(parents=True, exist_ok=True)
    if no_render:
        return []
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(REVIEW_PATH / "placeholder.png")
    outputs: list[str] = []
    for name, camera in cameras.items():
        scene.camera = camera
        path = REVIEW_PATH / f"{name}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        outputs.append(str(path.relative_to(ROOT)))
    return outputs


def make_report(manifest: dict, render_outputs: list[str]) -> dict:
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type in {"MESH", "CURVE", "SURFACE"} and not obj.hide_render]
    return {
        "canonicalId": CANONICAL_ID,
        "masterPath": str(MASTER_PATH.relative_to(ROOT)),
        "renderDirectory": str(REVIEW_PATH.relative_to(ROOT)),
        "dimensionsTarget": {"lengthM": LENGTH_M, "beamM": BEAM_M, "draftM": DRAFT_M},
        "manifest": {"version": manifest["version"], "assets": manifest["assets"], "componentCount": len(manifest["components"]), "meaningfulCount": manifest["meaningfulCount"]},
        "meshObjectCount": len(mesh_objects),
        "renderOutputs": render_outputs,
        "reviewStatus": "inspection required; this is not a release-quality certification",
        "limitations": [
            "Hull and exterior silhouette are reference-informed custom geometry, not a builder-supplied offsets model.",
            "Lower-deck room partitions and furnishings are reconstructed approximations from two-cabin/interior descriptions and plan evidence.",
            "Exact optional hardtop, tender and hull-specific furniture configurations are not asserted.",
            "Manifest assets are intentionally empty until the lead exporter writes verified GLB bytes and hashes.",
        ],
    }


def build_scene(*, replace: bool, no_render: bool) -> None:
    if MASTER_PATH.exists() and not replace:
        raise SystemExit(f"Refusing to overwrite {MASTER_PATH}; pass --replace to rebuild intentionally.")
    MASTER_PATH.parent.mkdir(parents=True, exist_ok=True)
    REVIEW_PATH.mkdir(parents=True, exist_ok=True)
    if MCP_SAFE:
        scene = bpy.data.scenes.get(MODEL) or bpy.data.scenes.new(MODEL)
        # MCP sessions keep scenes alive between executions. Rebuilding an
        # authoritative master must start from an empty vessel scene or prior
        # runs would duplicate geometry into the next export.
        for obj in list(scene.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        for child in list(scene.collection.children):
            scene.collection.children.unlink(child)
            if child.users == 0:
                bpy.data.collections.remove(child)
        for window in bpy.context.window_manager.windows:
            window.scene = scene
    else:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        scene = bpy.context.scene
        scene.name = MODEL
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.resolution_percentage = 100
    m = materials()
    build_hull(m)
    for side in (-1.0, 1.0):
        make_side_window(side, m)
    build_decks_and_exterior(m)
    build_superstructure_and_glazing(m)
    build_cockpit_helm_and_rails(m)
    build_lower_deck_and_rooms(m)
    build_propulsion_services(m)
    cameras = build_cameras_and_lights()
    manifest = build_manifest()
    scene["hullscopeManifest"] = json.dumps(manifest, separators=(",", ":"))
    scene["canonicalId"] = CANONICAL_ID
    scene["vesselId"] = CANONICAL_ID
    scene["brand"] = BRAND
    scene["model"] = MODEL
    scene["referenceDimensions"] = json.dumps({"lengthM": LENGTH_M, "beamM": BEAM_M, "draftM": DRAFT_M})
    scene["sourceCoordinateSystem"] = "Blender +X bow, +Y starboard, +Z up"
    scene["manifestCoordinateSystem"] = "glTF metres [x, z, -y]"
    scene["referenceDossier"] = str(ROOT / "research/yachts/sunseeker-superhawk-55-modeling.md")
    scene["fidelity"] = manifest["fidelity"]
    render_outputs = render_review(cameras, no_render=no_render)
    report = make_report(manifest, render_outputs)
    (REVIEW_PATH / "scene_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    metrics = {
        "vesselId": CANONICAL_ID,
        "masterPath": str(MASTER_PATH.relative_to(ROOT)),
        "semanticComponentCount": len(manifest["components"]),
        "meaningfulCount": manifest["meaningfulCount"],
        "triangleCountEvaluated": report.get("triangleCount", 0),
        "renderedViews": render_outputs,
        "selfReviewStatus": "not QA-approved",
        "draftNote": "Original reference-informed reconstruction; underwater fit and accommodation details remain subject to independent QA.",
    }
    (REVIEW_PATH / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    if MCP_SAFE:
        bpy.data.libraries.write(str(MASTER_PATH), {scene}, compress=True)
    else:
        bpy.ops.wm.save_as_mainfile(filepath=str(MASTER_PATH), compress=True)
    print(json.dumps({"master": str(MASTER_PATH.relative_to(ROOT)), "review": str(REVIEW_PATH.relative_to(ROOT)), "rendered": len(render_outputs), "components": len(manifest["components"]), "meshes": report["meshObjectCount"]}, indent=2))


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--replace", action="store_true", help="allow replacing the existing master")
    parser.add_argument("--no-render", action="store_true", help="skip review renders")
    return parser.parse_args(argv)


if __name__ == "__main__":
    args = parse_args()
    build_scene(replace=args.replace, no_render=args.no_render)
