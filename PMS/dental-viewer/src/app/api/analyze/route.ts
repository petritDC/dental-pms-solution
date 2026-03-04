import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAiModuleUrl() {
  return (process.env.AI_MODULE_URL ?? "http://localhost:5560").replace(/\/+$/, "");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    if (!image || !(image instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Missing multipart file field "image"' }, { status: 400 });
    }

    const modelNameRaw = form.get("modelName");
    const modelName = typeof modelNameRaw === "string" && modelNameRaw.trim() ? modelNameRaw.trim() : "demo";

    const out = new FormData();
    out.append("modelName", modelName);
    out.append("image", image, image.name || "xray.png");

    const upstream = await fetch(`${getAiModuleUrl()}/inference/caries`, {
      method: "POST",
      body: out,
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const raw = isJson ? await upstream.json() : await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: `AIModule request failed (${upstream.status})`, raw },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, raw });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

