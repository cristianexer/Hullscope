import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { VesselRecord } from '../data/schema';
import { useApp } from '../state';
import type { DriveMotion } from './Drive';
import { sampleWind } from './SeaPhysics';

const noPicking = () => undefined;
const rainVertex = `
  attribute vec4 rainSeed;
  uniform vec3 volume;
  uniform vec3 travel;
  uniform vec3 velocity;
  uniform vec2 center;
  uniform float bottom;
  uniform float sceneScale;
  varying vec2 dropUv;
  varying float dropFade;
  void main() {
    vec3 wrapped = mod(rainSeed.xyz * volume + travel, volume);
    vec3 head = vec3(wrapped.x-volume.x*.5+center.x, wrapped.y+bottom, wrapped.z-volume.z*.5+center.y);
    vec3 fall = normalize(velocity);
    vec3 facing = normalize(cameraPosition-head);
    vec3 crossAxis = cross(facing,fall);
    vec3 right = crossAxis/max(.0001,length(crossAxis));
    float distanceToEye = length(cameraPosition-head);
    float width = max(.018*sceneScale,distanceToEye*.00105);
    float streak = max(length(velocity)*(.025+rainSeed.w*.035),distanceToEye*.003);
    vec3 point = head-fall*(position.y+.5)*streak+right*position.x*width;
    dropUv = uv;
    float altitude = wrapped.y/volume.y;
    dropFade = smoothstep(.01,.10,altitude)*(1.0-smoothstep(.87,1.0,altitude));
    dropFade *= smoothstep(1.5,9.0,distanceToEye);
    dropFade *= .38+.62*rainSeed.w;
    gl_Position = projectionMatrix*viewMatrix*vec4(point,1.0);
  }
`;
const rainFragment = `
  uniform float opacity;
  uniform float flash;
  varying vec2 dropUv;
  varying float dropFade;
  void main() {
    float edge = 1.0-smoothstep(.1,.5,abs(dropUv.x-.5));
    float ends = sin(dropUv.y*3.14159265);
    float alpha = edge*ends*dropFade*opacity;
    if(alpha<.004)discard;
    gl_FragColor = vec4(vec3(.47,.62,.72)+flash*.13,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const mistVertex = `
  varying vec2 screenUv;
  void main() {
    screenUv=uv;
    gl_Position=vec4(position.xy,.999,1.0);
  }
`;
const mistFragment = `
  varying vec2 screenUv;
  uniform float time;
  uniform float opacity;
  uniform float flash;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  void main(){
    float cloud=noise(screenUv*vec2(5.0,3.0)+vec2(time*.017,time*.004));
    float upper=smoothstep(.1,.9,screenUv.y);
    float border=smoothstep(.0,.14,screenUv.x)*smoothstep(.0,.14,1.0-screenUv.x);
    float alpha=opacity*(.28+upper*.6+cloud*.25)*border;
    vec3 tint=mix(vec3(.009,.024,.04),vec3(.16,.23,.29),flash*.45);
    gl_FragColor=vec4(tint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function useReducedMotion() {
  const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>setReduced(media.matches);
    media.addEventListener('change',change);change();
    return()=>media.removeEventListener('change',change);
  },[]);
  return reduced;
}

function rainGeometry(count:number) {
  const geometry=new THREE.BufferGeometry();
  const positions=new Float32Array(count*18),uvs=new Float32Array(count*12),seeds=new Float32Array(count*24);
  const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,-.5],[.5,.5],[-.5,.5]];
  let seed=81723;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let drop=0;drop<count;drop++){
    const value=[random(),random(),random(),random()];
    for(let corner=0;corner<6;corner++){
      const index=drop*6+corner;
      positions.set([corners[corner][0],corners[corner][1],0],index*3);
      uvs.set([corners[corner][0]+.5,corners[corner][1]+.5],index*2);
      seeds.set(value,index*4);
    }
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
  geometry.setAttribute('rainSeed',new THREE.BufferAttribute(seeds,4));
  return geometry;
}

function lightningGeometry() {
  // One branching distant channel. Branches are visual strokes, never selectable parts.
  const vertices:number[]=[];
  const trunk=[[0,1],[.023,.89],[-.017,.78],[.043,.68],[.018,.57],[.071,.46],[.047,.31],[.1,.16],[.073,0]];
  const segment=(a:number[],b:number[])=>vertices.push(a[0],a[1],0,b[0],b[1],0);
  for(let i=1;i<trunk.length;i++)segment(trunk[i-1],trunk[i]);
  segment(trunk[3],[.13,.57]);segment([.13,.57],[.17,.42]);
  segment(trunk[5],[-.035,.32]);segment([-.035,.32],[-.07,.24]);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  return geometry;
}

/** A local rain volume and infrequent distant lightning; no geometry participates in picking. */
export function StormWeather({vessel,motion,compact=false,comparison=false}:{
  vessel:VesselRecord;motion:MutableRefObject<DriveMotion>;compact?:boolean;comparison?:boolean;
}) {
  const water=useApp(s=>s.water),seaState=useApp(s=>s.seaState),drive=useApp(s=>s.drive);
  const reduced=useReducedMotion(),active=water&&seaState==='storm';
  const {camera,gl}=useThree();
  const group=useRef<THREE.Group>(null),rain=useRef<THREE.Mesh>(null),bolt=useRef<THREE.LineSegments>(null);
  const rainMaterial=useRef<THREE.ShaderMaterial>(null),mistMaterial=useRef<THREE.ShaderMaterial>(null);
  const boltMaterial=useRef<THREE.LineBasicMaterial>(null),illumination=useRef<THREE.AmbientLight>(null);
  const clock=useRef({elapsed:0,nextStrike:3.5,strikeStart:-100,ordinal:0});
  const telemetry=useRef({elapsed:0,visible:false,reduced:false});
  const travel=useMemo(()=>new THREE.Vector3(),[]);
  const strikeRay=useMemo(()=>new THREE.Vector3(),[]);
  const rainMesh=useMemo(()=>rainGeometry(compact||comparison?1000:2400),[compact,comparison]);
  const boltMesh=useMemo(lightningGeometry,[]);
  const rainUniforms=useMemo(()=>({
    volume:{value:new THREE.Vector3(180,130,180)},travel:{value:new THREE.Vector3()},velocity:{value:new THREE.Vector3(20,-9,22)},
    center:{value:new THREE.Vector2()},bottom:{value:0},sceneScale:{value:1},opacity:{value:0},flash:{value:0},
  }),[]);
  const mistUniforms=useMemo(()=>({time:{value:0},opacity:{value:0},flash:{value:0}}),[]);
  const scale=comparison?.25:100/vessel.length;
  const waterline=comparison?-.6:-Math.min(22,vessel.depth/vessel.length*100)*.13;
  useEffect(()=>()=>{rainMesh.dispose();},[rainMesh]);
  useEffect(()=>()=>{boltMesh.dispose();},[boltMesh]);
  useEffect(()=>{
    const element=gl.domElement.closest('[data-scene-status]');
    return()=>element?.removeAttribute('data-storm-weather');
  },[gl]);
  useEffect(()=>{
    clock.current={elapsed:0,nextStrike:3.5,strikeStart:-100,ordinal:0};travel.set(0,0,0);
  },[active,reduced,vessel.id,travel]);
  useFrame((_,delta)=>{
    if(!group.current)return;
    const visible=active&&camera.position.y>waterline;
    group.current.visible=visible;
    const publish=(flash:number)=>{
      telemetry.current.elapsed+=Math.max(0,delta);
      if(telemetry.current.elapsed<.1&&telemetry.current.visible===visible&&telemetry.current.reduced===reduced)return;
      telemetry.current={elapsed:0,visible,reduced};
      gl.domElement.closest('[data-scene-status]')?.setAttribute('data-storm-weather',JSON.stringify({
        rainVisible:visible&&!reduced,flash:Number(flash.toFixed(3)),time:Number(clock.current.elapsed.toFixed(3)),strikes:clock.current.ordinal,
      }));
    };
    if(!visible){if(illumination.current)illumination.current.intensity=0;publish(0);return;}
    const elapsed=clock.current;
    const dt=reduced?0:Math.min(.075,Math.max(0,delta));
    elapsed.elapsed+=dt;
    const m=motion.current,centerX=drive?m.position.x:0,centerZ=drive?m.position.z:0;
    const strength=.2+.8*m.seaMix[2];
    let flash=0;
    if(!reduced){
      if(elapsed.elapsed>=elapsed.nextStrike){
        const ordinal=elapsed.ordinal++;
        const side=ordinal%2?1:-1;
        const distance=Math.max(180,Math.hypot(camera.position.x-centerX,camera.position.y-waterline,camera.position.z-centerZ)+100);
        if(bolt.current){
          // Place the distant channel in the upper view rather than guessing a world
          // horizon: the whole stroke remains framed from high, side and mobile cameras.
          strikeRay.set(side*(.38+(ordinal%3)*.035),.18,.5).unproject(camera).sub(camera.position).normalize();
          bolt.current.position.copy(camera.position).addScaledVector(strikeRay,distance);
          bolt.current.quaternion.copy(camera.quaternion);
          const height=distance*2/camera.projectionMatrix.elements[5]*.28;
          bolt.current.scale.set(height*.6,height,1);
        }
        elapsed.strikeStart=elapsed.elapsed;
        elapsed.nextStrike=elapsed.elapsed+6+(Math.sin(ordinal*1.73)*.5+.5)*5;
        // Sound is owned by the host so muting and reduced motion remain centralised.
        window.dispatchEvent(new CustomEvent('hullscope-lightning',{detail:{distance:Math.max(350,distance/scale)}}));
      }
      const age=elapsed.elapsed-elapsed.strikeStart;
      // A single soft rise and decay, never a repeating strobe.
      flash=age>=0&&age<1.15?Math.sin(Math.min(1,age/.16)*Math.PI*.5)*Math.exp(-age*4):0;
    }
    if(illumination.current)illumination.current.intensity=flash*.85*strength;
    if(bolt.current)bolt.current.visible=!reduced&&flash>.012;
    if(boltMaterial.current)boltMaterial.current.opacity=flash*.65*strength;
    if(rain.current)rain.current.visible=!reduced;
    if(rainMaterial.current){
      const wind=sampleWind(m.waveTime,m.seaMix);
      travel.x+=wind.x*scale*dt;travel.y-=9*scale*dt;travel.z+=wind.z*scale*dt;
      const u=rainMaterial.current.uniforms;
      const radius=Math.max(65,Math.hypot(camera.position.x-centerX,camera.position.z-centerZ)*.52);
      u.volume.value.set(radius*2,Math.max(90,camera.position.y-waterline+45),radius*2);
      u.center.value.set(centerX*.4+camera.position.x*.6,centerZ*.4+camera.position.z*.6);
      u.travel.value.copy(travel);u.velocity.value.set(wind.x*scale,-9*scale,wind.z*scale);
      u.bottom.value=waterline;u.sceneScale.value=scale;u.opacity.value=.45*strength;u.flash.value=flash;
    }
    if(mistMaterial.current){
      const u=mistMaterial.current.uniforms;
      u.time.value=elapsed.elapsed;u.opacity.value=.18*strength;u.flash.value=flash;
    }
    publish(flash);
  });
  return <group ref={group} visible={active}>
    <ambientLight ref={illumination} intensity={0} color="#b5cddd"/>
    <mesh ref={rain} geometry={rainMesh} frustumCulled={false} raycast={noPicking} renderOrder={4}>
      <shaderMaterial ref={rainMaterial} uniforms={rainUniforms} vertexShader={rainVertex} fragmentShader={rainFragment} transparent depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
    <lineSegments ref={bolt} geometry={boltMesh} visible={false} frustumCulled={false} raycast={noPicking} renderOrder={3}>
      <lineBasicMaterial ref={boltMaterial} color="#d8e6ed" transparent opacity={0} depthWrite={false} toneMapped={false}/>
    </lineSegments>
    <mesh frustumCulled={false} raycast={noPicking} renderOrder={5}>
      <planeGeometry args={[2,2]}/>
      <shaderMaterial ref={mistMaterial} uniforms={mistUniforms} vertexShader={mistVertex} fragmentShader={mistFragment} transparent depthTest={false} depthWrite={false}/>
    </mesh>
  </group>;
}
