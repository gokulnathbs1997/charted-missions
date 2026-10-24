"""Local-only server and browser launcher. Python 3.8+; no packages required."""
import http.server, functools, pathlib, webbrowser, threading, mimetypes
mimetypes.add_type('text/javascript','.js');mimetypes.add_type('model/gltf-binary','.glb')
root=pathlib.Path(__file__).resolve().parent
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
server=None
for port in range(8000,8021):
 try:server=http.server.ThreadingHTTPServer(('127.0.0.1',port),handler);break
 except OSError:pass
if not server:raise SystemExit('Ports 8000–8020 are busy. Close an old server and retry.')
url=f'http://127.0.0.1:{server.server_port}'
print('\nCONCRETE QUARTER: STRIKE\n'+url+'\nKeep this window open. Ctrl+C stops the server.\n')
threading.Timer(.7,lambda:webbrowser.open(url)).start()
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
