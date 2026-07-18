import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import primaryModelUrl from "../../models/fbx/ZN1001v2-3dnew.fbx?url";
import legacyModelUrl from "../../models/fbx/ZN1001v2.fbx?url";

const MODELS = {
  "3dnew": {
    name: "ZN1001v2-3dnew.fbx",
    url: primaryModelUrl,
    label: "ZN1001 · 三维视图",
  },
  legacy: {
    name: "ZN1001v2.fbx",
    url: legacyModelUrl,
    label: "ZN1001 · 原始导出",
  },
};

const STATUS = {
  normal: { label: "正常", color: 0x20a464 },
  warning: { label: "注意", color: 0xe99a2c },
  fault: { label: "故障", color: 0xe34d59 },
  unavailable: { label: "未绑定", color: 0x8b94a6 },
};

const DEVICES = [
  {
    id: "FCU-738100",
    name: "风机盘管 FCU-01",
    subtitle: "BIM 构件",
    binding: {
      kind: "object",
      exactToken: "[738100]",
      fallbackTerms: ["带回风箱的风机盘管机组", "风机盘管"],
    },
    metrics: [
      { key: "supplyTemperature", label: "送风温度", unit: "°C", value: 18.4, variance: 0.22 },
      { key: "fanPower", label: "风机功率", unit: "W", value: 328, variance: 5.5 },
      { key: "airflow", label: "送风量", unit: "L/s", value: 186, variance: 2.2 },
    ],
  },
  {
    id: "AM103-DEMO",
    name: "环境传感器 AM103",
    subtitle: "空间点位",
    binding: { kind: "marker", normalizedPosition: [0.58, 0.52, 0.56] },
    metrics: [
      { key: "temperature", label: "室内温度", unit: "°C", value: 24.6, variance: 0.14 },
      { key: "humidity", label: "相对湿度", unit: "%", value: 61, variance: 0.45 },
      { key: "co2", label: "CO₂", unit: "ppm", value: 760, variance: 8 },
    ],
  },
];

const elements = {
  wrap: document.getElementById("viewer-wrap"),
  canvas: document.getElementById("twin-canvas"),
  modelSelect: document.getElementById("model-select"),
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
  meshCount: document.getElementById("mesh-count"),
  deviceList: document.getElementById("device-list"),
  bindingLabel: document.getElementById("binding-label"),
  deviceName: document.getElementById("device-name"),
  deviceId: document.getElementById("device-id"),
  statusBadge: document.getElementById("status-badge"),
  metricGrid: document.getElementById("metric-grid"),
  trendLabel: document.getElementById("trend-label"),
  trendValue: document.getElementById("trend-value"),
  trendLine: document.getElementById("trend-line"),
  trendArea: document.getElementById("trend-area"),
  updatedAt: document.getElementById("updated-at"),
  faultToggle: document.getElementById("fault-toggle"),
  faultButtonText: document.getElementById("fault-button-text"),
  clock: document.getElementById("dt-clock"),
};

const state = {
  modelKey: "3dnew",
  model: null,
  modelBox: new THREE.Box3(),
  modelCenter: new THREE.Vector3(),
  modelRadius: 1,
  selectedDeviceId: DEVICES[0].id,
  calibrating: false,
  boundObjects: new Map(),
  meshDeviceIds: new WeakMap(),
  markerObjects: new Map(),
  snapshots: new Map(),
  loadRequest: 0,
};

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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe6ef);
scene.fog = new THREE.Fog(0xdfe6ef, 180, 920);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 5000);
camera.position.set(8, 7, 10);

const renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = "dt-label-layer";
elements.wrap.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, elements.canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.screenSpacePanning = true;
controls.maxPolarAngle = Math.PI * 0.93;

scene.add(new THREE.HemisphereLight(0xf8fbff, 0x5a6677, 1.35));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(12, 22, 16);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xb8d7ff, 0.65);
fillLight.position.set(-16, 8, -10);
scene.add(fillLight);

const modelGroup = new THREE.Group();
modelGroup.name = "loaded-model";
scene.add(modelGroup);

const helpersGroup = new THREE.Group();
helpersGroup.name = "digital-twin-overlays";
scene.add(helpersGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPosition = null;
let gridHelper = null;

function formatNumber(value) {
  if (Math.abs(value) >= 100) return Math.round(value).toLocaleString("zh-CN");
  return value.toFixed(1);
}

function statusFor(deviceId) {
  return state.snapshots.get(deviceId)?.status || "unavailable";
}

function showLoading(model, percent = 0, meta = "读取模型文件…") {
  elements.error.classList.add("hidden");
  elements.loading.classList.remove("hidden");
  elements.loadingTitle.textContent = `正在加载 ${model.label}`;
  elements.loadingProgress.style.width = `${Math.max(3, percent)}%`;
  elements.loadingMeta.textContent = meta;
}

function showError(message) {
  elements.loading.classList.add("hidden");
  elements.error.classList.remove("hidden");
  elements.errorMessage.textContent = message;
}

function disposeObject(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
}

function clearCurrentModel() {
  if (state.model) {
    modelGroup.remove(state.model);
    disposeObject(state.model);
    state.model = null;
  }
  helpersGroup.clear();
  state.boundObjects.clear();
  state.meshDeviceIds = new WeakMap();
  state.markerObjects.clear();
  if (gridHelper) {
    scene.remove(gridHelper);
    gridHelper.geometry.dispose();
    gridHelper.material.dispose();
    gridHelper = null;
  }
}

function prepareMaterials(root) {
  let meshCount = 0;
  const exportedHelperLines = [];
  root.traverse((object) => {
    if ((object.isLine || object.isLineSegments) && !object.isMesh) {
      exportedHelperLines.push(object);
      return;
    }
    if (!object.isMesh) return;
    meshCount += 1;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const clones = materials.map((material) => {
      const clone = material?.clone() || new THREE.MeshStandardMaterial({ color: 0xcbd3dd });
      clone.side = THREE.DoubleSide;
      clone.transparent = Boolean(clone.transparent);
      if (clone.color && clone.color.r > 0.82 && clone.color.g > 0.82 && clone.color.b > 0.82) {
        clone.color.set(0xb7c2cf);
      }
      clone.userData.baseColor = clone.color?.clone();
      clone.userData.baseEmissive = clone.emissive?.clone();
      clone.userData.baseEmissiveIntensity = clone.emissiveIntensity || 0;
      return clone;
    });
    object.material = Array.isArray(object.material) ? clones : clones[0];
  });

  exportedHelperLines.forEach((line) => {
    line.parent?.remove(line);
    line.geometry?.dispose();
    const materials = Array.isArray(line.material) ? line.material : [line.material];
    materials.filter(Boolean).forEach((material) => material.dispose());
  });
  return meshCount;
}

function fitCameraToModel(animate = false) {
  if (!state.model) return;
  const center = state.modelCenter.clone();
  const radius = Math.max(state.modelRadius, 0.1);
  const direction = new THREE.Vector3(1.05, 0.72, 1.05).normalize();
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

function animateCamera(destination, target, duration = 650) {
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  const startedAt = performance.now();

  function step(now) {
    const raw = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - raw, 3);
    camera.position.lerpVectors(startPosition, destination, eased);
    controls.target.lerpVectors(startTarget, target, eased);
    if (raw < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function findBindingObject(device) {
  if (!state.model || device.binding.kind !== "object") return null;
  const allObjects = [];
  state.model.traverse((object) => allObjects.push(object));

  const exact = allObjects.find((object) => object.name?.includes(device.binding.exactToken));
  if (exact) return exact;

  for (const term of device.binding.fallbackTerms) {
    const match = allObjects.find((object) => object.name?.includes(term));
    if (match) return match;
  }
  return null;
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

function bindDevices() {
  for (const device of DEVICES) {
    if (device.binding.kind === "marker") {
      createMarker(device);
      continue;
    }

    const target = findBindingObject(device);
    if (!target) continue;
    state.boundObjects.set(device.id, target);
    target.traverse((object) => {
      if (object.isMesh) state.meshDeviceIds.set(object, device.id);
    });
  }
  updateAllVisualStates();
}

function restoreMaterial(material) {
  if (material.color && material.userData.baseColor) material.color.copy(material.userData.baseColor);
  if (material.emissive) {
    material.emissive.copy(material.userData.baseEmissive || new THREE.Color(0x000000));
    material.emissiveIntensity = material.userData.baseEmissiveIntensity || 0;
  }
  material.opacity = 1;
}

function styleBoundObject(deviceId) {
  const target = state.boundObjects.get(deviceId);
  if (!target) return;
  const selected = state.selectedDeviceId === deviceId;
  const status = statusFor(deviceId);
  const statusColor = new THREE.Color(STATUS[status].color);

  target.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      restoreMaterial(material);
      if (material.emissive && (selected || status !== "normal")) {
        material.emissive.copy(status === "normal" ? new THREE.Color(0x2f7df4) : statusColor);
        material.emissiveIntensity = status === "fault" ? 0.75 : 0.38;
      }
      if (status === "fault" && material.color) material.color.lerp(statusColor, 0.42);
    });
  });
}

function updateAllVisualStates() {
  for (const device of DEVICES) {
    styleBoundObject(device.id);
    const marker = state.markerObjects.get(device.id);
    if (marker) {
      marker.element.className = `dt-model-marker ${statusFor(device.id)}${state.selectedDeviceId === device.id ? " selected" : ""}`;
    }
  }
}

function focusDevice(device) {
  let box = null;
  const target = state.boundObjects.get(device.id);
  const marker = state.markerObjects.get(device.id);

  if (target) box = new THREE.Box3().setFromObject(target);
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

function renderDeviceList() {
  elements.deviceList.innerHTML = "";
  for (const device of DEVICES) {
    const snapshot = state.snapshots.get(device.id);
    const bound = device.binding.kind === "marker" || state.boundObjects.has(device.id);
    const status = bound ? snapshot.status : "unavailable";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `dt-device-item ${status}${state.selectedDeviceId === device.id ? " selected" : ""}`;
    button.innerHTML = `
      <span class="dt-device-status"></span>
      <span class="dt-device-copy">
        <strong>${device.name}</strong>
        <small>${device.subtitle} · ${bound ? STATUS[snapshot.status].label : "当前模型无绑定"}</small>
      </span>
      <span class="dt-device-chevron">›</span>
    `;
    button.addEventListener("click", () => selectDevice(device.id, true));
    elements.deviceList.appendChild(button);
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
  const device = DEVICES.find((item) => item.id === state.selectedDeviceId) || DEVICES[0];
  const snapshot = state.snapshots.get(device.id);
  const bound = device.binding.kind === "marker" || state.boundObjects.has(device.id);
  const displayStatus = bound ? snapshot.status : "unavailable";

  elements.bindingLabel.textContent = device.binding.kind === "object" ? "BIM 构件绑定" : "空间坐标绑定";
  elements.deviceName.textContent = device.name;
  elements.deviceId.textContent = device.id;
  elements.statusBadge.textContent = STATUS[displayStatus].label;
  elements.statusBadge.className = `dt-status-badge ${displayStatus}`;

  elements.metricGrid.innerHTML = device.metrics.map((metric) => `
    <div class="dt-metric">
      <span>${metric.label}</span>
      <strong>${formatNumber(snapshot.values[metric.key])}<small>${metric.unit}</small></strong>
    </div>
  `).join("");

  const primaryMetric = device.metrics[0];
  const trend = snapshot.trends[primaryMetric.key];
  const paths = sparklinePath(trend);
  elements.trendLabel.textContent = primaryMetric.label;
  elements.trendValue.textContent = `${formatNumber(snapshot.values[primaryMetric.key])} ${primaryMetric.unit}`;
  elements.trendLine.setAttribute("d", paths.line);
  elements.trendArea.setAttribute("d", paths.area);
  elements.updatedAt.textContent = snapshot.updatedAt.toLocaleTimeString("zh-CN", { hour12: false });
  elements.faultButtonText.textContent = snapshot.status === "fault" ? "恢复设备正常" : "模拟设备故障";
  elements.faultToggle.classList.toggle("is-recovery", snapshot.status === "fault");
  elements.faultToggle.disabled = !bound;
}

function renderUI() {
  renderDeviceList();
  renderSelectedDevice();
  updateAllVisualStates();
}

function selectDevice(deviceId, focus = false) {
  state.selectedDeviceId = deviceId;
  renderUI();
  if (focus) {
    const device = DEVICES.find((item) => item.id === deviceId);
    if (device) focusDevice(device);
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
  elements.clock.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function addGrid() {
  const size = state.modelBox.getSize(new THREE.Vector3());
  const gridSize = Math.max(size.x, size.z) * 1.35;
  const divisions = 24;
  gridHelper = new THREE.GridHelper(gridSize, divisions, 0xb8c4d4, 0xd4dce7);
  gridHelper.position.set(state.modelCenter.x, state.modelBox.min.y - Math.max(state.modelRadius * 0.006, 0.01), state.modelCenter.z);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.35;
  scene.add(gridHelper);
}

function loadModel(modelKey = state.modelKey) {
  const model = MODELS[modelKey];
  if (!model) return;
  const requestId = ++state.loadRequest;
  state.modelKey = modelKey;
  state.selectedDeviceId = DEVICES[0].id;
  clearCurrentModel();
  showLoading(model);
  elements.modelName.textContent = model.name;
  elements.meshCount.textContent = "0";

  const loader = new FBXLoader();
  loader.load(
    model.url,
    (root) => {
      if (requestId !== state.loadRequest) {
        disposeObject(root);
        return;
      }

      root.name = model.name;
      const meshCount = prepareMaterials(root);
      state.model = root;
      modelGroup.add(root);
      state.modelBox.setFromObject(root);
      state.modelBox.getCenter(state.modelCenter);
      state.modelRadius = Math.max(state.modelBox.getBoundingSphere(new THREE.Sphere()).radius, 1);
      addGrid();
      fitCameraToModel(false);
      bindDevices();
      elements.meshCount.textContent = meshCount.toLocaleString("zh-CN");
      elements.loadingProgress.style.width = "100%";
      elements.loadingMeta.textContent = `${meshCount} 个构件 · 模型准备完成`;
      window.setTimeout(() => elements.loading.classList.add("hidden"), 320);
      renderUI();
    },
    (event) => {
      if (requestId !== state.loadRequest) return;
      const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 18;
      const loadedMb = (event.loaded / 1024 / 1024).toFixed(1);
      const totalText = event.total ? ` / ${(event.total / 1024 / 1024).toFixed(1)} MB` : " MB";
      showLoading(model, percent, `${loadedMb}${totalText} · ${percent}%`);
    },
    (error) => {
      if (requestId !== state.loadRequest) return;
      console.error("FBX loading failed", error);
      showError(`无法读取 ${model.name}。请通过 npm run dev 启动项目，并确认 fbx 文件夹中存在该文件。`);
      renderUI();
    },
  );
}

function setPointerFromEvent(event) {
  const rect = elements.canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleCanvasSelection(event) {
  if (!state.model) return;
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const meshes = [];
  state.model.traverse((object) => {
    if (object.isMesh) meshes.push(object);
  });
  const intersections = raycaster.intersectObjects(meshes, false);
  if (!intersections.length) return;

  const intersection = intersections[0];
  if (state.calibrating) {
    const point = intersection.point;
    const value = `[${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)}]`;
    elements.coordinateValue.textContent = value;
    elements.coordinateToast.classList.remove("hidden");
    state.calibrating = false;
    elements.calibrateButton.classList.remove("active");
    elements.wrap.classList.remove("is-calibrating");
    return;
  }

  let object = intersection.object;
  while (object && object !== state.model) {
    const deviceId = state.meshDeviceIds.get(object);
    if (deviceId) {
      selectDevice(deviceId, true);
      return;
    }
    object = object.parent;
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

elements.modelSelect.addEventListener("change", (event) => loadModel(event.target.value));
elements.retryButton.addEventListener("click", () => loadModel(state.modelKey));
elements.resetViewButton.addEventListener("click", () => fitCameraToModel(true));
elements.faultToggle.addEventListener("click", () => {
  const snapshot = state.snapshots.get(state.selectedDeviceId);
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
  elements.copyCoordinateButton.textContent = "已复制";
  window.setTimeout(() => { elements.copyCoordinateButton.textContent = "复制"; }, 1200);
});
elements.canvas.addEventListener("pointerdown", (event) => {
  pointerDownPosition = { x: event.clientX, y: event.clientY };
});
elements.canvas.addEventListener("pointerup", (event) => {
  if (!pointerDownPosition) return;
  const distance = Math.hypot(event.clientX - pointerDownPosition.x, event.clientY - pointerDownPosition.y);
  pointerDownPosition = null;
  if (distance < 5) handleCanvasSelection(event);
});

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(elements.wrap);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(animate);
}

renderUI();
resizeRenderer();
loadModel("3dnew");
animate();
updateMockData();
window.setInterval(updateMockData, 2000);
