import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,tap,buy,advance,load,rate,cost} from '../src/game.js';
test('taps spend energy and award upgraded resources',()=>{let s=fresh(0);s.tapLevel=2;s=tap(s);assert.equal(s.dust,3);assert.equal(s.energy,499);s.energy=0;assert.equal(tap(s),s);});
test('collectors require payment and scale their price',()=>{let s=fresh(0);assert.equal(buy(s,0),s);s.dust=100;s=buy(s,0);assert.equal(s.dust,25);assert.equal(rate(s),.5);assert.equal(cost(s,0),89);});
test('offline income is capped at eight hours and never counted twice',()=>{let s=fresh(0);s.levels=[2,1,0];s.energy=0;s=advance(s,12*3600000);assert.equal(s.dust,4*8*3600);assert.equal(s.energy,500);assert.equal(advance(s,12*3600000).dust,s.dust);});
test('energy regenerates over eight hours and clock rollback grants nothing',()=>{let s=fresh(1000);s.energy=0;s=advance(s,1000+4*3600000);assert.equal(s.energy,250);const x=advance(s,0);assert.equal(x.energy,250);assert.equal(x.last,s.last);});
test('invalid saved state is safely reset',()=>{assert.deepEqual(load('{bad',100),fresh(100));assert.deepEqual(load(JSON.stringify({...fresh(),levels:[-1,0,0]}),100),fresh(100));});

import {expeditions,launchExpedition,claimExpedition,nextMilestone,sectorBonus} from '../src/game.js';
test('expeditions charge once, allow one scout, and cannot be claimed early',()=>{
  const s={...fresh(0),dust:500};
  assert.equal(launchExpedition({...s,dust:0},0,0).expedition,null);
  const launched=launchExpedition(s,0,0);
  assert.equal(launched.dust,475);
  assert.equal(launched.expedition.ends,1800000);
  assert.equal(launchExpedition(launched,1,0),launched);
  assert.equal(claimExpedition(launched,1799999),launched);
});
test('expedition survives save and offline return, with a single reward',()=>{
  let s=launchExpedition({...fresh(0),dust:500},2,0);
  s=load(JSON.stringify(s),15000000);
  assert.equal(s.expedition.ends,expeditions[2].duration*1000);
  s=claimExpedition(advance(s,15000000),15000000);
  assert.equal(s.dust,3100);assert.equal(s.total,3000);assert.equal(s.expedition,null);
  assert.equal(claimExpedition(s,15000000),s);
});
test('older saves migrate without losing resources and corrupt mission metadata is cleared',()=>{
  const old={...fresh(0),dust:123};delete old.expedition;
  assert.equal(load(JSON.stringify(old)).dust,123);assert.equal(load(JSON.stringify(old)).expedition,null);
  assert.equal(load(JSON.stringify({...old,expedition:{id:999,ends:1000}})).expedition,null);
});
test('next milestone follows first purchases and estimates idle time',()=>{
  let s={...fresh(0),dust:75};assert.equal(nextMilestone(s).index,0);assert.equal(nextMilestone(s).seconds,0);
  s=buy(s,0);assert.equal(nextMilestone(s).index,1);assert.equal(nextMilestone(s).seconds,900);
  s.dust=450;s=buy(s,1);assert.equal(nextMilestone(s).index,2);
  assert.equal(nextMilestone(fresh()).seconds,null);
});
test('sector income bonus applies to active and offline production',()=>{
  const s={...fresh(0),levels:[2,0,0],sector:3};
  assert.equal(sectorBonus(s),1.3);assert.equal(rate(s),1.3);assert.equal(advance(s,10000).dust,13);
});

import {energyCapacity,energyCost,buyEnergy} from '../src/game.js';
test('energy capacity upgrades charge stardust, grant the new energy and increase subsequent prices',()=>{
  const empty=fresh(0);assert.equal(buyEnergy(empty),empty);
  let s={...empty,dust:1000,energy:50};
  s=buyEnergy(s);assert.equal(s.dust,800);assert.equal(s.energy,150);assert.equal(energyCapacity(s),600);assert.equal(energyCost(s),320);
  s=buyEnergy(s);assert.equal(s.dust,480);assert.equal(s.energy,250);assert.equal(energyCapacity(s),700);
  assert.equal(buyEnergy(s),s);
});
test('upgraded energy capacity survives reload and offline regeneration fills the larger reserve in eight hours',()=>{
  let s=buyEnergy({...fresh(0),dust:200});
  s=load(JSON.stringify(s),0);assert.equal(energyCapacity(s),600);assert.equal(s.energy,600);
  s.energy=0;s=advance(s,4*3600000);assert.equal(s.energy,300);
  s=advance(s,10*3600000);assert.equal(s.energy,600);
});
test('old and invalid energy upgrade data preserves existing progress safely',()=>{
  const old={...fresh(0),dust:123,energy:400};delete old.energyLevel;
  assert.equal(load(JSON.stringify(old)).energyLevel,0);assert.equal(load(JSON.stringify(old)).energy,400);
  for(const invalid of [-1,1.5,'2',null]){
    const state=load(JSON.stringify({...old,energyLevel:invalid}));
    assert.equal(state.dust,123);assert.equal(energyCapacity(state),500);
  }
  assert.equal(load(JSON.stringify({...old,energyLevel:1,energy:999})).energy,600);
});
