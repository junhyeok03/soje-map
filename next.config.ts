import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted Docker images only need the standalone server bundle and its
  // runtime dependencies. This keeps the Raspberry Pi image much smaller.
  output: "standalone",
};

export default nextConfig;
