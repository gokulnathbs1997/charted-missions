import * as THREE from 'three';
import {TDMBots,BASES} from './tdm.js';
// Online Team Deathmatch client. NetBots keeps the TDMBots API (list, player, hit, damage, applyDamage,
// update, bestSpawn…) so the existing match, HUD, scoreboard, killfeed and grenade code work unchanged,
// but every soldier in `list` is a real remote player driven by network snapshots.
export function defaultServer(){const q=new URLSearchParams(location.search).get('server');if(q)return q;const proto=location.protocol==='https:'?'wss:':'ws:';return `${proto}//${location.host}/ws`;}
export class NetClient {
 constructor(url){this.url=url;this.handlers=new Map();this.queue=[];this.open=false;this.closed=false;}
 connect(){return new Promise((resolve,reject)=>{let done=false;try{this.ws=new WebSocket(this.url);}catch(e){reject(e);return;}
  const timer=setTimeout(()=>{if(!done){done=true;try{this.ws.close();}catch(_){}reject(new Error('Server did not answer at '+this.url));}},6000);
  this.ws.onopen=()=>{this.open=true;for(const m of this.queue)this.ws.send(m);this.queue=[];if(!done){done=true;clearTimeout(timer);resolve(this);}};
  this.ws.onerror=()=>{if(!done){done=true;clearTimeout(timer);reject(new Error('Could not connect to '+this.url));}};
  this.ws.onclose=()=>{this.open=false;if(!this.closed)this.emit('close',{});};
  this.ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data);}catch(_){return;}if(m.t==='ping'){this.send({t:'pong'});return;}this.emit(m.t,m);};});}
 on(t,fn){this.handlers.set(t,fn);return this;}
 emit(t,m){this.handlers.get(t)?.(m);}
 send(m){const s=JSON.stringify(m);if(this.open&&this.ws.readyState===1)this.ws.send(s);else this.queue.push(s);}
 close(){this.closed=true;try{this.ws.close();}catch(_){}}
}
const r2=n=>Math.round(n*100)/100;
export class NetBots extends TDMBots {
 constructor(gltf,scene,nav,opts,cb,net){super(gltf,scene,nav,{...opts,online:true},cb);this.net=net;this.byId=new Map();this.sendT=0;this.myId=null;}
 // ---- roster ----
 addRemote(p){if(this.byId.has(p.id)||p.id===this.myId)return this.byId.get(p.id);const e=this.makeActor(p.name,p.team,1000+p.id);e.netId=p.id;e.remote=true;e.kills=p.kills||0;e.deaths=p.deaths||0;e.net={pos:new THREE.Vector3(),yaw:0,crouch:false,speed:0,firing:0,dead:false,has:false};e.root.visible=false;this.list.push(e);this.byId.set(p.id,e);if(p.state)this.applyState(e,p.state,true);return e;}
 removeRemote(id){const e=this.byId.get(id);if(!e)return;this.scene.remove(e.root);this.list.splice(this.list.indexOf(e),1);this.byId.delete(id);}
 actor(id){return id===this.myId?this.player:this.byId.get(id);}
 applyState(e,s,snap=false){const n=e.net;n.pos.set(s[0],s[1],s[2]);n.yaw=s[3];n.crouch=!!s[4];n.speed=s[5]||0;n.firing=s[6]||0;e.weapon=s[7]||e.weapon;if(e.weapon!=='knife'&&e.weapon!=='pistol'&&e.weapon!=='magnum')e.motion?.setWeapon?.(e.weapon);const dead=!!s[8];
  if(!n.has||snap){e.root.position.copy(n.pos);e.root.rotation.y=n.yaw;n.has=true;e.root.visible=!dead;}
  if(e.dead&&!dead){e.ragdoll.reset();e.dead=false;e.hp=100;e.tag.visible=true;e.root.visible=true;e.root.position.copy(n.pos);e.motion.limp=0;}
  if(!e.dead&&dead&&!e.ragdoll.active){e.dead=true;e.hp=0;}
  n.dead=dead;}
 // ---- local player → network ----
 sendState(dt,feet,yaw,crouch,speed,firing,weapon,dead){this.sendT-=dt;if(this.sendT>0)return;this.sendT=1/15;this.net.send({t:'s',s:[r2(feet.x),r2(feet.y),r2(feet.z),r2(yaw+Math.PI),crouch?1:0,r2(speed),firing?1:0,weapon,dead?1:0]});}
 // Bullets from the local player: report the hit; the victim applies damage on its own client.
 damage(e,amount,meta={}){if(!e.remote)return super.damage(e,amount,meta);if(e.dead)return false;const dir=meta.dir?[r2(meta.dir.x),r2(meta.dir.y),r2(meta.dir.z)]:null;this.net.send({t:'hit',target:e.netId,dmg:amount,head:!!meta.head,w:meta.weapon||'m4',dir});const right=new THREE.Vector3(Math.cos(e.root.rotation.y),0,-Math.sin(e.root.rotation.y));e.motion.hit(meta.dir&&meta.dir.dot(right)>0?1:-1);e.lastHit=meta;return false;}
 // Grenade/airstrike damage to remote players is computed on their own clients (grenades are replicated).
 applyDamage(victim,amount,killer,weapon,head){if(victim.remote){if(!victim.dead){victim.motion.hit(1);}return false;}return super.applyDamage(victim,amount,killer,weapon,head);}
 bestSpawn(team){const base=BASES[team],spots=this.spawns[team];const foes=this.list.filter(o=>o.team!==team&&!o.dead).map(o=>o.root.position);let best=spots[0],score=-1;for(const s of spots){const d=Math.min(60,...foes.map(p=>p.distanceTo(s)),60)+Math.random()*6;if(d>score){score=d;best=s;}}return (best||base).clone();}
 opponents(){return [];}
 noise(){}
 // Kill confirmed by the server.
 remoteKilled(e,dirArr,head){const dir=dirArr?new THREE.Vector3(...dirArr):new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y)).negate();const force=head?4.8:3.6;e.hp=0;e.dead=true;e.tag.visible=false;e.ragdoll.start(dir.setY(Math.max(dir.y,0)).normalize().multiplyScalar(force).add(new THREE.Vector3(0,.4,0)),e.root.position.clone().add(new THREE.Vector3(0,1.3,0)));}
 update(dt,playerFeet,camera,crouching){this.time+=dt;const camPos=camera.position,view=camera.getWorldDirection(new THREE.Vector3());
  for(const e of this.list){if(!e.remote)continue;const n=e.net,p=e.root.position;e.fired=Math.max(0,e.fired-dt);e.spotted=Math.max(0,e.spotted-dt);
   if(e.dead){if(e.ragdoll.active)e.ragdoll.update(dt);continue;}
   if(!n.has){e.root.visible=false;continue;}e.root.visible=true;
   // Interpolate toward the latest snapshot (snap if far, e.g. after respawn).
   if(p.distanceTo(n.pos)>6)p.copy(n.pos);else p.lerp(n.pos,Math.min(1,dt*12));e.root.rotation.y+=Math.atan2(Math.sin(n.yaw-e.root.rotation.y),Math.cos(n.yaw-e.root.rotation.y))*Math.min(1,dt*14);
   e.crouch=n.crouch;e.speed=n.speed;e.motion.update(dt,n.speed,n.crouch,n.firing>0||e.fired>0,false);
   if(e.team!==this.player.team&&p.distanceTo(camPos)<75){const head=p.clone().add(new THREE.Vector3(0,1.5,0)),dir=head.clone().sub(camPos).normalize();if(view.dot(dir)>.45&&this.visible(camPos,head))e.spotted=.5;}
   e.tag.visible=e.team===this.player.team||e.spotted>0;}
  this.detected=0;}
}
