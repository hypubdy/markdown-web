/** Khoá query dùng chung cho TanStack Query — một nơi duy nhất để đặt tên cache. */
export const qk = {
  me: ["auth", "me"] as const,
  users: (filters?: { role?: string; q?: string }) =>
    ["users", "list", filters] as const,
  userStats: ["users", "stats"] as const,
  notes: (filters?: object) => ["notes", "list", filters] as const,
  note: (id: string) => ["notes", "detail", id] as const,
  noteRaw: (id: string) => ["notes", "raw", id] as const,
  trash: ["notes", "trash"] as const,
  tags: ["tags"] as const,
  publicNote: (token: string) => ["public", "note", token] as const,
};
