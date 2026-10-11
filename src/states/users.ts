import { create } from "zustand/react"

export interface UsersState {
  me: User,
  update_name: (id: string, name: string) => Promise<void>,
}

export const useUsersState = create<UsersState>((get, set) => ({
  me: { // FIXME this is a placeholder data
    id: "usr_01",
    name: "Load Ing",
    avatar_url: null
  } satisfies User,
  update_name: async (id: string, new_name: string) => {}
}))

export type User = {
  id: string
  name: string
  avatar_url: string | null
}
