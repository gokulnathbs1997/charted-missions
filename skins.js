import * as THREE from 'three';
// Weapon colour skins (v8.3): painted finishes bought with coins and applied to the gun only — never the hands.
// The pattern is projected in the mesh's own space (tri-planar), so it works on imported rigs and on the
// procedural guns without needing UVs, and it keeps the original shading/detail underneath.
export const SKINS={
 none:{name:'Factory',price:0,colors:null},
 desert:{name:'Desert Tiger',price:400,colors:['#c98a3c','#2a1a10','#e3b46a'],kind:'tiger'},
 woodland:{name:'Neon Viper',price:550,colors:['#2bd65a','#0e3b1a','#8cff7a'],kind:'camo'},
 arctic:{name:'Arctic Hex',price:650,colors:['#f2f6fa','#2a6fd6','#9fc4f2'],kind:'hex'},
 royal:{name:'Royal Purple',price:800,colors:['#6b3fd6','#2a1259','#e05a9c'],kind:'swirl'},
 inferno:{name:'Inferno',price:950,colors:['#e3271c','#f2c21b','#2a0805'],kind:'stripe'},
 gold:{name:'Gold Rush',price:1500,colors:['#f2c94c','#9a6b12','#fff1b0'],kind:'metal',metal:true}
};
const cache={};
function pattern(id){if(cache[id])return cache[id];const s=SKINS[id],[a,b,c]=s.colors,cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d');let seed=id.length*977;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 x.fillStyle=a;x.fillRect(0,0,256,256);
 if(s.kind==='tiger'){x.fillStyle=b;for(let i=0;i<14;i++){x.beginPath();const y=r()*256;x.moveTo(0,y);for(let k=0;k<=8;k++)x.lineTo(k*32,y+Math.sin(k*1.3+i)*14+(r()-.5)*10);for(let k=8;k>=0;k--)x.lineTo(k*32,y+8+Math.sin(k*1.3+i)*14+r()*8);x.fill();}}
 else if(s.kind==='camo'){for(const col of [b,c]){x.fillStyle=col;for(let i=0;i<22;i++){x.beginPath();const cx=r()*256,cy=r()*256;for(let k=0;k<9;k++){const ang=k/9*6.28,rr=10+r()*24;x.lineTo(cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr);}x.fill();}}}
 else if(s.kind==='hex'){x.strokeStyle=b;x.lineWidth=3;const R=16;for(let row=0;row<12;row++)for(let col=0;col<10;col++){const cx=col*R*1.75+(row%2)*R*.87,cy=row*R*1.5;x.beginPath();for(let k=0;k<6;k++){const ang=k/6*6.28+.52;x.lineTo(cx+Math.cos(ang)*R*.95,cy+Math.sin(ang)*R*.95);}x.closePath();x.stroke();if(r()<.25){x.fillStyle=c;x.fill();}}}
 else if(s.kind==='swirl'){for(let i=0;i<40;i++){x.strokeStyle=i%3?b:c;x.lineWidth=2+r()*6;x.beginPath();x.arc(r()*256,r()*256,10+r()*60,r()*6,r()*6+2);x.stroke();}for(let i=0;i<80;i++){x.fillStyle='#fff';x.globalAlpha=r()*.6;x.fillRect(r()*256,r()*256,2,2);}x.globalAlpha=1;}
 else if(s.kind==='stripe'){for(let i=-256;i<512;i+=38){x.fillStyle=b;x.beginPath();x.moveTo(i,0);x.lineTo(i+16,0);x.lineTo(i+16+256,256);x.lineTo(i+256,256);x.fill();}x.fillStyle=c;x.fillRect(0,120,256,16);}
 else if(s.kind==='metal'){const g=x.createLinearGradient(0,0,256,256);g.addColorStop(0,a);g.addColorStop(.45,c);g.addColorStop(.55,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,256,256);for(let i=0;i<300;i++){x.strokeStyle='rgba(255,255,255,.08)';x.beginPath();const y=r()*256;x.moveTo(0,y);x.lineTo(256,y+r()*4);x.stroke();}}
 const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return cache[id]=t;}
const HAND=/hand|glove|arm|ch08|bullet|hoodie/i;
// Skins one mesh's material (cloned so other meshes sharing it are untouched).
function skinMesh(o,id){const s=SKINS[id];if(!o.userData.skinBase)o.userData.skinBase=o.material;if(!s||!s.colors){o.material=o.userData.skinBase;return;}
 const base=o.userData.skinBase,m=base.clone();o.geometry.computeBoundingBox?.();const bb=o.geometry.boundingBox,size=bb?Math.max(...bb.getSize(new THREE.Vector3()).toArray()):1;const scale=3/Math.max(size,1e-4);
 if(s.metal){m.metalness=Math.max(m.metalness??0,.85);m.roughness=Math.min(m.roughness??1,.32);}
 m.onBeforeCompile=sh=>{sh.uniforms.skinMap={value:pattern(id)};sh.uniforms.skinScale={value:scale};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSkP;varying vec3 vSkN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSkP=position;vSkN=normal;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D skinMap;uniform float skinScale;varying vec3 vSkP;varying vec3 vSkN;')
   .replace('#include <map_fragment>','#include <map_fragment>\n{vec3 n=abs(normalize(vSkN));n/=(n.x+n.y+n.z);vec3 p=vSkP*skinScale;vec3 pat=texture2D(skinMap,p.yz).rgb*n.x+texture2D(skinMap,p.xz).rgb*n.y+texture2D(skinMap,p.xy).rgb*n.z;float l=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=mix(diffuseColor.rgb,pat*(.55+l*1.25),.82);}');};
 m.customProgramCacheKey=()=>'skin-'+id+scale.toFixed(3);m.needsUpdate=true;o.material=m;}
// Applies a skin to a gun root, leaving arms/hands/bullets as they are.
export function applySkin(root,id){root.traverse(o=>{if(!o.isMesh||o.userData.isHand||o.userData.outline)return;const mn=Array.isArray(o.material)?'':o.material?.name||'';if(HAND.test(o.name)||HAND.test(mn)||/gun_(glass|red|brass|hole|shell|rubber)/.test(mn)||o.userData.rim)return;if(Array.isArray(o.material))return;skinMesh(o,id);});}
// Applies the player's equipped skins to every weapon in an equipment set (any mode).
export function applySkins(equipment,profile){const eq=profile?.data?.skins?.equip||{};if(!equipment?.items)return;for(const [w,item] of Object.entries(equipment.items)){if(w==='knife')continue;const id=eq[w]||'none';if(id==='none'&&!item.skinned)continue;applySkin(item.root,id);item.skinned=id!=='none';}}
export function ownedSkins(profile){const s=profile.data.skins??={owned:['none'],equip:{}};return s;}
export function buySkin(profile,id){const s=ownedSkins(profile),k=SKINS[id];if(!k||s.owned.includes(id)||profile.data.coins<k.price)return false;profile.data.coins-=k.price;s.owned.push(id);profile.save();return true;}
export function equipSkin(profile,weapon,id){const s=ownedSkins(profile);if(!s.owned.includes(id))return false;s.equip[weapon]=id;profile.save();return true;}
