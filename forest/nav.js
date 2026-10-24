import * as THREE from 'three';
import {Capsule} from '../vendor/Capsule.js';
import {Navigation} from '../navigation.js';
// Terrain-aware navigation for the valley (v9). The base Navigation assumes the ground is at y≈0, which is
// true for the camp basin and the village — and there this class behaves exactly the same. The new places
// (Kessel Docks on the river bank, Old Kessel town) sit higher up, so every probe here starts from the
// terrain height under the point instead of from y=0.
export class ForestNav extends Navigation {
 constructor(octree,doors,ground,water){super(octree,doors);this.ground=ground;this.water=water;}
 base(x,z){const h=this.ground(x,z);return h>.05?h:0;}
 free(x,z){const key=x.toFixed(2)+','+z.toFixed(2);if(this.cache.has(key))return this.cache.get(key);const b=this.base(x,z);const lift=b?.55:.36;
  // guards don't walk along the river bed (deep water) unless something solid (pier, boat deck) is above it
  if(this.water){const wl=this.water(x,z);if(wl!=null&&wl-b>.9&&this.floor(x,z)<wl){this.cache.set(key,false);return false;}}
  const c=new Capsule(new THREE.Vector3(x,b+lift,z),new THREE.Vector3(x,b+1.4,z),.29);const hit=this.octree.capsuleIntersect(c);const ok=!hit||hit.normal.y>.7&&hit.depth<.05;this.cache.set(key,ok);return ok;}
 floor(x,z){const b=this.base(x,z);const h=this.octree.rayIntersect(new THREE.Ray(new THREE.Vector3(x,b+2.7,z),new THREE.Vector3(0,-1,0)));return h?Math.max(b?b-1:0,h.position.y):b;}
 inside(x,z){if(!this.free(x,z))return false;const b=this.base(x,z);const h=this.octree.rayIntersect(new THREE.Ray(new THREE.Vector3(x,b+(b?30:12),z),new THREE.Vector3(0,-1,0)));return !!h&&h.position.y>b+2.2;}
}
