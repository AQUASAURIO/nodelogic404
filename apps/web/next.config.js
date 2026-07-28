/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/shared", "@repo/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
