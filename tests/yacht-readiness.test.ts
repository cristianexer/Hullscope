import { describe, expect, it } from 'vitest';
import { createReadinessTracker } from '../src/assets/readiness';

describe('required authored scene readiness', () => {
 it('waits for every exterior and requested interior asset', () => {
  const scene = createReadinessTracker(['hull', 'deck-main', 'deck-lower']);
  expect(scene.report('hull', 'ready')).toBe('loading');
  expect(scene.report('deck-main', 'ready')).toBe('loading');
  expect(scene.report('deck-lower', 'ready')).toBe('ready');
 });
 it('retains errors until failed assets have actually retried successfully', () => {
  const scene = createReadinessTracker(['hull', 'interior']);
  expect(scene.report('interior', 'error')).toBe('error');
  expect(scene.report('hull', 'ready')).toBe('error');
  expect(scene.report('interior', 'loading')).toBe('loading');
  expect(scene.report('interior', 'ready')).toBe('ready');
 });
 it('rejects undeclared, duplicate, or empty requirements', () => {
  expect(() => createReadinessTracker([])).toThrow();
  expect(() => createReadinessTracker(['hull','hull'])).toThrow();
  expect(() => createReadinessTracker(['hull']).report('unknown','ready')).toThrow();
 });
});
