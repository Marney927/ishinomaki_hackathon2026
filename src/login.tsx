import { useState } from "react"
import { useAuthState } from "@/states/auth"
import { reportError } from "@/lib/errors"
import { toast } from "@/components/ui/toast"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input.tsx"
import { Button } from "@/components/ui/button.tsx"
import { List, Megaphone, Users } from "lucide-react"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const submit = async (signup: boolean) => {
    if (busy) return
    setBusy(true)
    try {
      if (signup) {
        await useAuthState.getState().signup(email.trim(), password)
        if (!useAuthState.getState().session)
          toast.add({
            title: "登録を受け付けました",
            description:
              "メール確認が有効な場合は、確認後にログインしてください。",
          })
      } else await useAuthState.getState().login(email.trim(), password)
    } catch (e) {
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid h-screen w-full grid-cols-2 place-items-center">
      <div>
        <h1 className="font-serif text-4xl font-bold">Guild Task Board</h1>
        <div>
          <div className="mt-10 flex flex-col gap-y-6">
            <div className="flex text-2xl">
              <List className="mr-3 scale-150" /> タスクの可視化
            </div>
            <div className="flex text-2xl">
              <Users className="mr-3 scale-150" /> 仲間と協力
            </div>
            <div className="flex text-2xl">
              <Megaphone className="mr-3 scale-150" /> 掲示板で募集
            </div>
          </div>
        </div>
      </div>
      <FieldSet className="border-white-300 w-full max-w-xl rounded-lg border border-4 p-6">
        <FieldGroup>
          <FieldTitle className="font-serif text-3xl font-bold">
            ログイン / 登録
          </FieldTitle>
          <Field>
            <FieldLabel htmlFor="email">メールアドレス</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="info@example.com"
            />
            <FieldDescription>
              <span className="text-yellow-500">
                実際のアドレスを入力し<b>ない</b>でください。
                <br />
                メールアドレスは次のパターンに従う必要があります：
                <br />
                <code className="bg-accent">[a-zA-Z0-9]+@example.com</code>
              </span>
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">パスワード</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>
          <Field className="grid w-full grid-cols-2 gap-2">
            <Button
              variant="default"
              className="w-full"
              disabled={busy || !email.trim() || !password}
              onClick={() => void submit(false)}
            >
              ログイン
            </Button>
            <Button
              variant="default"
              className="w-full"
              disabled={busy || !email.trim() || password.length < 6}
              onClick={() => void submit(true)}
            >
              登録
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
