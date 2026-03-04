import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getImagesDir() {
  return process.env.IMAGES_DIR
    ? path.resolve(process.env.IMAGES_DIR)
    : path.resolve(process.cwd(), "src", "app", "api", "images");
}

function safeName(input: string) {
  if (!/^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp)$/i.test(input)) return null;
  if (input.includes("..") || input.includes("/") || input.includes("\\")) return null;
  return input;
}

function contentTypeFor(name: string) {
  const ext = name.toLowerCase().split(".").pop();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name: raw } = await ctx.params;
  const name = safeName(raw);
  if (!name) return new Response("Not found", { status: 404 });

  try {
    const fullPath = path.join(getImagesDir(), name);
    const bytes = await fs.readFile(fullPath);
    return new Response(bytes, {
      status: 200,
      headers: {
        "content-type": contentTypeFor(name),
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

