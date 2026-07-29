const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const index = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

[
  'class="skip-link"',
  '<main id="view" tabindex="-1">',
  'aria-label="เมนูหลัก"',
  'aria-label="ปรับขนาดตัวอักษร"',
  'aria-label="เปลี่ยนภาษา"'
].forEach(contract => assert.ok(index.includes(contract), `Missing app-shell accessibility contract: ${contract}`));

[
  'role="dialog"',
  'aria-modal="true"',
  'aria-labelledby',
  'e.key === "Escape"',
  'e.key !== "Tab"',
  'document.activeElement === first',
  'document.activeElement === last',
  "modalReturnFocus.focus()"
].forEach(contract => assert.ok(app.includes(contract), `Missing modal keyboard/focus contract: ${contract}`));

const labelledControls = [
  ["rf-contact", "ช่องทางที่สะดวก"],
  ["rf-days", "วันที่สะดวก"],
  ["rf-time", "ช่วงเวลาที่สะดวก"],
  ["rf-note", "ความต้องการด้านการเข้าถึง / หมายเหตุ (ไม่บังคับ)"],
  ["reminder-time", "เวลา"],
  ["reminder-frequency", "ความถี่"],
  ["education-search", "ค้นหาหัวข้อ"],
  ["air-province", "จังหวัด"],
  ["air-station", "สถานีตรวจวัด"]
];

for (const [id, label] of labelledControls) {
  assert.ok(app.includes(`for="${id}"`), `Missing explicit label connection for ${id} (${label})`);
  assert.ok(app.includes(`id="${id}"`), `Missing labelled form control ${id}`);
}

assert.ok(app.includes('type="button" class="storyboard-trigger"'), "Storyboard must be a keyboard-operable button");
assert.ok(app.includes('aria-label="${esc(uiText('), "Storyboard button must have a localized accessible name");
assert.ok(app.includes('<a class="card edu-article-card"'), "Education cards must be keyboard-operable links");
assert.ok(!app.includes('style="cursor:pointer" onclick="location.hash=\'#education='), "Education cards must not be mouse-only divs");

console.log("Accessibility contracts passed: app shell, dialogs, explicit form labels, storyboard button and article links.");
