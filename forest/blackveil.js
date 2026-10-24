import * as THREE from 'three';
import {clone} from '../vendor/SkeletonUtils.js';
import {SoldierMotion} from '../enemies.js';
import {heightAt} from './world.js';
import {curve} from './cinema.js';
// CHARTED MISSIONS — Operation Black Veil opening cinematic (~105 s, skippable).
// One hero character (Specter), one helicopter, a handful of distant guards. Shots follow the storyboard:
// 1 the world below · 2 inside the helicopter · 3 rope drop · 4 landing · 5 identify the target ·
// 6 enter the shadows · 7 first contact · 8 mission reveal · 9 title and hand-off to gameplay.
const $=s=>document.querySelector(s);
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp;
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const ground=(x,z)=>heightAt(x,z);
const shake=(t,k=1)=>V(Math.sin(t*23.1)*.012*k+Math.sin(t*7.3)*.02*k,Math.sin(t*19.7)*.01*k+Math.sin(t*5.1)*.015*k,Math.sin(t*17.3)*.012*k);

// ---------- hero actor ----------
function makeActor(gltf,scene){const root=new THREE.Group(),model=clone(gltf.scene);
 model.traverse(o=>{if(o.isCamera||o.isLight)o.visible=false;if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(/head/.test(o.name)?new THREE.Color(.95,.92,.9):new THREE.Color(.42,.44,.48));o.castShadow=true;o.frustumCulled=false;}});
 root.add(model);scene.add(root);root.visible=false;const motion=new SoldierMotion(model,gltf.animations[0],{autoIK:false});
 // Wrist-mounted mission device with a live screen.
 const cv=document.createElement('canvas');cv.width=128;cv.height=96;const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const dev=new THREE.Group();const box=new THREE.Mesh(new THREE.BoxGeometry(.075,.022,.06),new THREE.MeshStandardMaterial({color:0x15181a,roughness:.5,metalness:.5}));dev.add(box);
 box.geometry=new THREE.BoxGeometry(.075,.06,.022);const scr=new THREE.Mesh(new THREE.PlaneGeometry(.062,.047),new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:2.2}));scr.position.z=.012;dev.add(scr);
 const hand=motion.bones[15]?.bone,elbow=motion.bones[14]?.bone;if(hand){hand.add(dev);model.updateMatrixWorld(true);const ws=hand.getWorldScale(V());dev.scale.set(1/ws.x,1/ws.y,1/ws.z);const hw=hand.getWorldPosition(V()),ew=elbow?elbow.getWorldPosition(V()):hw.clone().add(V(0,.3,0));const wp=hw.clone().lerp(ew,.22).add(V(.045,0,0));dev.position.copy(hand.worldToLocal(wp.clone()));dev.lookAt(wp.clone().add(V(1,.35,.2)));}
 const draw=(lines,t=0)=>{const x=cv.getContext('2d');x.fillStyle='#03130d';x.fillRect(0,0,128,96);x.strokeStyle='#1f6';x.globalAlpha=.35;for(let i=0;i<8;i++){x.beginPath();x.moveTo(0,i*12+((t*20)%12));x.lineTo(128,i*12+((t*20)%12));x.stroke();}x.globalAlpha=1;x.fillStyle='#ff4436';x.beginPath();x.arc(84,52,5+Math.sin(t*6)*1.5,0,7);x.fill();x.strokeStyle='#8f8';x.strokeRect(70,38,28,28);x.fillStyle='#9fffc0';x.font='bold 10px monospace';lines.forEach((l,i)=>x.fillText(l,6,14+i*12));tex.needsUpdate=true;};
 draw(['BLACK VEIL','LINK: WEAK','']);
 return {root,model,motion,dev,draw,hand,
  head(){const b=motion.bones[5]?.bone;return b?b.getWorldPosition(V()):root.position.clone().add(V(0,1.7,0));},
  foot(){const b=motion.bones[9]?.bone;return b?b.getWorldPosition(V()):root.position.clone();},
  muzzle(){const mz=motion.muzzle();if(mz&&motion.rifle?.state==='rifle')return mz;const f=V(Math.sin(root.rotation.y),0,Math.cos(root.rotation.y));return root.position.clone().add(V(0,motion.crouch>.5?1.05:1.42,0)).addScaledVector(f,.85);},
  forward(){return V(Math.sin(root.rotation.y),0,Math.cos(root.rotation.y));},
  // speed m/s, flags, plus a named pose layered on top of the procedural motion.
  pose(dt,{speed=0,crouch=false,aim=false,pose=null,k=1}={}){if(motion.rifle){motion.rifle.state=['rope','sit','land'].includes(pose)?'slung':'rifle';motion.noLeftIK=pose==='wrist';}motion.update(dt,speed,crouch,aim,false);const b=(id,a)=>{const x=motion.bones[id];if(x)x.bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(x.axis,a*k));};
   if(pose==='sit'){b(7,-1.45);b(10,-1.45);b(8,1.5);b(11,1.5);b(2,.12);model.position.y=-.86*k;}
   if(pose==='rope'){b(13,-2.5);b(36,-2.5);b(14,-.5);b(37,-.5);b(7,-.55);b(10,-.25);b(8,.8);b(11,.45);b(4,-.25);}
   if(pose==='land'){b(7,-1.1);b(10,-1.1);b(8,1.7);b(11,1.7);b(9,-.6);b(12,-.6);b(2,.45);b(3,.2);model.position.y=-.55*k;}
   if(pose==='peek'){b(2,-.25);b(3,-.2);}
   if(pose==='look'){b(4,-.35);b(5,.3);}
   if(pose==='wrist'){b(13,-1.05*k);b(14,-1.5*k);b(4,.25*k);}
   if(motion.rifle){model.updateMatrixWorld(true);motion.solve(dt,speed,aim);}}};}

// ---------- shots ----------
export function blackVeilShots(C,{onDone}={}){const ctx=C.ctx,S=C.structures,E=ctx.effects,A=ctx.audio,M=C.music,heli=C.heli,cam=ctx.camera,cinema=C.cinema,W=C.world;
 const actor=C.actor||(C.actor=makeActor(ctx.assets.soldier,ctx.scene));const def=C.def,lines=def.briefing;
 const drop=C.resolve('ridgeDrop'),gy=ground(drop.x,drop.z),H=V(drop.x,gy+22,drop.z);const camp=V(0,4,0);
 const sun=W.sunDir.clone().setY(0).normalize();const side=V(-sun.z,0,sun.x);
 const lift=(p,m)=>{p.y=Math.max(p.y,ground(p.x,p.z)+m);return p;};
 const path=curve([lift(H.clone().addScaledVector(sun,720).setY(gy+150),90),lift(H.clone().addScaledVector(sun,380).addScaledVector(side,60).setY(gy+95),60),lift(H.clone().addScaledVector(sun,140).addScaledVector(side,25).setY(gy+50),35),lift(H.clone().addScaledVector(sun,40).setY(gy+28),22),H.clone()]);
 const leave=curve([H.clone(),lift(H.clone().addScaledVector(side,50).add(V(0,14,0)),25),lift(H.clone().addScaledVector(side,220).addScaledVector(sun,-160).setY(gy+110),70),lift(H.clone().addScaledVector(side,700).addScaledVector(sun,-500).setY(gy+260),120)]);
 const FLY=19.5;let fly=0;const heliAt=()=>{const u=ease(Math.min(1,fly/FLY))*.999;return {p:path.getPointAt(u),ahead:path.getPointAt(Math.min(1,u+.02))};};
 const flyStep=dt=>{fly=Math.min(FLY,fly+dt);const {p,ahead}=heliAt();heli.place(p,fly>FLY-2?H.clone().add(V(-sun.x*10,0,-sun.z*10)):ahead,dt);};
 const hover=(t,dt)=>heli.place(H.clone().add(V(Math.sin(t*1.7)*.25,Math.sin(t*2.3)*.2,Math.cos(t*1.3)*.2)),H.clone().addScaledVector(sun,-10),dt);
 // Seat the actor in the open side door of the helicopter.
 const seat=()=>{heli.root.add(actor.root);actor.root.position.set(1.05,.6,.9);actor.root.rotation.set(0,Math.PI/2,0);actor.root.visible=true;};
 const unseat=()=>{const p=actor.root.getWorldPosition(V()),q=actor.root.getWorldQuaternion(new THREE.Quaternion());ctx.scene.add(actor.root);actor.root.position.copy(p);actor.root.quaternion.copy(q);actor.root.rotation.set(0,new THREE.Euler().setFromQuaternion(q,'YXZ').y,0);};
 const redLight=new THREE.PointLight(0xff1e10,0,4,2);heli.root.add(redLight);redLight.position.set(-.2,2.1,.6);
 const fill=C.cineFill||(C.cineFill=new THREE.PointLight(0xffd9b8,0,9,1.6));if(!fill.parent)ctx.scene.add(fill);C.cineFillOn=true;
 const say=(who,text)=>cinema.say(who,text);let said={};const once=(k,fn)=>{if(!said[k]){said[k]=1;fn();}};
 // The guard who spots Specter, and a silhouette that crosses a floodlit doorway.
 const guards=C.enemies.list.filter(e=>!e.dead&&e.name!=='tower'&&!e.indoor);const G=guards[0],G2=guards[1];const fenceSpot=V(60,0,-29);fenceSpot.y=ground(60,-29);const GP=V(61.5,0,-15.5);GP.y=ground(GP.x,GP.z);
 const route=[drop.clone(),V(88,0,-74),V(70,0,-52),V(63,0,-38),fenceSpot.clone()].map(p=>p.setY(ground(p.x,p.z)));const walk=curve(route);
 const porch=S.anchors.commandPorch.clone(),door=S.doorFace.clone();const threshold=V(porch.x,porch.y,porch.z-1.2);
 const doorObj=C.doors.items.reduce((b,d)=>!b||d.hinge.distanceTo(V(door.x,d.hinge.y,door.z+4))<b.hinge.distanceTo(V(door.x,b.hinge.y,door.z+4))?d:b,null);
 const setDoor=a=>{if(!doorObj)return;doorObj.angle=a;doorObj.pivot.rotation.y=a;doorObj.pivot.updateMatrixWorld(true);C.doors.sync(doorObj);};
 const hud=(on,text)=>{const el=$('#cineHud');if(text!=null)el.innerHTML=text;el.classList.toggle('show',on);};
 const binoc=on=>{$('#binoc').hidden=!on;};
 const radioClick=()=>{A.burst?.(.07,.06,2400,{type:'bandpass'});A.burst?.(.25,.025,1800,{type:'bandpass',q:3,delay:.05});};
 const actorAt=(p,yaw)=>{actor.root.position.copy(p);if(yaw!=null)actor.root.rotation.set(0,yaw,0);};
 const yawTo=(from,to)=>Math.atan2(to.x-from.x,to.z-from.z);
 const typed=(t,full)=>full.slice(0,Math.floor(full.length*clamp(t,0,1)));
 const HUDTXT='<b>OPERATION BLACK VEIL</b>\nPRIMARY OBJECTIVE: RECOVER ENCRYPTED SATELLITE KEY\nLOCATION: ENEMY COMMUNICATIONS FACILITY\nSTATUS: INFILTRATION AUTHORIZED';
 const tracer=(a,b,red)=>{E.tracer(a,b,red);};
 const fire=(from,to,kind,dist)=>{E.muzzle(from);tracer(from,to,kind!=='m4');A.shot(kind,dist,0);};

 const shots=[
 // 1 — THE WORLD BELOW (00:00–00:09)
 // v8.5: opens on the helicopter itself — a low chase over the treetops (fade from black, location card
 // typed in), then a close side-tracking shot against the sunset — instead of a distant aerial of the forest.
 {dur:5.5,fade:[0,2.2],start(){M?.setState?.('cinematic');M?.cue('title');A.ambience?.('dusk');heli.root.visible=true;fly=0;flyStep(0);S.setSearchlights(true);radioClick();said={};
   C.introSmoke=C.introSmoke||[E.fire(V(33,ground(33,-38)+.3,-38.5),.9,{smoke:true}),E.fire(V(-20,ground(-20,30)+.2,30),.6,{smoke:true}),E.fire(V(-40,ground(-40,-30)+.2,-30),.5,{smoke:true})];},
  update(t,dt){flyStep(dt);hud(t>.22,'<b>VARGA VALLEY · 18:42</b>\n'+typed(seg(t,.25,.75),'INSERTION · CALLSIGN '+(C.callsign||'SPECTER').toUpperCase()+'\nALT 140 m · 2 MIN TO DROP'));},
  end(){hud(false);},
  cam(t){const hp=heli.root.position.clone(),{p,ahead}=heliAt();const f=ahead.clone().sub(p).setY(0).normalize(),sd=V(-f.z,0,f.x),k=ease(t);
   const pos=hp.clone().addScaledVector(f,lerp(-26,-15,k)).addScaledVector(sd,lerp(9,5,k)).add(V(0,lerp(7,3.2,k),0)).add(shake(t*6,.6));lift(pos,6);
   return {pos,look:hp.clone().addScaledVector(f,lerp(30,18,k)).add(V(0,lerp(-6,-1.5,k),0)),fov:lerp(46,52,k),roll:Math.sin(t*2.2)*.02};}},
 {dur:4,update(t,dt){flyStep(dt);},
  cam(t){const hp=heli.root.position.clone(),{p,ahead}=heliAt();const f=ahead.clone().sub(p).setY(0).normalize(),sd=V(-f.z,0,f.x);const k=ease(t);
   const pos=hp.clone().addScaledVector(sd,lerp(-11,-8,k)).addScaledVector(f,lerp(6,-3,k)).add(V(0,-1.6,0)).add(shake(t*8,.5));lift(pos,4);
   return {pos,look:hp.clone().add(V(0,.6,0)).addScaledVector(f,1.5),fov:lerp(40,34,k),roll:-.03};}},
 // 2 — INSIDE THE HELICOPTER (00:09–00:19)
 {dur:9.5,start(){seat();A.burst?.(.6,.05,600);radioClick();once('c1',()=>say(lines[0][0],lines[0][1]));},
  update(t,dt){flyStep(dt);redLight.intensity=t>.62?(Math.sin(t*40)>0?6:2):0;actor.pose(dt,{pose:t<.86?'sit':'look',k:1});if(t<.2){const bb=actor.motion.bones;const q=(id,a)=>{const x=bb[id];if(x)x.bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(x.axis,a));};q(13,-1.05);q(14,-1.5);}actor.draw(['BLACK VEIL','LINK: WEAK','ETA 00:'+String(Math.max(0,10-Math.floor(t*10))).padStart(2,'0')],t*10);
   if(t>.62)once('c2',()=>{radioClick();say(lines[1][0],lines[1][1]);});if(t>.86){actor.root.position.set(.75,.56,.9);actor.pose(0,{});}},
  cam(t,dt){const hp=heli.root.position,R=heli.root;const L=v=>v.clone().applyMatrix4(R.matrixWorld);const sh=shake(t*10,1.3);
   if(t<.2){const d=actor.dev.getWorldPosition(V()),out=V(1,0,0).transformDirection(R.matrixWorld);return {pos:d.clone().addScaledVector(out,.62).add(V(0,.16,0)).add(V(0,0,.18).transformDirection(R.matrixWorld)).add(sh.multiplyScalar(.2)),look:d.clone().add(V(0,.05,0)),fov:38};}
   if(t<.45){const h=actor.head();const out=V(1,0,0).transformDirection(R.matrixWorld);const along=V(0,0,1).transformDirection(R.matrixWorld);return {pos:h.clone().addScaledVector(out,-.62).addScaledVector(along,.32).add(V(0,.42,0)).add(sh),look:h.clone().addScaledVector(out,12).addScaledVector(along,-2).add(V(0,-1.3,0)),fov:60};}
   if(t<.62){const f=actor.foot();const out=V(1,0,0).transformDirection(R.matrixWorld),along=V(0,0,1).transformDirection(R.matrixWorld);return {pos:f.clone().addScaledVector(out,.75).addScaledVector(along,.55).add(V(0,.3,0)).add(sh.multiplyScalar(1.6)),look:f.clone().add(V(0,.2,0)),fov:48};}
   if(t<.76){const h=actor.head();const out=V(1,0,0).transformDirection(R.matrixWorld);return {pos:h.clone().addScaledVector(out,.5).add(V(0,.2,0)).add(sh.multiplyScalar(.4)),look:h.clone().add(V(0,.16,0)),fov:30};}
   const h=actor.head(),out=V(1,0,0).transformDirection(R.matrixWorld),k=seg(t,.76,1);return {pos:h.clone().addScaledVector(out,lerp(2.6,1.4,ease(k))).add(V(0,-.1,0)).add(sh),look:h.clone().add(V(0,-.15,0)),fov:44};}},
 // 3 — THE ROPE DROP (00:19–00:31)
 {dur:12,start(){fly=FLY;flyStep(0);M?.cue('riser');heli.setRope(0);},
  speed(t){return t>.24&&t<.31?.28:1;},
  update(t,dt){const dropY=H.y-1.25-gy;if(t<.5){hover(t*12,dt);}else{const u=seg(t,.82,1);if(u>0){const p=leave.getPointAt(Math.min(1,ease(u)*.35));heli.place(p,leave.getPointAt(Math.min(1,ease(u)*.35+.03)),dt);}else hover(t*12,dt);}
   heli.setRope(Math.min(1,seg(t,0,.18)*1.2)*(u0=>u0)(dropY+.2)*(t<.84?1:Math.max(0,1-seg(t,.84,.95))));
   const k=seg(t,.25,.82);if(t<.25){redLight.intensity=0;actor.root.position.set(1.62,.12,.9);actor.pose(dt,{pose:'rope',k:seg(t,.08,.25)});}
   else{if(actor.root.parent===heli.root)unseat();const d=t<.8?heli.doorWorld():(C._landAt||(C._landAt=heli.doorWorld()));if(t<.8)C._landAt=null;const top=d.y-1.6,bottom=ground(d.x,d.z)+.02;actor.root.position.set(d.x,lerp(top,bottom,Math.pow(k,1.25)),d.z);actor.pose(dt,{pose:t<.82?'rope':'land',k:1});
    if(t>=.82)once('land',()=>{A.burst?.(.3,.22,500);A.tone?.(55,.5,.4,'sine',28);E.dust(V(drop.x,gy+.05,drop.z),3);M?.cue('hit');C.ctx.shake(.5);});}
   if(t>.25&&t<.3)once('jump',()=>{M?.cue('slowmo');A.muffle?.(1.4,800);A.whoosh?.();});},
  cam(t){const d=heli.doorWorld(),R=heli.root;const out=V(1,0,0).transformDirection(R.matrixWorld).setY(0).normalize();
   if(t<.25)return {pos:d.clone().addScaledVector(out,1.6).add(V(0,-3.2,0)),look:d.clone().add(V(0,-.6,0)),fov:58,roll:.08};
   if(t<.5){const a=actor.head();return {pos:a.clone().addScaledVector(out,2.4).add(V(0,-2.6,0)),look:a.clone().add(V(0,.4,0)),fov:50,roll:-.05};}
   if(t<.72){const a=actor.root.position;return {pos:V(a.x+7,a.y+9,a.z+5),look:a.clone().add(V(0,-1,0)),fov:50};}
   const a=actor.head();return {pos:a.clone().addScaledVector(out,3.2).add(V(0,.6,0)).add(shake(t*12,.6)),look:a.clone().add(V(0,-.4,0)),fov:50};}},
 // 4 — SILENCE BEFORE THE MISSION (00:31–00:42)
 {dur:11,start(){heli.setRope(0);if(actor.root.parent===heli.root)unseat();actorAt(V(drop.x,gy,drop.z),yawTo(drop,camp)+Math.PI*.8);M?.setState?.('stealth');E.dust(V(drop.x,gy+.05,drop.z),2);},
  speed(t){return t<.12?.35:1;},
  update(t,dt){const u=seg(t,.82,1);const lp=leave.getPointAt(Math.min(1,.35+ease(seg(t,0,1))*.65));heli.place(lp,leave.getPointAt(Math.min(1,.35+ease(seg(t,0,1))*.65+.02)),dt);if(t>.95)heli.remove();
   const turn=yawTo(drop,camp);const y0=turn+Math.PI*.8;actor.root.rotation.y=t<.45?y0:lerp(y0,turn,ease(seg(t,.45,.8)));actor.pose(dt,{pose:t<.22?'land':null,k:1-seg(t,.15,.3),crouch:t<.3,aim:t>.62});
   if(t<.2)once('stones',()=>{for(let i=0;i<14;i++)E.alpha.spawn({p:V(drop.x,gy+.05,drop.z),v:V((Math.random()-.5)*2.5,.8+Math.random()*1.4,(Math.random()-.5)*2.5),life:.8,s0:.05,s1:.04,c0:[.35,.32,.28,1],c1:[.3,.28,.25,1],f0:15,g:9.8,ground:gy+.02});});},
  cam(t){const p=actor.root.position;const turn=yawTo(drop,camp);
   if(t<.18){const r=actor.root.position,f=actor.forward();return {pos:r.clone().addScaledVector(f,1.5).add(V(-f.z*.9,.3,f.x*.9)),look:r.clone().add(V(0,.35,0)),fov:42};}
   if(t<.38){return {pos:p.clone().add(V(Math.sin(turn+1.2)*1.6,.25,Math.cos(turn+1.2)*1.6)),look:p.clone().add(V(0,1.9,0)),fov:58};}
   const k=ease(seg(t,.38,1)),a=turn+Math.PI*(1-k)+Math.PI;const r=lerp(3.4,1.25,k);return {pos:p.clone().add(V(Math.sin(a)*r+Math.cos(turn)*.35*k,lerp(1.6,1.78,k),Math.cos(a)*r-Math.sin(turn)*.35*k)),look:k>.85?camp.clone():p.clone().add(V(0,1.45,0)).lerp(camp,k*k),fov:lerp(50,56,k)};}},
 // 5 — IDENTIFY THE TARGET (00:42–00:54)
 {dur:12,start(){actor.root.visible=false;binoc(true);actor.pose(0,{aim:true});radioClick();},
  update(t,dt){actor.pose(dt,{aim:true,pose:t>.6&&t<.78?'wrist':null});actor.root.visible=t>=.6;const r=Math.round(actor.root.position.distanceTo(camp));$('#binocInfo').textContent=t<.42?`RNG ${r} m · ×${(lerp(7,10,t*2)).toFixed(1)} · AZ ${(((yawTo(actor.root.position,camp)*180/Math.PI)+360)%360).toFixed(0)}°`:'';
   if(t>.42)binoc(false);actor.draw(['BLACK VEIL','SAT-KEY: SITE 3','T-20:00','LINK: OK'],t*12);
   if(t>.4){hud(true,typed(seg(t,.4,.8),HUDTXT));}
   if(t>.58)once('c3',()=>{radioClick();say(lines[2][0],lines[2][1]);});if(t>.9)once('c4',()=>say(lines[3][0],lines[3][1]));},
  end(){binoc(false);actor.root.visible=true;},
  cam(t){const h=actor.head().add(V(0,.05,0)).addScaledVector(actor.forward(),.25);
   if(t<.42){const k=t/.42;const tgt=camp.clone().add(V(lerp(-18,22,k),lerp(2,1,k),lerp(10,-6,k)));return {pos:h,look:tgt,fov:lerp(9,7,k)};}
   if(t<.6){const tw=V(50,ground(50,-40)+7,-40);return {pos:h,look:tw.clone().add(V(0,-1.5,0)),fov:lerp(5,4.2,seg(t,.42,.6))};}
   if(t<.78){const d=actor.dev.getWorldPosition(V()),hd=actor.head(),f=actor.forward();return {pos:hd.clone().addScaledVector(f,.12).add(V(0,.06,0)),look:d,fov:34};}// over-the-eyes look down at the wrist device
   const d=actor.dev.getWorldPosition(V()),f=actor.forward();return {pos:h.clone().addScaledVector(f,-.65).add(V(-f.z*.35,.1,f.x*.35)),look:d.clone().lerp(camp,.25),fov:50};}},
 // 6 — ENTER THE SHADOWS (00:54–01:09)
 {dur:13,start(){hud(false);M?.cue('drive');},
  update(t,dt){const k=seg(t,0,.27)*.42+seg(t,.27,.6)*.2+seg(t,.8,1)*.38;const p=walk.getPointAt(Math.min(.999,k));const ahead=walk.getPointAt(Math.min(1,k+.01));p.y=ground(p.x,p.z);
   const moving=t<.27||t>.8;actor.root.position.copy(p);actor.root.rotation.y=moving?yawTo(p,ahead):yawTo(p,camp);actor.pose(dt,{speed:moving?2.1:0,crouch:true,aim:!moving});
   // Searchlight sweeps over his cover rock.
   const sweep=seg(t,.3,.58);S.aimSearchlight(0,sweep>0&&sweep<1?p.clone().add(V(lerp(-14,12,sweep),.5,lerp(10,-8,sweep))):null);
   if(G2&&t>.6&&t<.8){const u=seg(t,.6,.8),a=V(-33.5,0,-17.8),b=V(-26.5,0,-17.8);G2.root.position.copy(a.lerp(b,u));G2.root.position.y=ground(G2.root.position.x,G2.root.position.z);G2.root.rotation.y=Math.PI/2;G2.motion.update(dt,1.3,false,false,false);}
   if(t>.3&&t<.35)once('steps',()=>A.burst?.(.2,.05,600));},
  end(){S.aimSearchlight(0,null);},
  cam(t){const p=actor.root.position,f=actor.forward();
   if(t<.27){const f2=actor.foot();return {pos:f2.clone().addScaledVector(f,-1.6).add(V(-f.z*.7,.22,f.x*.7)),look:f2.clone().addScaledVector(f,1.2).add(V(0,.2,0)),fov:44};}
   if(t<.6){const h=actor.head(),back=camp.clone().sub(p).setY(0).normalize();return {pos:h.clone().addScaledVector(back,-1.1).add(V(-back.z*.5,.18,back.x*.5)).add(shake(t*15,.5)),look:h.clone().addScaledVector(back,8).add(V(0,1.2,0)),fov:55};}
   if(t<.8){const h=actor.head(),tg=V(-30,ground(-30,-18)+1.4,-17.8),d=tg.clone().sub(h).setY(0).normalize();return {pos:h.clone().add(V(-d.z*.7,.35,d.x*.7)).addScaledVector(d,.4),look:tg,fov:lerp(18,13,seg(t,.6,.8))};}
   const h=actor.head(),back=camp.clone().sub(p).setY(0).normalize();return {pos:h.clone().addScaledVector(back,-1.4).add(V(back.z*.6,.15,-back.x*.6)).add(shake(t*15,.6)),look:h.clone().addScaledVector(back,6),fov:52};}},
 // 7 — THE FIRST CONTACT (01:09–01:24)
 {dur:13,start(){const gp=GP.clone();if(G&&!G.dead){G.root.position.copy(gp);G.root.rotation.y=yawTo(gp,fenceSpot);G.state='ATTACK';}actorAt(fenceSpot.clone(),yawTo(fenceSpot,gp));},
  speed(t){return t>.6&&t<.67?.25:1;},
  update(t,dt){const gp=G?G.root.position.clone():GP.clone();const ap=actor.root.position;actor.root.rotation.y=yawTo(ap,gp);
   if(t>.02)once('alarm',()=>{C.mission.raiseAlarm(null,true);S.setAlarm(true);M?.setState?.('combat');M?.cue('stab');});
   if(t>.1)once('spot',()=>{if(G)C.ctx.voices?.enemy(G,'alert',true);});
   actor.pose(dt,{pose:t<.2?'peek':null,crouch:t>.7,aim:t>.18});if(G&&!G.dead)G.motion.update(dt,0,false,t>.2,false);
   // Firefight: alternating bursts.
   if(t>.2&&t<.6){const n=Math.floor((t-.2)*40);if(n!==C._fb){C._fb=n;const mine=n%3!==2;const from=mine?actor.muzzle():gp.clone().add(V(0,1.45,0));const tgt=mine?gp.clone().add(V((Math.random()-.5)*1.4,1+Math.random()*.8,(Math.random()-.5)*1.4)):ap.clone().add(V((Math.random()-.5)*2,.6+Math.random()*1.2,(Math.random()-.5)*2));fire(from,tgt,mine?'m4':'ak74',from.distanceTo(cam.position));if(Math.random()<.6)E.impact(tgt,null);C.ctx.shake(.08);}}
   if(t>.6&&t<.62)once('slowimpact',()=>{const p=gp.clone().add(V(1.6,1.2,-2.4));S.aimSearchlight(0,p);E.impact(p,V(1,.2,0));for(let i=0;i<30;i++)E.alpha.spawn({p:p.clone(),v:V(Math.random()*3,Math.random()*2.5-.3,(Math.random()-.5)*3),life:2.4,s0:.06+Math.random()*.08,s1:.3,c0:[1,.95,.85,.9],c1:[.8,.75,.65,0],f0:8+Math.floor(Math.random()*4),drag:1.2});A.muffle?.(1.6,700);M?.cue('slowmo');});
   if(t>.72)once('kill',()=>{S.aimSearchlight(0,null);if(G&&!G.dead){const d=gp.clone().sub(ap).normalize();C.enemies.damage(G,300,{dir:d,point:gp.clone().add(V(0,1.55,0)),head:true});E.blood(gp.clone().add(V(0,1.55,0)),d,{head:true});A.shot('m4',4,0);}});
   if(t>.78)once('c5',()=>{radioClick();say(lines[4][0],lines[4][1]);});if(t>.93)once('c6',()=>say(lines[5][0],lines[5][1]));
   if(G?.dead&&G.ragdoll?.active)G.ragdoll.update(dt);},
  end(){S.setAlarm(true);if(!C.mission.alarm)C.mission.raiseAlarm(null,true);if(G&&!G.dead){C.enemies.damage(G,300,{head:true});}},
  cam(t){const ap=actor.root.position,gp=G?G.root.position:GP;const f=actor.forward(),h=actor.head();
   if(t<.2)return {pos:h.clone().addScaledVector(f,-1.3).add(V(f.z*.55,.1,-f.x*.55)),look:gp.clone().add(V(0,1.4,0)),fov:46};
   if(t<.6){const k=Math.floor((t-.2)/.1)%2;if(k===0)return {pos:h.clone().addScaledVector(f,-.75).add(V(-f.z*.5,.14,f.x*.5)).add(shake(t*30,1.4)),look:gp.clone().add(V(0,1.3,0)),fov:40};return {pos:gp.clone().add(V(3.2,1.6,1.4)).add(shake(t*30,1)),look:gp.clone().add(V(0,1.3,0)),fov:46};}
   if(t<.72){const p=gp.clone().add(V(1.6,1.2,-2.4));return {pos:p.clone().add(V(3,.6,-1.5)),look:p,fov:36};}
   return {pos:h.clone().addScaledVector(f,-1.6).add(V(-f.z*.6,.25,f.x*.6)).add(shake(t*20,.8)),look:gp.clone().add(V(0,.5,0)),fov:50};}},
 // 8 — THE MISSION REVEAL (01:24–01:36)
 {dur:12,start(){M?.cue('drive');actorAt(porch.clone().add(V(3.2,0,3.4)),yawTo(porch,door));},
  update(t,dt){S.countdown=C.mission.deadline??1200;const k=seg(t,.58,1);const from=porch.clone().add(V(3.2,0,3.4)),to=porch.clone().add(V(0,0,.4));actor.root.position.copy(from.lerp(to,ease(k)));actor.root.position.y=Math.max(ground(actor.root.position.x,actor.root.position.z),porch.y);actor.root.rotation.y=yawTo(actor.root.position,door);
   actor.pose(dt,{speed:k>0&&k<1?1.4:0,crouch:false,aim:true});setDoor(t<.33?1.1:.55+Math.sin(t*5)*.09);
   if(t>.9)once('peak',()=>{M?.cue('hit');});if(t>.97)once('drop',()=>{M?.setState?.('silent');A.duck?.(.05,3);});},
  cam(t){
   if(t<.33){const k=t/.33;return {pos:V(door.x+.3-k*.3,porch.y+1.65,door.z+lerp(7.5,5.2,k)),look:V(door.x,porch.y+1.5,door.z-7.8),fov:lerp(30,24,k)};}
   const h=actor.head();
   if(t<.58){const f=actor.forward();return {pos:h.clone().addScaledVector(f,.62).add(V(f.z*.18,.16,-f.x*.18)),look:h.clone().add(V(0,.14,0)),fov:34};}
   const f=actor.forward();return {pos:h.clone().addScaledVector(f,lerp(-2.4,-1.4,seg(t,.58,1))).add(V(-f.z*.45,.15,f.x*.45)),look:door.clone().add(V(0,1.4,0)),fov:52};}},
 // 9 — TITLE AND SEAMLESS GAMEPLAY TRANSITION (01:36–01:45)
 {dur:8,brand:true,title:'CH<i>A</i>RTED MISSIONS',subtitle:'OPERATION BLACK VEIL',start(){setDoor(1.4);},
  update(t,dt){const k=ease(seg(t,0,.55));actor.root.position.copy(porch.clone().add(V(0,0,.4)).lerp(threshold,k));actor.root.rotation.y=Math.PI;actor.pose(dt,{speed:k<1?1.2:0,aim:true});actor.root.visible=t<.62;
   if(t>.7)$('#cineTitle').classList.remove('show');if(t>.78)once('click',()=>{A.reload?.();});},
  end(){actor.root.visible=false;fill.intensity=0;C.cineFillOn=false;heli.remove();redLight.intensity=0;S.aimSearchlight(0,null);setDoor(1.4);hud(false);binoc(false);},
  cam(t){const eye=threshold.clone().add(V(0,1.62,0)),look=eye.clone().add(V(0,0,-6));const k=ease(seg(t,.25,.95));const h=actor.head();const back=h.clone().add(V(.35,.12,1.4));return {pos:back.lerp(eye,k),look:door.clone().add(V(0,1.3,0)).lerp(look,k),fov:lerp(52,60,k)};}}
 ];
 return {shots,threshold,door:threshold.clone().add(V(0,0,-6)),finish:()=>{actor.root.visible=false;}};}
