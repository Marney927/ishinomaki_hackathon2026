export type Guild = {
  id: number
  name: string
  owner: User
}

export type User = {
  id: number
  name: string
  avatar_url: string | null
}
