import * as THREE from 'three';
import {clone} from './vendor/SkeletonUtils.js';
import {rigClips,fitRig} from './viewmodels.js';
import {buildGun} from './gunmodels.js';
// v8.4: detailed guns are mounted in the animated rifle/pistol rigs, so they get real hands and real
// draw / fire / reload / inspect animations (the AK rig hosts the SMG, shotgun and sniper; the pistol rig
// hosts the .44). The magazine follows the rig's magazine bone during reloads.
const HOST={smg:'ak74',shotgun:'ak74',sniper:'ak74',magnum:'pistol'},HOST_SCALE={smg:1,shotgun:.94,sniper:.9,magnum:.92};
// kick = upward camera recoil per shot (radians); hip = extra random spread when not aiming.
export const WEAPON_DATA={
 knife:{label:'FIELD KNIFE',capacity:0,damage:70,range:2.8,interval:1.05,noise:3},
 m4:{label:'M4 RIFLE',capacity:30,damage:28,range:140,interval:.16,noise:70,auto:true,reloadTime:2.2,kick:.011,hip:.014},
 pistol:{label:'9MM PISTOL',capacity:15,damage:36,range:75,interval:.28,noise:40,reloadTime:1.5,kick:.018,hip:.01},
 shotgun:{label:'PUMP SHOTGUN',capacity:6,damage:16,range:36,interval:.85,noise:85,pellets:8,spread:.065,reloadTime:2.8,kick:.05,hip:0},
 suppressed:{label:'M4 SUPPRESSED',capacity:30,damage:25,range:120,interval:.18,noise:16,auto:true,reloadTime:2.2,kick:.009,hip:.014,silent:true},
 smg:{label:'K9 SMG',capacity:32,damage:19,range:60,interval:.075,noise:55,auto:true,reloadTime:1.9,kick:.008,hip:.022},
 sniper:{label:'LR-7 SNIPER',capacity:5,damage:95,range:320,interval:1.25,noise:110,reloadTime:3,kick:.07,hip:.09,scope:true},
 ak74:{label:'AK-74',capacity:30,damage:31,range:150,interval:.1,noise:78,auto:true,reloadTime:2.4,kick:.014,hip:.016,rig:true},
 ak74u:{label:'AK-74U',capacity:30,damage:25,range:95,interval:.083,noise:72,auto:true,reloadTime:2.1,kick:.011,hip:.019,rig:true},
 magnum:{label:'.44 MAGNUM',capacity:6,damage:62,range:85,interval:.55,noise:60,reloadTime:2.4,kick:.06,hip:.01}
};
export const PROCEDURAL=['pistol','shotgun','smg','sniper','magnum'];
function box(g,size,pos,color){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.35}));m.position.set(...pos);g.add(m);return m;}
function barrel(g,r,len,pos,color=0x252a2c){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,12),new THREE.MeshStandardMaterial({color,metalness:.65,roughness:.4}));m.rotation.x=Math.PI/2;m.position.set(...pos);g.add(m);return m;}
export function makeGun(type){const g=new THREE.Group(),handgun=type==='pistol'||type==='magnum';let muzzle=-.68,support=-.28;
 if(type==='pistol'){box(g,[.065,.075,.26],[0,0,-.08],0x353e42);box(g,[.06,.12,.065],[0,-.085,.01],0x171e21);barrel(g,.017,.25,[0,-.004,-.1]);box(g,[.02,.02,.025],[0,.048,-.19],0x151a1b);muzzle=-.23;support=-.015;}
 else if(type==='magnum'){box(g,[.055,.07,.2],[0,.005,-.05],0x6b7072);barrel(g,.02,.3,[0,.012,-.17],0x7a7f80);barrel(g,.038,.075,[0,-.004,-.02],0x45494a);box(g,[.055,.125,.065],[0,-.09,.05],0x5a3420);box(g,[.015,.025,.02],[0,.05,-.29],0x2a2d2e);muzzle=-.32;support=-.015;}
 else if(type==='smg'){box(g,[.07,.11,.3],[0,0,-.05],0x22282a);barrel(g,.018,.2,[0,.015,-.3]);box(g,[.045,.19,.06],[0,-.13,-.1],0x15191a);box(g,[.05,.07,.18],[0,-.005,.18],0x2c3331);box(g,[.06,.12,.07],[0,-.09,.07],0x171c1d);box(g,[.02,.03,.12],[0,.07,-.06],0x111515);muzzle=-.41;support=-.2;}
 else if(type==='sniper'){box(g,[.07,.1,.38],[0,0,-.05],0x3b4234);barrel(g,.016,.95,[0,.02,-.7]);barrel(g,.032,.36,[0,.1,-.08],0x101313);barrel(g,.04,.05,[0,.1,-.28],0x101313);barrel(g,.036,.05,[0,.1,.12],0x101313);box(g,[.075,.13,.34],[0,-.03,.29],0x4c5238);box(g,[.05,.1,.07],[0,-.09,.07],0x22281f);box(g,[.05,.07,.08],[0,-.085,-.12],0x171b16);box(g,[.06,.012,.012],[.05,.03,.05],0x1b1f1f);muzzle=-1.18;support=-.36;}
 else {box(g,[.07,.10,.24],[0,0,0],0x26302e);barrel(g,.022,.64,[0,.016,-.34]);barrel(g,.018,.50,[0,-.035,-.27]);box(g,[.085,.07,.18],[0,-.027,-.25],0x4a4937);box(g,[.07,.12,.09],[0,-.075,.08],0x212822);box(g,[.08,.12,.25],[0,-.01,.22],0x414639);}
 // Original simple glove/forearm meshes for the additional equipment.
 const palm=box(g,[.08,.105,.09],[.008,-.092,.015],0x4c5341);palm.rotation.x=-.15;const arm=barrel(g,.045,.34,[.025,-.19,.18],0xa98568);arm.rotation.x=1.05;const hand=box(g,[.08,.07,.08],[-.05,-.09,support],0x4c5341);hand.rotation.z=.3;for(const m of [palm,arm,hand])m.userData.isHand=true;g.userData.muzzle=new THREE.Vector3(0,.015,muzzle);g.userData.handgun=handgun;return g;}
function muzzleTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,1,64,64,63);g.addColorStop(0,'#fff');g.addColorStop(.16,'#fff7cb');g.addColorStop(.4,'#ffb13baa');g.addColorStop(1,'#ff600000');x.fillStyle=g;x.fillRect(0,0,128,128);x.fillStyle='#fff2bf';for(let i=0;i<7;i++){x.save();x.translate(64,64);x.rotate(i*Math.PI*2/7);x.beginPath();x.moveTo(-5,8);x.lineTo(0,-58);x.lineTo(6,8);x.fill();x.restore();}return new THREE.CanvasTexture(c);}
export class Weapons {
 // opts (optional): data = per-weapon stats (upgrades applied), order/unlocked = loadout, start = first weapon.
 constructor(pivot,knife,gun,onShot,audio,opts={}){this.pivot=pivot;this.onShot=onShot;this.audio=audio;this.data=opts.data||WEAPON_DATA;this.current=opts.start||'knife';this.busy=0;this.reloading=false;this.shots=0;this.items={};this.order=opts.order||['knife','m4','pistol','shotgun','suppressed'];this.unlocked=new Set(opts.unlocked||['knife','m4']);this.inventory={m4:{ammo:30,reserve:90},pistol:{ammo:15,reserve:45},shotgun:{ammo:6,reserve:18},suppressed:{ammo:30,reserve:60}};for(const n of ['smg','sniper','magnum','ak74','ak74u'])this.inventory[n]={ammo:this.data[n].capacity,reserve:this.data[n].capacity*3};this.flashTime=0;this.reloadTime=0;this.recoil=0;
  for(const [name,gltf] of [['knife',knife],['m4',gun],['suppressed',{scene:clone(gun.scene),animations:gun.animations}]]){const root=gltf.scene,mixer=new THREE.AnimationMixer(root),clips={};for(const original of gltf.animations){const clip=original.clone(),start=Math.min(...clip.tracks.map(t=>t.times[0]));clip.tracks.forEach(t=>t.shift(-start));clip.resetDuration();clips[clip.name]=clip;}root.traverse(o=>{if(o.isMesh)o.frustumCulled=false});pivot.add(root);this.items[name]={root,mixer,clips,action:null};mixer.addEventListener('finished',()=>{if(name===this.current&&!this.reloading){this.rest(name);}});}
  // Animated rigs (AK-74, AK-74U, pistol): fitted to the view and cut into Draw/Fire/Reload/Idle clips.
  for(const [name,rig] of Object.entries(opts.rigs||{})){const clips=rigClips(rig.gltf,rig.cfg);const fit=fitRig(rig.gltf,rig.cfg,clips.Idle||clips.Fire);const model=rig.gltf.scene,mixer=new THREE.AnimationMixer(model);model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;if(o.material&&o.material.map)o.material.map.anisotropy=8;}});pivot.add(fit.wrap);this.items[name]={root:fit.wrap,mixer,clips,action:null,rig:true,muzzle:fit.muzzle};mixer.addEventListener('finished',()=>{if(name===this.current&&!this.reloading)this.rest(name);});}
  knife.scene.scale.setScalar(.014);knife.scene.rotation.y=Math.PI;knife.scene.position.set(0,-.32,-.68);
  for(const name of ['m4','suppressed']){const r=this.items[name].root;r.scale.setScalar(.8);r.rotation.y=Math.PI;r.position.set(.1,-1.36,-.5);}
  for(const [name,host] of Object.entries(HOST)){const rig=opts.rigs?.[host];if(!rig||this.items[name])continue;try{this.items[name]=this.hostGun(name,rig,pivot);}catch(e){console.warn('hosted gun',name,e);}}
  for(const name of PROCEDURAL){if(this.items[name])continue;const root=makeGun(name);if(name==='sniper'){root.position.set(.25,-.25,-.34);root.scale.setScalar(.85);}else root.position.set(.22,-.22,-.42);root.rotation.y=-.04;pivot.add(root);this.items[name]={root,procedural:true,base:root.position.clone()};}
  const suppressor=new THREE.Group();barrel(suppressor,.025,.21,[0,0,0],0x131b1b);suppressor.position.set(.13,-.14,-1.21);pivot.add(suppressor);this.suppressor=suppressor;
  for(const name of Object.keys(this.items)){this.items[name].root.visible=name===this.current;if(!this.items[name].procedural)this.rest(name);}
  this.attachSuppressor();
  const mat=new THREE.SpriteMaterial({map:muzzleTexture(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});this.flash=new THREE.Sprite(mat);this.flash.scale.set(.2,.2,1);this.flash.position.set(.14,-.13,-1.05);pivot.add(this.flash);this.light=new THREE.PointLight(0xffb55b,0,3);this.light.position.copy(this.flash.position);pivot.add(this.light);this.flash.visible=false;
 }
 // Mount the suppressor on the suppressed rifle's barrel so it follows the rig's animations.
 attachSuppressor(){const it=this.items.suppressed;if(!it)return;let main=null;it.root.traverse(o=>{if(!main&&o.isMesh&&/^Main/.test(o.name))main=o;});if(!main)return;it.root.updateMatrixWorld(true);
  // Find the most forward vertices (barrel tip) of the rifle body in the pivot space, then mount there.
  const pos=main.geometry.attributes.position,v=new THREE.Vector3(),pts=[];for(let i=0;i<pos.count;i++){main.getVertexPosition(i,v);pts.push(v.clone().applyMatrix4(main.matrixWorld));}
  let minZ=Infinity;for(const p of pts)minZ=Math.min(minZ,p.z);const avg=(a,b)=>{const c=new THREE.Vector3();let n=0;for(const p of pts)if(p.z>=minZ+a&&p.z<=minZ+b){c.add(p);n++;}return n?c.divideScalar(n):null;};
  const tip=avg(0,.012),back=avg(.06,.1);if(!tip||!back)return;const dir=tip.clone().sub(back).normalize();
  const tipL=main.worldToLocal(tip.clone()),aheadL=main.worldToLocal(tip.clone().addScaledVector(dir,.26));const len=tipL.distanceTo(aheadL),dl=aheadL.clone().sub(tipL).normalize();
  const g=new THREE.CylinderGeometry(len*.125,len*.125,len,16);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x151a1a,metalness:.6,roughness:.45}));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dl);m.position.copy(tipL).addScaledVector(dl,len/2);m.frustumCulled=false;main.add(m);this.suppressorMounted=m;}
 get config(){return this.data[this.current];}get ammo(){return this.inventory[this.current]?.ammo||0;}set ammo(v){if(this.inventory[this.current])this.inventory[this.current].ammo=v;}get reserve(){return this.inventory[this.current]?.reserve||0;}
 rest(name){const i=this.items[name];if(i.procedural)return;i.mixer.stopAllAction();if(i.clips.Idle){i.action=i.mixer.clipAction(i.clips.Idle);i.action.reset().setLoop(THREE.LoopRepeat,Infinity).play();i.mixer.update(0);return;}const clip=i.clips[name==='knife'?'anims':'Fire']||Object.values(i.clips)[0];if(!clip)return;i.action=i.mixer.clipAction(clip);i.action.reset().play();i.mixer.update(0);i.action.paused=true;}
 play(name,duration){const i=this.items[this.current];if(i.procedural)return;const clip=i.clips[name];if(!clip)return;i.mixer.stopAllAction();i.action=i.mixer.clipAction(clip);i.action.reset().setLoop(THREE.LoopOnce,1);i.action.clampWhenFinished=true;i.action.setEffectiveTimeScale(duration?clip.duration/duration:1);i.action.play();}
 switch(name,force=false){if(!this.items[name]||(name===this.current&&!force)||(this.reloading&&!force)||!this.unlocked.has(name))return false;if(this.reloading){this.reloading=false;this.reloadTime=0;}this.items[this.current].root.visible=false;this.items[this.current].mixer?.stopAllAction();this.current=name;this.items[name].root.visible=true;this.busy=.5;this.flashTime=0;this.rest(name);if(name==='m4'||name==='suppressed'||this.items[name].rig)this.play('Draw',.5);else if(this.items[name].procedural)this.recoil=-1.4;this.audio?.ui();return true;}
 cycle(){let i=this.order.indexOf(this.current);for(let k=1;k<=this.order.length;k++){const n=this.order[(i+k)%this.order.length];if(this.unlocked.has(n)){this.switch(n);break;}}}
 attack(){if(this.busy>0||this.reloading)return false;const c=this.config;if(this.current==='knife'){this.busy=c.interval;this.play('anims',1.05);this.audio?.knife();this.onShot?.(c);return true;}if(this.ammo<=0){this.reload();return false;}this.ammo--;this.shots++;this.busy=c.interval;this.play('Fire',c.interval);this.flashTime=this.current==='suppressed'?.024:.06;this.recoil=1;this.audio?.shot(this.current);this.onShot?.(c);return true;}
 inspect(){if(this.busy>0||this.reloading)return;if(this.current==='knife'){this.busy=4.84;this.play('anims');}else if(this.items[this.current].rig&&(this.items[this.current].clips.Inspect||this.items[this.current].clips.Melee)){const c=this.items[this.current].clips.Inspect?'Inspect':'Melee';this.busy=this.items[this.current].clips[c].duration;this.play(c);}else if(!this.items[this.current].procedural){this.busy=1.04;this.play('Draw');}}
 reload(){if(this.current==='knife'||this.reloading||this.busy>0||this.ammo===this.config.capacity||!this.reserve)return false;this.reloading=true;this.reloadTime=this.config.reloadTime||2.2;this.busy=this.reloadTime;this.play(this.ammo===0?'Reload_Empty':'Reload',this.reloadTime);this.audio?.reload();return true;}
 pickup(name){if(!this.items[name])return;this.unlocked.add(name);const i=this.inventory[name];if(i)i.reserve+=this.config.capacity||30;}
 addAmmo(){for(const n of this.order){const i=this.inventory[n];if(i)i.reserve=Math.min(i.reserve+this.data[n].capacity*2,this.data[n].capacity*12);}}
 // Full magazines and reserve for every loadout weapon (used on respawn in Team Deathmatch).
 refill(mult=4){for(const n of this.order){const i=this.inventory[n];if(i){i.ammo=this.data[n].capacity;i.reserve=this.data[n].capacity*mult;}}this.reloading=false;this.reloadTime=0;this.busy=0;}
 update(dt){this.busy=Math.max(0,this.busy-dt);const i=this.items[this.current];i.mixer?.update(dt);if(this.reloading){this.reloadTime-=dt;if(this.reloadTime<=0){const inv=this.inventory[this.current],amount=Math.min(this.config.capacity-inv.ammo,inv.reserve);inv.ammo+=amount;inv.reserve-=amount;this.reloading=false;this.busy=0;this.rest(this.current);}}
 this.recoil=this.recoil<0?Math.min(0,this.recoil+dt*5):Math.max(0,this.recoil-dt*8);if(i.procedural){const kick=Math.max(0,this.recoil),k=this.current==='sniper'||this.current==='magnum'?1.6:1;i.root.position.copy(i.base);i.root.position.z+=kick*.075*k;i.root.rotation.x=kick*.12*k+(this.reloading?-.6:0)+Math.min(0,this.recoil)*.5;i.root.position.y-=(this.reloading?.16:0)+Math.max(0,-this.recoil)*.1;}
 this.flashTime-=dt;this.flash.visible=this.current!=='knife'&&this.flashTime>0;this.flash.material.rotation=Math.random()*Math.PI;const scale=this.current==='shotgun'||this.current==='sniper'?.3:this.current==='suppressed'?.08:.2;this.flash.scale.setScalar(scale);if(i.procedural)this.flash.position.copy(i.root.userData.muzzle).applyMatrix4(i.root.matrix);else if(i.rig)this.flash.position.copy(i.muzzle);else this.flash.position.set(.14,-.13,this.current==='suppressed'?-1.32:-1.05);this.light.position.copy(this.flash.position);this.light.intensity=this.flash.visible?1.8:0;this.suppressor.visible=this.current==='suppressed'&&!this.suppressorMounted;
 }
 // Mounts a detailed procedural gun into a clone of an animated rig: the rig's own gun meshes are hidden,
 // the new gun is aligned to the rig's grip (right wrist) and barrel axis, and its magazine is parented to
 // the rig's magazine node so reload animations move it.
 hostGun(name,rig,pivot){const g={scene:clone(rig.gltf.scene),animations:rig.gltf.animations};const clips=rigClips(g,rig.cfg);const fit=fitRig(g,rig.cfg,clips.Idle||clips.Fire);
  const model=g.scene,mixer=new THREE.AnimationMixer(model);const pose=clips.Idle||clips.Fire;if(pose){const a=mixer.clipAction(pose);a.play();mixer.update(0);}fit.wrap.updateMatrixWorld(true);
  let wrist=null,base=null,magNode=null;const old=[];model.traverse(o=>{if(o.isBone&&!wrist&&/^R_wrist/.test(o.name))wrist=o;if(!base&&(o.name==='base'))base=o;if(!magNode&&(o.name==='mag'||o.name==='clip'))magNode=o;if(o.isMesh&&!o.isSkinnedMesh)old.push(o);});
  if(!wrist||!base||!old.length)throw new Error('rig parts missing');
  // Scale: match our reference model's grip→muzzle distance to the real rig's.
  const ref=buildGun(/pistol/.test(rig.cfg.file)?'pistol':'ak74'),W=wrist.getWorldPosition(new THREE.Vector3());const rb=new THREE.Box3().setFromObject(ref),refLen=rb.max.z-rb.min.z;
  // fitRig scales the rig's own gun to cfg.length, so size our reference model to the same length.
  const k=(rig.cfg.length/refLen||1)*(HOST_SCALE[name]||1);// Align by the rig gun's own bounds: same rear end, same height of the receiver top, same side offset.
  const ob=new THREE.Box3();for(const o of old)ob.expandByObject(o);for(const o of old)o.visible=false;
  const gun=buildGun(name);gun.scale.setScalar(k);const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rig.cfg.yaw||0);gun.quaternion.copy(q);gun.position.set(0,0,0);gun.updateMatrixWorld(true);
  const rb2=new THREE.Box3().setFromObject(ref.clone()),refBox=new THREE.Box3();{const t=ref;t.scale.setScalar(k);t.quaternion.copy(q);t.updateMatrixWorld(true);refBox.setFromObject(t);}
  // Offset so the reference (same-family) model would occupy exactly the rig gun's box; the hosted gun shares that grip.
  const off=ob.getCenter(new THREE.Vector3()).sub(refBox.getCenter(new THREE.Vector3()));const refGrip=ref.userData.grip.clone().multiplyScalar(k).applyQuaternion(q),myGrip=gun.userData.grip.clone().multiplyScalar(k).applyQuaternion(q);
  gun.position.copy(off).add(refGrip).sub(myGrip);gun.updateMatrixWorld(true);void rb2;
  const muzzle=gun.localToWorld(gun.userData.muzzle.clone());
  fit.wrap.add(gun);gun.updateMatrixWorld(true);const mags=[];gun.traverse(o=>{if(o.isMesh&&o.userData.part==='mag')mags.push(o);});base.attach(gun);if(magNode&&!gun.userData.handgun)for(const m of mags)magNode.attach(m);
  model.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});pivot.add(fit.wrap);mixer.addEventListener('finished',()=>{if(name===this.current&&!this.reloading)this.rest(name);});
  return {root:fit.wrap,mixer,clips,action:null,rig:true,hosted:true,muzzle};}
 get state(){const i=this.items[this.current];return {current:this.current,busy:this.busy,ammo:this.ammo,reserve:this.reserve,reloading:this.reloading,animation:i.action?.getClip().name,animationTime:i.action?.time,shots:this.shots,unlocked:[...this.unlocked]};}
}
