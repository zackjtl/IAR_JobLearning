import type { NextConfig } from "next";

// Cache Components is intentionally NOT enabled: this is a single-user,
// DB-backed learning app where every page shows live personal progress.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["pg"],
};

export default nextConfig;
