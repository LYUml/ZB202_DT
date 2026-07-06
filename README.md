# ZB202 Digital Twin Materials

This folder collects the current materials for the ZB202 digital twin / IoT prototype.

## Folder Structure

- `mqtt/`

  - MQTT broker and topic notes for receiving Milesight IoT uplink data.
  - Current note says downlink control is not available yet, so do not send downlink commands.
- `dvc/`

  - Backup of the ZB202 device list.
  - Contains device names, models, types, DevEUI values, device profiles, and payload decoders.
  - Use DevEUI to match live MQTT messages to real devices.
- `docs/`

  - `api_contract.md` defines the first frontend-facing API contract.
  - `route_validation.md` records the route validation plan for Web, xeokit, Blender/Bonsai, and Unity options.
- `rvt/`

  - Revit BIM model files for the lab architecture and MEP model.
- `web/`

  - Static web prototype for the ZB202 digital twin interface.
  - `overview.html` shows the device directory.
  - `device.html` shows device details.
  - `twin.html` is a lightweight room-level DT prototype with device status markers.
  - Current live values are mock values shaped like the planned backend API response.

## Intended Data Flow

```text
MQTT uplink data
-> match device by DevEUI in dvc
-> decode payload by device model / decoder
-> display latest status in the web digital twin interface
```

## Current Frontend Prototype

Open these files directly in a browser:

- `web/overview.html`
- `web/device.html?deviceId=AM103_07`
- `web/twin.html`

The frontend currently uses `web/data/devices.js` as a mock API payload. Backend integration target:

```text
GET /api/devices
GET /api/latest
GET /api/history?deviceId=AM103_07&metric=temperature&range=24h
GET /api/alerts
```
