/* =====================================================================
   LungLens — explainable prototype risk engine
   - Rule-based, transparent, configurable (see RULES in data.js)
   - NOT clinically validated. Never outputs a cancer probability.
   - Symptoms are handled as a SEPARATE pathway, never scored.
   ===================================================================== */

const REQUIRED_STEPS = ["AGE","SMOKE_STATUS","SHS_HOME","FAM_LC","MED_HISTORY","OCC_EXPOSED","COOK_FUEL","COOK_VENT","SYMPTOMS"];

function assessmentComplete(answers) {
  return REQUIRED_STEPS.every(id => {
    const v = answers[id];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

function symptomPathway(answers) {
  const s = answers.SYMPTOMS || [];
  if (s.includes("ไม่มีอาการข้างต้น") || s.includes("ไม่ต้องการตอบ") || s.length === 0) return "standard";
  const urgentList = (STEPS.find(x => x.id === "SYMPTOMS").urgent) || [];
  if (s.some(x => urgentList.includes(x))) return "urgent";
  return "prompt";
}

function evaluateRisk(answers) {
  const now = new Date();

  if (!assessmentComplete(answers)) {
    return {
      assessment_status: "incomplete",
      screening_context_band: "incomplete",
      band: BANDS.incomplete,
      symptom_pathway: symptomPathway(answers),
      factors: [], score: 0,
      missing: REQUIRED_STEPS.filter(id => {
        const v = answers[id];
        return v == null || (Array.isArray(v) && v.length === 0);
      }),
      generated_at: now.toISOString(),
      model_version: ENGINE_VERSION,
      clinical_validation_status: "not_clinically_validated"
    };
  }

  const factors = [];
  let score = 0;
  for (const rule of RULES) {
    if (rule.status !== "approved_for_prototype") continue;
    let hit = false;
    try { hit = !!rule.cond(answers); } catch (e) { hit = false; }
    if (hit) {
      factors.push({
        code: rule.code, name: rule.name, weight: rule.weight,
        explain: rule.explain, next: rule.next, evidence: rule.evidence,
        version: rule.version
      });
      score += rule.weight;
    }
  }

  let band;
  if (score === 0) band = BANDS.none;
  else if (score <= 3) band = BANDS.attention;
  else band = BANDS.review;

  const pathway = symptomPathway(answers);

  return {
    assessment_status: "completed",
    screening_context_band: band.key,
    band,
    symptom_pathway: pathway,
    factor_codes: factors.map(f => f.code),
    factors,
    score, // internal prototype points, never shown as a probability
    explanation_th: factors.map(f => f.explain),
    recommended_next_step:
      pathway !== "standard" ? "clinical_symptom_assessment" :
      band === BANDS.review ? "professional_review" :
      band === BANDS.attention ? "learn_and_consider_consult" : "stay_informed",
    generated_at: now.toISOString(),
    model_version: ENGINE_VERSION,
    clinical_validation_status: "not_clinically_validated"
  };
}

/* Factors the prototype does NOT assess — shown on the result page for honesty */
const NOT_ASSESSED = [
  "ปัจจัยทางพันธุกรรมเฉพาะบุคคล (เช่น การกลายพันธุ์ของยีน)",
  "ก๊าซเรดอนในที่อยู่อาศัย",
  "ผลตรวจทางการแพทย์หรือภาพถ่ายรังสีใด ๆ",
  "ประวัติการรักษาโดยละเอียด"
];
