/* global STEPS, PROVINCE_META, FACILITIES, ENGINE_VERSION, evaluateRisk,
   activeAssessmentSteps, pruneInactiveAnswers, validateAssessmentStep, tr,
   LungLensMachine */

"use strict";

const M = LungLensMachine;
const main = document.getElementById("machine-main");
const toast = document.getElementById("toast");
const timeoutModal = document.getElementById("timeout-modal");
const ROUTES = new Set([
  "welcome", "identity", "manual-identity", "consent", "location",
  "assessment", "result", "facilities", "appointment", "draft"
]);

const COPY = {
  en: {
    machinePreview: "Machine Preview",
    publicDemo: "Public demonstration",
    strip: "No real ID card, live sensor, hospital booking, or government benefit is connected.",
    footer: "Based on engine 0.15.1 · Not clinically validated",
    welcomeEyebrow: "Shared-machine preview",
    welcomeTitle: "A private, guided lung-health check for a public machine",
    welcomeLead: "Review reported lung-health factors in plain language. This demonstration does not diagnose disease, calculate cancer probability, or replace a healthcare professional.",
    begin: "Begin private session",
    originalApp: "Open regular LungLens 0.15.1",
    simulatedIdentity: "Simulated identity",
    simulatedIdentityBody: "Try a fictional card profile. No real Thai national ID number is requested or stored.",
    sensorContext: "Environmental context",
    sensorContextBody: "See a simulated, timestamped machine reading. It never changes the health-factor result.",
    secureReset: "Automatic privacy reset",
    secureResetBody: "The session is erased after completion or two minutes without activity.",
    identityEyebrow: "Step 1 of 4 · Start",
    identityTitle: "How would you like to begin?",
    identityLead: "A real card reader is not connected in this public preview.",
    useDemoCard: "Use a simulated ID card",
    useDemoCardBody: "Choose a fictional profile to demonstrate how a future authorised kiosk might prefill basic information.",
    withoutCard: "Continue without an ID card",
    withoutCardBody: "Enter only the minimum information needed for the assessment. A name is not required.",
    chooseDemo: "Choose a fictional card profile",
    fictional: "Fictional demonstration data",
    cardHasNoNumber: "No card number is included.",
    useProfile: "Use this demo profile",
    back: "Back",
    manualTitle: "Continue without an ID card",
    manualLead: "Only an age range and sex assigned at birth are requested here. You will choose a location next.",
    ageRange: "Age range",
    sexAtBirth: "Sex assigned at birth",
    choose: "Choose…",
    continue: "Continue",
    required: "Complete the required fields before continuing.",
    consentEyebrow: "Step 2 of 4 · Consent",
    consentTitle: "Before the assessment",
    consentLead: "This is an educational prototype on a shared device. It is not a diagnosis and has not been clinically validated.",
    privacyTitle: "Shared-machine privacy",
    privacyBody: "Answers remain only in this browser and are automatically erased after two minutes without activity or when you finish. Do not use this preview if someone else can see your screen.",
    consentProcess: "I agree that my answers may be processed on this device to create a preliminary factor result.",
    consentNotDiagnosis: "I understand that this is not a diagnosis, does not tell me whether I have cancer, and cannot order LDCT.",
    consentDemo: "I understand that identity, sensors, facilities, appointment requests, and the proposed support are demonstrations.",
    agreeContinue: "Agree and continue",
    consentError: "Tick all three required statements before continuing.",
    locationEyebrow: "Step 3 of 4 · Environment",
    locationTitle: "Which location should provide environmental context?",
    locationLead: "Location and today’s simulated sensor reading never change your factor color or screening context.",
    machineArea: "Near this machine",
    machineAreaBody: "Use the demonstration machine’s fixed Bangkok location and simulated sensor snapshot.",
    registeredAddress: "Registered address from demo card",
    registeredAddressBody: "Use the fictional card’s registered province after confirming that it represents the current location.",
    otherPlace: "Another place",
    otherPlaceBody: "Choose the province where you currently spend most of your time.",
    district: "District / local area",
    districtPlaceholder: "Enter district or local area",
    confirmAddress: "I confirm this fictional registered province represents the location to use for this demonstration.",
    province: "Province",
    useLocation: "Use this location",
    locationError: "Choose and confirm a location before continuing.",
    simulatedReading: "Simulated machine reading",
    notLive: "Not live data",
    contextOnly: "Environmental context only — never included in the health-factor color or LDCT context.",
    pm25: "PM2.5",
    pm10: "PM10",
    temperature: "Temperature",
    humidity: "Humidity",
    assessmentEyebrow: "Step 4 of 4 · Assessment",
    question: "Question",
    of: "of",
    whyAsk: "Why this is asked",
    previous: "Previous",
    next: "Next question",
    seeResult: "Review result",
    answerError: "Choose or complete an answer before continuing.",
    numberUnknown: "I do not know one or both amounts",
    resultEyebrow: "Preliminary factor result",
    greenLabel: "GREEN · No elevated factor identified",
    greenTitle: "No elevated factor was identified from the information provided",
    greenBody: "This does not mean safe, cancer-free, or zero risk. The prototype cannot assess every possible factor or detect disease.",
    yellowLabel: "YELLOW · Factors deserve attention",
    yellowTitle: "Some reported factors deserve attention",
    yellowBody: "This does not mean you have cancer. Keep a record of these factors and consider discussing them with a healthcare professional.",
    redLabel: "RED · Professional review recommended",
    redTitle: "A professional review is recommended",
    redBody: "This is not a diagnosis or a cancer probability. A healthcare professional can review the reported factors and decide whether any clinical assessment is appropriate.",
    factors: "Reported factors that contributed",
    noFactors: "No contributing factor was identified by the current prototype rules.",
    whatNext: "Practical next steps",
    greenNext: "Avoid tobacco smoke, reduce dust and fume exposure where practical, use suitable protection at work, and learn which symptoms need prompt assessment. A varied, balanced diet can support general health, but no food can guarantee cancer prevention.",
    yellowNext: "Review smoke, workplace, household, and lifestyle exposure. A varied, balanced diet can support general health, but no food can guarantee cancer prevention. Screening may help detect disease earlier for selected people, but whether it is appropriate requires age-plus-smoking information and professional discussion.",
    redNext: "Prepare your factor list for a healthcare professional. Any imaging or LDCT decision must be made after an individual clinical review.",
    screeningTitle: "Screening context remains separate",
    notDiagnosis: "Educational prototype — not a diagnosis and not clinically validated.",
    browseFacilities: "Browse demonstration facilities",
    restart: "Finish and erase session",
    emergencyLabel: "URGENT SYMPTOM GUIDANCE",
    emergencyTitle: "Seek urgent medical assessment now",
    emergencyBody: "You reported coughing up blood. This symptom can have many causes and does not mean cancer, but it needs prompt medical assessment.",
    emergencyCall: "Call 1669 in Thailand",
    emergencyAction: "If bleeding is heavy, breathing is severely difficult, or chest pain is sudden and severe, call 1669 or go to an emergency department.",
    emergencyNoDraft: "A routine appointment draft is hidden because it could delay emergency care.",
    call1669: "Call 1669",
    factorsUnaffected: "The urgent symptom did not change the factor score or factor color.",
    facilityEyebrow: "Demonstration directory",
    facilityTitle: "Choose a facility for an unconfirmed request draft",
    facilityLead: "Every listing, service, phone number, and participation status below is fictional and unverified. Nothing will be sent to a facility.",
    subsidyTitle: "Proposed 40% pilot support — demonstration only",
    subsidyBody: "This support is not currently active, verified, or guaranteed. This preview does not determine eligibility or calculate a discounted price.",
    selectFacility: "Select facility",
    appointmentEyebrow: "Local-only request",
    appointmentTitle: "Prepare an appointment request draft",
    appointmentLead: "This draft stays on this shared machine until it is printed or erased. It is not transmitted, received, accepted, or scheduled.",
    selectedFacility: "Selected facility",
    optionalName: "Name (optional)",
    optionalContact: "Phone, email, or other contact (optional)",
    preferredDay: "Preferred day",
    preferredTime: "Preferred time",
    contactMethod: "Preferred contact method",
    accessibility: "Accessibility note (optional)",
    phone: "Phone",
    email: "Email",
    other: "Other",
    morning: "Morning",
    afternoon: "Afternoon",
    anyTime: "Any time",
    includeFactors: "Include my assessment-factor codes in the printed draft",
    includeFactorsHelp: "Off by default. No symptom or internal point value is included.",
    draftConsent: "I understand this is an unconfirmed local draft and no hospital or government service will receive it.",
    saveDraft: "Review and save local draft",
    draftError: "Choose the required preferences and confirm the local-draft statement.",
    draftEyebrow: "Print review",
    draftTitle: "Appointment request draft — not confirmed",
    draftTitleTh: "ร่างคำขอนัดหมาย — ยังไม่ได้รับการยืนยัน",
    reference: "Local draft reference",
    status: "Status",
    unconfirmed: "Draft only · not transmitted or confirmed",
    created: "Created",
    contact: "Contact",
    factorsIncluded: "Approved factor codes",
    none: "None",
    print: "Print / Save as PDF",
    editDraft: "Edit draft",
    deleteDraft: "Delete draft",
    finishErase: "Finish and erase everything",
    draftDeleted: "The local draft was deleted.",
    erased: "The shared-machine session was erased.",
    stillUsing: "Still using this machine?",
    timeoutBody: "For privacy, this session will be erased from this shared machine unless you continue.",
    continueSession: "Continue session",
    eraseNow: "Erase now",
    sessionExpired: "The previous shared-machine session expired and was erased.",
    corrupted: "Unreadable machine-preview data was erased safely.",
    chooseFacilityFirst: "Choose a demonstration facility first.",
    resultRequired: "Complete the assessment before opening this page.",
    printWarning: "The unconfirmed-draft warning is included in the print layout.",
    noNetwork: "No network request or hospital delivery occurs.",
    yes: "Yes",
    cancel: "Cancel",
    eraseConfirm: "Erase all information from this shared-machine session now?"
  },
  th: {
    machinePreview: "เวอร์ชันเครื่องสาธิต",
    publicDemo: "การสาธิตสาธารณะ",
    strip: "ยังไม่เชื่อมบัตรประชาชน เซนเซอร์จริง ระบบนัดโรงพยาบาล หรือสิทธิภาครัฐ",
    footer: "ใช้เครื่องมือประเมินเวอร์ชัน 0.15.1 · ยังไม่ผ่านการรับรองทางคลินิก",
    welcomeEyebrow: "ต้นแบบสำหรับเครื่องที่ใช้ร่วมกัน",
    welcomeTitle: "ตรวจทานปัจจัยสุขภาพปอดแบบเป็นส่วนตัวบนเครื่องสาธิต",
    welcomeLead: "ทบทวนปัจจัยสุขภาพปอดที่คุณรายงานด้วยภาษาที่เข้าใจง่าย ต้นแบบนี้ไม่วินิจฉัยโรค ไม่คำนวณโอกาสเป็นมะเร็ง และไม่แทนบุคลากรทางการแพทย์",
    begin: "เริ่มเซสชันส่วนตัว",
    originalApp: "เปิด LungLens ปกติ 0.15.1",
    simulatedIdentity: "ข้อมูลตัวตนจำลอง",
    simulatedIdentityBody: "ทดลองใช้บุคคลสมมติ โดยไม่ขอหรือบันทึกเลขบัตรประชาชนจริง",
    sensorContext: "บริบทสิ่งแวดล้อม",
    sensorContextBody: "ดูค่าจำลองจากเครื่องพร้อมเวลา โดยค่านี้ไม่เปลี่ยนผลปัจจัยสุขภาพ",
    secureReset: "ล้างข้อมูลอัตโนมัติ",
    secureResetBody: "ล้างเซสชันเมื่อเสร็จหรือไม่มีการใช้งานเป็นเวลา 2 นาที",
    identityEyebrow: "ขั้นตอน 1 จาก 4 · เริ่มต้น",
    identityTitle: "คุณต้องการเริ่มอย่างไร",
    identityLead: "ต้นแบบสาธารณะนี้ยังไม่ได้เชื่อมต่อเครื่องอ่านบัตรจริง",
    useDemoCard: "ใช้บัตรประชาชนจำลอง",
    useDemoCardBody: "เลือกบุคคลสมมติเพื่อสาธิตการกรอกข้อมูลพื้นฐานของเครื่องที่ได้รับอนุญาตในอนาคต",
    withoutCard: "ทำต่อโดยไม่ใช้บัตรประชาชน",
    withoutCardBody: "กรอกเฉพาะข้อมูลขั้นต่ำที่จำเป็นต่อแบบประเมิน โดยไม่จำเป็นต้องระบุชื่อ",
    chooseDemo: "เลือกโปรไฟล์บัตรสมมติ",
    fictional: "ข้อมูลบุคคลสมมติสำหรับการสาธิต",
    cardHasNoNumber: "ไม่มีเลขบัตรอยู่ในข้อมูล",
    useProfile: "ใช้โปรไฟล์สมมตินี้",
    back: "ย้อนกลับ",
    manualTitle: "ทำต่อโดยไม่ใช้บัตรประชาชน",
    manualLead: "หน้านี้ขอเพียงช่วงอายุและเพศกำเนิด จากนั้นคุณจะเลือกตำแหน่งในขั้นตอนถัดไป",
    ageRange: "ช่วงอายุ",
    sexAtBirth: "เพศกำเนิด",
    choose: "เลือก…",
    continue: "ทำต่อ",
    required: "กรอกข้อมูลที่จำเป็นให้ครบก่อนทำต่อ",
    consentEyebrow: "ขั้นตอน 2 จาก 4 · ความยินยอม",
    consentTitle: "ก่อนเริ่มแบบประเมิน",
    consentLead: "นี่คือต้นแบบเพื่อการศึกษาในอุปกรณ์ที่ใช้ร่วมกัน ไม่ใช่การวินิจฉัยและยังไม่ผ่านการรับรองทางคลินิก",
    privacyTitle: "ความเป็นส่วนตัวบนเครื่องที่ใช้ร่วมกัน",
    privacyBody: "คำตอบอยู่ในเบราว์เซอร์นี้เท่านั้น และจะถูกล้างเมื่อไม่มีการใช้งาน 2 นาทีหรือเมื่อคุณกดเสร็จสิ้น ไม่ควรใช้หากผู้อื่นมองเห็นหน้าจอ",
    consentProcess: "ฉันยินยอมให้ประมวลผลคำตอบบนอุปกรณ์นี้เพื่อสร้างผลปัจจัยเบื้องต้น",
    consentNotDiagnosis: "ฉันเข้าใจว่าเครื่องมือนี้ไม่ใช่การวินิจฉัย ไม่บอกว่าเป็นมะเร็งหรือไม่ และไม่สามารถสั่งตรวจ LDCT",
    consentDemo: "ฉันเข้าใจว่าข้อมูลตัวตน เซนเซอร์ สถานพยาบาล คำขอนัด และสิทธิสนับสนุนเป็นการสาธิต",
    agreeContinue: "ยอมรับและทำต่อ",
    consentError: "กรุณาติ๊กยอมรับทั้ง 3 ข้อก่อนทำต่อ",
    locationEyebrow: "ขั้นตอน 3 จาก 4 · สิ่งแวดล้อม",
    locationTitle: "ต้องการใช้ตำแหน่งใดเป็นบริบทสิ่งแวดล้อม",
    locationLead: "ตำแหน่งและค่าเซนเซอร์จำลองวันนี้ไม่เปลี่ยนสีผลปัจจัยหรือบริบทการคัดกรอง",
    machineArea: "ใกล้บริเวณเครื่องนี้",
    machineAreaBody: "ใช้ตำแหน่งเครื่องสาธิตในกรุงเทพฯ และค่าจำลองจากเซนเซอร์",
    registeredAddress: "ที่อยู่ตามบัตรจำลอง",
    registeredAddressBody: "ใช้จังหวัดทะเบียนของบุคคลสมมติหลังยืนยันว่าเป็นตำแหน่งที่ต้องการใช้",
    otherPlace: "สถานที่อื่น",
    otherPlaceBody: "เลือกจังหวัดที่คุณใช้ชีวิตอยู่เป็นส่วนใหญ่ในปัจจุบัน",
    district: "อำเภอ / พื้นที่",
    districtPlaceholder: "กรอกอำเภอหรือพื้นที่",
    confirmAddress: "ฉันยืนยันว่าจังหวัดทะเบียนสมมตินี้เป็นตำแหน่งที่จะใช้ในการสาธิต",
    province: "จังหวัด",
    useLocation: "ใช้ตำแหน่งนี้",
    locationError: "กรุณาเลือกและยืนยันตำแหน่งก่อนทำต่อ",
    simulatedReading: "ค่าจำลองจากเครื่อง",
    notLive: "ไม่ใช่ข้อมูลสด",
    contextOnly: "ใช้เป็นบริบทสิ่งแวดล้อมเท่านั้น — ไม่รวมในสีผลปัจจัยหรือบริบท LDCT",
    pm25: "PM2.5",
    pm10: "PM10",
    temperature: "อุณหภูมิ",
    humidity: "ความชื้น",
    assessmentEyebrow: "ขั้นตอน 4 จาก 4 · แบบประเมิน",
    question: "ข้อ",
    of: "จาก",
    whyAsk: "เหตุผลที่ถาม",
    previous: "ข้อก่อนหน้า",
    next: "ข้อถัดไป",
    seeResult: "ดูผล",
    answerError: "กรุณาเลือกหรือกรอกคำตอบให้ครบก่อนทำต่อ",
    numberUnknown: "ไม่ทราบจำนวนอย่างน้อยหนึ่งข้อ",
    resultEyebrow: "ผลปัจจัยเบื้องต้น",
    greenLabel: "สีเขียว · ยังไม่พบปัจจัยเด่น",
    greenTitle: "ยังไม่พบปัจจัยเด่นจากข้อมูลที่ให้มา",
    greenBody: "ไม่ได้หมายความว่าปลอดภัย ไม่มีมะเร็ง หรือไม่มีความเสี่ยง ต้นแบบนี้ไม่สามารถประเมินทุกปัจจัยหรือตรวจหาโรค",
    yellowLabel: "สีเหลือง · มีปัจจัยที่ควรให้ความสำคัญ",
    yellowTitle: "พบปัจจัยบางอย่างที่ควรให้ความสำคัญ",
    yellowBody: "ไม่ได้หมายความว่าคุณเป็นมะเร็ง ควรบันทึกปัจจัยเหล่านี้และพิจารณาพูดคุยกับบุคลากรทางการแพทย์",
    redLabel: "สีแดง · แนะนำให้บุคลากรทางการแพทย์ทบทวน",
    redTitle: "แนะนำให้รับการทบทวนจากบุคลากรทางการแพทย์",
    redBody: "ผลนี้ไม่ใช่การวินิจฉัยหรือความน่าจะเป็นของมะเร็ง บุคลากรทางการแพทย์สามารถทบทวนปัจจัยและพิจารณาว่าควรประเมินทางคลินิกหรือไม่",
    factors: "ปัจจัยที่รายงานซึ่งมีผลต่อผลลัพธ์",
    noFactors: "กฎต้นแบบปัจจุบันไม่พบปัจจัยที่มีผลต่อผลลัพธ์",
    whatNext: "สิ่งที่ทำได้ต่อ",
    greenNext: "หลีกเลี่ยงควันบุหรี่ ลดฝุ่นและควันเมื่อทำได้ ใช้อุปกรณ์ป้องกันที่เหมาะสมในการทำงาน และรู้จักอาการที่ควรได้รับการประเมินเร็ว อาหารที่หลากหลายและสมดุลช่วยส่งเสริมสุขภาพโดยรวม แต่ไม่มีอาหารใดรับประกันการป้องกันมะเร็ง",
    yellowNext: "ทบทวนควัน ฝุ่นจากงาน สภาพบ้าน และวิถีชีวิต อาหารที่หลากหลายและสมดุลช่วยส่งเสริมสุขภาพโดยรวม แต่ไม่มีอาหารใดรับประกันการป้องกันมะเร็ง การคัดกรองอาจช่วยตรวจพบโรคเร็วในคนบางกลุ่ม แต่ความเหมาะสมต้องอาศัยอายุร่วมกับประวัติการสูบและการพูดคุยกับผู้เชี่ยวชาญ",
    redNext: "เตรียมรายการปัจจัยเพื่อพูดคุยกับบุคลากรทางการแพทย์ การถ่ายภาพหรือ LDCT ต้องเป็นการตัดสินใจหลังทบทวนเป็นรายบุคคล",
    screeningTitle: "บริบทการคัดกรองแยกจากผลปัจจัย",
    notDiagnosis: "ต้นแบบเพื่อการศึกษา — ไม่ใช่การวินิจฉัยและยังไม่ผ่านการรับรองทางคลินิก",
    browseFacilities: "ดูสถานพยาบาลสาธิต",
    restart: "เสร็จสิ้นและล้างเซสชัน",
    emergencyLabel: "คำแนะนำอาการเร่งด่วน",
    emergencyTitle: "ควรได้รับการประเมินทางการแพทย์อย่างเร่งด่วน",
    emergencyBody: "คุณรายงานอาการไอเป็นเลือด อาการนี้เกิดได้จากหลายสาเหตุและไม่ได้หมายความว่าเป็นมะเร็ง แต่ควรได้รับการประเมินโดยเร็ว",
    emergencyCall: "โทร 1669 ในประเทศไทย",
    emergencyAction: "หากมีเลือดออกมาก หายใจลำบากรุนแรง หรือเจ็บหน้าอกรุนแรงเฉียบพลัน ให้โทร 1669 หรือไปห้องฉุกเฉิน",
    emergencyNoDraft: "ระบบซ่อนร่างคำขอนัดทั่วไปเพื่อไม่ให้ทำให้การดูแลฉุกเฉินล่าช้า",
    call1669: "โทร 1669",
    factorsUnaffected: "อาการเร่งด่วนไม่ได้เปลี่ยนคะแนนหรือสีผลปัจจัย",
    facilityEyebrow: "รายชื่อเพื่อการสาธิต",
    facilityTitle: "เลือกสถานพยาบาลสำหรับร่างคำขอนัดที่ยังไม่ยืนยัน",
    facilityLead: "รายชื่อ บริการ หมายเลขโทรศัพท์ และสถานะการเข้าร่วมทั้งหมดเป็นข้อมูลสมมติที่ยังไม่ยืนยัน และจะไม่มีการส่งข้อมูล",
    subsidyTitle: "ตัวอย่างสิทธิสนับสนุนโครงการนำร่อง 40%",
    subsidyBody: "สิทธินี้ยังไม่เปิดใช้ ไม่ได้รับการยืนยัน และไม่รับประกัน ต้นแบบนี้ไม่ตรวจสอบสิทธิหรือคำนวณราคาส่วนลด",
    selectFacility: "เลือกสถานพยาบาล",
    appointmentEyebrow: "คำขอบนอุปกรณ์เท่านั้น",
    appointmentTitle: "เตรียมร่างคำขอนัดหมาย",
    appointmentLead: "ร่างนี้อยู่บนเครื่องที่ใช้ร่วมกันจนกว่าจะพิมพ์หรือล้างข้อมูล ไม่มีการส่ง รับ ยอมรับ หรือกำหนดนัด",
    selectedFacility: "สถานพยาบาลที่เลือก",
    optionalName: "ชื่อ (ไม่บังคับ)",
    optionalContact: "โทรศัพท์ อีเมล หรือช่องทางอื่น (ไม่บังคับ)",
    preferredDay: "วันที่สะดวก",
    preferredTime: "ช่วงเวลาที่สะดวก",
    contactMethod: "ช่องทางติดต่อที่ต้องการ",
    accessibility: "หมายเหตุการเข้าถึง (ไม่บังคับ)",
    phone: "โทรศัพท์",
    email: "อีเมล",
    other: "อื่น ๆ",
    morning: "เช้า",
    afternoon: "บ่าย",
    anyTime: "เวลาใดก็ได้",
    includeFactors: "รวมรหัสปัจจัยจากแบบประเมินในร่างที่พิมพ์",
    includeFactorsHelp: "ปิดไว้เป็นค่าเริ่มต้น และไม่รวมอาการหรือคะแนนภายใน",
    draftConsent: "ฉันเข้าใจว่านี่คือร่างบนอุปกรณ์ที่ยังไม่ยืนยัน และไม่มีโรงพยาบาลหรือหน่วยงานรัฐได้รับข้อมูล",
    saveDraft: "ตรวจทานและบันทึกร่างบนอุปกรณ์",
    draftError: "กรุณาเลือกข้อมูลที่จำเป็นและยืนยันว่าเป็นร่างบนอุปกรณ์",
    draftEyebrow: "ตรวจทานก่อนพิมพ์",
    draftTitle: "Appointment request draft — not confirmed",
    draftTitleTh: "ร่างคำขอนัดหมาย — ยังไม่ได้รับการยืนยัน",
    reference: "เลขอ้างอิงร่างในเครื่อง",
    status: "สถานะ",
    unconfirmed: "ร่างเท่านั้น · ยังไม่ส่งและยังไม่ยืนยัน",
    created: "สร้างเมื่อ",
    contact: "ช่องทางติดต่อ",
    factorsIncluded: "รหัสปัจจัยที่อนุญาต",
    none: "ไม่มี",
    print: "พิมพ์ / บันทึกเป็น PDF",
    editDraft: "แก้ไขร่าง",
    deleteDraft: "ลบร่าง",
    finishErase: "เสร็จสิ้นและล้างข้อมูลทั้งหมด",
    draftDeleted: "ลบร่างในเครื่องแล้ว",
    erased: "ล้างเซสชันในเครื่องที่ใช้ร่วมกันแล้ว",
    stillUsing: "ยังใช้งานเครื่องนี้อยู่หรือไม่",
    timeoutBody: "เพื่อความเป็นส่วนตัว เซสชันนี้จะถูกล้างหากคุณไม่กดทำต่อ",
    continueSession: "ใช้งานต่อ",
    eraseNow: "ล้างตอนนี้",
    sessionExpired: "เซสชันก่อนหน้าหมดเวลาและถูกล้างแล้ว",
    corrupted: "ล้างข้อมูลต้นแบบที่อ่านไม่ได้อย่างปลอดภัยแล้ว",
    chooseFacilityFirst: "กรุณาเลือกสถานพยาบาลสาธิตก่อน",
    resultRequired: "กรุณาทำแบบประเมินให้เสร็จก่อนเปิดหน้านี้",
    printWarning: "ข้อความเตือนว่ายังไม่ยืนยันจะแสดงในเอกสารที่พิมพ์",
    noNetwork: "ไม่มีการส่งเครือข่ายหรือส่งข้อมูลให้โรงพยาบาล",
    yes: "ใช่",
    cancel: "ยกเลิก",
    eraseConfirm: "ต้องการล้างข้อมูลทั้งหมดของเซสชันนี้จากเครื่องที่ใช้ร่วมกันหรือไม่"
  }
};

function c(key) {
  return COPY[state.lang]?.[key] || COPY.en[key] || key;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attr(value) {
  return esc(value);
}

function freshState() {
  return {
    schemaVersion: 1,
    appVersion: M.MACHINE_PREVIEW_VERSION,
    engineVersion: ENGINE_VERSION,
    lang: "en",
    largeText: false,
    started: false,
    route: "welcome",
    identityMode: null,
    identity: null,
    consent: { process: false, notDiagnosis: false, demo: false },
    locationMode: null,
    locationDistrict: "",
    locationConfirmed: false,
    sensorSnapshot: null,
    answers: {},
    stepIndex: 0,
    result: null,
    selectedFacilityId: null,
    appointmentDraft: null,
    lastActivityAt: Date.now()
  };
}

function safeLoad() {
  let raw;
  try { raw = localStorage.getItem(M.MACHINE_STORE_KEY); } catch (error) { return freshState(); }
  if (!raw) return freshState();
  try {
    const parsed = JSON.parse(raw);
    if (!M.isSafeMachineState(parsed) || M.containsNationalId(parsed)) {
      localStorage.removeItem(M.MACHINE_STORE_KEY);
      const next = freshState();
      next.loadNotice = "corrupted";
      return next;
    }
    if (Date.now() - Number(parsed.lastActivityAt || 0) >= M.SESSION_TIMEOUT_MS) {
      localStorage.removeItem(M.MACHINE_STORE_KEY);
      const next = freshState();
      next.loadNotice = "sessionExpired";
      return next;
    }
    return {
      ...freshState(),
      ...parsed,
      consent: { ...freshState().consent, ...(parsed.consent || {}) },
      answers: parsed.answers || {}
    };
  } catch (error) {
    try { localStorage.removeItem(M.MACHINE_STORE_KEY); } catch (ignored) {}
    const next = freshState();
    next.loadNotice = "corrupted";
    return next;
  }
}

var state = safeLoad();
let toastTimer = null;
let timeoutWasOpen = false;
let lastActivityWrite = 0;

function save() {
  if (M.containsNationalId(state)) return;
  try { localStorage.setItem(M.MACHINE_STORE_KEY, JSON.stringify(state)); } catch (error) {}
}

function eraseSession(messageKey = "erased") {
  try { localStorage.removeItem(M.MACHINE_STORE_KEY); } catch (error) {}
  state = freshState();
  timeoutModal.hidden = true;
  timeoutWasOpen = false;
  history.replaceState(null, "", "#welcome");
  render();
  showToast(c(messageKey));
}

function noteActivity(force = false) {
  if (!state.started) return;
  if (timeoutWasOpen && !force) return;
  const now = Date.now();
  state.lastActivityAt = now;
  if (force || now - lastActivityWrite > 10000) {
    lastActivityWrite = now;
    save();
  }
  if (timeoutWasOpen && force) {
    timeoutModal.hidden = true;
    timeoutWasOpen = false;
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3600);
}

function setRoute(route, { replace = false } = {}) {
  const safeRoute = ROUTES.has(route) ? route : "welcome";
  state.route = safeRoute;
  save();
  const hash = `#${safeRoute}`;
  if (location.hash !== hash) {
    if (replace) history.replaceState(null, "", hash);
    else location.hash = hash;
  } else {
    render();
  }
}

function allowedRoute(requested) {
  if (requested === "welcome") return requested;
  if (!state.started && requested !== "identity" && requested !== "manual-identity") return "welcome";
  if (requested === "consent" && !state.identityMode) return "identity";
  if (["location", "assessment", "result", "facilities", "appointment", "draft"].includes(requested) &&
      !Object.values(state.consent || {}).every(Boolean)) return "consent";
  if (["assessment", "result", "facilities", "appointment", "draft"].includes(requested) &&
      !state.answers.PROVINCE) return "location";
  if (["result", "facilities", "appointment", "draft"].includes(requested) &&
      !state.result) return "assessment";
  if (["facilities", "appointment", "draft"].includes(requested) &&
      state.result?.symptom_pathway === "urgent") return "result";
  if (["facilities", "appointment", "draft"].includes(requested) &&
      M.machineBandKey(state.result) !== "red") return "result";
  if (requested === "appointment" && !state.selectedFacilityId) return "facilities";
  if (requested === "draft" && !state.appointmentDraft) return "appointment";
  return requested;
}

function syncShell() {
  document.documentElement.lang = state.lang;
  document.body.classList.toggle("large-text", !!state.largeText);
  const langButton = document.getElementById("language-toggle");
  langButton.textContent = state.lang === "en" ? "ไทย" : "EN";
  langButton.setAttribute("aria-label", state.lang === "en" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English");
  const textButton = document.getElementById("text-toggle");
  textButton.setAttribute("aria-pressed", String(!!state.largeText));
  textButton.textContent = state.largeText ? "A−" : "A+";
  document.getElementById("brand-subtitle").textContent = c("machinePreview");
  const strip = document.getElementById("prototype-strip");
  strip.innerHTML = `<strong>${esc(c("publicDemo"))}</strong><span>${esc(c("strip"))}</span>`;
  document.querySelector(".machine-footer").innerHTML =
    `<span>LungLens ${esc(c("machinePreview"))}</span><span>${esc(c("footer"))}</span>`;
  document.title = state.lang === "en"
    ? "LungLens Machine Preview"
    : "LungLens เวอร์ชันเครื่องสาธิต";
}

function routeShell(content) {
  return `<div class="route-shell">${content}</div>`;
}

function renderWelcome() {
  return routeShell(`
    <section class="hero">
      <p class="eyebrow">${esc(c("welcomeEyebrow"))}</p>
      <h1>${esc(c("welcomeTitle"))}</h1>
      <p class="lede">${esc(c("welcomeLead"))}</p>
      <div class="hero-actions">
        <button class="button primary" type="button" data-action="start">${esc(c("begin"))}</button>
        <a class="button secondary" href="../">${esc(c("originalApp"))}</a>
      </div>
    </section>
    <section class="feature-grid" aria-label="${attr(c("publicDemo"))}">
      ${featureCard("ID", c("simulatedIdentity"), c("simulatedIdentityBody"))}
      ${featureCard("PM", c("sensorContext"), c("sensorContextBody"))}
      ${featureCard("02", c("secureReset"), c("secureResetBody"))}
    </section>
  `);
}

function featureCard(icon, title, body) {
  return `<article class="card feature-card">
    <span class="icon" aria-hidden="true">${esc(icon)}</span>
    <h2>${esc(title)}</h2>
    <p class="small">${esc(body)}</p>
  </article>`;
}

function renderIdentity() {
  const profiles = M.MOCK_IDENTITIES.map(profile => `
    <article class="card">
      <p class="eyebrow">${esc(c("fictional"))}</p>
      <h3>${esc(profile.displayName[state.lang])}</h3>
      <p>${esc(tr(profile.age, state.lang))} · ${esc(tr(profile.sex, state.lang))}</p>
      <p class="small">${esc(tr(profile.registeredProvince, state.lang))}<br>${esc(c("cardHasNoNumber"))}</p>
      <button class="button secondary wide" type="button" data-action="select-demo-profile" data-profile="${attr(profile.id)}">${esc(c("useProfile"))}</button>
    </article>`).join("");
  return routeShell(`
    <p class="eyebrow">${esc(c("identityEyebrow"))}</p>
    <h1>${esc(c("identityTitle"))}</h1>
    <p class="lede">${esc(c("identityLead"))}</p>
    <section class="choice-grid">
      <button class="card choice-card" type="button" data-action="show-demo-profiles">
        <span class="icon" aria-hidden="true">ID</span>
        <h2>${esc(c("useDemoCard"))}</h2>
        <p class="small">${esc(c("useDemoCardBody"))}</p>
      </button>
      <button class="card choice-card" type="button" data-action="manual-identity">
        <span class="icon" aria-hidden="true">—</span>
        <h2>${esc(c("withoutCard"))}</h2>
        <p class="small">${esc(c("withoutCardBody"))}</p>
      </button>
    </section>
    <section id="demo-profiles" ${state.showDemoProfiles ? "" : "hidden"}>
      <h2 style="margin-top:32px">${esc(c("chooseDemo"))}</h2>
      <div class="identity-grid">${profiles}</div>
    </section>
    <div class="button-row"><button class="button quiet" type="button" data-route="welcome">${esc(c("back"))}</button></div>
  `);
}

function canonicalOptions(stepId) {
  return STEPS.find(step => step.id === stepId)?.options || [];
}

function optionsMarkup(options, selected, blankLabel = c("choose")) {
  return `<option value="">${esc(blankLabel)}</option>` + options.map(option =>
    `<option value="${attr(option)}" ${selected === option ? "selected" : ""}>${esc(tr(option, state.lang))}</option>`
  ).join("");
}

function renderManualIdentity() {
  return routeShell(`
    <p class="eyebrow">${esc(c("identityEyebrow"))}</p>
    <h1>${esc(c("manualTitle"))}</h1>
    <p class="lede">${esc(c("manualLead"))}</p>
    <form id="manual-identity-form" class="card" style="margin-top:28px" novalidate>
      <div class="field-grid">
        <div class="field">
          <label for="manual-age">${esc(c("ageRange"))}</label>
          <select id="manual-age" required>${optionsMarkup(canonicalOptions("AGE"), state.answers.AGE)}</select>
        </div>
        <div class="field">
          <label for="manual-sex">${esc(c("sexAtBirth"))}</label>
          <select id="manual-sex" required>${optionsMarkup(canonicalOptions("SEX"), state.answers.SEX)}</select>
        </div>
      </div>
      <p id="manual-error" class="field-error" role="alert" hidden>${esc(c("required"))}</p>
      <div class="button-row">
        <button class="button quiet" type="button" data-route="identity">${esc(c("back"))}</button>
        <button class="button primary" type="submit">${esc(c("continue"))}</button>
      </div>
    </form>
  `);
}

function renderConsent() {
  const consent = state.consent;
  return routeShell(`
    <p class="eyebrow">${esc(c("consentEyebrow"))}</p>
    <h1>${esc(c("consentTitle"))}</h1>
    <p class="lede">${esc(c("consentLead"))}</p>
    <div class="notice warning">
      <strong>${esc(c("privacyTitle"))}</strong>
      ${esc(c("privacyBody"))}
    </div>
    <form id="consent-form" novalidate>
      <div class="consent-list">
        ${consentCheckbox("process", c("consentProcess"), consent.process)}
        ${consentCheckbox("notDiagnosis", c("consentNotDiagnosis"), consent.notDiagnosis)}
        ${consentCheckbox("demo", c("consentDemo"), consent.demo)}
      </div>
      <p id="consent-error" class="field-error" role="alert" hidden>${esc(c("consentError"))}</p>
      <div class="button-row">
        <button class="button quiet" type="button" data-route="identity">${esc(c("back"))}</button>
        <button class="button primary" type="submit">${esc(c("agreeContinue"))}</button>
      </div>
    </form>
  `);
}

function consentCheckbox(key, label, checked) {
  return `<label class="consent-item">
    <input type="checkbox" name="${attr(key)}" ${checked ? "checked" : ""}>
    <span>${esc(label)}</span>
  </label>`;
}

function renderSensorPanel() {
  const snapshot = state.sensorSnapshot || M.createSensorSnapshot();
  const values = snapshot.values;
  const captured = new Intl.DateTimeFormat(state.lang === "en" ? "en-GB" : "th-TH", {
    dateStyle: "medium", timeStyle: "short"
  }).format(new Date(snapshot.capturedAt));
  return `<section class="sensor-panel" aria-label="${attr(c("simulatedReading"))}">
    <div class="sensor-header">
      <div><strong>${esc(c("simulatedReading"))}</strong><div class="micro">${esc(snapshot.siteName[state.lang])} · ${esc(captured)}</div></div>
      <span>${esc(c("notLive"))}</span>
    </div>
    <div class="sensor-values">
      <div class="sensor-value"><span>${esc(c("pm25"))}</span><strong>${values.pm25}</strong><small>µg/m³</small></div>
      <div class="sensor-value"><span>${esc(c("pm10"))}</span><strong>${values.pm10}</strong><small>µg/m³</small></div>
      <div class="sensor-value"><span>${esc(c("temperature"))}</span><strong>${values.temperature}°</strong><small>C</small></div>
      <div class="sensor-value"><span>${esc(c("humidity"))}</span><strong>${values.humidity}%</strong><small>RH</small></div>
    </div>
    <p class="micro">${esc(c("contextOnly"))}</p>
  </section>`;
}

function renderLocation() {
  const hasRegistered = state.identityMode === "demo_card" && state.identity?.registeredProvince;
  const selected = state.locationMode;
  const provinceOptions = PROVINCE_META.map(p =>
    `<option value="${attr(p.th)}" ${state.answers.PROVINCE === p.th && selected === "other" ? "selected" : ""}>${esc(state.lang === "en" ? p.en : p.th)}</option>`
  ).join("");
  return routeShell(`
    <p class="eyebrow">${esc(c("locationEyebrow"))}</p>
    <h1>${esc(c("locationTitle"))}</h1>
    <p class="lede">${esc(c("locationLead"))}</p>
    <form id="location-form" novalidate>
      <div class="choice-grid">
        ${locationChoice("machine", c("machineArea"), c("machineAreaBody"), "PM", selected)}
        ${hasRegistered ? locationChoice("registered", c("registeredAddress"), `${c("registeredAddressBody")} (${tr(state.identity.registeredProvince, state.lang)})`, "ID", selected) : ""}
        ${locationChoice("other", c("otherPlace"), c("otherPlaceBody"), "…", selected)}
      </div>
      <div id="location-detail" class="card" style="margin-top:18px">
        ${selected === "machine" ? renderSensorPanel() : ""}
        ${selected === "registered" ? `
          <label class="consent-item">
            <input id="confirm-registered" type="checkbox" ${state.locationConfirmed ? "checked" : ""}>
            <span>${esc(c("confirmAddress"))}</span>
          </label>` : ""}
        ${selected === "other" ? `
          <div class="field-grid">
            <div class="field">
              <label for="other-province">${esc(c("province"))}</label>
              <select id="other-province"><option value="">${esc(c("choose"))}</option>${provinceOptions}</select>
            </div>
            <div class="field">
              <label for="other-district">${esc(c("district"))}</label>
              <input id="other-district" maxlength="100" placeholder="${attr(c("districtPlaceholder"))}" value="${attr(state.locationDistrict || "")}">
            </div>
          </div>` : ""}
        ${!selected ? `<p class="small">${esc(c("locationLead"))}</p>` : ""}
      </div>
      <p id="location-error" class="field-error" role="alert" hidden>${esc(c("locationError"))}</p>
      <div class="button-row">
        <button class="button quiet" type="button" data-route="consent">${esc(c("back"))}</button>
        <button class="button primary" type="submit">${esc(c("useLocation"))}</button>
      </div>
    </form>
  `);
}

function locationChoice(value, title, body, icon, selected) {
  return `<label class="card choice-card ${selected === value ? "selected" : ""}">
    <input class="visually-hidden" type="radio" name="location-mode" value="${attr(value)}" ${selected === value ? "checked" : ""}>
    <span class="icon" aria-hidden="true">${esc(icon)}</span>
    <h2>${esc(title)}</h2>
    <p class="small">${esc(body)}</p>
  </label>`;
}

function machineAssessmentSteps() {
  return activeAssessmentSteps(state.answers, STEPS).filter(step => !["AGE", "SEX", "PROVINCE"].includes(step.id));
}

function renderAssessment() {
  const steps = machineAssessmentSteps();
  if (state.stepIndex >= steps.length) state.stepIndex = Math.max(0, steps.length - 1);
  const step = steps[state.stepIndex];
  if (!step) return `<p>${esc(c("answerError"))}</p>`;
  const progress = Math.round(((state.stepIndex + 1) / steps.length) * 100);
  return routeShell(`
    <div class="step-header">
      <div>
        <p class="eyebrow">${esc(c("assessmentEyebrow"))}</p>
        <span class="progress-label">${esc(c("question"))} ${state.stepIndex + 1} ${esc(c("of"))} ${steps.length}</span>
      </div>
      <strong>${progress}%</strong>
      <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" aria-label="${attr(c("assessmentEyebrow"))}">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
    </div>
    <form id="assessment-form" class="question-card" data-step-id="${attr(step.id)}" novalidate>
      <p class="eyebrow">${esc(tr(step.section, state.lang))}</p>
      <h1>${esc(tr(step.title, state.lang))}</h1>
      ${step.why ? `<p class="question-note"><strong>${esc(c("whyAsk"))}:</strong> ${esc(tr(step.why, state.lang))}</p>` : ""}
      ${step.note ? `<p class="notice">${esc(tr(step.note, state.lang))}</p>` : ""}
      ${renderQuestionControl(step)}
      <p id="assessment-error" class="field-error" role="alert" hidden>${esc(c("answerError"))}</p>
      <div class="button-row">
        <button class="button quiet" type="button" data-action="previous-question">${esc(c("previous"))}</button>
        <button class="button primary" type="submit">${esc(state.stepIndex === steps.length - 1 ? c("seeResult") : c("next"))}</button>
      </div>
    </form>
  `);
}

function renderQuestionControl(step) {
  const value = state.answers[step.id];
  if (step.type === "choice") {
    return `<div class="options">${step.options.map(option => optionControl(step, option, value === option, "radio")).join("")}</div>`;
  }
  if (step.type === "multi" || step.type === "symptoms") {
    const selected = Array.isArray(value) ? value : [];
    return `<div class="options">${step.options.map(option => optionControl(step, option, selected.includes(option), "checkbox")).join("")}</div>`;
  }
  if (step.type === "numbers") {
    const current = value && typeof value === "object" ? value : {};
    const unknown = current.unknown === true;
    return `<div class="field-grid">${step.fields.map(field => `
      <div class="field">
        <label for="${attr(step.id)}-${attr(field.key)}">${esc(tr(field.label, state.lang))}</label>
        <input id="${attr(step.id)}-${attr(field.key)}" name="${attr(field.key)}" type="number" inputmode="numeric"
          min="${field.min}" max="${field.max}" step="1" value="${unknown ? "" : attr(current[field.key] ?? "")}" ${unknown ? "disabled" : ""}>
        <span class="field-help">${field.min}–${field.max}</span>
      </div>`).join("")}</div>
      <label class="consent-item" style="margin-top:16px">
        <input type="checkbox" name="numbers-unknown" ${unknown ? "checked" : ""}>
        <span>${esc(c("numberUnknown"))}</span>
      </label>`;
  }
  if (step.type === "group") {
    const current = value && typeof value === "object" ? value : {};
    return `<div class="field-grid">${step.fields.map(field => renderGroupField(step, field, current[field.key])).join("")}</div>`;
  }
  return "";
}

function optionControl(step, option, checked, type) {
  return `<label class="option">
    <input type="${type}" name="${attr(step.id)}" value="${attr(option)}" ${checked ? "checked" : ""}>
    <span>${esc(tr(option, state.lang))}</span>
  </label>`;
}

function renderGroupField(step, field, current) {
  if (field.type === "multi") {
    const selected = Array.isArray(current) ? current : [];
    return `<fieldset class="field" style="grid-column:1/-1">
      <legend>${esc(tr(field.label, state.lang))}</legend>
      <div class="options">${field.options.map(option => `
        <label class="option">
          <input type="checkbox" name="${attr(field.key)}" value="${attr(option)}" ${selected.includes(option) ? "checked" : ""}>
          <span>${esc(tr(option, state.lang))}</span>
        </label>`).join("")}</div>
    </fieldset>`;
  }
  return `<div class="field">
    <label for="${attr(step.id)}-${attr(field.key)}">${esc(tr(field.label, state.lang))}</label>
    <select id="${attr(step.id)}-${attr(field.key)}" name="${attr(field.key)}">${optionsMarkup(field.options, current)}</select>
  </div>`;
}

function resultContent(result, band) {
  const map = {
    green: { label: c("greenLabel"), title: c("greenTitle"), body: c("greenBody"), next: c("greenNext") },
    yellow: { label: c("yellowLabel"), title: c("yellowTitle"), body: c("yellowBody"), next: c("yellowNext") },
    red: { label: c("redLabel"), title: c("redTitle"), body: c("redBody"), next: c("redNext") }
  };
  const copy = map[band];
  const factors = result.factors?.length
    ? `<ul class="factor-list">${result.factors.map(factor => `<li class="factor-item">
        <strong>${esc(tr(factor.name, state.lang))}</strong>
        <span>${esc(tr(factor.explain, state.lang))}</span>
      </li>`).join("")}</ul>`
    : `<p>${esc(c("noFactors"))}</p>`;
  return `
    <section class="result-card result-${band}">
      <div class="result-head">
        <span class="result-label">${esc(copy.label)}</span>
        <h1>${esc(copy.title)}</h1>
        <p class="lede">${esc(copy.body)}</p>
      </div>
      <div class="result-body">
        <h2>${esc(c("factors"))}</h2>
        ${factors}
        <h2 style="margin-top:30px">${esc(c("whatNext"))}</h2>
        <p>${esc(copy.next)}</p>
        <div class="notice">
          <strong>${esc(c("screeningTitle"))}</strong>
          ${esc(tr(result.screening_context?.label || "", state.lang))}
          <p class="small">${esc(tr(result.screening_context?.summary || "", state.lang))}</p>
        </div>
        <p class="small">${esc(c("notDiagnosis"))}</p>
        <div class="button-row no-print">
          ${band === "red" ? `<button class="button danger" type="button" data-route="facilities">${esc(c("browseFacilities"))}</button>` : ""}
          <button class="button quiet" type="button" data-action="finish">${esc(c("restart"))}</button>
        </div>
      </div>
    </section>`;
}

function renderEmergency() {
  const result = state.result;
  const band = M.machineBandKey(result);
  return routeShell(`
    <section class="emergency-screen">
      <div class="emergency-inner">
        <span class="emergency-badge">${esc(c("emergencyLabel"))}</span>
        <h1>${esc(c("emergencyTitle"))}</h1>
        <p class="lede">${esc(c("emergencyBody"))}</p>
        <div class="notice danger">
          <strong>${esc(c("emergencyCall"))}</strong>
          ${esc(c("emergencyAction"))}
        </div>
        <p>${esc(c("emergencyNoDraft"))}</p>
        <div class="button-row">
          <a class="button emergency-call" href="tel:1669">${esc(c("call1669"))}</a>
          <button class="button quiet" style="color:#fff;border-color:#fff" type="button" data-action="finish">${esc(c("restart"))}</button>
        </div>
      </div>
    </section>
    <section class="card" style="margin-top:22px">
      <strong>${esc(c("factorsUnaffected"))}</strong>
      <p class="small">${esc(c("notDiagnosis"))}</p>
      <span class="result-label">${esc(band === "green" ? c("greenLabel") : band === "yellow" ? c("yellowLabel") : c("redLabel"))}</span>
    </section>
  `);
}

function renderResult() {
  if (state.result?.symptom_pathway === "urgent") return renderEmergency();
  return routeShell(`
    <p class="eyebrow">${esc(c("resultEyebrow"))}</p>
    ${resultContent(state.result, M.machineBandKey(state.result))}
  `);
}

function renderFacilities() {
  const cards = FACILITIES.filter(facility => facility.public).map(facility => `
    <article class="card facility-card">
      <p class="eyebrow">${esc(tr(facility.type, state.lang))}</p>
      <h2>${esc(tr(facility.name, state.lang))}</h2>
      <p class="facility-meta">${esc(tr(facility.province, state.lang))} · ${esc(tr(facility.district, state.lang))}</p>
      <p class="small">${esc(tr(facility.services.join(" · "), state.lang))}</p>
      <p class="micro">${esc(tr(facility.verified, state.lang))}</p>
      <button class="button secondary wide" type="button" data-action="select-facility" data-facility="${attr(facility.id)}">${esc(c("selectFacility"))}</button>
    </article>`).join("");
  return routeShell(`
    <p class="eyebrow">${esc(c("facilityEyebrow"))}</p>
    <h1>${esc(c("facilityTitle"))}</h1>
    <p class="lede">${esc(c("facilityLead"))}</p>
    <div class="notice warning">
      <strong>${esc(c("subsidyTitle"))}</strong>
      ${esc(c("subsidyBody"))}
    </div>
    <section class="facility-grid">${cards}</section>
    <div class="button-row"><button class="button quiet" type="button" data-route="result">${esc(c("back"))}</button></div>
  `);
}

function selectedFacility() {
  return FACILITIES.find(facility => facility.id === state.selectedFacilityId) || null;
}

function renderAppointment() {
  const facility = selectedFacility();
  if (!facility) return `<p>${esc(c("chooseFacilityFirst"))}</p>`;
  const draft = state.appointmentDraft || {};
  return routeShell(`
    <p class="eyebrow">${esc(c("appointmentEyebrow"))}</p>
    <h1>${esc(c("appointmentTitle"))}</h1>
    <p class="lede">${esc(c("appointmentLead"))}</p>
    <div class="draft-warning">${esc(c("draftTitle"))}<br>${esc(c("draftTitleTh"))}</div>
    <form id="appointment-form" class="card" style="margin-top:22px" novalidate>
      <div class="notice warning">
        <strong>${esc(c("selectedFacility"))}</strong>
        ${esc(tr(facility.name, state.lang))} · ${esc(tr(facility.province, state.lang))}
      </div>
      <div class="field-grid">
        <div class="field">
          <label for="draft-name">${esc(c("optionalName"))}</label>
          <input id="draft-name" name="name" autocomplete="off" maxlength="120" value="${attr(draft.name || state.identity?.name || "")}">
        </div>
        <div class="field">
          <label for="draft-contact">${esc(c("optionalContact"))}</label>
          <input id="draft-contact" name="contact" autocomplete="off" maxlength="160" value="${attr(draft.contact || "")}">
        </div>
        <div class="field">
          <label for="draft-day">${esc(c("preferredDay"))}</label>
          <input id="draft-day" name="preferredDay" type="date" required value="${attr(draft.preferredDay || "")}">
        </div>
        <div class="field">
          <label for="draft-time">${esc(c("preferredTime"))}</label>
          <select id="draft-time" name="preferredTime" required>
            <option value="">${esc(c("choose"))}</option>
            ${["morning", "afternoon", "anyTime"].map(key => `<option value="${attr(key)}" ${draft.preferredTime === key ? "selected" : ""}>${esc(c(key))}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="draft-method">${esc(c("contactMethod"))}</label>
          <select id="draft-method" name="contactMethod" required>
            <option value="">${esc(c("choose"))}</option>
            ${["phone", "email", "other"].map(key => `<option value="${attr(key)}" ${draft.contactMethod === key ? "selected" : ""}>${esc(c(key))}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="draft-accessibility">${esc(c("accessibility"))}</label>
          <textarea id="draft-accessibility" name="accessibilityNote" maxlength="500">${esc(draft.accessibilityNote || "")}</textarea>
        </div>
      </div>
      <label class="consent-item">
        <input type="checkbox" name="includeFactors" ${draft.includeFactors ? "checked" : ""}>
        <span><strong>${esc(c("includeFactors"))}</strong><br><span class="small">${esc(c("includeFactorsHelp"))}</span></span>
      </label>
      <label class="consent-item">
        <input type="checkbox" name="draftConsent">
        <span>${esc(c("draftConsent"))}</span>
      </label>
      <p id="draft-error" class="field-error" role="alert" hidden>${esc(c("draftError"))}</p>
      <div class="button-row">
        <button class="button quiet" type="button" data-route="facilities">${esc(c("back"))}</button>
        <button class="button primary" type="submit">${esc(c("saveDraft"))}</button>
      </div>
    </form>
  `);
}

function renderDraft() {
  const draft = state.appointmentDraft;
  const facility = FACILITIES.find(item => item.id === draft.facilityId);
  const created = new Intl.DateTimeFormat(state.lang === "en" ? "en-GB" : "th-TH", {
    dateStyle: "long", timeStyle: "short"
  }).format(new Date(draft.createdAt));
  const factorText = draft.includeFactors && draft.factorCodes.length ? draft.factorCodes.join(", ") : c("none");
  const rows = [
    [c("reference"), draft.id],
    [c("status"), c("unconfirmed")],
    [c("selectedFacility"), tr(facility?.name || draft.facilityName, state.lang)],
    [c("created"), created],
    [c("optionalName"), draft.name || c("none")],
    [c("contact"), draft.contact || c("none")],
    [c("preferredDay"), draft.preferredDay],
    [c("preferredTime"), c(draft.preferredTime)],
    [c("contactMethod"), c(draft.contactMethod)],
    [c("accessibility"), draft.accessibilityNote || c("none")],
    [c("factorsIncluded"), factorText]
  ];
  return routeShell(`
    <section class="print-page-warning">
      <p class="eyebrow">${esc(c("draftEyebrow"))}</p>
      <div class="draft-warning">
        ${esc(c("draftTitle"))}<br>
        ${esc(c("draftTitleTh"))}
      </div>
      <h1 style="margin-top:24px">${esc(c("draftTitle"))}</h1>
      <dl class="review-list">
        ${rows.map(([label, value]) => `<div class="review-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}
      </dl>
      <div class="notice warning">
        <strong>${esc(c("subsidyTitle"))}</strong>
        ${esc(c("subsidyBody"))}
      </div>
      <p class="small">${esc(c("noNetwork"))} ${esc(c("printWarning"))}</p>
      <div class="button-row no-print">
        <button class="button primary" type="button" data-action="print">${esc(c("print"))}</button>
        <button class="button secondary" type="button" data-route="appointment">${esc(c("editDraft"))}</button>
        <button class="button quiet" type="button" data-action="delete-draft">${esc(c("deleteDraft"))}</button>
        <button class="button danger" type="button" data-action="finish">${esc(c("finishErase"))}</button>
      </div>
    </section>
  `);
}

function render() {
  syncShell();
  const requested = (location.hash || "#welcome").slice(1).split(/[?=]/)[0];
  const route = allowedRoute(ROUTES.has(requested) ? requested : "welcome");
  if (route !== requested) {
    setRoute(route, { replace: true });
    return;
  }
  state.route = route;
  const renderers = {
    welcome: renderWelcome,
    identity: renderIdentity,
    "manual-identity": renderManualIdentity,
    consent: renderConsent,
    location: renderLocation,
    assessment: renderAssessment,
    result: renderResult,
    facilities: renderFacilities,
    appointment: renderAppointment,
    draft: renderDraft
  };
  main.innerHTML = renderers[route]();
  save();
  requestAnimationFrame(() => {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}

function applyExclusive(step, values) {
  const exclusive = step.exclusive || [];
  const checkedExclusive = values.find(value => exclusive.includes(value));
  if (checkedExclusive) return [checkedExclusive];
  return values.filter(value => !exclusive.includes(value));
}

function collectAssessmentAnswer(form, step) {
  if (step.type === "choice") {
    state.answers[step.id] = form.elements[step.id]?.value || "";
  } else if (step.type === "multi" || step.type === "symptoms") {
    const checked = [...form.querySelectorAll(`input[name="${step.id}"]:checked`)].map(input => input.value);
    state.answers[step.id] = applyExclusive(step, checked);
  } else if (step.type === "numbers") {
    if (form.elements["numbers-unknown"].checked) state.answers[step.id] = { unknown: true };
    else {
      state.answers[step.id] = Object.fromEntries(step.fields.map(field => [
        field.key,
        form.elements[field.key].value === "" ? "" : Number(form.elements[field.key].value)
      ]));
    }
  } else if (step.type === "group") {
    const value = {};
    for (const field of step.fields) {
      if (field.type === "multi") {
        const selected = [...form.querySelectorAll(`input[name="${field.key}"]:checked`)].map(input => input.value);
        value[field.key] = applyExclusive(field, selected);
      } else {
        value[field.key] = form.elements[field.key]?.value || "";
      }
    }
    state.answers[step.id] = value;
  }
  pruneInactiveAnswers(state.answers, STEPS);
}

document.addEventListener("click", event => {
  const button = event.target.closest("button, [data-route]");
  if (!button) return;
  const route = button.dataset.route;
  if (route) {
    event.preventDefault();
    setRoute(route);
    return;
  }
  const action = button.dataset.action;
  if (!action) return;
  if (action === "start") {
    state.started = true;
    state.lastActivityAt = Date.now();
    setRoute("identity");
  } else if (action === "show-demo-profiles") {
    state.showDemoProfiles = true;
    render();
    document.getElementById("demo-profiles")?.scrollIntoView({ behavior: "smooth" });
  } else if (action === "manual-identity") {
    state.identityMode = "manual";
    state.identity = null;
    setRoute("manual-identity");
  } else if (action === "select-demo-profile") {
    const profile = M.MOCK_IDENTITIES.find(item => item.id === button.dataset.profile);
    if (!profile) return;
    state.identityMode = "demo_card";
    state.started = true;
    state.lastActivityAt = Date.now();
    state.identity = {
      demoProfileId: profile.id,
      name: profile.name,
      age: profile.age,
      sex: profile.sex,
      registeredProvince: profile.registeredProvince,
      simulated: true
    };
    state.answers.AGE = profile.age;
    state.answers.SEX = profile.sex;
    setRoute("consent");
  } else if (action === "previous-question") {
    if (state.stepIndex > 0) {
      state.stepIndex -= 1;
      render();
    } else {
      setRoute("location");
    }
  } else if (action === "select-facility") {
    state.selectedFacilityId = button.dataset.facility;
    state.appointmentDraft = null;
    setRoute("appointment");
  } else if (action === "print") {
    window.print();
  } else if (action === "delete-draft") {
    state.appointmentDraft = null;
    save();
    showToast(c("draftDeleted"));
    setRoute("facilities");
  } else if (action === "finish") {
    if (window.confirm(c("eraseConfirm"))) eraseSession();
  }
});

document.addEventListener("change", event => {
  if (event.target.name === "location-mode") {
    state.locationMode = event.target.value;
    state.locationConfirmed = false;
    if (state.locationMode !== "machine") state.sensorSnapshot = null;
    if (state.locationMode !== "other") state.locationDistrict = "";
    render();
  }
  if (event.target.name === "numbers-unknown") {
    const stepForm = event.target.closest("#assessment-form");
    const stepId = stepForm?.dataset.stepId;
    if (stepId) state.answers[stepId] = event.target.checked ? { unknown: true } : {};
    render();
    return;
  }
  const stepForm = event.target.closest("#assessment-form");
  if (stepForm && event.target.type === "checkbox") {
    const step = STEPS.find(item => item.id === stepForm.dataset.stepId);
    const exclusive = step?.type === "group"
      ? step.fields.find(field => field.key === event.target.name)?.exclusive || []
      : step?.exclusive || [];
    if (event.target.checked && exclusive.includes(event.target.value)) {
      stepForm.querySelectorAll(`input[name="${CSS.escape(event.target.name)}"]`).forEach(input => {
        if (input !== event.target) input.checked = false;
      });
    } else if (event.target.checked && exclusive.length) {
      stepForm.querySelectorAll(`input[name="${CSS.escape(event.target.name)}"]`).forEach(input => {
        if (exclusive.includes(input.value)) input.checked = false;
      });
    }
  }
});

document.addEventListener("submit", event => {
  event.preventDefault();
  if (event.target.id === "manual-identity-form") {
    const age = document.getElementById("manual-age").value;
    const sex = document.getElementById("manual-sex").value;
    if (!age || !sex) {
      document.getElementById("manual-error").hidden = false;
      return;
    }
    state.identityMode = "manual";
    state.started = true;
    state.lastActivityAt = Date.now();
    state.identity = null;
    state.answers.AGE = age;
    state.answers.SEX = sex;
    setRoute("consent");
  } else if (event.target.id === "consent-form") {
    const form = event.target;
    state.consent = {
      process: form.elements.process.checked,
      notDiagnosis: form.elements.notDiagnosis.checked,
      demo: form.elements.demo.checked
    };
    if (!Object.values(state.consent).every(Boolean)) {
      document.getElementById("consent-error").hidden = false;
      return;
    }
    setRoute("location");
  } else if (event.target.id === "location-form") {
    const mode = state.locationMode;
    let province = "";
    if (mode === "machine") {
      state.sensorSnapshot = M.createSensorSnapshot();
      province = state.sensorSnapshot.province;
      state.locationConfirmed = true;
    } else if (mode === "registered") {
      state.locationConfirmed = document.getElementById("confirm-registered")?.checked === true;
      province = state.locationConfirmed ? state.identity?.registeredProvince : "";
    } else if (mode === "other") {
      province = document.getElementById("other-province")?.value || "";
      state.locationDistrict = document.getElementById("other-district")?.value.trim() || "";
      state.locationConfirmed = !!province && !!state.locationDistrict;
    }
    if (!mode || !province || !state.locationConfirmed) {
      document.getElementById("location-error").hidden = false;
      return;
    }
    state.answers.PROVINCE = province;
    state.stepIndex = 0;
    state.result = null;
    setRoute("assessment");
  } else if (event.target.id === "assessment-form") {
    const form = event.target;
    const step = STEPS.find(item => item.id === form.dataset.stepId);
    collectAssessmentAnswer(form, step);
    const error = validateAssessmentStep(step, state.answers);
    if (error) {
      document.getElementById("assessment-error").hidden = false;
      return;
    }
    const steps = machineAssessmentSteps();
    const currentIndex = steps.findIndex(item => item.id === step.id);
    if (currentIndex < steps.length - 1) {
      state.stepIndex = currentIndex + 1;
      save();
      render();
    } else {
      state.result = evaluateRisk(state.answers);
      state.selectedFacilityId = null;
      state.appointmentDraft = null;
      setRoute("result");
    }
  } else if (event.target.id === "appointment-form") {
    const form = event.target;
    const facility = selectedFacility();
    const preferredDay = form.elements.preferredDay.value;
    const preferredTime = form.elements.preferredTime.value;
    const contactMethod = form.elements.contactMethod.value;
    if (!facility || !preferredDay || !preferredTime || !contactMethod || !form.elements.draftConsent.checked) {
      document.getElementById("draft-error").hidden = false;
      return;
    }
    state.appointmentDraft = M.createAppointmentDraft({
      facilityId: facility.id,
      facilityName: facility.name,
      name: form.elements.name.value,
      contact: form.elements.contact.value,
      preferredDay,
      preferredTime,
      contactMethod,
      accessibilityNote: form.elements.accessibilityNote.value,
      includeFactors: form.elements.includeFactors.checked,
      factorCodes: state.result.factor_codes,
      engineVersion: ENGINE_VERSION,
      consented: true
    });
    setRoute("draft");
  }
});

document.getElementById("language-toggle").addEventListener("click", () => {
  state.lang = state.lang === "en" ? "th" : "en";
  render();
});

document.getElementById("text-toggle").addEventListener("click", () => {
  state.largeText = !state.largeText;
  render();
});

document.getElementById("continue-session").addEventListener("click", () => {
  noteActivity(true);
  timeoutModal.hidden = true;
  timeoutWasOpen = false;
});

document.getElementById("end-session-now").addEventListener("click", () => eraseSession());

for (const eventName of ["pointerdown", "keydown", "touchstart"]) {
  document.addEventListener(eventName, () => noteActivity(false), { passive: true });
}

window.addEventListener("hashchange", render);

setInterval(() => {
  if (!state.started || state.route === "welcome") return;
  const remaining = M.SESSION_TIMEOUT_MS - (Date.now() - Number(state.lastActivityAt || 0));
  if (remaining <= 0) {
    eraseSession("sessionExpired");
    return;
  }
  if (remaining <= M.SESSION_WARNING_MS) {
    timeoutWasOpen = true;
    timeoutModal.hidden = false;
    document.getElementById("timeout-seconds").textContent = String(Math.max(1, Math.ceil(remaining / 1000)));
    document.getElementById("timeout-title").textContent = c("stillUsing");
    document.getElementById("timeout-description").textContent = c("timeoutBody");
    document.getElementById("continue-session").textContent = c("continueSession");
    document.getElementById("end-session-now").textContent = c("eraseNow");
    if (!timeoutModal.contains(document.activeElement)) document.getElementById("continue-session").focus();
  }
}, 1000);

if (!location.hash) history.replaceState(null, "", "#welcome");
render();
if (state.loadNotice) {
  const notice = state.loadNotice;
  delete state.loadNotice;
  showToast(c(notice));
}
