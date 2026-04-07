import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@napi-rs/canvas",
    "@napi-rs/canvas-darwin-arm64",
    "pdfjs-dist",
  ],
};

export default nextConfig;
