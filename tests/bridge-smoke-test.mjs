import WebSocket from "ws";

const port = Number(process.env.ZB202_INFLUX_BRIDGE_PORT || 8787);
const url = `ws://127.0.0.1:${port}`;
const expectedDevices = new Map();
for (const id of ["AM103-05", "AM103-06", "AM103-07", "AM103-08"]) {
  expectedDevices.set(id, ["battery", "co2", "humidity", "temperature"]);
}
expectedDevices.set("AM308-01", ["battery", "co2", "humidity", "light", "pir", "pm10", "pm25", "pressure", "temperature", "tvoc"]);
for (const number of ["01", "02", "03", "05", "06", "07", "08", "09", "10"]) {
  expectedDevices.set(`VS341-${number}`, ["battery", "occupancy"]);
}
for (const number of ["01", "02", "03"]) {
  expectedDevices.set(`WS301-${number}`, ["battery", "magnetStatus", "tamperStatus"]);
}
for (const number of ["01", "02"]) {
  expectedDevices.set(`WS302-${number}`, ["battery", "noiseLaeq", "noiseLai", "noiseLaiMax"]);
}
expectedDevices.set("WS303-01", ["battery", "leakageStatus"]);
for (const number of ["01", "02", "03", "04"]) {
  expectedDevices.set(`WS523-${number}`, ["activePower", "current", "powerConsumption", "powerFactor", "socketStatus", "voltage"]);
}
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
    if (!connected || [...expectedDevices].some(([deviceId, fields]) => fields.some((field) => !Number.isFinite(Number(latestByDevice.get(deviceId)?.values?.[field]))))) return;
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
    const current = latestByDevice.get(deviceId) || { receivedAt: 0, values: {} };
    current.receivedAt = Math.max(current.receivedAt, receivedAt);
    Object.assign(current.values, message.values || {});
    latestByDevice.set(deviceId, current);
    finishIfReady();
  });

  socket.on("error", (error) => {
    clearTimeout(timeout);
    reject(error);
  });
});

if (!connected) throw new Error("Bridge is running but InfluxDB is not connected");

for (const [deviceId, fields] of expectedDevices) {
  const telemetry = latestByDevice.get(deviceId);
  if (!telemetry || !Number.isFinite(telemetry.receivedAt)) throw new Error(`${deviceId} has no valid timestamp`);
  for (const metric of fields) {
    if (!Number.isFinite(Number(telemetry.values?.[metric]))) throw new Error(`${deviceId} has no numeric ${metric} value`);
  }
}

const fieldCount = [...expectedDevices.values()].reduce((sum, fields) => sum + fields.length, 0);
console.log(`[Smoke test] PASS: InfluxDB bridge returned ${fieldCount} valid field series for ${expectedDevices.size} ZB202 sensors.`);
