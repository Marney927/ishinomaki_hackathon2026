import { create } from "zustand/react"
import type { User } from "@/states/users.ts"

export interface GuildsState {

  guilds: Guild[]
  addNewGuild: (name: string) => Promise<void>
  editGuildName: (id: number, name: string) => Promise<void>
  deleteGuild: (id: number) => Promise<void>
}

export const useGuildsState = create<GuildsState>((set, get) => ({
  guilds: [],
  addNewGuild: async (name: string) => {},
  editGuildName: async (id: number, name: string) => {},
  deleteGuild: async (id: number) => {},
}))

export type Guild = {
  id: string
  name: string
  owner: User
  description: string
  member_count: number
}
