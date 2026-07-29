const assert = require("node:assert/strict");
const data = require("../js/data.js");

Object.assign(global, data);
const engine = require("../js/engine.js");

assert.equal(data.APP_VERSION, "prototype_0.10.0");

const expected = {
  P1: { band: "professional_review", pathway: "standard" },
  P2: { band: "attention_recommended", pathway: "standard" },
  P3: { band: "no_elevated_factor", pathway: "standard" },
  P4: { band: "no_elevated_factor", pathway: "urgent" }
};

for (const persona of data.PERSONAS) {
  const result = engine.evaluateRisk(structuredClone(persona.answers));
  assert.equal(result.assessment_status, "completed", `${persona.id} should complete`);
  assert.equal(result.band.key, expected[persona.id].band, `${persona.id} band changed`);
  assert.equal(result.symptom_pathway, expected[persona.id].pathway, `${persona.id} pathway changed`);
  assert.equal(result.model_version, "prototype_rules_v2");
  assert.equal(result.clinical_validation_status, "not_clinically_validated");
}

const symptomFree = structuredClone(data.PERSONAS.find(persona => persona.id === "P3").answers);
const symptomUrgent = structuredClone(symptomFree);
symptomUrgent.SYMPTOMS = ["ไอเป็นเลือด"];
const standardResult = engine.evaluateRisk(symptomFree);
const urgentResult = engine.evaluateRisk(symptomUrgent);
assert.equal(urgentResult.score, standardResult.score, "Symptoms must never change the factor score");
assert.equal(urgentResult.band.key, standardResult.band.key, "Symptoms must never change the factor band");
assert.equal(standardResult.symptom_pathway, "standard");
assert.equal(urgentResult.symptom_pathway, "urgent");
assert.equal(urgentResult.screening_context.key, "symptoms_first");

const youngBangkokResident = structuredClone(symptomFree);
youngBangkokResident.AGE = "ต่ำกว่า 40 ปี";
youngBangkokResident.PROVINCE = "กรุงเทพมหานคร";
const youngBangkokResult = engine.evaluateRisk(youngBangkokResident);
assert.equal(youngBangkokResult.score, 0, "Bangkok residence must not add risk points");
assert.equal(youngBangkokResult.band.key, "no_elevated_factor");
assert.equal(youngBangkokResult.screening_context.key, "not_standard");
assert.ok(!youngBangkokResult.factor_codes.includes("AREA_PM25_ELEVATED"));

const olderWithoutOtherFactors = structuredClone(symptomFree);
olderWithoutOtherFactors.AGE = "70–79 ปี";
const olderWithoutOtherFactorsResult = engine.evaluateRisk(olderWithoutOtherFactors);
assert.equal(olderWithoutOtherFactorsResult.score, 0, "Age alone must not add risk points");
assert.equal(olderWithoutOtherFactorsResult.band.key, "no_elevated_factor");
assert.equal(olderWithoutOtherFactorsResult.screening_context.key, "not_standard");

const currentSmokerScreeningDiscussion = structuredClone(symptomFree);
currentSmokerScreeningDiscussion.AGE = "50–59 ปี";
currentSmokerScreeningDiscussion.SMOKE_STATUS = "ปัจจุบันยังสูบ";
currentSmokerScreeningDiscussion.SMOKE_DETAIL = { cpd: 20, years: 20 };
assert.equal(
  engine.evaluateRisk(currentSmokerScreeningDiscussion).screening_context.key,
  "discuss_ldct"
);

const recentFormerSmoker = structuredClone(currentSmokerScreeningDiscussion);
recentFormerSmoker.SMOKE_STATUS = "เคยสูบเป็นประจำ แต่เลิกแล้ว";
recentFormerSmoker.QUIT_YEARS = "11–15 ปี";
assert.equal(engine.evaluateRisk(recentFormerSmoker).screening_context.key, "discuss_ldct");

const longAgoFormerSmoker = structuredClone(recentFormerSmoker);
longAgoFormerSmoker.QUIT_YEARS = "มากกว่า 15 ปี";
assert.equal(engine.evaluateRisk(longAgoFormerSmoker).screening_context.key, "individual_review");

const incomplete = engine.evaluateRisk({});
assert.equal(incomplete.assessment_status, "incomplete");
assert.ok(incomplete.missing.length > 0);

for (const step of data.STEPS) {
  if (!step.exclusive) continue;
  assert.ok(step.exclusive.every(value => step.options.includes(value)), `${step.id} has an invalid exclusive option`);
}

for (const step of data.STEPS.filter(step => step.type === "group")) {
  for (const field of step.fields.filter(field => field.exclusive)) {
    assert.ok(field.exclusive.every(value => field.options.includes(value)), `${step.id}.${field.key} has an invalid exclusive option`);
  }
}

console.log("Regression checks passed: personas, symptom separation, Bangkok/age safety, screening context, incomplete assessment, exclusive-option schemas.");
