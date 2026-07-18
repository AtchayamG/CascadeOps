import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStaticExport
    ? {
        output: "export" as const,
        basePath: "/CascadeOps",
        assetPrefix: "/CascadeOps/",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
