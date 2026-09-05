import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "ffmpeg-static"],
};

export default nextConfig;
