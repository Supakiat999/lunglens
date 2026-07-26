const assert = require("node:assert/strict");
const data = require("../js/data.js");

Object.assign(global, data);
const validation = require("../js/validation.js");

for (const persona of data.PERSONAS) {
  const issues = validation.validateAssessment(structuredClone(persona.answers));
  assert.deepEqual(issues, [], `${persona.id} should pass questionnaire validation`);
}

const occupational = data.STEPS.find(step => step.id === "OCC_DETAIL");
const incompleteGroup = {
  OCC_EXPOSED: "เคย",
  OCC_DETAIL: { types: ["ฝุ่นก่อสร้าง"], duration: "20 ปีขึ้นไป" }
};
const groupIssue = validation.validateAssessmentStep(occupational, incompleteGroup);
assert.equal(groupIssue.code, "group_field_required");
assert.equal(groupIssue.fieldKey, "protection");

const smokingDetail = data.STEPS.find(step => step.id === "SMOKE_DETAIL");
const rangeIssue = validation.validateAssessmentStep(smokingDetail, {
  SMOKE_DETAIL: { cpd: 101, years: 20 }
});
assert.equal(rangeIssue.code, "number_range");
assert.equal(rangeIssue.fieldKey, "cpd");

const staleConditional = {
  SMOKE_STATUS: "ไม่เคยสูบ",
  SMOKE_DETAIL: { cpd: 20, years: 10 },
  SHS_HOME: "ไม่เคย",
  SHS_DETAIL: { years: "20 ปีขึ้นไป" },
  OCC_EXPOSED: "ไม่เคย",
  OCC_DETAIL: { types: ["ฝุ่นก่อสร้าง"] }
};
validation.pruneInactiveAnswers(staleConditional);
assert.equal("SMOKE_DETAIL" in staleConditional, false);
assert.equal("SHS_DETAIL" in staleConditional, false);
assert.equal("OCC_DETAIL" in staleConditional, false);

console.log("Validation checks passed: personas, grouped fields, ranges, conditional cleanup.");
