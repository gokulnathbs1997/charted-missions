"""Shrink textures inside a GLB (max 1024 px; JPEG unless the image has real transparency).
Geometry, skins and animations are copied unchanged. Usage: python optimize_glb.py in.glb out.glb [max]"""
import io,json,struct,sys
from PIL import Image
src,dst=sys.argv[1],sys.argv[2];MAX=int(sys.argv[3]) if len(sys.argv)>3 else 1024
b=open(src,'rb').read();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);binoff=20+n+8;binary=b[binoff:binoff+struct.unpack_from('<I',b,20+n)[0]]
imgviews={im['bufferView']:i for i,im in enumerate(j.get('images',[])) if 'bufferView' in im}
out=bytearray();newviews=[]
for vi,bv in enumerate(j['bufferViews']):
  data=binary[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
  if vi in imgviews:
    im=Image.open(io.BytesIO(data));im.load();alpha=im.mode in('RGBA','LA','PA') and im.getchannel('A').getextrema()[0]<250
    if max(im.size)>MAX:im=im.resize((MAX,MAX) if im.size[0]==im.size[1] else (min(MAX,im.size[0]),min(MAX,im.size[1])),Image.LANCZOS)
    buf=io.BytesIO()
    if alpha:im.save(buf,'PNG',optimize=True);mime='image/png'
    else:im.convert('RGB').save(buf,'JPEG',quality=88);mime='image/jpeg'
    data=buf.getvalue();j['images'][imgviews[vi]]['mimeType']=mime
  while len(out)%4:out.append(0)
  nb=dict(bv);nb['byteOffset']=len(out);nb['byteLength']=len(data);out.extend(data);newviews.append(nb)
j['bufferViews']=newviews;j['buffers']=[{'byteLength':len(out)}]
raw=json.dumps(j,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);out+=b'\0'*((-len(out))%4)
open(dst,'wb').write(struct.pack('<III',0x46546c67,2,28+len(raw)+len(out))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(out),0x004e4942)+out)
print(dst,round(len(b)/1e6,1),'MB ->',round((28+len(raw)+len(out))/1e6,1),'MB')
