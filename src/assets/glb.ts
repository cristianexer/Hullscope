/** Ensure textures and buffers share the verified, cancellable runtime chunk. */
export function assertEmbeddedGLB(bytes:Uint8Array) {
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length<20||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==bytes.length)throw new Error('Malformed GLB.');
 const jsonLength=view.getUint32(12,true);
 if(view.getUint32(16,true)!==0x4e4f534a||20+jsonLength>bytes.length)throw new Error('Missing GLB JSON.');
 const json=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+jsonLength)));
 if((json.images??[]).some((image:{uri?:string;bufferView?:number})=>image.uri!==undefined||image.bufferView===undefined))throw new Error('Runtime textures must be embedded in the GLB.');
 if((json.buffers??[]).some((buffer:{uri?:string})=>buffer.uri!==undefined))throw new Error('Runtime buffers must be embedded in the GLB.');
 return json;
}
