const assert = require("node:assert/strict");
const data = require("../js/data.js");
const engine = require("../js/engine.js");
const { buildPortableExport, buildShareInvite } = require("../js/privacy.js");

Object.assign(global, data);

const answers = structuredClone(data.PERSONAS.find(persona => persona.id === "P1").answers);
const result = engine.evaluateRisk(answers);
const sourceState = {
  lang: "en",
  consent: { required: true, version: "consent_v1" },
  answers,
  result,
  history: [{
    at: result.generated_at,
    bandKey: result.band.key,
    bandLabel: result.band.label,
    score: result.score,
    pathway: result.symptom_pathway,
    engine: result.model_version
  }],
  referrals: [{ id: "R-DEMO", note: "wheelchair access", statusIdx: 0 }],
  reminders: { enabled: true, time: "09:00", freq: "รายเดือน" },
  events: [{ ev: "assessment_completed", at: result.generated_at }]
};

const exported = buildPortableExport(sourceState, {
  appVersion: data.APP_VERSION,
  storageKey: data.STORE_KEY,
  exportedAt: "2026-07-28T05:00:00.000Z"
});
assert.deepEqual(exported.appointment_request_drafts, []);

function assertNoInternalScoringKeys(value, path = "export") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoInternalScoringKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    assert.ok(!["score", "weight", "factor_codes", "prototype_weight"].includes(key),
      `Internal scoring key leaked at ${path}.${key}`);
    assertNoInternalScoringKeys(item, `${path}.${key}`);
  }
}

assertNoInternalScoringKeys(exported);
assert.deepEqual(exported.answers, answers, "Canonical answers must remain portable");
assert.equal(exported.current_result.band.key, result.band.key);
assert.equal(exported.current_result.factors[0].name, result.factors[0].name);
assert.equal(exported.current_result.content_review_status, "pending_medical_review");
assert.equal(exported.current_result.content_review_date, null);
assert.equal(exported.history[0].model_version, result.model_version);
assert.equal(sourceState.result.score, result.score, "Export builder must not mutate live state");

for (const lang of ["th", "en"]) {
  const invite = buildShareInvite(lang, "https://example.test/lunglens/");
  assert.match(invite, /https:\/\/example\.test\/lunglens\//);
  for (const band of Object.values(data.BANDS)) {
    assert.ok(!invite.includes(band.label), `Share invite leaked band label in ${lang}`);
  }
  for (const symptom of data.STEPS.find(step => step.id === "SYMPTOMS").options) {
    assert.ok(!invite.includes(symptom), `Share invite leaked symptom in ${lang}`);
  }
  assert.ok(!invite.includes(String(result.score)), `Share invite leaked internal score in ${lang}`);
}

console.log("Privacy-safety checks passed: portable export excludes internal scoring fields and LINE invite copy contains no health result.");
