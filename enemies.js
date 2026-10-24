import * as THREE from 'three';
import {clone} from './vendor/SkeletonUtils.js';
import {Ragdoll} from './ragdoll.js';
import {RifleRig} from './rifle.js';
const Y=new THREE.Vector3(0,1,0), X=new THREE.Vector3(1,0,0);
// The uploaded file has only 'stay pose'. These are newly authored additive skeletal motions.
export class SoldierMotion {
 // opts.gun: 'rifle' (held with arm IK, default) · 'slung' · 'hidden' · 'hand' (legacy shoulder pose). opts.autoIK=false lets the caller run solve() after extra poses.
 constructor(model,clip,opts={}){this.model=model;this.mixer=new THREE.AnimationMixer(model);if(clip){this.mixer.clipAction(clip).play();this.mixer.update(0);}model.updateMatrixWorld(true);this.bones={};model.traverse(o=>{if(o.isBone){const match=o.name.match(/Bone[._]?(\d+)_base/);if(match){const parent=o.parent.getWorldQuaternion(new THREE.Quaternion());this.bones[+match[1]]={bone:o,rest:o.quaternion.clone(),axis:X.clone().applyQuaternion(parent.invert()),pos:o.position.clone()};}}});this.phase=0;this.crouch=0;this.flinch=0;this.flinchSide=1;this.cheer=0;this.cower=0;this.limp=0;this.aimPitch=0;this.scanYaw=0;this.autoIK=opts.autoIK!==false;
  const rig=new RifleRig(model,this.bones,{state:opts.gun||'rifle'});this.rifle=rig.ok?rig:null;}
 // Rifle actions (v8.4): recoil, reload, grenade throw, hand signals; muzzle position for flashes/tracers.
 shoot(){this.rifle?.fire();}
 reload(d=2.2){this.rifle?.reload(d);}
 throwNade(){this.rifle?.throwNade();}
 signal(kind){this.rifle?.handSignal(kind);}
 setWeapon(type){this.rifle?.setWeapon(type);}
 muzzle(){return this.rifle?.muzzle()||null;}
 get busy(){return !!this.rifle?.busy;}
 solve(dt,speed=0,aim=false){if(!this.rifle)return;this.rifle.pitch=this.aimPitch;this.rifle.scan=this.scanYaw;this.rifle.ikLeft=this.cower<=0&&!this.noLeftIK;this.rifle.apply({dt,speed,aim,phase:this.phase});}
 // Body language: flinch when hit, cheer (arm raised), cower (head down, arms up), limp when wounded.
 hit(side=1){this.flinch=1;this.flinchSide=side;}
 bend(id,angle){const b=this.bones[id];if(b)b.bone.quaternion.copy(b.rest).premultiply(new THREE.Quaternion().setFromAxisAngle(b.axis,angle));}
 update(dt,speed,crouch,fire,dead){this.phase+=dt*(speed>2?11:7);this.crouch=THREE.MathUtils.damp(this.crouch,crouch?1:0,10,dt);const c=this.crouch,gait=Math.min(speed/3,1);for(const b of Object.values(this.bones))b.bone.quaternion.copy(b.rest);
  const swing=Math.sin(this.phase)*gait*(speed>2?.75:.45);this.bend(7,swing-.72*c);this.bend(10,-swing-.72*c);this.bend(8,Math.max(0,-swing)*1.2+1.3*c);this.bend(11,Math.max(0,swing)*1.2+1.3*c);this.bend(9,-.42*c);this.bend(12,-.42*c);this.bend(2,-.09*gait+.2*c);this.bend(3,fire?-.07:Math.sin(this.phase*.35)*.015);this.model.position.y=-c*.34+Math.abs(Math.sin(this.phase))*gait*.035;
  if(this.flinch>0){const f=this.flinch;this.bend(3,-.45*f);this.bend(4,-.35*f);this.bend(13,-.5*f*this.flinchSide);this.bend(36,-.5*f);this.flinch=Math.max(0,f-dt*3.2);}
  if(this.limp>0){this.bend(2,.18*this.limp);this.bend(4,.2*this.limp);}
  this.cheer=Math.max(0,this.cheer-dt);if(this.cheer>0){const k=Math.min(1,this.cheer*2)*Math.min(1,(2.5-this.cheer)*3);this.bend(36,-2.2*k);this.bend(37,-.9*k+Math.sin(this.phase*3)*.2*k);this.bend(4,-.25*k);}
  this.cower=Math.max(0,this.cower-dt);if(this.cower>0){const k=Math.min(1,this.cower*2);this.bend(4,.6*k);this.bend(3,.35*k);this.bend(13,-1.5*k);this.bend(36,-1.5*k);this.bend(14,-1.2*k);this.bend(37,-1.2*k);}
  if(dead){this.model.rotation.z=THREE.MathUtils.damp(this.model.rotation.z,1.48,7,dt);this.model.position.y=.25;this.rifle?.release();return;}
  if(this.rifle){if(this.cheer>0&&this.rifle.signalT<=0&&this.cheer>1.6)this.rifle.handSignal('hold');if(this.autoIK)this.solve(dt,speed,fire);}
 }
}
export class Enemies {
 constructor(gltf,scene,nav,boxes,spawn,callbacks){this.scene=scene;this.nav=nav;this.callbacks=callbacks;this.list=[];this.lastNoise=null;this.tick=0;this.alarmed=false;this.lastKnown=spawn.clone();this.rngSeed=4301;
  const near=boxes.filter(b=>b.getCenter(new THREE.Vector3()).distanceTo(spawn)<175).sort((a,b)=>a.getCenter(new THREE.Vector3()).distanceTo(spawn)-b.getCenter(new THREE.Vector3()).distanceTo(spawn));
  const spots=[];if(callbacks.spots)spots.push(...callbacks.spots.filter(s=>s&&s.pos));else for(const b of near){if(spots.length>=18)break;const center=b.getCenter(new THREE.Vector3());center.y=0;const indoor=nav.nearest(center,7,true);if(indoor&&indoor.distanceTo(spawn)>18&&spots.every(s=>s.pos.distanceTo(indoor)>6))spots.push({pos:indoor,indoor:true});}
  if(!callbacks.spots)for(const [x,z] of [[25,26],[-10,33],[38,3],[-35,-3],[8,-38],[45,-45],[-45,45],[70,64],[-70,-65],[130,65],[-130,65],[65,130]]){const p=nav.nearest(new THREE.Vector3(x,0,z),8);if(p&&p.distanceTo(spawn)>17)spots.push({pos:p,indoor:false});}
  this.viewDist=callbacks.viewDist||110;for(const spot of spots.slice(0,callbacks.max||28)){const root=new THREE.Group(),model=clone(gltf.scene);model.traverse(o=>{if(o.isCamera||o.isLight)o.visible=false;if(o.isMesh){o.frustumCulled=false;}});root.add(model);root.position.copy(spot.pos);scene.add(root);const motion=new SoldierMotion(model,gltf.animations[0]);const ragdoll=new Ragdoll(model,motion.bones,nav.octree);const enemy={id:this.list.length,root,model,motion,ragdoll,spawn:spot.pos.clone(),indoor:spot.indoor,hp:100,state:'PATROL',awareness:0,think:Math.random()*.3,fireTime:1.2,coverTime:0,stateTime:0,path:[],goal:null,lastSeen:null,speed:0,crouch:false,dead:false,deathTime:0,patrolIndex:0,patrol:[],alertCalled:false,mag:20,reloadT:0};
   for(let i=0;i<4;i++){const angle=i*Math.PI/2,p=nav.nearest(spot.pos.clone().add(new THREE.Vector3(Math.sin(angle)*(spot.indoor?2:7),0,Math.cos(angle)*(spot.indoor?2:7))),3,spot.indoor);if(p)enemy.patrol.push(p);}if(!enemy.patrol.length||spot.stationary)enemy.patrol=[spot.pos.clone()];root.rotation.y=spot.yaw??this.random()*Math.PI*2;if(spot.stationary){enemy.stationary=true;enemy.yaw0=root.rotation.y;}if(spot.name)enemy.name=spot.name;
   this.list.push(enemy);
  }
 }
 random(){this.rngSeed=(Math.imul(this.rngSeed,1664525)+1013904223)>>>0;return this.rngSeed/4294967296;}
 noise(pos,radius){this.lastNoise={pos:pos.clone(),radius,ttl:1.2};}
 setState(e,state){if(e.state!==state){const prev=e.state;this.voice?.state(e,state,prev,this);if(state==='ALARM'||(state==='ATTACK'&&['PATROL','INVESTIGATE','SEARCH'].includes(prev)&&this.random()<.6))e.motion?.signal(state==='ALARM'?'hold':'forward');else if(state==='SEARCH'&&this.random()<.4)e.motion?.signal(e.id%2?'left':'regroup');e.state=state;e.stateTime=0;e.path=[];e.goal=null;}}
 route(e,to){if(!to)return;e.goal=to.clone();e.path=this.nav.path(e.root.position,to);}
 damage(e,amount,meta={}){if(e.dead)return;e.hp-=amount;e.awareness=1;e.lastSeen=this.callbacks.player().clone();this.lastKnown.copy(e.lastSeen);const from=meta.dir?meta.dir.clone():e.root.position.clone().sub(this.callbacks.player()).setY(0).normalize();
  if(e.hp<=0){e.dead=true;e.hp=0;e.state='DOWN';const force=meta.force||(meta.head?4.8:3.6);const impulse=from.clone().setY(Math.max(from.y,0)).normalize().multiplyScalar(force).add(new THREE.Vector3(0,meta.force?force*.5:.4,0));e.ragdoll.start(impulse,meta.point||null);this.voice?.death(e,meta,this);this.callbacks.onKill(e,meta);return;}
  const right=new THREE.Vector3(Math.cos(e.root.rotation.y),0,-Math.sin(e.root.rotation.y));e.motion.hit(from.dot(right)>0?1:-1);e.motion.limp=e.hp<45?1:0;this.callbacks.onHurt?.(e,meta);this.voice?.hurt(e,meta,this);this.setState(e,'ATTACK');}
 hit(ray,maxDistance){let best=null;for(const e of this.list){if(e.dead)continue;const p=e.root.position,h=e.crouch?1.35:1.82;const box=new THREE.Box3(new THREE.Vector3(p.x-.32,p.y,p.z-.32),new THREE.Vector3(p.x+.32,p.y+h,p.z+.32));const point=ray.intersectBox(box,new THREE.Vector3());if(!point)continue;const distance=point.distanceTo(ray.origin);if(distance<maxDistance&&(!best||distance<best.distance))best={enemy:e,point,distance,head:point.y>p.y+h-.3};}return best;}
 update(dt,player,camera,crouching){this.tick+=dt;if(this.graceT>0)this.graceT-=dt;this.voice?.tick(dt,this,player);if(this.lastNoise){this.lastNoise.ttl-=dt;if(this.lastNoise.ttl<=0)this.lastNoise=null;}const view=new THREE.Vector3();camera.getWorldDirection(view);
  for(const e of this.list){e.stateTime+=dt;e.coverTime=Math.max(0,e.coverTime-dt);const p=e.root.position,dist=p.distanceTo(player);e.root.visible=dist<this.viewDist;if(e.dead){e.deathTime+=dt;if(e.ragdoll.active)e.ragdoll.update(dt);else if(dist<this.viewDist)e.motion.update(dt,0,false,false,true);continue;}if(dist>180){e.speed=0;continue;}e.think-=dt;e.fireTime-=dt;
   if(e.think<=0){e.think=.22+this.random()*.07;const eye=p.clone().add(new THREE.Vector3(0,e.crouch?1.1:1.6,0)),dir=player.clone().sub(eye).normalize(),forward=new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y));const los=dist<45&&this.nav.clear(eye,player),cone=forward.dot(dir)>Math.cos(Math.PI*.36)||e.awareness>.6;const sees=los&&cone&&!this.playerHidden;
    if(sees){e.awareness=Math.min(1,e.awareness+(crouching?.1:.24)*(dist<12?2:1));e.lastSeen=player.clone();this.lastKnown.copy(player);}else e.awareness=Math.max(0,e.awareness-.035);
    const watched=los&&view.dot(eye.clone().sub(camera.position).normalize())>.92;
    if(this.lastNoise&&p.distanceTo(this.lastNoise.pos)<this.lastNoise.radius&&e.awareness<.7){e.lastSeen=this.lastNoise.pos.clone();this.setState(e,'INVESTIGATE');if(!e.goal)this.route(e,e.lastSeen);}
    if(this.alarmed&&e.state==='PATROL'&&dist<85){e.lastSeen=this.lastKnown.clone();this.setState(e,'SEARCH');this.route(e,e.lastSeen);}
    if(e.awareness>=.85){
     if(!e.alertCalled&&e.id%4===0&&!this.alarmed){const panel=this.callbacks.alarmTarget(p);if(panel&&p.distanceTo(panel.position)<24){e.alertCalled=true;this.setState(e,'ALARM');this.route(e,panel.position);e.alarmPanel=panel;}}
     if(e.state!=='ALARM'){
      if(watched&&e.coverTime===0){const cover=this.nav.cover(p,player);if(cover){this.setState(e,'SEEK_COVER');this.route(e,cover);e.coverTime=8;}}
      if(!['SEEK_COVER','COVER'].includes(e.state))this.setState(e,sees?'ATTACK':'SEARCH');
     }
    }
    if(e.state==='PATROL'&&(!e.path.length)){e.patrolIndex=(e.patrolIndex+1)%e.patrol.length;this.route(e,e.patrol[e.patrolIndex]);}
    if(e.state==='ALARM'&&e.alarmPanel){if(p.distanceTo(e.alarmPanel.position)<2.5){this.callbacks.raiseAlarm(e.alarmPanel);this.setState(e,'ATTACK');}}
    if(e.state==='SEEK_COVER'&&!e.path.length)this.setState(e,'COVER');
    if(e.state==='COVER'&&e.stateTime>2.5){this.setState(e,'ATTACK');}
    if(['SEARCH','INVESTIGATE'].includes(e.state)&&!e.path.length){if(e.lastSeen&&p.distanceTo(e.lastSeen)>2&&e.stateTime<10)this.route(e,this.flankPoint(e));else if(e.stateTime>6&&!this.alarmed){e.awareness=0;this.setState(e,'PATROL');}}
    if(e.state==='ATTACK'&&sees){e.path=[];e.root.rotation.y=Math.atan2(dir.x,dir.z);e.motion.aimPitch=Math.atan2(player.y-eye.y,Math.hypot(player.x-eye.x,player.z-eye.z));if(e.fireTime<=0&&e.reloadT<=0){e.fireTime=.65+this.random()*.55;e.motion.shoot();this.callbacks.enemyShot(e,e.motion.muzzle()||eye,player);if(--e.mag<=0){e.mag=20;e.reloadT=2.4;e.fireTime=Math.max(e.fireTime,2.5);e.motion.reload(2.4);this.voice?.enemy(e,'reload');}const grace=this.graceT>0?.45:1;const chance=THREE.MathUtils.clamp(.52-dist*.011-(crouching?.14:0)-(e.stateTime<1.2?.2:0),.07,.58)*grace;if(this.random()<chance){this.lastAttacker=p.clone();this.callbacks.hurt(6+this.random()*4);}}}else if(e.state==='ATTACK'&&!sees){this.setState(e,'SEARCH');if(e.lastSeen)this.route(e,e.lastSeen);}
   }
   e.reloadT=Math.max(0,e.reloadT-dt);e.crouch=(e.state==='COVER'&&Math.sin(e.stateTime*2.4+e.id)<.55)||e.state==='ATTACK'&&e.hp<55;e.speed=0;
   // Look-around scan when standing still on patrol or while searching.
   if(!e.path.length&&['PATROL','SEARCH','INVESTIGATE'].includes(e.state))e.motion.scanYaw=Math.sin(this.tick*(e.state==='PATROL'?.6:1.3)+e.id*1.9)*(e.state==='PATROL'?.45:.7);else e.motion.scanYaw*=.9;if(e.state!=='ATTACK')e.motion.aimPitch*=.9;
   if(e.stationary){e.path=[];if(e.state==='PATROL')e.root.rotation.y=e.yaw0+Math.sin(this.tick*.35+e.id)*.95;}
   if(e.path.length){const target=e.path[0],dir=target.clone().sub(p);dir.y=0;if(dir.length()<.35)e.path.shift();else{const speed=['SEEK_COVER','ALARM','SEARCH'].includes(e.state)?3.2:e.state==='INVESTIGATE'?2.2:1.1;e.speed=this.nav.move(e,dir,dt,speed);const targetYaw=Math.atan2(dir.x,dir.z);e.root.rotation.y+=Math.atan2(Math.sin(targetYaw-e.root.rotation.y),Math.cos(targetYaw-e.root.rotation.y))*Math.min(1,dt*9);if(e.speed<.05)e.stuck=(e.stuck||0)+dt;else e.stuck=0;if(e.stuck>1){e.path=[];e.stuck=0;}}}
   if(dist<this.viewDist+10)e.motion.update(dt,e.speed,e.crouch,['ATTACK','COVER','SEARCH','ALARM'].includes(e.state),false);
  }
 }
 // Searching guards fan out: every second/third one circles to the side of the last sighting.
 flankPoint(e){if(e.state!=='SEARCH'||!e.lastSeen||e.id%3===0)return e.lastSeen;const p=e.root.position,d=e.lastSeen.clone().sub(p);d.y=0;if(d.lengthSq()<1)return e.lastSeen;d.normalize();const side=new THREE.Vector3(-d.z,0,d.x).multiplyScalar(e.id%3===1?8:-8);return this.nav.nearest(e.lastSeen.clone().add(side),4)||e.lastSeen;}
 get alive(){return this.list.filter(e=>!e.dead).length;}
 get detected(){return Math.max(0,...this.list.filter(e=>!e.dead).map(e=>e.awareness));}
}
