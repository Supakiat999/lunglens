const assert = require("node:assert/strict");
const data = require("../js/data.js");

Object.assign(global, data);
const engine = require("../js/engine.js");

const expected = {
  P1: { band: "professional_review", pathway: "standard" },
  P2: { band: "attention_recommended", pathway: "standard" },
  P3: { band: "no_elevated_factor", pathway: "standard" },
  P4: { band: "attention_recommended", pathway: "urgent" }
};

for (const persona of data.PERSONAS) {
  const result = engine.evaluateRisk(structuredClone(persona.answers));
  assert.equal(result.assessment_status, "completed", `${persona.id} should complete`);
  assert.equal(result.band.key, expected[persona.id].band, `${persona.id} band changed`);
  assert.equal(result.symptom_pathway, expected[persona.id].pathway, `${persona.id} pathway changed`);
  assert.equal(result.model_version, "prototype_rules_v1");
  assert.equal(result.clinical_validation_status, "not_clinically_validated");
}

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

console.log("Regression checks passed: personas, incomplete assessment, exclusive-option schemas.");
