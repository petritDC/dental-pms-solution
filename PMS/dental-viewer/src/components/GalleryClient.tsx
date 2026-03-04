"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalysisViewer } from "@/components/AnalysisViewer";
import { ConfidenceSlider } from "@/components/ConfidenceSlider";
import { normalizeAnalyzePayload } from "@/lib/nanok";
import type { AnalyzeError, AnalyzeResult, Tensor, ValidatedInfo } from "@/lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; tensors: Tensor[]; validated?: ValidatedInfo; raw: unknown };

export function GalleryClient() {
  const [images, setImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [modelName, setModelName] = useState("demo");

  const selectedUrl = selected ? `/api/images/${encodeURIComponent(selected)}` : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Same-origin call to our Next.js route that lists available images.
        // (No `process.env.*` needed in the browser.)
        const res = await fetch("/api/images");
        const json = (await res.json()) as { ok: boolean; images?: string[]; error?: string };
        if (!json.ok) throw new Error(json.error || "Failed to load images");
        if (!cancelled) {
          const list = json.images ?? [];
          setImages(list);
          setSelected((prev) => prev ?? list[0] ?? null);
        }
      } catch (e) {
        if (!cancelled) setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rawJson = useMemo(() => {
    if (status.kind !== "ok") return null;
    try {
      return JSON.stringify(status.raw, null, 2);
    } catch {
      return String(status.raw);
    }
  }, [status]);

  async function analyzeByImageName(name: string) {
    setStatus({ kind: "loading" });
    try {
      // Fetch bytes from our local image-serving route, then submit as multipart file.
      const imgRes = await fetch(`/api/images/${encodeURIComponent(name)}`);
      if (!imgRes.ok) throw new Error("Failed to fetch image bytes");
      const blob = await imgRes.blob();
      const file = new File([blob], name, { type: blob.type || "image/png" });

      const form = new FormData();
      form.append("modelName", modelName);
      form.append("image", file, name);

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr_380px]">
      <aside className="flex flex-col gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Gallery</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Browse images served by <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-white/10">/api/images</code> (configure server-side{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-white/10">IMAGES_DIR</code> to point at your dataset).
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Images</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{images.length}</div>
          </div>

          <div className="max-h-[70vh] overflow-auto rounded-xl border border-zinc-200/60 bg-zinc-50 p-2 dark:border-white/10 dark:bg-black/20">
            <div className="grid grid-cols-3 gap-2">
              {images.map((name) => {
                const active = selected === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setSelected(name);
                      setStatus({ kind: "idle" });
                    }}
                    className={[
                      "rounded-lg border p-1 text-left text-xs transition-colors",
                      active
                        ? "border-zinc-900 bg-white dark:border-white dark:bg-white/10"
                        : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20",
                    ].join(" ")}
                    title={name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/images/${encodeURIComponent(name)}`}
                      alt={name}
                      className="aspect-square w-full rounded-md object-cover"
                      loading="lazy"
                    />
                    <div className="mt-1 truncate">{name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Viewer</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Click an image, then Analyze to overlay detections.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-600 dark:text-zinc-400">modelName</label>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-40 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-black"
              placeholder="demo"
            />
            <button
              disabled={!selected || status.kind === "loading"}
              onClick={() => selected && analyzeByImageName(selected)}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {status.kind === "loading" ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </div>

        <AnalysisViewer
          imageSrc={selectedUrl}
          tensors={status.kind === "ok" ? status.tensors : []}
          threshold={threshold}
          validated={status.kind === "ok" ? status.validated : undefined}
        />

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <ConfidenceSlider value={threshold} onChange={setThreshold} disabled={!selectedUrl} />
          {status.kind === "error" && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {status.message}
            </div>
          )}
          {status.kind === "ok" && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
              Got {status.tensors.length} detections.
            </div>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-2 text-sm font-semibold">Center console (raw JSON)</div>
          <pre className="max-h-[70vh] overflow-auto rounded-xl bg-zinc-950 p-3 text-[11px] leading-4 text-zinc-100">
            {rawJson ?? "// click Analyze to see JSON"}
          </pre>
        </div>
      </aside>
    </div>
  );
}

