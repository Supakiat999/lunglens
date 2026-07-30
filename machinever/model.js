(function machineModelFactory(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.LungLensMachine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildMachineModel() {
  "use strict";

  const MACHINE_STORE_KEY = "lunglens-machine-v1";
  const MACHINE_PREVIEW_VERSION = "machine_preview_0.1.3";
  const SESSION_TIMEOUT_MS = 120000;
  const SESSION_WARNING_MS = 30000;

  const MOCK_IDENTITIES = Object.freeze([
    {
      id: "demo-mali",
      displayName: { en: "Mali (fictional demo)", th: "มะลิ (บุคคลสมมติ)" },
      name: "มะลิ ตัวอย่าง",
      age: "60–69 ปี",
      sex: "หญิง",
      registeredProvince: "กรุงเทพมหานคร"
    },
    {
      id: "demo-somchai",
      displayName: { en: "Somchai (fictional demo)", th: "สมชาย (บุคคลสมมติ)" },
      name: "สมชาย ตัวอย่าง",
      age: "50–59 ปี",
      sex: "ชาย",
      registeredProvince: "นครราชสีมา"
    },
    {
      id: "demo-nok",
      displayName: { en: "Nok (fictional demo)", th: "นก (บุคคลสมมติ)" },
      name: "นก ตัวอย่าง",
      age: "40–49 ปี",
      sex: "หญิง",
      registeredProvince: "ภูเก็ต"
    }
  ]);

  const MOCK_SENSOR = Object.freeze({
    adapter: "mock_sensor_v1",
    simulated: true,
    machineId: "LL-DEMO-BKK-01",
    siteName: {
      en: "Demonstration machine area, Bangkok",
      th: "พื้นที่เครื่องสาธิต กรุงเทพมหานคร"
    },
    province: "กรุงเทพมหานคร",
    values: Object.freeze({
      pm25: 18,
      pm10: 32,
      temperature: 31,
      humidity: 68
    })
  });

  function machineBandKey(result) {
    if (!result || result.assessment_status !== "completed") return "incomplete";
    if (result.band?.key === "no_elevated_factor") return "green";
    if (result.band?.key === "attention_recommended") return "yellow";
    if (result.band?.key === "professional_review") return "red";
    return "incomplete";
  }

  function createSensorSnapshot(now = new Date()) {
    return {
      adapter: MOCK_SENSOR.adapter,
      simulated: true,
      machineId: MOCK_SENSOR.machineId,
      siteName: { ...MOCK_SENSOR.siteName },
      province: MOCK_SENSOR.province,
      values: { ...MOCK_SENSOR.values },
      capturedAt: now.toISOString(),
      affectsFactorBand: false,
      affectsScreeningContext: false
    };
  }

  function createAppointmentDraft(input, now = new Date()) {
    const approvedFactors = input.includeFactors === true && Array.isArray(input.factorCodes)
      ? input.factorCodes.filter(code => typeof code === "string").slice(0, 24)
      : [];
    return {
      id: `LLM-DRAFT-${now.getTime().toString(36).toUpperCase()}`,
      status: "draft_unconfirmed",
      facilityId: String(input.facilityId || ""),
      facilityName: String(input.facilityName || ""),
      name: String(input.name || "").slice(0, 120),
      contact: String(input.contact || "").slice(0, 160),
      preferredDay: String(input.preferredDay || "").slice(0, 40),
      preferredTime: String(input.preferredTime || "").slice(0, 40),
      contactMethod: String(input.contactMethod || "").slice(0, 40),
      accessibilityNote: String(input.accessibilityNote || "").slice(0, 500),
      includeFactors: input.includeFactors === true,
      factorCodes: approvedFactors,
      resultBandKey: "professional_review",
      machineDisplayBand: "red",
      engineVersion: String(input.engineVersion || ""),
      createdAt: now.toISOString(),
      consentedAt: input.consented === true ? now.toISOString() : null,
      transmitted: false,
      confirmed: false,
      benefitVerified: false
    };
  }

  function isSafeMachineState(value) {
    const resultIsSafe = value?.result == null || (
      value.result &&
      typeof value.result === "object" &&
      value.result.assessment_status === "completed" &&
      ["no_elevated_factor", "attention_recommended", "professional_review"].includes(value.result.band?.key) &&
      ["standard", "prompt", "urgent"].includes(value.result.symptom_pathway)
    );
    const draftIsSafe = value?.appointmentDraft == null || (
      value.appointmentDraft &&
      typeof value.appointmentDraft === "object" &&
      value.appointmentDraft.status === "draft_unconfirmed" &&
      value.appointmentDraft.transmitted === false &&
      value.appointmentDraft.confirmed === false
    );
    return !!value &&
      typeof value === "object" &&
      value.schemaVersion === 1 &&
      (value.lang === "en" || value.lang === "th") &&
      value.answers &&
      typeof value.answers === "object" &&
      !Array.isArray(value.answers) &&
      resultIsSafe &&
      draftIsSafe;
  }

  function containsNationalId(value) {
    if (typeof value === "string") return /(?:^|\D)\d{13}(?:\D|$)/.test(value);
    if (Array.isArray(value)) return value.some(containsNationalId);
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([key, item]) =>
      /(?:national|citizen|thai).?id/i.test(key) || containsNationalId(item)
    );
  }

  return Object.freeze({
    MACHINE_STORE_KEY,
    MACHINE_PREVIEW_VERSION,
    SESSION_TIMEOUT_MS,
    SESSION_WARNING_MS,
    MOCK_IDENTITIES,
    MOCK_SENSOR,
    machineBandKey,
    createSensorSnapshot,
    createAppointmentDraft,
    isSafeMachineState,
    containsNationalId
  });
});
