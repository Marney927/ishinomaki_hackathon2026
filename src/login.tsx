import { useState } from "react"
import {
  ListTodo,
  Megaphone,
  UsersRound,
  UserPlus,
  ArrowRight,
  Mail,
} from "lucide-react"
import { useAuthState } from "@/states/auth"
import { getErrorMessage, reportError } from "@/lib/errors"
import { toast } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { Brand } from "@/components/brand"
export function Login() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async () => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const auth = useAuthState.getState()
      if (mode === "reset") {
        await auth.resetPassword(email.trim())
        toast.add({
          title: "確認メールを送信しました",
          description:
            "登録済みのメールアドレスの場合、再設定リンクが届きます。",
        })
      } else if (mode === "signup") {
        await auth.signup(email.trim(), password)
        if (!useAuthState.getState().session)
          toast.add({
            title: "登録を受け付けました",
            description:
              "メール確認が有効な場合は、メールを確認してからログインしてください。",
          })
      } else await auth.login(email.trim(), password)
    } catch (e) {
      setError(getErrorMessage(e))
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  const changeMode = (next: typeof mode) => {
    setMode(next)
    setError("")
    setPassword("")
  }
  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-art">
          <Brand light />
          <p className="login-tagline">仲間とつくる、やりたいをカタチに。</p>
          <p className="login-summary">
            ギルドでタスクを共有し、
            <br />
            仲間と協力して目標を達成するための
            <br />
            タスク管理プラットフォームです。
          </p>
          {[
            {
              icon: ListTodo,
              title: "タスクの可視化",
              text: "ギルドのタスクをかんばんで管理",
            },
            {
              icon: UsersRound,
              title: "仲間と協力",
              text: "タスクに参加して一緒に進める",
            },
            {
              icon: Megaphone,
              title: "掲示板で募集",
              text: "やりたいタスクを掲示して仲間を集める",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div className="login-benefit" key={title}>
              <span>
                <Icon size={28} />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="login-form-side">
          <div className="login-form-card">
            <h1>
              {mode === "signup"
                ? "アカウント登録"
                : mode === "reset"
                  ? "パスワード再設定"
                  : "ログイン"}
            </h1>
            <p>
              {mode === "reset"
                ? "登録したメールアドレスに再設定リンクを送信します。"
                : "メールアドレスとパスワードで、ギルドタスクボードをはじめましょう。"}
            </p>
            {error && (
              <p
                role="alert"
                className="text-sm whitespace-pre-wrap text-destructive"
              >
                {error}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="your@email.com"
                  disabled={busy}
                />
              </div>
              {mode !== "reset" && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">パスワード</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => changeMode("reset")}
                      >
                        パスワードをお忘れの方
                      </button>
                    )}
                  </div>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    disabled={busy}
                  />
                  {mode === "signup" && (
                    <p className="text-xs text-muted-foreground">
                      8文字以上のパスワードを入力してください。
                    </p>
                  )}
                </div>
              )}
              <Button
                className="submit-button"
                type="submit"
                disabled={
                  busy ||
                  !email.trim() ||
                  (mode !== "reset" &&
                    password.length < (mode === "signup" ? 8 : 1))
                }
              >
                {busy
                  ? "処理中…"
                  : mode === "signup"
                    ? "登録する"
                    : mode === "reset"
                      ? "再設定メールを送信"
                      : "ログイン"}
                {mode === "reset" ? <Mail /> : <ArrowRight />}
              </Button>
            </form>
            <div className="login-divider">または</div>
            <Button
              variant="outline"
              className="login-alternate"
              disabled={busy}
              onClick={() => changeMode(mode === "login" ? "signup" : "login")}
            >
              <UserPlus />
              {mode === "login" ? "新規アカウントを作成" : "ログインに戻る"}
              <ArrowRight />
            </Button>
            <p className="login-note">
              確認メールを受け取れるメールアドレスをご利用ください。
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
