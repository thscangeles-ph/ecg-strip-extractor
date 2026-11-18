# ECG Strip Extractor

Crop the tracing out of an ECG PDF, leave patient details behind, and save it as a new PDF that stays true to scale (25 mm/s and 10 mm/mV are correct when printed at 100%).

**Use it online: [ecg-strip-extractor.vercel.app](https://ecg-strip-extractor.vercel.app)** · [Download the desktop app](https://github.com/thscangeles-ph/ecg-strip-extractor/releases/latest)

Have a screenshot, JPEG or photo instead of a PDF? Use **[ECG Image Extractor](#ecg-image-extractor-screenshots-and-photos)**, the separate version for pictures.

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

Open **[ecg-strip-extractor.vercel.app](https://ecg-strip-extractor.vercel.app)**. The PDF is read and saved inside your browser; it is never uploaded.

To use it without an internet connection, download `dist/ECG-Strip-Extractor.html` and double-click it. It opens in Chrome, Edge, Firefox or Safari and works fully offline, so PDFs never leave your computer.

1. Drop an ECG PDF on the page, or click to choose one. **Try a sample ECG** shows how it works with a synthetic tracing.
2. The tracing grid is found automatically. Drag the box to adjust it, or draw a new one.
3. Tick the pages to keep under **Pages to save**.
4. Click **Save tracing as PDF**.

The **Report values** panel lists the text printed outside the box (patient details, rate, PR, QRS, QT and QTc as separate values). Click a value to copy the numbers in it, for example `72` from "Vent rate 72 bpm"; a value with no numbers, such as the name, copies as it is. **Copy line** and **Copy all** copy the full text.

### Layout

- Drag a panel by its ⠿ handle to move it, or resize it from its bottom-right corner.
- Click the padlock to lock a panel in place.
- **Reset layout** puts everything back. **Full screen** (or the F key) fills the screen.
- **Clear all** removes the loaded ECG.

## ECG Image Extractor (screenshots and photos)

A separate app for ECGs that are pictures: a screenshot from an ECG viewer, a JPEG or PNG, or a photo or scan of a print-out. It installs and runs alongside ECG Strip Extractor.

**Use it online: [ecg-strip-extractor.vercel.app/ECG-Image-Extractor](https://ecg-strip-extractor.vercel.app/ECG-Image-Extractor)** · [Download the desktop app](https://github.com/thscangeles-ph/ecg-strip-extractor/releases?q=image-v&expanded=true) (releases tagged `image-v…`)

1. Drop one or more images on the page, click to choose them, or paste a screenshot with **Ctrl+V**. **Try a sample ECG** shows how it works.
2. The tracing grid is found automatically. Drag the box to adjust it, or draw a new one.
3. Check the scale: **Scale check** draws blue lines every 5 mm, and they should sit on the large grid boxes. The scale is measured from the grid (1 small square = 1 mm, 1 large square = 5 mm), so it works at any screenshot size. If the lines do not match, type how many pixels one large box spans.
4. Click **Save tracing as PDF**. The page is sized from the grid, so 25 mm/s and 10 mm/mV are correct when printed at 100%.

**Report values** are read from the picture by text recognition (OCR), which can misread characters. Check each value against the image before using it. As in the PDF app, clicking a value copies its numbers.

Works best with straight-on screenshots and scans. Pictures tilted up to about 3° are handled; photos taken at an angle (with perspective) are not. If no grid can be measured, the box is assumed to be 250 mm wide and the app asks you to check the scale before saving.

| System | Download |
| --- | --- |
| Windows 10/11 | `ECG-Image-Extractor-Setup-<version>.exe` (any PC), `-x64.exe` or `-arm64.exe`, or `ECG-Image-Extractor-Portable-<version>.exe` (no install) |
| macOS | `ECG-Image-Extractor-<version>-mac-universal.dmg` (not signed: right-click the app and choose **Open** the first time) |
| Linux | `.AppImage` or `.deb` |

## Project layout

| Path | What it is |
| --- | --- |
| `src/index.html` | The app source. It loads its PDF libraries from a CDN. |
| `dist/ECG-Strip-Extractor.html` | The offline build, with the libraries bundled in. This is the file people download. |
| `build.py` | Builds the offline file from `src/index.html`. |
| `electron/` | The desktop app shell: `main.js` (window, menu, file opening), `preload.js`, and the app icon in `resources/`. |
| `.github/workflows/desktop.yml` | Builds the desktop installers on Windows, macOS and Linux. |
| `image/src/index.html` | ECG Image Extractor source. It loads pdf-lib and the text-recognition library from a CDN. |
| `dist/ECG-Image-Extractor.html` | ECG Image Extractor offline build, with pdf-lib, text recognition and its English data bundled in (about 10 MB). |
| `image/build.py` | Builds `dist/ECG-Image-Extractor.html` from `image/src/index.html`. |
| `image/electron/`, `image/package.json` | ECG Image Extractor desktop app: shell, icon and installer settings. |
| `.github/workflows/desktop-image.yml` | Builds the ECG Image Extractor installers; a tag such as `image-v1.0.1` (matching `image/package.json`) publishes a release. |

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

### ECG Image Extractor

```
cd image
npm install
npm run build        # writes ../dist/ECG-Image-Extractor.html
npm start            # run the desktop app
npm run dist:linux   # or dist:win / dist:mac; installers go to image/release/
```

To release, bump `version` in `image/package.json`, then push a tag such as `image-v1.0.1`, or run **Actions › Desktop app (images) › Run workflow** with that tag.

## Notes

In ECG Strip Extractor, scanned PDFs (pictures with no text) still crop and save, but their values cannot be copied. ECG Image Extractor reads values from pictures (screenshots, JPEG, PNG) by text recognition; it does not open PDFs. The tool is for preparing tracings for records and sharing; it does not interpret the ECG.
