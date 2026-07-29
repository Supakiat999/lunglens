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
const missingSmokingNumber = validation.validateAssessmentStep(smokingDetail, {
  SMOKE_DETAIL: { cpd: 20 }
});
assert.equal(missingSmokingNumber.code, "number_required");
assert.equal(missingSmokingNumber.fieldKey, "years");

const rangeIssue = validation.validateAssessmentStep(smokingDetail, {
  SMOKE_DETAIL: { cpd: 101, years: 20 }
});
assert.equal(rangeIssue.code, "number_range");
assert.equal(rangeIssue.fieldKey, "cpd");

const integerIssue = validation.validateAssessmentStep(smokingDetail, {
  SMOKE_DETAIL: { cpd: 1.5, years: 20 }
});
assert.equal(integerIssue.code, "number_integer");
assert.equal(integerIssue.fieldKey, "cpd");

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

const formerSmokerMissingQuitTime = structuredClone(data.PERSONAS[2].answers);
formerSmokerMissingQuitTime.SMOKE_STATUS = "เคยสูบเป็นประจำ แต่เลิกแล้ว";
formerSmokerMissingQuitTime.SMOKE_DETAIL = { cpd: 20, years: 20 };
const formerSmokerIssues = validation.validateAssessment(formerSmokerMissingQuitTime);
assert.ok(formerSmokerIssues.some(issue => issue.stepId === "QUIT_YEARS"));

console.log("Validation checks passed: personas, required smoking details, ranges, whole numbers, conditional cleanup.");
