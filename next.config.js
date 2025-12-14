/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  output: 'standalone',
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/.prisma/**/*',
      './node_modules/@prisma/client/**/*',
      './reqbeam-db/node_modules/.prisma/**/*',
      './reqbeam-db/node_modules/@prisma/client/**/*',
    ],
  },
  serverExternalPackages: ['@prisma/client'],
  // Optimize build performance and memory usage
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig

