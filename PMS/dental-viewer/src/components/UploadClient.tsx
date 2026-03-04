"use client";

import { useMemo, useState } from "react";
import { AnalysisViewer } from "@/components/AnalysisViewer";
import { ConfidenceSlider } from "@/components/ConfidenceSlider";
import { normalizeAnalyzePayload } from "@/lib/nanok";
import type { AnalyzeError, AnalyzeResult, Tensor, ValidatedInfo } from "@/lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; tensors: Tensor[]; validated?: ValidatedInfo; raw: unknown };

export function UploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [modelName, setModelName] = useState("demo");

  const canAnalyze = !!file && status.kind !== "loading";

  const rawJson = useMemo(() => {
    if (status.kind !== "ok") return null;
    try {
      return JSON.stringify(status.raw, null, 2);
    } catch {
      return String(status.raw);
    }
  }, [status]);

  async function analyzeSelectedFile(f: File) {
    setStatus({ kind: "loading" });
    try {
      const form = new FormData();
      form.append("modelName", modelName);
      form.append("image", f, f.name || "xray.png");

      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const json = (await res.json()) as AnalyzeResult | AnalyzeError;
      if (!json.ok) throw new Error(json.error || "Analysis failed");

      const normalized = normalizeAnalyzePayload(json.raw);
      setStatus({
        kind: "ok",
        tensors: normalized.tensors,
        validated: normalized.validated,
        raw: json.raw,
      });
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Upload</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Upload an X-ray image, run inference, and visualize detections.
            </p>
          </div>
        </div>

        <AnalysisViewer
          imageSrc={previewUrl}
          tensors={status.kind === "ok" ? status.tensors : []}
          threshold={threshold}
          validated={status.kind === "ok" ? status.validated : undefined}
        />
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-sm font-semibold">Input</div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Backend expects multipart field <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-white/10">image</code>.
              </div>
            </div>

            <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm dark:border-white/15 dark:bg-white/5">
              <div className="font-medium">Choose image</div>
              <input
                type="file"
                accept="image/*"
                className="text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setStatus({ kind: "idle" });
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(f ? URL.createObjectURL(f) : null);
                }}
              />
            </label>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">modelName</label>
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-40 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-black"
                  placeholder="demo"
                />
              </div>

              <button
                disabled={!canAnalyze}
                onClick={() => file && analyzeSelectedFile(file)}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {status.kind === "loading" ? "Analyzing…" : "Analyze"}
              </button>

              <ConfidenceSlider value={threshold} onChange={setThreshold} disabled={!previewUrl} />
            </div>

            {status.kind === "error" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {status.message}
              </div>
            )}

            {status.kind === "ok" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                Got {status.tensors.length} detections.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-2 text-sm font-semibold">Response (raw)</div>
          <pre className="max-h-[260px] overflow-auto rounded-xl bg-zinc-950 p-3 text-[11px] leading-4 text-zinc-100">
            {rawJson ?? "// run Analyze to see JSON"}
          </pre>
        </div>
      </aside>
    </div>
  );
}

