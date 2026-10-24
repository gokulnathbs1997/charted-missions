import * as THREE from 'three';
// Character voices & emotions: barks for enemies and the player, spoken with emotional prosody
// (browser speech synthesis when available), synthesized grunts/laughs/sobs, speech bubbles above
// soldiers, subtitles, and the player's expression portrait.
const $=s=>document.querySelector(s);
export const LINES={
 enemy:{
  calm:['Quiet night.','I hate guard duty.','Anyone got a cigarette?','My feet are killing me.','Another long shift.'],
  suspicious:['Who is there?','Did you hear that?','Something moved.','Show yourself!','Hello?'],
  alert:['Intruder! Over there!','Contact! Open fire!','There he is!','We have company!','Enemy spotted!'],
  alarm:['Sound the alarm!','All units, intruder in the camp!','Raise the alarm, now!'],
  search:['Where did he go?','Check the buildings!','He cannot be far.','Spread out!'],
  angry:['You will pay for that!','Argh! You dog!','I will kill you!','Is that all you have got?','You are dead!'],
  pain:['I am hit!','Argh, my arm!','Medic!','Agh!'],
  fear:['Please, I do not want to die!','Fall back! Fall back!','He is too good!','I need help over here!','Mother...'],
  sad:['No! They got Viktor!','Man down! Man down!','Brother... no...','Nikolai is dead!','They killed him!'],
  happy:['Ha! Got him!','Target down!','That is how we do it!','Nobody gets past us!','Easy!'],
  reload:['Reloading!','Changing mag!','Cover me, reloading!','Mag out!'],contact:['Contact front!','Eyes on target!','Enemy spotted, engaging!','Tango, twelve o\'clock!'],grenade:['Grenade out!','Frag out!','Fire in the hole!'],
  cover:['Covering fire!','I got you covered!','Moving to cover!','Suppressing!'],retreat:['Fall back!','I need backup!','Taking heavy fire!','I am hit, pulling back!'],
  push:['Push up!','Move, move, move!','Go go go!','Take the middle!'],flank:['Flank them!','Go around the side!','Take the flank!','Split up, hit them from the side!'],hold:['Hold this position!','Dig in!','Watch the corners!','Hold here!'],regroup:['Regroup on me!','On me!','Form up!','Stack up on me!'],
  signal:['Go, go!','Move up!','You two, left side!']},
 player:{
  kill:['Target down.','One less.','Got him.','Tango down.'],headshot:['Clean shot.','Headshot.','Right between the eyes.'],
  angry:['Agh! You will regret that!','Damn it!','That hurt!'],pain:['Argh!','Ugh!'],low:['I need a medkit, now.','Losing blood...','I cannot take much more.'],
  heal:['That is better.','Okay. I can keep going.'],happy:['Yes! Objective done.','That is how it is done.','Good. Moving on.'],
  alarm:['They know I am here.','So much for stealth.'],spotted:['I have been spotted!'],cry:['No... not like this...','I am sorry... I failed.'],victory:['Mission accomplished. Let us go home.','We did it. Bring me home.']}
};
export const EMOTION={
 calm:{rate:1,pitch:1,color:'#d8d8d0',vox:null},suspicious:{rate:.92,pitch:.95,color:'#e7d9a8',vox:null},alert:{rate:1.22,pitch:.9,color:'#ff9a5a',vox:'shout'},alarm:{rate:1.25,pitch:.92,color:'#ff7a4a',vox:'shout'},search:{rate:1.05,pitch:.95,color:'#e7d9a8',vox:null},
 angry:{rate:1.2,pitch:.72,color:'#ff5a3c',vox:'shout'},pain:{rate:1.15,pitch:1.05,color:'#ff8c5a',vox:'pain'},fear:{rate:1.32,pitch:1.35,color:'#f3c24a',vox:'panic'},sad:{rate:.8,pitch:.85,color:'#7cbcff',vox:'sob'},cry:{rate:.74,pitch:1.05,color:'#7cbcff',vox:'sob'},
 happy:{rate:1.1,pitch:1.22,color:'#9fe3ae',vox:'laugh'},reload:{rate:1.15,pitch:.95,color:'#e7d9a8',vox:null},contact:{rate:1.2,pitch:.9,color:'#ff9a5a',vox:'shout'},grenade:{rate:1.25,pitch:.9,color:'#ff9a5a',vox:'shout'},cover:{rate:1.15,pitch:.95,color:'#cfe3b3',vox:null},retreat:{rate:1.3,pitch:1.1,color:'#f3c24a',vox:'shout'},push:{rate:1.2,pitch:.9,color:'#ffcf7a',vox:'shout'},flank:{rate:1.1,pitch:.95,color:'#ffcf7a',vox:null},hold:{rate:1,pitch:.9,color:'#ffcf7a',vox:null},regroup:{rate:1.05,pitch:.92,color:'#ffcf7a',vox:null},signal:{rate:1.15,pitch:.95,color:'#ffcf7a',vox:null},kill:{rate:.95,pitch:.9,color:'#d3e3b3',vox:null},headshot:{rate:.95,pitch:.9,color:'#d3e3b3',vox:null},heal:{rate:.9,pitch:1,color:'#9fe3ae',vox:null},low:{rate:.85,pitch:.95,color:'#ff8c5a',vox:'grunt'},spotted:{rate:1.15,pitch:.95,color:'#ff9a5a',vox:null},victory:{rate:.95,pitch:1.05,color:'#f1d27a',vox:null}};
const FACE={kill:'happy',headshot:'happy',heal:'happy',victory:'happy',happy:'happy',angry:'angry',pain:'pain',low:'fear',alarm:'angry',spotted:'fear',cry:'cry',calm:'calm'};
const ENEMY_NAMES=['Viktor','Nikolai','Dmitri','Pavel','Sergei','Anton','Yuri','Oleg','Boris','Ivan','Lev','Roman','Gleb','Stas','Maks','Ilya','Fedor','Kirill','Timur','Arkady'];
function pick(a){return a[Math.floor(Math.random()*a.length)];}
export class Voices {
 constructor(audio,{camera,scene,enabled=true}){this.audio=audio;this.camera=camera;this.scene=scene;this.enabled=enabled;this.until=0;this.lastBy=new Map();this.voices=[];this.bubbles=[];this.face='calm';this.faceUntil=0;this.time=0;
  const load=()=>{try{const all=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));const nat=all.filter(v=>/natural|neural|online/i.test(v.name));this.voices=nat.length>=2?nat:all;}catch(_){}};load();try{speechSynthesis.onvoiceschanged=load;}catch(_){}
  this.portrait=$('#portrait')?.getContext('2d');this.drawFace('calm',100);}
 callsign(e){if(!e.callsign)e.callsign=ENEMY_NAMES[(e.id??Math.floor(Math.random()*99))%ENEMY_NAMES.length];return e.callsign;}
 now(){return performance.now()/1000;}
 // Enemy bark. kind = emotion key. Throttled per soldier and globally.
 enemy(e,kind,force=false){const t=this.now();if(!force&&(t<this.until-.5||t-(this.lastBy.get(e)||-99)<4))return false;const pos=e.root.position.clone().add(new THREE.Vector3(0,2.05,0)),dist=pos.distanceTo(this.camera.position);if(dist>55&&!force)return false;
  this.lastBy.set(e,t);const text=pick(LINES.enemy[kind]||LINES.enemy.alert),emo=EMOTION[kind]||EMOTION.alert;this.until=t+Math.min(3.2,.8+text.length*.055);
  const pan=this.pan(pos),vol=Math.max(.15,1-dist/45);if(emo.vox)this.audio.vocal?.(emo.vox,{pitch:100+((e.id||0)%5)*12,pan,vol});
  this.bubble(e.root,text,emo.color,kind);this.subtitle(this.callsign(e),kind,text,emo.color);this.speak(text,emo,{seed:(e.id||0)+3,volume:vol,delay:emo.vox?.35:0,pan,dist});return true;}
 // Player line + facial expression.
 player(kind,force=false){const t=this.now();this.setFace(FACE[kind]||'calm',kind==='cry'?99:2.6);if(!force&&t<this.until-.3)return false;if(!force&&t-(this.lastBy.get('player:'+kind)||-99)<6)return false;this.lastBy.set('player:'+kind,t);
  const text=pick(LINES.player[kind]||LINES.player.kill),emo=EMOTION[kind]||EMOTION.calm;this.until=t+Math.min(3.5,.8+text.length*.055);if(emo.vox)this.audio.vocal?.(emo.vox,{pitch:115,vol:.8});
  this.subtitle(this.playerName||'SPECTER',kind,text,emo.color,true);this.speak(text,emo,{seed:0,volume:1,delay:emo.vox?.3:0,player:true});return true;}
 // Short non-verbal reaction (no subtitle), e.g. death scream.
 vocal(kind,pos,opts={}){const d=pos?pos.distanceTo(this.camera.position):0;if(d>60)return;this.audio.vocal?.(kind,{pan:pos?this.pan(pos):0,vol:Math.max(.12,1-d/50),...opts});}
 pan(p){const d=p.clone().sub(this.camera.position).normalize(),right=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);return Math.max(-1,Math.min(1,d.dot(right)));}
 speak(text,emo,{seed=0,volume=1,delay=0,player=false,pan=0,dist=0}={}){if(!this.enabled)return;
  // Recorded voices first (two enemy voices, the operator's voice); emotion nudges pace/pitch slightly.
  const vo=this.audio?.vo;if(vo){const variant=player?((this.playerName||'').toUpperCase()==='GHOST'?'opf':'op'):(seed%2?'en1':'en2');const rate=1+((emo.rate||1)-1)*.3+((emo.pitch||1)-1)*.12;
   if(vo.play(variant,text,{vol:player?1:Math.min(1.2,volume*1.25),rate,delay,positional:!player,pan,dist,interrupt:false}))return;}
  if(!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(text);const pool=this.voices.length?this.voices:speechSynthesis.getVoices();if(pool.length)u.voice=pool[(seed*7+(player?0:3))%pool.length];u.rate=emo.rate;u.pitch=Math.max(.1,Math.min(2,emo.pitch*(player?.92:1+((seed%5)-2)*.06)));u.volume=Math.max(0,Math.min(1,volume));this.audio.duck?.(.55,Math.min(4,1+text.length*.05));
   setTimeout(()=>{try{if(player)speechSynthesis.cancel();speechSynthesis.speak(u);}catch(_){}},delay*1000);}catch(_){}}
 subtitle(who,kind,text,color,player=false){const box=$('#barks');if(!box)return;const el=document.createElement('div');el.className='bark'+(player?' me':'');el.innerHTML=`<b style="color:${color}">${who}</b><i style="color:${color}">${kind}</i> ${text.replace(/[<>&]/g,'')}`;box.prepend(el);while(box.children.length>3)box.lastChild.remove();setTimeout(()=>el.classList.add('out'),3800);setTimeout(()=>el.remove(),4400);}
 bubble(root,text,color,kind){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.font='bold 34px Arial';const w=Math.min(500,x.measureText(text).width+60);x.fillStyle='rgba(10,18,18,.82)';x.beginPath();x.roundRect((512-w)/2,10,w,78,16);x.fill();x.strokeStyle=color;x.lineWidth=4;x.stroke();x.beginPath();x.moveTo(246,88);x.lineTo(256,112);x.lineTo(266,88);x.closePath();x.fillStyle='rgba(10,18,18,.82)';x.fill();x.fillStyle=color;x.textAlign='center';x.fillText(text.length>26?text.slice(0,25)+'…':text,256,62);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));s.scale.set(2.4,.6,1);s.position.set(0,2.55,0);s.renderOrder=30;root.add(s);this.bubbles.push({s,root,life:2.8});}
 // ---- Enemy emotional reactions (called by Enemies / TDM bots) ----
 state(e,state,prev,group){if(this.muted)return;if(state==='INVESTIGATE')this.enemy(e,'suspicious');else if(state==='ALARM')this.enemy(e,'alarm',true);else if(state==='ATTACK'&&!['ATTACK','COVER','SEEK_COVER'].includes(prev))this.enemy(e,e.hp<45?'fear':Math.random()<.35?'angry':'alert');else if(state==='SEARCH'&&prev==='ATTACK'&&Math.random()<.5)this.enemy(e,'search');else if(state==='SEEK_COVER'&&e.hp<60&&Math.random()<.6){this.enemy(e,'fear');e.motion.cower=1.2;}}
 hurt(e,meta,group){if(this.muted)return;const kind=e.hp<40?'fear':meta?.head?'pain':Math.random()<.5?'angry':'pain';if(!this.enemy(e,kind))this.vocal(Math.random()<.5?'grunt':'pain',e.root.position);if(kind==='fear'&&e.motion)e.motion.cower=Math.max(e.motion.cower,1.4);}
 death(e,meta,group){const pos=e.root.position.clone().add(new THREE.Vector3(0,1.5,0));if(!this.muted)this.vocal(meta?.head?'grunt':Math.random()<.6?'scream':'pain',pos,{pitch:100+((e.id||0)%5)*12});if(this.muted||!group)return;
  // A nearby comrade mourns, rages or panics.
  const mates=group.list.filter(o=>!o.dead&&o!==e&&o.root.position.distanceTo(e.root.position)<26).sort((a,b)=>a.root.position.distanceTo(e.root.position)-b.root.position.distanceTo(e.root.position));const m=mates[0];if(!m)return;
  const alive=group.list.filter(o=>!o.dead).length;const kind=alive<=3||m.hp<45?'fear':Math.random()<.55?'sad':'angry';e.callsign=e.callsign||this.callsign(e);setTimeout(()=>{if(m.dead)return;this.enemy(m,kind,true);if(kind==='fear'&&m.motion)m.motion.cower=2;},700);}
 playerDown(group,pos){if(this.muted||!group)return;const near=group.list.filter(o=>!o.dead&&o.root.position.distanceTo(pos)<45);near.slice(0,3).forEach((m,i)=>{if(m.motion)m.motion.cheer=2.5;if(i===0)setTimeout(()=>{this.enemy(m,'happy',true);},400);});}
 // Idle chatter while patrolling.
 tick(dt,group,player){if(this.muted||!group)return;this.chat=(this.chat??8)-dt;if(this.chat>0)return;this.chat=12+Math.random()*10;const m=group.list.find(o=>!o.dead&&o.state==='PATROL'&&o.root.position.distanceTo(player)<22);if(m)this.enemy(m,'calm');}
 // Expression portrait (procedurally drawn face).
 setFace(f,sec=2.5){this.face=f;this.faceUntil=this.now()+sec;}
 update(dt,health){this.time+=dt;for(let i=this.bubbles.length-1;i>=0;i--){const b=this.bubbles[i];b.life-=dt;b.s.material.opacity=Math.min(1,b.life*2);b.s.position.y=2.55+(2.8-b.life)*.08;if(b.life<=0){b.root.remove(b.s);b.s.material.map.dispose();b.s.material.dispose();this.bubbles.splice(i,1);}}
  if(this.now()>this.faceUntil&&this.face!=='cry')this.face=health<35?'fear':'calm';if((this.time*6|0)!==this.lastFaceTick){this.lastFaceTick=this.time*6|0;this.drawFace(this.face,health);}}
 drawFace(f,health){const x=this.portrait;if(!x)return;const W=96;x.clearRect(0,0,W,W);x.save();
  x.fillStyle='#0d1a1b';x.fillRect(0,0,W,W);x.fillStyle='#4b5233';x.beginPath();x.ellipse(48,40,34,30,0,Math.PI,0);x.fill();x.fillRect(14,36,68,8);// cap
  x.fillStyle='#c99a77';x.beginPath();x.ellipse(48,56,25,30,0,0,Math.PI*2);x.fill();x.fillStyle='#4b5233';x.fillRect(16,30,64,12);// face & cap band
  x.fillStyle='rgba(60,70,40,.55)';x.fillRect(23,50,50,5);// camo stripe
  const brow={angry:[.35,-.35],fear:[-.3,.3],sad:[-.35,.35],cry:[-.4,.4],pain:[.25,-.25],happy:[0,0],calm:[0,0]}[f]||[0,0];x.strokeStyle='#2a1d14';x.lineWidth=3;for(const [cx,a] of [[38,brow[0]],[58,brow[1]]]){x.beginPath();x.moveTo(cx-7,47+a*8);x.lineTo(cx+7,47-a*8);x.stroke();}
  const eyeH=f==='happy'?1.5:f==='pain'?1:f==='fear'?4.5:3.2;x.fillStyle='#1b1b1b';for(const cx of [38,58]){x.beginPath();x.ellipse(cx,53,3.6,eyeH,0,0,Math.PI*2);x.fill();}
  x.strokeStyle='#5a2a20';x.lineWidth=3;x.beginPath();if(f==='happy'){x.arc(48,66,10,.15*Math.PI,.85*Math.PI);}else if(f==='angry'||f==='pain'){x.moveTo(38,72);x.lineTo(58,72);if(f==='pain'){x.moveTo(40,72);x.lineTo(56,74);}}else if(f==='fear'){x.ellipse(48,73,5,6,0,0,Math.PI*2);}else if(f==='sad'||f==='cry'){x.arc(48,80,10,1.15*Math.PI,1.85*Math.PI);}else{x.moveTo(40,72);x.quadraticCurveTo(48,74,56,72);}x.stroke();
  if(f==='cry'||f==='sad'){x.fillStyle='rgba(140,200,255,.85)';for(const cx of [36,60]){const yy=58+((this.time*20)%18);x.beginPath();x.ellipse(cx,yy,2,3.5,0,0,Math.PI*2);x.fill();}}
  if(f==='fear'||f==='pain'){x.fillStyle='rgba(180,220,255,.8)';x.beginPath();x.ellipse(72,44,2.2,3.6,0,0,Math.PI*2);x.fill();}
  if(health<50){x.fillStyle=`rgba(140,10,10,${(1-health/50)*.8})`;x.beginPath();x.ellipse(30,40,6,10,.5,0,Math.PI*2);x.fill();x.fillRect(64,62,4,14);}
  x.restore();x.strokeStyle={angry:'#ff5a3c',fear:'#f3c24a',sad:'#7cbcff',cry:'#7cbcff',happy:'#9fe3ae',pain:'#ff8c5a',calm:'#d3e3b3'}[f]||'#d3e3b3';x.lineWidth=3;x.strokeRect(1.5,1.5,W-3,W-3);
  const lbl=$('#portraitMood');if(lbl)lbl.textContent=f.toUpperCase();}
}
