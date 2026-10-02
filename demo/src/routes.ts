"use client"

// Demo replacements for src/lib/routes.ts: a static export has no dynamic
// routes, and receipts live in localStorage as data URLs.

import { attachmentData } from "./store"

export function entryHref(id: string) {
  return `/entry?id=${id}`
}

const objectUrls = new Map<string, string>()

// Blob URLs rather than data URLs: browsers refuse to open data: PDFs in a new tab.
export function fileUrl(attachmentId: string) {
  const cached = objectUrls.get(attachmentId)
  if (cached) return cached
  const data = attachmentData(attachmentId)
  if (!data) return ""
  const [meta, base64] = data.split(",")
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: meta.slice(5, meta.indexOf(";")) }))
  objectUrls.set(attachmentId, url)
  return url
}
