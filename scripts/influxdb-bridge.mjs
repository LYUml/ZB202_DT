import "dotenv/config";
import { InfluxDB } from "@influxdata/influxdb-client";
import mqtt from "mqtt";
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
const mqttBrokerUrl = process.env.ZB202_MQTT_URL || "mqtt://itf.beeerise.com:1889";
const mqttUsername = process.env.ZB202_MQTT_USERNAME || "";
const mqttPassword = process.env.ZB202_MQTT_PASSWORD || "";
const mqttDownlinkDelayMs = Math.max(0, Number(process.env.ZB202_MQTT_DOWNLINK_DELAY_MS || 10000));
const socketDevices = new Map([
  ["WS523-01", "24E124148C450384"],
  ["WS523-02", "24E124148060808D"],
  ["WS523-03", "24E124148060683A"],
  ["WS523-04", "24E1241480609EE5"],
]);
const socketCommands = { on: "080100ff", off: "080000ff" };

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
let mqttConnected = false;
let processingDownlink = false;
const downlinkQueue = [];

const mqttClient = mqttUsername && mqttPassword
  ? mqtt.connect(mqttBrokerUrl, {
      username: mqttUsername,
      password: mqttPassword,
      protocolVersion: 4,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clientId: `ZB202-DT-control-${process.pid}-${Math.random().toString(16).slice(2, 10)}`,
    })
  : null;

if (mqttClient) {
  mqttClient.on("connect", () => {
    mqttConnected = true;
    console.log(`[MQTT] Connected to ${mqttBrokerUrl}`);
    broadcast({ type: "control-status", connected: true, source: "mqtt" });
  });
  mqttClient.on("reconnect", () => { mqttConnected = false; });
  mqttClient.on("close", () => {
    mqttConnected = false;
    broadcast({ type: "control-status", connected: false, source: "mqtt" });
  });
  mqttClient.on("error", (error) => console.error(`[MQTT] ${error.message}`));
} else {
  console.warn("[MQTT] Socket control disabled: set ZB202_MQTT_USERNAME and ZB202_MQTT_PASSWORD.");
}

const fluxString = (value) => JSON.stringify(String(value));

function buildQuery(range) {
  const measurementFilter = measurement
    ? `\n  |> filter(fn: (r) => r._measurement == ${fluxString(measurement)})`
    : "";
  return `from(bucket: ${fluxString(bucket)})
  |> range(start: ${range})${measurementFilter}
  |> sort(columns: ["_time"])
  |> tail(n: 24)`;
}

function buildInventoryQuery() {
  const measurementFilter = measurement
    ? `\n  |> filter(fn: (r) => r._measurement == ${fluxString(measurement)})`
    : "";
  return `from(bucket: ${fluxString(bucket)})
  |> range(start: 0)${measurementFilter}
  |> last()`;
}

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(message) {
  for (const socket of websocketServer.clients) send(socket, message);
}

function normalizeSocketId(value) {
  return String(value || "").trim().replaceAll("_", "-").toUpperCase();
}

function publishSocketCommand(deviceId, action) {
  return new Promise((resolve, reject) => {
    if (!mqttClient || !mqttConnected) {
      reject(new Error("MQTT control service is not connected"));
      return;
    }
    const devEui = socketDevices.get(deviceId);
    const commandHex = socketCommands[action];
    const topic = `/ZB202/milesight/downlink/${devEui}`;
    const payload = JSON.stringify({
      confirmed: true,
      fport: 85,
      data: Buffer.from(commandHex, "hex").toString("base64"),
    });
    mqttClient.publish(topic, payload, { qos: 0, retain: false }, (error) => {
      if (error) reject(error);
      else resolve({ topic });
    });
  });
}

async function processDownlinkQueue() {
  if (processingDownlink || !downlinkQueue.length) return;
  processingDownlink = true;
  const item = downlinkQueue.shift();
  try {
    await publishSocketCommand(item.deviceId, item.action);
    send(item.socket, { type: "control-result", requestId: item.requestId, deviceId: item.deviceId, action: item.action, ok: true });
  } catch (error) {
    send(item.socket, { type: "control-result", requestId: item.requestId, deviceId: item.deviceId, action: item.action, ok: false, error: error.message });
  } finally {
    setTimeout(() => {
      processingDownlink = false;
      processDownlinkQueue();
    }, downlinkQueue.length ? mqttDownlinkDelayMs : 0);
  }
}

function enqueueSocketControl(socket, message) {
  const deviceId = normalizeSocketId(message.deviceId);
  const action = String(message.action || "").toLowerCase();
  const requestId = String(message.requestId || "");
  if (!socketDevices.has(deviceId) || !socketCommands[action] || !requestId) {
    send(socket, { type: "control-result", requestId, deviceId, action, ok: false, error: "Invalid or unsupported socket command" });
    return;
  }
  downlinkQueue.push({ socket, requestId, deviceId, action });
  send(socket, { type: "control-queued", requestId, deviceId, action, position: downlinkQueue.length + (processingDownlink ? 1 : 0) });
  processDownlinkQueue();
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
  const rawField = String(field || "").trim();
  const compact = rawField.toLowerCase().replace(/[^a-z0-9]/g, "");
  const knownFields = {
    temperaturec: ["temperature", "°C"], temperature: ["temperature", "°C"], temp: ["temperature", "°C"],
    relativehumiditypct: ["humidity", "%"], humidity: ["humidity", "%"], relativehumidity: ["humidity", "%"], rh: ["humidity", "%"],
    co2ppm: ["co2", "ppm"], co2: ["co2", "ppm"], co2concentration: ["co2", "ppm"],
    batterypct: ["battery", "%"], lightlevel: ["light", "lx"], pir: ["pir", ""],
    pm25ugm3: ["pm25", "µg/m³"], pm10ugm3: ["pm10", "µg/m³"], pressurehpa: ["pressure", "hPa"],
    tvocindex: ["tvoc", "index"], occupancy: ["occupancy", ""], magnetstatus: ["magnetStatus", ""],
    tamperstatus: ["tamperStatus", ""], noiselaeqdb: ["noiseLaeq", "dB(A)"], noiselaidb: ["noiseLai", "dB(A)"],
    noiselaimaxdb: ["noiseLaiMax", "dB(A)"], leakagestatus: ["leakageStatus", ""],
    activepower: ["activePower", "W"], current: ["current", "mA"], powerconsumption: ["powerConsumption", "Wh"],
    powerfactor: ["powerFactor", "%"], socketstatus: ["socketStatus", ""], voltage: ["voltage", "V"],
  };
  const known = knownFields[compact];
  if (known) return { key: known[0], unit: known[1], sourceField: rawField };
  const key = rawField.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, letter) => letter.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "");
  return key ? { key, unit: "", sourceField: rawField } : null;
}

function acceptRow(row) {
  const { devEui, deviceId } = normalizeDevice(row);
  const field = normalizeField(row._field);
  const value = Number(row._value);
  const receivedAtMs = Date.parse(row._time);
  if ((!devEui && !deviceId) || !field || !Number.isFinite(value) || !Number.isFinite(receivedAtMs)) return null;
  const receivedAt = new Date(receivedAtMs).toISOString();
  const deviceKey = devEui || deviceId;
  const rowKey = `${deviceKey}:${receivedAt}:${field.key}`;
  if (!rememberRow(rowKey)) return null;

  const history = historyByDevice.get(deviceKey) || [];
  let telemetry = history.find((entry) => entry.receivedAt === receivedAt);
  if (!telemetry) {
    telemetry = { type: "telemetry", devEui, deviceId, values: {}, metrics: {}, receivedAt, source: "influxdb" };
    history.push(telemetry);
  }
  telemetry.values[field.key] = value;
  telemetry.metrics[field.key] = { unit: field.unit, sourceField: field.sourceField };
  history.sort((a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt));
  historyByDevice.set(deviceKey, history.slice(-24));
  return telemetry;
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const range = hasLoadedHistory ? pollLookback : historyRange;
    const recentRows = await queryApi.collectRows(buildQuery(range));
    const inventoryRows = hasLoadedHistory ? [] : await queryApi.collectRows(buildInventoryQuery());
    const rows = [...inventoryRows, ...recentRows];
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
  send(socket, { type: "control-status", connected: mqttConnected, source: "mqtt", supportedDevices: [...socketDevices.keys()] });
  for (const history of historyByDevice.values()) for (const telemetry of history) send(socket, telemetry);
  socket.on("message", (data) => {
    let message;
    try { message = JSON.parse(data.toString()); } catch { return; }
    if (message.type === "socket-control") enqueueSocketControl(socket, message);
  });
});

console.log(`[Bridge] WebSocket ready at ws://${websocketHost}:${websocketPort}`);
await poll();
setInterval(poll, pollIntervalMs);
