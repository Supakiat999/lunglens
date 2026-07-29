const assert = require("node:assert/strict");
const {
  historyPointFromStation,
  validAirHistory,
  mergeAirHistory,
  loadAirHistoryForStation
} = require("../js/air-history.js");

const hour = 60 * 60 * 1000;
const nowMs = Date.parse("2026-07-29T06:00:00.000Z");

(async () => {

function snapshot(observedAt, pm25 = 18, stationId = "bkp100t") {
  return {
    source_url: "https://air4thai.pcd.go.th/",
    stations: [{
      station_id: stationId,
      name_th: "สถานีตัวอย่าง",
      name_en: "Example station",
      area_th: "กรุงเทพมหานคร",
      area_en: "Bangkok",
      latitude: 13.75,
      longitude: 100.5,
      observed_at: observedAt,
      pm25,
      pm10: 30,
      aqi: 42
    }]
  };
}

const first = mergeAirHistory(
  null,
  snapshot("2026-07-29T04:00:00.000Z"),
  { nowMs }
);
assert.equal(first.station_count, 1);
assert.equal(first.point_count, 1);
assert.equal(first.stations[0].points[0].pm25, 18);
assert.ok(validAirHistory(first));

const firstCopy = structuredClone(first);
const second = mergeAirHistory(
  first,
  snapshot("2026-07-29T05:00:00.000Z", 22),
  { nowMs }
);
assert.deepEqual(first, firstCopy, "Merging must not mutate existing history");
assert.equal(second.point_count, 2);
assert.deepEqual(second.stations[0].points.map(point => point.pm25), [18, 22]);

const duplicate = mergeAirHistory(
  second,
  snapshot("2026-07-29T05:00:00.000Z", 25),
  { nowMs }
);
assert.equal(duplicate.point_count, 2);
assert.equal(duplicate.stations[0].points.at(-1).pm25, 25);

const oldHistory = mergeAirHistory(
  null,
  snapshot("2026-07-26T01:00:00.000Z"),
  { nowMs: Date.parse("2026-07-26T02:00:00.000Z") }
);
const pruned = mergeAirHistory(
  oldHistory,
  snapshot("2026-07-29T05:00:00.000Z", 20),
  { nowMs, retentionHours: 48 }
);
assert.equal(pruned.point_count, 1);
assert.equal(pruned.stations[0].points[0].observed_at, "2026-07-29T05:00:00.000Z");

const missingPm25 = snapshot("2026-07-29T05:30:00.000Z", null, "missing");
assert.equal(historyPointFromStation(missingPm25.stations[0]), null);
const withoutMissing = mergeAirHistory(second, missingPm25, { nowMs });
assert.equal(withoutMissing.station_count, 1);
assert.equal(withoutMissing.point_count, 2);

assert.throws(
  () => mergeAirHistory(null, { stations: "invalid" }, { nowMs }),
  /valid station snapshot/
);
assert.equal(validAirHistory({ schema_version: 1, generated_at: "2026-07-29T06:00:00Z", stations: [] }), true);
assert.equal(validAirHistory({ schema_version: 1, generated_at: "", stations: [] }), false);
assert.equal(validAirHistory({ schema_version: 2, generated_at: "", stations: [] }), false);

const fetchPayload = mergeAirHistory(
  second,
  snapshot("2026-07-29T05:30:00.000Z", 23),
  { nowMs }
);
const fetchImpl = async () => ({
  ok: true,
  async json() { return fetchPayload; }
});
const loaded = await loadAirHistoryForStation("bkp100t", {
  fetchImpl,
  now: nowMs,
  force: true
});
assert.equal(loaded.station.station_id, "bkp100t");
assert.equal(loaded.station.points.length, 3);
assert.equal(loaded.stale, false);

const staleLoaded = await loadAirHistoryForStation("bkp100t", {
  fetchImpl,
  now: nowMs + 7 * hour,
  force: true
});
assert.equal(staleLoaded.stale, true);

const missingStation = await loadAirHistoryForStation("does-not-exist", {
  fetchImpl,
  now: nowMs,
  force: true
});
assert.equal(missingStation, null);

console.log("Air-history checks passed: merge, deduplication, retention, validation, loading, staleness, and non-mutation.");

})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
