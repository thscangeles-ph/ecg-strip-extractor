"""Builds the offline ECG Image Extractor: ../dist/ECG-Image-Extractor.html from src/index.html,
with pdf-lib and text recognition (tesseract.js, its WebAssembly core and English data) bundled in."""
import base64, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
N = os.path.join(ROOT, 'node_modules') + '/'
src = open(os.path.join(ROOT, 'src', 'index.html')).read()

pdflib = open(N + 'pdf-lib/dist/pdf-lib.min.js').read()
tess = open(N + 'tesseract.js/dist/tesseract.min.js').read()
for lib in (pdflib, tess):
    assert '</script' not in lib.lower()

# The OCR worker loads its core with importScripts(), which a file:// page cannot do from a blob.
# Put the core (WebAssembly inlined) in front of the worker so it is already defined.
core = open(N + 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'rb').read()
worker = open(N + 'tesseract.js/dist/worker.min.js', 'rb').read()
# tesseract.js 7.0.0 passes a bundled language's bytes where its name belongs when starting up
BUG = b'return"string"==typeof t?t:t.data}'
assert worker.count(BUG) == 1, 'tesseract.js worker changed: check the bundled-language fix'
worker = worker.replace(BUG, b'return"string"==typeof t?t:t.code}')
worker_b64 = base64.b64encode(core + b'\n;\n' + worker).decode()
eng_b64 = base64.b64encode(open(N + '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'rb').read()).decode()

# drop artifact-only meta, Google Fonts (offline: no network calls) and CDN scripts
src = src.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
src = re.sub(r'<link rel="preconnect"[^>]*>\n', '', src)
src = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n', '', src)
n_cdn = len(re.findall(r'<script src="https://[^"]*"></script>\n', src))
assert n_cdn == 2, n_cdn
src = re.sub(r'<script src="https://[^"]*"></script>\n', '', src)

head = src[:src.index('<div class="app">')]
body = src[src.index('<div class="app">'):]
libs = f'<script>{pdflib}</script>\n<script>{tess}</script>\n'
data = f'''<script type="text/plain" id="ocr-worker-b64">{worker_b64}</script>
<script type="text/plain" id="ocr-eng-b64">{eng_b64}</script>
<script>
window.__OCR = (function(){{
  function bytes(id){{
    const b=atob(document.getElementById(id).textContent.trim()), u=new Uint8Array(b.length);
    for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
    return u;
  }}
  let url=null;
  return {{
    worker(){{ return url || (url=URL.createObjectURL(new Blob([bytes('ocr-worker-b64')],{{type:'text/javascript'}}))); }},
    eng(){{ return bytes('ocr-eng-b64'); }}
  }};
}})();
</script>
'''
# libraries before the app script; the large data blocks after it, so the page shows quickly
i = body.index('<script>\n(function(){')
out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
       + head.replace('<style>', '<style>html,body{margin:0}[hidden]{display:none!important}</style>\n<style>', 1)
       + '</head>\n<body>\n' + body[:i] + libs + body[i:].rstrip() + '\n' + data + '</body>\n</html>\n')
dest = os.path.join(ROOT, '..', 'dist', 'ECG-Image-Extractor.html')
open(dest, 'w').write(out)
print(round(len(out) / 1e6, 2), 'MB ->', os.path.relpath(dest, ROOT))
