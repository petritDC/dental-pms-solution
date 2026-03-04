"use client";

import { useMemo, useRef, useState } from "react";
import type { Tensor, ValidatedInfo } from "@/lib/types";

type Size = { width: number; height: number };
type Box = { x1: number; y1: number; x2: number; y2: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeBox(coords: [number, number, number, number], base: Size): Box | null {
  const [a, b, c, d] = coords;

  // Primary interpretation: [x1,y1,x2,y2]
  let x1 = a;
  let y1 = b;
  let x2 = c;
  let y2 = d;

  // Fallback interpretation some models use: [x,y,w,h]
  // Heuristic: if "x2/y2" look like widths/heights (i.e. box is inverted), treat as w/h.
  if (x2 <= x1 || y2 <= y1) {
    x1 = a;
    y1 = b;
    x2 = a + c;
    y2 = b + d;
  }

  if (![x1, y1, x2, y2].every((n) => Number.isFinite(n))) return null;

  // Clamp to image bounds
  x1 = clamp(x1, 0, base.width);
  y1 = clamp(y1, 0, base.height);
  x2 = clamp(x2, 0, base.width);
  y2 = clamp(y2, 0, base.height);

  if (x2 <= x1 || y2 <= y1) return null;
  return { x1, y1, x2, y2 };
}

function colorForClassification(classification: string) {
  const key = classification.toUpperCase();
  if (key.includes("ENAMEL")) return "border-sky-400 bg-sky-400/10";
  if (key.includes("DENTINE") || key.includes("DENTIN")) return "border-amber-400 bg-amber-400/10";
  if (key.includes("CARIES") || key.includes("DECAY")) return "border-rose-400 bg-rose-400/10";
  return "border-emerald-400 bg-emerald-400/10";
}

export function AnalysisViewer(props: {
  imageSrc: string | null;
  tensors: Tensor[];
  threshold: number;
  validated?: ValidatedInfo;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<Size | null>(null);

  const baseSize = useMemo<Size | null>(() => {
    if (props.validated?.width && props.validated?.height) {
      return { width: props.validated.width, height: props.validated.height };
    }
    return natural;
  }, [props.validated, natural]);

  const shown = useMemo(() => {
    const t = clamp(props.threshold, 0, 1);
    return props.tensors.filter((x) => (Number.isFinite(x.confidence) ? x.confidence : 0) >= t);
  }, [props.tensors, props.threshold]);

  if (!props.imageSrc) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-sm text-zinc-500 dark:border-white/15 dark:bg-white/5 dark:text-zinc-400">
        Select an image to preview
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3 pb-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="truncate">
            {baseSize ? (
              <>
                Base size:{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  {baseSize.width}×{baseSize.height}
                </span>
              </>
            ) : (
              "Base size: loading…"
            )}
          </div>
          <div className="tabular-nums">
            Showing{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              {shown.length}
            </span>{" "}
            / {props.tensors.length}
          </div>
        </div>

        <div className="flex w-full justify-center">
          <div className="relative inline-block max-h-[70vh] max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={props.imageSrc}
              alt="Dental X-ray"
              className="block max-h-[70vh] w-auto max-w-full select-none rounded-xl"
              onLoad={(e) => {
                const el = e.currentTarget;
                setNatural({ width: el.naturalWidth, height: el.naturalHeight });
              }}
            />

            {baseSize && (
              <div className="absolute inset-0">
                {shown.map((t) => {
                  const box = normalizeBox(t.coordinates, baseSize);
                  if (!box) return null;

                  const left = (box.x1 / baseSize.width) * 100;
                  const top = (box.y1 / baseSize.height) * 100;
                  const width = ((box.x2 - box.x1) / baseSize.width) * 100;
                  const height = ((box.y2 - box.y1) / baseSize.height) * 100;
                  const color = colorForClassification(t.classification);
                  const conf = Math.round((t.confidence ?? 0) * 100);

                  return (
                    <div
                      key={`${t.id}-${t.coordinates.join(",")}`}
                      className={`absolute inline-block group rounded-md border-2 pointer-events-auto ${color}`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                      title={`${t.classification} • ${conf}%`}
                    >
                      <div
                        className="absolute -top-6 left-0 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity"
                      // style={{ display: "inline-block" }}
                      >
                        {t.classification} • {conf}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

