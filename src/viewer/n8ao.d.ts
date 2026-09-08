declare module 'n8ao' {
  import type { Camera, Color, Scene } from 'three';
  import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';

  export class N8AOPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number);
    scene: Scene;
    camera: Camera;
    configuration: {
      aoRadius: number;
      distanceFalloff: number;
      intensity: number;
      gammaCorrection: boolean;
      color: Color;
      accumulate: boolean;
      halfRes: boolean;
      transparencyAware: boolean;
    };
    setQualityMode(mode: 'Low' | 'Medium'): void;
  }
}
