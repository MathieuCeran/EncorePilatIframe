import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nvd02ath3xbdcmxu.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
