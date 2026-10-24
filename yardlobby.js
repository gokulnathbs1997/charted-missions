import * as THREE from 'three';
import {WEAPON_DATA} from './weapons.js';
import {buildGun} from './gunmodels.js';
import {SHOP} from './profile.js';
import {SKINS,applySkin,ownedSkins,buySkin,equipSkin} from './skins.js';
// v8.3 pre-match flow for Mission 03 (as in the reference): MODE → MAP → SIDE → WEAPON (3D preview, stats, skins) → PLAY.
const esc=s=>String(s).replace(/[<>&"]/g,'');
const SOLDIER='<svg viewBox="0 0 100 160"><path d="M50 8c10 0 16 7 16 17 0 6-2 11-6 14l14 6c8 4 12 12 13 22l2 40h-12l-3-30-4 70H33l-4-70-3 30H14l2-40c1-10 5-18 13-22l14-6c-4-3-6-8-6-14 0-10 6-17 17-17z" fill="currentColor"/></svg>';
const MAPS={random:{name:'RANDOM MAP',img:null},dust:{name:'DUST MAP',img:'assets/ui/m3.jpg'},snow:{name:'SNOW MAP',img:'assets/ui/m3_snow.jpg'}};
// Normalised 0–1 stat bars from weapon data (+ the player's upgrades).
function bars(w,stats){const d=stats[w]||WEAPON_DATA[w],rate=1/(d.interval||1),acc=1/(1+((d.hip||0)+(d.spread||0))*40);const dmg=(d.damage||0)*(d.pellets||1);
 return [['Damage',Math.min(1,dmg/130)],['Rate of Fire',Math.min(1,rate/13)],['Range',Math.min(1,(d.range||0)/320)],['Accuracy',Math.min(1,acc)],['Magazine',Math.min(1,(d.capacity||0)/40)],['Reload Speed',Math.min(1,1.6/((d.reloadTime||2)))]];}
function previewGun(w){const g=buildGun(w);const box=new THREE.Box3().setFromObject(g),c=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());const wrap=new THREE.Group();g.position.sub(c);wrap.add(g);wrap.scale.setScalar(2.1/Math.max(size.x,size.y,size.z));return wrap;}
export function openYardFlow(modalEl,profile,onPlay,{toast,refresh}={}){const ys={mode:'tdm',map:'dust',side:'ct',slot:'primary',skin:null,step:1};let r3=null;
 const d=profile.data,stats=profile.stats();ys.gun=d.loadout.primary;
 const close=()=>{stop3d();modalEl.hidden=true;modalEl.onclick=null;refresh?.();};
 const stop3d=()=>{if(r3){cancelAnimationFrame(r3.raf);r3.renderer.dispose();r3=null;}};
 const head=(title)=>`<div class="cardHead"><b>${title}</b><button class="x" data-yclose>✕</button></div>`;
 const back=()=>`<button class="ghostBtn yBack" data-yback><span>‹ BACK</span></button>`;
 const render=()=>{stop3d();const S=ys.step;let h='';
  if(S===1)h=`${head('MISSION 03 · SELECT MODE')}<div class="yCards two"><button class="yCard" data-ymode="ffa"><i class="num">1</i><span class="art dm">${SOLDIER}</span><small>KILL AS MANY ENEMIES AS YOU CAN</small><b>DEATH MATCH</b></button><button class="yCard" data-ymode="tdm"><i class="num">2</i><em class="new">NEW</em><span class="art vs">VS</span><small>DEFEAT ENEMY TEAM</small><b>TEAM DEATH MATCH</b></button></div>`;
  else if(S===2)h=`${head('SELECT MAP')}<div class="yCards three">${Object.entries(MAPS).map(([k,m],i)=>`<button class="yCard map ${ys.map===k?'sel':''}" data-ymap="${k}"><i class="num">${i+1}</i><span class="art ${k}" ${m.img?`style="background-image:url(${m.img})"`:''}>${k==='random'?'<q>?</q>':''}</span><b>${m.name}</b></button>`).join('')}</div>${back()}`;
  else if(S===3)h=`${head('SELECT YOUR SIDE')}<div class="sides"><button class="side ct ${ys.side==='ct'?'sel':''}" data-yside="ct"><span class="fig"></span><b>COUNTER-TERRORIST</b><small>Urban camo</small></button><button class="side t ${ys.side==='t'?'sel':''}" data-yside="t"><span class="fig"></span><b>TERRORIST</b><small>Desert kit</small></button></div>${back()}`;
  else {const slot=ys.slot,list=Object.entries(SHOP).filter(([,s])=>s.slot===slot).map(([w])=>w),w=ys.gun,owned=d.owned.includes(w),shop=SHOP[w],sk=ownedSkins(profile),cur=sk.equip[w]||'none';const sel=ys.skin??cur;
   h=`${head('WEAPON SELECTION')}<div class="yWeap"><div class="yView"><button class="arr l" data-yarr="-1">‹</button><canvas id="yGun"></canvas><button class="arr r" data-yarr="1">›</button><div class="ySkins">${Object.entries(SKINS).map(([k,s])=>{const has=sk.owned.includes(k);return `<button class="sk ${sel===k?'sel':''} ${has?'':'locked'}" data-yskin="${k}" title="${s.name}"><i style="background:${s.colors?`linear-gradient(135deg,${s.colors.join(',')})`:'#333'}"></i><small>${has?s.name:`◈ ${s.price}`}</small></button>`;}).join('')}</div></div>
    <aside class="yStats"><h3>${esc(WEAPON_DATA[w].label)}</h3>${bars(w,stats).map(([n,v])=>`<div class="bar"><span>${n}</span><i><b style="width:${Math.round(v*100)}%"></b></i></div>`).join('')}
     <p class="blurb">${esc(shop?.blurb||'')}</p>${owned?`<p class="own">✓ UNLOCKED${(SKINS[sel]&&sel!=='none')?' · '+SKINS[sel].name.toUpperCase():''}</p>`:`<button class="ghostBtn" data-ybuy="${w}"><span>BUY ◈ ${shop.price}${d.level<shop.level?` · LEVEL ${shop.level}`:''}</span></button>`}
     ${!sk.owned.includes(sel)?`<button class="ghostBtn" data-ybuyskin="${sel}"><span>BUY SKIN ◈ ${SKINS[sel].price}</span></button>`:''}
     <button class="cta yPlay" data-yplay ${owned?'':'disabled'}><span>PLAY</span><b>→</b></button><small class="coins">◈ ${d.coins} coins</small></aside>
    <div class="yTabs"><button class="${slot==='primary'?'on':''}" data-yslot="primary">General Weapon</button><button class="${slot==='secondary'?'on':''}" data-yslot="secondary">Special Weapon</button></div>
    <div class="yStrip">${list.map(k=>{const o=d.owned.includes(k);return `<button class="${k===w?'on':''} ${o?'':'locked'}" data-ygun="${k}"><b>${esc(WEAPON_DATA[k].label)}</b><small>${o?'Unlocked':`◈ ${SHOP[k].price}`}</small></button>`;}).join('')}</div></div>${back()}`;}
  modalEl.innerHTML=`<div class="modal yFlow step${S}">${h}</div>`;modalEl.hidden=false;if(S===4)start3d();};
 const start3d=()=>{const cv=modalEl.querySelector('#yGun');if(!cv)return;const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,.05,20);cam.position.set(0,.25,3.2);cam.lookAt(0,0,0);scene.add(new THREE.HemisphereLight(0xeaf4ff,0x40392c,2.2));const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(2,3,3);scene.add(key);const rim=new THREE.DirectionalLight(0x7fd0ff,1.4);rim.position.set(-3,1,-2);scene.add(rim);
  const gun=previewGun(ys.gun);const id=ys.skin??(ownedSkins(profile).equip[ys.gun]||'none');applySkin(gun,id);scene.add(gun);r3={renderer,raf:0};let t=0,last=performance.now();
  const loop=()=>{if(!r3||!cv.isConnected){stop3d();return;}r3.raf=requestAnimationFrame(loop);const now=performance.now();t+=(now-last)/1000;last=now;const w=cv.clientWidth,h=cv.clientHeight;if(cv.width!==Math.round(w*renderer.getPixelRatio())){renderer.setSize(w,h,false);cam.aspect=w/Math.max(1,h);cam.position.z=3.2*Math.max(1,1.7/cam.aspect);cam.updateProjectionMatrix();}gun.rotation.y=Math.PI/2+Math.sin(t*.6)*.9;gun.rotation.x=Math.sin(t*.4)*.08;renderer.render(scene,cam);};loop();};
 modalEl.onclick=e=>{const t=e.target.closest('button');if(!t)return;e.stopPropagation();const D=t.dataset;
  if('yclose' in D){close();return;}if('yback' in D){ys.step=ys.step===4&&ys.mode==='ffa'?2:ys.step-1;ys.skin=null;render();return;}
  if(D.ymode){ys.mode=D.ymode;ys.step=2;render();return;}if(D.ymap){ys.map=D.ymap;ys.step=ys.mode==='ffa'?4:3;render();return;}if(D.yside){ys.side=D.yside;ys.step=4;render();return;}
  if(D.yslot){ys.slot=D.yslot;ys.gun=d.loadout[D.yslot];ys.skin=null;render();return;}if(D.ygun){ys.gun=D.ygun;ys.skin=null;render();return;}
  if(D.yarr){const list=Object.entries(SHOP).filter(([,s])=>s.slot===ys.slot).map(([w])=>w);const i=(list.indexOf(ys.gun)+(+D.yarr)+list.length)%list.length;ys.gun=list[i];ys.skin=null;render();return;}
  if(D.yskin){ys.skin=D.yskin;if(ownedSkins(profile).owned.includes(D.yskin)&&d.owned.includes(ys.gun))equipSkin(profile,ys.gun,D.yskin);render();return;}
  if(D.ybuy){if(profile.buy(D.ybuy)){toast?.(WEAPON_DATA[D.ybuy].label+' UNLOCKED');profile.equip(D.ybuy);}else toast?.(d.level<SHOP[D.ybuy].level?'REACH LEVEL '+SHOP[D.ybuy].level+' FIRST':'NOT ENOUGH COINS');render();return;}
  if(D.ybuyskin){if(buySkin(profile,D.ybuyskin)){if(d.owned.includes(ys.gun))equipSkin(profile,ys.gun,D.ybuyskin);toast?.(SKINS[D.ybuyskin].name.toUpperCase()+' SKIN UNLOCKED');}else toast?.('NOT ENOUGH COINS');render();return;}
  if('yplay' in D){if(d.owned.includes(ys.gun))profile.equip(ys.gun);const map=ys.map==='random'?(Math.random()<.5?'dust':'snow'):ys.map;stop3d();modalEl.hidden=true;modalEl.onclick=null;onPlay(`yard:${ys.side}:${map}:${ys.mode}:${ys.map}`);}};
 render();}
