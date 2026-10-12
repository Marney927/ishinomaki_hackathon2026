import "./index.css"
import { useState } from "react"
import { GuildsTable } from "@/guilds.tsx"
import { Login } from "@/login.tsx"
import { Profile } from "@/profile.tsx"
import { Tasks } from "@/tasks.tsx"
import { GuildsSettings } from "@/guildsSettings.tsx"
import type { Guild } from "@/states/guilds.ts"
import { commonUser5 } from "@/mocks/tasks_mock.ts"
import { NavMenu } from "@/components/navMenu.tsx"

export type View =
  {type: "home"} |
  {type: "auth"} |
  {type: "guildView", guild: Guild} |
  {type: "profile"} |
  {type: "guildConfig", guild: Guild};

const mock_guild = {
  id: "gld_0",
    name: "Tech Team",
    owner: commonUser5,
    description: "A tech team for some devs.",
    member_count: 15,
}

export function App() {
  const [nowView, updateNowView] = useState<View>({
    type: "guildConfig",
    guild: mock_guild,
  });

  return (
    <div>
      <NavMenu state={nowView} setView={updateNowView} />
      <main>
        {nowView.type === "home" && (
          <div>
            <GuildsTable
              openGuild={(guild) =>
                updateNowView({ type: "guildConfig", guild: guild })
              }
            />
          </div>
        )}
        {nowView.type === "auth" && <Login />}
        {nowView.type === "profile" && <Profile />}
        {nowView.type === "guildView" && <Tasks guild={nowView.guild} />}
        {nowView.type === "guildConfig" && (
          <GuildsSettings guild={nowView.guild} />
        )}
      </main>
    </div>
  )
}

export default App
