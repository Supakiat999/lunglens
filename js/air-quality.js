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

async function fetchModelFallback(province, fetchImpl) {
  const search = new URL(AIR_QUALITY_CONFIG.geocodingUrl);
  search.searchParams.set("name", province.en);
  search.searchParams.set("count", "5");
  search.searchParams.set("language", "en");
  search.searchParams.set("countryCode", "TH");
  const locations = await fetchJson(search.toString(), fetchImpl);
  const location = (locations.results || []).find(item => item.country_code === "TH") || locations.results?.[0];
  if (!location) throw new Error("Province coordinates unavailable");

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
    provinceStationSummary, loadAirQualityForProvince, stationBand
  };
}
