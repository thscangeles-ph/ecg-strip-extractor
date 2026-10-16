# ECG Strip Extractor

Crop the tracing out of an ECG PDF, leave patient details behind, and save it as a new PDF that stays true to scale (25 mm/s and 10 mm/mV are correct when printed at 100%).

## Desktop app

ECG Strip Extractor also comes as an installable desktop app for Windows, macOS and Linux. It is the same app in its own window, with a Start menu / Applications entry, **File › Open PDF…** (Ctrl+O / ⌘O), and an **Open with › ECG Strip Extractor** option for PDF files. It works fully offline.

| System | Download | Notes |
| --- | --- | --- |
| Windows 10/11 | `ECG-Strip-Extractor-Setup-<version>.exe` | Works on any Windows PC: it contains both the x64 and ARM versions and installs the right one. Installs for the current user; no admin rights needed. |
| | `ECG-Strip-Extractor-Setup-<version>-x64.exe` or `-arm64.exe` | The same installer for one type of PC only, at half the download size. |
| | `ECG-Strip-Extractor-Portable-<version>.exe` | Runs without installing (x64 PCs). |
| macOS | `ECG-Strip-Extractor-<version>-mac-universal.dmg` | The app is not signed. The first time, right-click it in Applications and choose **Open**. |
| Linux | `.AppImage` (any distro) or `.deb` (Debian/Ubuntu) | Make the AppImage executable, then run it. |

**[Download the latest release](https://github.com/thscangeles-ph/ecg-strip-extractor/releases/latest)** and pick the file for your system from the list under **Assets**. Builds that are not released yet are under **Actions**, in the latest **Desktop app** run (download the artifact for your system).

Windows may show a SmartScreen warning because the installer is not code-signed. Click **More info › Run anyway**.

## Use it in a browser

Download `dist/ECG-Strip-Extractor.html` and double-click it. It opens in Chrome, Edge, Firefox or Safari and works fully offline, so PDFs never leave your computer.

1. Drop an ECG PDF on the page, or click to choose one. **Try a sample ECG** shows how it works with a synthetic tracing.
2. The tracing grid is found automatically. Drag the box to adjust it, or draw a new one.
3. Tick the pages to keep under **Pages to save**.
4. Click **Save tracing as PDF**.

The **Report values** panel lists the text printed outside the box (patient details, rate, PR, QRS, QT and QTc as separate values). Click any value to copy it.

### Layout

- Drag a panel by its ⠿ handle to move it, or resize it from its bottom-right corner.
- Click the padlock to lock a panel in place.
- **Reset layout** puts everything back. **Full screen** (or the F key) fills the screen.
- **Clear all** removes the loaded ECG.

## Project layout

| Path | What it is |
| --- | --- |
| `src/index.html` | The app source. It loads its PDF libraries from a CDN. |
| `dist/ECG-Strip-Extractor.html` | The offline build, with the libraries bundled in. This is the file people download. |
| `build.py` | Builds the offline file from `src/index.html`. |
| `electron/` | The desktop app shell: `main.js` (window, menu, file opening), `preload.js`, and the app icon in `resources/`. |
| `.github/workflows/desktop.yml` | Builds the desktop installers on Windows, macOS and Linux. |

## Build the offline file

Needs Node.js and Python 3.

```
npm install
npm run build
```

This writes a new `dist/ECG-Strip-Extractor.html`.

## Build the desktop app

The desktop app packages `dist/ECG-Strip-Extractor.html`, so run `npm run build` first if you changed `src/index.html`.

```
npm install
npm start            # run the desktop app without installing it
npm run dist:win     # Windows installer + portable .exe  (build on Windows)
npm run dist:mac     # macOS .dmg                         (build on a Mac)
npm run dist:linux   # Linux .AppImage + .deb
```

Installers are written to `release/`. Building for Windows from Linux or macOS needs Wine, so it is easier to let GitHub Actions do it: every push that changes the app runs the **Desktop app** workflow, and pushing a tag such as `v1.0.1` (after bumping `version` in `package.json`) publishes the installers as a GitHub release. You can also publish without pushing a tag: under **Actions › Desktop app › Run workflow**, enter the tag in **release_tag** and the run creates it.

## Notes

Scanned ECGs (pictures with no text) still crop and save, but their values cannot be copied. The tool is for preparing tracings for records and sharing; it does not interpret the ECG.
