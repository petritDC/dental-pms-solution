import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { compareAgainstReference, type PatientIntake, type NanokPeriodontitis } from "@/lib/compare-periodontitis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const intake = (body.patientIntake ?? body) as PatientIntake;

    // Extract nanok periodontitis data from request body, or load from mock file
    let nanokPerio: NanokPeriodontitis | null = null;
    if (body.nanokData?.nanok?.value?.periodontitis) {
      nanokPerio = body.nanokData.nanok.value.periodontitis;
    } else {
      // Fallback: load from nanok-mock.json
      try {
        const mockPath = join(process.cwd(), "..", "data", "json", "nanok-mock.json");
        const mockContents = await readFile(mockPath, "utf-8");
        const mockData = JSON.parse(mockContents);
        nanokPerio = mockData?.nanok?.value?.periodontitis ?? null;
      } catch {
        // No mock data available
      }
    }

    // Load reference data
    const refPath = join(process.cwd(), "..", "data", "json", "Staging_and_Grading_Periodontitis.json");
    const refContents = await readFile(refPath, "utf-8");
    const refData = JSON.parse(refContents);

    // Run comparison with all 3 arguments
    const result = compareAgainstReference(intake, nanokPerio, refData);

    // Save result to file
    const outputDir = join(process.cwd(), "..", "data", "json", "comparisons");
    await mkdir(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const mrn = intake.personalInfo?.medicalRecordNumber?.replace(/[^a-zA-Z0-9-]/g, "") ?? "unknown";
    const outputPath = join(outputDir, `comparison-${mrn}-${timestamp}.json`);
    await writeFile(outputPath, JSON.stringify(result, null, 2), "utf-8");

    return NextResponse.json({ ...result, savedTo: outputPath });
  } catch (error) {
    console.error("Comparison error:", error);
    return NextResponse.json(
      { error: "Failed to run comparison" },
      { status: 500 }
    );
  }
}
