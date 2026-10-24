import * as THREE from 'three';
import {bestSpeechVoice} from '../vo.js';
import {heightAt} from './world.js';
// Cutscene player (letterbox, subtitles, title cards, optional voice) + helicopter actor.
const $=s=>document.querySelector(s);
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

export class Helicopter {
 constructor(gltf,scene,audio){this.scene=scene;this.audio=audio;this.root=new THREE.Group();const model=gltf.scene;model.updateMatrixWorld(true);const S=12.5/2.59;
  const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push(o);});
  // Military repaint: desaturate the police livery into olive drab and knock back the white lettering.
  const repaint=tex=>{const img=tex?.image;if(!img||!img.width)return tex;try{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height),a=d.data;for(let i=0;i<a.length;i+=4){const L=(a[i]*.3+a[i+1]*.59+a[i+2]*.11)/255;const k=.32+Math.min(L,.3)*1.1+(Math.random()-.5)*.02;a[i]=86*k;a[i+1]=96*k;a[i+2]=70*k;}x.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.flipY=tex.flipY;t.wrapS=tex.wrapS;t.wrapT=tex.wrapT;return t;}catch(_){return tex;}};
  for(const o of meshes){o.castShadow=true;o.frustumCulled=false;o.material=o.material.clone();if(o.material.map){o.material.map=repaint(o.material.map);o.material.color.set(0xffffff);}else o.material.color.multiply(new THREE.Color(.36,.4,.33));o.material.roughness=.62;o.material.metalness=.3;o.material.side=THREE.FrontSide;
   if(o.name.startsWith('rotor')||o.name.startsWith('tail')){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.computeBoundingBox();const c=g.boundingBox.getCenter(new THREE.Vector3());g.translate(-c.x,-c.y,-c.z);const pivot=new THREE.Mesh(g,o.material);pivot.position.copy(c);pivot.castShadow=true;pivot.frustumCulled=false;o.visible=false;model.add(pivot);if(o.name.startsWith('rotor'))this.rotor=pivot;else this.tail=pivot;}}
  model.scale.setScalar(S);this.root.add(model);this.model=model;
  const disc=new THREE.Mesh(new THREE.CircleGeometry(5.9,40),new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide}));disc.rotation.x=-Math.PI/2;disc.position.set(0,.72*S,.18*S);this.root.add(disc);
  this.rope=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1,6),new THREE.MeshStandardMaterial({color:0x6b5d45,roughness:1}));this.rope.visible=false;this.root.add(this.rope);this.doorOffset=new THREE.Vector3(1.4,1.25,.9);
  // Cabin interior (the hull is a closed shell): floor, bench, bulkheads and ceiling, open on the door side.
  {const cab=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x2a2e2b,roughness:.8,metalness:.2,side:THREE.DoubleSide}),dark=new THREE.MeshStandardMaterial({color:0x151816,roughness:.9,side:THREE.DoubleSide});
   const P=(w,h,x,y,z,rx,ry,m=mat)=>{const q=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);q.position.set(x,y,z);q.rotation.set(rx,ry,0);cab.add(q);return q;};
   P(2.3,4.2,0,.55,.5,-Math.PI/2,0,dark);P(2.3,4.2,0,2.35,.5,Math.PI/2,0);P(4.2,1.8,-1.12,1.45,.5,0,Math.PI/2);P(2.3,1.8,0,1.45,2.6,0,Math.PI);P(2.3,1.8,0,1.45,-1.6,0,0);
   const bench=new THREE.Mesh(new THREE.BoxGeometry(.5,.45,3.2),dark);bench.position.set(-.8,.78,.5);cab.add(bench);for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,3.6),mat);s.position.set(-.3+i*.3,2.3,.5);cab.add(s);}
   this.root.add(cab);this.cabin=cab;}
  this.spin=1;this.sound=null;scene.add(this.root);this.root.visible=false;this.prev=new THREE.Vector3();this.bank=0;}
 setRope(len){this.rope.visible=len>.05;this.rope.scale.y=Math.max(.01,len);this.rope.position.set(this.doorOffset.x,this.doorOffset.y-len/2,this.doorOffset.z);}
 doorWorld(){return this.doorOffset.clone().applyMatrix4(this.root.matrixWorld);}
 place(pos,look,dt=0){const v=pos.clone().sub(this.prev);if(dt>0){const speed=v.length()/dt;const target=Math.min(.32,speed*.012);this.bank=THREE.MathUtils.damp(this.bank,target,2,dt);}this.prev.copy(pos);this.root.position.copy(pos);if(look){const d=look.clone().sub(pos);d.y=0;if(d.lengthSq()>.01)this.root.rotation.set(0,Math.atan2(d.x,d.z),0);this.root.rotateX(this.bank);}this.root.updateMatrixWorld();}
 // v9.1: the cabin interior box only exists for shots from inside / at the door; from outside it showed
 // through the tapered rear hull as a square box, so it is hidden unless the camera is right at the cabin.
 update(dt,listener){if(this.cabin){let show=false;if(listener&&this.root.visible){const c=this.root.localToWorld(new THREE.Vector3(0,1.45,.5));show=c.distanceTo(listener)<4.2;}this.cabin.visible=show;}if(this.rotor)this.rotor.rotation.y+=dt*28*this.spin;if(this.tail)this.tail.rotation.x+=dt*40*this.spin;if(this.root.visible&&listener)this.soundLevel(Math.max(0,1-this.root.position.distanceTo(listener)/420));else this.soundLevel(0);}
 soundLevel(v){const a=this.audio;if(!a.ctx)return;if(!this.sound&&v>0){const ctx=a.ctx,src=ctx.createBufferSource();src.buffer=a.noise;src.loop=true;const bp=ctx.createBiquadFilter();bp.type='lowpass';bp.frequency.value=380;const amp=ctx.createGain();amp.gain.value=0;const lfo=ctx.createOscillator();lfo.type='sawtooth';lfo.frequency.value=10.5;const lfoGain=ctx.createGain();lfoGain.gain.value=.55;lfo.connect(lfoGain);lfoGain.connect(amp.gain);const body=ctx.createGain();body.gain.value=0;const hum=ctx.createOscillator();hum.type='triangle';hum.frequency.value=62;const humG=ctx.createGain();humG.gain.value=.25;hum.connect(humG);humG.connect(body);src.connect(bp);bp.connect(amp);amp.connect(body);body.connect(a.master);src.start();lfo.start();hum.start();this.sound={src,lfo,hum,body,nodes:[src,bp,amp,lfo,lfoGain,body,hum,humG]};}
  if(this.sound)this.sound.body.gain.setTargetAtTime(v*v*.9,a.ctx.currentTime,.1);}
 remove(){this.root.visible=false;this.soundLevel(0);}
 dispose(){if(this.sound){for(const n of this.sound.nodes){try{n.stop?.()}catch(_){}n.disconnect();}this.sound=null;}this.scene.remove(this.root);}
}

// Cutscene: a list of shots. Each shot: {dur, title?, sub?, who?, cam(t,dt)->{pos,look,fov?}, start?(), update?(t,dt), end?()}
export class Cinema {
 constructor(camera,{voice=true,audio=null}={}){this.camera=camera;this.audio=audio;this.active=null;this.voice=voice;this.cineFov=null;}
 play(shots,onDone){this.active={shots,i:-1,t:0,onDone};this.next();document.body.classList.add('cinema');$('#cine').hidden=false;}
 next(){const a=this.active;if(a.i>=0)a.shots[a.i].end?.();a.i++;a.t=0;if(a.i>=a.shots.length){this.finish();return;}const s=a.shots[a.i];s.start?.();
  $('#cineTitle').classList.toggle('brand',!!s.brand);if(s.title){$('#cineTitle').innerHTML=`<b>${s.title}</b>${s.subtitle?`<small>${s.subtitle}</small>`:''}`;$('#cineTitle').classList.remove('show');void $('#cineTitle').offsetWidth;$('#cineTitle').classList.add('show');}else if(s.clearTitle)$('#cineTitle').classList.remove('show');
  {const c=s.cam?.(0,0);if(c){this.camera.position.copy(c.pos);this.camera.up.set(0,1,0);this.camera.lookAt(c.look);this.cineFov=c.fov||60;}}
  if(s.sub!==undefined)this.say(s.who,s.sub);if(s.fade){$('#cineFade').style.transition=`opacity ${s.fade[1]}s`;$('#cineFade').style.opacity=s.fade[0];}}
 say(who,text){const el=$('#cineSub');clearTimeout(this.subT);if(text)this.subT=setTimeout(()=>{el.innerHTML='';},Math.max(3800,text.length*75));if(text&&this.audio)this.audio.duck(.5,Math.min(7,1+text.length*.055));el.innerHTML=text?`${who?`<b>${who}:</b> `:''}${text}`:'';if(text&&this.voice){if(this.audio?.vo?.say(who,text))return;if(window.speechSynthesis){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);const bv=bestSpeechVoice();if(bv)u.voice=bv;u.rate=.98;u.pitch=who&&/HQ|CONTROL/.test(who)?.95:.88;speechSynthesis.speak(u);}catch(_){}}}}
 skip(){if(!this.active)return;const a=this.active;for(let i=a.i;i<a.shots.length;i++){if(i>a.i)a.shots[i].start?.();a.shots[i].update?.(1,0);a.shots[i].end?.();}a.i=a.shots.length;this.finish();}
 finish(){const done=this.active?.onDone;this.active=null;this.timeScale=1;$('#cineHud').classList.remove('show');$('#cineTitle').classList.remove('brand');document.body.classList.remove('cinema');$('#cine').hidden=true;$('#cineSub').innerHTML='';$('#cineTitle').classList.remove('show');$('#cineFade').style.transition='opacity .6s';$('#cineFade').style.opacity=0;try{speechSynthesis.cancel()}catch(_){}this.audio?.vo?.stop();done?.();}
 update(dt){const a=this.active;if(!a)return false;const s=a.shots[a.i];const sp=s.speed?s.speed(Math.min(1,a.t/s.dur)):1;this.timeScale=sp;dt*=sp;a.t+=dt;const t=Math.min(1,a.t/s.dur);s.update?.(t,dt);const c=s.cam?.(t,dt);if(c){const floor=heightAt(c.pos.x,c.pos.z)+1.1;if(c.pos.y<floor)c.pos.y=floor;this.camera.position.copy(c.pos);this.camera.up.set(0,1,0);if(this.fill?.intensity!==undefined)this.fill.position.copy(c.pos).add(new THREE.Vector3(0,.4,0));this.camera.lookAt(c.look);if(c.roll)this.camera.rotateZ(c.roll);this.cineFov=c.fov||60;}if(a.t>=s.dur)this.next();return true;}
}

// Catmull-Rom helper over Vector3 points.
export const curve=pts=>new THREE.CatmullRomCurve3(pts.map(p=>p.clone()),false,'centripetal');

// Builds the helicopter insertion: flyover, title, hover, rope drop, first-person fast-rope, departure.
export function insertionShots({music,heli,target,approach,mission,hands,effects,audio,setPlayer,shake}){
 const gy=heightAt(target.x,target.z),hover=new THREE.Vector3(target.x,gy+19,target.z);const dir=approach.clone().normalize();
 const lift=(p,m)=>{p.y=Math.max(p.y,heightAt(p.x,p.z)+m);return p;};const p0=lift(hover.clone().addScaledVector(dir,-330).setY(gy+70),45),p1=lift(hover.clone().addScaledVector(dir,-190).setY(gy+50),35),p2=lift(hover.clone().addScaledVector(dir,-70).setY(gy+32),22);const path=curve([p0,p1,p2,hover]);
 const side=new THREE.Vector3(-dir.z,0,dir.x);const leave=curve([hover,lift(hover.clone().addScaledVector(side,40).setY(gy+30),20),lift(hover.clone().addScaledVector(side,160).addScaledVector(dir,120).setY(gy+80),40),lift(hover.clone().addScaledVector(side,520).addScaledVector(dir,300).setY(gy+140),60)]);
 const T1=15;let fly=0;const heliAt=u=>{const k=Math.min(1,u),p=path.getPointAt(ease(k)*.999),ahead=path.getPointAt(Math.min(1,ease(k)*.999+.02));return {p,ahead};};
 const flyStep=(dt)=>{fly=Math.min(T1,fly+dt);const {p,ahead}=heliAt(fly/T1);const look=fly>=T1-1.5?hover.clone().addScaledVector(dir,10):ahead;heli.place(p,look,dt);};
 const door=()=>heli.doorWorld();
 return [
  {dur:5.5,title:mission.title,subtitle:mission.place,fade:[0,1.6],start(){music?.cue('title');heli.root.visible=true;fly=0;heli.setRope(0);flyStep(0);},update(t,dt){flyStep(dt);},cam(t){const c=hover.clone().addScaledVector(dir,40).add(side.clone().multiplyScalar(-35));c.y=Math.max(gy+26,heightAt(c.x,c.z)+14)+t*4;return {pos:c,look:heli.root.position.clone().lerp(hover,.1),fov:24-t*4};}},
  {dur:6,clearTitle:true,who:mission.briefing[0][0],sub:mission.briefing[0][1],start(){music?.cue('drive');},update(t,dt){flyStep(dt);},cam(){const f=new THREE.Vector3(0,0,1).applyQuaternion(heli.root.quaternion);f.y=0;f.normalize();return {pos:heli.root.position.clone().addScaledVector(f,-22).add(new THREE.Vector3(0,7,0)),look:heli.root.position.clone().addScaledVector(f,25),fov:58};}},
  {dur:4,who:mission.briefing[1][0],sub:mission.briefing[1][1],update(t,dt){flyStep(dt);},cam(t){return {pos:hover.clone().add(side.clone().multiplyScalar(26)).addScaledVector(dir,14).setY(gy+3.5),look:heli.root.position.clone().add(new THREE.Vector3(0,-2,0)),fov:50};}},
  {dur:2.6,who:'',sub:'',start(){music?.cue('riser');fly=T1;flyStep(0);},update(t,dt){heli.place(hover.clone().add(new THREE.Vector3(Math.sin(t*6)*.15,Math.sin(t*4)*.2,0)),hover.clone().addScaledVector(dir,10),dt);heli.setRope(Math.min(1,t*1.6)*(hover.y-gy));},cam(t){const d=door();const out=new THREE.Vector3(1,0,0).applyQuaternion(heli.root.quaternion);return {pos:d.clone().addScaledVector(out,-1.4).add(new THREE.Vector3(0,.7,0)),look:d.clone().addScaledVector(out,4).setY(gy),fov:70};}},
  {dur:4.6,who:'EAGLE ONE',sub:'Rope is down. Go, go, go!',start(){music?.cue('hit');hands.show('rope');audio.burst?.(.4,.2,900);},update(t,dt){heli.place(hover.clone().add(new THREE.Vector3(Math.sin(t*5)*.12,0,0)),hover.clone().addScaledVector(dir,10),dt);hands.ropeSlide(dt,t<.94);},end(){hands.show(null);shake(.9);audio.step?.(true);audio.tone?.(60,.4,.4,'sine',30);music?.cue('sting');effects.impact?.(new THREE.Vector3(target.x,gy+.05,target.z));},
   cam(t){const d=door();const out=new THREE.Vector3(1,0,0).applyQuaternion(heli.root.quaternion);const k=ease(Math.min(1,t*1.02)),top=d.y-.4,bottom=gy+1.62;const p=d.clone().setY(top+(bottom-top)*k).addScaledVector(out,-.25);const look=p.clone().addScaledVector(out,-2.5).add(new THREE.Vector3(Math.sin(t*9)*.05,-1.4+k*1.3,0));return {pos:p,look,fov:72,roll:Math.sin(t*7)*.02};}},
  {dur:4.5,who:'EAGLE ONE',sub:mission.briefing[2]?.[1]||'You are on your own now. Good hunting.',start(){heli.setRope(0);setPlayer();},update(t,dt){const p=leave.getPointAt(Math.min(1,ease(t)*.6));heli.place(p,leave.getPointAt(Math.min(1,ease(t)*.6+.03)),dt);},cam(t){const eye=new THREE.Vector3(target.x,gy+1.62,target.z);return {pos:eye,look:heli.root.position.clone().lerp(eye.clone().addScaledVector(dir,30),Math.max(0,t-.55)*2),fov:66};}}
 ].map(s=>({...s,leave}));}
