import * as THREE from 'three';
import {makeGun,WEAPON_DATA} from './weapons.js';
import {buildGun} from './gunmodels.js';
// MISSION 03 — DUST YARD.
// A sunny desert cargo-yard Team Deathmatch (5 v 5, 4:00 clock, most kills wins), built entirely
// from procedural geometry and canvas-painted textures (no third-party map assets).
// Exposes: buildYard() → {root (collision + render), deco (render only), boxes, healthSpots, sun setup}
// and YardMode → match flow (VS intro + countdown), team outlines, KILL / HEADSHOT / BOMB KILL badges,
// auto aim / auto fire / auto pickup, health orbs, weapon drops, green smoke, final countdown,
// Victory → MVP → Score end screens.
export const YARD={ffaSpawns:[[-30,40],[0,40],[28,42],[-30,-44],[0,-44],[30,-36],[-31,-12],[-31,14],[30,-12],[30,12],[-8,-24],[10,-24],[-12,4],[12,6],[0,28],[-18,34]].map(([x,z])=>new THREE.Vector3(x,0,z)),arena:{minX:-36,maxX:36,minZ:-50,maxZ:50},bases:{south:new THREE.Vector3(0,0,46),north:new THREE.Vector3(0,0,-46)},spawnX:[-30,30],duration:240,limit:999};
export const SIDE_NAME={ct:'COUNTER-TERRORIST',t:'TERRORIST'};
const rnd=(s=>()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;})(73129);

// ---------- canvas textures ----------
function canvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);return c;}
function tex(c,{repeat=true,aniso=8}={}){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.anisotropy=aniso;return t;}
function speckle(x,w,h,n,colors,size=[1,3]){for(let i=0;i<n;i++){x.fillStyle=colors[(rnd()*colors.length)|0];const s=size[0]+rnd()*(size[1]-size[0]);x.globalAlpha=.05+rnd()*.12;x.fillRect(rnd()*w,rnd()*h,s,s);}x.globalAlpha=1;}
function blotch(x,w,h,n,color,r=[20,80],a=[.04,.12]){for(let i=0;i<n;i++){const cx=rnd()*w,cy=rnd()*h,rr=r[0]+rnd()*(r[1]-r[0]);const g=x.createRadialGradient(cx,cy,0,cx,cy,rr);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=a[0]+rnd()*(a[1]-a[0]);x.fillStyle=g;x.fillRect(cx-rr,cy-rr,rr*2,rr*2);}x.globalAlpha=1;}
const T={};
function textures(){if(T.ready)return T;
 // Sand plaster wall (4 m tile): mottled, stained, panel seams, drips.
 T.wall=tex(canvas(512,512,(x,w,h)=>{x.fillStyle='#c8b089';x.fillRect(0,0,w,h);blotch(x,w,h,60,'#e2cfa6');blotch(x,w,h,50,'#8f7652');speckle(x,w,h,5000,['#6b5a40','#efe0bf','#a48a62']);
  for(let i=0;i<14;i++){const sx=rnd()*w,len=60+rnd()*200;const g=x.createLinearGradient(0,0,0,len);g.addColorStop(0,'rgba(90,70,45,.22)');g.addColorStop(1,'rgba(90,70,45,0)');x.fillStyle=g;x.fillRect(sx,0,3+rnd()*7,len);}
  x.strokeStyle='rgba(80,62,40,.35)';x.lineWidth=2;x.beginPath();x.moveTo(0,256);x.lineTo(w,256);x.moveTo(256,0);x.lineTo(256,h);x.stroke();
  const g=x.createLinearGradient(0,h-70,0,h);g.addColorStop(0,'rgba(70,52,30,0)');g.addColorStop(1,'rgba(70,52,30,.35)');x.fillStyle=g;x.fillRect(0,h-70,w,70);}));
 // Concrete yard slabs (4 m tile).
 T.ground=tex(canvas(512,512,(x,w,h)=>{x.fillStyle='#b3a690';x.fillRect(0,0,w,h);blotch(x,w,h,70,'#cdbfa5',[30,100]);blotch(x,w,h,60,'#7d705c',[15,70]);speckle(x,w,h,9000,['#5e5446','#ddd2bc','#9a8d77']);
  x.strokeStyle='rgba(60,52,40,.55)';x.lineWidth=3;for(const p of [0,256])x.strokeRect(p+1,0,0,h);x.beginPath();x.moveTo(0,1);x.lineTo(w,1);x.moveTo(0,257);x.lineTo(w,257);x.moveTo(1,0);x.lineTo(1,h);x.moveTo(257,0);x.lineTo(257,h);x.stroke();
  x.strokeStyle='rgba(50,42,32,.25)';x.lineWidth=1;for(let i=0;i<10;i++){x.beginPath();let px=rnd()*w,py=rnd()*h;x.moveTo(px,py);for(let k=0;k<6;k++){px+=(rnd()-.5)*40;py+=(rnd()-.5)*40;x.lineTo(px,py);}x.stroke();}}));
 // Checker floor tiles (2 m tile): salmon-brown and sage squares like an old market floor.
 T.tiles=tex(canvas(512,512,(x,w,h)=>{const n=8,s=w/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){x.fillStyle=(i+j)%2?'#9a6a4e':'#8f9a85';x.fillRect(i*s,j*s,s,s);}blotch(x,w,h,40,'#3e2e22',[20,90],[.05,.16]);speckle(x,w,h,6000,['#2c2219','#d7c7ae']);x.strokeStyle='rgba(40,30,22,.5)';x.lineWidth=2;for(let i=0;i<=n;i++){x.beginPath();x.moveTo(i*s,0);x.lineTo(i*s,h);x.moveTo(0,i*s);x.lineTo(w,i*s);x.stroke();}}));
 // Red brick (3 m tile).
 T.brick=tex(canvas(512,512,(x,w,h)=>{x.fillStyle='#b5a58c';x.fillRect(0,0,w,h);const bh=21,bw=64;for(let r=0;r*bh<h;r++)for(let c=-1;c*bw<w;c++){const ox=(r%2)*bw/2;const l=60+rnd()*25;x.fillStyle=`hsl(${8+rnd()*10},${45+rnd()*15}%,${26+rnd()*12}%)`;x.fillRect(c*bw+ox+2,r*bh+2,bw-4,bh-4);if(rnd()<.15){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(c*bw+ox+2,r*bh+2,bw-4,bh-4);}l;}blotch(x,w,h,30,'#2a1a12',[30,120],[.05,.18]);speckle(x,w,h,3000,['#20140e','#d8b9a0']);}));
 // Stucco for the two-storey office.
 T.stucco=tex(canvas(512,512,(x,w,h)=>{x.fillStyle='#d7c39e';x.fillRect(0,0,w,h);blotch(x,w,h,60,'#efe0c2');blotch(x,w,h,40,'#a08458');speckle(x,w,h,7000,['#7d6a4b','#fff3da']);}));
 // Weathered wooden crate: frame, planks, X brace, nails.
 T.crate=tex(canvas(256,256,(x,w,h)=>{x.fillStyle='#9b6a3a';x.fillRect(0,0,w,h);for(let i=0;i<8;i++){x.fillStyle=`hsl(28,${40+rnd()*15}%,${30+rnd()*12}%)`;x.fillRect(0,i*32+1,w,30);}speckle(x,w,h,2500,['#3b2412','#d8a970']);for(let i=0;i<40;i++){x.strokeStyle='rgba(60,35,15,.35)';x.beginPath();const y=rnd()*h;x.moveTo(0,y);x.bezierCurveTo(w*.3,y+rnd()*6,w*.6,y-rnd()*6,w,y+rnd()*4);x.stroke();}
  x.fillStyle='#6e4826';x.fillRect(0,0,w,26);x.fillRect(0,h-26,w,26);x.fillRect(0,0,26,h);x.fillRect(w-26,0,26,h);x.save();x.translate(w/2,h/2);x.rotate(Math.PI/4);x.fillRect(-170,-13,340,26);x.restore();x.strokeStyle='rgba(30,18,8,.6)';x.lineWidth=3;x.strokeRect(1.5,1.5,w-3,h-3);x.strokeRect(26,26,w-52,h-52);x.fillStyle='#2a2a2a';for(const p of [[13,13],[w-13,13],[13,h-13],[w-13,h-13]]){x.beginPath();x.arc(p[0],p[1],3,0,7);x.fill();}blotch(x,w,h,12,'#1c120a',[20,60],[.06,.16]);}));
 // Plywood ramps.
 T.ply=tex(canvas(256,256,(x,w,h)=>{x.fillStyle='#caa16a';x.fillRect(0,0,w,h);for(let i=0;i<60;i++){x.strokeStyle=`rgba(${120+rnd()*40},${80+rnd()*30},40,.25)`;x.lineWidth=1+rnd()*2;x.beginPath();const y=rnd()*h;x.moveTo(0,y);x.bezierCurveTo(w*.3,y+rnd()*10-5,w*.7,y+rnd()*10-5,w,y+rnd()*8-4);x.stroke();}x.strokeStyle='rgba(70,45,20,.5)';x.lineWidth=2;x.beginPath();x.moveTo(0,128);x.lineTo(w,128);x.stroke();speckle(x,w,h,1500,['#5a3a18']);}));
 // Roller shutter.
 T.shutter=tex(canvas(256,256,(x,w,h)=>{for(let i=0;i<32;i++){const g=x.createLinearGradient(0,i*8,0,i*8+8);g.addColorStop(0,'#c9ccc6');g.addColorStop(.5,'#9fa39c');g.addColorStop(1,'#6f736d');x.fillStyle=g;x.fillRect(0,i*8,w,8);}blotch(x,w,h,20,'#5a4a32',[20,70],[.08,.2]);const g=x.createLinearGradient(0,h-60,0,h);g.addColorStop(0,'rgba(80,60,30,0)');g.addColorStop(1,'rgba(80,60,30,.5)');x.fillStyle=g;x.fillRect(0,h-60,w,60);}),{repeat:false});
 T.window=tex(canvas(128,128,(x,w,h)=>{x.fillStyle='#6e5b45';x.fillRect(0,0,w,h);const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#3b4f5a');g.addColorStop(1,'#1a2228');x.fillStyle=g;x.fillRect(10,10,w-20,h-20);x.fillStyle='#6e5b45';x.fillRect(w/2-4,10,8,h-20);x.fillRect(10,h/2-4,w-20,8);x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.moveTo(14,14);x.lineTo(50,14);x.lineTo(14,50);x.fill();}),{repeat:false});
 // Chain-link fence (alpha).
 T.fence=tex(canvas(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#8d9290';x.lineWidth=2.4;for(let i=-w;i<w*2;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+h,h);x.stroke();x.beginPath();x.moveTo(i,h);x.lineTo(i+h,0);x.stroke();}}));
 // Shipping containers: one atlas per colour (long side with CARGO stencil | doors | roof).
 T.container={};for(const [k,base] of Object.entries({red:[6,62,34],rust:[16,48,30],teal:[188,34,34],blue:[214,36,34]})){T.container[k]=tex(canvas(1024,512,(x,w,h)=>{const [hu,s,l]=base;
  const side=w*.66,door=w*.88;for(let i=0;i<side;i+=22){x.fillStyle=`hsl(${hu},${s}%,${l+3}%)`;x.fillRect(i,0,12,h);x.fillStyle=`hsl(${hu},${s}%,${l-5}%)`;x.fillRect(i+12,0,10,h);}
  x.fillStyle=`hsl(${hu},${s}%,${l-9}%)`;x.fillRect(0,0,side,18);x.fillRect(0,h-22,side,22);x.fillRect(0,0,14,h);x.fillRect(side-14,0,14,h);
  x.save();x.globalAlpha=.78;x.fillStyle='#e9e4da';x.font='bold 150px Impact, Arial Black, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('CARGO',side/2,h*.52);x.restore();
  x.fillStyle='rgba(235,230,220,.65)';x.font='bold 26px monospace';x.fillText('CMXU '+(100000+(rnd()*899999|0))+' 2210',36,58);x.fillText('22G1  MAX 30480 KG',36,h-46);
  for(let i=0;i<26;i++){const sx=rnd()*side,len=40+rnd()*220,g=x.createLinearGradient(0,0,0,len);g.addColorStop(0,'rgba(70,32,12,.45)');g.addColorStop(1,'rgba(70,32,12,0)');x.fillStyle=g;x.fillRect(sx,rnd()*60,3+rnd()*6,len);}
  blotch(x,side,h,40,'#2a140a',[20,90],[.08,.22]);speckle(x,side,h,4000,['#1d0f07','#e8c8a0']);
  x.fillStyle=`hsl(${hu},${s}%,${l-2}%)`;x.fillRect(side,0,door-side,h);for(let i=0;i<4;i++){x.fillStyle=`hsl(${hu},${s}%,${l-12}%)`;x.fillRect(side+18+i*(door-side-36)/3.2,20,8,h-40);}
  x.fillStyle=`hsl(${hu},${s}%,${l-14}%)`;x.fillRect(side+(door-side)/2-2,0,4,h);x.fillStyle='#d9d4c8';x.font='bold 20px monospace';x.fillText('CARGO',side+30,50);blotch(x,door,h,10,'#2a140a',[10,50],[.1,.25]);
  for(let i=door;i<w;i+=16){x.fillStyle=`hsl(${hu},${s}%,${l-2}%)`;x.fillRect(i,0,9,h);x.fillStyle=`hsl(${hu},${s}%,${l-8}%)`;x.fillRect(i+9,0,7,h);}blotch(x,w,h,8,'#d9c9a0',[30,80],[.1,.2]);}),{repeat:false});}
 // Painted sky dome: deep zenith → hazy horizon with cumulus clouds.
 T.sky=tex(canvas(2048,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2a63b8');g.addColorStop(.5,'#4f8fd6');g.addColorStop(.78,'#86b6e4');g.addColorStop(.89,'#c9dcea');g.addColorStop(.93,'#dcd6c4');g.addColorStop(1,'#cbbf9f');x.fillStyle=g;x.fillRect(0,0,w,h);
  for(let c=0;c<46;c++){const cx=rnd()*w,cy=h*(.3+rnd()*.56),sc=.45+rnd()*1.1*(1-cy/h)*1.6;for(let k=0;k<22;k++){const px=cx+(rnd()-.5)*180*sc,py=cy+(rnd()-.6)*40*sc,r=(18+rnd()*40)*sc;const gg=x.createRadialGradient(px,py-r*.3,0,px,py,r);gg.addColorStop(0,'rgba(255,255,255,.95)');gg.addColorStop(.6,'rgba(240,243,248,.75)');gg.addColorStop(1,'rgba(200,210,225,0)');x.fillStyle=gg;x.beginPath();x.arc(px,py,r,0,7);x.fill();}
   const sh=x.createLinearGradient(0,cy,0,cy+30*sc);sh.addColorStop(0,'rgba(150,160,180,0)');sh.addColorStop(1,'rgba(150,160,180,.22)');x.fillStyle=sh;x.fillRect(cx-150*sc,cy,300*sc,30*sc);}}),{repeat:false});
 T.ready=true;return T;}
// Snow variant: packed snow with tyre ruts and slush, an overcast sky, and a soft cap texture.
function snowTextures(){const X=textures();if(X.snowGround)return X;
 X.snowGround=tex(canvas(512,512,(x,w,h)=>{x.fillStyle='#e9eef3';x.fillRect(0,0,w,h);blotch(x,w,h,50,'#ffffff',[30,110],[.2,.45]);blotch(x,w,h,40,'#b9c4cf',[20,80],[.08,.2]);blotch(x,w,h,14,'#8d8a84',[12,40],[.08,.18]);speckle(x,w,h,7000,['#c9d3dc','#ffffff','#9aa6b2']);
  x.strokeStyle='rgba(140,150,160,.28)';x.lineWidth=14;for(const ox of [140,190,330,380]){x.beginPath();x.moveTo(ox,0);x.bezierCurveTo(ox+20,170,ox-20,340,ox+6,h);x.stroke();}
  for(let i=0;i<40;i++){x.fillStyle='rgba(120,130,140,.18)';x.beginPath();x.ellipse(rnd()*w,rnd()*h,5,9,rnd()*3,0,7);x.fill();}}));
 X.snowCap=tex(canvas(128,128,(x,w,h)=>{x.fillStyle='#f4f7fa';x.fillRect(0,0,w,h);blotch(x,w,h,20,'#ffffff',[10,30],[.3,.6]);speckle(x,w,h,900,['#cfd8e2','#ffffff']);}));
 X.snowSky=tex(canvas(2048,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#7d8a98');g.addColorStop(.6,'#aab5c1');g.addColorStop(.88,'#d3d9df');g.addColorStop(1,'#c9ced3');x.fillStyle=g;x.fillRect(0,0,w,h);
  for(let c=0;c<120;c++){const cx=rnd()*w,cy=h*(.05+rnd()*.8),r=40+rnd()*120;const gg=x.createRadialGradient(cx,cy,0,cx,cy,r);gg.addColorStop(0,'rgba(235,238,242,.35)');gg.addColorStop(1,'rgba(235,238,242,0)');x.fillStyle=gg;x.fillRect(cx-r,cy-r,r*2,r*2);const d=x.createRadialGradient(cx+r*.3,cy+r*.2,0,cx+r*.3,cy+r*.2,r*.8);d.addColorStop(0,'rgba(90,100,112,.18)');d.addColorStop(1,'rgba(90,100,112,0)');x.fillStyle=d;x.fillRect(cx-r,cy-r,r*2,r*2);}}),{repeat:false});
 return X;}
// Graffiti decals (transparent): arrows, circled A, tags.
function decal(kind){return tex(canvas(256,256,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle=x.fillStyle=kind.color||'#c4151c';x.lineCap='round';x.lineJoin='round';x.shadowColor=x.strokeStyle;x.shadowBlur=6;
 if(kind.type==='arrow'){x.lineWidth=20;x.beginPath();x.moveTo(220,128);x.lineTo(50,128);x.stroke();x.beginPath();x.moveTo(100,70);x.lineTo(40,128);x.lineTo(100,186);x.stroke();}
 else if(kind.type==='circleA'){x.lineWidth=14;x.beginPath();x.arc(128,128,90,0,7);x.stroke();x.beginPath();x.moveTo(70,210);x.lineTo(128,40);x.lineTo(186,210);x.moveTo(60,140);x.lineTo(196,120);x.stroke();}
 else {x.font='bold italic 110px Impact, Arial Black, sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=10;x.strokeStyle='#111';x.strokeText(kind.text,128,128);x.fillText(kind.text,128,128);}
 for(let i=0;i<40;i++){x.globalAlpha=.4;x.fillRect(rnd()*w,rnd()*h,2,2);}x.globalAlpha=1;}),{repeat:false});}

// ---------- geometry helpers ----------
const geoCache=new Map();
// Box whose UVs tile in world metres (tile = metres per texture repeat).
function tiledBox(w,h,d,tile=4){const key=`t${w.toFixed(2)},${h.toFixed(2)},${d.toFixed(2)},${tile}`;if(geoCache.has(key))return geoCache.get(key);const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*dims[f][0]/tile,uv.getY(i)*dims[f][1]/tile);}geoCache.set(key,g);return g;}
// Box with per-face atlas regions [u0,u1,v0,v1] in order +x,-x,+y,-y,+z,-z.
function atlasBox(w,h,d,regions,key){if(geoCache.has(key))return geoCache.get(key);const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;for(let f=0;f<6;f++){const [u0,u1,v0,v1]=regions[f];for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,u0+uv.getX(i)*(u1-u0),v0+uv.getY(i)*(v1-v0));}}geoCache.set(key,g);return g;}
const CL=6.06,CH=2.59,CW=2.44;
const SIDE=[0,.66,0,1],DOOR=[.66,.88,0,1],ROOF=[.88,1,0,1];
function containerGeo(){return atlasBox(CL,CH,CW,[DOOR,DOOR,ROOF,ROOF,SIDE,SIDE],'container');}

// ---------- the map ----------
export function buildYard(theme='dust'){const snow=theme==='snow';const X=snow?snowTextures():textures();const root=new THREE.Group();root.name=snow?'Snow Yard':'Dust Yard';const deco=new THREE.Group();deco.name='Dust Yard decor';const boxes=[];
 const M=(map,o={})=>new THREE.MeshStandardMaterial({map,roughness:o.r??.92,metalness:o.m??0,color:o.color??0xffffff,...(o.extra||{})});
 const mats={wall:M(X.wall),ground:M(X.ground,{r:.95,color:0xd2c6b2}),brick:M(X.brick),stucco:M(X.stucco),crate:M(X.crate,{r:.85}),ply:M(X.ply,{r:.8}),teal:new THREE.MeshStandardMaterial({color:0x2c8088,roughness:.7}),trim:new THREE.MeshStandardMaterial({color:0xe6dcc4,roughness:.85}),dark:new THREE.MeshStandardMaterial({color:0x3a3530,roughness:.9}),metal:new THREE.MeshStandardMaterial({color:0x6e7270,roughness:.5,metalness:.6}),
  container:Object.fromEntries(Object.entries(X.container).map(([k,t])=>[k,M(t,{r:.62,m:.35})])),fence:new THREE.MeshStandardMaterial({map:X.fence,alphaTest:.4,side:THREE.DoubleSide,roughness:.6,metalness:.5,transparent:false}),shutter:M(X.shutter,{r:.55,m:.4}),window:M(X.window,{r:.25,m:.2}),barrier:new THREE.MeshStandardMaterial({color:0xb9b1a2,roughness:.95})};
 X.wall.repeat.set(1,1);
 if(snow){mats.ground=M(X.snowGround,{r:.85});for(const k of ['wall','stucco','brick','crate','ply','barrier','trim'])mats[k].color.multiply(new THREE.Color(0xd9e0e8));for(const m of Object.values(mats.container))m.color.multiply(new THREE.Color(0xcfd6df));mats.snow=M(X.snowCap,{r:.9});}
 const solid=(geo,mat,x,y,z,ry=0,name='yard')=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=ry;m.name=name;m.castShadow=m.receiveShadow=true;root.add(m);m.updateMatrixWorld();boxes.push(new THREE.Box3().setFromObject(m));return m;};
 const box=(w,h,d,mat,x,y,z,ry=0,tile=4,name)=>solid(tiledBox(w,h,d,tile),mat,x,y,z,ry,name);
 const deco3=(geo,mat,x,y,z,ry=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=ry;m.receiveShadow=true;deco.add(m);return m;};
 const {minX,maxX,minZ,maxZ}=YARD.arena,W=maxX-minX,D=maxZ-minZ;
 // Ground (collision) and an outer apron (decor).
 {const g=new THREE.PlaneGeometry(W+2,D+2);g.rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(W+2)/4,uv.getY(i)*(D+2)/4);const m=new THREE.Mesh(g,mats.ground);m.receiveShadow=true;m.name='Yard floor';root.add(m);
  const a=new THREE.PlaneGeometry(420,420);a.rotateX(-Math.PI/2);const ua=a.attributes.uv;for(let i=0;i<ua.count;i++)ua.setXY(i,ua.getX(i)*105,ua.getY(i)*105);const am=new THREE.Mesh(a,mats.ground);am.position.y=-.02;deco.add(am);}
 // Perimeter: 5.5 m plaster walls with a teal band and cream coping.
 const wallH=5.5,perim=(x,z,len,alongX)=>{box(alongX?len:.8,wallH,alongX?.8:len,mats.wall,x,wallH/2,z);deco3(tiledBox(alongX?len+.02:.84,.45,alongX?.84:len+.02,1),mats.teal,x,1.15,z);deco3(tiledBox(alongX?len+.1:1,.22,alongX?1:len+.1,1),mats.trim,x,wallH+.11,z);};
 perim(0,maxZ,W,true);perim(minX,0,D,false);
 // North end: perimeter with the two-storey yard office in the middle (its facade is the wall).
 perim(-24,minZ,24,true);perim(24,minZ,24,true);
 {const z=minZ-4;box(24,8.6,8,mats.stucco,0,4.3,z,0,4,'Office');for(const wx of [-8,-3,3,8])for(const wy of [2.2,5.6])deco3(new THREE.PlaneGeometry(1.6,1.6),mats.window,wx,wy,minZ+.02);deco3(tiledBox(24.4,.3,8.4,1),mats.trim,0,8.75,z);deco3(tiledBox(24.2,.5,.2,1),mats.teal,0,3.9,minZ+.1);
  // balcony + door + parapet signage
  box(8,.25,1.6,mats.trim,0,3.7,minZ+.8);for(const bx of [-3.8,0,3.8])deco3(tiledBox(.08,1,.08,1),mats.metal,bx,4.3,minZ+1.55);deco3(tiledBox(8,.08,.08,1),mats.metal,0,4.8,minZ+1.55);
  const door=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.8),mats.shutter);door.position.set(0,1.4,minZ+.03);deco.add(door);
  for(const sx of [-1,1]){box(2.5,10.5,2.5,mats.stucco,sx*13.4,5.25,minZ-1.5);deco3(tiledBox(2.7,.4,2.7,1),mats.trim,sx*13.4,10.6,minZ-1.5);}}
 // East: long brick warehouse — its facade is the east wall — with roller shutters and a loading dock.
 {const x=maxX+6;perim(maxX,-40,20,false);perim(maxX,40,20,false);box(12,8.5,62,mats.brick,x,4.25,0,0,3,'Warehouse');deco3(tiledBox(12.6,.4,62.6,1),mats.trim,x,8.6,0);
  // roof (sloped decor)
  const roof=new THREE.Mesh(tiledBox(13,.3,63,2),mats.metal);roof.position.set(x,9.4,0);roof.rotation.z=.18;deco.add(roof);
  for(const z of [-24,-12,0,12,24]){const s=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.4),mats.shutter);s.position.set(maxX-.02,2.2+1.2,z);s.rotation.y=-Math.PI/2;deco.add(s);deco3(tiledBox(.2,.5,4.8,1),mats.teal,maxX-.08,5.8,z);}
  box(3,1.2,56,mats.barrier,maxX-1.5,.6,0,0,2,'Loading dock');deco3(tiledBox(3.04,.14,56.04,1),mats.dark,maxX-1.5,1.18,0);
  for(const s of [-1,1]){const r=solid(tiledBox(2.4,.14,3.4,2),mats.ply,maxX-1.5,.55,s*29.6,0,'Dock ramp');r.rotation.x=s*.36;r.updateMatrixWorld();boxes[boxes.length-1]=new THREE.Box3().setFromObject(r);}}
 // South (blue / CT spawn) skyline + west covered market.
 {const roofY=3.7;box(10,.35,52,mats.trim,minX+5.4,roofY,-4,0,4,'Market roof');for(let z=-28;z<=20;z+=6)box(.5,roofY,.5,mats.teal,minX+10.2,roofY/2,z,0,1,'Pillar');
  const tl=new THREE.PlaneGeometry(10,52);tl.rotateX(-Math.PI/2);const u=tl.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*5,u.getY(i)*26);const tm=new THREE.Mesh(tl,new THREE.MeshStandardMaterial({map:X.tiles,roughness:.8,polygonOffset:true,polygonOffsetFactor:-2}));tm.position.set(minX+5.4,.012,-4);tm.receiveShadow=true;deco.add(tm);
  for(const [cz,n] of [[-22,3],[-8,2],[8,3]]){for(let i=0;i<n;i++)box(1.25,1.25,1.25,mats.crate,minX+2+i*1.3,.625,cz,0,1.25,'Crate');box(1.25,1.25,1.25,mats.crate,minX+2.6,1.875,cz,.2,1.25,'Crate');}}
 // Central divider with an archway (z = -6) and a short wall with a doorway (z = 14).
 {const z=-6,h=5;box(11,h,.8,mats.wall,-20.5,h/2,z);box(7,h,.8,mats.wall,-7.5,h/2,z);box(4,1.6,.8,mats.wall,-13,h-.8,z);deco3(tiledBox(11.04,.4,.84,1),mats.teal,-20.5,1.1,z);deco3(tiledBox(7.04,.4,.84,1),mats.teal,-7.5,1.1,z);deco3(tiledBox(22.2,.2,1,1),mats.trim,-15,h+.1,z);
  for(const px of [-15.1,-10.9])box(.6,h,1,mats.teal,px,h/2,z,0,1,'Arch pillar');
  const tl=new THREE.PlaneGeometry(6,8);tl.rotateX(-Math.PI/2);const u=tl.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*3,u.getY(i)*4);const tm=new THREE.Mesh(tl,new THREE.MeshStandardMaterial({map:X.tiles,roughness:.8,polygonOffset:true,polygonOffsetFactor:-2}));tm.position.set(-13,.012,z);tm.receiveShadow=true;deco.add(tm);
  const z2=14;box(6,4,.8,mats.wall,9,2,z2);box(6,4,.8,mats.wall,20,2,z2);box(5,1.2,.8,mats.wall,14.5,3.4,z2);deco3(tiledBox(6.04,.4,.84,1),mats.teal,9,1.1,z2);deco3(tiledBox(6.04,.4,.84,1),mats.teal,20,1.1,z2);}
 // Shipping containers (some stacked), with plywood ramps up onto two of them.
 const C=containerGeo(),cmat=k=>mats.container[k];
 const cont=(x,z,alongZ,k,stack=1,yaw=0)=>{for(let s=0;s<stack;s++)solid(C,cmat(s?['rust','teal','red','blue'][(x*7+z*3+s)&3]:k),x,CH/2+s*CH,z,(alongZ?Math.PI/2:0)+yaw*(s?.6:1),'Container');};
 cont(12,-30,true,'red',2);cont(17,-31,true,'rust');cont(-4,-30,false,'teal',2);cont(24,-2,true,'red');cont(-14,24,false,'rust',2);cont(8,28,true,'blue');cont(-3,6,false,'red');
 cont(25,-41,false,'rust',2);cont(-27,38,false,'teal');cont(20,36,true,'red');cont(-21,-41,false,'red',2,.04);cont(4,-16,true,'rust');cont(27,22,true,'teal',2);cont(-24,6,false,'blue');
 const ramp=(x,z,dir,len=5.8)=>{const a=Math.asin(CH/len),r=solid(tiledBox(2.3,.12,len,2),mats.ply,x,CH/2,z,0,'Ramp');r.rotation.x=dir*a;r.updateMatrixWorld();boxes[boxes.length-1]=new THREE.Box3().setFromObject(r);return r;};
 {const a=Math.asin(CH/5.8),h=5.8*Math.cos(a)/2;ramp(-3,6+CW/2+h,1);ramp(8,28-CL/2-h,-1);}
 // Crate clusters and concrete barriers (cover).
 const crates=(x,z,pattern,ry=0)=>{const c=Math.cos(ry),s=Math.sin(ry);for(const [i,j,k] of pattern){const lx=i*1.3,lz=j*1.3;box(1.25,1.25,1.25,mats.crate,x+lx*c+lz*s,.625+k*1.25,z-lx*s+lz*c,ry+(k?.15:0),1.25,'Crate');}};
 crates(-10,-20,[[0,0,0],[1,0,0],[0,1,0],[0,0,1]]);crates(6,-40,[[0,0,0],[1,0,0],[1,0,1]],.3);crates(16,4,[[0,0,0],[0,1,0],[0,0,1]]);crates(-18,-28,[[0,0,0],[1,0,0]]);crates(-8,34,[[0,0,0],[1,0,0],[0,1,0],[1,0,1]],-.2);
 crates(28,8,[[0,0,0],[0,1,0]]);crates(14,-14,[[0,0,0],[1,0,0],[0,0,1]],.5);crates(-26,-16,[[0,0,0]]);crates(30,-24,[[0,0,0],[0,1,0],[0,0,1]]);crates(2,18,[[0,0,0],[1,0,0]],.8);
 for(const [x,z,ry] of [[-6,-38,0],[10,40,0],[-16,14,1.2],[22,-20,.4],[-30,26,1.57]])box(3,1,.7,mats.barrier,x,.5,z,ry,2,'Barrier');
 // Fenced compound corner (chain link on posts).
 {const fz=-18,x0=-30,x1=-18;const f=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,3.2),mats.fence);f.position.set((x0+x1)/2,1.6,fz);const u=f.geometry.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*(x1-x0)/1.2,u.getY(i)*3.2/1.2);f.name='Fence';root.add(f);f.updateMatrixWorld();boxes.push(new THREE.Box3().setFromObject(f));for(let x=x0;x<=x1;x+=3)deco3(tiledBox(.1,3.3,.1,1),mats.metal,x,1.65,fz);}
 // Graffiti.
 const G=(kind,x,y,z,ry,s=2.2)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshStandardMaterial({map:decal(kind),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,roughness:.9}));m.position.set(x,y,z);m.rotation.y=ry;deco.add(m);};
 G({type:'arrow'},-20,2.4,-5.58,0);G({type:'circleA'},-6,2.6,-5.58,0,2);G({type:'arrow'},minX+.42,2.5,30,Math.PI/2);G({type:'circleA'},minX+.42,2.6,-34,Math.PI/2,2.4);G({type:'tag',text:'BIG',color:'#3f6ec4'},9,2.2,13.58,Math.PI,3);
 G({type:'arrow',color:'#c4151c'},20,2.2,14.42,0,1.8);G({type:'tag',text:'CREW',color:'#c9c9c9'},maxX-.42,6.6,-6,-Math.PI/2,3.4);G({type:'arrow'},-12,2.5,maxZ-.42,Math.PI,2);G({type:'circleA'},24,2.5,minZ+.42,0,2.2);G({type:'tag',text:'Y7',color:'#c4151c'},-24,3.2,maxZ-.42,Math.PI,2.4);
 // Skyline beyond the walls: flat-roof houses and a water tower (decor only).
 for(let i=0;i<22;i++){const a=i/22*Math.PI*2,r=70+rnd()*30,x=Math.cos(a)*r*.8,z=Math.sin(a)*r,w=8+rnd()*12,h=6+rnd()*10,d=8+rnd()*10;const m=deco3(tiledBox(w,h,d,4),rnd()<.35?mats.brick:mats.stucco,x,h/2,z,a);for(let k=0;k<3;k++){const wm=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.3),mats.window);wm.position.set((k-1)*w*.28,h*.2,d/2+.02);m.add(wm);}deco3(tiledBox(w+.3,.3,d+.3,1),mats.trim,x,h+.15,z,a);}
 {const t=new THREE.Group();const leg=tiledBox(.25,12,.25,1);for(const [lx,lz] of [[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]]){const l=new THREE.Mesh(leg,mats.metal);l.position.set(lx,6,lz);t.add(l);}const tank=new THREE.Mesh(new THREE.CylinderGeometry(3,3,4,20),mats.container.blue);tank.position.y=14;t.add(tank);t.position.set(58,0,-62);deco.add(t);}
 // Snow: a soft cap on every flat top (walls, containers, crates, roofs) and drifts along the walls.
 if(snow){for(const m of [...root.children]){const p=m.geometry?.parameters;if(!p||!p.height||!p.depth||/Ramp|ramp|Fence/.test(m.name)||Math.abs(m.rotation.x)>.01)continue;const cap=new THREE.Mesh(tiledBox(p.width+.16,.24,p.depth+.16,2),mats.snow);cap.position.y=p.height/2+.1;cap.castShadow=false;cap.receiveShadow=true;cap.name='Snow cap';m.add(cap);}
  const drift=(x,z,len,alongX)=>deco3(tiledBox(alongX?len:1.1,.22,alongX?1.1:len,2),mats.snow,x,.06,z);drift(0,maxZ-.9,W-2,true);drift(-24,minZ+.9,22,true);drift(24,minZ+.9,22,true);drift(minX+.9,30,36,false);drift(maxX-.9,-40,18,false);drift(maxX-.9,40,18,false);drift(-20.5,-5.1,10,true);drift(9,14.9,5,true);}
 // Sky dome.
 {const g=new THREE.SphereGeometry(300,40,20,0,Math.PI*2,0,Math.PI*.55);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:snow?X.snowSky:X.sky,side:THREE.BackSide,fog:false,depthWrite:false}));m.renderOrder=-10;m.name='Sky';deco.add(m);}
 const healthSpots=[[-31,10],[4,-11],[30,18],[-10,30],[-12,-34],[20,-44],[-30,-30],[18,44]].map(([x,z])=>new THREE.Vector3(x,0,z));
 return {root,deco,boxes,healthSpots};}

// Applies the yard's light: bright late-morning sun with crisp shadows, warm bounce from the sand.
export function lightYard({scene,sun,hemi,renderer,quality,theme='dust',shadows=true}){if(theme==='snow'){scene.background=new THREE.Color('#b9c3cd');scene.fog=new THREE.Fog('#cfd6dd',40,240);hemi.color.set(0xe4edf6);hemi.groundColor.set(0xc3cad2);hemi.intensity=1.7;sun.color.set(0xe8eef6);sun.intensity=1.5;sun.position.set(-40,90,25);if(!sun.target.parent)scene.add(sun.target);sun.target.position.set(0,0,0);}else{scene.background=new THREE.Color('#9fc1e4');scene.fog=new THREE.Fog('#d7d2c0',110,520);hemi.color.set(0xd6e8ff);hemi.groundColor.set(0xb39a72);hemi.intensity=1.35;sun.color.set(0xffeacc);sun.intensity=2.7;sun.position.set(48,95,30);if(!sun.target.parent)scene.add(sun.target);sun.target.position.set(0,0,0);}
 if(quality!=='low'&&shadows){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;sun.castShadow=true;const s=sun.shadow;s.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);s.camera.left=-64;s.camera.right=64;s.camera.top=64;s.camera.bottom=-64;s.camera.near=10;s.camera.far=260;s.bias=-.0005;s.normalBias=.04;s.camera.updateProjectionMatrix();}}

// Screen-space outline hull for a skinned soldier (green = team, red = enemy), like the reference.
export function addOutline(model,color){const mat=new THREE.MeshBasicMaterial({color,side:THREE.BackSide,fog:false,toneMapped:false});mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n#ifdef USE_SKINNING\n{vec3 vn=normalize(transformedNormal);vec2 cn=normalize((projectionMatrix*vec4(vn,0.)).xy+1e-5);gl_Position.xy+=cn*.0042*min(gl_Position.w,16.);vec4 mv2=mvPosition;mv2.z-=.14;vec4 g2=projectionMatrix*mv2;gl_Position.z=g2.z/g2.w*gl_Position.w;}\n#endif');};
 const hulls=[];model.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.outline){const h=new THREE.SkinnedMesh(o.geometry,mat);h.userData.outline=true;h.frustumCulled=false;h.bind(o.skeleton,o.bindMatrix);h.position.copy(o.position);h.quaternion.copy(o.quaternion);h.scale.copy(o.scale);h.renderOrder=-1;hulls.push([o.parent,h]);}});for(const [p,h] of hulls)p.add(h);return mat;}

const ICON={rifle:'<path d="M2 10h14l2-2h4v3h-2l-1 2h-5l-1 4H9l1-4H2z" fill="currentColor"/>',pistol:'<path d="M5 8h13v4h-5l-1 6H8l1-6H5z" fill="currentColor"/>',knife:'<path d="M3 17L16 4l3 1-9 11-2 1z" fill="currentColor"/>'};
const SKULL='<svg viewBox="0 0 64 72"><path d="M32 2l26 10v22c0 18-12 30-26 36C18 64 6 52 6 34V12z" fill="url(#bgS)" stroke="#e8e2d6" stroke-width="3"/><defs><linearGradient id="bgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a1f2a"/><stop offset="1" stop-color="#3a0c12"/></linearGradient></defs><path d="M20 8l4 7 4-8 4 8 4-8 4 8 4-7v9H20z" fill="#f2e7cf"/><path d="M32 20c-9 0-15 6-15 14 0 5 3 8 6 10v6h18v-6c3-2 6-5 6-10 0-8-6-14-15-14z" fill="#f4efe6"/><circle cx="26" cy="34" r="4" fill="#2a0a0e"/><circle cx="38" cy="34" r="4" fill="#2a0a0e"/><path d="M32 39l-3 5h6z" fill="#2a0a0e"/><path d="M27 50v4M32 50v4M37 50v4" stroke="#2a0a0e" stroke-width="2"/></svg>';
const HEAD='<svg viewBox="0 0 64 72"><path d="M32 2l26 10v22c0 18-12 30-26 36C18 64 6 52 6 34V12z" fill="#21386b" stroke="#e8e2d6" stroke-width="3"/><path d="M32 18c-10 0-16 7-16 15 0 6 4 10 7 12v7h18v-7c3-2 7-6 7-12 0-8-6-15-16-15z" fill="#ffb21e"/><path d="M20 30q6-8 12-2q6-6 12 2l-3 6h-18z" fill="#e2401f"/><circle cx="26" cy="35" r="3.6" fill="#2a0a0e"/><circle cx="38" cy="35" r="3.6" fill="#2a0a0e"/><circle cx="32" cy="12" r="5" fill="none" stroke="#ff3b2f" stroke-width="2.5"/><path d="M32 4v16M24 12h16" stroke="#ff3b2f" stroke-width="2"/></svg>';
const BOMB='<svg viewBox="0 0 64 72"><path d="M32 2l26 10v22c0 18-12 30-26 36C18 64 6 52 6 34V12z" fill="#2a5a63" stroke="#e8e2d6" stroke-width="3"/><circle cx="32" cy="38" r="14" fill="#c8a033"/><path d="M26 30h12M26 38h12M26 46h12M32 24v28" stroke="#6d5414" stroke-width="2"/><rect x="28" y="16" width="8" height="8" fill="#9aa"/><path d="M36 18l8-6" stroke="#ccc" stroke-width="3"/></svg>';
const SOLDIER='<svg viewBox="0 0 100 160"><path d="M50 8c10 0 16 7 16 17 0 6-2 11-6 14l14 6c8 4 12 12 13 22l2 40h-12l-3-30-4 70H33l-4-70-3 30H14l2-40c1-10 5-18 13-22l14-6c-4-3-6-8-6-14 0-10 6-17 17-17z" fill="currentColor"/></svg>';

// ---------- match flow ----------
export class YardMode {
 constructor(ctx){Object.assign(this,ctx);this.side=ctx.side==='t'?'t':'ct';this.ffa=!!ctx.ffa;this.names=this.ffa?{blue:'YOU',red:'LEADER'}:{blue:SIDE_NAME[this.side],red:SIDE_NAME[this.side==='ct'?'t':'ct']};const s=ctx.settings;this.auto={aim:s.yardAutoAim??true,fire:s.yardAutoFire??false,pickup:s.yardAutoPickup??true};
  this.introT=6;this.orbs=[];this.drops=[];this.smokes=[];this.badges=[];this.lastCount=-1;this.endStage=0;this.spawnHealth();this.buildHud();this.smokeTex=tex(canvas(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,62);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.5,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}),{repeat:false});if(ctx.theme==='snow')this.makeSnowfall();}
 // HUD pieces that only exist in this mission.
 buildHud(){const $=s=>document.querySelector(s);const el=document.createElement('div');el.id='yardHud';el.innerHTML=`<div id="yardBadges"></div><div id="yardCount"></div>
  <div id="yardAuto"><label data-k="aim"><span>AUTO AIM</span><i></i></label><label data-k="fire"><span>AUTO FIRE</span><i></i></label><label data-k="pickup"><span>AUTO PICKUP</span><i></i></label></div>
  <div id="yardIntro" hidden><div class="vs"><div class="team blue"><div class="emb">${this.emblem(this.side)}</div><b>${this.ffa?'YOU':this.names.blue}</b><ul></ul></div><div class="vsMark">VS</div><div class="team red"><div class="emb">${this.emblem(this.side==='ct'?'t':'ct')}</div><b>${this.ffa?'EVERYONE':this.names.red}</b><ul></ul></div></div>
   <div class="tdmBar">${this.ffa?'DEATH MATCH · FREE FOR ALL':'TEAM DEATHMATCH'}</div><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/></svg><b></b></div></div>
  <div id="yardBar"><div class="slots"></div><div class="hp"><span>♥ <b>100</b>/100</span><i><em></em></i></div></div>
  <div id="yardEnd" hidden></div>`;document.body.appendChild(el);this.el=el;
  el.querySelector('#yardBar .slots').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-w]');if(!b)return;e.stopPropagation();e.preventDefault();if(!this.mission.playerDown)this.equipment.switch(b.dataset.w);});
  el.querySelectorAll('#yardAuto label').forEach(l=>{l.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();const k=l.dataset.k;this.auto[k]=!this.auto[k];this.settings['yardAuto'+k[0].toUpperCase()+k.slice(1)]=this.auto[k];this.profile?.save();this.syncAuto();});});this.syncAuto();}
 syncAuto(){this.el.querySelectorAll('#yardAuto label').forEach(l=>l.classList.toggle('on',!!this.auto[l.dataset.k]));}
 emblem(side){return side==='ct'?'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 10l18 30H14z M32 22l-8 14h16z" fill="currentColor" fill-rule="evenodd"/><path d="M14 46h36" stroke="currentColor" stroke-width="4"/></svg>':'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="27" r="10" fill="currentColor"/><path d="M26 36h12v6H26z" fill="currentColor"/><path d="M14 50L50 14M14 14l36 36" stroke="currentColor" stroke-width="4"/></svg>';}
 // Pre-match: VS line-up (rosters slide in), then the green "TEAM DEATHMATCH" bar and a 3-2-1 ring.
 introStep(dt){const I=this.el.querySelector('#yardIntro');if(this.introT===6){const roster=team=>[this.bots.player,...this.bots.list].filter(a=>this.ffa?(team==='blue')===!!a.isPlayer:a.team===team).map((a,i)=>`<li style="animation-delay:${.15+i*.22}s"><span>${SOLDIER}</span><em>${a.isPlayer?'★ ':''}${a.name.replace(/[<>&]/g,'')}</em></li>`).join('');I.querySelector('.blue ul').innerHTML=roster('blue');I.querySelector('.red ul').innerHTML=roster('red');this.audio?.ui?.();}
  this.introT=Math.max(0,this.introT-dt);I.hidden=this.introT<=0;const t=this.introT;I.classList.toggle('count',t<3.2);const n=Math.ceil(t);if(t<3.2&&n!==this.lastIntro){this.lastIntro=n;I.querySelector('.ring b').textContent=n>0?n:'';this.audio?.ui?.();}if(t<=0){this.flash('FIGHT!');this.audio?.streak?.();}}
 spawnHealth(){const geo=new THREE.SphereGeometry(.42,24,16),mat=new THREE.MeshStandardMaterial({color:0x4dff6a,emissive:0x1f9a2e,emissiveIntensity:.9,transparent:true,opacity:.42,roughness:.2,depthWrite:false}),cross=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  for(const p of this.healthSpots){const g=new THREE.Group();g.add(new THREE.Mesh(geo,mat.clone()));const a=new THREE.Mesh(new THREE.BoxGeometry(.42,.12,.12),cross),b=new THREE.Mesh(new THREE.BoxGeometry(.12,.42,.12),cross);g.add(a,b);g.position.copy(p).setY(.95);this.scene.add(g);this.orbs.push({g,p:p.clone(),wait:0});}}
 // Fallen soldiers drop their gun, outlined green, for a few seconds.
 dropWeapon(pos,weapon){if(!this.equipment.items?.[weapon])return;if(this.drops.length>=8){const o=this.drops.shift();this.scene.remove(o.g);}const g=new THREE.Group(),gun=buildGun(weapon);const rim=new THREE.MeshBasicMaterial({color:0x52ff4a,side:THREE.BackSide,toneMapped:false});
  const parts=[];gun.traverse(o=>{if(o.isMesh&&o.visible)parts.push(o);});for(const o of parts){const r=new THREE.Mesh(o.geometry,rim);r.position.copy(o.position);r.quaternion.copy(o.quaternion);r.scale.copy(o.scale).multiplyScalar(1.08);r.userData.rim=true;o.parent.add(r);}
  gun.scale.setScalar(1.25);gun.rotation.set(0,Math.random()*6.28,Math.PI/2);g.add(gun);g.position.set(pos.x,.12,pos.z);this.scene.add(g);this.drops.push({g,weapon,ttl:22});}
 // Falling snow that follows the camera (snow map).
 makeSnowfall(){const n=3600,g=new THREE.BufferGeometry(),p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*70;p[i*3+1]=Math.random()*30;p[i*3+2]=(Math.random()-.5)*70;}g.setAttribute('position',new THREE.BufferAttribute(p,3));
  const m=new THREE.PointsMaterial({color:0xffffff,size:.17,transparent:true,opacity:.85,depthWrite:false,map:this.smokeTex||null});this.snow=new THREE.Points(g,m);this.snow.frustumCulled=false;this.scene.add(this.snow);}
 snowStep(dt){if(!this.snow)return;const a=this.snow.geometry.attributes.position,c=this.camera.position,t=performance.now()/1000;for(let i=0;i<a.count;i++){let x=a.getX(i)+Math.sin(t*.7+i)*.4*dt,y=a.getY(i)-dt*(1.1+(i%7)*.12),z=a.getZ(i)+Math.cos(t*.5+i*.3)*.3*dt;if(y<0)y+=30;
  if(x-c.x>35)x-=70;else if(x-c.x<-35)x+=70;if(z-c.z>35)z-=70;else if(z-c.z<-35)z+=70;a.setXYZ(i,x,y,z);}a.needsUpdate=true;}
 smoke(pos){const n=16;for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:this.smokeTex,color:new THREE.Color().setHSL(.33+Math.random()*.04,.75,.45+Math.random()*.15),transparent:true,opacity:0,depthWrite:false}));s.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*1.5,.4+Math.random(),(Math.random()-.5)*1.5));s.scale.setScalar(1.2);this.scene.add(s);this.smokes.push({s,v:new THREE.Vector3((Math.random()-.5)*1.4,.35+Math.random()*.5,(Math.random()-.5)*1.4),t:0,life:5+Math.random()*3});}}
 badge(kind){const box=this.el.querySelector('#yardBadges');const d=document.createElement('div');d.className='ybadge '+kind;d.innerHTML=(kind==='head'?HEAD:kind==='bomb'?BOMB:SKULL)+`<b>${kind==='head'?'HEADSHOT':kind==='bomb'?'BOMB KILL':'KILL'}</b>`;box.appendChild(d);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>d.remove(),1700);}
 onKill(killer,victim,weapon,head){if(victim.root&&!victim.isPlayer)this.dropWeapon(victim.root.position,victim.weapon);if(killer?.isPlayer&&!victim.isPlayer)this.badge(weapon==='grenade'?'bomb':head?'head':'kill');}
 // Auto aim: gently pulls the view onto an enemy that is already close to the crosshair.
 assist(dt,look,camera,down){if(!this.auto.aim||down||this.equipment.current==='knife')return;camera.updateMatrixWorld(true);const eye=camera.position,view=camera.getWorldDirection(new THREE.Vector3());let best=null,bc=Math.cos(.13);
  for(const e of this.bots.list){if(e.dead||!this.bots.foe(e,this.bots.player))continue;const c=e.root.position.clone();c.y+=e.crouch?1:1.32;const d=c.clone().sub(eye),l=d.length();if(l>70)continue;const cos=d.dot(view)/l;if(cos<bc)continue;if(!this.nav.clear(eye,c,false))continue;bc=cos;best=d;}
  if(!best)return;const l=best.length(),ty=Math.atan2(-best.x,-best.z),tp=Math.asin(best.y/l),k=Math.min(1,dt*3.2);let dy=ty-look.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));look.yaw+=dy*k;look.pitch+=(tp-look.pitch)*k;}
 interact(feet){const d=this.nearDrop(feet);if(d){this.take(d);return true;}return false;}
 nearDrop(feet){let best=null,bd=1.9;for(const d of this.drops){const dd=Math.hypot(d.g.position.x-feet.x,d.g.position.z-feet.z);if(dd<bd&&d.weapon!==this.equipment.order[0]){bd=dd;best=d;}}return best;}
 take(d){const eq=this.equipment,w=d.weapon;if(!eq.items[w])return;eq.order[0]=w;eq.unlocked.add(w);const inv=eq.inventory[w];if(inv){inv.ammo=eq.data[w].capacity;inv.reserve=eq.data[w].capacity*4;}eq.switch(w,true);this.scene.remove(d.g);this.drops.splice(this.drops.indexOf(d),1);this.audio?.pickup?.();this.flash('PICKED UP '+(WEAPON_DATA[w]?.label||w.toUpperCase()));}
 update(dt,feet,down){this.snowStep(dt);for(const o of this.orbs){o.g.rotation.y+=dt*1.6;if(o.wait>0){o.wait-=dt;o.g.visible=o.wait<=0;continue;}o.g.position.y=.95+Math.sin(performance.now()/400+o.p.x)*.12;{const dc=this.camera.position.distanceTo(o.g.position),f=THREE.MathUtils.clamp((dc-1.2)/2.2,.15,1);o.g.children[0].material.opacity=.42*f;o.g.scale.setScalar(.75+.25*f);}
   if(!down&&this.mission.health<100&&Math.hypot(feet.x-o.p.x,feet.z-o.p.z)<1.3&&Math.abs(feet.y-o.p.y)<2){this.mission.health=Math.min(100,this.mission.health+40);o.wait=20;o.g.visible=false;this.audio?.pickup?.();this.flash('+40 HEALTH');}}
  for(const d of this.drops){d.ttl-=dt;d.g.rotation.y+=dt*.8;if(d.ttl<4)d.g.visible=Math.floor(d.ttl*6)%2===0;}for(const d of this.drops.filter(d=>d.ttl<=0)){this.scene.remove(d.g);}this.drops=this.drops.filter(d=>d.ttl>0);
  if(!down&&this.auto.pickup){const d=this.nearDrop(feet);if(d&&Math.hypot(d.g.position.x-feet.x,d.g.position.z-feet.z)<1.2)this.take(d);}
  for(const s of this.smokes){s.t+=dt;s.s.position.addScaledVector(s.v,dt);s.v.multiplyScalar(1-dt*.5);s.s.scale.setScalar(1.2+s.t*1.3);const f=s.t/s.life;s.s.material.opacity=Math.min(.85,s.t*2)*(1-f);if(f>=1){this.scene.remove(s.s);s.s.material.dispose();}}this.smokes=this.smokes.filter(s=>s.t<s.life);}
 // Bottom weapon bar (primary · knife · pistol) with ammo, plus the green health bar — tap a slot to switch.
 bar(){const now=performance.now();if(now-(this.barT||0)<100)return;this.barT=now;const eq=this.equipment,o=eq.order,slots=[o[0],'knife',o[1]].filter((w,i,a)=>w&&a.indexOf(w)===i);
  const key=slots.join()+eq.current+eq.ammo+eq.reserve+eq.reloading;if(key!==this.barKey){this.barKey=key;this.el.querySelector('#yardBar .slots').innerHTML=slots.map(w=>{const icon=w==='knife'?ICON.knife:WEAPON_DATA[w]?.capacity<=15||w==='pistol'||w==='magnum'?ICON.pistol:ICON.rifle;const on=w===eq.current;return `<button data-w="${w}" class="${on?'on':''}"><svg viewBox="0 0 24 24">${icon}</svg>${on&&w!=='knife'?`<small>${eq.reloading?'RELOAD':eq.ammo+'/'+eq.reserve}</small>`:`<small>${(WEAPON_DATA[w]?.label||w).split(' ')[0]}</small>`}</button>`;}).join('');}
  const hp=Math.ceil(this.mission.health);this.el.querySelector('#yardBar .hp b').textContent=hp;const f=this.el.querySelector('#yardBar .hp em');f.style.width=hp+'%';f.classList.toggle('low',hp<35);}
 hud(feet,down){this.bar();const t=Math.ceil(this.mission.timeLeft),c=this.el.querySelector('#yardCount');if(t<=10&&t>0&&!this.mission.ended){if(t!==this.lastCount){this.lastCount=t;c.textContent=t;c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop');this.audio?.ui?.();}}else c.textContent='';
  const d=!down&&!this.auto.pickup?this.nearDrop(feet):null;return d?'E / USE — PICK UP '+(WEAPON_DATA[d.weapon]?.label||d.weapon):'';}
 // VICTORY → MVP line-up → SCORE table (kills · deaths · assists), as in the reference flow.
 showEnd(result,rewardsHtml,{onAgain,onLobby}){const E=this.el.querySelector('#yardEnd'),all=[this.bots.player,...this.bots.list],me=this.bots.player.team,them=me==='blue'?'red':'blue',score=k=>this.mission.score[k]*10;
  const title=result==='win'?'VICTORY':result==='loss'?'DEFEAT':'DRAW',esc=s=>String(s).replace(/[<>&]/g,'');
  const rows=team=>all.filter(a=>a.team===team).sort((a,b)=>b.kills-a.kills||a.deaths-b.deaths).map(a=>`<tr class="${a.isPlayer?'me':''}"><td><span class="av">${SOLDIER}</span>${a.isPlayer?'★ ':''}${esc(a.name)}</td><td>${a.kills}</td><td>${a.deaths}</td><td>${a.assists||0}</td></tr>`).join('');
  const mvp=(this.ffa?all:all.filter(a=>a.team===(result==='loss'?them:me))).slice().sort((a,b)=>b.kills-a.kills||a.deaths-b.deaths).slice(0,5);const best=mvp[0];
  const ranked=all.slice().sort((a,b)=>b.kills-a.kills||a.deaths-b.deaths),ffaRows=ranked.map((a,i)=>`<tr class="${a.isPlayer?'me':''}"><td><span class="av">${SOLDIER}</span>#${i+1} ${a.isPlayer?'★ ':''}${esc(a.name)}</td><td>${a.kills}</td><td>${a.deaths}</td><td>${a.kills*10}</td></tr>`).join('');
  E.innerHTML=`<div class="stage s1 ${result}"><div class="crest"><svg viewBox="0 0 200 120"><path d="M100 4l36 22-12 8 40-6-30 36 18 2-52 50-52-50 18-2-30-36 40 6-12-8z" fill="currentColor" opacity=".9"/></svg><h1>${title}</h1></div><div class="vsRow"><span class="nm">${this.names.blue}</span><span class="pill blue">${this.emblem(this.side)}<b>${score('blue')}</b></span><span class="vsMark">VS</span><span class="pill red"><b>${score('red')}</b>${this.emblem(this.side==='ct'?'t':'ct')}</span><span class="nm">${this.names.red}</span></div></div>
   <div class="stage s2"><h2 class="ghost">${title}</h2><div class="mvps">${mvp.map(a=>`<div class="mvp ${a===best?'top':''} ${a.team}">${a===best?'<em>MVP</em>':''}<span class="fig">${SOLDIER}</span><div class="card"><small>◈ ${this.ffa?(a.isPlayer?'YOU':'RIVAL'):a.team===me?this.names.blue:this.names.red}</small><b>${esc(a.name)}</b><p>Total Kills: ${a.kills}</p><strong>${a.kills*10}</strong><small>Total Score</small></div></div>`).join('')}</div></div>
   <div class="stage s3"><div class="sHead"><div class="side blue"><span class="big">${score('blue')}</span>${this.emblem(this.side)}<b>${this.names.blue}</b></div><div class="mid"><h1>SCORE</h1><span class="mode">${this.ffa?'DEATH MATCH · FREE FOR ALL':'DOMINATION · TEAM DEATHMATCH'}</span></div><div class="side red"><span class="big">${score('red')}</span>${this.emblem(this.side==='ct'?'t':'ct')}<b>${this.names.red}</b></div></div>
    ${this.ffa?`<div class="tables one"><table class="blue"><thead><tr><th></th><th>Kills</th><th>Death</th><th>Score</th></tr></thead><tbody>${ffaRows}</tbody></table></div>`:''}<div class="tables" ${this.ffa?'hidden':''}><table class="blue"><thead><tr><th></th><th>Kills</th><th>Death</th><th>Assists</th></tr></thead><tbody>${rows('blue')}</tbody></table><table class="red"><thead><tr><th></th><th>Kills</th><th>Death</th><th>Assists</th></tr></thead><tbody>${rows('red')}</tbody></table></div>
    <div class="rewards">${rewardsHtml}</div><div class="btns"><button class="again">PLAY AGAIN</button><button class="lobby">LOBBY</button></div></div>`;
  E.hidden=false;const go=n=>{this.endStage=n;E.dataset.stage=n;};go(1);this.audio?.streak?.();clearTimeout(this.endTimer);this.endTimer=setTimeout(()=>{go(2);this.endTimer=setTimeout(()=>go(3),4200);},3200);
  E.onpointerdown=e=>{if(e.target.closest('button'))return;if(this.endStage<3){clearTimeout(this.endTimer);go(this.endStage+1);if(this.endStage===2)this.endTimer=setTimeout(()=>go(3),4200);}};
  E.querySelector('.again').onclick=onAgain;E.querySelector('.lobby').onclick=onLobby;}
}
