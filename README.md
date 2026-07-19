# LungLens · รู้ทันปอด

> **“ไม่สูบ ไม่ได้แปลว่าไม่เสี่ยง”** — รู้ความเสี่ยงก่อนมีอาการ และรับคำแนะนำที่เหมาะกับคุณ

A LINE-based lung-cancer **risk-awareness and healthcare-navigation** platform for Thailand,
focused initially on Asian women who have never smoked but may have other risk factors.

> ⚠️ **This prototype is not clinically validated and must not be used for diagnosis or
> autonomous clinical decision-making.** ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง
> All facilities, cases, analytics, and rules in this repo are **ข้อมูลจำลอง (demo data)**.

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
(key `lunglens-v1`). Runs anywhere (GitHub Pages = free hosting), works offline after load,
and is deliberately structured so each layer maps 1:1 onto the target production stack.

```
lunglens/
├── index.html            App shell, mock LIFF splash, bottom nav
├── css/styles.css        Design system (teal trust palette, WCAG-aware, reduced-motion)
├── js/data.js            Questions (STEPS), risk rules (RULES), bands, demo facilities,
│                         articles, personas, provider demo data  ← "database + config"
├── js/engine.js          Explainable rule engine + symptom pathway  ← "risk service"
├── js/app.js             Router + all screens + mock LIFF + local state  ← "frontend"
├── line/flex-messages.json  Flex Message JSON templates (privacy-safe copy)
├── .env.example          Env vars for the future LIFF/Next.js build (no secrets)
├── README.md             This file
└── TASKS.md              Prioritized backlog to finish the real build
```

### Run it

Any static server works:

```bash
# from the repo root (Claude preview uses this)
python -m http.server 8099
# → http://localhost:8099/lunglens/
```

No build step, no dependencies, no cost.

### Screens implemented

- **#home** — campaign landing (hero, benefit cards, disclaimer, 45-s video storyboard, demo personas)
- **#begin → #consent** — before-you-begin + layered consent (required vs optional, nothing pre-checked)
- **#assess** — 15-step wizard: profile, smoking (+pack-years), second-hand smoke, family/medical,
  occupational, household cooking, area PM2.5 (demo data), symptom safety check.
  Autosave per answer, "บันทึกและกลับมาทำต่อภายหลัง", resume card on home.
- **#symptom** — symptom pathway interstitial (urgent = red + 1669 guidance; never diagnostic)
- **#result** — band, "ทำไมจึงได้ผลนี้" factor cards (tap → why/next/evidence/rule code),
  not-assessed list, privacy-safe share card, detailed-share confirm, retake
- **#education** — 4 written articles (myth/fact, evidence labels, reviewer placeholder) + 12 category grid
- **#clinics** — 6 demo facilities, filters (province / LDCT / public), CTAs
- **#referral** — referral request form (consent-gated) + status timeline with demo advance button
- **#profile** — history, reminder prefs, consent withdrawal, data export (JSON), full delete
- **#provider** — role-based demo login (Navigator / Clinical reviewer / Programme manager),
  case list + detail, referrals, versioned rules table, funnel + distribution analytics
- **#demo-story** — 5-slide presentation mode with next/back/reset
- **#privacy** — placeholder legal pages, all marked "ฉบับร่างสำหรับต้นแบบ"

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
`model_version: "prototype_rules_v1"`, `clinical_validation_status: "not_clinically_validated"`).

Bands: **0 pts** → B "ยังไม่พบปัจจัยเสี่ยงเด่น" · **1–3** → C "พบปัจจัยที่ควรให้ความสำคัญ" ·
**≥4** → D "แนะนำให้รับการประเมินเพิ่มเติมจากบุคลากรทางการแพทย์".
Thresholds and weights are prototype placeholders — **ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง**.
Rule changes must create a new version; old results keep their generating version (see TASKS).

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

- English UI is partial (toggle shows notice); content is Thai-first.
- PM2.5 area data is a seeded demo list, clearly labelled — not real measurements.
- All "call / map / detailed share / provider write actions" open labelled prototype popups.
- No real persistence beyond the device (localStorage), no accounts, no real LINE session.
- Articles are drafts pending medical review; references are placeholders.
