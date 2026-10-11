export interface UsersState {
  me: User
}

export type User = {
  id: string
  name: string
  avatar_url: string | null
}
