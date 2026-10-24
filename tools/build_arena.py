"""Build assets/arena_tdm.glb: the original single TDM district with its painted door
panels cut out (open doorways) for Team Deathmatch. Stdlib only; source GLB unchanged."""
import json,struct,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
from extract_doors import prepare
b=(ROOT/'assets/shooting_game_enviornment_map_tdm.glb').read_bytes()
n=struct.unpack_from('<I',b,12)[0];src=json.loads(b[20:20+n]);binary=bytearray(b[28+n:])
report=(ROOT/'DOOR_ANALYSIS.json').read_text() if (ROOT/'DOOR_ANALYSIS.json').exists() else None
j,binary=prepare(src,binary)
if report is not None:(ROOT/'DOOR_ANALYSIS.json').write_text(report)
# Detach the separated door panels so each doorway is open.
door_nodes={i for i,node in enumerate(j['nodes']) if node.get('extras',{}).get('interactiveDoor')}
for node in j['nodes']:
 if 'children' in node:
  node['children']=[c for c in node['children'] if c not in door_nodes]
  if not node['children']:node.pop('children')
j['asset'].setdefault('extras',{})['modification']='Single district with painted door panels opened as walk-through doorways for Team Deathmatch. Original asset CC BY 4.0.'
j['buffers']=[{'byteLength':len(binary)}];raw=json.dumps(j,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);binary+=b'\0'*((-len(binary))%4)
out=struct.pack('<III',0x46546c67,2,28+len(raw)+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary
(ROOT/'assets/arena_tdm.glb').write_bytes(out);print('Built arena_tdm.glb:',len(out),'bytes;',len(door_nodes),'doorways opened.')
