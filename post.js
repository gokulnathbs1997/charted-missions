import * as THREE from 'three';
// Cinematic post-processing: HDR scene buffer → bloom → ACES filmic tone mapping → colour grade
// (cool shadows / warm highlights, contrast, saturation) → vignette, chromatic aberration, grain,
// plus slow-motion and kill-cam grading. Also runs dynamic resolution to hold the frame rate on phones.
const QUAD=new THREE.PlaneGeometry(2,2);
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
function pass(fs,uniforms){const m=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:fs,uniforms,depthTest:false,depthWrite:false,toneMapped:false});const s=new THREE.Scene();s.add(new THREE.Mesh(QUAD,m));return {m,s};}
export class PostFX {
 constructor(renderer,{quality='high',dynamic=true}={}){this.r=renderer;this.enabled=quality!=='low';this.quality=quality;this.dynamic=dynamic;this.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.maxRatio=Math.min(devicePixelRatio||1,quality==='high'?1.6:1.25);this.minRatio=.55;this.ratio=this.maxRatio;this.ft=[];this.t=0;
  const hf=renderer.capabilities.isWebGL2?THREE.HalfFloatType:THREE.UnsignedByteType;
  this.rt=new THREE.WebGLRenderTarget(4,4,{type:hf,samples:quality==='high'&&renderer.capabilities.isWebGL2?4:0,depthBuffer:true});
  const mk=()=>new THREE.WebGLRenderTarget(4,4,{type:hf,depthBuffer:false});this.b1=mk();this.b2=mk();this.b3=mk();
  this.bright=pass('uniform sampler2D tex;uniform float thr;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(thr,thr+.6,l),1.);}',{tex:{value:null},thr:{value:.85}});
  this.blur=pass('uniform sampler2D tex;uniform vec2 dir;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb*.227;c+=(texture2D(tex,vUv+dir*1.385).rgb+texture2D(tex,vUv-dir*1.385).rgb)*.316;c+=(texture2D(tex,vUv+dir*3.231).rgb+texture2D(tex,vUv-dir*3.231).rgb)*.07;gl_FragColor=vec4(c,1.);}',{tex:{value:null},dir:{value:new THREE.Vector2()}});
  this.final=pass(`uniform sampler2D tex,bloom;uniform float exposure,bloomK,time,vig,ca,grain,slow,sat,contrast,warm,red;uniform vec2 res;varying vec2 vUv;
   vec3 rrt(vec3 v){vec3 a=v*(v+.0245786)-.000090537;vec3 b=v*(.983729*v+.432951)+.238081;return a/b;}
   vec3 aces(vec3 c){const mat3 I=mat3(vec3(.59719,.076,.0284),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));c=I*(c/.6);c=rrt(c);return clamp(O*c,0.,1.);}
   vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
   float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
   void main(){vec2 d=vUv-.5;float r2=dot(d,d);vec2 off=d*ca*r2;
    vec3 c=vec3(texture2D(tex,vUv+off).r,texture2D(tex,vUv).g,texture2D(tex,vUv-off).b);
    c+=texture2D(bloom,vUv).rgb*bloomK;c*=exposure;c=aces(c);
    float l=dot(c,vec3(.2126,.7152,.0722));
    c+=vec3(-.012,.004,.022)*(1.-smoothstep(0.,.45,l))+vec3(.03,.012,-.022)*warm*smoothstep(.45,1.,l);// split tone
    c=mix(vec3(l),c,sat*(1.-slow*.65));c=clamp((c-.5)*contrast+.5,0.,1.);c=c*.975+.022;// gentle black lift: no crushed shadows
    c=mix(c,c*vec3(1.08,.96,.9),slow*.6);c=mix(c,vec3(l*1.1,l*.2,l*.15),red*.5);
    c*=1.-vig*smoothstep(.2,.85,r2*1.9);c=srgb(c);c+=(h(vUv*res+time)-.5)*grain;gl_FragColor=vec4(c,1.);}`,
   {tex:{value:null},bloom:{value:null},exposure:{value:1},bloomK:{value:.55},time:{value:0},vig:{value:.42},ca:{value:.006},grain:{value:.035},slow:{value:0},sat:{value:.96},contrast:{value:1.04},warm:{value:1},red:{value:0},res:{value:new THREE.Vector2(1,1)}});
  this.resize();document.body.classList.toggle('postfx',this.enabled);}
 resize(){const w=innerWidth,h=innerHeight,pr=this.enabled?this.ratio:Math.min(devicePixelRatio,this.quality==='low'?1:1.6);this.r.setPixelRatio(pr);this.r.setSize(w,h);if(!this.enabled)return;const W=Math.max(2,Math.floor(w*pr)),H=Math.max(2,Math.floor(h*pr));this.rt.setSize(W,H);const bw=Math.max(2,W>>2),bh=Math.max(2,H>>2);this.b1.setSize(W>>1,H>>1);this.b2.setSize(bw,bh);this.b3.setSize(bw,bh);this.final.m.uniforms.res.value.set(W,H);}
 setEnabled(on,quality){this.quality=quality||this.quality;this.enabled=on;document.body.classList.toggle('postfx',on);this.maxRatio=Math.min(devicePixelRatio||1,this.quality==='high'?1.6:1.25);this.ratio=Math.min(this.ratio,this.maxRatio);this.resize();}
 // Call once per frame with the real frame time; adjusts render resolution to stay near 50+ fps.
 adapt(dt){if(!this.dynamic||!this.enabled)return;this.ft.push(dt);if(this.ft.length<45)return;const avg=this.ft.reduce((a,b)=>a+b,0)/this.ft.length;this.ft.length=0;
  let next=this.ratio;if(avg>.024)next=Math.max(this.minRatio,this.ratio-.1);else if(avg<.0145)next=Math.min(this.maxRatio,this.ratio+.05);if(Math.abs(next-this.ratio)>.01){this.ratio=next;this.resize();}}
 begin(){if(!this.enabled)return;this.r.setRenderTarget(this.rt);this.r.clear();}
 end(dt,{slow=0,red=0,cinema=0,exposure=1}={}){if(!this.enabled)return;const r=this.r;this.t+=dt;
  this.bright.m.uniforms.tex.value=this.rt.texture;r.setRenderTarget(this.b1);r.render(this.bright.s,this.cam);
  const B=this.blur.m.uniforms;B.tex.value=this.b1.texture;B.dir.value.set(1/this.b2.width,0);r.setRenderTarget(this.b2);r.render(this.blur.s,this.cam);
  for(let i=0;i<2;i++){B.tex.value=this.b2.texture;B.dir.value.set(0,(1+i)/this.b2.height);r.setRenderTarget(this.b3);r.render(this.blur.s,this.cam);B.tex.value=this.b3.texture;B.dir.value.set((1+i)/this.b2.width,0);r.setRenderTarget(this.b2);r.render(this.blur.s,this.cam);}
  const U=this.final.m.uniforms;U.tex.value=this.rt.texture;U.bloom.value=this.b2.texture;U.exposure.value=exposure;U.time.value=this.t%100;U.slow.value=slow;U.red.value=red;U.vig.value=.26+cinema*.1;U.grain.value=.025+cinema*.015;U.ca.value=.005+slow*.012+cinema*.003;
  r.setRenderTarget(null);r.render(this.final.s,this.cam);}
}
