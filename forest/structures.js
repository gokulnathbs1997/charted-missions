import * as THREE from 'three';
import {FOREST,heightAt,rand,fbm} from './world.js';
import {buildPlaces} from './places.js';
// Enemy camp, forest village, watchtowers (with climbable ladders), radio mast, fences, cover and the zip-line.
// Static parts are baked into one mesh per material (few draw calls, also used for collision).
// Door panels are separate meshes tagged userData.interactiveDoor for the existing Doors system.

function cv(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const R0=rand(321);
const TEX={
 planks:base=>cv(256,256,(x,w,h)=>{const rows=8;for(let r=0;r<rows;r++){const v=.82+R0()*.3;x.fillStyle=`rgb(${base[0]*v|0},${base[1]*v|0},${base[2]*v|0})`;x.fillRect(0,r*h/rows,w,h/rows);for(let g=0;g<14;g++){x.strokeStyle=`rgba(0,0,0,${.05+R0()*.08})`;x.beginPath();const y=r*h/rows+R0()*h/rows;x.moveTo(0,y);x.bezierCurveTo(w*.3,y+R0()*4-2,w*.6,y+R0()*4-2,w,y);x.stroke();}x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,r*h/rows,w,2);x.fillStyle='rgba(30,20,10,.5)';for(let k=0;k<3;k++)x.fillRect(R0()*w,r*h/rows+6,3,3);}}),
 logs:()=>cv(256,256,(x,w,h)=>{const rows=6;for(let r=0;r<rows;r++){const y=r*h/rows,g=x.createLinearGradient(0,y,0,y+h/rows);g.addColorStop(0,'#3d2a1a');g.addColorStop(.3,'#7d5b3c');g.addColorStop(.6,'#6a4b31');g.addColorStop(1,'#2c1e12');x.fillStyle=g;x.fillRect(0,y,w,h/rows);for(let k=0;k<20;k++){x.strokeStyle='rgba(20,10,0,.15)';x.beginPath();x.moveTo(R0()*w,y+R0()*h/rows);x.lineTo(R0()*w,y+R0()*h/rows);x.stroke();}}}),
 roof:()=>cv(256,256,(x,w,h)=>{for(let i=0;i<w;i+=16){const g=x.createLinearGradient(i,0,i+16,0);g.addColorStop(0,'#59605b');g.addColorStop(.5,'#8a918b');g.addColorStop(1,'#4b514c');x.fillStyle=g;x.fillRect(i,0,16,h);}for(let k=0;k<60;k++){x.fillStyle=`rgba(${120+R0()*60},${60+R0()*30},20,${.15+R0()*.3})`;x.beginPath();x.ellipse(R0()*w,R0()*h,2+R0()*14,2+R0()*24,0,0,7);x.fill();}}),
 concrete:()=>cv(256,256,(x,w,h)=>{x.fillStyle='#8b8a84';x.fillRect(0,0,w,h);for(let k=0;k<2500;k++){const v=100+R0()*80;x.fillStyle=`rgba(${v},${v},${v-6},.25)`;x.fillRect(R0()*w,R0()*h,2,2);}x.strokeStyle='rgba(0,0,0,.25)';x.strokeRect(0,0,w,h);}),
 sandbag:()=>cv(256,128,(x,w,h)=>{x.fillStyle='#5f5640';x.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<5;c++){const ox=(r%2)*25;x.fillStyle=`rgb(${150+R0()*25},${135+R0()*20},${95+R0()*18})`;x.beginPath();x.roundRect(c*51+ox-24,r*32+2,48,28,10);x.fill();x.strokeStyle='rgba(60,50,30,.6)';x.stroke();}}),
 chain:()=>{const t=cv(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#b9bdb9';x.lineWidth=2.4;for(let i=-w;i<w*2;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+h,h);x.stroke();x.beginPath();x.moveTo(i,h);x.lineTo(i+h,0);x.stroke();}});return t;},
 container:col=>cv(256,256,(x,w,h)=>{x.fillStyle=col;x.fillRect(0,0,w,h);for(let i=0;i<w;i+=20){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(i,0,5,h);x.fillStyle='rgba(255,255,255,.08)';x.fillRect(i+8,0,4,h);}for(let k=0;k<40;k++){x.fillStyle=`rgba(110,50,20,${.2+R0()*.3})`;x.fillRect(R0()*w,R0()*h,3+R0()*10,3+R0()*30);}}),
 door:()=>cv(128,256,(x,w,h)=>{x.fillStyle='#5b4330';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=21){x.fillStyle=`rgba(0,0,0,${.15+R0()*.15})`;x.fillRect(i,0,2,h);}x.fillStyle='#3a2a1c';x.fillRect(6,40,w-12,12);x.fillRect(6,h-52,w-12,12);x.fillRect(10,40,12,h-80);x.fillStyle='#b8a476';x.fillRect(w-22,h/2,8,16);})
};
// Box with real-world UVs (texture repeats every `tile` meters).
function box(w,h,d,tile=2){const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));let u,v;if(ax>.5){u=p.getZ(i);v=p.getY(i);}else if(ay>.5){u=p.getX(i);v=p.getZ(i);}else{u=p.getX(i);v=p.getY(i);}uv.setXY(i,u/tile,v/tile);}return g;}
export class Structures {
 constructor(scene){this.scene=scene;this.root=new THREE.Group();this.root.name='Forest structures';this.parts=new Map();this.partsVis=new Map();this.ladders=[];this.footprints=[];this.spots=[];this.towerSpots=[];this.anchors={};this.colOnly=[];this.lights=[];this.fires=[];this.R=rand(808);
  const M=(o)=>new THREE.MeshStandardMaterial({roughness:.9,metalness:0,...o});
  this.mat={wall:M({map:TEX.planks([150,118,84])}),grey:M({map:TEX.planks([128,128,118])}),logs:M({map:TEX.logs()}),roof:M({map:TEX.roof(),metalness:.3,roughness:.7}),concrete:M({map:TEX.concrete()}),sand:M({map:TEX.sandbag()}),floor:M({map:TEX.planks([110,82,58])}),
   chain:M({map:TEX.chain(),alphaTest:.5,side:THREE.DoubleSide,metalness:.5,roughness:.5,transparent:false}),steel:M({color:0x5b625e,metalness:.6,roughness:.5}),dark:M({color:0x2a2e2c,roughness:.8}),glass:M({color:0x30434c,roughness:.08,metalness:.4,transparent:true,opacity:.32,depthWrite:false}),
   red:M({map:TEX.container('#7c3426'),metalness:.4,roughness:.6}),green:M({map:TEX.container('#3e5b3c'),metalness:.4,roughness:.6}),blue:M({map:TEX.container('#2f4e6b'),metalness:.4,roughness:.6}),rope:M({color:0x8a7b5c,roughness:1}),olive:M({color:0x4b5233,roughness:.8,metalness:.2}),drum:M({color:0x5b2c1d,metalness:.5,roughness:.6})};
  this.doorMat=new THREE.MeshStandardMaterial({map:TEX.door(),roughness:.85});this.doorGeo=new THREE.BoxGeometry(1.02,2.1,.07).toNonIndexed();this.doorGeo.translate(.51,1.05,0);
  this.build();this.bake();scene.add(this.root);this.blackVeil();}
 add(geo,mat,x,y,z,ry=0,name){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=ry;m.updateMatrixWorld();if(name)m.name=name;const P=this.visOnly?this.partsVis:this.parts;(P.get(mat)||P.set(mat,[]).get(mat)).push(m);return m;}
 // v9: run fn with visual-only output (baked separately, left out of collision: steps, trims, small fittings).
 vis(fn){const v=this.visOnly;this.visOnly=true;try{return fn();}finally{this.visOnly=v;}}
 // Place a group-local point into world (used for houses with rotation).
 frame(cx,cz,ry,y0){const c=Math.cos(ry),s=Math.sin(ry);return (lx,ly,lz)=>[cx+lx*c+lz*s,y0+ly,cz-lx*s+lz*c];}
 wallWithDoors(T,ry,mat,lx,lz,len,h,along,doors=[]){// wall centered at (lx,lz) local; along='x' or 'z'
  const t=.18;let cuts=[...doors].sort((a,b)=>a-b),start=-len/2;const seg=(a,b)=>{if(b-a<.05)return;const mid=(a+b)/2,w=b-a;const [x,y,z]=T(along==='x'?lx+mid:lx,h/2,along==='x'?lz:lz+mid);this.add(box(along==='x'?w:t,h,along==='x'?t:w),mat,x,y,z,ry);};
  for(const d of cuts){seg(start,d-.55);const [x,y,z]=T(along==='x'?lx+d:lx,2.2+(h-2.2)/2,along==='x'?lz:lz+d);this.add(box(along==='x'?1.1:t,h-2.2,along==='x'?t:1.1),mat,x,y,z,ry);
   const [dx,dy,dz]=T(along==='x'?lx+d-.51:lx,0,along==='x'?lz:lz+d-.51);const door=new THREE.Mesh(this.doorGeo,this.doorMat);door.position.set(dx,dy+.02,dz);door.rotation.y=ry+(along==='x'?0:-Math.PI/2);door.userData.interactiveDoor=true;door.name='Door';this.root.add(door);start=d+.55;}
  seg(start,len/2);}
 house({x,z,ry=0,w=10,d=7,h=3.1,mat=this.mat.wall,front=[0],back=[],inner=null,porch=false,roofMat=this.mat.roof,name='House',windows=true}){const y0=heightAt(x,z)+.02,T=this.frame(x,z,ry,y0);
  const [fx,fy,fz]=T(0,-.01,0);this.add(box(w,.1,d),this.mat.floor,fx,fy,fz,ry);
  this.wallWithDoors(T,ry,mat,0,d/2,w,h,'x',front);this.wallWithDoors(T,ry,mat,0,-d/2,w,h,'x',back);this.wallWithDoors(T,ry,mat,-w/2,0,d,h,'z',[]);this.wallWithDoors(T,ry,mat,w/2,0,d,h,'z',[]);
  if(inner!=null){this.wallWithDoors(T,ry,mat,inner,0,d-.2,h,'z',[0]);}
  // Gable roof (two slabs) + gable triangles approximated by stepped boards.
  const pitch=.42,half=d/2+.45,slab=half/Math.cos(pitch);for(const side of [-1,1]){const g=box(w+.8,.1,slab,2.5);const m=new THREE.Mesh(g,roofMat);const [rx,ry2,rz]=T(0,h+Math.tan(pitch)*half/2,side*half/2);m.position.set(rx,ry2,rz);m.rotation.set(0,ry,0);m.rotateX(side*pitch);m.updateMatrixWorld();this.parts.get(roofMat)?.push(m)||this.parts.set(roofMat,[m]);}
  for(const side of [-1,1])for(let k=0;k<5;k++){const hh=Math.tan(pitch)*half*(1-k/5),ww=d*(1-k/5);const [gx,gy,gz]=T(side*w/2,h+k*hh/5+hh/10-hh*0+k*0,0);this.add(box(.14,Math.tan(pitch)*half/5,ww),mat,gx,h+y0+(k+.5)*Math.tan(pitch)*half/5,gz,ry);}
  if(windows)for(const side of [-1,1])for(const off of [-w/3.2,w/3.2]){if(front.some(f=>Math.abs(f-off)<1.2)&&side===1)continue;const [wx,wy,wz]=T(off,1.6,side*(d/2+.1));this.add(box(1.1,.9,.05),this.mat.glass,wx,wy,wz,ry);const [bx,by,bz]=T(off,1.6,side*(d/2+.12));this.add(box(1.3,.12,.08),this.mat.dark,bx,by+.5,bz,ry);this.add(box(1.3,.12,.08),this.mat.dark,bx,by-.5,bz,ry);}
  if(porch){const [px,py,pz]=T(0,.1,d/2+1.3);this.add(box(w*.6,.2,2.4),this.mat.floor,px,py,pz,ry);for(const sx of [-1,1]){const [qx,qy,qz]=T(sx*w*.28,1.35,d/2+2.3);this.add(box(.16,2.7,.16),this.mat.wall,qx,qy,qz,ry);}const [rx2,ry3,rz2]=T(0,2.75,d/2+1.4);this.add(box(w*.62,.1,2.8),roofMat,rx2,ry3,rz2,ry);}
  this.footprints.push({x,z,w,d,ry,name});const inside=[];for(const sx of [-.28,.28])inside.push(new THREE.Vector3(...T(sx*w,0,-d*.15)));this.spots.push(...inside.map(p=>({pos:p,indoor:true})));return T;}
 bunk(T,ry,lx,lz){const [x,y,z]=T(lx,.5,lz);this.add(box(.95,.12,2),this.mat.steel,x,y,z,ry);this.add(box(.95,.12,2),this.mat.steel,x,y+1,z,ry);const [a,b,c]=T(lx,.62,lz);this.add(box(.85,.14,1.9),this.mat.olive,a,b,c,ry);}
 table(T,ry,lx,lz,name){const [x,y,z]=T(lx,.78,lz);this.add(box(1.8,.08,.9),this.mat.floor,x,y,z,ry);for(const [ox,oz] of [[-.8,-.38],[.8,-.38],[-.8,.38],[.8,.38]]){const [a,b,c]=T(lx+ox,.39,lz+oz);this.add(box(.07,.78,.07),this.mat.dark,a,b,c,ry);}return new THREE.Vector3(x,y,z);}
 crate(x,z,s=1.1,ry=0,stack=1){for(let i=0;i<stack;i++)this.add(box(s,s,s,s),this.mat.floor,x,heightAt(x,z)+s/2+i*s,z,ry+i*.3);}
 drum(x,z){const g=new THREE.CylinderGeometry(.3,.3,.9,12).toNonIndexed();this.add(g,this.mat.drum,x,heightAt(x,z)+.45,z);}
 sandbags(x,z,ry,len=4,curve=0){const n=Math.ceil(len/1.1);for(let i=0;i<n;i++){const t=n>1?i/(n-1)-.5:0,a=ry+t*curve;const px=x+Math.cos(ry)*t*len+Math.sin(ry)*Math.abs(t)*curve*1.5,pz=z-Math.sin(ry)*t*len+Math.cos(ry)*Math.abs(t)*curve*1.5;this.add(box(1.15,1.05,.65,1.15),this.mat.sand,px,heightAt(px,pz)+.52,pz,a);}}
 container(x,z,ry,mat){this.add(box(6,2.6,2.45,2.6),mat,x,heightAt(x,z)+1.3,z,ry);}
 tower(x,z,ry,{height=5.6,size=3.2}={}){const y0=heightAt(x,z),T=this.frame(x,z,ry,y0),s=size/2;
  for(const [a,b] of [[-s,-s],[s,-s],[-s,s],[s,s]]){const [px,py,pz]=T(a,(height+2.6)/2,b);this.add(box(.22,height+2.6,.22,1),this.mat.wall,px,py,pz,ry);}
  const [fx,fy,fz]=T(0,height,0);this.add(box(size+.3,.16,size+.3),this.mat.floor,fx,fy,fz,ry);
  // Railings: three closed sides, ladder side (local +z) has a gap.
  const [r1x,r1y,r1z]=T(0,height+.55,-s);this.add(box(size,.95,.08),this.mat.wall,r1x,r1y,r1z,ry);const [r2x,r2y,r2z]=T(-s,height+.55,0);this.add(box(.08,.95,size),this.mat.wall,r2x,r2y,r2z,ry);const [r3x,r3y,r3z]=T(s,height+.55,0);this.add(box(.08,.95,size),this.mat.wall,r3x,r3y,r3z,ry);
  for(const sx of [-1,1]){const [qx,qy,qz]=T(sx*(s-.45),height+.55,s);this.add(box(.9,.95,.08),this.mat.wall,qx,qy,qz,ry);}
  const [sx2,sy2,sz2]=T(0,height+.35,-s+.05);this.add(box(size-.3,.7,.5),this.mat.sand,sx2,sy2,sz2,ry);
  const [ox,oy,oz]=T(0,height+2.65,0);this.add(box(size+.9,.1,size+.9,2.5),this.mat.roof,ox,oy,oz,ry);
  // Cross bracing.
  for(const b of [-s,s]){const g=box(.1,Math.hypot(size,height)*1.0,.1);const m=this.add(g,this.mat.wall,...T(0,height/2,b),ry);m.rotateZ(Math.atan2(size,height));m.updateMatrixWorld();}
  const top=new THREE.Vector3(...T(0,height+.1,s-.7)),bottom=new THREE.Vector3(...T(0,0,s+.62));this.ladder(T,ry,0,s+.18,height+1.05,y0);
  const out=new THREE.Vector3(Math.sin(ry),0,Math.cos(ry));// local +z in world
  this.ladders.push({bottom,top,base:new THREE.Vector3(...T(0,0,s+.18)),out,height:height+.1,y0,ry,name:'Watchtower ladder'});
  this.towerSpots.push({pos:new THREE.Vector3(...T(0,height+.08,-.2)),indoor:false,stationary:true,yaw:ry+Math.PI});this.footprints.push({x,z,w:size,d:size,ry,name:'Watchtower'});}
 ladder(T,ry,lx,lz,h,y0){for(const sx of [-.24,.24]){const [x,y,z]=T(lx+sx,h/2,lz);this.add(box(.07,h,.07,1),this.mat.steel,x,y,z,ry);}for(let k=.3;k<h;k+=.32){const [x,y,z]=T(lx,k,lz);this.add(box(.48,.04,.04,1),this.mat.steel,x,y,z,ry);}}
 mast(x,z,h=20){const y0=heightAt(x,z),s=1.1;const saved=this.parts;this.parts=new Map();for(const [a,b] of [[-s,-s],[s,-s],[-s,s],[s,s]]){const g=new THREE.CylinderGeometry(.05,.09,h,6).toNonIndexed();const m=this.add(g,this.mat.steel,x+a*.55,y0+h/2,z+b*.55);m.rotation.set(-b*.05,0,a*.05);m.updateMatrixWorld();}
  for(let k=1.5;k<h;k+=1.8){const w=s*1.1*(1-k/h*.5)+.2;for(const [dx,dz,rx] of [[0,-w/2,0],[0,w/2,0],[-w/2,0,1],[w/2,0,1]]){this.add(box(rx?.05:w,.05,rx?w:.05,1),this.mat.steel,x+dx,y0+k,z+dz);}}
  this.add(new THREE.CylinderGeometry(.04,.04,6,6).toNonIndexed(),this.mat.steel,x,y0+h+3,z);this.add(new THREE.CylinderGeometry(.5,.5,.1,16).toNonIndexed(),this.mat.steel,x+.5,y0+h-2,z);
  const mastParts=this.parts;this.parts=saved;this.mastGroup=new THREE.Group();this.mastGroup.position.set(x,y0,z);this.scene.add(this.mastGroup);for(const [mat,list] of mastParts)for(const m of list){m.position.sub(this.mastGroup.position);m.updateMatrixWorld();this.mastGroup.add(m);m.castShadow=true;}this.mastPos=new THREE.Vector3(x,y0,z);this.anchors.mast=new THREE.Vector3(x-1.4,y0,z+1.2);this.mastTop=new THREE.Vector3(x,y0+h+5,z);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),new THREE.MeshBasicMaterial({color:0xff2a14}));bulb.position.copy(this.mastTop).sub(this.mastGroup.position);this.mastGroup.add(bulb);this.mastBulb=bulb;}
 fence(x0,x1,z0,z1,gate){const H=2.6,post=(x,z)=>this.add(box(.12,H+.2,.12,1),this.mat.steel,x,heightAt(x,z)+H/2,z);const panel=(ax,az,bx,bz)=>{const len=Math.hypot(bx-ax,bz-az),ry=-Math.atan2(bz-az,bx-ax);const g=box(len,H,.03,2.5);const m=this.add(g,this.mat.chain,(ax+bx)/2,heightAt((ax+bx)/2,(az+bz)/2)+H/2+.05,(az+bz)/2,ry);const wire=box(len,.05,.05,1);this.add(wire,this.mat.steel,(ax+bx)/2,heightAt(ax,az)+H+.1,(az+bz)/2,ry);};
  const edge=(ax,az,bx,bz)=>{const len=Math.hypot(bx-ax,bz-az),n=Math.ceil(len/4);for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,px=ax+(bx-ax)*t0,pz=az+(bz-az)*t0,qx=ax+(bx-ax)*t1,qz=az+(bz-az)*t1;const mid=[(px+qx)/2,(pz+qz)/2];if(gate&&Math.abs(mid[1]-gate.z)<.5&&Math.abs(mid[0]-gate.x)<gate.w/2)continue;post(px,pz);panel(px,pz,qx,qz);}};
  edge(x0,z0,x1,z0);edge(x1,z0,x1,z1);edge(x1,z1,x0,z1);edge(x0,z1,x0,z0);
  if(gate){for(const sx of [-1,1])this.add(box(.35,4,.35,1),this.mat.concrete,gate.x+sx*gate.w/2,2,gate.z);this.add(box(gate.w+.6,.4,.4,1),this.mat.steel,gate.x,4,gate.z);const bar=this.add(box(gate.w*.9,.12,.12,1),this.mat.red,gate.x-.2,1.1,gate.z+.6);}}
 truck(x,z,ry){const y0=heightAt(x,z),T=this.frame(x,z,ry,y0);const [a,b,c]=T(0,1.55,1.2);this.add(box(2.4,2.1,2.2),this.mat.olive,a,b,c,ry);const [d,e,f]=T(0,1.3,-1.8);this.add(box(2.5,1.1,4.2),this.mat.olive,d,e,f,ry);const [g,h,i]=T(0,2.45,-1.8);this.add(box(2.5,1.6,4.2,3),this.mat.dark,g,h,i,ry);const [gx,gy,gz]=T(0,2,2.32);this.add(box(2,.7,.05),this.mat.glass,gx,gy,gz,ry);
  for(const [lx,lz] of [[-1.15,1.3],[1.15,1.3],[-1.15,-1.2],[1.15,-1.2],[-1.15,-2.9],[1.15,-2.9]]){const w=new THREE.CylinderGeometry(.5,.5,.35,14).toNonIndexed();w.rotateZ(Math.PI/2);const [wx,wy,wz]=T(lx,.5,lz);this.add(w,this.mat.dark,wx,wy,wz,ry);}}
 fire(x,z){const y=heightAt(x,z);for(let i=0;i<7;i++){const a=i/7*6.283;const l=new THREE.CylinderGeometry(.07,.07,1,5).toNonIndexed();l.rotateZ(Math.PI/2);const m=this.add(l,this.mat.logs,x+Math.cos(a)*.3,y+.1,z+Math.sin(a)*.3,a);}for(let i=0;i<9;i++){const a=i/9*6.283;this.add(box(.3,.22,.25,1),this.mat.concrete,x+Math.cos(a)*.75,y+.1,z+Math.sin(a)*.75,a);}
  const light=new THREE.PointLight(0xff9a40,8,14,1.6);light.position.set(x,y+.8,z);this.scene.add(light);const flame=new THREE.Mesh(new THREE.ConeGeometry(.28,.8,8,1,true),new THREE.MeshBasicMaterial({color:0xffa340,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));flame.position.set(x,y+.45,z);this.scene.add(flame);this.fires.push({light,flame,base:y});}
 zipline(from,to){this.zip={from:from.clone(),to:to.clone()};// anchor posts
  for(const p of [from,to]){const ground=heightAt(p.x,p.z),hgt=p.y-ground+.6;this.add(new THREE.CylinderGeometry(.14,.18,hgt,8).toNonIndexed(),this.mat.wall,p.x,ground+hgt/2,p.z);this.add(box(.9,.12,.12,1),this.mat.steel,p.x,p.y+.35,p.z);}
  const dir=to.clone().sub(from),len=dir.length();const cable=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,len,6),new THREE.MeshStandardMaterial({color:0x2b2b2b,metalness:.8,roughness:.3}));cable.position.copy(from).add(to).multiplyScalar(.5);cable.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());this.scene.add(cable);
  // Small wooden platform at the top.
  const g=heightAt(from.x,from.z);this.add(box(2.6,.2,2.6),this.mat.floor,from.x-dir.x*1.2,g+.1,from.z-dir.z*1.2);}
 build(){const R=this.R,m=this.mat;
  // Camp perimeter and gate.
  this.fence(-56,56,-46,46,{x:4,z:46,w:9});
  // Barracks, command house, storage shed.
  let T=this.house({x:-30,z:-22,w:13,d:7,front:[0],back:[3],name:'Barracks A'});for(const lx of [-4.8,-2.8,2.8,4.8])this.bunk(T,0,lx,-1.8);this.anchors.barracksA=this.table(T,0,4.2,1.9);this.anchors.barracksAFloor=new THREE.Vector3(...T(-3,0,1.6));
  T=this.house({x:-30,z:10,w:13,d:7,front:[-2],back:[],name:'Barracks B',mat:m.grey});for(const lx of [-4.8,-2.8,2.8,4.8])this.bunk(T,0,lx,-1.8);this.anchors.barracksB=new THREE.Vector3(...T(3.5,0,1.8));
  T=this.house({x:22,z:12,w:11,d:8,front:[-2.6],inner:1.5,porch:true,name:'Command house'});this.intelSpot=this.table(T,0,3.4,-1.6);this.table(T,0,-3,-2.2);this.consoleSpot=new THREE.Vector3(...T(-3,0,-2.2+.9));this.anchors.intel=this.intelSpot;this.anchors.console=this.table(T,0,-3,-2.2);this.anchors.prisoner=new THREE.Vector3(...T(3.8,0,1.6));this.anchors.commandFloor=new THREE.Vector3(...T(-3,0,1.5));
  T=this.house({x:24,z:-20,w:8,d:6,front:[0],mat:m.roof,roofMat:m.roof,name:'Storage shed',windows:false});this.anchors.shed=new THREE.Vector3(...T(0,0,-1.9));this.crate(...T(-2.5,0,-1.5).filter((_,i)=>i!==1),1);this.crate(...T(2.4,0,-1.6).filter((_,i)=>i!==1),1,0,2);
  T=this.house({x:-6,z:36,w:4,d:3.4,front:[0],name:'Gate booth',windows:true});this.anchors.gateBooth=new THREE.Vector3(...T(.6,0,-1.45));
  // Watchtowers in the four corners (ladders face inward).
  this.tower(-50,-40,Math.PI*.25);this.tower(50,-40,-Math.PI*.25);this.tower(-50,40,Math.PI*.75);this.tower(50,40,-Math.PI*.75);
  // Radio mast with generator hut.
  this.mast(40,-30);T=this.house({x:33,z:-36,w:4.5,d:3.5,front:[0],mat:m.roof,name:'Generator hut',windows:false});this.anchors.genHut=new THREE.Vector3(...T(-1.2,0,-1.5));this.anchors.fuel=new THREE.Vector3(38,0,-37.5);for(let i=0;i<4;i++)this.drum(37+i*.7,-38.5);
  // Cover: sandbags, containers, crates, truck.
  this.sandbags(4,40,0,5,.6);this.sandbags(-14,-38,0,4.5,.5);this.sandbags(10,-6,Math.PI/2,4,.4);this.sandbags(-46,0,Math.PI/2,4.5,.5);
  this.container(4,-30,0,m.red);this.container(4,-27.4,0,m.blue);this.container(-8,-6,Math.PI/2,m.green);this.container(40,10,Math.PI/2,m.red);this.container(40,2,Math.PI/2,m.green);
  this.truck(-12,26,Math.PI*.9);this.truck(14,28,-Math.PI*.1);
  for(const [x,z,s] of [[-6,-36,2],[12,-14,1],[30,30,2],[-40,26,1],[-44,-14,2],[16,40,1],[45,-12,1]])this.crate(x,z,1.1,R()*1.5,s);
  // Forest village: log cabins around a camp fire.
  const v=FOREST.village;this.cabins=[];for(const [dx,dz,ry] of [[-10,-9,.3],[9,-10,-.4],[-9,10,2.8],[10,9,-2.6]]){const T2=this.house({x:v.x+dx,z:v.z+dz,ry,w:6,d:5,h:2.8,mat:m.logs,front:[0],name:'Cabin',windows:true});this.cabins.push({T:T2,ry,pos:new THREE.Vector3(...T2(0,0,0))});this.anchors['cabin'+(this.cabins.length-1)]=this.table(T2,ry,1.4,-1.4);}
  this.fire(v.x,v.z);for(let i=0;i<5;i++){const a=i*1.3;this.add(box(1.6,.35,.35,1),m.logs,v.x+Math.cos(a)*2.4,heightAt(v.x,v.z)+.18,v.z+Math.sin(a)*2.4,a);}
  // Zip-line from the forest ridge down into the camp.
  const r=FOREST.ridge,fromY=heightAt(r.x,r.z)+2.4,to=new THREE.Vector3(30,3.0,-22);this.zipline(new THREE.Vector3(r.x-2,fromY,r.z+2),to);
  // Extraction pad and LZ markers.
  for(const p of [FOREST.extraction]){const y=heightAt(p.x,p.z);const pad=new THREE.Mesh(new THREE.RingGeometry(5,5.6,40),new THREE.MeshBasicMaterial({color:0xe9e3c4,side:THREE.DoubleSide}));pad.rotation.x=-Math.PI/2;pad.position.set(p.x,y+.06,p.z);this.scene.add(pad);const hMark=new THREE.Mesh(new THREE.PlaneGeometry(3,3.6),new THREE.MeshBasicMaterial({map:cv(64,64,(x)=>{x.fillStyle='#e9e3c4';x.font='bold 60px Arial';x.textAlign='center';x.fillText('H',32,54);}),transparent:true}));hMark.rotation.x=-Math.PI/2;hMark.position.set(p.x,y+.07,p.z);this.scene.add(hMark);}
  // Outdoor patrol spots.
  for(const [x,z] of [[0,30],[-20,-5],[12,-36],[36,22],[-38,-34],[44,-22],[-48,18],[10,0],[-14,40],[30,-6]])this.spots.push({pos:new THREE.Vector3(x,0,z),indoor:false});
  for(const c of this.cabins)this.spots.push({pos:c.T(0,0,-.6).length?new THREE.Vector3(...c.T(0,0,-.6)):null,indoor:true});
  // v9: Kessel Docks (river outpost) and Old Kessel (town) — see places.js. Their guard posts live in siteSpots, not spots.
  buildPlaces(this);}
 bake(){for(const [vis,src] of [[false,this.parts],[true,this.partsVis]])for(const [mat,meshes] of src){const geos=meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);return g;});const total=geos.reduce((a,g)=>a+g.attributes.position.count,0);const pos=new Float32Array(total*3),nor=new Float32Array(total*3),uv=new Float32Array(total*2);let o=0;for(const g of geos){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.computeBoundingSphere();const mesh=new THREE.Mesh(out,mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='Baked '+(mat===this.mat.chain?'fence':'structure')+(vis?' (visual)':'');if(vis)mesh.userData.nocol=true;this.root.add(mesh);}this.parts.clear();this.partsVis.clear();}
 // ---------- Operation Black Veil set dressing: comms facility, searchlights, alarm beacons ----------
 blackVeil(){const sc=this.scene,y0=heightAt(22,12)+.02,T=this.frame(22,12,0,y0);this.anchors.commandPorch=new THREE.Vector3(...T(-2.6,0,5.6));this.doorFace=new THREE.Vector3(...T(-2.6,0,0));
  const dark=new THREE.MeshStandardMaterial({color:0x1d2124,roughness:.5,metalness:.6});
  // Server rack with blinking LEDs (canvas texture redrawn every few frames).
  const led=document.createElement('canvas');led.width=64;led.height=128;this.ledCanvas=led;this.ledTex=new THREE.CanvasTexture(led);this.ledTex.colorSpace=THREE.SRGBColorSpace;
  const rack=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.9,2,.7),dark);body.position.y=1;rack.add(body);const face=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.86),new THREE.MeshStandardMaterial({map:this.ledTex,emissiveMap:this.ledTex,emissive:0xffffff,emissiveIntensity:1.6,roughness:.4}));face.position.set(0,1,.36);rack.add(face);
  for(const lx of [-4.6,-.6]){const r=rack.clone();r.position.set(...T(lx,0,-3.4));sc.add(r);}
  const glow=new THREE.PointLight(0x4fd0ff,14,10,1.4);glow.position.set(...T(-2.6,1.6,-2.2));sc.add(glow);
  // Countdown terminal on the back wall.
  const scr=document.createElement('canvas');scr.width=256;scr.height=128;this.screenCanvas=scr;this.screenTex=new THREE.CanvasTexture(scr);this.screenTex.colorSpace=THREE.SRGBColorSpace;
  const mon=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),new THREE.MeshStandardMaterial({map:this.screenTex,emissiveMap:this.screenTex,emissive:0xffffff,emissiveIntensity:1.8}));mon.position.set(...T(-2.6,1.85,-3.84));sc.add(mon);this.countdown=1200;
  // Satellite dish on the roof.
  const dish=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,1.4,8),dark);pole.position.y=.7;dish.add(pole);const bowl=new THREE.Mesh(new THREE.SphereGeometry(1.3,20,10,0,Math.PI*2,0,Math.PI*.32),new THREE.MeshStandardMaterial({color:0xd9dcd6,roughness:.45,metalness:.3,side:THREE.DoubleSide}));bowl.rotation.x=-Math.PI*.62;bowl.position.y=1.6;dish.add(bowl);dish.position.set(...T(-3,3.25,-1));dish.rotation.y=-.6;sc.add(dish);
  // Red alarm beacons (command house + gate) with one shared red light.
  this.beacons=[];const bm=new THREE.MeshStandardMaterial({color:0x550000,emissive:0xff1a0a,emissiveIntensity:0});for(const p of [T(4.8,3.35,3.6),[-6,heightAt(-6,36)+2.6,36],[33,heightAt(33,-36)+2.4,-36]]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.3,12),bm);b.position.set(...p);sc.add(b);this.beacons.push(b);}
  this.beaconMat=bm;this.alarmLight=new THREE.PointLight(0xff2010,0,26,1.6);this.alarmLight.position.set(...T(0,3.8,5));sc.add(this.alarmLight);
  // Floodlights over the barracks doors.
  for(const [x,z] of [[-30,-18.4],[-32,13.6]]){const f=new THREE.Mesh(new THREE.BoxGeometry(.5,.2,.25),new THREE.MeshStandardMaterial({color:0x222,emissive:0xfff3d6,emissiveIntensity:2.2}));f.position.set(x,heightAt(x,z)+3.0,z);sc.add(f);}
  // Watchtower searchlights: lamp + volumetric beam (two cast real light).
  this.searchlights=[];const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uOn:{value:1}}]),
   vertexShader:'varying float vZ;varying vec3 vN,vV;varying float vDist;\n#include <fog_pars_vertex>\nvoid main(){vZ=position.z;vec4 mvPosition=modelViewMatrix*vec4(position,1.);vDist=-mvPosition.z;vN=normalize(normalMatrix*normal);vV=normalize(-mvPosition.xyz);gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
   fragmentShader:'uniform float uOn;varying float vZ;varying vec3 vN,vV;varying float vDist;\n#include <fog_pars_fragment>\nvoid main(){float along=1.-clamp(vZ/48.,0.,1.);float edge=pow(abs(dot(vN,vV)),2.2);float near=1.-smoothstep(60.,240.,vDist);gl_FragColor=vec4(vec3(1.,.95,.82)*along*along*edge*.13*uOn*(.25+.75*near),1.);\n#include <fog_fragment>\n}'});this.beamMat=beamMat;
  const cone=new THREE.ConeGeometry(7,48,28,1,true);cone.rotateX(-Math.PI/2);cone.translate(0,0,24);
  [[50,-40],[50,40],[-50,-40],[-50,40]].forEach(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,heightAt(x,z)+7.6,z);const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.32,.26,.55,14),new THREE.MeshStandardMaterial({color:0x222,emissive:0xfff2d0,emissiveIntensity:3}));lamp.rotation.x=Math.PI/2;g.add(lamp);const beam=new THREE.Mesh(cone,beamMat);beam.renderOrder=5;g.add(beam);sc.add(g);
   let light=null;if(i<2){light=new THREE.SpotLight(0xfff2d0,0,95,.17,.75,1.4);light.position.set(0,0,0);g.add(light);const tgt=new THREE.Object3D();tgt.position.set(0,0,10);g.add(tgt);light.target=tgt;}
   this.searchlights.push({g,light,base:Math.atan2(-x,-z),phase:i*1.7,on:true});});
  this.setSearchlights(false);}
 setSearchlights(on){this.lightsOn=on;for(const s of this.searchlights){s.g.visible=on;if(s.light)s.light.intensity=on?260:0;}}
 setAlarm(on){this.alarmOn=on;}
 // Point one searchlight at a world position (cinematics).
 aimSearchlight(i,p){const s=this.searchlights[i];if(s){s.force=p?p.clone():null;}}
 updateBlackVeil(dt,t){if(this.searchlights&&this.lightsOn)for(const s of this.searchlights){if(s.force){s.g.lookAt(s.force);}else{const yaw=s.base+Math.sin(t*.35+s.phase)*(this.alarmOn?1.2:.75)+(this.alarmOn?Math.sin(t*1.3+s.phase)*.4:0);s.g.rotation.set(0,0,0);s.g.rotation.y=yaw;s.g.rotateX(.42+Math.sin(t*.27+s.phase)*.12);}}
  if(this.beaconMat){const k=this.alarmOn?(Math.sin(t*9)>0?1:.15):0;this.beaconMat.emissiveIntensity=k*4;this.alarmLight.intensity=this.alarmOn?(Math.sin(t*9)*.5+.5)*9:0;for(const b of this.beacons)b.rotation.y+=dt*8;}
  if(this.ledCanvas&&((t*12)|0)!==this.ledTick){this.ledTick=(t*12)|0;const x=this.ledCanvas.getContext('2d');x.fillStyle='#07090b';x.fillRect(0,0,64,128);for(let r=0;r<20;r++)for(let c=0;c<6;c++){if(Math.random()<.45){x.fillStyle=Math.random()<.18?'#ff5a2a':Math.random()<.5?'#4fe07a':'#5ad0ff';x.fillRect(6+c*9,4+r*6,5,2);}}this.ledTex.needsUpdate=true;
   const sx=this.screenCanvas.getContext('2d'),cd=Math.max(0,this.countdown|0);sx.fillStyle='#04100c';sx.fillRect(0,0,256,128);sx.fillStyle='#ff4a3a';sx.font='bold 15px monospace';sx.fillText('SAT-KEY TRANSFER',12,24);sx.fillStyle='#8af7c0';sx.font='bold 46px monospace';sx.fillText(String(cd/60|0).padStart(2,'0')+':'+String(cd%60).padStart(2,'0'),12,78);sx.fillStyle='#2b6';sx.fillRect(12,96,232*(1-cd/1200),10);sx.strokeStyle='#2b6';sx.strokeRect(12,96,232,10);this.screenTex.needsUpdate=true;}}
 update(dt,t){this.updateBlackVeil(dt,t);for(const f of this.fires){const k=.75+Math.sin(t*13)*.12+Math.sin(t*7.3)*.1;f.light.intensity=8*k;f.flame.scale.set(1,k*1.15,1);}if(this.mastBulb)this.mastBulb.visible=Math.sin(t*3)>0;}
}
