const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PROVINCE_META } = require("../js/data.js");
const {
  thaiPm25Band,
  usAqiBand,
  stationMatchesProvince,
  provinceStationSummary,
  loadAirQualityForProvince,
  loadAirQualityForecast,
  summarizeForecastTrend,
  distanceKm,
  stationDistanceKm,
  sortStationsByDistance
} = require("../js/air-quality.js");

(async () => {
assert.equal(PROVINCE_META.length, 77, "Thailand province list must contain all 77 provinces");
assert.equal(thaiPm25Band(15, "en").key, "very_good");
assert.equal(thaiPm25Band(15.1, "en").key, "good");
assert.equal(thaiPm25Band(25.1, "en").key, "moderate");
assert.equal(thaiPm25Band(37.6, "en").key, "starting_impact");
assert.equal(thaiPm25Band(75.1, "en").key, "health_impact");
assert.equal(thaiPm25Band(-1, "en"), null);

assert.equal(usAqiBand(50, "en").key, "model_good");
assert.equal(usAqiBand(101, "en").key, "model_sensitive");
assert.equal(usAqiBand(301, "en").key, "model_hazardous");

const bangkok = PROVINCE_META.find(province => province.th === "กรุงเทพมหานคร");
const chiangMai = PROVINCE_META.find(province => province.th === "เชียงใหม่");
assert.ok(stationMatchesProvince({ area_th: "เขตบางนา, กรุงเทพฯ", area_en: "Bang Na, Bangkok" }, bangkok));
assert.ok(!stationMatchesProvince({ area_th: "อ.เมือง, เชียงใหม่", area_en: "Mueang, Chiang Mai" }, bangkok));
assert.ok(stationMatchesProvince({ area_th: "อ.เมือง, เชียงใหม่", area_en: "Mueang, Chiang Mai" }, chiangMai));

const checkedInSnapshot = JSON.parse(fs.readFileSync("data/air4thai-latest.json", "utf8"));
assert.equal(checkedInSnapshot.schema_version, 1);
assert.ok(checkedInSnapshot.stations.length >= 100);
assert.ok(checkedInSnapshot.stations.filter(station => Number.isFinite(station.pm25)).length >= 40);
const coveredProvinces = PROVINCE_META.filter(province =>
  checkedInSnapshot.stations.some(station => Number.isFinite(station.pm25) && stationMatchesProvince(station, province))
);
assert.ok(coveredProvinces.length >= 70, "Official snapshot should cover most Thai provinces");

assert.deepEqual(
  provinceStationSummary([
    { pm25: 10, observed_at: "2026-07-28T10:00:00+07:00" },
    { pm25: 20, observed_at: "2026-07-28T11:00:00+07:00" },
    { pm25: null, observed_at: null }
  ]),
  {
    stationCount: 3,
    reportingCount: 2,
    medianPm25: 15,
    minPm25: 10,
    maxPm25: 20,
    latestObservedAt: "2026-07-28T04:00:00.000Z"
  }
);

assert.equal(distanceKm(13.7563, 100.5018, 13.7563, 100.5018), 0);
assert.ok(distanceKm(13, 100, 14, 100) > 110 && distanceKm(13, 100, 14, 100) < 112);
const unsortedStations = [
  { station_id: "far", latitude: 14, longitude: 100 },
  { station_id: "missing", latitude: null, longitude: null },
  { station_id: "near", latitude: 13.01, longitude: 100 }
];
const sortedStations = sortStationsByDistance(unsortedStations, { latitude: 13, longitude: 100 });
assert.deepEqual(sortedStations.map(station => station.station_id), ["near", "far", "missing"]);
assert.deepEqual(unsortedStations.map(station => station.station_id), ["far", "missing", "near"],
  "Distance sorting must not mutate the station source array");
assert.ok(stationDistanceKm(sortedStations[0], { latitude: 13, longitude: 100 }) < 2);

function response(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

const officialStations = Array.from({ length: 100 }, (_, index) => ({
  station_id: `s${index}`,
  name_th: `สถานี ${index}`,
  name_en: `Station ${index}`,
  area_th: index < 2 ? "เขตบางนา, กรุงเทพฯ" : "อ.เมือง, เชียงใหม่",
  area_en: index < 2 ? "Bang Na, Bangkok" : "Mueang, Chiang Mai",
  observed_at: "2026-07-28T10:00:00+07:00",
  pm25: index < 2 ? 10 + index * 10 : 12,
  pm10: 20,
  aqi: 25
}));
const officialFetch = async () => response({
  schema_version: 1,
  source: "Air4Thai — Thailand Pollution Control Department",
  source_url: "https://air4thai.pcd.go.th/",
  fetched_at: "2026-07-28T03:30:00.000Z",
  station_count: 100,
  stations: officialStations
});
const official = await loadAirQualityForProvince(bangkok, {
  fetchImpl: officialFetch,
  now: Date.parse("2026-07-28T04:00:00.000Z"),
  force: true
});
assert.equal(official.kind, "official");
assert.equal(official.stations.length, 2);
assert.equal(official.summary.medianPm25, 15);
assert.equal(official.stale, false);

const noStationProvince = PROVINCE_META.find(province => province.th === "ระนอง");
const fallbackFetch = async url => {
  if (String(url).includes("air4thai-latest.json")) return response({}, false, 503);
  if (String(url).includes("geocoding-api")) {
    return response({ results: [{ name: "Ranong", country_code: "TH", latitude: 9.96, longitude: 98.64 }] });
  }
  if (String(url).includes("air-quality-api")) {
    return response({ current: { time: "2026-07-28T11:00", pm2_5: 18.2, pm10: 29.4, us_aqi: 62 } });
  }
  throw new Error(`Unexpected URL ${url}`);
};
const fallback = await loadAirQualityForProvince(noStationProvince, {
  fetchImpl: fallbackFetch,
  now: Date.parse("2026-07-28T04:00:00.000Z"),
  force: true
});
assert.equal(fallback.kind, "model");
assert.equal(fallback.stations[0].pm25, 18.2);
assert.equal(fallback.stations[0].aqi, 62);
assert.equal(fallback.stations[0].modelled, true);

const forecastTimes = Array.from({ length: 24 }, (_, index) =>
  `2026-07-28T${String(12 + index).padStart(2, "0")}:00`
);
// Roll times into the next day to keep valid ISO local timestamps.
forecastTimes.forEach((value, index) => {
  if (12 + index >= 24) {
    forecastTimes[index] = `2026-07-29T${String(12 + index - 24).padStart(2, "0")}:00`;
  }
});
const forecastValues = Array.from({ length: 24 }, (_, index) => 10 + index * 0.6);
const forecastFetch = async url => {
  if (String(url).includes("geocoding-api")) {
    return response({ results: [{ name: "Bangkok", country_code: "TH", latitude: 13.75, longitude: 100.5 }] });
  }
  if (String(url).includes("air-quality-api")) {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("forecast_hours"), "24");
    assert.equal(parsed.searchParams.get("domains"), "cams_global");
    assert.equal(parsed.searchParams.get("hourly"), "pm2_5");
    return response({ hourly: { time: forecastTimes, pm2_5: forecastValues } });
  }
  throw new Error(`Unexpected forecast URL ${url}`);
};
const forecast = await loadAirQualityForecast(bangkok, {
  fetchImpl: forecastFetch,
  now: Date.parse("2026-07-28T05:00:00.000Z"),
  force: true
});
assert.equal(forecast.kind, "model_forecast");
assert.equal(forecast.points.length, 24);
assert.equal(forecast.trend.key, "higher");
assert.equal(forecast.points[0].at, "2026-07-28T05:00:00.000Z");
assert.equal(summarizeForecastTrend([
  { pm25: 20 }, { pm25: 20 }, { pm25: 20 }, { pm25: 20 },
  { pm25: 10 }, { pm25: 10 }, { pm25: 10 }, { pm25: 10 }
]).key, "lower");
assert.equal(summarizeForecastTrend([
  { pm25: 10 }, { pm25: 20 }, { pm25: 10 }, { pm25: 20 },
  { pm25: 10 }, { pm25: 20 }, { pm25: 10 }, { pm25: 20 }
]).key, "similar");
assert.equal(summarizeForecastTrend([
  { pm25: 5 }, { pm25: 20 }, { pm25: 5 }, { pm25: 20 },
  { pm25: 20 }, { pm25: 5 }, { pm25: 20 }, { pm25: 5 }
]).key, "variable");

console.log("Air-quality checks passed: Thai PM2.5 bands, station matching, province summaries, official data, model fallback, 24-hour forecasts, and local nearest-station sorting.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
