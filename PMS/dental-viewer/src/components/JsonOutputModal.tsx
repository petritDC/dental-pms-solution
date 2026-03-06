"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types for Final JSON patient record ─────────────────────────────────────

interface PatientIntake {
  submittedAt?: string;
  formVersion?: string;
  personalInfo?: {
    fullName?: string;
    patientEmail?: string;
    insurance?: string;
    bloodType?: string;
    patientNationalId?: string;
    medicalRecordNumber?: string;
  };
  allergies?: string[];
  medicalHistory?: { condition: string; diagnosedAt: string; notes?: string }[];
  riskFactors?: {
    smokingStatus?: string;
    cigarettesPerDay?: number;
    diabetesDiagnosed?: boolean;
    hba1c?: number | null;
  };
  currentMedications?: { name: string; dosage?: string; frequency?: string; prescribedBy?: string }[];
  emergencyContacts?: { name: string; phone: string; relationship?: string }[];
  consents?: {
    privacyPolicyAccepted?: boolean;
    treatmentConsent?: boolean;
  };
}

// ─── Syntax-highlighted code viewer (Generated JSON tab) ─────────────────────

function colorizeJsonLine(line: string): React.ReactNode {
  const keyValueMatch = line.match(/^(\s*)"([^"]+)"(:\s*)(.*)/);
  if (keyValueMatch) {
    const [, indent, key, colon, rest] = keyValueMatch;
    let valueNode: React.ReactNode = <span className="text-zinc-400">{rest}</span>;
    if (rest.startsWith('"')) {
      valueNode = <span className="text-emerald-400">{rest}</span>;
    } else if (rest === "true," || rest === "true" || rest === "false," || rest === "false") {
      valueNode = <span className="text-amber-400">{rest}</span>;
    } else if (rest === "null," || rest === "null") {
      valueNode = <span className="text-red-400">{rest}</span>;
    } else if (/^-?\d/.test(rest)) {
      valueNode = <span className="text-blue-400">{rest}</span>;
    }
    return (
      <>
        {indent}
        <span className="text-violet-300">&quot;{key}&quot;</span>
        <span className="text-zinc-500">{colon}</span>
        {valueNode}
      </>
    );
  }

  const stringMatch = line.match(/^(\s*)"(.*)"(,?)$/);
  if (stringMatch) {
    const [, indent, val, comma] = stringMatch;
    return (
      <>
        {indent}
        <span className="text-emerald-400">&quot;{val}&quot;</span>
        <span className="text-zinc-500">{comma}</span>
      </>
    );
  }

  return <span className="text-zinc-500">{line}</span>;
}

function CodeViewer({ data }: { data: object }) {
  const lines = JSON.stringify(data, null, 2).split("\n");

  return (
    <div className="overflow-hidden rounded-xl border border-white/6 bg-zinc-950 dark:bg-black">
      <div className="flex items-center gap-2 border-b border-white/6 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        </div>
        <span className="ml-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          json
        </span>
        <span className="ml-auto text-[10px] text-zinc-600">
          {lines.length} lines
        </span>
      </div>
      <div className="flex overflow-x-auto">
        <div className="shrink-0 select-none border-r border-white/4 py-4 text-right">
          {lines.map((_, i) => (
            <div key={i} className="px-3 font-mono text-[11px] leading-5 text-zinc-700">
              {i + 1}
            </div>
          ))}
        </div>
        <pre className="flex-1 py-4 pl-4 pr-6 font-mono text-[11px] leading-5 text-zinc-300">
          {lines.map((line, i) => (
            <div key={i}>{colorizeJsonLine(line)}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ─── Patient record viewer (Final JSON tab) ──────────────────────────────────

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

const BLOOD_COLORS: Record<string, string> = {
  "A+": "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800/50",
  "A-": "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800/50",
  "B+": "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-800/50",
  "B-": "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-800/50",
  "O+": "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800/50",
  "O-": "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800/50",
  "AB+": "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:ring-purple-800/50",
  "AB-": "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:ring-purple-800/50",
};

function Section({ icon, title, count, children }: { icon: React.ReactNode; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-400">
          {icon}
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {count !== undefined && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-white/6 dark:text-zinc-400">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white px-3.5 py-3 dark:border-white/6 dark:bg-white/2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{value || "—"}</p>
    </div>
  );
}

function ConsentRow({ label, accepted }: { label: string; accepted?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          accepted
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
            : "bg-zinc-100 text-zinc-400 dark:bg-white/6"
        }`}
      >
        {accepted ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M6 2L2 6M2 2l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <span
        className={`ml-auto text-xs font-medium ${
          accepted ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
        }`}
      >
        {accepted ? "Accepted" : "Not accepted"}
      </span>
    </div>
  );
}

function FinalJsonViewer({ data }: { data: object }) {
  const d = data as Record<string, unknown>;
  const intake = (d.patientIntake ?? {}) as PatientIntake;
  const info = intake.personalInfo ?? {};

  const submittedAt = intake.submittedAt
    ? new Date(intake.submittedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  const bloodCls = info.bloodType
    ? BLOOD_COLORS[info.bloodType] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/6 dark:text-zinc-300 dark:ring-white/10"
    : null;

  const extraEntries = Object.entries(d).filter(([k]) => k !== "patientIntake" && k !== "result");

  return (
    <div className="flex flex-col gap-6">

      {/* ── Patient header ── */}
      <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-linear-to-br from-zinc-50 to-white p-5 dark:border-white/8 dark:from-white/3 dark:to-white/1">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-200 dark:text-zinc-900">
          {initials(info.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="truncate text-lg font-semibold text-zinc-900 dark:text-white">
              {info.fullName || "Unknown Patient"}
            </span>
            {bloodCls && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${bloodCls}`}>
                {info.bloodType}
              </span>
            )}
            {intake.formVersion && (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/6 dark:text-zinc-400">
                {intake.formVersion}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{info.patientEmail || "No email"}</p>
        </div>
        {submittedAt && (
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Submitted</p>
            <p className="mt-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">{submittedAt}</p>
          </div>
        )}
      </div>

      {/* ── Personal info grid ── */}
      <Section
        icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        title="Personal Information"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <InfoCard label="Insurance" value={info.insurance} />
          <InfoCard label="National ID" value={info.patientNationalId} />
          <InfoCard label="Medical Record No." value={info.medicalRecordNumber} />
        </div>
      </Section>

      {/* ── Allergies ── */}
      <Section
        icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        title="Allergies"
        count={intake.allergies?.length ?? 0}
      >
        {intake.allergies && intake.allergies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {intake.allergies.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500" />
                {a}
              </span>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-3 text-center text-sm text-zinc-400 dark:border-white/6 dark:bg-white/1 dark:text-zinc-500">
            No known allergies
          </p>
        )}
      </Section>

      {/* ── Medical history ── */}
      {intake.medicalHistory && intake.medicalHistory.length > 0 && (
        <Section
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
          title="Medical History"
          count={intake.medicalHistory.length}
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {intake.medicalHistory.map((item, i) => (
              <div key={i} className="rounded-xl border border-zinc-100 bg-white px-4 py-3 dark:border-white/6 dark:bg-white/2">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.condition}</span>
                  <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/6 dark:text-zinc-400">
                    {item.diagnosedAt}
                  </span>
                </div>
                {item.notes && <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.notes}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Current medications ── */}
      {intake.currentMedications && intake.currentMedications.length > 0 && (
        <Section
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M5.5 2H10a1.5 1.5 0 011.5 1.5V4h-7V3.5A1.5 1.5 0 015.5 2z" stroke="currentColor" strokeWidth="1.3" /><path d="M4 4h8l-.75 9.5H4.75L4 4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 7v3.5M6.5 8.75h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}
          title="Current Medications"
          count={intake.currentMedications.length}
        >
          <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-white/6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-white/6 dark:bg-white/2">
                  {["Medication", "Dosage", "Frequency", "Prescribed By"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent">
                {intake.currentMedications.map((med, i) => (
                  <tr key={i} className="border-b border-zinc-50 last:border-0 dark:border-white/4">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{med.name}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{med.dosage || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{med.frequency || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{med.prescribedBy || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Emergency contacts ── */}
      {intake.emergencyContacts && intake.emergencyContacts.length > 0 && (
        <Section
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3.5A1.5 1.5 0 014.5 2h7A1.5 1.5 0 0113 3.5v9a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 12.5v-9z" stroke="currentColor" strokeWidth="1.5" /><path d="M6 6h4M6 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
          title="Emergency Contacts"
          count={intake.emergencyContacts.length}
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {intake.emergencyContacts.map((c, i) => (
              <div key={i} className="rounded-xl border border-zinc-100 bg-white px-4 py-3 dark:border-white/6 dark:bg-white/2">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.name}</span>
                  {c.relationship && (
                    <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/6 dark:text-zinc-400">
                      {c.relationship}
                    </span>
                  )}
                </div>
                {c.phone && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <path d="M3 3.5c0-.828.672-1.5 1.5-1.5.414 0 .75.336.75.75v2.5a.75.75 0 01-.22.53l-1 1a9.5 9.5 0 004.69 4.69l1-1a.75.75 0 01.53-.22h2.5c.414 0 .75.336.75.75v.5c0 .828-.672 1.5-1.5 1.5A11.5 11.5 0 013 3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                    {c.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Consents ── */}
      {intake.consents && (
        <Section
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          title="Consents"
        >
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white px-4 dark:divide-white/6 dark:border-white/6 dark:bg-white/2">
            <ConsentRow label="Privacy Policy" accepted={intake.consents.privacyPolicyAccepted} />
            <ConsentRow label="Treatment Consent" accepted={intake.consents.treatmentConsent} />
          </div>
        </Section>
      )}

      {/* ── Extra API data (fallback to generic viewer) ── */}
      {extraEntries.length > 0 && extraEntries.map(([key, val]) => (
        <Section
          key={key}
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
          title={key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()).trim()}
        >
          <div className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-white/6 dark:bg-white/2">
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              {typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)}
            </pre>
          </div>
        </Section>
      ))}
    </div>
  );
}

// ─── Diagnosis viewer (Comparison tab) ──────────────────────────────────────

interface DiagnosisResult {
  periodontitis_detected: boolean;
  full_diagnosis: string;
  stage: string;
  grade: string;
  extent: string;
  staging_reasoning: string[];
  grading_reasoning: string[];
}

function DiagnosisViewer({ data }: { data: object }) {
  const d = data as Record<string, unknown>;
  const intake = (d.patientIntake ?? {}) as PatientIntake;
  const result = d.result as DiagnosisResult | undefined;

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/6">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <path d="M4 8h8M6 5l-3 3 3 3M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No diagnosis data available</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Generate final JSON to run periodontitis comparison</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Diagnosis Result ── */}
      <div className={`rounded-2xl border p-5 ${
        result.periodontitis_detected
          ? "border-red-200 bg-linear-to-br from-red-50/60 to-white dark:border-red-800/30 dark:from-red-950/20 dark:to-white/1"
          : "border-emerald-200 bg-linear-to-br from-emerald-50/60 to-white dark:border-emerald-800/30 dark:from-emerald-950/20 dark:to-white/1"
      }`}>
        <div className="mb-3 flex items-center gap-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            result.periodontitis_detected
              ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          }`}>
            {result.periodontitis_detected ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2l6 10H2L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 7v2M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Diagnosis Result
          </h3>
        </div>

        <p className="text-xl font-semibold text-zinc-900 dark:text-white">
          {result.full_diagnosis}
        </p>

        {result.periodontitis_detected && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-red-700 dark:border-red-800/40 dark:bg-white/4 dark:text-red-300">
              {result.stage}
            </span>
            <span className="rounded-full border border-amber-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-amber-700 dark:border-amber-800/40 dark:bg-white/4 dark:text-amber-300">
              {result.grade}
            </span>
            <span className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/4 dark:text-zinc-300">
              {result.extent}
            </span>
          </div>
        )}

        {/* Staging reasoning */}
        {result.staging_reasoning.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Staging Reasoning</p>
            <ul className="flex flex-col gap-1.5">
              {result.staging_reasoning.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Grading reasoning */}
        {result.grading_reasoning.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Grading Reasoning</p>
            <ul className="flex flex-col gap-1.5">
              {result.grading_reasoning.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Patient data summary ── */}
      <Section
        icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        title="Patient Data Used"
      >
        <div className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-white/6 dark:bg-white/2">
          {intake.medicalHistory && intake.medicalHistory.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Conditions</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {intake.medicalHistory.map((c, i) => (
                  <span key={i} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700 dark:border-white/10 dark:bg-white/4 dark:text-zinc-300">
                    {c.condition}
                  </span>
                ))}
              </div>
            </div>
          )}
          {intake.currentMedications && intake.currentMedications.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Medications</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {intake.currentMedications.map((m, i) => (
                  <span key={i} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {intake.allergies && intake.allergies.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Allergies</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {intake.allergies.map((a, i) => (
                  <span key={i} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(!intake.medicalHistory || intake.medicalHistory.length === 0) &&
            (!intake.currentMedications || intake.currentMedications.length === 0) &&
            (!intake.allergies || intake.allergies.length === 0) && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No patient data available for comparison.</p>
          )}
        </div>
      </Section>

      {/* ── Risk Factors ── */}
      {intake.riskFactors && (
        <Section
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2l6 10H2L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
          title="Risk Factors"
        >
          <div className="rounded-xl border border-zinc-100 bg-white p-4 dark:border-white/6 dark:bg-white/2">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-sm font-medium ${intake.riskFactors.smokingStatus === "current_smoker"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300"
                : intake.riskFactors.smokingStatus === "former_smoker"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                }`}>
                {intake.riskFactors.smokingStatus === "current_smoker"
                  ? `Smoker (${intake.riskFactors.cigarettesPerDay}/day)`
                  : intake.riskFactors.smokingStatus === "former_smoker"
                    ? "Former smoker"
                    : "Non-smoker"}
              </span>
              <span className={`rounded-full border px-3 py-1 text-sm font-medium ${intake.riskFactors.diabetesDiagnosed
                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                }`}>
                {intake.riskFactors.diabetesDiagnosed
                  ? `Diabetes (HbA1c ${intake.riskFactors.hba1c ?? "N/A"}%)`
                  : "No diabetes"}
              </span>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

type TabId = "generated" | "final" | "comparison";

interface JsonOutputModalProps {
  open: boolean;
  onClose: () => void;
  generatedJson: object | null;
  finalJson: object | null;
}

export function JsonOutputModal({ open, onClose, generatedJson, finalJson }: JsonOutputModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("generated");
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  if (!open) return null;

  const currentData = activeTab === "generated" ? generatedJson : finalJson;

  const handleCopy = () => {
    if (currentData) {
      navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
      setCopied(true);
    }
  };

  const handleDownload = () => {
    if (!currentData) return;
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const names: Record<TabId, string> = { generated: "generated-output", final: "final-output", comparison: "periodontitis-diagnosis" };
    a.download = `${names[activeTab]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative mx-4 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 2h5l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">JSON Output</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Patient intake data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 px-6 py-2.5 dark:border-white/10">
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-white/6">
            {([
              { id: "generated" as TabId, label: "Generated" },
              { id: "final" as TabId, label: "Final Record" },
              { id: "comparison" as TabId, label: "Diagnosis" },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "generated" && generatedJson && <CodeViewer data={generatedJson} />}
          {activeTab === "generated" && !generatedJson && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/6">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M4 2h5l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No generated JSON yet</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Fill in the form and click generate</p>
            </div>
          )}
          {activeTab === "final" && finalJson && <FinalJsonViewer data={finalJson} />}
          {activeTab === "final" && !finalJson && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/6">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No final data available</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Generate JSON first to see merged data</p>
            </div>
          )}
          {activeTab === "comparison" && finalJson && <DiagnosisViewer data={finalJson} />}
          {activeTab === "comparison" && !finalJson && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/6">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8h8M6 5l-3 3 3 3M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No diagnosis data</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Generate final JSON to run periodontitis comparison</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3.5 dark:border-white/10">
          <button
            onClick={handleDownload}
            disabled={!currentData}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/6 dark:hover:text-zinc-200"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 10v2.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V10M8 2v8.5M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!currentData}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/4 dark:text-zinc-200 dark:hover:bg-white/8"
            >
              {copied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Copy JSON
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-8 items-center rounded-lg bg-zinc-900 px-4 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
