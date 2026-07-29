const assert = require("node:assert/strict");
const data = require("../js/data.js");
const validation = require("../js/validation.js");
const engine = require("../js/engine.js");
const recovery = require("../js/state.js");

Object.assign(global, data);

const options = {
  defaultLocale: data.DEFAULT_LOCALE,
  engineVersion: data.ENGINE_VERSION,
  steps: data.STEPS,
  provinces: data.PROVINCES,
  pruneInactive: validation.pruneInactiveAnswers
};

function hydrate(saved) {
  return recovery.hydrateSavedState(saved, options);
}

assert.equal(data.STORE_KEY, "lunglens-v1", "Recovery work must not change the storage key");
for (const invalid of [null, [], "bad", 42]) {
  assert.throws(() => hydrate(invalid), /Invalid saved state/);
}

assert.deepEqual(hydrate({}), recovery.createDefaultState("en"), "Empty state should recover to safe defaults");

const prototypePayload = JSON.parse('{"__proto__":{"polluted":true},"lang":"en"}');
const prototypeRecovered = hydrate(prototypePayload);
assert.equal(prototypeRecovered.polluted, undefined);
assert.equal({}.polluted, undefined, "Saved JSON must not alter object prototypes");

const now = "2026-07-29T12:00:00.000Z";
const manyEvents = Array.from({ length: 250 }, (_, index) => ({ ev: `event_${index}`, at: now }));
const manyHistory = Array.from({ length: 30 }, (_, index) => ({
  at: now,
  bandKey: "attention",
  bandLabel: `History ${index}`,
  score: index,
  pathway: "standard",
  engine: data.ENGINE_VERSION
}));
const manyReferrals = Array.from({ length: 30 }, (_, index) => ({
  id: `R${index}`,
  facilityId: "F1",
  contact: "LINE",
  days: "จันทร์–ศุกร์",
  time: "เช้า (9:00–12:00)",
  note: "demo",
  statusIdx: index === 0 ? 99 : 0,
  at: now
}));

const corrupted = {
  lang: "invalid",
  lineLinked: "yes",
  bigText: true,
  providerRole: 123,
  consent: { required: false, optional: { history: true } },
  answers: {
    AGE: "40–49 ปี",
    SEX: "invalid",
    PROVINCE: "Not a province",
    DISTRICT: "should be removed",
    SMOKE_STATUS: "ไม่เคยสูบ",
    SMOKE_DETAIL: { cpd: 1000, years: 5 },
    MED_HISTORY: ["วัณโรคปอด", "ไม่มีข้อใดข้างต้น"],
    UNKNOWN: "remove me"
  },
  stepIndex: 9999,
  returnToReview: true,
  inProgress: "yes",
  result: {
    model_version: data.ENGINE_VERSION,
    clinical_validation_status: "not_clinically_validated",
    generated_at: now,
    symptom_pathway: "standard",
    factors: []
  },
  history: manyHistory,
  referrals: manyReferrals,
  reminders: { enabled: "yes", time: "35:99", freq: "weekly" },
  events: manyEvents
};
const corruptedBefore = structuredClone(corrupted);
const recovered = hydrate(corrupted);

assert.deepEqual(corrupted, corruptedBefore, "Hydration must not mutate the stored object");
assert.equal(recovered.lang, "en");
assert.equal(recovered.lineLinked, false);
assert.equal(recovered.bigText, true);
assert.equal(recovered.providerRole, null);
assert.equal(recovered.consent, null);
assert.equal(recovered.answers.AGE, "40–49 ปี");
assert.equal(recovered.answers.SEX, undefined);
assert.equal(recovered.answers.PROVINCE, undefined);
assert.equal(recovered.answers.DISTRICT, undefined);
assert.equal(recovered.answers.SMOKE_DETAIL, undefined, "Inactive smoking detail must be pruned");
assert.deepEqual(recovered.answers.MED_HISTORY, ["ไม่มีข้อใดข้างต้น"], "Exclusive options must win during recovery");
assert.equal(recovered.answers.UNKNOWN, undefined);
assert.equal(recovered.stepIndex, data.STEPS.length - 1);
assert.equal(recovered.result, null, "Malformed current-version result must be retired");
assert.equal(recovered.inProgress, true, "Answers should remain available for reassessment");
assert.equal(recovered.returnToReview, false, "Invalid results must not reopen review mode");
assert.equal(recovered.history.length, recovery.MAX_LOCAL_HISTORY);
assert.equal(recovered.referrals.length, recovery.MAX_LOCAL_REFERRALS);
assert.equal(recovered.referrals[0].statusIdx, 3);
assert.deepEqual(recovered.reminders, { enabled: false, time: "09:00", freq: "รายเดือน" });
assert.equal(recovered.events.length, recovery.MAX_LOCAL_EVENTS);
assert.equal(recovered.events[0].ev, "event_50", "Newest bounded local events should be retained");

const persona = data.PERSONAS.find(item => item.id === "P1");
const answers = structuredClone(persona.answers);
const currentResult = engine.evaluateRisk(answers);
const validState = {
  lang: "th",
  consent: {
    required: true,
    optional: { history: true, remind: 1, contact: true, research: false, loc: true },
    version: "consent_v2",
    at: now,
    lang: "th",
    source: "liff"
  },
  answers,
  inProgress: true,
  result: currentResult,
  reminders: { enabled: true, time: "08:30", freq: "ราย 3 เดือน" }
};
const validRecovered = hydrate(validState);
assert.equal(validRecovered.result.band.key, currentResult.band.key);
assert.equal(validRecovered.result.model_version, data.ENGINE_VERSION);
assert.equal(validRecovered.inProgress, false, "A valid current result must not also resume assessment");
assert.equal(validRecovered.consent.version, "consent_v2");
assert.equal(validRecovered.consent.optional.history, true);
assert.equal(validRecovered.consent.optional.remind, false, "Optional choices require strict booleans");
assert.equal(validRecovered.consent.optional.contact, true);
assert.deepEqual(validRecovered.reminders, { enabled: true, time: "08:30", freq: "ราย 3 เดือน" });

const retiredState = structuredClone(validState);
retiredState.result.model_version = "prototype_rules_retired";
retiredState.returnToReview = true;
const retiredRecovered = hydrate(retiredState);
assert.equal(retiredRecovered.result, null);
assert.equal(retiredRecovered.inProgress, true);
assert.equal(retiredRecovered.returnToReview, false);
assert.equal(retiredRecovered.answers.AGE, answers.AGE, "Retired results must preserve canonical answers");

const partialNumbers = hydrate({
  answers: {
    SMOKE_STATUS: "ปัจจุบันยังสูบ",
    SMOKE_DETAIL: { cpd: "12", years: "invalid" }
  },
  inProgress: true
});
assert.deepEqual(partialNumbers.answers.SMOKE_DETAIL, { cpd: 12 });
assert.equal(partialNumbers.inProgress, true);

const unknownNumbers = hydrate({
  answers: {
    SMOKE_STATUS: "ปัจจุบันยังสูบ",
    SMOKE_DETAIL: { unknown: true, cpd: 20, years: 20 }
  },
  inProgress: true
});
assert.deepEqual(unknownNumbers.answers.SMOKE_DETAIL, { unknown: true },
  "Explicitly unknown amounts must be preserved without stale numeric values");

const emptyStorage = {
  getItem(key) {
    assert.equal(key, data.STORE_KEY);
    return null;
  },
  setItem() {
    throw new Error("not used");
  }
};
const emptyLoaded = recovery.loadStateFromStorage(emptyStorage, data.STORE_KEY, options);
assert.equal(emptyLoaded.status, "empty");
assert.equal(emptyLoaded.writable, true);
assert.deepEqual(emptyLoaded.state, recovery.createDefaultState("en"));

const validStorage = {
  getItem() {
    return JSON.stringify(validState);
  }
};
const storedLoaded = recovery.loadStateFromStorage(validStorage, data.STORE_KEY, options);
assert.equal(storedLoaded.status, "loaded");
assert.equal(storedLoaded.state.result.band.key, currentResult.band.key);

let corruptedWasOverwritten = false;
const corruptedStorage = {
  getItem() {
    return "{not valid json";
  },
  setItem() {
    corruptedWasOverwritten = true;
  }
};
const unreadable = recovery.loadStateFromStorage(corruptedStorage, data.STORE_KEY, options);
assert.equal(unreadable.status, "unreadable");
assert.equal(unreadable.writable, false);
assert.deepEqual(unreadable.state, recovery.createDefaultState("en"));
assert.equal(corruptedWasOverwritten, false, "Unreadable state must not be overwritten during recovery");

const disabledStorage = {
  getItem() {
    throw new Error("storage disabled");
  }
};
assert.equal(
  recovery.loadStateFromStorage(disabledStorage, data.STORE_KEY, options).status,
  "unreadable"
);

let writtenKey = null;
let writtenValue = null;
const writableStorage = {
  setItem(key, value) {
    writtenKey = key;
    writtenValue = value;
  }
};
assert.deepEqual(recovery.saveStateToStorage(writableStorage, data.STORE_KEY, validRecovered), { ok: true });
assert.equal(writtenKey, "lunglens-v1");
assert.equal(JSON.parse(writtenValue).result.band.key, currentResult.band.key);

const fullStorage = {
  setItem() {
    throw new Error("quota exceeded");
  }
};
assert.deepEqual(
  recovery.saveStateToStorage(fullStorage, data.STORE_KEY, validRecovered),
  { ok: false, error: "write_failed" }
);

console.log("State-recovery checks passed: invalid roots, prototype safety, answer sanitisation, bounded arrays, consent, reminders, current/retired results, partial progress, and disabled/full/corrupted/cleared storage.");
