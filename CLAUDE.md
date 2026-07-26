# CLAUDE.md — operating guide for this repo

LungLens / รู้ทันปอด — a Thai LINE LIFF app for **lung-health risk awareness and care
navigation**. Static single-page app, no build step, hosted free on GitHub Pages.
Owner: Supakiat999. This repo is **PUBLIC** — treat every commit as published.

Docs map: `HANDOVER.md` (status + all links + next steps — read first) ·
`README.md` (product/architecture) · `TASKS.md` (backlog) ·
`line/OA-SETUP.md` (Official Account setup).

## 🩺 Safety invariants (highest priority — never break)

This is a **health** app used by non-experts. These constraints are the product, not
decoration. Never weaken them, even if asked for "a clearer answer":

- **Never diagnose.** No output may state or imply that a user has, or does not have,
  cancer or any disease.
- **Never output a probability or percentage** of cancer risk. The internal `score` in
  `engine.js` is a rule-weight sum for banding only — never display it.
- **Symptoms are never scored.** `symptomPathway()` is deliberately separate from
  `evaluateRisk()`'s factor logic. Do not merge them or feed symptoms into the bands.
- **Never say the user is safe.** Band B must stay
  "ยังไม่พบปัจจัยเสี่ยงเด่นจากข้อมูลที่ให้มา" with its non-reassurance sentence —
  never "low risk", never "ปลอดภัย".
- **Never auto-prescribe LDCT.** Always frame further testing as a decision made with a
  healthcare professional.
- **No health data in LINE notification previews.** Use "ผลการประเมินของคุณพร้อมแล้ว
  แตะเพื่อดูรายละเอียดอย่างปลอดภัย" — never the band or symptoms. See
  `line/flex-messages.json`.
- **Every advice surface carries the not-a-diagnosis disclaimer**, and anything
  unverified is labelled **ข้อมูลจำลอง** or **ต้องยืนยันกับผู้เชี่ยวชาญก่อนใช้งานจริง**.
- Rules are **prototype, not clinically validated**. `clinical_validation_status` must
  stay `not_clinically_validated` until a clinician signs off.

## ⚠️ Do-not-break list

- `LIFF_ID` in `js/liff-config.js` = `2010756823-yiuPlaT0`. Changing it detaches the app
  from the live LINE channel. (It is public by design — safe to commit.)
- localStorage key `lunglens-v1` — renaming wipes every user's saved answers/consent.
- LINE rich-menu `chatBarText` **max 14 characters** (deploy fails silently otherwise).
- LINE OA "Auto-response" must stay **OFF** — it steals the webhook reply token.
- **Never commit the channel access token.** It is passed as an env var at run time only.
- PowerShell helper scripts stay **ASCII-only** (Unicode breaks Windows PowerShell 5.1
  parsing). Thai strings live in `richmenu-labels.json`, read as UTF-8.
- Rich-menu button order must match the image tiles in `line/rich-menu.png`
  (left→right, top→bottom = begin · result · education · clinics · profile · home).
- Result objects record `model_version`; if rules change, bump the version rather than
  silently rewriting how past results were produced.

## Build & verify workflow

No build, no dependencies. Preview:

```bash
cd "C:\Users\ASUS\OneDrive\Desktop\Astra Project"
python -m http.server 8099    # → http://localhost:8099/lunglens/
```

(`Astra Project/.claude/launch.json` does this for the Claude preview server.)

After any change, verify in the browser — **test at 375px and desktop**, check for
console errors, and run the regression set:

1. **Persona quick-fill** — home → each of the 4 persona buttons → correct band
   (P1 professional_review · P2 attention · P3 no-elevated-factor · P4 urgent pathway)
2. **Factor card** → tap one on the result page → explanation modal opens
3. **Deep link** — `?p=clinics` loads the clinic finder directly
4. **ก+ big-text toggle** — scales the UI and persists across reload
5. **Consent gate** — cannot start the assessment without all 3 required boxes

Engine logic can also be checked headlessly (it exports for Node):
`node -e "..."` loading `js/data.js` + `js/engine.js` and asserting persona outcomes.

Caching note: the browser aggressively caches these static files — hard-refresh
(Ctrl+Shift+R) or `fetch(url, {cache:'reload'})` after edits, or you will verify stale code.

Deploy = `git push` (GitHub Pages serves `main`, live ~1 min later).
Real LINE login needs HTTPS, so localhost always runs in browser/demo mode.

## Architecture in one breath

`index.html` = shell (LIFF SDK, header, bottom nav). `js/data.js` = questions (`STEPS`),
risk rules (`RULES`), bands, demo facilities/articles/personas — this is the "database".
`js/engine.js` = `evaluateRisk()` + `symptomPathway()`, the explainable rule engine.
`js/app.js` = hash router + every screen + `localStorage` state. `js/liff.js` = the LINE
layer (init, login, profile, shareTargetPicker, `?p=` deep-link routing, failure
fallback). `line/` = Official Account kit (menu image, installer, Flex templates).

Each file maps 1:1 onto its future production counterpart (see README) so the prototype
can be ported to Next.js + Supabase without redesigning the model.

## Costs & quotas (stay free)

GitHub Pages, LINE Login channel, LIFF, Official Account and rich menu are all free.
Menu taps open the app directly and cost nothing. LINE's free tier limits **push**
messages (~300/mo) — build on replies and menu taps; never add broadcast volume without
checking the quota math first.

## Conventions

- Vanilla JS only, no frameworks or build tooling — keep it a single static app.
- Thai-first copy; emoji section markers shared with the LINE messages (🫁 ✅ 📊 📚 🏥 🔔).
- `--var` CSS palette; teal = trust, amber = attention, **red only for the urgent symptom
  pathway** (never as a brand colour).
- Minimum body text 16px, tap targets ≥48px (58px in big-text mode).
- User-visible name is "รู้ทันปอด" / "LungLens"; internal ids may stay English.
- The owner prefers being walked through phone-side verification — end LINE-related
  changes with a short "try this on your phone" checklist.
