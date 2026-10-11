import { create } from "zustand/react"

export interface UsersState {
  me: User | null
}

export const useUsersState = create<UsersState>((get, set) => ({
  me: null
}))

export type User = {
  id: string
  name: string
  avatar_url: string | null
}
