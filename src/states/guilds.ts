import { requireUuid, requireGuildId } from "@/lib/validation"
import { useAuthState } from "@/states/auth"
import { create } from "zustand/react"
import { createClient } from "@/lib/supabase/client"
import { useUsersState, type User } from "@/states/users"
export type Guild = {
  id: number
  name: string
  owner: User
  description: string
  member_count: number
}
export interface GuildsState {
  guilds: Guild[]
  loadGuilds: () => Promise<void>
  getGuildInviteCode: (id: number) => Promise<string>
  editGuildInviteCode: (id: number) => Promise<string>
  deleteGuildMember: (id: number, uuid: string) => Promise<void>
  editGuildMaster: (id: number, uuid: string) => Promise<void>
  deleteGuild: (id: number) => Promise<void>
  addNewGuild: (name: string) => Promise<void>
  joinGuildBySecretUuid: (uuid: string) => Promise<void>
  editGuildName: (id: number, name: string) => Promise<void>
  editGuildDescription: (id: number, description: string) => Promise<void>
}
export const useGuildsState = create<GuildsState>((set, get) => ({
  guilds: [],
  editGuildMaster: async (id, uuid) => {
    requireGuildId(id)
    requireUuid(uuid, "メンバーID")
    const { error } = await createClient().rpc("transfer_guild_owner", {
      p_guild_id: id,
      p_user_id: uuid,
    })
    if (error) {
      if (error.code === "PGRST202")
        throw new Error(
          "ギルドマスターの変更を利用できません。管理者にお問い合わせください。"
        )
      throw error
    }
    await get().loadGuilds()
  },
  getGuildInviteCode: async (id) => {
    requireGuildId(id)
    const { data, error } = await createClient().rpc("get_guild_invite_code", {
      p_guild_id: id,
    })
    if (error) {
      if (error.code === "PGRST202")
        throw new Error(
          "招待コード取得を利用できません。管理者にお問い合わせください。"
        )
      throw error
    }
    if (typeof data !== "string" || !data)
      throw new Error("招待コードを取得できませんでした")
    return requireUuid(data, "招待コード")
  },
  editGuildInviteCode: async (id) => {
    requireGuildId(id)
    const { data, error } = await createClient().rpc(
      "rotate_guild_invite_code",
      { p_guild_id: id }
    )
    if (error) throw error
    if (typeof data !== "string" || !data)
      throw new Error("新しい招待コードを取得できませんでした")
    return data
  },
  deleteGuildMember: async (id, uuid) => {
    requireGuildId(id)
    requireUuid(uuid, "メンバーID")
    const { error } = await createClient().rpc("remove_guild_member", {
      p_guild_id: id,
      p_user_id: uuid,
    })
    if (error) throw error
    await get().loadGuilds()
  },
  deleteGuild: async (id) => {
    requireGuildId(id)
    const userId = useAuthState.getState().session?.user.id
    const { error } = await createClient().rpc("delete_guild", {
      p_guild_id: id,
    })
    if (error) throw error
    if (useAuthState.getState().session?.user.id !== userId) return
    set((state) => ({ guilds: state.guilds.filter((g) => g.id !== id) }))
  },
  loadGuilds: async () => {
    const userId = useAuthState.getState().session?.user.id
    const db = createClient()
    const { data, error } = await db
      .from("guilds")
      .select("id, name, description, owner_id")
      .order("id")
    if (error) throw error
    if (useAuthState.getState().session?.user.id !== userId) return
    if (!data.length) {
      set({ guilds: [] })
      return
    }
    const ids = data.map((g) => g.id)
    const [profiles, members] = await Promise.all([
      db
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", [...new Set(data.map((g) => g.owner_id))]),
      db.from("guild_members").select("guild_id, user_id").in("guild_id", ids),
    ])
    if (profiles.error) throw profiles.error
    if (members.error) throw members.error
    if (useAuthState.getState().session?.user.id !== userId) return
    set({
      guilds: data.map((g) => {
        const p = profiles.data.find((p) => p.id === g.owner_id)
        if (!p)
          throw new Error("ギルド所有者のプロフィールを取得できませんでした")
        return {
          id: g.id,
          name: g.name,
          description: g.description ?? "",
          owner: { id: p.id, name: p.display_name, avatar_url: p.avatar_url },
          member_count: members.data.filter((m) => m.guild_id === g.id).length,
        }
      }),
    })
  },
  addNewGuild: async (name) => {
    if (!name.trim() || name.trim().length > 120)
      throw new Error("ギルド名は1〜120文字で入力してください")
    const db = createClient()
    const { data: auth, error: authError } = await db.auth.getUser()
    if (authError) throw authError
    if (!auth.user) throw new Error("ログインしてください")
    await useUsersState
      .getState()
      .loadMe(auth.user.id, auth.user.email?.split("@")[0] ?? "Member")
    const { error } = await db.rpc("create_guild", {
      p_name: name.trim(),
      p_description: null,
    })
    if (error) throw error
    await get().loadGuilds()
  },
  joinGuildBySecretUuid: async (uuid) => {
    requireUuid(uuid.trim(), "招待コード")
    const { error } = await createClient().rpc("join_guild", {
      p_secret: uuid.trim(),
    })
    if (error) throw error
    await get().loadGuilds()
  },
  editGuildName: async (id, name) => {
    requireGuildId(id)
    if (!name.trim() || name.trim().length > 120)
      throw new Error("ギルド名は1〜120文字で入力してください")
    const { error } = await createClient()
      .from("guilds")
      .update({ name: name.trim() })
      .eq("id", id)
      .select("id")
      .single()
    if (error) throw error
    await get().loadGuilds()
  },
  editGuildDescription: async (id, description) => {
    requireGuildId(id)
    const { error } = await createClient()
      .from("guilds")
      .update({ description })
      .eq("id", id)
      .select("id")
      .single()
    if (error) throw error
    await get().loadGuilds()
  },
}))
