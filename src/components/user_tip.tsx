import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/states/users"
import { UserRound } from "lucide-react"
export function UserTip({
  user,
  className = "",
  onclick,
}: {
  user: User
  className?: string
  onclick?: () => void
}) {
  return (
    <div className={`user-tip ${className}`} onClick={onclick}>
      <UserAvatar user={user} />
      <span>{user.name}</span>
    </div>
  )
}
export function UserAvatar({
  user,
  className = "",
}: {
  user: User
  className?: string
}) {
  const color = [...user.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 5
  return (
    <Avatar className={`user-avatar avatar-color-${color} ${className}`}>
      {user.avatar_url && (
        <AvatarImage src={user.avatar_url} alt={`${user.name}のアバター`} />
      )}
      <AvatarFallback>
        <UserRound aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )
}
