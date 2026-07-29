# HANDOVER — LungLens / รู้ทันปอด

**Read this first.** It assumes you know nothing about the project and have not seen any
prior conversation. Last updated **2026-07-29**.

---

## 1. What this is, in one paragraph

**LungLens (รู้ทันปอด)** is a Thai-language **LINE app** that helps people — especially
women who have never smoked — understand their *lung-health risk factors* and find their
way to appropriate care. A user answers ~15 short questions (2–3 min), and gets an
**explainable** result: which factors matter for them, why, and what to do next. It also
has an education centre, a clinic finder, a referral request flow, and a provider-side
dashboard demo.

Tagline: **“ไม่สูบ ไม่ได้แปลว่าไม่เสี่ยง”** (Not smoking doesn't mean not at risk.)

## 2. ⚠️ The single most important thing to understand

**This is a prototype. It is NOT clinically validated and must never be presented as a
medical test.**

| Real | Demonstration only (ข้อมูลจำลอง) |
|---|---|
| The LINE app, hosting, login, sharing | The **risk rules and their weights** |
| The questionnaire flow and UI | All **hospitals/clinics** in the finder |
| Data stays on the user's own device | All **provider cases + analytics** |
| General PM2.5 education | Any personal PM2.5 exposure estimate |
| | The education articles (drafts, unreviewed) |

Before any real-world use, these gates **must** be cleared: clinical validation of the
rules, legal/PDPA review of consent and privacy text, medical review of every article,
and verification of real facility data. See "Gates before ANY production use" in
[TASKS.md](TASKS.md).

The app is deliberately built so it can never: give a cancer probability, say a user is
"safe", diagnose anything, or tell someone to get an LDCT scan. **Do not add any of
those.** Full rules in [CLAUDE.md](CLAUDE.md).

## 3. Every link and ID

| What | Value |
|---|---|
| 🟢 **Open the app in LINE** | `https://liff.line.me/2010756823-yiuPlaT0` |
| 🟢 **Open in any browser** | https://supakiat999.github.io/lunglens/ |
| 📦 Source code | https://github.com/Supakiat999/lunglens |
| 💻 Code on this PC | `C:\Users\ASUS\OneDrive\Desktop\Astra Project\lunglens\` |
| 🔧 LINE Developers console | https://developers.line.biz/console/provider/2005248450 |
| 🔧 LINE OA Manager | https://manager.line.biz/ |
| LINE provider name | **Longview** (id `2005248450`) — shared with the owner's other bot |
| LINE Login channel | **LungLens**, id `2010756823` — status **Published** |
| LINE Official Account | **LungLens**, Basic ID `@794hkqhs` — free plan |
| Messaging API channel | **LungLens**, id `2010852424` — provider **Longview** |
| LIFF ID | `2010756823-yiuPlaT0` (Full size · scopes `openid`+`profile` · shareTargetPicker on) |
| Hosting | GitHub Pages, branch `main`, root `/` — deploys ~1 min after push |

The GitHub Pages URL is a public, no-login entry point. Visitors do not need a LINE
account; LINE login remains an optional enhancement for profile and native sharing.

**Deep links** (used by the rich-menu buttons) — append `?p=` to the LIFF URL:
`begin` (assessment) · `result` · `education` · `clinics` · `profile` · `home`
Example: `https://liff.line.me/2010756823-yiuPlaT0?p=clinics`

**Secrets:** there are none in this repo, by design. The LIFF ID is public (it appears in
every LIFF URL). The only secret — the **channel access token** — is issued by the owner
and passed as an environment variable at run time. **Never write it into a file.**

## 4. What's done ✅

- Full user journey: landing → consent (layered, nothing pre-checked) → 15-step
  assessment with autosave/resume → explainable result with separate LDCT screening
  context → clinic finder → referral +
  status timeline → personal data controls (export/delete/withdraw consent)
- **Explainable risk engine** — 17 versioned rules (14 active factor rules and 3 age
  context rules), each with a Thai explanation,
  a "what to do next", and an evidence-strength label. Symptoms are handled in a
  **separate pathway and are never scored**.
- Education centre (12 sourced bilingual articles + search), live Air4Thai station data,
  provider dashboard demo
  (3 roles, case list, rules table, funnel analytics), 5-slide presentation mode
  (`?p=demo-story`)
- **Real LINE LIFF integration** — `liff.init()`, LINE Login, profile, native share
  picker, `?p=` deep links, and a graceful "open in browser" fallback if LINE fails
- **Accessibility for all ages** — the `ก+` button in the header scales the entire UI
  (fonts + tap targets) and remembers the choice
- **Complete public Thai/English UI** — the language switch covers landing, consent,
  assessment, results, education, clinics, referral, profile, privacy, LIFF states and
  safe sharing. Stored answers remain canonical Thai values so rules do not change.
- **Prototype v0.2 usability and safety checks** — review-before-submit, grouped-field and
  number-range validation, hidden conditional-answer cleanup, safer saved-state loading,
  cache busting, a responsive phone header, accessible factor controls, route-heading
  focus, modal focus restoration, and stronger ARIA/focus states.
- **Prototype v0.3 screening-safety correction** — province and age alone cannot change
  the result; the fictional area-PM2.5 lookup was removed; former smokers are asked when
  they stopped; LDCT context uses age together with smoking exposure; and old v1 results
  require reassessment instead of continuing to show retired rules.
- **Prototype v0.4 live air and education** — all 77 provinces, current Air4Thai station
  PM2.5/PM10/AQI, a labelled CAMS model fallback, freshness and failure states, and all
  12 education topics with authoritative sources. Current pollution never enters the
  cancer-factor score or LDCT context. The hourly updater was manually verified in
  GitHub Actions on 2026-07-28 and published a validated 174-station snapshot.
- **Prototype v0.5 connected context and privacy controls** — current province air data
  appears directly in results and the PM2.5 article; factor explanations link to relevant
  sourced drafts and healthcare-navigation demo routes; assessment progress includes a
  remaining-question count; connection loss has a visible retry state; the privacy page
  explains actual device/external data flow; and confirmed exports exclude internal rule
  points and weights while retaining model and review status.
- **Prototype v0.6 PM2.5 planning forecast** — the air page and PM2.5 article include a
  responsive next-24-hours PM2.5 chart from the Open-Meteo/CAMS Global model, with
  minimum/maximum values, cautious higher/lower/variable/similar wording, model retrieval
  time, approximate 45 km grid disclosure, and an explicit warning that it is neither
  station history nor a personal cancer-risk estimate.
- **Prototype v0.7 nearest-station privacy flow** — users can explicitly request browser
  location permission to sort Air4Thai stations by straight-line distance. Coordinates
  are held only in page memory, never saved to `lunglens-v1` or sent to LungLens, can be
  cleared immediately, and never affect the assessment. Distance calculation and
  non-mutating station sorting have automated boundary checks.
- **Prototype v0.8 history, validation, and language flow** — first visits open in
  English while an existing explicit Thai/English choice remains saved; assessment
  errors appear inline beside the affected field with bilingual whole-number guidance;
  and the air page shows rolling official station-measurement history separately from
  the 24-hour CAMS model forecast. The history updater retains at most 48 hours,
  deduplicates station timestamps, and never mixes model data or personal coordinates.
  GitHub Actions run `30442779935` succeeded on 2026-07-29 and published the initial
  live history dataset with 173 official stations and 173 observations. A station chart
  appears after that station has at least two distinct published observation times.
- **Prototype v0.9 result clarity and navigation trust** — results answer four plain-language
  questions, distinguish answers that affected the factor band from information that
  did not, keep symptoms visibly separate, and provide questions for a healthcare
  professional. Assessment resume shows progress and shared-device guidance. Province
  use is explained before entry. Clinic listings now state that inclusion is not an
  endorsement, referral pages state the requirements for a real service, and users can
  remove device-only demo requests without implying that a hospital was contacted.
- **Prototype v0.10 keyboard and result-change clarity** — public dialogs contain
  Tab/Shift+Tab focus, close with Escape, and restore focus. The campaign storyboard
  is a labelled button, article cards are links, and referral/reminder fields have
  explicit labels. Results explain how new answers, separate symptom guidance, or a
  future reviewed rule version can change what is shown without implying that disease
  appeared, improved, or worsened. English and Thai result reflow was verified at 320px.
- **Prototype v0.11 honest operational boundaries** — optional choices now state that
  they only save preferences in the browser and do not send LINE messages, upload
  research data, share location, or contact staff. Reminder scheduling is labelled as
  a demo preview with local-only events, new agreements use `consent_v2`, missing
  required consent produces a focused inline alert, and the non-operational placeholder
  privacy email was removed.
- **Live LINE Official Account** — **LungLens** (`@794hkqhs`) with Messaging API enabled
  under provider **Longview**, Auto-response OFF, a concise bilingual non-diagnostic
  greeting, and the bilingual 6-button rich menu installed as the default.

## 5. LINE Official Account status

The Official Account setup is complete:

- Account name: **LungLens** · Basic ID: `@794hkqhs`
- Category: **Health / Health (Other)** · country: Thailand
- Messaging API: enabled under provider **Longview** · channel id `2010852424`
- Auto-response: **OFF** · greeting message: bilingual and non-diagnostic
- Rich menu: 2500×1686 bilingual 3×2 menu installed and set as the default
- Public browser access: no LINE login required

One physical-device check remains operational rather than a code change: add the OA as a
friend on a phone and confirm all six menu tiles are comfortably readable and open their
intended live routes.

## 6. How to work on the code

No build step, no dependencies, no accounts needed.

```bash
cd "C:\Users\ASUS\OneDrive\Desktop\Astra Project"
python -m http.server 8099
# → http://localhost:8099/lunglens/
```

Real LINE login only works over HTTPS, so **localhost runs in browser/demo mode** — the
UI is identical, LINE features are stubbed. To test true in-LINE behaviour, push to
GitHub (Pages redeploys in ~1 min) and open the LIFF link on a phone.

**Fast way to see it working:** on the home screen, tap any of the four **demo persona**
buttons — each fills the questionnaire instantly and lands on a different result type
(including the urgent-symptom pathway).

Where things live:
- `js/data.js` — all questions, risk rules, demo facilities, articles, personas
  *(edit rules here; each has a code, weight, explanation, evidence label)*
- `js/validation.js` — questionnaire completeness/range checks; never clinical scoring
- `js/engine.js` — the rule evaluation + symptom pathway (the safety-critical logic)
- `js/air-quality.js` — official station matching, PM2.5 guidance, freshness and fallback
- `js/air-history.js` — rolling official station history, validation, retention and loading
- `js/app.js` — router and every screen
- `js/liff.js` — everything LINE-related
- `line/` — the Official Account kit

Deploying = `git push`. Nothing else.

## 7. Where to go next

[TASKS.md](TASKS.md) holds the detailed roadmap. The highest-value next items:

1. Complete the real-phone OA greeting/rich-menu test and collect the add-friend link/QR
2. Have a clinician review the rules, four result bands, PM2.5 guidance, and 12 articles 🩺
3. Monitor the hourly Air4Thai workflow and add operational alerts
4. Replace demo facilities with verified real ones
5. Then Phase 3 — real backend (Next.js + Supabase) so results persist server-side and
   referrals reach actual staff

## 8. Cost

**Everything is free and stays free.** GitHub Pages (free), LINE Login channel + LIFF
(free), Official Account (free tier), rich menu (free). Buttons open the app directly and
consume **no** message quota. The only metered thing is *push* messages (~300/month free),
which this project does not currently send — a deliberate design choice: build on replies
and menu taps, never on broadcasts.
