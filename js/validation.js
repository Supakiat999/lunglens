/* =====================================================================
   LungLens assessment validation

   This layer validates questionnaire completeness and input ranges only.
   It must never assign clinical meaning, scores, bands, or diagnoses.
   ===================================================================== */

function isBlankAnswer(value) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

function activeAssessmentSteps(answers, steps = STEPS) {
  return steps.filter(step => !step.cond || step.cond(answers));
}

function pruneInactiveAnswers(answers, steps = STEPS) {
  const activeIds = new Set(activeAssessmentSteps(answers, steps).map(step => step.id));
  for (const step of steps) {
    if (step.cond && !activeIds.has(step.id)) delete answers[step.id];
  }
  return answers;
}

function validateAssessmentStep(step, answers) {
  const value = answers[step.id];

  if (step.type === "info") return null;
  if (step.type === "province") {
    return isBlankAnswer(answers.PROVINCE)
      ? { code: "province_required", stepId: step.id }
      : null;
  }
  if (step.type === "choice" || step.type === "multi" || step.type === "symptoms") {
    return isBlankAnswer(value)
      ? { code: "answer_required", stepId: step.id }
      : null;
  }
  if (step.type === "numbers") {
    const current = value && typeof value === "object" ? value : {};
    for (const field of step.fields) {
      const number = current[field.key];
      if (number == null || number === "") {
        return {
          code: "number_required",
          stepId: step.id,
          fieldKey: field.key,
          fieldLabel: field.label
        };
      }
      if (!Number.isFinite(Number(number)) || Number(number) < field.min || Number(number) > field.max) {
        return {
          code: "number_range",
          stepId: step.id,
          fieldKey: field.key,
          fieldLabel: field.label,
          min: field.min,
          max: field.max
        };
      }
    }
    return null;
  }
  if (step.type === "group") {
    const current = value && typeof value === "object" ? value : {};
    for (const field of step.fields) {
      if (isBlankAnswer(current[field.key])) {
        return {
          code: "group_field_required",
          stepId: step.id,
          fieldKey: field.key,
          fieldLabel: field.label
        };
      }
    }
  }
  return null;
}

function validateAssessment(answers, steps = STEPS) {
  return activeAssessmentSteps(answers, steps)
    .map(step => validateAssessmentStep(step, answers))
    .filter(Boolean);
}

if (typeof module !== "undefined") {
  module.exports = {
    activeAssessmentSteps,
    isBlankAnswer,
    pruneInactiveAnswers,
    validateAssessment,
    validateAssessmentStep
  };
}
