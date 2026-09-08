"""Create editable Blender scenes from Hullscope's original semantic geometry.
Usage: blender --background --python scripts/blender-author.py -- [vessel-id|all]
GLBs in .tools/exchange are uncompressed authoring intermediates from models:build.
The .blend files are rebuildable; web models are independently compressed for delivery.
"""
import bpy, json, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['ever-ace']
ids = [p.stem for p in (root / '.tools/exchange').glob('*.glb')] if args[0] == 'all' else args
out = root / 'assets/authoring'
out.mkdir(parents=True, exist_ok=True)
for vessel_id in ids:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(root / '.tools/exchange' / f'{vessel_id}.glb'))
    manifest = json.loads((root / 'public/models' / f'{vessel_id}.json').read_text())
    by_id = {c['id']: c for c in manifest['components']}
    collections = {}
    for obj in list(bpy.context.scene.objects):
        component_id = obj.get('componentId')
        if component_id not in by_id:
            continue
        component = by_id[component_id]
        system = component['systemId']
        if system not in collections:
            collection = bpy.data.collections.new(system)
            bpy.context.scene.collection.children.link(collection)
            collections[system] = collection
        for existing in list(obj.users_collection):
            existing.objects.unlink(obj)
        collections[system].objects.link(obj)
        obj['componentId'] = component_id
        obj['displayName'] = component['name']
        obj['fidelity'] = component['fidelity']
        # glTF Y-up -> Blender Z-up. Keep both conventions explicit for round trips.
        obj['explodeVectorGltf'] = component['explode']
        obj['localExplodeGltf'] = component['localExplode']
        x, y, z = component['explode']
        obj['explodeVector'] = [x, -z, y]
        x, y, z = component['localExplode']
        obj['localExplode'] = [x, -z, y]
        obj['interior'] = component['interior']
        obj['semanticParent'] = component['parentId'] or ''
        obj['decorative'] = component['decorative']
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene['sourceCoordinateSystem'] = 'glTF metres, Y-up'
    bpy.context.scene['authoringCoordinateSystem'] = 'Blender metres, Z-up'
    bpy.context.scene['referenceDossier'] = str(root / 'docs/dossiers' / f'{vessel_id}.md')
    bpy.context.scene['vesselId'] = vessel_id
    bpy.context.scene['fidelity'] = 'Educational reconstruction; no verified hull offsets or internal arrangements.'
    bpy.ops.wm.save_as_mainfile(filepath=str(out / f'{vessel_id}.blend'), compress=True)
    print(f'HULLSCOPE_AUTHORING: {vessel_id}')
