import "./index.css"
import { useState } from "react"
import { GuildsTable } from "@/components/guilds_table.tsx"
import { useGuildsState } from "@/states/guilds.ts"
import { useUsersState } from "@/states/users.ts"

export function App() {
  const [openProjectUuid, updateOpenProjectUuid] = useState<string | null>(null);
  const guildsState = useGuildsState();
  const usersState = useUsersState();

  return (
    <div>
      {openProjectUuid === null && (
        <GuildsTable guilds={guildsState.guilds} localUser={usersState.me} openGuild={(guild) => updateOpenProjectUuid(guild)} />
      )}
    </div>
  )
}

export default App
