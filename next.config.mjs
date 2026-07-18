/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pino-pretty is an optional dev dependency of pino (used by WalletConnect).
    // It's never needed in the browser bundle, so stub it out to silence the
    // "Module not found" warning that Next.js would otherwise emit.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;
