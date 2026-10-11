import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { Button } from "@/components/ui/button.tsx"
import { BadgeCheckIcon, ChevronRightIcon, Plus, PlusCircle, UserGroup, Users } from "lucide-react"
import { Field, FieldGroup } from "@/components/ui/field.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx"
import { UserTip } from "@/components/user_tip.tsx"
import { type Guild, useGuildsState } from "@/states/guilds.ts"
import type { User } from "@/states/users.ts"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item.tsx"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"

export function GuildsTable(props: {guilds: Guild[], localUser: User | null, openGuild: (guild_id: string) => void}) {
  const [createGuildDialogOpen, setCreateGuildDialogOpen] = useState<boolean>(false);
  const [guildName, setGuildName] = useState<string>("");
  const [joinGuildDialogOpen, setJoinGuildDialogOpen] = useState<boolean>(false);
  const guilds = useGuildsState();

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
      <Dialog open={createGuildDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">ギルドを作成</DialogTitle>
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
              onClick={() => setCreateGuildDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={guildName.length === 0}
              onClick={() => {
                setCreateGuildDialogOpen(false)
              }}
            >
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={joinGuildDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">ギルドに参加</DialogTitle>
            <FieldGroup>
              <Field>
                <Label htmlFor="guild-name">招待コード</Label>
                <Input
                  id="guildcode"
                  name="guildcode"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setJoinGuildDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={guildName.length === 0}
              onClick={() => {
                setJoinGuildDialogOpen(false)
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
        {guilds.guilds.map((guild: Guild) => (
          <Card>
            <CardHeader>
              <CardTitle>{guild.name}</CardTitle>
              <CardDescription>{guild.description}</CardDescription>
            </CardHeader>
            <CardFooter className="w-full">
              <div className="flex grow gap-3">
                <Users /> {guild.member_count}人のメンバー
              </div>
              <Button>開く</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
