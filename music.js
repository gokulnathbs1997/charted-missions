// Adaptive action-movie score, synthesized live (original composition, D minor).
// Layers: pad (strings), pulse (spiccato ostinato), percussion (taiko/snare/hats), hits (braams),
// lead (heroic theme). setState() crossfades layers; cue() fires cinematic moments in sync with cutscenes.
const NOTE=n=>440*Math.pow(2,(n-69)/12);
// i – VI – III – VII in D minor (bass MIDI note, chord tones).
const PROG=[[38,[50,53,57,62]],[34,[46,50,53,58]],[41,[48,53,57,60]],[36,[48,52,55,60]]];
const COMBAT=[[38,[50,53,57,62]],[38,[50,53,57,62]],[34,[46,50,53,58]],[36,[48,52,55,60]]];
const LEVELS={silent:{pad:0,pulse:0,perc:0,hits:0},menu:{pad:.55,pulse:.18,perc:0,hits:.4},stealth:{pad:.42,pulse:.22,perc:.12,hits:0},tension:{pad:.4,pulse:.55,perc:.42,hits:.55},combat:{pad:.28,pulse:.7,perc:.95,hits:.85},cinematic:{pad:.55,pulse:.35,perc:.5,hits:1},victory:{pad:.6,pulse:.2,perc:.2,hits:.6},defeat:{pad:.5,pulse:0,perc:0,hits:.4}};
export class MusicDirector {
 constructor(audio){this.audio=audio;this.state='silent';this.started=false;this.step=0;this.bar=0;this.tempo=96;this.next=0;this.build=0;this.lastCue={};}
 init(){const a=this.audio;if(this.started||!a.ctx)return;const c=a.ctx;this.c=c;this.bus={};for(const k of ['pad','pulse','perc','hits','lead']){const g=c.createGain();g.gain.value=0;g.connect(a.musicBus);const s=c.createGain();s.gain.value=k==='perc'?.25:.5;g.connect(s);s.connect(a.revSend);this.bus[k]=g;}this.bus.lead.gain.value=.9;
  this.started=true;this.next=c.currentTime+.1;this.timer=setInterval(()=>this.schedule(),25);this.apply(true);}
 setState(s){if(!LEVELS[s]||s===this.state)return;const prev=this.state;this.state=s;if(!this.started)return;this.apply();
  if(s==='combat'&&prev!=='combat'&&prev!=='cinematic')this.cue('stab');if(s==='victory')this.cue('victory');if(s==='defeat')this.cue('defeat');this.tempo=s==='combat'?118:s==='tension'?104:s==='cinematic'?100:92;}
 apply(instant){const L=LEVELS[this.state],t=this.c.currentTime;for(const k of ['pad','pulse','perc','hits'])this.bus[k].gain.setTargetAtTime(L[k],t,instant?.01:1.4);}
 schedule(){if(!this.audio.ready)return;const c=this.c;while(this.next<c.currentTime+.15){this.play16(this.next);const dur=60/this.tempo/4;this.next+=dur;this.step=(this.step+1)%16;if(this.step===0)this.bar++;}}
 prog(){return (this.state==='combat'?COMBAT:PROG)[this.bar%4];}
 play16(t){const s=this.step,[bass,chord]=this.prog(),L=LEVELS[this.state],combat=this.state==='combat',tension=this.state==='tension'||this.state==='cinematic';
  if(s===0&&L.pad>0&&this.bar%2===0)this.pad(chord,t,60/this.tempo*8);
  if(s===0&&L.pad>0)this.bassNote(bass,t,60/this.tempo*4);
  if(L.pulse>0){const pat=combat?[1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1]:tension?[1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1]:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0];if(pat[s])this.pluck(chord[(s*3+this.bar)%chord.length]+(s%8===7?12:0),t,s%4===0?1:.7);}
  if(L.perc>0){const build=this.build>0;if(combat){if(s%8===0||s===14)this.taiko(t,1);if(s===4||s===12)this.snare(t,.9);if(s%2===0)this.hat(t,s%4===2?.5:.3);if(s===10)this.taiko(t,.6,140);}
   else if(tension){if(s===0||s===10)this.taiko(t,.8);if(s%4===2)this.hat(t,.25);if(s===12&&this.bar%2)this.taiko(t,.5,150);}
   else if(this.state==='stealth'){if(s===0&&this.bar%2===0)this.taiko(t,.35,70);if(s%8===4)this.hat(t,.12);}
   if(build&&s%2===0)this.snare(t,.35+.4*Math.min(1,this.buildLevel()));}
  if(L.hits>0&&s===0&&((combat&&this.bar%2===0)||(this.state==='tension'&&this.bar%4===0)))this.braam(bass,t,L.hits*.8);}
 buildLevel(){if(!this.buildEnd)return 0;const r=(this.buildEnd-this.c.currentTime)/this.buildDur;if(r<=0){this.build=0;return 0;}return 1-r;}
 // ---------- instruments ----------
 env(g,t,a,peak,d,sustain=0){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(sustain,t+a,d);}
 pad(chord,t,dur){const c=this.c;for(const n of chord){for(const det of [-7,6]){const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.value=NOTE(n);o.detune.value=det;f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(1100,t+dur*.5);f.frequency.linearRampToValueAtTime(600,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.032,t+1.4);g.gain.setValueAtTime(.032,t+dur-1.2);g.gain.linearRampToValueAtTime(.0001,t+dur+.6);o.connect(f);f.connect(g);g.connect(this.bus.pad);o.start(t);o.stop(t+dur+.7);o.onended=()=>{o.disconnect();f.disconnect();g.disconnect();};}}}
 bassNote(n,t,dur){const c=this.c,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=NOTE(n);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.16,t+.3);g.gain.setTargetAtTime(.0001,t+dur*.7,.4);o.connect(g);g.connect(this.bus.pad);o.start(t);o.stop(t+dur+1);o.onended=()=>{o.disconnect();g.disconnect();};}
 pluck(n,t,v){const c=this.c,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o2.type='square';o.frequency.value=NOTE(n);o2.frequency.value=NOTE(n-12);f.type='lowpass';f.frequency.setValueAtTime(2600,t);f.frequency.exponentialRampToValueAtTime(400,t+.14);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.07*v,t+.005);g.gain.exponentialRampToValueAtTime(.0005,t+.18);o.connect(f);o2.connect(f);f.connect(g);g.connect(this.bus.pulse);o.start(t);o2.start(t);o.stop(t+.2);o2.stop(t+.2);o.onended=()=>{o.disconnect();o2.disconnect();f.disconnect();g.disconnect();};}
 taiko(t,v=1,f0=95){const c=this.c,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*.45,t+.35);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.75*v,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+.6);o.connect(g);g.connect(this.bus.perc);o.start(t);o.stop(t+.65);o.onended=()=>{o.disconnect();g.disconnect();};this.noiseHit(t,.05,.25*v,900,this.bus.perc);}
 snare(t,v=1){this.noiseHit(t,.18,.28*v,1900,this.bus.perc,'bandpass');const c=this.c,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(140,t+.08);g.gain.setValueAtTime(.12*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(g);g.connect(this.bus.perc);o.start(t);o.stop(t+.12);}
 hat(t,v=.3){this.noiseHit(t,.035,.1*v,8000,this.bus.perc,'highpass');}
 noiseHit(t,dur,vol,freq,dest,type='lowpass',sweep){const c=this.c,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.audio.noise;f.type=type;f.frequency.setValueAtTime(freq,t);if(sweep)f.frequency.exponentialRampToValueAtTime(sweep,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t,Math.random());s.stop(t+dur+.05);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
 // "BRAAM": stacked detuned saws with a slow filter swell + sub.
 braam(n=38,t=this.c.currentTime,v=1,dur=2.4){const c=this.c;for(const [m,det] of [[n-12,0],[n,-9],[n,9],[n+7,4],[n+12,-5]]){const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.value=NOTE(m);o.detune.value=det;f.type='lowpass';f.Q.value=2;f.frequency.setValueAtTime(140,t);f.frequency.exponentialRampToValueAtTime(1500,t+.35);f.frequency.exponentialRampToValueAtTime(220,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.05*v,t+.12);g.gain.exponentialRampToValueAtTime(.0005,t+dur);o.connect(f);f.connect(g);g.connect(this.bus.hits);o.start(t);o.stop(t+dur+.05);o.onended=()=>{o.disconnect();f.disconnect();g.disconnect();};}
  const s=c.createOscillator(),sg=c.createGain();s.frequency.value=NOTE(n-24);sg.gain.setValueAtTime(.0001,t);sg.gain.linearRampToValueAtTime(.25*v,t+.05);sg.gain.exponentialRampToValueAtTime(.001,t+dur*.8);s.connect(sg);sg.connect(this.bus.hits);s.start(t);s.stop(t+dur);}
 impact(t=this.c.currentTime,v=1){const c=this.c,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(24,t+1.6);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.7*v,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+2);o.connect(g);g.connect(this.bus.hits);o.start(t);o.stop(t+2.1);this.noiseHit(t,1.2,.35*v,2500,this.bus.hits,'lowpass',200);this.noiseHit(t,.08,.4*v,6000,this.bus.hits,'highpass');}
 riser(dur=4,t=this.c.currentTime){const c=this.c;this.noiseHit(t,dur,.0001,300,this.bus.hits,'bandpass');const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.audio.noise;s.loop=true;f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(250,t);f.frequency.exponentialRampToValueAtTime(7000,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22,t+dur);g.gain.setValueAtTime(.0001,t+dur+.02);s.connect(f);f.connect(g);g.connect(this.bus.hits);s.start(t);s.stop(t+dur+.05);
  const o=c.createOscillator(),og=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(880,t+dur);og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(.035,t+dur);og.gain.setValueAtTime(.0001,t+dur+.02);o.connect(og);og.connect(this.bus.hits);o.start(t);o.stop(t+dur+.05);this.build=1;this.buildEnd=t+dur;this.buildDur=dur;}
 lead(notes,t,stepDur,v=1){const c=this.c;notes.forEach((n,i)=>{if(n==null)return;const at=t+i*stepDur;const o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),lfo=c.createOscillator(),lg=c.createGain();o.type='sawtooth';o2.type='triangle';o.frequency.value=NOTE(n);o2.frequency.value=NOTE(n+12);lfo.frequency.value=5.5;lg.gain.value=4;lfo.connect(lg);lg.connect(o.detune);f.type='lowpass';f.frequency.value=1800;g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(.05*v,at+.15);g.gain.setTargetAtTime(.0001,at+stepDur*.9,.25);o.connect(f);o2.connect(f);f.connect(g);g.connect(this.bus.lead);for(const x of [o,o2,lfo]){x.start(at);x.stop(at+stepDur+1.2);}});}
 // ---------- cinematic cues ----------
 cue(name){if(!this.started||!this.audio.ready)return;const t=this.c.currentTime;if(this.lastCue[name]&&t-this.lastCue[name]<.4)return;this.lastCue[name]=t;
  if(name==='title'){this.impact(t,1);this.braam(38,t+.05,1.1,3.2);}
  else if(name==='stab'){this.braam(38,t,.8,1.6);this.taikoRoll(t,.6);}
  else if(name==='drive'){this.taikoRoll(t,1.2);}
  else if(name==='riser'){this.riser(3.2,t);}
  else if(name==='hit'){this.impact(t,1.1);this.braam(38,t,.9,2.2);}
  else if(name==='reveal'){this.braam(41,t,.9,3.4);this.lead([62,null,65,64,62,null,57,null],t+.6,.5,.7);}
  else if(name==='heroic'){this.braam(38,t,.8,2.6);this.lead([62,66,69,74,73,71,69,null,66,69,74],t+.4,.42,1);}
  else if(name==='victory'){this.lead([62,66,69,74,null,78,76,74],t,.32,1);this.braam(50,t,.6,3);}
  else if(name==='defeat'){this.lead([62,61,58,57,null,50],t,.55,.8);this.impact(t,.6);}
  else if(name==='sting'){this.lead([69,74],t,.14,.8);this.taiko(t,.8,110);}
  else if(name==='slowmo'){this.impact(t,.7);}}
 taikoRoll(t,len){const n=Math.round(len/.11);for(let i=0;i<n;i++)this.taiko(t+i*.11,.3+.7*i/n,100+i*3);}
}
