import * as THREE from 'three';
// Gloved first-person arms (fps_arms_gloved.glb) posed procedurally with two-bone IK.
// Each hand gets a target position, a palm direction and a finger curl; the shoulder and elbow
// are solved to reach it. Finger "grip" rotations are borrowed from the AK rig (same skeleton naming).
const V=()=>new THREE.Vector3(),Q=()=>new THREE.Quaternion();
const key=n=>{const m=n.match(/^(L|R)_(arm|elbow|wrist|thumb\d|point\d|middle\d|ring\d|pink\d)/);return m?m[1]+'_'+m[2]:null;};
export function fixSpecGloss(gltf){const json=gltf.parser.json;return Promise.all((json.materials||[]).map(async def=>{const legacy=def.extensions?.KHR_materials_pbrSpecularGlossiness;if(!legacy)return;const tex=legacy.diffuseTexture?await gltf.parser.getDependency('texture',legacy.diffuseTexture.index):null;if(tex)tex.colorSpace=THREE.SRGBColorSpace;gltf.scene.traverse(o=>{if(o.isMesh&&o.material.name===def.name){o.material.map=tex;o.material.color.fromArray(legacy.diffuseFactor||[1,1,1]);o.material.metalness=0;o.material.roughness=.8;o.material.needsUpdate=true;}});}));}
export class GlovedArms {
 constructor(gltf,gripSource){this.root=new THREE.Group();this.model=gltf.scene;this.inner=new THREE.Group();this.inner.add(this.model);this.root.add(this.inner);
  this.inner.rotation.y=Math.PI;this.inner.scale.setScalar(.01);this.palmSign=-1;this.inner.position.set(0,-.36,-.42);
  this.model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;}});this.bones={};this.model.traverse(o=>{if(o.isBone){const k=key(o.name);if(k&&!this.bones[k])this.bones[k]=o;}});
  this.rest={};for(const [k,b] of Object.entries(this.bones))this.rest[k]=b.quaternion.clone();
  // Grip pose for fingers from another rig of the same family (AK rig, holding pose).
  this.grip={};if(gripSource){const g=gripSource;g.updateMatrixWorld(true);g.traverse(o=>{if(o.isBone){const k=key(o.name);if(k&&/thumb|point|middle|ring|pink/.test(k)&&!this.grip[k])this.grip[k]=o.quaternion.clone();}});}
  this.root.updateMatrixWorld(true);}
 // curl: 0 = relaxed rest pose, 1 = full grip from the source rig.
 fingers(side,curl){for(const [k,b] of Object.entries(this.bones)){if(!k.startsWith(side+'_')||!/thumb|point|middle|ring|pink/.test(k))continue;const g=this.grip[k];b.quaternion.copy(this.rest[k]);if(g)b.quaternion.slerp(g,curl);}}
 setWorldQuat(bone,q){const pq=bone.parent.getWorldQuaternion(Q());bone.quaternion.copy(pq.invert().multiply(q));bone.updateMatrixWorld(true);}
 rotateWorld(bone,from,to){const wq=bone.getWorldQuaternion(Q());const r=Q().setFromUnitVectors(from.clone().normalize(),to.clone().normalize());this.setWorldQuat(bone,r.multiply(wq));}
 // target/pole/palm are in the arms' parent space (the weapon-scene view space).
 // normal (optional): the direction the palm should face (view space). The hand is rolled about its
 // finger axis until the palm faces that way — this is what makes a grip read correctly (v9.1).
 reach(side,target,pole,palm,twist=0,normal=null){const S=this.bones[side+'_arm'],E=this.bones[side+'_elbow'],W=this.bones[side+'_wrist'];if(!S||!E||!W)return;
  for(const k of ['arm','elbow','wrist'])this.bones[side+'_'+k].quaternion.copy(this.rest[side+'_'+k]);this.root.updateMatrixWorld(true);
  const toWorld=v=>v.clone().applyMatrix4(this.root.matrixWorld);const T=toWorld(target);
  const s=S.getWorldPosition(V()),e=E.getWorldPosition(V()),w=W.getWorldPosition(V());const a=e.distanceTo(s),b=w.distanceTo(e);
  const dir=T.clone().sub(s);let d=dir.length();dir.normalize();d=Math.min(d,(a+b)*.999);const cosA=THREE.MathUtils.clamp((a*a+d*d-b*b)/(2*a*d),-1,1),sinA=Math.sqrt(1-cosA*cosA);
  const pw=toWorld(pole).sub(s);const perp=pw.clone().sub(dir.clone().multiplyScalar(pw.dot(dir))).normalize();const e2=s.clone().addScaledVector(dir,a*cosA).addScaledVector(perp,a*sinA);
  this.rotateWorld(S,e.clone().sub(s),e2.clone().sub(s));const e3=E.getWorldPosition(V()),w3=W.getWorldPosition(V());const t2=s.clone().addScaledVector(dir,d);this.rotateWorld(E,w3.clone().sub(e3),t2.clone().sub(e3));
  // Hand orientation: align the hand's forward (wrist→middle knuckle) with `palm`, then twist.
  const mid=this.bones[side+'_middle1'];if(mid&&palm){const wp=W.getWorldPosition(V()),mp=mid.getWorldPosition(V());const pw2=toWorld(palm.clone().add(target)).sub(T);this.rotateWorld(W,mp.clone().sub(wp),pw2);if(normal){const ax=pw2.clone().normalize(),cur=this.palmNormal(side);if(cur){const want=toWorld(normal.clone().add(target)).sub(T);const pc=cur.sub(ax.clone().multiplyScalar(cur.dot(ax))).normalize(),pt=want.sub(ax.clone().multiplyScalar(want.dot(ax))).normalize();let ang=Math.acos(THREE.MathUtils.clamp(pc.dot(pt),-1,1));if(pc.clone().cross(pt).dot(ax)<0)ang=-ang;const wq=W.getWorldQuaternion(Q());this.setWorldQuat(W,Q().setFromAxisAngle(ax,ang).multiply(wq));}}
  if(twist){const axis=pw2.clone().normalize();const wq=W.getWorldQuaternion(Q());this.setWorldQuat(W,Q().setFromAxisAngle(axis,twist).multiply(wq));}}}
 // World-space palm normal from the knuckles: across = pinky→index, forward = wrist→middle.
 palmNormal(side){const W=this.bones[side+'_wrist'],I=this.bones[side+'_point1'],P=this.bones[side+'_pink1'],Mi=this.bones[side+'_middle1'];if(!W||!I||!P||!Mi)return null;this.root.updateMatrixWorld(true);const w=W.getWorldPosition(V()),i=I.getWorldPosition(V()),p=P.getWorldPosition(V()),m=Mi.getWorldPosition(V());const across=i.sub(p),fwd=m.sub(w);const n=side==='R'?across.clone().cross(fwd):fwd.clone().cross(across);return n.normalize().multiplyScalar(this.palmSign??1);}
 wristMatrix(side){const W=this.bones[side+'_wrist'];return W?W.matrixWorld:null;}
}
