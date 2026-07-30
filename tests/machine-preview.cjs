const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const data = require(path.join(root, "js", "data.js"));
Object.assign(global, data);
const engine = require(path.join(root, "js", "engine.js"));
const model = require(path.join(root, "machinever", "model.js"));

const html = fs.readFileSync(path.join(root, "machinever", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "machinever", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "machinever", "styles.css"), "utf8");

assert.equal(data.APP_VERSION, "prototype_0.15.1", "The regular app version must remain unchanged");
assert.equal(data.STORE_KEY, "lunglens-v1", "The regular app storage key must remain unchanged");
assert.equal(model.MACHINE_STORE_KEY, "lunglens-machine-v1");
assert.notEqual(model.MACHINE_STORE_KEY, data.STORE_KEY);
assert.equal(model.MACHINE_PREVIEW_VERSION, "machine_preview_0.1.1");
assert.equal(model.SESSION_TIMEOUT_MS, 120000);
assert.equal(model.SESSION_WARNING_MS, 30000);

const expected = {
  P1: "red",
  P2: "yellow",
  P3: "green",
  P4: "green"
};
for (const persona of data.PERSONAS) {
  const result = engine.evaluateRisk(structuredClone(persona.answers));
  assert.equal(model.machineBandKey(result), expected[persona.id], `${persona.id} machine color changed`);
}

const urgentAnswers = structuredClone(data.PERSONAS.find(persona => persona.id === "P3").answers);
const standardResult = engine.evaluateRisk(urgentAnswers);
urgentAnswers.SYMPTOMS = ["ไอเป็นเลือด"];
const urgentResult = engine.evaluateRisk(urgentAnswers);
assert.equal(urgentResult.symptom_pathway, "urgent");
assert.equal(urgentResult.score, standardResult.score, "Urgent symptoms must not alter factor score");
assert.equal(urgentResult.band.key, standardResult.band.key, "Urgent symptoms must not alter factor band");
assert.match(app, /state\.result\?\.symptom_pathway === "urgent"/);
assert.match(app, /emergencyNoDraft/);
assert.match(app, /function captureVisibleFormDraft\(\)/);
assert.match(app, /language-toggle"\)\.addEventListener\("click", \(\) => \{\s+captureVisibleFormDraft\(\)/);
assert.match(app, /text-toggle"\)\.addEventListener\("click", \(\) => \{\s+captureVisibleFormDraft\(\)/);

const youngBangkok = structuredClone(data.PERSONAS.find(persona => persona.id === "P3").answers);
youngBangkok.AGE = "ต่ำกว่า 40 ปี";
youngBangkok.PROVINCE = "กรุงเทพมหานคร";
const youngResult = engine.evaluateRisk(youngBangkok);
assert.equal(youngResult.score, 0);
assert.equal(model.machineBandKey(youngResult), "green");

const beforeSensor = engine.evaluateRisk(structuredClone(youngBangkok));
const snapshot = model.createSensorSnapshot(new Date("2026-07-30T12:00:00.000Z"));
const afterSensor = engine.evaluateRisk(structuredClone(youngBangkok));
assert.equal(snapshot.affectsFactorBand, false);
assert.equal(snapshot.affectsScreeningContext, false);
assert.equal(afterSensor.score, beforeSensor.score);
assert.equal(afterSensor.band.key, beforeSensor.band.key);

assert.ok(model.MOCK_IDENTITIES.every(profile => !("nationalId" in profile)));
assert.equal(model.containsNationalId(model.MOCK_IDENTITIES), false);
assert.equal(model.containsNationalId({ nationalId: "1234567890123" }), true);
assert.equal(model.containsNationalId({ lastActivityAt: 1785420000000 }), false,
  "A 13-digit numeric timestamp must not be mistaken for a national ID");
assert.equal(model.containsNationalId({ contact: "1234567890123" }), true);

const draft = model.createAppointmentDraft({
  facilityId: "F001",
  facilityName: "Demo",
  preferredDay: "2026-08-01",
  preferredTime: "morning",
  contactMethod: "phone",
  includeFactors: false,
  factorCodes: ["SHOULD_NOT_BE_INCLUDED"],
  engineVersion: data.ENGINE_VERSION,
  consented: true
}, new Date("2026-07-30T12:00:00.000Z"));
assert.equal(draft.status, "draft_unconfirmed");
assert.equal(draft.transmitted, false);
assert.equal(draft.confirmed, false);
assert.equal(draft.benefitVerified, false);
assert.deepEqual(draft.factorCodes, []);
assert.ok(draft.consentedAt);
assert.equal(model.isSafeMachineState({
  schemaVersion: 1,
  lang: "en",
  answers: {},
  result: null,
  appointmentDraft: null
}), true);
assert.equal(model.isSafeMachineState({
  schemaVersion: 1,
  lang: "en",
  answers: {},
  result: { assessment_status: "completed", band: { key: "made_up" }, symptom_pathway: "standard" },
  appointmentDraft: null
}), false, "Malformed saved results must be rejected");

for (const required of [
  "Public demonstration",
  "No real ID card",
  "No real ID card, live sensor, hospital booking, or government benefit is connected.",
  "../js/engine.js",
  "../css/styles.css",
  "class=\"app\"",
  "class=\"bottom\"",
  "model.js",
  "app.js"
]) {
  assert.ok(html.includes(required), `Machine HTML missing ${required}`);
}

assert.ok(!html.includes('href="../"'), "Machine HTML must not link to the regular LungLens app");
assert.ok(!app.includes('href="../"'), "Machine UI must not link to the regular LungLens app");
assert.ok(!app.includes("Open regular LungLens"), "Machine copy must not invite users to the regular app");

for (const required of [
  "Proposed 40% pilot support — demonstration only",
  "not currently active, verified, or guaranteed",
  "Appointment request draft — not confirmed",
  "ร่างคำขอนัดหมาย — ยังไม่ได้รับการยืนยัน",
  "does not mean safe, cancer-free, or zero risk",
  "does not diagnose disease",
  "No network request or hospital delivery occurs",
  "MACHINE_STORE_KEY"
]) {
  assert.ok(app.includes(required), `Machine copy/safety contract missing ${required}`);
}

for (const forbidden of [
  "40% discount is available",
  "government-approved discount",
  "you are safe",
  "high cancer risk",
  "appointment confirmed"
]) {
  assert.ok(!app.toLowerCase().includes(forbidden), `Unsafe machine claim found: ${forbidden}`);
}

assert.match(css, /@media \(max-width: 520px\)/);
assert.match(css, /@media print/);
assert.match(css, /The shared LungLens interface/);
assert.match(css, /var\(--brand\)/);
assert.match(css, /body\.big/);

console.log("Machine-preview checks passed: isolated storage, unchanged v0.15.1 engine, three display colors, urgent separation, simulated identity/sensors, local-only drafts, and safety wording.");
