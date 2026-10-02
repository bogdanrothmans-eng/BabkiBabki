import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // Receipt photos go through Server Actions; the client downsizes them
    // first, this is headroom for several at once.
    serverActions: { bodySizeLimit: "25mb" },
  },
}

export default nextConfig
