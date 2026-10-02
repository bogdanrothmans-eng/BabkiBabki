import fs from "node:fs/promises"

import { getUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { filePath } from "@/lib/files"

// Receipts are private: only members of the budget that owns the entry can fetch them.
export async function GET(_: Request, ctx: RouteContext<"/files/[id]">) {
  const { id } = await ctx.params
  const user = await getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })
  const file = db
    .prepare(
      `SELECT a.id, a.mime, a.file_name FROM attachments a
       JOIN transactions t ON t.id = a.transaction_id
       JOIN budget_members m ON m.budget_id = t.budget_id AND m.user_id = ?
       WHERE a.id = ?`,
    )
    .get(user.id, id) as { id: string; mime: string; file_name: string } | undefined
  if (!file) return new Response("Not found", { status: 404 })
  try {
    const body = await fs.readFile(filePath(file.id))
    return new Response(body, {
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
