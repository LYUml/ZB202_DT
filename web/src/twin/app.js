import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import "@phosphor-icons/web/regular";

const THEME_STORAGE_KEY = "zb202-theme";
const DEBUG_MOCK_STORAGE_KEY = "zb202-debug-mock-data";
const DEBUG_OCCUPIED_SEATS = new Set([0, 1, 3, 6, 8, 10, 11]);
const query = new URLSearchParams(window.location.search);
const requestedSensorId = String(query.get("sensor") || "").replaceAll("_", "-").toUpperCase();
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
  { id: "sensor", name: "Sensor.frag", url: "./models/fragments/Sensor.frag", label: "Lab Sensors" },
];

const MODEL = {
  name: MODELS.map((model) => model.name).join(" + "),
  label: "Lab Archi + MEP + Sensors",
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
    lastUpdated: "最后更新", normal: "正常", warning: "注意", fault: "故障", unavailable: "未绑定", dataUnavailable: "数据源未连接",
    noBinding: "当前模型无绑定", objectBinding: "BIM 构件绑定", markerBinding: "空间坐标绑定",
    restoreNormal: "恢复设备正常", simulateFault: "模拟设备故障", readingModel: "读取模型文件…",
    loadingModel: "正在加载 {model}", modelReady: "{count} 个构件 · 模型准备完成",
    loadError: "无法读取 {model}。请通过 npm run dev 启动项目，并确认 Fragments 模型文件存在。",
    supplyTemperature: "送风温度", fanPower: "风机功率", airflow: "送风量", damperPosition: "风阀开度",
    ifcProperties: "IFC 属性", ifcCategory: "IFC 类型", globalId: "GlobalId", expressId: "Express ID",
    allEquipment: "全部", sensors: "传感器", fans: "风机", coils: "盘管", dampers: "风阀", airTerminals: "风口", ducts: "风管", pipes: "管道", mepComponents: "机电构件",
    noProperties: "没有可显示的 IFC 属性", staticBimItem: "静态 BIM 构件", scannedEquipment: "自动扫描设备",
    searchEquipmentPlaceholder: "搜索", searchEquipmentAria: "搜索 IFC 设备", noSearchResults: "没有匹配的 IFC 设备",
    temperature: "室内温度", humidity: "相对湿度", co2: "CO₂",
    dataPanelAria: "传感器数据面板", closeDataPanel: "关闭数据面板", sensorData: "传感器数据",
    componentDetails: "构件详情", componentInfo: "BIM 构件", ifcType: "IFC 类型", identifiers: "标识符",
    earlier: "较早", now: "现在",
    readingsInRange: "所选 {range} 时间范围内有 {count} 条真实记录",
    lastUpload: "最后记录", custom: "自定义", mockHistoryNote: "当前显示可用的数据窗口",
    bmsReserved: "AHU 运行数据将在后续版本接入。", aiReserved: "AI 分析模块将在后续版本接入。",
    reservedCopy: "此模块为后续功能预留。", online: "在线", offline: "离线", maintenance: "维护中",
    siteOverview: "场地概览", iotSensorsList: "IoT 传感器列表", closeOverviewPanel: "关闭概览面板",
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
    lastUpdated: "最後更新", normal: "正常", warning: "注意", fault: "故障", unavailable: "未綁定", dataUnavailable: "資料來源未連線",
    noBinding: "目前模型未綁定", objectBinding: "BIM 構件綁定", markerBinding: "空間座標綁定",
    restoreNormal: "恢復設備正常", simulateFault: "模擬設備故障", readingModel: "讀取模型檔案…",
    loadingModel: "正在載入 {model}", modelReady: "{count} 個構件 · 模型準備完成",
    loadError: "無法讀取 {model}。請透過 npm run dev 啟動專案，並確認 Fragments 模型檔案存在。",
    supplyTemperature: "送風溫度", fanPower: "風機功率", airflow: "送風量", damperPosition: "風閥開度",
    ifcProperties: "IFC 屬性", ifcCategory: "IFC 類型", globalId: "GlobalId", expressId: "Express ID",
    allEquipment: "全部", sensors: "感測器", fans: "風機", coils: "盤管", dampers: "風閥", airTerminals: "風口", ducts: "風管", pipes: "管道", mepComponents: "機電構件",
    noProperties: "沒有可顯示的 IFC 屬性", staticBimItem: "靜態 BIM 構件", scannedEquipment: "自動掃描設備",
    searchEquipmentPlaceholder: "搜尋", searchEquipmentAria: "搜尋 IFC 設備", noSearchResults: "沒有符合的 IFC 設備",
    temperature: "室內溫度", humidity: "相對濕度", co2: "CO₂",
    dataPanelAria: "感測器資料面板", closeDataPanel: "關閉資料面板", sensorData: "感測器資料",
    componentDetails: "構件詳情", componentInfo: "BIM 構件", ifcType: "IFC 類型", identifiers: "識別碼",
    earlier: "較早", now: "現在",
    readingsInRange: "所選 {range} 時間範圍內有 {count} 筆真實記錄",
    lastUpload: "最後記錄", custom: "自訂", mockHistoryNote: "目前顯示可用的資料視窗",
    bmsReserved: "AHU 運行資料將於後續版本接入。", aiReserved: "AI 分析模組將於後續版本接入。",
    reservedCopy: "此模組為後續功能預留。", online: "在線", offline: "離線", maintenance: "維護中",
    siteOverview: "場地概覽", iotSensorsList: "IoT 感測器列表", closeOverviewPanel: "關閉概覽面板",
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
    lastUpdated: "Last updated", normal: "Normal", warning: "Warning", fault: "Fault", unavailable: "Unbound", dataUnavailable: "Data source unavailable",
    noBinding: "Not bound in this model", objectBinding: "BIM Component Binding", markerBinding: "Spatial Coordinate Binding",
    restoreNormal: "Restore Normal Status", simulateFault: "Simulate Device Fault", readingModel: "Reading model file…",
    loadingModel: "Loading {model}", modelReady: "{count} components · Model ready",
    loadError: "Unable to load {model}. Start the project with npm run dev and confirm the Fragments model file exists.",
    supplyTemperature: "Supply Air Temperature", fanPower: "Fan Power", airflow: "Airflow", damperPosition: "Damper Position",
    ifcProperties: "IFC Properties", ifcCategory: "IFC Type", globalId: "GlobalId", expressId: "Express ID",
    allEquipment: "All", sensors: "Sensors", fans: "Fans", coils: "Coils", dampers: "Dampers", airTerminals: "Air Terminals", ducts: "Ducts", pipes: "Pipes", mepComponents: "MEP",
    noProperties: "No IFC properties available", staticBimItem: "Static BIM Component", scannedEquipment: "Auto-scanned equipment",
    searchEquipmentPlaceholder: "Search", searchEquipmentAria: "Search IFC equipment", noSearchResults: "No matching IFC equipment",
    temperature: "Indoor Temperature", humidity: "Relative Humidity", co2: "CO₂",
    dataPanelAria: "Sensor data panel", closeDataPanel: "Close data panel", sensorData: "Sensor Data",
    componentDetails: "Component Details", componentInfo: "BIM Component", ifcType: "IFC Type", identifiers: "Identifiers",
    readingsInRange: "{count} real readings in the selected {range} window",
    earlier: "Earlier", now: "Now",
    lastUpload: "Last reading", custom: "Custom", mockHistoryNote: "Showing the available data window",
    bmsReserved: "AHU operating data will be connected in a future release.", aiReserved: "AI analytics will be connected in a future release.",
    reservedCopy: "This space is reserved for a future module.", online: "Online", offline: "Offline", maintenance: "Maintenance",
    siteOverview: "Site Overview", iotSensorsList: "IoT Sensors List", closeOverviewPanel: "Close overview panel",
    siteTemperature: "Temperature", siteHumidity: "Humidity", siteCo2: "CO₂", occupants: "Occupants",
  },
};

let activeLang = normalizeLanguage(query.get("lang") || "en");

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
  offline: { color: 0xe34d59 },
  unavailable: { color: 0x8b94a6 },
};

const INFLUX_STALE_AFTER_MS = 15 * 60 * 1000;
const MAX_SEEN_TELEMETRY = 5000;
const SOCKET_CONTROL_TIMEOUT_MS = 60000;

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
let MEP_COMPONENTS = [];

const INFLUX_METRICS = {
  temperature: { label: { zh: "室内温度", "zh-Hant": "室內溫度", en: "Indoor Temperature" }, unit: "°C", icon: "ph-thermometer-simple" },
  humidity: { label: { zh: "相对湿度", "zh-Hant": "相對濕度", en: "Relative Humidity" }, unit: "%", icon: "ph-drop" },
  co2: { label: { zh: "CO₂", "zh-Hant": "CO₂", en: "CO₂" }, unit: "ppm", icon: "ph-cloud" },
  battery: { label: { zh: "电池电量", "zh-Hant": "電池電量", en: "Battery" }, unit: "%", icon: "ph-battery-high" },
  light: { label: { zh: "光照度", "zh-Hant": "光照度", en: "Light Level" }, unit: "lx", icon: "ph-sun" },
  pir: { label: { zh: "PIR 状态", "zh-Hant": "PIR 狀態", en: "PIR Status" }, unit: "", icon: "ph-person-simple" },
  pm25: { label: { zh: "PM2.5", "zh-Hant": "PM2.5", en: "PM2.5" }, unit: "µg/m³", icon: "ph-wind" },
  pm10: { label: { zh: "PM10", "zh-Hant": "PM10", en: "PM10" }, unit: "µg/m³", icon: "ph-wind" },
  pressure: { label: { zh: "大气压力", "zh-Hant": "大氣壓力", en: "Pressure" }, unit: "hPa", icon: "ph-gauge" },
  tvoc: { label: { zh: "TVOC 指数", "zh-Hant": "TVOC 指數", en: "TVOC Index" }, unit: "index", icon: "ph-chart-line" },
  occupancy: { label: { zh: "人体存在", "zh-Hant": "人體存在", en: "Occupancy" }, unit: "", icon: "ph-person-simple" },
  magnetStatus: { label: { zh: "门磁状态", "zh-Hant": "門磁狀態", en: "Magnet Status" }, unit: "", icon: "ph-door" },
  tamperStatus: { label: { zh: "防拆状态", "zh-Hant": "防拆狀態", en: "Tamper Status" }, unit: "", icon: "ph-shield-warning" },
  noiseLaeq: { label: { zh: "等效噪声", "zh-Hant": "等效噪聲", en: "Noise LAeq" }, unit: "dB(A)", icon: "ph-speaker-high" },
  noiseLai: { label: { zh: "瞬时噪声", "zh-Hant": "瞬時噪聲", en: "Noise LAI" }, unit: "dB(A)", icon: "ph-speaker-high" },
  noiseLaiMax: { label: { zh: "最大噪声", "zh-Hant": "最大噪聲", en: "Noise LAImax" }, unit: "dB(A)", icon: "ph-speaker-high" },
  leakageStatus: { label: { zh: "漏水状态", "zh-Hant": "漏水狀態", en: "Leak Status" }, unit: "", icon: "ph-drop" },
  activePower: { label: { zh: "有功功率", "zh-Hant": "有功功率", en: "Active Power" }, unit: "W", icon: "ph-lightning" },
  current: { label: { zh: "电流", "zh-Hant": "電流", en: "Current" }, unit: "mA", icon: "ph-lightning" },
  powerConsumption: { label: { zh: "累计用电", "zh-Hant": "累計用電", en: "Energy" }, unit: "Wh", icon: "ph-plug" },
  powerFactor: { label: { zh: "功率因数", "zh-Hant": "功率因數", en: "Power Factor" }, unit: "%", icon: "ph-gauge" },
  socketStatus: { label: { zh: "插座状态", "zh-Hant": "插座狀態", en: "Socket Status" }, unit: "", icon: "ph-plug" },
  voltage: { label: { zh: "电压", "zh-Hant": "電壓", en: "Voltage" }, unit: "V", icon: "ph-lightning" },
};

function metricText(metric) {
  return metric.label?.[activeLang] || metric.label?.zh || metric.label?.en || t(metric.labelKey || metric.key);
}

function influxDeviceType(model) {
  const types = {
    VS341: { zh: "人体存在传感器", "zh-Hant": "人體存在感測器", en: "Occupancy Sensor" },
    WS301: { zh: "门磁传感器", "zh-Hant": "門磁感測器", en: "Magnetic Contact Sensor" },
    WS302: { zh: "噪声传感器", "zh-Hant": "噪聲感測器", en: "Noise Sensor" },
    WS303: { zh: "漏水传感器", "zh-Hant": "漏水感測器", en: "Leak Detection Sensor" },
    WS523: { zh: "智能插座", "zh-Hant": "智能插座", en: "Smart Portable Socket" },
  };
  return types[model] || { zh: "IoT 传感器", "zh-Hant": "IoT 感測器", en: "IoT Sensor" };
}

function telemetryMetric(key, message) {
  const known = INFLUX_METRICS[key];
  return {
    key,
    label: known?.label || { zh: key, "zh-Hant": key, en: key },
    unit: message.metrics?.[key]?.unit ?? known?.unit ?? "",
    icon: known?.icon || "ph-chart-line",
  };
}

function ensureTelemetryDevice(message) {
  const normalizedEui = String(message.devEui || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  const normalizedDeviceId = String(message.deviceId || "").replaceAll("_", "-").toUpperCase();
  let device = DEVICES.find((item) => (normalizedEui && item.devEui === normalizedEui) || item.id.toUpperCase() === normalizedDeviceId);
  if (!device) {
    const id = normalizedDeviceId || normalizedEui;
    if (!id) return null;
    const model = id.split("-")[0];
    const type = influxDeviceType(model);
    device = {
      id,
      name: { zh: `${id} ${type.zh}`, "zh-Hant": `${id} ${type["zh-Hant"]}`, en: `${id} ${type.en}` },
      subtitle: { zh: `${model} · InfluxDB 自动发现`, "zh-Hant": `${model} · InfluxDB 自動發現`, en: `${model} · Discovered from InfluxDB` },
      category: "IOT_SENSOR",
      groupKey: "sensors",
      sensorModel: model,
      devEui: normalizedEui,
      binding: { kind: "data", globalId: null, localId: null },
      metrics: [],
      ifc: { localId: null, category: "IoT Sensor", guid: null, name: id, data: { Source: "InfluxDB", Binding: "No BIM location assigned" } },
    };
    DEVICES.push(device);
    state.snapshots.set(device.id, { deviceId: device.id, status: "unavailable", updatedAt: new Date(), values: {}, trends: {} });
    elements.deviceCount.textContent = String(DEVICES.length);
  }
  const snapshot = state.snapshots.get(device.id);
  for (const key of Object.keys(message.values || {})) {
    if (!device.metrics.some((metric) => metric.key === key)) device.metrics.push(telemetryMetric(key, message));
    if (!(key in snapshot.values)) snapshot.values[key] = null;
    if (!snapshot.trends[key]) snapshot.trends[key] = [];
  }
  return device;
}

function fallbackSensorDevices() {
  const positions = [
    { model: "AM103", number: "07", devEui: "24E124725E281056", sensorGuid: "22cHeEQV9Ccwk$gYcfob0G", normalizedPosition: [0.29, 0.66, 0.31] },
    { model: "AM103", number: "08", devEui: "24E124725E283167", sensorGuid: "22cHeEQV9Ccwk$gYcfob4i", normalizedPosition: [0.51, 0.83, 0.39] },
    { model: "AM308", number: "01", devEui: "24E124707E093681", sensorGuid: "22cHeEQV9Ccwk$gYcfob4M", normalizedPosition: [0.56, 0.50, 0.54] },
    { model: "AM103", number: "05", devEui: "24E124725E281413", sensorGuid: "22cHeEQV9Ccwk$gYcfob7f", normalizedPosition: [0.43, 0.54, 0.62] },
    { model: "AM103", number: "06", devEui: "24E124725E283152", sensorGuid: "22cHeEQV9Ccwk$gYcfob44", normalizedPosition: [0.68, 0.48, 0.57] },
  ];
  return positions.map(({ model, number, devEui, sensorGuid, normalizedPosition }, index) => {
    return {
      id: `${model}-${number}`,
      name: {
        zh: `${model}-${number} 室内环境传感器`,
        "zh-Hant": `${model}-${number} 室內環境感測器`,
        en: `${model}-${number} Indoor Environment Sensor`,
      },
      subtitle: {
        zh: `${model} · ${model === "AM308" ? "八合一" : "三合一"} · 室内环境`,
        "zh-Hant": `${model} · ${model === "AM308" ? "八合一" : "三合一"} · 室內環境`,
        en: `${model} · ${model === "AM308" ? "8-in-1" : "3-in-1"} · Indoor environment`,
      },
      category: "IOT_SENSOR",
      groupKey: "sensors",
      sensorModel: model,
      devEui,
      binding: { kind: "marker", sensorGuid, normalizedPosition },
      metrics: [
        { key: "temperature", labelKey: "temperature", unit: "°C", value: 22.8 + index * 0.4, variance: 0.18 },
        { key: "humidity", labelKey: "humidity", unit: "%", value: 52 + index * 2, variance: 0.6 },
        { key: "co2", labelKey: "co2", unit: "ppm", value: 610 + index * 45, variance: 8 },
      ],
      ifc: { localId: `MOCK-${number}`, category: "IoT Sensor", guid: null, name: `AM103-${number}`, data: { Source: "Mock data", Binding: "Normalized model coordinate" } },
    };
  });
}

async function bindSensorsToIfc(devices, sensorModel) {
  if (!sensorModel) return devices;
  for (const device of devices) {
    const [localId] = await sensorModel.getLocalIdsByGuids([device.binding.sensorGuid]);
    if (localId === undefined) continue;
    const details = await loadIfcItemDetails(localId, "IFCBUILDINGELEMENTPROXY", sensorModel);
    device.binding = { kind: "object", modelId: "sensor", localId, globalId: device.binding.sensorGuid };
    if (details) device.ifc = details;
  }
  return devices;
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
  assetListTitle: document.getElementById("asset-list-title"),
  assetViewButtons: [...document.querySelectorAll("[data-asset-view]")],
  deviceList: document.getElementById("device-list"),
  deviceName: document.getElementById("device-name"),
  statusBadge: document.getElementById("status-badge"),
  metricGrid: document.getElementById("metric-grid"),
  componentProperties: document.getElementById("component-properties"),
  dataPanelTitle: document.getElementById("data-panel-title"),
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
  overviewIndoorTemperature: document.getElementById("overview-indoor-temperature"),
  overviewIndoorHumidity: document.getElementById("overview-indoor-humidity"),
  overviewIndoorCo2: document.getElementById("overview-indoor-co2"),
  reservedTitle: document.getElementById("reserved-title"),
  reservedCopy: document.getElementById("reserved-copy"),
  historyNote: document.getElementById("history-note"),
  historyRangeButtons: [...document.querySelectorAll("[data-history-range]")],
  customHoursControl: document.getElementById("custom-hours-control"),
  customHoursInput: document.getElementById("custom-hours"),
  trendGrid: document.getElementById("trend-grid"),
  trendAxisLabels: document.getElementById("trend-axis-labels"),
  metricTrendCards: [
    { card: document.getElementById("trend-card"), label: document.getElementById("trend-label"), value: document.getElementById("trend-value"), line: document.getElementById("trend-line"), area: document.getElementById("trend-area"), points: document.getElementById("trend-points"), grid: document.getElementById("trend-grid"), axis: document.getElementById("trend-axis-labels") },
    { card: document.getElementById("humidity-trend-card"), label: document.getElementById("humidity-trend-label"), value: document.getElementById("humidity-trend-value"), line: document.getElementById("humidity-trend-line"), area: document.getElementById("humidity-trend-area"), points: document.getElementById("humidity-trend-points"), grid: document.getElementById("humidity-trend-grid"), axis: document.getElementById("humidity-trend-axis-labels") },
    { card: document.getElementById("co2-trend-card"), label: document.getElementById("co2-trend-label"), value: document.getElementById("co2-trend-value"), line: document.getElementById("co2-trend-line"), area: document.getElementById("co2-trend-area"), points: document.getElementById("co2-trend-points"), grid: document.getElementById("co2-trend-grid"), axis: document.getElementById("co2-trend-axis-labels") },
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
  equipmentQuery: "",
  assetView: "sensors",
  calibrating: false,
  boundObjects: new Map(),
  markerObjects: new Map(),
  snapshots: new Map(),
  loadRequest: 0,
  fragmentsModel: null,
  fragmentsModels: new Map(),
  historyRange: "1h",
  customHours: 6,
  liveDevices: new Set(),
  influxConnected: false,
  influxConnectionKnown: false,
  influxConnectedAt: null,
  influxSocket: null,
  socketControlConnected: false,
  pendingSocketControls: new Map(),
  lastLiveAt: new Map(),
  seenTelemetry: new Set(),
  markerSyncTimer: null,
  markerSyncRunning: false,
  debugMockData: (() => {
    try { return sessionStorage.getItem(DEBUG_MOCK_STORAGE_KEY) === "true"; }
    catch { return false; }
  })(),
  renderedDebugMockData: null,
  socketDemandRange: "today",
  iotOpenedFromOverview: true,
  sensorDisplayMode: "labels",
  layerVisibility: Object.fromEntries(MODELS.map((model) => [model.id, true])),
};

function initializeDeviceSnapshots() {
  state.snapshots.clear();
  for (const device of DEVICES) {
  const values = Object.fromEntries(device.metrics.map((metric) => [metric.key, null]));
    state.snapshots.set(device.id, {
      deviceId: device.id,
      status: "unavailable",
      updatedAt: new Date(),
      values,
      trends: Object.fromEntries(device.metrics.map((metric) => [metric.key, []])),
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

const occupancyGroup = new THREE.Group();
occupancyGroup.name = "occupancy-seat-overlays";

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
  if (status === "offline") return { key: "offline", className: "fault" };
  if (status === "unavailable") return { key: "dataUnavailable", className: "unavailable" };
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

function createMarker(device, worldPosition = null) {
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
  if (worldPosition) {
    label.position.copy(worldPosition);
  } else {
    const [nx, ny, nz] = device.binding.normalizedPosition;
    const size = state.modelBox.getSize(new THREE.Vector3());
    label.position.set(
      state.modelBox.min.x + size.x * nx,
      state.modelBox.min.y + size.y * ny,
      state.modelBox.min.z + size.z * nz,
    );
  }
  helpersGroup.add(label);
  label.visible = state.sensorDisplayMode === "labels";
  state.markerObjects.set(device.id, {
    label,
    element,
    modelId: device.binding.modelId || null,
    localId: Number.isInteger(device.binding.localId) ? device.binding.localId : null,
  });
}

async function syncSensorMarkerAnchors() {
  if (state.markerSyncRunning || !state.markerObjects.size) return;
  state.markerSyncRunning = true;
  try {
    for (const marker of state.markerObjects.values()) {
      if (marker.modelId !== "sensor" || !Number.isInteger(marker.localId)) continue;
      const fragmentsModel = state.fragmentsModels.get(marker.modelId);
      if (!fragmentsModel) continue;
      const boxes = await fragmentsModel.getBoxes([marker.localId]);
      if (!boxes.length) continue;
      const box = boxes.reduce((combined, item) => combined.union(item), new THREE.Box3());
      const anchor = box.getCenter(new THREE.Vector3());
      anchor.y = box.max.y + state.modelRadius * 0.008;
      marker.label.position.copy(anchor);
    }
  } finally {
    state.markerSyncRunning = false;
  }
}

function scheduleSensorMarkerSync(delay = 0) {
  window.clearTimeout(state.markerSyncTimer);
  state.markerSyncTimer = window.setTimeout(() => {
    syncSensorMarkerAnchors().catch((error) => console.warn("Failed to sync sensor markers", error));
  }, delay);
}

function resolveMobileMarkerCollisions() {
  const compact = window.innerWidth <= 1180 && window.matchMedia("(pointer: coarse)").matches;
  const markers = [...state.markerObjects.values()];
  markers.forEach((marker) => marker.element.classList.remove("is-collided"));
  if (!compact) return;

  const visible = markers
    .filter((marker) => marker.label.visible && marker.element.getClientRects().length)
    .sort((a, b) => {
      const selectedDelta = Number(b.element.classList.contains("selected")) - Number(a.element.classList.contains("selected"));
      return selectedDelta || a.element.getBoundingClientRect().top - b.element.getBoundingClientRect().top;
    });
  const placed = [];
  for (const marker of visible) {
    const rect = marker.element.getBoundingClientRect();
    const overlaps = placed.some((other) => !(
      rect.right + 4 < other.left || rect.left - 4 > other.right ||
      rect.bottom + 4 < other.top || rect.top - 4 > other.bottom
    ));
    if (overlaps && !marker.element.classList.contains("selected")) marker.element.classList.add("is-collided");
    else placed.push(rect);
  }
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
    if (device.binding.modelId === "sensor") {
      const fragmentsModel = state.fragmentsModels.get("sensor");
      const boxes = await fragmentsModel.getBoxes([target]);
      if (boxes.length) {
        const box = boxes.reduce((combined, item) => combined.union(item), new THREE.Box3());
        const markerPosition = box.getCenter(new THREE.Vector3());
        markerPosition.y = box.max.y + state.modelRadius * 0.008;
        createMarker(device, markerPosition);
      }
    }
  }
  await syncSensorMarkerAnchors();
  await updateAllVisualStates();
}

async function createOccupancySeats() {
  occupancyGroup.clear();
  const archiModel = state.fragmentsModels.get("archi");
  if (!archiModel) return;

  const furniture = await archiModel.getItemsOfCategories([/^IFCFURNISHINGELEMENT$/i]);
  let tableBox = null;
  for (const localId of furniture.IFCFURNISHINGELEMENT || []) {
    const item = archiModel.getItem(localId);
    const attributes = await item.getAttributes();
    const name = readableIfcValue(attributes?.object?.Name) || "";
    if (!/Monza[-_ ]?Table[-_ ]?Rectangular/i.test(name)) continue;
    const boxes = await archiModel.getBoxes([localId]);
    if (boxes.length) tableBox = boxes.reduce((combined, box) => combined.union(box), new THREE.Box3());
    break;
  }
  if (!tableBox) return;

  const columns = 2;
  const rows = 6;
  const tableSize = tableBox.getSize(new THREE.Vector3());
  const seatWidth = tableSize.x / columns;
  const seatDepth = tableSize.z / rows;
  const inset = Math.min(seatWidth, seatDepth) * 0.055;
  const overlayY = tableBox.max.y + Math.max(state.modelRadius * 0.003, 0.018);
  const slabHeight = Math.max(state.modelRadius * 0.006, 0.035);
  const fillMaterial = new THREE.MeshStandardMaterial({
    color: 0x86b9d6,
    opacity: 1,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    roughness: 0.4,
    metalness: 0.05,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x007ee5,
    transparent: true,
    opacity: 1,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  });
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x007ee5,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.3,
    metalness: 0.1,
  });

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const seatIndex = row * columns + column;
      const seat = new THREE.Group();
      seat.name = `occupancy-seat-${seatIndex + 1}`;
      seat.userData.seatIndex = seatIndex;
      seat.userData.occupied = DEBUG_OCCUPIED_SEATS.has(seatIndex);

      const overlayWidth = seatWidth - inset * 2;
      const overlayDepth = seatDepth - inset * 2;
      const geometry = new THREE.BoxGeometry(overlayWidth, slabHeight, overlayDepth);
      const fill = new THREE.Mesh(geometry, fillMaterial);
      fill.position.y = slabHeight / 2;
      fill.renderOrder = 20;
      seat.add(fill);

      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
      outline.position.y = slabHeight / 2;
      outline.renderOrder = 21;
      seat.add(outline);

      const frameThickness = Math.min(overlayWidth, overlayDepth) * 0.035;
      const frameParts = [
        { width: overlayWidth, depth: frameThickness, x: 0, z: -overlayDepth / 2 + frameThickness / 2 },
        { width: overlayWidth, depth: frameThickness, x: 0, z: overlayDepth / 2 - frameThickness / 2 },
        { width: frameThickness, depth: overlayDepth, x: -overlayWidth / 2 + frameThickness / 2, z: 0 },
        { width: frameThickness, depth: overlayDepth, x: overlayWidth / 2 - frameThickness / 2, z: 0 },
      ];
      for (const part of frameParts) {
        const border = new THREE.Mesh(new THREE.BoxGeometry(part.width, slabHeight * 0.92, part.depth), frameMaterial);
        border.position.set(part.x, slabHeight * 0.46, part.z);
        border.renderOrder = 22;
        seat.add(border);
      }

      seat.position.set(
        tableBox.min.x + seatWidth * (column + 0.5),
        overlayY,
        tableBox.min.z + seatDepth * (row + 0.5),
      );
      seat.visible = false;
      occupancyGroup.add(seat);
    }
  }
  helpersGroup.add(occupancyGroup);
  renderOccupancySeats();
}

function renderOccupancySeats() {
  const overlaysVisible = state.debugMockData && state.sensorDisplayMode === "labels";
  occupancyGroup.visible = overlaysVisible;
  for (const seat of occupancyGroup.children) {
    seat.visible = overlaysVisible && seat.userData.occupied;
  }
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
  const target = state.boundObjects.get(device.id) ?? device.binding.localId;
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
  const collection = state.assetView === "mep" ? MEP_COMPONENTS : DEVICES;
  const queryText = normalizedSearchText(state.equipmentQuery);
  if (!queryText) return collection;
  return collection.filter((device) => {
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
  const total = state.assetView === "mep" ? MEP_COMPONENTS.length : DEVICES.length;
  elements.assetListTitle.textContent = state.assetView === "mep" ? "MEP Components" : t("iotSensorsList");
  if (elements.equipmentSearchCount) {
    elements.equipmentSearchCount.textContent = `${matchedDevices.length}/${total}`;
  }
  if (!matchedDevices.length) {
    const empty = document.createElement("p");
    empty.className = "dt-device-empty";
    empty.textContent = t("noSearchResults");
    elements.deviceList.appendChild(empty);
    return;
  }
  for (const device of matchedDevices) {
    if (state.assetView === "mep") {
      const button = document.createElement("button");
      button.type = "button";
      const selected = state.selectedIfcItem?.localId === device.binding.localId && state.selectedIfcItem?.modelId === device.binding.modelId;
      button.className = `dt-device-item bim${selected ? " selected" : ""}`;
      button.innerHTML = `
        <span class="dt-device-copy">
          <strong>${deviceText(device, "name")}</strong>
          <small>${localizedGroupLabel(groupForScannedCategory(device.category))} · ${device.category}</small>
        </span>
        <span class="dt-device-state" aria-label="BIM"><i class="ph ph-cube" aria-hidden="true"></i></span>
      `;
      button.querySelector("strong").title = deviceText(device, "name");
      button.querySelector("small").title = `${localizedGroupLabel(groupForScannedCategory(device.category))} · ${device.category}`;
      button.addEventListener("click", async () => {
        await selectIfcItem(device.binding.localId, device.binding.modelId);
        focusDevice(device).catch((error) => console.error("Failed to focus MEP component", error));
      });
      elements.deviceList.appendChild(button);
      continue;
    }
    const snapshot = state.snapshots.get(device.id);
    const bound = device.binding.kind === "marker" || state.boundObjects.has(device.id) || state.liveDevices.has(device.id);
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
    button.querySelector("strong").title = deviceText(device, "name");
    button.querySelector("small").title = `${deviceText(device, "subtitle")} · ${t(presentedStatus.key)}`;
    button.addEventListener("click", () => {
      selectDevice(device.id, true);
      setDevicePanelOpen(true);
    });
    elements.deviceList.appendChild(button);
  }
}

function liveSocketDemandSeries() {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const cutoff = state.socketDemandRange === "today"
    ? todayStart.getTime()
    : now - (state.socketDemandRange === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000;
  const events = new Map();
  for (const device of DEVICES.filter((item) => item.sensorModel === "WS523")) {
    const samples = state.snapshots.get(device.id)?.trends.activePower || [];
    for (const sample of samples) {
      if (!Number.isFinite(sample.time) || !Number.isFinite(sample.value)) continue;
      if (!events.has(sample.time)) events.set(sample.time, new Map());
      events.get(sample.time).set(device.id, sample.value);
    }
  }
  const latest = new Map();
  const series = [];
  for (const [time, updates] of [...events.entries()].sort((a, b) => a[0] - b[0])) {
    for (const [deviceId, value] of updates) latest.set(deviceId, value);
    if (time < cutoff || !latest.size) continue;
    const totalKilowatts = [...latest.values()].reduce((sum, value) => sum + value, 0) / 1000;
    series.push({ time, value: totalKilowatts });
  }
  return series.slice(-72);
}

function demandTimeLabel(time) {
  const date = new Date(time);
  if (state.socketDemandRange === "today") return date.toLocaleTimeString(activeLocale(), { hour: "2-digit", minute: "2-digit", hour12: false });
  return date.toLocaleDateString(activeLocale(), { month: "short", day: "numeric" });
}

function renderSocketDemandChart(mock) {
  const chart = document.querySelector(".dt-demand-chart");
  const mockRanges = {
    today: { values: [0.72, 0.74, 0.69, 0.78, 0.75, 0.86, 0.82, 0.93, 0.89, 0.91, 0.79, 0.75, 0.78, 0.74], labels: ["00:00", "12:00", "Now"] },
    "7d": { values: [0.76, 0.82, 0.79, 0.91, 0.87, 0.94, 0.88], labels: ["Mon", "Thu", "Sun"] },
    "30d": { values: [0.71, 0.74, 0.8, 0.77, 0.84, 0.9, 0.86, 0.93, 0.88, 0.96, 0.92, 0.98], labels: ["30d ago", "15d", "Today"] },
  };
  document.querySelectorAll("[data-demand-range]").forEach((button) => {
    const active = button.dataset.demandRange === state.socketDemandRange;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = false;
  });
  const liveSeries = mock ? [] : liveSocketDemandSeries();
  if (!mock && !liveSeries.length) {
    chart.innerHTML = '<text class="dt-demand-empty" x="150" y="52" text-anchor="middle">Waiting for power history</text>';
    chart.setAttribute("aria-label", "Waiting for InfluxDB electrical demand history");
    return;
  }
  const values = mock ? mockRanges[state.socketDemandRange].values : liveSeries.map((sample) => sample.value);
  const labels = mock
    ? mockRanges[state.socketDemandRange].labels
    : [liveSeries[0], liveSeries[Math.floor((liveSeries.length - 1) / 2)], liveSeries.at(-1)].map((sample) => demandTimeLabel(sample.time));
  if (values.length === 1) values.unshift(values[0]);
  const left = 28, right = 296, top = 5, bottom = 79;
  const observedMax = Math.max(...values);
  const targetMax = Math.max(observedMax * 1.1, 0.01);
  const roughHalfRange = targetMax / 2;
  const magnitude = 10 ** Math.floor(Math.log10(roughHalfRange));
  const normalizedStep = roughHalfRange / magnitude;
  const niceFactor = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  const step = niceFactor * magnitude;
  const min = 0;
  const max = Math.max(step * 2, Math.ceil(targetMax / step) * step);
  const tickDigits = max >= 10 ? 0 : max >= 1 ? 1 : max >= 0.1 ? 2 : 3;
  const formatTick = (value) => Number(value.toFixed(tickDigits)).toLocaleString(activeLocale(), {
    maximumFractionDigits: tickDigits,
  });
  const x = (index) => left + (index / (values.length - 1)) * (right - left);
  const y = (value) => bottom - ((value - min) / (max - min)) * (bottom - top);
  const points = values.map((value, index) => [x(index), y(value)]);
  const line = points.map(([px, py], index) => `${index ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const ticks = [min, max / 2, max];
  chart.innerHTML = `
    <g class="dt-demand-grid">${ticks.map((tick) => `<line x1="${left}" y1="${y(tick)}" x2="${right}" y2="${y(tick)}"></line><text x="${left - 5}" y="${y(tick) + 3}" text-anchor="end">${formatTick(tick)}</text>`).join("")}</g>
    <path class="dt-demand-area" d="${line} L${right} ${bottom} L${left} ${bottom} Z"></path>
    <path class="dt-demand-line" d="${line}"></path>
    <g class="dt-demand-points">${points.map(([px, py]) => `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.2"></circle>`).join("")}</g>
    <g class="dt-demand-axis"><text x="${left}" y="96" text-anchor="start">${labels[0]}</text><text x="${(left + right) / 2}" y="96" text-anchor="middle">${labels[1]}</text><text x="${right}" y="96" text-anchor="end">${labels[2]}</text></g>
  `;
  chart.setAttribute("aria-label", `${state.socketDemandRange} ${mock ? "virtual" : "InfluxDB"} electrical demand trend`);
}

function renderDebugDashboardData() {
  if (state.renderedDebugMockData === state.debugMockData) return;
  state.renderedDebugMockData = state.debugMockData;
  const mock = state.debugMockData;
  renderOccupancySeats();

  const socketPowers = mock ? ["420 W", "160 W", "0 W", "310 W", "0 W", "90 W"] : Array(6).fill("—");
  document.querySelectorAll(".dt-socket-grid small").forEach((element, index) => { element.textContent = socketPowers[index]; });
  document.querySelectorAll(".dt-socket-grid input").forEach((input, index) => {
    input.disabled = !mock;
    input.checked = mock && [0, 1, 3, 5].includes(index);
  });
  syncSocketMaster();
  document.querySelector(".dt-demand-row strong").textContent = mock ? "0.98" : "—";
  renderSocketDemandChart(mock);

  document.querySelectorAll(".dt-mode-toggle button").forEach((button, index) => {
    button.disabled = !mock;
    button.classList.toggle("active", mock && index === 0);
  });
  document.querySelector(".dt-recommendations").innerHTML = mock ? `
    <div><span>Recommended supply-air setpoint</span><strong>22.5<small>°C</small></strong><p>Current setpoint 23.0°C</p><em class="waiting">Awaiting execution</em></div>
    <div><span>Recommended outdoor-air damper</span><strong>46<small>%</small></strong><p>Current position 32%</p><em>Executed successfully</em></div>
  ` : `
    <div><span>Recommended supply-air setpoint</span><strong>—</strong><p>—</p></div>
    <div><span>Recommended outdoor-air damper</span><strong>—</strong><p>—</p></div>
  `;

  const healthData = mock
    ? { sensor: [17, 1, 1], battery: [14, 4, 1] }
    : { sensor: [0, 0, 0], battery: [0, 0, 0] };
  const healthColors = {
    sensor: ["#18ad78", "#9aabc0", "#ef476f"],
    battery: ["#18ad78", "#f0a51a", "#ef476f"],
  };
  document.querySelectorAll("[data-health-chart]").forEach((chart) => {
    const key = chart.dataset.healthChart;
    const values = healthData[key];
    chart.querySelectorAll("li b").forEach((value, index) => { value.textContent = mock ? values[index] : "—"; });
    drawDonutChart(chart.querySelector("canvas"), values, healthColors[key]);
  });
  document.querySelector(".dt-alert-list").innerHTML = mock ? `
    <button type="button" class="critical"><i class="ph ph-warning-circle"></i><span><strong>Door contact abnormal opening</strong><small>Door-01 · 19:42 · after hours</small></span></button>
    <button type="button" class="warning"><i class="ph ph-battery-warning"></i><span><strong>Battery replacement required</strong><small>WS523-03 · maintenance due</small></span></button>
  ` : "";

  const outdoorMockLines = [
    '<strong>31.8<small>°C</small></strong><em>Apparent 36°</em>',
    '<strong>68<small>%</small></strong>',
    '<strong class="wind-value" aria-label="Wind from ESE at 4.2 metres per second"><canvas class="dt-wind-barb" width="56" height="56" aria-hidden="true"></canvas><em>4.2 m/s</em></strong>',
    '<strong class="weather">Rainy</strong>',
  ];
  document.querySelectorAll(".dt-outdoor-grid .dt-metric-line").forEach((line, index) => {
    line.innerHTML = mock ? outdoorMockLines[index] : "<strong>—</strong>";
  });
  if (mock) drawWindBarb(document.querySelector(".dt-wind-barb"), 112.5, 4.2);

  const ahuValues = mock ? ["23.0°C", "17.8 °C", "24.1 °C"] : ["—", "—", "—"];
  document.querySelectorAll(".dt-ahu-control strong, .dt-air-readings strong").forEach((element, index) => { element.textContent = ahuValues[index]; });
  const ahuMeterValues = mock ? ["46%", "32%", "38 Hz"] : ["—", "—", "—"];
  const ahuMeterWidths = mock ? ["46%", "32%", "63%"] : ["0", "0", "0"];
  document.querySelectorAll(".dt-ahu-meters b").forEach((element, index) => { element.textContent = ahuMeterValues[index]; });
  document.querySelectorAll(".dt-ahu-meters u").forEach((element, index) => { element.style.width = ahuMeterWidths[index]; });
  const ahuRange = document.querySelector(".dt-ahu-control input");
  ahuRange.disabled = !mock;
  ahuRange.value = mock ? "23" : "18";
  document.querySelector(".dt-ahu-control button").disabled = !mock;
}

function drawDonutChart(canvas, values, colors) {
  const context = canvas.getContext("2d");
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const size = 78;
  canvas.width = size * density;
  canvas.height = size * density;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  context.scale(density, density);
  context.clearRect(0, 0, size, size);
  const total = values.reduce((sum, value) => sum + value, 0);
  const center = size / 2;
  const radius = 28;
  context.lineWidth = 10;
  context.lineCap = "butt";
  if (!total) {
    context.strokeStyle = "#dbe3ee";
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.stroke();
    return;
  }
  let start = -Math.PI / 2;
  values.forEach((value, index) => {
    if (!value) return;
    const end = start + (value / total) * Math.PI * 2;
    context.strokeStyle = colors[index];
    context.beginPath();
    context.arc(center, center, radius, start, end);
    context.stroke();
    start = end;
  });
}

function drawWindBarb(canvas, directionDegrees, speedMetresPerSecond) {
  const context = canvas.getContext("2d");
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const size = 28;
  canvas.width = size * density;
  canvas.height = size * density;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  context.scale(density, density);
  context.clearRect(0, 0, size, size);
  context.save();
  context.translate(size / 2, size / 2);
  context.rotate((directionDegrees * Math.PI) / 180);
  context.strokeStyle = "#2f7df4";
  context.lineWidth = 1.8;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(0, 10);
  context.lineTo(0, -10);
  context.moveTo(0, -9);
  context.lineTo(7, -4);
  if (speedMetresPerSecond >= 2.5) {
    const featherLength = speedMetresPerSecond >= 5 ? 7 : 4.5;
    context.moveTo(0, -5);
    context.lineTo(featherLength, -1);
  }
  context.stroke();
  context.restore();
}

function renderSiteOverview() {
  renderDebugDashboardData();
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
  const occupancySnapshots = snapshots.filter((snapshot) => Number.isFinite(snapshot.values.occupancy));
  const occupiedCount = occupancySnapshots.reduce((sum, snapshot) => sum + (snapshot.values.occupancy > 0 ? 1 : 0), 0);
  elements.siteOccupants.textContent = state.debugMockData
    ? `${DEBUG_OCCUPIED_SEATS.size} / 12`
    : occupancySnapshots.length ? `${occupiedCount} / ${occupancySnapshots.length}` : "—";

  const sourceDeviceId = "AM103-07";
  const sourceSnapshot = state.snapshots.get(sourceDeviceId);
  const lastLiveAt = state.lastLiveAt.get(sourceDeviceId);
  const sourceIsFresh = state.influxConnected
    && Number.isFinite(lastLiveAt)
    && Date.now() - lastLiveAt <= INFLUX_STALE_AFTER_MS;
  const sourceValue = (key, unit) => sourceIsFresh && Number.isFinite(sourceSnapshot?.values[key])
    ? `${formatNumber(sourceSnapshot.values[key])} ${unit}`
    : "—";
  elements.overviewIndoorTemperature.textContent = state.debugMockData ? "24.2 °C" : sourceValue("temperature", "°C");
  elements.overviewIndoorHumidity.textContent = state.debugMockData ? "62.2 %" : sourceValue("humidity", "%");
  elements.overviewIndoorCo2.textContent = state.debugMockData ? "517 ppm" : sourceValue("co2", "ppm");
  const pm25 = average(metricValues(["pm25"]));
  const noise = average(metricValues(["noiseLaeq"]));
  const extraIndoorValues = state.debugMockData
    ? ["9 µg/m³", "48 dB(A)", "7 / 12"]
    : [
      pm25 === null ? "—" : `${formatNumber(pm25)} µg/m³`,
      noise === null ? "—" : `${formatNumber(noise)} dB(A)`,
      occupancySnapshots.length ? `${occupiedCount} / ${occupancySnapshots.length}` : "—",
    ];
  document.querySelectorAll(".dt-indoor-grid .dt-metric-line strong").forEach((element, index) => {
    if (index >= 3) element.textContent = extraIndoorValues[index - 3];
  });

  if (!state.debugMockData) {
    const socketDevices = DEVICES.filter((device) => device.sensorModel === "WS523").sort((a, b) => a.id.localeCompare(b.id));
    document.querySelectorAll(".dt-socket-grid small").forEach((element, index) => {
      const input = document.querySelectorAll(".dt-socket-grid input[data-socket-device]")[index];
      const device = socketDevices.find((item) => item.id === input?.dataset.socketDevice);
      const socketSnapshot = state.snapshots.get(device?.id);
      const power = socketSnapshot?.values.activePower;
      element.textContent = Number.isFinite(power) ? `${formatNumber(power)} W` : "—";
      if (input) {
        const pending = [...state.pendingSocketControls.values()].find((item) => item.deviceId === input.dataset.socketDevice);
        input.checked = Number(socketSnapshot?.values.socketStatus) > 0;
        input.disabled = !device || !state.socketControlConnected || Boolean(pending);
        input.classList.toggle("pending", Boolean(pending));
        input.setAttribute("aria-busy", String(Boolean(pending)));
      }
    });
    syncSocketMaster();
    const totalPower = socketDevices.reduce((sum, device) => {
      const power = state.snapshots.get(device.id)?.values.activePower;
      return sum + (Number.isFinite(power) ? power : 0);
    }, 0);
    document.querySelector(".dt-demand-row strong").textContent = socketDevices.length ? (totalPower / 1000).toFixed(2) : "—";
    renderSocketDemandChart(false);

    const online = DEVICES.filter((device) => state.snapshots.get(device.id)?.status === "normal").length;
    const fault = DEVICES.filter((device) => state.snapshots.get(device.id)?.status === "fault").length;
    const offline = Math.max(0, DEVICES.length - online - fault);
    const batteries = snapshots.map((snapshot) => snapshot.values.battery).filter(Number.isFinite);
    const healthData = {
      sensor: [online, offline, fault],
      battery: [batteries.filter((value) => value >= 50).length, batteries.filter((value) => value >= 20 && value < 50).length, batteries.filter((value) => value < 20).length],
    };
    const healthColors = { sensor: ["#18ad78", "#9aabc0", "#ef476f"], battery: ["#18ad78", "#f0a51a", "#ef476f"] };
    document.querySelectorAll("[data-health-chart]").forEach((chart) => {
      const values = healthData[chart.dataset.healthChart];
      chart.querySelectorAll("li b").forEach((element, index) => { element.textContent = String(values[index]); });
      drawDonutChart(chart.querySelector("canvas"), values, healthColors[chart.dataset.healthChart]);
    });

    const alarms = [];
    for (const device of DEVICES) {
      const values = state.snapshots.get(device.id)?.values || {};
      if (values.leakageStatus > 0) alarms.push(["critical", "Water leakage detected", device.id]);
      if (values.tamperStatus > 0) alarms.push(["critical", "Sensor tamper detected", device.id]);
      if (Number.isFinite(values.battery) && values.battery < 20) alarms.push(["warning", "Battery replacement required", device.id]);
    }
    const alertList = document.querySelector(".dt-alert-list");
    alertList.innerHTML = alarms.map(([level, title, id]) => `
      <button type="button" class="${level}"><i class="ph ph-warning-circle"></i><span><strong>${title}</strong><small>${id} · InfluxDB live data</small></span></button>
    `).join("");
    alertList.setAttribute("aria-label", alarms.length ? `${alarms.length} live alarms` : "No active InfluxDB alarms");
  }
}

function historyWindowMs() {
  if (state.historyRange === "1h") return 60 * 60 * 1000;
  if (state.historyRange === "12h") return 12 * 60 * 60 * 1000;
  if (state.historyRange === "24h") return 24 * 60 * 60 * 1000;
  if (state.historyRange === "custom") return state.customHours * 60 * 60 * 1000;
  return null;
}

function samplesInSelectedRange(samples) {
  const windowMs = historyWindowMs();
  if (!windowMs) return samples;
  const cutoff = Date.now() - windowMs;
  return samples.filter((sample) => sample.time >= cutoff);
}

function trendScale(metric, values) {
  const scaleByMetric = {
    temperature: { minimumSpan: 0.4, decimals: 1 },
    humidity: { minimumSpan: 1, decimals: 1 },
    co2: { minimumSpan: 20, decimals: 0 },
  };
  const config = scaleByMetric[metric?.key] || { minimumSpan: 1, decimals: 1 };
  const observedMin = Math.min(...values);
  const observedMax = Math.max(...values);
  const observedSpan = observedMax - observedMin;
  const span = Math.max(config.minimumSpan, observedSpan * 1.24);
  const center = (observedMin + observedMax) / 2;
  return {
    min: center - span / 2,
    max: center + span / 2,
    span,
    decimals: config.decimals,
  };
}

function sparklinePath(samples, metric) {
  const width = 360;
  const height = 140;
  const left = 40;
  const right = 8;
  const top = 10;
  const bottom = 28;
  const plotBottom = height - bottom;
  const values = samples.map((sample) => sample.value);
  const scale = trendScale(metric, values);
  const windowMs = historyWindowMs();
  const latestTime = Date.now();
  let domainStart = windowMs ? latestTime - windowMs : samples[0].time;
  let domainEnd = windowMs ? latestTime : samples.at(-1).time;
  if (domainEnd <= domainStart) domainEnd = domainStart + 1;
  let points = samples.map((sample) => {
    const xRatio = Math.max(0, Math.min(1, (sample.time - domainStart) / (domainEnd - domainStart)));
    const x = left + xRatio * (width - left - right);
    const y = top + (1 - (sample.value - scale.min) / scale.span) * (plotBottom - top);
    return [x, y];
  });
  if (points.length === 1) points = [[left, points[0][1]], [width - right, points[0][1]]];
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points.at(-1)[0].toFixed(1)},${plotBottom} L${points[0][0].toFixed(1)},${plotBottom} Z`;
  const ticks = [scale.max, (scale.max + scale.min) / 2, scale.min].map((value, index) => ({
    value,
    y: top + (index / 2) * (plotBottom - top),
  }));
  return { line, area, points, ticks, decimals: scale.decimals, left, right: width - right, top, plotBottom };
}

function renderMetricTrend(snapshot, chart, metric) {
  const samples = metric ? samplesInSelectedRange(snapshot.trends[metric.key]) : [];
  const values = samples.map((sample) => sample.value);
  chart.card.hidden = !metric || samples.length === 0;
  if (!metric || samples.length === 0) return;
  const paths = sparklinePath(samples, metric);
  chart.label.textContent = metricText(metric);
  const delta = values.at(-1) - values[0];
  const deltaClass = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const deltaSign = delta > 0 ? "+" : "";
  chart.value.innerHTML = `${formatNumber(snapshot.values[metric.key])} ${metric.unit}<small class="dt-trend-delta ${deltaClass}">Δ ${deltaSign}${formatNumber(delta)} ${metric.unit}</small>`;
  chart.line.setAttribute("d", paths.line);
  chart.area.setAttribute("d", paths.area);
  chart.points.innerHTML = paths.points.map(([x, y], index) => `
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${index === paths.points.length - 1 ? 4.5 : 3.2}"></circle>
  `).join("");
  chart.grid.innerHTML = paths.ticks.map((tick) => `
    <line x1="${paths.left}" y1="${tick.y}" x2="${paths.right}" y2="${tick.y}"></line>
  `).join("") + `<line x1="${paths.left}" y1="${paths.top}" x2="${paths.left}" y2="${paths.plotBottom}"></line>`;
  const rangeLabel = `-${state.historyRange === "custom" ? `${state.customHours}h` : state.historyRange}`;
  chart.axis.innerHTML = paths.ticks.map((tick) => `
    <text x="34" y="${tick.y + 3}" text-anchor="end">${tick.value.toFixed(paths.decimals)}</text>
  `).join("") + `
    <text x="${paths.left}" y="132" text-anchor="start">${rangeLabel}</text>
    <text x="${paths.right}" y="132" text-anchor="end">${t("now")}</text>
  `;
}

function renderSelectedDevice() {
  const device = DEVICES.find((item) => item.id === state.selectedDeviceId);
  if (!device) {
    const item = state.selectedItem;
    elements.dataPanelTitle.textContent = t("componentDetails");
    elements.deviceName.textContent = item?.name || t("noProperties");
    elements.deviceName.title = elements.deviceName.textContent;
    elements.statusBadge.textContent = "";
    elements.statusBadge.setAttribute("aria-label", "BIM");
    elements.statusBadge.title = "BIM";
    elements.statusBadge.className = "dt-status-badge bim";
    elements.metricGrid.hidden = true;
    elements.componentProperties.hidden = !item;
    elements.componentProperties.innerHTML = item ? `
      <h3>${t("componentDetails")}</h3>
      <dl>
        <div><dt>${t("ifcType")}</dt><dd>${item.category || "—"}</dd></div>
        <div><dt>${t("globalId")}</dt><dd>${item.guid || "—"}</dd></div>
        <div><dt>${t("expressId")}</dt><dd>${item.localId ?? "—"}</dd></div>
      </dl>
    ` : "";
    elements.componentProperties.querySelectorAll("dd").forEach((value) => { value.title = value.textContent; });
    elements.metricTrendCards.forEach((chart) => { chart.card.hidden = true; });
    elements.updateRow.hidden = true;
    elements.historyNote.closest(".dt-history-toolbar").hidden = true;
    elements.faultToggle.hidden = true;
    return;
  }
  elements.dataPanelTitle.textContent = t("sensorData");
  elements.componentProperties.hidden = true;
  elements.componentProperties.innerHTML = "";
  elements.historyNote.closest(".dt-history-toolbar").hidden = false;
  const snapshot = state.snapshots.get(device.id);
  const bound = device.binding.kind === "marker" || state.boundObjects.has(device.id) || state.liveDevices.has(device.id);
  const displayStatus = bound ? snapshot.status : "unavailable";
  const presentedStatus = presentationStatus(displayStatus);

  elements.deviceName.textContent = deviceText(device, "name");
  elements.deviceName.title = elements.deviceName.textContent;
  elements.statusBadge.textContent = "";
  elements.statusBadge.setAttribute("aria-label", t(presentedStatus.key));
  elements.statusBadge.title = t(presentedStatus.key);
  elements.statusBadge.className = `dt-status-badge ${presentedStatus.className}`;
  elements.metricGrid.hidden = false;
  elements.metricTrendCards.forEach((chart) => { chart.card.hidden = false; });
  elements.updateRow.hidden = false;
  elements.faultToggle.hidden = true;

  elements.metricGrid.innerHTML = device.metrics.map((metric) => `
    <div class="dt-metric" data-metric="${metric.key}" role="group" aria-label="${metricText(metric)}" title="${metricText(metric)}">
      <i class="ph ${metric.icon || INFLUX_METRICS[metric.key]?.icon || "ph-chart-line"} dt-metric-icon" aria-hidden="true"></i>
      <span>${metricText(metric)}</span>
      <strong>${Number.isFinite(snapshot.values[metric.key]) ? `${formatNumber(snapshot.values[metric.key])}<small>${metric.unit}</small>` : "—"}</strong>
    </div>
  `).join("");

  elements.metricTrendCards.forEach((chart, index) => renderMetricTrend(snapshot, chart, device.metrics[index]));
  const primarySamples = samplesInSelectedRange(snapshot.trends[device.metrics[0].key]);
  const selectedRangeLabel = state.historyRange === "custom" ? `${state.customHours}h` : state.historyRange;
  elements.historyNote.textContent = t("readingsInRange", { count: primarySamples.length, range: selectedRangeLabel });
  elements.updatedAt.textContent = state.lastLiveAt.has(device.id)
    ? snapshot.updatedAt.toLocaleTimeString(activeLocale(), { hour12: false })
    : "—";
  elements.faultButtonText.textContent = snapshot.status === "fault" ? t("restoreNormal") : t("simulateFault");
  elements.faultToggle.classList.toggle("is-recovery", snapshot.status === "fault");
  elements.faultToggle.disabled = !bound;
}

function renderUI() {
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

function setDashboardPanelsVisible(visible) {
  const workspace = elements.wrap.closest(".dt-workspace");
  workspace.classList.toggle("dashboard-collapsed", !visible);
  document.querySelector('[data-view="overview"]')?.setAttribute("aria-expanded", String(visible));
}

function setActivePlatformView(view) {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function setDevicePanelOpen(open) {
  const workspace = elements.wrap.closest(".dt-workspace");
  workspace.classList.toggle("panel-open", open);
  elements.devicePanel.classList.toggle("is-open", open);
  elements.devicePanel.setAttribute("aria-hidden", String(!open));
  elements.devicePanel.inert = !open;
  elements.devicePanelButton.setAttribute("aria-expanded", String(open));
  if (open) {
    setDashboardPanelsVisible(false);
    setActivePlatformView("sensors");
  } else if (elements.devicePanelButton.classList.contains("active")) {
    setActivePlatformView(null);
  }
  if (open) elements.devicePanelClose.focus({ preventScroll: true });
  else elements.devicePanelButton.focus({ preventScroll: true });
  scheduleSensorMarkerSync(320);
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
  const isWall = /^IFCWALL(?:STANDARDCASE)?$/i.test(category)
    || /(?:^|\b)basic\s+wall\b|\bwall[-_: ]/i.test(name);
  const isFloor = /^IFCSLAB$/i.test(category)
    || /(?:^|\b)(?:floor|flooring|slab)(?:\b|[-_: ])/i.test(name);
  return isWall || isFloor;
}

function setFault(deviceId, shouldFault) {
  const snapshot = state.snapshots.get(deviceId);
  if (!snapshot) return;
  snapshot.status = shouldFault ? "fault" : "normal";
  snapshot.updatedAt = new Date();
  renderUI();
}

function updateMockData() {
  const connectivityChanged = updateDeviceConnectivity();
  if (connectivityChanged) {
    renderDeviceList();
    updateAllVisualStates().catch((error) => console.error("Failed to sync offline sensor state", error));
  }
  renderSelectedDevice();
  renderSiteOverview();
  elements.clock.textContent = new Date().toLocaleString(activeLocale(), {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

function updateDeviceConnectivity() {
  if (!state.influxConnectionKnown) return false;
  const now = Date.now();
  let changed = false;
  for (const device of DEVICES) {
    const snapshot = state.snapshots.get(device.id);
    if (!snapshot) continue;
    const lastLiveAt = state.lastLiveAt.get(device.id);
    const databaseOffline = !state.influxConnected;
    const deviceStale = state.influxConnected && (!lastLiveAt || now - lastLiveAt > INFLUX_STALE_AFTER_MS);
    const nextStatus = databaseOffline
      ? "unavailable"
      : deviceStale
        ? "offline"
        : snapshot.status === "offline" || snapshot.status === "unavailable" ? "normal" : snapshot.status;
    if (snapshot.status !== nextStatus) {
      snapshot.status = nextStatus;
      changed = true;
    }
  }
  return changed;
}

function connectInfluxBridge() {
  if (state.influxSocket && state.influxSocket.readyState < WebSocket.CLOSING) return;
  const bridgeUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8787`;
  let socket;
  try {
    socket = new WebSocket(bridgeUrl);
    state.influxSocket = socket;
  } catch (error) {
    console.warn("InfluxDB bridge unavailable", error);
    return;
  }
  socket.addEventListener("message", (event) => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.type === "bridge-status") {
      const wasConnected = state.influxConnected;
      state.influxConnected = Boolean(message.connected);
      state.influxConnectionKnown = true;
      if (state.influxConnected && !wasConnected) {
        const bridgeStartedAt = Date.parse(message.startedAt);
        state.influxConnectedAt = Number.isFinite(bridgeStartedAt) ? bridgeStartedAt : Date.now();
      }
      updateDeviceConnectivity();
      renderUI();
      return;
    }
    if (message.type === "control-status") {
      state.socketControlConnected = Boolean(message.connected);
      renderUI();
      return;
    }
    if (message.type === "control-queued") {
      const status = document.getElementById("socket-control-status");
      if (status) {
        status.className = "dt-socket-control-status pending";
        status.textContent = `${message.deviceId} command queued${message.position > 1 ? ` (${message.position})` : ""}`;
      }
      return;
    }
    if (message.type === "control-result") {
      const pending = state.pendingSocketControls.get(message.requestId);
      if (!pending) return;
      const status = document.getElementById("socket-control-status");
      if (!message.ok) {
        state.pendingSocketControls.delete(message.requestId);
        if (status) {
          status.className = "dt-socket-control-status error";
          status.textContent = `${pending.deviceId} control failed: ${message.error || "Unknown error"}`;
        }
        renderUI();
        return;
      }
      pending.phase = "awaiting-telemetry";
      pending.timeoutId = window.setTimeout(() => {
        if (!state.pendingSocketControls.has(message.requestId)) return;
        state.pendingSocketControls.delete(message.requestId);
        const timeoutStatus = document.getElementById("socket-control-status");
        if (timeoutStatus) {
          timeoutStatus.className = "dt-socket-control-status error";
          timeoutStatus.textContent = `${pending.deviceId} did not confirm within ${SOCKET_CONTROL_TIMEOUT_MS / 1000}s`;
        }
        renderUI();
      }, SOCKET_CONTROL_TIMEOUT_MS);
      if (status) {
        status.className = "dt-socket-control-status pending";
        status.textContent = `${pending.deviceId} command sent; waiting for device status`;
      }
      renderUI();
      return;
    }
    if (message.type !== "telemetry") return;
    const device = ensureTelemetryDevice(message);
    const snapshot = device && state.snapshots.get(device.id);
    if (!device || !snapshot) return;
    const telemetryKey = `${device.id}:${message.receivedAt || JSON.stringify(message.values)}`;
    if (state.seenTelemetry.has(telemetryKey)) return;
    state.seenTelemetry.add(telemetryKey);
    if (state.seenTelemetry.size > MAX_SEEN_TELEMETRY) {
      state.seenTelemetry.delete(state.seenTelemetry.values().next().value);
    }
    for (const metric of device.metrics) {
      const value = Number(message.values?.[metric.key]);
      if (!Number.isFinite(value)) continue;
      snapshot.values[metric.key] = value;
      snapshot.trends[metric.key].push({ value, time: Date.parse(message.receivedAt) || Date.now() });
      snapshot.trends[metric.key] = snapshot.trends[metric.key].slice(-24);
    }
    snapshot.status = "normal";
    snapshot.updatedAt = new Date(message.receivedAt || Date.now());
    state.liveDevices.add(device.id);
    state.lastLiveAt.set(device.id, snapshot.updatedAt.getTime());
    const socketStatus = Number(message.values?.socketStatus);
    if (Number.isFinite(socketStatus)) {
      const confirmed = [...state.pendingSocketControls.entries()].find(([, pending]) => (
        pending.deviceId === device.id
        && pending.phase === "awaiting-telemetry"
        && snapshot.updatedAt.getTime() > pending.baselineTelemetryAt
        && (socketStatus > 0) === pending.desired
      ));
      if (confirmed) {
        const [requestId, pending] = confirmed;
        window.clearTimeout(pending.timeoutId);
        state.pendingSocketControls.delete(requestId);
        const status = document.getElementById("socket-control-status");
        if (status) {
          status.className = "dt-socket-control-status success";
          status.textContent = `${pending.deviceId} ${pending.desired ? "ON" : "OFF"} confirmed by device`;
        }
      }
    }
    renderUI();
  });
  socket.addEventListener("close", () => {
    state.influxConnected = false;
    state.influxConnectionKnown = true;
    state.influxSocket = null;
    state.socketControlConnected = false;
    for (const pending of state.pendingSocketControls.values()) window.clearTimeout(pending.timeoutId);
    state.pendingSocketControls.clear();
    updateDeviceConnectivity();
    renderUI();
    window.setTimeout(connectInfluxBridge, 3000);
  });
  socket.addEventListener("error", () => socket.close());
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
  fragmentsModel.object.visible = state.layerVisibility[model.id] !== false;
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
  DEVICES = await bindSensorsToIfc(fallbackSensorDevices(), state.fragmentsModels.get("sensor"));
  MEP_COMPONENTS = await scanIfcEquipment(state.fragmentsModels.get("mep"), "mep");
  initializeDeviceSnapshots();
  const initialDevice = DEVICES.find((device) => device.id.toUpperCase() === requestedSensorId) || DEVICES[0];
  state.selectedDeviceId = initialDevice?.id || null;
  state.selectedItem = initialDevice?.ifc || null;
  elements.deviceCount.textContent = String(DEVICES.length);
  addGrid();
  fitCameraToModel(false);
  await fragments.update(true);
  await createOccupancySeats();
  await bindDevices();
  if (initialDevice) {
    await selectDevice(initialDevice.id, Boolean(requestedSensorId));
    if (requestedSensorId) setDevicePanelOpen(true);
  }
  elements.meshCount.textContent = componentCount.toLocaleString(activeLocale());
  elements.loadingProgress.style.width = "100%";
  elements.loadingMeta.textContent = t("modelReady", { count: componentCount.toLocaleString(activeLocale()) });
  elements.loading.classList.add("hidden");
  renderUI();
  connectInfluxBridge();
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
  let hitPriority = Infinity;
  for (const [modelId, fragmentsModel] of state.fragmentsModels) {
    if (!fragmentsModel.object.visible) continue;
    const candidate = await fragmentsModel.raycast({
      camera,
      mouse: new THREE.Vector2(event.clientX, event.clientY),
      dom: elements.canvas,
    });
    if (candidate && await isNonSelectableIfcItem(fragmentsModel, candidate.localId)) continue;
    const candidateDistance = candidate?.point ? camera.position.distanceToSquared(candidate.point) : Infinity;
    const candidatePriority = modelId === "mep" ? 0 : 1;
    if (candidate && (!result || candidatePriority < hitPriority || (candidatePriority === hitPriority && candidateDistance < hitDistance))) {
      result = candidate;
      hitModelId = modelId;
      hitDistance = candidateDistance;
      hitPriority = candidatePriority;
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
  scheduleSensorMarkerSync(80);
}

elements.retryButton.addEventListener("click", loadModel);
elements.layerToggles.forEach((toggle) => {
  if (toggle.dataset.modelLayer === "sensor") {
    toggle.addEventListener("click", async () => {
      const modes = ["labels", "model", "hidden"];
      state.sensorDisplayMode = modes[(modes.indexOf(state.sensorDisplayMode) + 1) % modes.length];
      const modelVisible = state.sensorDisplayMode !== "hidden";
      state.layerVisibility.sensor = modelVisible;
      const fragmentsModel = state.fragmentsModels.get("sensor");
      if (fragmentsModel) fragmentsModel.object.visible = modelVisible;
      for (const marker of state.markerObjects.values()) marker.label.visible = state.sensorDisplayMode === "labels";
      renderOccupancySeats();

      const modeMeta = {
        labels: { icon: "ph-eye", label: "Sensor: model and labels" },
        model: { icon: "ph-cube", label: "Sensor: model only" },
        hidden: { icon: "ph-eye-slash", label: "Sensor: hidden" },
      }[state.sensorDisplayMode];
      toggle.dataset.sensorMode = state.sensorDisplayMode;
      toggle.setAttribute("aria-label", modeMeta.label);
      toggle.title = modeMeta.label;
      toggle.querySelector("i").className = `ph ${modeMeta.icon}`;
      if (fragmentsModel) await fragments.update(true);
    });
    return;
  }

  toggle.addEventListener("change", async () => {
    state.layerVisibility[toggle.dataset.modelLayer] = toggle.checked;
    const fragmentsModel = state.fragmentsModels.get(toggle.dataset.modelLayer);
    if (fragmentsModel) fragmentsModel.object.visible = toggle.checked;
    toggle.closest("label")?.classList.toggle("is-off", !toggle.checked);
    if (fragmentsModel) await fragments.update(true);
  });
});

function syncSocketMaster() {
  const master = document.getElementById("socket-master");
  const sockets = [...document.querySelectorAll(".dt-socket-grid input[data-socket-device]")];
  const relevantSockets = state.debugMockData
    ? sockets
    : sockets.filter((input) => DEVICES.some((device) => device.id === input.dataset.socketDevice && device.sensorModel === "WS523"));
  master.disabled = state.debugMockData
    ? false
    : !state.socketControlConnected || !relevantSockets.length || state.pendingSocketControls.size > 0;
  master.checked = relevantSockets.length > 0 && relevantSockets.every((input) => input.checked);
  master.indeterminate = relevantSockets.some((input) => input.checked) && !master.checked;
}

function sendSocketControl(input, desired, previous = !desired) {
  const deviceId = input.dataset.socketDevice;
  const socket = state.influxSocket;
  if (!deviceId || !state.socketControlConnected || !socket || socket.readyState !== WebSocket.OPEN) {
    input.checked = previous;
    const status = document.getElementById("socket-control-status");
    if (status) {
      status.className = "dt-socket-control-status error";
      status.textContent = "Socket control service is unavailable";
    }
    syncSocketMaster();
    return;
  }
  const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const snapshot = state.snapshots.get(deviceId);
  state.pendingSocketControls.set(requestId, {
    deviceId,
    desired,
    previous,
    phase: "queued",
    baselineTelemetryAt: snapshot?.updatedAt?.getTime?.() || 0,
    timeoutId: null,
  });
  input.checked = previous;
  input.disabled = true;
  input.classList.add("pending");
  input.setAttribute("aria-busy", "true");
  socket.send(JSON.stringify({ type: "socket-control", requestId, deviceId, action: desired ? "on" : "off" }));
  syncSocketMaster();
}

document.getElementById("socket-master").addEventListener("change", (event) => {
  const desired = event.currentTarget.checked;
  document.querySelectorAll(".dt-socket-grid input[data-socket-device]").forEach((input) => {
    if (input.disabled || input.checked === desired) return;
    const previous = input.checked;
    sendSocketControl(input, desired, previous);
  });
  syncSocketMaster();
});

document.querySelectorAll(".dt-socket-grid input[data-socket-device]").forEach((input) => input.addEventListener("change", (event) => {
  if (state.debugMockData) {
    syncSocketMaster();
    return;
  }
  sendSocketControl(event.currentTarget, event.currentTarget.checked, !event.currentTarget.checked);
}));

document.querySelectorAll("[data-demand-range]").forEach((button) => {
  button.addEventListener("click", () => {
    state.socketDemandRange = button.dataset.demandRange;
    renderSocketDemandChart(state.debugMockData);
  });
});

document.querySelectorAll(".dt-mode-toggle button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".dt-mode-toggle button").forEach((item) => item.classList.toggle("active", item === button));
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
  if (view === "bms") return;
  const workspace = elements.wrap.closest(".dt-workspace");
  if (view === "overview") {
    const overviewButton = document.querySelector('[data-view="overview"]');
    const isCurrentView = overviewButton?.classList.contains("active");
    const isCollapsed = workspace.classList.contains("dashboard-collapsed");
    // Returning from IoT must dismiss its right-hand rail before restoring
    // the Overview dashboard; otherwise both layouts remain mounted together.
    const wasSensorRailOpen = workspace.classList.contains("right-panel-open");
    workspace.classList.remove("right-panel-open");
    if (elements.devicePanel.classList.contains("is-open")) {
      setDevicePanelOpen(false);
      setDashboardPanelsVisible(true);
    } else {
      setDashboardPanelsVisible(wasSensorRailOpen || !(isCurrentView && !isCollapsed));
    }
    setActivePlatformView("overview");
  } else if (view === "sensors") {
    const opening = !workspace.classList.contains("right-panel-open");
    if (opening) {
      const overviewButton = document.querySelector('[data-view="overview"]');
      state.iotOpenedFromOverview = Boolean(overviewButton?.classList.contains("active"))
        && !workspace.classList.contains("dashboard-collapsed");
    }
    if (elements.devicePanel.classList.contains("is-open")) setDevicePanelOpen(false);
    workspace.classList.toggle("right-panel-open", opening);
    setDashboardPanelsVisible(opening ? false : state.iotOpenedFromOverview);
    setActivePlatformView(opening ? "sensors" : state.iotOpenedFromOverview ? "overview" : null);
  } else if (view === "ai") {
    setDevicePanelOpen(false);
    setDashboardPanelsVisible(true);
    document.querySelector(".dt-ai-card")?.scrollIntoView({ block: "nearest" });
  } else if (view === "alerts") {
    setDevicePanelOpen(false);
    setDashboardPanelsVisible(true);
    document.querySelector(".dt-alert-card")?.scrollIntoView({ block: "nearest" });
  }
  if (view !== "overview" && view !== "sensors") {
    setActivePlatformView(view);
  }
  scheduleSensorMarkerSync(320);
}

elements.viewButtons.forEach((button) => button.addEventListener("click", () => setPlatformView(button.dataset.view)));
elements.devicePanelClose.addEventListener("click", () => setDevicePanelOpen(false));
elements.overviewRailClose.addEventListener("click", () => {
  elements.wrap.closest(".dt-workspace").classList.remove("right-panel-open");
  setDevicePanelOpen(false);
  setDashboardPanelsVisible(state.iotOpenedFromOverview);
  setActivePlatformView(state.iotOpenedFromOverview ? "overview" : null);
});
document.querySelector("[data-action='reset']")?.addEventListener("click", () => fitCameraToModel(true));
elements.historyRangeButtons.forEach((button) => button.addEventListener("click", () => {
  state.historyRange = button.dataset.historyRange;
  elements.historyRangeButtons.forEach((item) => item.classList.toggle("active", item === button));
  elements.customHoursControl.classList.remove("active");
  renderSelectedDevice();
}));
function applyCustomHours() {
  const value = Math.round(Number(elements.customHoursInput.value));
  state.customHours = Math.max(1, Math.min(720, Number.isFinite(value) ? value : 6));
  elements.customHoursInput.value = String(state.customHours);
  if (state.historyRange === "custom") renderSelectedDevice();
}
elements.customHoursInput.addEventListener("focus", () => {
  state.historyRange = "custom";
  elements.historyRangeButtons.forEach((item) => item.classList.remove("active"));
  elements.customHoursControl.classList.add("active");
  renderSelectedDevice();
});
elements.customHoursInput.addEventListener("change", applyCustomHours);
elements.customHoursInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    applyCustomHours();
    elements.customHoursInput.blur();
  }
});
elements.equipmentSearch.addEventListener("input", () => {
  state.equipmentQuery = elements.equipmentSearch.value;
  renderDeviceList();
});
elements.assetViewButtons.forEach((button) => button.addEventListener("click", () => {
  state.assetView = button.dataset.assetView;
  state.equipmentQuery = "";
  elements.equipmentSearch.value = "";
  elements.assetViewButtons.forEach((item) => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
  });
  renderDeviceList();
}));
elements.clock.addEventListener("dblclick", (event) => {
  event.preventDefault();
  state.debugMockData = !state.debugMockData;
  state.renderedDebugMockData = null;
  try { sessionStorage.setItem(DEBUG_MOCK_STORAGE_KEY, String(state.debugMockData)); } catch { /* Session storage is optional. */ }
  renderUI();
  console.info(`[ZB202 debug] Virtual dashboard data ${state.debugMockData ? "enabled" : "disabled"}.`);
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.devicePanel.classList.contains("is-open")) setDevicePanelOpen(false);
});
elements.resetViewButton?.addEventListener("click", () => fitCameraToModel(true));
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
  resolveMobileMarkerCollisions();
  requestAnimationFrame(animate);
}

applyTheme(activeTheme);
applyLanguage(activeLang);
resizeRenderer();
loadModel();
animate();
updateMockData();
window.setInterval(updateMockData, 2000);
