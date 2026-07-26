# HANDOVER — LungLens / รู้ทันปอด

**Read this first.** It assumes you know nothing about the project and have not seen any
prior conversation. Last updated **2026-07-26**.

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
| | The **PM2.5 area data** |
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
| LIFF ID | `2010756823-yiuPlaT0` (Full size · scopes `openid`+`profile` · shareTargetPicker on) |
| Hosting | GitHub Pages, branch `main`, root `/` — deploys ~1 min after push |

The GitHub Pages URL is a public, no-login entry point. Visitors do not need a LINE
account; LINE login remains an optional enhancement for profile and native sharing.

**Deep links** (used by the rich-menu buttons) — append `?p=` to the LIFF URL:
`begin` (assessment) · `result` · `education` · `clinics` · `profile` · `demo-story`
Example: `https://liff.line.me/2010756823-yiuPlaT0?p=clinics`

**Secrets:** there are none in this repo, by design. The LIFF ID is public (it appears in
every LIFF URL). The only secret — the **channel access token** — is issued by the owner
and passed as an environment variable at run time. **Never write it into a file.**

## 4. What's done ✅

- Full user journey: landing → consent (layered, nothing pre-checked) → 15-step
  assessment with autosave/resume → explainable result → clinic finder → referral +
  status timeline → personal data controls (export/delete/withdraw consent)
- **Explainable risk engine** — 18 versioned rules, each with a Thai explanation,
  a "what to do next", and an evidence-strength label. Symptoms are handled in a
  **separate pathway and are never scored**.
- Education centre (4 written articles + 12-category structure), provider dashboard demo
  (3 roles, case list, rules table, funnel analytics), 5-slide presentation mode
  (`?p=demo-story`)
- **Real LINE LIFF integration** — `liff.init()`, LINE Login, profile, native share
  picker, `?p=` deep links, and a graceful "open in browser" fallback if LINE fails
- **Accessibility for all ages** — the `ก+` button in the header scales the entire UI
  (fonts + tap targets) and remembers the choice
- **Complete public Thai/English UI** — the language switch covers landing, consent,
  assessment, results, education, clinics, referral, profile, privacy, LIFF states and
  safe sharing. Stored answers remain canonical Thai values so rules do not change.
- **Official Account kit, built and ready** — the 6-button menu image plus a one-command
  installer, tested end-to-end apart from the account itself. Menu labels are bilingual
  (large Thai + concise English).

## 5. 🟡 What's left — the one blocked step

**The LINE Official Account has not been created yet.** That's the account people "add as
a friend" so the 6 buttons appear at the bottom of their chat.

**Why it's blocked:** LINE has no API for creating an Official Account, and their signup
site cannot be automated. It requires the account owner to log in personally. This cannot
be delegated to a script or an assistant — only the owner can do it.

**How to finish it** — the full guide is [`line/OA-SETUP.md`](line/OA-SETUP.md). Summary:

1. Go to **https://manager.line.biz/** → log in → create an Official Account
   named **รู้ทันปอด**, category **Health**
   *(Or from the phone: LINE app → Home → Services → LINE Official Account)*
2. In OA Manager: **Settings → Messaging API → Enable** → choose provider **Longview**
3. In OA Manager: **Settings → Response settings → Auto-response = OFF**
   ⚠️ Critical — auto-response steals the reply token and silently breaks webhooks later
4. Go to https://developers.line.biz/console/ → the new **รู้ทันปอด** channel →
   **Messaging API** tab → **Issue** a channel access token → copy it
5. Run the installer:
   ```powershell
   cd "C:\Users\ASUS\OneDrive\Desktop\Astra Project\lunglens\line"
   $env:LINE_CHANNEL_ACCESS_TOKEN = "<paste the token>"
   node setup-richmenu.mjs
   ```
   This creates the menu, uploads `rich-menu.png`, and sets it as the default for every
   user. Expect three lines of output ending in "Done".
6. Open the รู้ทันปอด chat on a phone → the 6 buttons appear. Share the OA's
   **add-friend link** (`https://lin.ee/…`, found in OA Manager → Home → Add friends tools).

Optional but recommended: set the greeting message (text provided in `OA-SETUP.md`).

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
- `js/engine.js` — the rule evaluation + symptom pathway (the safety-critical logic)
- `js/app.js` — router and every screen
- `js/liff.js` — everything LINE-related
- `line/` — the Official Account kit

Deploying = `git push`. Nothing else.

## 7. Where to go next

[TASKS.md](TASKS.md) holds the phased backlog. The highest-value next items:

1. Finish the OA (section 5 above) — unblocks the whole "add friend → tap button" flow
2. Have a clinician review the 18 rules and the four result bands 🩺
3. Write the remaining 8 education articles with a medical reviewer 🩺
4. Replace demo facilities with verified real ones
5. Then Phase 3 — real backend (Next.js + Supabase) so results persist server-side and
   referrals reach actual staff

## 8. Cost

**Everything is free and stays free.** GitHub Pages (free), LINE Login channel + LIFF
(free), Official Account (free tier), rich menu (free). Buttons open the app directly and
consume **no** message quota. The only metered thing is *push* messages (~300/month free),
which this project does not currently send — a deliberate design choice: build on replies
and menu taps, never on broadcasts.
