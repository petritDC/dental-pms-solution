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
      "mock_BL.JSON",
    );
    const fileContents = await readFile(filePath, "utf-8");
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading mock_BL.JSON:", error);
    return NextResponse.json(
      { error: "Failed to load final data" },
      { status: 500 },
    );
  }
}
