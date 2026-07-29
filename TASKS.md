# TASKS.md — LungLens / รู้ทันปอด roadmap

Last reviewed: **2026-07-29**

Status legend:

- ✅ Completed and verified
- 📱 Needs a real LINE phone/device check
- 🔜 Recommended next product work
- 🟡 Improvement or polish
- 🧱 Requires backend or operational infrastructure
- 🩺 Requires clinical, legal, privacy, or content-owner approval
- 💡 Optional future idea

> **Current position:** LungLens is a working bilingual prototype, not a production
> healthcare service. The public website, LIFF app, Official Account, Messaging API,
> bilingual greeting, and six-button rich menu are live. Medical rules, facilities,
> referrals, provider operations, and several content areas are still demonstrations.

## What is already live ✅

- ✅ Public GitHub Pages website: https://supakiat999.github.io/lunglens/
- ✅ Public browser access without a LINE account or LINE login
- ✅ LIFF app: `2010756823-yiuPlaT0`
- ✅ LINE Official Account **LungLens**, Basic ID `@794hkqhs`
- ✅ Messaging API channel `2010852424` under provider **Longview**
- ✅ Auto-response is OFF
- ✅ English-first bilingual greeting with a non-diagnostic disclaimer
- ✅ 2500×1686 bilingual rich menu installed and set as the default
- ✅ All six rich-menu URLs respond successfully
- ✅ Complete Thai/English switching for every public user route
- ✅ Thai canonical stored answers preserved so language changes cannot alter risk results
- ✅ Landing → consent → assessment → symptom pathway → result journey
- ✅ Assessment autosave, resume, four demo personas, and big-text mode
- ✅ v0.2 review-before-submit screen with per-question editing
- ✅ v0.2 grouped-field and numeric-range validation with hidden-answer cleanup
- ✅ v0.2 skip link, route-heading focus, modal focus restoration, progress ARIA,
  accessible factor controls, active-navigation state, and stronger visible focus
- ✅ v0.2 safer saved-state hydration, non-destructive storage-error handling, and cache busting
- ✅ v0.2 responsive phone header verified at 375px and desktop width
- ✅ v0.3 removed province, demo PM2.5, and age-only scoring so Bangkok or age alone
  cannot change a user's factor band
- ✅ v0.3 added former-smoker quit timing and a separate educational LDCT context based
  on age together with smoking exposure
- ✅ v0.3 retires saved v1 results safely while preserving answers for reassessment
- ✅ v0.3 makes all clinic/referral actions explicitly demonstrational and states that
  no hospital or staff member receives a request
- ✅ v0.4 adds all 77 provinces and live station-level Air4Thai PM2.5/PM10/AQI data
- ✅ v0.4 keeps pollution outside factor scoring and LDCT screening eligibility
- ✅ v0.4 adds a labelled Open-Meteo/CAMS fallback, freshness/error states, and sources
- ✅ v0.4 completes all 12 bilingual education topics with authoritative references,
  content versions, review status, reading times, and search
- ✅ v0.5 embeds current province pollution in results and the PM2.5 article, connects
  factor explanations to sourced education, adds connection recovery and remaining-question
  counts, documents device-only data flow, and removes internal points from confirmed exports
- ✅ v0.6 adds a responsive next-24-hours PM2.5 model chart and cautious trend wording
  while keeping official Air4Thai station readings visibly separate and primary
- ✅ v0.7 adds explicit-permission nearest-Air4Thai-station sorting with local-only,
  session-memory coordinates and straight-line distance labels
- ✅ v0.8 adds rolling 48-hour official station-measurement history, keeps it separate
  from the CAMS forecast, adds bilingual inline assessment errors, and opens first visits
  in English while remembering each user's language choice
- ✅ v0.9 adds a four-question result explanation, makes excluded and unassessed
  information explicit, improves resume/shared-device guidance, and strengthens
  clinic/referral demo warnings and local deletion controls
- ✅ v0.10 adds dialog focus containment, keyboard-accessible storyboard/article cards,
  explicit referral/reminder labels, 320px reflow checks, and an explanation of why a
  future result may change without implying disease progression
- ✅ v0.11 makes optional consent and reminder controls explicitly browser-only,
  versions new consent as `consent_v2`, adds an announced required-consent error,
  removes the placeholder support email, and avoids implying live staff/research services
- ✅ v0.12 adds a pure saved-state recovery layer, sanitises invalid answers/results,
  bounds local records, preserves answers when retiring old engine results, enforces
  consent on assessment deep links, and normalises unknown routes
- ✅ Explainable prototype risk engine with symptoms kept outside scoring
- ✅ Education, clinic finder, referral, profile, privacy, provider demo, and presentation routes
- ✅ Privacy-safe LINE sharing copy that does not include the user's health result in previews
- ✅ JavaScript syntax checks
- ✅ Regression checks for all four personas, incomplete answers, exclusive options,
  model version, clinical-validation status, and unchanged result bands
- ✅ English-coverage test for public canonical data and interface copy
- ✅ Source and documentation pushed to GitHub `main`

## Recommended order of work

1. 📱 Complete the real-phone LINE check and collect the add-friend link/QR code.
2. 🔜 Continue human review of English and Thai health-literacy wording.
3. 🔜 Fix the remaining public-app accessibility gaps.
4. 🩺 Obtain clinical, content, facility, privacy, and legal review.
5. 🧱 Build the backend, real referrals, secure LINE webhook, and provider authentication.
6. 🔜 Run a controlled pilot before any public healthcare promotion.

## 1 — Immediate LINE and launch checks

- [ ] 📱 Add `@794hkqhs` as a friend on a real phone.
- [ ] 📱 Confirm the bilingual greeting appears for a newly added friend.
- [ ] 📱 Confirm the rich menu opens automatically and remains readable on a small phone.
- [ ] 📱 Tap all six rich-menu tiles inside LINE:
  - [ ] Assess risk → `?p=begin`
  - [ ] My result → `?p=result`
  - [ ] Learn → `?p=education`
  - [ ] Clinics → `?p=clinics`
  - [ ] Reminders → `?p=profile`
  - [ ] Help → `?p=home`
- [ ] 📱 Confirm LIFF login, browser fallback, back navigation, and reopening the chat.
- [ ] 📱 Confirm no assessment result or health detail appears in a LINE share preview.
- [ ] 📱 Confirm Thai and English text on the menu is readable without zooming.
- [ ] 📱 Test the account on both iOS and Android if possible.
- [ ] 🔜 Create or collect the permanent add-friend URL (`https://lin.ee/...`).
- [ ] 🔜 Export and save the Official Account QR code for campaign materials.
- [ ] 🟡 Add a polished OA profile image that matches the LungLens visual identity.
- [ ] 🟡 Add an English-first status message and concise account description.
- [ ] 🟡 Add the public website and privacy-page links to the OA business profile.
- [ ] 🟡 Review the OA profile, greeting, rich menu, and business profile as a new user.
- [ ] 🟡 Consider applying for LINE account verification only after governance review.
- [ ] 🔜 Record who owns the OA, who can administer it, and how access is recovered.
- [ ] 🔜 Establish a safe schedule for rotating the Messaging API token.

## 2 — Language and content experience

- [x] ✅ Default-language rule decided:
  - [ ] Keep Thai as the default, matching the original product plan; or
  - [x] ✅ Make English the first-visit default, matching the account preference, and
    remember an existing user's explicit Thai/English choice.
  - [ ] Use the browser/LINE locale on first visit and remember the user's choice.
- [x] ✅ Keep the Thai/English switch visible in the header from the first visit.
- [ ] 🔜 Review every English screen for natural, consistent international English.
- [ ] 🔜 Review every Thai screen for clarity, tone, spelling, and health literacy.
- [ ] 🔜 Create a terminology guide for repeated words such as risk factor, result,
  assessment, referral, clinic, symptom, consent, and reminder.
- [ ] 🔜 Confirm English date, number, province, and time formatting on every public route.
- [ ] 🔜 Confirm language switching in the middle of an assessment never loses answers.
- [ ] 🔜 Confirm language switching preserves consent, result, filters, referral state,
  reminder settings, big-text mode, and deep-link destination.
- [ ] 🟡 Translate the provider dashboard after its workflows and terminology are approved.
- [ ] 🟡 Translate the presentation-only route if it will be used with English-speaking partners.
- [ ] 🟡 Add a content-version field and last-reviewed date to public medical content.
- [ ] 🟡 Add reviewer names/roles only after real reviewers approve publication.

## 3 — Public assessment improvements

- [x] ✅ Add a review-before-submit screen so users can inspect and change every answer.
- [ ] 🔜 Expand inconsistent-answer checks:
  - [x] ✅ Remove hidden smoking, second-hand-smoke, and occupational details when the
    controlling answer changes
  - [x] ✅ Enforce mutually exclusive multi-select options and validate required grouped fields
  - [ ] End year earlier than start year
  - [x] ✅ Reject numeric smoking details outside their configured ranges
- [x] ✅ Add clear inline validation messages in both languages and move focus to the
  field that needs attention.
- [x] ✅ Improve the smoking-detail numeric inputs with whole-number keyboards, bounds,
  range guidance, and whole-number validation. Age and exposure duration intentionally
  remain canonical ranges rather than exact identifying values.
- [x] ✅ Add the full list of 77 Thai provinces.
- [ ] 🔜 Add district/subdistrict selection where operationally necessary.
- [ ] 🔜 Add Thai postcode validation and province/postcode consistency checks.
- [x] ✅ Explain why province is requested before the user enters it and state that it
  never changes the factor band or LDCT screening context.
- [ ] 🔜 Add an explicit “I do not know” path for questions where uncertainty is common.
- [ ] 🔜 Review every exclusive option and conditional step with real users.
- [x] ✅ Add a clear progress estimate and remaining-question count.
- [x] ✅ Allow users to return to the previous question while preserving relevant
  answers; clearly explain that newly irrelevant conditional answers are removed.
- [x] ✅ Add a compact completion/remaining/current-section summary when resuming an
  unfinished assessment.
- [x] ✅ Add shared-device guidance before assessment, on resume, and in privacy copy.
- [ ] 🟡 Improve recovery after a browser refresh, failed LIFF initialization, or lost connection.
- [ ] 🟡 Add optional print-friendly results without exposing sensitive data by default.
- [ ] 🩺 Review the urgent symptom list and the Thailand 1669 wording with a clinician.
- [ ] 🩺 Review whether any answer should trigger advice independently of the prototype score.

## 4 — Results and safety communication

- [ ] 🩺 Clinically review all 17 rules, prototype weights, thresholds, and result bands.
- [ ] 🩺 Confirm that every rule explanation accurately matches its evidence.
- [ ] 🩺 Confirm the “what to do next” guidance is appropriate and non-diagnostic.
- [ ] 🩺 Review age, smoking, family-history, occupational, household, screening-context,
  and PM2.5 education wording.
- [ ] 🩺 Confirm Band B never reassures users that they are “safe” or “low risk.”
- [ ] 🩺 Confirm no result implies cancer probability, diagnosis, or automatic LDCT eligibility.
- [ ] 🩺 Confirm symptoms remain separate from the risk calculation.
- [ ] 🔜 Add a visible model/rule version and content-review date to exported results.
- [x] ✅ Export the model version and an explicit `pending_medical_review` status with
  a null review date until a real reviewer signs off.
- [x] ✅ Make “not assessed” factors easier to understand with a collapsed explanation
  and explicit non-reassuring safety wording.
- [x] ✅ Add a clearer path from each factor to relevant sourced education, questions
  for a healthcare professional, and the explicitly demonstrational clinic route.
- [x] ✅ Add a user-friendly explanation of how corrected/new factor answers, new
  symptoms, or a future reviewed rule version can change what is shown, while stating
  that this does not prove disease progression.
- [ ] 🟡 Improve the factor modal layout on very small screens.
- [ ] 🟡 Add print and screen-reader checks for result explanations.
- [x] ✅ Add a safe “questions to ask a healthcare professional” section and link to
  the full sourced preparation guide.

## 5 — Education centre

- [ ] 🩺 Medically review the four existing drafted articles.
- [x] ✅ Replace placeholder references with real, current, authoritative sources.
- [x] ✅ Write the remaining eight education articles as sourced bilingual drafts.
- [ ] 🩺 Medically review all 12 education articles.
- [ ] 🩺 Add named medical-review roles, review dates, and content versions.
- [ ] 🩺 Define a process for revising or withdrawing outdated medical content.
- [x] ✅ Add search across article titles, summaries, and topics.
- [x] ✅ Remove outline placeholders now that every topic has an article.
- [ ] 🔜 Link assessment factors to the most relevant reviewed articles.
- [x] ✅ Link assessment factors to the most relevant sourced drafts with a visible
  pending-medical-review label; retain the item above until clinical review is complete.
- [ ] 🔜 Add a “last medically reviewed” field to each complete article.
- [x] ✅ Add reading-time estimates.
- [ ] 🟡 Add font-size, line-height, and long-article readability testing.
- [x] ✅ Add a source list that remains understandable to non-specialists.
- [ ] 🟡 Add simple illustrations only after their medical meaning is reviewed.
- [ ] 🟡 Consider audio or read-aloud support for users with lower literacy.

## 5A — Live air-quality data

- [x] ✅ Fetch, sanitise, and validate the official Air4Thai public station feed.
- [x] ✅ Show province overview, reporting-station count, range, median, station reading,
  observation time, source, and limitations.
- [x] ✅ Keep a static validated snapshot so a temporary live-data failure does not break the app.
- [x] ✅ Add an hourly GitHub Actions updater on the `air-quality-data` branch.
- [x] ✅ Verify the updater in GitHub Actions and confirm that it publishes a fresh,
  validated 174-station snapshot with TLS certificate verification enabled.
- [x] ✅ Add a clearly labelled Open-Meteo/CAMS model fallback when no station reports PM2.5.
- [x] ✅ Add tests for Thai PM2.5 bands, station/province matching, official snapshots,
  model fallback, and unchanged screening safety.
- [x] ✅ Add station-distance sorting only after explicit location permission; keep
  coordinates in page memory only and provide an immediate clear control.
- [x] ✅ Add a 24-hour CAMS Global model chart and cautious trend wording, clearly
  separated from official station measurements and personal risk.
- [x] ✅ Publish and verify a rolling 48-hour official Air4Thai station-measurement
  history, with retention, deduplication, stale-data handling, and a separate chart.
- [ ] 🧱 Add monitoring/alerting when the hourly snapshot workflow fails repeatedly.
- [ ] 🩺 Review PM2.5 activity guidance and vulnerable-group wording with a Thai clinician.

## 6 — Clinics and healthcare navigation

- [ ] 🩺 Replace all six demo facilities with verified real facilities.
- [ ] 🩺 Confirm each facility's official name, type, address, province, and coordinates.
- [ ] 🩺 Confirm phone numbers, opening hours, referral requirements, and service availability.
- [ ] 🩺 Verify whether LDCT or lung-health services are actually offered before displaying them.
- [ ] 🩺 Define who is responsible for rechecking facility data and how often.
- [ ] 🔜 Add the full province/district coverage needed for the intended pilot.
- [ ] 🔜 Add real call and map actions with clear user confirmation.
- [ ] 🔜 Add travel/accessibility information where verified.
- [ ] 🔜 Add filters for public/private status, service type, accessibility, and referral needs.
- [ ] 🔜 Add “information last verified” dates.
- [ ] 🔜 Provide a correction/reporting path for inaccurate facility information.
- [ ] 🟡 Add distance sorting only with explicit location permission.
- [ ] 🟡 Add alternatives when no suitable facility is found nearby.
- [x] ✅ Add a plain-language explanation that listing does not equal endorsement or
  confirm LDCT availability, plus a pre-contact verification checklist.

## 7 — Referrals and reminders

- [ ] 🧱 Replace the demo referral form with a real secure submission endpoint.
- [ ] 🧱 Decide which organization receives referrals and who is accountable for follow-up.
- [ ] 🧱 Implement the approved referral status workflow and status history.
- [ ] 🧱 Add assignment, acknowledgement, escalation, cancellation, and closure rules.
- [ ] 🧱 Add safe user notifications that never reveal health details in previews.
- [ ] 🧱 Add consent checks before every referral or reminder message.
- [ ] 🧱 Implement reminders with opt-in, frequency, time, pause, resume, and stop controls.
  - [x] ✅ Keep current reminder scheduling visibly demonstrational and browser-only;
    no LINE message, live opt-in event, or delivery claim is produced.
- [ ] 🧱 Design reminders around replies and menu taps to respect LINE's free-tier quota.
- [ ] 🧱 Add retry, dead-letter, duplicate-prevention, and delivery-status handling.
- [ ] 🔜 Define expected response times and what users should do if nobody contacts them.
- [x] ✅ Add a clear emergency disclaimer so demo referrals are never used for urgent care.
- [ ] 🔜 Add user-visible cancellation and correction flows:
  - [x] ✅ Delete/cancel a device-only demo request with an explicit no-hospital-impact warning.
  - [ ] Add correction and cancellation to the future live referral service.
- [ ] 🩺 Review referral eligibility, wording, escalation, and duty-of-care responsibilities.
- [ ] 🩺 Review reminder content for clinical safety and privacy.

## 8 — LINE bot and Messaging API

- [ ] 🧱 Build a server-side LINE webhook endpoint.
- [ ] 🧱 Verify `X-Line-Signature` for every webhook request.
- [ ] 🧱 Store and deduplicate `webhookEventId` values.
- [ ] 🧱 Handle follow, unfollow, message, postback, redelivery, and error events.
- [ ] 🧱 Add server-side LINE ID-token verification; never trust the client profile alone.
- [ ] 🧱 Implement approved intents for assessment, result, education, clinics, reminders,
  privacy, help, and contact support.
- [ ] 🧱 Add a fixed non-diagnostic fallback response for unsupported questions.
- [ ] 🧱 Connect the privacy-safe Flex Message templates.
- [ ] 🧱 Add quota monitoring, rate limits, retry rules, and alerting.
- [ ] 🧱 Store tokens and channel secrets in a managed secret store, not source files.
- [ ] 🧱 Add separate development/staging and production LINE configurations.
- [ ] 🔜 Document token rotation, revocation, incident response, and administrator removal.
- [ ] 🩺 Approve every automated health-related reply before enabling it.
- [ ] 🩺 Prohibit open-ended AI-generated medical advice unless a reviewed governance model exists.

## 9 — Backend, accounts, and data

- [ ] 🧱 Confirm the production architecture and hosting responsibilities.
- [ ] 🧱 Port the static SPA to the selected maintainable application framework if needed.
- [ ] 🧱 Create the production database and version-controlled migrations.
- [ ] 🧱 Implement users, consent records, assessments, answers, versioned results, referrals,
  facilities, provider users, provider notes, content, message preferences/events,
  webhook events, organizations, and audit logs.
- [ ] 🧱 Add row-level security and organization isolation.
- [ ] 🧱 Add provider authentication, session expiry, account recovery, and MFA.
- [ ] 🧱 Implement roles for Navigator, Clinical reviewer, Content editor,
  Programme manager, and Super admin.
- [ ] 🧱 Keep old results tied to the exact rules and content version that generated them.
- [ ] 🧱 Encrypt sensitive provider notes and secrets.
- [ ] 🧱 Add database backups, restore testing, and migration rollback procedures.
- [ ] 🧱 Add data retention, deletion, pseudonymisation, and legal-hold rules.
- [ ] 🧱 Add structured audit logs for every sensitive provider action.
- [ ] 🧱 Add monitoring for application errors, webhook failures, and referral delays.
- [ ] 🧱 Add privacy-conscious analytics with low-count suppression.
- [ ] 🧱 Separate demo data from staging and production data.
- [ ] 🧱 Add environment-specific configuration and secret management.
- [ ] 🔜 Remove or consolidate duplicate root-level helper/test assets after confirming
  which copies are authoritative.

## 10 — Provider dashboard and operations

- [ ] 🧱 Replace the demo role switcher with real provider authentication.
- [ ] 🧱 Add organization-scoped case and referral queues.
- [ ] 🧱 Add assignment, owner, priority, due date, and escalation controls.
- [ ] 🧱 Add safe provider notes with edit history and audit trails.
- [ ] 🧱 Add a real referral-status workflow with permitted transitions.
- [ ] 🧱 Add search, filters, pagination, and export permissions.
- [ ] 🧱 Add content-management workflow: draft → medical review → approved → published → retired.
- [ ] 🧱 Add risk-rule workflow: draft → clinical review → approved → active → inactive.
- [ ] 🧱 Add two-person approval for safety-critical rule changes.
- [ ] 🧱 Add dashboards with privacy-preserving aggregation and low-count suppression.
- [ ] 🔜 Define provider onboarding, training, access review, and offboarding procedures.
- [ ] 🔜 Define support ownership and escalation for user complaints or safety concerns.
- [ ] 🟡 Translate the provider dashboard after its operational terminology is finalized.

## 11 — Privacy, consent, legal, and governance

- [ ] 🩺 Obtain legal/PDPA review of consent, privacy notice, disclaimers, and data controls.
- [ ] 🩺 Identify the data controller, processors, purposes, lawful bases, and contact channel.
- [ ] 🩺 Create a data inventory and data-flow map.
- [ ] 🩺 Define retention periods for assessments, referrals, messages, logs, and backups.
- [ ] 🩺 Define consent withdrawal consequences and operational handling.
- [ ] 🩺 Review export and deletion flows for legal and safety requirements.
- [ ] 🩺 Create terms of use and an accessible privacy notice for production.
- [ ] 🩺 Create a breach-response and user-notification process.
- [ ] 🩺 Define governance for rule, content, facility, and message changes.
- [ ] 🩺 Define an adverse-event or unsafe-content reporting process.
- [ ] 🩺 Complete a privacy/security impact assessment before a real pilot.
- [ ] 🔜 Add version numbers and effective dates to consent and privacy documents.
- [x] ✅ Add a version and update date to the prototype privacy draft; production
  effective dates remain pending legal approval.
- [ ] 🔜 Add a real privacy/support contact instead of prototype placeholders.
  - [x] ✅ Remove the placeholder email from the public interface and state that no
    operational contact channel or response time exists yet.
- [x] ✅ Document which current prototype data stays only on the device and which
  limited requests leave it.
- [ ] 🔜 Confirm analytics never collect assessment answers or identifiable health information.

## 12 — Accessibility and inclusive design

- [ ] 🔜 Test every public route with keyboard-only navigation.
- [ ] 🔜 Test with at least one Windows and one mobile screen reader.
- [x] ✅ Move focus to the page heading after route changes and restore focus after modals.
- [ ] 🔜 Add or verify accessible names for every remaining button, icon, form field, alert, and modal.
  - [x] ✅ Add explicit label connections for referral preferences and reminder frequency.
  - [x] ✅ Convert the campaign storyboard and education cards from mouse-only elements
    to keyboard-operable controls with accessible names.
  - [x] ✅ Keep Tab/Shift+Tab inside dialogs, support Escape, and restore launch-control focus.
- [ ] 🔜 Verify error messages are announced and linked to their inputs.
  - [x] ✅ Assessment and required-consent errors use linked inline alerts and receive focus.
- [ ] 🔜 Verify color contrast in normal and big-text modes.
- [ ] 🔜 Verify 200% zoom, text reflow, landscape mode, and narrow phone widths.
- [ ] 🔜 Verify tap targets and spacing for older users and users with limited dexterity.
- [ ] 🔜 Verify reduced-motion behavior.
- [ ] 🔜 Ensure Thai and English screen-reader pronunciation is reasonable.
- [x] ✅ Add a visible-on-focus skip link and clearer focus indicators.
- [ ] 🟡 Test with slow connections, older devices, and high-latency LINE WebViews.
- [ ] 🟡 Conduct usability sessions with people from the actual target audience.

## 13 — Reliability, performance, and offline behavior

- [x] ✅ Add a visible offline/unstable-connection state and retry controls.
- [ ] 🔜 Prevent data loss when the browser or LIFF view closes unexpectedly:
  - [x] ✅ Autosave canonical answers and verify partial assessment recovery after refresh.
  - [ ] Verify forced LINE WebView closure and low-storage behavior on real phones.
- [x] ✅ Add safe cache-busting/versioning so users do not receive stale JavaScript.
- [x] ✅ Define and test behavior when local storage is disabled, full, corrupted, or
  cleared: use safe defaults, preserve unreadable raw data, disable further writes in
  that session, and keep the in-memory journey available with a warning.
- [x] ✅ Hydrate valid older `lunglens-v1` data safely and avoid overwriting unreadable data.
- [ ] 🔜 Add graceful handling for LIFF SDK timeouts and blocked third-party scripts.
- [ ] 🟡 Optimize initial load, image weight, and JavaScript execution for low-cost phones.
- [ ] 🟡 Measure Core Web Vitals at phone and desktop sizes.
- [ ] 🟡 Consider a service worker only after medical-content update behavior is safe.
- [ ] 🟡 Add non-sensitive error monitoring with source maps protected appropriately.
- [ ] 🟡 Add a deployment smoke test for the public URL and six LIFF routes.
- [x] ✅ Add a visible application version for troubleshooting.

## 14 — Automated and manual testing

- ✅ Engine regression tests for four personas, incomplete answers, and exclusive schemas.
- ✅ English canonical-data coverage test.
- ✅ JavaScript syntax checks.
- [ ] 🔜 Add unit tests for every risk rule boundary and conditional question.
- [x] ✅ Add tests proving symptoms never affect the prototype score or factor band.
- [ ] 🔜 Add tests proving language switching never changes canonical answers or bands.
- [x] ✅ Add deterministic recovery tests for corrupted, old, empty, full/disabled, and
  partially complete stored state, plus browser integration checks for partial/current
  result refresh, consent-gated deep links, invalid routes, language, and big-text state.
- [ ] 🔜 Add end-to-end tests for every public route in Thai and English.
- [ ] 🔜 Add end-to-end tests for consent, urgent symptoms, result modals, clinics,
  referrals, profile, export, delete, reminders, big-text mode, and deep links.
- [ ] 🔜 Add automated checks that health results never appear in LINE share previews.
- [x] ✅ Add automated checks that health results never appear in LINE invitation copy;
  actual native preview verification remains part of the real-phone test.
- [ ] 🔜 Add automated accessibility scans plus manual screen-reader testing.
- [ ] 🔜 Add visual regression tests at narrow phone, standard phone, tablet, and desktop sizes.
- [ ] 🔜 Add cross-browser tests for Chrome, Safari/iOS, Android WebView, and LINE WebView.
- [ ] 🔜 Add security tests for webhook signatures, auth, authorization, RLS, and rate limits.
- [ ] 🔜 Add backup/restore and migration tests before production data exists.
- [ ] 🟡 Add a documented release checklist and rollback test.

## 15 — Design and product improvements

- [ ] 🟡 Conduct a complete mobile visual-polish pass after real-phone testing.
- [ ] 🟡 Improve spacing, typography, card hierarchy, and long-form readability.
- [ ] 🟡 Standardize button labels, icon usage, empty states, and success/error messages.
- [ ] 🟡 Improve loading, disabled, empty, offline, and error states.
- [ ] 🟡 Add clearer navigation between results, education, clinics, and profile.
- [ ] 🟡 Add a consistent way to return home from deep links.
- [ ] 🟡 Add a contact/support path with response expectations.
- [ ] 🟡 Add structured user feedback after the assessment without collecting health details.
- [ ] 🟡 Add privacy-safe product analytics for drop-off and completion rates.
- [ ] 🟡 Review whether demo-persona controls should be hidden outside demos.
- [ ] 🟡 Move provider and presentation routes behind an explicit demo/admin entry point.
- [ ] 🟡 Create a lightweight design system/reference page for future contributors.
- [ ] 🟡 Add branded favicons, social preview image, OA profile image, and consistent metadata.
- [ ] 🟡 Review the tagline and campaign wording with target users.

## 16 — Pilot and production-readiness gates

- [ ] 🩺 Clinical validation and documented sign-off completed.
- [ ] 🩺 Legal/PDPA review and privacy documentation completed.
- [ ] 🩺 All public medical content reviewed and versioned.
- [ ] 🩺 All displayed facilities verified and assigned an update owner.
- [ ] 🧱 Real referrals, provider access, audit logs, monitoring, and backups operational.
- [ ] 🔜 Security review and remediation completed.
- [ ] 🔜 Accessibility review and remediation completed.
- [ ] 🔜 Device/browser/LINE WebView test matrix passed.
- [ ] 🔜 Support, incident, escalation, and rollback procedures documented.
- [ ] 🔜 Pilot scope, participating organizations, success measures, and stop criteria approved.
- [ ] 🔜 Staff training and user-support materials completed.
- [ ] 🔜 Soft launch completed with a small controlled group.
- [ ] 🔜 Pilot feedback reviewed before any wider promotion.

## 17 — Campaign and adoption materials

- [ ] 🟡 Create a QR poster using the permanent OA add-friend link.
- [ ] 🟡 Create square, story, horizontal, and LINE broadcast assets.
- [ ] 🟡 Create a simple community-health-worker handout.
- [ ] 🟡 Create a one-page partner/clinic explanation of what LungLens is and is not.
- [ ] 🟡 Create a short bilingual demonstration video with captions and transcript.
- [ ] 🟡 Add clear non-diagnostic wording to every campaign asset.
- [ ] 🟡 Test campaign language with the intended audience before publication.

## 18 — Optional future research modules

These must remain disabled unless separate ethics, consent, security, and clinical
governance are established.

- [ ] 💡 Cough-audio research with separate consent and no diagnostic output.
- [ ] 💡 Breath VOC research module.
- [ ] 💡 Blood-biomarker research module.
- [ ] 💡 CXR-AI provider-side research module.
- [ ] 💡 LDCT-AI provider-side research module.
- [ ] 💡 Longitudinal research follow-up with explicit consent.
- [ ] 💡 Multilingual expansion beyond Thai and English.

## Safety rules that are never optional

- Symptoms stay separate from risk scoring.
- Never calculate or display a cancer probability.
- Never say a user is “safe” or automatically “low risk.”
- Never diagnose a disease.
- Never automatically recommend LDCT; frame it as a professional shared decision.
- Never expose assessment results or health details in LINE notification/share previews.
- Never treat demo facilities, rules, cases, analytics, or PM2.5 values as real.
- Never commit LINE tokens, channel secrets, patient data, or provider credentials.
- Never enable autonomous medical advice without approved clinical governance.
