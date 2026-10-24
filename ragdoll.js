import * as THREE from 'three';
// Verlet ragdoll for the soldier skeleton (Bone_base → numbered bones). Joint positions become
// particles linked by bone-length and bracing constraints; on death the body collapses under gravity
// with the killing hit's impulse, collides with the floor below it, then the bones are aimed along the
// simulated particles so the skinned mesh follows.
const V=()=>new THREE.Vector3(),Q=()=>new THREE.Quaternion();
// Particle ids = soldier bone numbers (see enemies.js), plus synthetic tips.
const PARTS=[1,3,4,5,'headTop',7,8,9,10,11,12,6,13,14,15,'handL',35,36,37,38,'handR'];
const LINKS=[[1,3],[3,4],[4,5],[5,'headTop'],[1,7],[1,10],[7,8],[8,9],[10,11],[11,12],[3,6],[6,13],[13,14],[14,15],[15,'handL'],[3,35],[35,36],[36,37],[37,38],[38,'handR'],
 // bracing for a rigid pelvis/torso and a stiff neck
 [7,10],[7,3],[10,3],[6,35],[13,36],[13,1],[36,1],[4,6],[4,35],[3,'headTop'],[1,4],[13,4],[36,4]];
const MINS=[[7,9,.72],[10,12,.72],[13,15,.45],[36,38,.45],[1,'headTop',.85],[9,1,.5],[12,1,.5]];
// Bones aimed at a particle, parents first. [bone, target particle]
const DRIVE=[[2,3],[3,4],[4,5],[5,'headTop'],[7,8],[8,9],[10,11],[11,12],[6,13],[13,14],[14,15],[15,'handL'],[35,36],[36,37],[37,38],[38,'handR']];
const RADIUS={1:.13,3:.15,4:.1,5:.12,headTop:.1};
export class Ragdoll {
 constructor(model,bones,octree){this.model=model;this.bones=bones;this.octree=octree;this.active=false;this.sleep=false;this.root=null;model.traverse(o=>{if(o.isBone&&/^Bone_base/.test(o.name))this.root=o;});
  this.saved=[];model.traverse(o=>{if(o.isBone)this.saved.push([o,o.position.clone(),o.quaternion.clone()]);});this.ray=new THREE.Ray();}
 bone(id){return this.bones[id]?.bone;}
 reset(){for(const [b,p,q] of this.saved){b.position.copy(p);b.quaternion.copy(q);}this.active=false;this.sleep=false;this.model.userData.onRagdollReset?.();this.model.updateMatrixWorld(true);}
 // impulse: world-space velocity (m/s) applied around `at` (world point); base: whole-body velocity.
 start(impulse=V(),at=null,base=V()){if(!this.root||!this.bone(1))return false;this.model.userData.onRagdoll?.();this.model.updateMatrixWorld(true);const pos={};
  for(const id of PARTS)if(typeof id==='number'){const b=this.bone(id);if(!b)return false;pos[id]=b.getWorldPosition(V());}
  const ext=(a,b,len)=>pos[b].clone().add(pos[b].clone().sub(pos[a]).normalize().multiplyScalar(len));pos.headTop=ext(4,5,.2);pos.handL=ext(14,15,.12);pos.handR=ext(37,38,.12);
  this.tipLocal={headTop:this.bone(5).worldToLocal(pos.headTop.clone()),handL:this.bone(15).worldToLocal(pos.handL.clone()),handR:this.bone(38).worldToLocal(pos.handR.clone())};
  const dt=1/60;this.p={};this.prev={};this.floor={};for(const id of PARTS){this.p[id]=pos[id].clone();let v=base.clone().add(impulse.clone().multiplyScalar(.35));if(at){const d=pos[id].distanceTo(at);v.addScaledVector(impulse,.9*Math.exp(-d*d/.18));}v.add(new THREE.Vector3((Math.random()-.5)*.6,0,(Math.random()-.5)*.6));this.prev[id]=pos[id].clone().addScaledVector(v,-dt);this.floor[id]=0;}this.base=this.floorAt(pos[1]);for(const id of PARTS)this.floor[id]=this.cap(id,this.floorAt(pos[id]));
  this.rest=LINKS.map(([a,b])=>pos[a].distanceTo(pos[b]));this.mins=MINS.map(([a,b,k])=>pos[a].distanceTo(pos[b])*k);
  // Root frame at the moment of death.
  this.F0=this.frame();this.rootQ0=this.root.getWorldQuaternion(Q());this.rootOff=this.root.getWorldPosition(V()).sub(pos[1]).applyQuaternion(this.F0.clone().invert());
  this.active=true;this.sleep=false;this.t=0;this.acc=0;this.step=0;return true;}
 frame(){const x=this.p[10].clone().sub(this.p[7]).normalize(),y0=this.p[3].clone().sub(this.p[1]);const z=V().crossVectors(x,y0).normalize(),y=V().crossVectors(z,x).normalize();return Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));}
 floorAt(p,top=p.y){this.ray.set(new THREE.Vector3(p.x,Math.min(p.y,top)+.15,p.z),new THREE.Vector3(0,-1,0));const h=this.octree.rayIntersect(this.ray);return h?h.position.y:Math.min(0,p.y-2);}
 // Bodies may land on low furniture/steps near where they died, but never climb onto high surfaces.
 cap(id,f){return Math.min(f,this.base+(RADIUS[id]?.45:.8));}
 update(dt){if(!this.active||this.sleep)return;this.acc+=Math.min(dt,.1);const h=1/60;while(this.acc>=h){this.acc-=h;this.sim(h);}this.apply();}
 sim(h){this.t+=h;this.step++;const g=-14*h*h;let energy=0;
  for(const id of PARTS){const p=this.p[id],q=this.prev[id];const vx=(p.x-q.x)*.995,vy=(p.y-q.y)*.995,vz=(p.z-q.z)*.995;q.copy(p);p.x+=vx;p.y+=vy+g;p.z+=vz;energy+=vx*vx+vy*vy+vz*vz;
   // Torso particles do not pass through walls.
   if(RADIUS[id]&&(vx*vx+vz*vz)>1e-6){const d=V().set(vx,0,vz),len=d.length();this.ray.set(q.clone(),d.divideScalar(len));const hit=this.octree.rayIntersect(this.ray);if(hit&&hit.distance<len+RADIUS[id]){p.x=q.x;p.z=q.z;}}}
  if(this.step%3===0)for(const id of PARTS)this.floor[id]=this.cap(id,this.floorAt(this.p[id],this.prev[id].y));
  for(let it=0;it<8;it++){LINKS.forEach(([a,b],i)=>this.solve(this.p[a],this.p[b],this.rest[i],false));MINS.forEach(([a,b],i)=>this.solve(this.p[a],this.p[b],this.mins[i],true));
   for(const id of PARTS){const p=this.p[id],r=RADIUS[id]||.07,f=this.floor[id]+r;if(p.y<f){const q=this.prev[id];if(f-p.y>.25){p.x=q.x;p.z=q.z;}else{p.y=f;q.x+=(p.x-q.x)*.35;q.z+=(p.z-q.z)*.35;}}}}
  if(this.t>1.2&&energy<2e-6*PARTS.length||this.t>6)this.sleep=true;}
 solve(a,b,len,minOnly){const d=V().subVectors(b,a),l=d.length()||1e-6;if(minOnly&&l>=len)return;const k=(l-len)/l*.5;a.addScaledVector(d,k);b.addScaledVector(d,-k);}
 setWorldQuat(b,q){const pq=b.parent.getWorldQuaternion(Q());b.quaternion.copy(pq.invert().multiply(q));b.updateMatrixWorld(true);}
 apply(){const F=this.frame(),R=F.clone().multiply(this.F0.clone().invert());
  this.setWorldQuat(this.root,R.clone().multiply(this.rootQ0));const wp=this.p[1].clone().add(this.rootOff.clone().applyQuaternion(F));this.root.position.copy(this.root.parent.worldToLocal(wp));this.root.updateMatrixWorld(true);
  for(const [id,target] of DRIVE){const b=this.bone(id);if(!b)continue;const origin=b.getWorldPosition(V());const childPos=typeof target==='number'?this.bone(target).getWorldPosition(V()):b.localToWorld(this.tipLocal[target].clone());const cur=childPos.sub(origin),want=this.p[target].clone().sub(origin);if(cur.lengthSq()<1e-8||want.lengthSq()<1e-8)continue;const r=Q().setFromUnitVectors(cur.normalize(),want.normalize());this.setWorldQuat(b,r.multiply(b.getWorldQuaternion(Q())));}}
 get center(){return this.p?.[1]||null;}
}
