/**
 * Stub for react-server-dom-webpack/client.edge
 * Next.js 14.2.5 references this module when running in dev mode,
 * but it does not exist in the published package.
 * We export minimal no-op implementations to satisfy the import.
 */

function unsupported(feature) {
  throw new Error(
    `react-server-dom-webpack/client.edge is not supported in this environment (requested "${feature}")`
  )
}

module.exports = {
  createFromReadableStream() {
    unsupported('createFromReadableStream')
  },
  createFromFetch() {
    unsupported('createFromFetch')
  },
  encodeReply() {
    unsupported('encodeReply')
  },
  registerClientReference() {
    unsupported('registerClientReference')
  },
  registerServerReference() {
    unsupported('registerServerReference')
  },
}


