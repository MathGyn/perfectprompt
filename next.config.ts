import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O repositório está num drive externo exFAT (/Volumes/2TB Samsung), onde o
  // cache persistente do Turbopack falha ("Failed to open database / invalid
  // digit found in string"). Desligar o cache persistente faz o dev rodar.
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
