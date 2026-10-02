// URLs that differ between the server app and the static GitHub Pages demo
// (which has no dynamic routes and keeps receipts in the browser). The demo
// build swaps this module via turbopack.resolveAlias — see demo/next.config.ts.

export function entryHref(id: string) {
  return `/transactions/${id}`
}

export function fileUrl(attachmentId: string) {
  return `/files/${attachmentId}`
}
