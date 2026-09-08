import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { DriveMotion } from './Drive';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../state';
import type { VesselRecord } from '../data/schema';
import { SEA_GLSL, SEA_WAVES } from './SeaPhysics';

const vertexShader = `
  uniform float time;
  uniform float sceneScale;
  uniform vec3 seaMix;
  varying vec3 worldPoint;
  varying vec3 waveNormal;
  varying float waveHeight;
  ${SEA_GLSL}
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 field = seaField(world.xz / sceneScale, time, seaMix);
    world.y += field.x * sceneScale;
    waveHeight = field.x;
    waveNormal = normalize(vec3(-field.y, 1.0, -field.z));
    worldPoint = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const fragmentShader = `
  varying vec3 worldPoint;
  varying vec3 waveNormal;
  varying float waveHeight;
  uniform float time;
  uniform float opacity;
  uniform float sceneScale;
  uniform float amplitude;
  uniform vec3 seaMix;
  uniform vec2 resolution;
  uniform vec2 center;
  ${SEA_GLSL}
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  void main() {
    vec2 metres = worldPoint.xz / sceneScale;
    float detail = noise(metres * .35 + vec2(time*.17,time*.09));
    float small = noise(metres * 1.2 - vec2(time*.12,0.0));
    // Evaluate the physical slope per pixel: distant, coarser triangles must not flatten the sea.
    vec3 field = seaField(metres,time,seaMix);
    float pixelFootprint = max(length(dFdx(metres)),length(dFdy(metres)));
    float rippleA = cos(dot(metres,vec2(.9,.44))*2.6+noise(metres*.17)*7.0-time*1.8) * .055 * (1.0-smoothstep(.25,1.1,pixelFootprint));
    float rippleB = cos(dot(metres,vec2(-.35,.94))*1.15+noise(metres*.08+4.0)*6.0-time*1.1) * .045 * (1.0-smoothstep(.6,2.5,pixelFootprint));
    float rippleC = cos(dot(metres,vec2(.68,.73))*.37+noise(metres*.031)*5.0-time*.65) * .035 * (1.0-smoothstep(2.0,8.0,pixelFootprint));
    vec3 normal = normalize(vec3(-field.y+rippleA+rippleB,1.0,-field.z+rippleC-rippleA*.35));
    vec3 eye = normalize(cameraPosition - worldPoint);
    vec3 sun = normalize(vec3(-.45,1.0,.65));
    float fresnel = pow(1.0 - max(0.0, dot(eye, normal)), 4.0);
    float specular = pow(max(0.0,dot(reflect(-sun,normal),eye)),85.0);
    float diffuse = max(0.0,dot(normal,sun));
    vec3 reflected = reflect(-eye,normal);
    float cloud = noise(reflected.xz*7.0+vec2(time*.009,0.0));
    vec3 deep = mix(vec3(.005,.042,.073),vec3(.009,.032,.046),seaMix.z);
    vec3 sky = mix(vec3(.065,.17,.25),vec3(.115,.155,.19),seaMix.z);
    sky *= .72 + cloud*.7;
    vec3 color = mix(deep,sky,fresnel*.86+.12) * (.58+diffuse*.60);
    color += vec3(.22,.29,.30)*specular*(1.0-seaMix.z*.7);
    float crest = smoothstep(.35,.78,field.x/max(.01,amplitude));
    float foam = crest * smoothstep(.46,.79,detail*.6+small*.4) * (seaMix.y*.38+seaMix.z*.8);
    color = mix(color,vec3(.52,.67,.7),foam);
    float fade = 1.0 - smoothstep(650.0,1180.0,length(worldPoint.xz-center));
    vec2 screen=gl_FragCoord.xy/resolution;
    float edge=smoothstep(0.0,.026,screen.x)*smoothstep(0.0,.026,1.0-screen.x)*smoothstep(0.0,.055,screen.y)*smoothstep(0.0,.026,1.0-screen.y);
    gl_FragColor = vec4(color,opacity*fade*edge);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const gridVertexShader = `
 varying vec2 worldXZ;
 void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  worldXZ = world.xz;
  gl_Position = projectionMatrix * viewMatrix * world;
 }
`;
const gridFragmentShader = `
 varying vec2 worldXZ;
 uniform vec2 center;
 uniform float opacity;
 void main() {
  float fade = 1.0-smoothstep(70.0,230.0,length(worldXZ-center));
  gl_FragColor=vec4(vec3(.065,.21,.32),opacity*fade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;

/** Shared physical height field; denser centre geometry resolves waves around the hull. */
export function Ocean({ vessel, comparison, motion, compact=false }: { compact?:boolean; vessel:VesselRecord; comparison:boolean; motion:MutableRefObject<DriveMotion> }) {
  const state=useApp();
  const {gl,camera}=useThree();
  const origin=useMemo(()=>new THREE.Vector3(),[]);
  const water=useRef<THREE.Mesh>(null);
  const grid=useRef<THREE.GridHelper>(null);
  const material=useRef<THREE.ShaderMaterial>(null);
  const gridMaterial=useRef<THREE.ShaderMaterial>(null);
  const gridUniforms=useMemo(()=>({center:{value:new THREE.Vector2()},opacity:{value:.4}}),[]);
  const uniforms=useMemo(()=>({time:{value:0},opacity:{value:.8},sceneScale:{value:1},seaMix:{value:new THREE.Vector3(1,0,0)},amplitude:{value:.07},resolution:{value:new THREE.Vector2()},center:{value:new THREE.Vector2()}}),[]);
  const geometry=useMemo(()=>{
    const mesh=new THREE.PlaneGeometry(2400,2400,compact?120:220,compact?120:220);
    const positions=mesh.attributes.position;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i)/1200,y=positions.getY(i)/1200;
      positions.setXY(i,1200*(.06*x+.94*x*x*x),1200*(.06*y+.94*y*y*y));
    }
    positions.needsUpdate=true;
    mesh.computeBoundingSphere();
    return mesh;
  },[compact]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const scale=comparison?.25:100/vessel.length;
  const draftEnvelope=Math.min(22,vessel.depth/vessel.length*100);
  const waterline=comparison?-.6:-draftEnvelope*.13;
  useFrame(()=>{
    const m=motion.current;
    const center=state.drive?m.position:origin;
    if(water.current){water.current.position.x=center.x;water.current.position.z=center.z;}
    if(grid.current){grid.current.visible=camera.position.y>waterline&&(!state.water||state.seaState==='calm');grid.current.position.x=Math.floor(center.x/5)*5;grid.current.position.z=Math.floor(center.z/5)*5;}
    if(gridMaterial.current){
      gridMaterial.current.uniforms.center.value.set(center.x,center.z);
      gridMaterial.current.uniforms.opacity.value=state.water?.025*m.seaMix[0]:.4;
    }
    if(!material.current)return;
    const current=material.current.uniforms;
    current.center.value.set(center.x,center.z);
    current.sceneScale.value=scale;
    current.seaMix.value.fromArray(m.seaMix);
    current.time.value=m.waveTime;
    current.amplitude.value=SEA_WAVES.reduce((sum,wave)=>sum+wave.amplitude.reduce((s,a,i)=>s+a*m.seaMix[i],0),0);
    gl.getDrawingBufferSize(current.resolution.value);
    current.opacity.value=camera.position.y<waterline?.08:state.view==='Exterior'?.97:.20;
  },-1);
  return <group>
    <gridHelper ref={grid} args={[500,100,'#4385a4','#245474']} position={[0,waterline-draftEnvelope*.7-2,0]}>
      <shaderMaterial ref={gridMaterial} uniforms={gridUniforms} vertexShader={gridVertexShader} fragmentShader={gridFragmentShader} transparent depthWrite={false}/>
    </gridHelper>
    {state.water&&<mesh ref={water} rotation={[-Math.PI/2,0,0]} position={[0,waterline,0]} renderOrder={2} frustumCulled={false}>
      <primitive object={geometry} attach="geometry"/>
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>}
  </group>;
}
