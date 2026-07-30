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

const MODEL = {
  name: "DigitalHub_FM-LFT_v2.frag",
  url: "./models/fragments/DigitalHub_FM-LFT_v2.frag",
  label: "DigitalHub HVAC",
  format: "fragments",
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
    allEquipment: "全部", fans: "风机", coils: "盘管", dampers: "风阀", airTerminals: "风口",
    noProperties: "没有可显示的 IFC 属性", staticBimItem: "静态 BIM 构件", scannedEquipment: "自动扫描设备",
    searchEquipmentPlaceholder: "搜索名称、类型或 ID", searchEquipmentAria: "搜索 IFC 设备", noSearchResults: "没有匹配的 IFC 设备",
    temperature: "室内温度", humidity: "相对湿度", co2: "CO₂",
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
    allEquipment: "全部", fans: "風機", coils: "盤管", dampers: "風閥", airTerminals: "風口",
    noProperties: "沒有可顯示的 IFC 屬性", staticBimItem: "靜態 BIM 構件", scannedEquipment: "自動掃描設備",
    searchEquipmentPlaceholder: "搜尋名稱、類型或 ID", searchEquipmentAria: "搜尋 IFC 設備", noSearchResults: "沒有符合的 IFC 設備",
    temperature: "室內溫度", humidity: "相對濕度", co2: "CO₂",
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
    allEquipment: "All", fans: "Fans", coils: "Coils", dampers: "Dampers", airTerminals: "Air Terminals",
    noProperties: "No IFC properties available", staticBimItem: "Static BIM Component", scannedEquipment: "Auto-scanned equipment",
    searchEquipmentPlaceholder: "Search name, type, or ID", searchEquipmentAria: "Search IFC equipment", noSearchResults: "No matching IFC equipment",
    temperature: "Indoor Temperature", humidity: "Relative Humidity", co2: "CO₂",
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
];

let DEVICES = [];

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
  ifcProperties: document.getElementById("ifc-properties"),
  ifcPropertyCount: document.getElementById("ifc-property-count"),
  ifcPropertyList: document.getElementById("ifc-property-list"),
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
};

elements.modelLabel.textContent = MODEL.label;
elements.deviceCount.textContent = String(DEVICES.length);
elements.viewerCard.setAttribute("aria-label", "IFC / Fragments 三维模型");
elements.technologyLabel.textContent = "WebGL / Three.js / IFC / Fragments";

const state = {
  model: null,
  modelBox: new THREE.Box3(),
  modelCenter: new THREE.Vector3(),
  modelRadius: 1,
  selectedDeviceId: null,
  selectedItem: null,
  equipmentFilter: "allEquipment",
  equipmentQuery: "",
  calibrating: false,
  boundObjects: new Map(),
  markerObjects: new Map(),
  snapshots: new Map(),
  loadRequest: 0,
  fragmentsModel: null,
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

function flattenIfcData(value, prefix = "", rows = [], seen = new WeakSet()) {
  if (rows.length >= 60 || value === null || value === undefined) return rows;
  const readable = readableIfcValue(value);
  if (readable !== null) {
    if (prefix) rows.push({ label: prefix, value: readable });
    return rows;
  }
  if (typeof value !== "object" || seen.has(value)) return rows;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      const name = readableIfcValue(entry?.Name);
      flattenIfcData(entry, name ? `${prefix}.${name}` : `${prefix}.${index + 1}`, rows, seen);
    });
    return rows;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key === "type" || key === "localId" || key.startsWith("_")) continue;
    flattenIfcData(entry, prefix ? `${prefix}.${key}` : key, rows, seen);
    if (rows.length >= 60) break;
  }
  return rows;
}

async function loadIfcItemDetails(localId, categoryHint = null) {
  if (!state.fragmentsModel) return null;
  const item = state.fragmentsModel.getItem(localId);
  const [attributes, category, guid, data] = await Promise.all([
    item.getAttributes(),
    categoryHint ? Promise.resolve(categoryHint) : item.getCategory(),
    item.getGuid(),
    state.fragmentsModel.getItemsData([localId], {
      attributesDefault: true,
      relations: {
        ContainedInStructure: { attributes: true, relations: false },
        HasAssignments: { attributes: true, relations: false },
        IsDefinedBy: { attributes: true, relations: true },
        DefinesOccurrence: { attributes: true, relations: true },
      },
    }),
  ]);
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

async function scanIfcEquipment(model) {
  const categories = await model.getItemsOfCategories(
    EQUIPMENT_GROUPS.map((group) => new RegExp(`^${group.category}$`)),
  );
  const records = [];
  for (const group of EQUIPMENT_GROUPS) {
    for (const localId of categories[group.category] || []) {
      records.push({ localId, group });
    }
  }

  const devices = await Promise.all(records.map(async ({ localId, group }) => {
    const item = model.getItem(localId);
    const [attributes, guid] = await Promise.all([item.getAttributes(), item.getGuid()]);
    const attributeObject = attributes?.object || {};
    const name = readableIfcValue(attributeObject.Name)
      || readableIfcValue(attributeObject.ObjectType)
      || `${localizedGroupLabel(group)} #${localId}`;
    return {
      id: guid || `${group.category}-${localId}`,
      name: { zh: name, "zh-Hant": name, en: name },
      subtitle: {
        zh: `${group.label.zh} · IFC 自动扫描 · 模拟遥测`,
        "zh-Hant": `${group.label["zh-Hant"]} · IFC 自動掃描 · 模擬遙測`,
        en: `${group.label.en} · IFC auto-scan · Simulated telemetry`,
      },
      category: group.category,
      groupKey: group.key,
      binding: { kind: "object", globalId: guid, localId },
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
  if (state.model) {
    modelGroup.remove(state.model);
    if (state.fragmentsModel) {
      await fragments.disposeModel(state.fragmentsModel.modelId);
    }
    state.model = null;
  }
  state.fragmentsModel = null;
  state.selectedItem = null;
  state.selectedDeviceId = null;
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
  if (!device.binding.globalId || !state.fragmentsModel) return null;
  const [localId] = await state.fragmentsModel.getLocalIdsByGuids([device.binding.globalId]);
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

  if (!state.fragmentsModel) return;
  if (selected || status !== "normal") {
    await state.fragmentsModel.highlight([target], {
      color: status === "normal" ? new THREE.Color(0x2f7df4) : statusColor,
      opacity: status === "fault" ? 0.88 : 0.72,
      transparent: true,
      renderedFaces: renderedFaces.TWO,
    });
  }
}

async function updateAllVisualStates() {
  if (state.fragmentsModel) {
    const localIds = [...state.boundObjects.values()];
    if (localIds.length) await state.fragmentsModel.resetHighlight(localIds);
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

  if (target !== undefined && state.fragmentsModel) {
    const boxes = await state.fragmentsModel.getBoxes([target]);
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
    button.className = `dt-device-item ${status}${state.selectedDeviceId === device.id ? " selected" : ""}`;
    button.innerHTML = `
      <span class="dt-device-status"></span>
      <span class="dt-device-copy">
        <strong>${deviceText(device, "name")}</strong>
        <small>${deviceText(device, "subtitle")} · ${bound ? t(snapshot.status) : t("noBinding")}</small>
      </span>
      <i class="ph ph-caret-right dt-device-chevron" aria-hidden="true"></i>
    `;
    button.addEventListener("click", () => selectDevice(device.id, true));
    elements.deviceList.appendChild(button);
  }
}

function renderEquipmentFilters() {
  const filters = [
    { key: "allEquipment", count: DEVICES.length },
    ...["fans", "coils", "dampers", "airTerminals"].map((key) => ({
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

function renderIfcProperties(item) {
  elements.ifcPropertyList.innerHTML = "";
  if (!item) {
    elements.ifcPropertyCount.textContent = "0";
    return;
  }
  const rows = [
    { label: t("ifcCategory"), value: item.category },
    { label: t("globalId"), value: item.guid || "—" },
    { label: t("expressId"), value: String(item.localId) },
  ];
  const seen = new Set(rows.map((row) => `${row.label}:${row.value}`));
  for (const row of flattenIfcData(item.data)) {
    const label = row.label.split(".").slice(-2).join(" · ");
    const signature = `${label}:${row.value}`;
    if (!row.value || seen.has(signature) || rows.length >= 36) continue;
    seen.add(signature);
    rows.push({ label, value: row.value });
  }
  elements.ifcPropertyCount.textContent = String(rows.length);
  for (const row of rows) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = row.label;
    description.textContent = row.value;
    wrapper.append(term, description);
    elements.ifcPropertyList.appendChild(wrapper);
  }
}

function sparklinePath(values) {
  const width = 320;
  const height = 92;
  const padding = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.1);
  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / range) * (height - padding * 2);
    return [x, y];
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points.at(-1)[0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;
  return { line, area };
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
    elements.trendCard.hidden = true;
    elements.updateRow.hidden = true;
    elements.faultToggle.hidden = true;
    renderIfcProperties(item);
    return;
  }
  const snapshot = state.snapshots.get(device.id);
  const bound = device.binding.kind === "marker" || state.boundObjects.has(device.id);
  const displayStatus = bound ? snapshot.status : "unavailable";

  elements.bindingLabel.textContent = device.binding.kind === "object" ? t("objectBinding") : t("markerBinding");
  elements.deviceName.textContent = deviceText(device, "name");
  elements.deviceId.textContent = device.id;
  elements.statusBadge.textContent = t(displayStatus);
  elements.statusBadge.className = `dt-status-badge ${displayStatus}`;
  elements.metricGrid.hidden = false;
  elements.trendCard.hidden = false;
  elements.updateRow.hidden = false;
  elements.faultToggle.hidden = false;
  renderIfcProperties(state.selectedItem || device.ifc);

  elements.metricGrid.innerHTML = device.metrics.map((metric) => `
    <div class="dt-metric">
      <span>${t(metric.labelKey)}</span>
      <strong>${formatNumber(snapshot.values[metric.key])}<small>${metric.unit}</small></strong>
    </div>
  `).join("");

  const primaryMetric = device.metrics[0];
  const trend = snapshot.trends[primaryMetric.key];
  const paths = sparklinePath(trend);
  elements.trendLabel.textContent = t(primaryMetric.labelKey);
  elements.trendValue.textContent = `${formatNumber(snapshot.values[primaryMetric.key])} ${primaryMetric.unit}`;
  elements.trendLine.setAttribute("d", paths.line);
  elements.trendArea.setAttribute("d", paths.area);
  elements.updatedAt.textContent = snapshot.updatedAt.toLocaleTimeString(activeLocale(), { hour12: false });
  elements.faultButtonText.textContent = snapshot.status === "fault" ? t("restoreNormal") : t("simulateFault");
  elements.faultToggle.classList.toggle("is-recovery", snapshot.status === "fault");
  elements.faultToggle.disabled = !bound;
}

function renderUI() {
  renderEquipmentFilters();
  renderDeviceList();
  renderSelectedDevice();
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
  if (open) elements.devicePanelClose.focus({ preventScroll: true });
  else elements.devicePanelButton.focus({ preventScroll: true });
}

async function selectDevice(deviceId, focus = false) {
  const device = DEVICES.find((item) => item.id === deviceId);
  if (!device) return;
  state.selectedDeviceId = deviceId;
  state.selectedItem = device.ifc;
  renderUI();
  if (focus) {
    focusDevice(device).catch((error) => console.error("Failed to focus BIM component", error));
  }
  try {
    const details = await loadIfcItemDetails(device.binding.localId, device.category);
    if (state.selectedDeviceId === deviceId && details) {
      state.selectedItem = details;
      renderSelectedDevice();
    }
  } catch (error) {
    console.error("Failed to load IFC properties", error);
  }
}

async function selectIfcItem(localId) {
  state.selectedDeviceId = null;
  state.selectedItem = {
    localId,
    category: "IFC",
    guid: null,
    name: `IFC #${localId}`,
    data: {},
  };
  setDevicePanelOpen(true);
  renderUI();
  try {
    const details = await loadIfcItemDetails(localId);
    if (!state.selectedDeviceId && state.selectedItem?.localId === localId && details) {
      state.selectedItem = details;
      renderSelectedDevice();
      await state.fragmentsModel.resetHighlight();
      await state.fragmentsModel.highlight([localId], {
        color: new THREE.Color(0x2f7df4),
        opacity: 0.72,
        transparent: true,
        renderedFaces: renderedFaces.TWO,
      });
    }
  } catch (error) {
    console.error("Failed to inspect IFC component", error);
  }
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
  elements.clock.textContent = new Date().toLocaleTimeString(activeLocale(), { hour12: false });
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

async function loadFragmentsModel(model, requestId) {
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
      const percent = Math.round(event.progress * 100);
      showLoading(model, percent, `${event.stage} · ${percent}%`);
    },
  });
  if (requestId !== state.loadRequest) {
    await fragments.disposeModel(fragmentsModel.modelId);
    return;
  }

  state.fragmentsModel = fragmentsModel;
  state.model = fragmentsModel.object;
  modelGroup.add(state.model);
  fragmentsModel.useCamera(camera);
  state.modelBox.copy(fragmentsModel.box);
  state.modelBox.getCenter(state.modelCenter);
  state.modelRadius = Math.max(state.modelBox.getBoundingSphere(new THREE.Sphere()).radius, 1);
  const componentCount = (await fragmentsModel.getGuids()).length;
  showLoading(model, 94, t("scannedEquipment"));
  DEVICES = await scanIfcEquipment(fragmentsModel);
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
    await loadFragmentsModel(model, requestId);
  } catch (error) {
    if (requestId !== state.loadRequest) return;
    console.error("Fragments loading failed", error);
    showError(t("loadError", { model: model.name }));
    renderUI();
  }
}

async function handleCanvasSelection(event) {
  if (!state.model) return;
  if (!state.fragmentsModel) return;
  const result = await state.fragmentsModel.raycast({
    camera,
    mouse: new THREE.Vector2(event.clientX, event.clientY),
    dom: elements.canvas,
  });
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
  const device = DEVICES.find((item) => state.boundObjects.get(item.id) === result.localId);
  if (device) {
    selectDevice(device.id, true);
    setDevicePanelOpen(true);
  } else {
    selectIfcItem(result.localId);
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
elements.devicePanelButton.addEventListener("click", () => setDevicePanelOpen(true));
elements.devicePanelClose.addEventListener("click", () => setDevicePanelOpen(false));
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
elements.calibrateButton.addEventListener("click", () => {
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
  if (distance < 5) handleCanvasSelection(event).catch((error) => console.error("BIM selection failed", error));
});
controls.addEventListener("change", () => {
  if (state.fragmentsModel) fragments.update();
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
