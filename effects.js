import * as THREE from 'three';
// Visual effects: GPU billboard particles (fire, smoke, sparks, blood, dust), decals (blood, bullet holes,
// scorch marks), debris, shockwaves and a small pool of flash lights (no shader recompiles).
// All textures are painted procedurally into one 4×4 atlas.

function hash(x,y){let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o=4){let s=0,a=.5,f=1,n=0;for(let i=0;i<o;i++){s+=a*vn(x*f,y*f);n+=a;a*=.5;f*=2.1;}return s/n;}
// Frames: 0–7 fire, 8–11 smoke, 12 spark/glow, 13 muzzle star, 14 blood splat, 15 blood droplets.
function atlas(){const S=128,c=document.createElement('canvas');c.width=c.height=S*4;const x=c.getContext('2d');
 const cell=(i,fn)=>{const img=x.createImageData(S,S);for(let py=0;py<S;py++)for(let px=0;px<S;px++){const u=px/S*2-1,v=py/S*2-1;const [r,g,b,a]=fn(u,v,px,py);const k=(py*S+px)*4;img.data[k]=r;img.data[k+1]=g;img.data[k+2]=b;img.data[k+3]=a;}x.putImageData(img,(i%4)*S,Math.floor(i/4)*S);};
 for(let f=0;f<8;f++)cell(f,(u,v)=>{const d=Math.hypot(u,v*.85+.1);const n=fbm(u*2.6+f*1.7,v*2.6-f*.9,5);const t=Math.max(0,1-d*1.15+(n-.5)*.9);const h=Math.pow(t,1.4);const core=Math.pow(t,3.2);return [255,Math.min(255,90+h*190+core*60),Math.min(255,20+core*230),Math.min(255,h*255*(1-f*.05))];});
 for(let f=0;f<4;f++)cell(8+f,(u,v)=>{const d=Math.hypot(u,v);const n=fbm(u*2.2+f*3.1+11,v*2.2+f*1.3,5);const a=Math.max(0,1-d)*Math.max(0,n*1.6-.35);const s=150+n*90;return [s,s,s*.97,Math.min(255,a*300)];});
 cell(12,(u,v)=>{const d=Math.hypot(u,v);const a=Math.max(0,1-d);return [255,240,200,Math.pow(a,2.2)*255];});
 cell(13,(u,v)=>{const d=Math.hypot(u,v),ang=Math.atan2(v,u);const rays=Math.pow(Math.abs(Math.cos(ang*3.5)),12)*Math.max(0,1-d*1.05);const core=Math.pow(Math.max(0,1-d*2.2),1.5);const a=Math.min(1,core+rays*.9+Math.max(0,1-d)*.15);return [255,230-d*90,150-d*120,a*255];});
 cell(14,(u,v)=>{const ang=Math.atan2(v,u),n=fbm(Math.cos(ang)*2+3,Math.sin(ang)*2,3);const r=.45+n*.45;const d=Math.hypot(u,v);const spl=d<r?1:0;const drops=hash(Math.floor((u+1)*9),Math.floor((v+1)*9))>.93&&d<.95?1:0;const a=Math.max(spl,drops);const shade=.6+fbm(u*6,v*6,2)*.5;return [120*shade,8,10,a*235];});
 cell(15,(u,v)=>{let a=0;for(let i=0;i<9;i++){const cx=hash(i,7)*1.4-.7,cy=hash(i,13)*1.4-.7,r=.06+hash(i,3)*.16;if(Math.hypot(u-cx,(v-cy)*.8)<r)a=1;}return [140,10,12,a*230];});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function decalTex(kind){const S=128,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),img=x.createImageData(S,S);
 for(let py=0;py<S;py++)for(let px=0;px<S;px++){const u=px/S*2-1,v=py/S*2-1,d=Math.hypot(u,v),ang=Math.atan2(v,u);let r=0,g=0,b=0,a=0;
  if(kind==='blood'){const edge=.55+fbm(Math.cos(ang)*2.5+5,Math.sin(ang)*2.5,4)*.4;a=d<edge?1:0;if(!a&&hash(px>>2,py>>2)>.985&&d<1)a=1;const s=.55+fbm(u*5,v*5,3)*.45;r=95*s;g=6;b=8;a*=.92;}
  else if(kind==='hole'){a=Math.max(0,1-d*2.6);const ring=Math.max(0,1-Math.abs(d-.35)*6)*.5;r=g=b=20;a=Math.min(1,a+ring*fbm(u*8,v*8,2));}
  else {const n=fbm(u*3+2,v*3,4);a=Math.max(0,(1-d)*1.4-n*.5);r=g=b=15+n*20;a=Math.min(.85,a);}
  const k=(py*S+px)*4;img.data[k]=r;img.data[k+1]=g;img.data[k+2]=b;img.data[k+3]=a*255;}
 x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

const VERT=`attribute vec3 iPos;attribute vec4 iColor;attribute vec3 iData;varying vec2 vUv;varying vec4 vColor;varying float vFog;
void main(){float size=iData.x,rot=iData.y,frame=iData.z;vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);vec3 up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
 float c=cos(rot),s=sin(rot);vec2 q=vec2(position.x*c-position.y*s,position.x*s+position.y*c);vec3 world=iPos+(right*q.x+up*q.y)*size;
 vec4 mv=viewMatrix*vec4(world,1.);gl_Position=projectionMatrix*mv;vFog=-mv.z;
 float f=floor(frame+.5);vUv=(uv+vec2(mod(f,4.),3.-floor(f/4.)))/4.;vColor=iColor;}`;
const FRAG=`uniform sampler2D map;uniform vec3 fogColor;uniform float fogNear,fogFar,additive;varying vec2 vUv;varying vec4 vColor;varying float vFog;
void main(){vec4 t=texture2D(map,vUv);vec4 col=t*vColor;float fog=smoothstep(fogNear,fogFar,vFog);if(additive>.5){col.rgb*=col.a*(1.-fog);gl_FragColor=vec4(col.rgb,1.);}else{col.rgb=mix(col.rgb,fogColor,fog);if(col.a<.01)discard;gl_FragColor=col;}}`;
class Particles {
 constructor(scene,map,additive,max){this.max=max;this.list=[];const g=new THREE.InstancedBufferGeometry();const base=new THREE.PlaneGeometry(1,1);g.index=base.index;g.attributes.position=base.attributes.position;g.attributes.uv=base.attributes.uv;
  this.pos=new Float32Array(max*3);this.col=new Float32Array(max*4);this.dat=new Float32Array(max*3);g.setAttribute('iPos',new THREE.InstancedBufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('iColor',new THREE.InstancedBufferAttribute(this.col,4).setUsage(THREE.DynamicDrawUsage));g.setAttribute('iData',new THREE.InstancedBufferAttribute(this.dat,3).setUsage(THREE.DynamicDrawUsage));g.instanceCount=0;
  this.mat=new THREE.ShaderMaterial({uniforms:{map:{value:map},fogColor:{value:new THREE.Color()},fogNear:{value:100},fogFar:{value:800},additive:{value:additive?1:0}},vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:false,blending:additive?THREE.CustomBlending:THREE.NormalBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor});
  this.mesh=new THREE.Mesh(g,this.mat);this.mesh.frustumCulled=false;this.mesh.renderOrder=additive?3:2;this.geo=g;scene.add(this.mesh);}
 spawn(o){if(this.list.length>=this.max)this.list.shift();this.list.push({p:o.p.clone(),v:o.v?o.v.clone():new THREE.Vector3(),life:o.life,max:o.life,s0:o.s0,s1:o.s1??o.s0,r:o.r??Math.random()*6.28,rv:o.rv??0,c0:o.c0,c1:o.c1??o.c0,f0:o.f0??0,fn:o.fn??1,g:o.g??0,drag:o.drag??0,ground:o.ground});}
 update(dt,scene){const L=this.list;let n=0;for(let i=L.length-1;i>=0;i--){const q=L[i];q.life-=dt;if(q.life<=0){L.splice(i,1);continue;}}
  for(const q of L){q.v.y-=q.g*dt;if(q.drag)q.v.multiplyScalar(Math.max(0,1-q.drag*dt));q.p.addScaledVector(q.v,dt);if(q.ground!=null&&q.p.y<q.ground){q.p.y=q.ground;q.v.set(0,0,0);}q.r+=q.rv*dt;const t=1-q.life/q.max;
   this.pos[n*3]=q.p.x;this.pos[n*3+1]=q.p.y;this.pos[n*3+2]=q.p.z;for(let k=0;k<4;k++)this.col[n*4+k]=q.c0[k]+(q.c1[k]-q.c0[k])*t;this.dat[n*3]=q.s0+(q.s1-q.s0)*t;this.dat[n*3+1]=q.r;this.dat[n*3+2]=q.f0+Math.min(q.fn-1,Math.floor(t*q.fn));n++;}
  this.geo.instanceCount=n;for(const k of ['iPos','iColor','iData'])this.geo.attributes[k].needsUpdate=true;const fog=scene.fog;if(fog){this.mat.uniforms.fogColor.value.copy(fog.color);this.mat.uniforms.fogNear.value=fog.near;this.mat.uniforms.fogFar.value=fog.far;}}
}
const R=()=>Math.random(),rs=(a)=>(Math.random()-.5)*2*a;
export class Effects {
 constructor(scene,opts={}){this.scene=scene;this.items=[];this.floor=opts.floor||(()=>0);const map=atlas();this.add=new Particles(scene,map,true,900);this.alpha=new Particles(scene,map,false,900);this.emitters=[];
  this.lights=[];for(let i=0;i<3;i++){const l=new THREE.PointLight(0xffa040,0,22,1.6);scene.add(l);this.lights.push({light:l,life:0,max:1,peak:0});}
  this.decalTex={blood:decalTex('blood'),hole:decalTex('hole'),scorch:decalTex('scorch')};this.decals=[];this.decalGeo=new THREE.PlaneGeometry(1,1);
  this.debrisGeo=new THREE.BoxGeometry(.12,.08,.1);this.debrisMat=new THREE.MeshStandardMaterial({color:0x2a2622,roughness:.9});this.debris=[];this.rings=[];this.ringGeo=new THREE.RingGeometry(.85,1,48);}
 setFloor(fn){this.floor=fn;}
 track(mesh,life,velocity){this.scene.add(mesh);this.items.push({mesh,life,max:life,velocity});}
 flashLight(p,peak=40,life=.3,color=0xffa040){const slot=this.lights.reduce((a,b)=>a.life<b.life?a:b);slot.light.position.copy(p);slot.light.color.setHex(color);slot.peak=peak;slot.life=slot.max=life;}
 tracer(a,b,enemy=false){const geometry=new THREE.BufferGeometry().setFromPoints([a,b]);const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:enemy?0xff8650:0xffe5a2,transparent:true,opacity:.7}));line.userData.uniqueGeometry=true;this.track(line,.065);}
 // Bullet impact on a surface: sparks, dust puff and a bullet hole.
 impact(p,normal,opts={}){const n=normal||new THREE.Vector3(0,1,0);for(let i=0;i<6;i++)this.add.spawn({p,v:n.clone().multiplyScalar(2+R()*3).add(new THREE.Vector3(rs(2.5),R()*2.5,rs(2.5))),life:.18+R()*.22,s0:.05,s1:.01,c0:[1,.85,.55,1],c1:[1,.4,.1,0],f0:12,g:9.8});
  for(let i=0;i<2;i++)this.alpha.spawn({p:p.clone().addScaledVector(n,.05),v:n.clone().multiplyScalar(.5+R()*.4).add(new THREE.Vector3(0,.25,0)),life:.7+R()*.5,s0:.12,s1:.7,c0:[.55,.52,.47,.55],c1:[.6,.58,.55,0],f0:8+Math.floor(R()*4),drag:1.5});
  if(opts.hole!==false&&normal)this.decal('hole',p,normal,.09+R()*.04);}
 // Blood: spray along the bullet direction, mist for headshots, decal on the ground/wall behind.
 blood(p,dir,opts={}){const d=dir?dir.clone().normalize():new THREE.Vector3(0,0,1);const head=!!opts.head,amount=head?1.6:1;
  for(let i=0;i<Math.round(14*amount);i++)this.alpha.spawn({p,v:d.clone().multiplyScalar(1.5+R()*3.5).add(new THREE.Vector3(rs(1.2),R()*1.8,rs(1.2))),life:.45+R()*.4,s0:.05+R()*.05,s1:.02,c0:[.55,.02,.03,1],c1:[.35,.01,.02,.8],f0:15,g:9.8,ground:this.floor(p.x,p.z)+.02});
  for(let i=0;i<Math.round(4*amount);i++)this.alpha.spawn({p:p.clone().addScaledVector(d,.15),v:d.clone().multiplyScalar(.8+R()).add(new THREE.Vector3(rs(.4),rs(.3),rs(.4))),life:.35+R()*.3,s0:.18,s1:head?.9:.55,c0:[.5,.02,.03,.75],c1:[.35,.02,.02,0],f0:14,rv:rs(2),drag:3});
  const gy=this.floor(p.x,p.z);if(p.y-gy<2.2)this.decal('blood',new THREE.Vector3(p.x+d.x*.6,gy+.015,p.z+d.z*.6),new THREE.Vector3(0,1,0),.35+R()*.35);
  if(opts.wall)this.decal('blood',opts.wall.point,opts.wall.normal,.4+R()*.3);}
 // Growing pool under a body.
 bloodPool(p){const m=this.decal('blood',new THREE.Vector3(p.x,this.floor(p.x,p.z)+.012,p.z),new THREE.Vector3(0,1,0),.2);if(m){m.userData.grow={from:.2,to:1.1+R()*.5,t:0,dur:6};}}
 decal(kind,p,normal,size){const mat=new THREE.MeshBasicMaterial({map:this.decalTex[kind],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,fog:true});const m=new THREE.Mesh(this.decalGeo,mat);m.position.copy(p).addScaledVector(normal,.012);m.lookAt(p.clone().add(normal));m.rotateZ(R()*6.28);m.scale.setScalar(size);m.renderOrder=1;this.scene.add(m);this.decals.push(m);if(this.decals.length>90){const old=this.decals.shift();this.scene.remove(old);old.material.dispose();}return m;}
 // Fire emitter (campfires, burning depot). Returns a handle with .stop().
 fire(p,scale=1,opts={}){const e={p:p.clone(),scale,acc:0,smoke:opts.smoke??true,alive:true,light:opts.light,kind:opts.kind||'fire',dir:opts.dir||null,width:opts.width||4};this.emitters.push(e);return {stop:()=>e.alive=false};}
 emit(e,dt){if(e.kind==='mist'){e.acc+=dt;while(e.acc>.06){e.acc-=.06;const s=e.scale,lat=rs(e.width*.5);const p=e.p.clone().add(new THREE.Vector3(e.dir?-e.dir.z*lat:lat,.3,e.dir?e.dir.x*lat:rs(1)));this.alpha.spawn({p,v:new THREE.Vector3(rs(1.2)+(e.dir?e.dir.x*1.5:0),1.2+R()*1.6,rs(1.2)+(e.dir?e.dir.z*1.5:0)),life:2.2+R()*1.8,s0:1.2*s,s1:(5+R()*3)*s,c0:[.9,.93,.95,.32],c1:[.95,.97,1,0],f0:8+Math.floor(R()*4),rv:rs(.4),drag:.8});if(R()<.5)this.alpha.spawn({p:p.clone().add(new THREE.Vector3(0,.2,0)),v:new THREE.Vector3(rs(2.5),2+R()*3,rs(2.5)),life:.6+R()*.5,s0:.12,s1:.04,c0:[.95,.97,1,.8],c1:[.9,.95,1,0],f0:15,g:9.8});}return;}
  e.acc+=dt;const rate=1/(22*e.scale+6);while(e.acc>rate){e.acc-=rate;const s=e.scale;this.add.spawn({p:e.p.clone().add(new THREE.Vector3(rs(.25*s),.05,rs(.25*s))),v:new THREE.Vector3(rs(.2),1.2+R()*1.1*s,rs(.2)),life:.55+R()*.4,s0:.45*s,s1:.12*s,c0:[1,.75,.45,.95],c1:[1,.3,.08,0],f0:Math.floor(R()*4),fn:4,rv:rs(1.5)});
  if(e.smoke&&R()<.35)this.alpha.spawn({p:e.p.clone().add(new THREE.Vector3(rs(.2*s),1.1*s,rs(.2*s))),v:new THREE.Vector3(rs(.3)+.25,.9+R()*.6,rs(.3)),life:2.5+R()*2,s0:.5*s,s1:2.6*s,c0:[.18,.17,.16,.5],c1:[.35,.34,.33,0],f0:8+Math.floor(R()*4),rv:rs(.6)});if(R()<.08)this.add.spawn({p:e.p.clone().add(new THREE.Vector3(rs(.2),.3,rs(.2))),v:new THREE.Vector3(rs(.6),2+R()*2,rs(.6)),life:.8+R(),s0:.04,s1:.01,c0:[1,.7,.3,1],c1:[1,.3,0,0],f0:12,g:-.4});}}
 // Big explosion: flash, fireball, smoke column, sparks, debris, shockwave, scorch mark, dust.
 explosion(p,scale=1){const s=scale,gy=this.floor(p.x,p.z),base=new THREE.Vector3(p.x,Math.max(p.y,gy),p.z);this.flashLight(base.clone().add(new THREE.Vector3(0,1.2,0)),70*s,.45);
  this.add.spawn({p:base.clone().add(new THREE.Vector3(0,.6,0)),life:.12,s0:3.5*s,s1:6*s,c0:[1,1,.9,1],c1:[1,.8,.5,0],f0:12});
  for(let i=0;i<26;i++){const dir=new THREE.Vector3(rs(1),R()*.9+.2,rs(1)).normalize();this.add.spawn({p:base.clone().add(new THREE.Vector3(0,.4,0)).addScaledVector(dir,R()*.8*s),v:dir.multiplyScalar((3+R()*5)*s).add(new THREE.Vector3(0,1.5,0)),life:.55+R()*.55,s0:(1.4+R()*1.4)*s,s1:(2.6+R()*1.6)*s,c0:[1,.85,.6,1],c1:[.9,.25,.05,0],f0:Math.floor(R()*8),fn:1,rv:rs(2),drag:3.5});}
  for(let i=0;i<22;i++){const dir=new THREE.Vector3(rs(1),R()*.8+.1,rs(1)).normalize();this.alpha.spawn({p:base.clone().add(new THREE.Vector3(0,.6,0)).addScaledVector(dir,R()*1.2*s),v:dir.multiplyScalar((1.5+R()*2.5)*s).add(new THREE.Vector3(0,1.6+R()*1.4,0)),life:3+R()*3,s0:(1.4+R())*s,s1:(5+R()*3)*s,c0:[.12,.11,.1,.85],c1:[.42,.4,.38,0],f0:8+Math.floor(R()*4),rv:rs(.5),drag:.9});}
  for(let i=0;i<40;i++)this.add.spawn({p:base.clone().add(new THREE.Vector3(0,.5,0)),v:new THREE.Vector3(rs(1),R()*.9+.1,rs(1)).normalize().multiplyScalar((7+R()*11)*s),life:.5+R()*.9,s0:.09,s1:.02,c0:[1,.9,.6,1],c1:[1,.35,.05,0],f0:12,g:9.8,drag:.6,ground:gy+.03});
  for(let i=0;i<10;i++)this.alpha.spawn({p:base.clone().add(new THREE.Vector3(rs(1),.2,rs(1))),v:new THREE.Vector3(rs(1),.15,rs(1)).normalize().multiplyScalar(6*s),life:1.4+R(),s0:1*s,s1:3.5*s,c0:[.45,.4,.33,.6],c1:[.5,.46,.4,0],f0:8+Math.floor(R()*4),drag:2.5});
  for(let i=0;i<9;i++){const m=new THREE.Mesh(this.debrisGeo,this.debrisMat);m.position.copy(base).add(new THREE.Vector3(0,.4,0));m.scale.setScalar(.6+R()*1.4);m.castShadow=true;this.scene.add(m);this.debris.push({m,v:new THREE.Vector3(rs(1),.6+R(),rs(1)).normalize().multiplyScalar(6+R()*7),av:new THREE.Vector3(rs(12),rs(12),rs(12)),life:4+R()*2});}
  const ring=new THREE.Mesh(this.ringGeo,new THREE.MeshBasicMaterial({color:0xfff2d0,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(base.x,gy+.08,base.z);this.scene.add(ring);this.rings.push({m:ring,t:0,dur:.45,max:9*s});
  this.decal('scorch',new THREE.Vector3(base.x,gy+.02,base.z),new THREE.Vector3(0,1,0),3.2*s);}
 // Enemy muzzle flash (world space).
 muzzle(p,dir){this.add.spawn({p,life:.05,s0:.35,s1:.5,c0:[1,.9,.6,1],c1:[1,.6,.3,0],f0:13});this.flashLight(p,6,.06,0xffc070);this.alpha.spawn({p,v:new THREE.Vector3(rs(.2),.4,rs(.2)),life:.6,s0:.08,s1:.4,c0:[.6,.6,.6,.25],c1:[.7,.7,.7,0],f0:8+Math.floor(R()*4)});}
 dust(p,amount=1){for(let i=0;i<4*amount;i++)this.alpha.spawn({p:p.clone().add(new THREE.Vector3(rs(.4),.05,rs(.4))),v:new THREE.Vector3(rs(.8),.3+R()*.5,rs(.8)),life:1+R(),s0:.3,s1:1.2,c0:[.5,.46,.38,.5],c1:[.55,.5,.44,0],f0:8+Math.floor(R()*4),drag:2});}
 update(dt){for(const L of this.lights){if(L.life>0){L.life=Math.max(0,L.life-dt);L.light.intensity=L.peak*Math.pow(L.life/L.max,1.5);}else L.light.intensity=0;}
  for(let i=this.items.length-1;i>=0;i--){const f=this.items[i];f.life-=dt;if(f.life<=0){this.scene.remove(f.mesh);f.mesh.material.dispose();if(f.mesh.userData.uniqueGeometry)f.mesh.geometry.dispose();this.items.splice(i,1);continue;}if(f.velocity)f.mesh.position.addScaledVector(f.velocity,dt);if(f.mesh.material.transparent)f.mesh.material.opacity=Math.min(.8,f.life/f.max);}
  this.emitters=this.emitters.filter(e=>e.alive);for(const e of this.emitters)this.emit(e,dt);
  for(let i=this.debris.length-1;i>=0;i--){const d=this.debris[i];d.life-=dt;d.v.y-=12*dt;d.m.position.addScaledVector(d.v,dt);d.m.rotation.x+=d.av.x*dt;d.m.rotation.y+=d.av.y*dt;const gy=this.floor(d.m.position.x,d.m.position.z)+.04;if(d.m.position.y<gy){d.m.position.y=gy;d.v.y*=-.3;d.v.x*=.5;d.v.z*=.5;d.av.multiplyScalar(.5);}if(d.life<=0){this.scene.remove(d.m);this.debris.splice(i,1);}}
  for(let i=this.rings.length-1;i>=0;i--){const r=this.rings[i];r.t+=dt;const k=r.t/r.dur;r.m.scale.setScalar(.5+k*r.max);r.m.material.opacity=.55*(1-k);if(k>=1){this.scene.remove(r.m);r.m.material.dispose();this.rings.splice(i,1);}}
  for(const d of this.decals){const g=d.userData.grow;if(g&&g.t<g.dur){g.t+=dt;const k=1-Math.pow(1-Math.min(1,g.t/g.dur),2);d.scale.setScalar(g.from+(g.to-g.from)*k);}}
  this.add.update(dt,this.scene);this.alpha.update(dt,this.scene);}
}
