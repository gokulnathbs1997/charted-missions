// v8.3 controls & comfort settings: key remapping, drag-to-move touch buttons, FPS counter, loading tips.
// Key remapping works by re-labelling the physical key (event.code) before any game handler sees it,
// so every mode (city, forest missions, TDM, Dust Yard) and every handler is covered without changes.
export const KEY_ACTIONS=[
 ['KeyW','Move forward'],['KeyS','Move back'],['KeyA','Move left'],['KeyD','Move right'],['ShiftLeft','Sprint'],['Space','Jump / skip cutscene'],['KeyC','Crouch'],
 ['KeyR','Reload'],['KeyE','Use / doors / pick up'],['KeyG','Throw grenade'],['KeyH','Medical kit / heal'],['KeyB','Binoculars'],['KeyV','Utility wheel (hold)'],
 ['KeyM','Map'],['KeyQ','Next weapon'],['KeyF','Inspect weapon'],['KeyZ','Lean left'],['KeyX','Lean right'],['Tab','Scoreboard'],['KeyY','Chat'],
 ['Digit1','Weapon slot 1'],['Digit2','Weapon slot 2'],['Digit3','Weapon slot 3']];
let table={};
// settings.keymap = {defaultCode: chosenCode}
export function rebuildKeymap(settings){table={};const km=settings.keymap||{};for(const [def,chosen] of Object.entries(km))if(chosen&&chosen!==def)table[def]='Unbound';for(const [def,chosen] of Object.entries(km))if(chosen&&chosen!==def)table[chosen]=def;}
export function installKeymap(settings){rebuildKeymap(settings);const fix=e=>{if(e.target?.matches?.('input,textarea,select')||window.__keyCapture)return;const m=table[e.code];if(m)try{Object.defineProperty(e,'code',{value:m,configurable:true});}catch(_){}};window.addEventListener('keydown',fix,true);window.addEventListener('keyup',fix,true);}
// Modal body for remapping: click an action, then press a key (Esc cancels, Backspace resets that action).
export function keymapHTML(settings){const km=settings.keymap||{};return `<div class="keymap"><p class="note">Click an action, then press the new key. Esc cancels · Backspace restores the default.</p><div class="krows">${KEY_ACTIONS.map(([def,label])=>{const cur=km[def]||def;return `<button class="krow ${cur!==def?'changed':''}" data-key="${def}"><span>${label}</span><b>${keyName(cur)}</b></button>`;}).join('')}</div><button class="ghostBtn" data-keyreset><span>RESET ALL</span></button></div>`;}
export const keyName=c=>c.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Arrow(.*)/,'$1 Arrow').replace('ShiftLeft','Left Shift').replace('ShiftRight','Right Shift').replace('ControlLeft','Left Ctrl').replace('ControlRight','Right Ctrl').replace('AltLeft','Left Alt').replace('Space','Space');
// Wires the remap UI inside `container`; calls save() after each change and re-renders.
export function bindKeymap(container,settings,save){const render=()=>{container.innerHTML=keymapHTML(settings);};render();if(container.dataset.bound)return;container.dataset.bound='1';
 container.addEventListener('click',e=>{if(e.target.closest('[data-keyreset]')){settings.keymap={};rebuildKeymap(settings);save();render();return;}const row=e.target.closest('.krow');if(!row)return;e.stopPropagation();container.querySelectorAll('.krow').forEach(r=>r.classList.remove('wait'));row.classList.add('wait');row.querySelector('b').textContent='PRESS A KEY…';window.__keyCapture=true;
  const onKey=ev=>{ev.preventDefault();ev.stopPropagation();window.removeEventListener('keydown',onKey,true);window.__keyCapture=false;const def=row.dataset.key;settings.keymap??={};
   if(ev.code==='Escape'){}else if(ev.code==='Backspace'){delete settings.keymap[def];}else{for(const [d,c] of Object.entries(settings.keymap))if(c===ev.code&&d!==def)delete settings.keymap[d];settings.keymap[def]=ev.code;if(ev.code===def)delete settings.keymap[def];}
   rebuildKeymap(settings);save();render();};window.addEventListener('keydown',onKey,true);});}
// ---------- touch layout (v8.5) ----------
// Every touch control can be moved (drag), resized (25 %–200 %… clamped 60–160 %) and shown/hidden, plus a
// global opacity. Saved per device in settings.touchLayout[id] = {x,y (% of screen), s (scale), h (hidden)}.
// Rarely-used buttons start hidden for a clean screen; everything stays reachable from the ◎ utility wheel.
export const TOUCH_IDS=['attack','fireL','aimBtn','crouchBtn','jump','use','swap','reload','nadeBtn','heal','scoreBtn','binocBtn','mapBtn','wheelBtn','leanL','leanR','chatBtn','pause','moveZone'];
const NAMES={attack:'Fire',fireL:'Left fire',aimBtn:'Aim',crouchBtn:'Crouch',jump:'Jump',use:'Use',swap:'Switch weapon',reload:'Reload',nadeBtn:'Grenade',heal:'Medkit',scoreBtn:'Scoreboard',binocBtn:'Binoculars',mapBtn:'Map',wheelBtn:'Utility wheel',leanL:'Lean left',leanR:'Lean right',chatBtn:'Chat',pause:'Pause',moveZone:'Move stick'};
export const DEFAULT_HIDDEN=new Set(['fireL','leanL','leanR','binocBtn','mapBtn']);
const I=(d,extra='')=>`<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
const ICONS={
 attack:I('<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>'),
 fireL:I('<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6" stroke="currentColor" stroke-width="2"/>'),
 aimBtn:I('<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="currentColor" stroke-width="1.8"/>'),
 crouchBtn:I('<circle cx="13" cy="4.5" r="2.3" fill="currentColor"/><path d="M12 8l-4 5 3 2-1 6h2.5l1.5-7-2.5-2 3-3 2 3h4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
 jump:I('<path d="M12 3l7 8h-4v9H9v-9H5z" fill="currentColor"/>'),
 use:I('<path d="M9 11V5a1.5 1.5 0 013 0v5V3.5a1.5 1.5 0 013 0V10V5a1.5 1.5 0 013 0v9c0 4-3 7-7 7-3 0-5-2-7-5l-2-3a1.5 1.5 0 012.5-1.7L9 13z" fill="currentColor"/>'),
 swap:I('<path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
 reload:I('<path d="M19 12a7 7 0 11-2.1-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M19 3v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
 nadeBtn:I('<circle cx="11" cy="14" r="6.5" fill="currentColor"/><path d="M9 7h5v2.5H9zM14 7l4-3" fill="none" stroke="currentColor" stroke-width="2"/>'),
 heal:I('<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor"/>'),
 scoreBtn:I('<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
 binocBtn:I('<circle cx="7" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V5h3v6M14 11V5h3v6M11 14h2" fill="none" stroke="currentColor" stroke-width="2"/>'),
 mapBtn:I('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14M15 6v14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>'),
 wheelBtn:I('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" stroke-width="2"/>'),
 leanL:I('<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
 leanR:I('<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
 chatBtn:I('<path d="M4 5h16v10H9l-5 4z" fill="currentColor"/>'),
 pause:I('<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/>')};
// Replace the text labels with clean icons (labels stay as aria-label / tooltip).
export function iconizeTouch(){for(const [id,svg] of Object.entries(ICONS)){const el=document.getElementById(id);if(!el||el.dataset.icon)continue;const label=el.getAttribute('aria-label')||el.textContent.trim();el.setAttribute('aria-label',label);el.title=label;el.dataset.icon='1';el.innerHTML=svg;}}
const hiddenOf=(L,id)=>L[id]?.h??DEFAULT_HIDDEN.has(id);
export function applyTouchLayout(settings){const L=settings.touchLayout||{};const op=settings.touchOpacity??.8;document.documentElement.style.setProperty('--touchOp',op);
 for(const id of TOUCH_IDS){const el=document.getElementById(id);if(!el)continue;const p=L[id]||{};el.classList.toggle('uhide',!!hiddenOf(L,id));
  if(p.x!=null){el.style.left=p.x+'%';el.style.top=p.y+'%';el.style.right='auto';el.style.bottom='auto';}else{el.style.left=el.style.top=el.style.right=el.style.bottom='';}
  el.style.transform=p.s&&p.s!==1?`scale(${p.s})`:'';el.style.transformOrigin='top left';}}
// Editor: tap a control to select it, drag to move; the panel sets its size and visibility, and overall opacity.
export function editTouchLayout(settings,save,onDone){document.body.classList.add('touchEdit');const L=settings.touchLayout??={};
 const bar=document.createElement('div');bar.id='touchEditBar';bar.innerHTML=`<div class="teHead"><b>CUSTOMIZE CONTROLS</b><span>Tap a control · drag to move</span></div>
  <div class="teRow"><span class="teSel">Select a control</span><label>Size <input type="range" min="60" max="160" step="5" value="100" data-te="size" disabled></label><button data-te="vis" disabled>HIDE</button></div>
  <div class="teRow"><label>Opacity <input type="range" min="25" max="100" step="5" value="${Math.round((settings.touchOpacity??.8)*100)}" data-te="op"></label><button data-te="reset">RESET</button><button data-te="done" class="pri">DONE</button></div>`;document.body.appendChild(bar);
 let sel=null,drag=null,moved=false;const sync=()=>{document.querySelectorAll('#touch .teSel').forEach(e=>e.classList.remove('teSel'));const size=bar.querySelector('[data-te=size]'),vis=bar.querySelector('[data-te=vis]');
  if(!sel){bar.querySelector('.teSel').textContent='Select a control';size.disabled=vis.disabled=true;return;}sel.classList.add('teSel');bar.querySelector('.teSel').textContent=NAMES[sel.id]||sel.id;size.disabled=vis.disabled=false;size.value=Math.round((L[sel.id]?.s??1)*100);vis.textContent=hiddenOf(L,sel.id)?'SHOW':'HIDE';};
 const sel$=TOUCH_IDS.map(i=>'#'+i).join(',');
 const down=e=>{if(e.target.closest('#touchEditBar'))return;const el=e.target.closest(sel$);if(!el)return;e.preventDefault();e.stopPropagation();sel=el;moved=false;const r=el.getBoundingClientRect();drag={el,dx:e.clientX-r.left,dy:e.clientY-r.top,x0:e.clientX,y0:e.clientY};sync();};
 const move=e=>{if(!drag)return;e.preventDefault();e.stopPropagation();if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)<4&&!moved)return;moved=true;const r=drag.el.getBoundingClientRect(),x=Math.max(0,Math.min(innerWidth-r.width,e.clientX-drag.dx)),y=Math.max(0,Math.min(innerHeight-r.height,e.clientY-drag.dy));const o=L[drag.el.id]??={};o.x=+(x/innerWidth*100).toFixed(2);o.y=+(y/innerHeight*100).toFixed(2);applyTouchLayout(settings);};
 const up=e=>{if(drag){if(e.target.closest?.('#touchEditBar')===null)e.stopPropagation();drag=null;save();}};
 const block=e=>{if(!e.target.closest('#touchEditBar')){e.stopPropagation();}};
 const opts={capture:true,passive:false};document.addEventListener('pointerdown',down,opts);document.addEventListener('pointermove',move,opts);document.addEventListener('pointerup',up,opts);for(const t of ['touchstart','touchmove','touchend','click'])document.addEventListener(t,block,opts);
 bar.addEventListener('input',e=>{const k=e.target.dataset.te;if(k==='size'&&sel){(L[sel.id]??={}).s=+e.target.value/100;applyTouchLayout(settings);save();}if(k==='op'){settings.touchOpacity=+e.target.value/100;applyTouchLayout(settings);save();}});
 bar.addEventListener('click',e=>{const k=e.target.closest('button')?.dataset.te;if(!k)return;
  if(k==='vis'&&sel){(L[sel.id]??={}).h=!hiddenOf(L,sel.id);applyTouchLayout(settings);save();sync();}
  if(k==='reset'){for(const id of Object.keys(L))delete L[id];settings.touchOpacity=.8;bar.querySelector('[data-te=op]').value=80;sel=null;applyTouchLayout(settings);save();sync();}
  if(k==='done'){document.removeEventListener('pointerdown',down,opts);document.removeEventListener('pointermove',move,opts);document.removeEventListener('pointerup',up,opts);for(const t of ['touchstart','touchmove','touchend','click'])document.removeEventListener(t,block,opts);sel=null;sync();bar.remove();document.body.classList.remove('touchEdit');onDone?.();}});
 sync();}
// ---------- FPS meter ----------
export class FpsMeter{constructor(){this.el=document.createElement('div');this.el.id='fpsMeter';this.el.hidden=true;document.body.appendChild(this.el);this.n=0;this.t=0;}
 tick(dt,on){this.el.hidden=!on;if(!on)return;this.n++;this.t+=dt;if(this.t>=.5){const fps=this.n/this.t;this.el.textContent=Math.round(fps)+' FPS · '+(1000/fps).toFixed(1)+' ms';this.el.className=fps<30?'bad':fps<50?'ok':'good';this.n=0;this.t=0;}}}
// ---------- loading tips ----------
export const TIPS=['Headshots deal double damage and trigger the slow-motion kill cam.','Hold V (or tap ◎) for the utility wheel: grenades, medkit, flashlight and more.','In Dust Yard, walk over a dropped gun to swap it in — or turn Auto Pickup off and press E.','Green + orbs restore 40 health and come back after 20 seconds.','Crouch (C) to steady your aim and stay quieter in the forest missions.','Buy weapon skins in the gun picker — they show in every mode.','Snow Yard fog hides you at range: flank through the market arcade.','Chain 3 kills for a UAV, 5 for armour and 7 for an airstrike in Team Deathmatch.','Remap any key in Settings → Controls. On phones you can drag the touch buttons where you like.','Bleeding? Press H and use a medkit (1) to stop it.','Free-for-all Death Match: everyone is an enemy. Keep moving and use cover.'];
export function startTips(el){if(!el)return()=>{};let i=Math.floor(Math.random()*TIPS.length);const show=()=>{el.textContent='TIP · '+TIPS[i%TIPS.length];i++;};show();const id=setInterval(show,4500);return()=>clearInterval(id);}
