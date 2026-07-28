import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SOURCE_URL = "https://air4thai.pcd.go.th/services/getNewAQI_JSON.php";
const outputPath = resolve(process.env.OUTPUT_PATH || "data/air4thai-latest.json");

function numberOrNull(value, { min = 0, max = 10000 } = {}) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function clean(value, maxLength = 240) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function observedAt(last) {
  const date = clean(last?.date, 10);
  const time = clean(last?.time, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return `${date}T${time}:00+07:00`;
}

function normalizeStation(station) {
  const last = station?.AQILast || {};
  return {
    station_id: clean(station?.stationID, 32),
    name_th: clean(station?.nameTH),
    name_en: clean(station?.nameEN),
    area_th: clean(station?.areaTH),
    area_en: clean(station?.areaEN),
    latitude: numberOrNull(station?.lat, { min: -90, max: 90 }),
    longitude: numberOrNull(station?.long, { min: -180, max: 180 }),
    observed_at: observedAt(last),
    pm25: numberOrNull(last?.PM25?.value, { max: 1000 }),
    pm10: numberOrNull(last?.PM10?.value, { max: 2000 }),
    aqi: numberOrNull(last?.AQI?.aqi, { max: 1000 }),
    color_id: numberOrNull(last?.AQI?.color_id, { max: 10 })
  };
}

let payload;
if (process.env.AIR4THAI_INPUT) {
  payload = JSON.parse(await readFile(resolve(process.env.AIR4THAI_INPUT), "utf8"));
} else {
  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": "LungLens-AirQuality-Snapshot/1.0" },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`Air4Thai returned HTTP ${response.status}`);
  payload = await response.json();
}
if (!Array.isArray(payload?.stations) || payload.stations.length < 100) {
  throw new Error("Air4Thai payload did not contain the expected station set");
}

const stations = payload.stations
  .map(normalizeStation)
  .filter(station => station.station_id && station.name_th && station.area_th);

if (stations.length < 100 || stations.filter(station => station.pm25 != null).length < 40) {
  throw new Error("Air4Thai payload failed completeness validation");
}

const snapshot = {
  schema_version: 1,
  source: "Air4Thai — Thailand Pollution Control Department",
  source_url: SOURCE_URL,
  fetched_at: new Date().toISOString(),
  station_count: stations.length,
  stations
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Wrote ${stations.length} validated Air4Thai stations to ${outputPath}`);
