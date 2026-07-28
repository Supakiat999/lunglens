const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PROVINCE_META } = require("../js/data.js");
const {
  thaiPm25Band,
  usAqiBand,
  stationMatchesProvince,
  provinceStationSummary,
  loadAirQualityForProvince
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

console.log("Air-quality checks passed: Thai PM2.5 bands, station matching, province summaries, official data, and model fallback.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
