export function buildSensorHistoryQuery({ bucket, measurement = '', deviceColumn = 'devEui', devEui, deviceId, hours, stop }) {
  if (!/^[A-Fa-f0-9]{16}$/.test(devEui || '') && !/^(AM103|AM308|VS341|WS301|WS302|WS303|WS523)[_-]\d{2}$/i.test(deviceId || '')) throw new Error('Invalid sensor identity');
  if (!Number.isFinite(hours) || hours < 1 || hours > 720) throw new Error('Invalid history range');
  const end = new Date(stop);
  if (!Number.isFinite(end.getTime())) throw new Error('Invalid end time');
  const start = new Date(end.getTime() - hours * 3600000).toISOString();
  const q = JSON.stringify;
  return `from(bucket: ${q(bucket)})
  |> range(start: time(v: ${q(start)}), stop: time(v: ${q(end.toISOString())}))
  ${measurement ? `|> filter(fn: (r) => r._measurement == ${q(measurement)})` : ''}
  |> filter(fn: (r) => ${devEui ? `(exists r[${q(deviceColumn)}] and (r[${q(deviceColumn)}] == ${q(devEui.toUpperCase())} or r[${q(deviceColumn)}] == ${q(devEui.toLowerCase())}))` : 'false'}${deviceId ? ` or r._measurement == ${q(deviceId.replaceAll('-', '_'))} or r._measurement == ${q(deviceId.replaceAll('_', '-'))}` : ''})
  |> sort(columns: ["_time"])`;
}
