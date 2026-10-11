import "./index.css"
import { useState } from "react"
import { GuildsTable } from "@/guilds.tsx"
import { Login } from "@/login.tsx"
import { Profile } from "@/profile.tsx"
import { Tasks } from "@/tasks.tsx"

type View =
  {type: "home"} |
  {type: "auth"} |
  {type: "guildView", guild_uuid: string} |
  {type: "profile"} |
  {type: "guildConfig", guild_uuid: string};

export function App() {
  const [nowView, updateNowView] = useState<View>({type: "guildView", guild_uuid: ""});

  return (
    <div>
      {nowView.type === "home" && (
        <div>
          <GuildsTable openGuild={(guild) => updateNowView({type: "guildView", guild_uuid: guild})} />
        </div>
      )}
      {nowView.type === "auth" &&
        <Login />
      }
      {nowView.type === "profile" && (
        <Profile />
      )}
      {nowView.type === "guildView" && (
        <Tasks guildId={nowView.guild_uuid} />
      )}
    </div>
  )
}

export default App
