import { useAuthState } from "@/states/auth"
import { create } from "zustand/react"
import { createClient } from "@/lib/supabase/client"
export type User = { id: string; name: string; avatar_url: string | null }
export interface UsersState {
  me: User | null
  loadMe: (id: string, defaultName: string) => Promise<void>
  update_name: (id: string, name: string) => Promise<void>
  update_avatar: (id: string, avatar_url: string) => Promise<void>
}
export const useUsersState = create<UsersState>((set) => ({
  me: null,
  update_avatar: async (id, avatar_url) => {
    if (
      !/^data:image\/(png|jpeg|webp);base64,/.test(avatar_url) ||
      avatar_url.length > 200000
    )
      throw new Error("画像サイズが大きすぎます")
    const { data, error } = await createClient()
      .from("profiles")
      .update({ avatar_url })
      .eq("id", id)
      .select("id, display_name, avatar_url")
      .single()
    if (error) throw error
    if (useAuthState.getState().session?.user.id !== id) return
    set({
      me: { id: data.id, name: data.display_name, avatar_url: data.avatar_url },
    })
  },
  loadMe: async (id, defaultName) => {
    const db = createClient()
    const { data, error } = await db
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    let profile = data
    if (!profile) {
      const result = await db
        .from("profiles")
        .insert({
          id,
          display_name: defaultName.trim().slice(0, 100) || "Member",
        })
        .select("id, display_name, avatar_url")
        .single()
      if (result.error) {
        // Another tab may have created this profile concurrently.
        const retry = await db
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", id)
          .single()
        if (retry.error) throw result.error
        profile = retry.data
      } else profile = result.data
    }
    if (useAuthState.getState().session?.user.id !== id) return
    set({
      me: {
        id: profile.id,
        name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
    })
  },
  update_name: async (id, name) => {
    const display_name = name.trim()
    if (!display_name || display_name.length > 100)
      throw new Error("表示名は1〜100文字で入力してください")
    const { data, error } = await createClient()
      .from("profiles")
      .update({ display_name })
      .eq("id", id)
      .select("id, display_name, avatar_url")
      .single()
    if (error) throw error
    if (useAuthState.getState().session?.user.id !== id) return
    set({
      me: { id: data.id, name: data.display_name, avatar_url: data.avatar_url },
    })
  },
}))
