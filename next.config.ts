import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a fully static bundle for GitHub Pages:
//   STATIC_EXPORT=1 BASE_PATH=/Ludo-browser bun x next build
// Default (unset) keeps the production standalone server build untouched.
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // client-visible mirror of BASE_PATH so components can prefix assets
  // (e.g. the velvet table backdrop photo) in both export and server builds
  env: { NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || "" },
  output: isStatic ? "export" : "standalone",
  ...(isStatic
    ? {
        basePath: process.env.BASE_PATH || "",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
