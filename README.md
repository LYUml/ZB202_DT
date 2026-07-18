# ZB202 Web Digital Twin

ZB202 是一个面向实验室设备监控的 Web Digital Twin 技术验证项目。当前版本使用 Vite、Three.js 和 FBX 模型，验证 BIM/3D 场景加载、设备点位绑定、模拟实时数据、故障高亮和设备定位等核心流程。

## 当前状态

项目已经完成可运行的前端 PoC：

- 在浏览器中加载并切换两份 FBX 模型。
- 支持旋转、平移、缩放、重置视角和模型加载状态提示。
- 支持 BIM 构件绑定和空间 marker 两种设备绑定方式。
- 使用 Mock provider 模拟实时指标、趋势和更新时间。
- 支持设备选择、相机定位、故障模拟、状态恢复和点位坐标校准。
- 保留设备总览、设备详情和 xeokit 路线验证页面。

当前数据仍为模拟数据，尚未接入真实 MQTT、数据库或后端 API。

## 快速开始

### 环境要求

- Node.js `20.19+` 或 `22.12+`
- npm

### 安装与运行

```powershell
npm install
npm run dev
```

浏览器打开：

```text
http://localhost:5173/
```

根地址会自动进入 FBX Digital Twin 页面。

### 构建与预览

```powershell
npm run build
npm run preview
```

生产构建输出到 `dist/`。Vite 只会打包代码实际引用的 FBX，不会将 RVT、设备备份或内部文档复制到生产产物。

## 页面入口

| 页面 | 地址 | 用途 |
| --- | --- | --- |
| FBX Digital Twin | `/twin.html` | Three.js 模型浏览、设备定位、实时状态和故障演示 |
| 设备总览 | `/overview.html` | 展示 ZB202 设备目录及当前 Mock 状态 |
| 设备详情 | `/device.html?deviceId=AM103_07` | 查看单台设备信息和指标 |
| xeokit 验证 | `/xeokit.html` | 保留 XKT/BIM Viewer 集成接口 |

## 文件结构

```text
ZB202_DT/
├── web/                          # Vite 前端入口
│   ├── index.html                # 根地址跳转页
│   ├── overview.html             # 设备总览
│   ├── device.html               # 设备详情
│   ├── twin.html                 # Three.js / FBX Digital Twin
│   ├── xeokit.html               # xeokit 路线验证
│   └── src/
│       ├── app.js                # 总览与详情逻辑
│       ├── twin.js               # Three.js 场景与设备联动
│       ├── xeokit-viewer.js      # xeokit 接口逻辑
│       ├── styles.css            # 全站样式
│       └── data/devices.js       # 前端 Mock 设备数据
├── models/
│   ├── fbx/                      # 浏览器 PoC 使用的 FBX 模型
│   │   ├── ZN1001v2-3dnew.fbx
│   │   └── ZN1001v2.fbx
│   └── rvt/                      # Revit 源模型，不进入 Web 构建
│       ├── Lab Architecture Model.rvt
│       └── Lab MEP Model.rvt
├── dvc/                          # ZB202 设备清单备份
│   ├── zb202_device_backup.csv
│   └── zb202_device_backup.xlsx
├── docs/
│   ├── architecture/technical-routes.mmd
│   └── integrations/mqtt-interface-notes.txt
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## FBX Digital Twin 验证结果

| 模型 | 实体构件 | 说明 |
| --- | ---: | --- |
| `ZN1001v2-3dnew.fbx` | 207 | 默认模型，构件名称包含 Revit ID，适合 BIM 构件绑定 |
| `ZN1001v2.fbx` | 145 | 原始导出模型；加载时自动过滤 61 条辅助中心线 |

当前 PoC 演示两种绑定方式：

1. **BIM 构件绑定**：通过 FBX 对象名称和 Revit ID `[738100]` 定位风机盘管，故障时直接高亮构件。
2. **空间点位绑定**：通过模型世界坐标放置 AM103 marker，适用于没有建入 BIM 的 IoT 传感器。

`web/src/twin.js` 使用 Vite 的 `?url` 方式导入 `models/fbx/` 中的模型。新增 FBX 时，需要把文件放入该目录，并在 `MODELS` 配置中显式导入和登记。

RVT 文件仅作为 BIM 源模型保存，浏览器无法直接加载。后续如采用 xeokit，应先导出 IFC 并转换为 XKT；届时再增加 `models/xkt/` 及对应构建配置。

## 设备与数据流

`dvc/` 保存 9 台登记设备的名称、型号、类型、DevEUI、设备配置文件和载荷解码器。真实数据接入时，应以 DevEUI 将 MQTT 上行消息匹配到设备记录。

预期数据流：

```text
Milesight sensors / BA system
→ MQTT uplink collector
→ payload decoder + DevEUI matching
→ InfluxDB / database
→ HTTP API or WebSocket
→ Web Digital Twin
```

前端不应直接连接 MQTT。当前 Mock provider 未来应替换为后端 HTTP/WebSocket 数据源，保持设备绑定和 3D 渲染逻辑不变。

计划中的前端接口：

```text
GET /api/devices
GET /api/latest
GET /api/history?deviceId=AM103_07&metric=temperature&range=24h
GET /api/alerts
```

MQTT 连接和 topic 说明位于 `docs/integrations/mqtt-interface-notes.txt`。当前没有可用的设备下行控制能力，请勿调用下行接口或在前端提供控制命令。

## 当前限制与下一步

- 实时数值、趋势、状态和告警仍为 Mock。
- FBX 测试模型与 ZB202 Revit 源模型尚未形成正式转换流程。
- 设备空间坐标需要结合现场位置或 Revit 模型进一步校准。
- 尚未实现 MQTT collector、payload decoder、数据库和后端 API。
- xeokit 页面目前只验证集成外壳，尚无 XKT 模型。

建议下一步先采集各设备型号的真实 MQTT 上行样本，建立 DevEUI 匹配与解码服务，再通过统一 API/WebSocket 接入现有前端。
