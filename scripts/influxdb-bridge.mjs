import "dotenv/config";
import { InfluxDB } from "@influxdata/influxdb-client";
import { WebSocketServer, WebSocket } from "ws";

const url = process.env.ZB202_INFLUX_URL;
const token = process.env.ZB202_INFLUX_TOKEN;
const org = process.env.ZB202_INFLUX_ORG;
const bucket = process.env.ZB202_INFLUX_BUCKET || "zb202_iot";
const measurement = process.env.ZB202_INFLUX_MEASUREMENT || "";
const deviceColumn = process.env.ZB202_INFLUX_DEVICE_COLUMN || "devEui";
const pollIntervalMs = Math.max(2000, Number(process.env.ZB202_INFLUX_POLL_INTERVAL_MS || 10000));
const pollLookback = process.env.ZB202_INFLUX_POLL_LOOKBACK || "-15m";
const historyRange = process.env.ZB202_INFLUX_HISTORY_RANGE || "-24h";
const websocketHost = process.env.ZB202_INFLUX_BRIDGE_HOST || "127.0.0.1";
const websocketPort = Number(process.env.ZB202_INFLUX_BRIDGE_PORT || 8787);
const bridgeStartedAt = new Date().toISOString();

const missing = [["ZB202_INFLUX_URL", url], ["ZB202_INFLUX_TOKEN", token], ["ZB202_INFLUX_ORG", org]]
  .filter(([, value]) => !value).map(([name]) => name);
if (missing.length) {
  console.error(`[InfluxDB] Missing ${missing.join(", ")}. Copy .env.example to .env and set the connection values.`);
  process.exit(1);
}

const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
const websocketServer = new WebSocketServer({ host: websocketHost, port: websocketPort });
const historyByDevice = new Map();
const seenRows = new Set();
const maxSeenRows = 10000;
let databaseConnected = false;
let hasLoadedHistory = false;
let polling = false;

const fluxString = (value) => JSON.stringify(String(value));

function buildQuery(range) {
  const measurementFilter = measurement
    ? `\n  |> filter(fn: (r) => r._measurement == ${fluxString(measurement)})`
    : "";
  return `from(bucket: ${fluxString(bucket)})
  |> range(start: ${range})${measurementFilter}
  |> filter(fn: (r) => r._field == "temperature_c" or r._field == "temperature" or r._field == "temp" or r._field == "relative_humidity_pct" or r._field == "humidity" or r._field == "relativeHumidity" or r._field == "rh" or r._field == "co2_ppm" or r._field == "co2" or r._field == "co2Concentration")
  |> sort(columns: ["_time"])
  |> tail(n: 24)`;
}

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(message) {
  for (const socket of websocketServer.clients) send(socket, message);
}

function rememberRow(rowKey) {
  if (seenRows.has(rowKey)) return false;
  seenRows.add(rowKey);
  if (seenRows.size > maxSeenRows) seenRows.delete(seenRows.values().next().value);
  return true;
}

function updateDatabaseStatus(connected) {
  if (databaseConnected === connected) return;
  databaseConnected = connected;
  broadcast({ type: "bridge-status", connected, source: "influxdb", bucket, startedAt: bridgeStartedAt });
}

function normalizeDevice(row) {
  for (const name of [deviceColumn, "devEui", "deviceEui", "dev_eui", "device_eui"]) {
    const value = String(row[name] || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase();
    if (value) return { devEui: value, deviceId: "" };
  }
  return { devEui: "", deviceId: String(row._measurement || "").trim() };
}

function normalizeField(field) {
  const key = String(field || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key === "temperaturec" || key === "temperature" || key === "temp") return "temperature";
  if (key === "relativehumiditypct" || key === "humidity" || key === "relativehumidity" || key === "rh") return "humidity";
  if (key === "co2ppm" || key === "co2" || key === "co2concentration") return "co2";
  return "";
}

function acceptRow(row) {
  const { devEui, deviceId } = normalizeDevice(row);
  const field = normalizeField(row._field);
  const value = Number(row._value);
  const receivedAtMs = Date.parse(row._time);
  if ((!devEui && !deviceId) || !field || !Number.isFinite(value) || !Number.isFinite(receivedAtMs)) return null;
  const receivedAt = new Date(receivedAtMs).toISOString();
  const deviceKey = devEui || deviceId;
  const rowKey = `${deviceKey}:${receivedAt}:${field}`;
  if (!rememberRow(rowKey)) return null;

  const history = historyByDevice.get(deviceKey) || [];
  let telemetry = history.find((entry) => entry.receivedAt === receivedAt);
  if (!telemetry) {
    telemetry = { type: "telemetry", devEui, deviceId, values: {}, receivedAt, source: "influxdb" };
    history.push(telemetry);
  }
  telemetry.values[field] = value;
  history.sort((a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt));
  historyByDevice.set(deviceKey, history.slice(-24));
  return telemetry;
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const range = hasLoadedHistory ? pollLookback : historyRange;
    const rows = await queryApi.collectRows(buildQuery(range));
    const changedTelemetry = new Set();
    for (const row of rows) {
      const telemetry = acceptRow(row);
      if (telemetry) changedTelemetry.add(telemetry);
    }
    for (const telemetry of changedTelemetry) broadcast(telemetry);
    if (!databaseConnected) console.log(`[InfluxDB] Connected to ${url}; loaded ${rows.length} rows from ${bucket}`);
    hasLoadedHistory = true;
    updateDatabaseStatus(true);
  } catch (error) {
    if (databaseConnected || !hasLoadedHistory) console.error(`[InfluxDB] Query failed: ${error.message}`);
    updateDatabaseStatus(false);
  } finally {
    polling = false;
  }
}

websocketServer.on("connection", (socket) => {
  send(socket, { type: "bridge-status", connected: databaseConnected, source: "influxdb", bucket, startedAt: bridgeStartedAt });
  for (const history of historyByDevice.values()) for (const telemetry of history) send(socket, telemetry);
});

console.log(`[Bridge] WebSocket ready at ws://${websocketHost}:${websocketPort}`);
await poll();
setInterval(poll, pollIntervalMs);
