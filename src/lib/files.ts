import "server-only"

import fs from "node:fs/promises"
import path from "node:path"

import { db, id, UPLOADS_DIR } from "./db"

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED = /^(image\/(jpeg|png|webp|heic|heif|gif)|application\/pdf)$/

export function filePath(attachmentId: string) {
  return path.join(UPLOADS_DIR, attachmentId)
}

export function validateUpload(file: File) {
  if (!ALLOWED.test(file.type)) return `«${file.name}»: можно фото (JPG, PNG, HEIC) или PDF`
  if (file.size > MAX_UPLOAD_BYTES) return `«${file.name}» больше 10 МБ`
  return null
}

export async function saveAttachment(transactionId: string, userId: string, file: File) {
  const attachmentId = id()
  await fs.writeFile(filePath(attachmentId), Buffer.from(await file.arrayBuffer()))
  db.prepare(
    "INSERT INTO attachments (id, transaction_id, user_id, file_name, mime, size) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(attachmentId, transactionId, userId, file.name.slice(0, 200) || "photo.jpg", file.type, file.size)
  return attachmentId
}

export async function removeFiles(attachmentIds: string[]) {
  await Promise.all(attachmentIds.map((a) => fs.rm(filePath(a), { force: true })))
}
