import { useEffect, useState } from "react"
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  Calendar,
  Crown,
  Plus,
  Settings,
  UsersRound,
  UserRound,
  MoreVertical,
  GripVertical,
  Trash2,
  Pencil,
  UserPlus,
  LogOut,
} from "lucide-react"
import { type Guild } from "@/states/guilds"
import { type User, useUsersState } from "@/states/users"
import { type Status, type Task, useTasksState } from "@/states/tasks"
import { reportError, getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar, UserTip } from "@/components/user_tip"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
const statusLabels: Record<Status, string> = {
  todo: "未着手",
  in_progress: "作業中",
  pending: "保留",
  completed: "完了",
  cancelled: "中止",
}
const statuses = Object.keys(statusLabels) as Status[]
const dateString = (date: Date | null) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : ""
const editable = (task: Task, userId?: string) =>
  Boolean(
    userId && (task.created_by === userId || task.guild.owner.id === userId)
  )
function StatusBadge({ status }: { status: Status }) {
  return status === "todo" ? null : (
    <span className={`status-badge ${status}`}>{statusLabels[status]}</span>
  )
}
export function Tasks({
  guild,
  openSettings,
}: {
  guild: Guild
  openSettings: () => void
}) {
  const state = useTasksState()
  const me = useUsersState((s) => s.me)
  const tasks = state.tasks.get(guild.id) ?? []
  const members = state.members.get(guild.id) ?? []
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const [showCompleted, setShowCompleted] = useState(true)
  const [editor, setEditor] = useState<{ task?: Task; owner: User } | null>(
    null
  )
  const [moving, setMoving] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor)
  )
  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    void useTasksState
      .getState()
      .loadTasks(guild.id)
      .catch((e) => {
        if (active) {
          setError(getErrorMessage(e))
          reportError(e)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [guild.id, retry])
  const move = async ({ active, over }: DragEndEvent) => {
    if (!over || moving) return
    const task = tasks.find((t) => t.id === active.id)
    const member = members.find((m) => m.id === over.id)
    if (
      !task ||
      !member ||
      task.owner.id === member.id ||
      !editable(task, me?.id)
    )
      return
    setMoving(true)
    try {
      await state.update_task(task.id, { owner_id: member.id })
      toast.add({ title: `担当者を${member.name}に変更しました` })
    } catch (e) {
      reportError(e)
    } finally {
      setMoving(false)
    }
  }
  const remove = async (task: Task) => {
    if (
      !editable(task, me?.id) ||
      !window.confirm(`「${task.title}」を削除しますか？`)
    )
      return
    try {
      await state.delete_task(task.id)
      toast.add({ title: "タスクを削除しました" })
    } catch (e) {
      reportError(e)
    }
  }
  return (
    <>
      <section className="landscape-hero guild-hero">
        <span className="hero-icon">
          <UsersRound size={30} />
        </span>
        <div>
          <h1>{guild.name}</h1>
          <p>{guild.description}</p>
        </div>
        <Button
          variant="outline"
          className="hero-settings"
          onClick={openSettings}
        >
          <Settings />
          ギルド設定
        </Button>
      </section>
      <div className="page-content">
        <div className="board-heading">
          <div>
            <h2>メンバーのタスク一覧</h2>
            <p>
              各メンバーのタスクが表示されています。タスクのハンドルをドラッグして、担当メンバーを変更できます。
            </p>
          </div>
          <Label>
            <Checkbox
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
            完了 / 中止のタスクを表示
          </Label>
        </div>
        {loading ? (
          <p className="empty-state">タスクを読み込んでいます。</p>
        ) : error ? (
          <div className="empty-state">
            <p role="alert">{error}</p>
            <Button onClick={() => setRetry((n) => n + 1)}>再試行</Button>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => void move(event)}
            >
              <div className="task-board">
                {[...members]
                  .sort((a, b) =>
                    a.id === me?.id
                      ? -1
                      : b.id === me?.id
                        ? 1
                        : a.name.localeCompare(b.name, "ja")
                  )
                  .map((member) => (
                    <MemberColumn
                      key={member.id}
                      user={member}
                      me={member.id === me?.id}
                      moving={moving}
                      tasks={tasks.filter(
                        (t) =>
                          t.owner.id === member.id &&
                          (showCompleted ||
                            !["completed", "cancelled"].includes(t.status))
                      )}
                      joined={tasks.filter(
                        (t) =>
                          t.owner.id !== member.id &&
                          t.participants.some((p) => p.id === member.id) &&
                          (showCompleted ||
                            !["completed", "cancelled"].includes(t.status))
                      )}
                      onCreate={() => setEditor({ owner: member })}
                      onOpen={(task) => setEditor({ task, owner: task.owner })}
                      onDelete={(task) => void remove(task)}
                      currentUser={me?.id}
                    />
                  ))}
              </div>
            </DndContext>
            {!tasks.length && (
              <p className="mt-4 text-sm text-muted-foreground">
                タスクはまだありません。担当者の＋から最初のタスクを作成しましょう。
              </p>
            )}
          </>
        )}
        {editor && (
          <TaskEditor
            key={editor.task?.id ?? `new-${editor.owner.id}`}
            guild={guild}
            members={members}
            owner={editor.owner}
            task={editor.task}
            onClose={() => setEditor(null)}
          />
        )}
      </div>
    </>
  )
}
function MemberColumn({
  user,
  me,
  moving,
  tasks,
  joined,
  onCreate,
  onOpen,
  onDelete,
  currentUser,
}: {
  user: User
  me: boolean
  moving: boolean
  tasks: Task[]
  joined: Task[]
  onCreate: () => void
  onOpen: (task: Task) => void
  onDelete: (task: Task) => void
  currentUser?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: user.id, disabled: moving })
  return (
    <section
      ref={setNodeRef}
      className={`member-column ${isOver ? "is-over" : ""}`}
      aria-label={`${user.name}のタスク`}
    >
      <div className="member-column-head">
        <UserAvatar user={user} />
        <div>
          <strong>
            {user.name}
            {me && "（自分）"}
          </strong>
          <small>{tasks.length + joined.length}件のタスク</small>
        </div>
        <button
          className="add-task-button"
          aria-label={`${user.name}のタスクを追加`}
          onClick={onCreate}
        >
          <Plus size={22} />
        </button>
      </div>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          draggable={!moving && editable(task, currentUser)}
          onOpen={() => onOpen(task)}
          onDelete={() => onDelete(task)}
        />
      ))}
      {joined.map((task) => (
        <button
          key={task.id}
          className={`task-card joined-task ${task.status} w-full`}
          onClick={() => onOpen(task)}
        >
          <UserRound size={19} />
          <span className="flex-1 text-left">{task.title}</span>
          <StatusBadge status={task.status} />
        </button>
      ))}
    </section>
  )
}
function TaskCard({
  task,
  draggable,
  onOpen,
  onDelete,
}: {
  task: Task
  draggable: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable,
  })
  return (
    <article
      ref={setNodeRef}
      className={`task-card ${task.status} ${isDragging ? "is-dragging" : ""}`}
    >
      <div className="task-card-head">
        <Crown size={18} />
        <button className="task-card-title" onClick={onOpen}>
          {task.title}
        </button>
        {draggable && (
          <button
            className="task-drag-handle"
            aria-label={`${task.title}の担当者を移動`}
            {...listeners}
            {...attributes}
          >
            <GripVertical size={15} />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="task-menu-button"
                aria-label={`${task.title}のメニュー`}
              />
            }
          >
            <MoreVertical size={17} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              <Pencil />
              {draggable ? "編集 / 詳細" : "詳細を見る"}
            </DropdownMenuItem>
            {draggable && (
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 />
                削除
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {task.status !== "todo" && (
        <div className="mt-1 text-right">
          <StatusBadge status={task.status} />
        </div>
      )}
      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}
      {task.due_date && (
        <div className="task-card-date">
          <Calendar size={16} />
          {dateString(task.due_date).replaceAll("-", "/")}
        </div>
      )}
    </article>
  )
}
function TaskEditor({
  guild,
  members,
  owner,
  task,
  onClose,
}: {
  guild: Guild
  members: User[]
  owner: User
  task?: Task
  onClose: () => void
}) {
  const me = useUsersState((s) => s.me)
  const canEdit = !task || editable(task, me?.id)
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [date, setDate] = useState(dateString(task?.due_date ?? null))
  const [status, setStatus] = useState<Status>(task?.status ?? "todo")
  const [ownerId, setOwnerId] = useState(owner.id)
  const [published, setPublished] = useState(task?.is_published ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const latest = useTasksState((s) =>
    s.tasks.get(guild.id)?.find((t) => t.id === task?.id)
  )
  const joined = latest?.participants.some((p) => p.id === me?.id) ?? false
  const save = async () => {
    if (busy || !canEdit) return
    setBusy(true)
    setError("")
    try {
      const store = useTasksState.getState()
      if (task)
        await store.update_task(task.id, {
          title: title.trim(),
          description: description || null,
          due_date: date || null,
          status,
          owner_id: ownerId,
          is_published: published,
        })
      else
        await store.insert_new_task(
          guild.id,
          title,
          description || null,
          date ? new Date(date + "T00:00:00") : null,
          status,
          published,
          ownerId
        )
      toast.add({
        title: task ? "タスクを更新しました" : "タスクを作成しました",
      })
      onClose()
    } catch (e) {
      setError(getErrorMessage(e))
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  const participate = async () => {
    if (!task || busy) return
    setBusy(true)
    setError("")
    try {
      await useTasksState.getState().setParticipation(task, !joined)
      toast.add({
        title: joined
          ? "タスクへの参加を取り消しました"
          : "タスクに参加しました",
      })
    } catch (e) {
      setError(getErrorMessage(e))
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent className="task-dialog">
        <DialogHeader>
          <DialogTitle>
            <Crown className="text-amber-500" />
            {task ? "タスク詳細" : "タスクを作成"}
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
            void save()
          }}
        >
          <div className="space-y-5">
            <div>
              <Label htmlFor="task-title">
                タイトル<span className="required-tag">必須</span>
              </Label>
              <Input
                id="task-title"
                className="mt-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={!canEdit || busy}
                required
              />
              <span className="char-count">{title.length} / 200</span>
            </div>
            <div>
              <Label htmlFor="task-description">説明</Label>
              <Textarea
                id="task-description"
                className="mt-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit || busy}
              />
              <span className="char-count">{description.length}文字</span>
            </div>
            <div className="two-fields">
              <div>
                <Label htmlFor="task-date">期限</Label>
                <Input
                  id="task-date"
                  className="mt-2"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!canEdit || busy}
                />
              </div>
              <div>
                <Label>
                  ステータス<span className="required-tag">必須</span>
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value ?? "todo")}
                  disabled={!canEdit || busy}
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue>
                      <span className={`status-dot ${status}`} />
                      {status}：{statusLabels[status]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((value) => (
                      <SelectItem key={value} value={value}>
                        <span className={`status-dot ${value}`} />
                        {value}：{statusLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>担当者</Label>
              <Select
                value={ownerId}
                onValueChange={(value) => {
                  if (value) setOwnerId(value)
                }}
                disabled={!canEdit || busy}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue>
                    {members.find((m) => m.id === ownerId)?.name ?? owner.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Label>
              <Checkbox
                checked={published}
                onCheckedChange={setPublished}
                disabled={!canEdit || busy}
              />
              募集するタスクとして公開する
            </Label>
            {task && (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-semibold">
                  参加メンバー（
                  {latest?.participants.length ?? task.participants.length}人）
                </p>
                <div className="flex flex-wrap gap-3">
                  {(latest?.participants ?? task.participants).map((user) => (
                    <UserTip key={user.id} user={user} className="text-xs" />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  disabled={busy}
                  onClick={() => void participate()}
                >
                  {joined ? <LogOut /> : <UserPlus />}
                  {joined ? "参加を取り消す" : "このタスクに参加する"}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={onClose}
            >
              {canEdit ? "キャンセル" : "閉じる"}
            </Button>
            {canEdit && (
              <Button
                type="submit"
                disabled={busy || !title.trim() || !ownerId}
              >
                {busy ? "保存中…" : task ? "更新する" : "作成する"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
