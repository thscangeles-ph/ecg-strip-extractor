// Desktop shell for ECG Image Extractor: opens the offline build (dist/ECG-Image-Extractor.html)
// in its own window. Images are read and saved on this computer only; the app makes no network calls.
const { app, BrowserWindow, Menu, dialog, shell, session, screen } = require('electron');
const fs = require('fs');
const path = require('path');

// Packaged: dist/ sits next to electron/. Running from the repository: it is the shared dist/ one level up.
const APP_HTML = [path.join(__dirname, '..', 'dist', 'ECG-Image-Extractor.html'), path.join(__dirname, '..', '..', 'dist', 'ECG-Image-Extractor.html')]
  .find(p => fs.existsSync(p));
const STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json');
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const IMAGE_EXT = /\.(png|jpe?g|webp|bmp|gif)$/i;
const WEBSITE_URL = 'https://ecg-strip-extractor.vercel.app/ECG-Image-Extractor';

let win = null;
let pendingFile = null; // image passed on the command line or via "Open with", sent once the page is ready
let pageReady = false;

function imageFromArgs(argv) {
  return argv.slice(1).find(a => !a.startsWith('-') && IMAGE_EXT.test(a) && fs.existsSync(a)) || null;
}

function openImage(file) {
  if (!file) return;
  if (!win || !pageReady) { pendingFile = file; return; }
  let data;
  try {
    if (fs.statSync(file).size > MAX_FILE_BYTES) throw new Error('too large');
    data = fs.readFileSync(file);
  } catch (e) {
    dialog.showErrorBox('Could not open file', `${path.basename(file)} could not be read.`);
    return;
  }
  win.webContents.send('open-file', { name: path.basename(file), data });
  if (win.isMinimized()) win.restore();
  win.focus();
}

async function chooseImage() {
  const r = await dialog.showOpenDialog(win, {
    title: 'Open ECG image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] }],
  });
  if (!r.canceled && r.filePaths[0]) openImage(r.filePaths[0]);
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
        { label: 'Open Image…', accelerator: 'CmdOrCtrl+O', click: chooseImage },
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
        { label: 'Open ECG Image Extractor Website', click: () => shell.openExternal(WEBSITE_URL) },
        { type: 'separator' },
        {
          label: 'About ECG Image Extractor',
          click: () => dialog.showMessageBox(win, {
            type: 'info',
            title: 'About',
            message: `ECG Image Extractor ${app.getVersion()}`,
            detail: 'Crops the tracing out of an ECG screenshot or photo and saves it as a PDF sized from the ECG grid. Report values are read by text recognition, so check them against the image. Works offline; files never leave this computer. It does not interpret the ECG.',
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
    title: 'ECG Image Extractor',
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

// The page tells us when it has started, so a file opened at launch is not lost.
app.on('web-contents-created', (_e, contents) => {
  contents.ipc.on('app-ready', () => {
    pageReady = true;
    if (pendingFile) { const f = pendingFile; pendingFile = null; openImage(f); }
  });
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  pendingFile = imageFromArgs(process.argv);

  app.on('second-instance', (_e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    openImage(imageFromArgs(argv));
  });

  // macOS: "Open with" and dropping an image on the Dock icon.
  app.on('open-file', (e, file) => { e.preventDefault(); openImage(file); });

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
