# ZB202 Web Digital Twin

[中文](README.md) | [English](README.en.md)

A web digital twin proof of concept for monitoring laboratory equipment in ZB202. Built with Vite, Three.js, and FBX, it combines a room model with spatial device positioning, simulated live telemetry, fault states, and device records.

> This is currently a frontend PoC. All device data is mocked; no live MQTT, database, or backend API is connected yet.

## Highlights

- Loads `ZN1001v2.fbx`, displays 145 physical components, and filters 61 helper centerlines.
- Supports orbit, pan, zoom, view reset, and model-loading feedback.
- Binds devices through BIM component IDs or spatial coordinates.
- Displays device metrics, trends, timestamps, simulated faults, and status recovery.
- Uses an immersive full-page 3D workspace with a device panel that slides in from the right.
- Supports Chinese and English; the room view inherits the language selected on the overview page.
- Includes device overview, device detail, and point-coordinate calibration tools.

## Quick Start

### Requirements

- Node.js `20.19+` or `22.12+`
- npm

### Development

```powershell
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/). The root URL redirects to the room model.

### Production Build

```powershell
npm run build
npm run preview
```

The preview is normally available at [http://localhost:4173/](http://localhost:4173/). Production files are written to `dist/`. Only the FBX referenced by the application is bundled; RVT files, device backups, and internal documentation are excluded.

## Pages

| Page | URL | Purpose |
| --- | --- | --- |
| Room View | `/twin.html` | Three.js model, device positioning, live status, and fault demo |
| Device Overview | `/overview.html` | Card and table views for nine registered devices |
| Device Detail | `/device.html?deviceId=AM103_07` | Profile and metrics for one device |

The language is controlled by `?lang=zh` or `?lang=en` and stored in the browser. The overview page passes its active language to the room view.

## Room View Controls

- Left-drag: rotate the model.
- Right-drag: pan the view.
- Mouse wheel: zoom.
- **Device Panel**: opens live device information from the right; the model shifts left while the panel is visible.
- **Calibrate Point**: picks world coordinates on the model surface for sensors that are not modeled as BIM components.
- **Reset View**: restores the default camera view.

## Model and Device Binding

The web application currently loads one model:

| Model | Physical Components | Purpose |
| --- | ---: | --- |
| `models/fbx/ZN1001v2.fbx` | 145 | Original export used by the room view |

Two binding approaches are demonstrated:

1. **BIM component binding**: locates the fan coil unit through its FBX object name and Revit ID `[738100]`.
2. **Spatial coordinate binding**: places the `AM103-DEMO` marker at a world-space coordinate.

`models/fbx/ZN1001v2-3dnew.fbx` is retained as a source asset but is not included in the current web build. `models/rvt/` contains the Revit source models; browsers do not load RVT files directly.

## Project Structure

```text
ZB202_DT/
├── web/
│   ├── index.html              # Root entry
│   ├── overview.html           # Device overview
│   ├── device.html             # Device detail
│   ├── twin.html               # Immersive room view
│   └── src/
│       ├── app.js              # Overview, detail, and language logic
│       ├── twin.js             # Three.js scene and device interactions
│       ├── styles.css          # Shared styles
│       └── data/devices.js     # Mock device data
├── models/
│   ├── fbx/                    # Web model and retained FBX source asset
│   └── rvt/                    # Revit source models
├── dvc/                        # CSV/XLSX device-list backups
├── docs/
│   ├── architecture/           # Technical routes
│   └── integrations/           # MQTT integration notes
├── package.json
├── vite.config.js
├── README.md
└── README.en.md
```

## Data Integration Path

`dvc/` contains the names, models, types, DevEUIs, profiles, and payload decoders for nine devices. A live integration should use DevEUI to map MQTT uplinks to device records.

```text
Milesight sensors / BA system
→ MQTT uplink collector
→ payload decoder + DevEUI matching
→ InfluxDB / database
→ HTTP API or WebSocket
→ Web Digital Twin
```

The frontend should not connect directly to MQTT. The planned backend endpoints are:

```text
GET /api/devices
GET /api/latest
GET /api/history?deviceId=AM103_07&metric=temperature&range=24h
GET /api/alerts
```

MQTT connection and topic notes are stored in `docs/integrations/mqtt-interface-notes.txt`.

## Current Limitations and Next Step

- Live values, trends, statuses, and alerts are mocked.
- The FBX and ZB202 Revit source models do not yet have a formal conversion or versioning pipeline.
- Device coordinates still require calibration against the physical room or Revit model.
- The MQTT collector, payload decoder, database, and backend API are not implemented.
- Device downlink control is not available.

The recommended next step is to capture real MQTT uplink samples for each device model, build DevEUI matching and decoding services, and expose the resulting data through a consistent API or WebSocket interface.
