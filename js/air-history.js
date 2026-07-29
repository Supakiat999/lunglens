/* =====================================================================
   LungLens rolling Air4Thai station history.

   This file is shared by the hourly Node updater and the browser. History
   contains official station observations only; model forecasts are kept in
   air-quality.js and must never be mixed into this dataset.
   ===================================================================== */

const AIR_HISTORY_CONFIG = Object.freeze({
  urls: [
    "https://raw.githubusercontent.com/Supakiat999/lunglens/air-quality-data/data/air4thai-history.json",
    "data/air4thai-history.json"
  ],
  retentionHours: 48,
  maxPointsPerStation: 72,
  staleAfterMs: 6 * 60 * 60 * 1000,
  cacheMs: 10 * 60 * 1000
});

let airHistoryCache = null;

function historyNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function historyText(value, maxLength = 240) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function historyCoordinate(value, limit) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : null;
}

function validHistoryTimestamp(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function historyPointFromStation(station) {
  const observedAt = validHistoryTimestamp(station?.observed_at);
  const pm25 = historyNumber(station?.pm25);
  if (!observedAt || pm25 == null) return null;
  return {
    observed_at: observedAt,
    pm25,
    pm10: historyNumber(station?.pm10),
    aqi: historyNumber(station?.aqi)
  };
}

function validAirHistory(payload) {
  return payload?.schema_version === 1 &&
    validHistoryTimestamp(payload.generated_at) !== null &&
    Array.isArray(payload.stations);
}

function mergeAirHistory(existing, snapshot, {
  nowMs = Date.now(),
  retentionHours = AIR_HISTORY_CONFIG.retentionHours,
  maxPointsPerStation = AIR_HISTORY_CONFIG.maxPointsPerStation
} = {}) {
  if (!snapshot || !Array.isArray(snapshot.stations)) throw new Error("A valid station snapshot is required");
  const cutoff = nowMs - retentionHours * 60 * 60 * 1000;
  const stationMap = new Map();

  if (validAirHistory(existing)) {
    for (const station of existing.stations) {
      const stationId = historyText(station?.station_id, 32);
      if (!stationId) continue;
      stationMap.set(stationId, {
        station_id: stationId,
        name_th: historyText(station.name_th),
        name_en: historyText(station.name_en),
        area_th: historyText(station.area_th),
        area_en: historyText(station.area_en),
        latitude: historyCoordinate(station.latitude, 90),
        longitude: historyCoordinate(station.longitude, 180),
        points: Array.isArray(station.points) ? station.points.slice() : []
      });
    }
  }

  for (const station of snapshot.stations) {
    const stationId = historyText(station?.station_id, 32);
    if (!stationId) continue;
    const current = stationMap.get(stationId) || { station_id: stationId, points: [] };
    Object.assign(current, {
      name_th: historyText(station.name_th),
      name_en: historyText(station.name_en),
      area_th: historyText(station.area_th),
      area_en: historyText(station.area_en),
      latitude: historyCoordinate(station.latitude, 90),
      longitude: historyCoordinate(station.longitude, 180)
    });
    const point = historyPointFromStation(station);
    if (point) current.points.push(point);
    stationMap.set(stationId, current);
  }

  const stations = [];
  for (const station of stationMap.values()) {
    const unique = new Map();
    for (const point of station.points) {
      const observedAt = validHistoryTimestamp(point?.observed_at);
      const pm25 = historyNumber(point?.pm25);
      const observedMs = Date.parse(observedAt);
      if (!observedAt || pm25 == null || observedMs < cutoff || observedMs > nowMs + 2 * 60 * 60 * 1000) continue;
      unique.set(observedAt, {
        observed_at: observedAt,
        pm25,
        pm10: historyNumber(point.pm10),
        aqi: historyNumber(point.aqi)
      });
    }
    const points = [...unique.values()]
      .sort((a, b) => Date.parse(a.observed_at) - Date.parse(b.observed_at))
      .slice(-maxPointsPerStation);
    if (!points.length) continue;
    stations.push({ ...station, points });
  }
  stations.sort((a, b) => a.station_id.localeCompare(b.station_id, "en"));
  const allPoints = stations.flatMap(station => station.points);
  const latestObservedMs = allPoints.map(point => Date.parse(point.observed_at)).filter(Number.isFinite);

  return {
    schema_version: 1,
    source: "Air4Thai — Thailand Pollution Control Department",
    source_url: snapshot.source_url || "https://air4thai.pcd.go.th/",
    generated_at: new Date(nowMs).toISOString(),
    retention_hours: retentionHours,
    station_count: stations.length,
    point_count: allPoints.length,
    latest_observed_at: latestObservedMs.length
      ? new Date(Math.max(...latestObservedMs)).toISOString()
      : null,
    stations
  };
}

async function fetchAirHistoryJson(url, fetchImpl) {
  const response = await fetchImpl(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, {
    cache: "no-store",
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (!validAirHistory(payload)) throw new Error("Invalid Air4Thai history");
  return payload;
}

async function loadAirHistoryForStation(stationId, {
  fetchImpl = (...args) => fetch(...args),
  now = Date.now(),
  force = false
} = {}) {
  const isStale = (payload, station) => {
    const stationLatest = station?.points?.at(-1)?.observed_at;
    const freshnessTime = Date.parse(stationLatest || payload.latest_observed_at || payload.generated_at);
    return !Number.isFinite(freshnessTime) || now - freshnessTime > AIR_HISTORY_CONFIG.staleAfterMs;
  };
  if (!force && airHistoryCache && now - airHistoryCache.cachedAt < AIR_HISTORY_CONFIG.cacheMs) {
    const station = airHistoryCache.payload.stations.find(item => item.station_id === stationId);
    return station ? {
      ...airHistoryCache.payload,
      station,
      stale: isStale(airHistoryCache.payload, station)
    } : null;
  }
  let lastError = null;
  for (const url of AIR_HISTORY_CONFIG.urls) {
    try {
      const payload = await fetchAirHistoryJson(url, fetchImpl);
      airHistoryCache = { cachedAt: now, payload };
      const station = payload.stations.find(item => item.station_id === stationId);
      return station ? {
        ...payload,
        station,
        stale: isStale(payload, station)
      } : null;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Air4Thai history unavailable");
}

if (typeof module !== "undefined") {
  module.exports = {
    AIR_HISTORY_CONFIG,
    historyPointFromStation,
    validAirHistory,
    mergeAirHistory,
    loadAirHistoryForStation
  };
}
