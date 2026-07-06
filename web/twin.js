const twinDevices = window.ZB202_DEVICE_DATA || [];

const markerPositions = {
  AM103_07: { x: 18, y: 26 },
  AM103_05: { x: 32, y: 64 },
  AM308_01: { x: 50, y: 42 },
  AM103_08: { x: 72, y: 30 },
  AM103_06: { x: 78, y: 68 },
  WS302_02: { x: 18, y: 74 },
  WS523_01: { x: 48, y: 78 },
  WS302_01: { x: 83, y: 48 },
  VS121_01: { x: 52, y: 20 },
};

const statusText = {
  normal: "正常",
  warning: "注意",
  alert: "告警",
};

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

function renderInspector(device) {
  const title = document.getElementById("twin-device-title");
  const info = document.getElementById("twin-device-info");
  if (!title || !info) return;

  title.textContent = textValue(device.name);
  info.innerHTML = `
    <div><dt>设备ID</dt><dd>${device.id}</dd></div>
    <div><dt>型号</dt><dd>${device.model}</dd></div>
    <div><dt>类型</dt><dd>${textValue(device.type)}</dd></div>
    <div><dt>DevEUI</dt><dd>${device.devEui}</dd></div>
    <div><dt>状态</dt><dd>${statusText[device.status] || device.status}</dd></div>
    <div><dt>最新数据</dt><dd>${latestValues(device.latestValues)}</dd></div>
    <div><dt>维修提示</dt><dd>${device.status === "warning" ? "建议检查趋势和现场条件" : "暂无动作"}</dd></div>
  `;
}

function renderTwin() {
  const scene = document.getElementById("twin-scene");
  const count = document.getElementById("twin-device-count");
  if (!scene || !count) return;

  count.textContent = String(twinDevices.length);

  twinDevices.forEach((device) => {
    const pos = markerPositions[device.id] || { x: 50, y: 50 };
    const marker = document.createElement("button");
    marker.className = `twin-marker ${device.status}`;
    marker.type = "button";
    marker.style.left = `${pos.x}%`;
    marker.style.top = `${pos.y}%`;
    marker.setAttribute("aria-label", textValue(device.name));
    marker.innerHTML = `
      <span class="marker-dot"></span>
      <span class="marker-label">${device.id}</span>
    `;
    marker.addEventListener("click", () => {
      document.querySelectorAll(".twin-marker").forEach((item) => item.classList.remove("selected"));
      marker.classList.add("selected");
      renderInspector(device);
    });
    scene.appendChild(marker);
  });

  const firstWarning = twinDevices.find((device) => device.status === "warning") || twinDevices[0];
  if (firstWarning) {
    renderInspector(firstWarning);
    const firstMarker = Array.from(document.querySelectorAll(".twin-marker")).find((marker) =>
      marker.textContent.includes(firstWarning.id)
    );
    if (firstMarker) firstMarker.classList.add("selected");
  }
}

renderTwin();
