import { getErrorMessage, reportError } from "@/lib/errors"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { Button } from "@/components/ui/button.tsx"
import { PlusCircle, UserGroup, Users } from "lucide-react"
import { Field, FieldGroup } from "@/components/ui/field.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import { useState } from "react"
import { type Guild, useGuildsState } from "@/states/guilds.ts"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item.tsx"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"

export function GuildsTable(props: { openGuild: (guild_id: Guild) => void }) {
  const guildsState = useGuildsState()
  const [busy, setBusy] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createGuildDialogOpen, setCreateGuildDialogOpen] =
    useState<boolean>(false)
  const [guildName, setGuildName] = useState<string>("")
  const [guildInvitation, setGuildInvitation] = useState<string>("")
  const [joinGuildDialogOpen, setJoinGuildDialogOpen] = useState<boolean>(false)

  return (
    <div className="m-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Item
            variant="outline"
            className="cursor-pointer"
            onClick={() => setCreateGuildDialogOpen(true)}
          >
            <ItemActions>
              <PlusCircle className="mr-2 scale-150" />
            </ItemActions>
            <ItemContent>
              <ItemTitle>新しいギルドを作成</ItemTitle>
              <ItemDescription>
                新しくギルドを作成して、仲間とタスクを管理しましょう。
              </ItemDescription>
            </ItemContent>
          </Item>
        </div>
        <div>
          <Item
            variant="outline"
            className="cursor-pointer"
            onClick={() => setJoinGuildDialogOpen(true)}
          >
            <ItemActions>
              <UserGroup className="mr-2 scale-150" />
            </ItemActions>
            <ItemContent>
              <ItemTitle>招待コードで参加</ItemTitle>
              <ItemDescription>
                ギルドから共有された招待コードを入力してギルドに参加します。
              </ItemDescription>
            </ItemContent>
          </Item>
        </div>
      </div>
      <Dialog
        open={createGuildDialogOpen}
        onOpenChange={(open) => {
          if (!busy) setCreateGuildDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">ギルドを作成</DialogTitle>
            {createError && (
              <p
                role="alert"
                className="text-sm whitespace-pre-wrap text-destructive"
              >
                {createError}
              </p>
            )}
            <FieldGroup>
              <Field>
                <Label htmlFor="guild-name">ギルド名</Label>
                <Input
                  id="title"
                  name="guildname"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setCreateGuildDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={
                busy || !guildName.trim() || guildName.trim().length > 120
              }
              onClick={async () => {
                if (busy) return
                setBusy(true)
                try {
                  setCreateError("")
                  await guildsState.addNewGuild(guildName)
                  setCreateGuildDialogOpen(false)
                  setGuildName("")
                } catch (e) {
                  setCreateError(getErrorMessage(e))
                  reportError(e)
                } finally {
                  setBusy(false)
                }
              }}
            >
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={joinGuildDialogOpen}
        onOpenChange={(open) => {
          if (!busy) setJoinGuildDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">ギルドに参加</DialogTitle>
            <FieldGroup>
              <Field>
                <Label htmlFor="guild-name">招待コード</Label>
                <Input
                  id="guildcode"
                  name="guildcode"
                  value={guildInvitation}
                  onChange={(e) => setGuildInvitation(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setJoinGuildDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={busy || !guildInvitation.trim()}
              onClick={async () => {
                if (busy) return
                setBusy(true)
                try {
                  await guildsState.joinGuildBySecretUuid(guildInvitation)
                  setJoinGuildDialogOpen(false)
                  setGuildInvitation("")
                } catch (e) {
                  reportError(e)
                } finally {
                  setBusy(false)
                }
              }}
            >
              参加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="my-3 text-lg font-bold">参加中のギルド</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {guildsState.guilds.length === 0 && (
          <p className="p-3 text-muted-foreground">
            参加中のギルドはありません。
          </p>
        )}
        {guildsState.guilds.map((guild: Guild) => (
          <Card key={guild.id}>
            <CardHeader>
              <CardTitle>{guild.name}</CardTitle>
              <CardDescription>{guild.description}</CardDescription>
            </CardHeader>
            <CardFooter className="w-full">
              <div className="flex grow gap-3">
                <Users /> {guild.member_count}人のメンバー
              </div>
              <Button onClick={() => props.openGuild(guild)}>開く</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
