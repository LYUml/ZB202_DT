const devices = window.ZB202_DEVICE_DATA || [];
const statusEl = document.getElementById("xeokit-status");
const placeholderEl = document.getElementById("xeokit-placeholder");
const deviceListEl = document.getElementById("xeokit-device-list");
const deviceInfoEl = document.getElementById("xeokit-device-info");

const MODEL_SRC = new URLSearchParams(window.location.search).get("model") || "models/zb202.xkt";
const SHOULD_LOAD_MODEL = new URLSearchParams(window.location.search).has("model");

const objectMapping = {
  AM103_07: { objectId: "sensor_AM103_07" },
  AM103_05: { objectId: "sensor_AM103_05" },
  AM308_01: { objectId: "sensor_AM308_01" },
  AM103_08: { objectId: "sensor_AM103_08" },
  AM103_06: { objectId: "sensor_AM103_06" },
  WS302_02: { objectId: "sensor_WS302_02" },
  WS523_01: { objectId: "plug_WS523_01" },
  WS302_01: { objectId: "sensor_WS302_01" },
  VS121_01: { objectId: "occupancy_VS121_01" },
};

let xeokitViewer = null;

function setStatus(message, state = "neutral") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}

function textValue(value) {
  if (typeof value === "string") return value;
  return value?.zh || value?.en || "-";
}

function latestValues(values) {
  if (!values) return "待接入";
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ");
}

function statusLabel(status) {
  return {
    normal: "正常",
    warning: "注意",
    alert: "告警",
  }[status] || status;
}

function renderDeviceInfo(device) {
  if (!deviceInfoEl) return;
  const mapping = objectMapping[device.id];
  deviceInfoEl.innerHTML = `
    <div><dt>设备ID</dt><dd>${device.id}</dd></div>
    <div><dt>模型对象</dt><dd>${mapping?.objectId || "待映射"}</dd></div>
    <div><dt>型号</dt><dd>${device.model}</dd></div>
    <div><dt>类型</dt><dd>${textValue(device.type)}</dd></div>
    <div><dt>DevEUI</dt><dd>${device.devEui}</dd></div>
    <div><dt>状态</dt><dd>${statusLabel(device.status)}</dd></div>
    <div><dt>最新数据</dt><dd>${latestValues(device.latestValues)}</dd></div>
  `;
}

function tryHighlightMappedObject(device) {
  const mapping = objectMapping[device.id];
  if (!xeokitViewer || !mapping?.objectId) {
    setStatus(`已选择 ${device.id}，等待模型转换后绑定 objectId`, "neutral");
    return;
  }

  const object = xeokitViewer.scene?.objects?.[mapping.objectId];
  if (!object) {
    setStatus(`${device.id} 已选择；模型中暂未找到 ${mapping.objectId}`, "warning");
    return;
  }

  object.highlighted = true;
  object.colorize = device.status === "warning" ? [1.0, 0.6, 0.1] : [0.2, 0.75, 0.35];
  setStatus(`${device.id} 已映射到 ${mapping.objectId}`, "ok");
}

function renderDeviceList() {
  if (!deviceListEl) return;
  deviceListEl.innerHTML = "";

  devices.forEach((device) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `xeokit-device ${device.status}`;
    button.innerHTML = `
      <span class="marker-dot"></span>
      <span>
        <strong>${device.id}</strong>
        <small>${device.model} · ${statusLabel(device.status)}</small>
      </span>
    `;
    button.addEventListener("click", () => {
      document.querySelectorAll(".xeokit-device").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      renderDeviceInfo(device);
      tryHighlightMappedObject(device);
    });
    deviceListEl.appendChild(button);
  });

  if (devices[0]) renderDeviceInfo(devices[0]);
}

async function loadXeokitSdk() {
  const moduleUrls = [
    "https://cdn.jsdelivr.net/npm/@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js",
    "https://unpkg.com/@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js",
  ];

  let lastError = null;
  for (const url of moduleUrls) {
    try {
      return await import(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function initViewer() {
  renderDeviceList();

  try {
    setStatus("正在加载 xeokit SDK", "neutral");
    const xeokit = await loadXeokitSdk();
    const { Viewer, XKTLoaderPlugin } = xeokit;

    if (!Viewer) {
      throw new Error("xeokit Viewer export not found");
    }

    xeokitViewer = new Viewer({
      canvasId: "xeokit-canvas",
      transparent: true,
      saoEnabled: true,
    });

    xeokitViewer.camera.eye = [8, 6, 8];
    xeokitViewer.camera.look = [0, 0, 0];
    xeokitViewer.camera.up = [0, 1, 0];

    if (XKTLoaderPlugin && SHOULD_LOAD_MODEL) {
      const loader = new XKTLoaderPlugin(xeokitViewer);
      loader.load({
        id: "zb202",
        src: MODEL_SRC,
      });
      if (placeholderEl) placeholderEl.classList.add("hidden");
      setStatus(`正在加载模型：${MODEL_SRC}`, "neutral");
      return;
    }

    setStatus("xeokit 已嵌入；等待 XKT 模型", "ok");
  } catch (error) {
    console.warn("xeokit initialization failed", error);
    setStatus("xeokit SDK 未加载；保留接口占位", "warning");
  }
}

initViewer();
