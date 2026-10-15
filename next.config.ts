import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site into `out/` so it can be hosted on GitHub Pages.
  output: "export",
  // GitHub Pages project sites live under /<repo>. `actions/configure-pages`
  // provides this via the PAGES_BASE_PATH env var at build time. It is unset
  // for user/org sites and for local development.
  basePath: process.env.PAGES_BASE_PATH || undefined,
  // Cache Components / Partial Prefetching are server features and cannot be
  // combined with `output: "export"` (PPR is disabled in export mode). This
  // app is entirely client-side, so they are not needed.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
