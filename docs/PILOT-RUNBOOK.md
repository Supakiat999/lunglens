# LungLens controlled-pilot runbook

Last updated: 2026-07-29

This is a preparation template, not permission to begin a pilot. The sponsor must obtain
clinical, privacy, legal, facility and ethics approvals that apply to the chosen setting.

## 1. Define the pilot

- Sponsor and accountable organization:
- Clinical-governance lead:
- Privacy/data controller:
- Participating facility or community setting:
- Intended participants and exclusion criteria:
- Supported languages and accessibility needs:
- Start/end dates:
- Maximum enrolment:
- Exact product commit and engine version:
- Primary learning questions:
- Explicitly prohibited uses:

The prototype result must not be used to diagnose, estimate cancer probability, declare
someone safe, determine automatic LDCT eligibility, or replace symptom assessment.

## 2. Entry criteria

Do not enrol the first participant until all are evidenced:

- production-readiness gates applicable to the pilot are approved;
- participant information and consent are approved;
- all facility information is verified;
- support and clinical escalation are staffed during pilot hours;
- referral delivery and acknowledgment have been tested end to end;
- stop, correction and deletion controls have been tested;
- monitoring and incident contacts are active;
- staff have passed scenario-based training;
- iOS, Android and browser checks have passed on the supported matrix;
- a restore test proves backups can be recovered;
- a tabletop exercise covers a missed referral, privacy incident and unsafe message.

## 3. Staff scenarios

Every operator should demonstrate:

1. Explain what LungLens is and is not in plain Thai and English.
2. Help a person use the site without LINE login.
3. Respond when a person reports an urgent symptom.
4. Explain that Bangkok, pollution or age alone does not produce a higher factor band.
5. Correct or cancel a referral without deleting its audit history.
6. Process consent withdrawal and a data request.
7. Handle a lost device or shared-device concern.
8. Escalate a complaint, possible harm, missing referral or privacy event.
9. Avoid putting health details in LINE previews or ordinary chat.
10. Stop the workflow when the system status is uncertain.

## 4. Participant checks

Collect the minimum information needed to answer approved pilot questions. Useful
non-clinical checks include:

- could the participant explain the result was not a diagnosis;
- could they identify the next appropriate action;
- did language switching preserve progress;
- could they find privacy, data deletion and emergency guidance;
- did any wording cause fear, false reassurance or confusion;
- did the participant need help because of literacy, vision, motor or device barriers;
- did any referral reach the named receiving team and receive acknowledgment within target.

Do not collect identifiable free-text health stories unless the approved protocol requires
them and provides a protected collection method.

## 5. Safety and stop criteria

Pause new enrolment and notify the accountable leads when any of these occurs:

- a user interprets a result as a diagnosis or guarantee and the misunderstanding cannot be corrected;
- urgent symptom guidance fails to appear or routes incorrectly;
- a real referral is lost, duplicated, delivered to the wrong organization or not acknowledged;
- health information appears in a LINE preview, analytics event or unauthorized log;
- unauthorized access, secret exposure or suspected breach occurs;
- facility information is found to be materially wrong;
- the live engine differs from the approved version;
- support or escalation staffing is unavailable;
- a clinician, privacy lead or sponsor invokes a safety stop.

Record the event, contain it, preserve necessary audit evidence, communicate honestly,
correct the cause, retest and obtain a documented restart decision.

## 6. Exit report

The pilot report must include:

- versions and dates actually used;
- number approached, started and completed, using privacy-preserving aggregation;
- usability and accessibility findings;
- safety events, near misses and complaints;
- referral delivery and response performance;
- consent withdrawals and data requests;
- deviations from protocol;
- unresolved risks and required product changes;
- named clinical, privacy, operational and sponsor go/no-go decisions.

Successful software tests alone do not make the pilot successful. The exit decision must
show that real people understood the boundaries and that every operational hand-off worked.
