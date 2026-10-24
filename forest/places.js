import * as THREE from 'three';
import {SITES,heightAt,rand} from './world.js';
// v9 places on the valley map:
//  · KESSEL DOCKS — a militia river outpost on the east bank: concrete quay, T-pier with a moored patrol boat,
//    boathouse, two-storey harbour office (roof access), fuel tanks, MG nests, a watchtower and water ladders.
//  · OLD KESSEL — a small walled-off town north-west of the village: streets, a central square, multi-storey
//    buildings with real interiors (stairwells between floors, doors, window openings), rooftop terraces with
//    parapets, fire-escape ladders, a balcony you can climb onto, cars, market stalls and barricades.
// Everything is built through the Structures helpers so it is baked, shadowed and collidable like the camp.
// Stair ramps are collision-only (Structures.colOnly) so the visible steps can be proper steps.

function cv(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const R1=rand(9091);
const TX={
 plaster:(base)=>cv(256,256,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);for(let k=0;k<2600;k++){const v=R1();x.fillStyle=`rgba(${v<.5?0:255},${v<.5?0:255},${v<.5?0:255},${.03+R1()*.05})`;x.fillRect(R1()*w,R1()*h,1+R1()*3,1+R1()*3);}
  for(let k=0;k<4;k++){const gx=R1()*w,g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(40,32,24,0)');g.addColorStop(1,'rgba(40,32,24,.09)');x.fillStyle=g;x.fillRect(gx,0,10+R1()*30,h);}
  x.fillStyle='rgba(30,26,20,.25)';x.fillRect(0,h-26,w,26);for(let k=0;k<12;k++){x.strokeStyle='rgba(50,40,30,.18)';x.beginPath();let px=R1()*w,py=R1()*h;x.moveTo(px,py);for(let i=0;i<5;i++){px+=(R1()-.5)*30;py+=R1()*20;x.lineTo(px,py);}x.stroke();}}),
 brick:()=>cv(256,256,(x,w,h)=>{x.fillStyle='#8f8576';x.fillRect(0,0,w,h);const bh=16,bw=48;for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=(r%2)*bw/2,v=.75+R1()*.35;x.fillStyle=`rgb(${150*v|0},${74*v|0},${54*v|0})`;x.fillRect(c*bw+ox+2,r*bh+2,bw-4,bh-4);}}),
 asphalt:()=>cv(256,256,(x,w,h)=>{x.fillStyle='#3d3f40';x.fillRect(0,0,w,h);for(let k=0;k<5000;k++){const v=40+R1()*60;x.fillStyle=`rgba(${v},${v},${v},.5)`;x.fillRect(R1()*w,R1()*h,2,2);}for(let k=0;k<6;k++){x.strokeStyle='rgba(15,15,15,.5)';x.lineWidth=1.5;x.beginPath();let px=R1()*w,py=R1()*h;x.moveTo(px,py);for(let i=0;i<6;i++){px+=(R1()-.5)*40;py+=(R1()-.5)*40;x.lineTo(px,py);}x.stroke();}}),
 pavers:()=>cv(256,256,(x,w,h)=>{x.fillStyle='#5f5a52';x.fillRect(0,0,w,h);const s=32;for(let r=0;r<h/s;r++)for(let c=0;c<w/s;c++){const v=.8+R1()*.3;x.fillStyle=`rgb(${150*v|0},${142*v|0},${128*v|0})`;x.fillRect(c*s+2,r*s+2,s-4,s-4);}}),
 roofTile:()=>cv(256,256,(x,w,h)=>{x.fillStyle='#6b6964';x.fillRect(0,0,w,h);for(let k=0;k<3000;k++){const v=80+R1()*70;x.fillStyle=`rgba(${v},${v},${v-4},.35)`;x.fillRect(R1()*w,R1()*h,2,2);}x.strokeStyle='rgba(20,20,20,.3)';for(let i=0;i<w;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}}),
 awning:(a,b)=>cv(128,128,(x,w,h)=>{for(let i=0;i<w;i+=16){x.fillStyle=(i/16)%2?a:b;x.fillRect(i,0,16,h);}x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,h-10,w,10);}),
 sign:(text,bg,fg)=>{const t=cv(512,128,(x,w,h)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.lineWidth=6;x.strokeRect(8,8,w-16,h-16);x.fillStyle=fg;x.font='bold 64px Georgia, serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+4);});t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;},
 hull:()=>cv(256,128,(x,w,h)=>{x.fillStyle='#3e4a44';x.fillRect(0,0,w,h);x.fillStyle='#22282a';x.fillRect(0,h*.72,w,h*.28);for(let k=0;k<40;k++){x.fillStyle=`rgba(120,60,30,${.15+R1()*.25})`;x.fillRect(R1()*w,R1()*h*.7,2+R1()*6,4+R1()*16);}x.fillStyle='#d8d2c0';x.font='bold 30px Arial';x.fillText('PB-07',20,50);})
};
function box(w,h,d,tile=2){const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));let u,v;if(ax>.5){u=p.getZ(i);v=p.getY(i);}else if(ay>.5){u=p.getX(i);v=p.getZ(i);}else{u=p.getX(i);v=p.getY(i);}uv.setXY(i,u/tile,v/tile);}return g;}
const cyl=(rt,rb,h,seg=14)=>new THREE.CylinderGeometry(rt,rb,h,seg).toNonIndexed();

// A placement frame: local (lx,ly,lz) with rotation ry around a world centre at ground height y0.
class Frame{
 constructor(S,x,z,ry,y0){this.S=S;this.x=x;this.z=z;this.ry=ry;this.y0=y0;this.c=Math.cos(ry);this.s=Math.sin(ry);}
 w(lx,ly,lz){return [this.x+lx*this.c+lz*this.s,this.y0+ly,this.z-lx*this.s+lz*this.c];}
 v(lx,ly,lz){return new THREE.Vector3(...this.w(lx,ly,lz));}
 dir(ox,oz){return new THREE.Vector3(ox*this.c+oz*this.s,0,-ox*this.s+oz*this.c);}
 sub(lx,lz,lry,ly=0){const [x,y,z]=this.w(lx,ly,lz);return new Frame(this.S,x,z,this.ry+lry,y);}
 // box with its BOTTOM at ly (most things sit on something)
 box(w,h,d,mat,lx,ly,lz,lry=0,tile=2){const [x,y,z]=this.w(lx,ly+h/2,lz);return this.S.add(box(w,h,d,tile),mat,x,y,z,this.ry+lry);}
 geo(g,mat,lx,ly,lz,lry=0){const [x,y,z]=this.w(lx,ly,lz);return this.S.add(g,mat,x,y,z,this.ry+lry);}
 // collision-only box (centre at ly), optional tilt around local x/z axes
 col(w,h,d,lx,ly,lz,lry=0,rx=0,rz=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d));m.position.set(...this.w(lx,ly,lz));m.rotation.order='YXZ';m.rotation.set(rx,this.ry+lry,rz);m.updateMatrixWorld(true);this.S.colOnly.push(m);return m;}
 door(lx,ly,lz,lry){const S=this.S,[x,y,z]=this.w(lx,ly,lz);const d=new THREE.Mesh(S.doorGeo,S.doorMat);d.position.set(x,y+.02,z);d.rotation.y=this.ry+lry;d.userData.interactiveDoor=true;d.name='Door';S.root.add(d);return d;}
}

export function buildPlaces(S){
 const M=(o)=>new THREE.MeshStandardMaterial({roughness:.9,metalness:0,...o});
 S.colOnly=S.colOnly||[];S.siteSpots={docks:[],town:[]};S.places={};
 const P=S.pmat={plasterA:M({map:TX.plaster('#c9b892')}),plasterB:M({map:TX.plaster('#b7c0b0')}),plasterC:M({map:TX.plaster('#d0a888')}),plasterD:M({map:TX.plaster('#a9b3bd')}),brick:M({map:TX.brick()}),
  asphalt:M({map:TX.asphalt(),roughness:.95}),pavers:M({map:TX.pavers()}),roofTile:M({map:TX.roofTile()}),trim:M({color:0xe2dccb,roughness:.8}),frame:M({color:0x2f2a24,roughness:.7}),
  awnR:M({map:TX.awning('#9d3b2e','#e6dccb'),side:THREE.DoubleSide}),awnG:M({map:TX.awning('#3f6b4c','#e6dccb'),side:THREE.DoubleSide}),car1:M({color:0x7b2b24,metalness:.5,roughness:.45}),car2:M({color:0x3b5a73,metalness:.5,roughness:.45}),car3:M({color:0xc9c3b1,metalness:.4,roughness:.5}),
  rubber:M({color:0x141414,roughness:.9}),burnt:M({color:0x2a2420,roughness:1}),hull:M({map:TX.hull(),metalness:.35,roughness:.6}),deck:M({map:S.mat.floor.map,roughness:.9}),tank:M({color:0x8d8f86,metalness:.55,roughness:.45}),
  water:M({color:0x4a5d6a,metalness:.6,roughness:.4}),fabric:M({color:0x55603f,side:THREE.DoubleSide,roughness:1}),stone:M({color:0xa59f92,roughness:.95}),ceiling:M({color:0xd9d3c6,roughness:.95,emissive:0x4a453c})};
 const signs=[];const sign=(F,text,lx,ly,lz,lry,w=3.2,bg='#2c2a26',fg='#e8d9a8')=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshStandardMaterial({map:TX.sign(text,bg,fg),roughness:.7}));m.position.set(...F.w(lx,ly,lz));m.rotation.y=F.ry+lry;S.scene.add(m);signs.push(m);};
 S.places.signs=signs;

 // ---------- generic multi-storey building ----------
 // Local frame: front face is +z. floors ≥ 1, fh storey height. Stairs: switchback lanes along the back wall.
 // Returns {F, floorY(k), spots...}. opts.ladder: 'left'|'right'|'back' exterior fire-escape ladder to the roof.
 function building(o){const {x,z,ry=0,w,d,floors=2,fh=3.2,mat,name='Building',front=[0],back=[],ladder=null,balcony=null,roof=true,stairs=floors>1||o.roofStairs,windowsFront=null}=o;
  const y0=o.y0??heightAt(x,z),F=new Frame(S,x,z,ry,y0),t=.25,hw=w/2,hd=d/2,top=floors*fh;
  const lanes=[-hd+t/2+.7,-hd+t/2+2.1],xs=-hw+1.7,run=5.6,rise=fh/16,tread=run/16;
  const holes=[];// per level: {x0,x1,z0,z1}
  const nst=stairs?(roof?floors:floors-1):0;
  for(let k=0;k<nst;k++){const lane=k%2,zc=lanes[lane];const x0=lane===0?xs-tread:xs+tread,x1=lane===0?xs+run-tread:xs+run+tread;holes[k+1]={x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:zc-.7,z1:zc+.7,lane};}
  // floor slabs
  F.box(w-.02,.12,d-.02,S.mat.floor,0,-.07,0);
  const slab=(L,mat)=>{const y=L*fh-.2,hl=holes[L];const rect=(ax,bx,az,bz)=>{if(bx-ax<.05||bz-az<.05)return;F.box(bx-ax,.2,bz-az,mat,(ax+bx)/2,y,(az+bz)/2);S.vis(()=>F.box(bx-ax,.02,bz-az,P.ceiling,(ax+bx)/2,y-.02,(az+bz)/2,0,3));};const X0=-hw+t/2,X1=hw-t/2,Z0=-hd+t/2,Z1=hd-t/2;
   if(!hl){rect(X0,X1,Z0,Z1);return;}rect(X0,hl.x0,Z0,Z1);rect(hl.x1,X1,Z0,Z1);rect(hl.x0,hl.x1,Z0,hl.z0);rect(hl.x0,hl.x1,hl.z1,Z1);
   // railings round the stair opening (inner long edge + the end you could walk into)
   const rail=(len,lx,lz,along)=>{F.box(along==='x'?len:.06,1,along==='x'?.06:len,S.mat.steel,lx,L*fh,lz);F.box(along==='x'?len:.08,.06,along==='x'?.08:len,S.mat.steel,lx,L*fh+1,lz);};
   const zEdge=hl.lane===0?hl.z1:hl.z0;rail(hl.x1-hl.x0,(hl.x0+hl.x1)/2,zEdge,'x');const xEnd=hl.lane===0?hl.x0:hl.x1;rail(1.4,xEnd,(hl.z0+hl.z1)/2,'z');};
  for(let L=1;L<floors;L++)slab(L,S.mat.floor);
  const band=(y,hh)=>S.vis(()=>{F.box(w+.34,hh,.1,P.trim,0,y,hd+.17);F.box(w+.34,hh,.1,P.trim,0,y,-hd-.17);F.box(.1,hh,d+.34,P.trim,hw+.17,y,0);F.box(.1,hh,d+.34,P.trim,-hw-.17,y,0);});
  if(roof){slab(floors,S.mat.concrete);band(top-.2,.2);}
  // stairs: visible steps + stringer, invisible ramp for smooth walking
  for(let k=0;k<nst;k++){const lane=k%2,zc=lanes[lane],dir=lane===0?1:-1,base=k*fh,bx=lane===0?xs:xs+run;
   S.vis(()=>{for(let i=0;i<16;i++){const cx=bx+dir*(i+.5)*tread;F.box(tread+.02,rise,1.3,S.mat.concrete,cx,base+i*rise,zc,0,1);}});
   const ang=Math.atan2(fh,run),len=Math.hypot(run,fh);const mx=bx+dir*(run/2-tread),my=base+fh/2;
   F.col(len+.1,.1,1.3,mx,my-.05,zc,0,0,dir*ang);
   const st=F.col(len,.12,1.2,mx,my-.32,zc,0,0,dir*ang);S.colOnly.pop();// (stringer visual below)
   {const m=new THREE.Mesh(box(len,.12,1.2,1),S.mat.concrete);m.position.copy(st.position);m.rotation.copy(st.rotation);m.updateMatrixWorld();(S.partsVis.get(S.mat.concrete)||S.partsVis.set(S.mat.concrete,[]).get(S.mat.concrete)).push(m);}}
  // walls with openings, storey by storey
  const wall=(L,face,openings)=>{const yb=L*fh,h=fh,along=face==='front'||face==='back'?'x':'z',fixed=face==='front'?hd:face==='back'?-hd:face==='right'?hw:-hw,len=along==='x'?w:d;
   const seg=(a,b,y,hh)=>{if(b-a<.04||hh<.04)return;const mid=(a+b)/2;if(along==='x')F.box(b-a,hh,t,mat,mid,yb+y,fixed);else F.box(t,hh,b-a,mat,fixed,yb+y,mid);};
   const ops=[...openings].sort((p,q)=>p.c-q.c);let s=-len/2;
   for(const op of ops){const a=op.c-op.w/2,b=op.c+op.w/2;seg(s,a,0,h);if(op.y0>0)seg(a,b,0,op.y0);if(op.y1<h)seg(a,b,op.y1,h-op.y1);s=b;
    if(op.door){if(along==='x')F.door(op.c-.51,yb,fixed,0);else F.door(fixed,yb,op.c-.51,-Math.PI/2);}
    if(op.win)S.vis(()=>{const sx=along==='x'?op.w+.2:.34,sz=along==='x'?.34:op.w+.2,off=face==='front'||face==='right'?.06:-.06;if(along==='x'){F.box(sx,.08,sz,P.trim,op.c,yb+op.y0-.08,fixed+off);F.box(sx,.12,.3,P.trim,op.c,yb+op.y1,fixed+off);}else{F.box(sz>sx?.34:sx,.08,sz,P.trim,fixed+off,yb+op.y0-.08,op.c);F.box(.3,.12,sz,P.trim,fixed+off,yb+op.y1,op.c);}});}
   seg(s,len/2,0,h);};
  const winsAlong=(len,avoid=[])=>{const out=[];const n=Math.max(1,Math.floor((len-1.6)/3.2));for(let i=0;i<n;i++){const c=-len/2+len*(i+.5)/n;if(avoid.some(a=>Math.abs(a-c)<1.5))continue;out.push(c);}return out;};
  for(let L=0;L<floors;L++){
   const fDoors=L===0?front:[],bDoors=L===0?back:[];const balc=balcony&&balcony.floor===L?[balcony.c]:[];
   const fw=(windowsFront||winsAlong(w,[...fDoors,...balc])).filter(c=>!fDoors.some(a=>Math.abs(a-c)<1.5)&&!balc.some(a=>Math.abs(a-c)<1.5));
   wall(L,'front',[...fDoors.map(c=>({c,w:1.1,y0:0,y1:2.2,door:true})),...balc.map(c=>({c,w:1.3,y0:0,y1:2.3})),...fw.map(c=>({c,w:1.25,y0:.95,y1:2.25,win:true}))]);
   wall(L,'back',[...bDoors.map(c=>({c,w:1.1,y0:0,y1:2.2,door:true})),...winsAlong(w,bDoors).filter(c=>c>xs+run+.6||c<xs-1).map(c=>({c,w:1.25,y0:.95,y1:2.25,win:true}))]);
   for(const side of ['left','right']){const lad=ladder===side;wall(L,side,winsAlong(d,lad?[0]:[]).map(c=>({c,w:1.2,y0:.95,y1:2.25,win:true})));}
   if(L>0)band(L*fh-.2,.18);}
  // parapet + roof props
  if(roof){const ph=1.0,gap=ladder?{left:[-hw,0],right:[hw,0],back:[0,-hd]}[ladder]:null;
   const par=(face)=>{const along=face==='front'||face==='back'?'x':'z',fixed=face==='front'?hd:face==='back'?-hd:face==='right'?hw:-hw,len=along==='x'?w+.25:d+.25;const g=gap&&((along==='x'&&Math.abs(gap[1]-fixed)<.01)||(along==='z'&&Math.abs(gap[0]-fixed)<.01))?0:null;
    const piece=(a,b)=>{if(b-a<.04)return;const m=(a+b)/2;if(along==='x')F.box(b-a,ph,t,mat,m,top,fixed);else F.box(t,ph,b-a,mat,fixed,top,m);S.vis(()=>{if(along==='x')F.box(b-a+.04,.08,.4,P.trim,m,top+ph,fixed);else F.box(.4,.08,b-a+.04,P.trim,fixed,top+ph,m);});};
    if(g===null)piece(-len/2,len/2);else{piece(-len/2,g-.55);piece(g+.55,len/2);}};
   for(const f of ['front','back','left','right'])par(f);}
  // exterior ladder (fire escape) to the roof
  if(ladder&&roof){const o2={left:[-1,0],right:[1,0],back:[0,-1]}[ladder],face=o2[0]?[o2[0]*(hw+t/2),0]:[0,o2[1]*(hd+t/2)];const wo=F.dir(o2[0],o2[1]),ryL=Math.atan2(wo.x,wo.z);
   const [fx,,fz]=F.w(face[0],0,face[1]);const LF=new Frame(S,fx,fz,ryL,y0);const H=top+1.1;ladderAt(LF,H);const base=LF.v(0,0,.18),bottom=LF.v(0,0,.62),topP=F.v(face[0]-o2[0]*.9,top+.02,face[1]-o2[1]*.9);
   S.ladders.push({bottom,top:topP,base,out:wo,height:top+.1,y0,ry:ryL,name:name+' fire escape'});}
  if(balcony){const L=balcony.floor,c=balcony.c,bw=balcony.w||3.2;F.box(bw,.18,1.4,S.mat.concrete,c,L*fh-.18,hd+.7);for(const sx of [-1,1])if(!(balcony.gap&&sx===balcony.gap))F.box(.08,1,1.4,S.mat.steel,c+sx*bw/2,L*fh,hd+.7);
   const gapC=balcony.climb;const rl=(a,b)=>{if(b-a<.05)return;F.box(b-a,1,.06,S.mat.steel,(a+b)/2,L*fh,hd+1.38);};if(gapC!=null){rl(c-bw/2,gapC-.6);rl(gapC+.6,c+bw/2);}else rl(c-bw/2,c+bw/2);F.box(bw,.06,.1,S.mat.steel,c,L*fh+1,hd+1.38);}
  S.footprints.push({x,z,w,d,ry,name});
  const res={F,y0,fh,top,floors,w,d,hw,hd,lanes,xs,run,name,floorY:k=>y0+k*fh};(S.places.bld||(S.places.bld=[])).push(res);return res;}
 // ladder visual in a frame whose +z points away from the wall
 function ladderAt(LF,H){S.vis(()=>{for(const sx of [-.26,.26])LF.box(.07,H,.07,S.mat.steel,sx,0,.18,0,1);for(let k=.3;k<H-.2;k+=.32)LF.box(.5,.045,.045,S.mat.steel,0,k,.18,0,1);for(const sx of [-.26,.26])LF.box(.06,.06,.25,S.mat.steel,sx,H-1.3,.06,0,1);});}
 const spot=(site,F,lx,ly,lz,o={})=>{const p=F.v(lx,ly,lz);S.siteSpots[site].push({pos:p,indoor:!!o.indoor,stationary:!!o.stationary,yaw:o.yaw!=null?F.ry+o.yaw:undefined,name:o.name,group:site,tag:o.tag});};
 // small props in a frame
 const crate=(F,lx,ly,lz,s=1.1,stack=1,lry=0)=>{for(let i=0;i<stack;i++)F.box(s,s,s,S.mat.floor,lx,ly+i*s,lz,lry+i*.25,s);};
 const drum=(F,lx,ly,lz)=>F.geo(cyl(.3,.3,.9,12),S.mat.drum,lx,ly+.45,lz);
 const bags=(F,lx,ly,lz,lry,len=4)=>{const n=Math.ceil(len/1.1);for(let i=0;i<n;i++){const t2=(i-(n-1)/2)*1.1;const c=Math.cos(lry),s2=Math.sin(lry);F.box(1.15,.5,.65,S.mat.sand,lx+t2*c,ly,lz-t2*s2,lry,1.15);F.box(1.1,.48,.6,S.mat.sand,lx+t2*c+.2*c,ly+.5,lz-t2*s2-.2*s2,lry,1.15);}};
 const mg=(F,lx,ly,lz,lry)=>S.vis(()=>{const G=F.sub(lx,lz,lry,ly);G.box(.08,.9,.08,S.mat.dark,0,0,0);G.box(.14,.14,1.1,S.mat.dark,0,.9,.15);G.geo(cyl(.03,.03,.7,8).rotateX(Math.PI/2),S.mat.dark,0,.97,.95);G.box(.3,.22,.3,S.mat.olive,0,.82,-.25);});
 const car=(F,lx,lz,lry,mat,burnt=false)=>{const G=F.sub(lx,lz,lry,0),m=burnt?P.burnt:mat;G.box(1.8,.75,4.2,m,0,.35,0);G.box(1.6,.62,2.1,m,0,1.1,-.25);S.vis(()=>{if(!burnt){G.box(1.5,.5,.05,S.mat.glass,0,1.18,.81);G.box(1.5,.45,.05,S.mat.glass,0,1.2,-1.31);}for(const [wx,wz] of [[-.86,1.3],[.86,1.3],[-.86,-1.35],[.86,-1.35]]){const g=cyl(.34,.34,.24,10);g.rotateZ(Math.PI/2);G.geo(g,P.rubber,wx,.34,wz);}});};
 const lamp=(F,lx,lz)=>S.vis(()=>{F.geo(cyl(.07,.1,4.4,8),S.mat.dark,lx,2.2,lz);F.box(.9,.08,.12,S.mat.dark,lx+.4,4.3,lz);F.box(.3,.16,.22,P.trim,lx+.8,4.18,lz);});
 const stall=(F,lx,lz,lry,awn)=>{const G=F.sub(lx,lz,lry,0);G.box(2.6,.9,1.2,S.mat.floor,0,0,0);for(const sx of [-1.25,1.25])for(const sz of [-.55,.55])G.box(.07,2.3,.07,S.mat.wall,sx,0,sz);S.vis(()=>{const roofG=box(3,.04,1.8,1);roofG.rotateX(-.18);G.geo(roofG,awn,0,2.35,.1);for(let i=0;i<5;i++)G.box(.35,.25,.35,i%2?S.mat.olive:S.mat.drum,-1+i*.5,.9,0);});};
 const table=(F,lx,ly,lz,lry=0)=>{F.box(1.6,.06,.85,S.mat.floor,lx,ly+.74,lz,lry);S.vis(()=>{for(const [ox,oz] of [[-.7,-.35],[.7,-.35],[-.7,.35],[.7,.35]]){const c=Math.cos(lry),s2=Math.sin(lry);F.box(.06,.74,.06,S.mat.dark,lx+ox*c+oz*s2,ly,lz-ox*s2+oz*c);}});return F.v(lx,ly+.8,lz);};
 const shelf=(F,lx,ly,lz,lry=0)=>{F.box(1.8,2,.45,S.mat.wall,lx,ly,lz,lry);};
 const bed=(F,lx,ly,lz,lry=0)=>{F.box(1,.45,2,S.mat.steel,lx,ly,lz,lry);F.box(.9,.14,1.9,S.mat.olive,lx,ly+.45,lz,lry);};
 const tankRoof=(F,lx,ly,lz)=>{S.vis(()=>{for(const [ox,oz] of [[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])F.box(.1,1.2,.1,S.mat.steel,lx+ox,ly,lz+oz);});F.geo(cyl(1.1,1.1,1.6,16),P.water,lx,ly+2,lz);};
 const acUnit=(F,lx,ly,lz,lry=0)=>{F.box(1.1,.8,.7,P.tank,lx,ly,lz,lry);S.vis(()=>F.geo(cyl(.28,.28,.05,14).rotateX(Math.PI/2),S.mat.dark,lx,ly+.42,lz+.36));};

 // ================= KESSEL DOCKS =================
 {const D=SITES.docks,deck=D.h+.3,F=new Frame(S,D.x,D.z,D.ry,0),lvl=D.level,pierY=lvl+.95;S.places.docks={F,deck,level:lvl,pierY};const A=S.anchors;
  // Quay: thick concrete pad with a vertical quay wall dropping into the river.
  F.box(34,deck-(lvl-3.5),3,S.mat.concrete,0,lvl-3.5,12.5,0,2.5);
  F.box(34,1.4,24,S.mat.concrete,0,deck-1.4,-.5,0,2.5);
  S.vis(()=>{for(let i=-16;i<=16;i+=4)F.geo(cyl(.18,.22,.5,10),S.mat.dark,i,deck+.25,13.6);});// bollards
  // Ramp back up to the hillside (pad edge) so it doesn't look cut.
  // T-pier: stem slopes from the quay down to the pier head.
  {const lx=-6,z0=14,z1=19,len=Math.hypot(z1-z0,deck-pierY),ang=Math.atan2(deck-pierY,z1-z0);const g=box(3,.25,len+.1,1);const m=new THREE.Mesh(g,P.deck);m.position.set(...F.w(lx,(deck+pierY)/2-.12,(z0+z1)/2));m.rotation.order='YXZ';m.rotation.set(ang,F.ry,0);m.updateMatrixWorld();(S.parts.get(P.deck)||S.parts.set(P.deck,[]).get(P.deck)).push(m);
   for(const sx of [-1.5,1.5]){const r=new THREE.Mesh(box(.06,.06,len,1),S.mat.wall);r.position.set(...F.w(lx+sx,(deck+pierY)/2+.95,(z0+z1)/2));r.rotation.order='YXZ';r.rotation.set(ang,F.ry,0);r.updateMatrixWorld();S.parts.get(S.mat.wall).push(r);}}
  F.box(18,.25,3,P.deck,-5,pierY-.25,20.2,0,1);
  for(let px=-13.5;px<=3.5;px+=2.5)for(const pz of [18.9,21.5])F.geo(cyl(.16,.18,pierY-(lvl-3.6),8),S.mat.logs,px,(pierY+lvl-3.6)/2-.1,pz);
  for(const pz of [15,17])for(const px of [-7.3,-4.7])F.geo(cyl(.16,.18,pierY-(lvl-3.6),8),S.mat.logs,px,(pierY+lvl-3.6)/2,pz);
  S.vis(()=>{for(let px=-13;px<=3;px+=4)F.geo(cyl(.12,.15,.45,8),S.mat.dark,px,pierY+.22,21.5);});
  F.box(18,.06,.06,S.mat.wall,-5,pierY+.95,18.95);for(let px=-13.5;px<=3.5;px+=3)F.box(.08,.95,.08,S.mat.wall,px,pierY,18.95);
  // Water ladders: pier head (river side) and quay wall.
  const waterLadder=(lx,lz,ox,oz,topY,name)=>{const wo=F.dir(ox,oz),ryL=Math.atan2(wo.x,wo.z);const [x,,z]=F.w(lx,0,lz);const y0=lvl-1.45;const LF=new Frame(S,x,z,ryL,y0);ladderAt(LF,topY-y0+1);
   S.ladders.push({bottom:LF.v(0,0,.75),top:F.v(lx-ox*1.2,topY-F.y0,lz-oz*1.2),base:LF.v(0,0,.18),out:wo,height:topY-y0,y0,ry:ryL,name});};
  waterLadder(3,21.6,0,1,pierY,'Pier ladder');waterLadder(10,14.1,0,1,deck,'Quay ladder');waterLadder(-14.1,20.2,-1,0,pierY,'Pier end ladder');
  A.dockLadder=F.v(3,lvl-1.45,22.6);A.quayLadder=F.v(10,lvl-1.45,14.8);
  // Patrol boat moored along the pier head.
  {const B=F.sub(-6,23.4,0,lvl);B.box(9,1.5,2.8,P.hull,0,-.85,0,0,3);const bow=new THREE.ConeGeometry(1.4,2.4,4,1).toNonIndexed();bow.rotateY(Math.PI/4);bow.scale(1,1,.72);bow.rotateZ(-Math.PI/2);B.geo(bow,P.hull,5.6,-.1,0);
   B.box(9.2,.1,3,P.deck,0,.62,0);B.box(3,1.7,2.2,S.mat.grey,-1.2,.7,0);B.box(2.6,.5,.05,S.mat.glass,-1.2,1.75,1.12);B.box(.05,.5,1.9,S.mat.glass,.32,1.75,0);B.box(3.3,.1,2.5,S.mat.steel,-1.2,2.4,0);
   B.geo(cyl(.05,.05,1.6,6),S.mat.steel,-1.6,3.2,0);B.box(1.2,.5,1.4,S.mat.dark,-4,.7,0);mg(B,3.6,.72,0,Math.PI/2);for(let i=-4;i<=4;i+=2)B.box(.06,.6,.06,S.mat.steel,i,.72,1.45);B.box(9,.06,.06,S.mat.steel,0,1.3,1.45);
   A.boat=B.v(-4,.72,0);A.boatDeck=B.v(1,.72,-.6);S.places.boat=B;}
  // Boathouse / warehouse (one tall storey, big river door).
  const WH=building({x:F.w(-9,0,0)[0],z:F.w(-9,0,0)[2],ry:D.ry,y0:deck,w:12,d:10,floors:1,fh:4.6,mat:P.brick,name:'Boathouse',front:[3.5],back:[-3],roof:false,stairs:false,windowsFront:[-3]});
  WH.F.box(12.6,.15,10.6,S.mat.roof,0,4.6,0,0,2.5);WH.F.box(2.6,.6,10.6,S.mat.roof,0,4.75,0,0,2.5);
  crate(WH.F,-3.8,0,-3,1.1,2);crate(WH.F,-2.6,0,-3.2,1.1,1);crate(WH.F,3.6,0,-3.4,1.2,2,.3);for(let i=0;i<3;i++)drum(WH.F,-4.6+i*.7,0,1.5);WH.F.box(4,.9,1.6,S.mat.olive,1,0,-1);table(WH.F,3.4,0,1.4,0);
  A.boathouse=WH.F.v(0,0,1);spot('docks',WH.F,-1,0,-2,{indoor:true});spot('docks',WH.F,2.5,0,2,{indoor:true});
  // Harbour office: two storeys, interior stair, rooftop terrace with radio.
  const OF=building({x:F.w(8,0,-5)[0],z:F.w(8,0,-5)[2],ry:D.ry,y0:deck,w:12,d:9,floors:2,mat:P.plasterB,name:'Harbour office',front:[2.5],back:[],ladder:'right'});
  table(OF.F,3.6,0,2.4,0);shelf(OF.F,4.6,0,-3.7);table(OF.F,-3.4,OF.fh,2.6,0);A.manifest=table(OF.F,2.6,OF.fh,2.2,0);A.officeTop=OF.F.v(2,OF.fh,1.5);bed(OF.F,4.6,OF.fh,-1.5);
  tankRoof(OF.F,-3.5,OF.top,1.4);OF.F.geo(cyl(.05,.07,5,6),S.mat.steel,3.5,OF.top+2.5,-2.5);A.officeRoof=OF.F.v(1,OF.top,1.6);
  spot('docks',OF.F,-1,0,1.4,{indoor:true});spot('docks',OF.F,1.5,OF.fh,0,{indoor:true,stationary:true,yaw:0});spot('docks',OF.F,-2,OF.top,2.8,{stationary:true,yaw:0,name:'roof'});
  {const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.05),new THREE.MeshStandardMaterial({map:TX.sign('KESSEL DOCKS','#24302c','#e3d6a6'),roughness:.7}));m.position.set(...OF.F.w(0,OF.fh-.6,OF.hd+.14));m.rotation.y=OF.F.ry;S.scene.add(m);signs.push(m);}
  // Fuel tanks with a pump.
  for(const lx of [11.5,14.5]){const g=cyl(1.2,1.2,6,18);g.rotateX(Math.PI/2);F.geo(g,P.tank,lx,deck+1.75,5.5);for(const zz of [3.5,7.5])F.box(1.8,.55,.4,S.mat.dark,lx,deck,zz);}
  F.box(1,1.4,.8,S.mat.red,9,deck,9.4);F.geo(cyl(.08,.08,2.4,6).rotateZ(Math.PI/2),S.mat.steel,10.3,deck+1.2,9.4);A.fuelPump=F.v(9,deck,8.7);A.fuelTanks=F.v(13,deck,1.9);
  // MG nests covering the river, crates, drums, container, watchtower.
  bags(F,-14,deck,9.8,0,3.5);mg(F,-14,deck,10.4,0);bags(F,6,deck,10.2,0,3.5);mg(F,6,deck,10.8,0);
  crate(F,-1,deck,6,1.1,2);crate(F,.4,deck,6.4,1.1,1);crate(F,2.4,deck,-1,1.2,1,.4);for(let i=0;i<4;i++)drum(F,-3+i*.7,deck,9.3);
  F.box(6,2.6,2.45,S.mat.green,-1,deck,-9,0,2.6);F.box(6,2.6,2.45,S.mat.red,-1,deck,-11.6,0,2.6);
  {const before=S.towerSpots.length,[tx,,tz]=F.w(-15,0,-9);S.tower(tx,tz,D.ry+Math.PI,{height:5.6});const t=S.towerSpots.splice(before)[0];// tower sits on the deck
   S.siteSpots.docks.push({...t,name:'tower',group:'docks'});}
  // patrol / sentry spots
  spot('docks',F,-12,deck,8,{stationary:true,yaw:0,name:'mg'});spot('docks',F,7.5,deck,9,{stationary:true,yaw:0,name:'mg'});
  spot('docks',F,-4,pierY,20.2,{stationary:true,yaw:0,name:'pier'});spot('docks',F,-1.5,deck,3,{});spot('docks',F,10,deck,-2,{});spot('docks',F,-12,deck,-6,{});spot('docks',F,4,deck,-10,{});spot('docks',F,13,deck,0,{});
  spot('docks',F,-3,lvl+.72,23.4,{stationary:true,yaw:Math.PI*.5,name:'boat'});
  // west-bank lookouts (the side you insert on)
  const W=D.river,nx=(W.x-D.x),nz=(W.z-D.z),nl=Math.hypot(nx,nz);for(const [along,off] of [[-26,16],[24,18]]){const x2=W.x+nx/nl*off+(-nz/nl)*along,z2=W.z+nz/nl*off+(nx/nl)*along;S.siteSpots.docks.push({pos:new THREE.Vector3(x2,heightAt(x2,z2),z2),indoor:false,group:'docks',bank:true});}
  // insertion point upstream on the west bank + a bank point opposite the docks
  {const ux=W.x+nx/nl*40-(-nz/nl)*70,uz=W.z+nz/nl*40-(nx/nl)*70;A.riverWest=new THREE.Vector3(ux,heightAt(ux,uz),uz);const bx=W.x+nx/nl*14-(-nz/nl)*14,bz=W.z+nz/nl*14-(nx/nl)*14;A.riverBank=new THREE.Vector3(bx,heightAt(bx,bz),bz);}
  A.docks=F.v(0,deck,0);}

 // ================= OLD KESSEL (town) =================
 {const T0=SITES.town,y0=T0.h+.02,F=new Frame(S,T0.x,T0.z,0,y0),A=S.anchors;S.places.town={F,y0};
  // Paving: asphalt streets, stone square, sidewalks.
  F.box(94,.06,10,P.asphalt,0,-.04,0,0,6);F.box(10,.06,94,P.asphalt,0,-.035,0,0,6);F.box(24,.07,24,P.pavers,0,-.03,0,0,3);
  for(const [cx,cz] of [[-26.5,-26.5],[26.5,-26.5],[-26.5,26.5],[26.5,26.5]])F.box(43,.05,43,P.pavers,cx,-.045,cz,0,3);
  // Town wall stubs / gate pillars where the road comes in (south), barricade at the gate.
  for(const sx of [-6.5,6.5]){F.box(1.2,3.6,1.2,P.stone,sx,0,-46);F.box(1.5,.3,1.5,P.trim,sx,3.6,-46);}
  // Fountain in the square (low rim you can vault).
  F.geo(cyl(2.6,2.7,.7,24),P.stone,0,.35,0);F.geo(cyl(2.2,2.2,.06,24),P.water,0,.66,0);F.geo(cyl(.35,.45,2.2,10),P.stone,0,1.1,0);F.geo(cyl(.8,.6,.3,12),P.stone,0,2.2,0);
  // Big four around the square.
  const hotel=building({x:T0.x-16,z:T0.z-15.5,w:14,d:12,floors:4,mat:P.plasterA,name:'Hotel Kessel',front:[2],back:[-4],ladder:'left',y0});
  const hall=building({x:T0.x+17,z:T0.z-15.5,w:16,d:13,floors:3,mat:P.brick,name:'Town Hall',front:[0],back:[3],y0});
  const apt=building({x:T0.x-16,z:T0.z+14.5,ry:Math.PI,w:14,d:11,floors:3,mat:P.plasterC,name:'Apartments',front:[-3],back:[3],ladder:'right',balcony:{floor:1,c:3.5,w:3.4,climb:3.5},y0});
  const shop=building({x:T0.x+16.5,z:T0.z+14.5,ry:Math.PI,w:15,d:11,floors:2,mat:P.plasterD,name:'Market hall',front:[-2.5,3.5],back:[0],y0});
  // Hotel: lobby counter, rooms, rooftop terrace with tables, umbrellas and a sniper nest.
  {const H=hotel,G=H.F;G.box(4,1.1,.8,S.mat.floor,2.5,0,2.2);shelf(G,5.6,0,-5.4);for(let L=1;L<4;L++){bed(G,5,L*H.fh,-3.6,0);bed(G,2.7,L*H.fh,-3.6,0);table(G,4,L*H.fh,3.6,0);G.box(.18,H.fh-.2,4.6,P.plasterA,.6,L*H.fh,2.4);}
   A.ledger=table(G,3.6,2*H.fh,1.4,0);A.hotel=G.v(2,0,4);A.hotelLobby=G.v(2.5,0,3.4);A.hotelRoof=G.v(2,H.top,2.5);
   for(const [lx,lz] of [[2,3],[-1.5,3.2]]){table(G,lx,H.top,lz,0);G.geo(cyl(.04,.04,2.2,6),S.mat.steel,lx,H.top+1.1,lz);const u=new THREE.ConeGeometry(1.4,.5,8,1,true).toNonIndexed();G.geo(u,P.awnR,lx,H.top+2.35,lz);}
   tankRoof(G,5,H.top,-4);acUnit(G,2.4,H.top,-4.6);
   spot('town',G,4.2,H.top,4.6,{stationary:true,yaw:0,name:'roof'});spot('town',G,-4.6,H.top,3.8,{stationary:true,yaw:-Math.PI/2,name:'roof'});
   spot('town',G,4,H.fh,4.6,{indoor:true,stationary:true,yaw:0});spot('town',G,-3,2*H.fh,4.6,{indoor:true,stationary:true,yaw:0});spot('town',G,4.5,3*H.fh,-4.4,{indoor:true,stationary:true,yaw:Math.PI});
   spot('town',G,-1,0,2.5,{indoor:true});spot('town',G,4,0,-1,{indoor:true});
   const m=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.1),new THREE.MeshStandardMaterial({map:TX.sign('HOTEL KESSEL','#5a2a22','#f0dfb0'),roughness:.7}));m.position.set(...G.w(-2,H.fh-.55,H.hd+.14));S.scene.add(m);signs.push(m);}
  // Town hall: offices, council table, radio relay + HVT on the roof terrace.
  {const H=hall,G=H.F;table(G,3,0,2.8,0);table(G,-1,0,3,0);shelf(G,6.8,0,-5.9);G.box(5,.8,1.6,S.mat.floor,3.5,H.fh,1.2);for(const lx of [1.6,5.4])table(G,lx,2*H.fh,2.5,0);
   A.hallOffice=G.v(3.5,H.fh,2.4);A.hall=G.v(0,0,5);A.hallRoof=G.v(2,H.top,3);
   {const R=G.sub(3.5,-2.2,0,H.top);R.box(1.6,1.6,1.1,S.mat.dark,0,0,0);R.geo(cyl(.06,.09,7,8),S.mat.steel,0,4.5,0);for(const k of [3,5,7])R.box(1.4,.05,.05,S.mat.steel,0,k,0);const dish=new THREE.SphereGeometry(.9,14,8,0,Math.PI*2,0,Math.PI*.3).toNonIndexed();dish.rotateX(-Math.PI*.55);R.geo(dish,S.mat.steel,-1.6,1.4,.4);A.relay=R.v(0,0,.9);}
   bags(G,-4,H.top,4.8,0,4);acUnit(G,5.6,H.top,-4.5);acUnit(G,-3.8,H.top,-3.5);
   spot('town',G,0,H.top,4.4,{stationary:true,yaw:0,name:'hvt'});spot('town',G,-6.2,H.top,2,{stationary:true,yaw:-Math.PI/2,name:'roof'});
   spot('town',G,-5,H.fh,5.3,{indoor:true,stationary:true,yaw:0});spot('town',G,5,2*H.fh,5.3,{indoor:true,stationary:true,yaw:0});
   spot('town',G,-2,0,2,{indoor:true});spot('town',G,4,H.fh,-1,{indoor:true,stationary:true,yaw:Math.PI*.5});
   const m=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.1),new THREE.MeshStandardMaterial({map:TX.sign('TOWN HALL','#2a2e36','#e8dcb8'),roughness:.7}));m.position.set(...G.w(0,2.6,H.hd+.14));S.scene.add(m);signs.push(m);
   G.geo(cyl(.05,.05,3.2,6),S.mat.steel,-7.5,H.top+1.6,6);}
  // Apartments: balcony reachable from a dumpster + crate, rooftop with laundry and a lookout.
  {const H=apt,G=H.F;for(let L=0;L<3;L++){bed(G,4.5,L*H.fh,-3,0);table(G,-2,L*H.fh,2.6,0);}G.box(1.8,1.25,1.1,S.mat.green,3.5,0,H.hd+1.1,0,1);crate(G,1.9,0,H.hd+1.1,1,1);
   A.balcony=G.v(3.5,H.fh,H.hd+.6);A.aptRoof=G.v(0,H.top,0);for(const lx of [-3,0,3]){G.box(.05,1.6,.05,S.mat.steel,lx,H.top,2.5);}G.box(6,.03,.03,S.mat.rope,0,H.top+1.5,2.5);for(let i=0;i<5;i++)G.box(.6,.7,.02,i%2?P.awnG:P.awnR,-2.4+i*1.2,H.top+.8,2.5);
   tankRoof(G,4.8,H.top,-3.4);spot('town',G,2.5,H.top,-4.2,{stationary:true,yaw:Math.PI,name:'roof'});spot('town',G,-4,H.fh,4.6,{indoor:true,stationary:true,yaw:0});spot('town',G,1,0,0,{indoor:true});}
  // Market hall: stalls inside, open roof with sandbags.
  {const H=shop,G=H.F;for(const lx of [-4,0,4])stall(G,lx,1.5,0,P.awnG);table(G,4.6,H.fh,2.6,0);crate(G,-5.5,H.fh,3.5,1,2);
   bags(G,0,H.top,4.6,0,4);acUnit(G,5,H.top,-3.6);A.market=G.v(0,0,4);A.marketRoof=G.v(0,H.top,1);
   spot('town',G,-3,H.top,4,{stationary:true,yaw:0,name:'roof'});spot('town',G,2,0,-1,{indoor:true});spot('town',G,-2,H.fh,1,{indoor:true});
   for(const [lx,awn] of [[-4.5,P.awnR],[3.5,P.awnG]]){const g=box(3.4,.04,1.8,1);g.rotateX(.25);G.geo(g,awn,lx,2.7,H.hd+.9);}}
  // Outer houses (two storeys, some with roof access).
  const small=[
   {x:-36,z:-15,ry:0,w:9,d:9,floors:2,mat:P.plasterD,front:[1.5],ladder:'left'},{x:36,z:-15,ry:0,w:9,d:9,floors:2,mat:P.plasterA,front:[-1.5]},
   {x:-36,z:15,ry:Math.PI,w:9,d:9,floors:1,mat:P.brick,front:[0],roofStairs:true},{x:36,z:15,ry:Math.PI,w:9,d:9,floors:2,mat:P.plasterC,front:[1.5],ladder:'right'},
   {x:-16,z:-35,ry:0,w:12,d:8,floors:2,mat:P.plasterB,front:[2]},{x:17,z:-35,ry:0,w:13,d:9,floors:1,mat:P.brick,front:[3],roofStairs:true},
   {x:-16,z:35,ry:Math.PI,w:12,d:8,floors:2,mat:P.plasterA,front:[0]},{x:17,z:35,ry:Math.PI,w:12,d:8,floors:2,mat:P.plasterD,front:[-2],ladder:'left'}];
  const smalls=small.map((o,i)=>building({...o,x:T0.x+o.x,z:T0.z+o.z,name:'House',y0}));
  smalls.forEach((H,i)=>{const G=H.F;table(G,1.5,0,1.8,0);if(H.floors>1)bed(G,2.8,H.fh,2.3,0);if(i%2===0)spot('town',G,1,0,.5,{indoor:true});if(i===1||i===4)spot('town',G,-1,H.top,2,{stationary:true,yaw:0,name:'roof'});});
  A.warehouseRoof=smalls[5].F.v(0,smalls[5].top,0);
  // Street furniture, cars, stalls, barricades, cover.
  car(F,-6.6,-26,0,P.car1);car(F,6.8,-22,Math.PI,P.car2);car(F,-30,-6.8,Math.PI/2,P.car3);car(F,26,6.7,-Math.PI/2,P.car1,true);car(F,6.8,30,0,P.car3);car(F,-38,6.6,Math.PI/2,P.car2);
  for(const [lx,lz,ry] of [[-19,-7.2,0],[27,7.2,Math.PI],[-8,8,Math.PI/2]])stall(F,lx,lz,ry,ry?P.awnR:P.awnG);
  for(const [lx,lz] of [[-6,-6],[6,-6],[-6,6],[6,6],[-6,-30],[6,30],[-26,-6],[30,6],[6,-44],[-6,44]])lamp(F,lx,lz);
  bags(F,0,0,-40,0,6);bags(F,-3,0,-12,0,3.5);bags(F,11,0,-3,Math.PI/2,3.5);bags(F,-11,0,4,Math.PI/2,3.5);
  crate(F,-7.2,0,-7.4,1.1,2);crate(F,7.3,0,7.6,1.1,1);crate(F,7.4,0,-7.6,1.1,1);for(let i=0;i<3;i++)drum(F,-12+i*.7,0,7.6);
  F.box(6,2.6,2.45,S.mat.blue,28,0,-41,0,2.6);F.box(2.4,1.1,1.1,S.mat.green,-27.5,0,-27.5,0,1);
  // street patrols + square
  for(const [lx,lz] of [[0,-24],[-3,-8],[8,3],[-24,2],[24,-3],[0,22],[-30,-30],[30,30]])spot('town',F,lx,0,lz,{});
  {const [ax,,az]=F.w(22,0,-66);A.townApproach=new THREE.Vector3(ax,heightAt(ax,az),az);}A.town=F.v(0,0,-30);A.square=F.v(0,0,-7);A.townGate=F.v(0,0,-48);A.townSquareLZ=F.v(0,0,0);}
}
