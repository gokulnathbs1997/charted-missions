import * as THREE from 'three';
import {buildGun} from './gunmodels.js';
// v8.4 — realistic rifle handling for the third-person soldiers.
// The source model only has a "stay pose" with the AK resting on the right shoulder, muzzle pointing
// backwards. RifleRig re-mounts the rifle in front of the body and solves both arms with two-bone IK
// every frame, so the soldier can hold it at low-ready, shoulder it and aim (tracking pitch), sprint
// with it across the chest, take recoil, reload (support hand to the magazine and the pouch), throw a
// grenade, give hand signals, scan the area, sling it on the back, or drop it with the hand on death.
// All poses are in the soldier's model space: +z forward, +y up, +x the soldier's left.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),Q=()=>new THREE.Quaternion();
const _a=V(),_b=V(),_c=V(),_d=V(),_q=Q(),_q2=Q(),_m=new THREE.Matrix4();
function setWorldQuat(bone,wq){bone.parent.getWorldQuaternion(_q2);bone.quaternion.copy(_q2.invert().multiply(wq));bone.updateMatrixWorld(true);}
function rotateWorld(bone,from,to){if(from.lengthSq()<1e-10||to.lengthSq()<1e-10)return;const wq=bone.getWorldQuaternion(Q());const r=Q().setFromUnitVectors(from.clone().normalize(),to.clone().normalize());setWorldQuat(bone,r.multiply(wq));}
// Two-bone IK in world space. upper/fore/hand are bones; target & pole are world points.
export function twoBoneIK(upper,fore,hand,target,pole){const A=upper.getWorldPosition(V()),B=fore.getWorldPosition(V()),C=hand.getWorldPosition(V());const l1=A.distanceTo(B),l2=B.distanceTo(C);if(l1<1e-4||l2<1e-4)return 0;
 const dir=target.clone().sub(A);let d=dir.length();if(d<1e-4)return 0;dir.divideScalar(d);const reach=Math.min(d,(l1+l2)*.999);const cosA=THREE.MathUtils.clamp((l1*l1+reach*reach-l2*l2)/(2*l1*reach),-1,1),sinA=Math.sqrt(1-cosA*cosA);
 const pv=pole.clone().sub(A);const perp=pv.sub(dir.clone().multiplyScalar(pv.dot(dir)));if(perp.lengthSq()<1e-8)perp.set(0,-1,0);perp.normalize();
 const E=A.clone().addScaledVector(dir,l1*cosA).addScaledVector(perp,l1*sinA);rotateWorld(upper,B.clone().sub(A),E.clone().sub(A));
 const B2=fore.getWorldPosition(V()),C2=hand.getWorldPosition(V()),T=A.clone().addScaledVector(dir,reach);rotateWorld(fore,C2.clone().sub(B2),T.clone().sub(B2));return d-reach;}
const STANCES={
 // butt position, barrel direction (model space)
 ready:{b:V(-.13,1.31,.1),d:V(.2,-.36,.91)},
 aim:{b:V(-.1,1.47,.05),d:V(.03,0,1)},
 sprint:{b:V(-.11,1.27,.12),d:V(.62,-.28,.73)},
 slung:{b:V(-.17,1.02,-.17),d:V(.45,.86,.02)},
};
export class RifleRig {
 constructor(model,bones,{state='rifle'}={}){this.model=model;this.bones=bones;this.gun=model.getObjectByName('AK74M');this.ok=!!(this.gun&&bones[36]&&bones[37]&&bones[38]&&bones[13]&&bones[14]&&bones[15]);if(!this.ok)return;
  model.updateMatrixWorld(true);const hand=bones[38].bone;this.hand=hand;this.orig={parent:this.gun.parent,p:this.gun.position.clone(),q:this.gun.quaternion.clone(),s:this.gun.scale.clone()};
  // Authored grip: the right wrist's transform relative to the rifle in the source pose.
  const gq=this.gun.getWorldQuaternion(Q()),hq=hand.getWorldQuaternion(Q());this.gripQ=gq.clone().invert().multiply(hq);
  this.gripPos=this.gun.worldToLocal(hand.getWorldPosition(V()));this.scale=this.gun.getWorldScale(V()).x;
  const lb=new THREE.Box3();this.gun.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(this.gun.matrixWorld).invert();this.gun.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();lb.union(o.geometry.boundingBox.clone().applyMatrix4(_m.multiplyMatrices(inv,o.matrixWorld)));}});
  this.butt=lb.min.y;this.muzzleLocal=V((lb.min.x+lb.max.x)/2,lb.max.y,(lb.min.z+lb.max.z)/2*.5);this.fore=V(this.gripPos.x*.4,this.gripPos.y+.31/this.scale,this.gripPos.z+.035/this.scale);this.magLocal=V(this.gripPos.x*.3,this.gripPos.y+.12/this.scale,this.gripPos.z+.02/this.scale);
  this.mount=new THREE.Object3D();this.mount.name='rifleMount';model.add(this.mount);this.mount.attach(this.gun);this.gunScale=this.gun.scale.clone();
  this.state=state;this.aimK=0;this.sprintK=0;this.kick=0;this.reloadT=0;this.reloadDur=2.2;this.throwT=0;this.signalT=0;this.signal='forward';this.scan=0;this.pitch=0;this.ikLeft=true;this.mounted=true;
  this.gun.visible=state!=='hidden';
  model.userData.onRagdoll=()=>this.release();model.userData.onRagdollReset=()=>this.remount();}
 // Shows the soldier's actual weapon (detailed model) instead of the model's built-in AK. The AK object keeps
 // driving the grip/handguard geometry; the new gun is aligned so its pistol grip sits where the AK's does.
 setWeapon(type){if(!this.ok||this.weaponType===type)return;this.weaponType=type;if(this.alt){this.alt.removeFromParent();this.alt=null;}
  if(!this.akMeshes){this.akMeshes=[];this.gun.traverse(o=>{if(o.isMesh&&!o.userData.altGun)this.akMeshes.push(o);});}
  for(const m of this.akMeshes)m.visible=!type;if(!type)return;
  const ak=this.refBox||(this.refBox=(()=>{const lb=new THREE.Box3();const inv=new THREE.Matrix4().copy(this.gun.matrixWorld).invert();this.gun.traverse(o=>{if(o.isMesh&&!o.userData.altGun){o.geometry.computeBoundingBox();lb.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)));}});return lb;})());
  // buildGun frame (barrel −z, up +y) → AK local frame (barrel +y, magazine side +z).
  const rot=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(1,0,0),V(0,0,1),V(0,-1,0)));
  const ref=buildGun('ak74'),rb=new THREE.Box3().setFromObject(ref),k=(ak.max.y-ak.min.y)/(rb.max.z-rb.min.z);
  const g=buildGun(type);g.traverse(o=>{if(o.isMesh){o.userData.altGun=true;o.castShadow=true;}});const wrap=new THREE.Group();wrap.add(g);wrap.quaternion.copy(rot);wrap.scale.setScalar(k);
  // place: reference AK's centre → built-in AK's centre; then shift by the grip difference.
  const rc=rb.getCenter(V()),grip=g.userData.grip.clone().sub(buildGun('ak74').userData.grip);g.position.copy(rc).negate().sub(grip);
  wrap.position.copy(ak.getCenter(V()));wrap.userData.altGun=true;this.gun.add(wrap);this.alt=wrap;
  const mz=g.userData.muzzle.clone().add(g.position).multiplyScalar(k).applyQuaternion(rot).add(wrap.position);this.altMuzzle=mz;}
 // Death: the rifle stays in the right hand and falls with the body.
 release(){if(!this.ok||!this.mounted)return;this.model.updateMatrixWorld(true);this.hand.attach(this.gun);this.mounted=false;}
 // Legacy authored pose: rifle back on the shoulder exactly as in the source model (used by a few cinematic shots).
 toShoulder(){if(this.gun.parent!==this.orig.parent){this.orig.parent.add(this.gun);}this.gun.position.copy(this.orig.p);this.gun.quaternion.copy(this.orig.q);this.gun.scale.copy(this.orig.s);this.mounted=false;this.onShoulder=true;}
 remount(){if(!this.ok||(this.mounted&&!this.onShoulder))return;this.onShoulder=false;this.mounted=false;this.mount.attach(this.gun);this.gun.scale.copy(this.gunScale);this.mounted=true;}
 fire(){this.kick=1;}
 reload(dur=2.2){this.reloadDur=dur;this.reloadT=dur;}
 throwNade(){this.throwT=.85;}
 handSignal(kind='forward'){this.signal=kind;this.signalT=1.1;}
 get busy(){return this.reloadT>0||this.throwT>0;}
 // World position of the muzzle (for flashes and tracers).
 muzzle(){if(!this.ok)return null;return this.gun.localToWorld((this.alt?this.altMuzzle:this.muzzleLocal).clone());}
 // Places the rifle and solves both arms. ctx: {dt, speed, crouch(0..1), aim(bool), phase}
 apply(ctx){if(!this.ok)return;const {dt}=ctx;this.gun.visible=this.state!=='hidden';if(this.state==='hand'){if(!this.onShoulder&&(this.mounted))this.toShoulder();return;}if(this.onShoulder)this.remount();if(!this.mounted||this.state==='hidden')return;
  this.kick=Math.max(0,this.kick-dt*12);this.reloadT=Math.max(0,this.reloadT-dt);this.throwT=Math.max(0,this.throwT-dt);this.signalT=Math.max(0,this.signalT-dt);
  const slung=this.state==='slung';
  this.aimK=THREE.MathUtils.damp(this.aimK,ctx.aim&&!this.busy&&!slung?1:0,9,dt);this.sprintK=THREE.MathUtils.damp(this.sprintK,ctx.speed>3.6&&!ctx.aim&&!slung?1:0,6,dt);
  let b,d;if(slung){b=STANCES.slung.b.clone();d=STANCES.slung.d.clone().normalize();}
  else{const r=STANCES.ready,a=STANCES.aim,s=STANCES.sprint;b=r.b.clone().lerp(a.b,this.aimK).lerp(s.b,this.sprintK);d=r.d.clone().normalize().lerp(a.d.clone().normalize(),this.aimK).lerp(s.d.clone().normalize(),this.sprintK).normalize();
   // Aim pitch (tracks the target up/down), recoil, walk sway.
   if(this.aimK>.01){const p=this.pitch*this.aimK;d.applyAxisAngle(V(1,0,0),-p);b.y+=Math.sin(p)*.05;}
   // Reload: roll the rifle, dip the muzzle, bring it toward the chest.
   if(this.reloadT>0){const u=1-this.reloadT/this.reloadDur,k=Math.sin(Math.min(1,u*1.15)*Math.PI);d.applyAxisAngle(V(1,0,0),.42*k).applyAxisAngle(V(0,1,0),.35*k).normalize();b.add(V(.05*k,.03*k,-.02*k));this._roll=-.75*k;}else this._roll=0;
   if(this.throwT>0){const k=Math.sin(Math.min(1,(1-this.throwT/.85)*1.1)*Math.PI);b.add(V(-.04*k,-.08*k,-.02*k));d.lerp(STANCES.ready.d.clone().normalize(),k).normalize();}
   if(this.scan){d.applyAxisAngle(V(0,1,0),this.scan);b.applyAxisAngle(V(0,1,0),this.scan*.6);}}
  // Smooth every change of carry (draw from the back, raise to aim, lower) instead of snapping.
  const fresh=!this.cb;if(fresh){this.cb=b.clone();this.cd=d.clone();this.lastState=this.state;}
  if(this.lastState!==this.state){this.transT=.65;this.lastState=this.state;}this.transT=Math.max(0,(this.transT||0)-dt);
  const rate=this.transT>0?6:20,kk=dt>0?1-Math.exp(-dt*rate):0;this.cb.lerp(b,kk);this.cd.lerp(d,kk).normalize();b=this.cb.clone();d=this.cd.clone();
  if(!slung){const g=Math.min(1,ctx.speed/3);b.x+=Math.sin(ctx.phase)*.012*g;b.y+=Math.abs(Math.cos(ctx.phase))*.014*g;if(this.kick>0){b.z-=.035*this.kick;d.y+=.07*this.kick;d.normalize();}}
  // Rifle transform. The AK74M mesh's local axes: +y = barrel (muzzle), −z = magazine / pistol-grip side,
  // so local +z must point UP (sights on top). v8.6 fix: this was inverted, which showed the rifle upside down.
  const up=V(0,1,0);if(this._roll)up.applyAxisAngle(d,this._roll);const U=up.sub(d.clone().multiplyScalar(up.dot(d))).normalize();const X=d.clone().cross(U).normalize();const Z=U.clone();
  _m.makeBasis(X,d,Z);this.gun.quaternion.setFromRotationMatrix(_m);this.gun.position.copy(b).addScaledVector(d,-this.butt*this.scale);
  this.model.updateMatrixWorld(true);if(slung&&!(this.transT>.2))return;
  const B=this.bones,toW=v=>this.model.localToWorld(v.clone());
  // Right hand: authored grip on the pistol grip.
  const gripW=this.gun.localToWorld(this.gripPos.clone());const sh=B[36].bone.getWorldPosition(V());
  twoBoneIK(B[36].bone,B[37].bone,B[38].bone,gripW,sh.clone().add(toW(V(-.55,-.9,-.35)).sub(toW(V()))));
  setWorldQuat(B[38].bone,this.gun.getWorldQuaternion(Q()).multiply(this.gripQ));
  // Left hand: handguard, magazine (reload), throw arc or hand signal.
  if(!this.ikLeft)return;let t,fingers;const L=B[13].bone.getWorldPosition(V());
  if(this.signalT>0){const k=Math.min(1,this.signalT*4,(1.1-this.signalT)*6);const sig={forward:V(.2,1.62,.42),left:V(.62,1.5,.12),right:V(-.1,1.58,.45),hold:V(.24,1.82,.08),regroup:V(.22+Math.cos(this.signalT*9)*.12,1.86,.05+Math.sin(this.signalT*9)*.12),cover:V(.3,1.7,.2)}[this.signal]||V(.2,1.62,.42);
   t=this.gun.localToWorld(this.fore.clone()).lerp(toW(sig),k);fingers=this.signal==='hold'?toW(V(0,2.4,0)).sub(toW(V())):this.signal==='left'?toW(V(1,0,.1)).sub(toW(V())):toW(V(0,.15,1)).sub(toW(V()));}
  else if(this.throwT>0){const u=1-this.throwT/.85;const p=u<.45?V(.28,1.55,-.05).lerp(V(.3,1.82,-.26),u/.45):V(.3,1.82,-.26).lerp(V(.12,1.58,.62),Math.min(1,(u-.45)/.3));t=toW(p);fingers=toW(V(0,.4,1)).sub(toW(V()));}
  else if(this.reloadT>0){const u=1-this.reloadT/this.reloadDur;const mag=this.gun.localToWorld(this.magLocal.clone()),pouch=toW(V(.12,1.08,.17)),fore=this.gun.localToWorld(this.fore.clone());
   t=u<.18?fore.lerp(mag,u/.18):u<.38?mag:u<.55?mag.lerp(pouch,(u-.38)/.17):u<.72?pouch.lerp(mag,(u-.55)/.17):u<.86?mag:mag.lerp(fore,(u-.86)/.14);fingers=null;}
  else{t=this.gun.localToWorld(this.fore.clone());fingers=null;}
  twoBoneIK(B[13].bone,B[14].bone,B[15].bone,t,L.clone().add(toW(V(.45,-.95,.05)).sub(toW(V()))));
  // Support hand under the handguard, fingers wrapping across toward the right side.
  const wrist=B[15].bone.getWorldPosition(V());let fb=B[21]?.bone||B[16]?.bone;if(fb){const f0=fb.getWorldPosition(V()).sub(wrist);const want=fingers||this.gun.localToWorld(this.fore.clone().add(V(-.06/this.scale,.02/this.scale,-.05/this.scale))).sub(this.gun.localToWorld(this.fore.clone()));rotateWorld(B[15].bone,f0,want);}}
}
