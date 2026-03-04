import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getImagesDir() {
  // Default: APP/PMS/dental-viewer/src/app/api/images
  return process.env.IMAGES_DIR
    ? path.resolve(process.env.IMAGES_DIR)
    : path.resolve(process.cwd(), "src", "app", "api", "images");
}

export async function GET() {
  try {
    const dir = getImagesDir();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const images = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return NextResponse.json({ ok: true, images });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

