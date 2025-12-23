import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  bundlePagesRouterDependencies: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
