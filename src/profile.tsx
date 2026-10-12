import { useRef, useState } from "react"
import { Camera } from "lucide-react"
import { useUsersState } from "@/states/users"
import { useAuthState } from "@/states/auth"
import { UserAvatar } from "@/components/user_tip"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/password-input"
import { toast } from "@/components/ui/toast"
import { reportError, getErrorMessage } from "@/lib/errors"
import { avatarThumbnail } from "@/lib/avatar"
export function Profile({ recovery = false }: { recovery?: boolean }) {
  const me = useUsersState((s) => s.me)
  const auth = useAuthState()
  const [name, setName] = useState(me?.name ?? "")
  const [email, setEmail] = useState("")
  const [current, setCurrent] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const upload = useRef<HTMLInputElement>(null)
  const run = async (action: () => Promise<void>, title: string) => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      await action()
      toast.add({ title })
    } catch (e) {
      setError(getErrorMessage(e))
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  const changePassword = () =>
    void run(async () => {
      if (password !== confirmation)
        throw new Error("確認用パスワードが一致しません")
      await auth.updatePassword(password, recovery ? undefined : current)
      setCurrent("")
      setPassword("")
      setConfirmation("")
    }, "パスワードを変更しました")
  return (
    <div className={`page-content ${recovery ? "w-full max-w-2xl" : ""}`}>
      <h1 className="page-heading">
        {recovery ? "パスワード再設定" : "プロフィール設定"}
      </h1>
      <p className="page-intro">
        {recovery
          ? "新しいパスワードを設定してください。"
          : "アカウントの基本情報を管理できます。"}
      </p>
      {error && (
        <p
          role="alert"
          className="mb-4 text-sm whitespace-pre-wrap text-destructive"
        >
          {error}
        </p>
      )}
      {!recovery && me && (
        <>
          <section className="section-card">
            <h2 className="section-title">基本情報</h2>
            <p className="section-description">
              名前の変更とアバター画像の管理ができます。
            </p>
            <div className="profile-basic">
              <div className="profile-avatar-panel">
                <UserAvatar user={me} />
                <input
                  ref={upload}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  className="hidden"
                  aria-label="プロフィール画像"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ""
                    if (file)
                      void run(async () => {
                        const image = await avatarThumbnail(file)
                        await useUsersState
                          .getState()
                          .update_avatar(me.id, image)
                      }, "プロフィール画像を変更しました")
                  }}
                />
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => upload.current?.click()}
                >
                  <Camera />
                  画像を変更
                </Button>
                <small>
                  対応形式：PNG、JPG、GIF（5MB以下）
                  <br />
                  正方形の静止画に調整して保存します。
                </small>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void run(
                    () => useUsersState.getState().update_name(me.id, name),
                    "表示名を保存しました"
                  )
                }}
              >
                <Label htmlFor="profile-name">
                  名前<span className="required-tag">必須</span>
                </Label>
                <Input
                  id="profile-name"
                  className="mt-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  disabled={busy}
                />
                <span className="char-count">{name.length} / 100</span>
                <Button
                  className="mt-6"
                  type="submit"
                  disabled={busy || !name.trim() || name.trim() === me.name}
                >
                  変更を保存
                </Button>
              </form>
            </div>
          </section>
          <section className="section-card">
            <h2 className="section-title">メールアドレスの変更</h2>
            <p className="section-description">
              ログインに使用するメールアドレスを変更します。
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void run(async () => {
                  await auth.updateEmail(email)
                  setEmail("")
                }, "変更を受け付けました。確認メールをご確認ください。")
              }}
            >
              <div className="field-row">
                <Label htmlFor="new-email">
                  新しいメールアドレス<span className="required-tag">必須</span>
                </Label>
                <div>
                  <Input
                    id="new-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={auth.session?.user.email}
                    required
                    disabled={busy}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    設定に応じて、現在と新しいメールアドレスへ確認メールが送信されます。
                  </p>
                </div>
              </div>
              <div className="form-actions">
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    !email.trim() ||
                    email.trim() === auth.session?.user.email
                  }
                >
                  変更する
                </Button>
              </div>
            </form>
          </section>
        </>
      )}
      <section className="section-card">
        <h2 className="section-title">
          {recovery ? "新しいパスワード" : "パスワードの変更"}
        </h2>
        <p className="section-description">
          アカウントのパスワードを変更します。
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            changePassword()
          }}
        >
          {!recovery && (
            <div className="field-row">
              <Label htmlFor="current-password">
                現在のパスワード<span className="required-tag">必須</span>
              </Label>
              <PasswordInput
                id="current-password"
                value={current}
                onChange={setCurrent}
                disabled={busy}
              />
            </div>
          )}
          <div className="field-row">
            <Label htmlFor="new-password">
              新しいパスワード<span className="required-tag">必須</span>
            </Label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
          <div className="field-row">
            <Label htmlFor="confirm-password">
              新しいパスワード（確認）<span className="required-tag">必須</span>
            </Label>
            <PasswordInput
              id="confirm-password"
              value={confirmation}
              onChange={setConfirmation}
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
          <p className="mt-3 text-right text-xs text-muted-foreground">
            8文字以上で、他のサービスと異なるパスワードを設定してください。
          </p>
          <div className="form-actions">
            <Button
              type="submit"
              disabled={
                busy ||
                (!recovery && !current) ||
                password.length < 8 ||
                password !== confirmation
              }
            >
              変更する
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
