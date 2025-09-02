import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'utils', 'routes']
  },
  serverExternalPackages: ['@prisma/client']
};

export default nextConfig;
