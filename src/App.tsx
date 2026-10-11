import "./index.css"
import { useState } from "react"
import { GuildsTable } from "@/components/guilds_table.tsx"
import { useGuildsState } from "@/states/guilds.ts"
import { useUsersState } from "@/states/users.ts"
import { Login } from "@/Login.tsx"

type View =
  {type: "selectGuilds"} |
  {type: "auth"} |
  {type: "guildView", guild_uuid: string};

export function App() {
  const guildsState = useGuildsState();
  const usersState = useUsersState();
  const [nowView, updateNowView] = useState<View>({type: "auth"});

  return (
    <div>
      {nowView.type === "selectGuilds" && (
        <GuildsTable guilds={guildsState.guilds} localUser={usersState.me} openGuild={(guild) => updateNowView({type: "guildView", guild_uuid: guild})} />
      )}
      {nowView.type === "auth" &&
        <Login />
      }
    </div>
  )
}

export default App
