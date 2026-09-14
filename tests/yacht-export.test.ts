import { describe, expect, it } from 'vitest';
import { Document } from '@gltf-transform/core';
import { assertEmbeddedGLB, inspectGeometry } from '../scripts/yachts/export';

function glb(json:unknown){
 const raw=JSON.stringify(json),padding=(4-Buffer.byteLength(raw)%4)%4,data=Buffer.from(raw+' '.repeat(padding)),buffer=Buffer.alloc(20+data.length);
 buffer.write('glTF');buffer.writeUInt32LE(2,4);buffer.writeUInt32LE(buffer.length,8);buffer.writeUInt32LE(data.length,12);buffer.writeUInt32LE(0x4e4f534a,16);data.copy(buffer,20);return buffer;
}
describe('authored export contract',()=>{
 it('rejects uncancellable external texture and buffer requests',()=>{
  expect(()=>assertEmbeddedGLB(glb({asset:{version:'2.0'},images:[{uri:'https://example.com/a.png'}]}))).toThrow(/embedded/);
  expect(()=>assertEmbeddedGLB(glb({asset:{version:'2.0'},buffers:[{uri:'a.bin'}]}))).toThrow(/embedded/);
  expect(()=>assertEmbeddedGLB(glb({asset:{version:'2.0'},images:[{bufferView:0,mimeType:'image/png'}]}))).not.toThrow();
 });
 it('measures actual world geometry across multiple render meshes per assembly',()=>{
  const document=new Document(),buffer=document.createBuffer(),scene=document.createScene(),material=document.createMaterial();
  const position=document.createAccessor().setType('VEC3').setBuffer(buffer).setArray(new Float32Array([0,0,0,1,0,0,0,1,0]));
  const normal=document.createAccessor().setType('VEC3').setBuffer(buffer).setArray(new Float32Array([0,0,1,0,0,1,0,0,1]));
  const mesh=document.createMesh().addPrimitive(document.createPrimitive().setAttribute('POSITION',position).setAttribute('NORMAL',normal).setMaterial(material));
  scene.addChild(document.createNode().setMesh(mesh).setTranslation([2,0,-1]).setExtras({componentId:'hull'}));
  scene.addChild(document.createNode().setMesh(mesh).setTranslation([4,3,1]).setScale([2,2,2]).setExtras({componentId:'hull'}));
  const result=inspectGeometry(document,['hull']);
  expect(result.renderMeshes).toBe(2);expect(result.triangles).toBe(2);expect(result.drawCalls).toBe(2);
  expect(result.bounds.get('hull')?.min.toArray()).toEqual([2,0,-1]);expect(result.bounds.get('hull')?.max.toArray()).toEqual([6,5,1]);
  expect(()=>inspectGeometry(document,['wrong'])).toThrow(/Undeclared/);
  expect(()=>inspectGeometry(document,['hull','missing'])).toThrow(/disappeared/);
 });
});
