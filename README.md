# ZB202 Web Digital Twin

[中文](README.md) | [English](README.en.md)

**在线演示：[打开 ZB202 Web Digital Twin](https://lyuml.github.io/ZB202_DT/)**

ZB202 实验室设备监控的轻量 Web 数字孪生 PoC，采用 Vite 多页面前端 + Three.js/WebGL + IFC/That Open Fragments BIM 模型。

## 技术路径

### 当前实现

```mermaid
flowchart LR
  RVT["Revit 源模型<br/>RVT"] --> IFC["开放 BIM 源模型<br/>IFC"]
  IFC --> FRAG["浏览器运行模型<br/>That Open Fragments"]
  FRAG --> VITE["Vite<br/>模块与资源构建"]
  VITE --> THREE["Three.js / WebGL<br/>Fragments 渲染"]
  MOCK["前端 Mock 数据<br/>设备、指标、趋势、故障"] --> UI["Web UI<br/>总览 / 详情 / 房间视图"]
  THREE --> BIND["设备绑定<br/>BIM 构件 ID / 世界坐标"]
  BIND --> UI
```

- **模型链路**：`models/ifc/` 保存正式的 Lab Architecture 与 Lab MEP IFC；两者预转换为独立 `.frag` 后在同一房间视图中叠加渲染，并可分别控制可见性。
- **设备绑定**：BIM 设备使用 IFC `GlobalId` 稳定绑定；未建模传感器可继续使用世界坐标 marker。
- **数据状态**：设备清单、趋势、告警和故障模拟目前均来自前端 Mock 数据；当当前 Fragments 模型未扫描到受支持的 IFC 设备时，房间视图会显示 3 个明确标注的 AM-103 Mock 传感器点位。真实 MQTT、长期历史数据、BMS/AHU 与 AI 模块尚未接入。
- **页面形态**：`overview.html` 管理设备总览与全局语言/主题；`device.html` 展示单台设备；`twin.html` 提供 3D 房间、右侧 Site Overview/IoT Sensors List/BMS 概览、底部功能导航，以及选中传感器后出现的左侧数据与趋势面板。

### 计划中的真实数据链路

```mermaid
flowchart LR
  DEVICE["Milesight / BA 设备"] --> MQTT["MQTT Broker"]
  MQTT --> COLLECTOR["采集、解码<br/>DevEUI 匹配"]
  COLLECTOR --> DB["时序 / 业务数据库"]
  DB --> API["HTTP API / WebSocket"]
  API --> WEB["ZB202 Web 前端"]
```

该链路仍是下一阶段计划。前端不会直接连接 MQTT；采集服务负责解码、设备映射与入库，前端只通过 API 或 WebSocket 读取业务数据。

## 文件夹结构

```text
ZB202_DT/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml       # GitHub Pages 构建与部署
├── docs/
│   ├── architecture/
│   │   └── technical-routes.mmd   # 技术路线比较图
│   ├── integrations/
│   │   └── mqtt-interface-notes.txt
│   └── quality/
│       └── design-qa.md           # 设计 QA 归档
├── dvc/
│   ├── zb202_device_backup.csv    # 设备母表备份
│   └── zb202_device_backup.xlsx
├── models/
│   ├── ifc/                       # IFC BIM 源模型与来源说明
│   │   ├── Lab archi.ifc
│   │   └── Lab mep.ifc
│   └── rvt/                       # Revit 母模型
│       ├── Lab Architecture Model.rvt
│       └── Lab MEP Model.rvt
├── web/
│   ├── index.html                 # 根入口
│   ├── overview.html              # 设备总览
│   ├── device.html                # 设备详情
│   ├── twin.html                  # Three.js 房间视图
│   ├── public/models/fragments/   # 建筑与 MEP 浏览器运行模型
│   └── src/
│       ├── dashboard/
│       │   ├── app.js             # 总览与详情逻辑
│       │   └── devices.js         # 前端设备数据
│       ├── shared/
│       │   ├── styles.css         # 共享布局与组件样式
│       │   └── theme.css          # 全局日间/夜间主题
│       └── twin/
│           ├── app.js             # Three.js、Fragments 与设备交互
│           └── styles.css         # 房间视图样式
├── package.json                   # npm 脚本与依赖
├── package-lock.json              # 锁定依赖版本
├── vite.config.js                 # 多页面构建配置
├── start-zb202.bat                # Windows 一键启动
├── README.md
└── README.en.md
```

`node_modules/` 和 `dist/` 是本地安装／构建产物，不属于源码结构；它们已被 Git 忽略。
