# ZB202 Digital Twin

ZB202 实验室环境监测数字孪生。前端展示 BIM 模型和传感器数据，实时数据由本地 InfluxDB 桥接服务提供。

## 启动

需要 Node.js 20.19+。在项目目录运行：

```sh
npm install
cp .env.example .env
npm run dev
```

在 `.env` 中填入 InfluxDB Token 等连接信息。Windows 可双击 `start-zb202.bat`，macOS 可双击 `start-zb202.command`。

打开 `http://127.0.0.1:5173/overview.html` 查看总览，或打开 `http://127.0.0.1:5173/twin.html` 查看三维孪生。

## 常用命令

- `npm run build`：构建静态页面
- `npm run test:bridge`：检查数据桥接
- `npm run bim:convert`：将 IFC 转为 Fragments

## 项目结构

```text
ZB202_DT/
├── .github/workflows/            # GitHub Pages 自动部署
├── docs/architecture/            # 架构说明与技术路线
├── dvc/                          # 设备清单备份（CSV / XLSX）
├── models/
│   ├── ifc/                      # IFC 源模型
│   └── rvt/                      # Revit 源模型
├── scripts/
│   ├── influxdb-bridge.mjs       # InfluxDB → WebSocket 桥接
│   ├── bridge-smoke-test.mjs     # 数据链路测试
│   └── ifc-to-fragments.mjs      # IFC 转 Fragments
├── web/
│   ├── public/models/fragments/  # 浏览器运行时模型
│   ├── src/
│   │   ├── dashboard/            # 总览页面逻辑
│   │   ├── shared/               # 共享样式与主题
│   │   └── twin/                 # 三维孪生页面逻辑
│   ├── index.html                # 默认入口
│   ├── overview.html
│   ├── device.html
│   └── twin.html
├── .env.example                  # InfluxDB 配置模板
├── package.json                  # npm 命令与依赖
├── start-zb202.bat               # Windows 一键启动
├── start-zb202.command           # macOS 双击启动
└── vite.config.js                # Vite 构建配置
```

配置文件 `.env` 仅保存在本地，不要提交真实凭据。

## 室外太阳辐射

开发桥接服务每 10 分钟采集香港天文台京士柏的 1 分钟平均总太阳辐射（W/m²），将原始香港时间转换为 UTC，写入 InfluxDB 后读回提供给前端。来源：https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_1min_solar.csv 。

Measurement 为 `hko-solar-radiation`，field 为 `solarRadiation`，station tag 为 `King's Park`。默认使用天气 bucket，可通过 `ZB202_SOLAR_INFLUX_BUCKET` 指定；天气 token 需要读写权限。超过 30 分钟的观测显示为缺失。天气数据继续供室外环境使用，但不出现在 IoT 设备列表中。
