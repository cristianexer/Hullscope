import { describe, expect, it } from 'vitest';
import { fleet } from '../src/data/fleet';
import { buildModel } from '../src/model/build';
import type { Component } from '../src/data/schema';
import { componentBounds, modelPosition } from '../src/viewer/positions';
const partsFor=(id:string)=>buildModel(fleet.find(v=>v.id===id)!);
const bounds=(part:Component,explode:number)=>componentBounds(part,modelPosition(part,explode,'vessel',null,undefined),1);

describe('supported new deck equipment',()=>{
 it('HMS forward mast and shoulder fairing meet the supporting deckhouse',()=>{
  const parts=partsFor('hms-defender'),support=parts.find(c=>c.name==='Forward superstructure')!;
  for(const name of ['Integrated forward mast','Forward mast shoulder fairing']){
   const component=parts.find(c=>c.name===name)!;expect(component).toBeDefined();
   const a=bounds(component,0),b=bounds(support,0);
   expect(a.min.y,name).toBeLessThanOrEqual(b.max.y);
   expect(a.max.y,name).toBeGreaterThan(b.max.y);
   expect(a.min.x).toBeGreaterThanOrEqual(b.min.x);expect(a.max.x).toBeLessThanOrEqual(b.max.x);
  }
 });
 it.each(fleet.filter(v=>v.kind!=='pirate').map(v=>[v.name,v] as const))('%s ventilation hoods remain over their coamings',(_,vessel)=>{
  const parts=buildModel(vessel),hoods=parts.filter(c=>c.name.endsWith('weather hood'));
  expect(hoods.length).toBeGreaterThanOrEqual(2);
  for(const hood of hoods){
   const coaming=parts.find(c=>c.id===hood.parentId)!;
   expect(coaming?.name).toMatch(/coaming$/);
   const support=parts.find(c=>c.id===coaming.parentId)!;
   expect(support).toBeDefined();
   for(const amount of [0,40,100]){
    expect(bounds(hood,amount).min.y,hood.name).toBeGreaterThanOrEqual(bounds(coaming,amount).max.y-.001);
    expect(bounds(coaming,amount).min.y,coaming.name).toBeGreaterThanOrEqual(bounds(support,amount).max.y-.001);
   }
  }
 });
 it('LNG pressure relief outlets stay above their tank covers',()=>{
  const parts=partsFor('christophe-de-margerie');
  for(let tank=1;tank<=4;tank++){
   const cover=parts.find(c=>c.name===`Insulated tank dome ${tank}`)!;
   const mast=parts.find(c=>c.name===`Tank ${tank} relief vent mast`)!;
   const outlet=parts.find(c=>c.name===`Tank ${tank} vent outlet head`)!;
   expect(mast.parentId).toBe(cover.id);expect(outlet.parentId).toBe(mast.id);
   for(const amount of [0,40,100]){
    expect(bounds(mast,amount).min.y).toBeGreaterThanOrEqual(bounds(cover,amount).max.y-.001);
    expect(bounds(outlet,amount).max.y).toBeGreaterThan(bounds(mast,amount).max.y);
    expect(bounds(outlet,amount).min.y-bounds(mast,amount).max.y).toBeCloseTo(bounds(outlet,0).min.y-bounds(mast,0).max.y,5);
   }
  }
 });
 it('Icon pool treatment stays inside the highest accommodation deck',()=>{
  const parts=partsFor('icon-of-the-seas'),roof=parts.find(c=>c.name==='Superstructure weather deck')!;
  const treatment=parts.filter(c=>/^Pool \d+ treatment$/.test(c.assembly));
  expect(treatment.length).toBeGreaterThanOrEqual(15);
  for(const component of treatment){
   expect(component.interior).toBe(true);
   for(const amount of [0,40,100])expect(bounds(component,amount).max.y,component.name).toBeLessThanOrEqual(bounds(roof,amount).min.y+.001);
  }
 });
 it('Ocean Drover roof ventilation and stores crane do not enter the forward bridge crown',()=>{
  const parts=partsFor('ocean-drover'),crown=parts.find(c=>c.name==='Forward accommodation crown')!;
  const equipment=parts.filter(c=>['Livestock ventilation','Livestock stores crane'].includes(c.assembly));
  expect(equipment.length).toBeGreaterThan(70);
  for(const component of equipment)for(const amount of [0,40,100]){
   const a=bounds(component,amount),b=bounds(crown,amount);
   const overlaps=a.min.x<b.max.x-.001&&a.max.x>b.min.x+.001&&a.min.y<b.max.y-.001&&a.max.y>b.min.y+.001&&a.min.z<b.max.z-.001&&a.max.z>b.min.z+.001;
   expect(overlaps,`${component.name} at ${amount}%`).toBe(false);
  }
 });
 it('HMS Defender boats clear the sides of the amidships enclosure',()=>{
  const parts=partsFor('hms-defender'),enclosure=parts.find(c=>c.name==='Enclosed amidships weather structure')!;
  const boats=parts.filter(c=>c.name.endsWith('rigid inflatable boat'));
  expect(boats).toHaveLength(2);
  for(const boat of boats)for(const amount of [0,10,20,30,40,50,60,70,80,90,100]){
   const a=bounds(boat,amount),b=bounds(enclosure,amount);
   const overlaps=a.min.x<b.max.x-.001&&a.max.x>b.min.x+.001&&a.min.y<b.max.y-.001&&a.max.y>b.min.y+.001&&a.min.z<b.max.z-.001&&a.max.z>b.min.z+.001;
   expect(overlaps,`${boat.name} at ${amount}%`).toBe(false);
  }
 });
});
