import * as THREE from 'three';
// Frag grenades: arcing physics against the city collision, bounces, timed fuse, radius damage.
// onExplode(position, owner) is supplied by the match, which applies damage to players and bots.
export class Grenades {
 constructor(scene,octree,effects,audio,onExplode,listener){this.scene=scene;this.octree=octree;this.effects=effects;this.audio=audio;this.onExplode=onExplode;this.listener=listener;this.list=[];this.geometry=new THREE.SphereGeometry(.07,10,8);this.material=new THREE.MeshStandardMaterial({color:0x3d4a32,roughness:.6,metalness:.3});this.ray=new THREE.Ray();}
 throw(origin,direction,owner,power=17){const mesh=new THREE.Mesh(this.geometry,this.material);mesh.position.copy(origin);this.scene.add(mesh);const velocity=direction.clone().normalize().multiplyScalar(power);velocity.y+=3.5;this.list.push({mesh,velocity,owner,fuse:2.1,rest:false});this.audio?.throw();}
 explodeAt(position,owner,weapon='grenade'){this.effects.explosion(position);this.audio?.explosion(this.listener?this.listener().distanceTo(position):0);this.onExplode?.(position.clone(),owner,weapon);}
 update(dt){for(let i=this.list.length-1;i>=0;i--){const g=this.list[i];g.fuse-=dt;if(g.fuse<=0){this.scene.remove(g.mesh);this.list.splice(i,1);this.explodeAt(g.mesh.position,g.owner);continue;}
  if(g.rest)continue;g.velocity.y-=20*dt;const step=g.velocity.clone().multiplyScalar(dt),len=step.length();if(len<1e-5)continue;this.ray.set(g.mesh.position,step.clone().divideScalar(len));const hit=this.octree.rayIntersect(this.ray);
  if(hit&&hit.distance<=len+.07){const n=hit.triangle.getNormal(new THREE.Vector3());if(n.dot(step)>0)n.negate();g.mesh.position.copy(hit.position).addScaledVector(n,.08);g.velocity.reflect(n).multiplyScalar(.42);if(g.velocity.length()>2)this.audio?.bounce();if(n.y>.6&&g.velocity.length()<1.2){g.rest=true;}}else g.mesh.position.add(step);
  if(g.mesh.position.y<.07){g.mesh.position.y=.07;if(g.velocity.y<0){g.velocity.y*=-.35;g.velocity.x*=.6;g.velocity.z*=.6;if(Math.abs(g.velocity.y)<.6&&Math.hypot(g.velocity.x,g.velocity.z)<.8)g.rest=true;}}
  g.mesh.rotation.x+=dt*8;}}
 clear(){for(const g of this.list)this.scene.remove(g.mesh);this.list=[];}
}
