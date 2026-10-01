import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone: solo los archivos necesarios para correr la app
  // (server.js + node_modules trazados). Lo usa el Dockerfile.
  output: "standalone",
};

export default nextConfig;
