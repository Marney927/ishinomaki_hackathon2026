import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx"
import type { User } from "@/states/users.ts"

export function UserTip(props: {user: User, className?: string, onclick?: () => void}) {
  return (
    <div className={`flex flex-row items-center h-10 ${props.className}`} onClick={props.onclick}>
      <UserAvatar user={props.user} />
      <div className="pl-1">{props.user.name}</div>
    </div>
  )
}

export function UserAvatar(props: {user: User, className?: string}) {
  return (
    <Avatar className={props.className}>
      {props.user.avatar_url && (
        <AvatarImage src={props.user.avatar_url} alt={`@${props.user.name}`} />
      )}
      <AvatarFallback>
        {props.user.name
          .split(" ")
          .map((s) => s[0])
          .join("")
          .substring(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}
