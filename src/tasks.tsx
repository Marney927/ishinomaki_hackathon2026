import { type Guild, useGuildsState } from "@/states/guilds.ts"
import { type User, useUsersState } from "@/states/users.ts"
import { Calendar, Crown, PlusCircle, Settings, User2 } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"
import { Checkbox } from "@/components/ui/checkbox.tsx"
import { Label } from "@/components/ui/label.tsx"
import { type Status, type Task, useTasksState } from "@/states/tasks.ts"
import { tasks } from "@/mocks/tasks_mock.ts"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx"
import { UserAvatar, UserTip } from "@/components/user_tip.tsx"
import { Badge } from "@/components/ui/badge.tsx"
import { useState } from "react"
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

export function Tasks(props: {guildId: Guild["id"]}) {
  const guildsState = useGuildsState();
  const tasksState = useTasksState();
  const usersState = useUsersState();
  //const nowGuild = guildsState.guilds.find((guild) => guild.id === props.guildId);
  const nowGuild = { // FIXME this is a mock
    id: "UNKNOWN",
    name: "tech team",
    owner: useUsersState.getState().me,
    description: "A tech team for some developments.",
    member_count: 3,
  } satisfies Guild;
  const [showCompletedAndPausedTasks, setShowCompletedAndPausedTasks] = useState<boolean>(false);

  //const tasks = tasksState.tasks.get(nowGuild.id); // variable tasks is filtered with given guild id
  const task_users = Array.from(new Map(tasks.flatMap(task => [task.owner, ...task.participants]).map(user => [user.id, user]))).toSorted((a,b) => a[1].name > b[1].name ? 1 : -1)

  const [taskDialogState, setTaskDialogState] = useState<User | null>(null); // Userがある: 開、Userがない: 閉
  const [taskName, setTaskName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date>(new Date());
  console.log("due date default: ", dueDate);
  const [state, setState] = useState<Status>('todo');
  const states: {label: string, value: Status}[] = [
    {label: 'todo: 未着手', value: 'todo'},
    {label: 'in_progress: 作業中', value: 'in_progress'},
    {label: 'completed: 完了', value: 'completed'},
    {label: 'cancelled: 中止', value: 'cancelled'},
    {label: 'pending: 保留', value: 'pending'},
  ];

  return (
    <div className="">
      <Dialog open={!!taskDialogState}>
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
                  value={dueDate.toISOString().split("T")[0]}
                  onBlur={(e) => e.target.valueAsDate && setDueDate(e.target.valueAsDate)}
                />
              </Field>
              <Field>
                <Label htmlFor="state">ステータス</Label>
                <Select items={states} value={state} onValueChange={(e) => setState(e ?? 'todo')}>
                  <SelectTrigger className="w-[180px]">
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
              onClick={() => setTaskDialogState(null)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={taskName.length === 0}
              onClick={async () => {
                await tasksState.insert_new_task(props.guildId, taskName, description, dueDate, state, true)
                setTaskDialogState(null)
              }}
            >
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {nowGuild && tasks && (
        <div>
          <div className="flex bg-accent p-6">
            <div className="grow">
              <h1 className="text-3xl font-bold">{nowGuild.name}</h1>
              <span>{nowGuild.description}</span>
            </div>
            <div className="flex items-end">
              <Button>
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
          <div className="grid grid-cols-3 gap-4">
            {task_users.map((user) => {
              const owned = tasks.filter((task) => task.owner.id === user[0])
              const joined = tasks.filter((task) =>
                task.participants.map((p) => p.id).includes(user[0])
              )

              return (
                <PersonTask
                  key={user[0]}
                  showCompletedAndPausedTasks={showCompletedAndPausedTasks}
                  user={user[1]}
                  is_me={usersState.me.id === user[0]}
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
  showCompletedAndPausedTasks: boolean,
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
        <PlusCircle className="block cursor-pointer" onClick={() => props.open_dialog(props.user)} />
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

export function OwnerTaskCard(props: {task: Task}) {
  return (
    <div>
      <Card className="p-1 m-0 gap-1">
        <CardHeader className="px-2 mx-0">
          <CardTitle>
            <Crown className="inline scale-70" /> {props.task.title}{" "}
            <Badge variant="outline">{props.task.status}</Badge>
          </CardTitle>
          <CardDescription>{props.task.description}</CardDescription>
        </CardHeader>
        <CardFooter className="px-2 mx-0">
          {props.task.due_date && (
            <p>
              <Calendar className="inline scale-70" />
              {props.task.due_date.getFullYear()}/
              {props.task.due_date.getMonth() + 1}/
              {props.task.due_date.getDate()}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export function JoinedTaskCard(props: {task: Task}) {
  return (
    <div>
      <Card className="m-0 gap-1 p-1">
        <CardHeader className="px-2 mx-0">
          <CardTitle className="text-xs">
            <User2 className="inline scale-70" /> {props.task.title}{" "}
            <Badge variant="outline">{props.task.status}</Badge>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
