/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  output: 'standalone',
  // Exclude CLI directory from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  // Exclude CLI from build
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    return config
  },
}

module.exports = nextConfig

