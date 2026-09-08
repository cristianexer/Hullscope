/**
 * Deterministic deep-water wave field, in metres and seconds, shared with the ocean shader.
 * Dispersion: https://web.mit.edu/13.012/www/handouts/2003/waves.pdf
 * Analytic height-field normals: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models
 * Restoring/damping structure: https://www.fossen.biz/html/marineCraftModel.html
 * This is an illustrative linear response model: no verified displacement, GM, RAOs,
 * wave diffraction, slamming, flooding or capsizing calculation is available here.
 */
export type SeaState = 'calm' | 'waves' | 'storm';
export type SeaBlend = [number, number, number];
export const GRAVITY = 9.81;
export const PHYSICS_STEP = 1 / 120;

type Wave = { wavelength: number; direction: number; phase: number; amplitude: SeaBlend };
// Authored demonstration conditions, not a weather observation or a Beaufort classification.
export const SEA_WAVES: readonly Wave[] = [
  { wavelength: 110, direction: .82, phase: .3, amplitude: [.025, 2.2, 4.95] },
  { wavelength: 64, direction: 1.18, phase: 2.1, amplitude: [.018, 1.2, 2.7] },
  { wavelength: 37, direction: .39, phase: 4.3, amplitude: [.010, .65, 1.4625] },
  { wavelength: 21, direction: 1.51, phase: 1.3, amplitude: [.008, .34, .765] },
  { wavelength: 12, direction: -.35, phase: 3.7, amplitude: [.006, .14, .315] },
  { wavelength: 7, direction: 2.2, phase: 5.2, amplitude: [.003, .08, .18] },
  { wavelength: 260, direction: .9, phase: .7, amplitude: [0, 0, 2.6] },
  { wavelength: 180, direction: 1.07, phase: 3.4, amplitude: [0, 0, 1.2] },
];
export function seaBlend(state: SeaState): SeaBlend {
  return state === 'storm' ? [0, 0, 1] : state === 'waves' ? [0, 1, 0] : [1, 0, 0];
}
export function blendSea(current: SeaBlend, target: SeaState, dt: number) {
  const desired = seaBlend(target);
  const a = 1 - Math.exp(-Math.max(0, dt) / 1.4);
  for (let i = 0; i < 3; i++) current[i] += (desired[i] - current[i]) * a;
}
export type SeaSample = { height: number; gradientX: number; gradientZ: number; verticalVelocity: number };
export function sampleSea(x: number, z: number, time: number, blend: readonly number[]): SeaSample {
  let height = 0, gradientX = 0, gradientZ = 0, verticalVelocity = 0;
  for (const wave of SEA_WAVES) {
    const k = 2 * Math.PI / wave.wavelength;
    const omega = Math.sqrt(GRAVITY * k);
    const dx = Math.cos(wave.direction), dz = Math.sin(wave.direction);
    const amplitude = wave.amplitude.reduce((sum, value, i) => sum + value * blend[i], 0);
    const phase = k * (dx * x + dz * z) - omega * time + wave.phase;
    const c = amplitude * Math.cos(phase);
    height += amplitude * Math.sin(phase);
    gradientX += k * dx * c;
    gradientZ += k * dz * c;
    verticalVelocity -= omega * c;
  }
  return { height, gradientX, gradientZ, verticalVelocity };
}

const number = (value: number) => value.toFixed(12);
// Generate the GLSL from the same wave records; no separately tuned visual wave formula.
export const SEA_GLSL = `
vec3 seaField(vec2 metres, float time, vec3 blend) {
  vec3 result = vec3(0.0);
  ${SEA_WAVES.map(wave => {
    const k = 2 * Math.PI / wave.wavelength;
    return `{
      vec2 direction = vec2(${number(Math.cos(wave.direction))}, ${number(Math.sin(wave.direction))});
      float amplitude = dot(vec3(${wave.amplitude.map(number).join(',')}), blend);
      float phase = ${number(k)} * dot(direction, metres) - ${number(Math.sqrt(GRAVITY * k))} * time + ${number(wave.phase)};
      result += vec3(amplitude * sin(phase), amplitude * ${number(k)} * direction * cos(phase));
    }`;
  }).join('\n')}
  return result;
}`;

export type HullDimensions = { length: number; beam: number; depth: number };
export type WindSample = { x: number; z: number; speed: number };

/** Wind is a prescribed forcing field, not a forecast; direction follows the primary swell. */
export function sampleWind(time: number, blend: readonly number[]): WindSample {
  const gust = 1 + .13 * Math.sin(time * .31) + .07 * Math.sin(time * .91 + 1.7);
  const speed = (2 * blend[0] + 16 * blend[1] + 32 * blend[2]) * gust;
  return { x: Math.cos(.82) * speed, z: Math.sin(.82) * speed, speed };
}

export type WindLoad = { x: number; z: number; roll: number; mass: number };
/**
 * Dynamic pressure (½ρv²) on an approximate above-water box, with a hydrostatic
 * restoring lever. Mass, immersed depth and GM below are authored envelope estimates,
 * not measured particulars. No severe-storm survivability can be inferred from them.
 */
export function hullWindLoad(dimensions: HullDimensions, windageHeight: number, heading: number, wind: Pick<WindSample, 'x' | 'z'>, velocity: { x: number; z: number }): WindLoad {
  const depth = Math.max(.8, dimensions.depth * .45);
  const mass = 1025 * dimensions.length * dimensions.beam * depth * .56;
  const height = Math.max(1, windageHeight);
  const cos = Math.cos(heading), sin = Math.sin(heading);
  const x = wind.x - velocity.x, z = wind.z - velocity.z;
  const longitudinal = x * cos - z * sin;
  const transverse = x * sin + z * cos;
  const q = .5 * 1.225 * 1.05;
  const forceX = q * dimensions.beam * height * longitudinal * Math.abs(longitudinal);
  const forceZ = q * dimensions.length * height * transverse * Math.abs(transverse);
  const restoring = mass * GRAVITY * Math.max(.7, dimensions.beam * .12);
  return { x: forceX * cos + forceZ * sin, z: -forceX * sin + forceZ * cos, roll: Math.atan(forceZ * height * .5 / restoring), mass };
}

/** Wind-driven ground drift with dissipative underwater drag; metres/second throughout. */
export function stepWindDrift(drift: { x: number; z: number }, load: WindLoad, dimensions: HullDimensions, heading: number, elapsed: number) {
  let remaining = Math.min(.1, Math.max(0, elapsed));
  const cos = Math.cos(heading), sin = Math.sin(heading);
  while (remaining > 1e-9) {
    const dt = Math.min(PHYSICS_STEP, remaining);
    const u = drift.x * cos - drift.z * sin;
    const v = drift.x * sin + drift.z * cos;
    const dragX = .035 * u + .5 * .6 / (.56 * dimensions.length) * u * Math.abs(u);
    const dragZ = .055 * v + .5 * 1.1 / (.56 * dimensions.beam) * v * Math.abs(v);
    drift.x += (load.x / load.mass - dragX * cos - dragZ * sin) * dt;
    drift.z += (load.z / load.mass + dragX * sin - dragZ * cos) * dt;
    remaining -= dt;
  }
}

export type BuoyancyTarget = { heave: number; pitch: number; roll: number };
export type BuoyancyMotion = BuoyancyTarget & { heaveVelocity: number; pitchVelocity: number; rollVelocity: number };
export const createBuoyancy = (): BuoyancyMotion => ({ heave: 0, pitch: 0, roll: 0, heaveVelocity: 0, pitchVelocity: 0, rollVelocity: 0 });

/** Weighted waterplane stations (at most 6 m apart) avoid treating a long ship like a point buoy. */
export function sampleHullSupport(dimensions: HullDimensions, x: number, z: number, heading: number, time: number, blend: readonly number[]): BuoyancyTarget {
  let total = 0, heave = 0, pitchMoment = 0, rollMoment = 0, xx = 0, zz = 0;
  const cos = Math.cos(heading), sin = Math.sin(heading);
  const halfStations = Math.max(4, Math.ceil(dimensions.length * .45 / 6));
  for (let station = -halfStations; station <= halfStations; station++) {
    const localX = dimensions.length * .45 * station / halfStations;
    const taper = 1 - .6 * (station / halfStations) ** 2;
    for (let side = -1; side <= 1; side++) {
      const localZ = side * dimensions.beam * .38 * Math.sqrt(taper);
      const weight = taper * (side === 0 ? 2 : 1);
      const height = sampleSea(x + localX * cos + localZ * sin, z - localX * sin + localZ * cos, time, blend).height;
      total += weight;
      heave += weight * height;
      pitchMoment += weight * localX * height;
      rollMoment += weight * localZ * height;
      xx += weight * localX * localX;
      zz += weight * localZ * localZ;
    }
  }
  return { heave: heave / total, pitch: Math.atan(pitchMoment / Math.max(.01, xx)), roll: -Math.atan(rollMoment / Math.max(.01, zz)) };
}

/** Damped restoring response with geometry-based illustrative periods, not ship stability data. */
export function stepBuoyancy(motion: BuoyancyMotion, target: BuoyancyTarget, dimensions: HullDimensions, elapsed: number) {
  let remaining = Math.min(.1, Math.max(0, elapsed));
  const frequencies = {
    heave: Math.sqrt(GRAVITY / Math.max(.8, dimensions.depth * .45)),
    pitch: Math.sqrt(GRAVITY / Math.max(1.8, dimensions.length * .035)),
    roll: Math.sqrt(GRAVITY / Math.max(1, dimensions.beam * .22)),
  };
  while (remaining > 1e-9) {
    const dt = Math.min(PHYSICS_STEP, remaining);
    for (const axis of ['heave', 'pitch', 'roll'] as const) {
      const key = `${axis}Velocity` as const;
      const omega = frequencies[axis];
      const damping = axis === 'roll' ? .78 : .88;
      const velocity = motion[key];
      const acceleration = omega * omega * (target[axis] - motion[axis]) - 2 * damping * omega * velocity - .12 * velocity * Math.abs(velocity);
      motion[key] += acceleration * dt;
      motion[axis] += motion[key] * dt;
    }
    remaining -= dt;
  }
}
