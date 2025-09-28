/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: [
    '@app/ui',
    '@app/api',
    '@app/chat',
    '@app/utils',
    '@app/config',
    '@app/db',
    '@app/auth',
    '@app/llm',
    '@app/payments',
    '@app/voice',
    '@app/email',
    '@app/analytics',
  ],
};

export default nextConfig;
