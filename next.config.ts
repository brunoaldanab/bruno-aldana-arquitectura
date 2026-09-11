import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com" }],
  },
  // La versión de la publicación queda escrita dentro del service worker
  // (src/app/sw.js/route.ts): cada deploy instala uno nuevo, que guarda la app nueva
  // en el teléfono y descarta la copia vieja. Los encabezados de /sw.js los pone la ruta.
  env: {
    VERSION_APP: process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}`,
  },
};

export default nextConfig;
