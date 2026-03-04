import sharp from "sharp";

export type AllowedMime = "image/jpeg" | "image/png" | "image/webp";

export type ValidatedImage = {
  mime: AllowedMime;
  width: number;
  height: number;
  normalizedJpeg: Buffer;
};

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const ALLOWED_MIME = new Set<AllowedMime>(["image/jpeg", "image/png", "image/webp"]);
const MIN_W = 800;
const MIN_H = 800;

export async function validateAndNormalizeImage(input: Buffer): Promise<ValidatedImage> {
  // `file-type` is ESM-only; use dynamic import so this project can compile to CJS cleanly.
  const { fileTypeFromBuffer } = await import("file-type");
  const type = await fileTypeFromBuffer(input);
  const mime = type?.mime;

  if (!mime || !ALLOWED_MIME.has(mime as AllowedMime)) {
    throw new HttpError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Unsupported image type. Allowed: image/jpeg, image/png, image/webp",
      { detectedMime: mime ?? null }
    );
  }

  let img = sharp(input, { failOnError: true });

  // rotate by EXIF (if present) and ensure decoding doesn't throw for corrupt inputs
  img = img.rotate();

  let meta: sharp.Metadata;
  try {
    meta = await img.metadata();
  } catch (err) {
    throw new HttpError(422, "CORRUPT_IMAGE", "Image could not be decoded (possibly corrupt)", {
      cause: err instanceof Error ? err.message : String(err)
    });
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new HttpError(422, "INVALID_IMAGE", "Image metadata missing width/height");
  }

  // if (width < MIN_W || height < MIN_H) {
  //   throw new HttpError(422, "LOW_RESOLUTION", `Image resolution too small. Minimum is ${MIN_W}x${MIN_H}`, {
  //     width,
  //     height
  //   });
  // }

  let normalizedJpeg: Buffer;
  try {
    normalizedJpeg = await img.jpeg({ quality: 92 }).toBuffer();
  } catch (err) {
    throw new HttpError(422, "NORMALIZATION_FAILED", "Failed to normalize image to JPEG", {
      cause: err instanceof Error ? err.message : String(err)
    });
  }

  return { mime: mime as AllowedMime, width, height, normalizedJpeg };
}

