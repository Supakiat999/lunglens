# LungLens production-readiness gates

Last updated: 2026-07-29

This document is the decision record for moving LungLens from a public prototype to a
real healthcare service. A feature being technically implemented is not evidence that a
clinical, legal or operational gate has passed.

## Status vocabulary

- **Prototype-ready** — implemented and tested, but not approved for healthcare use.
- **Ready for external review** — evidence pack is complete enough for a named reviewer.
- **Approved** — a named accountable reviewer signed a dated, version-specific record.
- **Operational** — the approved process is staffed, monitored and tested in the live environment.

## Launch gates

| Gate | Current state | Evidence required to pass | Accountable owner |
|---|---|---|---|
| Clinical rules and result wording | Prototype-ready | Review of all 17 rules, weights, thresholds, four bands, symptom separation and next-step wording against a frozen engine version | Named Thai-licensed clinician and clinical-governance lead |
| Education and PM2.5 content | Ready for external review | Article-by-article medical review with source, version, review date and expiry/re-review date | Named clinical content reviewer |
| Privacy and PDPA | Ready for external review | Data-flow map, lawful basis, consent wording, retention schedule, deletion process, processor list, breach plan and signed legal review | Thai privacy counsel and data controller |
| Facility directory | Prototype only | Written confirmation from each listed organization covering name, service, phone, hours, eligibility, referral requirements, update owner and review date | Directory operations owner plus facility representative |
| Referral service | Not built | Named receiving organization, secure endpoint, identity/access controls, status workflow, cancellation/correction, audit log, delivery monitoring and duty-of-care policy | Healthcare operations owner |
| Reminders and LINE messages | Not built | Approved message library, opt-in/stop controls, quota plan, webhook security, delivery monitoring and escalation rules | Messaging operations owner |
| User support | Not operational | Verified public channel, organization name, staffed hours, response target, emergency boundary, privacy script and complaint/escalation process | Support operations owner |
| Security | Not assessed | Threat model, access review, secret rotation, encryption, dependency review, logging rules, backup/restore test and incident exercise | Security owner |
| Accessibility | Prototype-tested | Manual keyboard/screen-reader/zoom/reflow review on the supported device matrix with recorded defects and retest evidence | Accessibility reviewer |
| Controlled pilot | Not started | Approved protocol, staff training, participant information, safety monitoring, stop criteria, outcome report and go/no-go decision | Pilot sponsor and clinical-governance lead |

No public healthcare promotion, real referral intake or automated health messaging should
start until every applicable gate is both **Approved** and **Operational**.

## Clinical review record

The reviewer must receive a frozen commit SHA and record:

- engine version and app version;
- every canonical question and answer;
- all conditional-question behavior and unknown/prefer-not-to-answer behavior;
- the 17 rules and prototype weights;
- all four result bands and every explanation;
- urgent and non-urgent symptom wording;
- educational LDCT context and the rule that the app never orders or guarantees LDCT;
- evidence that province, age alone and pollution never change the factor band;
- evidence that symptoms never change the factor score;
- all Thai and English public medical copy.

Approval record:

| Field | Value |
|---|---|
| Frozen commit SHA | |
| Engine version | |
| Reviewer name, registration and organization | |
| Scope reviewed | |
| Required changes | |
| Decision | Pending |
| Signed date | |
| Re-review date or trigger | |

## Privacy/PDPA review record

The data controller must be named before review. The reviewer should confirm:

- purpose and lawful basis for each data category;
- whether health data is collected by a future server and, if so, why it is necessary;
- consent separation for assessment, referrals, reminders, research and location;
- data-subject access, correction, deletion, restriction and complaint handling;
- retention periods for answers, results, referrals, messages, audit logs and backups;
- processor/subprocessor contracts and cross-border transfer controls;
- incident reporting, breach notification and recovery ownership;
- safe use on shared devices;
- privacy-safe LINE previews and logs;
- verified privacy contact and response target.

Approval record:

| Field | Value |
|---|---|
| Data controller | |
| Privacy notice version | |
| Consent version | |
| Reviewer and organization | |
| Decision | Pending |
| Signed date | |
| Effective date | |

## Facility verification record

Create one record per facility. Never copy a record from another facility.

| Field | Required value |
|---|---|
| Facility ID and official Thai/English name | |
| Official source URL | |
| Public phone and hours | |
| Province/district and map URL | |
| Public/private status | |
| Relevant respiratory/imaging services | |
| LDCT availability wording, if explicitly confirmed | |
| Eligibility and referral requirements | |
| Accessibility information | |
| Facility representative and directory owner | |
| Verified date and next review date | |
| Written permission/terms for publication | |

A failed re-verification must remove or visibly suspend the entry, not silently preserve
old information.

## Support operating record

Before publishing any support channel, record:

- responsible legal organization;
- channel and staffed hours;
- Thai and English response targets;
- what staff can and cannot answer;
- “not an emergency channel” script;
- privacy verification before discussing account data;
- clinical escalation and safeguarding route;
- complaint, correction and deletion route;
- outage message and continuity plan.

Until this record is complete, the public Help page must continue saying that no verified
support channel or guaranteed response time exists.

## Go/no-go rule

The launch decision must list each gate, its evidence link, owner and status. “No known
problem” is not approval. Missing evidence, an unnamed owner, an expired review, or an
untested operational process is a **no-go**.
