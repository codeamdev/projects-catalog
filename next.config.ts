import type { NextConfig } from "next";

const securityHeaders = [
  // Impide que la app sea embebida en iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Evita que el navegador infiera tipos MIME distintos al declarado
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limita la información de referrer enviada a terceros
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva APIs de hardware no usadas
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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
    "vermicatalogo.com",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
