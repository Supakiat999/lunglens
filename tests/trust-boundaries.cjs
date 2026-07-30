const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");

const requiredTruthfulCopy = [
  "These optional choices only save preferences in this browser.",
  "They do not send messages or research data, share location, or cause staff to contact you.",
  "Save that I may want LINE reminders in a future service (no messages are sent)",
  "Save that I may want staff contact in a future service (no staff are connected)",
  "Save my interest in future programme evaluation or research (no data are sent)",
  "browser permission is separate",
  "Reminder settings and optional choices below are saved only in this browser.",
  "No LINE message is sent.",
  "Messaging, approved reminder content and delivery tracking are not connected.",
  "Reminder, contact, research and location preferences are browser-only settings.",
  "They do not activate a service or send data.",
  "No operational privacy or support contact is connected yet.",
  "A live channel must name the responsible organization and response time before launch.",
  "Prepare to find health services",
  "Preview how to verify services and request help"
];

for (const text of requiredTruthfulCopy) {
  assert.ok(app.includes(text), `Missing prototype trust-boundary copy: ${text}`);
}

assert.ok(app.includes('version: "consent_v2"'), "New consent records must use consent_v2");
assert.ok(app.includes('version: "consent_v2_demo"'), "Demo consent records must identify consent_v2_demo");
assert.ok(app.includes("privacy_prototype_v4"), "Privacy draft must be versioned after operational-boundary changes");
assert.ok(app.includes('id="consent-required-error" role="alert"'), "Required-consent errors must be announced inline");
assert.ok(app.includes('aria-describedby="consent-required-error"'), "Required consent group must reference its inline error");

const reminderFunction = app.match(/function toggleRemind\(on\) \{[\s\S]*?\n\}/)?.[0] || "";
assert.ok(reminderFunction, "Missing demo reminder preference handler");
assert.doesNotMatch(reminderFunction, /\b(fetch|sendMessages|shareTargetPicker|XMLHttpRequest)\b/,
  "Demo reminder preference must not send a network or LINE message");
assert.match(reminderFunction, /demo_reminder_preference_enabled/);
assert.match(reminderFunction, /no message was sent/);

const removedPlaceholderAddress = ["privacy", "lunglens.example"].join("@");
assert.ok(!app.includes(removedPlaceholderAddress), "A placeholder privacy email must not appear as a contact channel");
assert.ok(!app.includes('"reminder_opted_in"'), "Local demo preference must not be tracked as a live reminder opt-in");
assert.ok(!app.includes('"reminder_opted_out"'), "Local demo preference must not be tracked as a live reminder opt-out");

console.log(`Trust-boundary checks passed: ${requiredTruthfulCopy.length} operational-status statements, consent v2, local-only reminders and no placeholder support email.`);
