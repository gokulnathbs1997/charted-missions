import * as THREE from 'three';
import {clone} from './vendor/SkeletonUtils.js';
import {SoldierMotion} from './enemies.js';
import {Ragdoll} from './ragdoll.js';
import {WEAPON_DATA} from './weapons.js';
import {Squads,magSize} from './tactics.js';
// Team Deathmatch: two teams of soldiers, respawns, kill feed, streaks and score.
// Every player (you or a bot) is an "actor" record: {name, team, kills, deaths, streak, isPlayer}.
// The match only talks to actors through damage/kill events, so a network layer can later
// replace bots with remote players that send the same events (see README → Going online).
export const SCORE_LIMIT=30,MATCH_SECONDS=300;
export const ARENA={minX:-40,maxX:52,minZ:-72,maxZ:30};
export const BASES={blue:new THREE.Vector3(6,0,24),red:new THREE.Vector3(6,0,-66)};
// Spawn-row span along x (the Dust Yard mission widens it); TINT colours are also adjustable per map.
export const SPAWN={x0:-24,x1:36};
const NAMES=['Viper','Ghost','Rook','Falcon','Nomad','Havoc','Saber','Kodiak','Wraith','Jinx','Bishop','Talon','Riot','Cobra','Mako','Onyx','Rex','Vandal','Echo','Blitz','Raptor','Sierra','Diesel','Hex'];
const BOT_GUNS=['m4','m4','ak74','ak74','ak74u','smg','shotgun','sniper','suppressed'];
export const DIFFICULTY={easy:{acc:.62,react:1.5,dmg:.72,label:'Recruit'},normal:{acc:1,react:1,dmg:1,label:'Veteran'},hard:{acc:1.3,react:.65,dmg:1.15,label:'Elite'}};
export const TEAM_CSS={blue:'#7cbcff',red:'#ff7465'};
const TINT={blue:new THREE.Color(.7,.86,1.28),red:new THREE.Color(1.3,.76,.7)};
const UP=new THREE.Vector3(0,1,0);
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function plate(text,team){const c=document.createElement('canvas');c.width=256;c.height=56;const x=c.getContext('2d');x.font='bold 27px Arial';x.textAlign='center';x.lineWidth=5;x.strokeStyle='#000a';x.strokeText(text,128,38);x.fillStyle=TEAM_CSS[team];x.fillText(text,128,38);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:team!=='blue',depthWrite:false}));s.scale.set(1.45,.32,1);s.position.y=2.18;s.renderOrder=5;return s;}

// Perimeter walls and scattered cover for the arena. Added before collision is built.
export function buildArenaProps(root,buildings){const group=new THREE.Group();group.name='Arena props';const rand=seeded(9157),boxes=[];
 const concrete=new THREE.MeshStandardMaterial({color:0x8a8a82,roughness:.92}),wood=new THREE.MeshStandardMaterial({color:0x7a5f3c,roughness:.85}),metal=new THREE.MeshStandardMaterial({color:0x4f5b4a,roughness:.6,metalness:.4}),cube=new THREE.BoxGeometry(1,1,1);
 const add=(mat,pos,scale,name,rotY=0)=>{const m=new THREE.Mesh(cube,mat);m.position.copy(pos);m.scale.set(...scale);m.rotation.y=rotY;m.name=name;group.add(m);m.updateMatrixWorld();boxes.push(new THREE.Box3().setFromObject(m));return m;};
 const {minX,maxX,minZ,maxZ}=ARENA,cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,h=2.4;
 add(concrete,new THREE.Vector3(cx,h/2,minZ),[maxX-minX+1,h,.8],'Arena wall');add(concrete,new THREE.Vector3(cx,h/2,maxZ),[maxX-minX+1,h,.8],'Arena wall');add(concrete,new THREE.Vector3(minX,h/2,cz),[.8,h,maxZ-minZ+1],'Arena wall');add(concrete,new THREE.Vector3(maxX,h/2,cz),[.8,h,maxZ-minZ+1],'Arena wall');
 const blocked=(p,pad)=>buildings.some(b=>p.x>b.min.x-pad&&p.x<b.max.x+pad&&p.z>b.min.z-pad&&p.z<b.max.z+pad);
 let count=0;for(let z=minZ+9;z<=maxZ-9&&count<26;z+=6.5)for(let x=minX+5;x<=maxX-5&&count<26;x+=6.5){const p=new THREE.Vector3(x+(rand()-.5)*2.5,0,z+(rand()-.5)*2.5);if(blocked(p,3.2)||rand()>.42)continue;if(Math.abs(p.z-BASES.blue.z)<7||Math.abs(p.z-BASES.red.z)<6)continue;count++;const kind=rand(),rot=rand()<.5?0:Math.PI/2;
  if(kind<.4){add(concrete,p.clone().setY(.55),[3.2,1.1,.6],'Cover barrier',rot);}
  else if(kind<.75){add(wood,p.clone().setY(.65),[1.3,1.3,1.3],'Cover crate',rot);if(rand()<.6)add(wood,p.clone().add(new THREE.Vector3(rot?0:1.35,0,rot?1.35:0)).setY(.65),[1.3,1.3,1.3],'Cover crate',rot);if(rand()<.35)add(wood,p.clone().setY(1.95),[1.3,1.3,1.3],'Cover crate',rot+.3);}
  else {add(metal,p.clone().setY(1.25),[2.4,2.5,5.8],'Cover container',rot);}}
 root.add(group);return boxes;}

export class TDMBots {
 constructor(gltf,scene,nav,opts,cb){this.scene=scene;this.nav=nav;this.cb=cb;this.ffa=!!opts.ffa;this.diff=DIFFICULTY[opts.difficulty]||DIFFICULTY.normal;this.rand=seeded(opts.seed||Date.now()%100000);this.list=[];this.time=0;this.alarmed=false;this.detected=0;this.pathBudget=0;
  this.player={name:opts.playerName||'You',team:'blue',isPlayer:true,kills:0,deaths:0,streak:0,score:0};
  this.spawns={blue:this.spawnRow(BASES.blue),red:this.spawnRow(BASES.red)};
  // Free-for-all: everyone spawns from points spread over the whole map.
  if(this.ffa&&opts.ffaSpawns){const pts=opts.ffaSpawns.map(p=>nav.nearest(p,5)).filter(Boolean);if(pts.length)this.spawns.blue=this.spawns.red=pts;}this.roamPoints=[];for(let z=ARENA.minZ+3;z<ARENA.maxZ-2;z+=5)for(let x=ARENA.minX+3;x<ARENA.maxX-2;x+=5){if(nav.free(x,z))this.roamPoints.push(new THREE.Vector3(x,0,z));}
  const names=[...NAMES].sort(()=>this.rand()-.5);this.gltf=gltf;this.mats={blue:new Map(),red:new Map()};const size=opts.size||5;
  const teams=opts.online?[]:this.ffa?Array(size*2-1).fill('red'):[...Array(size-1).fill('blue'),...Array(size).fill('red')];
  teams.forEach((team,i)=>{const e=this.makeActor(names[i],team,i);this.list.push(e);this.respawn(e,true);});
  this.squads=opts.online?null:new Squads(this,ARENA,BASES);
 }
 // Builds a team-tinted soldier with name plate, body language and ragdoll (bots and online players).
 makeActor(name,team,i){const gltf=this.gltf,mats=this.mats,scene=this.scene,nav=this.nav;const root=new THREE.Group(),model=clone(gltf.scene);model.traverse(o=>{if(o.isCamera||o.isLight)o.visible=false;if(o.isMesh){o.frustumCulled=false;let m=mats[team].get(o.material.uuid);if(!m){m=o.material.clone();m.color.multiply(TINT[team]);mats[team].set(o.material.uuid,m);}o.material=m;}});root.add(model);const tag=plate(name,team);root.add(tag);scene.add(root);
   const motion=new SoldierMotion(model,gltf.animations[0]);return {id:i,name,team,isPlayer:false,root,model,tag,motion,ragdoll:new Ragdoll(model,motion.bones,nav.octree),hp:100,dead:false,kills:0,deaths:0,streak:0,score:0,weapon:'m4',target:null,reaction:0,think:this.rand()*.3,fireTime:0,burstLeft:4,strafeDir:1,strafeTime:0,crouch:false,crouchHold:false,path:[],lastKnown:null,lastKnownAt:-99,speed:0,stuck:0,nadeCd:20+this.rand()*20,spotted:0,fired:0,protect:0,deathTime:0,respawnIn:0,callsign:name,mag:30,reloadT:0,mode:null,coverPos:null,modeT:0,peekT:0,peeking:true,lane:1,flankStage:0,holdT:0,pendingNade:null,retreated:false,wantCover:false};}
 spawnRow(base){const out=[];for(let x=SPAWN.x0;x<=SPAWN.x1;x+=4){const p=this.nav.nearest(new THREE.Vector3(x,0,base.z),4);if(p&&!this.nav.inside(p.x,p.z)&&out.every(o=>o.distanceTo(p)>2.5))out.push(p);}if(!out.length)out.push(this.nav.nearest(base,12)||base.clone());return out;}
 // Hostile check: different team, or (free-for-all) anyone but yourself.
 foe(a,b){return this.ffa?a!==b:a.team!==b.team;}
 opponents(e){const out=[];for(const o of this.list)if(o!==e&&this.foe(o,e)&&!o.dead)out.push(o);if(this.foe(this.player,e)&&this.cb.playerAlive())out.push(this.player);return out;}
 feet(a){return a.isPlayer?this.cb.playerFeet():a.root.position;}
 chest(a){return a.isPlayer?this.cb.playerEye().clone().add(new THREE.Vector3(0,-.35,0)):a.root.position.clone().add(new THREE.Vector3(0,a.crouch?.95:1.25,0));}
 eye(e){return e.root.position.clone().add(new THREE.Vector3(0,e.crouch?1.12:1.6,0));}
 bestSpawn(team){const spots=this.spawns[team],enemies=[...this.list.filter(o=>(this.ffa||o.team!==team)&&!o.dead).map(o=>o.root.position)];if((this.ffa||team!==this.player.team)&&this.cb.playerAlive())enemies.push(this.cb.playerFeet());let best=spots[0],score=-1;for(const s of spots){const d=Math.min(60,...enemies.map(p=>p.distanceTo(s)))+this.rand()*6-(this.list.some(o=>!o.dead&&o.root.position.distanceTo(s)<1.6)?100:0);if(d>score){score=d;best=s;}}return best.clone();}
 respawn(e,initial=false){const p=initial&&!this.ffa?this.spawns[e.team][e.id%this.spawns[e.team].length].clone():initial?this.spawns.red[(e.id+1)%this.spawns.red.length].clone():this.bestSpawn(e.team);e.root.position.copy(p);e.root.rotation.y=e.team==='blue'?Math.PI:0;e.ragdoll?.reset();e.hp=100;e.dead=false;e.protect=initial?0:2;e.model.rotation.z=0;e.model.position.y=0;e.motion.limp=0;e.root.visible=true;e.weapon=BOT_GUNS[Math.floor(this.rand()*BOT_GUNS.length)];e.motion.setWeapon?.(e.weapon);e.target=null;e.path=[];e.lastKnown=null;e.burstLeft=4;e.deathTime=0;e.tag.visible=true;e.mag=magSize(e.weapon);e.reloadT=0;e.mode=null;e.coverPos=null;e.holdT=0;e.pendingNade=null;e.retreated=false;e.wantCover=false;e.flankStage=0;if(e.motion){e.motion.aimPitch=0;e.motion.scanYaw=0;}}
 random(){return this.rand();}
 noise(pos,radius,team=this.player.team){for(const e of this.list){if(e.dead||(!this.ffa&&e.team===team))continue;if(e.root.position.distanceTo(pos)<radius*.7){e.lastKnown=pos.clone();e.lastKnown.y=0;e.lastKnownAt=this.time;}}}
 route(e,to){if(!to||this.pathBudget<=0)return false;this.pathBudget--;e.path=this.nav.path(e.root.position,to);return true;}
 roam(e){if(this.squads)return this.squads.goal(e);const enemySide=e.team==='blue'?-1:1,mid=(BASES.blue.z+BASES.red.z)/2;const pool=this.roamPoints.filter(p=>this.rand()<.5||(p.z-mid)*enemySide<12);const pick=pool[Math.floor(this.rand()*pool.length)]||BASES[e.team==='blue'?'red':'blue'];return pick;}
 hit(ray,maxDistance){let best=null;for(const e of this.list){if(e.dead||!this.foe(e,this.player))continue;const p=e.root.position,h=e.crouch?1.35:1.82;const box=new THREE.Box3(new THREE.Vector3(p.x-.32,p.y,p.z-.32),new THREE.Vector3(p.x+.32,p.y+h,p.z+.32));const point=ray.intersectBox(box,new THREE.Vector3());if(!point)continue;const distance=point.distanceTo(ray.origin);if(distance<maxDistance&&(!best||distance<best.distance))best={enemy:e,point,distance,head:point.y>p.y+h-.3};}return best;}
 // Damage from the local player (campaign-compatible signature plus meta).
 damage(e,amount,meta={}){e.lastHit=meta;return this.applyDamage(e,amount,this.player,meta.weapon||'m4',!!meta.head);}
 applyDamage(victim,amount,killer,weapon,head){if(victim.dead||victim.protect>0)return false;victim.hp-=amount;if(killer&&killer!==victim)(victim._hitBy??=new Map()).set(killer,performance.now());const from=this.feet(killer);if(from){victim.lastKnown=from.clone();victim.lastKnownAt=this.time;}const kp=this.feet(killer),dir=victim.lastHit?.dir?victim.lastHit.dir.clone():victim.root.position.clone().sub(kp||victim.root.position).setY(0).normalize();if(victim.hp>0){const right=new THREE.Vector3(Math.cos(victim.root.rotation.y),0,-Math.sin(victim.root.rotation.y));victim.motion.hit(dir.dot(right)>0?1:-1);victim.motion.limp=victim.hp<45?1:0;this.cb.hurt?.(victim,killer);if(!victim.isPlayer&&victim.hp<60)victim.wantCover=true;}
  if(victim.hp<=0){const force=victim.lastHit?.force||(head?4.8:3.6);victim.ragdoll.start(dir.setY(Math.max(dir.y,0)).normalize().multiplyScalar(force).add(new THREE.Vector3(0,victim.lastHit?.force?force*.5:.4,0)),victim.lastHit?.point||null);victim.lastHit=null;victim.hp=0;victim.dead=true;victim.respawnIn=4.5;victim.deathTime=0;victim.target=null;victim.path=[];victim.tag.visible=false;this.cb.kill(killer,victim,weapon,head);return true;}return false;}
 visible(from,to){return this.nav.clear(from,to,false);}
 fire(e,target){if(e.reloadT>0)return;const wd=WEAPON_DATA[e.weapon],from=this.eye(e),aim=this.chest(target),dist=from.distanceTo(aim),d=this.diff;
  const falloff={shotgun:.028,smg:.011,sniper:.0015}[e.weapon]??.0065;let chance=.5*d.acc-dist*falloff+(e.weapon==='sniper'?.12:0);if(target.isPlayer){if(this.cb.playerSpeed()>2.5)chance-=.1;if(this.cb.playerCrouch())chance-=.07;}else{if(target.speed>2)chance-=.08;if(target.crouch)chance-=.06;}if(e.speed>1.5)chance-=.08;chance=THREE.MathUtils.clamp(chance,.04,.85);
  const hit=this.rand()<chance,head=hit&&this.rand()<.14;let dmg=e.weapon==='shotgun'?Math.max(8,75*(1-dist/34)):wd.damage*.6*d.dmg;if(e.weapon==='sniper')dmg=wd.damage*.78*d.dmg;if(head)dmg*=2;
  const end=hit?aim:aim.clone().add(new THREE.Vector3((this.rand()-.5)*1.6,(this.rand()-.3)*1.2,(this.rand()-.5)*1.6));this.cb.shot(e,e.motion.muzzle?.()||from,end);e.motion.shoot?.();e.fired=wd.silent?0:1.4;this.noise(from,wd.noise*.7,e.team);
  if(hit){if(target.isPlayer)this.cb.hurtPlayer(dmg,e,head);else{this.cb.blood?.(aim,aim.clone().sub(from).normalize(),head);target.lastHit={dir:aim.clone().sub(from).normalize(),point:aim.clone()};this.applyDamage(target,dmg,e,e.weapon,head);}}
  if(wd.auto){e.burstLeft--;if(e.burstLeft>0)e.fireTime=wd.interval*1.3;else{e.burstLeft=3+Math.floor(this.rand()*4);e.fireTime=.45+this.rand()*.6;}}else e.fireTime=wd.interval*1.25+this.rand()*(e.weapon==='sniper'?1.2:.4);
  e.mag--;if(e.mag<=0)this.startReload(e);}
 // Empty magazine: reload with animation and a call-out; under fire this also sends the soldier to cover.
 startReload(e){const wd=WEAPON_DATA[e.weapon];e.reloadT=(wd.reloadTime||2.2)*1.1;e.motion.reload?.(e.reloadT);if(this.rand()<.6)this.cb.say?.(e,'reload');if(e.target)e.wantCover=true;}
 update(dt,playerFeet,camera,crouching){this.time+=dt;this.pathBudget=3;this.squads?.update(dt,(()=>{const sc={blue:0,red:0};for(const a of [this.player,...this.list])sc[a.team]=(sc[a.team]||0)+a.kills;return sc;})());const camPos=camera.position,view=camera.getWorldDirection(new THREE.Vector3());
  for(const e of this.list){const p=e.root.position,dist=p.distanceTo(playerFeet);e.protect=Math.max(0,e.protect-dt);e.spotted=Math.max(0,e.spotted-dt);e.fired=Math.max(0,e.fired-dt);
   if(e.dead){e.deathTime+=dt;if(e.ragdoll.active)e.ragdoll.update(dt);else if(e.deathTime<2.6)e.motion.update(dt,0,false,false,true);e.respawnIn-=dt;if(e.respawnIn<=0)this.respawn(e);continue;}
   e.think-=dt;e.fireTime-=dt;e.strafeTime-=dt;e.nadeCd-=dt;e.modeT+=dt;
   if(e.reloadT>0){e.reloadT-=dt;if(e.reloadT<=0)e.mag=magSize(e.weapon);}
   if(e.pendingNade){e.pendingNade.t-=dt;if(e.pendingNade.t<=0){const n=e.pendingNade;e.pendingNade=null;this.cb.throwGrenade(e,this.eye(e).addScaledVector(n.fwd,.4),n.dir,n.power);}}
   if(e.target&&(e.target.isPlayer?!this.cb.playerAlive():e.target.dead))e.target=null;
   if(e.think<=0){e.think=.18+this.rand()*.08;const eye=this.eye(e),forward=new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y));
    const candidates=this.opponents(e).map(a=>({a,d:this.feet(a).distanceTo(p)})).filter(c=>c.d<85).sort((x,y)=>x.d-y.d).slice(0,3);let found=null;
    for(const c of candidates){const target=this.chest(c.a),dir=target.clone().sub(eye).normalize();const inView=c.d<7||forward.dot(dir)>.25||c.a===e.target||this.time-e.lastKnownAt<1.5;if(inView&&this.visible(eye,target)){found=c.a;break;}}
    if(found){if(found!==e.target){const fresh=!e.target&&this.time-e.lastKnownAt>4;e.target=found;e.reaction=(.32+this.rand()*.35)*this.diff.react;this.squads?.share(e,found,this.feet(found));if(fresh&&this.rand()<.35)this.cb.say?.(e,'contact');}e.lastKnown=this.feet(found).clone();e.lastKnownAt=this.time;e.path=[];}
    else if(e.target){e.target=null;}
    if(e.target&&e.nadeCd<=0){const tp=this.feet(e.target),d=tp.distanceTo(p);if(d>9&&d<24&&this.rand()<.09){e.nadeCd=28+this.rand()*20;const dir=tp.clone().sub(p).setY(0).normalize().setY(.85);e.pendingNade={t:.42,fwd:forward.clone(),dir,power:THREE.MathUtils.clamp(Math.sqrt(d*12),8,17)};e.motion.throwNade?.();if(this.rand()<.7)this.cb.say?.(e,'grenade');}}
    // Cover / retreat decisions (hurt, reloading under fire, or badly wounded).
    if(e.target&&e.wantCover&&e.mode!=='cover'&&this.pathBudget>1){e.wantCover=false;this.pathBudget-=2;const c=this.nav.cover(p,this.chest(e.target));if(c){e.mode='cover';e.coverPos=c;e.modeT=0;e.peekT=1+this.rand();e.peeking=false;if(this.rand()<.4)this.cb.say?.(e,e.hp<35?'retreat':'cover');}}
    if(e.target&&e.hp<30&&!e.retreated){e.retreated=true;this.cb.say?.(e,'retreat');const ally=this.list.filter(o=>o!==e&&!o.dead&&!o.target&&!this.foe(o,e)).sort((a,b)=>a.root.position.distanceTo(p)-b.root.position.distanceTo(p))[0];if(ally&&ally.root.position.distanceTo(p)<40){ally.lastKnown=this.feet(e.target).clone();ally.lastKnownAt=this.time;ally.path=[];setTimeout(()=>this.cb.say?.(ally,'cover'),700);}}
    if(e.mode==='cover'&&(e.modeT>9||!e.target&&this.time-e.lastKnownAt>3)){e.mode=null;e.coverPos=null;}
    if(!e.target&&!e.path.length&&e.holdT>0){}else if(!e.target&&!e.path.length){const goal=e.lastKnown&&this.time-e.lastKnownAt<9&&e.lastKnown.distanceTo(p)>2?e.lastKnown:this.roam(e);if(goal===e.lastKnown&&goal.distanceTo(p)<=2)e.lastKnown=null;this.route(e,goal);}
    // Is this enemy visible to the local player? (name tag + radar)
    if(this.foe(e,this.player)&&dist<75){const head=p.clone().add(new THREE.Vector3(0,1.5,0)),dir=head.clone().sub(camPos).normalize();if(view.dot(dir)>.45&&this.visible(camPos,head))e.spotted=.5;}
   }
   e.speed=0;let firing=false;
   if(e.target){const tp=this.feet(e.target),to=tp.clone().sub(p);to.y=0;const d=to.length();to.normalize();const yaw=Math.atan2(to.x,to.z);e.root.rotation.y+=Math.atan2(Math.sin(yaw-e.root.rotation.y),Math.cos(yaw-e.root.rotation.y))*Math.min(1,dt*10);
    if(e.mode==='cover'&&e.coverPos){e.peekT-=dt;if(e.peekT<=0){e.peeking=!e.peeking;e.peekT=e.peeking?1.1+this.rand()*.9:.8+this.rand()*.8;}}
    const hidden=e.mode==='cover'&&e.coverPos&&!e.peeking;
    e.reaction-=dt;if(e.reaction<=0&&e.fireTime<=0&&e.reloadT<=0&&!hidden&&!e.pendingNade){this.fire(e,e.target);firing=true;}
    if(e.strafeTime<=0){e.strafeDir=this.rand()<.5?1:-1;e.strafeTime=.5+this.rand()*1.1;e.crouchHold=e.weapon==='sniper'?this.rand()<.7:this.rand()<.22;}
    const want=e.weapon==='shotgun'?7:e.weapon==='smg'?12:e.weapon==='sniper'?40:22;const move=new THREE.Vector3(-to.z,0,to.x).multiplyScalar(e.strafeDir);if(d>want+6)move.addScaledVector(to,1.2);else if(d<4)move.addScaledVector(to,-1);
    if(e.mode==='cover'&&e.coverPos){const c=e.coverPos.clone().sub(p);c.y=0;if(c.length()>.6){e.crouch=false;e.speed=this.nav.move(e,c,dt,4.2);}else{e.crouch=!e.peeking;e.speed=0;if(e.peeking){e.speed=this.nav.move(e,move.setLength(.6),dt,.9);}}}
    else{e.crouch=e.crouchHold;e.speed=this.nav.move(e,move,dt,e.crouch?1.3:2.6);}
   } else if(e.path.length){e.crouch=false;const target=e.path[0],dir=target.clone().sub(p);dir.y=0;if(dir.length()<.4)e.path.shift();else{e.speed=this.nav.move(e,dir,dt,this.time-e.lastKnownAt<9?4.6:3.6);const yaw=Math.atan2(dir.x,dir.z);e.root.rotation.y+=Math.atan2(Math.sin(yaw-e.root.rotation.y),Math.cos(yaw-e.root.rotation.y))*Math.min(1,dt*8);if(e.speed<.05)e.stuck+=dt;else e.stuck=0;if(e.stuck>1){e.path=[];e.stuck=0;}}}
   else if(e.holdT>0){e.holdT-=dt;e.crouch=true;}
   else e.crouch=false;
   // Aim tracking (pitch) while engaged; slow look-around scan when holding or idle.
   if(e.target){const tc=this.chest(e.target),ey=this.eye(e);e.motion.aimPitch=Math.atan2(tc.y-ey.y,Math.hypot(tc.x-ey.x,tc.z-ey.z));e.motion.scanYaw*=.85;}else{e.motion.aimPitch*=.9;e.motion.scanYaw=!e.path.length?Math.sin(this.time*.8+e.id*1.7)*.55:e.motion.scanYaw*.9;}
   p.x=THREE.MathUtils.clamp(p.x,ARENA.minX+.8,ARENA.maxX-.8);p.z=THREE.MathUtils.clamp(p.z,ARENA.minZ+.8,ARENA.maxZ-.8);
   if(dist<130)e.motion.update(dt,e.speed,e.crouch,firing||!!e.target,false);
   e.tag.visible=!this.foe(e,this.player)||e.spotted>0;
  }
  // Light separation so bots do not stack inside each other.
  for(let i=0;i<this.list.length;i++)for(let j=i+1;j<this.list.length;j++){const a=this.list[i],b=this.list[j];if(a.dead||b.dead)continue;const d=a.root.position.clone().sub(b.root.position);d.y=0;const l=d.length();if(l>.001&&l<.7){d.multiplyScalar((.7-l)/l/2);a.root.position.add(d);b.root.position.sub(d);}}
 }
 get alive(){return this.list.filter(e=>!e.dead).length;}
}

export {plate,TINT};
export class TDMMatch {
 constructor({scene,nav,equipment,audio,flash,onEvent,opts}){Object.assign(this,{scene,nav,equipment,audio,flash,onEvent:onEvent||(()=>{})});this.limit=opts.scoreLimit||SCORE_LIMIT;this.duration=opts.duration||MATCH_SECONDS;
  this.health=100;this.armor=0;this.medkits=0;this.kills=0;this.deaths=0;this.headshots=0;this.dead=false;this.won=false;this.ended=false;this.alarm=false;this.alarmCount=0;this.damageFlash=0;this.items=[];this.hackTarget=null;this.hackTime=0;this.elapsed=0;
  this.score={blue:0,red:0};this.feed=[];this.playerDown=false;this.respawnIn=0;this.killedBy='';this.protect=2;this.lastHurt=99;this.grenadesLeft=2;this.uavTime=0;this.streak=0;this.bestStreak=0;this.multi=0;this.multiTime=0;this.hits=[];this.strikes=[];this.drops=[];this.dropGeo=new THREE.BoxGeometry(.4,.25,.3);this.dropMat=new THREE.MeshStandardMaterial({color:0x566246,emissive:0x2c3a1c,emissiveIntensity:.6});}
 attach(bots,grenades,playerFeet){this.bots=bots;this.grenades=grenades;this.player=bots.player;this.playerFeet=playerFeet;}
 get objective(){return {text:`TEAM DEATHMATCH · FIRST TO ${this.limit}`,position:BASES.red};}
 get timeLeft(){return Math.max(0,this.duration-this.elapsed);}
 nearby(){return null;}use(){return false;}heal(){return false;}
 spawnPoint(){return this.bots.bestSpawn(this.player.team);}
 hurt(amount,attacker,head=false,from=null,weapon=null){if(this.ended||this.playerDown||this.protect>0)return;const absorbed=Math.min(this.armor,amount*.5);this.armor-=absorbed;this.health=Math.max(0,this.health-(amount-absorbed));this.damageFlash=.55;this.lastHurt=0;this.audio.hurt();if(attacker&&this.player&&attacker!==this.player)(this.player._hitBy??=new Map()).set(attacker,performance.now());const src=from||attacker?.root?.position;if(src)this.hits.push({pos:src.clone(),t:1.2});if(this.health<=0)this.killEvent(attacker||this.player,this.player,weapon||attacker?.weapon||'m4',head);}
 killEvent(killer,victim,weapon,head){if(this.ended)return;if(victim.isPlayer)this.killerRef=killer!==victim?killer:null;victim.deaths++;victim.streak=0;const suicide=killer===victim;if(!suicide){killer.kills++;killer.streak++;this.score[killer.team]++;}
  // Free-for-all score: you (blue) against the best bot (red).
  if(this.bots?.ffa){this.score.blue=this.player.kills;this.score.red=Math.max(0,...this.bots.list.map(b=>b.kills));}
  // Assists: teammates of the killer who damaged the victim in the last 8 seconds.
  if(victim._hitBy&&!this.bots?.ffa){const now=performance.now();for(const [a,t] of victim._hitBy)if(a!==killer&&a.team===killer.team&&now-t<8000)a.assists=(a.assists||0)+1;victim._hitBy.clear();}
  const label=weapon==='grenade'?'FRAG':weapon==='airstrike'?'AIRSTRIKE':(WEAPON_DATA[weapon]?.label||'RIFLE');const entry={killer:suicide?'':killer.name,kteam:killer.team,victim:victim.name,vteam:victim.team,weapon:label,head,you:killer.isPlayer||victim.isPlayer};this.feed.unshift(entry);this.feed.length=Math.min(this.feed.length,6);this.onEvent('feed',entry);
  if(victim.isPlayer){this.deaths=victim.deaths;this.streak=0;this.playerDown=true;this.respawnIn=4;this.killedBy=suicide?'yourself':killer.name;this.health=0;this.onEvent('death',{by:this.killedBy,weapon:label});}
  if(killer.isPlayer&&!suicide){this.kills=killer.kills;this.streak=killer.streak;this.bestStreak=Math.max(this.bestStreak,this.streak);if(head)this.headshots++;this.audio.kill(head);this.multi=this.multiTime>0?this.multi+1:1;this.multiTime=4;this.onEvent('pop',{text:(head?'HEADSHOT ':'KILL ')+'+'+(head?125:100)});
   const multi={2:'DOUBLE KILL',3:'TRIPLE KILL',4:'MULTI KILL',5:'UNSTOPPABLE'}[Math.min(this.multi,5)];if(multi)this.onEvent('banner',{text:multi});
   if(this.streak===3){this.uavTime=20;this.onEvent('banner',{text:'UAV ONLINE',sub:'3 KILL STREAK · ENEMIES ON RADAR'});this.audio.streak();}
   if(this.streak===5){this.armor=100;this.onEvent('banner',{text:'ARMOR DROP',sub:'5 KILL STREAK · +100 ARMOR'});this.audio.streak();}
   if(this.streak===7){this.onEvent('banner',{text:'AIRSTRIKE INBOUND',sub:'7 KILL STREAK'});this.audio.streak();this.bots.list.filter(b=>!b.dead&&b.team!==this.player.team).forEach((b,i)=>this.strikes.push({t:1.4+i*.35,pos:b.root.position.clone().add(new THREE.Vector3((Math.random()-.5)*2,.3,(Math.random()-.5)*2))}));}
   if(Math.random()<.5&&victim.root)this.drop(victim.root.position);}
  if(this.score.blue>=this.limit||this.score.red>=this.limit)this.end();}
 explode(pos,owner,weapon='grenade'){const R=6.5,center=pos.clone().add(UP.clone().multiplyScalar(.3));const ownTeam=owner?.team;
  if(!this.playerDown&&this.playerFeet){const chest=this.playerFeet().clone().add(new THREE.Vector3(0,.9,0)),d=chest.distanceTo(center);if(d<R&&(owner===this.player||this.bots.ffa||ownTeam!==this.player.team)&&this.nav.clear(center,chest,false))this.hurt(140*(1-d/R)*(owner===this.player?.5:1),owner,false,pos,weapon);this.onEvent('shake',{amount:Math.max(0,1-d/22)});}
  for(const b of this.bots.list){if(b.dead||(this.bots.ffa?b===owner:b.team===ownTeam))continue;const chest=b.root.position.clone().add(new THREE.Vector3(0,1,0)),d=chest.distanceTo(center);if(d<R&&this.nav.clear(center,chest,false)){b.lastHit={dir:chest.clone().sub(center).normalize(),force:7+6*(1-d/R),point:center.clone()};const killed=this.bots.applyDamage(b,140*(1-d/R),owner,weapon,false);if(owner===this.player)this.onEvent('hit',{head:false,kill:killed});}}}
 drop(p){const m=new THREE.Mesh(this.dropGeo,this.dropMat);m.position.set(p.x,.2,p.z);this.scene.add(m);this.drops.push({mesh:m,ttl:25});}
 respawned(){this.playerDown=false;this.health=100;this.armor=0;this.protect=2.5;this.grenadesLeft=2;this.lastHurt=99;this.hits=[];}
 get respawnReady(){return this.playerDown&&this.respawnIn<=0&&!this.ended;}
 end(){if(this.ended)return;this.ended=true;this.won=true;const me=this.player?.team||'blue',them=me==='blue'?'red':'blue';this.result=this.score[me]>this.score[them]?'win':this.score[me]<this.score[them]?'loss':'draw';this.onEvent('end',{result:this.result});}
 update(dt,pos){if(this.ended)return;this.elapsed+=dt;if(this.timeLeft<=0){this.end();return;}this.damageFlash=Math.max(0,this.damageFlash-dt);this.protect=Math.max(0,this.protect-dt);this.uavTime=Math.max(0,this.uavTime-dt);this.multiTime=Math.max(0,this.multiTime-dt);this.lastHurt+=dt;
  if(!this.playerDown&&this.lastHurt>4&&this.health<100)this.health=Math.min(100,this.health+24*dt);if(this.playerDown)this.respawnIn-=dt;
  for(const h of this.hits)h.t-=dt;this.hits=this.hits.filter(h=>h.t>0);
  for(const s of this.strikes){s.t-=dt;if(s.t<=0){s.done=true;this.grenades.explodeAt(s.pos,this.player,'airstrike');}}this.strikes=this.strikes.filter(s=>!s.done);
  for(const d of this.drops){d.ttl-=dt;d.mesh.rotation.y+=dt*2;if(!this.playerDown&&d.mesh.position.distanceTo(new THREE.Vector3(pos.x,.2,pos.z))<1.4){d.ttl=0;this.equipment.addAmmo();this.grenadesLeft=Math.min(3,this.grenadesLeft+1);this.audio.pickup();this.flash('+AMMO  +GRENADE');}if(d.ttl<=0)this.scene.remove(d.mesh);}this.drops=this.drops.filter(d=>d.ttl>0);}
 get status(){return {health:this.health,score:{...this.score},kills:this.kills,deaths:this.deaths,streak:this.streak,ended:this.ended,result:this.result,elapsed:this.elapsed,playerDown:this.playerDown};}
}
