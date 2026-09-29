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

配置文件 `.env` 仅保存在本地，不要提交真实凭据。
