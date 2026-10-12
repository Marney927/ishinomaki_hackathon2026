import { createBrowserClient } from "@supabase/ssr"
export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key)
    throw new Error(
      "Supabaseの接続設定がありません。ビルド時の環境変数を確認してください。"
    )
  return createBrowserClient(url, key)
}
