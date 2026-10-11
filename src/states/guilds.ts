import type { Guild } from "@/types/main.ts"
import { create } from "zustand/react"

export interface GuildsState {
  guilds: Guild[],
  addNewGuild: (name: string) => Promise<void>,
  editGuildName: (id: number, name: string) => Promise<void>,
  deleteGuild: (id: number) => Promise<void>,
}

export const useGuildsState = create<GuildsState>((set, get) => ({
  guilds: [],
  addNewGuild: async (name: string) => {},
  editGuildName: async (id: number, name: string) => {},
  deleteGuild: async (id: number) => {},
}));
