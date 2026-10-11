import "./index.css"
import { useState } from "react"
import { GuildsTable } from "@/guilds.tsx"
import { Login } from "@/login.tsx"
import { Profile } from "@/profile.tsx"

type View =
  {type: "home"} |
  {type: "auth"} |
  {type: "guildView", guild_uuid: string} |
  {type: "profile"} |
  {type: "guildConfig", guild_uuid: string};

export function App() {
  const [nowView, updateNowView] = useState<View>({type: "profile"});

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
    </div>
  )
}

export default App
