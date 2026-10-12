import { useState } from "react"
import {
  ArrowRight,
  ChevronRight,
  MoreVertical,
  Plus,
  UsersRound,
  Settings,
} from "lucide-react"
import { type Guild, useGuildsState } from "@/states/guilds"
import { useUsersState } from "@/states/users"
import { getErrorMessage, reportError } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
type Visits = Record<string, number>
export function GuildsTable({
  openGuild,
  openSettings,
}: {
  openGuild: (guild: Guild) => void
  openSettings: (guild: Guild) => void
}) {
  const guildsState = useGuildsState()
  const me = useUsersState((s) => s.me)
  const [dialog, setDialog] = useState<"create" | "join" | null>(null)
  const [name, setName] = useState("")
  const [invite, setInvite] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [sort, setSort] = useState("recent")
  const visitKey = `guild-visits:${me?.id ?? ""}`
  const [visits] = useState<Visits>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(visitKey) ?? "{}")
      return value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(
            Object.entries(value).filter(
              ([, v]) => typeof v === "number" && Number.isFinite(v)
            )
          )
        : {}
    } catch {
      return {}
    }
  })
  const open = (guild: Guild) => {
    try {
      localStorage.setItem(
        visitKey,
        JSON.stringify({ ...visits, [guild.id]: Date.now() })
      )
    } catch {
      /* Recency is optional; opening the guild still works. */
    }
    openGuild(guild)
  }
  const list = [...guildsState.guilds].sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name, "ja")
      : sort === "members"
        ? b.member_count - a.member_count
        : (visits[b.id] ?? 0) - (visits[a.id] ?? 0) || b.id - a.id
  )
  const submit = async () => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      if (dialog === "create") await guildsState.addNewGuild(name)
      else await guildsState.joinGuildBySecretUuid(invite)
      setDialog(null)
      setName("")
      setInvite("")
    } catch (e) {
      setError(getErrorMessage(e))
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <section className="landscape-hero welcome-hero">
        <div>
          <h1>ようこそ、{me?.name}さん</h1>
          <p>参加するギルドを選択して、タスク管理をはじめましょう。</p>
        </div>
      </section>
      <div className="page-content">
        <div className="guild-actions">
          <button
            className="guild-action create"
            onClick={() => {
              setError("")
              setDialog("create")
            }}
          >
            <span className="action-icon">
              <Plus size={38} />
            </span>
            <div>
              <strong>新しいギルドを作成</strong>
              <p>
                新しくギルドを作成して
                <br />
                仲間とタスクを管理しましょう。
              </p>
            </div>
            <ChevronRight />
          </button>
          <button
            className="guild-action"
            onClick={() => {
              setError("")
              setDialog("join")
            }}
          >
            <span className="action-icon">
              <UsersRound size={36} />
            </span>
            <div>
              <strong>招待コードで参加</strong>
              <p>
                ギルドから共有された招待コードを入力して
                <br />
                ギルドに参加します。
              </p>
            </div>
            <ChevronRight />
          </button>
        </div>
        <div className="guild-section-heading">
          <h2 className="section-title text-2xl">参加中のギルド</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>並び替え：</span>
            <Select
              value={sort}
              onValueChange={(value) => setSort(value ?? "recent")}
            >
              <SelectTrigger aria-label="ギルドの並び替え">
                <SelectValue>
                  {sort === "recent"
                    ? "最終アクセス順"
                    : sort === "name"
                      ? "名前順"
                      : "メンバー数順"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">最終アクセス順</SelectItem>
                <SelectItem value="name">名前順</SelectItem>
                <SelectItem value="members">メンバー数順</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {!list.length && (
          <div className="empty-state">
            <UsersRound className="mx-auto mb-3" size={36} />
            <p>参加中のギルドはありません。</p>
            <p className="text-sm">
              ギルドを作成するか、招待コードで参加しましょう。
            </p>
          </div>
        )}
        <div className="guild-grid">
          {list.map((guild) => (
            <article className="guild-card" key={guild.id}>
              <div className="guild-card-head">
                <h3>{guild.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        className="task-menu-button"
                        aria-label={`${guild.name}のメニュー`}
                      />
                    }
                  >
                    <MoreVertical size={22} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => open(guild)}>
                      <UsersRound />
                      ギルドに入る
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openSettings(guild)}>
                      <Settings />
                      ギルド設定
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="guild-card-description">
                {guild.description || "ギルドの説明はまだありません。"}
              </p>
              <div className="guild-card-footer">
                <span>
                  <UsersRound size={20} />
                  {guild.member_count}人のメンバー
                </span>
                <span className="last-visit">
                  {visits[guild.id]
                    ? `最終アクセス：${new Date(visits[guild.id]).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                    : "未アクセス"}
                </span>
                <Button onClick={() => open(guild)}>
                  ギルドに入る
                  <ArrowRight size={17} />
                </Button>
              </div>
            </article>
          ))}
        </div>
        <Dialog
          open={dialog !== null}
          onOpenChange={(value) => {
            if (!value && !busy) setDialog(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {dialog === "create"
                  ? "新しいギルドを作成"
                  : "招待コードで参加"}
              </DialogTitle>
            </DialogHeader>
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
                <Label htmlFor="guild-entry">
                  {dialog === "create" ? "ギルド名" : "招待コード"}
                  <span className="required-tag">必須</span>
                </Label>
                <Input
                  id="guild-entry"
                  value={dialog === "create" ? name : invite}
                  onChange={(e) =>
                    dialog === "create"
                      ? setName(e.target.value)
                      : setInvite(e.target.value)
                  }
                  maxLength={dialog === "create" ? 120 : 36}
                  disabled={busy}
                  placeholder={
                    dialog === "create"
                      ? "ギルド名を入力"
                      : "共有されたUUIDを入力"
                  }
                  autoFocus
                />
                {dialog === "create" && (
                  <small className="char-count">{name.length} / 120</small>
                )}
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDialog(null)}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={
                    busy || !(dialog === "create" ? name.trim() : invite.trim())
                  }
                >
                  {busy
                    ? "処理中…"
                    : dialog === "create"
                      ? "作成する"
                      : "参加する"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
