import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Sube el límite del body buffereado para el proxy/middleware.
    // Necesario para que /api/upload pueda recibir videos de hasta 200 MB.
    proxyClientMaxBodySize: "200mb",
  },
  // "localhost" cubre *.localhost (tendencias.localhost, perfumeria.localhost, etc.)
  // porque Next.js comprueba: origin === allowed  ||  origin.endsWith("." + allowed)
  allowedDevOrigins: [
    "localhost",
    "allexclusive.com",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "*.localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
