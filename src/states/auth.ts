import { create } from "zustand/react"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

export interface AuthState {
  session: Session | null
  recovering: boolean
  resetPassword: (email: string) => Promise<void>
  updateEmail: (email: string) => Promise<void>
  updatePassword: (password: string, currentPassword?: string) => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (username: string, password: string) => Promise<void>
  initialize: () => Promise<void>
  startAuthListener: () => () => void
}

export const useAuthState = create<AuthState>((set, get) => ({
  session: null,
  recovering: false,
  resetPassword: async (email) => {
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: new URL(import.meta.env.BASE_URL, window.location.origin)
        .href,
    })
    if (error) throw error
  },
  updateEmail: async (email) => {
    const { error } = await createClient().auth.updateUser({
      email: email.trim(),
    })
    if (error) throw error
  },
  updatePassword: async (password, currentPassword) => {
    if (password.length < 8)
      throw new Error("パスワードは8文字以上で入力してください")
    const auth = createClient().auth
    if (!get().recovering) {
      const email = get().session?.user.email
      if (!email || !currentPassword)
        throw new Error("現在のパスワードを入力してください")
      const result = await auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (result.error) throw result.error
    }
    const { error } = await auth.updateUser({ password })
    if (error) throw error
    set({ recovering: false })
  },
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
    set({ session: null, recovering: false })
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
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // sessionまたはnullが返ってくるので、そのまま保存する
      set({
        session,
        recovering:
          event === "PASSWORD_RECOVERY"
            ? true
            : event === "SIGNED_OUT"
              ? false
              : get().recovering,
      })
    })

    return () => {
      // 監視を解除する
      data.subscription.unsubscribe()
    }
  },
}))
