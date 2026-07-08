import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.BACKEND_API_URL || "http://localhost:5000"}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.BACKEND_API_URL || "http://localhost:5000"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
