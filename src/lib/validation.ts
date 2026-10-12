// Application input checks; the database remains responsible for RLS and audit fields.
export function requireUuid(value: string, label: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  )
    throw new Error(`${label}の形式が正しくありません`)
  return value
}
export function requireGuildId(value: number) {
  if (!Number.isInteger(value) || value <= 0 || value > 2147483647)
    throw new Error("ギルドIDが正しくありません")
  return value
}
export function requireDate(value: string | null) {
  if (value === null) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("期限の日付が正しくありません")
  const date = new Date(value + "T00:00:00Z")
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new Error("期限の日付が正しくありません")
  return value
}
export function requireStatus(value: string) {
  if (
    !["todo", "in_progress", "pending", "completed", "cancelled"].includes(
      value
    )
  )
    throw new Error("タスクのステータスが正しくありません")
  return value
}
