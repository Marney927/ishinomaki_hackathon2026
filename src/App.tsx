import "./index.css"
import { KanbanView } from "@/kanban_view.tsx"
import { useState } from "react"
import { GuildsTable } from "@/components/guilds_table.tsx"
import { useGuildsState } from "@/states/guilds.ts"

export function App() {
  const [openProjectUuid, updateOpenProjectUuid] = useState<string | null>(null);
  const guildsState = useGuildsState();

  return (
    <div>
      {openProjectUuid === null && (
        <GuildsTable guilds={guildsState.guilds} localUser={} openGuild={(guild) => updateOpenProjectUuid(guild)} />
      )}
      {openProjectUuid !== null &&
        <KanbanView />
      }
    </div>
  )
}

export default App
