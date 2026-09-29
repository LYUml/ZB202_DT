// Sensors currently installed in ZB202 and read through the InfluxDB bridge.
window.ZB202_DEVICE_DATA = [
  { id: "AM103_07", name: { en: "AM103-07 Indoor Environment Sensor" }, model: "AM103", type: { en: "3-in-1 Indoor Environment Sensor" }, devEui: "24E124725E281056", profile: "Class A / OTAA", decoder: "AM103", location: { en: "ZB202 · Monitoring Point 7" }, status: "normal", latestValues: { temperature: "23.5 °C", humidity: "69.0%", co2: "564 ppm" } },
  { id: "AM103_08", name: { en: "AM103-08 Indoor Environment Sensor" }, model: "AM103", type: { en: "3-in-1 Indoor Environment Sensor" }, devEui: "24E124725E283167", profile: "Class A / OTAA", decoder: "AM103", location: { en: "ZB202 · Monitoring Point 8" }, status: "normal", latestValues: { temperature: "23.3 °C", humidity: "69.0%", co2: "571 ppm" } },
  { id: "AM308_01", name: { en: "AM308-01 Indoor Environment Sensor" }, model: "AM308", type: { en: "8-in-1 Indoor Environment Sensor" }, devEui: "24E124707E093681", profile: "Class A / OTAA", decoder: "AM308", location: { en: "ZB202 · Monitoring Point 1" }, status: "normal", latestValues: { temperature: "23.4 °C", humidity: "69.0%", co2: "575 ppm" } },
  { id: "AM103_05", name: { en: "AM103-05 Indoor Environment Sensor" }, model: "AM103", type: { en: "3-in-1 Indoor Environment Sensor" }, devEui: "24E124725E281413", profile: "Class A / OTAA", decoder: "AM103", location: { en: "ZB202 · Monitoring Point 5" }, status: "normal", latestValues: { temperature: "23.4 °C", humidity: "69.0%", co2: "572 ppm" } },
  { id: "AM103_06", name: { en: "AM103-06 Indoor Environment Sensor" }, model: "AM103", type: { en: "3-in-1 Indoor Environment Sensor" }, devEui: "24E124725E283152", profile: "Class A / OTAA", decoder: "AM103", location: { en: "ZB202 · Monitoring Point 6" }, status: "normal", latestValues: { temperature: "23.4 °C", humidity: "69.0%", co2: "573 ppm" } },
  ...["01", "02", "03"].map((number) => ({
    id: `WS301_${number}`,
    name: { zh: `WS301-${number} 门磁传感器`, "zh-Hant": `WS301-${number} 門磁感測器`, en: `WS301-${number} Magnetic Contact Sensor` },
    model: "WS301",
    type: { zh: "门磁传感器", "zh-Hant": "門磁感測器", en: "Magnetic Contact Sensor" },
    devEui: "", profile: "InfluxDB", decoder: "WS301",
    location: { zh: "ZB202 · BIM 已匹配", "zh-Hant": "ZB202 · BIM 已匹配", en: "ZB202 · BIM matched" },
    status: "alert", latestValues: {},
  })),
  {
    id: "WS303_01",
    name: { zh: "WS303-01 水浸传感器", "zh-Hant": "WS303-01 水浸感測器", en: "WS303-01 Leak Detection Sensor" },
    model: "WS303",
    type: { zh: "水浸传感器", "zh-Hant": "水浸感測器", en: "Leak Detection Sensor" },
    devEui: "", profile: "InfluxDB", decoder: "WS303",
    location: { zh: "ZB202 · BIM 已匹配", "zh-Hant": "ZB202 · BIM 已匹配", en: "ZB202 · BIM matched" },
    status: "alert", latestValues: {},
  },
  ...[
    ...Array.from({ length: 10 }, (_, index) => `VS341-${String(index + 1).padStart(2, "0")}`),
    "WS302-02", "WS523-02", "WS523-03", "WS523-04",
  ].map((sensorId) => {
    const model = sensorId.split("-")[0];
    const type = {
      VS341: { zh: "人体存在传感器", "zh-Hant": "人體存在感測器", en: "Occupancy Sensor" },
      WS302: { zh: "噪声传感器", "zh-Hant": "噪聲感測器", en: "Noise Sensor" },
      WS523: { zh: "智能插座", "zh-Hant": "智能插座", en: "Smart Portable Socket" },
    }[model];
    return {
      id: sensorId.replace("-", "_"),
      name: { zh: `${sensorId} ${type.zh}`, "zh-Hant": `${sensorId} ${type["zh-Hant"]}`, en: `${sensorId} ${type.en}` },
      model, type, devEui: "", profile: "InfluxDB", decoder: model,
      location: { zh: "ZB202 · BIM 已匹配", "zh-Hant": "ZB202 · BIM 已匹配", en: "ZB202 · BIM matched" },
      status: "alert", latestValues: {},
    };
  }),
];
