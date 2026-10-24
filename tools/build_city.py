"""Build an extended, editable GLB with shared original geometry and textures. Stdlib only."""
import copy,json,struct,pathlib,math
ROOT=pathlib.Path(__file__).resolve().parents[1]
b=(ROOT/'assets/shooting_game_enviornment_map_tdm.glb').read_bytes()
n=struct.unpack_from('<I',b,12)[0];src=json.loads(b[20:20+n]);binary=bytearray(b[28+n:]);
from extract_doors import prepare
src,binary=prepare(src,binary)
j=copy.deepcopy(src);j['nodes']=[];j['scenes']=[{'name':'Concrete Quarter — 25 districts','nodes':[]}];j['scene']=0
for z in range(-2,3):
 for x in range(-2,3):
  off=len(j['nodes']); nodes=copy.deepcopy(src['nodes'])
  for node in nodes:
   if 'children' in node:node['children']=[v+off for v in node['children']]
   if node.get('name')=='ground_ground_0':node.pop('mesh',None)
  j['nodes']+=nodes
  center=len(j['nodes']);j['nodes'].append({'name':'Original district centered','translation':[-5.965,0,20.065],'children':[i+off for i in src['scenes'][0]['nodes']]})
  angle=((x+z)%4)*math.pi/2
  tile=len(j['nodes']);j['nodes'].append({'name':f'District {x+3}-{z+3}','translation':[x*130,0,z*130],'rotation':[0,math.sin(angle/2),0,math.cos(angle/2)],'children':[center]});j['scenes'][0]['nodes'].append(tile)
def accessor(values,fmt,typ,component,minv=None,maxv=None):
 while len(binary)%4:binary.append(0)
 offset=len(binary);binary.extend(struct.pack('<'+fmt*len(values),*values));v=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(binary)-offset});a={'bufferView':v,'componentType':component,'count':len(values)//(3 if typ=='VEC3' else 2 if typ=='VEC2' else 1),'type':typ}
 if minv is not None:a.update(min=minv,max=maxv)
 k=len(j['accessors']);j['accessors'].append(a);return k
pos=[];norm=[];inds=[]
for normal,verts in [((0,1,0),[(-1,1,-1),(-1,1,1),(1,1,1),(1,1,-1)]),((0,-1,0),[(-1,-1,1),(-1,-1,-1),(1,-1,-1),(1,-1,1)]),((0,0,1),[(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),((0,0,-1),[(1,-1,-1),(-1,-1,-1),(-1,1,-1),(1,1,-1)]),((1,0,0),[(1,-1,1),(1,-1,-1),(1,1,-1),(1,1,1)]),((-1,0,0),[(-1,-1,-1),(-1,-1,1),(-1,1,1),(-1,1,-1)])]:
 k=len(pos)//3
 for v in verts:pos.extend([c*.5 for c in v]);norm.extend(normal)
 inds.extend([k,k+1,k+2,k,k+2,k+3])
p=accessor(pos,'f','VEC3',5126,[-.5]*3,[.5]*3);no=accessor(norm,'f','VEC3',5126);ix=accessor(inds,'H','SCALAR',5123)
uv=accessor([0,0,0,1,1,1,1,0]*6,'f','VEC2',5126)
def mesh(name,color):
 mat=len(j['materials']);j['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0,'roughnessFactor':.94}});m=len(j['meshes']);j['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':p,'NORMAL':no,'TEXCOORD_0':uv},'indices':ix,'material':mat}]});return m
asphalt=mesh('Boulevard asphalt',[.075,.085,.09,1]);line=mesh('Warm road markings',[.65,.57,.33,1]);concrete=mesh('Boundary concrete',[.35,.36,.34,1])
def box(name,m,pos,scale):
 k=len(j['nodes']);j['nodes'].append({'name':name,'mesh':m,'translation':pos,'scale':scale});j['scenes'][0]['nodes'].append(k)
groundUV=accessor([0,0,0,24,24,24,24,0]*6,'f','VEC2',5126)
groundmesh=len(j['meshes']);j['meshes'].append({'name':'Square district paving','primitives':[{'attributes':{'POSITION':p,'NORMAL':no,'TEXCOORD_0':groundUV},'indices':ix,'material':2}]})
for z in range(-2,3):
 for x in range(-2,3):box('District paving',groundmesh,[x*130,-.06,z*130],[115.45,.1,115.45])
box('Continuous city foundation',asphalt,[0,-.12,0],[650,.2,650])
for v in [-195,-65,65,195]:
 for a in range(-314,315,10):
  box('Boulevard dashed line',line,[v,.012,a],[.16,.018,3.5]);box('Boulevard dashed line',line,[a,.012,v],[3.5,.018,.16])
for p,s in [([0,.65,-324],[650,1.3,1]),([0,.65,324],[650,1.3,1]),([-324,.65,0],[1,1.3,650]),([324,.65,0],[1,1.3,650])]:box('City perimeter',concrete,p,s)
j['asset']['extras']['modification']='Expanded into 25 rotated districts, 275 original-style buildings, connected boulevards and city boundary. Original assets remain CC BY 4.0.'
j['buffers']=[{'byteLength':len(binary)}];raw=json.dumps(j,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);binary+=b'\0'*((-len(binary))%4)
out=struct.pack('<III',0x46546c67,2,28+len(raw)+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary
(ROOT/'assets/extended_city.glb').write_bytes(out);print('Built extended_city.glb:',len(out),'bytes; 25 districts, 275 buildings.')
