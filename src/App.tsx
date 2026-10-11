import "./index.css"
import { useState } from "react"
import { GuildsTable } from "@/guilds.tsx"
import { useGuildsState } from "@/states/guilds.ts"
import { useUsersState } from "@/states/users.ts"
import { Login } from "@/login.tsx"

type View =
  {type: "home"} |
  {type: "auth"} |
  {type: "guildView", guild_uuid: string} |
  {type: "profile"} |
  {type: "guildConfig", guild_uuid: string};

export function App() {
  const guildsState = useGuildsState();
  const usersState = useUsersState();
  const [nowView, updateNowView] = useState<View>({type: "home"});

  return (
    <div>
      {nowView.type === "home" && (
        <div>
          <GuildsTable
            guilds={guildsState.guilds}
            localUser={usersState.me}
            openGuild={(guild) => updateNowView({type: "guildView", guild_uuid: guild})}
            createGuild={(name) => guildsState.addNewGuild(name)}
            joinGuild={(id) => guildsState.joinGuildBySecretUuid(id)}
          />
        </div>
      )}
      {nowView.type === "auth" &&
        <Login />
      }
    </div>
  )
}

export default App
