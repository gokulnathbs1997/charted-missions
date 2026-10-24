"""Split the atlas-painted metal door areas from all 11 source building meshes.
Preserves wall triangles outside the door atlas rectangle, including UV interpolation.
Uses standard library only; source GLB remains unchanged.
"""
import json,struct,pathlib,math,copy
ROOT=pathlib.Path(__file__).resolve().parents[1]
def prepare(src,binary):
 j=copy.deepcopy(src);binary=bytearray(binary);report=[]
 def acc(i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];fmt={5126:'f',5123:'H',5125:'I'}[a['componentType']];nc={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];size=struct.calcsize(fmt)*nc;off=v.get('byteOffset',0)+a.get('byteOffset',0)
  return [list(struct.unpack_from('<'+fmt*nc,binary,off+k*v.get('byteStride',size))) for k in range(a['count'])]
 def put(rows,typ,fmt='f',component=5126):
  while len(binary)%4:binary.append(0)
  off=len(binary);flat=[v for r in rows for v in r];binary.extend(struct.pack('<'+fmt*len(flat),*flat));bv=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(binary)-off});a={'bufferView':bv,'componentType':component,'count':len(rows),'type':typ}
  if typ=='VEC3':a.update(min=[min(r[k] for r in rows) for k in range(3)],max=[max(r[k] for r in rows) for k in range(3)])
  j['accessors'].append(a);return len(j['accessors'])-1
 def primitive(tris,mat):
  verts=[v for tri in tris for v in tri];return {'attributes':{'POSITION':put([v[:3] for v in verts],'VEC3'),'NORMAL':put([v[3:6] for v in verts],'VEC3'),'TEXCOORD_0':put([v[6:] for v in verts],'VEC2')},'material':mat}
 def split(poly,axis,bound,positive):
  inside=[];outside=[]
  for a,b in zip(poly,poly[1:]+poly[:1]):
   da=(a[axis]-bound)*(1 if positive else -1);db=(b[axis]-bound)*(1 if positive else -1)
   (inside if da>=0 else outside).append(a)
   if (da>=0)!=(db>=0):
    t=da/(da-db);v=[x+(y-x)*t for x,y in zip(a,b)];inside.append(v);outside.append(v)
  return inside,outside
 def triangles(poly):return [[poly[0],poly[i],poly[i+1]] for i in range(1,len(poly)-1)]
 originals=list(enumerate(j['meshes']))
 for mi,m in originals:
  if 'Buildings' not in m.get('name',''):continue
  p=m['primitives'][0];pos=acc(p['attributes']['POSITION']);normal=acc(p['attributes']['NORMAL']);uv=acc(p['attributes']['TEXCOORD_0']);ix=[r[0] for r in acc(p['indices'])];walls=[];doors=[]
  for k in range(0,len(ix),3):
   tri=[pos[i]+normal[i]+uv[i] for i in ix[k:k+3]]
   # Only upright surfaces. Floor, roof, and stair treads must remain static.
   if abs(sum(v[4] for v in tri)/3)>.15:
    walls.append(tri);continue
   poly=tri
   for axis,bound,positive in [(6,.808,True),(6,.944,False),(7,.002,True),(7,.263,False)]:
    if not poly:break
    poly,out=split(poly,axis,bound,positive);walls.extend(triangles(out))
   doors.extend(triangles(poly))
  # Group connected clipped patches; coincident inner/outer door faces share one hinge.
  components=[]
  for tri in doors:
   keys={tuple(round(v[c],2) for c in range(3)) for v in tri};matches=[c for c in components if c[0]&keys]
   if not matches:components.append([keys,[tri]])
   else:
    target=matches[0];target[0]|=keys;target[1].append(tri)
    for other in matches[1:]:target[0]|=other[0];target[1]+=other[1];components.remove(other)
  accepted=[]
  for keys,tris in components:
   ys=[v[1] for t in tris for v in t];height=max(ys)-min(ys)
   # Atlas repetitions elsewhere can produce tiny slivers; retain them as wall.
   width=max(math.hypot(a[0]-b[0],a[2]-b[2]) for a in keys for b in keys)
   if height<120 or width<55: walls.extend(tris);continue
   accepted.append(tris)
  m['primitives']=[primitive(walls,p['material'])]
  parent=next(i for i,n in enumerate(j['nodes']) if n.get('mesh')==mi)
  for di,tris in enumerate(accepted):
   mesh=len(j['meshes']);j['meshes'].append({'name':f'Door_{mi}_{di}','primitives':[primitive(tris,p['material'])]})
   node=len(j['nodes']);j['nodes'].append({'name':f'InteractiveDoor_{mi}_{di}','mesh':mesh,'extras':{'interactiveDoor':True,'sourceBuilding':m['name'],'doorIndex':di}});j['nodes'][parent].setdefault('children',[]).append(node)
  report.append({'building':m['name'],'doorPanels':len(accepted),'sourceTriangles':len(ix)//3,'retainedWallTriangles':len(walls)})
 j['buffers']=[{'byteLength':len(binary)}]
 (ROOT/'DOOR_ANALYSIS.json').write_text(json.dumps({'method':'UV atlas clipping of metal door region; connected vertical patches become hinged panels. Original meshes and UVs retained outside door region.','perDistrict':report,'totalDoorPanelsPerDistrict':sum(r['doorPanels'] for r in report),'districts':25,'totalDoorPanels':25*sum(r['doorPanels'] for r in report)},indent=2))
 return j,binary
