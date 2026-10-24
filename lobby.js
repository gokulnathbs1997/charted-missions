import {SHOP,UPGRADES,MAX_TIER,MAX_LEVEL,xpToNext} from './profile.js';
import {WEAPON_DATA} from './weapons.js';
import {DIFFICULTY,SCORE_LIMIT} from './tdm.js';
import {MISSIONS} from './forest/missions.js';
import {openYardFlow} from './yardlobby.js';
import {bindKeymap,rebuildKeymap,editTouchLayout} from './controls.js';
// CHARTED MISSIONS — main menu: Play, Operators, Loadout, Armory, Barracks, plus settings and quit.
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n).toLocaleString('en-US');
const ART={1:'assets/ui/m1.jpg',2:'assets/ui/m2.jpg',3:'assets/ui/m3.jpg',4:'assets/ui/m4.jpg',5:'assets/ui/m5.jpg',6:'assets/ui/m6.jpg',city:'assets/ui/city.jpg',hero:'assets/ui/hero.jpg',mp:'assets/ui/mp.jpg',camp:'assets/ui/campaign.jpg'};
const BLURB={1:'Rope into the valley and reach the enemy outpost undetected.',2:'Eliminate the spotter team and secure the observation post.',3:'5 v 5 Team Deathmatch in a desert cargo yard. Most kills in 4:00 wins.',4:'Archive · free the captured agent at dusk and recover the codebook.',5:'Swim the river under the MG nests, raid Kessel Docks and sink the patrol boat.',6:'Town assault: hotel interiors, fire escapes and rooftop sniping in Old Kessel.'};
const playOf=m=>m.play||'forest:'+m.id;
export const OPERATORS=[
 {id:'specter',name:'SPECTER',role:'Recon · Lead operator',tint:'#3b4048',skin:'#c99a77',bio:'Former mountain-warfare scout. Works alone, moves at night, never misses the extraction.'},
 {id:'hawk',name:'HAWK',role:'Marksman',tint:'#4b5233',skin:'#b98b66',bio:'Long-range specialist. Patient, precise and quietly sarcastic on the radio.',level:3},
 {id:'viper',name:'VIPER',role:'Assault',tint:'#5a3a32',skin:'#a87a58',bio:'Breacher and close-quarters expert. First through every door.',level:6},
 {id:'ghost',name:'GHOST',role:'Infiltrator',tint:'#2c3e48',skin:'#d9b08c',bio:'Electronic-warfare operator. Cuts alarms before anyone knows she is there.',level:10}];
const ICON={stealth:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 hostile:'<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>',
 extract:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/></svg>',
 target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
 team:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6M12 20c0-3 2-6 4-6 3 0 6 2 6 6"/></svg>',
 layers:'<svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
 gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
 power:'<svg viewBox="0 0 24 24"><path d="M12 3v9"/><path d="M6.3 6.5a8 8 0 1 0 11.4 0"/></svg>',
 box:'<svg viewBox="0 0 24 24"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
 rifle:'<svg viewBox="0 0 48 16"><path d="M2 7h26l3-3h8v3h7v2h-7l-2 2h-6l-1 4h-5l1-4H2z"/></svg>'};
function bars(stats,w){const s=stats[w],perShot=s.damage*(s.pellets||1);const rows=[['DAMAGE',Math.min(1,perShot/110)],['FIRE RATE',Math.min(1,(1/s.interval)/13.4)],['RANGE',Math.min(1,s.range/160)],['MAGAZINE',Math.min(1,s.capacity/40)]];return `<div class="bars">${rows.map(([l,v])=>`<div><span>${l}</span><i><b style="width:${Math.max(4,v*100).toFixed(0)}%"></b></i></div>`).join('')}</div>`;}
function face(op,size=96){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),k=size/96;x.scale(k,k);const g=x.createLinearGradient(0,0,0,96);g.addColorStop(0,'#1d2a2c');g.addColorStop(1,'#0b1415');x.fillStyle=g;x.fillRect(0,0,96,96);
 x.fillStyle=op.tint;x.beginPath();x.ellipse(48,90,40,22,0,Math.PI,0);x.fill();x.fillStyle=op.skin;x.beginPath();x.ellipse(48,54,22,27,0,0,7);x.fill();x.fillStyle=op.tint;x.beginPath();x.ellipse(48,36,27,22,0,Math.PI,0);x.fill();x.fillRect(19,32,58,9);
 x.fillStyle='#111';x.fillRect(36,50,8,3);x.fillRect(52,50,8,3);x.strokeStyle='#5a2a20';x.lineWidth=2.5;x.beginPath();x.moveTo(41,70);x.lineTo(55,70);x.stroke();x.fillStyle='rgba(30,40,30,.45)';x.fillRect(27,57,42,5);return c.toDataURL();}
export function initLobby(profile,audio,onPlay){let tab='play';const root=$('#lobby');const S=profile.data.settings;
 const progress=()=>{const done=MISSIONS.filter(m=>profile.missionDone(m.id)).length+(profile.data.cityDone?1:0);return {done,total:MISSIONS.length+1,next:MISSIONS.find(m=>!profile.missionDone(m.id))||MISSIONS[0]};};
 const header=()=>{const d=profile.data,need=xpToNext(d.level);$('#lvlBadge').textContent=d.level;$('#pName').textContent=d.name;$('#xpBar i').style.width=(d.level>=MAX_LEVEL?100:d.xp/need*100)+'%';$('#xpText').textContent=d.level>=MAX_LEVEL?'MAX LEVEL':`${fmt(d.xp)} / ${fmt(need)} XP`;$('#coinText').textContent=fmt(d.coins);
  const daily=profile.dailyReady();$('#dailyFoot').innerHTML=daily?`<button id="claim" class="linkish"><i class="dot"></i>DAILY SUPPLY READY ${ICON.box}</button>`:`<span class="muted"><i class="dot off"></i>NEXT SUPPLY DROP TOMORROW · STREAK ${d.daily.streak}</span>`;
  const lo=d.loadout;$('#loadFoot').innerHTML=`${ICON.rifle}<span>${esc(WEAPON_DATA[lo.primary].label)} · ${esc(WEAPON_DATA[lo.secondary].label)} · FIELD KIT</span>`;};
 const toast=t=>{const el=$('#lobbyToast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800);};
 const views={
  play(){const d=profile.data,P=progress(),m=P.next,diff=d.settings.difficulty;
   const dots=Array.from({length:P.total},(_,i)=>`<i class="${i<P.done?'on':''}"></i>`).join('');
   return `<div class="cmGrid">
   <article class="cmHero" style="--art:url(${ART.hero})"><div class="shade"></div><div class="heroBody"><span class="kicker">CAMPAIGN • ${m.code}</span><h1>OPERATION<br>BLACK VEIL</h1><p>Infiltrate the communications facility. Recover the satellite key. Exfiltrate before the transfer completes.</p>
    <button class="cta" data-play="${playOf(m)}">${ICON.target}<span>DEPLOY</span><b>→</b></button></div>
    <div class="intel"><div>${ICON.stealth}<span><b>STEALTH</b><small>STAY UNDETECTED</small></span></div><div class="warn">${ICON.hostile}<span><b>HOSTILE PRESENCE</b><small>HEAVY GUARD ACTIVITY</small></span></div><div>${ICON.extract}<span><b>EXTRACTION</b><small>LZ 3 · VALLEY RIDGE</small></span></div></div></article>
   <div class="cmSide">
    <article class="cmCard mp" style="--art:url(${ART.mp})"><div class="shade"></div><div class="cardHead">${ICON.team}<b>MULTIPLAYER</b></div><p class="tag">TEAM UP. FIGHT TOGETHER.</p>
     <div class="mpBtns"><button class="cta sm" data-online="quick">${ICON.target}<span>QUICK MATCH</span><b>›</b></button><button class="ghostBtn" data-online="host">${ICON.team}<span>HOST A GAME</span><b>›</b></button></div>
     <details class="mpMore"><summary>ROOMS · SERVER · BOT TRAINING</summary><div class="row"><input id="roomInput" maxlength="20" placeholder="room" value="${esc(d.settings.room||'public')}" aria-label="Room name"><input id="serverInput" placeholder="server (auto)" value="${esc(d.settings.server||'')}" aria-label="Server address"><button class="ghostBtn sm" data-online="join">JOIN</button></div><ul class="rooms" id="roomList"></ul><small id="onlineHint"></small>
      <div class="bots"><span>TRAINING VS BOTS · 5V5 · FIRST TO ${SCORE_LIMIT}</span><div class="seg" role="group" aria-label="Bot difficulty">${Object.entries(DIFFICULTY).map(([k,v])=>`<button data-diff="${k}" class="${k===diff?'on':''}">${v.label}</button>`).join('')}</div><button class="ghostBtn sm" data-play="tdm">PLAY VS BOTS ›</button></div></details></article>
    <article class="cmCard camp" style="--art:url(${ART.camp})"><div class="shade"></div><div class="cardHead">${ICON.target}<b>SOLO CAMPAIGN</b><span class="prog"><small>MISSION PROGRESS ${P.done}/${P.total}</small><span class="dots">${dots}</span></span></div>
     <button class="continue" data-play="${playOf(m)}"><b>CONTINUE CAMPAIGN</b><span>→</span></button><small class="sub">OPERATION BLACK VEIL • ${m.code}</small><i class="pbarLine"><b style="width:${P.done/P.total*100}%"></b></i></article>
   </div></div>
   <section class="cmSelect"><div class="cardHead">${ICON.layers}<b>MISSION SELECT</b></div><div class="mrow">${MISSIONS.map((mm,i)=>`<button class="mcard2 ${mm.id===m.id?'sel':''}" data-play="${playOf(mm)}"><span class="thumb" style="background-image:url(${ART[mm.id]})"></span><span class="mtxt"><small>${mm.code}${mm.archive?' · ARCHIVE':''}${mm.play==='yard'?' · 5 V 5':''}${profile.missionDone(mm.id)?' · ✓':''}</small><b>${mm.title}</b><em>${BLURB[mm.id]||''}</em></span><i>›</i></button>`).join('')}
    <button class="mcard2" data-play="campaign"><span class="thumb" style="background-image:url(${ART.city})"></span><span class="mtxt"><small>BONUS OP${profile.data.cityDone?' · ✓':''}</small><b>SILENT GRID</b><em>The 650 m city: 28 guards, alarms, intel and extraction.</em></span><i>›</i></button></div></section>`;},
  operators(){const d=profile.data,cur=d.settings.operator||'specter';return `<div class="opGrid">${OPERATORS.map(o=>{const locked=d.level<(o.level||1);return `<article class="opCard ${o.id===cur?'on':''} ${locked?'locked':''}"><img alt="" src="${face(o)}"><div><small>${o.role.toUpperCase()}</small><h3>${o.name}</h3><p>${o.bio}</p>${locked?`<button disabled>🔒 LEVEL ${o.level}</button>`:o.id===cur?'<button disabled class="eq">SELECTED</button>':`<button data-op="${o.id}">SELECT OPERATOR</button>`}</div></article>`;}).join('')}</div><p class="note">Your operator is your radio callsign in the story missions and in voice lines.</p>`;},
  loadout(){const d=profile.data,stats=profile.stats();const slot=s=>Object.entries(SHOP).filter(([w,v])=>v.slot===s&&d.owned.includes(w)).map(([w])=>`<button class="wcard ${d.loadout[s]===w?'on':''}" data-equip="${w}"><strong>${WEAPON_DATA[w].label}</strong>${bars(stats,w)}<em>${d.loadout[s]===w?'EQUIPPED':'EQUIP'}</em></button>`).join('');
   return `<h4>PRIMARY</h4><div class="wgrid">${slot('primary')}</div><h4>SECONDARY</h4><div class="wgrid">${slot('secondary')}</div><p class="note">Buy more weapons and upgrades in the Armory.</p>`;},
  shop(){const d=profile.data,stats=profile.stats();return `<div class="wgrid shop">${Object.entries(SHOP).map(([w,s])=>{const owned=d.owned.includes(w),locked=d.level<s.level;const ups=owned?Object.entries(UPGRADES).filter(([k])=>k!=='capacity'||WEAPON_DATA[w].capacity).map(([k,u])=>{const t=profile.tier(w,k),cost=profile.upgradeCost(w,k);return `<div class="up"><span>${u.label}</span><span class="pips">${Array.from({length:MAX_TIER},(_,i)=>`<i class="${i<t?'on':''}"></i>`).join('')}</span>${cost==null?'<b>MAX</b>':`<button data-up="${w}:${k}" ${d.coins<cost?'disabled':''} title="${u.unit}">◈ ${cost}</button>`}</div>`;}).join(''):'';
   return `<article class="wcard ${owned?'owned':''}"><span class="eyebrow">${s.slot.toUpperCase()}</span><strong>${WEAPON_DATA[w].label}</strong><p>${s.blurb}</p>${bars(stats,w)}${owned?`<div class="ups">${ups}</div>`:locked?`<button disabled>🔒 LEVEL ${s.level}</button>`:`<button data-buy="${w}" ${d.coins<s.price?'disabled':''}>BUY ◈ ${fmt(s.price)}</button>`}</article>`;}).join('')}</div>`;},
  barracks(){const d=profile.data,s=d.stats,kd=s.deaths?(s.kills/s.deaths).toFixed(2):s.kills.toFixed(2);const cells=[['MATCHES',s.matches],['WINS',s.wins],['WIN RATE',s.matches?Math.round(s.wins/s.matches*100)+'%':'—'],['KILLS',s.kills],['DEATHS',s.deaths],['K/D',kd],['HEADSHOTS',s.headshots],['BEST STREAK',s.bestStreak],['MISSIONS',MISSIONS.filter(m=>profile.missionDone(m.id)).length+'/'+MISSIONS.length],['BODIES SEARCHED',s.looted||0]];
   return `<label class="nameEdit">CALLSIGN <input id="nameInput" maxlength="14" value="${esc(d.name)}"></label><div class="statGrid">${cells.map(([l,v])=>`<div><span>${l}</span><b>${v}</b></div>`).join('')}</div><p class="note">Progress is saved in this browser. Level cap ${MAX_LEVEL}. <a href="README.md" target="_blank">Help, controls &amp; credits ↗</a></p><button class="ghostBtn danger" id="resetProfile">RESET PROGRESS</button>`;}
 };
 const settingsHTML=()=>{const s=profile.data.settings;const sel=(id,opts,v)=>`<select id="${id}">${opts.map(([k,l])=>`<option value="${k}" ${k===v?'selected':''}>${l}</option>`).join('')}</select>`;const chk=(id,v,l)=>`<label class="chk"><input type="checkbox" id="${id}" ${v?'checked':''}> ${l}</label>`;
  return `<div class="modal"><div class="cardHead"><b>SETTINGS</b><button class="x" data-close>✕</button></div>
   <label>GRAPHICS ${sel('setQuality',[['high','Ultra (cinematic)'],['medium','Balanced'],['low','Performance']],s.quality)}</label>
   <label>MASTER VOLUME <input id="setVolume" type="range" min="0" max="1" step=".05" value="${s.volume??.45}"></label>
   <label>MUSIC <input id="setMusic" type="range" min="0" max="1" step=".05" value="${s.music??.6}"></label>
   <label>LOOK SENSITIVITY <input id="setSens" type="range" min=".3" max="2.5" step=".05" value="${s.sensitivity??1}"></label>
   ${chk('setDyn',s.dynamicRes!==false,'Dynamic resolution (holds frame rate on phones)')}${chk('setKill',s.killcam!==false,'Headshot slow-motion kill cam')}${chk('setVoice',s.voice!==false,'Character voices & narration')}${chk('setMute',!!s.mute,'Mute all sound')}
   <label>FIELD OF VIEW <input id="setFov" type="range" min="60" max="100" step="1" value="${s.fov??76}"> <output id="fovOut">${s.fov??76}°</output></label>${chk('setShadows',s.shadows!==false,'Real-time shadows')}${chk('setFps',!!s.fps,'Show FPS counter')}
   ${matchMedia('(pointer:coarse)').matches?'<button class="ghostBtn" id="openTouch"><span>🎮 CUSTOMIZE TOUCH CONTROLS</span></button>':''}<button class="ghostBtn" id="openKeys"><span>CONTROLS · REMAP KEYS</span></button>
   <button class="cta sm" data-close><span>DONE</span></button></div>`;};
 const modal=html=>{const m=$('#lobbyModal');m.onclick=null;m.innerHTML=html;m.hidden=false;};const closeModal=()=>{$('#lobbyModal').hidden=true;};
 const render=()=>{header();root.querySelectorAll('.cmTabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));$('#tabBody').innerHTML=views[tab]();root.dataset.tab=tab;if(tab==='play')rooms();};
 const go=(roomMode)=>{const d=profile.data;let room=($('#roomInput')?.value||d.settings.room||'public').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,20)||'public';if(roomMode==='quick')room='public';if(roomMode==='host'){room='op-'+Math.random().toString(36).slice(2,7);toast('PRIVATE ROOM '+room.toUpperCase()+' · SHARE THIS NAME');}
  const server=($('#serverInput')?.value||d.settings.server||'').trim();d.settings.room=room;d.settings.server=server;profile.save();const q=new URLSearchParams({mode:'tdm',online:'1',room});if(server)q.set('server',/^wss?:\/\//.test(server)?server:`ws://${server.replace(/^https?:\/\//,'').replace(/\/$/,'')}/ws`);history.replaceState(null,'','?'+q);setTimeout(()=>onPlay('online'),roomMode==='host'?900:0);};
 root.addEventListener('click',e=>{const li=e.target.closest('#roomList li[data-room]');if(li){$('#roomInput').value=li.dataset.room;return;}if(e.target.closest('[data-close]')){closeModal();render();return;}const t=e.target.closest('button');if(!t)return;audio.ui?.();
  if(t.dataset.tab){tab=t.dataset.tab;render();}
  else if(t.dataset.diff){profile.data.settings.difficulty=t.dataset.diff;profile.save();render();$('.mpMore')?.setAttribute('open','');}
  else if(t.dataset.online){go(t.dataset.online);}
  else if(t.dataset.play==='yard'){openYardFlow($('#lobbyModal'),profile,onPlay,{toast,refresh:render});}
  else if(t.dataset.play){closeModal();onPlay(t.dataset.play);}
  else if(t.id==='claim'){const c=profile.claimDaily();if(c)toast(`+◈ ${c} DAILY SUPPLY`);render();}
  else if(t.dataset.op){profile.data.settings.operator=t.dataset.op;profile.save();toast(OPERATORS.find(o=>o.id===t.dataset.op).name+' SELECTED');render();}
  else if(t.dataset.equip){profile.equip(t.dataset.equip);render();}
  else if(t.dataset.buy){if(profile.buy(t.dataset.buy)){profile.equip(t.dataset.buy);toast(WEAPON_DATA[t.dataset.buy].label+' UNLOCKED & EQUIPPED');}render();}
  else if(t.dataset.up){const [w,k]=t.dataset.up.split(':');if(profile.upgrade(w,k))toast(`${WEAPON_DATA[w].label}: ${UPGRADES[k].label.toUpperCase()} UPGRADED`);render();}
  else if(t.id==='resetProfile'){if(confirm('Reset level, coins, weapons and stats?')){try{localStorage.removeItem('cq_strike_profile_v1');}catch(_){}location.reload();}}
  else if(t.id==='gearBtn'){modal(settingsHTML());}
  else if(t.id==='openTouch'){closeModal();editTouchLayout(profile.data.settings,()=>profile.save(),()=>render());}
  else if(t.id==='openKeys'){modal('<div class="modal keysModal"><div class="cardHead"><b>CONTROLS · KEYBOARD</b><button class="x" data-close>✕</button></div><div id="keyHost"></div></div>');bindKeymap($('#keyHost'),profile.data.settings,()=>profile.save());}
  else if(t.id==='powerBtn'){modal(`<div class="modal"><div class="cardHead"><b>QUIT CHARTED MISSIONS?</b><button class="x" data-close>✕</button></div><p class="note">Your progress is saved on this device.</p><div class="mpBtns"><button class="cta sm" id="quitYes"><span>QUIT</span></button><button class="ghostBtn" data-close><span>STAY</span></button></div></div>`);}
  else if(t.id==='quitYes'){try{window.close();}catch(_){}setTimeout(()=>{$('#lobbyModal').innerHTML='<div class="modal"><div class="cardHead"><b>SEE YOU NEXT MISSION</b></div><p class="note">You can close this tab or app now.</p><button class="ghostBtn" data-close>BACK TO MENU</button></div>';},200);}
 });
 root.addEventListener('input',e=>{const s=profile.data.settings,t=e.target;if(t.id==='nameInput'){const v=t.value.trim().slice(0,14);if(v){profile.data.name=v;profile.save();$('#pName').textContent=v;}return;}if(t.id==='setFov'){s.fov=+t.value;const o=$('#fovOut');if(o)o.textContent=t.value+'°';profile.save();return;}
  if(t.id==='setVolume'){s.volume=+t.value;audio.level?.(s.volume);}if(t.id==='setMusic'){s.music=+t.value;audio.setMusic?.(s.music);}if(t.id==='setSens')s.sensitivity=+t.value;profile.save();});
 root.addEventListener('change',e=>{const s=profile.data.settings,t=e.target;if(t.id==='nameInput'){header();return;}if(t.id==='setQuality')s.quality=t.value;if(t.id==='setDyn')s.dynamicRes=t.checked;if(t.id==='setKill')s.killcam=t.checked;if(t.id==='setVoice')s.voice=t.checked;if(t.id==='setMute')s.mute=t.checked;if(t.id==='setShadows')s.shadows=t.checked;if(t.id==='setFps')s.fps=t.checked;profile.save();});
 // Live room list when the page is served by the online server.
 const rooms=async()=>{const list=$('#roomList'),hint=$('#onlineHint');if(!list)return;try{const r=await fetch('rooms',{cache:'no-store'});if(!r.ok)throw 0;const data=await r.json();list.innerHTML=data.length?data.map(x=>`<li data-room="${esc(x.name)}"><span>${esc(x.name)}</span><span>${x.players}/${x.max} · ${x.score.blue}–${x.score.red}</span></li>`).join(''):'<li><span>No rooms yet — be the first</span><span></span></li>';hint.textContent='Online server detected ✓';}catch(_){list.innerHTML='';hint.textContent='No online server here. Run START_ONLINE_SERVER, or enter its address.';}};
 render();root.hidden=false;const iv=setInterval(()=>{if(root.hidden){clearInterval(iv);return;}if(tab==='play')rooms();},5000);return {render};}
