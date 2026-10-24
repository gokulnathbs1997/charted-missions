import * as THREE from 'three';
// Forest valley: procedural terrain, sky, pines, broadleaf trees, rocks and grass.
// Everything here is generated in code (no external assets).

// ---------- noise ----------
function hash(x,z){let h=Math.imul(x|0,374761393)+Math.imul(z|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);const a=hash(xi,zi),b=hash(xi+1,zi),c=hash(xi,zi+1),d=hash(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
export function fbm(x,z,oct=5){let s=0,a=.5,f=1,n=0;for(let i=0;i<oct;i++){s+=a*vnoise(x*f,z*f);n+=a;a*=.5;f*=2.03;}return s/n;}
export const rand=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};

// ---------- layout ----------
export const FOREST={
 size:960,                      // playable terrain square (meters)
 basin:108,                     // flat valley radius around the camp
 camp:new THREE.Vector3(0,0,0),
 village:new THREE.Vector3(-92,0,30),
 lz:new THREE.Vector3(28,0,176),          // helicopter insertion clearing
 ridge:new THREE.Vector3(116,0,-104),     // zip-line ridge top
 extraction:new THREE.Vector3(-158,0,-64),
 roads:[[[4,38],[8,70],[18,110],[26,150],[28,176]],[[-36,26],[-60,30],[-92,30]],[[-4,-40],[-40,-60],[-100,-62],[-158,-64]],[[-92,30],[-104,56],[-122,80],[-136,90],[-140,96]]]
};
// Hills that ring the valley (x, z, height, radius) and the river that falls from the north-east plateau.
const HILLS=[[-262,-176,52,62],[-305,92,60,70],[-176,306,46,58],[-34,338,50,62],[268,252,48,60],[338,66,44,56],[-96,-336,56,66],[100,-372,42,56],[-380,-40,58,64],[372,-160,40,54]];
export const RIVER={path:[[318,-470],[300,-420],[274,-352],[252,-292],[240,-266],[226,-226],[212,-176],[201,-112],[203,-48],[196,22],[176,88],[146,148],[132,206],[148,282],[192,362],[246,430],[300,500]],fall:3,half:7,depth:2.9,samples:[],grid:new Map(),cell:20};
const FLAT=[{x:FOREST.lz.x,z:FOREST.lz.z,r:16},{x:FOREST.extraction.x,z:FOREST.extraction.z,r:16},{x:FOREST.ridge.x,z:FOREST.ridge.z,r:6}];
function rawHeight(x,z){const r=Math.hypot(x,z);let h=ss(FOREST.basin,175,r)*9+Math.pow(ss(175,440,r),1.5)*74+Math.pow(ss(430,1500,r),.75)*270;
 h+=(fbm(x*.007+11,z*.007-4)-.45)*34*ss(FOREST.basin,190,r)+(fbm(x*.035,z*.035)-.5)*3.2*ss(FOREST.basin,140,r);
 // Rocky ridged detail on the surrounding hills.
 const rn=fbm(x*.018-7,z*.018+3,4);h+=(1-Math.abs(rn*2-1))*12*ss(220,430,r);
 for(const [hx,hz,hh,hr] of HILLS){const dx=x-hx,dz=z-hz,d2=dx*dx+dz*dz;if(d2<hr*hr*9)h+=hh*Math.exp(-d2/(2*hr*hr))*(.75+fbm(x*.02+hx,z*.02,3)*.5);}
 const dx=x-FOREST.ridge.x,dz=z-FOREST.ridge.z;h+=24*Math.exp(-(dx*dx*.6+dz*dz)/(2*34*34))*ss(FOREST.basin-8,FOREST.basin+30,r);
 // Waterfall plateau: a cliff step across the river.
 const P=RIVER.path,F=P[RIVER.fall],N=P[RIVER.fall+1],fx=N[0]-F[0],fz=N[1]-F[1],fl=Math.hypot(fx,fz),ax=(x-F[0])*fx/fl+(z-F[1])*fz/fl,lat=Math.abs((x-F[0])*fz/fl-(z-F[1])*fx/fl);
 if(lat<80&&ax<6&&ax>-220)h+=15*ss(2,-2,ax)*ss(80,38,lat)*ss(-220,-120,ax);
 return Math.max(0,h);}
// ---- River: dense samples with monotonic water level, spatial grid for fast lookup ----
function buildRiver(){const P=RIVER.path,S=RIVER.samples;let s=0,level=1e9;for(let i=0;i<P.length-1;i++){const [ax,az]=P[i],[bx,bz]=P[i+1],L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/3));for(let k=0;k<n;k++){const t=k/n;
  // Catmull-Rom smoothing between control points.
  const p0=P[Math.max(0,i-1)],p3=P[Math.min(P.length-1,i+2)],cr=(a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);const x=cr(p0[0],P[i][0],P[i+1][0],p3[0]),z=cr(p0[1],P[i][1],P[i+1][1],p3[1]);
  const raw=rawHeight(x,z);S.push({x,z,raw,seg:i});}}
 // Water level: a gentle gorge above the fall (carved into the hills), then follows the valley floor.
 const fi=S.findIndex(q=>q.seg===RIVER.fall)-1,LF=Math.min(S[fi].raw,S[fi-1].raw,S[fi-2].raw)-1.1;for(let j=0;j<S.length;j++){const q=S[j];if(j<=fi)q.level=LF+(fi-j)*3*.022;else{level=Math.min(level-.03,q.raw-1.1);q.level=level;}if(j===fi)level=q.level;}
 for(let j=0;j<S.length;j++){const q=S[j],x=q.x,z=q.z,i=q.seg,level=q.level;const prog=j?Math.hypot(x-S[j-1].x,z-S[j-1].z):0;s+=prog;
  const half=RIVER.half*(i<RIVER.fall?.6:1)*(.85+fbm(s*.01,3,2)*.35);Object.assign(q,{s,half});}
 // Plunge pool below the fall.
 const top=fi;let bottom=fi+1;while(bottom+1<S.length&&S[bottom].level-S[bottom+1].level>.6)bottom++;RIVER.fallTop=S[top];RIVER.fallBottom=S[bottom];RIVER.pool=S[Math.min(S.length-1,bottom+4)];
 for(const q of S){const k=Math.floor(q.x/RIVER.cell)+','+Math.floor(q.z/RIVER.cell);if(!RIVER.grid.has(k))RIVER.grid.set(k,[]);RIVER.grid.get(k).push(q);}}
export function riverAt(x,z){if(!RIVER.samples.length)buildRiver();const cx=Math.floor(x/RIVER.cell),cz=Math.floor(z/RIVER.cell);let best=null,bd=1e9;for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=RIVER.grid.get((cx+i)+','+(cz+j));if(!L)continue;for(const q of L){const d=(x-q.x)**2+(z-q.z)**2;if(d<bd){bd=d;best=q;}}}
 if(!best)return null;let d=Math.sqrt(bd);const pool=RIVER.pool;if(pool){const dp=Math.hypot(x-pool.x,z-pool.z);if(dp<16&&dp<d+6)return {d:Math.max(0,dp-6),level:pool.level,half:10,q:pool,pool:true};}return {d,level:best.level,half:best.half,q:best};}
// Terrain height with flattened clearings and the carved river channel.
export function heightAt(x,z){let h=rawHeight(x,z);for(const f of FLAT){const d=Math.hypot(x-f.x,z-f.z);if(d<f.r*2.2){const target=f.h??(f.h=rawHeight(f.x,f.z));h=THREE.MathUtils.lerp(target,h,ss(f.r,f.r*2.2,d));}}
 const rv=riverAt(x,z);if(rv&&rv.d<rv.half+24){const half=rv.half,depth=rv.pool?3.2:RIVER.depth*(half/RIVER.half);const bed=rv.level-.25-depth*Math.max(0,1-(rv.d/half)**2)+(fbm(x*.3,z*.3,2)-.5)*.4;const target=rv.d<half?bed:rv.level+.3+(rv.d-half)*.12;h=THREE.MathUtils.lerp(target,h,ss(half+1.5,half+24,rv.d));}
 const T=RIVER.fallTop,PL=RIVER.pool;if(T&&PL){const fx=PL.x-T.x,fz=PL.z-T.z,fl=Math.hypot(fx,fz),ax=((x-T.x)*fx+(z-T.z)*fz)/fl,lat=Math.abs((x-T.x)*fz-(z-T.z)*fx)/fl;
  if(ax>-1&&ax<fl+10){const wl=8+Math.max(0,ax)*.35,w=ss(wl+7,wl,lat)*ss(-1,1.2,ax)*ss(fl+10,fl,ax);if(w>0)h=THREE.MathUtils.lerp(h,Math.min(h,PL.level-1.6-2*ss(fl+6,fl*.5,ax)),w);}}
 return h;}
// ---- v9 places: Kessel Docks (river outpost on the east bank) and Old Kessel (town north-west of the village) ----
// Each is a flattened pad; SITES carries the frame (centre, rotation, ground height) the structures are built in.
export const SITES={};
(function sites(){riverAt(0,0);const S=RIVER.samples;let j=0,bd=1e9;for(let i=0;i<S.length;i++){const d=(S[i].x-168)**2+(S[i].z-112)**2;if(d<bd){bd=d;j=i;}}
 const q=S[j],a=S[j-4],b=S[j+4];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz);tx/=l;tz/=l;let nx=-tz,nz=tx;if(nx*q.x+nz*q.z<0){nx=-nx;nz=-nz;}
 const off=q.half+13,x=q.x+nx*off,z=q.z+nz*off,h=q.level+1.55;
 // Local frame: +z points from the pad into the river, +x runs along the bank.
 SITES.docks={x,z,ry:Math.atan2(-nx,-nz),h,level:q.level,river:{x:q.x,z:q.z,half:q.half},r:17};
 FLAT.push({x,z,r:17,h,site:'docks'});
 const tx2=-140,tz2=140;SITES.town={x:tx2,z:tz2,ry:0,h:rawHeight(tx2,tz2),r:47};FLAT.push({x:tx2,z:tz2,r:47,h:SITES.town.h,site:'town'});})();
export function inSite(x,z,pad=0){for(const f of FLAT)if(f.site&&Math.hypot(x-f.x,z-f.z)<f.r+pad)return f.site;return null;}
// Water surface height at a point (null when dry).
export function waterAt(x,z){const PL=RIVER.pool;if(PL&&Math.hypot(x-PL.x,z-PL.z)<14)return PL.level;const rv=riverAt(x,z);if(!rv||rv.d>rv.half+.5)return null;return rv.level;}
function roadDistance(x,z){let best=1e9;for(const road of FOREST.roads)for(let i=0;i<road.length-1;i++){const [ax,az]=road[i],[bx,bz]=road[i+1],vx=bx-ax,vz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));best=Math.min(best,Math.hypot(x-ax-vx*t,z-az-vz*t));}return best;}
export const isClear=(x,z,pad=0)=>{if(Math.hypot(x-FOREST.ridge.x+9,z-FOREST.ridge.z-7)<16+pad)return false;{const rv=riverAt(x,z);if(rv&&rv.d<rv.half+3+pad)return false;}if(roadDistance(x,z)<4.5+pad)return false;if(Math.hypot(x,z)<62+pad)return false;if(Math.hypot(x-FOREST.village.x,z-FOREST.village.z)<16+pad)return false;for(const f of FLAT)if(Math.hypot(x-f.x,z-f.z)<f.r+2+pad)return false;return true;};

// ---------- time of day presets ----------
export const SKIES={
 morning:{top:'#5d8fc9',horizon:'#d6e0df',fog:'#c8d4d3',near:110,far:1500,sun:0xffe6c2,sunI:3.3,hemiSky:0xd6e8f5,hemiGround:0x6a7348,hemiI:2.2,sunDir:[.55,.62,.42],exposure:1.18,clouds:.55},
 overcast:{top:'#8796a0',horizon:'#c3cacc',fog:'#b4bcbe',near:30,far:360,sun:0xe6ecef,sunI:1.9,hemiSky:0xd3dce1,hemiGround:0x5e6450,hemiI:2.6,sunDir:[.3,.8,.35],exposure:1.22,clouds:.85},
 sunset:{top:'#4a74a8',horizon:'#f6c08a',fog:'#c9bba6',near:150,far:1400,sun:0xffd2a6,sunI:3.5,hemiSky:0xc9d6e8,hemiGround:0x6a6244,hemiI:2.3,sunDir:[-.8,.33,.45],exposure:1.24,clouds:.5},
 dusk:{top:'#40598a',horizon:'#f0b47e',fog:'#b8a08e',near:90,far:950,sun:0xffb675,sunI:3.1,hemiSky:0xaab9d8,hemiGround:0x5a4c3c,hemiI:2.1,sunDir:[-.75,.3,.35],exposure:1.28,clouds:.6}
};

// ---------- textures ----------
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function terrainTexture(N=1024){N=Math.min(N,1024);const [c,x]=canvas(N,N),img=x.createImageData(N,N),[mc,mx]=canvas(N,N),mimg=mx.createImageData(N,N),S=FOREST.size,cell=S/N;const grid=new Float32Array((N+2)*(N+2));for(let j=0;j<N+2;j++)for(let i=0;i<N+2;i++)grid[j*(N+2)+i]=heightAt((i-.5)/N*S-S/2,(j-.5)/N*S-S/2);const G=(i,j)=>grid[j*(N+2)+i];
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const wx=(i+.5)/N*S-S/2,wz=(j+.5)/N*S-S/2,h=G(i+1,j+1);const sl=Math.hypot(G(i+2,j+1)-G(i,j+1),G(i+1,j+2)-G(i+1,j))/(2*cell);
  const n=fbm(wx*.05,wz*.05,4),n2=fbm(wx*.4,wz*.4,2);let r=86+n*40,g=104+n*42,b=44+n*16;// grass
  const dry=ss(.45,.75,fbm(wx*.012+3,wz*.012));r+=dry*38;g+=dry*16;b+=dry*6;
  const rock=ss(.55,.95,sl+n2*.25)+ss(70,110,h)*.6;const rk=Math.min(1,rock);r=r*(1-rk)+(112+n2*40)*rk;g=g*(1-rk)+(110+n2*36)*rk;b=b*(1-rk)+(100+n2*30)*rk;
  const snow=ss(130,170,h+n*20);r+=(235-r)*snow;g+=(238-g)*snow;b+=(240-b)*snow;
  const rd=roadDistance(wx,wz),road=1-ss(2.6,4.8,rd+n2*1.4);r=r*(1-road)+(118+n2*28)*road;g=g*(1-road)+(98+n2*22)*road;b=b*(1-road)+(70+n2*16)*road;
  const rv=riverAt(wx,wz);{const nr=rv?1-ss(rv.half+2,rv.half+16,rv.d):0,nrd=1-ss(4,9,rd0(wx,wz)),k2=(j*N+i)*4;mimg.data[k2]=255*Math.max(nr,nrd);mimg.data[k2+1]=0;mimg.data[k2+2]=0;mimg.data[k2+3]=255;}if(rv){const shore=1-ss(rv.half-1,rv.half+5+n2*3,rv.d);r=r*(1-shore)+(104+n2*30)*shore;g=g*(1-shore)+(98+n2*26)*shore;b=b*(1-shore)+(86+n2*22)*shore;const wet=1-ss(rv.half-2,rv.half+.5,rv.d);r=r*(1-wet)+52*wet;g=g*(1-wet)+70*wet;b=b*(1-wet)+74*wet;}
  const camp=1-ss(48,60,Math.hypot(wx,wz)+n*6);r=r*(1-camp*.7)+(122+n2*30)*camp*.7;g=g*(1-camp*.7)+(110+n2*24)*camp*.7;b=b*(1-camp*.7)+(84+n2*18)*camp*.7;
  const k=(j*N+i)*4;img.data[k]=r;img.data[k+1]=g;img.data[k+2]=b;img.data[k+3]=255;}
 x.putImageData(img,0,0);mx.putImageData(mimg,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.userData.mask=new THREE.CanvasTexture(mc);return t;}
const rd0=(x,z)=>roadDistance(x,z);
function detailTexture(){const N=256,[c,x]=canvas(N,N),img=x.createImageData(N,N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const v=150+(fbm(i*.09,j*.09,3)-.5)*90+(hash(i,j)-.5)*60;const k=(j*N+i)*4;img.data[k]=img.data[k+1]=img.data[k+2]=Math.max(0,Math.min(255,v));img.data[k+3]=255;}x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
// Tiled ground textures for close-up detail (grass, forest floor/dirt, granite).
function tileTexture(kind,N=512){const [c,x]=canvas(N,N),img=x.createImageData(N,N),R=rand(kind.length*31);const T=(i,j,f,o=3)=>{let s=0,a=.5,n=0;for(let k=0;k<o;k++){const p=N/(f*(1<<k));s+=a*vnoise(i/p+k*17,j/p);n+=a;a*=.5;}return s/n;};// tileable enough at these scales
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){let r,g,b;const n=T(i,j,4,4),m=T(i,j,32,2),h=hash(i,j);
  if(kind==='grass'){const blade=(hash(i*3,j)>.55?1:0)*.25;r=60+n*50+m*30-blade*30;g=88+n*60+m*30+blade*20;b=34+n*20;}
  else if(kind==='dirt'){const peb=h>.985?40:0;r=96+n*50+m*30+peb;g=82+n*40+m*24+peb;b=62+n*30+m*16+peb;if(hash(i,j*7)>.993){r=60;g=48;b=30;}}
  else {const vein=Math.pow(1-Math.abs(T(i,j,2,3)*2-1),8)*60,speck=(h-.5)*46;r=128+n*60-vein+speck;g=124+n*56-vein+speck;b=116+n*50-vein+speck;const lich=ss(.62,.8,T(i+99,j,6,3));r+=(110-r)*lich*.5;g+=(122-g)*lich*.5;b+=(78-b)*lich*.5;}
  const k=(j*N+i)*4;img.data[k]=r;img.data[k+1]=g;img.data[k+2]=b;img.data[k+3]=255;}
 x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;t.generateMipmaps=true;
 const m=[0,0,0];for(let k=0;k<img.data.length;k+=4*61)for(let ch=0;ch<3;ch++)m[ch]+=Math.pow(img.data[k+ch]/255,2.2);const cnt=Math.ceil(img.data.length/(4*61));t.userData.mean=new THREE.Vector3(m[0]/cnt,m[1]/cnt,m[2]/cnt);return t;}
// Tileable normal-ish noise used to animate water.
function waterNoise(){const N=256,[c,x]=canvas(N,N),img=x.createImageData(N,N);const H=(i,j)=>{let s=0,a=.5;for(let k=0;k<4;k++){const f=4<<k;const u=i/N*f,v=j/N*f,xi=Math.floor(u),zi=Math.floor(v),xf=u-xi,zf=v-zi,uu=xf*xf*(3-2*xf),vv=zf*zf*(3-2*zf),w=t=>((t%f)+f)%f;const A=hash(w(xi),w(zi)+k*99),B=hash(w(xi+1),w(zi)+k*99),C=hash(w(xi),w(zi+1)+k*99),D=hash(w(xi+1),w(zi+1)+k*99);s+=a*(A+(B-A)*uu+(C-A)*vv+(A-B-C+D)*uu*vv);a*=.5;}return s;};
 const hm=new Float32Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++)hm[j*N+i]=H(i,j);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const dx=hm[j*N+(i+1)%N]-hm[j*N+(i-1+N)%N],dz=hm[((j+1)%N)*N+i]-hm[((j-1+N)%N)*N+i],k=(j*N+i)*4;img.data[k]=128+dx*500;img.data[k+1]=hm[j*N+i]*255;img.data[k+2]=128+dz*500;img.data[k+3]=255;}
 x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
// v8.7 foliage textures: branch sprays and leaf clusters with lighter, varied greens, darker interiors and
// sunlit tips, so trees read as real foliage instead of flat dark shapes.
function needleTexture(){const W=512,H=256,[c,x]=canvas(W,H);x.clearRect(0,0,W,H);const R=rand(77);
 const twig=(x0,y0,ang,len,w,depth)=>{const x1=x0+Math.cos(ang)*len,y1=y0+Math.sin(ang)*len;x.strokeStyle='#4a3826';x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();
  const n=Math.floor(len*1.25);for(let i=0;i<n;i++){const t=i/n,px=x0+(x1-x0)*t,py=y0+(y1-y0)*t,nl=(1-t*.5)*(10+R()*9)*(depth?1:.8);for(const sgn of [-1,1]){const a=ang+sgn*(.75+R()*.35);const lt=.35+t*.5+R()*.25;
   const g=Math.round(70+lt*95),r=Math.round(28+lt*55),b=Math.round(22+lt*30);x.strokeStyle=`rgba(${r},${g},${b},${.75+R()*.25})`;x.lineWidth=1.1+R()*.9;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*nl,py+Math.sin(a)*nl);x.stroke();}}
  if(depth<2)for(let k=0;k<4;k++){const t=.2+k*.18+R()*.06;twig(x0+(x1-x0)*t,y0+(y1-y0)*t,ang+(k%2?.55:-.55)+(R()-.5)*.2,len*(.42-k*.06),w*.6,depth+1);}};
 twig(6,H/2,0,W-30,4,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function leafTexture(){const N=512,[c,x]=canvas(N,N);const R=rand(12);x.clearRect(0,0,N,N);
 for(let i=0;i<420;i++){const rr=Math.sqrt(R()),a=R()*6.28,px=N/2+Math.cos(a)*rr*230,py=N/2+Math.sin(a)*rr*230;const lt=.35+(1-rr)*.15+(py<N/2?.25:0)*R()+R()*.25;
  const g=Math.round(80+lt*110),r=Math.round(40+lt*70),b=Math.round(22+lt*35);x.save();x.translate(px,py);x.rotate(a+(R()-.5)*1.4);const L=12+R()*12,Wd=L*.42;
  x.fillStyle=`rgb(${r},${g},${b})`;x.beginPath();x.moveTo(-L,0);x.quadraticCurveTo(0,-Wd,L,0);x.quadraticCurveTo(0,Wd,-L,0);x.fill();x.strokeStyle=`rgba(${r*.7|0},${g*.75|0},${b*.7|0},.8)`;x.lineWidth=.8;x.beginPath();x.moveTo(-L,0);x.lineTo(L,0);x.stroke();x.restore();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function grassTexture(){const [c,x]=canvas(128,128);const R=rand(5);for(let i=0;i<70;i++){const bx=8+R()*112,h=50+R()*76,lean=(R()-.5)*30;const g=x.createLinearGradient(0,128,0,128-h);g.addColorStop(0,'#3d4a1f');g.addColorStop(1,R()<.3?'#c2b56c':'#8fa64a');x.strokeStyle=g;x.lineWidth=1.5+R()*2;x.beginPath();x.moveTo(bx,128);x.quadraticCurveTo(bx+lean*.3,128-h*.5,bx+lean,128-h);x.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
// Real 3-D grass clump: curved, tapered blades (no flat cards). Vertex colour runs from a dark root to a
// lighter, slightly yellow tip; normals lean upward so the clump is lit like a soft mass.
function grassClump(seed,blades){const R=rand(seed),pos=[],col=[],nor=[],idx=[];let v=0;
 for(let b=0;b<blades;b++){const a=R()*6.283,r=Math.sqrt(R())*.28,bx=Math.cos(a)*r,bz=Math.sin(a)*r,h=.22+R()*.42,w=.032+R()*.03,lean=.12+R()*.4,face=R()*6.283,bend=a+(R()-.5)*1.2;const dry=R()<.22;
  const seg=4;for(let k=0;k<=seg;k++){const t=k/seg,ww=w*(1-t*.92),y=h*t,off=lean*t*t*h;const cx=bx+Math.cos(bend)*off,cz=bz+Math.sin(bend)*off;const px=Math.cos(face)*ww,pz=Math.sin(face)*ww;
   pos.push(cx-px,y,cz-pz,cx+px,y,cz+pz);const c0=dry?[.3,.27,.12]:[.1,.17,.05],c1=dry?[.62,.56,.3]:[.32,.48,.15];const cc=c0.map((q,i)=>q+(c1[i]-q)*Math.pow(t,.8));col.push(...cc,...cc);
   const l=Math.hypot(Math.cos(bend)*.3,1,Math.sin(bend)*.3);nor.push(Math.cos(bend)*.3/l,1/l,Math.sin(bend)*.3/l,Math.cos(bend)*.3/l,1/l,Math.sin(bend)*.3/l);if(k<seg)idx.push(v,v+1,v+2,v+1,v+3,v+2);v+=2;}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);return g;}
function cloudTexture(cover){const W=1024,H=256,[c,x]=canvas(W,H),img=x.createImageData(W,H);for(let j=0;j<H;j++)for(let i=0;i<W;i++){const u=i/W,v=j/H;const n=fbm(Math.cos(u*6.283)*3+7,Math.sin(u*6.283)*3+v*5,6);const d=Math.max(0,(n-(1-cover)*.75-.2)*3.2);const fade=ss(0,.25,v)*ss(1,.55,v);const a=Math.min(1,d)*fade;const k=(j*W+i)*4,sh=1-Math.min(1,d)*.35;img.data[k]=255*sh;img.data[k+1]=255*sh;img.data[k+2]=255*(sh+.03);img.data[k+3]=a*235;}x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;return t;}

// ---------- geometry helpers ----------
function merge(parts){let count=0;for(const g of parts)count+=g.index?g.index.count:g.attributes.position.count;const pos=[],nor=[],uv=[],col=[];for(const g of parts){const gi=g.index?g.toNonIndexed():g;const p=gi.attributes.position,n=gi.attributes.normal,u=gi.attributes.uv,c=gi.attributes.color;for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(u?u.getX(i):0,u?u.getY(i):0);col.push(c?c.getX(i):1,c?c.getY(i):1,c?c.getZ(i):1);}}const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return out;}
function outward(g,up=.6){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),l=Math.hypot(x,z);const v=l<.05?new THREE.Vector3(0,1,0):new THREE.Vector3(x,l*up,z).normalize();n.setXYZ(i,v.x,v.y,v.z);}return g;}
function tint(g,r,gr,b){const n=g.attributes.position.count,a=[];for(let i=0;i<n;i++)a.push(r,gr,b);g.setAttribute('color',new THREE.Float32BufferAttribute(a,3));return g;}
// Distant-tree impostors: two crossed cards with a painted silhouette (4 triangles per tree).
function impostorTexture(kind){const [c,x]=canvas(128,256),R=rand(kind==='pine'?71:72);x.clearRect(0,0,128,256);
 if(kind==='pine'){x.fillStyle='#4a3826';x.fillRect(60,200,8,56);for(let i=0;i<34;i++){const t=i/33,y=18+t*200,w=(6+t*54)*(.85+R()*.3);const g=x.createLinearGradient(64-w,0,64+w,0);const d=48+R()*24;g.addColorStop(0,`rgb(${d*.6|0},${d+26|0},${d*.62|0})`);g.addColorStop(.5,`rgb(${d*.9|0},${d+62|0},${d*.8|0})`);g.addColorStop(1,`rgb(${d*.55|0},${d+20|0},${d*.58|0})`);x.fillStyle=g;x.beginPath();x.moveTo(64,y-14);x.lineTo(64+w,y+10);for(let k=0;k<6;k++)x.lineTo(64+w-k*w/3+(R()-.5)*8,y+10+(k%2)*6);x.lineTo(64-w,y+10);x.closePath();x.fill();}}
 else{x.fillStyle='#4a3826';x.fillRect(59,150,10,106);for(let i=0;i<60;i++){const a=R()*6.28,r=Math.sqrt(R())*52,px=64+Math.cos(a)*r,py=95+Math.sin(a)*r*.85,s=10+R()*14,d=55+R()*45;x.fillStyle=`rgb(${d*.65|0},${d+45|0},${d*.45|0})`;x.beginPath();x.arc(px,py,s,0,7);x.fill();}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function impostorGeometry(h,w){const parts=[];for(let k=0;k<2;k++){const q=new THREE.PlaneGeometry(w,h);q.translate(0,h/2,0);q.rotateY(k*Math.PI/2);parts.push(q);}const g=merge(parts.map(q=>tint(q,1,1,1)));const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);return g;}
// A pine: tapered trunk + whorls of drooping needle cards + dark inner cone (so it reads solid).
function pineGeometry(seed,height){const R=rand(seed),trunk=[],cards=[];const tr=new THREE.CylinderGeometry(.09,.26,height,7,1,true);tr.translate(0,height/2,0);trunk.push(tint(tr,1,1,1));
 const whorls=Math.round(height*1.15),start=height*.22;
 for(let w=0;w<whorls;w++){const t=w/(whorls-1),y=start+(height-start-.3)*t,len=(1-t)*(2.3+height*.07)+.45,n=Math.max(5,Math.round(10-t*5)),droop=.22+R()*.28;
  for(let k=0;k<n;k++){const a=k/n*Math.PI*2+R()*.7+w*1.3,q=new THREE.PlaneGeometry(len,len*.55);q.translate(len/2,0,0);q.rotateX(-Math.PI/2+.0001);q.rotateZ(-droop);q.rotateY(a);q.translate(0,y,0);const shade=.8+t*.3+R()*.14;tint(q,shade,shade,shade);cards.push(q);if(R()<.55){const q2=q.clone();q2.rotateY(.35);q2.translate(0,.18,0);tint(q2,shade*1.05,shade*1.05,shade*1.05);cards.push(q2);}}}
 const core=new THREE.ConeGeometry((2.1+height*.05)*.38,height*.78,7,1,true);core.translate(0,start+height*.41,0);tint(core,.62,.7,.56);
 return {trunk:merge(trunk),cards:outward(merge(cards),.7),core:outward(merge([core]),.5)};}
function broadleafGeometry(seed){const R=rand(seed),h=7+R()*4;const tr=new THREE.CylinderGeometry(.12,.3,h*.6,7,1,true);tr.translate(0,h*.3,0);const cards=[];for(let i=0;i<26;i++){const s=2.2+R()*1.6,q=new THREE.PlaneGeometry(s,s);q.rotateY(R()*Math.PI);q.rotateX((R()-.5)*1.2);const r=Math.sqrt(R())*2.4,a=R()*6.28;q.translate(Math.cos(a)*r,h*.62+R()*h*.38,Math.sin(a)*r);const sh=.85+R()*.3;tint(q,sh,sh,sh);cards.push(q);}return {trunk:merge([tint(tr,1,1,1)]),cards:outward(merge(cards),.9),core:merge([tint(new THREE.IcosahedronGeometry(1.7,1).translate(0,h*.78,0),.6,.72,.5)])};}
function rockGeometry(seed){const R=rand(seed),g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);const s=.75+fbm(v.x*1.7+seed,v.z*1.7+v.y,3)*.6;v.multiplyScalar(s);v.y*=.62;p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;}

// Large granite outcrop: rounded exfoliating dome with vertical joints and water staining (vertex colors).
function graniteGeometry(seed,detail=4){const R=rand(seed),g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position,col=[];const o=R()*50;
 for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);const n1=fbm(v.x*1.1+o,v.z*1.1+v.y*.7,4),n2=fbm(v.x*3.2+o,v.y*3.2-v.z,3);let r=1+(n1-.5)*.7+(n2-.5)*.16;
  const joint=Math.pow(1-Math.abs(Math.sin(v.x*5.5+n1*4+o)),14)*.07+Math.pow(1-Math.abs(Math.sin(v.z*4.3+n2*3)),16)*.05;r-=joint;
  v.multiplyScalar(r);v.y=v.y>0?v.y*(.75+R()*.0):v.y*.45;if(v.y<-.25)v.y=-.25-(v.y+.25)*.1;p.setXYZ(i,v.x,v.y,v.z);}
 g.computeVertexNormals();const nrm=g.attributes.normal;for(let i=0;i<p.count;i++){const y=p.getY(i),ny=nrm.getY(i),n=fbm(p.getX(i)*2+o,p.getZ(i)*2,3);let c=.78+n*.3;const stain=ss(.2,-.6,ny)*.35*ss(.3,.7,fbm(p.getX(i)*6,y*.5+o,2));c-=stain;const lich=ss(.55,.9,ny)*ss(.5,.7,n);col.push(c*(1-lich*.25),c*(1-lich*.05),c*(.93-lich*.3));}
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g;}
function riverStoneGeometry(seed){const R=rand(seed),g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);v.multiplyScalar(.85+fbm(v.x*1.3+seed,v.z*1.3+v.y,2)*.3);v.y*=.5+R()*.0;p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;}
// Triplanar granite texturing for any rock material (instanced or not).
function triplanar(mat,tex,scale=.35){mat.onBeforeCompile=sh=>{sh.uniforms.rockTex={value:tex};
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTpPos;varying vec3 vTpNrm;').replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 mat4 tpM=modelMatrix*instanceMatrix;
 #else
 mat4 tpM=modelMatrix;
 #endif
 vTpPos=(tpM*vec4(transformed,1.)).xyz;vTpNrm=normalize(mat3(tpM)*objectNormal);`);
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D rockTex;varying vec3 vTpPos;varying vec3 vTpNrm;').replace('#include <color_fragment>',`#include <color_fragment>
 vec3 tw=pow(abs(normalize(vTpNrm)),vec3(4.));tw/=dot(tw,vec3(1.));vec3 tp=vTpPos*${scale.toFixed(3)};
 vec3 rk=texture2D(rockTex,tp.zy).rgb*tw.x+texture2D(rockTex,tp.xz).rgb*tw.y+texture2D(rockTex,tp.xy).rgb*tw.z;
 vec3 rk2=texture2D(rockTex,tp.xz*.23+.37).rgb;diffuseColor.rgb*=rk*mix(.8,1.25,rk2.r)*1.55;`);};return mat;}
export class ForestWorld {
 constructor({scene,renderer,sun,hemi,sky='morning',quality='high'}){this.scene=scene;this.renderer=renderer;this.sun=sun;this.hemi=hemi;this.preset=SKIES[sky]||SKIES.morning;this.quality=quality;this.time=0;this.collision=new THREE.Group();this.colliders=[];this.windMats=[];this.trees=[];
  const P=this.preset;scene.background=new THREE.Color(P.horizon);scene.fog=new THREE.Fog(P.fog,P.near,P.far);renderer.toneMappingExposure=P.exposure;
  sun.color.set(P.sun);sun.intensity=P.sunI;this.sunDir=new THREE.Vector3(...P.sunDir).normalize();hemi.color.set(P.hemiSky);hemi.groundColor.set(P.hemiGround);hemi.intensity=P.hemiI;
  if(quality!=='low'){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=-70;sc.right=70;sc.top=70;sc.bottom=-70;sc.near=1;sc.far=400;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(sun.target);}
  this.tiles={grass:tileTexture('grass'),dirt:tileTexture('dirt'),rock:tileTexture('rock')};this.waterMats=[];
  this.buildSky();this.buildTerrain();this.buildWater();this.buildTrees();this.buildRocks();this.buildFormations();this.buildGrass();this.buildFarForest();this.updateTrees(new THREE.Vector3(),true);}
 buildSky(){const P=this.preset;const geo=new THREE.SphereGeometry(1800,32,16);const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(P.top)},horizon:{value:new THREE.Color(P.horizon)},sunDir:{value:this.sunDir},sunColor:{value:new THREE.Color(P.sun)}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
  fragmentShader:'uniform vec3 top,horizon,sunDir,sunColor;varying vec3 vDir;void main(){float h=max(vDir.y,0.);vec3 c=mix(horizon,top,pow(h,.55));if(vDir.y<0.)c=horizon*.92;float s=max(dot(normalize(vDir),normalize(sunDir)),0.);c+=sunColor*(pow(s,900.)*4.+pow(s,12.)*.28);gl_FragColor=vec4(c,1.);}'});
  this.sky=new THREE.Mesh(geo,mat);this.sky.renderOrder=-10;this.sky.frustumCulled=false;this.scene.add(this.sky);
  const clouds=new THREE.Mesh(new THREE.CylinderGeometry(1500,1500,700,48,1,true),new THREE.MeshBasicMaterial({map:cloudTexture(P.clouds),transparent:true,side:THREE.BackSide,depthWrite:false,fog:false,color:new THREE.Color(P.horizon).lerp(new THREE.Color('#ffffff'),.6)}));clouds.position.y=330;clouds.frustumCulled=false;clouds.renderOrder=-9;this.clouds=clouds;this.scene.add(clouds);}
 buildTerrain(){const S=FOREST.size,seg=this.quality==='low'?170:this.quality==='medium'?220:256;const geo=new THREE.PlaneGeometry(S,S,seg,seg);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,heightAt(p.getX(i),p.getZ(i)));geo.computeVertexNormals();
  const detail=detailTexture(),T=this.tiles,mat=new THREE.MeshStandardMaterial({map:terrainTexture(this.quality==='low'?512:this.quality==='medium'?768:1024),roughness:.96,metalness:0});
  // Splat shading: macro colour map × tiled grass / dirt detail, triplanar granite on steep slopes.
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{tMask:{value:mat.map.userData.mask},detail:{value:detail},tGrass:{value:T.grass},tDirt:{value:T.dirt},tRock:{value:T.rock},mGrass:{value:T.grass.userData.mean},mDirt:{value:T.dirt.userData.mean},mRock:{value:T.rock.userData.mean}});
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;varying vec3 vWn;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xyz;vWn=normalize(mat3(modelMatrix)*objectNormal);');
   sh.fragmentShader=sh.fragmentShader.replace('#include <map_pars_fragment>','#include <map_pars_fragment>\nuniform sampler2D detail,tGrass,tDirt,tRock,tMask;uniform vec3 mGrass,mDirt,mRock;varying vec3 vWp;varying vec3 vWn;').replace('#include <map_fragment>',`#include <map_fragment>
   vec3 macro=diffuseColor.rgb;float slope=1.-clamp(vWn.y,0.,1.);vec2 uv=vWp.xz;
   vec3 gr=texture2D(tGrass,uv*.22).rgb*mix(.85,1.15,texture2D(tGrass,uv*.031).g);vec3 di=texture2D(tDirt,uv*.27).rgb;
   vec3 tw=pow(abs(normalize(vWn)),vec3(4.));tw/=dot(tw,vec3(1.));vec3 rk=(texture2D(tRock,vWp.zy*.21).rgb*tw.x+texture2D(tRock,vWp.xz*.21).rgb*tw.y+texture2D(tRock,vWp.xy*.21).rgb*tw.z)*mix(.7,1.2,texture2D(tRock,vWp.xz*.031+vWp.y*.02).r);
   float lum=dot(macro,vec3(.333));float greenness=clamp((macro.g-max(macro.r,macro.b))*6.,0.,1.);
   vec3 groundN=mix(vec3(1.),mix(di/mDirt,gr/mGrass,greenness),.85);float rockW=smoothstep(.42,.68,slope+(texture2D(detail,uv*.02).r-.5)*.3)*(1.-texture2D(tMask,vMapUv).r);
   vec3 rockC=mix(macro,mRock*.55,.75)*rk/mRock;diffuseColor.rgb=mix(macro*groundN,rockC,rockW);diffuseColor.rgb*=mix(.9,1.1,texture2D(detail,vMapUv*23.).r);`);};
  const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;mesh.name='Terrain';this.terrain=mesh;this.scene.add(mesh);
  // Collision terrain is independent of graphics quality: detailed in the inner 600 m, coarse beyond (fast octree build).
  const grid=(half,n,skip)=>{const pos=[],idx=[],st=half*2/n;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=-half+i*st,z=-half+j*st;pos.push(x,heightAt(x,z),z);}for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x0=-half+i*st,z0=-half+j*st;if(skip&&x0>=-skip-.01&&x0+st<=skip+.01&&z0>=-skip-.01&&z0+st<=skip+.01)continue;const a=j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;idx.push(a,c,b,b,c,d);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g;};
  const inner=new THREE.Mesh(grid(300,130,0));inner.name='Terrain collision';this.collision.add(inner);const outer=new THREE.Mesh(grid(S/2,80,300));outer.name='Terrain collision far';this.collision.add(outer);
  // Distant mountains ring (visual only).
  const far=new THREE.PlaneGeometry(3600,3600,this.quality==='low'?110:170,this.quality==='low'?110:170);far.rotateX(-Math.PI/2);const fp=far.attributes.position;for(let i=0;i<fp.count;i++){const x=fp.getX(i),z=fp.getZ(i),inside=Math.max(Math.abs(x),Math.abs(z))<S/2-8;fp.setY(i,inside?-6:heightAt(x,z));}far.computeVertexNormals();
  const farMat=new THREE.MeshStandardMaterial({color:0x6d7458,roughness:1,flatShading:false});farMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vH;').replace('#include <begin_vertex>','#include <begin_vertex>\nvH=position.y;');sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vH;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(vec3(.2,.27,.15),vec3(.46,.45,.41),smoothstep(150.,260.,vH));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93),smoothstep(300.,360.,vH));');};
  this.scene.add(new THREE.Mesh(far,farMat));}
 // ---------- water: river ribbon, plunge pool and waterfall ----------
 waterMaterial(kind='river'){const P=this.preset,noise=this.waterNoise||(this.waterNoise=waterNoise());
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:kind!=='fall',side:kind==='fall'?THREE.DoubleSide:THREE.FrontSide,fog:true,
   uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uWorld:{value:0},uTime:{value:0},tNoise:{value:null},sunDir:{value:new THREE.Vector3()},sunColor:{value:new THREE.Color(P.sun)},skyTop:{value:new THREE.Color(P.top)},skyHor:{value:new THREE.Color(P.horizon)},deep:{value:new THREE.Color(kind==='fall'?0xdfeef0:0x0e2422)},shallow:{value:new THREE.Color(0x3a5448)}}]),
   vertexShader:`attribute float aFlow;varying vec2 vUv;varying vec3 vW;varying float vFlow;
    #include <fog_pars_vertex>
    void main(){vUv=uv;vFlow=aFlow;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
   fragmentShader:kind==='fall'?`uniform float uTime;uniform sampler2D tNoise;varying vec2 vUv;varying vec3 vW;varying float vFlow;
    #include <fog_pars_fragment>
    void main(){float n1=texture2D(tNoise,vec2(vUv.x*2.2,vUv.y*.5-uTime*.9)).g,n2=texture2D(tNoise,vec2(vUv.x*5.+.3,vUv.y*1.4-uTime*1.7)).g;
     float streak=smoothstep(.35,.75,n1*.6+n2*.6);float edge=smoothstep(0.,.18,vUv.x)*smoothstep(1.,.82,vUv.x);float a=(.45+streak*.5)*edge*smoothstep(0.,.04,1.-vUv.y);
     vec3 c=mix(vec3(.62,.72,.72),vec3(.97,.99,1.),streak);gl_FragColor=vec4(c,a);
     #include <fog_fragment>
    }`:`uniform float uTime,uWorld;uniform sampler2D tNoise;uniform vec3 sunDir,sunColor,skyTop,skyHor,deep,shallow;varying vec2 vUv;varying vec3 vW;varying float vFlow;
    #include <fog_pars_fragment>
    void main(){float sp=.35+vFlow*3.;vec2 q=uWorld>.5?vW.xz*.045:vec2(vUv.x*.6,vUv.y*.08);
     vec3 a=texture2D(tNoise,q*1.7+vec2(.11,-uTime*sp*.09)).rgb,b=texture2D(tNoise,q*3.9+vec2(-.3,-uTime*sp*.16)).rgb;
     vec2 d=(a.xz-.5)*.9+(b.xz-.5)*.6;vec3 N=normalize(vec3(d.x,1.,d.y));vec3 V=normalize(cameraPosition-vW);
     float fres=.02+.6*pow(1.-max(dot(N,V),0.),5.);vec3 R=reflect(-V,N);vec3 sky=mix(skyHor*.75,skyTop*.8,clamp(R.y*1.6,0.,1.));
     float edge=smoothstep(0.,.22,vUv.x)*smoothstep(1.,.78,vUv.x);vec3 body=mix(shallow,deep,edge);
     float spec=pow(max(dot(reflect(-normalize(sunDir),N),V),0.),220.)*3.;
     float foam=smoothstep(.62,.9,a.g*.6+b.g*.6-.15+vFlow*2.2)*clamp(vFlow*6.,0.,1.)+(1.-edge)*.1*b.g;
     vec3 c=mix(body,sky,fres)+sunColor*spec;c=mix(c,vec3(.9,.94,.94),clamp(foam,0.,.85));float alpha=mix(.55,.93,edge)+foam*.2;gl_FragColor=vec4(c,min(alpha,1.));
     #include <fog_fragment>
    }`});mat.uniforms.tNoise.value=noise;mat.uniforms.sunDir.value.copy(this.sunDir);this.waterMats.push(mat);return mat;}
 buildWater(){const S=RIVER.samples,top=RIVER.fallTop,bottom=RIVER.fallBottom,pool=RIVER.pool,i0=S.indexOf(top),i1=S.indexOf(bottom);
  const pos=[],uv=[],flow=[],idx=[];let row=0;const segs=[];let cur=[];
  for(let j=0;j<S.length;j++){const q=S[j];const skip=(j>i0&&j<i1)||Math.hypot(q.x-pool.x,q.z-pool.z)<13;if(skip){if(cur.length>1)segs.push(cur);cur=[];continue;}cur.push(j);}if(cur.length>1)segs.push(cur);
  for(const seg of segs){const base=pos.length/3;seg.forEach((j,k)=>{const q=S[j],a=S[Math.max(0,j-1)],b=S[Math.min(S.length-1,j+1)];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;const w=q.half+2.6,f=Math.max(0,(a.level-b.level)/Math.max(1,Math.hypot(b.x-a.x,b.z-a.z)));
    for(const side of [-1,1]){pos.push(q.x-tz*w*side,q.level,q.z+tx*w*side);uv.push(side<0?0:1,q.s);flow.push(Math.min(.5,f));}
    if(k>0){const o=base+(k-1)*2;idx.push(o,o+2,o+1,o+1,o+2,o+3);}});}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('aFlow',new THREE.Float32BufferAttribute(flow,1));g.setIndex(idx);g.computeBoundingSphere();
  const river=new THREE.Mesh(g,this.waterMaterial('river'));river.name='River';river.renderOrder=2;this.scene.add(river);this.river=river;
  // Plunge pool.
  const PR=Math.hypot(pool.x-top.x,pool.z-top.z)+4,disc=new THREE.CircleGeometry(PR,48);disc.rotateX(-Math.PI/2);{const p=disc.attributes.position,u=disc.attributes.uv,fl=[];for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getZ(i));u.setXY(i,.5-.5*Math.min(1,r/PR),0);fl.push(.12*(1-r/PR));}disc.setAttribute('aFlow',new THREE.Float32BufferAttribute(fl,1));}
  const pm=this.waterMaterial('river');pm.uniforms.uWorld.value=1;const poolMesh=new THREE.Mesh(disc,pm);const cx=(pool.x+top.x)/2,cz=(pool.z+top.z)/2;poolMesh.position.set(cx,pool.level+.02,cz);poolMesh.renderOrder=2;this.scene.add(poolMesh);
  // Waterfall curtain from the lip down into the pool.
  let fx=pool.x-top.x,fz=pool.z-top.z;const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;const FP=RIVER.path[RIVER.fall],axF=(FP[0]-top.x)*fx+(FP[1]-top.z)*fz,lip={x:top.x+fx*(axF-1),z:top.z+fz*(axF-1)};const H=top.level-pool.level+.3,W=top.half*1.7,cols=10,rows=28;const fp=[],fu=[],ff=[],fi=[];
  for(let r=0;r<=rows;r++){const t=r/rows,y=top.level-t*H,fwd=2.6*Math.sqrt(t)+.4;for(let c=0;c<=cols;c++){const u=c/cols,lat=(u-.5)*W*(1+t*.25);fp.push(lip.x+fx*fwd-fz*lat,y,lip.z+fz*fwd+fx*lat);fu.push(u,1-t);ff.push(1);if(r&&c){const o=(r-1)*(cols+1)+(c-1);fi.push(o,o+cols+1,o+1,o+1,o+cols+1,o+cols+2);}}}
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('uv',new THREE.Float32BufferAttribute(fu,2));fg.setAttribute('aFlow',new THREE.Float32BufferAttribute(ff,1));fg.setIndex(fi);fg.computeBoundingSphere();
  const fall=new THREE.Mesh(fg,this.waterMaterial('fall'));fall.renderOrder=3;fall.name='Waterfall';this.scene.add(fall);this.fall=fall;
  this.fallInfo={top:new THREE.Vector3(lip.x,top.level,lip.z),base:new THREE.Vector3(lip.x+fx*3,pool.level,lip.z+fz*3),pool:new THREE.Vector3(pool.x,pool.level,pool.z),dir:new THREE.Vector3(fx,0,fz),width:W,height:H};}
 // Big granite formations on the hills, cliffs framing the waterfall, boulders in and along the river.
 buildFormations(){const R=rand(2024),hi=this.quality!=='low',geos=[graniteGeometry(11,hi?4:3),graniteGeometry(23,hi?4:3),graniteGeometry(37,hi?4:3)],colGeos=[graniteGeometry(11,1),graniteGeometry(23,1),graniteGeometry(37,1)];
  const mat=triplanar(new THREE.MeshStandardMaterial({color:0xbab4a8,roughness:.92,vertexColors:true}),this.tiles.rock,.22);const groups=geos.map(()=>[]);
  const put=(x,z,s,sy,k,rot,sink=.18)=>{const h=heightAt(x,z),m=new THREE.Matrix4().compose(new THREE.Vector3(x,h-s*sink,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,rot,0)),new THREE.Vector3(s,s*sy,s*(.8+R()*.4)));groups[k].push(m);if(Math.hypot(x,z)<FOREST.size/2){const c=new THREE.Mesh(colGeos[k]);c.applyMatrix4(m);this.collision.add(c);}};
  let placed=0;for(let t=0;t<4000&&placed<(hi?70:40);t++){const a=R()*6.283,r=200+R()*270,x=Math.cos(a)*r,z=Math.sin(a)*r;if(!isClear(x,z,10))continue;const e=4,sl=Math.hypot(heightAt(x+e,z)-heightAt(x-e,z),heightAt(x,z+e)-heightAt(x,z-e))/(2*e);if(sl<.18&&R()<.7)continue;const s=6+R()*16;put(x,z,s,.55+R()*.5,placed%3,R()*6.28);placed++;}
  // Story cover rock on the ridge path (Black Veil intro).
  put(66,-48.5,2.6,.85,0,.5,.3);
  // Cliffs either side of the waterfall lip.
  const F=this.fallInfo;if(F){for(const side of [-1,1])for(let i=0;i<4;i++){const lat=side*(F.width*.5+3.5+i*5.5),ax=.5+i*1.2,x=F.top.x-F.dir.z*lat+F.dir.x*ax,z=F.top.z+F.dir.x*lat+F.dir.z*ax;const w=4.5+R()*2.5,hgt=F.height*(.5+R()*.12);
   const m=new THREE.Matrix4().compose(new THREE.Vector3(x,F.pool.y+hgt*.55,z),new THREE.Quaternion().setFromEuler(new THREE.Euler((R()-.5)*.15,R()*6.28,(R()-.5)*.15)),new THREE.Vector3(w,hgt,w*(.8+R()*.3)));groups[i%3].push(m);const c=new THREE.Mesh(colGeos[i%3]);c.applyMatrix4(m);this.collision.add(c);}
   // Boulders tumbled into the plunge pool.
   for(let i=0;i<5;i++){const a=R()*6.28,r=6+R()*8,x=F.pool.x+Math.cos(a)*r,z=F.pool.z+Math.sin(a)*r;put(x,z,1.5+R()*2.2,.7,i%3,R()*6.28,.3);}}
  geos.forEach((g,i)=>{if(groups[i].length)this.addInstanced(g,mat,groups[i],{name:'Granite'});});
  // River boulders: half-submerged smooth stones, plus shore stones.
  const sg=[riverStoneGeometry(3),riverStoneGeometry(8)],smat=triplanar(new THREE.MeshStandardMaterial({color:0x9a958c,roughness:.75}),this.tiles.rock,.5),sm=[[],[]];
  for(const q of RIVER.samples){if(R()<.55)continue;for(let k=0;k<2;k++){const lat=(R()-.5)*2*(q.half+3),a=R()*6.28;const x=q.x+Math.cos(a)*lat,z=q.z+Math.sin(a)*lat,s=.3+R()*1.1;const m=new THREE.Matrix4().compose(new THREE.Vector3(x,heightAt(x,z)+s*.15,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(R()*.3,R()*6.28,R()*.3)),new THREE.Vector3(s*(1+R()*.6),s,s));sm[k].push(m);}}
  sg.forEach((g,i)=>this.addInstanced(g,smat,sm[i],{name:'River stones'}));}
 // Cheap forests on the distant mountains (outside the playable square).
 buildFarForest(){const R=rand(515),geo=impostorGeometry(12,6.2);const mat=new THREE.MeshStandardMaterial({map:impostorTexture('pine'),alphaTest:.45,side:THREE.DoubleSide,roughness:1,vertexColors:true,color:0xcfd8c8});const m=[],S=FOREST.size/2,n=this.quality==='low'?2500:7000;
  for(let i=0;i<n*4&&m.length<n;i++){const x=(R()-.5)*2400,z=(R()-.5)*2400;if(Math.max(Math.abs(x),Math.abs(z))<S-5)continue;const h=heightAt(x,z);if(h>230||fbm(x*.008,z*.008,3)<.4)continue;const s=.8+R()*.8;m.push(new THREE.Matrix4().compose(new THREE.Vector3(x,h-1,z),new THREE.Quaternion(),new THREE.Vector3(s,s*(.8+R()*.6),s)));}
  this.addInstanced(geo,mat,m,{cast:false,name:'Far forest'});}
 addInstanced(geo,mat,matrices,{cast=true,receive=true,name}={}){const m=new THREE.InstancedMesh(geo,mat,matrices.length);matrices.forEach((x,i)=>m.setMatrixAt(i,x));m.castShadow=cast&&this.quality!=='low';m.receiveShadow=receive;m.name=name||'';m.computeBoundingSphere();this.scene.add(m);return m;}
 wind(mat,strength,base=0){mat.onBeforeCompile=sh=>{sh.uniforms.uTime={value:0};mat.userData.shader=sh;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>',`#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec4 wp=instanceMatrix*vec4(0.,0.,0.,1.);\n#else\nvec4 wp=vec4(0.);\n#endif\nfloat sway=sin(uTime*1.7+wp.x*.13+wp.z*.11)*.5+sin(uTime*2.9+wp.z*.2)*.25;transformed.x+=sway*${strength.toFixed(3)}*max(0.,position.y-${base.toFixed(2)});transformed.z+=sway*${(strength*.6).toFixed(3)}*max(0.,position.y-${base.toFixed(2)});`);sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>',THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0','1.0'));};this.windMats.push(mat);}
 buildTrees(){const R=rand(4242),needle=needleTexture(),leaf=leafTexture();const count=this.quality==='low'?2200:this.quality==='medium'?4400:5600;
  const bark=new THREE.MeshStandardMaterial({color:0x5a4634,roughness:1,vertexColors:true});const cardMat=new THREE.MeshStandardMaterial({map:needle,alphaTest:.4,side:THREE.DoubleSide,roughness:.82,vertexColors:true,emissive:0x0d1808,emissiveIntensity:1});const coreMat=new THREE.MeshStandardMaterial({color:0x34492a,roughness:1,vertexColors:true});
  const leafMat=new THREE.MeshStandardMaterial({map:leaf,alphaTest:.45,side:THREE.DoubleSide,roughness:.75,vertexColors:true,emissive:0x101d08,emissiveIntensity:1});this.wind(cardMat,.012,3);this.wind(leafMat,.02,3);
  const kinds=[pineGeometry(1,13),pineGeometry(2,17),pineGeometry(3,10),pineGeometry(4,21)],broad=[broadleafGeometry(9),broadleafGeometry(10)];const mats=kinds.map(()=>[]),bmats=broad.map(()=>[]);
  const placed=[];let tries=0;while(placed.length<count&&tries<count*12){tries++;const x=(R()-.5)*(FOREST.size-20),z=(R()-.5)*(FOREST.size-20);const h=heightAt(x,z);if(h>115||!isClear(x,z))continue;
   const dens=fbm(x*.012+40,z*.012,3);if(R()>ss(.32,.6,dens)*1.1+.08)continue;// clumped forest with meadows
   const e=2,sl=Math.hypot(heightAt(x+e,z)-heightAt(x-e,z),heightAt(x,z+e)-heightAt(x,z-e))/(2*e);if(sl>.9)continue;
   const s=.75+R()*.55,m=new THREE.Matrix4().compose(new THREE.Vector3(x,h-.3,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),R()*6.28),new THREE.Vector3(s,s*(.9+R()*.25),s));
   const near=Math.hypot(x,z)<200,leafy=near&&R()<.16;if(leafy)bmats[placed.length%2].push(m);else mats[Math.floor(R()*kinds.length)].push(m);placed.push({x,z,s,leafy});}
  // Distance LOD: trees near the viewer get trunk + needle cards + shadows; distant trees are cheap cones.
  this.treeLod=[];this.lodRadius=this.quality==='low'?140:this.quality==='medium'?180:240;
  const impP=new THREE.MeshStandardMaterial({map:impostorTexture('pine'),alphaTest:.45,side:THREE.DoubleSide,roughness:1,vertexColors:true,emissive:0x0b1507}),impB=new THREE.MeshStandardMaterial({map:impostorTexture('broad'),alphaTest:.45,side:THREE.DoubleSide,roughness:1,vertexColors:true});
  const lod=(k,list,cardM,coreM,name,far)=>{if(!list.length)return;const n=list.length,mk=(g,m,cast)=>{const im=new THREE.InstancedMesh(g,m,n);im.count=0;im.castShadow=cast&&this.quality!=='low';im.receiveShadow=true;im.frustumCulled=false;im.name=name;this.scene.add(im);return im;};
   this.treeLod.push({list,pos:list.map(m=>new THREE.Vector3().setFromMatrixPosition(m)),near:[mk(k.trunk,bark,true),mk(k.core,coreM,true),mk(k.cards,cardM,true)],far:mk(far.geo,far.mat,false)});};
  const ph=[13,17,10,21];kinds.forEach((k,i)=>lod(k,mats[i],cardMat,coreMat,'Pines',{geo:impostorGeometry(ph[i]*.98,(2.3+ph[i]*.07)*2.1),mat:impP}));const bcore=new THREE.MeshStandardMaterial({color:0x3e5a2a,roughness:1,vertexColors:true});broad.forEach((k,i)=>lod(k,bmats[i],leafMat,bcore,'Broadleaf',{geo:impostorGeometry(10,7),mat:impB}));this.updateTrees(new THREE.Vector3(),true);
  // Collision trunks for trees in the playable middle.
  const trunkGeo=new THREE.CylinderGeometry(.32,.38,4,5,1,true);trunkGeo.translate(0,2,0);for(const t of placed){if(Math.hypot(t.x,t.z)>FOREST.size*.47)continue;const c=new THREE.Mesh(trunkGeo);c.position.set(t.x,heightAt(t.x,t.z)-.2,t.z);c.scale.setScalar(t.s);this.collision.add(c);this.trees.push(t);}}
 buildRocks(){const R=rand(99),geos=[rockGeometry(1),rockGeometry(2),rockGeometry(3)],mat=new THREE.MeshStandardMaterial({color:0x8a8780,roughness:.95,flatShading:true});const groups=geos.map(()=>[]);
  for(let i=0;i<(this.quality==='low'?380:900);i++){const x=(R()-.5)*(FOREST.size-30),z=(R()-.5)*(FOREST.size-30);if(!isClear(x,z,1))continue;const big=R()<.12,s=big?2+R()*3.5:.35+R()*1.1;const m=new THREE.Matrix4().compose(new THREE.Vector3(x,heightAt(x,z)-s*.25,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(R()*.4,R()*6.28,R()*.4)),new THREE.Vector3(s,s*(.7+R()*.5),s*(.8+R()*.4)));groups[i%3].push(m);
   if(big&&Math.hypot(x,z)<FOREST.size*.47){const c=new THREE.Mesh(geos[i%3]);c.applyMatrix4(m);this.collision.add(c);}}
  geos.forEach((g,i)=>this.addInstanced(g,mat,groups[i],{name:'Rocks'}));}
 buildGrass(){const R=rand(31);const geo=grassClump(7,this.quality==='low'?14:this.quality==='medium'?22:30);
  const mat=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.95,vertexColors:true,emissive:0x060c03});this.wind(mat,.22,0);const mats=[];const n=this.quality==='low'?8000:26000;
  for(let i=0;i<n*3&&mats.length<n;i++){const r=Math.sqrt(R())*380,a=R()*6.283,x=Math.cos(a)*r+(R()-.5)*40,z=Math.sin(a)*r;if(roadDistance(x,z)<3.6||Math.hypot(x,z)<50||inSite(x,z,3))continue;{const rv=riverAt(x,z);if(rv&&rv.d<rv.half+1.5)continue;}if(fbm(x*.04,z*.04,3)<.42)continue;const h=heightAt(x,z);if(h>95)continue;const s=.7+R()*.9;mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x,h-.05,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),R()*6.28),new THREE.Vector3(s,s*(.7+R()*.8),s)));}
  const g=new THREE.InstancedMesh(geo,mat,mats.length);{const c=new THREE.Color();for(let i=0;i<mats.length;i++){const p=new THREE.Vector3().setFromMatrixPosition(mats[i]);const dry=fbm(p.x*.03+9,p.z*.03,2);c.setRGB(.8+dry*.3,.85+dry*.1,.72+dry*.08).multiplyScalar(.85+R()*.2);g.setColorAt(i,c);}g.instanceColor.needsUpdate=true;}g.count=0;g.frustumCulled=false;g.receiveShadow=true;g.name='Grass';this.scene.add(g);this.grassLod={im:g,list:mats,pos:mats.map(m=>new THREE.Vector3().setFromMatrixPosition(m)),R:this.quality==='low'?90:this.quality==='medium'?130:170};}
 updateTrees(focus,force=false){if(!this.treeLod)return;if(!force&&this.lodAt&&this.lodAt.distanceToSquared(focus)<900)return;this.lodAt=focus.clone();const R2=this.lodRadius*this.lodRadius;
  for(const L of this.treeLod){let a=0,b=0;for(let i=0;i<L.list.length;i++){const p=L.pos[i],dx=p.x-focus.x,dz=p.z-focus.z;if(dx*dx+dz*dz<R2){for(const im of L.near)im.setMatrixAt(a,L.list[i]);a++;}else{L.far.setMatrixAt(b,L.list[i]);b++;}}
   for(const im of L.near){im.count=a;im.instanceMatrix.needsUpdate=true;}L.far.count=b;L.far.instanceMatrix.needsUpdate=true;}
  const G=this.grassLod;if(G){const r2=G.R*G.R;let n=0;for(let i=0;i<G.list.length;i++){const p=G.pos[i],dx=p.x-focus.x,dz=p.z-focus.z;if(dx*dx+dz*dz<r2)G.im.setMatrixAt(n++,G.list[i]);}G.im.count=n;G.im.instanceMatrix.needsUpdate=true;}}
 update(dt,focus){this.time+=dt;if(focus)this.updateTrees(focus);for(const m of this.windMats)if(m.userData.shader)m.userData.shader.uniforms.uTime.value=this.time;for(const m of this.waterMats)m.uniforms.uTime.value=this.time;if(this.clouds)this.clouds.rotation.y+=dt*.004;
  if(this.sun.castShadow&&focus){const snap=4,fx=Math.round(focus.x/snap)*snap,fz=Math.round(focus.z/snap)*snap;this.sun.target.position.set(fx,heightAt(fx,fz),fz);this.sun.position.copy(this.sun.target.position).addScaledVector(this.sunDir,220);this.sun.target.updateMatrixWorld();}}
}
