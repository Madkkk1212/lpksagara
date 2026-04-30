import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase body size limit for server actions and API routes
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
