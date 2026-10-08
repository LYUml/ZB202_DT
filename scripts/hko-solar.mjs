import { Point } from '@influxdata/influxdb-client';

export const SOLAR_URL = 'https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_1min_solar.csv';
export const SOLAR_MEASUREMENT = 'hko-solar-radiation';
export function parseSolarCsv(csv) {
  const row = csv.trim().split(/\r?\n/).map((line) => line.split(',')).find((fields) => fields[1] === "King's Park");
  if (!row || !/^\d{12}$/.test(row[0]) || row[2].trim() === '') throw new Error('Missing King’s Park solar observation');
  const value = Number(row[2]);
  if (!Number.isFinite(value) || value < 0) throw new Error('Invalid solar radiation');
  const t = row[0];
  const receivedAt = new Date(`${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}T${t.slice(8,10)}:${t.slice(10,12)}:00+08:00`).toISOString();
  return { type: 'solar-radiation', value, receivedAt, station: "King's Park", unit: 'W/m²', source: 'influxdb' };
}

export function solarPoint(observation) {
  return new Point(SOLAR_MEASUREMENT).tag('station', observation.station).tag('source', 'HKO')
    .floatField('solarRadiation', observation.value).timestamp(new Date(observation.receivedAt));
}
