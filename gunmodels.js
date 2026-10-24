import * as THREE from 'three';
// v8.4 — detailed procedural weapon models (original designs, no third-party assets).
// Built from bevelled side-profile extrusions, lathed/turned barrels, rails, sights and small parts,
// with canvas-generated metal, polymer and wood surfaces. Convention: the gun points down -z, +y is up,
// the pistol grip sits near the origin. userData: muzzle (point), grip (right wrist target), fore
// (left/support wrist target), handgun (bool).
const MATS={};let NOISE=null;
function noiseTex(){if(NOISE)return NOISE;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,128,128);for(let i=0;i<2600;i++){const v=110+Math.random()*50|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(Math.random()*128,Math.random()*128,1+Math.random()*2,1);}NOISE=new THREE.CanvasTexture(c);NOISE.wrapS=NOISE.wrapT=THREE.RepeatWrapping;NOISE.repeat.set(6,6);return NOISE;}
function woodTex(base){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,256,64);for(let i=0;i<46;i++){x.strokeStyle=`rgba(${40+Math.random()*30|0},${20+Math.random()*15|0},8,${.18+Math.random()*.25})`;x.lineWidth=.6+Math.random()*1.6;x.beginPath();const y=Math.random()*64;x.moveTo(0,y);x.bezierCurveTo(80,y+Math.random()*8-4,170,y+Math.random()*8-4,256,y+Math.random()*6-3);x.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,10);return t;}
function mat(key){if(MATS[key])return MATS[key];const n=noiseTex();const M=(o)=>new THREE.MeshStandardMaterial(o);
 const m={metal:()=>M({color:0x2c3034,metalness:.72,roughness:.36,roughnessMap:n}),dark:()=>M({color:0x17191b,metalness:.55,roughness:.45,roughnessMap:n}),blued:()=>M({color:0x22262e,metalness:.8,roughness:.28,roughnessMap:n}),
  steel:()=>M({color:0x9aa0a6,metalness:.9,roughness:.26,roughnessMap:n}),poly:()=>M({color:0x1c1e20,metalness:.05,roughness:.78,roughnessMap:n}),fde:()=>M({color:0x8a7656,metalness:.05,roughness:.75,roughnessMap:n}),od:()=>M({color:0x4b5038,metalness:.05,roughness:.78,roughnessMap:n}),
  wood:()=>M({color:0xffffff,map:woodTex('#7a4524'),metalness:0,roughness:.55}),woodL:()=>M({color:0xffffff,map:woodTex('#9a6034'),metalness:0,roughness:.5}),plum:()=>M({color:0x4a2520,metalness:.05,roughness:.6}),magAk:()=>M({color:0x8a4a1c,metalness:.05,roughness:.55,roughnessMap:n}),
  glass:()=>M({color:0x183048,metalness:.95,roughness:.04,emissive:0x081622,emissiveIntensity:1}),red:()=>M({color:0xff2a1a,emissive:0xff2a1a,emissiveIntensity:3}),shell:()=>M({color:0xa3271c,metalness:.1,roughness:.5}),brass:()=>M({color:0xb08a3c,metalness:.9,roughness:.3}),hole:()=>M({color:0x050505,roughness:1}),rubber:()=>M({color:0x121212,roughness:.95})}[key]();
 m.name='gun_'+key;return MATS[key]=m;}
// --- geometry helpers (f = distance forward along the barrel axis, i.e. z = -f) ---
const FWD=new THREE.Matrix4().set(0,0,1,0, 0,1,0,0, -1,0,0,0, 0,0,0,1);
function shape(pts){const s=new THREE.Shape();pts.forEach((p,i)=>{if(p[0]==='q')s.quadraticCurveTo(p[1],p[2],p[3],p[4]);else if(i===0)s.moveTo(p[0],p[1]);else s.lineTo(p[0],p[1]);});return s;}
class G{constructor(){this.g=new THREE.Group();this.part=null;}
 mesh(geo,m,pos=[0,0,0],rot=[0,0,0]){const o=new THREE.Mesh(geo,typeof m==='string'?mat(m):m);o.position.set(...pos);o.rotation.set(...rot);if(this.part)o.userData.part=this.part;this.g.add(o);return o;}
 // side profile [[f,y],...] extruded to width w (centred on x0) with soft bevelled edges
 prof(pts,w,m,{b=.0035,x0=0,holes=[]}={}){const s=shape(pts);for(const h of holes)s.holes.push(shape(h));const geo=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,w-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:10});geo.translate(0,0,-(w-2*b)/2);geo.applyMatrix4(FWD);geo.computeVertexNormals();return this.mesh(geo,m,[x0,0,0]);}
 // cylinder along the barrel axis from f0 (rear) to f0+len (front)
 cyl(r0,r1,len,f0,y,m,{x=0,seg=18,open=false}={}){const geo=new THREE.CylinderGeometry(r1,r0,len,seg,1,open);geo.rotateX(-Math.PI/2);return this.mesh(geo,m,[x,y,-(f0+len/2)]);}
 box(w,h,l,f,y,m,{x=0,rx=0,ry=0,rz=0}={}){return this.mesh(new THREE.BoxGeometry(w,h,l),m,[x,y,-f],[rx,ry,rz]);}
 // a picatinny rail: base plus cross slots
 rail(f0,f1,y,{w=.022,m='dark',x=0,side=0}={}){const len=f1-f0;if(side){this.box(.006,w,len,(f0+f1)/2,y,m,{x});for(let f=f0+.006;f<f1;f+=.0105)this.box(.009,w*.9,.005,f,y,m,{x:x+Math.sign(side)*.002});return;}this.box(w*.7,.006,len,(f0+f1)/2,y,m,{x});for(let f=f0+.006;f<f1;f+=.0105)this.box(w,.006,.005,f,y+.0045,m,{x});}
 lathe(pts,f0,y,m,{seg=24,x=0}={}){const geo=new THREE.LatheGeometry(pts.map(([r,t])=>new THREE.Vector2(r,t)),seg);geo.rotateX(-Math.PI/2);return this.mesh(geo,m,[x,y,-f0]);}
 ring(r,tube,f,y,m,{x=0}={}){const geo=new THREE.TorusGeometry(r,tube,8,24);return this.mesh(geo,m,[x,y,-f]);}
 trigger(f,y,{w=.008}={}){this.prof([[f+.02,y],[f+.02,y-.006],[f-.03,y-.006],['q',f-.05,y-.03,f-.025,y-.045],[f+.025,y-.05],['q',f+.03,y-.035,f+.02,y-.012],[f+.014,y-.012],['q',f+.02,y-.03,f+.012,y-.04],[f-.02,y-.038],['q',f-.04,y-.025,f-.024,y-.006],[f+.02,y-.0065]],w,'dark',{b:.0012});
  this.prof([[f+.004,y-.006],[f+.008,y-.006],['q',f+.004,y-.02,f-.004,y-.028],[f-.006,y-.024],['q',f,y-.016,f+.004,y-.006]],.006,'steel',{b:.001});}
 done(ud){this.g.userData={...ud,muzzle:new THREE.Vector3(0,ud.muzzleY??.016,-ud.muzzle),grip:new THREE.Vector3(...ud.grip),fore:new THREE.Vector3(...ud.fore)};this.g.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});return this.g;}}
// ---------------- models ----------------
function smg(){const b=new G();
 b.prof([[-.13,-.012],[-.13,.032],[-.1,.04],[.2,.04],[.215,.03],[.215,-.016],[.16,-.022],[.03,-.022],[.01,-.03],[-.06,-.03],[-.1,-.02]],.05,'poly');// upper receiver
 b.prof([[.1,-.022],[.1,.028],[.3,.028],[.31,.018],[.31,-.026],[.12,-.03]],.054,'fde',{b:.005});// handguard
 for(const s of [-1,1])for(let f=.14;f<.29;f+=.035)b.box(.003,.012,.022,f,.002,'hole',{x:s*.0272});// M-LOK slots
 b.rail(-.09,.3,.044);b.rail(.16,.3,-.032,{w:.018});
 b.cyl(.011,.011,.08,.3,.006,'metal');b.lathe([[0,0],[.0145,0],[.0145,.05],[.011,.055],[0,.055]],.37,.006,'dark');for(let i=0;i<4;i++)b.box(.004,.03,.004,.395,.006,'hole',{rz:i*Math.PI/4});
 b.prof([[-.03,-.03],[.025,-.03],[.02,-.06],['q',.012,-.1,-.002,-.142],[-.045,-.15],['q',-.05,-.12,-.03,-.03]],.033,'poly',{b:.006});// pistol grip
 b.trigger(.06,-.022);
 b.part='mag';b.prof([[.065,-.03],[.105,-.03],[.115,-.1],[.125,-.172],[.082,-.178],[.072,-.1]],.026,'dark',{b:.003});b.box(.03,.008,.048,.103,-.177,'poly');b.part=null;// magazine
 // folding stock: tube struts + butt pad
 for(const y of [.012,-.012])b.cyl(.0055,.0055,.24,-.33,y,'dark',{x:.0});b.prof([[-.36,-.06],[-.33,-.06],[-.33,.045],[-.36,.045],['q',-.375,0,-.36,-.06]],.042,'rubber',{b:.006});b.box(.03,.02,.03,-.1,.0,'dark');
 // red dot
 b.box(.03,.018,.06,.02,.058,'dark');b.lathe([[0,0],[.018,0],[.018,.035],[.016,.04],[0,.04]],0,.083,'poly');b.ring(.0145,.002,.042,.083,'dark');b.mesh(new THREE.CircleGeometry(.014,20),'glass',[0,.083,-.041]);b.mesh(new THREE.CircleGeometry(.0018,8),'red',[0,.083,-.0405]);
 b.box(.006,.012,.016,-.03,.036,'steel',{x:.028});b.box(.004,.016,.05,.06,.012,'hole',{x:.026});// charging handle, ejection port
 return b.done({muzzle:.425,muzzleY:.006,grip:[.0,-.06,.01],fore:[0,-.03,-.22]});}
function shotgun(){const b=new G();
 b.prof([[-.05,-.03],[-.05,.032],[-.02,.04],[.18,.04],[.19,.03],[.19,-.032],[.02,-.036]],.046,'blued');b.box(.004,.022,.07,.08,.008,'hole',{x:.0235});// receiver + port
 b.cyl(.0125,.0125,.54,.18,.022,'blued');b.box(.006,.004,.5,.44,.036,'dark');b.mesh(new THREE.SphereGeometry(.003,8,6),'brass',[0,.041,-.69]);// barrel, rib, bead
 b.cyl(.011,.011,.44,.18,-.012,'blued');b.lathe([[0,0],[.0125,0],[.0125,.014],[0,.016]],.62,-.012,'steel');b.box(.012,.03,.012,.6,.005,'blued');// mag tube, cap, barrel clamp
 b.cyl(.022,.022,.17,.3,-.008,'wood',{seg:20});for(let f=.31;f<.47;f+=.013)b.ring(.0222,.0018,f,-.008,'dark');// pump with grooves
 b.prof([[-.04,-.03],[.02,-.036],[.035,-.04],['q',.0,-.07,-.03,-.12],[-.07,-.12],['q',-.06,-.08,-.1,-.06],[-.4,-.1],[-.42,-.1],[-.42,.03],[-.36,.03],[-.12,.012],[-.05,.032]],.04,'wood',{b:.007});b.prof([[-.435,-.1],[-.42,-.1],[-.42,.03],[-.435,.03]],.042,'rubber',{b:.004});
 b.trigger(.03,-.034);
 // side-saddle shells
 b.box(.006,.045,.09,.08,-.002,'poly',{x:-.026});for(let i=0;i<4;i++){b.mesh(new THREE.CylinderGeometry(.0095,.0095,.05,14),'shell',[-.032,-.004,-(.045+i*.022)]);b.mesh(new THREE.CylinderGeometry(.0098,.0098,.012,14),'brass',[-.032,-.033,-(.045+i*.022)]);}
 return b.done({muzzle:.72,muzzleY:.022,grip:[0,-.07,.03],fore:[0,-.03,-.38]});}
function sniper(){const b=new G();
 b.prof([[-.46,-.11],[-.43,-.11],[-.43,-.02],[-.3,-.035],['q',-.18,-.03,-.14,-.075],[-.09,-.13],[-.04,-.135],['q',-.03,-.09,-.01,-.04],[.32,-.04],[.34,-.02],[.34,.008],[-.06,.008],[-.12,.02],['q',-.2,.045,-.28,.04],[-.43,.035],[-.46,.04]],.046,'od',{b:.006,holes:[[[-.12,-.045],[-.07,-.045],['q',-.06,-.09,-.08,-.11],[-.1,-.1],['q',-.13,-.07,-.12,-.045]]]});// chassis with thumbhole
 b.prof([[-.475,-.115],[-.46,-.115],[-.46,.045],[-.475,.045]],.05,'rubber',{b:.004});b.box(.03,.02,.12,-.3,.052,'od');// buttpad, cheek riser
 b.cyl(.021,.021,.22,-.06,.022,'blued');b.lathe([[0,0],[.021,0],[.021,.01],[0,.012]],-.07,.022,'blued');// receiver
 b.cyl(.0135,.0105,.66,.16,.022,'blued',{seg:20});for(let i=0;i<6;i++){const a=i/6*Math.PI*2;b.box(.003,.003,.4,.48,.022+Math.sin(a)*.0115,'hole',{x:Math.cos(a)*.0115});}// fluted barrel
 b.box(.03,.022,.07,.86,.022,'dark');for(const f of [.84,.86,.88])for(const s of [-1,1])b.box(.004,.012,.008,f,.022,'hole',{x:s*.0152});// muzzle brake
 // bolt handle
 b.mesh(new THREE.CylinderGeometry(.0045,.0045,.06,10),'steel',[-.045,.02,-.03],[0,0,Math.PI/2]);b.mesh(new THREE.SphereGeometry(.011,14,10),'dark',[-.077,.018,-.03]);
 b.prof([[.0,-.04],[.08,-.04],[.08,-.1],[.0,-.1]],.034,'dark',{b:.003});b.trigger(-.03,-.04);
 // scope with rings, turrets and lenses
 b.rail(-.1,.18,.045,{w:.02});for(const f of [-.04,.12])b.box(.026,.03,.022,f,.06,'dark');
 b.cyl(.0145,.0145,.24,-.12,.082,'dark');b.lathe([[0,0],[.0145,0],[.026,.04],[.026,.085],[0,.085]],.12,.082,'dark');b.lathe([[0,0],[.021,0],[.021,.05],[.0145,.065],[0,.065]],-.185,.082,'dark');
 b.mesh(new THREE.CylinderGeometry(.009,.009,.022,14),'dark',[0,.105,-.04]);b.mesh(new THREE.CylinderGeometry(.009,.009,.022,14),'dark',[.025,.082,-.04],[0,0,Math.PI/2]);
 b.mesh(new THREE.CircleGeometry(.024,24),'glass',[0,.082,-.206]);b.mesh(new THREE.CircleGeometry(.019,24),'glass',[0,.082,.186],[0,Math.PI,0]);
 b.part='mag';b.prof([[.06,-.04],[.12,-.04],[.13,-.11],[.06,-.11]],.03,'dark',{b:.003});b.part=null;// magazine
 for(const s of [-1,1]){b.cyl(.004,.004,.2,.1,-.05,'dark',{x:s*.012});}// folded bipod legs
 return b.done({muzzle:.9,muzzleY:.022,grip:[0,-.07,.05],fore:[0,-.04,-.22]});}
function magnum(){const b=new G();
 // Heavy .44 semi-auto: long slab-sided slide with a full-length rib, triangular barrel shroud, big trigger guard.
 b.prof([[-.07,.0],[-.07,.036],[.16,.036],[.175,.026],[.175,.0]],.03,'steel',{b:.0035});for(let f=-.065;f<-.025;f+=.007)b.box(.0315,.026,.0025,f,.018,'hole');b.box(.008,.006,.2,.05,.04,'steel');
 b.prof([[.09,.0],[.175,.0],[.175,-.012],[.09,-.012]],.032,'steel',{b:.003});b.mesh(new THREE.CircleGeometry(.0062,14),'hole',[0,.016,-.1755]);
 b.prof([[-.06,-.002],[.16,-.002],[.16,-.02],[.05,-.022],[.04,-.032],[-.05,-.032]],.028,'blued',{b:.003});b.rail(.08,.15,-.024,{w:.018});
 b.prof([[.0,-.03],[.06,-.03],[.06,-.04],['q',.06,-.07,.03,-.072],[.0,-.06]],.012,'blued',{b:.002});
 b.prof([[-.055,-.026],[.002,-.026],[-.006,-.07],['q',-.014,-.115,-.03,-.138],[-.078,-.134],['q',-.072,-.08,-.055,-.026]],.034,'wood',{b:.006});b.trigger(.022,-.024,{w:.006});
 b.part='mag';b.box(.026,.012,.03,-.045,-.135,'blued');b.part=null;b.box(.006,.012,.008,.165,.044,'steel');b.box(.02,.01,.008,-.065,.042,'steel');b.mesh(new THREE.CylinderGeometry(.006,.006,.012,10),'blued',[-.074,.03,0],[0,0,Math.PI/2]);
 return b.done({muzzle:.176,muzzleY:.016,grip:[0,-.075,.04],fore:[0,-.08,.03],handgun:true});}
function revolver(){const b=new G();
 b.prof([[-.03,-.02],[-.03,.03],[.0,.035],[.06,.035],[.075,.02],[.075,-.03],[.02,-.03],[.005,-.04],[-.02,-.035]],.03,'steel',{b:.003});// frame
 b.cyl(.023,.023,.045,.015,.008,'steel',{seg:24});for(let i=0;i<6;i++){const a=i/6*Math.PI*2+Math.PI/6;b.box(.004,.004,.04,.037,.008+Math.sin(a)*.023,'blued',{x:Math.cos(a)*.023});b.mesh(new THREE.CircleGeometry(.0055,12),'hole',[Math.cos(a+Math.PI/6)*.012,.008+Math.sin(a+Math.PI/6)*.012,-.0605]);}
 b.cyl(.0095,.0095,.2,.075,.022,'steel');b.prof([[.075,.012],[.27,.012],[.275,-.006],[.075,-.008]],.016,'steel',{b:.003});b.box(.004,.012,.012,.262,.036,'steel');b.mesh(new THREE.CircleGeometry(.004,12),'hole',[0,.022,-.2755]);// barrel, underlug, sight, bore
 b.prof([[-.03,.03],[-.05,.045],[-.055,.04],[-.035,.025]],.008,'blued',{b:.0015});// hammer
 b.prof([[-.03,-.02],[.0,-.035],[-.01,-.07],['q',-.02,-.11,-.045,-.125],[-.075,-.12],['q',-.07,-.06,-.04,-.02]],.034,'wood',{b:.006});b.trigger(.02,-.03,{w:.006});
 return b.done({muzzle:.28,muzzleY:.022,grip:[0,-.07,.04],fore:[0,-.075,.035],handgun:true});}
function pistol(){const b=new G();
 b.prof([[-.06,.0],[-.06,.03],[.13,.03],[.14,.022],[.14,.0]],.026,'dark',{b:.003});for(let f=-.055;f<-.02;f+=.006)b.box(.0275,.022,.002,f,.016,'hole');// slide + serrations
 b.prof([[-.05,-.002],[.13,-.002],[.13,-.018],[.04,-.018],[.03,-.026],[-.04,-.026]],.024,'poly',{b:.003});b.rail(.06,.12,-.02,{w:.016});
 b.prof([[-.045,-.02],[.0,-.02],[-.006,-.06],['q',-.012,-.1,-.025,-.12],[-.065,-.118],['q',-.06,-.07,-.045,-.02]],.03,'poly',{b:.006});b.trigger(.02,-.018,{w:.006});
 b.box(.004,.008,.006,.13,.034,'dark');b.box(.016,.008,.006,-.055,.034,'dark');b.mesh(new THREE.CircleGeometry(.0045,12),'hole',[0,.015,-.1405]);
 return b.done({muzzle:.142,muzzleY:.015,grip:[0,-.07,.035],fore:[0,-.075,.03],handgun:true});}
function rifle(kind){const b=new G(),ak=kind==='ak74'||kind==='ak74u',short=kind==='ak74u';
 if(ak){const L=short?.0:.0;
  b.prof([[-.07,-.035],[-.07,.03],[.2,.03],[.21,.02],[.21,-.035]],.046,'blued');b.prof([[-.06,.03],[.17,.03],[.18,.04],[-.04,.042]],.04,'blued',{b:.006});// receiver + dust cover
  b.prof([[.21,-.03],[.21,.02],[short?.33:.42,.02],[short?.34:.43,-.008],[short?.34:.43,-.03]],.05,short?'plum':'wood',{b:.006});// lower handguard
  b.cyl(.012,.012,short?.08:.12,.2,.035,'blued');b.prof([[.2,.03],[short?.32:.41,.03],[short?.32:.41,.048],[.2,.048]],.034,short?'plum':'wood',{b:.006});// gas tube + upper handguard
  b.cyl(.0105,.0105,short?.2:.36,.2,.0,'blued');b.lathe([[0,0],[.016,0],[.016,.07],[.012,.08],[0,.08]],short?.4:.56,.0,'blued');b.box(.004,.03,.01,short?.36:.53,.024,'blued');// barrel, brake, front sight
  b.part='mag';b.prof([[.075,-.035],[.125,-.035],['q',.17,-.12,.22,-.2],[.17,-.225],['q',.105,-.13,.068,-.04]],.032,'magAk',{b:.004});for(let i=0;i<5;i++)b.box(.033,.003,.012,.1+i*.02,-.06-i*.032,'dark',{rx:-.55-i*.06});b.part=null;// curved magazine with ribs
  b.prof([[-.03,-.035],[.02,-.035],[.012,-.07],['q',.0,-.11,-.02,-.13],[-.055,-.125],['q',-.05,-.08,-.03,-.035]],.032,short?'poly':'plum',{b:.006});b.trigger(.045,-.035);
  if(short){b.prof([[-.07,.02],[-.32,-.02],[-.34,-.02],[-.34,-.08],[-.31,-.08],[-.07,-.02]],.008,'blued',{x0:.012,b:.002});b.prof([[-.07,.02],[-.32,-.02],[-.34,-.02],[-.34,-.08],[-.31,-.08],[-.07,-.02]],.008,'blued',{x0:-.012,b:.002});b.box(.034,.06,.012,-.33,-.05,'blued');}
  else b.prof([[-.07,.02],[-.07,-.035],[-.12,-.06],[-.43,-.1],[-.45,-.1],[-.45,.02],[-.42,.03]],.042,'plum',{b:.008});
  b.box(.012,.012,.03,.07,.034,'steel',{x:.025});
  return b.done({muzzle:short?.48:.64,muzzleY:0,grip:[0,-.07,.03],fore:[0,-.02,short?-.28:-.32]});}
 // M4 family
 b.prof([[-.07,-.015],[-.07,.03],[.2,.03],[.2,-.015]],.044,'dark');b.prof([[-.05,-.015],[.13,-.015],[.12,-.04],[.02,-.045],[-.04,-.035]],.042,'dark');// upper + lower
 b.prof([[.2,-.032],[.2,.028],[.46,.028],[.46,-.032]],.05,'dark',{b:.006});for(const s of [-1,1])b.rail(.21,.45,-.002,{side:s,x:s*.026,w:.018});b.rail(-.06,.45,.035);b.rail(.24,.45,-.035,{w:.018});// handguard + rails
 b.cyl(.0105,.0105,.2,.46,.0,'blued');b.lathe([[0,0],[.0115,0],[.0115,.05],[.0095,.055],[0,.055]],.66,.0,'dark');for(let i=0;i<3;i++)b.box(.003,.025,.003,.69,0,'hole',{rz:i*Math.PI/3});
 if(kind==='suppressed'){b.lathe([[0,0],[.018,0],[.02,.01],[.02,.17],[.018,.18],[0,.18]],.64,.0,'poly');}
 b.part='mag';b.prof([[.075,-.04],[.12,-.04],['q',.14,-.11,.16,-.17],[.12,-.18],['q',.1,-.11,.072,-.04]],.028,'dark',{b:.003});b.part=null;// STANAG magazine
 b.prof([[-.03,-.03],[.02,-.03],[.012,-.065],['q',.0,-.1,-.018,-.125],[-.05,-.12],['q',-.045,-.08,-.03,-.03]],.03,'poly',{b:.006});b.trigger(.045,-.035);
 b.cyl(.014,.014,.16,-.23,.012,'dark');b.prof([[-.13,.035],[-.13,-.05],[-.36,-.07],[-.38,-.07],['q',-.392,-.02,-.38,.035]],.04,'poly',{b:.007});// buffer tube + stock
 b.box(.016,.02,.035,.0,.05,'dark');b.box(.004,.022,.004,-.005,.065,'dark');b.box(.016,.026,.02,.44,.05,'dark');b.box(.004,.022,.004,.44,.066,'dark');// rear & front flip sights
 b.box(.004,.016,.05,.09,.012,'hole',{x:.023});b.box(.016,.008,.025,-.07,.034,'dark');
 return b.done({muzzle:kind==='suppressed'?.83:.72,muzzleY:0,grip:[0,-.07,.03],fore:[0,-.03,-.34]});}
export function buildGun(type){if(type==='smg')return smg();if(type==='shotgun')return shotgun();if(type==='sniper')return sniper();if(type==='magnum')return magnum();if(type==='revolver')return revolver();if(type==='pistol')return pistol();return rifle(['ak74','ak74u','suppressed','m4'].includes(type)?type:'m4');}
