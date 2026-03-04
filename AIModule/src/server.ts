import "dotenv/config";
import Fastify, { type FastifyError, type FastifyReply, type FastifyRequest } from "fastify";
import multipart, { type MultipartFile } from "@fastify/multipart";
import { callNanokCariesInference, requireNanokApiKey } from "./nanokClient";
import { HttpError, validateAndNormalizeImage } from "./validateImage";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function normalizeModelName(raw: unknown): string {
  if (typeof raw !== "string") return "demo";
  const trimmed = raw.trim();
  if (!trimmed) return "demo";
  // Accept values like "demo" (with quotes) from some curl forms
  const unquoted = trimmed.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim();
  return unquoted || "demo";
}

async function fileToBuffer(file: MultipartFile["file"]): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of file) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX_UPLOAD_BYTES) {
      throw new HttpError(400, "FILE_TOO_LARGE", "Uploaded file exceeds 15MB limit");
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

type ParsedMultipart = { modelName: string; image: { buffer: Buffer; filename?: string } };

async function parseMultipart(request: FastifyRequest): Promise<ParsedMultipart> {
  if (!request.isMultipart()) {
    throw new HttpError(400, "INVALID_CONTENT_TYPE", "Content-Type must be multipart/form-data");
  }

  let modelName: string | undefined;
  let image: { buffer: Buffer; filename?: string } | undefined;
  let sawAnyPart = false;

  const parts = request.parts();
  for await (const part of parts) {
    sawAnyPart = true;

    if (part.type === "file") {
      if (part.fieldname !== "image") {
        // Drain unexpected file streams to avoid hanging the request
        for await (const _ of part.file) {
          // noop
        }
        continue;
      }
      if (image) {
        throw new HttpError(400, "MULTIPLE_FILES", 'Only one file field "image" is allowed');
      }
      const buffer = await fileToBuffer(part.file);
      image = { buffer, filename: part.filename };
      continue;
    }

    // field
    const field = part as { type: "field"; fieldname: string; value: string };
    if (field.fieldname === "modelName") {
      modelName = normalizeModelName(field.value);
    }
  }

  if (!sawAnyPart) {
    throw new HttpError(400, "EMPTY_MULTIPART", "No multipart fields found");
  }
  if (!image) {
    throw new HttpError(400, "MISSING_IMAGE", 'Missing required file field "image"');
  }

  return { modelName: modelName ?? "demo", image };
}

function toPublicError(err: unknown): { statusCode: number; body: unknown } {
  if (err instanceof HttpError) {
    return {
      statusCode: err.statusCode,
      body: { ok: false, error: err.message, code: err.code, details: err.details ?? undefined }
    };
  }

  const e = err as Partial<FastifyError> & { code?: string; statusCode?: number };

  // @fastify/multipart common errors
  if (e.code === "FST_REQ_FILE_TOO_LARGE") {
    return { statusCode: 400, body: { ok: false, error: "Uploaded file exceeds 15MB limit", code: "FILE_TOO_LARGE" } };
  }
  if (e.code === "FST_PARTS_LIMIT") {
    return { statusCode: 400, body: { ok: false, error: "Too many multipart parts", code: "TOO_MANY_PARTS" } };
  }
  if (e.code === "FST_INVALID_MULTIPART_CONTENT_TYPE") {
    return { statusCode: 400, body: { ok: false, error: "Content-Type must be multipart/form-data", code: "INVALID_CONTENT_TYPE" } };
  }

  return { statusCode: 500, body: { ok: false, error: "Internal server error", code: "INTERNAL" } };
}

async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    }
  });

  await app.register(multipart, {
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 1
    }
  });

  app.get("/health", async () => ({ ok: true }));

  app.post("/inference/caries", async (request, reply) => {
    const apiKey = requireNanokApiKey();
    const { modelName, image } = await parseMultipart(request);

    const validated = await validateAndNormalizeImage(image.buffer);

    const nanok = await callNanokCariesInference(
      image.filename
        ? { apiKey, modelName, normalizedJpeg: validated.normalizedJpeg, filename: image.filename }
        : { apiKey, modelName, normalizedJpeg: validated.normalizedJpeg }
    );

    if (nanok.ok) {
      return reply.status(200).send({
        ok: true,
        validated: {
          mime: validated.mime,
          width: validated.width,
          height: validated.height,
          normalizedBytes: validated.normalizedJpeg.byteLength
        },
        nanok: nanok.json
      });
    }

    return reply.status(502).send({
      ok: false,
      error: "Nanok request failed",
      status: nanok.status,
      nanok: nanok.body
    });
  });

  app.setErrorHandler((err: unknown, _request: FastifyRequest, reply: FastifyReply) => {
    const mapped = toPublicError(err);
    reply.status(mapped.statusCode).send(mapped.body);
  });

  return app;
}

async function main() {
  const port = Number(process.env.PORT ?? "3000");
  const host = process.env.HOST ?? "0.0.0.0";

  const app = await buildServer();
  await app.listen({ port, host });
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});

