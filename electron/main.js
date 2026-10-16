// Desktop shell for ECG Strip Extractor: opens the offline build (dist/ECG-Strip-Extractor.html)
// in its own window. PDFs are read and saved on this computer only; the app makes no network calls.
const { app, BrowserWindow, Menu, dialog, shell, session, screen } = require('electron');
const fs = require('fs');
const path = require('path');

const APP_HTML = path.join(__dirname, '..', 'dist', 'ECG-Strip-Extractor.html');
const STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json');
const MAX_PDF_BYTES = 200 * 1024 * 1024;

let win = null;
let pendingFile = null; // PDF passed on the command line or via "Open with", sent once the page is ready
let pageReady = false;

function pdfFromArgs(argv) {
  return argv.slice(1).find(a => !a.startsWith('-') && /\.pdf$/i.test(a) && fs.existsSync(a)) || null;
}

function openPdf(file) {
  if (!file) return;
  if (!win || !pageReady) { pendingFile = file; return; }
  let data;
  try {
    if (fs.statSync(file).size > MAX_PDF_BYTES) throw new Error('too large');
    data = fs.readFileSync(file);
  } catch (e) {
    dialog.showErrorBox('Could not open file', `${path.basename(file)} could not be read.`);
    return;
  }
  win.webContents.send('open-pdf', { name: path.basename(file), data });
  if (win.isMinimized()) win.restore();
  win.focus();
}

async function choosePdf() {
  const r = await dialog.showOpenDialog(win, {
    title: 'Open ECG PDF',
    properties: ['openFile'],
    filters: [{ name: 'PDF documents', extensions: ['pdf'] }],
  });
  if (!r.canceled && r.filePaths[0]) openPdf(r.filePaths[0]);
}

function loadState() {
  let s;
  try { s = JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8')); } catch (e) { return {}; }
  // Forget the saved position if that screen is no longer connected.
  const b = s.bounds;
  const onScreen = b && screen.getAllDisplays().some(({ workArea: a }) =>
    b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y);
  if (!onScreen) delete s.bounds;
  return s;
}

function saveState() {
  if (!win || win.isDestroyed()) return;
  const s = { bounds: win.getNormalBounds(), maximized: win.isMaximized() };
  try { fs.writeFileSync(STATE_FILE(), JSON.stringify(s)); } catch (e) { /* not critical */ }
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open PDF…', accelerator: 'CmdOrCtrl+O', click: choosePdf },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: 'About ECG Strip Extractor',
          click: () => dialog.showMessageBox(win, {
            type: 'info',
            title: 'About',
            message: `ECG Strip Extractor ${app.getVersion()}`,
            detail: 'Crops the tracing out of an ECG PDF and saves it true to scale. Works offline; files never leave this computer. It does not interpret the ECG.',
          }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const state = loadState();
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    ...(state.bounds || {}),
    minWidth: 720,
    minHeight: 520,
    show: false,
    backgroundColor: '#0E1115',
    title: 'ECG Strip Extractor',
    icon: path.join(__dirname, 'resources', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  if (state.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('close', saveState);
  win.on('closed', () => { win = null; pageReady = false; });

  // Keep the app on its own page; open any web link in the default browser instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url !== win.webContents.getURL()) {
      e.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });
  win.webContents.on('did-start-loading', () => { pageReady = false; });

  win.loadFile(APP_HTML);
}

// The page tells us when its PDF reader has started, so a file opened at launch is not lost.
app.on('web-contents-created', (_e, contents) => {
  contents.ipc.on('app-ready', () => {
    pageReady = true;
    if (pendingFile) { const f = pendingFile; pendingFile = null; openPdf(f); }
  });
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  pendingFile = pdfFromArgs(process.argv);

  app.on('second-instance', (_e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    openPdf(pdfFromArgs(argv));
  });

  // macOS: "Open with" and dropping a PDF on the Dock icon.
  app.on('open-file', (e, file) => { e.preventDefault(); openPdf(file); });

  app.whenReady().then(() => {
    // The app needs no camera, microphone, location or notifications.
    session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
      cb(['clipboard-sanitized-write', 'fullscreen', 'fileSystem'].includes(permission));
    });
    buildMenu();
    createWindow();
    app.on('activate', () => { if (!win) createWindow(); });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
