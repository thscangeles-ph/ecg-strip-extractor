import base64,re,os
ROOT=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(ROOT,'src','index.html')).read()
P=os.path.join(ROOT,'node_modules')+'/'
pdfjs=base64.b64encode(open(P+'pdfjs-dist/legacy/build/pdf.min.mjs','rb').read()).decode()
wsrc=open(P+'pdfjs-dist/legacy/build/pdf.worker.min.mjs').read()
assert wsrc.rstrip().endswith('export{WorkerMessageHandler};')
wsrc=wsrc.rstrip()[:-len('export{WorkerMessageHandler};')]
assert wsrc.count('import.meta.url')==2
wsrc=wsrc.replace('import.meta.url','(self.location&&self.location.href)')
worker=base64.b64encode(wsrc.encode()).decode()
pdflib=open(P+'pdf-lib/dist/pdf-lib.min.js').read()
assert '</script' not in pdflib.lower()
# drop artifact-only meta, google fonts (offline: no network calls), CDN scripts
src=src.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
src=re.sub(r'<link rel="preconnect"[^>]*>\n','',src)
src=re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n','',src)
src=re.sub(r'<script src="https://cdnjs[^>]*></script>\n','',src)
# app code: wait for pdf.js to be ready, set worker port instead of CDN workerSrc
src=src.replace("pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';\n","")
src=src.replace("<script>\n(function(){","<script>\nwindow.__startApp=function(pdfjsLib){",1)
assert src.rstrip().endswith('</script>')
i=src.rindex('})();')
src=src[:i]+'};'+src[i+5:]
title_i=src.index('<title>')
head=src[:src.index('<div class="app">')]
body=src[src.index('<div class="app">'):]
boot=f'''<script>{pdflib}</script>
<script type="text/plain" id="pdfjs-b64">{pdfjs}</script>
<script type="text/plain" id="pdfworker-b64">{worker}</script>
<script>
(async function(){{
  function blobUrl(id){{
    const b=atob(document.getElementById(id).textContent.trim()), u=new Uint8Array(b.length);
    for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
    return URL.createObjectURL(new Blob([u],{{type:'text/javascript'}}));
  }}
  try{{
    const lib=await import(blobUrl('pdfjs-b64'));
    const wurl=blobUrl('pdfworker-b64');
    let ok=false;
    try{{
      const w=new Worker(wurl);
      ok=await new Promise(res=>{{ const t=setTimeout(()=>res(false),5000); w.addEventListener('message',e=>{{ if(e.data&&e.data.action==='ready'){{clearTimeout(t);res(true);}} }}); w.addEventListener('error',()=>{{clearTimeout(t);res(false);}}); }});
      if(ok) lib.GlobalWorkerOptions.workerPort=w; else w.terminate();
    }}catch(e){{}}
    if(!ok){{ await new Promise((res,rej)=>{{ const s=document.createElement('script'); s.src=wurl; s.onload=res; s.onerror=rej; document.head.append(s); }}); }}
    window.__startApp(lib);
  }}catch(e){{
    console.error(e);
    const el=document.getElementById('empty');
    if(el) el.textContent='This browser could not start the PDF reader. Open the file in a current version of Chrome, Edge, Firefox or Safari.';
  }}
}})();
</script>
'''
out='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'+head.replace('<style>','<style>html,body{margin:0}[hidden]{display:none!important}</style>\n<style>',1)+'</head>\n<body>\n'
# put app script before boot
out+=body+boot+'</body>\n</html>\n'
open(os.path.join(ROOT,'dist','ECG-Strip-Extractor.html'),'w').write(out)
print(len(out)/1e6,'MB')
