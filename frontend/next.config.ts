import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "three$": path.resolve(__dirname, "node_modules/three"),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      three: "./node_modules/three",
    },
  },
};

export default nextConfig;
