import { create } from "zustand/react"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

export interface AuthState {
  session: Session | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (username: string, password: string) => Promise<void>
  initialize: () => Promise<void>
  startAuthListener: () => () => void
}

export const useAuthState = create<AuthState>((set) => ({
  session: null,
  login: async (username: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    })

    if (error !== null) {
      // ログインエラー
      throw error
    }
    set({ session: data.session })
  },

  logout: async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error !== null) {
      // ログアウトエラー
      throw error
    }
    set({ session: null })
  },

  signup: async (username: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: username,
      password: password,
    })

    if (error !== null) {
      // 登録エラー
      throw error
    }
    if (data.session !== null) {
      // 登録成功して認証成功した場合のみセッションを更新
      set({ session: data.session })
    }
  },

  initialize: async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error !== null) {
      // session取得エラー
      throw error
    }
    set({ session: data.session })
  },

  startAuthListener: () => {
    const supabase = createClient()
    // 認証状態の監視を登録する
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // sessionまたはnullが返ってくるので、そのまま保存する
      set({ session })
    })

    return () => {
      // 監視を解除する
      data.subscription.unsubscribe()
    }
  },
}))
