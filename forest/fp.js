import * as THREE from 'three';
// Procedural first-person hands and props (rope, ladder, zip-line, medkit, pills, aspirin syringe).
// Lives in the weapon scene so it renders on top of the world like the guns.
function camo(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#5d6345';x.fillRect(0,0,128,128);const cols=['#3f4630','#7b7a55','#2d3224','#6b5e43'];for(let i=0;i<60;i++){x.fillStyle=cols[i%4];x.beginPath();x.ellipse(Math.random()*128,Math.random()*128,6+Math.random()*16,4+Math.random()*9,Math.random()*3,0,7);x.fill();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
function ropeTex(){const c=document.createElement('canvas');c.width=16;c.height=128;const x=c.getContext('2d');for(let y=0;y<128;y+=8){x.fillStyle=y%16?'#7d6c4e':'#5d4f38';x.fillRect(0,y,16,8);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,y+6,16,2);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
const M=(o)=>new THREE.MeshStandardMaterial({roughness:.8,...o});
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
export class FPHands {
 // opts.arms: a GlovedArms instance (forest/arms.js). Without it the simple box hands are used.
 constructor(scene,opts={}){this.root=new THREE.Group();scene.add(this.root);this.mode=null;this.t=0;this.phase=0;this.arms=opts.arms||null;
  this.glove=M({color:0x2b2d26});this.sleeve=M({map:camo()});this.skin=M({color:0xa98568});
  this.groups={};for(const k of ['rope','ladder','zip','medkit','pills','syringe','swim','mantle'])this.groups[k]=this.group();
  // Rope: vertical rope with two gripping hands.
  this.ropeTex=ropeTex();const rope=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,5,8),M({map:this.ropeTex}));rope.position.set(.02,-.1,-.42);this.ropeTex.repeat.set(1,6);this.groups.rope.add(rope);
  this.ropeL=this.hand(this.groups.rope,[-.0,.06,-.43],[.1,0,-.3]);this.ropeR=this.hand(this.groups.rope,[.04,-.13,-.43],[-.1,0,.3]);
  // Ladder hands.
  this.ladL=this.hand(this.groups.ladder,[-.2,0,-.42],[0,0,-.1]);this.ladR=this.hand(this.groups.ladder,[.2,0,-.42],[0,0,.1]);
  // Zip-line: trolley + handle bar held above the head.
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.42,8),M({color:0x222222,metalness:.7}));bar.rotation.z=Math.PI/2;bar.position.set(0,.36,-.36);this.groups.zip.add(bar);const trolley=new THREE.Mesh(new THREE.BoxGeometry(.12,.1,.18),M({color:0x9a2e20,metalness:.5}));trolley.position.set(0,.58,-.36);this.groups.zip.add(trolley);for(const sx of [-.17,.17]){const strap=new THREE.Mesh(new THREE.BoxGeometry(.02,.24,.02),M({color:0x111111}));strap.position.set(sx*.6,.47,-.36);this.groups.zip.add(strap);}
  this.zipL=this.hand(this.groups.zip,[-.12,.33,-.36],[0,0,.0],true);this.zipR=this.hand(this.groups.zip,[.12,.33,-.36],[0,0,0],true);
  // Swimming (breaststroke) and mantling hands.
  this.swL=this.hand(this.groups.swim,[-.15,-.2,-.4],[-.6,0,.4]);this.swR=this.hand(this.groups.swim,[.15,-.2,-.4],[-.6,0,-.4]);this.mnL=this.hand(this.groups.mantle,[-.22,-.12,-.45],[-1.1,0,.1]);this.mnR=this.hand(this.groups.mantle,[.22,-.12,-.45],[-1.1,0,-.1]);
  // Medkit.
  const kit=new THREE.Group();const boxM=new THREE.Mesh(new THREE.BoxGeometry(.26,.08,.18),M({color:0xb3261e}));kit.add(boxM);const cross=new THREE.Mesh(new THREE.BoxGeometry(.1,.085,.03),M({color:0xffffff}));kit.add(cross);const cross2=cross.clone();cross2.rotation.y=Math.PI/2;kit.add(cross2);kit.position.set(.05,-.34,-.5);this.groups.medkit.add(kit);this.kit=kit;
  this.medArm=this.forearm(this.groups.medkit);this.bandage=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.07,14),M({color:0xf2f0e8}));this.groups.medkit.add(this.bandage);this.medR=this.hand(this.groups.medkit,[.2,-.2,-.45],[0,0,.3]);
  // Pills.
  const bottle=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.09,14),M({color:0xd27a1e,transparent:true,opacity:.92}));bottle.add(b);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,.025,14),M({color:0xffffff}));cap.position.y=.055;bottle.add(cap);const lab=new THREE.Mesh(new THREE.CylinderGeometry(.031,.031,.045,14,1,true),M({color:0xf5f1e0}));bottle.add(lab);this.bottle=bottle;this.pillHand=this.hand(this.groups.pills,[0,0,0],[0,0,0]);this.pillHand.add(bottle);bottle.position.set(0,.07,-.04);
  // Syringe.
  this.synArm=this.forearm(this.groups.syringe);const syr=new THREE.Group();const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.12,10),M({color:0xd8f0ff,transparent:true,opacity:.6,roughness:.1}));barrel.rotation.z=Math.PI/2;syr.add(barrel);const fluid=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.1,8),M({color:0xe8d24a,emissive:0x443300}));fluid.rotation.z=Math.PI/2;syr.add(fluid);this.fluid=fluid;const needle=new THREE.Mesh(new THREE.CylinderGeometry(.0015,.0015,.06,6),M({color:0xcccccc,metalness:.9}));needle.rotation.z=Math.PI/2;needle.position.x=-.09;syr.add(needle);const plunger=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.08,6),M({color:0xffffff}));plunger.rotation.z=Math.PI/2;plunger.position.x=.09;syr.add(plunger);this.plunger=plunger;this.syringe=syr;this.synHand=this.hand(this.groups.syringe,[0,0,0],[0,0,0]);this.synHand.add(syr);syr.position.set(-.03,.06,-.03);
  if(this.arms){this.root.add(this.arms.root);for(const h of [this.ropeL,this.ropeR,this.ladL,this.ladR,this.zipL,this.zipR,this.medArm,this.medR,this.synArm,this.swL,this.swR,this.mnL,this.mnR])h.visible=false;
   this.groups.pills.add(this.bottle);this.groups.syringe.add(this.syringe);this.syringe.scale.setScalar(1.7);this.syringe.children[0].material.opacity=.85;this.bottle.scale.setScalar(1.3);this.pillHand.visible=false;this.synHand.visible=false;this.syringe.rotation.set(0,0,0);bar.position.set(0,.215,-.36);trolley.position.set(0,.4,-.36);for(const c of this.groups.zip.children)if(c.geometry?.type==='BoxGeometry'&&c!==trolley){c.position.y=.31;}}
  this.show(null);}
 // Pose both gloved hands. h = {t:[x,y,z], pole:[..], palm:[..], curl, twist}
 pose(L,R){if(!this.arms)return;for(const [side,h] of [['L',L],['R',R]]){this.arms.reach(side,V3(...h.t),V3(...h.pole),h.palm?V3(...h.palm):null,h.twist||0,h.normal?V3(...h.normal):null);this.arms.fingers(side,h.curl??1);}}
 group(){const g=new THREE.Group();this.root.add(g);return g;}
 hand(parent,pos,rot,up=false){const h=new THREE.Group();const glove=new THREE.Mesh(new THREE.BoxGeometry(.075,.095,.1),this.glove);h.add(glove);const fingers=new THREE.Mesh(new THREE.BoxGeometry(.075,.03,.07),this.glove);fingers.position.set(0,.05,-.03);h.add(fingers);const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.042,.05,.42,10),this.sleeve);sleeve.rotation.x=-.4;sleeve.position.set(0,-.24,.07);h.add(sleeve);h.position.set(...pos);h.rotation.set(...rot);parent.add(h);return h;}
 forearm(parent){const a=new THREE.Group();const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.36,10),this.sleeve);sleeve.rotation.z=Math.PI/2;sleeve.position.x=-.2;a.add(sleeve);const skin=new THREE.Mesh(new THREE.CylinderGeometry(.033,.038,.12,10),this.skin);skin.rotation.z=Math.PI/2;skin.position.x=.0;a.add(skin);const glove=new THREE.Mesh(new THREE.BoxGeometry(.1,.085,.075),this.glove);glove.position.x=.1;a.add(glove);a.position.set(-.1,-.24,-.5);a.rotation.set(.2,.35,-.1);parent.add(a);return a;}
 show(mode){this.mode=mode;this.t=0;for(const [k,g] of Object.entries(this.groups))g.visible=k===mode;this.root.visible=!!mode;if(this.arms){this.arms.root.visible=!!mode;if(mode==='rope')this.ropeSlide(0,false);else if(mode==='ladder')this.ladder(0);else if(mode==='zip')this.zip(0,0);else if(mode==='swim')this.swim(0);else if(mode==='mantle')this.mantle(0);else if(mode)this.med(mode,0);}}
 ropeSlide(dt,sliding){this.ropeTex.offset.y+=dt*(sliding?6:0);this.t+=dt;this.ropeL.position.x=Math.sin(this.t*17)*.004;this.ropeR.position.y=-.13+Math.sin(this.t*13)*.004;const j=sliding?.004:0,t=this.t;
  // v9.1: hand over hand on the rope — left hand above, right hand below, fingers wrapped round the rope from
  // each side, palms toward the rope, backs of the gloves toward you.
  this.pose({t:[-.07+Math.sin(t*17)*j,0+Math.sin(t*11)*j,-.405],pole:[-.75,-.6,.2],palm:[1,.12,-.35],normal:[.1,0,-1],curl:sliding?1.1:1.25},{t:[.11,-.2+Math.sin(t*13)*j,-.405],pole:[.75,-.6,.2],palm:[-1,.12,-.35],normal:[-.1,0,-1],curl:sliding?1.1:1.25});}
 // v9.1: overhand rung grip — backs of the gloves toward you, knuckles up, fingers wrapped over the rung,
 // palms facing the ladder; hands alternate rung to rung.
 ladder(phase){const a=Math.sin(phase),b=Math.sin(phase+Math.PI);const reachA=Math.max(0,a),reachB=Math.max(0,b);
  this.pose({t:[-.21,-.14+a*.11,-.36-reachA*.03],pole:[-.9,-.55,.15],palm:[.05,.8,-.6],normal:[.05,-.3,-1],curl:1.15},{t:[.21,-.14+b*.11,-.36-reachB*.03],pole:[.9,-.55,.15],palm:[-.05,.8,-.6],normal:[-.05,-.3,-1],curl:1.15});this.ladL.position.y=-.05+a*.12;this.ladR.position.y=-.05+b*.12;this.ladL.position.z=-.42-Math.max(0,a)*.04;this.ladR.position.z=-.42-Math.max(0,b)*.04;}
 // Hands on given rung heights (view space y of each rung) with a reach lift while changing rungs.
 ladderGrip(yl,yr,ll=0,lr=0){const Lp=[-.15,yl-.045,-.36+ll*.05],Rp=[.15,yr-.045,-.36+lr*.05];this.pose({t:Lp,pole:[-.9,-.55,.15],palm:[.05,.8,-.6],normal:[.05,-.3,-1],curl:1.15-ll*.7},{t:Rp,pole:[.9,-.55,.15],palm:[-.05,.8,-.6],normal:[-.05,-.3,-1],curl:1.15-lr*.7});
  this.ladL.position.set(-.2,yl-.03,-.42+ll*.05);this.ladR.position.set(.2,yr-.03,-.42+lr*.05);}
 zip(t,speed){this.root.position.set(Math.sin(t*8)*.004*speed,Math.sin(t*11)*.004*speed,0);this.pose({t:[-.11,.19,-.36],pole:[-.7,-.3,.3],palm:[0,1,-.45],curl:1.2},{t:[.11,.19,-.36],pole:[.7,-.3,.3],palm:[0,1,-.45],curl:1.2});}
 // Breaststroke: hands meet in front of the chest, reach forward, sweep out and back.
 swim(phase,under=false){const r=(1-Math.cos(phase))/2,s=Math.max(0,Math.sin(phase-.6)),y=-.15-(under?.02:0)+Math.sin(phase*2)*.01;
  const L=[-.05-s*.3,y+r*.05,-.3-r*.25+s*.08],Rr=[.05+s*.3,y+r*.05,-.3-r*.25+s*.08];
  this.swL.position.set(...L);this.swR.position.set(...Rr);this.swL.rotation.set(-.9,0,.5+s*.6);this.swR.rotation.set(-.9,0,-.5-s*.6);
  this.pose({t:L,pole:[-.8,-.5,.2],palm:[-.15-s*.5,.04,-1],normal:[-.25-s*.75,-1,0],curl:.2},{t:Rr,pole:[.8,-.5,.2],palm:[.15+s*.5,.04,-1],normal:[.25+s*.75,-1,0],curl:.2});}
 // Mantle: both palms plant on the ledge and push the body up.
 mantle(k){const push=Math.min(1,k*1.6),y=-.08-push*.24,z=-.42+push*.12;this.mnL.position.set(-.22,y,z);this.mnR.position.set(.22,y,z);
  this.pose({t:[-.2,y,z],pole:[-.9,-.3,.1],palm:[.1,-.1,-1],normal:[0,-1,0],curl:.45},{t:[.2,y,z],pole:[.9,-.3,.1],palm:[-.1,-.1,-1],normal:[0,-1,0],curl:.45});}
 // Medical animations: t goes 0→1 over the action.
 med(kind,t){const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;const inOut=Math.min(1,t*5)*Math.min(1,(1-t)*5);
  if(kind==='medkit'){this.kit.position.y=-.5+ease(Math.min(1,t*4))*.18-Math.max(0,t-.85)*1.2;this.kit.rotation.x=.5;this.medArm.position.y=-.45+inOut*.24;const w=Math.max(0,Math.min(1,(t-.25)/.6));const a=w*Math.PI*8;this.bandage.visible=w>0&&w<1;this.bandage.position.set(-.16+w*.18,this.medArm.position.y+Math.sin(a)*.06,-.5+Math.cos(a)*.06);this.medR.position.set(this.bandage.position.x+.05,this.bandage.position.y-.02,this.bandage.position.z+.04);}
  if(kind==='pills'){const up=ease(Math.min(1,t*2.2))*Math.min(1,(1-t)*4);this.pillHand.position.set(.14-up*.12,-.42+up*.3,-.42+up*.04);this.pillHand.rotation.set(-up*.45,0,up*.35);this.bottle.rotation.z=up*1.1;}
  if(this.arms)return this.medArms(kind,t,ease,inOut);
  if(kind==='syringe'){this.synArm.position.y=-.45+inOut*.21;const reach=ease(Math.min(1,t*2.2));const out=Math.max(0,(t-.82)*5);this.synHand.position.set(.32-reach*.27+out*.2,-.2+reach*.0,-.42-reach*.06);this.synHand.rotation.set(0,0,.2);const push=Math.max(0,Math.min(1,(t-.45)/.33));this.plunger.position.x=.09-push*.075;this.fluid.scale.y=1-push*.92;this.fluid.position.x=push*.04;}}
 medArms(kind,t,ease,inOut){const low=-.62+inOut*.38;
  if(kind==='medkit'){this.kit.position.set(.06,-.5+ease(Math.min(1,t*4))*.18-Math.max(0,t-.85)*1.2,-.5);this.kit.rotation.x=.5;const w=Math.max(0,Math.min(1,(t-.25)/.6)),a=w*Math.PI*8,c=V3(-.12,low+.01,-.44);this.bandage.visible=w>0&&w<1;this.bandage.position.set(c.x+(w-.5)*.1,c.y+Math.sin(a)*.055,c.z+Math.cos(a)*.055);
   const rt=w>0&&w<1?[this.bandage.position.x+.03,this.bandage.position.y,this.bandage.position.z+.03]:[.16,-.32+inOut*.08,-.42];this.pose({t:[-.03,low,-.42],pole:[-.8,-.6,0],palm:[1,.1,-.3],curl:.35},{t:rt,pole:[.7,-.6,.1],palm:[-1,0,-.2],curl:.95});}
  if(kind==='pills'){const up=ease(Math.min(1,t*2.2))*Math.min(1,(1-t)*4);const rt=[.16-up*.1,-.38+up*.2,-.42+up*.06];this.bottle.position.set(rt[0]-.015,rt[1]+.06,rt[2]-.02);this.bottle.rotation.set(0,0,up*1.2);this.pose({t:[-.28,-.7,-.3],pole:[-.8,-.6,0],palm:[0,1,-1],curl:.5},{t:rt,pole:[.7,-.6,.2],palm:[-.2,1,-.4],curl:.85});}
  if(kind==='syringe'){const reach=ease(Math.min(1,t*2.2)),out=Math.max(0,(t-.82)*5);const rt=[.2-reach*.13+out*.15,-.25+reach*.01,-.42-reach*.04];this.syringe.position.set(rt[0]-.07,rt[1]+.05,rt[2]);const push=Math.max(0,Math.min(1,(t-.45)/.33));this.plunger.position.x=.09-push*.075;this.fluid.scale.y=1-push*.92;this.fluid.position.x=push*.04;
   this.pose({t:[-.04,low+.05,-.47],pole:[-.7,-.7,0],palm:[1,-.05,-.25],curl:.55},{t:rt,pole:[.7,-.6,.1],palm:[-1,.2,-.3],curl:.9});}}
}
