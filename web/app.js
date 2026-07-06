const placeholderDevices = [
  {
    id: "ZB202-HVAC-AHU-01",
    name: { zh: "组合式空调机组", en: "Air Handling Unit" },
    location: { zh: "ZB202 顶部机电区", en: "Ceiling MEP Zone, ZB202" },
    status: "normal",
    maintenanceDate: "TBD",
  },
  {
    id: "ZB202-HVAC-FCU-02",
    name: { zh: "风机盘管", en: "Fan Coil Unit" },
    location: { zh: "ZB202 东侧吊顶", en: "East Ceiling, ZB202" },
    status: "warning",
    maintenanceDate: "TBD",
  },
  {
    id: "ZB202-HVAC-VAV-03",
    name: { zh: "VAV 变风量箱", en: "VAV Terminal Box" },
    location: { zh: "ZB202 西侧风管支路", en: "West Duct Branch, ZB202" },
    status: "normal",
    maintenanceDate: "TBD",
  },
  {
    id: "ZB202-HVAC-EXF-04",
    name: { zh: "排风机", en: "Exhaust Fan" },
    location: { zh: "ZB202 南侧排风井", en: "South Exhaust Shaft, ZB202" },
    status: "alert",
    maintenanceDate: "TBD",
  },
  {
    id: "ZB202-HVAC-CHW-05",
    name: { zh: "冷冻水阀组", en: "Chilled Water Valve Set" },
    location: { zh: "ZB202 管井接口", en: "Pipe Riser Interface, ZB202" },
    status: "normal",
    maintenanceDate: "TBD",
  },
  {
    id: "ZB202-HVAC-THS-06",
    name: { zh: "温湿度传感器", en: "Temperature & Humidity Sensor" },
    location: { zh: "ZB202 中部监测点", en: "Center Monitoring Point, ZB202" },
    status: "alert",
    maintenanceDate: "TBD",
  },
];

const i18n = {
  zh: {
    "overview.eyebrow": "ZB202 / 建筑数字孪生",
    "overview.title": "空间设备总览",
    "overview.note": "当前为演示占位数据，后续将接入实时 IoT 与 BIM 状态。",
    "overview.viewCard": "卡片",
    "overview.viewTable": "表格",
    "detail.back": "← 返回总览",
    "detail.eyebrow": "ZB202 / 设备档案",
    "detail.basicInfo": "基础信息",
    "detail.maintenanceTitle": "检修记录",
    "detail.maintenanceNote": "预留后端检修明细、责任人和工单编号。",
    "detail.modelTitle": "BIM模型与状态叠加视图",
    "detail.modelSubtitle": "该区域用于承载三维模型、状态颜色叠加与关键告警注释。",
    "detail.modelPlaceholder": "BIM 3D 容器预留位",
    "detail.modelPlaceholderHint": "后续在此挂接模型渲染器与IoT实时状态流",
    "detail.switchToTable": "看数据表",
    "detail.switchToVisual": "看模型",
    "common.room": "房间",
    "common.devices": "设备数",
    "common.name": "设备名",
    "common.id": "编号",
    "common.location": "位置",
    "common.status": "状态",
    "common.model": "型号",
    "common.type": "类型",
    "common.devEui": "DevEUI",
    "common.profile": "配置",
    "common.decoder": "Decoder",
    "common.latestValues": "最新数据",
    "common.lastMaintenance": "最近检修",
    "common.action": "操作",
    "common.viewDetail": "查看详情",
    "common.statusLabel": "状态",
    "common.locationLabel": "位置",
    "common.maintenanceLabel": "检修",
    "common.deviceDetail": "设备详情",
    "common.field": "字段",
    "common.value": "信息",
    "common.tbd": "待接入",
    "status.normal": "在线",
    "status.warning": "告警",
    "status.alert": "离线",
  },
  en: {
    "overview.eyebrow": "ZB202 / Building Digital Twin",
    "overview.title": "Spatial Equipment Directory",
    "overview.note": "Demo placeholder data for now; live IoT and BIM status will be integrated later.",
    "overview.viewCard": "Card",
    "overview.viewTable": "Table",
    "detail.back": "← Back to Overview",
    "detail.eyebrow": "ZB202 / Device Profile",
    "detail.basicInfo": "Basic Information",
    "detail.maintenanceTitle": "Maintenance Records",
    "detail.maintenanceNote": "Reserved for maintenance history, owners, and work-order IDs.",
    "detail.modelTitle": "BIM Model and Status Overlay",
    "detail.modelSubtitle": "This area is reserved for 3D model rendering, status overlay, and key warning annotations.",
    "detail.modelPlaceholder": "Reserved BIM 3D Canvas",
    "detail.modelPlaceholderHint": "Connect your renderer and IoT live stream here later",
    "detail.switchToTable": "Table View",
    "detail.switchToVisual": "Model View",
    "common.room": "Room",
    "common.devices": "Devices",
    "common.name": "Name",
    "common.id": "ID",
    "common.location": "Location",
    "common.status": "Status",
    "common.model": "Model",
    "common.type": "Type",
    "common.devEui": "DevEUI",
    "common.profile": "Profile",
    "common.decoder": "Decoder",
    "common.latestValues": "Latest Values",
    "common.lastMaintenance": "Last Maintenance",
    "common.action": "Action",
    "common.viewDetail": "View Detail",
    "common.statusLabel": "Status",
    "common.locationLabel": "Location",
    "common.maintenanceLabel": "Maintenance",
    "common.deviceDetail": "Device Detail",
    "common.field": "Field",
    "common.value": "Value",
    "common.tbd": "TBD",
    "status.normal": "Online",
    "status.warning": "Warning",
    "status.alert": "Offline",
  },
};

const statusClassMap = {
  normal: "ok",
  warning: "warn",
  alert: "alert",
};

const query = new URLSearchParams(window.location.search);
const initialLang = query.get("lang") || localStorage.getItem("lang") || "zh";
let activeLang = initialLang === "en" ? "en" : "zh";
let isDeviceTableMode = false;

function t(key) {
  return i18n[activeLang][key] || key;
}

function applyI18nText() {
  document.documentElement.lang = activeLang === "zh" ? "zh-HK" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

function updateDeviceModeButton() {
  const toggleBtn = document.getElementById("detail-view-toggle");
  if (!toggleBtn) return;
  toggleBtn.textContent = isDeviceTableMode ? t("detail.switchToVisual") : t("detail.switchToTable");
}

function applyLanguage(lang) {
  activeLang = lang === "en" ? "en" : "zh";
  localStorage.setItem("lang", activeLang);

  const toggle = document.getElementById("lang-toggle");
  if (toggle) toggle.textContent = activeLang === "en" ? "中文" : "EN";

  applyI18nText();
  updateDeviceModeButton();

  const backLink = document.getElementById("back-link");
  if (backLink) backLink.href = `overview.html?lang=${activeLang}`;
}

function addLangToggle(onChange) {
  const toggle = document.getElementById("lang-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const next = activeLang === "en" ? "zh" : "en";
    applyLanguage(next);
    if (typeof onChange === "function") onChange();
  });
}

function deviceUrl(deviceId) {
  return `device.html?deviceId=${encodeURIComponent(deviceId)}&lang=${activeLang}`;
}

function getDeviceText(value) {
  if (typeof value === "string") return value;
  return value?.[activeLang] || "-";
}

function getStatusText(status) {
  return t(`status.${status}`);
}

function getMaintenanceText(rawValue) {
  return rawValue === "TBD" ? t("common.tbd") : rawValue;
}

function formatLatestValues(values) {
  if (!values || typeof values !== "object") return t("common.tbd");
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ");
}

function renderOverview(devices) {
  const cardRoot = document.getElementById("card-view");
  const tableBody = document.getElementById("device-table-body");
  const countEl = document.getElementById("device-count");

  if (!cardRoot || !tableBody || !countEl) return;

  countEl.textContent = String(devices.length);

  cardRoot.innerHTML = devices
    .map((device) => {
      const statusText = getStatusText(device.status);
      const statusClass = statusClassMap[device.status] || statusClassMap.normal;

      return `
      <article class="device-card">
        <h3>${getDeviceText(device.name)}</h3>
        <p class="muted">${device.id}${device.model ? ` · ${device.model}` : ""}</p>
        <div class="card-row"><span>${t("common.locationLabel")}</span><span>${getDeviceText(device.location)}</span></div>
        <div class="card-row"><span>${t("common.type")}</span><span>${getDeviceText(device.type)}</span></div>
        <div class="card-row">
          <span>${t("common.statusLabel")}</span>
          <span class="status"><i class="dot ${statusClass}"></i>${statusText}</span>
        </div>
        <div class="card-row"><span>${t("common.latestValues")}</span><span>${formatLatestValues(device.latestValues)}</span></div>
        <div class="card-row"><span>${t("common.maintenanceLabel")}</span><span>${getMaintenanceText(device.maintenanceDate)}</span></div>
        <a class="btn" href="${deviceUrl(device.id)}">${t("common.viewDetail")}</a>
      </article>`;
    })
    .join("");

  tableBody.innerHTML = devices
    .map((device) => {
      const statusText = getStatusText(device.status);
      const statusClass = statusClassMap[device.status] || statusClassMap.normal;

      return `
      <tr>
        <td>${getDeviceText(device.name)}</td>
        <td>${device.id}</td>
        <td>${getDeviceText(device.location)}</td>
        <td><span class="status"><i class="dot ${statusClass}"></i>${statusText}</span></td>
        <td>${getMaintenanceText(device.maintenanceDate)}</td>
        <td><a class="btn" href="${deviceUrl(device.id)}">${t("common.deviceDetail")}</a></td>
      </tr>`;
    })
    .join("");
}

function attachViewSwitch() {
  const viewButtons = Array.from(document.querySelectorAll(".seg"));
  const cardView = document.getElementById("card-view");
  const tableView = document.getElementById("table-view");

  if (!cardView || !tableView) return;

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      viewButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      cardView.classList.toggle("hidden", view !== "card");
      tableView.classList.toggle("hidden", view !== "table");
    });
  });
}

function renderDetailTable(devices) {
  const tbody = document.getElementById("detail-device-table-body");
  if (!tbody) return;

  const deviceId = query.get("deviceId");
  const device = devices.find((item) => item.id === deviceId) || devices[0];
  const statusText = getStatusText(device.status);
  const statusClass = statusClassMap[device.status] || statusClassMap.normal;

  tbody.innerHTML = `
    <tr>
      <td>${t("common.name")}</td>
      <td>${getDeviceText(device.name)}</td>
    </tr>
    <tr>
      <td>${t("common.id")}</td>
      <td>${device.id}</td>
    </tr>
    <tr>
      <td>${t("common.model")}</td>
      <td>${device.model || "-"}</td>
    </tr>
    <tr>
      <td>${t("common.type")}</td>
      <td>${getDeviceText(device.type)}</td>
    </tr>
    <tr>
      <td>${t("common.devEui")}</td>
      <td>${device.devEui || "-"}</td>
    </tr>
    <tr>
      <td>${t("common.profile")}</td>
      <td>${device.profile || "-"}</td>
    </tr>
    <tr>
      <td>${t("common.decoder")}</td>
      <td>${device.decoder || "-"}</td>
    </tr>
    <tr>
      <td>${t("common.location")}</td>
      <td>${getDeviceText(device.location)}</td>
    </tr>
    <tr>
      <td>${t("common.status")}</td>
      <td><span class="status"><i class="dot ${statusClass}"></i>${statusText}</span></td>
    </tr>
    <tr>
      <td>${t("common.lastMaintenance")}</td>
      <td>${getMaintenanceText(device.maintenanceDate)}</td>
    </tr>
    <tr>
      <td>${t("common.latestValues")}</td>
      <td>${formatLatestValues(device.latestValues)}</td>
    </tr>`;
}

function syncDetailModeUI() {
  const mainView = document.getElementById("device-main-view");
  const tableMode = document.getElementById("device-table-mode");
  if (!mainView || !tableMode) return;

  mainView.classList.toggle("hidden", isDeviceTableMode);
  tableMode.classList.toggle("hidden", !isDeviceTableMode);
  updateDeviceModeButton();
}

function attachDeviceModeToggle() {
  const toggleBtn = document.getElementById("detail-view-toggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    isDeviceTableMode = !isDeviceTableMode;
    syncDetailModeUI();
  });
}

function initCubeInteraction() {
  const stage = document.getElementById("cube-stage");
  const cube = document.getElementById("cube");
  if (!stage || !cube) return;

  let rotX = -22;
  let rotY = 35;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function paint() {
    cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  stage.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    rotY += dx * 0.45;
    rotX -= dy * 0.45;
    rotX = Math.max(-89, Math.min(89, rotX));
    lastX = event.clientX;
    lastY = event.clientY;
    paint();
  });

  stage.addEventListener("pointerup", () => {
    dragging = false;
  });

  stage.addEventListener("pointercancel", () => {
    dragging = false;
  });

  paint();
}

function renderDeviceDetail(devices) {
  const titleEl = document.getElementById("device-title");
  const listEl = document.getElementById("device-info-list");
  if (!titleEl || !listEl) return;

  const deviceId = query.get("deviceId");
  const device = devices.find((item) => item.id === deviceId) || devices[0];
  const statusText = getStatusText(device.status);
  const statusClass = statusClassMap[device.status] || statusClassMap.normal;

  titleEl.textContent = getDeviceText(device.name);

  listEl.innerHTML = `
    <div><dt>${t("common.name")}</dt><dd>${getDeviceText(device.name)}</dd></div>
    <div><dt>${t("common.id")}</dt><dd>${device.id}</dd></div>
    <div><dt>${t("common.model")}</dt><dd>${device.model || "-"}</dd></div>
    <div><dt>${t("common.type")}</dt><dd>${getDeviceText(device.type)}</dd></div>
    <div><dt>${t("common.devEui")}</dt><dd>${device.devEui || "-"}</dd></div>
    <div><dt>${t("common.decoder")}</dt><dd>${device.decoder || "-"}</dd></div>
    <div><dt>${t("common.location")}</dt><dd>${getDeviceText(device.location)}</dd></div>
    <div><dt>${t("common.status")}</dt><dd><span class="status"><i class="dot ${statusClass}"></i>${statusText}</span></dd></div>
    <div><dt>${t("common.latestValues")}</dt><dd>${formatLatestValues(device.latestValues)}</dd></div>
    <div><dt>${t("common.lastMaintenance")}</dt><dd>${getMaintenanceText(device.maintenanceDate)}</dd></div>
  `;
}

async function loadDevices() {
  // Backend integration target: GET /api/devices.
  // During frontend development, data/devices.js provides the same shape.
  return window.ZB202_DEVICE_DATA || placeholderDevices;
}

(async function init() {
  const page = document.body.dataset.page;
  const devices = await loadDevices();

  applyLanguage(activeLang);

  if (page === "overview") {
    renderOverview(devices);
    attachViewSwitch();
    addLangToggle(() => renderOverview(devices));
  }

  if (page === "device") {
    renderDeviceDetail(devices);
    renderDetailTable(devices);
    initCubeInteraction();
    attachDeviceModeToggle();
    syncDetailModeUI();
    addLangToggle(() => {
      renderDeviceDetail(devices);
      renderDetailTable(devices);
      syncDetailModeUI();
    });
  }
})();
