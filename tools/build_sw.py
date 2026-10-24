# Regenerates sw.js with the current app-shell file list (run before packaging).
import glob,os,json
os.chdir(os.path.join(os.path.dirname(__file__),'..'))
files=['./','./index.html','./style.css','./manifest.webmanifest']+['./'+f for f in sorted(glob.glob('*.js'))+sorted(glob.glob('forest/*.js'))+sorted(glob.glob('vendor/*.js'))+sorted(glob.glob('icons/*.png'))+sorted(glob.glob('assets/ui/*.jpg'))+sorted(glob.glob('assets/sfx/*.mp3'))]
files=[f for f in files if f!='./sw.js']
version=json.load(open('package.json'))['version']
sw=open('sw.js').read()
start=sw.index('const VERSION=');end=sw.index('\n',sw.index('const SHELL='))
sw=sw[:start]+f"const VERSION='charted-missions-v{version}';\nconst SHELL={json.dumps(files)};"+sw[end:]
sw=sw.replace("/\\.(glb|png|jpg|jpeg|webp)$/i","/\\.(glb|png|jpg|jpeg|webp|mp3)$/i")
open('sw.js','w').write(sw);print(len(files),'files')
