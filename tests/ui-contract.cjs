const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");

const requiredPublicCopy = [
  "Your result in four questions",
  "What did the assessment notice?",
  "Do the reported symptoms need attention?",
  "What can you do now?",
  "What can a healthcare professional help decide?",
  "Information that did not increase the factor band",
  "Province, location and current pollution never enter the factor band or screening criteria.",
  "Symptoms use a separate safety pathway and never add factor points.",
  "Age alone never raises the factor band or creates LDCT eligibility.",
  "Questions to take to a healthcare professional",
  "Using a shared device?",
  "Why the assessment asks for a province",
  "Province is used only to show local air quality and help find nearby services.",
  "What to verify before contacting a service",
  "Appearing in this prototype is not an endorsement and does not confirm that LDCT is available.",
  "Never use this demo request for an emergency.",
  "What a live referral service must do",
  "No receiving organization or approved response time exists yet, so live submission cannot be enabled.",
  "Delete this demo request from this device",
  "Shared devices and browser storage",
  "LungLens has no server copy to restore.",
  "Why a future result may change",
  "A new symptom may change the separate symptom guidance, but symptoms never add points or change the factor band.",
  "A changed result does not confirm that disease appeared, improved or worsened."
];

for (const text of requiredPublicCopy) {
  assert.ok(app.includes(text), `Missing safety or trust copy: ${text}`);
}

assert.match(
  app,
  /Province is used only[\s\S]*?never changes the factor band[\s\S]*?never creates LDCT eligibility/,
  "Province explanation must explicitly exclude factor-band and LDCT effects"
);
assert.match(
  app,
  /Symptoms are handled separately from the factor result/,
  "Result must keep symptom routing separate from the factor band"
);
assert.match(
  app,
  /does not mean it is safe; it only did not match a current prototype rule/,
  "A low-feature result must not be presented as reassurance"
);
assert.match(
  app,
  /does not affect any hospital/,
  "Deleting a demo referral must not imply a hospital cancellation"
);

console.log(`Public UI contracts passed: ${requiredPublicCopy.length} required safety, trust and privacy messages are present.`);
