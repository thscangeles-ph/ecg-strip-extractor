// Bridges File > Open and "Open with" to the page without changing the web app:
// the PDF is handed to the page's own file input, exactly as if it had been chosen there.
const { ipcRenderer } = require('electron');

function whenAppStarted(cb) {
  // The page shows "Try a sample ECG" as the last step of starting up, once its PDF reader is loaded.
  const btn = document.getElementById('sampleBtn');
  if (!btn) return;
  if (!btn.hidden) { cb(); return; }
  const mo = new MutationObserver(() => { if (!btn.hidden) { mo.disconnect(); cb(); } });
  mo.observe(btn, { attributes: true, attributeFilter: ['hidden'] });
}

window.addEventListener('DOMContentLoaded', () => {
  whenAppStarted(() => ipcRenderer.send('app-ready'));
});

ipcRenderer.on('open-pdf', (_e, { name, data }) => {
  const input = document.getElementById('fileInput');
  if (!input) return;
  const dt = new DataTransfer();
  dt.items.add(new File([data], name, { type: 'application/pdf' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
