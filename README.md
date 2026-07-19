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

## 当前方案评估

### 1. 技术路径

当前采用“轻量 Web 数字孪生 PoC”路线：以 Revit/FBX 模型提供空间载体，在浏览器端通过 Vite 构建、Three.js/WebGL 渲染，并用 BIM 构件 ID 或世界坐标关联设备。设备列表、指标、趋势和故障状态目前由前端 Mock 数据驱动。

计划中的生产数据链路为：传感器或 BA 系统通过 MQTT 上报，后端按 DevEUI 完成采集与 payload 解码，将实时值、历史数据和告警写入数据库，再通过 HTTP API 或 WebSocket 提供给前端。前端负责 3D 定位、状态叠加和交互展示，不直接连接 MQTT Broker。

这条路线适合先验证设备监控、空间定位和故障展示的业务价值；若后续更重视网页加载性能，可将 FBX 预处理为 GLB/glTF；若必须保留完整 BIM 属性和构件查询能力，则需进一步评估 IFC/Web BIM 路线。

### 2. 优点

- **原型交付快**：技术栈较小，无需部署 Unity 或完整 BIM 平台，静态构建即可通过 GitHub Pages 演示。
- **Web 使用门槛低**：无需安装客户端，桌面浏览器可直接访问，便于评审、分享和迭代。
- **业务与模型相对解耦**：3D 模型负责空间表达，设备数据以 `deviceId`、DevEUI 和绑定信息管理，后续可替换 Mock 数据而不必重写场景。
- **定位方式灵活**：同时支持 BIM 构件 ID 和空间坐标，可覆盖已有 BIM 构件及未建模传感器。
- **交互链路已可验证**：房间视图、设备总览、设备详情、双语、故障模拟和点位校准已组成完整演示闭环。

### 3. 难点与缺陷

- **尚未形成真实数字孪生闭环**：当前数据、趋势和告警均为 Mock，MQTT collector、解码、数据库、API/WebSocket、断线重连和数据时效性监控仍待实现。
- **FBX 不适合作为长期 Web 交付格式**：文件体积、加载速度、材质优化和分层加载能力有限，也缺少标准化压缩与流式加载能力；模型增大后性能风险会明显上升。
- **BIM 语义保留不足**：FBX 对 Revit 属性、系统关系和稳定构件标识的保留有限，依赖对象名称或手工坐标的绑定容易在模型重新导出后失效。
- **模型管线缺失**：RVT/FBX 尚无固定的清理、坐标统一、轻量化、版本管理和绑定回归检查流程，模型更新可能造成点位漂移或构件 ID 变化。
- **前端架构仍是 PoC 级别**：设备数据和部分界面逻辑存在重复定义，缺少统一状态层、接口契约校验、自动化测试、权限控制和可观测性，规模扩大后维护成本会增加。
- **运行环境受限**：Three.js 依赖 WebGL 和终端 GPU；低性能设备、大模型或大量实时标签可能出现首屏加载慢、掉帧和内存占用偏高。
- **生产安全能力未覆盖**：Broker 凭证、API 鉴权、设备权限、审计、数据留存和告警确认机制尚未纳入当前实现；下行控制也暂不具备可安全启用的条件。

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
