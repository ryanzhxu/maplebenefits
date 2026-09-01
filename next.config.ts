import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site — no server runtime. Deploys to Cloudflare Pages.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
