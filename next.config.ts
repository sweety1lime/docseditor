import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["docxtemplater", "pizzip", "libreoffice-convert", "archiver"],
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
