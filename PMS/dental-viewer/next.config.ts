import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Avoid Next.js picking an incorrect workspace root when multiple lockfiles exist
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
