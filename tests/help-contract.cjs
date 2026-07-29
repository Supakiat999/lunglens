const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const menu = fs.readFileSync(path.join(root, "line", "setup-richmenu.mjs"), "utf8");

const requiredHelpCopy = [
  "LungLens is an educational, preliminary factor-assessment tool.",
  "Do not wait for a LungLens result or a LINE reply in an emergency.",
  "The LungLens clinic page is demonstrational and does not send a request to a hospital.",
  "without a LINE account or LINE login",
  "No clinical or support team is committed to answering chat messages.",
  "Do not send symptoms, test results, documents or personal health information in chat.",
  "There is not yet a verified support channel or guaranteed response time.",
  "clinical, legal and operational approval is still pending."
];

for (const text of requiredHelpCopy) {
  assert.ok(app.includes(text), `Missing truthful help-page copy: ${text}`);
}

assert.match(app, /help:\s*renderHelp/, "The public router must expose the Help page");
assert.match(app, /href="tel:1669"/, "The Thailand emergency action must use the 1669 telephone link");
assert.match(app, /href="#education=symptoms"/, "The symptom help action must open the public symptom article");
assert.match(menu, /"profile",\s*"help"/, "The LINE Help tile installer must open the Help route");
assert.doesNotMatch(menu, /"profile",\s*"home"/, "The LINE Help tile must not fall back to Home");
assert.doesNotMatch(app.match(/function renderHelp\(\)[\s\S]*?\n\}/)?.[0] || "", /\bmailto:/,
  "The Help page must not invent an unverified support email");

console.log(`Help contracts passed: ${requiredHelpCopy.length} safety and support boundaries plus the dedicated LINE Help route.`);
