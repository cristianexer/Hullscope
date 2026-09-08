import {describe,it,expect} from 'vitest';
import {createDriveMotion,stepDrive,type DriveControl} from '../src/viewer/Drive';
function advance(controls:DriveControl[],seconds=5,length=100) {
 const motion=createDriveMotion();
 for(let frame=0;frame<seconds*60;frame++) stepDrive(motion,new Set(controls),1/60,length);
 return motion;
}
describe('illustrative helm integration',()=>{
 it('drives the sailing ship from wind and reefs instead of engaging reverse',()=>{
  const sailing=createDriveMotion(),becalmed=createDriveMotion(),headwind=createDriveMotion();
  for(let frame=0;frame<600;frame++){
   stepDrive(sailing,new Set(['ahead']),1/60,52,0,{x:8,z:4});
   stepDrive(becalmed,new Set(['ahead']),1/60,52,0,{x:0,z:0});
   stepDrive(headwind,new Set(['ahead']),1/60,52,0,{x:-8,z:0});
  }
  expect(sailing.speed).toBeGreaterThan(3);expect(sailing.speed).toBeLessThanOrEqual(12);
  expect(becalmed.speed).toBe(0);expect(headwind.speed).toBe(0);
  for(let frame=0;frame<600;frame++)stepDrive(sailing,new Set(['astern']),1/60,52,0,{x:8,z:4});
  expect(sailing.throttle).toBe(0);expect(sailing.speed).toBeGreaterThanOrEqual(0);expect(sailing.speed).toBeLessThan(1);
 });
 it('accelerates ahead and moves the vessel while respecting the throttle limit',()=>{
  const motion=advance(['ahead'],10);
  expect(motion.throttle).toBe(1);expect(motion.speed).toBeGreaterThan(11);
  expect(motion.position.x).toBeGreaterThan(0);expect(motion.position.z).toBe(0);
 });
 it('reverses with a bounded astern throttle',()=>{
  const motion=advance(['astern']);expect(motion.throttle).toBe(-.35);
  expect(motion.speed).toBeLessThan(0);expect(motion.position.x).toBeLessThan(0);
 });
 it('steers actual motion in opposite directions, with no stationary pivot',()=>{
  const port=advance(['ahead','port']),starboard=advance(['ahead','starboard']);
  expect(port.heading).toBeGreaterThan(0);expect(starboard.heading).toBeLessThan(0);
  expect(port.position.z).toBeLessThan(0);expect(starboard.position.z).toBeGreaterThan(0);
  expect(advance(['port']).heading).toBe(0);
 });
 it('stops immediately and limits elapsed-time spikes',()=>{
  const motion=advance(['ahead']);const position=motion.position.clone();
  stepDrive(motion,new Set(['stop']),1/60,100);
  expect(motion.speed).toBe(0);expect(motion.throttle).toBe(0);expect(motion.position.equals(position)).toBe(true);
  const slow=createDriveMotion(),spike=createDriveMotion();
  stepDrive(slow,new Set(['ahead']),.05,100);stepDrive(spike,new Set(['ahead']),20,100);
  expect(spike).toEqual(slow);
 });
});
