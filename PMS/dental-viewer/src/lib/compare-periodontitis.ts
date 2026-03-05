// ─── Types ───────────────────────────────────────────────────────────────────

export interface PatientIntake {
  personalInfo?: {
    fullName?: string;
    dateOfBirth?: string;
    medicalRecordNumber?: string;
  };
  medicalHistory?: { condition: string; diagnosedAt: string; notes?: string }[];
  riskFactors?: {
    smokingStatus?: string;
    cigarettesPerDay?: number;
    diabetesDiagnosed?: boolean;
    hba1c?: number | null;
  };
  currentMedications?: { name: string; dosage?: string; frequency?: string; prescribedBy?: string }[];
  allergies?: string[];
}

/** Nanok periodontitis clinical data (from AI imaging analysis). */
export interface NanokPeriodontitis {
  detected?: boolean;
  patient?: {
    age?: number;
    teeth_present?: number;
    teeth_lost_to_periodontitis?: number;
  };
  clinical_findings?: {
    clinical_attachment_loss?: {
      max_interdental_cal_mm?: number;
      mean_cal_mm?: number;
      sites_measured?: number;
    };
    probing_depths?: {
      max_probing_depth_mm?: number;
      mean_probing_depth_mm?: number;
      sites_with_depth_gte_6mm?: number;
    };
    radiographic_bone_loss?: {
      pattern?: string;
      max_vertical_bone_loss_mm?: number;
      extent?: string;
      percentage_estimate?: number;
    };
    bleeding_on_probing?: {
      sites_positive?: number;
      bop_percentage?: number;
    };
    furcation_involvement?: { tooth?: number; class?: string; surface?: string }[];
    mobility?: { tooth?: number; degree?: number }[];
    ridge_defects?: string;
    teeth_involved_count?: number;
    teeth_involved_percentage?: number;
  };
  risk_modifiers?: {
    smoking?: { current_smoker?: boolean; cigarettes_per_day?: number };
    diabetes?: { diagnosed?: boolean; hba1c?: number };
  };
  progression_evidence?: {
    direct_evidence_available?: boolean;
    bone_loss_over_5_years_mm?: number;
    bone_loss_age_ratio?: number;
  };
}

export interface DiagnosisResult {
  periodontitis_detected: boolean;
  full_diagnosis: string;
  stage: string;
  grade: string;
  extent: string;
  staging_reasoning: string[];
  grading_reasoning: string[];
}

export interface ComparisonResult {
  comparedAt: string;
  patient: { fullName: string; medicalRecordNumber: string };
  patientSummary: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
  result: DiagnosisResult;
}

// ─── Threshold parsing (driven by reference JSON values) ────────────────────

function parseThreshold(value: string): { min: number; max: number } | null {
  const cleaned = value.replace(/%/g, "").trim();
  const rangeMatch = cleaned.match(/^([0-9.]+)\s*[–-]\s*([0-9.]+)$/);
  if (rangeMatch) return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
  const gteMatch = cleaned.match(/^[≥>]=?\s*([0-9.]+)$/);
  if (gteMatch) return { min: parseFloat(gteMatch[1]), max: Infinity };
  const lteMatch = cleaned.match(/^[≤<]=?\s*([0-9.]+)$/);
  if (lteMatch) return { min: 0, max: parseFloat(lteMatch[1]) };
  const ltMatch = cleaned.match(/^<\s*([0-9.]+)$/);
  if (ltMatch) return { min: 0, max: parseFloat(ltMatch[1]) - 0.01 };
  const gtMatch = cleaned.match(/^>\s*([0-9.]+)$/);
  if (gtMatch) return { min: parseFloat(gtMatch[1]) + 0.01, max: Infinity };
  return null;
}

function fitsThreshold(patientValue: number, refValue: string): boolean {
  const range = parseThreshold(refValue);
  if (!range) return false;
  return patientValue >= range.min && patientValue <= range.max;
}

// ─── Staging (uses nanok clinical_findings + reference stages) ──────────────

function determineStage(
  nanok: NanokPeriodontitis,
  stagingData: Record<string, unknown>
): { stage: string; reasoning: string[] } {
  const stages = (stagingData.stages ?? {}) as Record<string, Record<string, unknown>>;
  const stageNames = Object.keys(stages);
  const reasoning: string[] = [];
  let bestStage = "";

  const cf = nanok.clinical_findings;
  const cal = cf?.clinical_attachment_loss?.max_interdental_cal_mm;
  const probingDepth = cf?.probing_depths?.max_probing_depth_mm;
  const boneLossPct = cf?.radiographic_bone_loss?.percentage_estimate;
  const verticalBL = cf?.radiographic_bone_loss?.max_vertical_bone_loss_mm;
  const toothLoss = nanok.patient?.teeth_lost_to_periodontitis;
  const furcationClasses = (cf?.furcation_involvement ?? []).map((f) => f.class).filter(Boolean);
  const ridgeDefects = cf?.ridge_defects;

  for (const stageName of stageNames) {
    const stageData = stages[stageName] as Record<string, unknown>;
    const severity = (stageData.severity ?? {}) as Record<string, unknown>;
    const complexity = (stageData.complexity ?? {}) as Record<string, unknown>;
    let stageMatches = false;

    // CAL
    if (cal != null && severity.interdental_CAL_mm) {
      if (fitsThreshold(cal, String(severity.interdental_CAL_mm))) {
        reasoning.push(`CAL ${cal} mm fits ${stageName} criteria (${severity.interdental_CAL_mm})`);
        stageMatches = true;
      }
    }

    // Bone loss %
    if (boneLossPct != null && severity.radiographic_bone_loss) {
      const rbl = severity.radiographic_bone_loss as Record<string, unknown>;
      if (rbl.percentage && fitsThreshold(boneLossPct, String(rbl.percentage))) {
        reasoning.push(`Bone loss ${boneLossPct}% fits ${stageName} criteria (${rbl.percentage})`);
        stageMatches = true;
      }
    }

    // Tooth loss
    if (toothLoss != null && severity.tooth_loss_due_to_periodontitis) {
      const refTooth = String(severity.tooth_loss_due_to_periodontitis);
      if (refTooth.toLowerCase() === "none" && toothLoss === 0) {
        reasoning.push(`No tooth loss fits ${stageName} criteria (${refTooth})`);
        stageMatches = true;
      } else if (refTooth.toLowerCase() !== "none") {
        const range = parseThreshold(refTooth.replace(/\s*t[ce]*eth?/i, ""));
        if (range && toothLoss >= range.min && toothLoss <= range.max) {
          reasoning.push(`Tooth loss (${toothLoss}) fits ${stageName} criteria (${refTooth})`);
          stageMatches = true;
        }
      }
    }

    // Probing depth
    const refPD = complexity.max_probing_depth_mm ?? complexity.probing_depth_mm;
    if (probingDepth != null && refPD) {
      if (fitsThreshold(probingDepth, String(refPD))) {
        reasoning.push(`Probing depth ${probingDepth} mm fits ${stageName} criteria (${refPD})`);
        stageMatches = true;
      }
    }

    // Vertical bone loss
    if (verticalBL != null && complexity.vertical_bone_loss_mm) {
      if (fitsThreshold(verticalBL, String(complexity.vertical_bone_loss_mm))) {
        reasoning.push(`Vertical bone loss ${verticalBL} mm fits ${stageName} criteria (${complexity.vertical_bone_loss_mm})`);
        stageMatches = true;
      }
    }

    // Furcation
    if (furcationClasses.length > 0 && complexity.furcation_involvement) {
      const refFurc = String(complexity.furcation_involvement).toLowerCase();
      for (const fc of furcationClasses) {
        const patFurc = `class ${fc}`.toLowerCase();
        if (refFurc.includes(patFurc) || patFurc.includes(refFurc)) {
          reasoning.push(`Furcation Class ${fc} fits ${stageName} criteria (${complexity.furcation_involvement})`);
          stageMatches = true;
          break;
        }
      }
    }

    // Ridge defects
    if (ridgeDefects && complexity.ridge_defects) {
      if (ridgeDefects.toLowerCase().includes(String(complexity.ridge_defects).toLowerCase())) {
        reasoning.push(`Ridge defects "${ridgeDefects}" fits ${stageName} criteria (${complexity.ridge_defects})`);
        stageMatches = true;
      }
    }

    if (stageMatches) bestStage = stageName;
  }

  if (!bestStage) {
    reasoning.push("Insufficient clinical data to determine stage");
    return { stage: "Undetermined", reasoning };
  }
  return { stage: bestStage, reasoning };
}

// ─── Grading (uses nanok risk_modifiers + progression_evidence + reference) ─

function determineGrade(
  nanok: NanokPeriodontitis,
  gradingData: Record<string, unknown>,
  intake?: PatientIntake
): { grade: string; reasoning: string[] } {
  const grades = (gradingData.grades ?? {}) as Record<string, Record<string, unknown>>;
  const defaultGrade = String(gradingData.default_assumption ?? "Grade B");
  const gradeNames = Object.keys(grades);
  const reasoning: string[] = [];
  let bestGrade = defaultGrade;
  reasoning.push(`Default assumption: ${defaultGrade}`);

  // Use nanok risk modifiers, fall back to intake risk factors
  const rf = intake?.riskFactors;
  const smoking = nanok.risk_modifiers?.smoking ?? (rf ? {
    current_smoker: rf.smokingStatus === "current_smoker",
    cigarettes_per_day: rf.cigarettesPerDay ?? 0,
  } : undefined);
  const diabetes = nanok.risk_modifiers?.diabetes ?? (rf ? {
    diagnosed: rf.diabetesDiagnosed ?? false,
    hba1c: rf.hba1c ?? undefined,
  } : undefined);
  const progression = nanok.progression_evidence;
  // Use nanok age, fall back to calculating from intake DOB
  let patientAge = nanok.patient?.age;
  if (patientAge == null && intake?.personalInfo?.dateOfBirth) {
    const dob = new Date(intake.personalInfo.dateOfBirth);
    const now = new Date();
    patientAge = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
  const boneLossPct = nanok.clinical_findings?.radiographic_bone_loss?.percentage_estimate;

  for (const gradeName of gradeNames) {
    const gradeData = grades[gradeName] as Record<string, unknown>;
    const riskFactors = (gradeData.risk_factors ?? {}) as Record<string, string>;
    const primaryCriteria = (gradeData.primary_criteria ?? {}) as Record<string, unknown>;
    const indirectEvidence = (primaryCriteria.indirect_evidence ?? {}) as Record<string, unknown>;
    let gradeMatches = false;

    // Smoking
    if (smoking && riskFactors.smoking) {
      const refSmoking = riskFactors.smoking.toLowerCase();
      if (refSmoking.includes("non-smoker") && !smoking.current_smoker) {
        reasoning.push(`Non-smoker matches ${gradeName} (${riskFactors.smoking})`);
        gradeMatches = true;
      } else if (smoking.current_smoker && smoking.cigarettes_per_day != null) {
        const cpdRange = parseThreshold(riskFactors.smoking.replace(/cigarettes?\/day/i, "").trim());
        if (cpdRange && smoking.cigarettes_per_day >= cpdRange.min && smoking.cigarettes_per_day <= cpdRange.max) {
          reasoning.push(`${smoking.cigarettes_per_day} cigarettes/day matches ${gradeName} (${riskFactors.smoking})`);
          gradeMatches = true;
        }
      }
    }

    // Diabetes / HbA1c
    if (diabetes && riskFactors.diabetes) {
      const refDiabetes = riskFactors.diabetes;
      const hba1cMatch = refDiabetes.match(/HbA1c\s*([<≥>=]+)\s*([0-9.]+)%?/i);
      if (hba1cMatch && diabetes.hba1c != null) {
        const op = hba1cMatch[1];
        const threshold = parseFloat(hba1cMatch[2]);
        let fits = false;
        if (op.includes("≥") || op.includes(">=")) fits = diabetes.hba1c >= threshold;
        else if (op.includes("<")) fits = diabetes.hba1c < threshold;
        if (fits) {
          reasoning.push(`HbA1c ${diabetes.hba1c}% matches ${gradeName} (${refDiabetes})`);
          gradeMatches = true;
        }
      } else if (refDiabetes.toLowerCase().includes("normoglycemic") || refDiabetes.toLowerCase().includes("no diabetes")) {
        if (!diabetes.diagnosed) {
          reasoning.push(`No diabetes — matches ${gradeName} (${refDiabetes})`);
          gradeMatches = true;
        }
      }
    }

    // Direct evidence: bone loss over 5 years
    if (progression?.bone_loss_over_5_years_mm != null && primaryCriteria.direct_evidence) {
      const refDirect = String(primaryCriteria.direct_evidence);
      if (refDirect.toLowerCase().includes("no loss") && progression.bone_loss_over_5_years_mm === 0) {
        reasoning.push(`No bone loss over 5 years matches ${gradeName} (${refDirect})`);
        gradeMatches = true;
      } else {
        const mmRange = parseThreshold(refDirect.replace(/\s*mm.*$/i, "").replace(/over\s*\d+\s*years?/i, "").trim());
        if (mmRange && progression.bone_loss_over_5_years_mm >= mmRange.min && progression.bone_loss_over_5_years_mm <= mmRange.max) {
          reasoning.push(`Bone loss ${progression.bone_loss_over_5_years_mm} mm/5yr matches ${gradeName} (${refDirect})`);
          gradeMatches = true;
        }
      }
    }

    // Indirect evidence: % bone loss / age ratio
    if (indirectEvidence.percent_bone_loss_per_age) {
      const ratio = progression?.bone_loss_age_ratio
        ?? (boneLossPct != null && patientAge ? boneLossPct / patientAge : null);
      if (ratio != null) {
        const refRatio = String(indirectEvidence.percent_bone_loss_per_age);
        if (fitsThreshold(ratio, refRatio)) {
          reasoning.push(`Bone loss/age ratio ${ratio.toFixed(2)} matches ${gradeName} (${refRatio})`);
          gradeMatches = true;
        }
      }
    }

    if (gradeMatches) bestGrade = gradeName;
  }

  return { grade: bestGrade, reasoning };
}

// ─── Extent determination from nanok data ───────────────────────────────────

function determineExtent(nanok: NanokPeriodontitis, stagingData: Record<string, unknown>): string {
  const teethPct = nanok.clinical_findings?.teeth_involved_percentage;
  const descriptors = (stagingData.extent_and_distribution_descriptors ?? []) as string[];

  if (teethPct == null || descriptors.length === 0) return "Undetermined";

  for (const desc of descriptors) {
    const pctMatch = desc.match(/<\s*(\d+)%/);
    if (pctMatch) {
      const threshold = parseFloat(pctMatch[1]);
      if (teethPct < threshold) return desc.split("(")[0].trim();
    }
  }

  const generalized = descriptors.find((d) => d.toLowerCase().includes("generalized"));
  if (generalized) return "Generalized";

  return descriptors[descriptors.length - 1] ?? "Undetermined";
}

// ─── Main comparison function ────────────────────────────────────────────────

/**
 * Compares patient intake + nanok clinical data against the staging/grading
 * reference to produce a periodontitis diagnosis.
 * The reference data is used internally only — not included in the output.
 */
export function compareAgainstReference(
  intake: PatientIntake,
  nanokPerio: NanokPeriodontitis | null,
  referenceData: Record<string, unknown>
): ComparisonResult {
  const periodontitis = (referenceData.periodontitis ?? {}) as Record<string, unknown>;
  const nanok = nanokPerio ?? {};

  // Determine stage, grade, extent from nanok clinical data + reference
  const stagingData = (periodontitis.staging ?? {}) as Record<string, unknown>;
  const gradingData = (periodontitis.grading ?? {}) as Record<string, unknown>;

  const staging = determineStage(nanok, stagingData);
  const grading = determineGrade(nanok, gradingData, intake);
  const extent = determineExtent(nanok, stagingData);

  const hasClinicalData = nanok.clinical_findings != null;
  const periodontitisDetected = (nanok.detected === true) || (hasClinicalData && staging.stage !== "Undetermined");

  const grades = (gradingData.grades ?? {}) as Record<string, Record<string, unknown>>;
  const matchedGradeData = grades[grading.grade] as Record<string, unknown> | undefined;
  const progressionRate = matchedGradeData ? String(matchedGradeData.progression_rate ?? "") : "";

  const fullDiagnosis = periodontitisDetected
    ? `${extent} Periodontitis, ${staging.stage}, ${grading.grade}${progressionRate ? ` (${progressionRate} rate)` : ""}`
    : "Insufficient clinical data for periodontitis classification";

  return {
    comparedAt: new Date().toISOString(),
    patient: {
      fullName: intake.personalInfo?.fullName ?? "Unknown",
      medicalRecordNumber: intake.personalInfo?.medicalRecordNumber ?? "N/A",
    },
    patientSummary: {
      conditions: (intake.medicalHistory ?? []).map((c) => c.condition),
      medications: (intake.currentMedications ?? []).map((m) => m.name),
      allergies: intake.allergies ?? [],
    },
    result: {
      periodontitis_detected: periodontitisDetected,
      full_diagnosis: fullDiagnosis,
      stage: staging.stage,
      grade: grading.grade,
      extent,
      staging_reasoning: staging.reasoning,
      grading_reasoning: grading.reasoning,
    },
  };
}
