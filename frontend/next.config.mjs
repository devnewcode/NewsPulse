/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
