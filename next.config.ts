import type { NextConfig } from "next";

function normalizePublicPathPrefix(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") return "";

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

const publicPathPrefix = normalizePublicPathPrefix(
  process.env.NEXT_PUBLIC_BASE_PATH,
);

const nextConfig: NextConfig = {
  // Self-hosted Docker images only need the standalone server bundle and its
  // runtime dependencies. This keeps the Raspberry Pi image much smaller.
  output: "standalone",
  // The school Nginx router removes /member/app before proxying to this
  // container. Keep application routes rooted at /, but publish browser asset
  // URLs with the external prefix so those requests pass through the router.
  assetPrefix: publicPathPrefix || undefined,
};

export default nextConfig;
