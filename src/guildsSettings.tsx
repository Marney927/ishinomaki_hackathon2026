import { type Guild, useGuildsState } from "@/states/guilds.ts"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input.tsx"
import { Switch } from "@/components/ui/switch.tsx"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Copy, RefreshCcw } from "lucide-react"
import { toast } from "@/components/ui/toast.tsx"

export function GuildsSettings(props: {guild: Guild}) {
  const guildsState = useGuildsState();
  const [guildName, setGuildName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [invitationCode, setInvitationCode] = useState<string>("");

  return (
    <div className="p-6">
      <FieldSet>
        <FieldLegend>ギルド設定</FieldLegend>
        <FieldDescription>
          ギルドの基本情報やメンバーの管理を行えます。
        </FieldDescription>
        <FieldGroup>
          <Field className="grid grid-cols-3">
            <FieldLabel htmlFor="name" className="col-span-1 block">
              ギルド名
            </FieldLabel>
            <Input
              id="name"
              className="col-span-2"
              autoComplete="off"
              placeholder={props.guild.name}
              value={guildName}
              onChange={(e) => setGuildName(e.target.value)}
            />
          </Field>
          <Field className="grid grid-cols-3">
            <FieldLabel htmlFor="description" className="col-span-1">
              ギルド説明
            </FieldLabel>
            <Textarea
              id="description"
              autoComplete="off"
              className="col-span-2"
              placeholder={props.guild.description}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field className="grid grid-cols-3">
            <FieldLabel htmlFor="invitation_code">招待コード</FieldLabel>
            <div className="col-span-2 flex gap-3">
              <Input
                id="invitation_code"
                autoComplete="off"
                className="shrink"
                placeholder={props.guild.description}
                disabled
              />
              <div className="flex gap-1">
                <Button variant="outline">
                  <Copy
                    onClick={async () =>
                      invitationCode.length > 0 &&
                      await navigator.clipboard.writeText(invitationCode) &&
                      toast.add({ title: "Copied!" })
                    }
                  />{" "}
                  コピー
                </Button>
                <Button variant="outline">
                  <RefreshCcw /> 変更
                </Button>
              </div>
            </div>
          </Field>
          <Field>
            <div className="flex justify-end">
              <Button
                disabled={guildName.length === 0 && description.length === 0}
              >
                変更を保存
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  )
}