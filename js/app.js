/* =====================================================================
   LungLens / รู้ทันปอด — prototype app shell
   Static SPA, hash-routed, state in localStorage (key: lunglens-v1).
   LINE LIFF calls are mocked — see liffMock() and README.md.
   ===================================================================== */

/* ---------------- state ---------------- */
const DEFAULT_STATE = {
  lang: DEFAULT_LOCALE,
  lineLinked: false,
  consent: null,            // { required:true, optional:{...}, version, at, lang }
  answers: {},
  stepIndex: 0,
  returnToReview: false,
  inProgress: false,
  result: null,
  history: [],              // [{at, bandKey, bandLabel, score, pathway}]
  referrals: [],            // [{id, facilityId, contact, days, time, note, status, statusIdx, at}]
  reminders: { enabled: false, time: "09:00", freq: "รายเดือน" },
  events: []                // privacy-conscious analytics event names only
};
let storageIssue = null;
let storageIssueShown = false;
let state = load();

function hydrateState(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    throw new Error("Invalid saved state");
  }
  const next = Object.assign(structuredClone(DEFAULT_STATE), saved);
  next.lang = saved.lang === "en" || saved.lang === "th" ? saved.lang : DEFAULT_LOCALE;
  next.answers = saved.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers)
    ? saved.answers : {};
  next.history = Array.isArray(saved.history) ? saved.history.slice(0, 20) : [];
  next.referrals = Array.isArray(saved.referrals) ? saved.referrals : [];
  next.events = Array.isArray(saved.events) ? saved.events : [];
  next.reminders = Object.assign({}, DEFAULT_STATE.reminders,
    saved.reminders && typeof saved.reminders === "object" ? saved.reminders : {});
  next.stepIndex = Number.isInteger(saved.stepIndex) && saved.stepIndex >= 0 ? saved.stepIndex : 0;
  next.returnToReview = saved.returnToReview === true;
  next.consent = saved.consent && typeof saved.consent === "object" ? saved.consent : null;
  const savedResult = saved.result && typeof saved.result === "object" ? saved.result : null;
  next.result = savedResult?.model_version === ENGINE_VERSION ? savedResult : null;
  if (savedResult && !next.result) {
    next.inProgress = true;
    next.returnToReview = false;
  }
  pruneInactiveAnswers(next.answers);
  return next;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return hydrateState(JSON.parse(raw));
  } catch (e) {
    storageIssue = "ไม่สามารถอ่านข้อมูลที่บันทึกไว้ได้ แอปจะไม่เขียนทับข้อมูลเดิมในครั้งนี้";
  }
  return structuredClone(DEFAULT_STATE);
}
function save() {
  if (storageIssue) return false;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    storageIssue = "ไม่สามารถบันทึกข้อมูลบนอุปกรณ์นี้ได้ โปรดเปิดหน้านี้ไว้จนกว่าจะทำเสร็จ";
    showStorageIssue();
    return false;
  }
}
function track(ev) { state.events.push({ ev, at: new Date().toISOString() }); save(); }

function showStorageIssue() {
  if (!storageIssue || storageIssueShown || !document.body) return;
  storageIssueShown = true;
  setTimeout(() => toast(storageIssue), 0);
}

/* ---------------- connection recovery ---------------- */
let lastKnownOnline = navigator.onLine !== false;

function updateConnectionStatus({ announce = false } = {}) {
  const banner = $("#connectionStatus");
  if (!banner) return;
  const online = navigator.onLine !== false;
  if (online) {
    banner.hidden = true;
    banner.innerHTML = "";
    if (announce && !lastKnownOnline) {
      toast(uiText("กลับมาเชื่อมต่ออินเทอร์เน็ตแล้ว", "Internet connection restored"));
    }
  } else {
    banner.hidden = false;
    banner.setAttribute("role", "alert");
    banner.innerHTML = `<div><b>${esc(uiText("ออฟไลน์อยู่", "You are offline"))}</b>
      <span>${esc(uiText(
        "คำตอบที่บันทึกไว้ยังอยู่บนอุปกรณ์ แต่ข้อมูลอากาศและลิงก์ภายนอกอาจไม่อัปเดต",
        "Saved answers remain on this device, but air-quality data and external links may not update."
      ))}</span></div>
      <button type="button" class="btn btn-ghost btn-sm" onclick="retryConnection()">${esc(uiText("ลองเชื่อมต่ออีกครั้ง", "Try again"))}</button>`;
  }
  lastKnownOnline = online;
}

function retryConnection() {
  updateConnectionStatus({ announce: true });
  if (navigator.onLine === false) {
    toast(uiText("ยังไม่พบการเชื่อมต่ออินเทอร์เน็ต", "Still offline"));
    return;
  }
  route();
}

window.addEventListener("offline", () => updateConnectionStatus({ announce: true }));
window.addEventListener("online", () => {
  updateConnectionStatus({ announce: true });
  if ((location.hash || "").startsWith("#air")) loadAirPage(selectedAirProvince);
});

/* ---------------- tiny helpers ---------------- */
const $ = sel => document.querySelector(sel);
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function provinceDisplay(name) {
  const province = PROVINCE_META.find(item => item.th === name);
  return state.lang === "en" ? (province?.en || name) : name;
}
function uiText(th, en) { return state.lang === "en" ? en : th; }

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
  el.textContent = tr(msg);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

let modalReturnFocus = null;
function modal(html, { closable = true } = {}) {
  closeModal();
  modalReturnFocus = document.activeElement;
  const back = document.createElement("div");
  back.className = "modal-back"; back.id = "modalBack";
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" tabindex="-1">${html}
    ${closable ? '<button class="btn btn-ghost mt" onclick="closeModal()">ปิด</button>' : ""}</div>`;
  if (closable) back.addEventListener("click", e => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  const dialog = back.querySelector(".modal");
  const heading = dialog.querySelector("h1,h2,h3");
  if (heading) {
    heading.id = "modal-title";
    dialog.setAttribute("aria-labelledby", heading.id);
  } else {
    dialog.setAttribute("aria-label", tr("ข้อมูลเพิ่มเติม"));
  }
  back.addEventListener("keydown", e => {
    if (closable && e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )].filter(element => !element.hidden && element.getAttribute("aria-hidden") !== "true");
    if (!focusable.length) {
      e.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  if (!isThaiOnlyRoute()) localizeSubtree(back);
  (dialog.querySelector("button,a,input,select,textarea") || dialog).focus();
}
function closeModal() {
  const back = $("#modalBack");
  if (!back) return;
  back.remove();
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
  modalReturnFocus = null;
}

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
  review: renderReview, symptom: renderSymptomPathway, result: renderResult, education: renderEducation,
  air: renderAirQuality, clinics: renderClinics, referral: renderReferral, profile: renderProfile,
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
  const routeName = name.replace(/^\//, "");
  if (state.returnToReview && routeName !== "assess" && routeName !== "review") {
    state.returnToReview = false;
    save();
  }
  const fn = ROUTES[routeName] || renderHome;
  window.scrollTo(0, 0);
  fn(arg);
  document.querySelectorAll("nav.bottom a").forEach(a => {
    const active = a.getAttribute("href") === "#" + name;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  focusRouteHeading();
  showStorageIssue();
}
window.addEventListener("hashchange", route);

function isThaiOnlyRoute() {
  const routeName = (location.hash || "#home").slice(1).split("=")[0].replace(/^\//, "");
  return routeName === "provider" || routeName === "demo-story";
}

function applyLocale() {
  const lang = state.lang === "en" ? "en" : "th";
  document.documentElement.lang = lang;
  document.title = lang === "en"
    ? t("document_title")
    : "รู้ทันปอด (LungLens) — แบบประเมินความเสี่ยงเบื้องต้น";
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.content = lang === "en"
    ? t("document_description")
    : "ไม่สูบ ไม่ได้แปลว่าไม่เสี่ยง — รู้ความเสี่ยงก่อนมีอาการ และรับคำแนะนำที่เหมาะกับคุณ";
  [".skip-link", "header.app", "nav.bottom", "#splash"].forEach(sel => localizeSubtree($(sel), lang));
  if (!isThaiOnlyRoute()) localizeSubtree($("#view"), lang);
  const langBtn = $("#langBtn");
  if (langBtn) {
    langBtn.textContent = lang === "th" ? "EN" : "ไทย";
    langBtn.setAttribute("aria-label", lang === "th" ? "เปลี่ยนภาษา" : "Switch to Thai");
  }
  updateConnectionStatus();
  applyTextSize();
}

function view(html) {
  $("#view").innerHTML = html;
  if (!isThaiOnlyRoute()) localizeSubtree($("#view"));
  focusRouteHeading();
}

function focusRouteHeading() {
  const heading = $("#view h1, #view h2, #view .q-title");
  if (!heading) return;
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}

/* =====================================================================
   SCREEN: landing
   ===================================================================== */
function savedAssessmentSummary() {
  const steps = visibleSteps().filter(step => step.type !== "info");
  const completed = steps.filter(step => !validateAssessmentStep(step, state.answers)).length;
  const current = steps[Math.min(state.stepIndex, Math.max(0, steps.length - 1))];
  return {
    completed,
    total: steps.length,
    remaining: Math.max(0, steps.length - completed),
    currentTitle: current?.title || ""
  };
}

function renderHome() {
  track("landing_viewed");
  const hasResult = !!state.result;
  const resume = state.inProgress && !state.result;
  const resumeSummary = resume ? savedAssessmentSummary() : null;
  view(`
  <div class="hero">
    <h1>ไม่สูบ ไม่ได้แปลว่าไม่เสี่ยง</h1>
    <p>มะเร็งปอดไม่ได้เกิดเฉพาะกับผู้สูบบุหรี่ อายุ ประวัติครอบครัว โรคปอดเดิม อาชีพ ควัน และมลพิษอาจมีส่วนต่อความเสี่ยงของแต่ละคน</p>
    <a class="btn btn-primary" href="#begin" onclick="track('assessment_cta_clicked')">ประเมินความเสี่ยง 2–3 นาที</a>
    <a class="btn btn-ghost" href="#education">มะเร็งปอดในคนไม่สูบบุหรี่คืออะไร</a>
    <a class="btn btn-ghost" href="#air">ตรวจค่าฝุ่น PM2.5 ในจังหวัดของคุณ</a>
  </div>

  ${resume ? `<div class="card" style="border-color:#a5f3fc;background:var(--brand-soft)">
    <b>คุณได้บันทึกแบบประเมินสุขภาพปอดไว้</b>
    <p class="muted">${esc(uiText(
      `ตอบครบแล้ว ${resumeSummary.completed} จาก ${resumeSummary.total} ส่วน · เหลือ ${resumeSummary.remaining} ส่วน`,
      `${resumeSummary.completed} of ${resumeSummary.total} sections complete · ${resumeSummary.remaining} remaining`
    ))}</p>
    ${resumeSummary.currentTitle ? `<p class="tiny">${esc(uiText("ทำต่อที่", "Continue at"))}: <b>${esc(resumeSummary.currentTitle)}</b></p>` : ""}
    <a class="btn btn-primary mt" href="#assess">ทำแบบประเมินต่อ</a>
    <p class="tiny mt">${esc(uiText(
      "ใช้อุปกรณ์ร่วมกับผู้อื่น? คำตอบอยู่ในเบราว์เซอร์นี้ โปรดทำต่อหรือลบข้อมูลในหน้า “ข้อมูลของฉัน” ก่อนส่งต่ออุปกรณ์",
      "Using a shared device? Answers remain in this browser. Continue or delete them under “My data” before handing over the device."
    ))}</p>
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
    <button type="button" class="storyboard-trigger" aria-label="${esc(uiText(
      "เปิดสตอรีบอร์ดวิดีโอแคมเปญ",
      "Open the campaign video storyboard"
    ))}" onclick="showStoryboard()">
      <span aria-hidden="true">▶️</span>
    </button>
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
    <details><summary>${esc(uiText("เหตุใดจึงถามจังหวัด", "Why the assessment asks for a province"))}</summary>
      <p class="muted">${esc(uiText(
        "จังหวัดใช้เพื่อแสดงคุณภาพอากาศและช่วยค้นหาบริการใกล้พื้นที่เท่านั้น ไม่ใช้คำนวณระดับปัจจัย ไม่ทำให้เข้าเกณฑ์ LDCT และไม่ขอที่อยู่เต็ม",
        "Province is used only to show local air quality and help find nearby services. It never changes the factor band, never creates LDCT eligibility, and your full address is not requested."
      ))}</p></details>
    <details><summary>${esc(uiText("หากใช้อุปกรณ์ร่วมกับผู้อื่น", "If you use a shared device"))}</summary>
      <p class="muted">${esc(uiText(
        "คำตอบจะบันทึกในเบราว์เซอร์นี้เพื่อให้กลับมาทำต่อได้ ผู้ใช้คนถัดไปอาจเปิดดูได้ จึงควรลบข้อมูลจากหน้า “ข้อมูลของฉัน” เมื่อใช้งานเสร็จ",
        "Answers are saved in this browser so you can continue later. Another person using the device may be able to open them, so delete the data under “My data” when finished."
      ))}</p></details>
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
  state.inProgress = true; state.stepIndex = 0; state.returnToReview = false;
  save(); track("consent_completed"); track("assessment_started");
  location.hash = "#assess";
}

/* =====================================================================
   SCREEN: assessment wizard
   ===================================================================== */
function visibleSteps() { return STEPS.filter(s => !s.cond || s.cond(state.answers)); }
let assessmentIssue = null;

function renderAssess() {
  if (!state.consent) { location.hash = "#begin"; return; }
  const steps = visibleSteps();
  if (state.stepIndex >= steps.length) state.stepIndex = steps.length - 1;
  const step = steps[state.stepIndex];
  const n = state.stepIndex + 1, total = steps.length;
  const a = state.answers;
  const issue = assessmentIssue?.stepId === step.id ? assessmentIssue : null;

  let body = "";
  if (step.type === "choice") {
    body = `<div class="opts">${step.options.map(o => `
      <button type="button" class="opt ${a[step.id] === o ? "sel" : ""}"
        aria-pressed="${a[step.id] === o}" onclick="answerChoice('${step.id}', this.dataset.v)"
        data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
  } else if (step.type === "multi" || step.type === "symptoms") {
    const cur = a[step.id] || [];
    body = `<div class="opts">${step.options.map(o => `
      <label class="opt ${cur.includes(o) ? "sel" : ""}">
        <input type="checkbox" ${cur.includes(o) ? "checked" : ""} onchange="answerMulti('${step.id}', this.dataset.v, this.checked)" data-v="${esc(o)}"> ${esc(o)}
      </label>`).join("")}</div>`;
  } else if (step.type === "numbers") {
    const cur = a[step.id] || {};
    body = step.fields.map(f => {
      const fieldIssue = issue?.fieldKey === f.key;
      const helpId = `${step.id}-${f.key}-help`;
      return `<div class="field ${fieldIssue ? "field-invalid" : ""}"><label for="${step.id}-${f.key}">${esc(f.label)}</label>
        <input id="${step.id}-${f.key}" type="number" inputmode="numeric" min="${f.min}" max="${f.max}" step="1"
          required aria-invalid="${fieldIssue}" aria-describedby="${helpId}${fieldIssue ? " assessment-error" : ""}"
          value="${cur[f.key] ?? ""}" oninput="answerNum('${step.id}','${f.key}', this.value)">
        <p class="field-help" id="${helpId}">${esc(uiText(
          `ใส่จำนวนเต็มตั้งแต่ ${f.min} ถึง ${f.max}`,
          `Enter a whole number from ${f.min} to ${f.max}`
        ))}</p></div>`;
    }).join("");
  } else if (step.type === "group") {
    const cur = a[step.id] || {};
    body = step.fields.map(f => {
      const fieldIssue = issue?.fieldKey === f.key;
      if (f.type === "multi") {
        const sel = cur[f.key] || [];
        return `<div class="field ${fieldIssue ? "field-invalid" : ""}"><label id="${step.id}-${f.key}-label">${esc(f.label)}</label><div class="chips"
          role="group" aria-labelledby="${step.id}-${f.key}-label" aria-invalid="${fieldIssue}" ${fieldIssue ? 'aria-describedby="assessment-error"' : ""}>
          ${f.options.map(o => `<button type="button" class="chip ${sel.includes(o) ? "on" : ""}"
            aria-pressed="${sel.includes(o)}" onclick="answerGroupMulti('${step.id}','${f.key}', this.dataset.v)"
            data-v="${esc(o)}">${esc(o)}</button>`).join("")}
        </div></div>`;
      }
      return `<div class="field ${fieldIssue ? "field-invalid" : ""}"><label for="${step.id}-${f.key}">${esc(f.label)}</label>
        <select id="${step.id}-${f.key}" required aria-invalid="${fieldIssue}" ${fieldIssue ? 'aria-describedby="assessment-error"' : ""}
          onchange="answerGroup('${step.id}','${f.key}', this.value)">
          <option value="">${esc(uiText("— เลือก —", "— Select —"))}</option>
          ${f.options.map(o => `<option value="${esc(o)}" ${cur[f.key] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}
        </select></div>`;
    }).join("");
  } else if (step.type === "province") {
    body = `<div class="field ${issue ? "field-invalid" : ""}"><label for="province-select">${esc(uiText("จังหวัด", "Province"))}</label>
      <select id="province-select" required aria-invalid="${!!issue}" ${issue ? 'aria-describedby="assessment-error"' : ""}
        onchange="answerChoice('PROVINCE', this.value)">
        <option value="">${esc(uiText("— เลือกจังหวัด —", "— Select a province —"))}</option>
        ${PROVINCES.map(p => `<option value="${esc(p)}" ${a.PROVINCE === p ? "selected" : ""}>${esc(provinceDisplay(p))}</option>`).join("")}
      </select></div>
      <div class="field"><label for="district-input">${esc(uiText("อำเภอ/เขต หรือรหัสไปรษณีย์ (ไม่บังคับ)", "District or postcode (optional)"))}</label>
        <input id="district-input" type="text" value="${esc(a.DISTRICT || "")}"
          onchange="answerChoice('DISTRICT', this.value)" placeholder="${esc(uiText("ข้ามได้", "Optional"))}"></div>
      ${a.PROVINCE ? `<div id="assessment-air-context" class="air-compact" role="status" aria-live="polite">
        ${esc(uiText("กำลังโหลดข้อมูลคุณภาพอากาศล่าสุด…", "Loading current air-quality data…"))}
      </div>` : ""}
      <p class="tiny">${esc(uiText(
        "ค่าฝุ่นปัจจุบันแสดงเพื่อช่วยวางแผนกิจกรรมวันนี้เท่านั้น และไม่ถูกนำไปคำนวณผลปัจจัยหรือเกณฑ์คัดกรองมะเร็งปอด",
        "Current pollution data is shown only to help plan today's activities. It never changes the factor result or lung-cancer screening criteria."
      ))}</p>`;
  }

  const isSymptoms = step.type === "symptoms";
  view(`
  <div class="progress-wrap">
    <div class="progress-txt"><span>${esc(uiText(`ข้อ ${n} จาก ${total}`, `Question ${n} of ${total}`))}</span><span>${esc(step.section)}</span></div>
    <div class="progress-remaining">${esc(uiText(
      n === total ? "คำถามสุดท้าย" : `เหลืออีก ${total - n} คำถาม`,
      n === total ? "Final question" : `${total - n} questions remaining`
    ))}</div>
    <div class="progress-bar" role="progressbar" aria-label="${esc(uiText("ความคืบหน้าแบบประเมิน", "Assessment progress"))}"
      aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${n}">
      <div style="width:${Math.round(n / total * 100)}%"></div></div>
  </div>
  <div class="card">
    <span class="section-tag">${esc(step.section)}</span>
    <h1 class="q-title">${esc(step.title)}</h1>
    ${step.note ? `<div class="q-note">${esc(step.note)}</div>` : ""}
    ${step.type === "province" ? `<div class="q-note">${esc(uiText(
      "จังหวัดช่วยแสดงข้อมูลอากาศและตัวอย่างบริการใกล้พื้นที่เท่านั้น ไม่ใช้คำนวณผลปัจจัย ไม่ทำให้เข้าเกณฑ์คัดกรอง และไม่ต้องระบุที่อยู่เต็ม",
      "Province is used only for local air information and nearby-service examples. It never affects the factor result or screening criteria, and your full address is not requested."
    ))}</div>` : ""}
    ${isSymptoms ? `<div class="q-note" style="background:var(--brand-soft)">อาการเหล่านี้อาจเกิดจากหลายสาเหตุและไม่ได้หมายความว่าคุณเป็นมะเร็ง แต่ควรได้รับการประเมินจากบุคลากรทางการแพทย์โดยเร็ว</div>` : ""}
    ${issue ? `<div class="assessment-error" id="assessment-error" role="alert" tabindex="-1">
      <b>${esc(uiText("โปรดตรวจสอบคำตอบ", "Check this answer"))}</b>
      <span>${esc(validationMessage(issue))}</span>
    </div>` : ""}
    ${body}
    ${step.why ? `<button class="why-btn" onclick="modal('<h3>ทำไมเราจึงถามคำถามนี้</h3><p class=muted>${esc(step.why)}</p>')">ทำไมเราจึงถามคำถามนี้</button>` : ""}
  </div>
  <div class="assess-nav">
    <button type="button" class="btn btn-ghost" onclick="stepBack()" ${n === 1 ? "disabled" : ""}>ย้อนกลับ</button>
    <button type="button" class="btn btn-primary" onclick="stepNext()">${n === total ? "ตรวจทานคำตอบ" : "ถัดไป"}</button>
  </div>
  <p class="tiny mt">${esc(uiText(
    "ปุ่มย้อนกลับจะเก็บคำตอบเดิมไว้ หากเปลี่ยนคำตอบหลัก รายละเอียดติดตามที่ไม่เกี่ยวข้องจะถูกล้างเพื่อไม่ให้มีข้อมูลซ่อนอยู่ในผล",
    "Back keeps previous answers. If you change a controlling answer, follow-up details that no longer apply are cleared so hidden data cannot affect the result."
  ))}</p>
  <button type="button" class="btn btn-ghost mt" onclick="saveExit()">บันทึกและกลับมาทำต่อภายหลัง</button>`);
  if (step.type === "province" && a.PROVINCE) updateAssessmentAirContext(a.PROVINCE);
}

function answerChoice(id, v) {
  state.answers[id] = v;
  clearAssessmentIssue(id);
  pruneInactiveAnswers(state.answers);
  save();
  if (id !== "DISTRICT" && id !== "PROVINCE") stepNext();
  else renderAssess();
}
function answerMulti(id, v, on) {
  const step = STEPS.find(s => s.id === id);
  let cur = state.answers[id] || [];
  if (on) {
    if ((step.exclusive || []).includes(v)) cur = [v];
    else cur = cur.filter(x => !(step.exclusive || []).includes(x)).concat(v);
  } else cur = cur.filter(x => x !== v);
  state.answers[id] = cur; clearAssessmentIssue(id); save(); renderAssess();
}
function answerNum(id, key, v) {
  state.answers[id] = state.answers[id] || {};
  state.answers[id][key] = v === "" ? null : Number(v);
  clearAssessmentIssue(id, key);
  save();
}
function answerGroup(id, key, v) {
  state.answers[id] = state.answers[id] || {};
  state.answers[id][key] = v || null; clearAssessmentIssue(id, key); save();
}
function answerGroupMulti(id, key, v) {
  state.answers[id] = state.answers[id] || {};
  const stepField = STEPS.find(s => s.id === id).fields.find(f => f.key === key);
  let cur = state.answers[id][key] || [];
  if (cur.includes(v)) cur = cur.filter(x => x !== v);
  else if ((stepField.exclusive || []).includes(v)) cur = [v];
  else cur = cur.filter(x => !(stepField.exclusive || []).includes(x)).concat(v);
  state.answers[id][key] = cur; clearAssessmentIssue(id, key); save(); renderAssess();
}

function clearAssessmentIssue(stepId, fieldKey = null) {
  if (!assessmentIssue || assessmentIssue.stepId !== stepId) return;
  if (fieldKey && assessmentIssue.fieldKey && assessmentIssue.fieldKey !== fieldKey) return;
  assessmentIssue = null;
  $("#assessment-error")?.remove();
  document.querySelectorAll("[aria-invalid='true']").forEach(element => {
    element.setAttribute("aria-invalid", "false");
    const describedBy = (element.getAttribute("aria-describedby") || "")
      .split(/\s+/).filter(id => id && id !== "assessment-error");
    if (describedBy.length) element.setAttribute("aria-describedby", describedBy.join(" "));
    else element.removeAttribute("aria-describedby");
  });
  document.querySelectorAll(".field-invalid").forEach(element => element.classList.remove("field-invalid"));
}

function stepBack() {
  if (state.stepIndex > 0) {
    assessmentIssue = null;
    state.stepIndex--;
    save();
    renderAssess();
  }
}
function validationMessage(issue) {
  if (!issue) return "";
  if (state.lang === "en") {
    if (issue.code === "province_required") return "Choose a province.";
    if (issue.code === "group_field_required") return `Please answer “${tr(issue.fieldLabel, "en")}”.`;
    if (issue.code === "number_required") return `Enter “${tr(issue.fieldLabel, "en")}”.`;
    if (issue.code === "number_range") {
      return `Enter “${tr(issue.fieldLabel, "en")}” between ${issue.min} and ${issue.max}.`;
    }
    if (issue.code === "number_integer") return `Enter a whole number for “${tr(issue.fieldLabel, "en")}”.`;
    return "Choose an answer or select “Not sure”.";
  }
  if (issue.code === "province_required") return "กรุณาเลือกจังหวัด";
  if (issue.code === "group_field_required") return `กรุณาตอบหัวข้อ “${issue.fieldLabel}”`;
  if (issue.code === "number_required") return `กรุณาใส่ “${issue.fieldLabel}”`;
  if (issue.code === "number_range") {
    return `กรุณาใส่ “${issue.fieldLabel}” ระหว่าง ${issue.min} ถึง ${issue.max}`;
  }
  if (issue.code === "number_integer") return `กรุณาใส่จำนวนเต็มสำหรับ “${issue.fieldLabel}”`;
  return "กรุณาเลือกคำตอบ หรือเลือก “ไม่แน่ใจ”";
}

function showAssessmentIssue(issue) {
  assessmentIssue = issue;
  renderAssess();
  requestAnimationFrame(() => {
    const field = issue.fieldKey ? $(`#${issue.stepId}-${issue.fieldKey}`) : null;
    const target = field || $("#province-select") || $("#assessment-error");
    target?.focus();
    if (field?.select) field.select();
  });
}

function goToValidationIssue(issue) {
  const steps = visibleSteps();
  const index = steps.findIndex(step => step.id === issue.stepId);
  state.stepIndex = index >= 0 ? index : 0;
  state.returnToReview = true;
  save();
  toast(validationMessage(issue));
  if (location.hash === "#assess") renderAssess();
  else location.hash = "#assess";
}

function stepNext() {
  pruneInactiveAnswers(state.answers);
  const steps = visibleSteps();
  const step = steps[state.stepIndex];
  const issue = validateAssessmentStep(step, state.answers);
  if (issue) { showAssessmentIssue(issue); return; }
  assessmentIssue = null;
  track("assessment_section_completed");
  if (state.returnToReview) {
    state.returnToReview = false;
    save();
    location.hash = "#review";
    return;
  }
  if (state.stepIndex >= steps.length - 1) {
    save();
    location.hash = "#review";
    return;
  }
  state.stepIndex++;
  save(); renderAssess();
}

function saveExit() {
  state.returnToReview = false;
  save();
  toast("บันทึกคำตอบแล้ว กลับมาทำต่อได้ทุกเมื่อ");
  location.hash = "#home";
}

function formatReviewAnswer(step) {
  const value = state.answers[step.id];
  if (step.type === "province") {
    return [state.answers.PROVINCE, state.answers.DISTRICT].filter(Boolean).map(esc).join(" · ");
  }
  if (step.type === "numbers") {
    const current = value || {};
    return step.fields.map(field =>
      `<span><b>${esc(field.label)}:</b> ${current[field.key] ?? "ไม่ได้ระบุ"}</span>`
    ).join("<br>");
  }
  if (step.type === "group") {
    const current = value || {};
    return step.fields.map(field => {
      const answer = Array.isArray(current[field.key]) ? current[field.key].join(", ") : current[field.key];
      return `<span><b>${esc(field.label)}:</b> ${esc(answer || "ไม่ได้ระบุ")}</span>`;
    }).join("<br>");
  }
  if (Array.isArray(value)) return value.map(esc).join(", ");
  return esc(value || "ไม่ได้ระบุ");
}

function renderReview() {
  if (!state.consent) { location.hash = "#begin"; return; }
  pruneInactiveAnswers(state.answers);
  const issues = validateAssessment(state.answers);
  if (issues.length) { goToValidationIssue(issues[0]); return; }
  const steps = visibleSteps().filter(step => step.type !== "info");
  view(`<div class="card">
    <h2>ตรวจทานคำตอบก่อนดูผล</h2>
    <p class="muted">โปรดตรวจสอบคำตอบของคุณ คุณสามารถแก้ไขได้ก่อนสร้างผลประเมินเบื้องต้น</p>
  </div>
  <div class="review-list">${steps.map(step => `
    <section class="review-item">
      <div>
        <h3>${esc(step.title)}</h3>
        <p>${formatReviewAnswer(step)}</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm"
        aria-label="แก้ไข: ${esc(step.title)}"
        onclick="editReviewAnswer('${step.id}')">แก้ไข</button>
    </section>`).join("")}</div>
  <div class="disclaimer">
    แบบประเมินนี้เป็นเครื่องมือให้ความรู้และประเมินความเสี่ยงเบื้องต้น ไม่ใช่การวินิจฉัยโรค และไม่สามารถใช้แทนคำแนะนำจากแพทย์
  </div>
  <div class="assess-nav">
    <button type="button" class="btn btn-ghost" onclick="backToLastQuestion()">ย้อนกลับ</button>
    <button type="button" class="btn btn-primary" onclick="submitAssessment()">ยืนยันคำตอบและดูผล</button>
  </div>`);
}

function editReviewAnswer(stepId) {
  const index = visibleSteps().findIndex(step => step.id === stepId);
  state.stepIndex = index >= 0 ? index : 0;
  state.returnToReview = true;
  save();
  location.hash = "#assess";
}

function backToLastQuestion() {
  state.stepIndex = Math.max(0, visibleSteps().length - 1);
  state.returnToReview = false;
  save();
  location.hash = "#assess";
}

function submitAssessment() {
  state.returnToReview = false;
  pruneInactiveAnswers(state.answers);
  const issues = validateAssessment(state.answers);
  if (issues.length) { goToValidationIssue(issues[0]); return; }
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
function resultSymptomCopy(result) {
  if (result.symptom_pathway === "urgent") {
    return {
      label: uiText("มีอาการที่ควรได้รับการประเมินโดยเร็ว", "A reported symptom needs prompt assessment"),
      detail: uiText(
        "เส้นทางอาการแยกจากผลปัจจัย หากอาการรุนแรงหรือฉุกเฉินให้โทร 1669 ในประเทศไทย",
        "Symptoms are handled separately from the factor result. For a severe or emergency symptom, call 1669 in Thailand."
      )
    };
  }
  if (result.symptom_pathway === "prompt") {
    return {
      label: uiText("มีอาการที่ควรปรึกษาบุคลากรทางการแพทย์", "A reported symptom should be discussed with a healthcare professional"),
      detail: uiText(
        "อาการอาจเกิดจากหลายสาเหตุและไม่ใช่การวินิจฉัยมะเร็ง",
        "A symptom can have many causes and is not a cancer diagnosis."
      )
    };
  }
  if ((state.answers.SYMPTOMS || []).includes("ไม่ต้องการตอบ")) {
    return {
      label: uiText("ไม่ได้ประเมินอาการจากคำตอบนี้", "Symptoms were not assessed from this answer"),
      detail: uiText(
        "หากมีอาการที่กังวล โปรดปรึกษาบุคลากรทางการแพทย์แม้ผลปัจจัยจะเป็นอย่างไร",
        "If you have a concerning symptom, speak with a healthcare professional regardless of the factor result."
      )
    };
  }
  return {
    label: uiText("ไม่พบอาการในรายการที่ต้องแยกเส้นทางจากคำตอบที่ให้", "No separately routed symptom was reported from the listed choices"),
    detail: uiText(
      "ข้อความนี้ไม่ยืนยันว่าไม่มีอาการหรือไม่มีโรค หากมีอาการใหม่หรือเปลี่ยนแปลงควรขอคำแนะนำ",
      "This does not prove that no symptom or disease is present. Seek advice for a new or changing symptom."
    )
  };
}

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
  const screening = r.screening_context || screeningContext(state.answers);
  const needsProfessionalNext =
    screening.key === "discuss_ldct" ||
    screening.key === "individual_review" ||
    b === BANDS.review;
  const primaryNext = needsProfessionalNext
    ? `<a class="btn btn-primary mt" href="#clinics">ค้นหาช่องทางปรึกษาบุคลากรทางการแพทย์</a>`
    : `<a class="btn btn-primary mt" href="#education">เรียนรู้วิธีดูแลสุขภาพปอด</a>`;
  const symptomCopy = resultSymptomCopy(r);
  const dt = formatDate(r.generated_at);
  view(`
  ${r.symptom_pathway !== "standard" ? `<div class="band band-urgent">
    <b>มีอาการที่ควรปรึกษาแพทย์</b>
    <p class="muted">ระบบให้ความสำคัญกับการประเมินอาการก่อนเสมอ</p>
    <a class="btn btn-urgent btn-sm mt" href="#symptom">ดูคำแนะนำเรื่องอาการ</a></div>` : ""}

  <div class="band ${b.cls}">
    <h2>${esc(b.label)}</h2>
    <p>${esc(b.summary)}</p>
  </div>

  <div class="card">
    <h2>${esc(uiText("สรุปผลแบบเข้าใจง่าย", "Your result in four questions"))}</h2>
    <div class="result-overview">
      <section>
        <span>1</span>
        <div><h3>${esc(uiText("แบบประเมินสังเกตอะไร", "What did the assessment notice?"))}</h3>
          <p><b>${esc(b.label)}</b></p><p class="muted">${esc(b.summary)}</p></div>
      </section>
      <section>
        <span>2</span>
        <div><h3>${esc(uiText("อาการต้องได้รับความสนใจหรือไม่", "Do the reported symptoms need attention?"))}</h3>
          <p><b>${esc(symptomCopy.label)}</b></p><p class="muted">${esc(symptomCopy.detail)}</p></div>
      </section>
      <section>
        <span>3</span>
        <div><h3>${esc(uiText("ทำอะไรได้ตอนนี้", "What can you do now?"))}</h3>
          <p class="muted">${esc(b.action)}</p></div>
      </section>
      <section>
        <span>4</span>
        <div><h3>${esc(uiText("บุคลากรทางการแพทย์ช่วยตัดสินใจอะไรได้", "What can a healthcare professional help decide?"))}</h3>
          <p><b>${esc(screening.label)}</b></p><p class="muted">${esc(screening.action)}</p></div>
      </section>
    </div>
  </div>

  <div class="card">
    <h3>เกณฑ์การคัดกรอง LDCT หมายถึงอะไรสำหรับคุณ</h3>
    <h4>${esc(screening.label)}</h4>
    <p class="muted">${esc(screening.summary)}</p>
    <p class="tiny mt">${esc(screening.action)}</p>
    <p class="tiny mt">ส่วนนี้ใช้เกณฑ์อายุร่วมกับประวัติการสูบเพื่อให้ความรู้เท่านั้น จังหวัด เพศ และอายุเพียงอย่างเดียวไม่ทำให้เข้าเกณฑ์ และบุคลากรทางการแพทย์ต้องเป็นผู้ยืนยันความเหมาะสม</p>
  </div>

  ${r.factors.length ? `<div class="card">
    <h2>${esc(uiText("คำตอบที่มีผลต่อระดับปัจจัย", "Answers that affected the factor band"))}</h2>
    <p class="tiny">แตะแต่ละปัจจัยเพื่อดูคำอธิบาย · ปัจจัยไม่ใช่การวินิจฉัย</p>
    ${r.factors.map((f, i) => `
      <button type="button" class="factor" onclick="factorDetail(${i})">
        <h4>${esc(f.name)}</h4>
        <p class="muted" style="font-size:13.5px">${esc(f.explain)}</p>
        <span class="ev">หลักฐาน: ${esc(f.evidence)}</span>
      </button>`).join("")}
  </div>` : `<div class="card">
    <h2>${esc(uiText("คำตอบที่มีผลต่อระดับปัจจัย", "Answers that affected the factor band"))}</h2>
    <p class="muted">จากคำตอบของคุณ ระบบยังไม่พบปัจจัยที่เข้าเงื่อนไขกฎต้นแบบรุ่นปัจจุบัน อย่างไรก็ตาม แบบประเมินนี้ประเมินได้เพียงบางปัจจัยเท่านั้น</p>
  </div>`}

  <div class="card">
    <h3>${esc(uiText("ข้อมูลที่ไม่เพิ่มระดับปัจจัย", "Information that did not increase the factor band"))}</h3>
    <ul class="plain-list muted">
      <li>${esc(uiText(
        "จังหวัด ตำแหน่ง และค่าฝุ่นปัจจุบันไม่ถูกนำไปคำนวณระดับปัจจัยหรือเกณฑ์คัดกรอง",
        "Province, location and current pollution never enter the factor band or screening criteria."
      ))}</li>
      <li>${esc(uiText(
        "อาการใช้เส้นทางแยกเพื่อความปลอดภัยและไม่เพิ่มคะแนนปัจจัย",
        "Symptoms use a separate safety pathway and never add factor points."
      ))}</li>
      <li>${esc(uiText(
        "อายุเพียงอย่างเดียวไม่เพิ่มระดับปัจจัยและไม่ทำให้เข้าเกณฑ์ LDCT",
        "Age alone never raises the factor band or creates LDCT eligibility."
      ))}</li>
    </ul>
    <p class="tiny mt">${esc(uiText(
      "คำตอบที่ไม่แสดงเป็นปัจจัยไม่ได้แปลว่าปลอดภัย เพียงแต่ไม่เข้าเงื่อนไขกฎต้นแบบปัจจุบัน",
      "An answer not shown as a factor does not mean it is safe; it only did not match a current prototype rule."
    ))}</p>
  </div>

  <details class="card">
    <summary><b>${esc(uiText("เหตุใดผลอาจเปลี่ยนเมื่อประเมินครั้งถัดไป", "Why a future result may change"))}</b></summary>
    <ul class="plain-list muted mt">
      <li>${esc(uiText(
        "คำตอบใหม่หรือการแก้ไขประวัติการสัมผัส สุขภาพ ครอบครัว หรือการสูบบุหรี่อาจทำให้เข้าเงื่อนไขปัจจัยต่างจากเดิม",
        "New or corrected exposure, health, family or smoking information may match different factor rules."
      ))}</li>
      <li>${esc(uiText(
        "อาการใหม่อาจเปลี่ยนเฉพาะคำแนะนำด้านอาการ แต่อาการไม่เคยเพิ่มคะแนนหรือเปลี่ยนระดับปัจจัย",
        "A new symptom may change the separate symptom guidance, but symptoms never add points or change the factor band."
      ))}</li>
      <li>${esc(uiText(
        "กฎรุ่นใหม่จะใช้ได้ต่อเมื่อผ่านกระบวนการทบทวนที่กำหนด ผลที่บันทึกไว้จะแสดงรุ่นกฎและวันที่ของตนเอง",
        "A future rule version may change after the required review process. Saved results retain their own rule version and date."
      ))}</li>
    </ul>
    <p class="tiny">${esc(uiText(
      "ผลที่เปลี่ยนไม่ได้ยืนยันว่าโรคเกิดขึ้น ดีขึ้น หรือแย่ลง เป็นเพียงภาพรวมจากคำตอบและกฎรุ่นที่ใช้ในเวลานั้น",
      "A changed result does not confirm that disease appeared, improved or worsened. It is only a snapshot of the answers and rule version used at that time."
    ))}</p>
  </details>

  <details class="card result-limitations">
    <summary><b>${esc(uiText("สิ่งที่แบบประเมินนี้ยังไม่ได้ประเมิน", "What this assessment does not cover"))}</b></summary>
    <p class="muted mt">${esc(uiText(
      "รายการต่อไปนี้ต้องอาศัยข้อมูลหรือการตรวจเพิ่มเติม แบบประเมินนี้จึงไม่สามารถสรุปแทนบุคลากรทางการแพทย์ได้",
      "The following areas need information or testing that this assessment does not have, so it cannot make a clinical conclusion."
    ))}</p>
    <ul class="plain-list muted">${NOT_ASSESSED.map(item => `<li>${esc(item)}</li>`).join("")}</ul>
    <p class="tiny mt">ปัจจัยเสี่ยงไม่ใช่การวินิจฉัย และผลนี้ไม่สามารถยืนยันหรือตัดโรคใด ๆ ได้</p>
  </details>

  <div class="card">
    <h3>คุณภาพอากาศในพื้นที่ของคุณวันนี้</h3>
    <p class="muted">ข้อมูลนี้ช่วยวางแผนกิจกรรมระยะสั้นเท่านั้น และแยกจากผลปัจจัยสุขภาพและเกณฑ์คัดกรองโดยสิ้นเชิง</p>
    ${state.answers.PROVINCE ? `<div id="result-air-context" class="air-compact" role="status" aria-live="polite">
      ${esc(uiText("กำลังโหลดข้อมูลคุณภาพอากาศล่าสุด…", "Loading current air-quality data…"))}
    </div>` : `<p class="tiny">${esc(uiText(
      "ยังไม่ได้เลือกจังหวัด เปิดหน้าคุณภาพอากาศเพื่อเลือกพื้นที่",
      "No province is selected. Open the air-quality page to choose an area."
    ))}</p>`}
    <a class="btn btn-secondary mt" href="#air">ดูค่าฝุ่นตามจังหวัดและสถานี</a>
  </div>

  <div class="card">
    <h3>ขั้นตอนถัดไปที่แนะนำ</h3>
    <p class="muted">${esc(b.action)}</p>
    ${b === BANDS.review ? `<p class="muted mt" style="font-size:13.5px">บุคลากรทางการแพทย์สามารถช่วยพิจารณาว่าจำเป็นต้องตรวจเพิ่มเติม เช่น การประเมินทางคลินิกหรือการถ่ายภาพรังสีชนิดใด</p>` : ""}
    ${primaryNext}
    <div class="row mt">
      <button class="btn btn-secondary btn-sm" onclick="toast('บันทึกผลไว้ใน “ข้อมูลของฉัน” แล้ว')">💾 บันทึกผล</button>
      <button class="btn btn-secondary btn-sm" onclick="shareCard()">📤 แชร์แบบปลอดภัย</button>
      <a class="btn btn-secondary btn-sm" href="#education">📚 เรียนรู้เพิ่มเติม</a>
      <a class="btn btn-secondary btn-sm" href="#education=questions-for-clinician">💬 เตรียมคำถามสำหรับบุคลากรทางการแพทย์</a>
      ${needsProfessionalNext ? "" : `<a class="btn btn-secondary btn-sm" href="#clinics">ดูข้อมูลการหาบริการสุขภาพ</a>`}
      <button class="btn btn-ghost btn-sm" onclick="retake()">🔄 ทำแบบประเมินใหม่</button>
    </div>
  </div>

  <div class="card">
    <h3>${esc(uiText("คำถามสั้น ๆ สำหรับบุคลากรทางการแพทย์", "Questions to take to a healthcare professional"))}</h3>
    <ul class="plain-list muted">
      <li>${esc(uiText("จากประวัติของฉัน ปัจจัยใดสำคัญที่สุด", "Which parts of my history are most relevant?"))}</li>
      <li>${esc(uiText("อาการของฉันต้องได้รับการตรวจเมื่อใด", "When should my symptoms be assessed?"))}</li>
      <li>${esc(uiText("แนวทางปัจจุบันแนะนำการคัดกรองหรือการตรวจใดสำหรับฉันหรือไม่", "Do current guidelines suggest any screening or tests for me?"))}</li>
      <li>${esc(uiText("ประโยชน์ ผลเสีย และทางเลือกของการตรวจมีอะไรบ้าง", "What are the benefits, harms and alternatives of a test?"))}</li>
      <li>${esc(uiText("ฉันควรติดตามหรือกลับมาพบเมื่อใด", "When should I follow up or return?"))}</li>
    </ul>
    <a class="btn btn-secondary mt" href="#education=questions-for-clinician">${esc(uiText(
      "เปิดรายการเตรียมตัวฉบับเต็ม",
      "Open the full preparation guide"
    ))}</a>
  </div>

  <p class="tiny center">ประเมินเมื่อ ${dt} · ${esc(r.model_version)} · ${esc(r.clinical_validation_status)}<br>
  แบบประเมินความเสี่ยงเบื้องต้น — ไม่ใช่การวินิจฉัย และต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง</p>`);
  if (state.answers.PROVINCE) {
    updateCompactAirContext("result-air-context", state.answers.PROVINCE);
  }
}

function factorDetail(i) {
  track("factor_explanation_opened");
  const f = state.result.factors[i];
  const articleSlug = FACTOR_EDUCATION_MAP[f.code];
  const article = ARTICLES.find(item => item.slug === articleSlug);
  modal(`<h3>${esc(f.name)}</h3>
    <p class="muted"><b>เหตุใดจึงอาจเกี่ยวข้อง:</b> ${esc(f.explain)}</p>
    <p class="muted mt"><b>สิ่งที่ทำต่อได้:</b> ${esc(f.next)}</p>
    ${article ? `<div class="q-note mt"><b>${esc(uiText("อ่านต่อ", "Learn more"))}:</b>
      ${esc(article.title)}<br>
      <span class="tiny">${esc(uiText(
        "บทความมีแหล่งอ้างอิง แต่ยังรอการทบทวนโดยแพทย์",
        "This sourced article is still awaiting medical review."
      ))}</span></div>
      <a class="btn btn-secondary mt" href="#education=${esc(article.slug)}" onclick="closeModal()">${esc(uiText("เปิดบทความที่เกี่ยวข้อง", "Open related article"))}</a>` : ""}
    <a class="btn btn-ghost mt" href="#education=questions-for-clinician" onclick="closeModal()">${esc(uiText(
      "ดูคำถามที่ควรถามบุคลากรทางการแพทย์",
      "Questions to ask a healthcare professional"
    ))}</a>
    <a class="btn btn-ghost mt" href="#clinics" onclick="closeModal()">${esc(uiText(
      "ดูตัวอย่างช่องทางบริการสุขภาพ",
      "View healthcare-navigation demo"
    ))}</a>
    <p class="tiny mt">รหัสกฎ: ${esc(f.code)} (v${f.version}) · สถานะหลักฐาน: ${esc(f.evidence)}<br>กฎต้นแบบ — ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง</p>`);
}

function retake() {
  state.answers = {}; state.stepIndex = 0; state.returnToReview = false;
  state.inProgress = true; state.result = null;
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
    <button class="btn btn-secondary" onclick="shareInvite()">${'แชร์ผ่าน LINE / คัดลอกข้อความ'}</button>
    <button class="btn btn-ghost mt" onclick="confirmDetailShare()">🔗 ส่งผลโดยละเอียดให้บุคลากรทางการแพทย์</button>`);
}
function shareInvite() {
  const url = location.origin + location.pathname;
  liffShare(buildShareInvite(state.lang, url));
}
function confirmDetailShare() {
  modal(`<h3>ยืนยันการสร้างลิงก์ผลโดยละเอียด</h3>
    <p class="muted">ลิงก์นี้จะมีข้อมูลปัจจัยเสี่ยงของคุณ ใช้ได้ชั่วคราว (24 ชม.) และควรส่งให้บุคลากรทางการแพทย์เท่านั้น</p>
    <button class="btn btn-primary mt" onclick="closeModal(); protoPopup('ลิงก์ปลอดภัย + QR สำหรับแพทย์','เวอร์ชันจริงจะสร้างลิงก์ชั่วคราวพร้อมรหัส และบันทึกการเข้าถึงใน audit log')">ยืนยัน สร้างลิงก์</button>`);
}

/* =====================================================================
   SCREEN: live air quality
   ===================================================================== */
let selectedAirProvince = state.answers.PROVINCE || "กรุงเทพมหานคร";
let selectedAirStation = "";
let latestAirData = null;
let airRequestId = 0;
let airForecastRequestId = 0;
let airHistoryRequestId = 0;
let airUserLocation = null; // session memory only; never saved to lunglens-v1
let airLocationStatus = "idle";

function formatAirNumber(value) {
  if (!Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(state.lang === "en" ? "en-GB" : "th-TH", {
    maximumFractionDigits: 1
  }).format(Number(value));
}

function airStationName(station) {
  return state.lang === "en"
    ? (station.name_en || station.name_th)
    : (station.name_th || station.name_en);
}

function airStationArea(station) {
  return state.lang === "en"
    ? (station.area_en || station.area_th)
    : (station.area_th || station.area_en);
}

function airStationsInDisplayOrder(data) {
  return data?.kind === "official" && airUserLocation
    ? sortStationsByDistance(data.stations, airUserLocation)
    : (data?.stations || []);
}

function formatStationDistance(station) {
  const distance = airUserLocation ? stationDistanceKm(station, airUserLocation) : null;
  return Number.isFinite(distance) ? formatAirNumber(distance) : null;
}

function requestAirLocation() {
  modal(`<h3>📍 ${esc(uiText("ค้นหาสถานีใกล้ตำแหน่งของฉัน", "Find the nearest station"))}</h3>
    <p class="muted">${esc(uiText(
      "เบราว์เซอร์จะถามสิทธิ์ตำแหน่งหลังจากคุณกดดำเนินการต่อ พิกัดใช้เฉพาะในหน่วยความจำของหน้านี้เพื่อเรียงสถานีตามระยะเส้นตรง ไม่บันทึก ไม่ส่งไปยัง LungLens และไม่กระทบผลแบบประเมิน",
      "Your browser will request location permission after you continue. Coordinates are used only in this page's memory to sort stations by straight-line distance. They are not saved, sent to LungLens, or used in the assessment result."
    ))}</p>
    <p class="tiny">${esc(uiText(
      "คุณปฏิเสธสิทธิ์ได้และยังเลือกสถานีเองได้ตามปกติ",
      "You can deny permission and continue choosing stations manually."
    ))}</p>
    <button class="btn btn-primary mt" onclick="useAirLocation()">${esc(uiText("ดำเนินการต่อ", "Continue"))}</button>`);
}

function useAirLocation() {
  closeModal();
  if (!navigator.geolocation) {
    airLocationStatus = "unavailable";
    refreshAirLocationControls();
    if (latestAirData) renderAirResults(latestAirData);
    toast(uiText("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง", "Location is not available on this device"));
    return;
  }
  airLocationStatus = "requesting";
  refreshAirLocationControls();
  if (latestAirData) renderAirResults(latestAirData);
  navigator.geolocation.getCurrentPosition(position => {
    const latitude = Number(position?.coords?.latitude);
    const longitude = Number(position?.coords?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      airLocationStatus = "unavailable";
      if (latestAirData) renderAirResults(latestAirData);
      toast(uiText("ไม่สามารถอ่านตำแหน่งได้", "The location could not be read"));
      return;
    }
    airUserLocation = {
      latitude,
      longitude,
      accuracy: Number.isFinite(Number(position.coords.accuracy)) ? Number(position.coords.accuracy) : null
    };
    airLocationStatus = "ready";
    refreshAirLocationControls();
    if (latestAirData) {
      const nearest = airStationsInDisplayOrder(latestAirData).find(station => Number.isFinite(station.pm25));
      if (nearest) selectedAirStation = nearest.station_id;
      renderAirResults(latestAirData);
    }
    toast(uiText("เรียงสถานีใกล้ตำแหน่งแล้ว", "Stations are sorted by distance"));
  }, error => {
    airUserLocation = null;
    airLocationStatus = error?.code === 1 ? "denied" : error?.code === 3 ? "timeout" : "unavailable";
    refreshAirLocationControls();
    if (latestAirData) renderAirResults(latestAirData);
    const message = airLocationStatus === "denied"
      ? uiText("ไม่ได้รับสิทธิ์ตำแหน่ง คุณยังเลือกสถานีเองได้", "Location permission was denied. You can still choose a station manually.")
      : airLocationStatus === "timeout"
        ? uiText("การขอตำแหน่งใช้เวลานานเกินไป โปรดลองใหม่", "The location request timed out. Try again.")
        : uiText("ยังค้นหาตำแหน่งไม่ได้ โปรดเลือกสถานีเอง", "Your location is unavailable. Choose a station manually.");
    toast(message);
  }, {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 5 * 60 * 1000
  });
}

function clearAirLocation() {
  airUserLocation = null;
  airLocationStatus = "idle";
  refreshAirLocationControls();
  if (latestAirData) renderAirResults(latestAirData);
  toast(uiText("ล้างตำแหน่งจากหน่วยความจำแล้ว", "Location cleared from page memory"));
}

function airLocationControlsMarkup() {
  return `<div class="air-location-control">
      <button class="btn btn-secondary btn-sm" onclick="requestAirLocation()" ${airLocationStatus === "requesting" ? "disabled" : ""}>
        📍 ${esc(airLocationStatus === "requesting"
          ? uiText("กำลังขอตำแหน่ง…", "Requesting location…")
          : airUserLocation
            ? uiText("เรียงสถานีใหม่", "Sort stations again")
            : uiText("ค้นหาสถานีใกล้ฉัน", "Find nearest station"))}
      </button>
      ${airUserLocation ? `<button class="btn btn-ghost btn-sm" onclick="clearAirLocation()">${esc(uiText("ล้างตำแหน่ง", "Clear location"))}</button>` : ""}
    </div>
    <p class="tiny mt">${esc(airUserLocation
      ? uiText("สถานีในจังหวัดที่เลือกเรียงตามระยะเส้นตรงจากตำแหน่งของคุณ พิกัดอยู่ในหน่วยความจำของหน้านี้เท่านั้น",
        "Stations in the selected province are sorted by straight-line distance. Coordinates remain only in this page's memory.")
      : airLocationStatus === "denied"
        ? uiText("ไม่ได้รับสิทธิ์ตำแหน่ง คุณยังเลือกสถานีเองได้", "Location permission was denied. You can still choose a station manually.")
        : airLocationStatus === "timeout"
          ? uiText("การขอตำแหน่งใช้เวลานานเกินไป คุณสามารถลองใหม่หรือเลือกสถานีเอง",
            "The location request timed out. Try again or choose a station manually.")
          : airLocationStatus === "unavailable"
            ? uiText("ยังค้นหาตำแหน่งไม่ได้ คุณยังเลือกสถานีเองได้", "Location is unavailable. You can still choose a station manually.")
            : uiText("ไม่บังคับ ตำแหน่งไม่ถูกบันทึกและไม่กระทบผลแบบประเมิน",
              "Optional. Location is not saved and never affects the assessment result."))}</p>`;
}

function refreshAirLocationControls() {
  const target = $("#air-location-section");
  if (target) target.innerHTML = airLocationControlsMarkup();
}

function forecastTrendText(trend) {
  const copy = {
    higher: uiText(
      "แบบจำลองแสดงว่าค่า PM2.5 ช่วงท้ายของ 24 ชั่วโมงข้างหน้าอาจสูงกว่าช่วงต้น",
      "The model shows PM2.5 may be higher toward the end of the next 24 hours."
    ),
    lower: uiText(
      "แบบจำลองแสดงว่าค่า PM2.5 ช่วงท้ายของ 24 ชั่วโมงข้างหน้าอาจต่ำกว่าช่วงต้น",
      "The model shows PM2.5 may be lower toward the end of the next 24 hours."
    ),
    variable: uiText(
      "แบบจำลองแสดงว่าค่า PM2.5 อาจเปลี่ยนแปลงขึ้นลงใน 24 ชั่วโมงข้างหน้า",
      "The model shows PM2.5 may vary during the next 24 hours."
    ),
    similar: uiText(
      "แบบจำลองยังไม่แสดงการเปลี่ยนแปลงเด่นชัดระหว่างช่วงต้นและท้ายของ 24 ชั่วโมงข้างหน้า",
      "The model does not show a clear change between the start and end of the next 24 hours."
    ),
    unknown: uiText(
      "ข้อมูลแบบจำลองยังไม่เพียงพอสำหรับอธิบายแนวโน้ม",
      "The model does not contain enough data to describe a pattern."
    )
  };
  return copy[trend?.key] || copy.unknown;
}

function forecastTimeLabel(value) {
  return new Intl.DateTimeFormat(state.lang === "en" ? "en-GB" : "th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function renderPm25Chart(points, { mode = "forecast" } = {}) {
  const width = 600, height = 190, left = 44, right = 16, top = 18, bottom = 38;
  const values = points.map(point => point.pm25).filter(Number.isFinite);
  if (values.length < 2) return "";
  const minValue = Math.max(0, Math.floor(Math.min(...values) / 5) * 5);
  let maxValue = Math.ceil(Math.max(...values) / 5) * 5;
  if (maxValue <= minValue) maxValue = minValue + 5;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const x = index => left + (index / Math.max(1, points.length - 1)) * plotWidth;
  const y = value => top + (1 - (value - minValue) / (maxValue - minValue)) * plotHeight;
  const pointTime = point => point.at || point.observed_at;
  const path = points.map((point, index) =>
    `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.pm25).toFixed(1)}`
  ).join(" ");
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 3),
    Math.floor((points.length - 1) * 2 / 3), points.length - 1])];
  const ariaLabel = mode === "history"
    ? uiText(
      `กราฟประวัติค่า PM2.5 ที่สถานี Air4Thai ตรวจวัด ค่าต่ำสุด ${formatAirNumber(Math.min(...values))} และสูงสุด ${formatAirNumber(Math.max(...values))} ไมโครกรัมต่อลูกบาศก์เมตร`,
      `Official Air4Thai station PM2.5 history chart, minimum ${formatAirNumber(Math.min(...values))} and maximum ${formatAirNumber(Math.max(...values))} micrograms per cubic metre`
    )
    : uiText(
      `กราฟแบบจำลอง PM2.5 24 ชั่วโมง ค่าต่ำสุด ${formatAirNumber(Math.min(...values))} และสูงสุด ${formatAirNumber(Math.max(...values))} ไมโครกรัมต่อลูกบาศก์เมตร`,
      `24-hour model PM2.5 chart, minimum ${formatAirNumber(Math.min(...values))} and maximum ${formatAirNumber(Math.max(...values))} micrograms per cubic metre`
    );
  return `<svg class="air-forecast-chart ${mode === "history" ? "air-history-chart" : ""}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(ariaLabel)}">
    <line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}" class="chart-axis"></line>
    <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" class="chart-axis"></line>
    <line x1="${left}" y1="${top}" x2="${width - right}" y2="${top}" class="chart-grid"></line>
    <text x="${left - 8}" y="${top + 5}" text-anchor="end">${formatAirNumber(maxValue)}</text>
    <text x="${left - 8}" y="${height - bottom + 5}" text-anchor="end">${formatAirNumber(minValue)}</text>
    <path d="${path}" class="chart-line ${mode === "history" ? "chart-line-history" : ""}"></path>
    ${points.map((point, index) => index % 3 === 0 || index === points.length - 1
      ? `<circle cx="${x(index).toFixed(1)}" cy="${y(point.pm25).toFixed(1)}" r="3" class="chart-point ${mode === "history" ? "chart-point-history" : ""}">
          <title>${esc(forecastTimeLabel(pointTime(point)))}: PM2.5 ${formatAirNumber(point.pm25)} µg/m³</title>
        </circle>` : "").join("")}
    ${labelIndexes.map(index => `<text x="${x(index).toFixed(1)}" y="${height - 12}" text-anchor="${index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}">${esc(forecastTimeLabel(pointTime(points[index])))}</text>`).join("")}
  </svg>`;
}

function renderForecastChart(points) {
  return renderPm25Chart(points, { mode: "forecast" });
}

async function updateAirForecast(targetId, province, station = null, { compact = false } = {}) {
  const target = $(`#${targetId}`);
  if (!target) return;
  const requestToken = String(++airForecastRequestId);
  target.dataset.requestToken = requestToken;
  try {
    const forecast = await loadAirQualityForecast(province, {
      latitude: station?.latitude,
      longitude: station?.longitude
    });
    if (!target.isConnected || target.dataset.requestToken !== requestToken) return;
    const values = forecast.points.map(point => point.pm25);
    const min = Math.min(...values), max = Math.max(...values);
    target.innerHTML = `
      <p class="muted"><b>${esc(forecastTrendText(forecast.trend))}</b></p>
      ${renderForecastChart(forecast.points)}
      <div class="air-forecast-stats">
        <span>${esc(uiText("ต่ำสุด", "Minimum"))}: <b>${formatAirNumber(min)}</b> µg/m³</span>
        <span>${esc(uiText("สูงสุด", "Maximum"))}: <b>${formatAirNumber(max)}</b> µg/m³</span>
      </div>
      <p class="tiny mt">${esc(uiText(
        `กริดแบบจำลอง CAMS Global ประมาณ 45 กม. · ดึงเมื่อ ${formatDate(forecast.fetchedAt, { dateTime: true })}`,
        `CAMS Global model grid, approximately 45 km · retrieved ${formatDate(forecast.fetchedAt, { dateTime: true })}`
      ))}</p>
      <p class="tiny mt">${esc(uiText(
        "นี่คือแบบจำลอง CAMS Global ไม่ใช่ประวัติการวัดจากสถานี และการคาดการณ์อาจเปลี่ยนเมื่อแบบจำลองอัปเดต โปรดตรวจค่าจริงจากสถานีใกล้ตัวก่อนวางแผนกิจกรรม",
        "This is a CAMS Global model forecast, not station measurement history. It may change when the model updates. Check a nearby official station before planning activities."
      ))}</p>
      ${compact ? "" : `<p class="tiny mt"><a href="${esc(forecast.sourceUrl)}" target="_blank" rel="noopener">${esc(uiText(
        "ที่มา: Open-Meteo / CAMS Global",
        "Source: Open-Meteo / CAMS Global"
      ))}</a></p>`}`;
  } catch (error) {
    if (!target.isConnected || target.dataset.requestToken !== requestToken) return;
    target.innerHTML = `<p class="muted">${esc(uiText(
      "ยังโหลดแบบจำลอง 24 ชั่วโมงไม่ได้ ค่าจากสถานีด้านบนยังใช้งานได้ตามปกติ",
      "The 24-hour model forecast is unavailable. The station reading above is still available."
    ))}</p>
      <button class="btn btn-ghost btn-sm mt" onclick="updateAirForecast('${esc(targetId)}','${esc(province.th || province)}')">${esc(uiText("ลองอีกครั้ง", "Try again"))}</button>`;
  }
}

async function updateAirHistory(targetId, station) {
  const target = $(`#${targetId}`);
  if (!target || !station?.station_id) return;
  const requestToken = String(++airHistoryRequestId);
  target.dataset.requestToken = requestToken;
  try {
    const history = await loadAirHistoryForStation(station.station_id);
    if (!target.isConnected || target.dataset.requestToken !== requestToken) return;
    const points = history?.station?.points || [];
    if (points.length < 2) {
      target.innerHTML = `<p class="muted">${esc(uiText(
        "ระบบเริ่มเก็บประวัติอย่างเป็นทางการของสถานีนี้แล้ว เมื่อ Air4Thai เผยแพร่ค่ารายชั่วโมงเพิ่ม กราฟจะปรากฏที่นี่ ค่าปัจจุบันด้านบนยังใช้งานได้ตามปกติ",
        "Official history collection has started for this station. The chart will appear after Air4Thai publishes more hourly observations. The current reading above remains available."
      ))}</p>
      <p class="tiny mt">${esc(uiText(
        "ระบบจะเก็บเฉพาะข้อมูลสถานีล่าสุดไม่เกิน 48 ชั่วโมง ไม่ใช่ประวัติการสัมผัสส่วนบุคคล",
        "Only the station's most recent 48 hours are retained. This is not a record of your personal exposure."
      ))}</p>`;
      return;
    }
    const values = points.map(point => point.pm25);
    const earliest = points[0].observed_at;
    const latest = points.at(-1).observed_at;
    target.innerHTML = `
      ${history.stale ? `<div class="air-history-stale"><b>${esc(uiText("ประวัติสถานีอาจอัปเดตล่าช้า", "Station history may be delayed"))}</b></div>` : ""}
      ${renderPm25Chart(points, { mode: "history" })}
      <div class="air-forecast-stats">
        <span>${esc(uiText("ต่ำสุด", "Minimum"))}: <b>${formatAirNumber(Math.min(...values))}</b> µg/m³</span>
        <span>${esc(uiText("สูงสุด", "Maximum"))}: <b>${formatAirNumber(Math.max(...values))}</b> µg/m³</span>
        <span>${esc(uiText("จำนวนค่าที่วัด", "Observations"))}: <b>${points.length}</b></span>
      </div>
      <p class="tiny mt">${esc(uiText("ช่วงเวลาที่สถานีรายงาน", "Station observation period"))}:
        ${esc(formatDate(earliest, { dateTime: true }))} – ${esc(formatDate(latest, { dateTime: true }))}</p>
      <p class="tiny mt">${esc(uiText(
        `รวบรวมล่าสุด ${formatDate(history.generated_at, { dateTime: true })} · เก็บย้อนหลังไม่เกิน ${history.retention_hours || 48} ชั่วโมง`,
        `History last assembled ${formatDate(history.generated_at, { dateTime: true })} · retains up to ${history.retention_hours || 48} hours`
      ))}</p>
      <p class="tiny mt">${esc(uiText(
        "นี่คือค่าที่สถานี Air4Thai ตรวจวัด ไม่ใช่แบบจำลอง ไม่ใช่ประวัติการสัมผัสส่วนบุคคล และไม่ใช้คำนวณผลปัจจัยสุขภาพหรือเกณฑ์คัดกรอง",
        "These are Air4Thai station measurements, not model values or personal exposure history. They never change the health-factor result or screening criteria."
      ))}</p>
      <p class="tiny mt"><a href="${esc(history.source_url || "https://air4thai.pcd.go.th/")}" target="_blank" rel="noopener">${esc(uiText(
        "ที่มา: Air4Thai — กรมควบคุมมลพิษ",
        "Source: Air4Thai — Thailand Pollution Control Department"
      ))}</a></p>`;
  } catch (error) {
    if (!target.isConnected || target.dataset.requestToken !== requestToken) return;
    target.innerHTML = `<p class="muted">${esc(uiText(
      "ยังโหลดประวัติสถานีไม่ได้ ค่าปัจจุบันและแบบจำลอง 24 ชั่วโมงยังใช้งานได้ตามปกติ",
      "Station history is unavailable. The current reading and 24-hour model forecast remain available."
    ))}</p>
      <button class="btn btn-ghost btn-sm mt" onclick="retryAirHistory('${esc(targetId)}','${esc(station.station_id)}')">${esc(uiText("ลองอีกครั้ง", "Try again"))}</button>`;
  }
}

function retryAirHistory(targetId, stationId) {
  const station = latestAirData?.stations?.find(item => item.station_id === stationId);
  if (station) updateAirHistory(targetId, station);
}

function renderAirQuality() {
  selectedAirProvince = PROVINCES.includes(selectedAirProvince)
    ? selectedAirProvince
    : (state.answers.PROVINCE || "กรุงเทพมหานคร");
  view(`<div class="card">
    <h2>🌫️ ${esc(uiText("คุณภาพอากาศตามจังหวัด", "Air quality by province"))}</h2>
    <p class="muted">${esc(uiText(
      "เลือกจังหวัดเพื่อดูค่า PM2.5 จากสถานีตรวจวัดของกรมควบคุมมลพิษ หากพื้นที่ไม่มีสถานี ระบบจะแสดงค่าประมาณจากแบบจำลองและติดป้ายกำกับให้ชัดเจน",
      "Choose a province to see PM2.5 readings from Pollution Control Department monitoring stations. Where no station is available, a clearly labelled model estimate is shown."
    ))}</p>
    <div class="field mt"><label for="air-province">${esc(uiText("จังหวัด", "Province"))}</label>
      <select id="air-province" onchange="changeAirProvince(this.value)">
        ${PROVINCES.map(province => `<option value="${esc(province)}" ${selectedAirProvince === province ? "selected" : ""}>${esc(provinceDisplay(province))}</option>`).join("")}
      </select>
    </div>
    <div id="air-location-section">${airLocationControlsMarkup()}</div>
  </div>
  <div id="air-results" aria-live="polite">
    <div class="card center"><p class="muted">${esc(uiText("กำลังโหลดข้อมูลคุณภาพอากาศล่าสุด…", "Loading current air-quality data…"))}</p></div>
  </div>
  <div class="disclaimer">
    ${esc(uiText(
      "ค่าฝุ่นปัจจุบันช่วยวางแผนกิจกรรมระยะสั้น แต่ไม่สามารถบอกการสัมผัสสะสมตลอดชีวิต ไม่ใช่คะแนนความเสี่ยงมะเร็ง และไม่ทำให้เข้าเกณฑ์ตรวจ LDCT",
      "Current pollution data can guide short-term activities. It cannot estimate lifetime exposure, is not a cancer-risk score, and never creates LDCT eligibility."
    ))}
  </div>`);
  loadAirPage(selectedAirProvince);
}

function changeAirProvince(province) {
  if (!PROVINCES.includes(province)) return;
  selectedAirProvince = province;
  selectedAirStation = "";
  latestAirData = null;
  renderAirQuality();
}

function changeAirStation(stationId) {
  selectedAirStation = stationId;
  if (latestAirData) renderAirResults(latestAirData);
}

async function loadAirPage(province) {
  const requestId = ++airRequestId;
  try {
    const data = await loadAirQualityForProvince(province);
    if (requestId !== airRequestId || !$("#air-results")) return;
    latestAirData = data;
    if (!data.stations.some(station => station.station_id === selectedAirStation)) {
      const orderedStations = airStationsInDisplayOrder(data);
      selectedAirStation = orderedStations.find(station => Number.isFinite(station.pm25))?.station_id || orderedStations[0]?.station_id || "";
    }
    renderAirResults(data);
  } catch (error) {
    if (requestId !== airRequestId || !$("#air-results")) return;
    $("#air-results").innerHTML = `<div class="card">
      <h3>${esc(uiText("ยังโหลดข้อมูลคุณภาพอากาศไม่ได้", "Air-quality data is unavailable"))}</h3>
      <p class="muted">${esc(uiText(
        "โปรดลองอีกครั้งในภายหลัง หรือตรวจสอบข้อมูลโดยตรงจาก Air4Thai ข้อมูลล้มเหลวจะไม่เปลี่ยนผลแบบประเมินของคุณ",
        "Try again later or check Air4Thai directly. A data failure never changes your assessment result."
      ))}</p>
      <a class="btn btn-secondary mt" href="https://air4thai.pcd.go.th/" target="_blank" rel="noopener">${esc(uiText("เปิด Air4Thai", "Open Air4Thai"))}</a>
      <button class="btn btn-ghost mt" onclick="loadAirPage(selectedAirProvince)">${esc(uiText("ลองอีกครั้ง", "Try again"))}</button>
    </div>`;
  }
}

function renderAirResults(data) {
  const target = $("#air-results");
  if (!target) return;
  const displayStations = airStationsInDisplayOrder(data);
  const station = displayStations.find(item => item.station_id === selectedAirStation) || displayStations[0];
  const selectedDistance = data.kind === "official" ? formatStationDistance(station) : null;
  const band = station ? stationBand(station, data.kind, state.lang) : null;
  const summary = data.summary;
  const isOfficial = data.kind === "official";
  const sourceName = isOfficial
    ? uiText("Air4Thai — กรมควบคุมมลพิษ", "Air4Thai — Thailand Pollution Control Department")
    : uiText("Open-Meteo / แบบจำลอง CAMS Global", "Open-Meteo / CAMS Global model");
  const sourceUrl = isOfficial
    ? "https://air4thai.pcd.go.th/"
    : "https://open-meteo.com/en/docs/air-quality-api";
  const stationObserved = station?.observed_at ? formatDate(station.observed_at, { dateTime: true }) : "—";
  const snapshotFetched = data.fetchedAt ? formatDate(data.fetchedAt, { dateTime: true }) : "—";

  target.innerHTML = `
    ${data.stale ? `<div class="card air-stale"><b>${esc(uiText("ข้อมูลอาจล่าช้ากว่าปกติ", "Data may be older than usual"))}</b>
      <p class="tiny">${esc(uiText("โปรดตรวจสอบ Air4Thai ก่อนตัดสินใจทำกิจกรรมกลางแจ้ง", "Check Air4Thai before making outdoor-activity decisions."))}</p></div>` : ""}
    <div class="card">
      <span class="section-tag">${esc(provinceDisplay(data.province.th))}</span>
      <h3>${esc(uiText("ภาพรวมสถานีในจังหวัด", "Province station overview"))}</h3>
      ${isOfficial ? `<div class="air-summary">
        <div><b>${formatAirNumber(summary.medianPm25)}</b><span>PM2.5 ${esc(uiText("ค่ากลาง", "median"))}</span></div>
        <div><b>${summary.reportingCount}</b><span>${esc(uiText("สถานีที่มีข้อมูล", "reporting stations"))}</span></div>
        <div><b>${formatAirNumber(summary.minPm25)}–${formatAirNumber(summary.maxPm25)}</b><span>µg/m³ ${esc(uiText("ช่วงค่า", "range"))}</span></div>
      </div>
      <p class="tiny mt">${esc(uiText(
        "ค่ากลางเป็นภาพรวมของสถานีที่รายงานในจังหวัด ไม่ใช่ค่าที่บ้านของคุณ สภาพอากาศอาจแตกต่างกันมากในแต่ละจุด",
        "The median summarises reporting stations in the province; it is not a reading at your home. Conditions can vary substantially by location."
      ))}</p>` : `<p class="muted">${esc(uiText(
        "จังหวัดนี้ไม่มีสถานี Air4Thai ที่มีค่า PM2.5 ในชุดข้อมูลล่าสุด จึงแสดงค่าประมาณจากแบบจำลองบรรยากาศ",
        "No Air4Thai station in this province reported PM2.5 in the latest snapshot, so an atmospheric-model estimate is shown."
      ))}</p>`}
    </div>

    <div class="card">
      <div class="field"><label for="air-station">${esc(uiText(isOfficial ? "สถานีตรวจวัด" : "ตำแหน่งแบบจำลอง", isOfficial ? "Monitoring station" : "Model location"))}</label>
        <select id="air-station" onchange="changeAirStation(this.value)">
          ${displayStations.map(item => {
            const distance = isOfficial ? formatStationDistance(item) : null;
            return `<option value="${esc(item.station_id)}" ${item.station_id === station?.station_id ? "selected" : ""}>${esc(airStationName(item))}${distance ? ` — ${distance} km` : ""}</option>`;
          }).join("")}
        </select>
      </div>
      ${station ? `<h3>${esc(airStationName(station))}</h3>
        <p class="muted">${esc(airStationArea(station))}</p>
        ${selectedDistance ? `<p class="tiny">${esc(uiText(
          `ระยะเส้นตรงโดยประมาณ ${selectedDistance} กม. จากตำแหน่งที่อนุญาต ไม่ใช่ระยะทางเดินทาง`,
          `Approximately ${selectedDistance} km straight-line from the permitted location; this is not travel distance.`
        ))}</p>` : ""}
        <div class="air-reading">
          <div><span>PM2.5</span><b>${formatAirNumber(station.pm25)}</b><small>µg/m³</small></div>
          <div><span>PM10</span><b>${formatAirNumber(station.pm10)}</b><small>µg/m³</small></div>
          <div><span>AQI</span><b>${formatAirNumber(station.aqi)}</b><small>${esc(isOfficial ? uiText("เกณฑ์ไทย", "Thai scale") : uiText("เกณฑ์สหรัฐฯ", "U.S. scale"))}</small></div>
        </div>
        ${band ? `<div class="air-guidance air-${esc(band.key)}">
          <b>${esc(band.label)}</b><p>${esc(band.guidance)}</p>
        </div>` : `<p class="muted mt">${esc(uiText("สถานีนี้ยังไม่มีค่าที่ใช้แปลผล", "This station does not currently have enough data for guidance."))}</p>`}
        <p class="tiny mt">${esc(uiText("เวลาที่สถานีรายงาน", "Station observation"))}: ${esc(stationObserved)}</p>` : ""}
    </div>

    <div class="card">
      <h3>${esc(uiText("ประวัติค่าที่สถานีตรวจวัดล่าสุด", "Recent official station history"))}
        <span class="station-badge">${esc(uiText("ค่าตรวจวัด Air4Thai", "Air4Thai measurements"))}</span></h3>
      ${isOfficial && station ? `<div id="air-history" aria-live="polite">
        <p class="muted">${esc(uiText("กำลังโหลดประวัติค่าตรวจวัดของสถานี…", "Loading station measurement history…"))}</p>
      </div>` : `<p class="muted">${esc(uiText(
        "จังหวัดนี้ไม่มีค่าตรวจวัด PM2.5 จากสถานี Air4Thai ในชุดข้อมูลล่าสุด จึงยังแสดงประวัติสถานีไม่ได้ แบบจำลอง 24 ชั่วโมงด้านล่างมีป้ายกำกับแยกต่างหาก",
        "No Air4Thai station in this province reported PM2.5 in the latest snapshot, so official station history is unavailable. The separately labelled 24-hour model forecast is shown below."
      ))}</p>`}
    </div>

    <div class="card">
      <h3>${esc(uiText("แนวโน้ม 24 ชั่วโมงข้างหน้า", "Next 24 hours"))}
        <span class="model-badge">${esc(uiText("แบบจำลอง", "model forecast"))}</span></h3>
      <div id="air-forecast" aria-live="polite">
        <p class="muted">${esc(uiText("กำลังโหลดแบบจำลอง 24 ชั่วโมง…", "Loading the 24-hour model forecast…"))}</p>
      </div>
    </div>

    <div class="card">
      <h3>${esc(uiText("ที่มาและข้อจำกัด", "Sources and limitations"))}</h3>
      <p class="tiny"><a href="${sourceUrl}" target="_blank" rel="noopener">${esc(sourceName)}</a> ·
        ${esc(uiText("ดึงข้อมูลเมื่อ", "Snapshot fetched"))} ${esc(snapshotFetched)}</p>
      <p class="tiny mt">${esc(uiText(
        "คำแนะนำระดับ PM2.5 อ้างอิงเกณฑ์คุณภาพอากาศของประเทศไทยและคำแนะนำกรมอนามัย ข้อมูล Air4Thai เป็นข้อมูลสถานี ส่วนข้อมูลสำรองเป็นค่าประมาณจากแบบจำลอง CAMS Global",
        "PM2.5 guidance follows Thailand's air-quality categories and Department of Health advice. Air4Thai values are station data; the fallback is a CAMS Global model estimate."
      ))}</p>
      <p class="tiny mt">
        <a href="https://hpc10app.anamai.moph.go.th/hdc/airpollution/pm25/index" target="_blank" rel="noopener">${esc(uiText("เกณฑ์และคำแนะนำ PM2.5 ของกรมอนามัย", "Thai Department of Health PM2.5 categories and advice"))}</a>
      </p>
    </div>`;
  if (isOfficial && station) updateAirHistory("air-history", station);
  updateAirForecast("air-forecast", data.province, station);
}

async function updateCompactAirContext(targetId, province, guard = () => true) {
  const target = $(`#${targetId}`);
  if (!target) return;
  try {
    const data = await loadAirQualityForProvince(province);
    if (!target.isConnected || !guard()) return;
    const summary = data.summary;
    const value = data.kind === "official" ? summary.medianPm25 : data.stations[0]?.pm25;
    const station = data.stations[0];
    const band = data.kind === "official"
      ? thaiPm25Band(value, state.lang)
      : stationBand(station, data.kind, state.lang);
    const sourceDescription = data.kind === "official"
      ? uiText(`ค่ากลางจาก ${summary.reportingCount} สถานี Air4Thai`, `median across ${summary.reportingCount} Air4Thai stations`)
      : uiText("ค่าประมาณจากแบบจำลอง Open-Meteo/CAMS", "Open-Meteo/CAMS model estimate");
    target.innerHTML = `<b>${esc(uiText("ข้อมูลอากาศวันนี้", "Today's air-quality context"))} — ${esc(provinceDisplay(province))}</b><br>
      PM2.5 ${formatAirNumber(value)} µg/m³${band ? ` · ${esc(band.label)}` : ""}<br>
      <span class="tiny">${esc(sourceDescription)}${data.stale ? ` · ${esc(uiText("ข้อมูลอาจล่าช้า", "data may be delayed"))}` : ""}</span><br>
      <a href="#air">${esc(uiText("ดูรายสถานีและคำแนะนำ", "View stations and guidance"))}</a>`;
  } catch (error) {
    if (!target.isConnected) return;
    target.innerHTML = `${esc(uiText("ยังโหลดข้อมูลอากาศไม่ได้", "Air-quality data is currently unavailable"))} ·
      <a href="#air">${esc(uiText("ลองอีกครั้ง", "Try again"))}</a>`;
  }
}

function updateAssessmentAirContext(province) {
  return updateCompactAirContext(
    "assessment-air-context",
    province,
    () => state.answers.PROVINCE === province
  );
}

/* =====================================================================
   SCREEN: education
   ===================================================================== */
function renderEducation(slug) {
  if (slug) return renderArticle(slug);
  view(`<div class="card">
    <h2>📚 ความรู้เรื่องปอด</h2>
    <p class="tiny">${esc(uiText(
      "บทความทั้ง 12 หัวข้อมีแหล่งอ้างอิงจากหน่วยงานสาธารณสุข แต่ยังต้องผ่านการทบทวนโดยแพทย์ก่อนใช้เป็นเนื้อหาทางคลินิก",
      "All 12 topics cite public-health authorities, but medical review is still required before they can be treated as clinical content."
    ))}</p>
    <a class="btn btn-secondary mt" href="#air">🌫️ ดูข้อมูล PM2.5 ล่าสุดในจังหวัดของคุณ</a>
    <div class="field mt">
      <label for="education-search">${esc(uiText("ค้นหาหัวข้อ", "Search topics"))}</label>
      <input id="education-search" type="text" autocomplete="off"
        placeholder="${esc(uiText("เช่น ฝุ่น ควัน การคัดกรอง", "For example: pollution, smoke, screening"))}"
        oninput="filterEducation(this.value)">
    </div>
    <p id="education-count" class="tiny">${ARTICLES.length} ${esc(uiText("บทความ", "articles"))}</p>
  </div>
  ${ARTICLES.map(a => `
  <a class="card edu-article-card" href="#education=${esc(a.slug)}"
    data-search="${esc(`${a.category} ${a.title} ${a.summary} ${tr(a.category, "en")} ${tr(a.title, "en")} ${tr(a.summary, "en")}`.toLocaleLowerCase())}">
    <span class="section-tag">${esc(a.category)}</span>
    <h3 style="margin-top:2px">${esc(a.title)}</h3>
    <p class="muted" style="font-size:13.5px">${esc(a.summary)}</p>
    <p class="tiny mt">อ่าน ${a.minutes} นาที · ${esc(a.evidence)} · ${esc(a.reviewed)}</p>
  </a>`).join("")}
  <div class="card">
    <h3>หัวข้อทั้งหมด</h3>
    <div class="edu-grid">${EDU_CATEGORIES.map(c => {
      const has = ARTICLES.find(a => a.category === c);
      return `<button class="edu-cat" onclick="location.hash='#education=${has.slug}'">${esc(c)}</button>`;
    }).join("")}</div>
  </div>`);
}

function filterEducation(query) {
  const normalized = String(query || "").trim().toLocaleLowerCase();
  const cards = [...document.querySelectorAll(".edu-article-card")];
  let visible = 0;
  cards.forEach(card => {
    const match = !normalized || (card.dataset.search || "").includes(normalized);
    card.hidden = !match;
    if (match) visible++;
  });
  const count = $("#education-count");
  if (count) count.textContent = `${visible} ${uiText("บทความ", "articles")}`;
}

function renderArticle(slug) {
  const a = ARTICLES.find(x => x.slug === slug);
  if (!a) { location.hash = "#education"; return; }
  track("education_article_viewed");
  view(`<div class="card">
    <span class="section-tag">${esc(a.category)}</span>
    <h2>${esc(a.title)}</h2>
    <p class="tiny">อ่าน ${a.minutes} นาที · สถานะหลักฐาน: ${esc(a.evidence)} · ${esc(a.reviewed)}<br>
      ${esc(uiText("เวอร์ชันเนื้อหา", "Content version"))}: ${esc(a.version)} ·
      ${esc(uiText("อัปเดต", "Updated"))}: ${esc(formatDate(a.updated))}</p>
    ${a.slug === "pm25" ? `<div id="article-air-context" class="air-compact mt" role="status" aria-live="polite">
      ${esc(uiText("กำลังโหลดข้อมูลคุณภาพอากาศล่าสุด…", "Loading current air-quality data…"))}
    </div>
    <p class="tiny">${esc(uiText(
      "ค่าปัจจุบันช่วยวางแผนกิจกรรมวันนี้ ไม่สามารถบอกการสัมผัสสะสมหรือความเสี่ยงมะเร็งของบุคคล",
      "A current reading can guide today's activities; it cannot show cumulative exposure or an individual's cancer risk."
    ))}</p>
    <div class="article-forecast mt">
      <h3>${esc(uiText("แบบจำลอง PM2.5 24 ชั่วโมงข้างหน้า", "PM2.5 model for the next 24 hours"))}</h3>
      <div id="article-air-forecast" aria-live="polite">
        <p class="muted">${esc(uiText("กำลังโหลดแบบจำลอง 24 ชั่วโมง…", "Loading the 24-hour model forecast…"))}</p>
      </div>
    </div>` : ""}
    ${a.body.map(p => `<p class="mt" style="font-size:15px">${esc(p)}</p>`).join("")}
    <div class="myth">
      <div class="m">❌ <b>ความเชื่อ:</b> ${esc(a.myth.m)}</div>
      <div class="f">✅ <b>ข้อเท็จจริง:</b> ${esc(a.myth.f)}</div>
    </div>
    <div class="q-note"><b>สิ่งนี้หมายความว่าอย่างไรสำหรับคุณ:</b> ${esc(a.forYou)}</div>
    <div class="article-sources mt"><b>${esc(uiText("แหล่งอ้างอิง", "Sources"))}</b>
      <ul>${a.refs.map(ref => `<li><a href="${esc(ref.url)}" target="_blank" rel="noopener">${esc(ref.label)}</a></li>`).join("")}</ul>
    </div>
    <div class="disclaimer">${esc(uiText(
      "เนื้อหานี้ให้ความรู้ทั่วไป ไม่ใช่คำวินิจฉัยหรือคำแนะนำเฉพาะบุคคล และยังรอการทบทวนโดยแพทย์",
      "This is general educational information, not a diagnosis or personalised advice. Medical review is still pending."
    ))}</div>
    <a class="btn btn-secondary mt" href="#education">← บทความทั้งหมด</a>
    <a class="btn btn-primary mt" href="#begin">ประเมินความเสี่ยง 2–3 นาที</a>
  </div>`);
  if (a.slug === "pm25") {
    const articleProvince = state.answers.PROVINCE || selectedAirProvince;
    updateCompactAirContext("article-air-context", articleProvince);
    updateAirForecast("article-air-forecast", articleProvince, null, { compact: true });
  }
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
    <p class="muted"><b>หน้านี้ยังไม่ใช่รายชื่อสถานพยาบาลจริงและยังไม่สามารถนัดหมายหรือส่งต่อผู้ป่วยได้</b></p>
    <p class="tiny">${esc(tr("รายการทั้งหมดเป็น ข้อมูลจำลอง เพื่อแสดงรูปแบบการค้นหาเท่านั้น หากต้องการรับบริการตอนนี้ โปรดติดต่อสถานพยาบาลที่ตรวจสอบได้หรือหน่วยบริการตามสิทธิของคุณโดยตรง หากมีอาการฉุกเฉิน โทร 1669"))}</p>
    <p class="tiny">${esc(uiText(
      "การปรากฏในรายการต้นแบบไม่ใช่การรับรองสถานพยาบาลหรือยืนยันว่ามีบริการ LDCT โปรดตรวจสอบกับแหล่งทางการก่อนเดินทาง",
      "Appearing in this prototype is not an endorsement and does not confirm that LDCT is available. Check an official source before travelling."
    ))}</p>
    <div class="row mt">
      <select aria-label="${esc(uiText("กรองตามจังหวัด", "Filter by province"))}" onchange="clinicFilter.province=this.value;renderClinics()">
        <option value="">ทุกจังหวัด</option>
        ${[...new Set(FACILITIES.map(f => f.province))].map(p => `<option value="${esc(p)}" ${clinicFilter.province === p ? "selected" : ""}>${esc(p)}</option>`).join("")}
      </select>
      <button class="chip ${clinicFilter.ldct ? "on" : ""}" style="min-height:44px" onclick="clinicFilter.ldct=!clinicFilter.ldct;renderClinics()">มี LDCT</button>
      <button class="chip ${clinicFilter.publicOnly ? "on" : ""}" style="min-height:44px" onclick="clinicFilter.publicOnly=!clinicFilter.publicOnly;renderClinics()">รัฐเท่านั้น</button>
    </div>
  </div>
  <details class="card">
    <summary><b>${esc(uiText("สิ่งที่ควรตรวจสอบก่อนติดต่อบริการ", "What to verify before contacting a service"))}</b></summary>
    <ul class="plain-list muted mt">
      <li>${esc(uiText("ชื่อและเบอร์โทรจากเว็บไซต์หรือช่องทางทางการ", "The name and telephone number from an official website or channel"))}</li>
      <li>${esc(uiText("บริการที่มีจริง ค่าใช้จ่าย และสิทธิการรักษา", "Available services, costs and healthcare coverage"))}</li>
      <li>${esc(uiText("ต้องนัดหมายหรือมีใบส่งตัวหรือไม่", "Whether an appointment or referral letter is required"))}</li>
      <li>${esc(uiText("สถานที่ เวลาเปิด และการเดินทางก่อนออกจากบ้าน", "Location, opening hours and travel details before leaving home"))}</li>
    </ul>
  </details>
  ${list.map(f => `
  <div class="fac">
    <h4>${esc(f.name)}</h4>
    <p class="tiny">${esc(f.type)} · ${esc(f.province)} ${esc(f.district)} · ${esc(f.hours)}</p>
    <div class="chips">${f.services.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>
    <p class="tiny">นัดหมาย: ${esc(f.appointment)} · การส่งตัว: ${esc(f.referral)} · ภาษา: ${f.lang.join("/")} · การเข้าถึง: ${esc(f.access)}</p>
    <p class="tiny" style="color:var(--warn)">${esc(f.verified)}</p>
    <div class="row mt">
      <button class="btn btn-primary btn-sm" onclick="startReferral('${f.id}')">ทดลองขั้นตอนขอรับการติดต่อ</button>
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
      <p class="muted">นี่เป็นการทดลองขั้นตอนเท่านั้นและจะไม่มีเจ้าหน้าที่ได้รับข้อมูล การใช้งานจริงจะต้องขอความยินยอม “ให้เจ้าหน้าที่ที่ได้รับอนุญาตติดต่อฉันได้”</p>
      <button class="btn btn-primary mt" onclick="grantContactConsent('${facilityId}')">ยินยอมและดำเนินการต่อ</button>`);
    return;
  }
  modal(`<h3>ทดลองคำขอให้เจ้าหน้าที่ติดต่อ</h3>
    <p class="tiny">${esc(f.name)} · ข้อมูลจะบันทึกไว้บนอุปกรณ์นี้เพื่อสาธิตเท่านั้น ไม่มีโรงพยาบาลหรือเจ้าหน้าที่ได้รับคำขอ และระบบไม่ส่งผลประเมินของคุณออกจากอุปกรณ์</p>
    <div class="field"><label for="rf-contact">ช่องทางที่สะดวก</label>
      <select id="rf-contact"><option value="LINE">LINE</option><option value="โทรศัพท์">โทรศัพท์</option></select></div>
    <div class="field"><label for="rf-days">วันที่สะดวก</label>
      <select id="rf-days"><option value="จันทร์–ศุกร์">จันทร์–ศุกร์</option><option value="เสาร์–อาทิตย์">เสาร์–อาทิตย์</option><option value="ได้ทุกวัน">ได้ทุกวัน</option></select></div>
    <div class="field"><label for="rf-time">ช่วงเวลาที่สะดวก</label>
      <select id="rf-time"><option value="เช้า (9:00–12:00)">เช้า (9:00–12:00)</option><option value="บ่าย (13:00–16:00)">บ่าย (13:00–16:00)</option><option value="เย็น (16:00–18:00)">เย็น (16:00–18:00)</option></select></div>
    <div class="field"><label for="rf-note">ความต้องการด้านการเข้าถึง / หมายเหตุ (ไม่บังคับ)</label>
      <textarea id="rf-note" rows="2" placeholder="เช่น ต้องการล่าม ต้องการทางลาด"></textarea></div>
    <button class="btn btn-primary" onclick="submitReferral('${facilityId}')">บันทึกคำขอจำลอง</button>`);
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
  modal(`<h3>✅ บันทึกคำขอจำลองแล้ว</h3>
    <p class="muted">คำขอนี้อยู่บนอุปกรณ์ของคุณเท่านั้น ยังไม่ได้ส่งให้โรงพยาบาลและจะไม่มีเจ้าหน้าที่ติดต่อกลับ คุณสามารถเปิดหน้าตัวอย่างสถานะเพื่อดูรูปแบบการทำงานได้</p>
    <a class="btn btn-primary mt" href="#referral" onclick="closeModal()">ดูตัวอย่างสถานะ</a>`);
}
function renderReferral() {
  view(`<div class="card"><h2>🧭 ตัวอย่างสถานะคำขอ</h2>
    <p class="muted"><b>ยังไม่มีการส่งข้อมูลไปยังโรงพยาบาลหรือระบบสุขภาพจริง</b></p>
    <p class="tiny">ข้อมูลนี้บันทึกบนอุปกรณ์เพื่อสาธิตว่าระบบสถานะในอนาคตอาจทำงานอย่างไร</p>
    <div class="q-note mt">${esc(uiText(
      "ห้ามใช้คำขอจำลองนี้สำหรับอาการฉุกเฉิน หากมีอาการรุนแรง โทร 1669 ในประเทศไทยหรือไปห้องฉุกเฉิน",
      "Never use this demo request for an emergency. For severe symptoms, call 1669 in Thailand or go to an emergency department."
    ))}</div>
  </div>
  <details class="card">
    <summary><b>${esc(uiText("ระบบส่งต่อจริงจะต้องทำอะไร", "What a live referral service must do"))}</b></summary>
    <ol class="plain-list muted mt">
      <li>${esc(uiText("บอกผู้ใช้ว่าข้อมูลใดจะถูกส่งและขอความยินยอม", "Explain what will be sent and obtain consent"))}</li>
      <li>${esc(uiText("ส่งไปยังองค์กรที่ระบุชื่อและยืนยันว่าได้รับคำขอ", "Send to a named organization and confirm receipt"))}</li>
      <li>${esc(uiText("แจ้งเวลาตอบกลับ ผู้รับผิดชอบ และทางเลือกหากไม่มีใครติดต่อ", "State the response time, responsible team and what to do if nobody responds"))}</li>
      <li>${esc(uiText("อนุญาตให้แก้ไข ยกเลิก ติดตาม และปิดคำขอ", "Allow correction, cancellation, tracking and closure"))}</li>
      <li>${esc(uiText("ปกป้องข้อมูลและไม่แสดงรายละเอียดสุขภาพในตัวอย่างแจ้งเตือน", "Protect data and keep health details out of notification previews"))}</li>
    </ol>
    <p class="tiny">${esc(uiText(
      "ยังไม่มีองค์กรผู้รับคำขอหรือเวลาตอบกลับที่ได้รับอนุมัติ จึงยังเปิดใช้ระบบจริงไม่ได้",
      "No receiving organization or approved response time exists yet, so live submission cannot be enabled."
    ))}</p>
  </details>
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
      <button class="btn btn-ghost btn-sm mt" onclick="confirmRemoveDemoReferral(${i})">${esc(uiText(
        "ลบคำขอจำลองจากอุปกรณ์นี้",
        "Delete this demo request from this device"
      ))}</button>
    </div>`;
  }).join("")}`);
}
function advanceReferral(i) {
  state.referrals[i].statusIdx++;
  save(); renderReferral();
  toast("อัปเดตสถานะ (จำลอง): " + REF_TIMELINE[state.referrals[i].statusIdx]);
}

function confirmRemoveDemoReferral(i) {
  if (!state.referrals[i]) return;
  modal(`<h3>${esc(uiText("ลบคำขอจำลองหรือไม่", "Delete this demo request?"))}</h3>
    <p class="muted">${esc(uiText(
      "รายการนี้อยู่บนอุปกรณ์เท่านั้น การลบจะนำรายการออกจากประวัติในเบราว์เซอร์นี้และไม่กระทบโรงพยาบาลใด ๆ",
      "This item exists only on this device. Deleting it removes the item from this browser and does not affect any hospital."
    ))}</p>
    <button class="btn btn-primary mt" onclick="removeDemoReferral(${i})">${esc(uiText("ยืนยันการลบ", "Confirm deletion"))}</button>`);
}

function removeDemoReferral(i) {
  if (!state.referrals[i]) return;
  state.referrals.splice(i, 1);
  save();
  closeModal();
  renderReferral();
  toast(uiText("ลบคำขอจำลองแล้ว", "Demo request deleted"));
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
        <b style="font-size:14px">${h.engine === ENGINE_VERSION ? esc(h.bandLabel) : "ผลเดิมจากกฎต้นแบบที่ยกเลิก — โปรดประเมินใหม่"}</b>
        <p class="tiny">${formatDate(h.at, { dateTime: true })} · ${esc(h.engine)}${h.pathway !== "standard" ? " · มีเส้นทางอาการ" : ""}</p>
      </div>`).join("")}
  </div>

  <div class="card"><h3>การแจ้งเตือน</h3>
    <label class="opt ${state.reminders.enabled ? "sel" : ""}">
      <input type="checkbox" ${state.reminders.enabled ? "checked" : ""} onchange="toggleRemind(this.checked)"> เปิดการแจ้งเตือนผ่าน LINE
    </label>
    ${state.reminders.enabled ? `
    <div class="row mt">
      <div class="field"><label for="reminder-time">เวลา</label><input id="reminder-time" type="time" value="${esc(state.reminders.time)}" onchange="state.reminders.time=this.value;save()"></div>
      <div class="field"><label for="reminder-frequency">ความถี่</label><select id="reminder-frequency" onchange="state.reminders.freq=this.value;save()">
        ${["รายเดือน","ราย 3 เดือน","รายปี (ประเมินซ้ำ)"].map(o => `<option value="${esc(o)}" ${state.reminders.freq === o ? "selected" : ""}>${o}</option>`).join("")}
      </select></div>
    </div>
    <button class="btn btn-ghost btn-sm" onclick="toggleRemind(false)">หยุดการแจ้งเตือนทั้งหมด</button>` : ""}
    <p class="tiny mt">เราไม่ส่งข้อความสร้างความกลัว และไม่ใช้การแจ้งเตือนเพื่อโฆษณา</p>
  </div>

  <div class="card"><h3>ความยินยอม</h3>
    ${!c ? `<p class="muted">ยังไม่ได้ให้ความยินยอม</p>` : `
    <p class="tiny">เวอร์ชัน ${esc(c.version)} · ให้ไว้เมื่อ ${formatDate(c.at, { dateTime: true })}</p>
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
    <p class="tiny mt">${esc(uiText("เวอร์ชันแอป", "App version"))}: ${esc(APP_VERSION)} ·
      ${esc(uiText("ข้อมูลต้นแบบอยู่บนอุปกรณ์นี้", "Prototype data stays on this device"))}</p>
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
  modal(`<h3>${esc(uiText("ดาวน์โหลดข้อมูลของฉัน", "Download my data"))}</h3>
    <p class="muted">${esc(uiText(
      "ไฟล์นี้มีคำตอบสุขภาพที่คุณให้ ผลปัจจัย และคำขอจำลอง เก็บไฟล์ไว้ในที่ปลอดภัยและอย่าส่งให้บุคคลที่ไม่ไว้วางใจ",
      "This file contains your self-reported health answers, factor result and demo requests. Store it securely and do not send it to anyone you do not trust."
    ))}</p>
    <p class="tiny">${esc(uiText(
      "ระบบจะไม่ใส่คะแนนภายในหรือน้ำหนักของกฎต้นแบบลงในไฟล์",
      "Internal prototype points and rule weights are excluded from the file."
    ))}</p>
    <button class="btn btn-primary mt" onclick="performExport()">${esc(uiText("ยืนยันและดาวน์โหลด", "Confirm and download"))}</button>`);
}

function performExport() {
  const exported = buildPortableExport(state, {
    appVersion: APP_VERSION,
    storageKey: STORE_KEY
  });
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = `lunglens-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  closeModal();
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
    <p class="q-note">${esc(uiText(
      "ฉบับร่าง privacy_prototype_v3 · อัปเดต 29 กรกฎาคม 2569 · ต้องผ่านการตรวจสอบทางกฎหมายก่อนใช้งานจริง",
      "Draft privacy_prototype_v3 · updated 29 July 2026 · legal review is required before production use"
    ))}</p>
    <h3>หลักการ</h3>
    <p class="muted">เก็บข้อมูลเท่าที่จำเป็น · แยกข้อจำเป็นออกจากข้อเลือกได้ · อธิบายเหตุผลของทุกคำถามอ่อนไหว · ไม่ขายข้อมูล · ไม่ใช้ข้อมูลความเสี่ยงสุขภาพเพื่อโฆษณา · ไม่แสดงข้อมูลสุขภาพในตัวอย่างการแจ้งเตือน LINE · ผู้ใช้ลบและแก้ไขข้อมูลได้</p>
    <h3>ข้อมูลอยู่ที่ไหนในต้นแบบนี้</h3>
    <ul class="plain-list muted">
      <li>คำตอบ ผล ประวัติ คำขอจำลอง และการตั้งค่าแจ้งเตือนบันทึกในเบราว์เซอร์บนอุปกรณ์นี้ด้วยคีย์ <code>${esc(STORE_KEY)}</code></li>
      <li>ไม่มีเซิร์ฟเวอร์ LungLens รับคำตอบสุขภาพ และไม่มีโรงพยาบาลหรือเจ้าหน้าที่ได้รับคำขอจำลอง</li>
      <li>หน้าอากาศส่งเฉพาะจังหวัดที่เลือกไปยังแหล่งข้อมูลสาธารณะเมื่อจำเป็น ไม่ส่งคำตอบ ผล หรืออาการ</li>
      <li>หากกดค้นหาสถานีใกล้ฉันและอนุญาตตำแหน่ง พิกัดจะอยู่ในหน่วยความจำของหน้านี้เพื่อคำนวณระยะเส้นตรงเท่านั้น ไม่บันทึกและไม่ส่งไปยัง LungLens</li>
      <li>LINE อาจให้ข้อมูลโปรไฟล์พื้นฐานเมื่อผู้ใช้เลือกเข้าสู่ระบบใน LIFF แต่เว็บไซต์สาธารณะใช้ได้โดยไม่เข้าสู่ระบบ LINE</li>
      <li>บันทึกเหตุการณ์การใช้งานในต้นแบบอยู่บนอุปกรณ์และมีเพียงชื่อเหตุการณ์กับเวลา ไม่มีระบบวิเคราะห์ภายนอก</li>
    </ul>
    <h3>${esc(uiText("อุปกรณ์ที่ใช้ร่วมกันและข้อมูลในเบราว์เซอร์", "Shared devices and browser storage"))}</h3>
    <ul class="plain-list muted">
      <li>${esc(uiText(
        "ผู้ใช้คนถัดไปบนเบราว์เซอร์เดียวกันอาจเปิดดูคำตอบ ผล และคำขอจำลองที่บันทึกไว้ได้",
        "Another person using the same browser may be able to open saved answers, results and demo requests."
      ))}</li>
      <li>${esc(uiText(
        "หลังใช้งานอุปกรณ์ร่วม ให้เปิด “ข้อมูลของฉัน” และลบข้อมูลทั้งหมดก่อนส่งต่ออุปกรณ์",
        "After using a shared device, open “My data” and delete all data before handing over the device."
      ))}</li>
      <li>${esc(uiText(
        "โหมดส่วนตัวหรือไม่ระบุตัวตนอาจไม่เก็บความคืบหน้าเมื่อปิดหน้าต่าง",
        "Private or incognito browsing may not keep your progress after the window closes."
      ))}</li>
      <li>${esc(uiText(
        "การล้างข้อมูลเว็บไซต์ของเบราว์เซอร์จะลบข้อมูลต้นแบบบนอุปกรณ์นี้ และไม่มีสำเนาบนเซิร์ฟเวอร์ LungLens ให้กู้คืน",
        "Clearing this site's browser data removes the prototype data from this device. LungLens has no server copy to restore."
      ))}</li>
    </ul>
    <h3>การส่งออกและลบข้อมูล</h3>
    <p class="muted">ไฟล์ดาวน์โหลดมีข้อมูลสุขภาพที่คุณให้ จึงควรเก็บอย่างปลอดภัย คะแนนภายในและน้ำหนักกฎต้นแบบจะไม่ถูกส่งออก การลบข้อมูลจะลบคีย์ ${esc(STORE_KEY)} ออกจากเบราว์เซอร์นี้เท่านั้น</p>
    <h3>เอกสารที่เกี่ยวข้อง (โครงร่าง)</h3>
    <div class="opts">
      ${["ข้อกำหนดการใช้งาน","ข้อจำกัดความรับผิดทางการแพทย์","นโยบายเก็บรักษาข้อมูล","ความยินยอมเพื่อการวิจัย","ถ้อยแถลงการเข้าถึง (Accessibility)"].map(d => `
      <button class="opt" onclick="protoPopup('${d}','เอกสารฉบับร่าง — ต้องผ่านการตรวจสอบทางกฎหมายก่อนใช้งานจริง')">${d}</button>`).join("")}
    </div>
    <p class="tiny mt">${esc(uiText("เวอร์ชันแอป", "App version"))}: ${esc(APP_VERSION)}</p>
    <a class="btn btn-ghost mt" href="#home">← กลับหน้าแรก</a>
  </div>`);
}

/* ---------------- big-text mode (ก+) — for comfortable reading at any age ---------------- */
function applyTextSize() {
  document.body.classList.toggle("big", !!state.bigText);
  const b = $("#sizeBtn");
  if (b) {
    b.textContent = state.lang === "en"
      ? (state.bigText ? "A−" : "A+")
      : (state.bigText ? "ก−" : "ก+");
    b.style.fontWeight = "700";
  }
}
function toggleTextSize() {
  state.bigText = !state.bigText; save();
  applyTextSize();
  toast(state.bigText ? "เปิดตัวอักษรใหญ่แล้ว" : "กลับเป็นตัวอักษรปกติ");
}

/* ---------------- complete Thai / English presentation toggle ---------------- */
function toggleLang() {
  state.lang = state.lang === "th" ? "en" : "th"; save();
  closeModal();
  applyLocale();
  route();
  toast(state.lang === "en" ? t("language_changed_en") : t("language_changed_th"));
}

/* ---------------- boot ---------------- */
applyLocale();
initLiff();   // real LIFF init when LIFF_ID is set (js/liff-config.js); browser fallback otherwise
applyTextSize();
route();
