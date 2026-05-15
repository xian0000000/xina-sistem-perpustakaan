import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['192.168.143.41','172.28.115.244'],
};

export default nextConfig;
