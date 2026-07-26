const assert = require("node:assert/strict");
const data = require("../js/data.js");
const { EN_TRANSLATIONS, I18N_UI } = require("../js/i18n.js");

const THAI = /[ก-๙]/;
const missing = new Set();

function inspect(value) {
  if (typeof value === "string") {
    if (THAI.test(value) && !EN_TRANSLATIONS[value]) missing.add(value);
    return;
  }
  if (Array.isArray(value)) return value.forEach(inspect);
  if (!value || typeof value !== "object") return;
  for (const item of Object.values(value)) {
    if (typeof item !== "function") inspect(item);
  }
}

[
  data.PROVINCES,
  data.STEPS,
  data.RULES,
  data.BANDS,
  data.PM25_DEMO,
  data.FACILITIES,
  data.EDU_CATEGORIES,
  data.ARTICLES,
  data.PERSONAS
].forEach(inspect);

assert.deepEqual([...missing].sort(), [], `Missing English translations:\n${[...missing].sort().join("\n")}`);
assert.ok(I18N_UI.en.document_title);
assert.ok(I18N_UI.en.document_description);
assert.ok(I18N_UI.en.language_changed_en);
[
  "ข้ามไปยังเนื้อหาหลัก",
  "ตรวจทานคำตอบ",
  "ตรวจทานคำตอบก่อนดูผล",
  "โปรดตรวจสอบคำตอบของคุณ คุณสามารถแก้ไขได้ก่อนสร้างผลประเมินเบื้องต้น",
  "ยืนยันคำตอบและดูผล",
  "ความคืบหน้าแบบประเมิน",
  "ไม่สามารถอ่านข้อมูลที่บันทึกไว้ได้ แอปจะไม่เขียนทับข้อมูลเดิมในครั้งนี้"
].forEach(source => assert.ok(EN_TRANSLATIONS[source], `Missing public UI translation: ${source}`));

console.log(`English coverage passed: ${Object.keys(EN_TRANSLATIONS).length} translated source strings.`);
