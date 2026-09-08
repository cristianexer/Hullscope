import { test, expect, type Page } from '@playwright/test';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { BufferAttribute, BufferGeometry, DoubleSide, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three';
import { fleet } from '../../src/data/fleet';
import type { ModelManifest } from '../../src/data/schema';
import { modelPosition } from '../../src/viewer/positions';

interface CameraState {position:number[];target:number[];projection:number[];inverseWorld:number[]}
const sceneSelector='[data-scene-status]';
async function cameraState(page:Page):Promise<CameraState>{return JSON.parse((await page.locator(sceneSelector).getAttribute('data-camera-state'))!);}
async function ready(page:Page,id='ever-ace'){
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(`#/vessel/${id}`);
 await expect(page.locator(sceneSelector)).toHaveAttribute('data-loaded',id,{timeout:30000});
 await expect(page.locator(sceneSelector)).toHaveAttribute('data-camera-state',/projection/);
 await page.waitForTimeout(300);
}

// Independent unbatched GLB raycasting predicts the frontmost physical surface.
// It does not call the app's picking handler or use its selected-ID telemetry.
async function visibleTarget(page:Page,vesselId:string,name:RegExp,explode=0){
 const vessel=fleet.find(v=>v.id===vesselId)!;
 const manifest=await (await page.request.get(`models/${vesselId}.json`)).json() as ModelManifest;
 const lod=Number(await page.locator(sceneSelector).getAttribute('data-loaded-lod'));
 const binary=await (await page.request.get(manifest.lods[lod].url)).body();
 await MeshoptDecoder.ready;
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
 const assetDocument=await io.readBinary(binary);
 const parts=new Map(manifest.components.map(c=>[c.id,c]));
 const material=new MeshBasicMaterial({side:DoubleSide});
 const meshes:Mesh[]=[];
 for(const node of assetDocument.getRoot().listNodes()){
  const id=String(node.getExtras().componentId??''),part=parts.get(id);
  if(!part||(part.interior&&explode===0))continue;
  for(const primitive of node.getMesh()?.listPrimitives()??[]){
   const geometry=new BufferGeometry();
   geometry.setAttribute('position',new BufferAttribute(primitive.getAttribute('POSITION')!.getArray()!,3));
   const indices=primitive.getIndices()?.getArray();if(indices)geometry.setIndex(new BufferAttribute(indices,1));
   const mesh=new Mesh(geometry,material);mesh.userData={id,name:part.name};
   mesh.matrixAutoUpdate=false;mesh.matrix.fromArray(node.getWorldMatrix());
   mesh.matrix.setPosition(new Vector3(...modelPosition(part,explode,'vessel',null,undefined)));
   mesh.matrix.premultiply(new Matrix4().makeScale(100/vessel.length,100/vessel.length,100/vessel.length));mesh.updateMatrixWorld(true);meshes.push(mesh);
  }
 }
 try{
  const state=await cameraState(page),camera=new PerspectiveCamera();
  camera.position.fromArray(state.position);camera.projectionMatrix.fromArray(state.projection);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.matrixWorldInverse.fromArray(state.inverseWorld);camera.matrixWorld.copy(camera.matrixWorldInverse).invert();
  const canvas=await page.locator('canvas').boundingBox();expect(canvas).not.toBeNull();
  const raycaster=new Raycaster();
  for(const mesh of meshes.filter(m=>name.test(String(m.userData.name)))){
   mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox!;
   for(const local of [bounds.getCenter(new Vector3()),new Vector3(0,bounds.max.y,0),new Vector3(0,0,bounds.max.z)]){
    const projected=local.applyMatrix4(mesh.matrixWorld).project(camera);
    if(Math.abs(projected.x)>.95||Math.abs(projected.y)>.95)continue;
    raycaster.setFromCamera(new Vector2(projected.x,projected.y),camera);
    const hit=raycaster.intersectObjects(meshes,false)[0];
    if(hit?.object.userData.id!==mesh.userData.id)continue;
    const point={x:canvas!.x+(projected.x+1)*canvas!.width/2,y:canvas!.y+(1-projected.y)*canvas!.height/2};
    const unobstructed=await page.evaluate(point=>document.elementFromPoint(point.x,point.y)?.tagName==='CANVAS',point);
    if(unobstructed)return{...point,id:String(mesh.userData.id),name:String(mesh.userData.name)};
   }
  }
  throw new Error(`No independently visible GLB target for ${vesselId}/${name}`);
 }finally{meshes.forEach(m=>m.geometry.dispose());material.dispose();}
}

for(const [vesselId,piece]of [['ever-ace',/^Bay \d+ row \d+ tier \d+$/],['sparky',/Wheelhouse.*pane/],['black-pearl',/^(Foremast|Mainmast|Mizzen mast) [123] black sail$/]]as const){
 test(`${vesselId} canvas clicks inspect the frontmost rendered piece and background deselects`,{tag:'@smoke'},async({page})=>{
  await ready(page,vesselId);
  const target=await visibleTarget(page,vesselId,piece);
  await page.mouse.click(target.x,target.y);
  await expect(page.locator('.component-card h2')).toHaveText(target.name);
  await expect.poll(()=>page.evaluate(()=>new URLSearchParams(location.hash.split('?')[1]).get('part'))).toBe(target.id);
  const background=await page.locator('canvas').boundingBox();
  await page.mouse.click(background!.x+8,background!.y+8);
  await expect(page.locator('.component-card')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>new URLSearchParams(location.hash.split('?')[1]).get('part'))).toBeNull();
  await page.getByRole('slider',{name:'Disassembly amount'}).focus();await page.keyboard.press('End');
  await page.getByRole('button',{name:'Fit whole vessel',exact:true}).click();await page.waitForTimeout(300);
  const moved=await visibleTarget(page,vesselId,piece,100);
  await page.mouse.click(moved.x,moved.y);
  await expect(page.locator('.component-card h2')).toHaveText(moved.name);
  await expect.poll(()=>page.evaluate(()=>new URLSearchParams(location.hash.split('?')[1]).get('part'))).toBe(moved.id);
 });
}

test('disassembly keeps the chosen camera and explicit Fit preserves disassembly',{tag:'@smoke'},async({page})=>{
 await ready(page);
 const before=await cameraState(page);
 const slider=page.getByRole('slider',{name:'Disassembly amount'});
 await slider.focus();await page.keyboard.press('Home');for(let i=0;i<6;i++)await page.keyboard.press('PageUp');
 await expect(slider).toHaveAttribute('aria-valuenow','60');await page.waitForTimeout(300);
 const after=await cameraState(page);
 expect(new Vector3().fromArray(after.position).distanceTo(new Vector3().fromArray(before.position))).toBeLessThan(.02);
 expect(new Vector3().fromArray(after.target).distanceTo(new Vector3().fromArray(before.target))).toBeLessThan(.02);
 await page.getByRole('button',{name:'Fit whole vessel',exact:true}).click();
 await expect(slider).toHaveAttribute('aria-valuenow','60');
 await expect.poll(async()=>{const camera=await cameraState(page);return new Vector3().fromArray(camera.position).distanceTo(new Vector3().fromArray(camera.target));}).toBeGreaterThan(new Vector3().fromArray(before.position).distanceTo(new Vector3().fromArray(before.target)));
 await expect.poll(()=>page.evaluate(()=>{
  const scene=document.querySelector('[data-scene-status]')!,canvas=scene.querySelector('canvas')!.getBoundingClientRect();
  const [l,t,r,b]=JSON.parse(scene.getAttribute('data-model-bounds')!);return l>=-1&&t>=-1&&r<=canvas.width+1&&b<=canvas.height+1;
 })).toBe(true);
});

for(const viewport of [{width:1440,height:1000,minLabels:5},{width:390,height:844,minLabels:2}]){
 test(`expanded annotation pool stays readable and separated at ${viewport.width}px`,async({page})=>{
  await page.setViewportSize(viewport);await ready(page,'hms-defender');
  const toggle=page.getByRole('button',{name:'Labels',exact:true});
  if(await toggle.getAttribute('aria-pressed')==='false')await toggle.click();
  await expect.poll(()=>page.locator('.scene-label:visible').count()).toBeGreaterThanOrEqual(viewport.minLabels);
  const labels=await page.locator('.scene-label:visible').evaluateAll(elements=>elements.map(element=>{
   const r=element.getBoundingClientRect(),style=getComputedStyle(element);
   return {name:element.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,font:parseFloat(style.fontSize),filter:style.filter};
  }));
  const canvas=await page.locator('canvas').boundingBox();
  for(let i=0;i<labels.length;i++){
   const label=labels[i];expect(label.font).toBeGreaterThanOrEqual(12);expect(label.filter).toBe('none');
   expect(label.left).toBeGreaterThanOrEqual(canvas!.x-1);expect(label.right).toBeLessThanOrEqual(canvas!.x+canvas!.width+1);
   expect(label.top).toBeGreaterThanOrEqual(canvas!.y-1);expect(label.bottom).toBeLessThanOrEqual(canvas!.y+canvas!.height+1);
   for(const other of labels.slice(i+1))expect(label.left<other.right&&label.right>other.left&&label.top<other.bottom&&label.bottom>other.top,`${label.name} overlaps ${other.name}`).toBe(false);
  }
 });
}
