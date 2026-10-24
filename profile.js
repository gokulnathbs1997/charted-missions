// Player profile, progression, shop and loadout. Saved in this browser (localStorage).
// Shaped as plain JSON so a future online backend can store the same record server-side.
import {WEAPON_DATA} from './weapons.js';
const KEY='cq_strike_profile_v1';
export const MAX_LEVEL=30;
// XP needed to go from `level` to `level+1`.
export const xpToNext=level=>level>=MAX_LEVEL?Infinity:Math.round(400+level*level*55);
export const SHOP={
 m4:{slot:'primary',price:0,level:1,blurb:'Balanced assault rifle. Reliable at every range.'},
 ak74u:{slot:'primary',price:450,level:2,blurb:'Compact AK carbine. Fast-firing, great inside buildings.'},
 smg:{slot:'primary',price:600,level:3,blurb:'Very high fire rate. Deadly up close, weak at range.'},
 ak74:{slot:'primary',price:850,level:4,blurb:'Hard-hitting assault rifle. Strong recoil, strong stopping power.'},
 shotgun:{slot:'primary',price:900,level:5,blurb:'Eight-pellet pump action. One-shot potential inside rooms.'},
 suppressed:{slot:'primary',price:1300,level:8,blurb:'Silenced M4. Shots do not reveal you on the enemy radar.'},
 sniper:{slot:'primary',price:2200,level:12,blurb:'Bolt-action rifle with scope. One headshot drops any target.'},
 pistol:{slot:'secondary',price:0,level:1,blurb:'Fast semi-automatic sidearm.'},
 magnum:{slot:'secondary',price:750,level:6,blurb:'Heavy revolver. Slow, but hits like a rifle.'}
};
export const UPGRADES={
 damage:{label:'Damage',step:.08,unit:'+8% damage'},
 capacity:{label:'Magazine',step:.2,unit:'+20% magazine'},
 reload:{label:'Reload',step:.12,unit:'-12% reload time'}
};
export const UPGRADE_COST=[350,800,1600];
export const MAX_TIER=UPGRADE_COST.length;
const fresh=()=>({name:'Operator'+Math.floor(1000+Math.random()*9000),level:1,xp:0,coins:500,owned:['m4','pistol'],upgrades:{},loadout:{primary:'m4',secondary:'pistol'},daily:{last:'',streak:0},stats:{matches:0,wins:0,kills:0,deaths:0,headshots:0,bestStreak:0},settings:{music:.6,sensitivity:1,quality:(typeof matchMedia!=='undefined'&&matchMedia('(pointer:coarse)').matches)?'medium':'high',volume:.45,mute:false,autoFire:true,difficulty:'normal'}});
export class Profile {
 constructor(){this.data=fresh();try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved)this.data=Object.assign(fresh(),saved,{stats:{...fresh().stats,...saved.stats},settings:{...fresh().settings,...saved.settings}});}catch(e){}}
 save(){try{localStorage.setItem(KEY,JSON.stringify(this.data));}catch(e){}}
 get level(){return this.data.level;}get coins(){return this.data.coins;}
 tier(weapon,stat){return this.data.upgrades[weapon]?.[stat]||0;}
 // Weapon stats with this player's upgrades applied.
 stats(){const out={};for(const [k,v] of Object.entries(WEAPON_DATA)){const s={...v};const d=this.tier(k,'damage'),c=this.tier(k,'capacity'),r=this.tier(k,'reload');s.damage=Math.round(v.damage*(1+UPGRADES.damage.step*d));if(v.capacity)s.capacity=Math.round(v.capacity*(1+UPGRADES.capacity.step*c));s.reloadTime=(v.reloadTime||2)*(1-UPGRADES.reload.step*r);out[k]=s;}return out;}
 canBuy(w){const s=SHOP[w];if(!s||this.data.owned.includes(w))return false;return this.data.level>=s.level&&this.data.coins>=s.price;}
 buy(w){if(!this.canBuy(w))return false;this.data.coins-=SHOP[w].price;this.data.owned.push(w);this.save();return true;}
 upgradeCost(w,stat){const t=this.tier(w,stat);return t>=MAX_TIER?null:UPGRADE_COST[t];}
 upgrade(w,stat){const cost=this.upgradeCost(w,stat);if(cost==null||this.data.coins<cost||!this.data.owned.includes(w))return false;if(stat==='capacity'&&!WEAPON_DATA[w].capacity)return false;this.data.coins-=cost;(this.data.upgrades[w]??={})[stat]=this.tier(w,stat)+1;this.save();return true;}
 equip(w){const s=SHOP[w];if(!s||!this.data.owned.includes(w))return false;this.data.loadout[s.slot]=w;this.save();return true;}
 // Returns the new levels reached (for level-up rewards).
 addXp(amount){const ups=[];this.data.xp+=amount;while(this.data.level<MAX_LEVEL&&this.data.xp>=xpToNext(this.data.level)){this.data.xp-=xpToNext(this.data.level);this.data.level++;this.data.coins+=150+this.data.level*10;ups.push(this.data.level);}if(this.data.level>=MAX_LEVEL)this.data.xp=0;return ups;}
 today(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
 dailyReady(){return this.data.daily.last!==this.today();}
 dailyAmount(){const y=new Date(Date.now()-864e5),ys=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();const streak=this.data.daily.last===ys?this.data.daily.streak+1:1;return {streak,coins:100*Math.min(streak,7)};}
 claimDaily(){if(!this.dailyReady())return 0;const {streak,coins}=this.dailyAmount();this.data.daily={last:this.today(),streak};this.data.coins+=coins;this.save();return coins;}
 // Story missions (forest campaign).
 missionDone(id){return !!this.data.forest?.done?.includes(id);}
 recordMission(id,r){const f=this.data.forest??={done:[],best:{}};if(!f.done.includes(id))f.done.push(id);const stealth=r.alarms===0;const prev=f.best[id];if(!prev||r.time<prev)f.best[id]=Math.round(r.time);this.data.stats.kills+=r.kills;
  const xp=900+r.kills*60+(stealth?400:0),coins=300+r.kills*10+(stealth?200:0);this.data.coins+=coins;const levels=this.addXp(xp);this.save();return {xp,coins,levels,stealth};}
 // Applies a finished match; returns a summary for the results screen.
 recordMatch(r){const s=this.data.stats;s.matches++;if(r.win)s.wins++;s.kills+=r.kills;s.deaths+=r.deaths;s.headshots+=r.headshots;s.bestStreak=Math.max(s.bestStreak,r.bestStreak);
  const xp=200+r.kills*100+r.headshots*25+(r.win?500:0)+r.bestStreak*30,coins=50+r.kills*12+(r.win?150:0);const startLevel=this.data.level;this.data.coins+=coins;const levels=this.addXp(xp);this.save();return {xp,coins,levels,startLevel};}
}
