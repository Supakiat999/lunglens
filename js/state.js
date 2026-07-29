/* =====================================================================
   LungLens saved-state recovery

   Pure data sanitisation only. This module does not score answers, infer
   medical meaning, call the network, or change the lunglens-v1 storage key.
   ===================================================================== */

const MAX_LOCAL_HISTORY = 20;
const MAX_LOCAL_REFERRALS = 20;
const MAX_LOCAL_EVENTS = 200;
const REMINDER_FREQUENCIES = ["รายเดือน", "ราย 3 เดือน", "รายปี (ประเมินซ้ำ)"];
const SYMPTOM_PATHWAYS = new Set(["standard", "prompt", "urgent"]);

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function safeText(value, maxLength = 500) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function createDefaultState(defaultLocale = "en") {
  return {
    lang: defaultLocale === "th" ? "th" : "en",
    lineLinked: false,
    consent: null,
    answers: {},
    stepIndex: 0,
    returnToReview: false,
    inProgress: false,
    result: null,
    history: [],
    referrals: [],
    reminders: { enabled: false, time: "09:00", freq: "รายเดือน" },
    events: [],
    bigText: false,
    providerRole: null
  };
}

function sanitiseMulti(value, field) {
  if (!Array.isArray(value) || !Array.isArray(field.options)) return null;
  const allowed = new Set(field.options);
  const selected = [...new Set(value.filter(option => typeof option === "string" && allowed.has(option)))];
  if (!selected.length) return null;
  const exclusive = Array.isArray(field.exclusive) ? field.exclusive : [];
  const exclusiveChoice = exclusive.find(option => selected.includes(option));
  return exclusiveChoice ? [exclusiveChoice] : selected;
}

function sanitiseChoice(value, field) {
  return typeof value === "string" && Array.isArray(field.options) && field.options.includes(value)
    ? value
    : null;
}

function sanitiseAssessmentAnswers(savedAnswers, { steps = [], provinces = [], pruneInactive } = {}) {
  if (!isPlainRecord(savedAnswers)) return {};
  const answers = {};
  const provinceSet = new Set(provinces);

  for (const step of steps) {
    const value = savedAnswers[step.id];
    if (step.type === "province") {
      if (typeof value === "string" && provinceSet.has(value)) answers[step.id] = value;
      continue;
    }
    if (step.type === "choice") {
      const choice = sanitiseChoice(value, step);
      if (choice != null) answers[step.id] = choice;
      continue;
    }
    if (step.type === "multi" || step.type === "symptoms") {
      const selected = sanitiseMulti(value, step);
      if (selected) answers[step.id] = selected;
      continue;
    }
    if (step.type === "numbers" && isPlainRecord(value)) {
      const current = {};
      for (const field of step.fields || []) {
        const number = Number(value[field.key]);
        if (!Number.isFinite(number) || number < field.min || number > field.max) continue;
        if (field.integer !== false && !Number.isInteger(number)) continue;
        current[field.key] = number;
      }
      if (Object.keys(current).length) answers[step.id] = current;
      continue;
    }
    if (step.type === "group" && isPlainRecord(value)) {
      const current = {};
      for (const field of step.fields || []) {
        const fieldValue = field.type === "multi"
          ? sanitiseMulti(value[field.key], field)
          : sanitiseChoice(value[field.key], field);
        if (fieldValue != null) current[field.key] = fieldValue;
      }
      if (Object.keys(current).length) answers[step.id] = current;
    }
  }

  if (answers.PROVINCE && typeof savedAnswers.DISTRICT === "string") {
    const district = savedAnswers.DISTRICT.trim().slice(0, 120);
    if (district) answers.DISTRICT = district;
  }

  if (typeof pruneInactive === "function") pruneInactive(answers, steps);
  return answers;
}

function sanitiseConsent(value, defaultLocale) {
  if (!isPlainRecord(value) || value.required !== true) return null;
  const optional = isPlainRecord(value.optional) ? value.optional : {};
  const version = /^consent_v\d+(?:_demo)?$/.test(value.version || "")
    ? value.version
    : "consent_unknown";
  return {
    required: true,
    optional: {
      history: optional.history === true,
      remind: optional.remind === true,
      contact: optional.contact === true,
      research: optional.research === true,
      loc: optional.loc === true
    },
    version,
    at: validDate(value.at) ? value.at : null,
    lang: value.lang === "th" || value.lang === "en" ? value.lang : defaultLocale,
    source: safeText(value.source, 40)
  };
}

function sanitiseFactor(value) {
  if (!isPlainRecord(value) || typeof value.code !== "string" || typeof value.name !== "string") return null;
  return {
    code: safeText(value.code, 80),
    version: Number.isFinite(Number(value.version)) ? Number(value.version) : null,
    name: safeText(value.name),
    explain: safeText(value.explain, 2000),
    next: safeText(value.next, 1000),
    evidence: safeText(value.evidence, 200)
  };
}

function sanitiseScreeningContext(value) {
  if (!isPlainRecord(value) || typeof value.key !== "string" || typeof value.label !== "string") return null;
  return {
    key: safeText(value.key, 80),
    label: safeText(value.label),
    summary: safeText(value.summary, 2000),
    action: safeText(value.action, 1000)
  };
}

function sanitiseCurrentResult(value, engineVersion) {
  if (!isPlainRecord(value) || value.model_version !== engineVersion) return null;
  if (!isPlainRecord(value.band) ||
      !["key", "label", "summary", "action", "cls"].every(key => typeof value.band[key] === "string")) {
    return null;
  }
  if (!Array.isArray(value.factors) || !SYMPTOM_PATHWAYS.has(value.symptom_pathway)) return null;
  if (!validDate(value.generated_at) || value.clinical_validation_status !== "not_clinically_validated") return null;

  const factors = value.factors.map(sanitiseFactor).filter(Boolean);
  return {
    model_version: engineVersion,
    clinical_validation_status: "not_clinically_validated",
    content_review_status: safeText(value.content_review_status, 80),
    content_review_date: validDate(value.content_review_date) ? value.content_review_date : null,
    generated_at: value.generated_at,
    score: Number.isFinite(Number(value.score)) ? Number(value.score) : null,
    symptom_pathway: value.symptom_pathway,
    band: {
      key: safeText(value.band.key, 80),
      label: safeText(value.band.label),
      summary: safeText(value.band.summary, 2000),
      action: safeText(value.band.action, 1000),
      cls: safeText(value.band.cls, 80)
    },
    factors,
    screening_context: sanitiseScreeningContext(value.screening_context)
  };
}

function sanitiseHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isPlainRecord)
    .filter(item => validDate(item.at) && typeof item.engine === "string")
    .slice(0, MAX_LOCAL_HISTORY)
    .map(item => ({
      at: item.at,
      bandKey: safeText(item.bandKey, 80),
      bandLabel: safeText(item.bandLabel),
      score: Number.isFinite(Number(item.score)) ? Number(item.score) : null,
      pathway: SYMPTOM_PATHWAYS.has(item.pathway) ? item.pathway : "standard",
      engine: safeText(item.engine, 80)
    }));
}

function sanitiseReferrals(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isPlainRecord)
    .filter(item => typeof item.id === "string" && item.id.length > 0)
    .slice(0, MAX_LOCAL_REFERRALS)
    .map(item => ({
      id: safeText(item.id, 80),
      facilityId: safeText(item.facilityId, 80),
      contact: safeText(item.contact, 80),
      days: safeText(item.days, 80),
      time: safeText(item.time, 80),
      note: safeText(item.note, 1000),
      statusIdx: Number.isInteger(item.statusIdx) ? Math.min(3, Math.max(0, item.statusIdx)) : 0,
      at: validDate(item.at) ? item.at : null
    }));
}

function sanitiseEvents(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isPlainRecord)
    .filter(item => /^[a-z0-9_]{1,80}$/.test(item.ev || "") && validDate(item.at))
    .slice(-MAX_LOCAL_EVENTS)
    .map(item => ({ ev: item.ev, at: item.at }));
}

function sanitiseReminders(value) {
  if (!isPlainRecord(value)) return createDefaultState().reminders;
  return {
    enabled: value.enabled === true,
    time: typeof value.time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.time)
      ? value.time
      : "09:00",
    freq: REMINDER_FREQUENCIES.includes(value.freq) ? value.freq : "รายเดือน"
  };
}

function hydrateSavedState(saved, {
  defaultLocale = "en",
  engineVersion = "",
  steps = [],
  provinces = [],
  pruneInactive
} = {}) {
  if (!isPlainRecord(saved)) throw new Error("Invalid saved state");

  const next = createDefaultState(defaultLocale);
  next.lang = saved.lang === "th" || saved.lang === "en" ? saved.lang : next.lang;
  next.lineLinked = saved.lineLinked === true;
  next.bigText = saved.bigText === true;
  next.providerRole = typeof saved.providerRole === "string" ? safeText(saved.providerRole, 80) : null;
  next.answers = sanitiseAssessmentAnswers(saved.answers, { steps, provinces, pruneInactive });
  next.consent = sanitiseConsent(saved.consent, next.lang);
  next.history = sanitiseHistory(saved.history);
  next.referrals = sanitiseReferrals(saved.referrals);
  next.reminders = sanitiseReminders(saved.reminders);
  next.events = sanitiseEvents(saved.events);
  next.stepIndex = Number.isInteger(saved.stepIndex)
    ? Math.min(Math.max(0, saved.stepIndex), Math.max(0, steps.length - 1))
    : 0;
  next.returnToReview = saved.returnToReview === true && Object.keys(next.answers).length > 0;

  const hadSavedResult = isPlainRecord(saved.result);
  next.result = sanitiseCurrentResult(saved.result, engineVersion);
  next.inProgress = next.result
    ? false
    : saved.inProgress === true || (hadSavedResult && Object.keys(next.answers).length > 0);
  if (hadSavedResult && !next.result) next.returnToReview = false;

  return next;
}

function loadStateFromStorage(storage, key, hydrateOptions = {}) {
  const fallback = createDefaultState(hydrateOptions.defaultLocale);
  try {
    const raw = storage.getItem(key);
    if (!raw) return { state: fallback, status: "empty", writable: true };
    const parsed = JSON.parse(raw);
    return {
      state: hydrateSavedState(parsed, hydrateOptions),
      status: "loaded",
      writable: true
    };
  } catch (error) {
    return {
      state: fallback,
      status: "unreadable",
      writable: false
    };
  }
}

function saveStateToStorage(storage, key, state) {
  try {
    storage.setItem(key, JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: "write_failed" };
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    MAX_LOCAL_EVENTS,
    MAX_LOCAL_HISTORY,
    MAX_LOCAL_REFERRALS,
    createDefaultState,
    hydrateSavedState,
    loadStateFromStorage,
    saveStateToStorage,
    sanitiseAssessmentAnswers,
    sanitiseCurrentResult
  };
}
