# ZB202 DT Frontend API Contract

This document defines the first API shape expected by the web frontend. The frontend should not connect directly to MQTT or InfluxDB. Backend services should collect MQTT / BA / sensor data, store it in InfluxDB or another database, and expose normalized HTTP APIs.

## Data Flow

```text
Milesight sensors / BA system / MQTT
-> backend collectors and decoders
-> InfluxDB / database
-> Web API
-> ZB202 web frontend
```

## Endpoints

### `GET /api/devices`

Returns the asset registry used by the frontend.

```json
{
  "devices": [
    {
      "id": "AM103_07",
      "name": "AM103_07 Environment Sensor",
      "model": "AM103",
      "type": "environment",
      "devEui": "24E124725E281056",
      "profile": "ClassA-OTAA",
      "decoder": "AM103",
      "location": "ZB202 Monitoring Point A",
      "status": "normal",
      "modelObjectId": "sensor_AM103_07"
    }
  ]
}
```

### `GET /api/latest`

Returns the latest live values and status for each device.

```json
{
  "updatedAt": "2026-07-06T09:00:00+08:00",
  "devices": [
    {
      "id": "AM103_07",
      "status": "normal",
      "lastSeen": "2026-07-06T08:59:30+08:00",
      "values": {
        "temperature": 24.6,
        "humidity": 61,
        "co2": 760
      }
    }
  ]
}
```

### `GET /api/history?deviceId=AM103_07&metric=temperature&range=24h`

Returns time-series data for charts.

```json
{
  "deviceId": "AM103_07",
  "metric": "temperature",
  "unit": "C",
  "points": [
    { "time": "2026-07-06T08:00:00+08:00", "value": 24.4 },
    { "time": "2026-07-06T09:00:00+08:00", "value": 24.6 }
  ]
}
```

### `GET /api/alerts`

Returns active alerts and maintenance guidance.

```json
{
  "alerts": [
    {
      "id": "alert-001",
      "deviceId": "AM308_01",
      "severity": "warning",
      "title": "CO2 level rising",
      "recommendation": "Check ventilation and occupancy conditions.",
      "createdAt": "2026-07-06T09:00:00+08:00"
    }
  ]
}
```

## Frontend Status Mapping

- `normal`: online and within expected range.
- `warning`: online but requires attention.
- `alert`: offline, fault, or high-priority abnormal state.

## MQTT Notes

The existing MQTT note says the uplink topic is `/ZB202/milesight/uplink`. Downlink control is not available yet, so the frontend should not expose control commands in the first version.
