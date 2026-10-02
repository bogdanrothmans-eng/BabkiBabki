import type { Kind } from "./queries"

export type TransactionFilter = {
  categoryId?: string
  memberId?: string
  kind?: Kind
  q?: string
  limit?: number
}

// Reads the list filters from the URL (?category=…&member=…&kind=…&q=…).
export function parseFilter(get: (key: string) => string | null | undefined): TransactionFilter {
  const kind = get("kind")
  return {
    categoryId: get("category") || undefined,
    memberId: get("member") || undefined,
    kind: kind === "expense" || kind === "income" ? kind : undefined,
    q: get("q") || undefined,
  }
}
