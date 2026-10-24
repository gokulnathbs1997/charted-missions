import * as THREE from 'three';
import {FOREST,heightAt} from './world.js';
import {makeGun} from '../weapons.js';
import {buildGun} from '../gunmodels.js';
// Story missions for the forest valley and the mission rules (objectives, items, alarms, health, medical kit).

export const MISSIONS=[
 {id:1,code:'MISSION 01',title:'SILENT DESCENT',op:'OPERATION BLACK VEIL',place:'Operation Black Veil · Varga Valley · 18:40',sky:'sunset',intro:'blackveil',
  summary:'Rope into the valley, infiltrate the communications facility, recover the encrypted satellite key and stop the transfer before it leaves the facility.',
  insertion:{at:'ridgeDrop',approach:[-.55,0,.83]},extract:'extraction',
  briefing:[['CONTROL','Specter, this is Control. Your target is Site Black Veil. Retrieve the satellite key. No backup available.'],['SPECTER','Understood. Going dark.'],['CONTROL','Specter, satellite transfer begins in twenty minutes. Once that key leaves the facility, we lose the entire network.'],['SPECTER','Then it won\'t leave.'],['CONTROL','Specter, your position is compromised. Complete the objective or abort.'],['SPECTER','Negative. I\'m moving in.']],
  deadline:{time:1200,label:'SATELLITE TRANSFER',until:4},
  loadout:['knife','pistol','suppressed','m4'],start:'m4',med:{medkit:1,pills:1,syringe:1},grenades:2,
  enemies:{tower:2,outdoor:8,indoor:7,village:2},
  pickups:[{type:'medkit',at:'cabin1'},{type:'syringe',at:'barracksB'},{type:'ammo',at:'shed'},{type:'weapon',weapon:'ak74u',at:'gateBoothFloor'},{type:'weapon',weapon:'sniper',at:'tower:1'},{type:'pills',at:'gateBoothFloor'}],
  objectives:[
   {type:'reach',text:'Infiltrate the communications facility',at:'commandFloor',radius:2.6},
   {type:'use',text:'Recover the encrypted satellite key',item:{type:'intel',at:'console',hold:4,label:'SATELLITE KEY',look:'laptop'},say:['CONTROL','Key secured. They can still push the transfer through their uplink. Take down that mast.']},
   {type:'useAll',text:'Disable the alarm panels ({n}/{total})',items:[{type:'panel',at:'gateBooth',hold:2},{type:'panel',at:'genHut',hold:2}],say:['CONTROL','Alarms are dead. Their reinforcements are deaf and blind.']},
   {type:'use',text:'Plant C4 on the satellite uplink mast',item:{type:'charge',at:'mast',hold:3,label:'UPLINK MAST'}},
   {type:'timer',text:'Get clear of the mast! Detonation in {t}s',time:12,blast:{at:'mastBase',radius:15},cutscene:'mastBlast'},
   {type:'extract',text:'Exfiltrate to the extraction point west of the camp',at:'extraction',radius:8,cutscene:'extraction'}]},
 {id:2,code:'MISSION 02',title:'EYES IN THE TREES',place:'Varga Valley · eastern ridge · 07:15 · heavy fog',sky:'overcast',
  summary:'Land in the fog, take a hunter’s sniper rifle and the informant’s map, silence the four watchtower sentries, ride the zip-line into the camp, steal the patrol schedule and torch the fuel depot.',
  insertion:{at:'lz',approach:[-.35,0,-1]},extract:'lz',
  briefing:[['CONTROL','Fog is rolling into the valley, Specter. Varga has put sentries in all four watchtowers.'],['CONTROL','A local hunter hid a rifle for us in his cabin. Clear the towers, steal their patrol schedule and burn the fuel depot.'],['EAGLE ONE','Ridge drop complete. Visibility is poor. Use it.']],
  loadout:['knife','pistol','m4'],start:'m4',med:{medkit:2,pills:1,syringe:1},grenades:2,
  enemies:{tower:4,outdoor:10,indoor:6,village:1},
  pickups:[{type:'ammo',at:'cabin3'},{type:'medkit',at:'shed'},{type:'syringe',at:'gateBoothFloor'},{type:'weapon',weapon:'ak74',at:'barracksAFloor'}],
  objectives:[
   {type:'pickup',text:'Collect the sniper rifle from the hunter’s cabin',item:{type:'weapon',weapon:'sniper',at:'cabin0'},say:['CONTROL','Rifle secured. Scope in with right mouse.']},
   {type:'use',text:'Recover the informant’s map in the forest village',item:{type:'intel',at:'cabin2',label:'INFORMANT MAP',hold:1.2,look:'map'},say:['CONTROL','Good. The map shows a zip-line from the eastern ridge straight into the camp.']},
   {type:'kill',text:'Eliminate the watchtower sentries ({n}/{total})',tag:'tower',say:['CONTROL','Towers are clear. The camp is blind.']},
   {type:'reach',text:'Climb the eastern ridge to the zip-line',at:'zipStart',radius:9,cutscene:'campReveal'},
   {type:'zip',text:'Ride the zip-line into Camp Varga'},
   {type:'use',text:'Steal the patrol schedule from Barracks A',item:{type:'intel',at:'barracksA',hold:2.5,label:'PATROL SCHEDULE',look:'map'}},
   {type:'use',text:'Plant an incendiary charge at the fuel depot',item:{type:'charge',at:'fuel',hold:3,label:'FUEL DEPOT'}},
   {type:'timer',text:'Move away from the depot! Ignition in {t}s',time:8,blast:{at:'fuel',radius:12},cutscene:'fuelBlast'},
   {type:'extract',text:'Reach the helicopter LZ south of the camp',at:'lz',radius:9,cutscene:'extraction'}]},
 // Mission 03 is the Dust Yard cargo-yard Team Deathmatch (yard.js) — it is not a forest mission, so it
 // routes through play:'yard'. Nightfall, the former Mission 03, is kept intact below as Mission 04 (Archive).
 {id:3,code:'MISSION 03',title:'DUST YARD',place:'Port Qadir · cargo yard · 11:20',play:'yard',
  summary:'Five on five in a sun-baked cargo yard. Containers, crates and ramps, a warehouse dock and a market arcade. Out-kill the other side before the clock runs out.',
  briefing:[['CONTROL','Hostile cell is dug in at the Qadir cargo yard. Your squad goes in from the south gate.'],['CONTROL','Four minutes. Most kills wins. Grab the green health orbs and pick up guns from the fallen.']]},
 {id:4,code:'MISSION 04',title:'NIGHTFALL',archive:true,place:'Varga Valley · western woods · 19:50',sky:'dusk',
  summary:'At dusk, slip into the camp from the west, free the captured agent from the command house, recover the cipher codebook and fight your way out to the LZ.',
  insertion:{at:'extraction',approach:[1,0,.25]},extract:'lz',
  briefing:[['CONTROL','Agent Mira Sol was captured two days ago. Varga is holding her in the command house.'],['CONTROL','Night is falling. Slip in from the west, free her, and take their cipher codebook. Expect a fight on the way out.'],['EAGLE ONE','I will wait at the southern LZ. Do not keep me waiting.']],
  loadout:['knife','pistol','ak74','shotgun'],start:'ak74',med:{medkit:2,pills:2,syringe:2},grenades:3,
  enemies:{tower:2,outdoor:10,indoor:10,village:2},
  pickups:[{type:'ammo',at:'barracksB'},{type:'medkit',at:'cabin1'},{type:'weapon',weapon:'sniper',at:'tower:0'}],
  objectives:[
   {type:'reach',text:'Infiltrate Camp Varga',at:'camp',radius:52},
   {type:'use',text:'Free the captured agent in the command house',item:{type:'prisoner',at:'prisoner',hold:3,label:'AGENT MIRA SOL'},cutscene:'prisonerFreed',alarmOnComplete:true},
   {type:'use',text:'Recover the cipher codebook',item:{type:'intel',at:'intel',hold:2,label:'CIPHER CODEBOOK',look:'map'}},
   {type:'extract',text:'Fight your way to the LZ south of the camp',at:'lz',radius:9,cutscene:'extraction'}]},
 // v9 — new places on the valley map. Mission 05 hits the river outpost from the water; Mission 06 is a town assault
 // through building interiors, stairwells, a fire escape and rooftop terraces.
 {id:5,code:'MISSION 05',title:'RIVER RUN',place:'Varga Valley · Kessel Docks · 06:50',sky:'morning',
  summary:'Insert upstream on the west bank, swim the river under the guns of Kessel Docks, climb the pier ladder, steal the cargo manifest from the harbour office and blow the patrol boat and the fuel pump.',
  insertion:{at:'riverWest',approach:[.6,0,-.8]},extract:'lz',
  briefing:[['CONTROL','Specter, Varga is moving weapons down the river through Kessel Docks. Two machine gun nests cover the water.'],['CONTROL','You go in from upstream. Swim the river, climb the pier ladder and take their cargo manifest.'],['CONTROL','Then sink that patrol boat and burn their fuel. Hold C to dive if the gunners look your way.'],['EAGLE ONE','I will be waiting at the southern LZ, across the river.']],
  loadout:['knife','pistol','suppressed','m4'],start:'suppressed',med:{medkit:2,pills:1,syringe:1},grenades:3,
  enemies:{tower:0,outdoor:0,indoor:0,village:0,site:'docks'},
  pickups:[{type:'medkit',at:'boathouse'},{type:'ammo',at:'docks'},{type:'syringe',at:'officeTop'},{type:'weapon',weapon:'shotgun',at:'boathouse'}],
  objectives:[
   {type:'reach',text:'Move down to the west bank opposite the docks',at:'riverBank',radius:10,say:['CONTROL','Docks in sight. Get in the water and stay low. C to dive, Space to come up.']},
   {type:'reach',text:'Swim across to the pier ladder (C dive · Space surface)',at:'dockLadder',radius:3.6,say:['CONTROL','Ladder is right above you. E to climb. Quietly now.']},
   {type:'use',text:'Steal the cargo manifest from the harbour office (upstairs)',item:{type:'intel',at:'manifest',hold:2,label:'CARGO MANIFEST',look:'map'},say:['CONTROL','Manifest confirms it. Weapons for Varga, moving tonight. Sink that boat.']},
   {type:'useAll',text:'Plant charges on the patrol boat and the fuel pump ({n}/{total})',items:[{type:'charge',at:'boat',hold:3,label:'PATROL BOAT'},{type:'charge',at:'fuelPump',hold:3,label:'FUEL PUMP'}],say:['CONTROL','Both charges armed. Get off that dock, now!']},
   {type:'timer',text:'Get clear of the docks! Detonation in {t}s',time:15,blast:{at:'boat',radius:14},cutscene:'dockBlast',alarmOnComplete:true},
   {type:'extract',text:'Cross the river and reach the LZ',at:'lz',radius:9,cutscene:'extraction'}]},
 {id:6,code:'MISSION 06',title:'HIGH GROUND',place:'Old Kessel · town centre · 17:30',sky:'sunset',
  summary:'Push into the militia-held town of Old Kessel. Clear the hotel floor by floor, take the ledger, climb to the rooftop terrace, snipe the spotters on every roof, kill the commander on the Town Hall roof and destroy his radio relay.',
  insertion:{at:'townApproach',approach:[-.4,0,.9]},extract:'townSquareLZ',
  briefing:[['CONTROL','Specter, the militia has taken Old Kessel. They have spotters on every rooftop and a commander running the town from the Town Hall.'],['CONTROL','Clear the Hotel Kessel and take their ledger. Then get up high. The roofs are where this fight is won.'],['CONTROL','Kill the commander and destroy his radio relay. Eagle One will pick you up in the square.']],
  loadout:['knife','pistol','m4','shotgun'],start:'m4',med:{medkit:2,pills:2,syringe:2},grenades:4,
  enemies:{tower:0,outdoor:0,indoor:0,village:0,site:'town',count:26},
  pickups:[{type:'weapon',weapon:'sniper',at:'hotelRoof'},{type:'medkit',at:'hotelLobby'},{type:'ammo',at:'market'},{type:'syringe',at:'hallOffice'},{type:'ammo',at:'aptRoof'},{type:'pills',at:'balcony'}],
  objectives:[
   {type:'reach',text:'Advance up the road to the Old Kessel gate',at:'townGate',radius:9,say:['CONTROL','Spotters on the rooftops. Use the buildings, stay off the open street.']},
   {type:'use',text:'Clear the Hotel Kessel and take the militia ledger (2nd floor)',item:{type:'intel',at:'ledger',hold:2,label:'MILITIA LEDGER',look:'map'},say:['CONTROL','The ledger names their commander. He is on the Town Hall roof. Get up high first.']},
   {type:'reach',text:'Climb to the hotel rooftop terrace',at:'hotelRoof',radius:6,minY:.4,say:['CONTROL','Good vantage. There is a rifle on that terrace. Take out every spotter you can see.']},
   {type:'kill',text:'Eliminate the rooftop spotters ({n}/{total})',tag:'roof',say:['CONTROL','Roofs are clear. Now the commander.']},
   {type:'kill',text:'Eliminate the militia commander on the Town Hall roof',tag:'hvt',say:['CONTROL','Commander is down. Get on that roof and wreck the relay.']},
   {type:'use',text:'Plant a charge on the radio relay (Town Hall roof)',item:{type:'charge',at:'relay',hold:3,label:'RADIO RELAY'}},
   {type:'timer',text:'Get off the roof! Detonation in {t}s',time:12,blast:{at:'relay',radius:9},cutscene:'relayBlast',alarmOnComplete:true},
   {type:'extract',text:'Fight your way to the town square for pickup',at:'townSquareLZ',radius:9,cutscene:'extraction'}]}
];

function label(text,color='#dcf4ac'){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle='#102223dd';x.fillRect(0,0,256,64);x.strokeStyle=color;x.strokeRect(1,1,254,62);x.fillStyle=color;x.font='bold 20px Arial';x.textAlign='center';x.fillText(text,128,40);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:true}));s.scale.set(1.5,.375,1);s.position.y=1.05;return s;}
const M=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.7,...o});
function block(g,size,pos,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.set(...pos);m.castShadow=true;g.add(m);return m;}
const NAMES={medkit:'MEDKIT',pills:'PAINKILLERS',syringe:'ASPIRIN INJECTOR',ammo:'AMMUNITION',panel:'ALARM PANEL'};

export class ForestMission {
 constructor({scene,nav,equipment,audio,flash,structures,def,onEvent,prisonerModel}){Object.assign(this,{scene,nav,equipment,audio,flash,structures,def,onEvent:onEvent||(()=>{})});
  this.health=100;this.armor=0;this.kills=0;this.dead=false;this.won=false;this.alarm=false;this.alarmCount=0;this.damageFlash=0;this.items=[];this.panels=[];this.elapsed=0;this.hackTarget=null;this.hackTime=0;this.hackDuration=2;this.invulnerable=1;this.headshots=0;
  this.med={...def.med};this.medkits=this.med.medkit;this.grenades=def.grenades;this.bleeding=0;this.painFree=0;this.regen=0;this.lastHurt=99;this.timer=null;this.index=-1;this.waiting=false;this.prisonerModel=prisonerModel;
  this.deadline=def.deadline?def.deadline.time:null;this.extraction=this.resolve(def.extract);for(const p of def.pickups)this.add(p.type,this.resolve(p.at),p);this.objectives=def.objectives.map(o=>({...o,done:false}));}
 attach(enemies){this.enemies=enemies;this.start(0);}
 resolve(at){const a=this.structures.anchors,s=this.structures;if(at instanceof THREE.Vector3)return at.clone();if(at.startsWith('tower:')){const t=s.towerSpots[+at.split(':')[1]];return t.pos.clone().add(new THREE.Vector3(.6,0,.6));}
  const named={ridgeDrop:FOREST.ridge.clone().add(new THREE.Vector3(-9,0,7)),commandPorch:a.commandPorch,lz:FOREST.lz,extraction:FOREST.extraction,ridge:FOREST.ridge,village:FOREST.village,camp:FOREST.camp,zipStart:s.zip.from,zipEnd:s.zip.to,mastBase:s.mastPos,gateBoothFloor:a.gateBooth?.clone().add(new THREE.Vector3(-1,0,0))};const p=(named[at]||a[at]||FOREST.camp).clone();if(!named[at]&&!a[at])console.warn('Unknown anchor',at);if(at in named&&!['zipStart','zipEnd'].includes(at))p.y=heightAt(p.x,p.z);return p;}
 add(type,point,opts={}){const g=new THREE.Group();const look=opts.look;
  if(type==='medkit'){block(g,[.42,.2,.3],[0,.1,0],M(0xb3261e));block(g,[.2,.21,.06],[0,.1,0],M(0xffffff));block(g,[.06,.21,.2],[0,.1,0],M(0xffffff));}
  else if(type==='pills'){const b=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.14,12),M(0xd27a1e));b.position.y=.07;g.add(b);}
  else if(type==='syringe'){block(g,[.34,.08,.14],[0,.04,0],M(0x2a5b7a));block(g,[.24,.03,.03],[0,.1,0],M(0xd8f0ff));}
  else if(type==='ammo'){block(g,[.5,.28,.32],[0,.14,0],M(0x566246));for(const x of [-.15,0,.15])block(g,[.05,.06,.26],[x,.31,0],M(0xb5a675));}
  else if(type==='panel'){block(g,[.6,1.0,.2],[0,.95,0],M(0x3f4745));const bulb=block(g,[.35,.16,.05],[0,1.2,.13],M(0xe94f36,{emissive:0xe33220,emissiveIntensity:.5}));g.userData.bulb=bulb;block(g,[.1,.5,.1],[0,.25,0],M(0x2a2e2c));}
  else if(type==='intel'){if(look==='laptop'){block(g,[.38,.02,.26],[0,.01,0],M(0x222222));const scr=block(g,[.38,.25,.015],[0,.13,-.13],M(0x1c2b2a,{emissive:0x2fae8a,emissiveIntensity:.8}));scr.rotation.x=-.25;}else{block(g,[.42,.006,.3],[0,.003,0],M(0xe9e2c8));block(g,[.2,.008,.12],[.06,.007,.04],M(0x9b8f68));}}
  else if(type==='charge'){const c=block(g,[.3,.18,.12],[0,.9,0],M(0x8f8c6c));c.visible=false;const led=block(g,[.04,.04,.02],[.08,.98,.07],M(0x330000,{emissive:0xff0000,emissiveIntensity:0}));led.visible=false;g.userData.charge=c;g.userData.led=led;}
  else if(type==='prisoner'&&this.prisonerModel){const m=this.prisonerModel;m.position.set(0,0,0);g.add(m);}
  else if(type==='weapon'){const w=buildGun(opts.weapon);w.scale.setScalar(1.2);w.rotation.set(0,Math.PI/2,-Math.PI/2);w.position.y=.06;g.add(w);}
  const text=opts.label||NAMES[type]||(type==='weapon'?(this.equipment.data[opts.weapon]?.label||'WEAPON'):type.toUpperCase());const tag=label(text,type==='panel'||type==='charge'||type==='prisoner'||type==='intel'?'#f3de7f':'#dcf4ac');tag.position.y=type==='panel'?1.85:type==='prisoner'?1.9:.7;g.add(tag);
  g.position.copy(point);this.scene.add(g);const item={type,mesh:g,position:point.clone(),taken:false,disabled:false,hold:opts.hold||0,label:text,weapon:opts.weapon,objective:opts.objective,height:type==='panel'?1.1:type==='charge'?.9:type==='prisoner'?1:.25};
  item.prompt=type==='panel'?'DISABLE ALARM PANEL':type==='charge'?'PLANT CHARGE — '+text:type==='prisoner'?'CUT RESTRAINTS — '+text:type==='intel'?'TAKE '+text:type==='weapon'?'PICK UP '+text:'PICK UP '+text;this.items.push(item);if(type==='panel')this.panels.push(item);return item;}
 get current(){return this.objectives[this.index];}
 start(i){this.index=i;const o=this.objectives[i];if(!o)return;o.items=[];if(o.item)o.items.push(this.add(o.item.type,this.resolve(o.item.at),{...o.item,objective:o}));if(o.items&&o.type==='useAll')for(const it of this.def.objectives[i].items)o.items.push(this.add(it.type,this.resolve(it.at),{...it,objective:o}));
  if(o.type==='timer'){this.timer=o.time;}if(o.type==='kill')o.total=this.enemies.list.filter(e=>e.name===o.tag).length;this.onEvent('objective',{text:this.objectiveText(o),index:i});}
 objectiveText(o){if(!o)return 'Mission complete';let n=0,total=0;if(o.type==='useAll'){total=o.items.length;n=o.items.filter(i=>i.disabled||i.taken).length;}if(o.type==='kill'){total=o.total;n=this.enemies.list.filter(e=>e.name===o.tag&&e.dead).length;}return o.text.replace('{n}',n).replace('{total}',total).replace('{t}',Math.ceil(this.timer??0));}
 get objective(){const o=this.current;if(!o)return {text:'Mission complete',position:this.extraction};let position=this.extraction;if(o.items?.length){const left=o.items.find(i=>!i.taken&&!i.disabled);if(left)position=left.position;}else if(o.at)position=this.resolve(o.at);else if(o.type==='zip')position=this.structures.zip.from;else if(o.type==='kill'){const t=this.enemies.list.find(e=>e.name===o.tag&&!e.dead);if(t)position=t.root.position;}else if(o.blast)position=this.resolve(o.blast.at);return {text:this.objectiveText(o),position};}
 complete(){const o=this.current;if(!o||o.done)return;o.done=true;this.audio.pickup();if(o.say)this.onEvent('radio',{who:o.say[0],text:o.say[1]});if(o.alarmOnComplete)this.raiseAlarm(null,true);
  const next=()=>{this.waiting=false;if(o.type==='extract'){this.won=true;this.audio.alarm(false);return;}this.start(this.index+1);};if(o.cutscene){this.waiting=true;this.onEvent('cutscene',{name:o.cutscene,objective:o,done:next});}else next();}
 zipDone(){if(this.current?.type==='zip')this.complete();}
 alarmTarget(pos){return this.panels.filter(p=>!p.disabled).sort((a,b)=>a.position.distanceTo(pos)-b.position.distanceTo(pos))[0];}
 raiseAlarm(panel,force=false){if(this.dead||this.won)return;if(!force&&(panel?.disabled||this.panels.length&&this.panels.every(p=>p.disabled)))return;if(!this.alarm){this.alarmCount++;this.flash('ALARM — THE CAMP IS ON ALERT');}this.alarm=true;this.audio.alarm(true);}
 hurt(amount){if(this.dead||this.won||this.invulnerable>0)return;this.hackTarget=null;this.hackTime=0;const absorbed=Math.min(this.armor,amount*.5);this.armor-=absorbed;const dmg=amount-absorbed;this.health=Math.max(0,this.health-dmg);this.damageFlash=.55;this.lastHurt=0;this.audio.hurt();if(dmg>=12&&Math.random()<.22&&!this.bleeding){this.bleeding=1;this.onEvent('bleed',{});}if(this.health<=0){this.dead=true;this.audio.alarm(false);}}
 heal(){return false;}
 // Medical kit: returns duration of the animation, or 0 if not possible. apply() runs when the animation finishes.
 canUse(kind){if(this.dead||(this.med[kind]||0)<=0)return false;if(kind==='medkit')return this.health<100||this.bleeding;if(kind==='syringe')return this.health<100;return this.health<100||this.painFree<=0;}
 consume(kind){this.med[kind]--;this.medkits=this.med.medkit;}
 apply(kind){if(kind==='medkit'){this.health=Math.min(100,this.health+55);this.bleeding=0;this.flash('WOUNDS DRESSED · +55 HEALTH');}if(kind==='pills'){this.health=Math.min(100,this.health+20);this.painFree=90;this.flash('PAINKILLERS TAKEN · STEADY AIM');}if(kind==='syringe'){this.health=Math.min(100,this.health+35);this.regen=25;this.flash('ASPIRIN INJECTED · +35 HEALTH');}this.audio.pickup();}
 nearby(camera){const pos=camera.position;let best=null;const view=camera.getWorldDirection(new THREE.Vector3());for(const item of this.items){if(item.taken||item.disabled)continue;if(item.objective&&item.objective!==this.current)continue;const point=item.position.clone().add(new THREE.Vector3(0,item.height,0)),dist=point.distanceTo(pos);if(dist>2.7)continue;const dir=point.clone().sub(pos).normalize();if(dir.dot(view)<.5)continue;if(!this.nav.clear(pos,point,false))continue;if(!best||dist<best.distance)best={item,distance:dist};}this.target=best?.item||null;return this.target;}
 use(){const i=this.target;if(!i||this.dead||this.won||this.waiting)return false;if(i.hold>0){if(this.hackTarget!==i){this.hackTarget=i;this.hackTime=0;this.hackDuration=i.hold;this.flash(i.type==='charge'?'PLANTING CHARGE…':i.type==='panel'?'BYPASSING PANEL…':'WORKING… STAY CLOSE');}return true;}this.take(i);return true;}
 take(i){i.taken=true;i.mesh.visible=false;this.audio.pickup();if(i.type==='ammo'){this.equipment.addAmmo();this.flash('AMMUNITION RESUPPLIED');}else if(i.type==='medkit'||i.type==='pills'||i.type==='syringe'){this.med[i.type]=(this.med[i.type]||0)+1;this.medkits=this.med.medkit;this.flash(NAMES[i.type]+' ADDED · H MEDICAL');}else if(i.type==='weapon'){this.equipment.unlocked.add(i.weapon);const inv=this.equipment.inventory[i.weapon];if(inv){inv.ammo=this.equipment.data[i.weapon].capacity;inv.reserve=Math.max(inv.reserve,this.equipment.data[i.weapon].capacity*3);}this.equipment.switch(i.weapon,true);this.flash('WEAPON ACQUIRED: '+i.label);}if(i.objective===this.current&&['pickup','use'].includes(this.current.type))this.complete();}
 finishHold(i){if(i.type==='panel'){i.disabled=true;i.mesh.userData.bulb.material.color.setHex(0x56b49b);i.mesh.userData.bulb.material.emissive.setHex(0x24644d);if(this.panels.every(p=>p.disabled)){this.alarm=false;this.audio.alarm(false);}this.flash('ALARM PANEL DISABLED');this.audio.pickup();}
  else if(i.type==='charge'){i.disabled=true;i.mesh.userData.charge.visible=true;i.mesh.userData.led.visible=true;i.mesh.children.find(c=>c.isSprite).visible=false;this.flash('CHARGE ARMED');this.chargeLed=i.mesh.userData.led;this.audio.tone(1200,.08,.08,'square');}
  else if(i.type==='prisoner'){i.disabled=true;this.flash('RESTRAINTS CUT');}
  else{i.taken=true;i.mesh.visible=false;this.flash(i.label+' SECURED');this.audio.pickup();}
  const o=this.current;if(o&&i.objective===o){if(o.type==='useAll'){this.onEvent('objective',{text:this.objectiveText(o),index:this.index,update:true});if(o.items.every(x=>x.disabled||x.taken))this.complete();}else this.complete();}}
 update(dt,pos){this.elapsed+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.damageFlash=Math.max(0,this.damageFlash-dt);this.lastHurt+=dt;this.painFree=Math.max(0,this.painFree-dt);
  if(this.bleeding&&!this.dead){this.health=Math.max(0,this.health-dt*.6);if(this.health<=0){this.dead=true;}}
  if(this.regen>0&&!this.dead){this.regen-=dt;this.health=Math.min(100,this.health+dt*1.2);}
  if(this.hackTarget){const i=this.hackTarget;if(pos.distanceTo(i.position)>3.2){this.hackTarget=null;this.hackTime=0;this.flash('INTERACTION CANCELLED');}else{this.hackTime+=dt;if(this.hackTime>=this.hackDuration){this.hackTarget=null;this.hackTime=0;this.finishHold(i);}}}
  for(const i of this.items){const tag=i.mesh.children.find(c=>c.isSprite);if(tag&&!(i.type==='charge'&&i.disabled)){const d=i.position.distanceTo(pos);tag.visible=d<12&&d>.9&&(!i.objective||i.objective===this.current);const k=Math.max(.22,Math.min(1,d/8));if(!tag.userData.s0)tag.userData.s0=tag.scale.clone();tag.scale.set(tag.userData.s0.x*k,tag.userData.s0.y*k,1);}}
  for(const p of this.panels)if(!p.disabled)p.mesh.userData.bulb.material.emissiveIntensity=this.alarm?1.2+Math.sin(this.elapsed*9):.4;
  if(this.chargeLed)this.chargeLed.material.emissiveIntensity=Math.sin(this.elapsed*(this.timer!=null&&this.timer<4?30:10))>0?2:0;
  if(this.deadline!=null&&!this.dead&&!this.won&&this.started!==false){if(this.index>this.def.deadline.until||this.objectives[this.def.deadline.until]?.done)this.deadline=null;else if(!this.paused){this.deadline-=dt;if(this.deadline<=0){this.deadline=0;this.dead=true;this.failReason='The satellite key transfer completed. The network is lost.';this.audio.alarm(false);}}}
  const o=this.current;if(!o||o.done||this.waiting||this.dead)return;
  if(o.type==='reach'){const tp=this.resolve(o.at);if(pos.distanceTo(tp.clone().setY(pos.y))<o.radius&&(o.minY==null||pos.y>tp.y+o.minY))this.complete();}
  if(o.type==='zip'&&Math.hypot(pos.x,pos.z)<46&&this.zipFallback)this.complete();
  if(o.type==='kill'){const left=this.enemies.list.filter(e=>e.name===o.tag&&!e.dead).length;if(o.lastLeft!==left){o.lastLeft=left;this.onEvent('objective',{text:this.objectiveText(o),index:this.index,update:true});}if(left===0)this.complete();}
  if(o.type==='timer'){this.timer-=dt;if(Math.ceil(this.timer)!==o.shown){o.shown=Math.ceil(this.timer);this.onEvent('objective',{text:this.objectiveText(o),index:this.index,update:true});if(this.timer<5&&this.timer>0)this.audio.tone(1500,.05,.06,'square');}
   if(this.timer<=0){this.timer=null;this.chargeLed=null;const c=this.resolve(o.blast.at),d=c.distanceTo(pos);if(d<o.blast.radius)this.hurt(400*(1-d/o.blast.radius)+40);this.complete();}}
  if(o.type==='extract'&&pos.distanceTo(this.resolve(o.at).setY(pos.y))<o.radius)this.complete();}
 get status(){return {deadline:this.deadline,health:this.health,armor:this.armor,kills:this.kills,alarm:this.alarm,dead:this.dead,won:this.won,objective:this.index,objectiveText:this.current?this.objectiveText(this.current):'done',elapsed:this.elapsed,med:{...this.med},bleeding:this.bleeding};}
}
