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
  const [nowView, updateNowView] = useState<View>({type: "selectGuilds"});

  return (
    <div>
      {nowView.type === "selectGuilds" && (
        <div>
          <GuildsTable guilds={guildsState.guilds} localUser={usersState.me} openGuild={(guild) => updateNowView({type: "guildView", guild_uuid: guild})} />
        </div>
      )}
      {nowView.type === "auth" &&
        <div className="grid place-items-center w-full h-screen">
          <Login />
        </div>
      }
    </div>
  )
}

export default App
