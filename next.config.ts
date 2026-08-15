import type { NextConfig } from "next";

function normalizeBasePath(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") return "";

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

const nextConfig: NextConfig = {
  // Self-hosted Docker images only need the standalone server bundle and its
  // runtime dependencies. This keeps the Raspberry Pi image much smaller.
  output: "standalone",
  basePath,
  // vinext standalone currently uses assetPrefix when resolving the physical
  // _next/static directory. Keep it aligned with basePath for sub-path hosting.
  assetPrefix: basePath || undefined,
};

export default nextConfig;
