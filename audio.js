// Original procedural audio engine (Web Audio). No copyrighted recordings.
// v8.7 mix architecture (modern-shooter style):
//   sfx ─┐                      ┌→ room reverb (indoors)     ┐
//   voice┼→ master LPF (slow-mo / concussion) → 3-band glue EQ → bus compressor → brick-wall limiter → out
//   music┤  ambience┘          └→ outdoor reverb + valley slap-back echoes (outdoors)
// "HDR" mixing: loud events (your gunfire, explosions, dialogue) briefly pull ambience and music down so the
// important sound always cuts through, then release. Gunshots are layered: transient crack, mechanical
// body (recorded sample where available), low-end punch, stereo-width early reflections and a distance-
// dependent tail; far shots arrive late (speed of sound), lose high end (air absorption) and roll back as
// terrain echoes. Bullets passing close give a supersonic crack + whizz.
import {VoiceBank} from './vo.js';
const PROFILES={
 m4:{lp:2800,body:150,dur:.2,vol:.9,crack:.5,rev:.35},
 ak74:{lp:2300,body:115,dur:.24,vol:1,crack:.6,rev:.4},
 ak74u:{lp:2600,body:135,dur:.19,vol:.92,crack:.55,rev:.35},
 smg:{lp:3200,body:170,dur:.14,vol:.75,crack:.45,rev:.25},
 pistol:{lp:3400,body:210,dur:.13,vol:.7,crack:.5,rev:.3},
 magnum:{lp:2000,body:90,dur:.34,vol:1.1,crack:.7,rev:.5},
 shotgun:{lp:1700,body:75,dur:.42,vol:1.15,crack:.65,rev:.55},
 sniper:{lp:2600,body:65,dur:.55,vol:1.25,crack:.8,rev:.75,echo:1.6},
 suppressed:{lp:1400,body:180,dur:.08,vol:.32,crack:.12,rev:.05,suppressed:true}
};
// Which weapons use the recorded samples (rate shifts give each gun its own character).
const SAMPLE_OF={m4:{name:'rifle_fire',rate:1.04,vol:.95},ak74:{name:'rifle_fire',rate:.94,vol:1.05},ak74u:{name:'rifle_fire',rate:1.0,vol:1},smg:{name:'rifle_fire',rate:1.16,vol:.8},sniper:{name:'rifle_fire',rate:.8,vol:1.25},pistol:{name:'pistol_fire',rate:1,vol:.9},magnum:{name:'pistol_fire',rate:.82,vol:1.15}};
export class AudioFX {
 constructor(){this.ctx=null;this.volume=.45;this.musicVolume=.6;this.muted=false;this.alarmNodes=null;this.surface='hard';this.outdoor=true;this.indoor=false;this.amb=null;this.env='valley';this.vo=new VoiceBank(this);}
 async unlock(){if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=this.ctx=new AC();
   this.out=c.createGain();this.out.gain.value=this.muted?0:this.volume;
   // bus compressor (glue) → brick-wall limiter → output; 3-band glue EQ in front (weight + presence + air).
   this.comp=c.createDynamicsCompressor();this.comp.threshold.value=-20;this.comp.knee.value=10;this.comp.ratio.value=3.2;this.comp.attack.value=.006;this.comp.release.value=.22;
   this.limit=c.createDynamicsCompressor();this.limit.threshold.value=-3;this.limit.knee.value=0;this.limit.ratio.value=20;this.limit.attack.value=.001;this.limit.release.value=.08;
   const eq=(type,f,g,q=.8)=>{const b=c.createBiquadFilter();b.type=type;b.frequency.value=f;b.gain.value=g;b.Q.value=q;return b;};
   this.eqLo=eq('lowshelf',110,2.5);this.eqMid=eq('peaking',2600,1.5,.9);this.eqHi=eq('highshelf',9000,1.8);
   this.lpf=c.createBiquadFilter();this.lpf.type='lowpass';this.lpf.frequency.value=20000;this.lpf.Q.value=.7;
   this.lpf.connect(this.eqLo);this.eqLo.connect(this.eqMid);this.eqMid.connect(this.eqHi);this.eqHi.connect(this.comp);this.comp.connect(this.limit);this.limit.connect(this.out);this.out.connect(c.destination);
   // `master` stays as the sfx entry point for older code paths (helicopter, alarm).
   this.master=c.createGain();this.master.connect(this.lpf);this.sfx=this.master;
   this.musicBus=c.createGain();this.musicBus.gain.value=this.musicVolume;this.musicBus.connect(this.lpf);
   this.ambBus=c.createGain();this.ambBus.gain.value=.55;this.ambBus.connect(this.lpf);
   this.voiceBus=c.createGain();this.voiceBus.gain.value=1;this.voiceBus.connect(this.lpf);
   // Two reverbs: a long outdoor/valley space and a short room; revSend feeds whichever matches the player.
   this.revSend=c.createGain();this.revSend.gain.value=.9;this.revOut=c.createGain();this.revRoom=c.createGain();this.revRoom.gain.value=0;
   this.reverb=c.createConvolver();this.reverb.buffer=this.impulse(3.2,2.6,{early:[.031,.047,.083,.121],pre:.018});this.room=c.createConvolver();this.room.buffer=this.impulse(.9,3.4,{early:[.007,.011,.017,.023,.029],pre:.002});
   const rHp=c.createBiquadFilter();rHp.type='highpass';rHp.frequency.value=180;this.revSend.connect(rHp);rHp.connect(this.revOut);rHp.connect(this.revRoom);this.revOut.connect(this.reverb);this.revRoom.connect(this.room);this.reverb.connect(this.lpf);this.room.connect(this.lpf);
   const n=c.sampleRate*2;this.noise=c.createBuffer(1,n,c.sampleRate);const a=this.noise.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;this.loadSamples();this.vo.load();}
  await this.ctx.resume();}
 // ---- Recorded samples (assets/sfx): rifle & pistol shots, jump, walking/running loops ----
 async loadSamples(base='./assets/sfx/'){this.buf=this.buf||{};const names=['rifle_fire','pistol_fire','jump','walking','running'];await Promise.all(names.map(async n=>{try{const r=await fetch(base+n+'.mp3');if(!r.ok)return;const ab=await r.arrayBuffer();this.buf[n]=await new Promise((ok,bad)=>this.ctx.decodeAudioData(ab,ok,bad));}catch(e){console.warn('sample',n,e);}}));}
 sample(name,{vol=1,rate=1,pan=0,delay=0,lp=0,rev=0,bus=null}={}){const b=this.buf?.[name];if(!b||!this.ready)return null;const c=this.ctx,t=c.currentTime+delay,s=c.createBufferSource();s.buffer=b;s.playbackRate.value=rate;const g=this.node(bus,pan,rev);g.gain.value=vol;let head=g;if(lp&&lp<18000){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;f.connect(g);head=f;}s.connect(head);s.start(t);s.onended=()=>{try{s.disconnect();g.disconnect();}catch(_){}};return {src:s,gain:g,t};}
 // Footstep loops follow the player's locomotion: state 'idle' | 'walk' | 'run' | 'crouch'.
 locomotion(state,speed=0){if(!this.ready||!this.buf?.walking)return false;const c=this.ctx;if(!this.loco){this.loco={};for(const n of ['walking','running']){const s=c.createBufferSource();s.buffer=this.buf[n];s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=9000;const g=c.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(this.sfx);s.start();this.loco[n]={s,g,f};}}
  const t=c.currentTime,grass=this.surface==='grass',W=this.loco.walking,R=this.loco.running;const wv=state==='walk'?.85:state==='crouch'?.35:0,rv=state==='run'?.75:0;
  W.g.gain.setTargetAtTime(wv*(grass?.9:1),t,.06);R.g.gain.setTargetAtTime(rv,t,.06);W.s.playbackRate.setTargetAtTime(state==='crouch'?.8:Math.max(.85,Math.min(1.2,speed/4.2)),t,.1);R.s.playbackRate.setTargetAtTime(Math.max(.9,Math.min(1.15,speed/7)),t,.1);
  for(const L of [W,R])L.f.frequency.setTargetAtTime(this.wading?1400:grass?6000:9000,t,.1);return true;}
 jump(){if(!this.sample('jump',{vol:.75}))this.burst(.08,.08,500);}
 // Synthetic impulse response: pre-delay, discrete early reflections, then a diffuse decaying tail that
 // darkens over time (high frequencies die first, as in real spaces). Stereo channels are decorrelated.
 impulse(seconds,decay,{early=[],pre=0}={}){const c=this.ctx,sr=c.sampleRate,len=Math.floor(sr*seconds),buf=c.createBuffer(2,len,sr);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let lp=0;for(let i=0;i<len;i++){const t=i/len;const k=.18+.8*t;const n=Math.random()*2-1;lp=lp+(n-lp)*(1-k*.85);d[i]=(i<pre*sr?0:lp*Math.pow(1-t,decay))*(i<sr*.012?.25:1);}
   for(const [j,e] of early.entries()){const at=Math.floor((e*(1+(ch?.07:-.05)*(j%2?1:-1))+pre)*sr);for(let k=0;k<Math.floor(sr*.004);k++)if(at+k<len)d[at+k]+=(Math.random()*2-1)*(.55-j*.08)*(1-k/(sr*.004));}}
  return buf;}
 // Indoors/outdoors (set by the game from a ray above the player): crossfades the two reverbs.
 // v9: under water everything goes dull and close (low-pass on the master bus, ambience pulled back).
 setUnderwater(on){if(!this.ctx||this.under===on)return;this.under=on;const t=this.ctx.currentTime,f=this.lpf.frequency;f.cancelScheduledValues(t);f.setTargetAtTime(on?460:20000,t,on?.04:.15);this.ambBus.gain.setTargetAtTime(on?.22:.55,t,.12);}
 setIndoor(on){if(!this.ctx||this.indoor===on)return;this.indoor=on;this.outdoor=!on;const t=this.ctx.currentTime;this.revOut.gain.setTargetAtTime(on?.15:1,t,.25);this.revRoom.gain.setTargetAtTime(on?1.1:0,t,.25);}
 setEnvironment(kind){this.env=kind;}
 // Radio: squelch click (key up / key down) and a thin static bed under the line.
 squelch(at,end=false){if(!this.ready)return;const c=this.ctx,d=Math.max(0,at-c.currentTime);this.burst(end?.09:.05,end?.07:.09,end?2600:3400,{type:'bandpass',q:2.2,delay:d,bus:this.voiceBus});this.tone(end?1800:2300,.025,.035,'square',end?1200:2000,{delay:d,bus:this.voiceBus});}
 radioStatic(at,dur){if(!this.ready)return;const c=this.ctx,t=Math.max(c.currentTime,at),s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;s.loop=true;f.type='bandpass';f.frequency.value=2400;f.Q.value=.9;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.012,t+.04);g.gain.setValueAtTime(.012,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+.08);s.connect(f);f.connect(g);g.connect(this.voiceBus);s.start(t,Math.random());s.stop(t+dur+.12);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
 // HDR mix: briefly pull ambience (and a little music) down under a loud event.
 hdr(amount=.5,hold=.15,release=1.1){if(!this.ready)return;const t=this.ctx.currentTime;const g=this.ambBus.gain;g.cancelScheduledValues(t);g.setTargetAtTime(.55*amount,t,.02);g.setTargetAtTime(.55,t+hold,release/3);}
 get ready(){return this.ctx&&this.ctx.state==='running';}
 level(v){this.volume=v;if(this.out)this.out.gain.setTargetAtTime(this.muted?0:v,this.ctx.currentTime,.05);}
 setMusic(v){this.musicVolume=v;if(this.musicBus)this.musicBus.gain.setTargetAtTime(v,this.ctx.currentTime,.1);}
 // Dialogue / explosion ducking for music and ambience.
 duck(amount=.45,seconds=2,o={}){if(!this.ready)return;const t=this.ctx.currentTime;for(const [bus,base] of [[this.musicBus,this.musicVolume],[this.ambBus,.55]]){bus.gain.cancelScheduledValues(t);bus.gain.setTargetAtTime(base*amount,t,.08);bus.gain.setTargetAtTime(base,t+seconds,.6);}if(o.voice){const g=this.master.gain;g.cancelScheduledValues(t);g.setTargetAtTime(.72,t,.08);g.setTargetAtTime(1,t+seconds,.5);}}
 // Slow-motion / concussion: muffle everything for a moment.
 muffle(seconds=.8,freq=700){if(!this.ready)return;const t=this.ctx.currentTime,f=this.lpf.frequency;f.cancelScheduledValues(t);f.setValueAtTime(f.value,t);f.exponentialRampToValueAtTime(freq,t+.08);f.setValueAtTime(freq,t+seconds);f.exponentialRampToValueAtTime(20000,t+seconds+.7);}
 node(dest,pan=0,rev=0){const c=this.ctx,g=c.createGain();let tail=g;if(pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);tail=p;}tail.connect(dest||this.sfx);if(rev>0){const s=c.createGain();s.gain.value=rev;tail.connect(s);s.connect(this.revSend);}return g;}
 tone(freq,duration,volume=.15,type='sine',end=freq,opts={}){if(!this.ready)return;const c=this.ctx,t=c.currentTime+(opts.delay||0),o=c.createOscillator(),g=this.node(opts.bus,opts.pan||0,opts.rev||0);o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume,t+Math.min(.01,duration*.2));g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
 burst(duration,volume,frequency=900,opts={}){if(!this.ready)return;const c=this.ctx,t=c.currentTime+(opts.delay||0),s=c.createBufferSource(),f=c.createBiquadFilter(),g=this.node(opts.bus,opts.pan||0,opts.rev||0);s.buffer=this.noise;f.type=opts.type||'lowpass';f.frequency.setValueAtTime(frequency,t);if(opts.sweep)f.frequency.exponentialRampToValueAtTime(opts.sweep,t+duration);if(opts.q)f.Q.value=opts.q;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f);f.connect(g);s.start(t,Math.random()*1.5);s.stop(t+duration+.02);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect()};}
 // Layered weapon shot. distance in meters (0 = the player's own gun), pan -1..1.
 shot(kind='m4',distance=0,pan=0){if(!this.ready)return;const P=PROFILES[kind]||PROFILES.m4,near=distance<8,own=distance<1.5;const c=this.ctx;
  const vol=P.vol*Math.max(.025,1/(1+distance*.07));const delay=Math.min(.9,distance/343);const air=Math.max(450,P.lp*(1-Math.min(.8,distance/200)));const out=this.outdoor;
  if(own)this.hdr(.45,.1,.9);else if(distance<25)this.hdr(.7,.05,.7);
  if(P.suppressed){// thump + gas puff + action noise; almost no tail
   this.burst(.06,.42*vol,1100,{delay,pan,rev:.04,sweep:420});this.tone(160,.07,.3*vol,'sine',60,{delay,pan});this.burst(.025,.14*vol,6500,{type:'highpass',delay,pan});if(near){this.burst(.035,.1,2600,{type:'bandpass',q:3,delay:.012});this.mech(.06);}return;}
  // 1) transient crack (only clearly audible close by)
  if(distance<60)this.burst(.012+distance*.0002,(own?.55:.35)*P.crack*vol*2.2,own?7000:5200,{type:'highpass',delay,pan});
  // 2) body: recorded sample where available, else filtered noise
  const smp=SAMPLE_OF[kind];let usedSample=false;
  if(smp&&this.buf?.[smp.name]){const ch=near?'near':'far',prev=this.lastShot?.[ch];if(prev&&c.currentTime-prev.t<.3)prev.gain.gain.setTargetAtTime(prev.gain.gain.value*.4,c.currentTime,.04);
   const r=this.sample(smp.name,{vol:smp.vol*vol*(near?1:1.2),rate:smp.rate*(1+(Math.random()-.5)*.05),pan,delay,lp:near?0:air*1.5,rev:near?.06:P.rev*.5});(this.lastShot=this.lastShot||{})[ch]=r;usedSample=true;}
  if(!usedSample)this.burst(P.dur,.85*vol,air,{sweep:Math.max(200,air*.25),delay,pan,rev:P.rev*(near?.5:1.2)});
  // 3) low-end punch (you feel your own gun)
  this.tone(P.body,P.dur*1.25,(usedSample?.24:.4)*vol,'sine',30,{delay,pan});
  if(own){this.tone(P.body*.5,P.dur*1.8,.26*vol,'sine',24);this.burst(.05,.16*vol,180,{sweep:60});}
  // 4) stereo early reflections: two short, filtered copies left/right (width + sense of space)
  const er=out?[.019,.033]:[.006,.011];for(const [k,d] of er.entries())this.burst(.05+P.dur*.3,.1*vol*(own?1:.6),Math.min(5000,air*1.2),{delay:delay+d,pan:k?.75:-.75,rev:out?.2:.5,type:'bandpass',q:.6});
  // 5) tail: outdoors a valley/terrain echo train (rolling slap-backs), indoors a short dense room tail
  if(out){const n=distance>120?2:3,base=(P.echo||1)*(.22+Math.random()*.08);for(let k=0;k<n;k++){const d=delay+base*(1+k*(.85+Math.random()*.5))+Math.min(.5,distance/500);const v=(.2/(1+k*.9))*vol*(P.echo?1.4:1)*(distance>40?1.3:1);this.burst(P.dur*2.2+k*.12,v,Math.max(300,air*(.42-k*.08)),{delay:d,pan:(k%2?1:-1)*(.35+Math.random()*.45),rev:.85,sweep:Math.max(150,air*.2)});}}
  else this.burst(.28,.16*vol,Math.min(3200,air),{delay:delay+.012,pan:-pan*.5,rev:1,sweep:600});
  if(near)this.mech(kind==='shotgun'?.5:kind==='sniper'||kind==='magnum'?.9:.12);}
 // Mechanical action + falling shell casings (surface-dependent landing).
 mech(after=.12){this.tone(1900,.022,.045,'square',900,{delay:.012});this.burst(.03,.06,3600,{type:'bandpass',q:2,delay:.01});const soft=this.surface==='grass'||this.wading;const n=1+Math.floor(Math.random()*2);
  for(let i=0;i<n;i++){const d=after+.28+Math.random()*.32,p=.35+Math.random()*.25;if(soft){this.burst(.05,.03,900,{delay:d,pan:p});continue;}this.tone(4300+Math.random()*1800,.045,.028,'sine',3900,{delay:d,pan:p});this.tone(5600+Math.random()*1500,.03,.018,'sine',4900,{delay:d+.06+Math.random()*.05,pan:p});this.tone(4800+Math.random()*900,.025,.012,'sine',4500,{delay:d+.16+Math.random()*.06,pan:p});}}
 // A bullet passing close to the player's head.
 whiz(pan=0){if(!this.ready)return;this.burst(.008,.42,6500,{type:'highpass',pan});this.burst(.18,.3,4200,{type:'bandpass',sweep:800,q:5,pan,delay:.004});this.tone(2600,.12,.03,'sine',900,{pan});this.hdr(.6,.05,.6);}
 ricochet(){this.tone(2400+Math.random()*900,.22,.05,'sine',900,{rev:.4,pan:(Math.random()-.5)});}
 step(run=false){if(run&&Math.random()<.6)this.burst(.09,.025,2200,{type:'bandpass',q:1.4,delay:.03,pan:(Math.random()-.5)*.4});const grass=this.surface==='grass';this.burst(grass?.11:.075,(run?.12:.07)*(grass?.9:1),grass?600:350,{sweep:grass?250:undefined});if(grass)this.burst(.06,.03,2600,{type:'bandpass',q:1.2,delay:.02});}
 knife(){this.burst(.17,.24,2200,{type:'bandpass',sweep:5000,q:1.2});}
 reload(){this.burst(.08,.2,3200,{type:'highpass'});this.tone(850,.06,.04,'square',260);this.tone(1400,.04,.05,'square',600,{delay:.32});this.burst(.05,.15,2800,{type:'highpass',delay:.34});}
 pickup(){this.tone(660,.14,.12);this.tone(990,.2,.07);}
 hurt(){this.burst(.17,.3,300);this.tone(85,.2,.15,'sine',40);this.muffle(.25,1400);}
 door(){this.tone(100,.25,.07,'sawtooth',50);this.burst(.13,.13,400);this.tone(1600,.12,.015,'sine',1100,{delay:.05});}
 explosion(distance=0){const vol=Math.max(.05,1/(1+distance*.045)),delay=Math.min(1.2,distance/343),air=Math.max(250,4000*(1-Math.min(.85,distance/180)));
  this.burst(.04,.9*vol,air,{type:'highpass',delay});// initial crack
  this.burst(1.8,1.15*vol,Math.min(1100,air),{sweep:110,delay,rev:.9});this.burst(.4,.8*vol,Math.min(3200,air),{sweep:500,delay});// body
  this.tone(58,1.3,.65*vol,'sine',20,{delay});this.tone(36,2,.5*vol,'sine',16,{delay});// sub
  for(let i=0;i<9;i++)this.burst(.04,.05*vol,2400+Math.random()*2400,{type:'bandpass',q:2,delay:delay+.35+Math.random()*1.4,pan:Math.random()*1.6-.8});// debris rain
  if(this.outdoor)for(let k=0;k<3;k++)this.burst(1.1+k*.4,.22*vol/(1+k),Math.max(160,air*.25),{delay:delay+.5+k*(.55+Math.random()*.3),pan:k%2?.6:-.6,rev:.9,sweep:90});// rolling echoes
  if(distance<30){this.muffle(1.2,480);this.ring(1.6);}this.duck(.35,1.8);this.hdr(.25,.4,2);}
 // Tinnitus after a close blast.
 ring(sec=1.2){this.tone(3900,sec,.035,'sine',3700);}
 kill(head=false){this.tone(head?1250:900,.07,.11,'square',head?1400:1000);this.tone(head?1650:1200,.12,.07,'sine');this.burst(.09,.22,700,{sweep:180});this.tone(95,.14,.18,'sine',45);if(head){this.tone(3100,.25,.05,'sine',2900,{rev:.3});this.burst(.05,.12,2200,{type:'bandpass',q:3,delay:.01});}}
 hit(head=false){this.tone(head?900:520,.04,head?.09:.06,'triangle',head?700:380);this.burst(.06,.12,head?2600:900,{sweep:head?900:300});if(head)this.tone(3300,.18,.04,'sine',3000);}
 streak(){[523,659,784,1046].forEach((f,i)=>this.tone(f,.18,.1,'triangle',f,{delay:i*.09,bus:this.musicBus}));}
 levelUp(){[392,523,659,784,1046].forEach((f,i)=>this.tone(f,.25,.1,'triangle',f,{delay:i*.11,bus:this.musicBus}));}
 throw(){this.burst(.12,.18,1200,{type:'bandpass',sweep:3000});}
 bounce(){this.tone(320,.05,.05,'square',180);this.tone(1800,.03,.02,'sine',1200,{delay:.01});}
 whoosh(){this.burst(.55,.35,400,{type:'bandpass',sweep:4000,q:1.4,rev:.3});}
 heartbeat(){this.tone(55,.13,.25,'sine',38);this.tone(50,.12,.18,'sine',36,{delay:.22});}
 // Synthesized human vocalizations (no recordings): glottal saw source through vowel formants.
 vocal(kind,o={}){if(!this.ready)return;const c=this.ctx,t=c.currentTime+(o.delay||0),f0=o.pitch||(o.female?210:120),vol=(o.vol??1)*.5,pan=o.pan||0;
  const V={a:[730,1090,2440],e:[530,1840,2480],u:[300,870,2240],o:[570,840,2410],ah:[850,1220,2600]};
  const voice=(start,dur,vowel,from,to,amp,breath=.2,vib=0)=>{const src=c.createOscillator();src.type='sawtooth';src.frequency.setValueAtTime(from,start);src.frequency.exponentialRampToValueAtTime(Math.max(40,to),start+dur);if(vib){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=vib;lg.gain.value=from*.06;l.connect(lg);lg.connect(src.frequency);l.start(start);l.stop(start+dur+.05);}
   const out=this.node(this.sfx,pan,.25);const env=c.createGain();env.gain.setValueAtTime(.0001,start);env.gain.linearRampToValueAtTime(amp*vol,start+Math.min(.04,dur*.2));env.gain.setValueAtTime(amp*vol,start+dur*.6);env.gain.exponentialRampToValueAtTime(.0005,start+dur);env.connect(out);
   for(const [i,f] of V[vowel].entries()){const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*(o.female?1.15:1);bp.Q.value=i===0?6:9;const g=c.createGain();g.gain.value=[1,.55,.3][i];src.connect(bp);bp.connect(g);g.connect(env);}
   const n=c.createBufferSource();n.buffer=this.noise;const nf=c.createBiquadFilter();nf.type='bandpass';nf.frequency.value=1600;nf.Q.value=.8;const ng=c.createGain();ng.gain.value=breath;n.connect(nf);nf.connect(ng);ng.connect(env);src.start(start);src.stop(start+dur+.05);n.start(start,Math.random());n.stop(start+dur+.05);};
  if(kind==='grunt')voice(t,.18,'u',f0*1.1,f0*.8,1,.35);
  else if(kind==='pain')voice(t,.45,'ah',f0*1.5,f0*.9,1.1,.3,6);
  else if(kind==='scream'){voice(t,.9,'a',f0*2.2,f0*.7,1.2,.45,7);voice(t+.85,.4,'u',f0*.9,f0*.5,.6,.5);}
  else if(kind==='laugh'){for(let i=0;i<4;i++)voice(t+i*.17,.12,'a',f0*(1.35-i*.06),f0*1.1,.9,.5);}
  else if(kind==='sob'){for(let i=0;i<3;i++)voice(t+i*.32,.26,'u',f0*1.25,f0*1.05,.7,.55,9);}
  else if(kind==='shout')voice(t,.32,'e',f0*1.6,f0*1.3,1.2,.3);
  else if(kind==='panic')voice(t,.5,'ah',f0*2,f0*1.6,1,.4,10);}
 ui(){this.tone(700,.06,.08);}
 alarm(on){if(!this.ctx)return;if(on&&!this.alarmNodes){const o=this.ctx.createOscillator(),l=this.ctx.createOscillator(),lg=this.ctx.createGain(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.value=680;l.frequency.value=1.2;lg.gain.value=220;g.gain.value=.06;l.connect(lg);lg.connect(o.frequency);o.connect(g);g.connect(this.master);const s=this.ctx.createGain();s.gain.value=.5;g.connect(s);s.connect(this.revSend);o.start();l.start();this.alarmNodes={o,l,lg,g,s};}if(!on&&this.alarmNodes){for(const n of Object.values(this.alarmNodes)){n.stop?.();n.disconnect();}this.alarmNodes=null;}}
 // Looping environment beds.
 ambience(kind){if(!this.ctx)return;this.stopAmbience();const c=this.ctx,nodes=[],timers=[];const bed=(freq,q,vol,lfo=.07)=>{const s=c.createBufferSource();s.buffer=this.noise;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=c.createGain();g.gain.value=vol;const l=c.createOscillator();l.frequency.value=lfo;const lg=c.createGain();lg.gain.value=vol*.6;l.connect(lg);lg.connect(g.gain);s.connect(f);f.connect(g);g.connect(this.ambBus);s.start();l.start();nodes.push(s,f,g,l,lg);};
  const every=(min,max,fn)=>{const tick=()=>{fn();timers.push(setTimeout(tick,(min+Math.random()*(max-min))*1000));};timers.push(setTimeout(tick,min*500));};
  const bird=()=>{if(!this.ready)return;const base=2200+Math.random()*2200,pan=Math.random()*1.6-.8,n=2+Math.floor(Math.random()*4);for(let i=0;i<n;i++)this.tone(base*(1+Math.random()*.25),.07+Math.random()*.06,.02+Math.random()*.02,'sine',base*(.8+Math.random()*.6),{delay:i*.11,bus:this.ambBus,pan,rev:.4});};
  const crickets=()=>{if(!this.ready)return;const pan=Math.random()*1.6-.8;for(let i=0;i<6;i++)this.tone(4600+Math.random()*200,.03,.012,'sine',4500,{delay:i*.055,bus:this.ambBus,pan});};
  const thunder=()=>{if(!this.ready)return;this.burst(4,.25,180,{sweep:60,bus:this.ambBus,rev:.6});};
  if(kind==='forest'){bed(420,.6,.06,.05);bed(1800,.5,.012,.11);every(2,7,bird);}
  else if(kind==='fog'){bed(300,.5,.09,.04);bed(900,.4,.02,.09);every(18,35,thunder);every(6,14,bird);}
  else if(kind==='dusk'){bed(350,.6,.05,.05);every(.6,1.6,crickets);every(8,16,bird);}
  else if(kind==='city'){bed(120,.8,.05,.03);bed(700,.4,.012,.08);}
  this.amb={nodes,timers};}
 // River murmur and waterfall roar (gains 0..1 set every frame by the forest controller).
 water(river=0,fall=0,pan=0){if(!this.ready)return;const c=this.ctx;if(!this.wat){const mk=(f,q,type='bandpass')=>{const s=c.createBufferSource();s.buffer=this.noise;s.loop=true;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.value=0;const p=c.createStereoPanner?c.createStereoPanner():null;s.connect(fl);fl.connect(g);if(p){g.connect(p);p.connect(this.ambBus);}else g.connect(this.ambBus);s.start(0,Math.random()*1.5);return {g,p};};
   this.wat={rLo:mk(500,.7),rHi:mk(2600,1.2),fLo:mk(180,.6,'lowpass'),fMid:mk(900,.5)};}
  const t=c.currentTime,W=this.wat;W.rLo.g.gain.setTargetAtTime(river*.35,t,.3);W.rHi.g.gain.setTargetAtTime(river*.12,t,.3);W.fLo.g.gain.setTargetAtTime(fall*.9,t,.3);W.fMid.g.gain.setTargetAtTime(fall*.45,t,.3);for(const k of ['fLo','fMid'])W[k].p?.pan.setTargetAtTime(pan,t,.2);}
 splash(v=1){this.burst(.22,.12*v,1800,{type:'bandpass',q:.8,sweep:500});this.burst(.12,.06*v,4200,{type:'highpass',delay:.04});}
 stopAmbience(){if(!this.amb)return;for(const t of this.amb.timers)clearTimeout(t);for(const n of this.amb.nodes){try{n.stop?.()}catch(_){}n.disconnect();}this.amb=null;}
 pause(){this.ctx?.suspend();}resume(){this.ctx?.resume();}
}
