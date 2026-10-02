import "server-only"

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

import { db, id } from "./db"

export type User = { id: string; email: string; name: string }

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$")
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length)
  return timingSafeEqual(expected, actual)
}

export function createUser(email: string, name: string, password: string) {
  const userId = id()
  db.prepare("INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)").run(
    userId,
    email,
    name,
    hashPassword(password),
  )
  return userId
}

export function findUserByEmail(email: string) {
  return db.prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?").get(email) as
    | (User & { password_hash: string })
    | undefined
}
