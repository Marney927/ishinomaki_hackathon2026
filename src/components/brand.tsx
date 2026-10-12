import { Flag, UsersRound } from "lucide-react"
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark">
        <Flag size={16} />
        <UsersRound size={38} strokeWidth={2.6} />
      </span>
      <span>Guild Task Board</span>
    </span>
  )
}
