/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  swcMinify: false,
  webpack: (config, { isServer }) => {
    config.cache = false;
    if (config.snapshot && config.snapshot.managedPaths) {
      config.snapshot.managedPaths = [];
    }
    config.parallelism = 1;
    return config;
  },
};

module.exports = nextConfig;
