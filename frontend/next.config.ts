import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8001/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8001/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
