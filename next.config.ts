import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  bundlePagesRouterDependencies: true,
  turbopack: {
    root: "/Users/jiayingwu/conductor/workspaces/iron-oasis-next/florence",
  },
};

export default nextConfig;
