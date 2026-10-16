# ECG Strip Extractor

Crop the tracing out of an ECG PDF, leave patient details behind, and save it as a new PDF that stays true to scale (25 mm/s and 10 mm/mV are correct when printed at 100%).

## Use it

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

## Build the offline file

Needs Node.js and Python 3.

```
npm install
npm run build
```

This writes a new `dist/ECG-Strip-Extractor.html`.

## Notes

Scanned ECGs (pictures with no text) still crop and save, but their values cannot be copied. The tool is for preparing tracings for records and sharing; it does not interpret the ECG.
