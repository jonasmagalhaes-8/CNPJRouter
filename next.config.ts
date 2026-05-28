import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: [
    'typeorm',
    'better-sqlite3',
    'bcryptjs',
  ],
};

export default nextConfig;
