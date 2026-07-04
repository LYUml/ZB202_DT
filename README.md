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
- `rvt/`

  - Revit BIM model files for the lab architecture and MEP model.
- `web/`

  - Static web prototype for the ZB202 digital twin interface.
  - Current device data is placeholder data and has not been connected to MQTT or the device backup yet.

## Intended Data Flow

```text
MQTT uplink data
-> match device by DevEUI in dvc
-> decode payload by device model / decoder
-> display latest status in the web digital twin interface
```
