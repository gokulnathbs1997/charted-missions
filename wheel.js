// Radial utility wheel (hold V / mouse-wheel button / WHEEL touch button).
// Slots: {key,label,sub,icon,enabled,act}. Pointer movement or touch picks a slot; release activates it.
const $=s=>document.querySelector(s);
const ICONS={
 primary:'<path d="M3 13h13l2-2h3v3h-2l-1 2h-4l-1 3H9l1-3H3z"/>',secondary:'<path d="M5 9h12v4h-4l-1 5H8l1-5H5z"/>',knife:'<path d="M3 17L16 4l3 1-9 11-2 1z"/>',
 frag:'<circle cx="12" cy="14" r="6"/><path d="M10 7h4v2h-4zM14 5l3-2"/>',med:'<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',binoc:'<circle cx="7" cy="14" r="4"/><circle cx="17" cy="14" r="4"/><path d="M7 6h3v5H7zM14 6h3v5h-3z"/>',
 map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/>',light:'<path d="M9 2h6v6l-1 2h-4L9 8zM10 12h4v9h-4z"/>',chat:'<path d="M4 5h16v10H9l-5 4z"/>',scope:'<circle cx="12" cy="12" r="7"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>'};
export class UtilityWheel {
 constructor(){const el=document.createElement('div');el.id='wheel';el.hidden=true;el.innerHTML='<div class="ring"></div><div class="hub"><b></b><small></small></div>';document.body.appendChild(el);this.el=el;this.ring=el.querySelector('.ring');this.slots=[];this.sel=-1;this.v={x:0,y:0};this.open=false;
  el.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-i]');if(b){this.pick(+b.dataset.i);this.close(true);}else if(e.target.closest('.hub')||e.target===el)this.close(false);e.stopPropagation();e.preventDefault();});}
 show(slots){this.slots=slots;this.sel=-1;this.v={x:0,y:0};this.open=true;const n=slots.length,R=42;
  this.ring.innerHTML=slots.map((s,i)=>{const a=-Math.PI/2+i/n*Math.PI*2,x=50+Math.cos(a)*R,y=50+Math.sin(a)*R;return `<button data-i="${i}" class="${s.enabled?'':'off'} ${s.active?'on':''}" style="left:${x}%;top:${y}%"><svg viewBox="0 0 24 24">${ICONS[s.icon]||''}</svg><span>${s.label}</span>${s.count!=null?`<em>${s.count}</em>`:''}</button>`;}).join('')+
   slots.map((s,i)=>{const a=-Math.PI/2+(i+.5)/n*Math.PI*2;return `<i class="div" style="transform:rotate(${a*180/Math.PI+90}deg)"></i>`;}).join('');
  this.el.hidden=false;document.body.classList.add('wheel');this.pick(-1);}
 // Accumulate pointer motion (pointer-lock deltas) into a direction.
 move(dx,dy){if(!this.open)return;this.v.x=Math.max(-120,Math.min(120,this.v.x+dx));this.v.y=Math.max(-120,Math.min(120,this.v.y+dy));if(Math.hypot(this.v.x,this.v.y)<28)return;const n=this.slots.length;let a=Math.atan2(this.v.y,this.v.x)+Math.PI/2;if(a<0)a+=Math.PI*2;this.pick(Math.round(a/(Math.PI*2)*n)%n);}
 pick(i){this.sel=i;this.ring.querySelectorAll('button').forEach((b,k)=>b.classList.toggle('sel',k===i));const s=this.slots[i];this.el.querySelector('.hub b').textContent=s?s.label:'UTILITY';this.el.querySelector('.hub small').textContent=s?(s.enabled?s.sub||'':'UNAVAILABLE'):'MOVE TO SELECT · RELEASE TO USE';}
 close(activate=true){if(!this.open)return null;this.open=false;this.el.hidden=true;document.body.classList.remove('wheel');const s=this.slots[this.sel];if(activate&&s&&s.enabled){s.act();return s;}return null;}
}
