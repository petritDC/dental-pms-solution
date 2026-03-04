import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Path from dental-viewer to PMS/data/final-data.json
    const filePath = join(
      process.cwd(),
      "..",
      "data",
      "json",
      "nanok-mock.json",
    );
    const fileContents = await readFile(filePath, "utf-8");
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading final-data.json:", error);
    return NextResponse.json(
      { error: "Failed to load final data" },
      { status: 500 },
    );
  }
}
