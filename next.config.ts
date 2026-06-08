import type { NextConfig } from "next";

const nextConfig: NextConfig & { eslint?: { ignoreDuringBuilds?: boolean } } = {
  /* Opsi konfigurasi utama */
  allowedDevOrigins: ['192.168.56.1', 'localhost:3000'],

  // JARING PENGAMAN: Diubah ke format yang sepenuhnya dikenal oleh skema NextConfig terbaru
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
