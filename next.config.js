const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir option (it's default in Next.js 15)
  images: {
    domains: [],
  },
  // Note: Static generation errors for client components with context are expected
  // These pages will be rendered dynamically at runtime, which is correct behavior
  webpack: (config, { isServer }) => {
    // Add the shared directory to webpack's resolve
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': path.resolve(__dirname, 'shared'),
    }
    
    // Make sure webpack can resolve files in the shared directory
    // This allows imports like '../../../../shared/index.js' to work
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname),
    ]
    
    // Add extension resolution for .js imports that should resolve to .ts files
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    }
    
    // Fix for Next.js react-server-dom-webpack issue
    // This is a workaround for the missing client.edge module
    // Create a proper alias that points to a stub or the client module
    if (!config.resolve.alias) {
      config.resolve.alias = {}
    }
    
    // If the client.edge doesn't exist, alias it to client
    // This will be handled by creating a stub file in node_modules
    config.resolve.alias['react-server-dom-webpack/client.edge'] = 
      path.resolve(__dirname, 'stubs/react-server-dom-webpack-client-edge.js')
    
    // Fix for Turbopack runtime missing module (even though Turbopack is disabled)
    // Create a fallback to prevent errors
    if (!config.resolve.fallback) {
      config.resolve.fallback = {}
    }
    config.resolve.fallback['@vercel/turbopack-ecmascript-runtime/dev/client/hmr-client.ts'] = false
    config.resolve.fallback['@vercel/turbopack-ecmascript-runtime/dev/client/hmr-client'] = false
    
    // Ensure TypeScript files in shared directory are transpiled
    // Find the rule that handles .ts/.tsx files and include shared directory
    const oneOfRule = config.module.rules.find((rule) => rule.oneOf)
    if (oneOfRule) {
      oneOfRule.oneOf.forEach((loader) => {
        if (loader.test && loader.test.toString().includes('tsx|ts')) {
          if (loader.include && Array.isArray(loader.include)) {
            loader.include.push(path.resolve(__dirname, 'shared'))
          } else if (loader.include) {
            loader.include = [loader.include, path.resolve(__dirname, 'shared')]
          } else {
            loader.include = path.resolve(__dirname, 'shared')
          }
        }
      })
    }
    
    return config
  },
}

module.exports = nextConfig

