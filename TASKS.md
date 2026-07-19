# TASKS.md — LungLens / รู้ทันปอด backlog

Status legend: ✅ done in prototype · 🔜 next · 🧱 needs real infra · 🩺 needs clinical/legal review

## Phase 0 — Prototype (this session) ✅

- ✅ Static SPA shell, teal design system, mobile-first, bottom nav, reduced-motion support
- ✅ Landing page (hero, benefits, disclaimer, storyboard modal, persona quick-fill)
- ✅ Before-you-begin + layered consent (required/optional split, nothing pre-checked, versioned record)
- ✅ 15-step assessment wizard with conditional steps, autosave, save-and-resume, progress "ข้อ X จาก Y"
- ✅ Explainable rule engine (18 rules, weights, evidence labels, 4 bands + symptom override)
- ✅ Symptom safety check separated from scoring; urgent pathway with 1669 guidance
- ✅ Result page: factor cards, not-assessed list, privacy-safe share card, retake
- ✅ Education centre: 4 drafted Thai articles + 12-category grid (placeholders labelled)
- ✅ Clinic finder (6 demo facilities, filters) + referral form + status timeline
- ✅ Profile: history, reminders, consent withdrawal, JSON export, full delete
- ✅ Provider dashboard demo (3 roles, case list/detail, referrals, rules table, funnel analytics)
- ✅ /demo-story presentation mode (5 slides)
- ✅ Flex Message JSON samples, .env.example, README

## Phase 1 — Finish the public MVP 🔜

- [ ] Full EN translation dictionary (currently partial; toggle shows notice)
- [ ] Write the remaining 8 education articles (drafts exist as category placeholders) 🩺
- [ ] Real province list (77) + district picker; postcode validation
- [ ] Inconsistent-answer checks (e.g. "ไม่เคยสูบ" + pack-years entered)
- [ ] Review-before-submit screen (spec §40: user can change answers before submitting)
- [ ] Accessibility pass: screen-reader labels on all inputs, focus management on route change, keyboard testing
- [ ] Offline queue message ("การเชื่อมต่ออินเทอร์เน็ตไม่เสถียร…") + retry logic
- [ ] Unit tests for engine.js (persona fixtures 1–4, incomplete, exclusive options) — engine already exports for Node

## Phase 2 — Real LINE integration 🧱

- ✅ Real LIFF SDK wired in (`js/liff.js`): `liff.init()`, in-client detection, LINE Login,
  `getProfile()`, `shareTargetPicker`, `?p=` deep-link routing, retry/open-in-browser fallback
- [ ] Create LINE Login channel + LIFF app in the console; paste LIFF ID into `js/liff-config.js`; deploy to HTTPS (GitHub Pages)
- [ ] Server-side ID-token verification endpoint (never trust client profile)
- [ ] Messaging API channel + OA; rich menu with 6 areas (ประเมินความเสี่ยง / ผลของฉัน / ความรู้ / นัดหมาย / แจ้งเตือน / ช่วยเหลือ) — chatBarText ≤ 14 chars
- [ ] Webhook: signature verification, idempotency (webhook_events table), follow/unfollow/message/postback handlers
- [ ] Chatbot intents (start assessment, explain factors, view result, find provider, reminders, privacy, help) + the fixed non-diagnostic fallback reply
- [ ] Wire Flex templates from line/flex-messages.json (privacy-safe previews only)
- [ ] Reminder scheduler honouring opt-in, time, frequency, pause/stop (LINE free tier: replies free, ~300 pushes/mo — design reply-first)

## Phase 3 — Backend & data 🧱

- [ ] Next.js (App Router, TS, Tailwind, shadcn/ui) port of the SPA screens
- [ ] Supabase project; migrations for the 17 entities (users, consents, assessments, assessment_answers, risk_results, risk_rules, referrals, referral_events, facilities, provider_users, provider_notes, content_articles, message_preferences, message_events, webhook_events, audit_logs) — schema is in the original spec §32
- [ ] RLS policies + provider RBAC (Navigator / Clinical reviewer / Content editor / Programme manager / Super admin)
- [ ] Move RULES into risk_rules table with versioning workflow (draft → clinical review → approved → inactive); results keep generating version; audit every change
- [ ] Encrypted provider notes (DATA_ENCRYPTION_KEY), audit_logs on all provider actions
- [ ] Real referral status machine (11 statuses per spec §24) + notifications gated on consent
- [ ] Historical PM2.5 ingestion per district (replace PM25_DEMO); label source + date
- [ ] Analytics events → privacy-conscious pipeline (event names already emitted in app.js `track()`); low-count suppression

## Phase 4 — Provider ops & polish 🧱🩺

- [ ] Provider auth (org accounts, session expiry), /provider/* routes per spec §29
- [ ] Content management with clinical-review workflow; medical reviewer sign-off fields 🩺
- [ ] Admin rules-config UI (currently read-only table) with approval workflow 🩺
- [ ] Demo mode reset control; 20 sample assessments / 8 referrals seeding script
- [ ] E2E tests (8 journeys per spec §41), small-screen + keyboard tests
- [ ] Campaign asset exports (story/square/horizontal/broadcast card/QR poster/CHW handout)

## Gates before ANY production use 🩺

- [ ] Clinical validation of rules, weights, thresholds — ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง
- [ ] Legal review of consent, privacy notice, disclaimers (PDPA)
- [ ] Medical review + real references for every article
- [ ] Verified facility data (no mock facilities presented as active services)
- [ ] Governance for any AI-assisted explanation (templates, logging, no invented facts)

## Future research modules (disabled placeholders — spec §36)

- [ ] Cough-audio research (separate consent, "อยู่ระหว่างการวิจัย", no diagnostic output)
- [ ] Breath VOC / blood biomarker / CXR-AI / LDCT-AI — provider-side, roadmap page only
