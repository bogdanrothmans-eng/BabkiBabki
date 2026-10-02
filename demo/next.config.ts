import path from "node:path"

import type { NextConfig } from "next"

// Static build of the app for GitHub Pages. It reuses the components from
// ../src and swaps the server-only pieces for browser versions:
//   - server actions  → demo/src/actions/* (data in localStorage)
//   - entry / receipt URLs → demo/src/routes.ts
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    root: path.join(import.meta.dirname, ".."),
    resolveAlias: {
      "@/lib/actions/transactions": "./src/actions/transactions.ts",
      "@/lib/actions/budget": "./src/actions/budget.ts",
      "@/lib/routes": "./src/routes.ts",
    },
  },
}

export default nextConfig
