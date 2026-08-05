import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import "@phosphor-icons/web/regular";

const THEME_STORAGE_KEY = "zb202-theme";
const query = new URLSearchParams(window.location.search);
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let activeTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";

const THEME_PRESETS = {
  light: {
    background: 0xdfe6ef,
    fog: 0xdfe6ef,
    exposure: 0.92,
    hemisphereSky: 0xf8fbff,
    hemisphereGround: 0x5a6677,
    hemisphereIntensity: 1.35,
    key: 0xffffff,
    keyIntensity: 1.6,
    fill: 0xb8d7ff,
    fillIntensity: 0.65,
    gridCenter: 0xb8c4d4,
    gridLine: 0xd4dce7,
    gridOpacity: 0.35,
  },
  dark: {
    background: 0x0f1216,
    fog: 0x0f1216,
    exposure: 1.03,
    hemisphereSky: 0xe8ebef,
    hemisphereGround: 0x242a31,
    hemisphereIntensity: 1.48,
    key: 0xffffff,
    keyIntensity: 1.72,
    fill: 0x9db4cc,
    fillIntensity: 0.68,
    gridCenter: 0x3b4149,
    gridLine: 0x252a31,
    gridOpacity: 0.4,
  },
};

const MODELS = [
  { id: "archi", name: "Lab-archi.frag", url: "./models/fragments/Lab-archi.frag", label: "Lab Architecture" },
  {
    id: "mep",
    name: "Lab-mep.frag",
    url: "./models/fragments/Lab-mep.frag",
    label: "Lab MEP",
    hiddenCategories: ["IFCCOVERING"],
  },
];

const MODEL = {
  name: MODELS.map((model) => model.name).join(" + "),
  label: "Lab Archi + MEP",
};

const I18N = {
  zh: {
    backAria: "返回设备总览", title: "ZB202 空间设备监控", connectionAria: "数据连接状态",
    mockRunning: "模拟数据运行中", viewerAria: "IFC / Fragments 三维模型", model: "模型",
    calibrate: "校准点位", calibrateTitle: "在模型表面拾取世界坐标", resetView: "重置视角", resetTitle: "重置模型视角",
    preparingScene: "正在准备三维场景", initializingRenderer: "初始化渲染器…", loadFailed: "模型加载失败",
    loadRetryHint: "请检查模型文件后重试。", reload: "重新加载", rotateHint: "左键旋转", panHint: "右键平移",
    zoomHint: "滚轮缩放", components: "构件", copy: "复制", copied: "已复制", sidebarAria: "设备实时信息",
    deviceStatus: "设备状态", deviceListAria: "IFC 设备列表", last48Seconds: "最近 48 秒", trendAria: "实时数据趋势图",
    openDevicePanel: "设备面板", closeDevicePanel: "关闭设备面板", statusLegendAria: "设备状态图例",
    lastUpdated: "最后更新", normal: "正常", warning: "注意", fault: "故障", unavailable: "未绑定",
    noBinding: "当前模型无绑定", objectBinding: "BIM 构件绑定", markerBinding: "空间坐标绑定",
    restoreNormal: "恢复设备正常", simulateFault: "模拟设备故障", readingModel: "读取模型文件…",
    loadingModel: "正在加载 {model}", modelReady: "{count} 个构件 · 模型准备完成",
    loadError: "无法读取 {model}。请通过 npm run dev 启动项目，并确认 Fragments 模型文件存在。",
    supplyTemperature: "送风温度", fanPower: "风机功率", airflow: "送风量", damperPosition: "风阀开度",
    ifcProperties: "IFC 属性", ifcCategory: "IFC 类型", globalId: "GlobalId", expressId: "Express ID",
    allEquipment: "全部", sensors: "传感器", fans: "风机", coils: "盘管", dampers: "风阀", airTerminals: "风口", ducts: "风管", pipes: "管道", mepComponents: "机电构件",
    noProperties: "没有可显示的 IFC 属性", staticBimItem: "静态 BIM 构件", scannedEquipment: "自动扫描设备",
    searchEquipmentPlaceholder: "搜索名称、类型或 ID", searchEquipmentAria: "搜索 IFC 设备", noSearchResults: "没有匹配的 IFC 设备",
    temperature: "室内温度", humidity: "相对湿度", co2: "CO₂",
    dataPanelAria: "传感器数据面板", closeDataPanel: "关闭数据面板", sensorData: "传感器数据",
    dataPanelLabel: "数据面板", earlier: "较早", now: "现在",
    lastUpload: "最后上传", custom: "自定义", mockHistoryNote: "当前仅显示可用的模拟数据窗口",
    bmsReserved: "AHU 运行数据将在后续版本接入。", aiReserved: "AI 分析模块将在后续版本接入。",
    reservedCopy: "此模块为后续功能预留。", online: "在线", offline: "离线", maintenance: "维护中",
    liveSummary: "实时概览", siteOverview: "场地概览", liveAssets: "实时设备", iotSensorsList: "IoT 传感器列表",
    reservedModule: "预留模块", closeOverviewPanel: "关闭概览面板",
    siteTemperature: "温度", siteHumidity: "湿度", siteCo2: "CO₂", occupants: "人数",
  },
  "zh-Hant": {
    backAria: "返回設備總覽", title: "ZB202 空間設備監控", connectionAria: "資料連線狀態",
    mockRunning: "模擬資料運行中", viewerAria: "IFC / Fragments 三維模型", model: "模型",
    calibrate: "校準點位", calibrateTitle: "在模型表面擷取世界座標", resetView: "重設視角", resetTitle: "重設模型視角",
    preparingScene: "正在準備三維場景", initializingRenderer: "初始化渲染器…", loadFailed: "模型載入失敗",
    loadRetryHint: "請檢查模型檔案後重試。", reload: "重新載入", rotateHint: "左鍵旋轉", panHint: "右鍵平移",
    zoomHint: "滾輪縮放", components: "構件", copy: "複製", copied: "已複製", sidebarAria: "設備即時資訊",
    deviceStatus: "設備狀態", deviceListAria: "IFC 設備列表", last48Seconds: "最近 48 秒", trendAria: "即時資料趨勢圖",
    openDevicePanel: "設備面板", closeDevicePanel: "關閉設備面板", statusLegendAria: "設備狀態圖例",
    lastUpdated: "最後更新", normal: "正常", warning: "注意", fault: "故障", unavailable: "未綁定",
    noBinding: "目前模型未綁定", objectBinding: "BIM 構件綁定", markerBinding: "空間座標綁定",
    restoreNormal: "恢復設備正常", simulateFault: "模擬設備故障", readingModel: "讀取模型檔案…",
    loadingModel: "正在載入 {model}", modelReady: "{count} 個構件 · 模型準備完成",
    loadError: "無法讀取 {model}。請透過 npm run dev 啟動專案，並確認 Fragments 模型檔案存在。",
    supplyTemperature: "送風溫度", fanPower: "風機功率", airflow: "送風量", damperPosition: "風閥開度",
    ifcProperties: "IFC 屬性", ifcCategory: "IFC 類型", globalId: "GlobalId", expressId: "Express ID",
    allEquipment: "全部", sensors: "感測器", fans: "風機", coils: "盤管", dampers: "風閥", airTerminals: "風口", ducts: "風管", pipes: "管道", mepComponents: "機電構件",
    noProperties: "沒有可顯示的 IFC 屬性", staticBimItem: "靜態 BIM 構件", scannedEquipment: "自動掃描設備",
    searchEquipmentPlaceholder: "搜尋名稱、類型或 ID", searchEquipmentAria: "搜尋 IFC 設備", noSearchResults: "沒有符合的 IFC 設備",
    temperature: "室內溫度", humidity: "相對濕度", co2: "CO₂",
    dataPanelAria: "感測器資料面板", closeDataPanel: "關閉資料面板", sensorData: "感測器資料",
    dataPanelLabel: "資料面板", earlier: "較早", now: "現在",
    lastUpload: "最後上傳", custom: "自訂", mockHistoryNote: "目前僅顯示可用的模擬資料視窗",
    bmsReserved: "AHU 運行資料將於後續版本接入。", aiReserved: "AI 分析模組將於後續版本接入。",
    reservedCopy: "此模組為後續功能預留。", online: "在線", offline: "離線", maintenance: "維護中",
    liveSummary: "即時概覽", siteOverview: "場地概覽", liveAssets: "即時設備", iotSensorsList: "IoT 感測器列表",
    reservedModule: "預留模組", closeOverviewPanel: "關閉概覽面板",
    siteTemperature: "溫度", siteHumidity: "濕度", siteCo2: "CO₂", occupants: "人數",
  },
  en: {
    backAria: "Back to device overview", title: "ZB202 Spatial Equipment Monitoring", connectionAria: "Data connection status",
    mockRunning: "Mock data running", viewerAria: "IFC / Fragments 3D model", model: "Model",
    calibrate: "Calibrate Point", calibrateTitle: "Pick world coordinates on the model surface", resetView: "Reset View", resetTitle: "Reset model view",
    preparingScene: "Preparing 3D scene", initializingRenderer: "Initializing renderer…", loadFailed: "Model loading failed",
    loadRetryHint: "Check the model file and try again.", reload: "Reload", rotateHint: "Left-drag to rotate", panHint: "Right-drag to pan",
    zoomHint: "Scroll to zoom", components: "components", copy: "Copy", copied: "Copied", sidebarAria: "Live device information",
    deviceStatus: "Device Status", deviceListAria: "IFC equipment list", last48Seconds: "Last 48 seconds", trendAria: "Live data trend chart",
    openDevicePanel: "Device Panel", closeDevicePanel: "Close device panel", statusLegendAria: "Device status legend",
    lastUpdated: "Last updated", normal: "Normal", warning: "Warning", fault: "Fault", unavailable: "Unbound",
    noBinding: "Not bound in this model", objectBinding: "BIM Component Binding", markerBinding: "Spatial Coordinate Binding",
    restoreNormal: "Restore Normal Status", simulateFault: "Simulate Device Fault", readingModel: "Reading model file…",
    loadingModel: "Loading {model}", modelReady: "{count} components · Model ready",
    loadError: "Unable to load {model}. Start the project with npm run dev and confirm the Fragments model file exists.",
    supplyTemperature: "Supply Air Temperature", fanPower: "Fan Power", airflow: "Airflow", damperPosition: "Damper Position",
    ifcProperties: "IFC Properties", ifcCategory: "IFC Type", globalId: "GlobalId", expressId: "Express ID",
    allEquipment: "All", sensors: "Sensors", fans: "Fans", coils: "Coils", dampers: "Dampers", airTerminals: "Air Terminals", ducts: "Ducts", pipes: "Pipes", mepComponents: "MEP",
    noProperties: "No IFC properties available", staticBimItem: "Static BIM Component", scannedEquipment: "Auto-scanned equipment",
    searchEquipmentPlaceholder: "Search name, type, or ID", searchEquipmentAria: "Search IFC equipment", noSearchResults: "No matching IFC equipment",
    temperature: "Indoor Temperature", humidity: "Relative Humidity", co2: "CO₂",
    dataPanelAria: "Sensor data panel", closeDataPanel: "Close data panel", sensorData: "Sensor Data",
    dataPanelLabel: "Data Panel", earlier: "Earlier", now: "Now",
    lastUpload: "Last upload", custom: "Custom", mockHistoryNote: "Showing the available simulated-data window",
    bmsReserved: "AHU operating data will be connected in a future release.", aiReserved: "AI analytics will be connected in a future release.",
    reservedCopy: "This space is reserved for a future module.", online: "Online", offline: "Offline", maintenance: "Maintenance",
    liveSummary: "Live Summary", siteOverview: "Site Overview", liveAssets: "Live Assets", iotSensorsList: "IoT Sensors List",
    reservedModule: "Reserved Module", closeOverviewPanel: "Close overview panel",
    siteTemperature: "Temperature", siteHumidity: "Humidity", siteCo2: "CO₂", occupants: "Occupants",
  },
};

let activeLang = normalizeLanguage(query.get("lang") || localStorage.getItem("lang") || "zh");

function normalizeLanguage(lang) {
  if (lang === "en") return "en";
  if (lang === "zh-Hant" || lang === "zh-HK" || lang === "zh-TW") return "zh-Hant";
  return "zh";
}

function activeLocale() {
  if (activeLang === "en") return "en-GB";
  return activeLang === "zh-Hant" ? "zh-HK" : "zh-CN";
}

function t(key, values = {}) {
  let text = I18N[activeLang]?.[key] || I18N.zh[key] || key;
  for (const [name, value] of Object.entries(values)) text = text.replace(`{${name}}`, value);
  return text;
}

function getStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme, persist = false) {
  activeTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = activeTheme;

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    } catch {
      // The selected theme still applies for this session when storage is unavailable.
    }
  }

  const preset = THEME_PRESETS[activeTheme];
  scene.background.setHex(preset.background);
  scene.fog.color.setHex(preset.fog);
  renderer.toneMappingExposure = preset.exposure;
  hemisphereLight.color.setHex(preset.hemisphereSky);
  hemisphereLight.groundColor.setHex(preset.hemisphereGround);
  hemisphereLight.intensity = preset.hemisphereIntensity;
  keyLight.color.setHex(preset.key);
  keyLight.intensity = preset.keyIntensity;
  fillLight.color.setHex(preset.fill);
  fillLight.intensity = preset.fillIntensity;

  if (state.model) addGrid();
}

const STATUS = {
  normal: { color: 0x20a464 },
  warning: { color: 0xe99a2c },
  fault: { color: 0xe34d59 },
  unavailable: { color: 0x8b94a6 },
};

const EQUIPMENT_GROUPS = [
  { key: "fans", category: "IFCFAN", label: { zh: "风机", "zh-Hant": "風機", en: "Fan" } },
  { key: "coils", category: "IFCCOIL", label: { zh: "盘管", "zh-Hant": "盤管", en: "Coil" } },
  { key: "dampers", category: "IFCDAMPER", label: { zh: "风阀", "zh-Hant": "風閥", en: "Damper" } },
  { key: "airTerminals", category: "IFCAIRTERMINAL", label: { zh: "风口", "zh-Hant": "風口", en: "Air Terminal" } },
  { key: "airTerminals", category: "IFCAIRTERMINALBOX", label: { zh: "风口箱", "zh-Hant": "風口箱", en: "Air Terminal Box" } },
  { key: "ducts", category: "IFCDUCTSEGMENT", label: { zh: "风管", "zh-Hant": "風管", en: "Duct" } },
  { key: "ducts", category: "IFCDUCTFITTING", label: { zh: "风管管件", "zh-Hant": "風管管件", en: "Duct Fitting" } },
  { key: "pipes", category: "IFCPIPESEGMENT", label: { zh: "空调水管", "zh-Hant": "空調水管", en: "HVAC Pipe" } },
  { key: "pipes", category: "IFCPIPEFITTING", label: { zh: "管道管件", "zh-Hant": "管道管件", en: "Pipe Fitting" } },
];

let DEVICES = [];

function fallbackSensorDevices() {
  const positions = [[0.32, 0.64, 0.38], [0.58, 0.52, 0.56], [0.73, 0.68, 0.36]];
  return positions.map((normalizedPosition, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      id: `AM103-${number}`,
      name: {
        zh: `AM-103 室内环境传感器 ${number}`,
        "zh-Hant": `AM-103 室內環境感測器 ${number}`,
        en: `AM-103 Indoor Environment Sensor ${number}`,
      },
      subtitle: { zh: "空间点位 · 模拟遥测", "zh-Hant": "空間點位 · 模擬遙測", en: "Spatial marker · Simulated telemetry" },
      category: "IOT_SENSOR",
      groupKey: "sensors",
      binding: { kind: "marker", normalizedPosition },
      metrics: [
        { key: "temperature", labelKey: "temperature", unit: "°C", value: 22.8 + index * 0.4, variance: 0.18 },
        { key: "humidity", labelKey: "humidity", unit: "%", value: 52 + index * 2, variance: 0.6 },
        { key: "co2", labelKey: "co2", unit: "ppm", value: 610 + index * 45, variance: 8 },
      ],
      ifc: { localId: `MOCK-${number}`, category: "IoT Sensor", guid: null, name: `AM103-${number}`, data: { Source: "Mock data", Binding: "Normalized model coordinate" } },
    };
  });
}

function deviceText(device, field) {
  const localized = device[field];
  if (localized) return localized[activeLang] || localized.zh || localized.en;
  return t(device[`${field}Key`]);
}

const elements = {
  overviewLink: document.getElementById("overview-link"),
  devicePanelButton: document.getElementById("device-panel-btn"),
  devicePanel: document.getElementById("device-panel"),
  devicePanelClose: document.getElementById("device-panel-close"),
  overviewRailClose: document.getElementById("overview-rail-close"),
  wrap: document.getElementById("viewer-wrap"),
  canvas: document.getElementById("twin-canvas"),
  loading: document.getElementById("model-loading"),
  loadingTitle: document.getElementById("loading-title"),
  loadingProgress: document.getElementById("loading-progress"),
  loadingMeta: document.getElementById("loading-meta"),
  error: document.getElementById("model-error"),
  errorMessage: document.getElementById("model-error-message"),
  retryButton: document.getElementById("retry-model-btn"),
  resetViewButton: document.getElementById("reset-view-btn"),
  calibrateButton: document.getElementById("calibrate-btn"),
  coordinateToast: document.getElementById("coordinate-toast"),
  coordinateValue: document.getElementById("coordinate-value"),
  copyCoordinateButton: document.getElementById("copy-coordinate-btn"),
  modelName: document.getElementById("model-name"),
  modelLabel: document.querySelector(".dt-model-name"),
  layerToggles: [...document.querySelectorAll("[data-model-layer]")],
  meshCount: document.getElementById("mesh-count"),
  deviceCount: document.getElementById("device-count"),
  viewerCard: document.querySelector(".dt-viewer-card"),
  technologyLabel: document.querySelector(".dt-side-footer span"),
  equipmentSearch: document.getElementById("equipment-search"),
  equipmentSearchCount: document.getElementById("equipment-search-count"),
  equipmentFilters: document.getElementById("equipment-filters"),
  deviceList: document.getElementById("device-list"),
  bindingLabel: document.getElementById("binding-label"),
  deviceName: document.getElementById("device-name"),
  deviceId: document.getElementById("device-id"),
  statusBadge: document.getElementById("status-badge"),
  metricGrid: document.getElementById("metric-grid"),
  trendCard: document.getElementById("trend-card"),
  trendLabel: document.getElementById("trend-label"),
  trendValue: document.getElementById("trend-value"),
  trendLine: document.getElementById("trend-line"),
  trendArea: document.getElementById("trend-area"),
  updatedAt: document.getElementById("updated-at"),
  updateRow: document.getElementById("update-row"),
  faultToggle: document.getElementById("fault-toggle"),
  faultButtonText: document.getElementById("fault-button-text"),
  clock: document.getElementById("dt-clock"),
  siteTemperature: document.getElementById("site-temperature"),
  siteHumidity: document.getElementById("site-humidity"),
  siteCo2: document.getElementById("site-co2"),
  siteOccupants: document.getElementById("site-occupants"),
  reservedTitle: document.getElementById("reserved-title"),
  reservedCopy: document.getElementById("reserved-copy"),
  historyNote: document.getElementById("history-note"),
  historyRangeButtons: [...document.querySelectorAll("[data-history-range]")],
  trendGrid: document.getElementById("trend-grid"),
  trendAxisLabels: document.getElementById("trend-axis-labels"),
  metricTrendCards: [
    { card: document.getElementById("trend-card"), label: document.getElementById("trend-label"), value: document.getElementById("trend-value"), line: document.getElementById("trend-line"), area: document.getElementById("trend-area"), grid: document.getElementById("trend-grid"), axis: document.getElementById("trend-axis-labels") },
    { card: document.getElementById("humidity-trend-card"), label: document.getElementById("humidity-trend-label"), value: document.getElementById("humidity-trend-value"), line: document.getElementById("humidity-trend-line"), area: document.getElementById("humidity-trend-area"), grid: document.getElementById("humidity-trend-grid"), axis: document.getElementById("humidity-trend-axis-labels") },
    { card: document.getElementById("co2-trend-card"), label: document.getElementById("co2-trend-label"), value: document.getElementById("co2-trend-value"), line: document.getElementById("co2-trend-line"), area: document.getElementById("co2-trend-area"), grid: document.getElementById("co2-trend-grid"), axis: document.getElementById("co2-trend-axis-labels") },
  ],
  viewButtons: [...document.querySelectorAll("[data-view]")],
};

elements.modelLabel.textContent = MODEL.label;
elements.deviceCount.textContent = String(DEVICES.length);
elements.viewerCard.setAttribute("aria-label", "IFC / Fragments 三维模型");
if (elements.technologyLabel) elements.technologyLabel.textContent = "WebGL / Three.js / IFC / Fragments";

const state = {
  model: null,
  modelBox: new THREE.Box3(),
  modelCenter: new THREE.Vector3(),
  modelRadius: 1,
  selectedDeviceId: null,
  selectedItem: null,
  selectedIfcItem: null,
  equipmentFilter: "allEquipment",
  equipmentQuery: "",
  calibrating: false,
  boundObjects: new Map(),
  markerObjects: new Map(),
  snapshots: new Map(),
  loadRequest: 0,
  fragmentsModel: null,
  fragmentsModels: new Map(),
  historyRange: "1h",
};

function initializeDeviceSnapshots() {
  state.snapshots.clear();
  for (const device of DEVICES) {
  const values = Object.fromEntries(device.metrics.map((metric) => [metric.key, metric.value]));
    state.snapshots.set(device.id, {
      deviceId: device.id,
      status: "normal",
      updatedAt: new Date(),
      values,
      trends: Object.fromEntries(device.metrics.map((metric) => [metric.key, Array(24).fill(metric.value)])),
    });
  }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(THEME_PRESETS[activeTheme].background);
scene.fog = new THREE.Fog(THEME_PRESETS[activeTheme].fog, 180, 920);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 5000);
camera.position.set(8, 7, 10);

const renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = THEME_PRESETS[activeTheme].exposure;

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = "dt-label-layer";
elements.wrap.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, elements.canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.screenSpacePanning = true;
controls.maxPolarAngle = Math.PI * 0.93;

const hemisphereLight = new THREE.HemisphereLight(0xf8fbff, 0x5a6677, 1.35);
scene.add(hemisphereLight);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(12, 22, 16);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xb8d7ff, 0.65);
fillLight.position.set(-16, 8, -10);
scene.add(fillLight);

const modelGroup = new THREE.Group();
modelGroup.name = "loaded-model";
scene.add(modelGroup);

let fragments = null;
let renderedFaces = null;

async function ensureFragments() {
  if (fragments) return fragments;
  const [fragmentModule, workerModule] = await Promise.all([
    import("@thatopen/fragments"),
    import("@thatopen/fragments/worker?url"),
  ]);
  renderedFaces = fragmentModule.RenderedFaces;
  fragments = new fragmentModule.FragmentsModels(workerModule.default);
  return fragments;
}

const helpersGroup = new THREE.Group();
helpersGroup.name = "digital-twin-overlays";
scene.add(helpersGroup);

let pointerDownPosition = null;
let gridHelper = null;

function formatNumber(value) {
  if (Math.abs(value) >= 100) return Math.round(value).toLocaleString(activeLocale());
  return value.toFixed(1);
}

function statusFor(deviceId) {
  return state.snapshots.get(deviceId)?.status || "unavailable";
}

function presentationStatus(status) {
  if (status === "normal") return { key: "online", className: "normal" };
  if (status === "warning") return { key: "maintenance", className: "warning" };
  if (status === "unavailable") return { key: "offline", className: "unavailable" };
  return { key: "fault", className: "fault" };
}

function unwrapIfcValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    return unwrapIfcValue(value.value);
  }
  return value;
}

function readableIfcValue(value) {
  const unwrapped = unwrapIfcValue(value);
  if (unwrapped === null || unwrapped === undefined || unwrapped === "") return null;
  if (typeof unwrapped === "boolean") return unwrapped ? "True" : "False";
  if (typeof unwrapped === "number" || typeof unwrapped === "string") return String(unwrapped);
  return null;
}

function equipmentGroupForCategory(category) {
  return EQUIPMENT_GROUPS.find((group) => group.category === category);
}

function groupForScannedCategory(category) {
  const exact = equipmentGroupForCategory(category);
  if (exact) return exact;
  if (/DUCT/i.test(category)) return { key: "ducts", category, label: { zh: "风管", "zh-Hant": "風管", en: "Duct" } };
  if (/PIPE/i.test(category)) return { key: "pipes", category, label: { zh: "管道", "zh-Hant": "管道", en: "Pipe" } };
  return { key: "mepComponents", category, label: { zh: "机电构件", "zh-Hant": "機電構件", en: "MEP Component" } };
}

function localizedGroupLabel(group) {
  return group?.label[activeLang] || group?.label.zh || group?.label.en || "IFC";
}

function metricsForCategory(category, localId) {
  const seed = localId % 97;
  if (category === "IFCFAN") {
    return [
      { key: "fanPower", labelKey: "fanPower", unit: "W", value: 280 + seed * 2.4, variance: 5.5 },
      { key: "airflow", labelKey: "airflow", unit: "L/s", value: 170 + seed * 0.8, variance: 2.2 },
      { key: "supplyTemperature", labelKey: "supplyTemperature", unit: "°C", value: 17 + (seed % 20) * 0.1, variance: 0.22 },
    ];
  }
  if (category === "IFCDAMPER") {
    return [
      { key: "damperPosition", labelKey: "damperPosition", unit: "%", value: 45 + (seed % 45), variance: 0.8 },
      { key: "airflow", labelKey: "airflow", unit: "L/s", value: 120 + seed * 0.7, variance: 2.2 },
    ];
  }
  return [
    { key: "airflow", labelKey: "airflow", unit: "L/s", value: 130 + seed * 0.7, variance: 2.2 },
    { key: "supplyTemperature", labelKey: "supplyTemperature", unit: "°C", value: 14 + (seed % 60) * 0.1, variance: 0.2 },
  ];
}

async function loadIfcItemDetails(localId, categoryHint = null, fragmentsModel = state.fragmentsModel) {
  if (!fragmentsModel) return null;
  const item = fragmentsModel.getItem(localId);
  const safely = (task, fallback = null) => Promise.resolve().then(task).catch(() => fallback);
  const [attributes, category, guid] = await Promise.all([
    safely(() => item.getAttributes(), {}),
    categoryHint ? Promise.resolve(categoryHint) : safely(() => item.getCategory(), "IFC"),
    safely(() => item.getGuid()),
  ]);
  let data = [];
  try {
    data = await fragmentsModel.getItemsData([localId], {
      attributesDefault: true,
      relations: {
        ContainedInStructure: { attributes: true, relations: false },
        HasAssignments: { attributes: true, relations: false },
        IsDefinedBy: { attributes: true, relations: true },
        DefinesOccurrence: { attributes: true, relations: true },
      },
    });
  } catch {
    data = [];
  }
  const attributeObject = attributes?.object || {};
  const itemData = data[0] || attributeObject;
  return {
    localId,
    category: category || categoryHint || "IFC",
    guid: guid || readableIfcValue(attributeObject.GlobalId),
    name: readableIfcValue(attributeObject.Name) || readableIfcValue(itemData.Name) || `${category || categoryHint || "IFC"} #${localId}`,
    data: itemData,
  };
}

async function scanIfcEquipment(model, modelId) {
  if (modelId !== "mep") return [];
  const categories = await model.getItemsOfCategories([
    /IFC(FAN|COIL|DAMPER|AIRTERMINAL|DUCT|PIPE|FLOW|VALVE|PUMP|UNITARY|EQUIPMENT|BUILDINGELEMENTPROXY)/i,
  ]);
  const records = [];
  for (const [category, localIds] of Object.entries(categories)) {
    const group = groupForScannedCategory(category);
    for (const localId of localIds) records.push({ localId, group });
  }

  const devices = await Promise.all(records.map(async ({ localId, group }) => {
    const item = model.getItem(localId);
    const [attributes, guid] = await Promise.all([item.getAttributes(), item.getGuid()]);
    const attributeObject = attributes?.object || {};
    const name = readableIfcValue(attributeObject.Name)
      || readableIfcValue(attributeObject.ObjectType)
      || `${localizedGroupLabel(group)} #${localId}`;
    return {
      id: guid || `${modelId}-${group.category}-${localId}`,
      name: { zh: name, "zh-Hant": name, en: name },
      subtitle: {
        zh: `${group.label.zh} · IFC 自动扫描 · 模拟遥测`,
        "zh-Hant": `${group.label["zh-Hant"]} · IFC 自動掃描 · 模擬遙測`,
        en: `${group.label.en} · IFC auto-scan · Simulated telemetry`,
      },
      category: group.category,
      groupKey: group.key,
      binding: { kind: "object", globalId: guid, localId, modelId },
      metrics: metricsForCategory(group.category, localId),
      ifc: { localId, category: group.category, guid, name, data: attributeObject },
    };
  }));

  return devices.sort((a, b) => {
    const categoryOrder = EQUIPMENT_GROUPS.findIndex((group) => group.category === a.category)
      - EQUIPMENT_GROUPS.findIndex((group) => group.category === b.category);
    return categoryOrder || deviceText(a, "name").localeCompare(deviceText(b, "name"), activeLocale());
  });
}

function showLoading(model, percent = 0, meta = t("readingModel")) {
  elements.error.classList.add("hidden");
  elements.loading.classList.remove("hidden");
  elements.loadingTitle.textContent = t("loadingModel", { model: model.label });
  elements.loadingProgress.style.width = `${Math.max(3, percent)}%`;
  elements.loadingMeta.textContent = meta;
}

function showError(message) {
  elements.loading.classList.add("hidden");
  elements.error.classList.remove("hidden");
  elements.errorMessage.textContent = message;
}

async function clearCurrentModel() {
  for (const fragmentsModel of state.fragmentsModels.values()) {
    modelGroup.remove(fragmentsModel.object);
    await fragments.disposeModel(fragmentsModel.modelId);
  }
  state.model = null;
  state.fragmentsModel = null;
  state.fragmentsModels.clear();
  state.selectedItem = null;
  state.selectedDeviceId = null;
  state.selectedIfcItem = null;
  helpersGroup.clear();
  state.boundObjects.clear();
  state.markerObjects.clear();
  if (gridHelper) {
    scene.remove(gridHelper);
    gridHelper.geometry.dispose();
    gridHelper.material.dispose();
    gridHelper = null;
  }
}

function fitCameraToModel(animate = false) {
  if (!state.model) return;
  const center = state.modelCenter.clone();
  const radius = Math.max(state.modelRadius, 0.1);
  const direction = new THREE.Vector3(-1.05, 0.72, -1.05).normalize();
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5)) * 0.94;
  const targetPosition = center.clone().add(direction.multiplyScalar(distance));

  camera.near = Math.max(radius / 1000, 0.01);
  camera.far = Math.max(radius * 60, 1000);
  camera.updateProjectionMatrix();

  if (animate) {
    animateCamera(targetPosition, center);
  } else {
    camera.position.copy(targetPosition);
    controls.target.copy(center);
    controls.update();
  }

  controls.minDistance = radius * 0.04;
  controls.maxDistance = radius * 12;
}

function animateCamera(destination, target) {
  camera.position.copy(destination);
  controls.target.copy(target);
  controls.update();
}

async function findBindingObject(device) {
  if (!state.model || device.binding.kind !== "object") return null;
  if (Number.isInteger(device.binding.localId)) return device.binding.localId;
  const fragmentsModel = state.fragmentsModels.get(device.binding.modelId) || state.fragmentsModel;
  if (!device.binding.globalId || !fragmentsModel) return null;
  const [localId] = await fragmentsModel.getLocalIdsByGuids([device.binding.globalId]);
  return localId ?? null;
}

function createMarker(device) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "dt-model-marker normal";
  element.innerHTML = `<span class="dt-marker-pulse"></span><span>${device.id}</span>`;
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    selectDevice(device.id, true);
    setDevicePanelOpen(true);
  });

  const label = new CSS2DObject(element);
  label.name = `marker-${device.id}`;
  const [nx, ny, nz] = device.binding.normalizedPosition;
  const size = state.modelBox.getSize(new THREE.Vector3());
  label.position.set(
    state.modelBox.min.x + size.x * nx,
    state.modelBox.min.y + size.y * ny,
    state.modelBox.min.z + size.z * nz,
  );
  helpersGroup.add(label);
  state.markerObjects.set(device.id, { label, element });
}

async function bindDevices() {
  for (const device of DEVICES) {
    if (device.binding.kind === "marker") {
      createMarker(device);
      continue;
    }

    const target = await findBindingObject(device);
    if (target === null) continue;
    state.boundObjects.set(device.id, target);
  }
  await updateAllVisualStates();
}

async function styleBoundObject(deviceId) {
  const target = state.boundObjects.get(deviceId);
  if (target === undefined) return;
  const selected = state.selectedDeviceId === deviceId;
  const status = statusFor(deviceId);
  const statusColor = new THREE.Color(STATUS[status].color);

  const device = DEVICES.find((item) => item.id === deviceId);
  const fragmentsModel = state.fragmentsModels.get(device?.binding.modelId) || state.fragmentsModel;
  if (!fragmentsModel) return;
  if (selected || status !== "normal") {
    await fragmentsModel.highlight([target], {
      color: status === "normal" ? new THREE.Color(0x2f7df4) : statusColor,
      opacity: 1,
      transparent: false,
      renderedFaces: renderedFaces.TWO,
    });
  }
}

async function updateAllVisualStates() {
  for (const [modelId, fragmentsModel] of state.fragmentsModels) {
    const localIds = DEVICES
      .filter((device) => device.binding.modelId === modelId && state.boundObjects.has(device.id))
      .map((device) => state.boundObjects.get(device.id));
    if (localIds.length) await fragmentsModel.resetHighlight(localIds);
  }
  for (const device of DEVICES) {
    if (state.selectedDeviceId === device.id || statusFor(device.id) !== "normal") {
      await styleBoundObject(device.id);
    }
    const marker = state.markerObjects.get(device.id);
    if (marker) {
      marker.element.className = `dt-model-marker ${statusFor(device.id)}${state.selectedDeviceId === device.id ? " selected" : ""}`;
    }
  }
}

async function focusDevice(device) {
  let box = null;
  const target = state.boundObjects.get(device.id);
  const marker = state.markerObjects.get(device.id);

  const fragmentsModel = state.fragmentsModels.get(device.binding.modelId) || state.fragmentsModel;
  if (target !== undefined && fragmentsModel) {
    const boxes = await fragmentsModel.getBoxes([target]);
    if (boxes.length) box = boxes.reduce((combined, item) => combined.union(item), new THREE.Box3());
  }
  if (marker) {
    const position = marker.label.position.clone();
    box = new THREE.Box3(position.clone(), position.clone());
  }
  if (!box) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const focusRadius = Math.max(size.length() * 0.5, state.modelRadius * 0.2);
  const direction = camera.position.clone().sub(controls.target).normalize();
  const destination = center.clone().add(direction.multiplyScalar(focusRadius * 5.4));
  animateCamera(destination, center);
}

function normalizedSearchText(value) {
  return String(value || "").normalize("NFKD").toLocaleLowerCase(activeLocale()).trim();
}

function visibleDevices() {
  const categoryDevices = state.equipmentFilter === "allEquipment"
    ? DEVICES
    : DEVICES.filter((device) => device.groupKey === state.equipmentFilter);
  const queryText = normalizedSearchText(state.equipmentQuery);
  if (!queryText) return categoryDevices;
  return categoryDevices.filter((device) => {
    const searchable = [
      deviceText(device, "name"),
      deviceText(device, "subtitle"),
      device.id,
      device.category,
      device.binding.globalId,
      device.binding.localId,
    ].map(normalizedSearchText).join(" ");
    return searchable.includes(queryText);
  });
}

function renderDeviceList() {
  elements.deviceList.innerHTML = "";
  const matchedDevices = visibleDevices();
  elements.equipmentSearchCount.textContent = `${matchedDevices.length}/${DEVICES.length}`;
  if (!matchedDevices.length) {
    const empty = document.createElement("p");
    empty.className = "dt-device-empty";
    empty.textContent = t("noSearchResults");
    elements.deviceList.appendChild(empty);
    return;
  }
  for (const device of matchedDevices) {
    const snapshot = state.snapshots.get(device.id);
    const bound = device.binding.kind === "marker" || state.boundObjects.has(device.id);
    const status = bound ? snapshot.status : "unavailable";
    const button = document.createElement("button");
    button.type = "button";
    const presentedStatus = presentationStatus(status);
    button.className = `dt-device-item ${presentedStatus.className}${state.selectedDeviceId === device.id ? " selected" : ""}`;
    button.innerHTML = `
      <span class="dt-device-copy">
        <strong>${deviceText(device, "name")}</strong>
        <small>${deviceText(device, "subtitle")} · ${t(presentedStatus.key)}</small>
      </span>
      <span class="dt-device-state" aria-label="${t(presentedStatus.key)}"><span class="dt-device-status"></span></span>
    `;
    button.addEventListener("click", () => {
      selectDevice(device.id, true);
      setDevicePanelOpen(true);
    });
    elements.deviceList.appendChild(button);
  }
}

function renderSiteOverview() {
  const snapshots = [...state.snapshots.values()];
  const metricValues = (keys) => snapshots.flatMap((snapshot) => keys
    .filter((key) => Number.isFinite(snapshot.values[key]))
    .map((key) => snapshot.values[key]));
  const average = (values) => values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
  const temperature = average(metricValues(["temperature", "supplyTemperature"]));
  const humidity = average(metricValues(["humidity"]));
  const co2 = average(metricValues(["co2"]));
  elements.siteTemperature.textContent = temperature === null ? "—" : `${formatNumber(temperature)} °C`;
  elements.siteHumidity.textContent = humidity === null ? "—" : `${formatNumber(humidity)} %`;
  elements.siteCo2.textContent = co2 === null ? "—" : `${formatNumber(co2)} ppm`;
  elements.siteOccupants.textContent = "—";
}

function renderEquipmentFilters() {
  const filters = [
    { key: "allEquipment", count: DEVICES.length },
    ...["sensors", "fans", "coils", "dampers", "airTerminals", "ducts", "pipes", "mepComponents"].map((key) => ({
      key,
      count: DEVICES.filter((device) => device.groupKey === key).length,
    })),
  ];
  elements.equipmentFilters.innerHTML = "";
  for (const filter of filters) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = state.equipmentFilter === filter.key ? "active" : "";
    button.textContent = `${t(filter.key)} ${filter.count}`;
    button.addEventListener("click", () => {
      state.equipmentFilter = filter.key;
      renderEquipmentFilters();
      renderDeviceList();
    });
    elements.equipmentFilters.appendChild(button);
  }
}

function sparklinePath(values) {
  const width = 360;
  const height = 140;
  const left = 40;
  const right = 8;
  const top = 10;
  const bottom = 28;
  const plotBottom = height - bottom;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.1);
  const points = values.map((value, index) => {
    const x = left + (index / Math.max(values.length - 1, 1)) * (width - left - right);
    const y = top + (1 - (value - min) / range) * (plotBottom - top);
    return [x, y];
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points.at(-1)[0].toFixed(1)},${plotBottom} L${points[0][0].toFixed(1)},${plotBottom} Z`;
  const ticks = [max, min + range / 2, min].map((value, index) => ({
    value,
    y: top + (index / 2) * (plotBottom - top),
  }));
  return { line, area, ticks, range, left, right: width - right, top, plotBottom };
}

function renderMetricTrend(snapshot, chart, metric) {
  chart.card.hidden = !metric;
  if (!metric) return;
  const paths = sparklinePath(snapshot.trends[metric.key]);
  chart.label.textContent = t(metric.labelKey);
  chart.value.textContent = `${formatNumber(snapshot.values[metric.key])} ${metric.unit}`;
  chart.line.setAttribute("d", paths.line);
  chart.area.setAttribute("d", paths.area);
  chart.grid.innerHTML = paths.ticks.map((tick) => `
    <line x1="${paths.left}" y1="${tick.y}" x2="${paths.right}" y2="${tick.y}"></line>
  `).join("") + `<line x1="${paths.left}" y1="${paths.top}" x2="${paths.left}" y2="${paths.plotBottom}"></line>`;
  const rangeLabel = state.historyRange === "custom" ? t("earlier") : `-${state.historyRange}`;
  chart.axis.innerHTML = paths.ticks.map((tick) => `
    <text x="34" y="${tick.y + 3}" text-anchor="end">${tick.value.toFixed(paths.range < 1 ? 2 : 1)}</text>
  `).join("") + `
    <text x="${paths.left}" y="132" text-anchor="start">${rangeLabel}</text>
    <text x="${paths.right}" y="132" text-anchor="end">${t("now")}</text>
  `;
}

function renderSelectedDevice() {
  const device = DEVICES.find((item) => item.id === state.selectedDeviceId);
  if (!device) {
    const item = state.selectedItem;
    elements.bindingLabel.textContent = t("staticBimItem");
    elements.deviceName.textContent = item?.name || t("noProperties");
    elements.deviceId.textContent = item?.guid || (item ? `${t("expressId")} ${item.localId}` : "—");
    elements.statusBadge.textContent = "IFC";
    elements.statusBadge.className = "dt-status-badge normal";
    elements.metricGrid.hidden = true;
    elements.metricTrendCards.forEach((chart) => { chart.card.hidden = true; });
    elements.updateRow.hidden = true;
    elements.faultToggle.hidden = true;
    return;
  }
  const snapshot = state.snapshots.get(device.id);
  const bound = device.binding.kind === "marker" || state.boundObjects.has(device.id);
  const displayStatus = bound ? snapshot.status : "unavailable";
  const presentedStatus = presentationStatus(displayStatus);

  elements.bindingLabel.textContent = device.binding.kind === "object" ? t("objectBinding") : t("markerBinding");
  elements.deviceName.textContent = deviceText(device, "name");
  elements.deviceId.textContent = device.id;
  elements.statusBadge.textContent = t(presentedStatus.key);
  elements.statusBadge.className = `dt-status-badge ${presentedStatus.className}`;
  elements.metricGrid.hidden = false;
  elements.metricTrendCards.forEach((chart) => { chart.card.hidden = false; });
  elements.updateRow.hidden = false;
  elements.faultToggle.hidden = false;

  elements.metricGrid.innerHTML = device.metrics.map((metric) => `
    <div class="dt-metric">
      <span>${t(metric.labelKey)}</span>
      <strong>${formatNumber(snapshot.values[metric.key])}<small>${metric.unit}</small></strong>
    </div>
  `).join("");

  elements.metricTrendCards.forEach((chart, index) => renderMetricTrend(snapshot, chart, device.metrics[index]));
  elements.updatedAt.textContent = snapshot.updatedAt.toLocaleTimeString(activeLocale(), { hour12: false });
  elements.faultButtonText.textContent = snapshot.status === "fault" ? t("restoreNormal") : t("simulateFault");
  elements.faultToggle.classList.toggle("is-recovery", snapshot.status === "fault");
  elements.faultToggle.disabled = !bound;
}

function renderUI() {
  renderEquipmentFilters();
  renderDeviceList();
  renderSelectedDevice();
  renderSiteOverview();
  updateAllVisualStates().catch((error) => console.error("Failed to style BIM components", error));
}

function applyLanguage(lang) {
  activeLang = normalizeLanguage(lang);
  localStorage.setItem("lang", activeLang);
  document.documentElement.lang = activeLang === "en" ? "en" : activeLang === "zh-Hant" ? "zh-Hant" : "zh-CN";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });
  elements.viewerCard.setAttribute("aria-label", t("viewerAria"));
  elements.overviewLink.href = `overview.html?lang=${activeLang}`;
  if (!elements.error.classList.contains("hidden")) {
    elements.errorMessage.textContent = t("loadError", { model: MODEL.name });
  }
  renderUI();
}

function setDevicePanelOpen(open) {
  elements.wrap.closest(".dt-workspace").classList.toggle("panel-open", open);
  elements.devicePanel.classList.toggle("is-open", open);
  elements.devicePanel.setAttribute("aria-hidden", String(!open));
  elements.devicePanel.inert = !open;
  elements.devicePanelButton.setAttribute("aria-expanded", String(open));
  elements.devicePanelButton.classList.toggle("active", open);
  if (open) elements.devicePanelClose.focus({ preventScroll: true });
  else elements.devicePanelButton.focus({ preventScroll: true });
}

async function selectDevice(deviceId, focus = false) {
  const device = DEVICES.find((item) => item.id === deviceId);
  if (!device) return;
  await clearStandaloneIfcSelection();
  state.selectedDeviceId = deviceId;
  state.selectedItem = device.ifc;
  renderUI();
  await updateAllVisualStates();
  if (focus) {
    focusDevice(device).catch((error) => console.error("Failed to focus BIM component", error));
  }
  if (device.binding.kind !== "object") return;
  try {
    const fragmentsModel = state.fragmentsModels.get(device.binding.modelId) || state.fragmentsModel;
    const details = await loadIfcItemDetails(device.binding.localId, device.category, fragmentsModel);
    if (state.selectedDeviceId === deviceId && details) {
      state.selectedItem = details;
      renderSelectedDevice();
    }
  } catch (error) {
    console.error("Failed to load IFC properties", error);
  }
}

async function clearStandaloneIfcSelection() {
  if (!state.selectedIfcItem) return;
  const { localId, modelId } = state.selectedIfcItem;
  const fragmentsModel = state.fragmentsModels.get(modelId);
  state.selectedIfcItem = null;
  if (fragmentsModel) await fragmentsModel.resetHighlight([localId]);
}

async function selectIfcItem(localId, modelId) {
  await clearStandaloneIfcSelection();
  state.selectedDeviceId = null;
  state.selectedIfcItem = { localId, modelId };
  state.selectedItem = {
    localId,
    category: "IFC",
    guid: null,
    name: `IFC #${localId}`,
    data: {},
  };
  setDevicePanelOpen(true);
  renderUI();
  const fragmentsModel = state.fragmentsModels.get(modelId) || state.fragmentsModel;
  await updateAllVisualStates();
  await fragmentsModel.highlight([localId], {
    color: new THREE.Color(0x2f7df4),
    opacity: 1,
    transparent: false,
    renderedFaces: renderedFaces.TWO,
  });
  try {
    const details = await loadIfcItemDetails(localId, null, fragmentsModel);
    if (!state.selectedDeviceId && state.selectedItem?.localId === localId && details) {
      state.selectedItem = details;
      renderSelectedDevice();
    }
  } catch (error) {
    console.error("Failed to inspect IFC component", error);
  }
}

async function isNonSelectableIfcItem(fragmentsModel, localId) {
  const item = fragmentsModel.getItem(localId);
  const [categoryResult, attributesResult] = await Promise.allSettled([
    item.getCategory(),
    item.getAttributes(),
  ]);
  const category = categoryResult.status === "fulfilled" ? String(categoryResult.value || "") : "";
  const attributes = attributesResult.status === "fulfilled" ? attributesResult.value?.object || {} : {};
  const name = [attributes.Name, attributes.ObjectType, attributes.PredefinedType]
    .map((value) => readableIfcValue(value) || "")
    .join(" ");
  return /^IFCWALL(?:STANDARDCASE)?$/i.test(category)
    || /(?:^|\b)basic\s+wall\b|\bwall[-_: ]/i.test(name);
}

function setFault(deviceId, shouldFault) {
  const snapshot = state.snapshots.get(deviceId);
  if (!snapshot) return;
  snapshot.status = shouldFault ? "fault" : "normal";
  snapshot.updatedAt = new Date();
  renderUI();
}

function updateMockData() {
  for (const device of DEVICES) {
    const snapshot = state.snapshots.get(device.id);
    for (const metric of device.metrics) {
      const drift = (Math.random() - 0.5) * metric.variance * 2;
      let nextValue = snapshot.values[metric.key] + drift;
      if (snapshot.status === "fault") {
        if (metric.key === "supplyTemperature") nextValue += 0.35;
        if (metric.key === "co2") nextValue += 15;
      }
      snapshot.values[metric.key] = nextValue;
      snapshot.trends[metric.key].push(nextValue);
      snapshot.trends[metric.key] = snapshot.trends[metric.key].slice(-24);
    }
    snapshot.updatedAt = new Date();
  }
  renderSelectedDevice();
  renderSiteOverview();
  elements.clock.textContent = new Date().toLocaleString(activeLocale(), {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

function addGrid() {
  if (gridHelper) {
    scene.remove(gridHelper);
    gridHelper.geometry.dispose();
    gridHelper.material.dispose();
    gridHelper = null;
  }
  const size = state.modelBox.getSize(new THREE.Vector3());
  const gridSize = Math.max(size.x, size.z) * 1.35;
  const divisions = 24;
  const preset = THEME_PRESETS[activeTheme];
  gridHelper = new THREE.GridHelper(gridSize, divisions, preset.gridCenter, preset.gridLine);
  gridHelper.position.set(state.modelCenter.x, state.modelBox.min.y - Math.max(state.modelRadius * 0.006, 0.01), state.modelCenter.z);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = preset.gridOpacity;
  scene.add(gridHelper);
}

async function loadFragmentsModel(model, requestId, modelIndex) {
  await ensureFragments();
  const response = await fetch(model.url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (requestId !== state.loadRequest) return;

  const fragmentsModel = await fragments.load(buffer, {
    modelId: `${model.label}-${requestId}`,
    camera,
    onProgress(event) {
      if (requestId !== state.loadRequest) return;
      const itemPercent = Math.round(event.progress * 100);
      const percent = Math.round(((modelIndex + event.progress) / MODELS.length) * 100);
      showLoading(MODEL, percent, `${model.label} · ${event.stage} · ${itemPercent}%`);
    },
  });
  if (requestId !== state.loadRequest) {
    await fragments.disposeModel(fragmentsModel.modelId);
    return;
  }

  state.fragmentsModels.set(model.id, fragmentsModel);
  modelGroup.add(fragmentsModel.object);
  fragmentsModel.useCamera(camera);
  if (model.hiddenCategories?.length) {
    const hiddenItems = await fragmentsModel.getItemsOfCategories(
      model.hiddenCategories.map((category) => new RegExp(`^${category}$`)),
    );
    const hiddenLocalIds = model.hiddenCategories.flatMap((category) => hiddenItems[category] || []);
    if (hiddenLocalIds.length) await fragmentsModel.setVisible(hiddenLocalIds, false);
  }
  return (await fragmentsModel.getGuids()).length;
}

async function finalizeFederatedModel(componentCount) {
  state.fragmentsModel = state.fragmentsModels.get("mep") || state.fragmentsModels.values().next().value;
  state.model = modelGroup;
  state.modelBox.makeEmpty();
  for (const fragmentsModel of state.fragmentsModels.values()) state.modelBox.union(fragmentsModel.box);
  state.modelBox.getCenter(state.modelCenter);
  state.modelRadius = Math.max(state.modelBox.getBoundingSphere(new THREE.Sphere()).radius, 1);
  showLoading(MODEL, 94, t("scannedEquipment"));
  const scannedDevices = (await Promise.all(
    [...state.fragmentsModels].map(([modelId, fragmentsModel]) => scanIfcEquipment(fragmentsModel, modelId)),
  )).flat();
  DEVICES = [...fallbackSensorDevices(), ...scannedDevices];
  initializeDeviceSnapshots();
  state.selectedDeviceId = DEVICES[0]?.id || null;
  state.selectedItem = DEVICES[0]?.ifc || null;
  elements.deviceCount.textContent = String(DEVICES.length);
  addGrid();
  fitCameraToModel(false);
  await fragments.update(true);
  await bindDevices();
  if (DEVICES[0]) await selectDevice(DEVICES[0].id);
  elements.meshCount.textContent = componentCount.toLocaleString(activeLocale());
  elements.loadingProgress.style.width = "100%";
  elements.loadingMeta.textContent = t("modelReady", { count: componentCount.toLocaleString(activeLocale()) });
  elements.loading.classList.add("hidden");
  renderUI();
}

async function loadModel() {
  const model = MODEL;
  const requestId = ++state.loadRequest;
  await clearCurrentModel();
  showLoading(model);
  elements.modelName.textContent = model.name;
  elements.meshCount.textContent = "0";

  try {
    let componentCount = 0;
    for (const [index, layer] of MODELS.entries()) {
      componentCount += await loadFragmentsModel(layer, requestId, index);
      if (requestId !== state.loadRequest) return;
    }
    await finalizeFederatedModel(componentCount);
  } catch (error) {
    if (requestId !== state.loadRequest) return;
    console.error("Fragments loading failed", error);
    showError(t("loadError", { model: model.name }));
    renderUI();
  }
}

async function handleCanvasSelection(event) {
  if (!state.model) return;
  let result = null;
  let hitModelId = null;
  let hitDistance = Infinity;
  for (const [modelId, fragmentsModel] of state.fragmentsModels) {
    if (!fragmentsModel.object.visible) continue;
    const candidate = await fragmentsModel.raycast({
      camera,
      mouse: new THREE.Vector2(event.clientX, event.clientY),
      dom: elements.canvas,
    });
    if (candidate && await isNonSelectableIfcItem(fragmentsModel, candidate.localId)) {
      await clearStandaloneIfcSelection();
      state.selectedDeviceId = null;
      state.selectedItem = null;
      setDevicePanelOpen(false);
      renderUI();
      return;
    }
    const candidateDistance = candidate?.point ? camera.position.distanceToSquared(candidate.point) : Infinity;
    if (candidate && (!result || candidateDistance < hitDistance)) {
      result = candidate;
      hitModelId = modelId;
      hitDistance = candidateDistance;
    }
  }
  if (!result) return;
  if (state.calibrating) {
    const point = result.point;
    const value = `[${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)}]`;
    elements.coordinateValue.textContent = value;
    elements.coordinateToast.classList.remove("hidden");
    state.calibrating = false;
    elements.calibrateButton.classList.remove("active");
    elements.wrap.classList.remove("is-calibrating");
    return;
  }
  const device = DEVICES.find((item) => item.binding.modelId === hitModelId && state.boundObjects.get(item.id) === result.localId);
  if (device) {
    selectDevice(device.id, true);
    setDevicePanelOpen(true);
  } else {
    selectIfcItem(result.localId, hitModelId);
  }
}

function resizeRenderer() {
  const width = elements.wrap.clientWidth;
  const height = elements.wrap.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  labelRenderer.setSize(width, height);
}

elements.retryButton.addEventListener("click", loadModel);
elements.layerToggles.forEach((toggle) => {
  toggle.addEventListener("change", async () => {
    const fragmentsModel = state.fragmentsModels.get(toggle.dataset.modelLayer);
    if (!fragmentsModel) return;
    fragmentsModel.object.visible = toggle.checked;
    await fragments.update(true);
  });
});
systemThemeQuery.addEventListener("change", (event) => {
  if (!getStoredTheme()) applyTheme(event.matches ? "dark" : "light");
});
window.addEventListener("storage", (event) => {
  if (event.key === THEME_STORAGE_KEY && (event.newValue === "light" || event.newValue === "dark")) {
    applyTheme(event.newValue);
  }
  if (event.key === "lang" && event.newValue) {
    applyLanguage(event.newValue);
  }
});
function setPlatformView(view) {
  const workspace = elements.wrap.closest(".dt-workspace");
  if (view === "overview") {
    const open = !workspace.classList.contains("right-panel-open");
    workspace.classList.toggle("right-panel-open", open);
    document.querySelector('[data-view="overview"]')?.classList.toggle("active", open);
  } else if (view === "sensors") {
    setDevicePanelOpen(!elements.devicePanel.classList.contains("is-open"));
  } else if (view === "bms" || view === "ai" || view === "reserved") {
    workspace.classList.add("right-panel-open");
    document.querySelector('[data-view="overview"]')?.classList.add("active");
    elements.reservedTitle.textContent = view === "ai" ? "AI" : view === "reserved" ? "Reserved" : "BMS";
    elements.reservedCopy.textContent = t(view === "ai" ? "aiReserved" : view === "reserved" ? "reservedCopy" : "bmsReserved");
  }
}

elements.viewButtons.forEach((button) => button.addEventListener("click", () => setPlatformView(button.dataset.view)));
elements.devicePanelClose.addEventListener("click", () => setDevicePanelOpen(false));
elements.overviewRailClose.addEventListener("click", () => setPlatformView("overview"));
document.querySelector("[data-action='reset']")?.addEventListener("click", () => fitCameraToModel(true));
elements.historyRangeButtons.forEach((button) => button.addEventListener("click", () => {
  state.historyRange = button.dataset.historyRange;
  elements.historyRangeButtons.forEach((item) => item.classList.toggle("active", item === button));
  elements.historyNote.textContent = button.dataset.historyRange === "custom"
    ? t("reservedCopy")
    : t("mockHistoryNote");
  renderSelectedDevice();
}));
elements.equipmentSearch.addEventListener("input", () => {
  state.equipmentQuery = elements.equipmentSearch.value;
  renderDeviceList();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.devicePanel.classList.contains("is-open")) setDevicePanelOpen(false);
});
elements.resetViewButton.addEventListener("click", () => fitCameraToModel(true));
elements.faultToggle.addEventListener("click", () => {
  const snapshot = state.snapshots.get(state.selectedDeviceId);
  if (!snapshot) return;
  setFault(state.selectedDeviceId, snapshot.status !== "fault");
});
elements.calibrateButton?.addEventListener("click", () => {
  state.calibrating = !state.calibrating;
  elements.calibrateButton.classList.toggle("active", state.calibrating);
  elements.wrap.classList.toggle("is-calibrating", state.calibrating);
  elements.coordinateToast.classList.add("hidden");
});
elements.copyCoordinateButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(elements.coordinateValue.textContent);
  elements.copyCoordinateButton.textContent = t("copied");
  window.setTimeout(() => { elements.copyCoordinateButton.textContent = t("copy"); }, 1200);
});
elements.canvas.addEventListener("pointerdown", (event) => {
  pointerDownPosition = { x: event.clientX, y: event.clientY };
});
elements.canvas.addEventListener("pointerup", (event) => {
  if (!pointerDownPosition) return;
  const distance = Math.hypot(event.clientX - pointerDownPosition.x, event.clientY - pointerDownPosition.y);
  pointerDownPosition = null;
  if (distance < 10) handleCanvasSelection(event).catch((error) => console.error("BIM selection failed", error));
});
elements.canvas.addEventListener("pointercancel", () => { pointerDownPosition = null; });
controls.addEventListener("change", () => {
  if (state.fragmentsModels.size) fragments.update();
});
window.addEventListener("beforeunload", () => {
  fragments?.dispose();
});

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(elements.wrap);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(animate);
}

applyTheme(activeTheme);
applyLanguage(activeLang);
resizeRenderer();
loadModel();
animate();
updateMockData();
window.setInterval(updateMockData, 2000);
