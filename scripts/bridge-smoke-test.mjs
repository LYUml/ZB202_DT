import WebSocket from "ws";

const port = Number(process.env.ZB202_INFLUX_BRIDGE_PORT || 8787);
const url = `ws://127.0.0.1:${port}`;
const expectedDevices = new Set(["AM103-05", "AM103-06", "AM103-07", "AM103-08", "AM308-01"]);
const latestByDevice = new Map();
let connected = false;

const normalizeDeviceId = (value) => String(value || "").replaceAll("_", "-").toUpperCase();

await new Promise((resolve, reject) => {
  const socket = new WebSocket(url);
  const timeout = setTimeout(() => {
    socket.close();
    reject(new Error(`Timed out waiting for telemetry from ${url}`));
  }, 15000);

  const finishIfReady = () => {
    if (!connected || latestByDevice.size !== expectedDevices.size) return;
    clearTimeout(timeout);
    socket.close();
    resolve();
  };

  socket.on("message", (data) => {
    const message = JSON.parse(data.toString());
    if (message.type === "bridge-status") {
      connected = Boolean(message.connected);
      finishIfReady();
    }
    if (message.type !== "telemetry") return;
    const deviceId = normalizeDeviceId(message.deviceId);
    if (!expectedDevices.has(deviceId)) return;
    const receivedAt = Date.parse(message.receivedAt);
    const current = latestByDevice.get(deviceId);
    if (!current || receivedAt > current.receivedAt) {
      latestByDevice.set(deviceId, { receivedAt, values: message.values });
    }
    finishIfReady();
  });

  socket.on("error", (error) => {
    clearTimeout(timeout);
    reject(error);
  });
});

if (!connected) throw new Error("Bridge is running but InfluxDB is not connected");

for (const deviceId of expectedDevices) {
  const telemetry = latestByDevice.get(deviceId);
  if (!telemetry || !Number.isFinite(telemetry.receivedAt)) throw new Error(`${deviceId} has no valid timestamp`);
  for (const metric of ["temperature", "humidity", "co2"]) {
    if (!Number.isFinite(Number(telemetry.values?.[metric]))) throw new Error(`${deviceId} has no numeric ${metric} value`);
  }
}

console.log(`[Smoke test] PASS: InfluxDB bridge returned valid telemetry for ${expectedDevices.size} ZB202 sensors.`);
