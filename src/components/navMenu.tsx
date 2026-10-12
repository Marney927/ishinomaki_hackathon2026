import type { View } from "@/App.tsx"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx"
import { UserTip } from "@/components/user_tip.tsx"
import { useUsersState } from "@/states/users.ts"
import { Button } from "@/components/ui/button.tsx"

export function NavMenu(props: {state: View, setView: (view: View) => void}) {
  const usersState = useUsersState();
  const nowStack: [string, View | null][] = [];
  switch (props.state.type) {
    case "home":
      nowStack.push(["Home", null]);
      break;
    case "auth":
      nowStack.push(["Auth", null]);
      break;
    case "profile":
      nowStack.push(["Home", {type: "home"}]);
      nowStack.push(["Profile", null]);
      break;
    case "guildView":
      nowStack.push(["Home", { type: "home" }])
      nowStack.push([props.state.guild.name, null]);
      break;
    case "guildConfig":
      nowStack.push(["Home", { type: "home" }])
      nowStack.push([props.state.guild.name, {type: "guildView", guild: props.state.guild}]);
      nowStack.push(["Config", null]);
      break;
  }

  return (
    <nav className="border-b-2 p-3">
      <div className="flex items-center">
        <Breadcrumb className="shrink">
          <BreadcrumbList>
            {nowStack
              .map(([name, link_to], idx, ref) => (
                <BreadcrumbItem key={name}>
                  <BreadcrumbLink
                    href="#"
                    onClick={() => link_to && props.setView(link_to)}
                  >
                    {name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))
              .flatMap((item, idx, ar) =>
                idx + 1 < ar.length ? [item, <BreadcrumbSeparator />] : [item]
              )}
          </BreadcrumbList>
        </Breadcrumb>
        {usersState.me ? (<UserTip
          user={usersState.me}
          className="ml-auto cursor-pointer bg-accent p-2 rounded-2xl"
          onclick={() => props.setView({ type: "profile" })}
        />) : (
          <Button onClick={() => props.setView({type: "auth"})}>Login / Signup</Button>
          )}
      </div>
    </nav>
  )
}