import { reportError } from "@/lib/errors"
import { toast } from "@/components/ui/toast"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field.tsx"
import { Input } from "@/components/ui/input.tsx"
import { useUsersState } from "@/states/users.ts"
import { UserAvatar } from "@/components/user_tip.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Camera } from "lucide-react"
import { useState } from "react"

export function Profile() {
  const usersState = useUsersState()
  const [busy, setBusy] = useState(false)
  const [newUsername, setNewUsername] = useState<string>("")

  return (
    <div className="m-6">
      {usersState.me && (
        <FieldSet>
          <FieldLegend>プロフィール設定</FieldLegend>
          <FieldDescription>
            アカウントの基本情報を管理できます。
          </FieldDescription>
          <FieldGroup className="">
            <div className="grid grid-cols-3 gap-6 divide-x">
              <Field className="grid-item">
                <div className="grid w-full place-items-center">
                  <UserAvatar className="h-30 w-30" user={usersState.me} />
                  <Button
                    variant="outline"
                    className="mt-3"
                    disabled
                    title="画像変更は未実装です"
                  >
                    <Camera />
                    画像を変更
                  </Button>
                </div>
              </Field>
              <Field className="grid-item col-span-2 h-full">
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="name">表示名</FieldLabel>
                  <div className="flex gap-1">
                    <Input
                      id="name"
                      autoComplete="off"
                      placeholder={usersState.me.name}
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                    <Button
                      disabled={
                        busy ||
                        newUsername.trim().length === 0 ||
                        newUsername.trim().length > 100
                      }
                      className="px-10"
                      onClick={async () => {
                        if (!usersState.me || busy) return
                        setBusy(true)
                        try {
                          await usersState.update_name(
                            usersState.me.id,
                            newUsername
                          )
                          setNewUsername("")
                          toast.add({ title: "表示名を保存しました" })
                        } catch (e) {
                          reportError(e)
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      変更
                    </Button>
                  </div>
                </div>
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>
      )}
    </div>
  )
}
