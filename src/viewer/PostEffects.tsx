import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferGeometry, Material, Mesh, Texture, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';
import type { View } from '../data/schema';

type Quality = 'low' | 'medium';
type PostEffectsProps = { enabled: boolean; view: View; quality?: Quality };
type Pipeline = { composer: EffectComposer; ao: N8AOPass; width: number; height: number; dpr: number };

/** N8AO 2.0.1 inherits Pass's empty dispose; only its own GPU resources belong here. */
function disposeAmbientOcclusion(pass: N8AOPass) {
  const resources = new Set<BufferGeometry | Material | Texture | WebGLRenderTarget>();
  for (const value of Object.values(pass)) {
    if (value instanceof Material || value instanceof Texture || value instanceof WebGLRenderTarget) {
      resources.add(value);
    } else if (value && typeof value === 'object' && '_mesh' in value && value._mesh instanceof Mesh) {
      // N8AO's fullscreen triangles share one geometry; dispose it once, never scene geometry.
      resources.add(value._mesh.geometry);
      const material = value._mesh.material;
      for (const item of Array.isArray(material) ? material : [material]) resources.add(item);
    }
  }
  for (const resource of resources) resource.dispose();
}

function ActivePostEffects({ quality }: { quality: Quality }) {
  const { gl, scene, camera, invalidate } = useThree();
  const pipeline = useRef<Pipeline | null>(null);

  useLayoutEffect(() => {
    // Create inside the effect: StrictMode may discard renders, but always cleans effects.
    const composer = new EffectComposer(gl);
    const ao = new N8AOPass(scene, camera);
    ao.setQualityMode(quality === 'low' ? 'Low' : 'Medium');
    ao.configuration.aoRadius = 1.7;
    ao.configuration.distanceFalloff = 0.8;
    ao.configuration.intensity = 1.3;
    ao.configuration.halfRes = false;
    ao.configuration.accumulate = false;
    ao.configuration.gammaCorrection = false;
    const smaa = new SMAAPass();
    const output = new OutputPass();
    // r183 SMAA expects linear-sRGB input. OutputPass applies tone mapping and sRGB once.
    // All three passes preserve scene alpha, leaving the CSS ocean background visible.
    composer.addPass(ao);
    composer.addPass(smaa);
    composer.addPass(output);
    pipeline.current = { composer, ao, width: 0, height: 0, dpr: 0 };
    invalidate();
    return () => {
      pipeline.current = null;
      disposeAmbientOcclusion(ao);
      smaa.dispose();
      output.dispose();
      composer.dispose();
    };
  }, [gl, scene, camera, quality, invalidate]);

  useFrame(({ size }, delta) => {
    const active = pipeline.current;
    if (!active) {
      gl.render(scene, camera);
      return;
    }
    const width = Math.max(1, size.width);
    const height = Math.max(1, size.height);
    const dpr = gl.getPixelRatio();
    if (active.width !== width || active.height !== height || active.dpr !== dpr) {
      active.composer.setPixelRatio(dpr);
      active.composer.setSize(width, height);
      active.width = width;
      active.height = height;
      active.dpr = dpr;
    }
    active.composer.render(delta);
  }, 1);

  return null;
}

/** Keep translucent X-ray anatomy on the direct renderer; disabled never takes over its loop. */
export function PostEffects({ enabled, view, quality = 'medium' }: PostEffectsProps) {
  return enabled && view !== 'X-ray' ? <ActivePostEffects quality={quality} /> : null;
}
