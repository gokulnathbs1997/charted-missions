// Charted Missions — online multiplayer server (Node 18+, zero dependencies).
// Serves the game files and relays Team Deathmatch rooms over WebSocket.
//   node server/server.mjs            → http://localhost:8080  (share your LAN IP with friends)
//   PORT=9000 node server/server.mjs
// Each client is authoritative for its own health (casual P2P-style netcode, like many browser
// shooters): shooters report hits, victims apply damage and report their death; the server keeps
// the room roster, teams, scores, match clock, chat and relays movement at 20 Hz.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PORT=+process.env.PORT||8080;
const SCORE_LIMIT=30,MATCH_SECONDS=300,MAX_PLAYERS=10,TICK=50,INTERMISSION=12;
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8','.wasm':'application/wasm','.ico':'image/x-icon'};

const rooms=new Map();
function room(name){name=String(name||'public').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,20)||'public';if(!rooms.has(name))rooms.set(name,{name,players:new Map(),score:{blue:0,red:0},start:Date.now(),ended:false,endAt:0,feed:[]});return rooms.get(name);}
const elapsed=r=>(Date.now()-r.start)/1000;
function roster(r){return [...r.players.values()].map(p=>({id:p.id,name:p.name,team:p.team,kills:p.kills,deaths:p.deaths,ping:p.ping,state:p.state}));}
function broadcast(r,msg,except){const data=frame(JSON.stringify(msg));for(const p of r.players.values())if(p!==except&&p.open)p.sock.write(data);}
function send(p,msg){if(p.open)p.sock.write(frame(JSON.stringify(msg)));}
function balance(r){const n={blue:0,red:0};for(const p of r.players.values())n[p.team]++;return n.blue<=n.red?'blue':'red';}
function endMatch(r){if(r.ended)return;r.ended=true;r.endAt=Date.now();const winner=r.score.blue>r.score.red?'blue':r.score.red>r.score.blue?'red':'draw';broadcast(r,{t:'end',winner,score:r.score});}
function resetMatch(r){r.ended=false;r.score={blue:0,red:0};r.start=Date.now();r.feed=[];for(const p of r.players.values()){p.kills=0;p.deaths=0;}broadcast(r,{t:'restart',score:r.score,elapsed:0,players:roster(r)});}

setInterval(()=>{for(const r of rooms.values()){if(!r.players.size){if(Date.now()-r.start>60000&&r.name!=='public')rooms.delete(r.name);continue;}
 if(!r.ended&&elapsed(r)>=MATCH_SECONDS)endMatch(r);if(r.ended&&Date.now()-r.endAt>INTERMISSION*1000)resetMatch(r);
 const snap=[];for(const p of r.players.values())if(p.state)snap.push([p.id,p.state]);if(snap.length)broadcast(r,{t:'snap',s:snap});}},TICK);
setInterval(()=>{for(const r of rooms.values())for(const p of r.players.values()){p.pingAt=Date.now();send(p,{t:'ping'});if(Date.now()-p.seen>60000)p.sock.destroy();}for(const r of rooms.values())broadcast(r,{t:'clock',elapsed:elapsed(r),score:r.score,pings:[...r.players.values()].map(p=>[p.id,p.ping])});},2000);

let nextId=1;
function onMessage(p,msg){p.seen=Date.now();const r=p.room;
 switch(msg.t){
  case 'join':{if(p.joined)return;const target=room(msg.room);if(target.players.size>=MAX_PLAYERS){send(p,{t:'full'});return;}p.room=target;p.joined=true;p.name=String(msg.name||'Player').replace(/[<>&]/g,'').slice(0,16)||'Player';p.team=balance(target);target.players.set(p.id,p);
   send(p,{t:'welcome',id:p.id,team:p.team,room:target.name,players:roster(target),score:target.score,elapsed:elapsed(target),limit:SCORE_LIMIT,duration:MATCH_SECONDS,ended:target.ended});broadcast(target,{t:'join',player:{id:p.id,name:p.name,team:p.team,kills:0,deaths:0}},p);log(`${p.name} joined ${target.name} (${target.players.size})`);break;}
  case 's':if(r){p.state=msg.s;}break;
  case 'shot':if(r)broadcast(r,{t:'shot',id:p.id,a:msg.a,b:msg.b,w:msg.w},p);break;
  case 'hit':{if(!r||r.ended)return;const v=r.players.get(msg.target);if(v&&v.team!==p.team)send(v,{t:'hit',by:p.id,dmg:Math.min(400,+msg.dmg||0),head:!!msg.head,w:msg.w,dir:msg.dir});break;}
  case 'died':{if(!r||r.ended)return;const k=r.players.get(msg.by);p.deaths++;if(k&&k!==p){k.kills++;r.score[k.team]++;}const ev={t:'kill',killer:k&&k!==p?k.id:p.id,victim:p.id,w:msg.w,head:!!msg.head,dir:msg.dir,score:r.score};broadcast(r,ev);if(r.score.blue>=SCORE_LIMIT||r.score.red>=SCORE_LIMIT)endMatch(r);break;}
  case 'nade':case 'boom':if(r)broadcast(r,{...msg,id:p.id},p);break;
  case 'chat':if(r){const text=String(msg.text||'').replace(/[<>&]/g,'').slice(0,120);if(text)broadcast(r,{t:'chat',id:p.id,name:p.name,team:p.team,text,emo:msg.emo||null});}break;
  case 'pong':p.ping=Date.now()-(p.pingAt||Date.now());break;
 }}
function leave(p){if(!p.open)return;p.open=false;const r=p.room;if(r&&r.players.get(p.id)===p){r.players.delete(p.id);broadcast(r,{t:'leave',id:p.id});log(`${p.name} left ${r.name} (${r.players.size})`);}}

// ---- Minimal RFC 6455 WebSocket ----
function frame(str){const data=Buffer.from(str);const len=data.length;let head;if(len<126)head=Buffer.from([0x81,len]);else if(len<65536){head=Buffer.alloc(4);head[0]=0x81;head[1]=126;head.writeUInt16BE(len,2);}else{head=Buffer.alloc(10);head[0]=0x81;head[1]=127;head.writeBigUInt64BE(BigInt(len),2);}return Buffer.concat([head,data]);}
function upgrade(req,sock){const key=req.headers['sec-websocket-key'];if(!key){sock.destroy();return;}const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
 sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);sock.setNoDelay(true);
 const p={id:nextId++,sock,open:true,joined:false,room:null,name:'Player',team:'blue',kills:0,deaths:0,ping:0,seen:Date.now(),state:null};let buf=Buffer.alloc(0),parts=[];
 sock.on('data',chunk=>{buf=Buffer.concat([buf,chunk]);while(buf.length>=2){const fin=buf[0]&0x80,op=buf[0]&0x0f,masked=buf[1]&0x80;let len=buf[1]&0x7f,off=2;if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4;}else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10;}if(len>1<<20){sock.destroy();return;}const mlen=masked?4:0;if(buf.length<off+mlen+len)return;const mask=masked?buf.subarray(off,off+4):null;const payload=Buffer.from(buf.subarray(off+mlen,off+mlen+len));if(mask)for(let i=0;i<payload.length;i++)payload[i]^=mask[i&3];buf=buf.subarray(off+mlen+len);
  if(op===0x8){leave(p);try{sock.end(Buffer.from([0x88,0]));}catch(_){}return;}if(op===0x9){sock.write(Buffer.concat([Buffer.from([0x8a,payload.length]),payload]));continue;}if(op===0xA)continue;
  parts.push(payload);if(!fin)continue;const text=Buffer.concat(parts).toString('utf8');parts=[];try{onMessage(p,JSON.parse(text));}catch(e){}}});
 sock.on('close',()=>leave(p));sock.on('error',()=>leave(p));}

const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://x');
 if(url.pathname==='/rooms'){res.writeHead(200,{'content-type':'application/json','access-control-allow-origin':'*','cache-control':'no-store'});res.end(JSON.stringify([...rooms.values()].map(r=>({name:r.name,players:r.players.size,max:MAX_PLAYERS,score:r.score,elapsed:Math.round(elapsed(r)),ended:r.ended}))));return;}
 let file=decodeURIComponent(url.pathname);if(file.endsWith('/'))file+='index.html';const full=path.join(ROOT,path.normalize(file).replace(/^([/\\])+/,''));if(!full.startsWith(ROOT)||full.includes(`${path.sep}server${path.sep}`)){res.writeHead(403);res.end();return;}
 fs.stat(full,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);res.end('Not found');return;}const type=TYPES[path.extname(full).toLowerCase()]||'application/octet-stream';res.writeHead(200,{'content-type':type,'content-length':st.size,'cache-control':full.endsWith('sw.js')?'no-cache':'public, max-age=300'});fs.createReadStream(full).pipe(res);});});
server.on('upgrade',(req,sock)=>{if(new URL(req.url,'http://x').pathname!=='/ws'){sock.destroy();return;}upgrade(req,sock);});
function log(s){console.log(new Date().toISOString().slice(11,19),s);}
server.listen(PORT,'0.0.0.0',()=>{const ips=Object.values(os.networkInterfaces()).flat().filter(i=>i&&i.family==='IPv4'&&!i.internal).map(i=>i.address);
 console.log(`\n  Charted Missions — online server\n  Play here:        http://localhost:${PORT}\n${ips.map(ip=>`  Friends on LAN:   http://${ip}:${PORT}`).join('\n')}\n  Rooms:            http://localhost:${PORT}/rooms\n`);});
