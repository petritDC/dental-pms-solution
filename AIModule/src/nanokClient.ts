import { HttpError } from "./validateImage";

export type NanokSuccess = {
  ok: true;
  status: number;
  json: unknown;
};

export type NanokFailure = {
  ok: false;
  status: number;
  body: unknown; // parsed JSON if possible, else string snippet
};

export async function callNanokCariesInference(params: {
  apiKey: string;
  modelName: string;
  normalizedJpeg: Buffer;
  filename?: string;
}): Promise<NanokSuccess | NanokFailure> {
  const { apiKey, modelName, normalizedJpeg, filename } = params;

  const form = new FormData();
  form.append("modelName", modelName);
  // TS note: Buffer is typed with ArrayBufferLike, which isn't directly assignable to BlobPart.
  // Converting to Uint8Array produces a DOM-compatible BufferSource for Blob in Node 18+.
  const bytes = new Uint8Array(normalizedJpeg);
  form.append(
    "image",
    new Blob([bytes], { type: "image/jpeg" }),
    filename?.endsWith(".jpg") || filename?.endsWith(".jpeg")
      ? filename
      : "xray.jpg",
  );

  const res = await fetch("https://api.nanok.ai/inference/caries", {
    method: "POST",
    headers: {
      ApiKey: apiKey,
      Accept: "application/json",
    },
    body: form,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let parsed: unknown;
  try {
    parsed = isJson ? await res.json() : await res.text();
  } catch {
    // fallback: read as text (may still fail)
    try {
      parsed = await res.text();
    } catch {
      parsed = null;
    }
  }

  if (res.ok) {
    return { ok: true, status: res.status, json: parsed };
  }

  // Keep a small snippet if it's a huge string
  if (typeof parsed === "string" && parsed.length > 2000)
    parsed = parsed.slice(0, 2000);
  return { ok: false, status: res.status, body: parsed };
}

export function requireNanokApiKey(): string {
  const apiKey = process.env.NANOOK_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, "MISSING_ENV", "NANOOK_API_KEY is required");
  }
  return apiKey;
}
