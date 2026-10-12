import { create } from "zustand/react"
import type { Guild } from "@/states/guilds.ts"
import type { User } from "@/states/users.ts"

// TODO 初期化処理でタスクを読み込み
export interface TasksState {
  tasks: Map<Guild["id"], Task[]> // guild_id to task
  insert_new_task: (guild_id: Guild["id"], title: string, description: string | null, due_date: Date | null, status: string, is_published: boolean) => Promise<void>
  update_task: (task_id: Task["id"], guild_id: Guild["id"] | undefined, title: string | undefined, description: string | undefined, due_date: string | null, status: string, is_published: boolean | undefined) => Promise<void>
  delete_task: (task_id: Task["id"]) => Promise<void>
}

export const useTasksState = create<TasksState>((set, get) => ({
  tasks: new Map(),
  insert_new_task: async (guild_id: Guild["id"], title: string, description: string | null, due_date: Date | null, status: string, is_published: boolean) => {},
  update_task: async (task_id: Task["id"], guild_id: Guild["id"] | undefined, title: string | undefined, description: string | undefined, due_date: string | null, status: string, is_published: boolean | undefined) => {},
  delete_task: async (task_id: Task["id"]) => {}
}));

export type Task = {
  id: string
  guild: Guild
  title: string
  description: string | null
  due_date: Date | null
  owner: User
  status: Status
  is_published: boolean
  participants: User[],
}

export type Status =
  "todo" |
  "in_progress" |
  "completed" |
  "cancelled" |
  "pending"
