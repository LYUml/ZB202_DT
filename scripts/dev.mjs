import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bridgePort = Number(process.env.ZB202_INFLUX_BRIDGE_PORT || 8787);
const viteBin = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
let bridge;
let vite;
let stopping = false;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => { socket.destroy(); resolve(false); });
  });
}

function start(command, args) {
  return spawn(command, args, { cwd: projectRoot, stdio: "inherit", env: process.env });
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (vite && !vite.killed) vite.kill("SIGTERM");
  if (bridge && !bridge.killed) bridge.kill("SIGTERM");
  process.exitCode = exitCode;
}

if (!await isPortOpen(bridgePort)) {
  bridge = start(process.execPath, ["scripts/influxdb-bridge.mjs"]);
  bridge.once("exit", (code, signal) => {
    if (!stopping) {
      console.error(`[Dev] InfluxDB bridge stopped (${signal || `exit code ${code}`}).`);
      stop(code || 1);
    }
  });
} else {
  console.log(`[Dev] Reusing the InfluxDB bridge already listening on port ${bridgePort}.`);
}

vite = start(process.execPath, [viteBin, ...process.argv.slice(2)]);
vite.once("exit", (code) => stop(code || 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());
