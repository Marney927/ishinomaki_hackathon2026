import { useEffect, useState } from "react"
import { Copy, RefreshCw, Crown, Trash2 } from "lucide-react"
import { type Guild, useGuildsState } from "@/states/guilds"
import { useUsersState, type User } from "@/states/users"
import { useTasksState } from "@/states/tasks"
import { createClient } from "@/lib/supabase/client"
import { getErrorMessage, reportError } from "@/lib/errors"
import { UserAvatar, UserTip } from "@/components/user_tip"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
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
  const [masterId, setMasterId] = useState(guild.owner.id)
  const me = useUsersState((s) => s.me)
  const canEdit = me?.id === guild.owner.id
  const [inviteCode, setInviteCode] = useState("")
  const [inviteLoading, setInviteLoading] = useState(true)
  const [inviteError, setInviteError] = useState("")
  const [inviteRetry, setInviteRetry] = useState(0)
  const [members, setMembers] = useState<(User & { joined_at: string })[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [membersFailed, setMembersFailed] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setInviteCode("")
    setInviteError("")
    setInviteLoading(canEdit)
    if (canEdit)
      void useGuildsState
        .getState()
        .getGuildInviteCode(guild.id)
        .then((code) => {
          if (active) setInviteCode(code)
        })
        .catch((e) => {
          if (active) setInviteError(getErrorMessage(e))
        })
        .finally(() => {
          if (active) setInviteLoading(false)
        })
    return () => {
      active = false
    }
  }, [guild.id, canEdit, inviteRetry])
  useEffect(() => {
    let active = true
    setLoadingMembers(true)
    setMembersFailed(false)
    const load = async () => {
      const db = createClient()
      const membership = await db
        .from("guild_members")
        .select("user_id, joined_at")
        .eq("guild_id", guild.id)
      if (membership.error) throw membership.error
      const profiles = await db
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in(
          "id",
          membership.data.map((m) => m.user_id)
        )
      if (profiles.error) throw profiles.error
      if (active)
        setMembers(
          profiles.data.map((p) => ({
            id: p.id,
            name: p.display_name,
            avatar_url: p.avatar_url,
            joined_at:
              membership.data.find((m) => m.user_id === p.id)?.joined_at ?? "",
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
  const run = async (action: () => Promise<void>, title: string) => {
    if (busy || !canEdit) return
    setBusy(true)
    try {
      await action()
      toast.add({ title })
    } catch (e) {
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  const clearCache = () =>
    useTasksState.setState((state) => {
      const tasks = new Map(state.tasks)
      const members = new Map(state.members)
      tasks.delete(guild.id)
      members.delete(guild.id)
      return { tasks, members }
    })
  const rotateInvite = async () => {
    if (
      inviteLoading ||
      !window.confirm(
        "招待コードを再発行しますか？以前のコードは使えなくなります。"
      )
    )
      return
    await run(async () => {
      const code = await useGuildsState.getState().editGuildInviteCode(guild.id)
      setInviteCode(code)
      setInviteError("")
    }, "招待コードを再発行しました")
  }
  const removeMember = async (member: User) => {
    if (
      member.id === guild.owner.id ||
      !window.confirm(`${member.name}をギルドから削除しますか？`)
    )
      return
    await run(async () => {
      await useGuildsState.getState().deleteGuildMember(guild.id, member.id)
      setMembers((list) => list.filter((m) => m.id !== member.id))
      clearCache()
    }, "メンバーを削除しました")
  }
  const deleteGuild = async () => {
    if (
      !window.confirm(
        `「${guild.name}」と全タスクを削除しますか？この操作は取り消せません。`
      )
    )
      return
    await run(async () => {
      await useGuildsState.getState().deleteGuild(guild.id)
      clearCache()
      onDeleted()
    }, "ギルドを削除しました")
  }
  const transfer = async () => {
    if (
      masterId === guild.owner.id ||
      !window.confirm(
        "ギルドマスターを変更しますか？変更後、あなたの管理権限は失われます。"
      )
    )
      return
    await run(async () => {
      await useGuildsState.getState().editGuildMaster(guild.id, masterId)
      clearCache()
    }, "ギルドマスターを変更しました")
  }
  const save = async () => {
    if (!name.trim() || name.trim().length > 120) return
    await run(async () => {
      const { error } = await createClient()
        .from("guilds")
        .update({ name: name.trim(), description })
        .eq("id", guild.id)
        .select("id")
        .single()
      if (error) throw error
      await useGuildsState.getState().loadGuilds()
    }, "ギルド設定を保存しました")
  }
  return (
    <div className="page-content">
      <h1 className="page-heading">ギルド設定</h1>
      <p className="page-intro">
        ギルドの基本情報やメンバーの管理を行えます。
        {!canEdit && "変更できるのはギルド所有者です。"}
      </p>
      <section className="section-card">
        <h2 className="section-title">ギルド基本情報</h2>
        <p className="section-description">
          ギルドの名前と説明を編集できます。
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <div className="field-row">
            <Label htmlFor="guild-name">
              ギルド名<span className="required-tag">必須</span>
            </Label>
            <div>
              <Input
                id="guild-name"
                value={name}
                maxLength={120}
                disabled={!canEdit || busy}
                onChange={(e) => setName(e.target.value)}
              />
              <small className="char-count">{name.length} / 120</small>
            </div>
          </div>
          <div className="field-row">
            <Label htmlFor="guild-description">ギルド説明</Label>
            <div>
              <Textarea
                id="guild-description"
                value={description}
                disabled={!canEdit || busy}
                onChange={(e) => setDescription(e.target.value)}
              />
              <small className="char-count">{description.length}文字</small>
            </div>
          </div>
          <div className="form-actions">
            <Button
              type="submit"
              disabled={
                busy ||
                !canEdit ||
                !name.trim() ||
                name.trim().length > 120 ||
                (name === guild.name && description === guild.description)
              }
            >
              変更を保存
            </Button>
          </div>
        </form>
      </section>
      <section className="section-card">
        <h2 className="section-title">招待コード</h2>
        <p className="section-description">
          このコードを共有することで、他のユーザーがギルドに参加できます。
        </p>
        {canEdit ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="min-w-48 flex-1 bg-secondary"
                aria-label="招待コード"
                readOnly
                value={inviteCode}
                placeholder={inviteLoading ? "読み込み中…" : "招待コード"}
              />
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
                <Copy />
                コピー
              </Button>
              <Button
                className="ml-auto"
                variant="outline"
                disabled={busy || inviteLoading}
                onClick={() => void rotateInvite()}
              >
                <RefreshCw />
                招待コードを変更
              </Button>
            </div>
            {inviteError && (
              <div className="mt-2 text-sm" role="alert">
                <p className="text-destructive">{inviteError}</p>
                <Button
                  variant="outline"
                  disabled={busy || inviteLoading}
                  onClick={() => setInviteRetry((n) => n + 1)}
                >
                  再試行
                </Button>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              ※ 再発行すると以前の招待コードは使えなくなります。
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            招待コードはギルドマスターが管理します。
          </p>
        )}
      </section>
      <section className="section-card">
        <h2 className="section-title">ギルドマスターの設定</h2>
        <p className="section-description">
          ギルドの管理者（ギルドマスター）を設定します。
        </p>
        <div className="field-row">
          <Label>
            ギルドマスター<span className="required-tag">必須</span>
          </Label>
          <div>
            <Select
              value={masterId}
              onValueChange={(value) => {
                if (value) setMasterId(value)
              }}
              disabled={!canEdit || busy || loadingMembers || membersFailed}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <UserAvatar
                    user={members.find((m) => m.id === masterId) ?? guild.owner}
                    className="size-7"
                  />
                  {members.find((m) => m.id === masterId)?.name ??
                    guild.owner.name}
                  {masterId === me?.id && "（自分）"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem value={member.id} key={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              ギルドマスターは設定変更やメンバー管理を行えます。変更後は管理権限が移ります。
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="form-actions">
            <Button
              disabled={
                busy ||
                masterId === guild.owner.id ||
                loadingMembers ||
                membersFailed
              }
              onClick={() => void transfer()}
            >
              マスターを変更
            </Button>
          </div>
        )}
      </section>
      <section className="section-card">
        <div className="flex items-center justify-between">
          <h2 className="section-title">メンバーの管理</h2>
          <span className="text-sm text-muted-foreground">
            メンバー数：{guild.member_count}人
          </span>
        </div>
        <p className="section-description">
          ギルドのメンバー一覧です。タスク担当者は担当変更後に削除できます。
        </p>
        {loadingMembers ? (
          <p>読み込み中です。</p>
        ) : membersFailed ? (
          <Button variant="outline" onClick={() => setReload((n) => n + 1)}>
            再試行
          </Button>
        ) : (
          <div className="member-table-wrap">
            <table className="member-table">
              <thead>
                <tr>
                  <th>ユーザー名</th>
                  <th>役割</th>
                  <th>参加日</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <UserTip user={member} />
                      {member.id === me?.id && (
                        <span className="text-xs text-muted-foreground">
                          （自分）
                        </span>
                      )}
                    </td>
                    <td>
                      {member.id === guild.owner.id ? (
                        <span className="flex items-center gap-2">
                          <Crown size={18} className="text-amber-500" />
                          ギルドマスター
                        </span>
                      ) : (
                        "メンバー"
                      )}
                    </td>
                    <td>
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString(
                            "ja-JP",
                            { timeZone: "Asia/Tokyo" }
                          )
                        : "—"}
                    </td>
                    <td>
                      {canEdit && member.id !== guild.owner.id ? (
                        <Button
                          variant="outline"
                          className="h-8 border-red-200 text-destructive"
                          disabled={busy}
                          onClick={() => void removeMember(member)}
                        >
                          <Trash2 size={14} />
                          削除
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {canEdit && (
        <section className="section-card danger-section">
          <h2 className="section-title">ギルド削除</h2>
          <p className="section-description">
            ギルドと全タスクを削除します。この操作は取り消せません。
          </p>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => void deleteGuild()}
          >
            <Trash2 />
            ギルドを削除
          </Button>
        </section>
      )}
    </div>
  )
}
