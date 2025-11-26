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
      './postmind-db/node_modules/.prisma/**/*',
      './postmind-db/node_modules/@prisma/client/**/*',
    ],
  },
  serverExternalPackages: ['@prisma/client'],
}

module.exports = nextConfig

