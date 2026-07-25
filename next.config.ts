import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Critical: tell Next.js to include Prisma client + engine binaries in the
  // standalone build output. Without this, the standalone server doesn't have
  // access to the correct Prisma client and falls back to SQLite engine,
  // producing "Error code 14: Unable to open the database file" at runtime
  // even when DATABASE_URL points to PostgreSQL.
  outputFileTracingIncludes: {
    "/": [
      "./node_modules/.prisma/**/*",
      "./node_modules/@prisma/client/**/*",
      "./node_modules/@prisma/debug/**/*",
      "./node_modules/@prisma/engines/**/*",
      "./node_modules/@prisma/internals/**/*",
      "./prisma/schema.prisma",
    ],
  },
};

export default nextConfig;
