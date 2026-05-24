import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Opsi konfigurasi utama */
  allowedDevOrigins: ['192.168.56.1', 'localhost:3000'],
  
  // Jika sebelumnya dimasukkan ke dalam experimental: { ... }, hapus dari sana.
};

export default nextConfig;