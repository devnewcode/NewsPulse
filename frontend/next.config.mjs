/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://newspulse-wj9w.onrender.com',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://newspulse-wj9w.onrender.com',
  },
};

export default nextConfig;
