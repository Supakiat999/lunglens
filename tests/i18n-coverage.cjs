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
  data.STEPS,
  data.RULES,
  data.BANDS,
  data.SCREENING_CONTEXTS,
  data.FACILITIES,
  data.EDU_CATEGORIES,
  data.ARTICLES,
  data.PERSONAS
].forEach(inspect);

assert.deepEqual([...missing].sort(), [], `Missing English translations:\n${[...missing].sort().join("\n")}`);
assert.ok(I18N_UI.en.document_title);
assert.ok(I18N_UI.en.document_description);
assert.ok(I18N_UI.en.language_changed_en);
assert.equal(data.ARTICLES.length, data.EDU_CATEGORIES.length, "Every education topic must have a complete article");
for (const category of data.EDU_CATEGORIES) {
  assert.ok(data.ARTICLES.some(article => article.category === category), `Missing article for ${category}`);
}
for (const article of data.ARTICLES) {
  assert.ok(article.version, `Missing content version: ${article.slug}`);
  assert.match(article.updated, /^\d{4}-\d{2}-\d{2}$/, `Missing review date: ${article.slug}`);
  assert.ok(Array.isArray(article.refs) && article.refs.length > 0, `Missing sources: ${article.slug}`);
  for (const ref of article.refs) {
    assert.match(ref.url, /^https:\/\/(www\.)?(cdc\.gov|cancer\.gov|who\.int|air4thai\.pcd\.go\.th|hpc10app\.anamai\.moph\.go\.th|anamai\.moph\.go\.th)\//,
      `Non-authoritative article source: ${article.slug} ${ref.url}`);
  }
}
for (const [code, slug] of Object.entries(data.FACTOR_EDUCATION_MAP)) {
  assert.ok(data.RULES.some(rule => rule.code === code), `Education map references unknown rule: ${code}`);
  assert.ok(data.ARTICLES.some(article => article.slug === slug), `Education map references unknown article: ${slug}`);
}
[
  "ข้ามไปยังเนื้อหาหลัก",
  "ตรวจทานคำตอบ",
  "ตรวจทานคำตอบก่อนดูผล",
  "โปรดตรวจสอบคำตอบของคุณ คุณสามารถแก้ไขได้ก่อนสร้างผลประเมินเบื้องต้น",
  "ยืนยันคำตอบและดูผล",
  "ความคืบหน้าแบบประเมิน",
  "เวอร์ชัน",
  "บันทึกประวัติการประเมิน",
  "ส่งคำขอแล้ว",
  "ตรวจค่าฝุ่น PM2.5 ในจังหวัดของคุณ",
  "คุณภาพอากาศในพื้นที่ของคุณวันนี้",
  "ดูค่าฝุ่นตามจังหวัดและสถานี",
  "ดูข้อมูล PM2.5 ล่าสุดในจังหวัดของคุณ",
  "เตรียมคำถามสำหรับบุคลากรทางการแพทย์",
  "ข้อมูลอยู่ที่ไหนในต้นแบบนี้",
  "การส่งออกและลบข้อมูล",
  "ดาวน์โหลดข้อมูลของฉัน",
  "ไม่สามารถอ่านข้อมูลที่บันทึกไว้ได้ แอปจะไม่เขียนทับข้อมูลเดิมในครั้งนี้"
].forEach(source => assert.ok(EN_TRANSLATIONS[source], `Missing public UI translation: ${source}`));

console.log(`English coverage passed: ${Object.keys(EN_TRANSLATIONS).length} translated source strings.`);
