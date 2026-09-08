import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import type { ModelManifest, VesselRecord } from '../data/schema';
import { useApp } from '../state';
import { componentCorners, getExplodeSelection, modelPosition } from './positions';

export type Comparison = { vessel: VesselRecord; manifest: ModelManifest };
export function CameraRig({ vessel, manifest, compare }: { vessel: VesselRecord; manifest: ModelManifest; compare?: Comparison }) {
  const controls = useRef<OrbitControlsType>(null);
  const state = useApp();
  const { camera, gl, size } = useThree();
  const destination = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const animate = useRef(false);
  const telemetryAge=useRef(1);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lastFocus = useRef(state.focusTick);
  const focusedId = useRef<string | null>(null);
  const framingState = useRef('');

  useEffect(() => {
    // Disassembly changes geometry without moving the camera. Fit/presets remain explicit.
    const state=useApp.getState();
    if(state.drive){animate.current=false;return;}
    const selected = manifest.components.find(c => c.id === state.selected);
    const framingKey = [state.cameraTick, state.preset, state.isolated].join('/');
    if (framingState.current !== framingKey || !selected) focusedId.current = null;
    framingState.current = framingKey;
    if (lastFocus.current !== state.focusTick) focusedId.current = selected?.id ?? null;
    const explodeTarget = selected ?? manifest.components.find(c=>c.id===state.assemblyTarget);
    const focusRequested = Boolean(selected && focusedId.current === selected.id);
    lastFocus.current = state.focusTick;
    const bounds = new THREE.Box3();
    const corners: THREE.Vector3[] = [];
    const addVessel = (m: ModelManifest, scale: number, offset: number, focus: boolean) => {
      const eligibleIds = getExplodeSelection(m, state.scope, state.system, explodeTarget);
      for (const c of m.components) {
        if (state.hidden.includes(c.systemId)) continue;
        if (focus && selected && c.id !== selected.id) continue;
        if (!focus && state.isolated && c.systemId !== state.isolated) continue;
        const points=componentCorners(c, modelPosition(c, state.explode, state.scope, state.system, explodeTarget, eligibleIds), scale, offset);
        corners.push(...points);points.forEach(p=>bounds.expandByPoint(p));
      }
    };
    addVessel(manifest, compare ? .25 : 100 / vessel.length, compare ? -12 : 0, focusRequested);
    if (compare && !focusRequested) addVessel(compare.manifest, .25, 30, false);
    if (bounds.isEmpty()) bounds.set(new THREE.Vector3(-50, -8, -10), new THREE.Vector3(50, 25, 10));
    bounds.getCenter(target.current);
    const presets: Record<string, number[]> = {
      'Three-quarter': [1, .64, 1.5], 'Port side': [0, .13, 1], Bow: [1, .12, 0], Stern: [-1, .12, 0], Above: [0, 1, .001], Below: [.6, -.7, 1],
    };
    const direction = new THREE.Vector3(...(presets[state.preset] ?? presets['Three-quarter'])).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const tanY = Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov) / 2) * .79;
    const tanX = tanY * size.width / Math.max(1, size.height) * .92;
    let distance = 12;
    for (const corner of corners) {
      const relative = corner.clone().sub(target.current);
      distance = Math.max(distance, relative.dot(direction) + Math.max(Math.abs(relative.dot(right)) / tanX, Math.abs(relative.dot(up)) / tanY));
    }
    destination.current.copy(target.current).addScaledVector(direction, distance);
    animate.current = true;
  }, [vessel, manifest, compare, state.drive, state.cameraTick, state.focusTick, state.preset, state.isolated, state.hidden, size.width, size.height, camera]);

  useFrame((_, dt) => {
    if(!state.drive && animate.current && controls.current){
      const a = reduced ? 1 : 1 - Math.exp(-dt * 7);
      camera.position.lerp(destination.current, a);
      controls.current.target.lerp(target.current, a);
      controls.current.update();
      if(camera.position.distanceTo(destination.current)<.01)animate.current=false;
    }
    telemetryAge.current+=dt;
    if(controls.current&&(reduced||telemetryAge.current>.1)){
      telemetryAge.current=0;camera.updateMatrixWorld();
      gl.domElement.closest('[data-scene-status]')?.setAttribute('data-camera-state',JSON.stringify({position:camera.position.toArray(),target:controls.current.target.toArray(),projection:camera.projectionMatrix.toArray(),inverseWorld:camera.matrixWorldInverse.toArray()}));
    }
  });
  useEffect(() => {
    const zoom = (e: Event) => {
      if (!controls.current) return;
      animate.current = false;
      camera.position.sub(controls.current.target).multiplyScalar((e as CustomEvent<number>).detail).add(controls.current.target);
      controls.current.update();
    };
    gl.domElement.addEventListener('hullscope-zoom', zoom);
    return () => gl.domElement.removeEventListener('hullscope-zoom', zoom);
  }, [camera, gl]);
  return <OrbitControls ref={controls} enabled={!state.drive} makeDefault enableDamping dampingFactor={.08} minDistance={3} maxDistance={1200} maxPolarAngle={Math.PI * .88} autoRotate={state.autoRotate && !reduced} autoRotateSpeed={.45} onStart={() => { animate.current = false; }} />;
}
