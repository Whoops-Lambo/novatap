export const CAP=500, REGEN=28800, OFFLINE=8*3600;
export const upgrades=[{name:'Orbital drone',desc:'A little helper. A lot of stardust.',base:75,rate:0.5,icon:'◈'},{name:'Lunar outpost',desc:'Make yourself at home among the stars.',base:450,rate:3,icon:'⌂'},{name:'Solar harvester',desc:'A brighter way to build your empire.',base:2400,rate:18,icon:'☀'}];
export const expeditions=[
  {name:'Moonlight drift',duration:30*60,cost:25,reward:150,icon:'☾'},
  {name:'Asteroid trail',duration:2*3600,cost:150,reward:1200,icon:'◈'},
  {name:'Deep space signal',duration:4*3600,cost:400,reward:3000,icon:'✦'},
];
export const fresh=(now=Date.now())=>({dust:0,total:0,energy:500,levels:[0,0,0],tapLevel:0,last:now,started:now,claimed:[],sector:1,expedition:null});
export const sectorBonus=s=>1+Math.max(0,s.sector-1)*.15;
export const rate=s=>s.levels.reduce((n,l,i)=>n+l*upgrades[i].rate,0)*sectorBonus(s);
export const cost=(s,i)=>Math.ceil(upgrades[i].base*1.18**s.levels[i]);
export function advance(s,now=Date.now()){const seconds=Math.max(0,(now-s.last)/1000);const earned=Math.min(seconds,OFFLINE)*rate(s);return {...s,dust:s.dust+earned,total:s.total+earned,energy:Math.min(CAP,s.energy+seconds*CAP/REGEN),last:Math.max(now,s.last)};}
export function tap(s){if(s.energy<1)return s;const gain=1+s.tapLevel;return {...s,dust:s.dust+gain,total:s.total+gain,energy:s.energy-1};}
export function buy(s,i){const price=cost(s,i);if(s.dust<price)return s;return {...s,dust:s.dust-price,levels:s.levels.map((l,j)=>l+(i===j?1:0))};}
export function load(raw,now=Date.now()){try{const x=JSON.parse(raw);if(!x||!['dust','total','energy','last','started','tapLevel','sector'].every(k=>Number.isFinite(x[k])&&x[k]>=0)||!Array.isArray(x.levels)||x.levels.length!==3||!x.levels.every(v=>Number.isInteger(v)&&v>=0)||!Array.isArray(x.claimed))return fresh(now);const mission=x.expedition;const validMission=mission&&Number.isInteger(mission.id)&&!!expeditions[mission.id]&&Number.isFinite(mission.ends)&&mission.ends>=0;return {...x,sector:Math.max(1,Math.floor(x.sector)),tapLevel:Math.floor(x.tapLevel),claimed:[...new Set(x.claimed.filter(i=>Number.isInteger(i)&&i>=0&&i<3))],energy:Math.min(CAP,x.energy),expedition:validMission?{id:mission.id,ends:mission.ends}:null};}catch{return fresh(now);}}

export function launchExpedition(s,id,now=Date.now()){
  const mission=expeditions[id];
  if(!mission||s.expedition||s.dust<mission.cost)return s;
  return {...s,dust:s.dust-mission.cost,expedition:{id,ends:Math.max(now,s.last)+mission.duration*1000}};
}
export function claimExpedition(s,now=Date.now()){
  if(!s.expedition||now<s.expedition.ends)return s;
  const reward=expeditions[s.expedition.id].reward;
  return {...s,dust:s.dust+reward,total:s.total+reward,expedition:null};
}
export function nextMilestone(s){
  const unowned=s.levels.findIndex(level=>level===0);
  const index=unowned===-1?s.levels.reduce((best,_,i)=>cost(s,i)<cost(s,best)?i:best,0):unowned;
  const price=cost(s,index),income=rate(s);
  return {index,price,seconds:s.dust>=price?0:income>0?(price-s.dust)/income:null};
}
