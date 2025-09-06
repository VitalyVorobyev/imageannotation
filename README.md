# Image Annotation Demo

An interactive React + TypeScript application for annotating images with shapes such as rectangles, polylines, Bézier curves, and points. It includes pan/zoom controls, undo/redo history, and JSON import/export for saving annotations.

## Features

- **Drawing tools** – select, pan, rectangle, polyline, Bézier, and point tools for flexible annotation workflows
- **Toolbar controls** – quick access to tool selection, undo/redo, zoom, image loading, and annotation import/export
- **Pan and zoom** – mouse drag, scroll-wheel zoom, and “zoom to fit” behavior keep the image centered and accessible
- **Keyboard support**
  - Undo/redo: `Ctrl/Cmd+Z`, `Ctrl+Y` or `Ctrl+Shift+Z`
  - Delete shapes: `Delete`/`Backspace`
  - Move selection: arrow keys (`Shift` for 10 px steps`)
  - Finalize shapes: `Enter`; cancel drafts: `Escape`
  - Temporary pan tool: hold `Space` or use the right mouse button
- **Import/export**
  - Load images via file dialog or drag‑and‑drop
  - Export annotations as JSON, optionally embedding the source image (`annotation.json` or `annotation_bundle.json`)
- **Backend integration**
  - Upload images to an external image store service
  - Request feature detection by image ID and feature type

## Getting Started

### Prerequisites
- Node.js (LTS recommended) and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

All available scripts are listed in package.json.

## Usage

1. Start the development server and open the provided URL in your browser.
2. Load an image via the Load Image button or drag‑and‑drop onto the canvas.
3. Choose an annotation tool from the toolbar and draw shapes on the image.
4. Use keyboard shortcuts and toolbar actions to refine shapes, pan/zoom the canvas, or undo/redo edits.
5. Export annotations to JSON for later use, optionally bundling the image.

## Project Structure

```bash
.
├── src/
│   ├── components/       # ImageAnnotator, toolbar, status bar, shape renderers
│   ├── hooks/            # Pan/zoom, history, shape manipulation, image loading
│   ├── utils/            # Coordinate conversions, hit-testing, file handling
│   ├── types/            # Shape and tool TypeScript definitions
│   └── ...
├── index.html
├── package.json
└── vite.config.ts
```

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
