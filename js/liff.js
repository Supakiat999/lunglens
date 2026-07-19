/* =====================================================================
   LungLens — LINE LIFF integration layer (real SDK, graceful fallback)

   Modes:
     "liff"     — running inside the LINE app via LIFF (SDK initialised)
     "web"      — LIFF SDK initialised but opened in an external browser
     "browser"  — no LIFF_ID configured → browser/demo mode
     "offline"  — LIFF SDK failed to load (no network to LINE CDN)

   Spec §6.1 requirements implemented here:
     1-4  init, detect in-client, check login, offer LINE Login
     5-6  minimal scopes (configure "openid profile" on the channel; no email)
     7-9  ID-token → server verification is a PRODUCTION step (no server in
          this prototype; nothing sensitive is trusted from the client)
     10   graceful external-browser fallback + retry screen
   ===================================================================== */

const LIFF_STATE = { mode: "browser", inClient: false, loggedIn: false, profile: null, error: null };

function hideSplash() {
  const splash = document.getElementById("splash");
  if (!splash) return;
  splash.style.opacity = "0"; splash.style.transition = "opacity .3s";
  setTimeout(() => splash.remove(), 320);
}

async function initLiff() {
  /* Rich-menu deep links (?p=begin etc.) are resolved by route() in app.js. */
  if (!LIFF_ID) {                     // no channel configured yet → demo mode
    LIFF_STATE.mode = "browser";
    setTimeout(hideSplash, 600);
    return;
  }
  if (!window.liff) {                 // SDK script failed to load
    LIFF_STATE.mode = "offline";
    showLiffError();
    return;
  }
  try {
    await liff.init({ liffId: LIFF_ID });
    LIFF_STATE.inClient = liff.isInClient();
    LIFF_STATE.loggedIn = liff.isLoggedIn();
    LIFF_STATE.mode = LIFF_STATE.inClient ? "liff" : "web";
    if (LIFF_STATE.loggedIn) {
      state.lineLinked = true; save();
      try { LIFF_STATE.profile = await liff.getProfile(); } catch (e) { /* profile scope not granted */ }
      /* PRODUCTION: send liff.getIDToken() to the server and verify it there
         before creating a session. Never trust client-side profile data. */
    }
    hideSplash();
    route(); // re-render current screen with LINE context (e.g. profile name)
  } catch (err) {
    LIFF_STATE.error = err;
    showLiffError();
  }
}

/* Spec §6.1: failure screen with retry + open-in-browser */
function showLiffError() {
  const splash = document.getElementById("splash");
  if (!splash) return;
  splash.innerHTML = `
    <div class="lung">🫁</div>
    <div style="font-size:17px;font-weight:700;max-width:300px;text-align:center;line-height:1.6">
      ไม่สามารถเชื่อมต่อกับ LINE ได้ในขณะนี้<br>
      <span style="font-weight:400;font-size:14px;opacity:.85">คุณยังสามารถเปิดแบบประเมินในเบราว์เซอร์ได้</span>
    </div>
    <button class="btn btn-sm" style="background:#fff;color:var(--brand-deep);width:220px" onclick="location.reload()">ลองอีกครั้ง</button>
    <button class="btn btn-sm btn-ghost" style="border-color:rgba(255,255,255,.5);color:#fff;width:220px"
      onclick="LIFF_STATE.mode='browser';hideSplash()">เปิดในเบราว์เซอร์</button>`;
}

/* Login / link — real LINE Login when SDK is live, demo toggle otherwise.
   liff.login() redirects to LINE's own consent screen; the user authenticates
   there themselves (this app never sees or handles credentials). */
function liffLogin() {
  if (LIFF_STATE.mode === "liff" || LIFF_STATE.mode === "web") {
    if (!LIFF_STATE.loggedIn) { liff.login({ redirectUri: location.href }); return; }
    // logged in → unlink = logout
    liff.logout();
    LIFF_STATE.loggedIn = false; LIFF_STATE.profile = null;
    state.lineLinked = false; save(); renderProfile();
    toast("ออกจากระบบ LINE แล้ว");
    return;
  }
  // demo mode
  state.lineLinked = !state.lineLinked; save(); renderProfile();
  toast(state.lineLinked ? "เชื่อมต่อ LINE แล้ว (จำลอง — ยังไม่ได้ตั้งค่า LIFF ID)" : "ยกเลิกการเชื่อมต่อแล้ว (จำลอง)");
}

/* Share — native LINE share picker inside the LINE app, clipboard fallback outside.
   Only ever shares the privacy-safe awareness card (no health data). */
async function liffShare(text) {
  if (LIFF_STATE.mode === "liff" && liff.isApiAvailable && liff.isApiAvailable("shareTargetPicker")) {
    try {
      await liff.shareTargetPicker([{ type: "text", text }]);
      toast("ส่งข้อความชวนเพื่อนแล้ว");
      return;
    } catch (e) { /* user cancelled → fall through to copy */ }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("คัดลอกข้อความชวนเพื่อนแล้ว");
  } catch (e) {
    toast("คัดลอกไม่สำเร็จ — เลือกคัดลอกข้อความด้วยตนเอง");
  }
}

function liffStatusText() {
  switch (LIFF_STATE.mode) {
    case "liff": return LIFF_STATE.loggedIn
      ? `เชื่อมต่อผ่าน LINE แล้ว${LIFF_STATE.profile ? " · " + LIFF_STATE.profile.displayName : ""}`
      : "เปิดใน LINE แล้ว — ยังไม่ได้เข้าสู่ระบบ";
    case "web": return LIFF_STATE.loggedIn
      ? `เข้าสู่ระบบ LINE แล้ว (เบราว์เซอร์)${LIFF_STATE.profile ? " · " + LIFF_STATE.profile.displayName : ""}`
      : "เปิดในเบราว์เซอร์ — เข้าสู่ระบบ LINE ได้";
    case "offline": return "ไม่สามารถโหลด LINE SDK ได้ (โหมดออฟไลน์)";
    default: return state.lineLinked
      ? "เชื่อมต่อบัญชี LINE แล้ว (จำลอง — ยังไม่ได้ตั้งค่า LIFF ID)"
      : "โหมดเบราว์เซอร์ — ตั้งค่า LIFF ID ใน js/liff-config.js เพื่อเชื่อม LINE จริง";
  }
}
