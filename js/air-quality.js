/* =====================================================================
   LungLens live air-quality layer

   Primary: a validated snapshot of the official Air4Thai station feed.
   Fallback: Open-Meteo/CAMS model data when no reporting station is found.

   Air quality is short-term exposure context only. It must never be added to
   the prototype cancer-risk score or used to decide LDCT eligibility.
   ===================================================================== */

const AIR_QUALITY_CONFIG = Object.freeze({
  snapshotUrls: [
    "https://raw.githubusercontent.com/Supakiat999/lunglens/air-quality-data/data/air4thai-latest.json",
    "data/air4thai-latest.json"
  ],
  snapshotMaxAgeMs: 6 * 60 * 60 * 1000,
  cacheMs: 10 * 60 * 1000,
  forecastCacheMs: 30 * 60 * 1000,
  geocodingUrl: "https://geocoding-api.open-meteo.com/v1/search",
  modelUrl: "https://air-quality-api.open-meteo.com/v1/air-quality"
});

const AIR_COPY = Object.freeze({
  th: {
    very_good: ["ดีมาก", "คุณภาพอากาศเหมาะสำหรับกิจกรรมกลางแจ้งตามปกติ"],
    good: ["ดี", "ทำกิจกรรมกลางแจ้งได้ตามปกติ และติดตามค่าฝุ่นหากคุณไวต่อมลพิษ"],
    moderate: ["ปานกลาง", "ผู้ที่ต้องดูแลสุขภาพเป็นพิเศษควรลดเวลากลางแจ้งหากเริ่มไอ หายใจลำบาก หรือระคายเคืองตา"],
    starting_impact: ["เริ่มมีผลกระทบต่อสุขภาพ", "ลดเวลาทำกิจกรรมกลางแจ้ง โดยเฉพาะกลุ่มเปราะบาง และใช้อุปกรณ์ป้องกันที่เหมาะสมเมื่อจำเป็น"],
    health_impact: ["มีผลกระทบต่อสุขภาพ", "หลีกเลี่ยงกิจกรรมกลางแจ้ง อยู่ในพื้นที่อากาศสะอาด และปรึกษาแพทย์หากมีอาการผิดปกติ"],
    model_good: ["ดี (แบบจำลอง)", "ทำกิจกรรมได้ตามปกติ แต่ควรตรวจสอบสถานีทางการใกล้ตัวเมื่อมีข้อมูล"],
    model_moderate: ["ปานกลาง (แบบจำลอง)", "ผู้ที่ไวต่อมลพิษควรสังเกตอาการและปรับกิจกรรมกลางแจ้งตามความเหมาะสม"],
    model_sensitive: ["ไม่ดีต่อกลุ่มที่ไวต่อมลพิษ (แบบจำลอง)", "กลุ่มเปราะบางควรลดกิจกรรมกลางแจ้งที่ใช้แรงมากหรือเป็นเวลานาน"],
    model_unhealthy: ["ไม่ดีต่อสุขภาพ (แบบจำลอง)", "ลดกิจกรรมกลางแจ้ง โดยเฉพาะกลุ่มเปราะบาง และติดตามข้อมูลสถานีทางการ"],
    model_very_unhealthy: ["ไม่ดีต่อสุขภาพอย่างมาก (แบบจำลอง)", "หลีกเลี่ยงกิจกรรมกลางแจ้งและอยู่ในพื้นที่อากาศสะอาดเท่าที่ทำได้"],
    model_hazardous: ["อันตราย (แบบจำลอง)", "หลีกเลี่ยงกิจกรรมกลางแจ้ง ติดตามประกาศทางการ และขอความช่วยเหลือหากมีอาการรุนแรง"]
  },
  en: {
    very_good: ["Very good", "Air quality is suitable for normal outdoor activities."],
    good: ["Good", "Normal outdoor activities are reasonable. Continue monitoring if you are sensitive to pollution."],
    moderate: ["Moderate", "People who need extra care should reduce time outdoors if coughing, breathing difficulty or eye irritation develops."],
    starting_impact: ["Starting to affect health", "Reduce prolonged outdoor activity, especially for vulnerable groups, and use suitable protection when necessary."],
    health_impact: ["Affecting health", "Avoid outdoor activity, move to cleaner indoor air, and seek medical advice if symptoms develop."],
    model_good: ["Good (modelled)", "Normal activity is reasonable, but use a nearby official station when one is available."],
    model_moderate: ["Moderate (modelled)", "People sensitive to pollution should watch for symptoms and adjust outdoor activity."],
    model_sensitive: ["Unhealthy for sensitive groups (modelled)", "Vulnerable groups should reduce prolonged or strenuous outdoor activity."],
    model_unhealthy: ["Unhealthy (modelled)", "Reduce outdoor activity, especially for vulnerable groups, and check official local information."],
    model_very_unhealthy: ["Very unhealthy (modelled)", "Avoid outdoor activity and stay in cleaner indoor air where possible."],
    model_hazardous: ["Hazardous (modelled)", "Avoid outdoor activity, follow official alerts, and seek help for severe symptoms."]
  }
});

const airQualityCache = new Map();
const airForecastCache = new Map();

function airLanguage() {
  try { return state?.lang === "en" ? "en" : "th"; } catch (error) { return "th"; }
}

function thaiPm25Band(pm25, lang = airLanguage()) {
  const value = Number(pm25);
  if (!Number.isFinite(value) || value < 0) return null;
  const key = value <= 15 ? "very_good"
    : value <= 25 ? "good"
      : value <= 37.5 ? "moderate"
        : value <= 75 ? "starting_impact"
          : "health_impact";
  const [label, guidance] = AIR_COPY[lang][key];
  return { key, label, guidance, scale: "thai_pm25" };
}

function usAqiBand(aqi, lang = airLanguage()) {
  const value = Number(aqi);
  if (!Number.isFinite(value) || value < 0) return null;
  const key = value <= 50 ? "model_good"
    : value <= 100 ? "model_moderate"
      : value <= 150 ? "model_sensitive"
        : value <= 200 ? "model_unhealthy"
          : value <= 300 ? "model_very_unhealthy"
            : "model_hazardous";
  const [label, guidance] = AIR_COPY[lang][key];
  return { key, label, guidance, scale: "us_aqi" };
}

function provinceMeta(name) {
  if (typeof PROVINCE_META === "undefined") return null;
  return PROVINCE_META.find(province => province.th === name || province.en === name) || null;
}

function compactComparable(value) {
  return String(value ?? "").toLocaleLowerCase("en").replace(/[\s,.;()\-]/g, "");
}

function stationMatchesProvince(station, province) {
  if (!station || !province) return false;
  const haystacks = [station.area_th, station.area_en].map(compactComparable);
  const needles = [province.th, province.en, ...(province.aliases || [])]
    .filter(Boolean)
    .map(compactComparable);
  return haystacks.some(area => needles.some(name => name && area.includes(name)));
}

function validSnapshot(payload) {
  return payload?.schema_version === 1 &&
    Array.isArray(payload.stations) &&
    payload.stations.length >= 100 &&
    typeof payload.fetched_at === "string";
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, { cache: "no-store", headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchOfficialSnapshot(fetchImpl) {
  let lastError = null;
  for (const url of AIR_QUALITY_CONFIG.snapshotUrls) {
    try {
      const payload = await fetchJson(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, fetchImpl);
      if (!validSnapshot(payload)) throw new Error("Invalid Air4Thai snapshot");
      return { payload, url };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Air4Thai snapshot unavailable");
}

async function resolveProvinceLocation(province, fetchImpl) {
  const search = new URL(AIR_QUALITY_CONFIG.geocodingUrl);
  search.searchParams.set("name", province.en);
  search.searchParams.set("count", "5");
  search.searchParams.set("language", "en");
  search.searchParams.set("countryCode", "TH");
  const locations = await fetchJson(search.toString(), fetchImpl);
  const location = (locations.results || []).find(item => item.country_code === "TH") || locations.results?.[0];
  if (!location || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) {
    throw new Error("Province coordinates unavailable");
  }
  return {
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    name: String(location.name || province.en)
  };
}

function median(values) {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function provinceStationSummary(stations) {
  const reporting = stations.filter(station => Number.isFinite(station.pm25));
  const values = reporting.map(station => station.pm25);
  const observed = reporting.map(station => Date.parse(station.observed_at)).filter(Number.isFinite);
  return {
    stationCount: stations.length,
    reportingCount: reporting.length,
    medianPm25: median(values),
    minPm25: values.length ? Math.min(...values) : null,
    maxPm25: values.length ? Math.max(...values) : null,
    latestObservedAt: observed.length ? new Date(Math.max(...observed)).toISOString() : null
  };
}

function distanceKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const raw = [latitudeA, longitudeA, latitudeB, longitudeB];
  if (raw.some(value => value == null || value === "")) return null;
  const values = raw.map(Number);
  if (!values.every(Number.isFinite)) return null;
  const [latA, lonA, latB, lonB] = values;
  if (Math.abs(latA) > 90 || Math.abs(latB) > 90 || Math.abs(lonA) > 180 || Math.abs(lonB) > 180) return null;
  const toRadians = degrees => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(latB - latA);
  const deltaLon = toRadians(lonB - lonA);
  const a = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) *
    Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function stationDistanceKm(station, location) {
  if (!station || !location) return null;
  return distanceKm(location.latitude, location.longitude, station.latitude, station.longitude);
}

function sortStationsByDistance(stations, location) {
  if (!Array.isArray(stations)) return [];
  return stations.slice().sort((a, b) => {
    const distanceA = stationDistanceKm(a, location);
    const distanceB = stationDistanceKm(b, location);
    if (distanceA == null && distanceB == null) return 0;
    if (distanceA == null) return 1;
    if (distanceB == null) return -1;
    return distanceA - distanceB;
  });
}

async function fetchModelFallback(province, fetchImpl) {
  const location = await resolveProvinceLocation(province, fetchImpl);

  const request = new URL(AIR_QUALITY_CONFIG.modelUrl);
  request.searchParams.set("latitude", String(location.latitude));
  request.searchParams.set("longitude", String(location.longitude));
  request.searchParams.set("current", "pm2_5,pm10,us_aqi");
  request.searchParams.set("timezone", "Asia/Bangkok");
  request.searchParams.set("forecast_days", "1");
  const payload = await fetchJson(request.toString(), fetchImpl);
  const current = payload.current || {};
  const observedAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(current.time || "")
    ? `${current.time}:00+07:00` : new Date().toISOString();
  const station = {
    station_id: `model-${province.en.toLowerCase().replace(/\s+/g, "-")}`,
    name_th: `แบบจำลองบริเวณ${province.th}`,
    name_en: `${province.en} model grid`,
    area_th: province.th,
    area_en: `${province.en}, Thailand`,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    observed_at: observedAt,
    pm25: Number.isFinite(Number(current.pm2_5)) ? Number(current.pm2_5) : null,
    pm10: Number.isFinite(Number(current.pm10)) ? Number(current.pm10) : null,
    aqi: Number.isFinite(Number(current.us_aqi)) ? Number(current.us_aqi) : null,
    modelled: true
  };
  return {
    kind: "model",
    source: "Open-Meteo air-quality API — CAMS global model",
    sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
    fetchedAt: new Date().toISOString(),
    stale: false,
    province,
    stations: [station],
    summary: provinceStationSummary([station])
  };
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function summarizeForecastTrend(points) {
  if (!Array.isArray(points) || points.length < 4) {
    return { key: "unknown", difference: null, firstAverage: null, lastAverage: null };
  }
  const windowSize = Math.min(4, Math.floor(points.length / 2));
  const firstAverage = average(points.slice(0, windowSize).map(point => point.pm25));
  const lastAverage = average(points.slice(-windowSize).map(point => point.pm25));
  const values = points.map(point => point.pm25).filter(Number.isFinite);
  if (!Number.isFinite(firstAverage) || !Number.isFinite(lastAverage) || !values.length) {
    return { key: "unknown", difference: null, firstAverage, lastAverage };
  }
  const difference = lastAverage - firstAverage;
  const range = Math.max(...values) - Math.min(...values);
  const key = Math.abs(difference) >= 5
    ? (difference > 0 ? "higher" : "lower")
    : range >= 12 ? "variable" : "similar";
  return { key, difference, firstAverage, lastAverage, min: Math.min(...values), max: Math.max(...values) };
}

function localModelTimestamp(value) {
  if (typeof value !== "string") return null;
  const withOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ? value
    : `${value}${/T\d{2}:\d{2}$/.test(value) ? ":00" : ""}+07:00`;
  const parsed = Date.parse(withOffset);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

async function loadAirQualityForecast(provinceName, {
  latitude,
  longitude,
  fetchImpl = (...args) => fetch(...args),
  now = Date.now(),
  force = false
} = {}) {
  const province = typeof provinceName === "object" ? provinceName : provinceMeta(provinceName);
  if (!province) throw new Error("Unknown province");
  let location;
  if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
    location = { latitude: Number(latitude), longitude: Number(longitude), name: province.en };
  } else {
    location = await resolveProvinceLocation(province, fetchImpl);
  }
  const cacheKey = `${province.th}:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}`;
  const cached = airForecastCache.get(cacheKey);
  if (!force && cached && now - cached.cachedAt < AIR_QUALITY_CONFIG.forecastCacheMs) return cached.data;

  const request = new URL(AIR_QUALITY_CONFIG.modelUrl);
  request.searchParams.set("latitude", String(location.latitude));
  request.searchParams.set("longitude", String(location.longitude));
  request.searchParams.set("hourly", "pm2_5");
  request.searchParams.set("forecast_hours", "24");
  request.searchParams.set("timezone", "Asia/Bangkok");
  request.searchParams.set("domains", "cams_global");
  const payload = await fetchJson(request.toString(), fetchImpl);
  const times = Array.isArray(payload?.hourly?.time) ? payload.hourly.time : [];
  const values = Array.isArray(payload?.hourly?.pm2_5) ? payload.hourly.pm2_5 : [];
  const points = times.map((time, index) => ({
    at: localModelTimestamp(time),
    pm25: Number.isFinite(Number(values[index])) ? Number(values[index]) : null
  })).filter(point => point.at && Number.isFinite(point.pm25)).slice(0, 24);
  if (points.length < 4) throw new Error("Air-quality forecast was incomplete");

  const data = {
    kind: "model_forecast",
    source: "Open-Meteo air-quality API — CAMS global model",
    sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
    fetchedAt: new Date(now).toISOString(),
    province,
    location,
    points,
    trend: summarizeForecastTrend(points)
  };
  airForecastCache.set(cacheKey, { cachedAt: now, data });
  return data;
}

async function loadAirQualityForProvince(provinceName, {
  fetchImpl = (...args) => fetch(...args),
  now = Date.now(),
  force = false
} = {}) {
  const province = typeof provinceName === "object" ? provinceName : provinceMeta(provinceName);
  if (!province) throw new Error("Unknown province");
  const cacheKey = province.th;
  const cached = airQualityCache.get(cacheKey);
  if (!force && cached && now - cached.cachedAt < AIR_QUALITY_CONFIG.cacheMs) return cached.data;

  let officialError = null;
  try {
    const { payload, url } = await fetchOfficialSnapshot(fetchImpl);
    const stations = payload.stations
      .filter(station => stationMatchesProvince(station, province))
      .sort((a, b) => (a.name_en || a.name_th).localeCompare(b.name_en || b.name_th, "en"));
    if (stations.some(station => Number.isFinite(station.pm25))) {
      const fetchedMs = Date.parse(payload.fetched_at);
      const data = {
        kind: "official",
        source: payload.source,
        sourceUrl: payload.source_url,
        snapshotUrl: url,
        fetchedAt: payload.fetched_at,
        stale: !Number.isFinite(fetchedMs) || now - fetchedMs > AIR_QUALITY_CONFIG.snapshotMaxAgeMs,
        province,
        stations,
        summary: provinceStationSummary(stations)
      };
      airQualityCache.set(cacheKey, { cachedAt: now, data });
      return data;
    }
  } catch (error) {
    officialError = error;
  }

  try {
    const data = await fetchModelFallback(province, fetchImpl);
    data.officialError = officialError?.message || null;
    airQualityCache.set(cacheKey, { cachedAt: now, data });
    return data;
  } catch (modelError) {
    const error = new Error("Air-quality data is currently unavailable");
    error.official = officialError;
    error.model = modelError;
    throw error;
  }
}

function stationBand(station, kind, lang = airLanguage()) {
  return kind === "official"
    ? thaiPm25Band(station.pm25, lang)
    : usAqiBand(station.aqi, lang);
}

if (typeof module !== "undefined") {
  module.exports = {
    AIR_QUALITY_CONFIG, thaiPm25Band, usAqiBand, stationMatchesProvince,
    provinceStationSummary, loadAirQualityForProvince, loadAirQualityForecast,
    summarizeForecastTrend, distanceKm, stationDistanceKm, sortStationsByDistance,
    stationBand
  };
}
