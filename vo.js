// Recorded dialogue (v8.7): every scripted line is pre-rendered with an offline neural voice
// (tools/build_voices.py → assets/vo/*.mp3 + manifest.json) and played through the game's audio engine,
// so it gets proper mixing: dialogue bus, music/ambience ducking, positional pan and distance filtering
// for soldiers, and radio squelch clicks + static for radio calls. Any line that has no recording falls back
// to the browser's speech voice (the most natural installed English voice is chosen automatically).
export const voNorm=t=>String(t).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
const OPS=['SPECTER','HAWK','VIPER','GHOST'];
export function variantFor(who=''){const w=String(who).toUpperCase().trim();if(w==='CONTROL'||w==='HQ')return 'ctl';if(w==='EAGLE ONE'||w==='PILOT')return 'pil';if(w==='MIRA SOL')return 'fem';if(w==='GHOST')return 'opf';if(OPS.includes(w))return 'op';return 'ctl';}
export const RADIO=new Set(['ctl','pil']);
// Best available browser voice for the fallback path.
export function bestSpeechVoice(){try{const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));if(!vs.length)return null;const score=v=>(/natural|neural|online/i.test(v.name)?50:0)+(/guy|davis|ryan|christopher|eric|brian|daniel|google uk english male|male/i.test(v.name)?20:0)+(/en-(us|gb)/i.test(v.lang)?5:0)+(v.localService?0:3);return vs.slice().sort((a,b)=>score(b)-score(a))[0];}catch(_){return null;}}
export class VoiceBank{
 constructor(audio){this.audio=audio;this.man=null;this.bufs=new Map();this.loading=new Map();this.current=null;}
 async load(base='./assets/vo/'){if(this.man||this.manP)return this.manP;this.base=base;this.manP=fetch(base+'manifest.json').then(r=>r.ok?r.json():{}).catch(()=>({})).then(m=>{this.man=m;return m;});return this.manP;}
 file(variant,text){return this.man?.[variant+'|'+voNorm(text)]||null;}
 has(variant,text){return !!this.file(variant,text);}
 async buffer(file){if(this.bufs.has(file))return this.bufs.get(file);if(this.loading.has(file))return this.loading.get(file);const c=this.audio.ctx;const p=fetch(this.base+file).then(r=>r.arrayBuffer()).then(ab=>new Promise((ok,bad)=>c.decodeAudioData(ab,ok,bad))).then(b=>{this.bufs.set(file,b);this.loading.delete(file);return b;}).catch(e=>{this.loading.delete(file);throw e;});this.loading.set(file,p);return p;}
 // Warm the cache for lines that are about to be used (e.g. a mission's briefing).
 prefetch(pairs){if(!this.man||!this.audio.ctx)return;for(const [v,t] of pairs){const f=this.file(v,t);if(f)this.buffer(f).catch(()=>{});}}
 stop(){const cur=this.current;this.current=null;if(cur){try{cur.g.gain.setTargetAtTime(0,this.audio.ctx.currentTime,.03);cur.s.stop(this.audio.ctx.currentTime+.12);}catch(_){}}}
 // Plays a line. Returns false (synchronously) when there is no recording, so the caller can fall back.
 // o: {pan, vol, rate, delay, interrupt (stop the previous dialogue line), positional (soldier bark), dist}
 play(variant,text,o={}){const A=this.audio;if(!A?.ctx||!this.man)return false;const f=this.file(variant,text);if(!f)return false;
  const go=b=>{if(!A.ready)return;const c=A.ctx,t=c.currentTime+(o.delay||0),s=c.createBufferSource();s.buffer=b;s.playbackRate.value=o.rate||1;
   const radio=RADIO.has(variant)&&!o.positional;let head;const g=c.createGain();g.gain.value=(o.vol??1)*(radio?.95:1.1);
   // soldiers: distance air-absorption + stereo position + a little room; dialogue: centred and dry
   if(o.positional){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.max(1800,16000-(o.dist||0)*260);s.connect(lp);lp.connect(g);head=A.node(A.voiceBus,o.pan||0,Math.min(.5,.08+(o.dist||0)*.01));g.connect(head);}
   else{s.connect(g);g.connect(A.voiceBus);}
   if(o.interrupt!==false&&!o.positional){this.stop();this.current={s,g};}
   s.start(t);s.onended=()=>{try{s.disconnect();g.disconnect();}catch(_){}if(this.current?.s===s)this.current=null;};
   const dur=b.duration/(o.rate||1);A.duck(.38,dur+.4,{voice:true});
   if(radio){A.squelch(t);A.squelch(t+dur+.02,true);A.radioStatic(t,dur);}};
  const b=this.bufs.get(f);if(b)go(b);else this.buffer(f).then(go).catch(()=>{});return true;}
 // Dialogue convenience: speaker name → voice.
 say(who,text,o={}){return this.play(variantFor(who),text,o);}
}
