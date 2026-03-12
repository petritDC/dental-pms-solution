"use client";

import { useState } from "react";
import { JsonOutputModal } from "./JsonOutputModal";

interface MedicalHistoryItem {
  condition: string;
  diagnosedAt: string;
  notes: string;
}

interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
}

interface EmergencyContactItem {
  name: string;
  phone: string;
  relationship: string;
}

interface XRayAvailability {
  hasXRayToUpload: boolean;
  status: "available" | "pending";
}

interface RiskFactors {
  smokingStatus: "non_smoker" | "former_smoker" | "current_smoker";
  cigarettesPerDay: number;
  diabetesDiagnosed: boolean;
  hba1c: number | null;
}

interface FormData {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    age: number | null;
    patientEmail: string;
    insurance: string;
    bloodType: string;
    patientNationalId: string;
    medicalRecordNumber: string;
  };
  allergies: string[];
  medicalHistory: MedicalHistoryItem[];
  riskFactors: RiskFactors;
  currentMedications: MedicationItem[];
  emergencyContacts: EmergencyContactItem[];
  xRayAvailability: XRayAvailability;
  doctorNotes: string;
  consents: {
    privacyPolicyAccepted: boolean;
    treatmentConsent: boolean;
  };
}

type PrefillFormData = Omit<FormData, "xRayAvailability" | "doctorNotes"> &
  Partial<Pick<FormData, "xRayAvailability" | "doctorNotes">>;

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string {
  if (!display) return "";
  const [d, m, y] = display.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function buildXRayAvailability(hasXRayToUpload: boolean): XRayAvailability {
  return {
    hasXRayToUpload,
    status: hasXRayToUpload ? "available" : "pending",
  };
}

function withFormDefaults(data: PrefillFormData): FormData {
  return {
    ...data,
    xRayAvailability: buildXRayAvailability(data.xRayAvailability?.hasXRayToUpload ?? false),
    doctorNotes: data.doctorNotes ?? "",
  };
}

export function PatientIntakeForm() {
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      fullName: "",
      dateOfBirth: "",
      age: null,
      patientEmail: "",
      insurance: "",
      bloodType: "",
      patientNationalId: "",
      medicalRecordNumber: "",
    },
    allergies: [],
    medicalHistory: [],
    riskFactors: {
      smokingStatus: "non_smoker",
      cigarettesPerDay: 0,
      diabetesDiagnosed: false,
      hba1c: null,
    },
    currentMedications: [],
    emergencyContacts: [],
    xRayAvailability: buildXRayAvailability(false),
    doctorNotes: "",
    consents: {
      privacyPolicyAccepted: false,
      treatmentConsent: false,
    },
  });

  const [allergyInput, setAllergyInput] = useState("");
  const [generatedJson, setGeneratedJson] = useState<object | null>(null);
  const [finalJson, setFinalJson] = useState<object | null>(null);
  const [showModal, setShowModal] = useState(false);

  const prefillDatasets: { label: string; data: PrefillFormData }[] = [
    {
      label: "Arben Krasniqi — Diabetic, Hypertension",
      data: {
        personalInfo: {
          fullName: "Arben Krasniqi",
          dateOfBirth: "1979-04-12",
          age: calculateAge("1979-04-12"),
          patientEmail: "arben.krasniqi@example.com",
          insurance: "Sigal Uniqa (Private)",
          bloodType: "A+",
          patientNationalId: "1198765432109",
          medicalRecordNumber: "MRN-2026-001284",
        },
        allergies: ["Penicillin", "Latex", "Ibuprofen"],
        medicalHistory: [
          { condition: "Hypertension", diagnosedAt: "2019-03-15", notes: "Controlled with medication. Checks BP weekly." },
          { condition: "Type 2 Diabetes", diagnosedAt: "2021-07-22", notes: "Managed with diet and Metformin. HbA1c 6.5%." },
        ],
        riskFactors: {
          smokingStatus: "non_smoker",
          cigarettesPerDay: 0,
          diabetesDiagnosed: true,
          hba1c: 6.5,
        },
        currentMedications: [
          { name: "Amlodipine", dosage: "5 mg", frequency: "Once daily (morning)", prescribedBy: "Dr. L. Berisha" },
          { name: "Metformin", dosage: "500 mg", frequency: "Twice daily", prescribedBy: "Dr. F. Hoxha" },
        ],
        emergencyContacts: [
          { name: "Blerta Krasniqi", phone: "+38344123456", relationship: "Spouse" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
    {
      label: "Fjolla Gashi — Smoker, Asthma",
      data: {
        personalInfo: {
          fullName: "Fjolla Gashi",
          dateOfBirth: "1995-08-23",
          age: calculateAge("1995-08-23"),
          patientEmail: "fjolla.gashi@example.com",
          insurance: "KESCO Health (Public)",
          bloodType: "B+",
          patientNationalId: "1295678901234",
          medicalRecordNumber: "MRN-2026-002117",
        },
        allergies: ["Aspirin", "Chlorhexidine"],
        medicalHistory: [
          { condition: "Asthma", diagnosedAt: "2010-06-10", notes: "Uses inhaler as needed. Mild persistent." },
          { condition: "Gingivitis", diagnosedAt: "2023-11-05", notes: "Diagnosed during routine dental checkup. Bleeding on probing." },
        ],
        riskFactors: {
          smokingStatus: "current_smoker",
          cigarettesPerDay: 12,
          diabetesDiagnosed: false,
          hba1c: null,
        },
        currentMedications: [
          { name: "Salbutamol Inhaler", dosage: "100 mcg", frequency: "As needed", prescribedBy: "Dr. A. Hoti" },
        ],
        emergencyContacts: [
          { name: "Driton Gashi", phone: "+38349876543", relationship: "Brother" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
    {
      label: "Luan Bytyqi — Healthy, No Risk Factors",
      data: {
        personalInfo: {
          fullName: "Luan Bytyqi",
          dateOfBirth: "1988-01-30",
          age: calculateAge("1988-01-30"),
          patientEmail: "luan.bytyqi@example.com",
          insurance: "Illyria Insurance (Private)",
          bloodType: "O+",
          patientNationalId: "1187654321098",
          medicalRecordNumber: "MRN-2026-003042",
        },
        allergies: [],
        medicalHistory: [],
        riskFactors: {
          smokingStatus: "non_smoker",
          cigarettesPerDay: 0,
          diabetesDiagnosed: false,
          hba1c: null,
        },
        currentMedications: [],
        emergencyContacts: [
          { name: "Teuta Bytyqi", phone: "+38345551234", relationship: "Wife" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
    {
      label: "Drita Morina — Diabetic Smoker, Anticoagulant",
      data: {
        personalInfo: {
          fullName: "Drita Morina",
          dateOfBirth: "1970-11-05",
          age: calculateAge("1970-11-05"),
          patientEmail: "drita.morina@example.com",
          insurance: "Sigal Uniqa (Private)",
          bloodType: "AB-",
          patientNationalId: "1156789012345",
          medicalRecordNumber: "MRN-2026-004398",
        },
        allergies: ["Tetracycline", "Latex"],
        medicalHistory: [
          { condition: "Type 2 Diabetes", diagnosedAt: "2015-02-18", notes: "Poorly controlled. HbA1c 8.2%. On insulin therapy." },
          { condition: "Atrial Fibrillation", diagnosedAt: "2020-09-30", notes: "On anticoagulant therapy." },
          { condition: "Periodontitis", diagnosedAt: "2022-04-12", notes: "Previously treated. Bone loss noted on radiographs." },
        ],
        riskFactors: {
          smokingStatus: "current_smoker",
          cigarettesPerDay: 20,
          diabetesDiagnosed: true,
          hba1c: 8.2,
        },
        currentMedications: [
          { name: "Insulin Glargine", dosage: "30 units", frequency: "Once daily (evening)", prescribedBy: "Dr. F. Hoxha" },
          { name: "Metformin", dosage: "1000 mg", frequency: "Twice daily", prescribedBy: "Dr. F. Hoxha" },
          { name: "Warfarin", dosage: "5 mg", frequency: "Once daily", prescribedBy: "Dr. B. Kastrati" },
        ],
        emergencyContacts: [
          { name: "Shpend Morina", phone: "+38344567890", relationship: "Husband" },
          { name: "Arta Morina", phone: "+38344111222", relationship: "Daughter" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
    {
      label: "Besnik Haliti — Bisphosphonate, Osteoporosis",
      data: {
        personalInfo: {
          fullName: "Besnik Haliti",
          dateOfBirth: "1962-06-18",
          age: calculateAge("1962-06-18"),
          patientEmail: "besnik.haliti@example.com",
          insurance: "None (Self-pay)",
          bloodType: "A-",
          patientNationalId: "1167890123456",
          medicalRecordNumber: "MRN-2026-005221",
        },
        allergies: ["Amoxicillin", "NSAIDs"],
        medicalHistory: [
          { condition: "Osteoporosis", diagnosedAt: "2018-11-20", notes: "On bisphosphonate therapy. Annual dental clearance required." },
          { condition: "Gastric Reflux (GERD)", diagnosedAt: "2016-05-03", notes: "Managed with PPI. Tooth erosion noted." },
        ],
        riskFactors: {
          smokingStatus: "non_smoker",
          cigarettesPerDay: 0,
          diabetesDiagnosed: false,
          hba1c: null,
        },
        currentMedications: [
          { name: "Alendronate", dosage: "70 mg", frequency: "Once weekly", prescribedBy: "Dr. M. Salihu" },
          { name: "Omeprazole", dosage: "20 mg", frequency: "Once daily (morning)", prescribedBy: "Dr. E. Kelmendi" },
          { name: "Calcium + Vitamin D", dosage: "600 mg / 400 IU", frequency: "Once daily", prescribedBy: "Dr. M. Salihu" },
        ],
        emergencyContacts: [
          { name: "Mimoza Haliti", phone: "+38344333444", relationship: "Wife" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
    {
      label: "Valon Rexhepi — Young, Healthy, No Risk Factors",
      data: {
        personalInfo: {
          fullName: "Valon Rexhepi",
          dateOfBirth: "1998-03-14",
          age: calculateAge("1998-03-14"),
          patientEmail: "valon.rexhepi@example.com",
          insurance: "Dukagjini Insurance (Private)",
          bloodType: "O+",
          patientNationalId: "1298012345678",
          medicalRecordNumber: "MRN-2026-006103",
        },
        allergies: [],
        medicalHistory: [
          { condition: "Wisdom teeth extraction", diagnosedAt: "2022-08-15", notes: "All four impacted wisdom teeth removed. Uneventful recovery." },
        ],
        riskFactors: {
          smokingStatus: "non_smoker",
          cigarettesPerDay: 0,
          diabetesDiagnosed: false,
          hba1c: null,
        },
        currentMedications: [],
        emergencyContacts: [
          { name: "Liridona Rexhepi", phone: "+38344222333", relationship: "Mother" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
    {
      label: "Shkurte Berisha — Moderate Smoker, Pre-diabetic",
      data: {
        personalInfo: {
          fullName: "Shkurte Berisha",
          dateOfBirth: "1982-12-01",
          age: calculateAge("1982-12-01"),
          patientEmail: "shkurte.berisha@example.com",
          insurance: "KESCO Health (Public)",
          bloodType: "B-",
          patientNationalId: "1182345678901",
          medicalRecordNumber: "MRN-2026-007245",
        },
        allergies: ["Codeine"],
        medicalHistory: [
          { condition: "Pre-diabetes", diagnosedAt: "2023-06-20", notes: "HbA1c 6.8%. Dietary management advised. Monitoring every 3 months." },
          { condition: "Chronic Periodontitis", diagnosedAt: "2024-01-10", notes: "Stage II diagnosed. Scaling and root planing performed." },
          { condition: "Iron Deficiency Anemia", diagnosedAt: "2021-03-05", notes: "On iron supplements. Fatigue and pallor improved." },
        ],
        riskFactors: {
          smokingStatus: "current_smoker",
          cigarettesPerDay: 8,
          diabetesDiagnosed: true,
          hba1c: 6.8,
        },
        currentMedications: [
          { name: "Ferrous Sulfate", dosage: "325 mg", frequency: "Once daily", prescribedBy: "Dr. V. Maliqi" },
          { name: "Vitamin C", dosage: "500 mg", frequency: "Once daily", prescribedBy: "Dr. V. Maliqi" },
        ],
        emergencyContacts: [
          { name: "Faton Berisha", phone: "+38344555666", relationship: "Husband" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
    {
      label: "Agron Demolli — Heavy Smoker, Uncontrolled Diabetes",
      data: {
        personalInfo: {
          fullName: "Agron Demolli",
          dateOfBirth: "1965-07-22",
          age: calculateAge("1965-07-22"),
          patientEmail: "agron.demolli@example.com",
          insurance: "None (Self-pay)",
          bloodType: "A+",
          patientNationalId: "1165432109876",
          medicalRecordNumber: "MRN-2026-008377",
        },
        allergies: ["Erythromycin", "Sulfonamides", "Latex"],
        medicalHistory: [
          { condition: "Type 2 Diabetes", diagnosedAt: "2010-05-12", notes: "Poorly controlled. HbA1c 8.5%. Non-compliant with diet." },
          { condition: "Coronary Artery Disease", diagnosedAt: "2019-02-28", notes: "Stent placed in 2019. On dual antiplatelet therapy." },
          { condition: "Advanced Periodontitis", diagnosedAt: "2023-09-15", notes: "Stage III-IV. Multiple teeth with mobility. Bone loss >50%." },
          { condition: "Chronic Obstructive Pulmonary Disease", diagnosedAt: "2020-11-01", notes: "Related to long-term smoking. Uses bronchodilator." },
        ],
        riskFactors: {
          smokingStatus: "current_smoker",
          cigarettesPerDay: 15,
          diabetesDiagnosed: true,
          hba1c: 8.5,
        },
        currentMedications: [
          { name: "Metformin", dosage: "1000 mg", frequency: "Twice daily", prescribedBy: "Dr. F. Hoxha" },
          { name: "Glimepiride", dosage: "4 mg", frequency: "Once daily (morning)", prescribedBy: "Dr. F. Hoxha" },
          { name: "Aspirin", dosage: "100 mg", frequency: "Once daily", prescribedBy: "Dr. B. Kastrati" },
          { name: "Clopidogrel", dosage: "75 mg", frequency: "Once daily", prescribedBy: "Dr. B. Kastrati" },
          { name: "Tiotropium Inhaler", dosage: "18 mcg", frequency: "Once daily", prescribedBy: "Dr. A. Hoti" },
        ],
        emergencyContacts: [
          { name: "Vlora Demolli", phone: "+38344777888", relationship: "Wife" },
          { name: "Granit Demolli", phone: "+38344999000", relationship: "Son" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
    {
      label: "Zana Kelmendi — Former Smoker, Well-controlled Diabetes",
      data: {
        personalInfo: {
          fullName: "Zana Kelmendi",
          dateOfBirth: "1975-09-08",
          age: calculateAge("1975-09-08"),
          patientEmail: "zana.kelmendi@example.com",
          insurance: "Sigal Uniqa (Private)",
          bloodType: "AB+",
          patientNationalId: "1175678901234",
          medicalRecordNumber: "MRN-2026-009512",
        },
        allergies: ["Metronidazole"],
        medicalHistory: [
          { condition: "Type 2 Diabetes", diagnosedAt: "2018-04-10", notes: "Well-controlled with medication. HbA1c 6.2%. Regular follow-ups." },
          { condition: "Former Smoker", diagnosedAt: "2020-01-01", notes: "Quit smoking in 2020. Previously 10 cigarettes/day for 15 years." },
          { condition: "Mild Periodontitis", diagnosedAt: "2024-06-20", notes: "Stage I-II. Improved after smoking cessation. Regular maintenance." },
          { condition: "Hypothyroidism", diagnosedAt: "2016-08-15", notes: "Stable on levothyroxine. TSH within normal range." },
        ],
        riskFactors: {
          smokingStatus: "former_smoker",
          cigarettesPerDay: 0,
          diabetesDiagnosed: true,
          hba1c: 6.2,
        },
        currentMedications: [
          { name: "Metformin", dosage: "500 mg", frequency: "Twice daily", prescribedBy: "Dr. F. Hoxha" },
          { name: "Levothyroxine", dosage: "75 mcg", frequency: "Once daily (morning, empty stomach)", prescribedBy: "Dr. N. Sadiku" },
        ],
        emergencyContacts: [
          { name: "Blerim Kelmendi", phone: "+38344444555", relationship: "Husband" },
        ],
        consents: { privacyPolicyAccepted: true, treatmentConsent: true },
      },
    },
  ];

  const prefillForm = (index: number) => {
    setFormData(withFormDefaults(prefillDatasets[index].data));
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyInput.trim()],
      });
      setAllergyInput("");
    }
  };

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index),
    });
  };

  const addMedicalHistory = () => {
    setFormData({
      ...formData,
      medicalHistory: [
        ...formData.medicalHistory,
        { condition: "", diagnosedAt: "", notes: "" },
      ],
    });
  };

  const updateMedicalHistory = (index: number, field: keyof MedicalHistoryItem, value: string) => {
    const updated = [...formData.medicalHistory];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, medicalHistory: updated });
  };

  const removeMedicalHistory = (index: number) => {
    setFormData({
      ...formData,
      medicalHistory: formData.medicalHistory.filter((_, i) => i !== index),
    });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      currentMedications: [
        ...formData.currentMedications,
        { name: "", dosage: "", frequency: "", prescribedBy: "" },
      ],
    });
  };

  const updateMedication = (index: number, field: keyof MedicationItem, value: string) => {
    const updated = [...formData.currentMedications];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, currentMedications: updated });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      currentMedications: formData.currentMedications.filter((_, i) => i !== index),
    });
  };

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [
        ...formData.emergencyContacts,
        { name: "", phone: "", relationship: "" },
      ],
    });
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContactItem, value: string) => {
    const updated = [...formData.emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, emergencyContacts: updated });
  };

  const removeEmergencyContact = (index: number) => {
    setFormData({
      ...formData,
      emergencyContacts: formData.emergencyContacts.filter((_, i) => i !== index),
    });
  };

  const generateJson = async () => {
    const output = {
      submittedAt: new Date().toISOString(),
      formVersion: "patient_intake_v3",
      personalInfo: formData.personalInfo,
      allergies: formData.allergies,
      medicalHistory: formData.medicalHistory.filter(
        (item) => item.condition && item.diagnosedAt
      ),
      riskFactors: formData.riskFactors,
      currentMedications: formData.currentMedications.filter((item) => item.name),
      emergencyContacts: formData.emergencyContacts.filter((item) => item.name && item.phone),
      xRayAvailability: buildXRayAvailability(formData.xRayAvailability.hasXRayToUpload),
      doctorNotes: formData.doctorNotes.trim(),
      consents: formData.consents,
    };
    setGeneratedJson(output);

    try {
      // 1. Fetch BL (bone level) mock data
      const blResponse = await fetch("/api/final-data");
      const blData = blResponse.ok ? await blResponse.json() : null;

      // 2. Run periodontitis comparison using BL data
      const compareResponse = await fetch("/api/compare-periodontitis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientIntake: output, blData }),
      });
      const comparisonResult = compareResponse.ok ? await compareResponse.json() : null;

      // 3. Merge everything into final JSON
      const merged: Record<string, unknown> = {
        patientIntake: output,
      };
      if (blData) {
        merged.boneLevelAnalysis = blData;
      }
      if (comparisonResult?.result) {
        merged.result = comparisonResult.result;
      }
      setFinalJson(merged);
    } catch (error) {
      console.error("Error fetching final data:", error);
      setFinalJson(null);
    }

    setShowModal(true);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Patient Intake Form</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Complete the form to generate patient intake JSON data.
            </p>
            {!formData.xRayAvailability.hasXRayToUpload && (
              <div className="mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                X-Ray Pending: patient has not uploaded or provided one yet.
              </div>
            )}
          </div>
          <select
            onChange={(e) => {
              if (e.target.value) prefillForm(parseInt(e.target.value));
              e.target.value = "";
            }}
            className="shrink-0 rounded-lg border border-dashed border-zinc-300 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:border-white/20 dark:text-zinc-400 dark:hover:border-white/30 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            defaultValue=""
          >
            <option value="" disabled>Prefill Test Data...</option>
            {prefillDatasets.map((ds, i) => (
              <option key={i} value={i}>{ds.label}</option>
            ))}
          </select>
        </div>

        {/* X-Ray Availability */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-base font-semibold">X-Ray Availability</h2>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={formData.xRayAvailability.hasXRayToUpload}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  xRayAvailability: buildXRayAvailability(e.target.checked),
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-white/20"
            />
            <div>
              <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                X-Ray availability
              </span>
              <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                Check this if the patient already has an X-Ray ready to upload or provide.
              </span>
            </div>
          </label>
          <div className="mt-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                formData.xRayAvailability.status === "available"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
              }`}
            >
              Status: {formData.xRayAvailability.status}
            </span>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-base font-semibold">Personal Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.personalInfo.fullName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, fullName: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                placeholder="Arben Krasniqi"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Date of Birth *
              </label>
              <input
                type="text"
                value={isoToDisplay(formData.personalInfo.dateOfBirth)}
                onChange={(e) => {
                  const val = e.target.value;
                  const iso = displayToIso(val);
                  setFormData({
                    ...formData,
                    personalInfo: {
                      ...formData.personalInfo,
                      dateOfBirth: iso || val,
                      age: iso ? calculateAge(iso) : null,
                    },
                  });
                }}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Age
              </label>
              <input
                type="text"
                readOnly
                value={formData.personalInfo.age !== null ? `${formData.personalInfo.age} years` : ""}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
                placeholder="Auto-calculated"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Email *
              </label>
              <input
                type="email"
                value={formData.personalInfo.patientEmail}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, patientEmail: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                placeholder="arben.krasniqi@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Insurance
              </label>
              <input
                type="text"
                value={formData.personalInfo.insurance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, insurance: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                placeholder="Sigal Uniqa (Private)"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Blood Type
              </label>
              <select
                value={formData.personalInfo.bloodType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, bloodType: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              >
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                National ID
              </label>
              <input
                type="text"
                value={formData.personalInfo.patientNationalId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, patientNationalId: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                placeholder="1234567890123"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Medical Record Number
              </label>
              <input
                type="text"
                value={formData.personalInfo.medicalRecordNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, medicalRecordNumber: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                placeholder="MRN-2026-001284"
              />
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-base font-semibold">Allergies</h2>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                placeholder="e.g., Penicillin"
              />
              <button
                onClick={addAllergy}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                Add
              </button>
            </div>
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200"
                  >
                    {allergy}
                    <button
                      onClick={() => removeAllergy(index)}
                      className="ml-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Medical History */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Medical History</h2>
            <button
              onClick={addMedicalHistory}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              + Add Condition
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {formData.medicalHistory.map((item, index) => (
              <div key={index} className="rounded-lg border border-zinc-200 p-4 dark:border-white/10">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Condition #{index + 1}
                  </span>
                  <button
                    onClick={() => removeMedicalHistory(index)}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Condition *
                    </label>
                    <input
                      type="text"
                      value={item.condition}
                      onChange={(e) => updateMedicalHistory(index, "condition", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="Hypertension"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Diagnosed Date *
                    </label>
                    <input
                      type="date"
                      value={item.diagnosedAt}
                      onChange={(e) => updateMedicalHistory(index, "diagnosedAt", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Notes
                    </label>
                    <textarea
                      value={item.notes}
                      onChange={(e) => updateMedicalHistory(index, "notes", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="Controlled with medication. Checks BP weekly."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors (Periodontitis Grading) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-1 text-base font-semibold">Risk Factors</h2>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            Used for periodontitis grading (AAP/EFP 2017 classification)
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Smoking Status
              </label>
              <select
                value={formData.riskFactors.smokingStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    riskFactors: {
                      ...formData.riskFactors,
                      smokingStatus: e.target.value as RiskFactors["smokingStatus"],
                      cigarettesPerDay: e.target.value !== "current_smoker" ? 0 : formData.riskFactors.cigarettesPerDay,
                    },
                  })
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              >
                <option value="non_smoker">Non-smoker</option>
                <option value="former_smoker">Former smoker</option>
                <option value="current_smoker">Current smoker</option>
              </select>
            </div>
            {formData.riskFactors.smokingStatus === "current_smoker" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Cigarettes / Day
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.riskFactors.cigarettesPerDay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      riskFactors: { ...formData.riskFactors, cigarettesPerDay: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                  placeholder="0"
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.riskFactors.diabetesDiagnosed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    riskFactors: {
                      ...formData.riskFactors,
                      diabetesDiagnosed: e.target.checked,
                      hba1c: e.target.checked ? formData.riskFactors.hba1c : null,
                    },
                  })
                }
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-white/20"
              />
              <label className="text-sm text-zinc-700 dark:text-zinc-300">
                Diabetes Diagnosed
              </label>
            </div>
            {formData.riskFactors.diabetesDiagnosed && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  HbA1c (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={20}
                  value={formData.riskFactors.hba1c ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      riskFactors: { ...formData.riskFactors, hba1c: e.target.value ? parseFloat(e.target.value) : null },
                    })
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                  placeholder="6.5"
                />
              </div>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Current Medications</h2>
            <button
              onClick={addMedication}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              + Add Medication
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {formData.currentMedications.map((item, index) => (
              <div key={index} className="rounded-lg border border-zinc-200 p-4 dark:border-white/10">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Medication #{index + 1}
                  </span>
                  <button
                    onClick={() => removeMedication(index)}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateMedication(index, "name", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="Amlodipine"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="5 mg"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="Once daily (morning)"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Prescribed By
                    </label>
                    <input
                      type="text"
                      value={item.prescribedBy}
                      onChange={(e) => updateMedication(index, "prescribedBy", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="Dr. L. Berisha"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Emergency Contacts</h2>
            <button
              onClick={addEmergencyContact}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              + Add Contact
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {formData.emergencyContacts.map((item, index) => (
              <div key={index} className="rounded-lg border border-zinc-200 p-4 dark:border-white/10">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Contact #{index + 1}
                  </span>
                  <button
                    onClick={() => removeEmergencyContact(index)}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateEmergencyContact(index, "name", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="Blerta Krasniqi"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={item.phone}
                      onChange={(e) => updateEmergencyContact(index, "phone", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="+38344123456"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={item.relationship}
                      onChange={(e) => updateEmergencyContact(index, "relationship", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      placeholder="Spouse"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Notes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-base font-semibold">Doctor Notes</h2>
          <textarea
            value={formData.doctorNotes}
            onChange={(e) =>
              setFormData({
                ...formData,
                doctorNotes: e.target.value,
              })
            }
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
            placeholder="Add notes for the doctor reviewing this patient."
            rows={4}
          />
        </div>

        {/* Consents */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-base font-semibold">Consents</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.consents.privacyPolicyAccepted}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consents: { ...formData.consents, privacyPolicyAccepted: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-white/20"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Privacy Policy Accepted
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.consents.treatmentConsent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consents: { ...formData.consents, treatmentConsent: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-white/20"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Treatment Consent</span>
            </label>
          </div>
        </div>

        <button
          onClick={generateJson}
          className="w-full inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
        >
          Submit PPI
        </button>
      </div>

      <JsonOutputModal
        open={showModal}
        onClose={() => setShowModal(false)}
        generatedJson={generatedJson}
        finalJson={finalJson}
      />
    </div>
  );
}
