import { reportError } from "@/lib/errors"
import { type Guild } from "@/states/guilds.ts"
import { type User, useUsersState } from "@/states/users.ts"
import { Calendar, Crown, PlusCircle, Settings, User2 } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"
import { Checkbox } from "@/components/ui/checkbox.tsx"
import { Label } from "@/components/ui/label.tsx"
import { type Status, type Task, useTasksState } from "@/states/tasks.ts"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { UserTip } from "@/components/user_tip.tsx"
import { Badge } from "@/components/ui/badge.tsx"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { Field, FieldGroup } from "@/components/ui/field.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Textarea } from "@/components/ui/textarea.tsx"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"

export function Tasks(props: { guild: Guild; openSettings: () => void }) {
  const tasksState = useTasksState()
  const usersState = useUsersState()
  const nowGuild = props.guild
  const tasks = tasksState.tasks.get(nowGuild.id) ?? []
  const members = tasksState.members.get(nowGuild.id) ?? []
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadFailed(false)
    void useTasksState
      .getState()
      .loadTasks(props.guild.id)
      .catch((e) => {
        if (active) {
          reportError(e)
          setLoadFailed(true)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [props.guild.id, reload])
  const [showCompletedAndPausedTasks, setShowCompletedAndPausedTasks] =
    useState<boolean>(false)

  const task_users = members
    .map((user) => [user.id, user] as const)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))

  const [taskDialogState, setTaskDialogState] = useState<User | null>(null) // Userがある: 開、Userがない: 閉
  const [taskName, setTaskName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [dueDate, setDueDate] = useState<string>("")

  const [state, setState] = useState<Status>("todo")
  const states: { label: string; value: Status }[] = [
    { label: "todo: 未着手", value: "todo" },
    { label: "in_progress: 作業中", value: "in_progress" },
    { label: "completed: 完了", value: "completed" },
    { label: "cancelled: 中止", value: "cancelled" },
    { label: "pending: 保留", value: "pending" },
  ]

  return (
    <div className="">
      <Dialog
        open={!!taskDialogState}
        onOpenChange={(open) => {
          if (!open && !busy) setTaskDialogState(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">タスクを追加</DialogTitle>
            <FieldGroup>
              <Field>
                <Label htmlFor="title">
                  タスク名 <span className="text-danger"></span>
                </Label>
                <Input
                  id="title"
                  maxLength={200}
                  name="title"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="dueDate">期限</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="state">ステータス</Label>
                <Select
                  items={states}
                  value={state}
                  onValueChange={(e) => setState(e ?? "todo")}
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {states.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setTaskDialogState(null)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={
                busy || !taskName.trim() || taskName.trim().length > 200
              }
              onClick={async () => {
                if (busy) return
                setBusy(true)
                try {
                  await tasksState.insert_new_task(
                    props.guild.id,
                    taskName,
                    description || null,
                    dueDate ? new Date(dueDate + "T00:00:00") : null,
                    state,
                    true,
                    taskDialogState?.id
                  )
                  setTaskDialogState(null)
                  setTaskName("")
                  setDescription("")
                  setDueDate("")
                  setState("todo")
                } catch (e) {
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

      {loading && <p className="p-6">タスクを読み込んでいます。</p>}
      {loadFailed && (
        <Button className="m-6" onClick={() => setReload((n) => n + 1)}>
          再試行
        </Button>
      )}
      {!loading && !loadFailed && nowGuild && tasks && (
        <div>
          <div className="flex bg-accent p-6">
            <div className="grow">
              <h1 className="text-3xl font-bold">{nowGuild.name}</h1>
              <span>{nowGuild.description}</span>
            </div>
            <div className="flex items-end">
              <Button onClick={props.openSettings}>
                <Settings />
                ギルド設定
              </Button>
            </div>
          </div>
          <div>
            <div className="flex justify-center p-6">
              <h1 className="block grow text-2xl font-bold">タスク一覧</h1>
              <Checkbox
                id="whetherShowCompletedOrPausedTasks"
                checked={showCompletedAndPausedTasks}
                onCheckedChange={(e) => setShowCompletedAndPausedTasks(e)}
              />
              <Label
                htmlFor="whetherShowCompletedOrPausedTasks"
                className="ml-1 block"
              >
                完了 / 中止のタスクを表示
              </Label>
            </div>
          </div>
          {tasks.length === 0 && (
            <p className="px-6 pb-3 text-muted-foreground">
              タスクはありません。担当者の＋から追加できます。
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
            {task_users.map((user) => {
              const owned = tasks.filter((task) => task.owner.id === user[0])
              const joined = tasks.filter(
                (task) =>
                  task.owner.id !== user[0] &&
                  task.participants.map((p) => p.id).includes(user[0])
              )

              return (
                <PersonTask
                  key={user[0]}
                  showCompletedAndPausedTasks={showCompletedAndPausedTasks}
                  user={user[1]}
                  is_me={usersState.me?.id === user[0]}
                  owned_tasks={owned}
                  participating_tasks={joined}
                  open_dialog={(user) => setTaskDialogState(user)}
                />
              )
            })}
          </div>
        </div>
      )}
      {(!nowGuild || !tasks) && <h1>読み込み中です。</h1>}
    </div>
  )
}

export function PersonTask(props: {
  showCompletedAndPausedTasks: boolean
  user: User
  is_me: boolean
  owned_tasks: Task[]
  participating_tasks: Task[]
  class_name?: string
  open_dialog: (user: User) => void
}) {
  const usr = { ...props.user } satisfies User
  if (props.is_me) {
    usr.name += " (You)"
  }

  return (
    <div className={props.class_name}>
      <div className="flex items-center justify-center">
        <UserTip user={usr} className="grow" />
        <PlusCircle
          className="block cursor-pointer"
          onClick={() => props.open_dialog(props.user)}
        />
      </div>
      <div className="flex flex-col gap-3">
        {props.owned_tasks
          .filter(
            (task) =>
              props.showCompletedAndPausedTasks ||
              !(
                ["cancelled", "completed"] satisfies Status[] as Status[]
              ).includes(task.status)
          )
          .map((task) => (
            <OwnerTaskCard key={task.id} task={task} />
          ))}
        {props.participating_tasks
          .filter(
            (task) =>
              props.showCompletedAndPausedTasks ||
              !(
                ["cancelled", "completed"] satisfies Status[] as Status[]
              ).includes(task.status)
          )
          .map((task) => (
            <JoinedTaskCard key={task.id} task={task} />
          ))}
      </div>
    </div>
  )
}

export function OwnerTaskCard(props: { task: Task }) {
  return (
    <div>
      <Card className="m-0 gap-1 p-1">
        <CardHeader className="mx-0 px-2">
          <CardTitle>
            <Crown className="inline scale-70" /> {props.task.title}{" "}
            <Badge variant="outline">{props.task.status}</Badge>
          </CardTitle>
          <CardDescription>{props.task.description}</CardDescription>
        </CardHeader>
        <CardFooter className="mx-0 px-2">
          {props.task.due_date && (
            <p>
              <Calendar className="inline scale-70" />
              {props.task.due_date.getFullYear()}/
              {props.task.due_date.getMonth() + 1}/
              {props.task.due_date.getDate()}
            </p>
          )}
        </CardFooter>
        <TaskActions task={props.task} />
      </Card>
    </div>
  )
}

export function JoinedTaskCard(props: { task: Task }) {
  return (
    <div>
      <Card className="m-0 gap-1 p-1">
        <CardHeader className="mx-0 px-2">
          <CardTitle className="text-xs">
            <User2 className="inline scale-70" /> {props.task.title}{" "}
            <Badge variant="outline">{props.task.status}</Badge>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

function TaskActions({ task }: { task: Task }) {
  const me = useUsersState((s) => s.me)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [date, setDate] = useState("")
  const [status, setStatus] = useState<Status>(task.status)
  const [published, setPublished] = useState(task.is_published)
  const [ownerId, setOwnerId] = useState(task.owner.id)
  const members = useTasksState((s) => s.members.get(task.guild.id) ?? [])
  if (me?.id !== task.created_by && me?.id !== task.guild.owner.id) return null
  const edit = () => {
    setOwnerId(task.owner.id)
    setTitle(task.title)
    setDescription(task.description ?? "")
    setStatus(task.status)
    setPublished(task.is_published)
    setDate(
      task.due_date
        ? `${task.due_date.getFullYear()}-${String(task.due_date.getMonth() + 1).padStart(2, "0")}-${String(task.due_date.getDate()).padStart(2, "0")}`
        : ""
    )
    setOpen(true)
  }
  const save = async () => {
    if (busy) return
    setBusy(true)
    try {
      await useTasksState.getState().update_task(task.id, {
        owner_id: ownerId,
        title: title.trim(),
        description: description || null,
        due_date: date || null,
        status,
        is_published: published,
      })
      setOpen(false)
    } catch (e) {
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (busy || !window.confirm(`「${task.title}」を削除しますか？`)) return
    setBusy(true)
    try {
      await useTasksState.getState().delete_task(task.id)
    } catch (e) {
      reportError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex gap-2 px-2 pb-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={edit}>
        編集
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => void remove()}
      >
        削除
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タスクを編集</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>担当者</Label>
              <Select
                value={ownerId}
                onValueChange={(value) => {
                  if (value) setOwnerId(value)
                }}
                disabled={busy}
              >
                <SelectTrigger>
                  <SelectValue>
                    {members.find((m) => m.id === ownerId)?.name ??
                      task.owner.name}
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
            </Field>
            <Field>
              <Label htmlFor={`title-${task.id}`}>タスク名</Label>
              <Input
                id={`title-${task.id}`}
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field>
              <Label htmlFor={`description-${task.id}`}>説明</Label>
              <Textarea
                id={`description-${task.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field>
              <Label htmlFor={`date-${task.id}`}>期限</Label>
              <Input
                id={`date-${task.id}`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field>
              <Label>ステータス</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value ?? "todo")}
                disabled={busy}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "todo",
                      "in_progress",
                      "pending",
                      "completed",
                      "cancelled",
                    ] as Status[]
                  ).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <Label>
                <Checkbox
                  checked={published}
                  onCheckedChange={setPublished}
                  disabled={busy}
                />
                公開する
              </Label>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              disabled={busy || !title.trim() || title.trim().length > 200}
              onClick={() => void save()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
