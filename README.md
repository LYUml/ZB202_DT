# ZB202 Web Digital Twin

[中文](README.md) | [English](README.en.md)

面向 ZB202 实验室设备监控的 Web 数字孪生概念验证。项目以 Vite、Three.js 和 FBX 为核心，展示房间模型、设备空间定位、模拟实时数据、故障状态与设备档案。

> 当前为前端 PoC。设备数据均为 Mock，尚未连接真实 MQTT、数据库或后端 API。

在线演示：[https://lyuml.github.io/ZB202_DT/](https://lyuml.github.io/ZB202_DT/)

## 功能概览

- 加载 `ZN1001v2.fbx`，显示 145 个实体构件，并过滤 61 条辅助中心线。
- 支持旋转、平移、缩放、视角重置和模型加载状态提示。
- 使用 BIM 构件 ID 或空间坐标将设备绑定到模型。
- 展示设备指标、趋势、更新时间、故障模拟和状态恢复。
- 3D 视图采用沉浸式全屏工作区；设备信息通过右侧滑入面板显示。
- 支持中文和英文；房间视图继承设备总览页选择的语言。
- 提供设备总览、设备详情和点位坐标校准工具。

## 快速开始

### 环境要求

- Node.js `20.19+` 或 `22.12+`
- npm

### 开发模式

```powershell
npm install
npm run dev
```

打开 [http://localhost:5173/](http://localhost:5173/)。根地址会自动进入房间模型页面。

### 生产构建

```powershell
npm run build
npm run preview
```

预览地址通常为 [http://localhost:4173/](http://localhost:4173/)。生产文件输出到 `dist/`；构建只包含代码实际引用的 FBX，不包含 RVT、设备备份或内部文档。

### GitHub Pages 部署

推送到 `main` 分支后，GitHub Actions 会使用 Node.js 24 执行 `npm ci` 和 `npm run build`，并将 `dist/` 自动发布到 GitHub Pages。`dist/` 不提交到仓库。

## 页面入口

| 页面 | 地址 | 用途 |
| --- | --- | --- |
| 房间视图 | `/twin.html` | Three.js 模型、设备定位、实时状态与故障演示 |
| 设备总览 | `/overview.html` | 9 台登记设备的卡片和表格视图 |
| 设备详情 | `/device.html?deviceId=AM103_07` | 单台设备档案与指标 |

语言由 `?lang=zh` 或 `?lang=en` 控制，并保存到浏览器。设备总览进入房间视图时会自动传递当前语言。

## 房间视图操作

- 左键拖动：旋转模型。
- 右键拖动：平移视角。
- 滚轮：缩放。
- **设备面板**：从右侧打开实时设备信息；面板出现时模型同步向左平移。
- **校准点位**：点击模型表面取得世界坐标，用于未建入 BIM 的传感器。
- **重置视角**：恢复默认模型视角。

## 模型与设备绑定

当前页面仅加载：

| 模型 | 实体构件 | 用途 |
| --- | ---: | --- |
| `models/fbx/ZN1001v2.fbx` | 145 | 当前房间视图使用的原始导出模型 |

项目演示两种绑定方式：

1. **BIM 构件绑定**：通过 FBX 对象名称和 Revit ID `[738100]` 定位风机盘管。
2. **空间坐标绑定**：通过模型世界坐标放置 `AM103-DEMO` marker。

`models/fbx/ZN1001v2-3dnew.fbx` 仅作为模型源文件保留，不进入当前 Web 构建。`models/rvt/` 保存 Revit 源模型，浏览器不会直接加载 RVT。

## 项目结构

```text
ZB202_DT/
├── web/
│   ├── index.html              # 根入口
│   ├── overview.html           # 设备总览
│   ├── device.html             # 设备详情
│   ├── twin.html               # 沉浸式房间视图
│   └── src/
│       ├── app.js              # 总览、详情与语言逻辑
│       ├── twin.js             # Three.js 场景与设备联动
│       ├── styles.css          # 全站样式
│       └── data/devices.js     # Mock 设备数据
├── models/
│   ├── fbx/                    # Web 模型与保留的 FBX 源文件
│   └── rvt/                    # Revit 源模型
├── dvc/                        # 设备清单 CSV/XLSX 备份
├── docs/
│   ├── architecture/           # 技术路线
│   └── integrations/           # MQTT 接口说明
├── package.json
├── vite.config.js
├── README.md
└── README.en.md
```

## 数据接入路线

`dvc/` 保存 9 台设备的名称、型号、类型、DevEUI、配置文件和载荷解码器。真实数据接入时，应通过 DevEUI 将 MQTT 上行消息匹配到设备记录。

```text
Milesight sensors / BA system
→ MQTT uplink collector
→ payload decoder + DevEUI matching
→ InfluxDB / database
→ HTTP API or WebSocket
→ Web Digital Twin
```

前端不应直接连接 MQTT。计划由后端提供：

```text
GET /api/devices
GET /api/latest
GET /api/history?deviceId=AM103_07&metric=temperature&range=24h
GET /api/alerts
```

MQTT topic 和连接说明位于 `docs/integrations/mqtt-interface-notes.txt`。

## 当前限制与下一步

- 实时数值、趋势、状态和告警仍为 Mock。
- FBX 与 ZB202 Revit 源模型尚未形成正式转换和版本管理流程。
- 设备坐标仍需结合现场位置或 Revit 模型校准。
- MQTT collector、payload decoder、数据库和后端 API 尚未实现。
- 当前没有设备下行控制能力。

建议下一步采集各设备型号的真实 MQTT 上行样本，建立 DevEUI 匹配与解码服务，再通过统一 API 或 WebSocket 接入现有前端。
