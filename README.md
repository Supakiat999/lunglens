# LungLens · รู้ทันปอด

> **“ไม่สูบ ไม่ได้แปลว่าไม่เสี่ยง”** — รู้ความเสี่ยงก่อนมีอาการ และรับคำแนะนำที่เหมาะกับคุณ

A LINE-based lung-cancer **risk-awareness and healthcare-navigation** platform for Thailand,
focused initially on Asian women who have never smoked but may have other risk factors.

> ⚠️ **This prototype is not clinically validated and must not be used for diagnosis or
> autonomous clinical decision-making.** ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง
> All facilities, cases, analytics, and rules in this repo are **ข้อมูลจำลอง (demo data)**.

## 📍 Status — last updated 2026-07-26

**The bilingual app and its LINE Official Account are live today.**

| | |
|---|---|
| 🟢 **Open in LINE** | https://liff.line.me/2010756823-yiuPlaT0 |
| 🟢 **Open in browser** | https://supakiat999.github.io/lunglens/ |
| 🟢 **LINE Official Account** | **LungLens** · Basic ID `@794hkqhs` |

The browser link is public and does **not** require a LINE account or LINE login.
LINE sign-in is optional and is used only for LINE-specific profile and sharing features.

| Phase | State |
|---|---|
| 1 · Public MVP (landing → consent → assessment → result → education → privacy) | ✅ done |
| 2 · LINE integration — LIFF SDK, login, profile, share, deep links, published channel | ✅ done |
| 2b · Official Account + bilingual 6-button rich menu | ✅ live |
| 3 · Backend (Next.js + Supabase, real referrals, versioned rules) | ⬜ not started |
| 4 · Analytics, provider ops, automated tests | ⬜ demo-level only |

Full picture for a new person → **[HANDOVER.md](HANDOVER.md)** · backlog → [TASKS.md](TASKS.md)

## What it is / is not

| Is | Is not |
|---|---|
| Awareness + preliminary risk assessment (แบบประเมินความเสี่ยงเบื้องต้น) | An AI cancer detector or diagnostic test |
| Explainable, rule-based factor identification | A validated screening-eligibility rule |
| Healthcare navigation + referral follow-up | A replacement for a doctor or LDCT |
| De-identified programme evaluation data | A tool that ever says "คุณปลอดภัย" |

Key safety invariants baked into the code:
- Symptoms are a **separate pathway** (`engine.js → symptomPathway`) — never scored.
- No probability of cancer is ever computed or shown.
- Band B wording is "ยังไม่พบปัจจัยเสี่ยงเด่นจากข้อมูลที่ให้มา" — never "low risk" / "safe".
- LDCT is only ever framed as a shared decision with a professional.
- LINE notification copy never contains health details (see `line/flex-messages.json`).

## Current prototype (this folder)

**Zero-dependency static SPA** — vanilla JS + CSS, hash-routed, state in `localStorage`
(key `lunglens-v1`). Runs anywhere (GitHub Pages = free hosting), keeps already loaded
local journeys usable during a connection loss with a visible offline warning, and is
deliberately structured so each layer maps 1:1 onto the target production stack.

Current app version: **`prototype_0.8.0`**. It preserves the v0.3 screening-safety
correction, v0.4 live-data foundation, v0.5 privacy controls, and v0.6 24-hour forecast,
v0.7 explicit-permission nearest-station sorting, and v0.8 rolling official station
history, bilingual inline assessment validation, and an English first-visit default.
Browser coordinates remain only in page memory, are never written to `lunglens-v1`, and
are used locally to calculate straight-line distance; clearing or reloading removes
them. Official Air4Thai measurements and their recent history remain separate from the
CAMS forecast. No pollution or location data enters the factor band or LDCT screening
context. The engine remains versioned as `prototype_rules_v2`.

Location on disk: `C:\Users\ASUS\OneDrive\Desktop\Astra Project\lunglens\`

```
lunglens/
├── index.html                  App shell, LIFF splash, bottom nav, ก+ text-size toggle
├── css/styles.css              Design system (teal palette, WCAG-aware, big-text mode)
├── js/data.js                  Questions (STEPS), risk rules (RULES), bands, demo
│                               facilities, articles, personas   ← "database + config"
├── js/air-quality.js           Air4Thai station matching, Thai PM2.5 guidance,
│                               freshness handling, and model fallback
├── js/air-history.js           Rolling 48-hour official-station history + loader
├── js/validation.js            Completeness/range checks only; no clinical scoring
├── js/engine.js                Explainable rule engine + symptom pathway ← "risk service"
├── js/privacy.js               Portable export + privacy-safe LINE invitation helpers
├── js/app.js                   Router + every screen + local state       ← "frontend"
├── js/liff.js                  LINE layer: init, login, profile, share, ?p= deep links
├── js/liff-config.js           LIFF_ID (public by design — safe to commit)
├── line/OA-SETUP.md            ▶ How to create the Official Account + install the menu
├── line/setup-richmenu.mjs     One-command rich-menu installer (needs Node 18+)
├── line/rich-menu.png          The 6-button menu image (large Thai labels)
├── line/richmenu-labels.json   Button wording — edit here, then regenerate the PNG
├── line/make-richmenu-image.ps1  Regenerates rich-menu.png (ASCII-only script)
├── line/flex-messages.json     Flex Message templates (privacy-safe copy)
├── data/air4thai-latest.json   Validated public station snapshot (automatic fallback)
├── scripts/update-air-quality.mjs  Validates Air4Thai data + maintains rolling history
├── .github/workflows/update-air-quality.yml  Hourly live-data refresh
├── .env.example                Env vars for the future backend (no secrets)
├── HANDOVER.md                 ▶ Status, all links/IDs, next steps — start here
├── CLAUDE.md                   Operating guide + safety invariants for AI sessions
├── README.md                   This file
└── TASKS.md                    Prioritized backlog
```

### Run it

Serve from the **parent** folder so the URL keeps the `/lunglens/` path the live site uses:

```bash
cd "C:\Users\ASUS\OneDrive\Desktop\Astra Project"
python -m http.server 8099
# → http://localhost:8099/lunglens/
```

`Astra Project/.claude/launch.json` runs exactly this for the Claude preview server.

No build step, no dependencies, no cost. Note: real LINE login needs HTTPS, so on
localhost the app runs in browser/demo mode — use the live URL to test inside LINE.

### Screens implemented

- **#home** — campaign landing (hero, benefit cards, disclaimer, 45-s video storyboard, demo personas)
- **#begin → #consent** — before-you-begin + layered consent (required vs optional, nothing pre-checked)
- **#assess** — 15-step wizard: profile, smoking (+pack-years and time since stopping),
  second-hand smoke, family/medical, occupational, household cooking, symptom safety check.
  Province is used only for healthcare navigation and never changes the result.
  Current pollution context is displayed separately and never changes the result.
  Autosave per answer, bilingual field-level validation, safer whole-number smoking
  inputs, "บันทึกและกลับมาทำต่อภายหลัง", resume card on home.
- **#review** — bilingual answer summary with per-question editing before result creation
- **#symptom** — symptom pathway interstitial (urgent = red + 1669 guidance; never diagnostic)
- **#result** — band, separate LDCT screening context, "ทำไมจึงได้ผลนี้" factor cards
  (tap → why/next/evidence/related sourced education), embedded local air context,
  not-assessed list, privacy-safe sharing, retake
- **#air** — current province/station PM2.5, PM10 and AQI from Air4Thai; model fallback,
  timestamps, freshness warning, health guidance, source attribution, limitations,
  rolling official station-measurement history, and a separate responsive 24-hour CAMS
  Global model forecast with cautious trend wording;
  optional nearest-station sorting requires an explicit permission tap and keeps
  coordinates in page memory only
- **#education** — 12 sourced bilingual articles, search, myth/fact explanations,
  content versions, dates, authority links, explicit medical-review status, and a live
  selected-province reading plus 24-hour model chart inside the PM2.5 topic
- **#clinics** — 6 demo facilities, filters (province / LDCT / public), CTAs
- **#referral** — referral request form (consent-gated) + status timeline with demo advance button
- **#profile** — history, reminder prefs, consent withdrawal, confirmed portable JSON
  export without internal scoring points, app version, full delete
- **#provider** — role-based demo login (Navigator / Clinical reviewer / Programme manager),
  case list + detail, referrals, versioned rules table, funnel + distribution analytics
- **#demo-story** — 5-slide presentation mode with next/back/reset
- **#privacy** — versioned prototype draft plus a factual map of device-only storage,
  public air-data requests, optional LIFF profile access, export and deletion

### Demo personas (one tap on #home)

| Persona | Expected outcome |
|---|---|
| 1 — หญิง 62 ปี, พ่อ/แม่เป็นมะเร็งปอด, ควันมือสองระยะยาว | แนะนำให้รับการประเมินเพิ่มเติม (band D) |
| 2 — หญิง 55 ปี, ฝุ่นก่อสร้าง 20 ปี | พบปัจจัยที่ควรให้ความสำคัญ (band C) |
| 3 — หญิง 45 ปี, ไม่มีปัจจัย | ยังไม่พบปัจจัยเสี่ยงเด่น + non-reassurance disclaimer (band B) |
| 4 — 58 ปี, ไอเป็นเลือด | Symptom pathway ทันที (ไม่วินิจฉัย) |

## Risk engine

`RULES` in `js/data.js` — each rule carries: code, version, prototype weight, Thai explanation,
"what next" advice, evidence label (มีหลักฐานค่อนข้างชัด / บางส่วน / อยู่ระหว่างการศึกษา), status.
`evaluateRisk()` returns the spec's result object shape (factor codes, explanations,
`model_version: "prototype_rules_v2"`, `clinical_validation_status: "not_clinically_validated"`).

Bands: **0 pts** → B "ยังไม่พบปัจจัยเสี่ยงเด่น" · **1–3** → C "พบปัจจัยที่ควรให้ความสำคัญ" ·
**≥4** → D "แนะนำให้รับการประเมินเพิ่มเติมจากบุคลากรทางการแพทย์".
Thresholds and weights are prototype placeholders — **ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง**.
Province and age-only context never add points. Screening context is separate from the
factor band and never orders LDCT. Rule changes create a new version; retired results
remain identifiable by their generating version and require reassessment.

## Path to production (target architecture)

The spec's full stack, which this prototype maps onto:

```
LINE OA (rich menu, 6 areas) ──► LIFF app (Next.js App Router + TS + Tailwind + shadcn/ui)
        │ webhook (HMAC-verified, idempotent)        │ server actions / API routes
        ▼                                            ▼
  Webhook handler ──────────────────────► Supabase/Postgres (RLS) ── audit_logs
  (follow/unfollow/message/postback)         │ 17-entity schema (see TASKS §DB)
  Flex Messages (line/flex-messages.json)    └─ risk_rules versioned config
```

- **Frontend hosting:** Vercel free tier (or Cloudflare Pages — also free).
- **DB:** Supabase free tier.
- **LINE:** LIFF + Messaging API — free; replies are free, pushes limited (~300/mo free tier).
- Migration map: `js/data.js` → DB seed migrations · `js/engine.js` → server-side risk service ·
  `js/app.js` screens → Next.js routes · mock splash → real `liff.init()` + server-side ID-token
  verification. Full step-by-step in **TASKS.md**.

### LINE LIFF — this app IS a LIFF app

The real LIFF SDK is loaded in `index.html` and initialised by `js/liff.js`:
`liff.init()` → in-client detection → login check → `getProfile()` →
`shareTargetPicker` for the share card → spec-compliant failure screen
("ลองอีกครั้ง" / "เปิดในเบราว์เซอร์"). With no LIFF ID configured it runs in
browser/demo mode — same UI, LINE features gracefully mocked.

**Activate it (free, ~10 minutes):**

1. [developers.line.biz](https://developers.line.biz) → create a **Provider** → create a **LINE Login channel**.
2. In that channel → **LIFF** tab → *Add* →
   - Size: **Full** · Endpoint URL: your HTTPS URL (GitHub Pages works: `https://<user>.github.io/lunglens/`)
   - Scopes: **`openid`, `profile` only** (do not request email — spec §6.1)
3. Copy the **LIFF ID** into [`js/liff-config.js`](js/liff-config.js) → deploy.
4. Open `https://liff.line.me/{LIFF_ID}` in LINE — the app now runs inside LINE with real login/profile/share.
5. **Deep links for the rich menu:** `https://liff.line.me/{LIFF_ID}?p=begin`
   (also `?p=result`, `?p=education`, `?p=clinics`, `?p=profile` — `liff.js` maps `?p=` to the hash route).

The LIFF ID is public by design (it's in every LIFF URL) — safe to commit.
Real secrets (channel secret/access token) are server-side only, for the later
Messaging-API webhook (Phase 2):

- OA Manager: rich menu (6 areas per spec §6.2), **Auto-response OFF** (it steals webhook reply tokens).
- Webhook: verify `X-Line-Signature` (HMAC-SHA256 of body with channel secret); dedupe by `webhookEventId`.
- Secrets only in env vars — never in the client bundle. See `.env.example`.
- Note: LIFF endpoints must be **HTTPS**, so localhost testing of real LINE login needs a tunnel
  (or just test the deployed GitHub Pages URL); browser/demo mode works on localhost as-is.

## Security & privacy checklist (production gate)

- [ ] Server-side LINE ID-token verification (never trust client profile)
- [ ] Webhook signature verification + idempotency table
- [ ] Supabase RLS on every table; provider RBAC (5 roles per spec §29)
- [ ] Encrypted provider notes; masked identifiers in list views
- [ ] No assessment answers in application logs; no stack traces to users
- [ ] Consent records versioned with withdrawal timestamps
- [ ] Retention policy + deletion flow (pseudonymise, keep only legal audit minimum)
- [ ] Low-count suppression in analytics (< 5 hidden)
- [ ] No health data in LINE notification previews
- [ ] Legal + clinical review of all copy, rules, and articles

## Known limitations

- Public user journeys support complete Thai/English switching. Thai remains the canonical
  stored-answer language so switching languages cannot alter rule-engine outcomes.
- The provider dashboard demo and presentation-only route remain Thai-first.
- The app shows real station-level PM2.5 for short-term planning but does not treat a
  province reading as personal lifetime exposure, a cancer-risk score, or LDCT eligibility.
- All "call / map / detailed share / provider write actions" open labelled prototype popups.
- No real persistence beyond the device (localStorage), no accounts, no real LINE session.
- All 12 articles include current authoritative references and remain drafts pending
  medical review; no named clinical reviewer has approved them yet.
