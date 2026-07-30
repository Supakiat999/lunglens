const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const recovery = require("../js/state.js");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "styles.css"), "utf8");

const now = "2026-07-30T10:00:00.000Z";
const valid = {
  schema: "appointment_request_v1",
  id: "DRAFT-20260730-A1B2",
  facilityId: "F1",
  status: "draft_unconfirmed",
  name: "Example user",
  contactMethod: "phone",
  contactValue: "0800000000",
  preferredDay: "weekdays",
  preferredTime: "morning",
  accessibilityNote: "Wheelchair access",
  includeFactorSummary: true,
  factorCodes: ["FAMILY_LUNG_CANCER", "FAMILY_LUNG_CANCER", "bad-code"],
  resultBandKey: "professional_review",
  engineVersion: "prototype_rules_v2",
  createdAt: now,
  updatedAt: now,
  consentAt: now
};

const sanitised = recovery.sanitiseAppointmentRequests([valid]);
assert.equal(sanitised.length, 1);
assert.equal(sanitised[0].status, "draft_unconfirmed");
assert.equal(sanitised[0].resultBandKey, "professional_review");
assert.deepEqual(sanitised[0].factorCodes, ["FAMILY_LUNG_CANCER"]);

const factorsOff = recovery.sanitiseAppointmentRequests([{
  ...valid,
  id: "DRAFT-20260730-C3D4",
  includeFactorSummary: false,
  factorCodes: ["FAMILY_LUNG_CANCER"]
}]);
assert.deepEqual(factorsOff[0].factorCodes, [], "Factor codes must be removed when sharing is not selected");

const capped = recovery.sanitiseAppointmentRequests(
  Array.from({ length: 30 }, (_, index) => ({
    ...valid,
    id: `DRAFT-20260730-${String(index).padStart(4, "0")}`
  }))
);
assert.equal(capped.length, recovery.MAX_LOCAL_APPOINTMENT_REQUESTS);

for (const invalid of [
  { ...valid, schema: "other" },
  { ...valid, id: "official-appointment-123" },
  { ...valid, status: "confirmed" },
  { ...valid, resultBandKey: "attention_recommended" },
  { ...valid, consentAt: "invalid" }
]) {
  assert.deepEqual(recovery.sanitiseAppointmentRequests([invalid]), []);
}

assert.match(app, /state\.result\?\.band\?\.key === "professional_review"/);
assert.match(app, /state\.result\?\.symptom_pathway === "standard"/);
assert.match(app, /b === BANDS\.review[\s\S]*r\.symptom_pathway === "standard"/);
assert.match(app, /Appointment request draft — not confirmed/);
assert.match(app, /ร่างคำขอนัดหมาย — ยังไม่ได้รับการยืนยัน/);
assert.match(app, /class="appointment-print card" data-no-localize/);
assert.match(app, /No hospital or staff member receives information from this page/);
assert.match(app, /LungLens never copies your name or contact details from LINE/);
assert.match(app, /window\.print\(\)/);
assert.match(css, /@media print/);
assert.match(css, /main > :not\(\.appointment-print\)/);
assert.match(css, /\.appointment-draft-banner\s*\{[\s\S]*position:\s*fixed/);
assert.match(css, /\.appointment-print-warning\s*\{[\s\S]*position:\s*fixed/);

const appointmentSection = app.slice(
  app.indexOf("SCREEN: local appointment-request draft"),
  app.indexOf("SCREEN: referral")
);
assert.doesNotMatch(appointmentSection, /\bfetch\s*\(|XMLHttpRequest|sendMessages|shareTargetPicker/,
  "Appointment drafts must remain local-only");
assert.doesNotMatch(appointmentSection, /status:\s*"confirmed"|appointment_confirmed|hospital has (?:received|confirmed)/i,
  "The flow must not claim hospital receipt or confirmation");

console.log("Appointment-request checks passed: blue/standard gating, red separation, consented local schema, privacy controls, unconfirmed bilingual print layout, and no network delivery.");
