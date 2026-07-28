/* =====================================================================
   LungLens privacy-safe portable data helpers.

   The prototype engine uses internal point weights only to select a band.
   Those implementation details must never appear in user-facing exports or
   LINE share previews.
   ===================================================================== */

function portableResult(result) {
  if (!result || typeof result !== "object") return null;
  return {
    assessment_status: result.assessment_status || null,
    band: result.band ? {
      key: result.band.key || null,
      label: result.band.label || null,
      summary: result.band.summary || null,
      action: result.band.action || null
    } : null,
    symptom_pathway: result.symptom_pathway || "standard",
    screening_context: result.screening_context ? {
      key: result.screening_context.key || null,
      label: result.screening_context.label || null,
      summary: result.screening_context.summary || null,
      action: result.screening_context.action || null
    } : null,
    factors: Array.isArray(result.factors) ? result.factors.map(factor => ({
      name: factor.name || null,
      explanation: factor.explain || null,
      next_step: factor.next || null,
      evidence_status: factor.evidence || null,
      rule_version: factor.version ?? null
    })) : [],
    generated_at: result.generated_at || null,
    model_version: result.model_version || null,
    clinical_validation_status: result.clinical_validation_status || null,
    content_review_status: "pending_medical_review",
    content_review_date: null
  };
}

function buildPortableExport(sourceState, {
  appVersion = "unknown",
  storageKey = "lunglens-v1",
  exportedAt = new Date().toISOString()
} = {}) {
  const source = sourceState && typeof sourceState === "object" ? sourceState : {};
  return {
    export_format: "lunglens-portable-v1",
    exported_at: exportedAt,
    app_version: appVersion,
    storage_key: storageKey,
    notice: "This file contains self-reported health information. Internal prototype scoring points are intentionally excluded.",
    language: source.lang === "en" ? "en" : "th",
    consent: source.consent || null,
    answers: source.answers && typeof source.answers === "object" ? structuredClone(source.answers) : {},
    current_result: portableResult(source.result),
    history: Array.isArray(source.history) ? source.history.map(item => ({
      at: item.at || null,
      band_key: item.bandKey || null,
      band_label: item.bandLabel || null,
      symptom_pathway: item.pathway || "standard",
      model_version: item.engine || null
    })) : [],
    demo_referrals: Array.isArray(source.referrals) ? structuredClone(source.referrals) : [],
    reminder_preferences: source.reminders && typeof source.reminders === "object"
      ? structuredClone(source.reminders) : null,
    local_event_log: Array.isArray(source.events) ? structuredClone(source.events) : []
  };
}

function buildShareInvite(lang, url) {
  return lang === "en"
    ? `I reviewed my lung-health risk factors 🫁 You can do it in just 2–3 minutes too — review your risk factors at: ${url}`
    : `ฉันเช็กปัจจัยเสี่ยงสุขภาพปอดแล้ว 🫁 คุณก็ใช้เวลาเพียง 2–3 นาทีได้เช่นกัน — เช็กความเสี่ยงเบื้องต้นได้ที่: ${url}`;
}

if (typeof module !== "undefined") {
  module.exports = { portableResult, buildPortableExport, buildShareInvite };
}
