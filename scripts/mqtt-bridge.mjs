import mqtt from "mqtt";
import { WebSocketServer, WebSocket } from "ws";

const brokerUrl = process.env.ZB202_MQTT_URL || "mqtt://itf.beeerise.com:1889";
const topic = process.env.ZB202_MQTT_TOPIC || "/ZB202/milesight/uplink";
const websocketPort = Number(process.env.ZB202_MQTT_BRIDGE_PORT || 8787);
const clientId = process.env.ZB202_MQTT_CLIENT_ID || `ZB202-DT-${crypto.randomUUID().slice(0, 8)}`;
const bridgeStartedAt = new Date().toISOString();

const mqttClient = mqtt.connect(brokerUrl, {
  clientId,
  username: process.env.ZB202_MQTT_USERNAME,
  password: process.env.ZB202_MQTT_PASSWORD,
  clean: true,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
});

const websocketServer = new WebSocketServer({ host: "127.0.0.1", port: websocketPort });
const latestByDevice = new Map();
let brokerConnected = false;

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(message) {
  for (const socket of websocketServer.clients) send(socket, message);
}

function normalizedKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findNestedValue(root, aliases) {
  const wanted = new Set(aliases.map(normalizedKey));
  const queue = [root];
  const visited = new Set();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (wanted.has(normalizedKey(key)) && child !== null && child !== undefined) return child;
      if (child && typeof child === "object") queue.push(child);
    }
  }
  return undefined;
}

function numberValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value && typeof value === "object") return numberValue(value.value ?? value.val);
  return undefined;
}

function normalizeUplink(payload, receivedAt) {
  let root;
  try {
    root = JSON.parse(payload.toString("utf8"));
  } catch {
    return null;
  }
  const rawDevEui = findNestedValue(root, ["devEui", "deviceEui", "dev_eui", "device_eui"]);
  const devEui = String(rawDevEui || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  if (!devEui) return null;
  const values = {
    temperature: numberValue(findNestedValue(root, ["temperature", "temp", "ambientTemperature"])),
    humidity: numberValue(findNestedValue(root, ["humidity", "relativeHumidity", "rh"])),
    co2: numberValue(findNestedValue(root, ["co2", "co2Concentration", "carbonDioxide"])),
  };
  for (const key of Object.keys(values)) if (values[key] === undefined) delete values[key];
  if (!Object.keys(values).length) return null;
  return { type: "telemetry", devEui, values, receivedAt, topic };
}

websocketServer.on("connection", (socket) => {
  send(socket, { type: "bridge-status", connected: brokerConnected, broker: brokerUrl, topic, startedAt: bridgeStartedAt });
  for (const telemetry of latestByDevice.values()) send(socket, telemetry);
});

mqttClient.on("connect", () => {
  brokerConnected = true;
  console.log(`[MQTT] Connected to ${brokerUrl}`);
  mqttClient.subscribe(topic, { qos: 0 }, (error) => {
    if (error) console.error(`[MQTT] Subscribe failed: ${error.message}`);
    else console.log(`[MQTT] Subscribed to ${topic}`);
  });
  broadcast({ type: "bridge-status", connected: true, broker: brokerUrl, topic, startedAt: bridgeStartedAt });
});

mqttClient.on("message", (messageTopic, payload) => {
  const telemetry = normalizeUplink(payload, new Date().toISOString());
  if (!telemetry) {
    console.warn(`[MQTT] Ignored unrecognized message on ${messageTopic}`);
    return;
  }
  latestByDevice.set(telemetry.devEui, telemetry);
  broadcast(telemetry);
  console.log(`[MQTT] ${telemetry.devEui}`, telemetry.values);
});

mqttClient.on("reconnect", () => console.log("[MQTT] Reconnecting..."));
mqttClient.on("offline", () => {
  brokerConnected = false;
  broadcast({ type: "bridge-status", connected: false, broker: brokerUrl, topic, startedAt: bridgeStartedAt });
});
mqttClient.on("error", (error) => console.error(`[MQTT] ${error.message}`));

console.log(`[Bridge] WebSocket ready at ws://127.0.0.1:${websocketPort}`);
