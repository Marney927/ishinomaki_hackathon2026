import { type Guild, useGuildsState } from "@/states/guilds"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import type { User } from "@/states/users"
import { useTasksState } from "@/states/tasks"
import { useUsersState } from "@/states/users"
import { createClient } from "@/lib/supabase/client"
import { getErrorMessage, reportError } from "@/lib/errors"
import { toast } from "@/components/ui/toast"
export function GuildsSettings({
  guild,
  onDeleted,
}: {
  guild: Guild
  onDeleted: () => void
}) {
  const [name, setName] = useState(guild.name)
  const [description, setDescription] = useState(guild.description)
  const [busy, setBusy] = useState(false)
  const me = useUsersState((s) => s.me)
  const canEdit = me?.id === guild.owner.id
  const [inviteCode, setInviteCode] = useState("")
  const [inviteLoading, setInviteLoading] = useState(true)
  const [inviteError, setInviteError] = useState("")
  const [inviteRetry, setInviteRetry] = useState(0)
  useEffect(() => {
    let active = true
    setInviteCode("")
    setInviteError("")
    setInviteLoading(canEdit)
    if (canEdit) {
      void useGuildsState
        .getState()
        .getGuildInviteCode(guild.id)
        .then((code) => {
          if (active) setInviteCode(code)
        })
        .catch((error) => {
          if (active) setInviteError(getErrorMessage(error))
        })
        .finally(() => {
          if (active) setInviteLoading(false)
        })
    }
    return () => {
      active = false
    }
  }, [guild.id, canEdit, inviteRetry])
  const [members, setMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [membersFailed, setMembersFailed] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLoadingMembers(true)
    setMembersFailed(false)
    const load = async () => {
      const db = createClient()
      const memberships = await db
        .from("guild_members")
        .select("user_id")
        .eq("guild_id", guild.id)
      if (memberships.error) throw memberships.error
      const profiles = await db
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in(
          "id",
          memberships.data.map((m) => m.user_id)
        )
      if (profiles.error) throw profiles.error
      if (active)
        setMembers(
          profiles.data.map((p) => ({
            id: p.id,
            name: p.display_name,
            avatar_url: p.avatar_url,
          }))
        )
    }
    void load()
      .catch((e) => {
        if (active) {
          reportError(e)
          setMembersFailed(true)
        }
      })
      .finally(() => {
        if (active) setLoadingMembers(false)
      })
    return () => {
      active = false
    }
  }, [guild.id, reload])
  const rotateInvite = async () => {
    if (
      busy ||
      !canEdit ||
      !window.confirm(
        "招待コードを再発行しますか？以前のコードは使えなくなります。"
      )
    )
      return
    setBusy(true)
    try {
      const code = await useGuildsState.getState().editGuildInviteCode(guild.id)
      setInviteCode(code)
      setInviteError("")
      toast.add({
        title: "招待コードを再発行しました",
        description: "新しいコードをコピーして共有してください。",
      })
    } catch (e) {
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  const removeMember = async (member: User) => {
    if (
      busy ||
      !canEdit ||
      member.id === guild.owner.id ||
      !window.confirm(`${member.name}をギルドから削除しますか？`)
    )
      return
    setBusy(true)
    try {
      await useGuildsState.getState().deleteGuildMember(guild.id, member.id)
      setMembers((list) => list.filter((m) => m.id !== member.id))
      // Discard cached tasks/members so the next visit fetches fresh membership data.
      useTasksState.setState((state) => {
        const tasks = new Map(state.tasks)
        const members = new Map(state.members)
        tasks.delete(guild.id)
        members.delete(guild.id)
        return { tasks, members }
      })
      toast.add({ title: "メンバーを削除しました" })
    } catch (e) {
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  const deleteGuild = async () => {
    if (
      busy ||
      !canEdit ||
      !window.confirm(
        `「${guild.name}」と全タスクを削除しますか？この操作は取り消せません。`
      )
    )
      return
    setBusy(true)
    try {
      await useGuildsState.getState().deleteGuild(guild.id)
      useTasksState.setState((state) => {
        const tasks = new Map(state.tasks)
        const members = new Map(state.members)
        tasks.delete(guild.id)
        members.delete(guild.id)
        return { tasks, members }
      })
      onDeleted()
      toast.add({ title: "ギルドを削除しました" })
    } catch (e) {
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  const save = async () => {
    if (busy || !canEdit) return
    setBusy(true)
    try {
      const { error } = await createClient()
        .from("guilds")
        .update({ name: name.trim(), description })
        .eq("id", guild.id)
        .select("id")
        .single()
      if (error) throw error
      await useGuildsState.getState().loadGuilds()
      toast.add({ title: "ギルド設定を保存しました" })
    } catch (e) {
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="p-6">
      <FieldSet>
        <FieldLegend>ギルド設定</FieldLegend>
        <FieldDescription>
          ギルドの基本情報を管理できます。
          {!canEdit && "変更できるのはギルド所有者です。"}
        </FieldDescription>
        <FieldGroup>
          <Field className="grid grid-cols-3">
            <FieldLabel htmlFor="name">ギルド名</FieldLabel>
            <Input
              id="name"
              className="col-span-2"
              value={name}
              maxLength={120}
              disabled={!canEdit || busy}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field className="grid grid-cols-3">
            <FieldLabel htmlFor="description">ギルド説明</FieldLabel>
            <Textarea
              id="description"
              className="col-span-2"
              value={description}
              disabled={!canEdit || busy}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field className="grid grid-cols-3">
            <FieldLabel>招待コード</FieldLabel>
            <FieldDescription className="col-span-2">
              {canEdit ? (
                <div className="space-y-2">
                  {inviteError && (
                    <div role="alert">
                      <p>{inviteError}</p>
                      <Button
                        variant="outline"
                        disabled={busy || inviteLoading}
                        onClick={() => setInviteRetry((n) => n + 1)}
                      >
                        再試行
                      </Button>
                    </div>
                  )}
                  <Input
                    aria-label="招待コード"
                    readOnly
                    value={inviteCode}
                    placeholder={inviteLoading ? "読み込み中…" : "招待コード"}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={busy || inviteLoading || !inviteCode}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(inviteCode)
                          toast.add({ title: "招待コードをコピーしました" })
                        } catch (e) {
                          reportError(e)
                        }
                      }}
                    >
                      コピー
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void rotateInvite()}
                    >
                      再発行
                    </Button>
                  </div>
                  <p>再発行すると以前のコードは使えなくなります。</p>
                </div>
              ) : (
                "招待コードの再発行はギルド所有者が行えます。"
              )}
            </FieldDescription>
          </Field>
          <Field>
            <div className="flex justify-end">
              <Button
                disabled={
                  busy ||
                  !canEdit ||
                  !name.trim() ||
                  name.trim().length > 120 ||
                  (name === guild.name && description === guild.description)
                }
                onClick={() => void save()}
              >
                変更を保存
              </Button>
            </div>
          </Field>
          <Field>
            <FieldLabel>メンバー管理</FieldLabel>
            <FieldDescription>
              タスクを担当しているメンバーは削除できません。先にタスク担当者を変更してください。
            </FieldDescription>
            {loadingMembers ? (
              <p>読み込み中です。</p>
            ) : membersFailed ? (
              <Button variant="outline" onClick={() => setReload((n) => n + 1)}>
                再試行
              </Button>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <span>
                    {member.name}
                    {member.id === guild.owner.id && "（所有者）"}
                  </span>
                  {canEdit && member.id !== guild.owner.id && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void removeMember(member)}
                    >
                      削除
                    </Button>
                  )}
                </div>
              ))
            )}
          </Field>
          {canEdit && (
            <Field>
              <FieldLabel>ギルド削除</FieldLabel>
              <FieldDescription>
                ギルドと全タスクを削除します。取り消せません。
              </FieldDescription>
              <div>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => void deleteGuild()}
                >
                  ギルドを削除
                </Button>
              </div>
            </Field>
          )}
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
