/* =====================================================================
   LungLens / รู้ทันปอด — prototype app shell
   Static SPA, hash-routed, state in localStorage (key: lunglens-v1).
   LINE LIFF calls are mocked — see liffMock() and README.md.
   ===================================================================== */

/* ---------------- state ---------------- */
const DEFAULT_STATE = {
  lang: "th",
  lineLinked: false,
  consent: null,            // { required:true, optional:{...}, version, at, lang }
  answers: {},
  stepIndex: 0,
  inProgress: false,
  result: null,
  history: [],              // [{at, bandKey, bandLabel, score, pathway}]
  referrals: [],            // [{id, facilityId, contact, days, time, note, status, statusIdx, at}]
  reminders: { enabled: false, time: "09:00", freq: "รายเดือน" },
  events: []                // privacy-conscious analytics event names only
};
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(structuredClone(DEFAULT_STATE), JSON.parse(raw));
  } catch (e) {}
  return structuredClone(DEFAULT_STATE);
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function track(ev) { state.events.push({ ev, at: new Date().toISOString() }); save(); }

/* ---------------- tiny helpers ---------------- */
const $ = sel => document.querySelector(sel);
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function modal(html, { closable = true } = {}) {
  closeModal();
  const back = document.createElement("div");
  back.className = "modal-back"; back.id = "modalBack";
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}
    ${closable ? '<button class="btn btn-ghost mt" onclick="closeModal()">ปิด</button>' : ""}</div>`;
  if (closable) back.addEventListener("click", e => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
}
function closeModal() { $("#modalBack")?.remove(); }

/* Prototype popup for not-yet-real features */
function protoPopup(feature, detail) {
  modal(`<h3>🧪 ฟีเจอร์ต้นแบบ</h3>
    <p><b>${esc(feature)}</b></p>
    <p class="muted">${esc(detail || "ส่วนนี้เป็นการจำลองการทำงาน ยังไม่เชื่อมต่อระบบจริง")}</p>
    <p class="tiny mt">ต้องยืนยันกับผู้เชี่ยวชาญ/เชื่อมระบบจริงก่อนใช้งานจริง — ดูรายการงานใน TASKS.md</p>`);
}

/* ---------------- router ---------------- */
const ROUTES = {
  home: renderHome, begin: renderBegin, consent: renderConsent, assess: renderAssess,
  symptom: renderSymptomPathway, result: renderResult, education: renderEducation,
  clinics: renderClinics, referral: renderReferral, profile: renderProfile,
  provider: renderProvider, "demo-story": renderStory, privacy: renderPrivacy
};
function route() {
  /* LIFF deep links: https://liff.line.me/{LIFF_ID}?p=begin → route "begin".
     Resolved here (not by assigning location.hash during page load, which the
     browser reverts when the pending navigation commits). */
  let raw = location.hash;
  if (!raw) {
    const p = new URLSearchParams(location.search).get("p");
    if (p) raw = "#" + p.replace(/[^a-z=-]/gi, "");
  }
  const hash = (raw || "#home").slice(1);
  const [name, arg] = hash.split("=");
  const fn = ROUTES[name.replace(/^\//, "")] || renderHome;
  window.scrollTo(0, 0);
  fn(arg);
  document.querySelectorAll("nav.bottom a").forEach(a => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + name);
  });
}
window.addEventListener("hashchange", route);

function view(html) { $("#view").innerHTML = html; }

/* =====================================================================
   SCREEN: landing
   ===================================================================== */
function renderHome() {
  track("landing_viewed");
  const hasResult = !!state.result;
  const resume = state.inProgress && !state.result;
  view(`
  <div class="hero">
    <h1>ไม่สูบ ไม่ได้แปลว่าไม่เสี่ยง</h1>
    <p>มะเร็งปอดไม่ได้เกิดเฉพาะกับผู้สูบบุหรี่ อายุ ประวัติครอบครัว โรคปอดเดิม อาชีพ ควัน และมลพิษอาจมีส่วนต่อความเสี่ยงของแต่ละคน</p>
    <a class="btn btn-primary" href="#begin" onclick="track('assessment_cta_clicked')">ประเมินความเสี่ยง 2–3 นาที</a>
    <a class="btn btn-ghost" href="#education">มะเร็งปอดในคนไม่สูบบุหรี่คืออะไร</a>
  </div>

  ${resume ? `<div class="card" style="border-color:#a5f3fc;background:var(--brand-soft)">
    <b>คุณได้บันทึกแบบประเมินสุขภาพปอดไว้</b>
    <p class="muted">แตะเพื่อทำต่อเมื่อสะดวก</p>
    <a class="btn btn-primary mt" href="#assess">ทำแบบประเมินต่อ</a>
  </div>` : ""}

  ${hasResult ? `<div class="card">
    <b>ผลการประเมินของคุณพร้อมแล้ว</b>
    <p class="muted">แตะเพื่อดูรายละเอียดอย่างปลอดภัย</p>
    <a class="btn btn-secondary mt" href="#result">ดูผลของฉัน</a>
  </div>` : ""}

  <div class="benefits">
    <div class="benefit"><span class="em">🔍</span><b>รู้ปัจจัยเสี่ยงของตนเอง</b><br>เข้าใจว่าปัจจัยใดของคุณควรให้ความสำคัญ</div>
    <div class="benefit"><span class="em">💬</span><b>รับคำแนะนำที่เข้าใจง่าย</b><br>อธิบายเป็นภาษาคน ไม่ใช่ศัพท์แพทย์</div>
    <div class="benefit"><span class="em">🏥</span><b>เชื่อมต่อบริการสุขภาพที่เหมาะสม</b><br>ค้นหาสถานพยาบาลและขอรับการติดต่อ</div>
  </div>

  <div class="card mt">
    <h2>🎬 “ฉันไม่เคยสูบบุหรี่ แล้วทำไมต้องสนใจมะเร็งปอด?”</h2>
    <div style="background:var(--ink);color:#fff;border-radius:10px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="showStoryboard()">
      <span style="font-size:40px">▶️</span>
    </div>
    <p class="tiny mt">วิดีโอแคมเปญ 45 วินาที (สตอรีบอร์ดต้นแบบ) — มีคำบรรยายไทยและปุ่มถอดความ</p>
  </div>

  <div class="disclaimer">
    แบบประเมินนี้เป็นเครื่องมือให้ความรู้และประเมินความเสี่ยงเบื้องต้น ไม่ใช่การวินิจฉัยโรค และไม่สามารถใช้แทนคำแนะนำจากแพทย์
  </div>

  <div class="card mt">
    <h3>🧪 โหมดสาธิต (Demo)</h3>
    <p class="tiny">เติมคำตอบตามเพอร์โซนาตัวอย่างเพื่อดูผลลัพธ์แต่ละแบบ — ข้อมูลจำลองทั้งหมด</p>
    <div class="opts">${PERSONAS.map(p => `
      <button class="opt" onclick="fillPersona('${p.id}')">
        <span>${esc(p.label)}<br><span class="tiny">คาดหวัง: ${esc(p.expect)}</span></span>
      </button>`).join("")}
    </div>
  </div>

  <p class="center tiny mt">
    <a href="#provider" style="color:var(--ink-3)">สำหรับเจ้าหน้าที่/ผู้ให้บริการ</a> ·
    <a href="#demo-story" style="color:var(--ink-3)">โหมดนำเสนอ</a> ·
    <a href="#privacy" style="color:var(--ink-3)">ความเป็นส่วนตัว</a>
  </p>`);
}

function showStoryboard() {
  track("video_started");
  modal(`<h3>🎬 สตอรีบอร์ดวิดีโอแคมเปญ 45 วินาที</h3>
    <details open><summary>ฉาก 1 — ชีวิตประจำวัน</summary><p class="muted">หญิงเอเชียวัยปลาย 50 ใช้ชีวิตตามปกติ<br>“ฉันไม่เคยสูบบุหรี่เลย แล้วทำไมต้องสนใจมะเร็งปอด?”</p></details>
    <details><summary>ฉาก 2 — ปัจจัยรอบตัว</summary><p class="muted">ภาพประวัติครอบครัว มลพิษเมือง ควันในบ้าน ฝุ่นที่ทำงาน ควันบุหรี่มือสอง<br>เสียงบรรยาย: “เพราะความเสี่ยงไม่ได้มาจากบุหรี่เพียงอย่างเดียว”</p></details>
    <details><summary>ฉาก 3 — เปิด LINE</summary><p class="muted">ผู้ใช้เปิด LINE ตอบคำถามสั้น ๆ<br>“ลองเช็กปัจจัยเสี่ยงของคุณในเวลาเพียง 2–3 นาที”</p></details>
    <details><summary>ฉาก 4 — ผลที่อธิบายได้</summary><p class="muted">เห็นผลพร้อมคำอธิบาย และช่องทางบริการสุขภาพ<br>“รู้ว่าปัจจัยใดควรให้ความสำคัญ และควรทำอะไรต่อ”</p></details>
    <details><summary>ฉากจบ</summary><p class="muted">“ไม่สูบ ไม่ได้แปลว่าไม่เสี่ยง” → CTA: “เช็กความเสี่ยงสุขภาพปอดใน LINE”</p></details>
    <p class="tiny mt">การเปิดเผย: แบบประเมินไม่ใช่การวินิจฉัย และการตรวจเพิ่มเติมต้องพิจารณาโดยบุคลากรทางการแพทย์</p>
    <button class="btn btn-ghost btn-sm mt" onclick="protoPopup('ถอดความวิดีโอ (Transcript)','เวอร์ชันจริงจะแสดงบทพูดฉบับเต็มพร้อมคำบรรยาย')">📄 ถอดความ</button>`);
}

function fillPersona(id) {
  const p = PERSONAS.find(x => x.id === id);
  if (!p) return;
  if (!state.consent) {
    // demo shortcut still records a demo consent so flow stays honest
    state.consent = { required: true, optional: { history: true }, version: "consent_v1_demo", at: new Date().toISOString(), lang: state.lang, source: "demo-persona" };
  }
  state.answers = structuredClone(p.answers);
  state.inProgress = false;
  state.result = evaluateRisk(state.answers);
  pushHistory();
  save();
  toast("เติมข้อมูลเพอร์โซนา (ข้อมูลจำลอง) แล้ว");
  location.hash = state.result.symptom_pathway !== "standard" ? "#symptom" : "#result";
}

/* =====================================================================
   SCREEN: before you begin / consent
   ===================================================================== */
function renderBegin() {
  view(`<div class="card">
    <h2>ก่อนเริ่มแบบประเมิน</h2>
    <p class="muted">ใช้เวลาประมาณ 2–3 นาที · ${visibleSteps().length} คำถาม · หยุดพักและกลับมาทำต่อได้</p>
    <details class="mt" open><summary>แบบประเมินนี้ทำอะไร</summary>
      <p class="muted">รวบรวมข้อมูลปัจจัยเสี่ยงของคุณ อธิบายว่าปัจจัยใดควรให้ความสำคัญ และช่วยเชื่อมต่อบริการสุขภาพที่เหมาะสม</p></details>
    <details><summary>แบบประเมินนี้ไม่ทำอะไร</summary>
      <p class="muted">ไม่วินิจฉัยโรค ไม่บอกว่าคุณเป็นหรือไม่เป็นมะเร็ง ไม่สั่งตรวจ LDCT และไม่ใช่เครื่องมือที่ผ่านการรับรองทางคลินิก</p></details>
    <details><summary>ข้อมูลที่จะถูกเก็บ</summary>
      <p class="muted">ช่วงอายุ เพศกำเนิด จังหวัด ประวัติการสูบบุหรี่ ควันบุหรี่มือสอง ประวัติครอบครัวและสุขภาพ การสัมผัสจากอาชีพและในบ้าน และอาการปัจจุบัน — ไม่เก็บชื่อหรือที่อยู่เต็ม</p></details>
    <details><summary>ผลจะถูกใช้อย่างไร</summary>
      <p class="muted">แสดงให้คุณเห็นพร้อมคำอธิบาย คุณเลือกได้ว่าจะบันทึก แชร์ให้แพทย์ หรือลบทิ้ง คำแนะนำทางคลินิกต้องได้รับการทบทวนโดยผู้เชี่ยวชาญเสมอ</p></details>
    <a class="btn btn-primary mt" href="#consent">เริ่มทำแบบประเมิน</a>
    <a class="btn btn-ghost mt" href="#privacy">อ่านนโยบายความเป็นส่วนตัว</a>
    <a class="btn btn-ghost mt" href="#home">ยังไม่พร้อม</a>
  </div>`);
}

function renderConsent() {
  track("consent_viewed");
  const c = state.consent;
  view(`<div class="card">
    <h2>ความยินยอม</h2>
    <p class="tiny">เวอร์ชัน consent_v1 · ภาษาไทย · แยกข้อจำเป็นออกจากข้อเลือกได้เสมอ</p>
    <h3>จำเป็นต่อการใช้งาน</h3>
    <div class="opts">
      <label class="opt"><input type="checkbox" id="c-req1"> ยินยอมให้ประมวลผลคำตอบเพื่อสร้างผลประเมินเบื้องต้น</label>
      <label class="opt"><input type="checkbox" id="c-req2"> เข้าใจว่าเครื่องมือนี้ไม่ใช่การวินิจฉัยโรค</label>
      <label class="opt"><input type="checkbox" id="c-req3"> ยืนยันว่าข้อมูลที่ให้ถูกต้องตามความเข้าใจของตนเอง</label>
    </div>
    <h3 class="mt">เลือกได้ (ไม่บังคับ)</h3>
    <div class="opts">
      <label class="opt"><input type="checkbox" id="c-hist" ${c?.optional?.history ? "checked" : ""}> บันทึกประวัติการประเมินของฉัน</label>
      <label class="opt"><input type="checkbox" id="c-remind" ${c?.optional?.remind ? "checked" : ""}> รับการแจ้งเตือนผ่าน LINE</label>
      <label class="opt"><input type="checkbox" id="c-contact" ${c?.optional?.contact ? "checked" : ""}> ให้เจ้าหน้าที่ที่ได้รับอนุญาตติดต่อฉันได้</label>
      <label class="opt"><input type="checkbox" id="c-research" ${c?.optional?.research ? "checked" : ""}> ใช้ข้อมูลแบบไม่ระบุตัวตนเพื่อประเมินโครงการ/วิจัย</label>
      <label class="opt"><input type="checkbox" id="c-loc" ${c?.optional?.loc ? "checked" : ""}> ใช้ตำแหน่งโดยประมาณเพื่อแนะนำบริการใกล้เคียง</label>
    </div>
    <p class="tiny mt">ถอนความยินยอมได้ทุกเมื่อที่หน้า “ข้อมูลของฉัน” · ข้อมูลของคุณจะไม่ถูกนำไปใช้โฆษณาตามความเสี่ยงสุขภาพ</p>
    <button class="btn btn-primary mt" onclick="acceptConsent()">ยอมรับและเริ่มแบบประเมิน</button>
    <a class="btn btn-ghost mt" href="#begin">ย้อนกลับ</a>
  </div>`);
}

function acceptConsent() {
  if (!($("#c-req1").checked && $("#c-req2").checked && $("#c-req3").checked)) {
    toast("กรุณาติ๊กข้อจำเป็นทั้ง 3 ข้อก่อนเริ่ม"); return;
  }
  state.consent = {
    required: true,
    optional: {
      history: $("#c-hist").checked, remind: $("#c-remind").checked,
      contact: $("#c-contact").checked, research: $("#c-research").checked, loc: $("#c-loc").checked
    },
    version: "consent_v1", at: new Date().toISOString(), lang: state.lang, source: "liff"
  };
  state.inProgress = true; state.stepIndex = 0;
  save(); track("consent_completed"); track("assessment_started");
  location.hash = "#assess";
}

/* =====================================================================
   SCREEN: assessment wizard
   ===================================================================== */
function visibleSteps() { return STEPS.filter(s => !s.cond || s.cond(state.answers)); }

function renderAssess() {
  if (!state.consent) { location.hash = "#begin"; return; }
  const steps = visibleSteps();
  if (state.stepIndex >= steps.length) state.stepIndex = steps.length - 1;
  const step = steps[state.stepIndex];
  const n = state.stepIndex + 1, total = steps.length;
  const a = state.answers;

  let body = "";
  if (step.type === "choice") {
    body = `<div class="opts">${step.options.map(o => `
      <button class="opt ${a[step.id] === o ? "sel" : ""}" onclick="answerChoice('${step.id}', this.dataset.v)" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
  } else if (step.type === "multi" || step.type === "symptoms") {
    const cur = a[step.id] || [];
    body = `<div class="opts">${step.options.map(o => `
      <label class="opt ${cur.includes(o) ? "sel" : ""}">
        <input type="checkbox" ${cur.includes(o) ? "checked" : ""} onchange="answerMulti('${step.id}', this.dataset.v, this.checked)" data-v="${esc(o)}"> ${esc(o)}
      </label>`).join("")}</div>`;
  } else if (step.type === "numbers") {
    const cur = a[step.id] || {};
    body = step.fields.map(f => `
      <div class="field"><label>${esc(f.label)}</label>
        <input type="number" inputmode="numeric" min="${f.min}" max="${f.max}" value="${cur[f.key] ?? ""}"
          onchange="answerNum('${step.id}','${f.key}', this.value)"></div>`).join("");
  } else if (step.type === "group") {
    const cur = a[step.id] || {};
    body = step.fields.map(f => {
      if (f.type === "multi") {
        const sel = cur[f.key] || [];
        return `<div class="field"><label>${esc(f.label)}</label><div class="chips">
          ${f.options.map(o => `<button class="chip ${sel.includes(o) ? "on" : ""}" onclick="answerGroupMulti('${step.id}','${f.key}', this.dataset.v)" data-v="${esc(o)}">${esc(o)}</button>`).join("")}
        </div></div>`;
      }
      return `<div class="field"><label>${esc(f.label)}</label>
        <select onchange="answerGroup('${step.id}','${f.key}', this.value)">
          <option value="">— เลือก —</option>
          ${f.options.map(o => `<option ${cur[f.key] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}
        </select></div>`;
    }).join("");
  } else if (step.type === "province") {
    body = `<div class="field"><label>จังหวัด</label>
      <select onchange="answerChoice('PROVINCE', this.value)">
        <option value="">— เลือกจังหวัด —</option>
        ${PROVINCES.map(p => `<option ${a.PROVINCE === p ? "selected" : ""}>${esc(p)}</option>`).join("")}
      </select></div>
      <div class="field"><label>อำเภอ/เขต หรือรหัสไปรษณีย์ (ไม่บังคับ)</label>
        <input type="text" value="${esc(a.DISTRICT || "")}" onchange="answerChoice('DISTRICT', this.value)" placeholder="ข้ามได้"></div>`;
  } else if (step.type === "info") {
    const p = a.PROVINCE;
    const lvl = PM25_DEMO.elevated.includes(p) ? "สูง (ควรให้ความสำคัญ)" : PM25_DEMO.moderate.includes(p) ? "ปานกลาง" : "ไม่พบข้อมูลระดับสูงในชุดสาธิต";
    body = `<div class="q-note">📍 จังหวัด: <b>${esc(p || "ยังไม่ระบุ")}</b><br>
      ค่าฝุ่นสะสมระดับพื้นที่ (ชุดข้อมูลสาธิต): <b>${lvl}</b><br>
      <span class="tiny">แหล่งข้อมูล: ${esc(PM25_DEMO.source)} · ข้อมูล ณ ${esc(PM25_DEMO.asOf)}<br>
      ความเสี่ยงส่วนบุคคลขึ้นอยู่กับหลายปัจจัย และค่าฝุ่นรายวันไม่สามารถแทนการสัมผัสระยะยาวได้</span></div>
      <button class="btn btn-ghost btn-sm" onclick="askGeo()">📍 ใช้ตำแหน่งปัจจุบัน (ไม่บังคับ)</button>`;
    if (!a.AREA_INFO) { a.AREA_INFO = "seen"; save(); }
  }

  const isSymptoms = step.type === "symptoms";
  view(`
  <div class="progress-wrap">
    <div class="progress-txt"><span>ข้อ ${n} จาก ${total}</span><span>${esc(step.section)}</span></div>
    <div class="progress-bar"><div style="width:${Math.round(n / total * 100)}%"></div></div>
  </div>
  <div class="card">
    <span class="section-tag">${esc(step.section)}</span>
    <div class="q-title">${esc(step.title)}</div>
    ${step.note ? `<div class="q-note">${esc(step.note)}</div>` : ""}
    ${isSymptoms ? `<div class="q-note" style="background:var(--brand-soft)">อาการเหล่านี้อาจเกิดจากหลายสาเหตุและไม่ได้หมายความว่าคุณเป็นมะเร็ง แต่ควรได้รับการประเมินจากบุคลากรทางการแพทย์โดยเร็ว</div>` : ""}
    ${body}
    ${step.why ? `<button class="why-btn" onclick="modal('<h3>ทำไมเราจึงถามคำถามนี้</h3><p class=muted>${esc(step.why)}</p>')">ทำไมเราจึงถามคำถามนี้</button>` : ""}
  </div>
  <div class="assess-nav">
    <button class="btn btn-ghost" onclick="stepBack()" ${n === 1 ? "disabled" : ""}>ย้อนกลับ</button>
    <button class="btn btn-primary" onclick="stepNext()">${n === total ? "ดูผลและคำแนะนำ" : "ถัดไป"}</button>
  </div>
  <button class="btn btn-ghost mt" onclick="saveExit()">บันทึกและกลับมาทำต่อภายหลัง</button>`);
}

function askGeo() {
  modal(`<h3>ขอใช้ตำแหน่งปัจจุบัน</h3>
    <p class="muted">ใช้เพื่อจับคู่ข้อมูลพื้นที่และบริการใกล้คุณเท่านั้น ไม่บังคับ และไม่กระทบการทำแบบประเมิน</p>
    <button class="btn btn-secondary mt" onclick="closeModal(); toast('โหมดต้นแบบ: ใช้จังหวัดที่เลือกแทนตำแหน่งจริง')">อนุญาต (จำลอง)</button>`);
}

function answerChoice(id, v) { state.answers[id] = v; save(); if (id !== "DISTRICT" && id !== "PROVINCE") stepNext(); else renderAssess(); }
function answerMulti(id, v, on) {
  const step = STEPS.find(s => s.id === id);
  let cur = state.answers[id] || [];
  if (on) {
    if ((step.exclusive || []).includes(v)) cur = [v];
    else cur = cur.filter(x => !(step.exclusive || []).includes(x)).concat(v);
  } else cur = cur.filter(x => x !== v);
  state.answers[id] = cur; save(); renderAssess();
}
function answerNum(id, key, v) {
  state.answers[id] = state.answers[id] || {};
  state.answers[id][key] = v === "" ? null : Number(v);
  save();
}
function answerGroup(id, key, v) {
  state.answers[id] = state.answers[id] || {};
  state.answers[id][key] = v || null; save();
}
function answerGroupMulti(id, key, v) {
  state.answers[id] = state.answers[id] || {};
  const stepField = STEPS.find(s => s.id === id).fields.find(f => f.key === key);
  let cur = state.answers[id][key] || [];
  if (cur.includes(v)) cur = cur.filter(x => x !== v);
  else if ((stepField.exclusive || []).includes(v)) cur = [v];
  else cur = cur.filter(x => !(stepField.exclusive || []).includes(x)).concat(v);
  state.answers[id][key] = cur; save(); renderAssess();
}

function stepBack() { if (state.stepIndex > 0) { state.stepIndex--; save(); renderAssess(); } }
function stepNext() {
  const steps = visibleSteps();
  const step = steps[state.stepIndex];
  const v = state.answers[step.id];
  const optional = ["SMOKE_DETAIL", "AREA_INFO", "PROVINCE"];
  if (!optional.includes(step.id) && step.type !== "info") {
    if (v == null || (Array.isArray(v) && v.length === 0)) { toast("กรุณาเลือกคำตอบ หรือเลือก “ไม่แน่ใจ”"); return; }
  }
  if (step.id === "PROVINCE" && !state.answers.PROVINCE) { toast("กรุณาเลือกจังหวัด"); return; }
  track("assessment_section_completed");
  if (state.stepIndex >= visibleSteps().length - 1) { submitAssessment(); return; }
  state.stepIndex++;
  save(); renderAssess();
}

function saveExit() { save(); toast("บันทึกคำตอบแล้ว กลับมาทำต่อได้ทุกเมื่อ"); location.hash = "#home"; }

function submitAssessment() {
  state.result = evaluateRisk(state.answers);
  state.inProgress = false;
  pushHistory();
  save(); track("assessment_completed");
  location.hash = state.result.symptom_pathway !== "standard" ? "#symptom" : "#result";
}

function pushHistory() {
  if (state.consent?.optional?.history === false) return;
  state.history.unshift({
    at: new Date().toISOString(),
    bandKey: state.result.band.key, bandLabel: state.result.band.label,
    score: state.result.score, pathway: state.result.symptom_pathway,
    engine: state.result.model_version
  });
  state.history = state.history.slice(0, 20);
}

/* =====================================================================
   SCREEN: symptom pathway (separate from risk)
   ===================================================================== */
function renderSymptomPathway() {
  const r = state.result;
  if (!r || r.symptom_pathway === "standard") { location.hash = "#result"; return; }
  const urgent = r.symptom_pathway === "urgent";
  view(`
  <div class="band band-urgent">
    <h2>${urgent ? "⚠️ ควรได้รับการประเมินอาการโดยเร็ว" : "ควรปรึกษาบุคลากรทางการแพทย์เกี่ยวกับอาการ"}</h2>
    <p>อาการเหล่านี้อาจเกิดจากหลายสาเหตุและไม่ได้หมายความว่าคุณเป็นมะเร็ง แต่ควรได้รับการประเมินจากบุคลากรทางการแพทย์โดยเร็ว</p>
    ${urgent ? `<p class="mt"><b>หากมีเลือดออกปริมาณมาก หายใจลำบากรุนแรง หรือเจ็บหน้าอกรุนแรงเฉียบพลัน โทร 1669 หรือไปห้องฉุกเฉินทันที</b></p>` : ""}
  </div>
  <a class="btn btn-urgent" href="#clinics">ดูช่องทางเข้ารับการประเมิน</a>
  <a class="btn btn-ghost mt" href="#result">ดูผลแบบประเมินปัจจัยเสี่ยง</a>
  <p class="tiny mt center">เส้นทางอาการแยกจากคะแนนปัจจัยเสี่ยงเสมอ และระบบไม่คำนวณความน่าจะเป็นของโรคจากอาการ</p>`);
}

/* =====================================================================
   SCREEN: result
   ===================================================================== */
function renderResult() {
  const r = state.result;
  track("result_viewed");
  if (!r) {
    view(`<div class="card center"><h2>ยังไม่มีผลการประเมิน</h2>
      <p class="muted">ทำแบบประเมิน 2–3 นาทีเพื่อดูปัจจัยของคุณ</p>
      <a class="btn btn-primary mt" href="#begin">เริ่มทำแบบประเมิน</a></div>`);
    return;
  }
  if (r.assessment_status === "incomplete") {
    view(`<div class="band band-gray"><h2>${esc(BANDS.incomplete.label)}</h2><p>${esc(BANDS.incomplete.summary)}</p></div>
      <button class="btn btn-primary" onclick="state.stepIndex=0;state.inProgress=true;save();location.hash='#assess'">${esc(BANDS.incomplete.action)}</button>`);
    return;
  }
  const b = r.band;
  const dt = new Date(r.generated_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  view(`
  ${r.symptom_pathway !== "standard" ? `<div class="band band-urgent">
    <b>มีอาการที่ควรปรึกษาแพทย์</b>
    <p class="muted">ระบบให้ความสำคัญกับการประเมินอาการก่อนเสมอ</p>
    <a class="btn btn-urgent btn-sm mt" href="#symptom">ดูคำแนะนำเรื่องอาการ</a></div>` : ""}

  <div class="band ${b.cls}">
    <h2>${esc(b.label)}</h2>
    <p>${esc(b.summary)}</p>
  </div>

  ${r.factors.length ? `<div class="card">
    <h2>ทำไมจึงได้ผลนี้</h2>
    <p class="tiny">แตะแต่ละปัจจัยเพื่อดูคำอธิบาย · ปัจจัยไม่ใช่การวินิจฉัย</p>
    ${r.factors.map((f, i) => `
      <div class="factor" onclick="factorDetail(${i})" style="cursor:pointer">
        <h4>${esc(f.name)}</h4>
        <p class="muted" style="font-size:13.5px">${esc(f.explain)}</p>
        <span class="ev">หลักฐาน: ${esc(f.evidence)}</span>
      </div>`).join("")}
  </div>` : `<div class="card">
    <h2>ทำไมจึงได้ผลนี้</h2>
    <p class="muted">จากคำตอบของคุณ ระบบยังไม่พบปัจจัยที่เข้าเงื่อนไขกฎต้นแบบรุ่นปัจจุบัน อย่างไรก็ตาม แบบประเมินนี้ประเมินได้เพียงบางปัจจัยเท่านั้น</p>
  </div>`}

  <div class="card">
    <h3>สิ่งที่แบบประเมินนี้ยังไม่ได้ประเมิน</h3>
    <p class="muted" style="font-size:13.5px">${NOT_ASSESSED.map(esc).join(" · ")}</p>
    <p class="tiny mt">ปัจจัยเสี่ยงไม่ใช่การวินิจฉัย และผลนี้ไม่สามารถยืนยันหรือตัดโรคใด ๆ ได้</p>
  </div>

  <div class="card">
    <h3>ขั้นตอนถัดไปที่แนะนำ</h3>
    <p class="muted">${esc(b.action)}</p>
    ${b === BANDS.review ? `<p class="muted mt" style="font-size:13.5px">บุคลากรทางการแพทย์สามารถช่วยพิจารณาว่าจำเป็นต้องตรวจเพิ่มเติม เช่น การประเมินทางคลินิกหรือการถ่ายภาพรังสีชนิดใด</p>` : ""}
    <a class="btn btn-primary mt" href="#clinics">ค้นหาช่องทางปรึกษาบุคลากรทางการแพทย์</a>
    <div class="row mt">
      <button class="btn btn-secondary btn-sm" onclick="toast('บันทึกผลไว้ใน “ข้อมูลของฉัน” แล้ว')">💾 บันทึกผล</button>
      <button class="btn btn-secondary btn-sm" onclick="shareCard()">📤 แชร์แบบปลอดภัย</button>
      <a class="btn btn-secondary btn-sm" href="#education">📚 เรียนรู้เพิ่มเติม</a>
      <button class="btn btn-ghost btn-sm" onclick="retake()">🔄 ทำแบบประเมินใหม่</button>
    </div>
  </div>

  <p class="tiny center">ประเมินเมื่อ ${dt} · ${esc(r.model_version)} · ${esc(r.clinical_validation_status)}<br>
  แบบประเมินความเสี่ยงเบื้องต้น — ไม่ใช่การวินิจฉัย และต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง</p>`);
}

function factorDetail(i) {
  track("factor_explanation_opened");
  const f = state.result.factors[i];
  modal(`<h3>${esc(f.name)}</h3>
    <p class="muted"><b>เหตุใดจึงอาจเกี่ยวข้อง:</b> ${esc(f.explain)}</p>
    <p class="muted mt"><b>สิ่งที่ทำต่อได้:</b> ${esc(f.next)}</p>
    <p class="tiny mt">รหัสกฎ: ${esc(f.code)} (v${f.version}) · สถานะหลักฐาน: ${esc(f.evidence)}<br>กฎต้นแบบ — ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง</p>`);
}

function retake() {
  state.answers = {}; state.stepIndex = 0; state.inProgress = true; state.result = null;
  save(); location.hash = "#consent";
}

function shareCard() {
  track("share_card_created");
  modal(`<h3>แชร์แบบปลอดภัย</h3>
    <p class="tiny">การ์ดเริ่มต้นไม่มีข้อมูลสุขภาพ ผลประเมิน หรือข้อมูลส่วนตัวใด ๆ</p>
    <div class="share-card">
      <div class="big">ฉันเช็กปัจจัยเสี่ยงสุขภาพปอดแล้ว 🫁</div>
      <div>คุณก็ใช้เวลาเพียง 2–3 นาทีได้เช่นกัน</div>
      <div class="mt" style="background:#fff;color:var(--brand-deep);border-radius:999px;padding:8px 16px;display:inline-block;font-weight:700">เช็กความเสี่ยงเบื้องต้น</div>
    </div>
    <button class="btn btn-secondary" onclick="liffShare('ฉันเช็กปัจจัยเสี่ยงสุขภาพปอดแล้ว 🫁 คุณก็ใช้เวลาเพียง 2–3 นาทีได้เช่นกัน — เช็กความเสี่ยงเบื้องต้นได้ที่: ' + location.origin + location.pathname)">${'แชร์ผ่าน LINE / คัดลอกข้อความ'}</button>
    <button class="btn btn-ghost mt" onclick="confirmDetailShare()">🔗 ส่งผลโดยละเอียดให้บุคลากรทางการแพทย์</button>`);
}
function confirmDetailShare() {
  modal(`<h3>ยืนยันการสร้างลิงก์ผลโดยละเอียด</h3>
    <p class="muted">ลิงก์นี้จะมีข้อมูลปัจจัยเสี่ยงของคุณ ใช้ได้ชั่วคราว (24 ชม.) และควรส่งให้บุคลากรทางการแพทย์เท่านั้น</p>
    <button class="btn btn-primary mt" onclick="closeModal(); protoPopup('ลิงก์ปลอดภัย + QR สำหรับแพทย์','เวอร์ชันจริงจะสร้างลิงก์ชั่วคราวพร้อมรหัส และบันทึกการเข้าถึงใน audit log')">ยืนยัน สร้างลิงก์</button>`);
}

/* =====================================================================
   SCREEN: education
   ===================================================================== */
function renderEducation(slug) {
  if (slug) return renderArticle(slug);
  view(`<div class="card">
    <h2>📚 ความรู้เรื่องปอด</h2>
    <p class="tiny">บทความฉบับร่างสำหรับต้นแบบ — ต้องผ่านการทบทวนโดยแพทย์ก่อนเผยแพร่จริง</p>
  </div>
  ${ARTICLES.map(a => `
  <div class="card" style="cursor:pointer" onclick="location.hash='#education=${a.slug}'">
    <span class="section-tag">${esc(a.category)}</span>
    <h3 style="margin-top:2px">${esc(a.title)}</h3>
    <p class="muted" style="font-size:13.5px">${esc(a.summary)}</p>
    <p class="tiny mt">อ่าน ${a.minutes} นาที · ${esc(a.evidence)}</p>
  </div>`).join("")}
  <div class="card">
    <h3>หัวข้อทั้งหมด</h3>
    <div class="edu-grid">${EDU_CATEGORIES.map(c => {
      const has = ARTICLES.find(a => a.category === c);
      return `<button class="edu-cat" onclick="${has ? `location.hash='#education=${has.slug}'` : `protoPopup('บทความ: ${esc(c)}','โครงร่างบทความนี้อยู่ใน TASKS.md — จะเขียนพร้อมผู้ทบทวนทางการแพทย์')`}">${esc(c)}${has ? "" : ' <span class="tiny">(โครงร่าง)</span>'}</button>`;
    }).join("")}</div>
  </div>`);
}

function renderArticle(slug) {
  const a = ARTICLES.find(x => x.slug === slug);
  if (!a) { location.hash = "#education"; return; }
  track("education_article_viewed");
  view(`<div class="card">
    <span class="section-tag">${esc(a.category)}</span>
    <h2>${esc(a.title)}</h2>
    <p class="tiny">อ่าน ${a.minutes} นาที · สถานะหลักฐาน: ${esc(a.evidence)} · ผู้ทบทวน: ${esc(a.reviewed)}</p>
    ${a.body.map(p => `<p class="mt" style="font-size:15px">${esc(p)}</p>`).join("")}
    <div class="myth">
      <div class="m">❌ <b>ความเชื่อ:</b> ${esc(a.myth.m)}</div>
      <div class="f">✅ <b>ข้อเท็จจริง:</b> ${esc(a.myth.f)}</div>
    </div>
    <div class="q-note"><b>สิ่งนี้หมายความว่าอย่างไรสำหรับคุณ:</b> ${esc(a.forYou)}</div>
    <p class="tiny mt">อ้างอิง: ${a.refs.map(esc).join("; ")}</p>
    <a class="btn btn-secondary mt" href="#education">← บทความทั้งหมด</a>
    <a class="btn btn-primary mt" href="#begin">ประเมินความเสี่ยง 2–3 นาที</a>
  </div>`);
}

/* =====================================================================
   SCREEN: clinics / navigation
   ===================================================================== */
let clinicFilter = { province: "", ldct: false, publicOnly: false };
function renderClinics() {
  const list = FACILITIES.filter(f =>
    (!clinicFilter.province || f.province === clinicFilter.province) &&
    (!clinicFilter.ldct || f.ldct) &&
    (!clinicFilter.publicOnly || f.public));
  view(`<div class="card">
    <h2>🏥 สถานพยาบาลและช่องทางปรึกษา</h2>
    <p class="tiny">รายการทั้งหมดเป็น <b>ข้อมูลจำลอง</b> เพื่อการสาธิต — ไม่ใช่บริการจริง และไม่ได้ยืนยันว่าทุกแห่งให้บริการคัดกรองมะเร็งปอด</p>
    <div class="row mt">
      <select onchange="clinicFilter.province=this.value;renderClinics()">
        <option value="">ทุกจังหวัด</option>
        ${[...new Set(FACILITIES.map(f => f.province))].map(p => `<option ${clinicFilter.province === p ? "selected" : ""}>${esc(p)}</option>`).join("")}
      </select>
      <button class="chip ${clinicFilter.ldct ? "on" : ""}" style="min-height:44px" onclick="clinicFilter.ldct=!clinicFilter.ldct;renderClinics()">มี LDCT</button>
      <button class="chip ${clinicFilter.publicOnly ? "on" : ""}" style="min-height:44px" onclick="clinicFilter.publicOnly=!clinicFilter.publicOnly;renderClinics()">รัฐเท่านั้น</button>
    </div>
  </div>
  ${list.map(f => `
  <div class="fac">
    <h4>${esc(f.name)}</h4>
    <p class="tiny">${esc(f.type)} · ${esc(f.province)} ${esc(f.district)} · ${esc(f.hours)}</p>
    <div class="chips">${f.services.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>
    <p class="tiny">นัดหมาย: ${esc(f.appointment)} · การส่งตัว: ${esc(f.referral)} · ภาษา: ${f.lang.join("/")} · การเข้าถึง: ${esc(f.access)}</p>
    <p class="tiny" style="color:var(--warn)">${esc(f.verified)}</p>
    <div class="row mt">
      <button class="btn btn-primary btn-sm" onclick="startReferral('${f.id}')">ขอให้เจ้าหน้าที่ติดต่อ</button>
      <button class="btn btn-secondary btn-sm" onclick="protoPopup('โทร ${esc(f.phone)}','เวอร์ชันจริงจะเปิดแอปโทรศัพท์')">โทรสอบถาม</button>
      <button class="btn btn-secondary btn-sm" onclick="protoPopup('เปิดแผนที่','เวอร์ชันจริงจะเปิดแผนที่ไปยังตำแหน่งสถานพยาบาล')">เปิดแผนที่</button>
      <button class="btn btn-ghost btn-sm" onclick="toast('บันทึกสถานพยาบาลไว้แล้ว (จำลอง)')">บันทึกไว้</button>
    </div>
  </div>`).join("") || `<div class="card center muted">ไม่พบสถานพยาบาลตามตัวกรอง</div>`}
  ${state.referrals.length ? `<a class="btn btn-secondary" href="#referral">ดูสถานะคำขอของฉัน (${state.referrals.length})</a>` : ""}`);
  track("facility_viewed");
}

/* =====================================================================
   SCREEN: referral
   ===================================================================== */
const REF_TIMELINE = ["ส่งคำขอแล้ว", "เจ้าหน้าที่กำลังตรวจสอบ", "มีข้อมูลนัดหมาย", "เสร็จสิ้น"];

function startReferral(facilityId) {
  track("referral_started");
  const f = FACILITIES.find(x => x.id === facilityId);
  if (!state.consent?.optional?.contact) {
    modal(`<h3>ต้องการความยินยอมเพิ่มเติม</h3>
      <p class="muted">การขอให้เจ้าหน้าที่ติดต่อ ต้องการความยินยอม “ให้เจ้าหน้าที่ที่ได้รับอนุญาตติดต่อฉันได้”</p>
      <button class="btn btn-primary mt" onclick="grantContactConsent('${facilityId}')">ยินยอมและดำเนินการต่อ</button>`);
    return;
  }
  modal(`<h3>ขอให้เจ้าหน้าที่ติดต่อ</h3>
    <p class="tiny">${esc(f.name)} · ไม่ต้องกรอกข้อมูลสุขภาพซ้ำ — ระบบใช้ผลประเมินที่คุณยินยอมแชร์</p>
    <div class="field"><label>ช่องทางที่สะดวก</label>
      <select id="rf-contact"><option>LINE</option><option>โทรศัพท์</option></select></div>
    <div class="field"><label>วันที่สะดวก</label>
      <select id="rf-days"><option>จันทร์–ศุกร์</option><option>เสาร์–อาทิตย์</option><option>ได้ทุกวัน</option></select></div>
    <div class="field"><label>ช่วงเวลาที่สะดวก</label>
      <select id="rf-time"><option>เช้า (9:00–12:00)</option><option>บ่าย (13:00–16:00)</option><option>เย็น (16:00–18:00)</option></select></div>
    <div class="field"><label>ความต้องการด้านการเข้าถึง / หมายเหตุ (ไม่บังคับ)</label>
      <textarea id="rf-note" rows="2" placeholder="เช่น ต้องการล่าม ต้องการทางลาด"></textarea></div>
    <button class="btn btn-primary" onclick="submitReferral('${facilityId}')">ส่งคำขอ</button>`);
}
function grantContactConsent(facilityId) {
  state.consent.optional.contact = true; save();
  toast("บันทึกความยินยอมแล้ว"); startReferral(facilityId);
}
function submitReferral(facilityId) {
  const ref = {
    id: "R" + Date.now().toString().slice(-6), facilityId,
    contact: $("#rf-contact").value, days: $("#rf-days").value, time: $("#rf-time").value,
    note: $("#rf-note").value, statusIdx: 0, at: new Date().toISOString()
  };
  state.referrals.unshift(ref); save(); track("referral_submitted");
  closeModal();
  modal(`<h3>✅ ส่งคำขอแล้ว</h3>
    <p class="muted">เจ้าหน้าที่จะติดต่อกลับตามช่องทางที่คุณเลือก (โหมดต้นแบบ: กดปุ่มจำลองในหน้าสถานะเพื่อดูขั้นตอนถัดไป)</p>
    <a class="btn btn-primary mt" href="#referral" onclick="closeModal()">ดูสถานะคำขอ</a>`);
}
function renderReferral() {
  view(`<div class="card"><h2>🧭 สถานะการส่งต่อของฉัน</h2>
    <p class="tiny">ข้อมูลจำลอง — สถานะจริงจะอัปเดตโดยเจ้าหน้าที่ผ่านแดชบอร์ดผู้ให้บริการ</p></div>
  ${state.referrals.length === 0 ? `<div class="card center muted">ยังไม่มีคำขอ<br><a class="btn btn-secondary mt" href="#clinics">ค้นหาสถานพยาบาล</a></div>` : ""}
  ${state.referrals.map((r, i) => {
    const f = FACILITIES.find(x => x.id === r.facilityId);
    return `<div class="card">
      <b>${esc(f?.name || r.facilityId)}</b>
      <p class="tiny">คำขอ #${esc(r.id)} · ${esc(r.contact)} · ${esc(r.days)} ${esc(r.time)}</p>
      <ul class="timeline mt">${REF_TIMELINE.map((s, j) => `
        <li class="${j < r.statusIdx ? "done" : j === r.statusIdx ? "now" : ""}">${esc(s)}</li>`).join("")}
      </ul>
      ${r.statusIdx < REF_TIMELINE.length - 1
        ? `<button class="btn btn-secondary btn-sm" onclick="advanceReferral(${i})">🧪 จำลองการอัปเดตสถานะถัดไป</button>`
        : `<span class="badge none">เสร็จสิ้น</span>`}
    </div>`;
  }).join("")}`);
}
function advanceReferral(i) {
  state.referrals[i].statusIdx++;
  save(); renderReferral();
  toast("อัปเดตสถานะ (จำลอง): " + REF_TIMELINE[state.referrals[i].statusIdx]);
}

/* =====================================================================
   SCREEN: profile / my data
   ===================================================================== */
function renderProfile() {
  const c = state.consent;
  view(`<div class="card">
    <h2>👤 ข้อมูลของฉัน</h2>
    <p class="tiny">${esc(liffStatusText())}
      <button class="btn btn-ghost btn-sm" style="margin-left:8px" onclick="liffLogin()">${(LIFF_STATE.loggedIn || state.lineLinked) ? "ยกเลิกการเชื่อมต่อ LINE" : "เชื่อมต่อ LINE"}</button></p>
  </div>

  <div class="card"><h3>ประวัติการประเมิน</h3>
    ${state.history.length === 0 ? `<p class="muted">ยังไม่มีประวัติ</p>` :
      state.history.map(h => `<div class="factor" style="border-left-color:var(--brand)">
        <b style="font-size:14px">${esc(h.bandLabel)}</b>
        <p class="tiny">${new Date(h.at).toLocaleString("th-TH")} · ${esc(h.engine)}${h.pathway !== "standard" ? " · มีเส้นทางอาการ" : ""}</p>
      </div>`).join("")}
  </div>

  <div class="card"><h3>การแจ้งเตือน</h3>
    <label class="opt ${state.reminders.enabled ? "sel" : ""}">
      <input type="checkbox" ${state.reminders.enabled ? "checked" : ""} onchange="toggleRemind(this.checked)"> เปิดการแจ้งเตือนผ่าน LINE
    </label>
    ${state.reminders.enabled ? `
    <div class="row mt">
      <div class="field"><label>เวลา</label><input type="text" value="${esc(state.reminders.time)}" onchange="state.reminders.time=this.value;save()"></div>
      <div class="field"><label>ความถี่</label><select onchange="state.reminders.freq=this.value;save()">
        ${["รายเดือน","ราย 3 เดือน","รายปี (ประเมินซ้ำ)"].map(o => `<option ${state.reminders.freq === o ? "selected" : ""}>${o}</option>`).join("")}
      </select></div>
    </div>
    <button class="btn btn-ghost btn-sm" onclick="toggleRemind(false)">หยุดการแจ้งเตือนทั้งหมด</button>` : ""}
    <p class="tiny mt">เราไม่ส่งข้อความสร้างความกลัว และไม่ใช้การแจ้งเตือนเพื่อโฆษณา</p>
  </div>

  <div class="card"><h3>ความยินยอม</h3>
    ${!c ? `<p class="muted">ยังไม่ได้ให้ความยินยอม</p>` : `
    <p class="tiny">เวอร์ชัน ${esc(c.version)} · ให้ไว้เมื่อ ${new Date(c.at).toLocaleString("th-TH")}</p>
    <div class="opts mt">
      ${[["history","บันทึกประวัติการประเมิน"],["remind","รับการแจ้งเตือนผ่าน LINE"],["contact","ให้เจ้าหน้าที่ติดต่อได้"],["research","ข้อมูลไม่ระบุตัวตนเพื่อวิจัย"],["loc","ใช้ตำแหน่งโดยประมาณ"]].map(([k, lbl]) => `
      <label class="opt ${c.optional[k] ? "sel" : ""}">
        <input type="checkbox" ${c.optional[k] ? "checked" : ""} onchange="state.consent.optional['${k}']=this.checked;save();renderProfile();toast(this.checked?'บันทึกความยินยอมแล้ว':'ถอนความยินยอมแล้ว')"> ${lbl}
      </label>`).join("")}
    </div>`}
  </div>

  <div class="card"><h3>จัดการข้อมูล</h3>
    <div class="row">
      <button class="btn btn-secondary btn-sm" onclick="exportData()">⬇️ ดาวน์โหลดข้อมูลของฉัน</button>
      <button class="btn btn-ghost btn-sm" onclick="confirmDelete()">🗑 ลบข้อมูลทั้งหมด</button>
    </div>
    <p class="tiny mt">ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล: privacy@lunglens.example (ตัวอย่าง)</p>
  </div>`);
}
function toggleRemind(on) {
  state.reminders.enabled = on; save();
  track(on ? "reminder_opted_in" : "reminder_opted_out");
  renderProfile();
  toast(on ? "เปิดการแจ้งเตือนแล้ว" : "ปิดการแจ้งเตือนแล้ว");
}
function exportData() {
  track("data_export_requested");
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "lunglens-my-data.json"; a.click();
  URL.revokeObjectURL(a.href);
  toast("ดาวน์โหลดข้อมูลแล้ว");
}
function confirmDelete() {
  modal(`<h3>ลบข้อมูลทั้งหมด</h3>
    <p class="muted">จะลบ: คำตอบ ผลประเมิน ประวัติ คำขอส่งต่อ และความยินยอม ออกจากอุปกรณ์นี้<br>
    ในระบบจริง: จะเพิกถอนเซสชัน ลบ/ทำข้อมูลนิรนามตามนโยบายเก็บรักษา และเก็บเฉพาะบันทึกตรวจสอบที่จำเป็นตามกฎหมาย</p>
    <button class="btn btn-urgent mt" onclick="wipeAll()">ยืนยันการลบ</button>`);
}
function wipeAll() {
  track("account_deletion_requested");
  localStorage.removeItem(STORE_KEY);
  state = structuredClone(DEFAULT_STATE);
  closeModal(); toast("ลบข้อมูลเรียบร้อยแล้ว");
  location.hash = "#home"; route();
}

/* =====================================================================
   SCREEN: provider dashboard (demo)
   ===================================================================== */
let providerTab = "cases";
function renderProvider() {
  const role = state.providerRole;
  if (!role) {
    view(`<div class="card">
      <h2>🔐 สำหรับเจ้าหน้าที่ / ผู้ให้บริการ</h2>
      <p class="tiny">โหมดสาธิต — เลือกบทบาทเพื่อเข้าสู่ระบบจำลอง (ระบบจริงใช้บัญชีองค์กร + สิทธิ์ตามบทบาท + audit log)</p>
      <div class="opts mt">${PROVIDER_ROLES.map(r => `
        <button class="opt" onclick="state.providerRole='${r.id}';save();renderProvider()">
          <span><b>${esc(r.name)}</b><br><span class="tiny">${esc(r.desc)}</span></span>
        </button>`).join("")}
      </div>
    </div>`);
    return;
  }
  const roleInfo = PROVIDER_ROLES.find(r => r.id === role);
  const tabs = [["cases","เคส"],["referrals","การส่งต่อ"],["rules","กฎความเสี่ยง"],["analytics","สถิติ"]];
  let bodyHtml = "";
  if (providerTab === "cases") bodyHtml = providerCases();
  if (providerTab === "referrals") bodyHtml = providerReferrals();
  if (providerTab === "rules") bodyHtml = providerRules();
  if (providerTab === "analytics") bodyHtml = providerAnalytics();
  view(`<div class="card">
    <h2>แดชบอร์ดผู้ให้บริการ <span class="demo-badge">ข้อมูลจำลอง</span></h2>
    <p class="tiny">${esc(roleInfo.name)} · ${esc(roleInfo.role)}
      <button class="btn btn-ghost btn-sm" style="margin-left:8px" onclick="state.providerRole=null;save();renderProvider()">ออกจากระบบ</button></p>
    <div class="chips mt">${tabs.map(([id, lbl]) => `
      <button class="chip ${providerTab === id ? "on" : ""}" style="min-height:38px" onclick="providerTab='${id}';renderProvider()">${lbl}</button>`).join("")}
    </div>
  </div>${bodyHtml}`);
}
function providerCases() {
  return `<div class="card"><h3>รายการเคส</h3>
    <p class="tiny">ไม่แสดงชื่อหรือข้อมูลอ่อนไหวในมุมมองรายการ · แตะแถวเพื่อดูรายละเอียด</p>
    <div class="table-wrap"><table class="data">
      <tr><th>อ้างอิง</th><th>ช่วงอายุ</th><th>จังหวัด</th><th>ผล</th><th>อาการ</th><th>สถานะส่งต่อ</th><th>ผู้ดูแล</th></tr>
      ${DEMO_CASES.map((c, i) => `<tr onclick="caseDetail(${i})">
        <td>${esc(c.ref)}</td><td>${esc(c.age)}</td><td>${esc(c.province)}</td>
        <td><span class="badge ${c.band}">${esc(BANDS[c.band === "none" ? "none" : c.band]?.label.slice(0, 18) || c.band)}…</span></td>
        <td>${c.symptom === "urgent" ? '<span class="badge urgent">เร่งด่วน</span>' : c.symptom === "prompt" ? '<span class="badge attention">มีอาการ</span>' : "—"}</td>
        <td>${esc(c.refStatus)}</td><td>${esc(c.nav)}</td>
      </tr>`).join("")}
    </table></div></div>`;
}
function caseDetail(i) {
  const c = DEMO_CASES[i];
  modal(`<h3>${esc(c.ref)} <span class="demo-badge">ข้อมูลจำลอง</span></h3>
    <p class="tiny">คะแนน/ผลจากระบบไม่ใช่การวินิจฉัย — ใช้ประกอบการพิจารณาของบุคลากรทางการแพทย์เท่านั้น</p>
    <p class="muted mt"><b>ช่วงอายุ:</b> ${esc(c.age)} · <b>จังหวัด:</b> ${esc(c.province)}<br>
    <b>ผลระบบ:</b> ${esc(BANDS[c.band]?.label || c.band)}<br>
    <b>เส้นทางอาการ:</b> ${c.symptom === "urgent" ? "เร่งด่วน" : c.symptom === "prompt" ? "ควรพบแพทย์" : "ปกติ"}<br>
    <b>เหตุผลการจัดลำดับ:</b> ${esc(c.priority)}<br>
    <b>สถานะส่งต่อ:</b> ${esc(c.refStatus)} · <b>กิจกรรมล่าสุด:</b> ${esc(c.last)}</p>
    <div class="row mt">
      <button class="btn btn-secondary btn-sm" onclick="protoPopup('ดูคำตอบต้นฉบับ','แสดงคำตอบเชิงโครงสร้าง + ความยินยอม + เวอร์ชันกฎที่ใช้ (อ่านอย่างเดียว)')">คำตอบต้นฉบับ</button>
      <button class="btn btn-secondary btn-sm" onclick="protoPopup('บันทึกคำแนะนำวิชาชีพ','Clinical reviewer บันทึกความเห็น — ระบบไม่แก้คำตอบเดิมของผู้ใช้')">บันทึกคำแนะนำ</button>
      <button class="btn btn-secondary btn-sm" onclick="protoPopup('บันทึกการติดต่อ','Navigator บันทึกความพยายามติดต่อ + audit log')">บันทึกการติดต่อ</button>
    </div>`);
}
function providerReferrals() {
  return `<div class="card"><h3>การส่งต่อ</h3>
    ${DEMO_CASES.filter(c => c.refStatus !== "—").map(c => `
    <div class="factor" style="border-left-color:var(--brand)">
      <b style="font-size:14px">${esc(c.ref)}</b> · <span class="tiny">${esc(c.province)}</span>
      <p class="tiny">สถานะ: ${esc(c.refStatus)} · ${esc(c.nav)}</p>
      <button class="btn btn-ghost btn-sm" onclick="protoPopup('อัปเดตสถานะการส่งต่อ','ไล่สถานะ: ส่งแล้ว → ตรวจสอบ → ติดต่อแล้ว → เสนอนัด → ยืนยันนัด → เสร็จสิ้น / ติดตามต่อ')">อัปเดตสถานะ</button>
    </div>`).join("")}
    <p class="tiny">สถานะทั้งหมด: draft · submitted · awaiting review · contacted · appointment offered · appointment confirmed · completed · follow-up required · user declined · unable to contact · closed</p>
  </div>`;
}
function providerRules() {
  return `<div class="card"><h3>กฎความเสี่ยงต้นแบบ (v1)</h3>
    <p class="tiny">แก้ไขได้เฉพาะผ่านกระบวนการเวอร์ชัน + ทบทวนทางคลินิก — ไม่มีการแก้กฎแบบเงียบ ผลเดิมผูกกับเวอร์ชันกฎเดิมเสมอ</p>
    <div class="table-wrap"><table class="data">
      <tr><th>รหัสกฎ</th><th>ชื่อ</th><th>น้ำหนัก*</th><th>หลักฐาน</th><th>สถานะ</th></tr>
      ${RULES.map(r => `<tr onclick="protoPopup('กฎ ${esc(r.code)}','เงื่อนไข + น้ำหนัก + อ้างอิง + ผู้อนุมัติ + วันที่มีผล — แก้ไขต้องสร้างเวอร์ชันใหม่')">
        <td>${esc(r.code)}</td><td>${esc(r.name)}</td><td>${r.weight}</td><td>${esc(r.evidence)}</td>
        <td><span class="badge attention">prototype</span></td></tr>`).join("")}
    </table></div>
    <p class="tiny mt">* น้ำหนักภายในต้นแบบ ไม่ใช่คะแนนทางคลินิก · เกณฑ์ผล: 0 = ยังไม่พบปัจจัยเด่น · 1–3 = ควรให้ความสำคัญ · ≥4 = แนะนำพบบุคลากรทางการแพทย์ · ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง</p></div>`;
}
function providerAnalytics() {
  const max = DEMO_FUNNEL[0][1];
  return `<div class="card"><h3>ช่องทางการเดินทางของผู้ใช้ (จำลอง)</h3>
    ${DEMO_FUNNEL.map(([lbl, n]) => `
    <div class="funnel-row"><span class="lbl">${esc(lbl)}</span>
      <div class="bar"><div style="width:${Math.round(n / max * 100)}%"></div></div>
      <span class="n">${n}</span></div>`).join("")}
    <p class="tiny mt">ตัวเลขเป็นข้อมูลจำลองแบบไม่ระบุตัวตน · กลุ่มที่มีจำนวนน้อยกว่า 5 จะถูกซ่อน (suppression) · แยกชัดเจนระหว่าง engagement / ผลแบบประเมิน / ผลลัพธ์ทางคลินิกที่ยืนยันแล้ว — ไม่มีการนับผลแบบประเมินเป็น “ผู้ป่วยมะเร็ง”</p>
  </div>
  <div class="card"><h3>การกระจายผลประเมิน (จำลอง)</h3>
    <div class="funnel-row"><span class="lbl">ยังไม่พบปัจจัยเด่น</span><div class="bar"><div style="width:55%;background:var(--ok)"></div></div><span class="n">225</span></div>
    <div class="funnel-row"><span class="lbl">ควรให้ความสำคัญ</span><div class="bar"><div style="width:32%;background:var(--warn)"></div></div><span class="n">131</span></div>
    <div class="funnel-row"><span class="lbl">แนะนำพบแพทย์</span><div class="bar"><div style="width:13%"></div></div><span class="n">54</span></div>
    <div class="funnel-row"><span class="lbl">เส้นทางอาการ</span><div class="bar"><div style="width:5%;background:var(--urgent)"></div></div><span class="n">21</span></div>
  </div>`;
}

/* =====================================================================
   SCREEN: demo story (presentation mode)
   ===================================================================== */
let storyIdx = 0;
const STORY_SLIDES = [
  { n: "1 / 5 — ปัญหา", h: "ผู้หญิงที่ไม่สูบบุหรี่<br>อาจไม่รู้ว่าตนเองมีปัจจัยเสี่ยง", p: "มะเร็งปอดในคนไม่สูบบุหรี่มีอยู่จริง โดยเฉพาะผู้หญิงเอเชีย — แต่เกณฑ์คัดกรองดั้งเดิมมองไม่เห็นพวกเธอ และเส้นทางเข้ารับบริการก็ซับซ้อน" },
  { n: "2 / 5 — สร้างความตระหนัก", h: "ไม่สูบ ≠ ไม่เสี่ยง", p: "แคมเปญบน LINE ช่องทางที่คนไทยใช้ทุกวัน — วิดีโอ 45 วินาที การ์ดแชร์ และ Rich Menu พาเข้าสู่แบบประเมินใน 1 แตะ" },
  { n: "3 / 5 — ประเมินแบบอธิบายได้", h: "2–3 นาที รู้ปัจจัยของตัวเอง", p: "แบบสอบถามภาษาง่าย แยกอาการออกจากคะแนนเสมอ ผลบอก “ปัจจัยใดควรให้ความสำคัญ เพราะอะไร” — ไม่ใช่คำวินิจฉัย ไม่ใช่เปอร์เซ็นต์ความน่าจะเป็น" },
  { n: "4 / 5 — เชื่อมต่อบริการ", h: "จากความรู้ สู่การพบแพทย์จริง", p: "ค้นหาสถานพยาบาล ขอให้เจ้าหน้าที่ติดต่อ ติดตามสถานะการส่งต่อ — ฝั่งผู้ให้บริการมีแดชบอร์ดจัดลำดับเคสและบันทึกการติดตาม" },
  { n: "5 / 5 — ผลลัพธ์และอนาคต", h: "วัดผลได้ทั้งเส้นทาง", p: "Funnel ตั้งแต่แคมเปญถึงการตรวจจริง ข้อมูลไม่ระบุตัวตน พร้อมโครงสร้างรองรับโมเดลความเสี่ยงไทยที่ผ่านการรับรองในอนาคต" }
];
function renderStory() {
  const s = STORY_SLIDES[storyIdx];
  view(`<div class="story card center">
    <p class="n">${esc(s.n)}</p>
    <h1>${s.h}</h1>
    <p class="muted" style="font-size:16px">${esc(s.p)}</p>
    <div class="assess-nav mt">
      <button class="btn btn-ghost" onclick="storyIdx=Math.max(0,storyIdx-1);renderStory()" ${storyIdx === 0 ? "disabled" : ""}>← ก่อนหน้า</button>
      <button class="btn btn-primary" onclick="storyIdx=Math.min(${STORY_SLIDES.length - 1},storyIdx+1);renderStory()" ${storyIdx === STORY_SLIDES.length - 1 ? "disabled" : ""}>ถัดไป →</button>
    </div>
    <button class="btn btn-ghost btn-sm mt" onclick="storyIdx=0;renderStory()">รีเซ็ตสไลด์</button>
    <p class="tiny mt">โหมดนำเสนอสำหรับการแข่งขัน · ข้อมูลจำลองทั้งหมด</p>
  </div>`);
}

/* =====================================================================
   SCREEN: privacy placeholder
   ===================================================================== */
function renderPrivacy() {
  view(`<div class="card">
    <h2>นโยบายความเป็นส่วนตัว</h2>
    <p class="q-note">ฉบับร่างสำหรับต้นแบบ ต้องผ่านการตรวจสอบทางกฎหมายก่อนใช้งานจริง</p>
    <h3>หลักการ</h3>
    <p class="muted">เก็บข้อมูลเท่าที่จำเป็น · แยกข้อจำเป็นออกจากข้อเลือกได้ · อธิบายเหตุผลของทุกคำถามอ่อนไหว · ไม่ขายข้อมูล · ไม่ใช้ข้อมูลความเสี่ยงสุขภาพเพื่อโฆษณา · ไม่แสดงข้อมูลสุขภาพในตัวอย่างการแจ้งเตือน LINE · ผู้ใช้ลบและแก้ไขข้อมูลได้</p>
    <h3>เอกสารที่เกี่ยวข้อง (โครงร่าง)</h3>
    <div class="opts">
      ${["ข้อกำหนดการใช้งาน","ข้อจำกัดความรับผิดทางการแพทย์","นโยบายเก็บรักษาข้อมูล","ความยินยอมเพื่อการวิจัย","ถ้อยแถลงการเข้าถึง (Accessibility)"].map(d => `
      <button class="opt" onclick="protoPopup('${d}','เอกสารฉบับร่าง — ต้องผ่านการตรวจสอบทางกฎหมายก่อนใช้งานจริง')">${d}</button>`).join("")}
    </div>
    <a class="btn btn-ghost mt" href="#home">← กลับหน้าแรก</a>
  </div>`);
}

/* ---------------- language toggle (partial EN, prototype) ---------------- */
function toggleLang() {
  state.lang = state.lang === "th" ? "en" : "th"; save();
  toast(state.lang === "en"
    ? "English UI is partial in this prototype — see TASKS.md"
    : "กลับเป็นภาษาไทยแล้ว");
  $("#langBtn").textContent = state.lang === "th" ? "EN" : "ไทย";
}

/* ---------------- boot ---------------- */
initLiff();   // real LIFF init when LIFF_ID is set (js/liff-config.js); browser fallback otherwise
route();
