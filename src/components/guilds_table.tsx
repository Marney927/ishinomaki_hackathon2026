import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Plus } from "lucide-react"
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
import type { Guild } from "@/states/guilds.ts"
import type { User } from "@/states/users.ts"

export function GuildsTable(props: {guilds: Guild[], localUser: User | null, openGuild: (guild_id: string) => void}) {
  const [open, setOpen] = useState<boolean>(false);
  const [guildName, setGuildName] = useState<string>("");

  return (
    <div>
      <Button onClick={() => !open && setOpen(true)}>
        <Plus />
        New Guild
      </Button>
      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a guild</DialogTitle>
            <FieldGroup>
              <Field>
                <Label htmlFor="guild-name">Guild Name</Label>
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
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={guildName.length === 0}
              onClick={() => {
                setOpen(false)
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Your role</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.guilds.map((guild) => (
            <TableRow key={guild.id}>
              <TableCell>{guild.name}</TableCell>
              <TableCell>
                {guild.owner.id === props.localUser?.id ? "Owner" : "Member"}
              </TableCell>
              <TableCell>
                <UserTip user={guild.owner} />
              </TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => props.openGuild(guild.id)}>Open</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}