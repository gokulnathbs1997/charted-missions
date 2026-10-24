import * as THREE from 'three';
import {Octree} from './vendor/Octree.js';
import {Capsule} from './vendor/Capsule.js';
const UP=new THREE.Vector3(0,1,0);
export class Doors {
 constructor(root,scene){
  this.batches=new Map();this.items=[];this.active=new Set();this.meshes=[];this.ray=new THREE.Raycaster();this.ray.far=3.2;
  root.updateMatrixWorld(true);const nodes=[];root.traverse(o=>{if(o.isMesh&&o.userData.interactiveDoor)nodes.push(o)});
  for(const old of nodes){const key=old.geometry.uuid+old.material.uuid;if(!this.batches.has(key))this.batches.set(key,{geometry:old.geometry,material:old.material,entries:[]});const batch=this.batches.get(key);const authoredMatrix=old.matrixWorld.clone();
   const geometry=old.geometry.clone().applyMatrix4(old.matrixWorld);geometry.computeBoundingBox();const pos=geometry.attributes.position;const box=geometry.boundingBox.clone();let hinge=new THREE.Vector3().fromBufferAttribute(pos,0);
   // One of the actual bottom corners is the hinge, even on rotated district walls.
   for(let i=0;i<pos.count;i++){const p=new THREE.Vector3().fromBufferAttribute(pos,i);if(p.y<hinge.y-.001||(Math.abs(p.y-hinge.y)<.001&&(p.x<hinge.x-.001||(Math.abs(p.x-hinge.x)<.001&&p.z<hinge.z))))hinge.copy(p);}
   geometry.translate(-hinge.x,-hinge.y,-hinge.z);const pivot=new THREE.Group();pivot.position.copy(hinge);const mesh=new THREE.Mesh(geometry,old.material);pivot.add(mesh);scene.add(pivot);
   const collisionGeometry=geometry.clone();const ids=[];for(let i=0;i<pos.count;i+=3)ids.push(i,i+1,i+2,i+2,i+1,i);collisionGeometry.setIndex(ids);const localTree=new Octree();localTree.fromGraphNode(new THREE.Mesh(collisionGeometry,old.material));collisionGeometry.dispose();const d={id:this.items.length,pivot,mesh,tree:localTree,angle:0,target:0,hinge,center:box.getCenter(new THREE.Vector3()),inverse:new THREE.Matrix4(),radius:box.getSize(new THREE.Vector3()).length()+1};d.authoredMatrix=authoredMatrix;d.batch=batch;d.instance=batch.entries.length;batch.entries.push(d);mesh.visible=false;mesh.userData.door=d;this.items.push(d);this.meshes.push(mesh);old.removeFromParent();
  }
  for(const batch of this.batches.values()){batch.mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.entries.length);batch.entries.forEach((d,i)=>batch.mesh.setMatrixAt(i,d.authoredMatrix));batch.mesh.computeBoundingSphere();scene.add(batch.mesh);}
 }
 sync(d){const m=new THREE.Matrix4().makeTranslation(d.hinge.x,d.hinge.y,d.hinge.z).multiply(new THREE.Matrix4().makeRotationY(d.angle)).multiply(new THREE.Matrix4().makeTranslation(-d.hinge.x,-d.hinge.y,-d.hinge.z)).multiply(d.authoredMatrix);d.batch.mesh.setMatrixAt(d.instance,m);d.batch.mesh.instanceMatrix.needsUpdate=true;}
 localCapsule(d,player){d.pivot.updateMatrixWorld(true);d.inverse.copy(d.pivot.matrixWorld).invert();return new Capsule(player.start.clone().applyMatrix4(d.inverse),player.end.clone().applyMatrix4(d.inverse),player.radius);}
 intersect(d,player){return d.tree.capsuleIntersect(this.localCapsule(d,player));}
 collide(player,velocity){for(const d of this.items){if(d.hinge.distanceToSquared(player.end)>d.radius*d.radius)continue;const hit=this.intersect(d,player);if(hit){hit.normal.transformDirection(d.pivot.matrixWorld);const dot=velocity.dot(hit.normal);if(dot<0)velocity.addScaledVector(hit.normal,-dot);player.translate(hit.normal.multiplyScalar(hit.depth+.001));}}}
 update(dt,player){for(const d of this.active){const before=d.angle;const diff=d.target-d.angle;d.angle+=Math.sign(diff)*Math.min(Math.abs(diff),dt*1.8);d.pivot.rotation.y=d.angle;d.pivot.updateMatrixWorld(true);if(d.hinge.distanceToSquared(player.end)<d.radius*d.radius&&this.intersect(d,player)){d.angle=before;d.pivot.rotation.y=before;d.pivot.updateMatrixWorld(true);}else if(Math.abs(d.angle-d.target)<.001)this.active.delete(d);this.sync(d);}}
 target(camera,world){this.ray.setFromCamera(new THREE.Vector2(),camera);const hit=this.ray.intersectObjects(this.meshes,false)[0];if(!hit)return null;const wall=this.ray.intersectObject(world,true)[0];if(wall&&wall.distance<hit.distance-.03)return null;return hit.object.userData.door;}
 toggle(d,player){if(!d)return false;if(Math.abs(d.target)>.1)d.target=0;else{const p=d.mesh.geometry.attributes.position;const v=new THREE.Vector3();let far=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.y=0;if(v.lengthSq()>far.lengthSq())far.copy(v);}const n=new THREE.Vector3().crossVectors(UP,far).normalize();const side=player.end.clone().sub(d.hinge).dot(n);d.target=(side>0?-1:1)*Math.PI*.52;}this.active.add(d);return true;}
}
