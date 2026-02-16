import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => [
    {
      source: "/api/bouncer/:path*",
      destination: `http://localhost:${process.env.BOUNCER_PORT || 30021}/api/bouncer/:path*`,
    },
  ],
};

export default nextConfig;
