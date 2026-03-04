import type { Tensor, ValidatedInfo } from "@/lib/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function normalizeTensor(raw: unknown): Tensor | null {
  if (!isRecord(raw)) return null;
  const id = toNumber(raw.id) ?? 0;
  const confidence = toNumber(raw.confidence);
  const classification = typeof raw.classification === "string" ? raw.classification : "UNKNOWN";

  const coords = raw.coordinates;
  if (!Array.isArray(coords) || coords.length !== 4) return null;
  const x1 = toNumber(coords[0]);
  const y1 = toNumber(coords[1]);
  const x2 = toNumber(coords[2]);
  const y2 = toNumber(coords[3]);
  if (x1 === null || y1 === null || x2 === null || y2 === null) return null;

  return {
    id,
    coordinates: [x1, y1, x2, y2],
    confidence: confidence ?? 0,
    classification,
  };
}

function extractTensors(raw: unknown): unknown[] {
  if (!isRecord(raw)) return [];

  // user-provided envelope: { value: { tensors: [...] } }
  const a = raw.value;
  if (isRecord(a) && Array.isArray(a.tensors)) return a.tensors;

  // AIModule envelope: { nanok: { value: { tensors: [...] } } }
  const b = raw.nanok;
  if (isRecord(b)) {
    if (Array.isArray(b.tensors)) return b.tensors as unknown[];
    const bValue = b.value;
    if (isRecord(bValue) && Array.isArray(bValue.tensors)) return bValue.tensors;
  }

  // fallback: { tensors: [...] }
  if (Array.isArray(raw.tensors)) return raw.tensors;
  return [];
}

export function normalizeAnalyzePayload(raw: unknown): { tensors: Tensor[]; validated?: ValidatedInfo } {
  const tensorsRaw = extractTensors(raw);
  const tensors = tensorsRaw.map(normalizeTensor).filter((t): t is Tensor => t !== null);

  let validated: ValidatedInfo | undefined;
  if (isRecord(raw) && isRecord(raw.validated)) {
    const w = toNumber(raw.validated.width);
    const h = toNumber(raw.validated.height);
    if (w !== null && h !== null) validated = { width: w, height: h };
  }

  return { tensors, validated };
}

