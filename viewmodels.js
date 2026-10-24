import * as THREE from 'three';
// Animated first-person weapon rigs (gun + arms). Each rig is auto-fitted to the view:
// the gun's barrel axis is measured from its mesh, rotated to point straight ahead, scaled to a
// real length and placed so the rear of the gun sits at a hip position below and right of the eye.
// Single "all animations" clips are cut into the clip names the weapon system expects.
export const VIEWMODELS={
 ak74:{file:'fps_ak_animated.glb',gun:/^base_ak74/,length:.9,rear:[.22,-.185,-.2],yaw:.24,
  cuts:{Fire:[0,.24],Reload_Empty:[.3,3.3],Reload:[3.3,5.1],Melee:[5.1,6.6],Idle:[6.6,7.4],Draw:[7.4,8.1]}},
 pistol:{file:'fps_pistol_animated.glb',gun:/^base_Mat/,length:.26,rear:[.16,-.15,-.23],yaw:.25,
  cuts:{Fire:[0,.3],Reload:[.3,2.2],Reload_Empty:[2.2,4.4],Melee:[4.4,5.9],Idle:[5.9,6.8],Draw:[6.8,7.5]}},
 ak74u:{file:'ak74u_animated.glb',gun:/Krinkov/,length:.7,rear:[.22,-.19,-.18],yaw:.24,
  names:{Fire:'SHOOT',Reload:'RELOAD1',Reload_Empty:'RELOAD2',Idle:'IDLE',Draw:'DRAW',Inspect:'INSPEC'}}
};
// Cut [start,end] seconds out of a clip by resampling every track at 30 fps.
export function cutClip(clip,name,start,end,fps=30){const tracks=[];const n=Math.max(2,Math.round((end-start)*fps)+1);
 for(const t of clip.tracks){const interp=t.createInterpolant(),size=t.getValueSize(),times=new Float32Array(n),values=new Float32Array(n*size);for(let i=0;i<n;i++){const time=start+(end-start)*i/(n-1);times[i]=time-start;values.set(interp.evaluate(time),i*size);}
  tracks.push(new t.constructor(t.name,times,values));}
 return new THREE.AnimationClip(name,end-start,tracks);}
export function rigClips(gltf,cfg){const out={};if(cfg.cuts){const all=gltf.animations[0];for(const [k,[a,b]] of Object.entries(cfg.cuts))out[k]=cutClip(all,k,a,Math.min(b,all.duration));}
 else for(const [k,v] of Object.entries(cfg.names)){const c=gltf.animations.find(c=>c.name===v);if(c){const clip=c.clone();clip.name=k;out[k]=clip;}}return out;}
// Pose the rig on frame 0 of `pose`, measure the gun, and return a wrapper Group fitted to the view.
export function fitRig(gltf,cfg,poseClip){const model=gltf.scene,wrap=new THREE.Group(),inner=new THREE.Group();inner.add(model);wrap.add(inner);
  const mixer=new THREE.AnimationMixer(model);if(poseClip){const a=mixer.clipAction(poseClip);a.play();mixer.update(0);}model.updateMatrixWorld(true);
 let gun=null;model.traverse(o=>{if(!gun&&o.isMesh&&(cfg.gun.test(o.name)||cfg.gun.test(o.material?.name||'')))gun=o;});const pts=[];if(gun){const v=new THREE.Vector3(),pos=gun.geometry.attributes.position;const step=Math.max(1,Math.floor(pos.count/6000));for(let i=0;i<pos.count;i+=step){gun.getVertexPosition(i,v);pts.push(v.clone().applyMatrix4(gun.matrixWorld));}}
 if(pts.length<10){mixer.stopAllAction();return {wrap,inner,muzzle:new THREE.Vector3(.12,-.12,-.9)};}
 // Principal axis (largest spread) via power iteration on the covariance.
 const c=new THREE.Vector3();for(const p of pts)c.add(p);c.divideScalar(pts.length);const M=[[0,0,0],[0,0,0],[0,0,0]];for(const p of pts){const d=[p.x-c.x,p.y-c.y,p.z-c.z];for(let i=0;i<3;i++)for(let j=0;j<3;j++)M[i][j]+=d[i]*d[j];}
 let axis=new THREE.Vector3(0,0,1);for(let k=0;k<30;k++){axis=new THREE.Vector3(M[0][0]*axis.x+M[0][1]*axis.y+M[0][2]*axis.z,M[1][0]*axis.x+M[1][1]*axis.y+M[1][2]*axis.z,M[2][0]*axis.x+M[2][1]*axis.y+M[2][2]*axis.z).normalize();}
 let lo=Infinity,hi=-Infinity;for(const p of pts){const s=p.clone().sub(c).dot(axis);lo=Math.min(lo,s);hi=Math.max(hi,s);}
 // The muzzle end is the thinner end: compare the spread of points near each end.
 const spread=(edge)=>{let r=0,n=0;for(const p of pts){const s=p.clone().sub(c).dot(axis);if(Math.abs(s-edge)<(hi-lo)*.08){r+=p.clone().sub(c).sub(axis.clone().multiplyScalar(s)).length();n++;}}return n?r/n:0;};
 if(spread(hi)>spread(lo)){axis.negate();[lo,hi]=[-hi,-lo];}
 const front=c.clone().addScaledVector(axis,hi),back=c.clone().addScaledVector(axis,lo);
 // Top of the gun near the rear (rear sight height) so the barrel sits below the eye line.
 let top=-Infinity;for(const p of pts){const s=p.clone().sub(c).dot(axis);if(s<lo+(hi-lo)*.4)top=Math.max(top,p.y);}
 const q=new THREE.Quaternion().setFromUnitVectors(axis.clone(),new THREE.Vector3(0,0,-1));// barrel → forward
 // Keep "up" up: after aligning the axis, roll so the rig's up projects upward.
 const up=new THREE.Vector3(0,1,0).applyQuaternion(q);const roll=Math.atan2(up.x,up.y);const qr=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),roll);q.premultiply(qr);if(cfg.yaw)q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),cfg.yaw));
 const scale=cfg.length/(hi-lo);inner.quaternion.copy(q);inner.scale.setScalar(scale);
 const rearTop=back.clone();rearTop.y=Math.max(rearTop.y,top);const placed=rearTop.clone().applyQuaternion(q).multiplyScalar(scale);inner.position.set(...cfg.rear).sub(placed);
 const muzzle=front.clone().applyQuaternion(q).multiplyScalar(scale).add(inner.position);mixer.stopAllAction();
 return {wrap,inner,muzzle,scale};}
