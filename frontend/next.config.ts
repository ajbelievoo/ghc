import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist2',
  cleanDistDir: false,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
