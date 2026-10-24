import * as THREE from 'three';
import {WEAPON_DATA} from './weapons.js';
// v8.4 — squad tactics for Team Deathmatch / Dust Yard bots.
// Each team runs a plan that changes every ~15–25 s (RUSH · FLANK · HOLD · REGROUP), announced by the
// squad leader with a hand signal and a call-out. Individual soldiers also manage magazines (reload
// with animation and "Reloading!"), take cover and peek when hurt or reloading, fall back and call for
// support when badly hurt, share enemy positions with nearby teammates, throw grenades with a real
// throw motion, and scan the area when holding.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const SIGNAL={rush:'forward',flank:'left',hold:'hold',regroup:'regroup'};
export class Squads {
 constructor(bots,arena,bases){this.bots=bots;this.arena=arena;this.bases=bases;this.plans={blue:{kind:'rush',t:6},red:{kind:'rush',t:9}};}
 plan(team){return this.plans[team]||{kind:'rush',t:1};}
 members(team){return this.bots.list.filter(b=>b.team===team&&!b.dead);}
 leader(team){return this.members(team)[0]||null;}
 update(dt,score){if(this.bots.ffa)return;for(const team of ['blue','red']){const P=this.plans[team];P.t-=dt;if(P.t>0)continue;
   const mine=score?.[team]||0,theirs=score?.[team==='blue'?'red':'blue']||0,r=this.bots.rand();const losing=mine<theirs-2,winning=mine>theirs+3;
   let kind=losing?(r<.45?'rush':r<.85?'flank':'regroup'):winning?(r<.45?'hold':r<.75?'flank':'rush'):(r<.35?'rush':r<.65?'flank':r<.85?'hold':'regroup');if(kind===P.kind&&r<.6)kind=kind==='rush'?'flank':'rush';
   P.kind=kind;P.t=15+this.bots.rand()*10;let lane=1;for(const m of this.members(team)){m.lane=(lane=-lane);m.flankStage=0;m.holdT=0;m.path=[];}
   const L=this.leader(team);if(L){L.motion.signal(SIGNAL[kind]);this.bots.cb.say?.(L,kind==='rush'?'push':kind);L.think=Math.max(L.think,.6);}}}
 // Where a bot should go when it has no target, according to its team's plan.
 goal(e){const B=this.bots,A=this.arena,bases=this.bases;if(B.ffa){const pts=B.roamPoints;return pts[Math.floor(B.rand()*pts.length)];}
  const own=bases[e.team],enemy=bases[e.team==='blue'?'red':'blue'],midZ=(own.z+enemy.z)/2,cx=(A.minX+A.maxX)/2,half=(A.maxX-A.minX)/2,P=this.plan(e.team);
  const near=(x,z,r=4)=>B.nav.nearest(V(x,0,z),r)||V(x,0,z);
  if(P.kind==='flank'){const lx=cx+(e.lane||1)*half*.72;if(!e.flankStage){e.flankStage=1;return near(lx,THREE.MathUtils.lerp(own.z,midZ,.6),6);}e.flankStage=2;return near(lx*.6+cx*.4,THREE.MathUtils.lerp(midZ,enemy.z,.55),6);}
  if(P.kind==='hold'){e.holdT=6+B.rand()*6;const z=THREE.MathUtils.lerp(own.z,midZ,.55+B.rand()*.3);return near(cx+(B.rand()-.5)*half*1.4,z,6);}
  if(P.kind==='regroup'){const L=this.leader(e.team);if(L&&L!==e){return near(L.root.position.x+(B.rand()-.5)*4,L.root.position.z+(B.rand()-.5)*4,4);}return near(cx,THREE.MathUtils.lerp(own.z,midZ,.5),6);}
  // rush: push through the middle into the enemy half
  const pool=B.roamPoints.filter(p=>(p.z-midZ)*Math.sign(enemy.z-own.z)>-4&&Math.abs(p.x-cx)<half*.6);return pool[Math.floor(B.rand()*pool.length)]||enemy;}
 // Shares a sighted enemy with nearby teammates (they move in to support).
 share(e,target,pos){for(const o of this.bots.list){if(o===e||o.dead||o.target||(this.bots.ffa||o.team!==e.team))continue;if(o.root.position.distanceTo(e.root.position)<30){o.lastKnown=pos.clone();o.lastKnownAt=this.bots.time;}}}
}
export function magSize(w){return WEAPON_DATA[w]?.capacity||30;}
