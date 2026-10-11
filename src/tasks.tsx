import { type Guild, useGuildsState } from "@/states/guilds.ts"
import { type User, useUsersState } from "@/states/users.ts"
import { Calendar, Crown, Settings, User2 } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"
import { Checkbox } from "@/components/ui/checkbox.tsx"
import { Label } from "@/components/ui/label.tsx"
import { type Task, useTasksState } from "@/states/tasks.ts"
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

export function Tasks(props: {guildId: string}) {
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

  return (
    <div className="">
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
              <Checkbox id="whetherShowCompletedOrPausedTasks" checked={showCompletedAndPausedTasks} onCheckedChange={(e) => setShowCompletedAndPausedTasks(e)} />
              <Label
                htmlFor="whetherShowCompletedOrPausedTasks"
                className="ml-1 block"
              >
                完了 / 中止のタスクを表示
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            { task_users.map(user => {
              const owned = tasks.filter(task => task.owner.id === user[0]);
              const joined = tasks.filter(task => task.participants.map(p => p.id).includes(user[0]));

              return (
                <PersonTask showCompletedAndPausedTasks={showCompletedAndPausedTasks} user={user[1]} is_me={usersState.me.id === user[0]} owned_tasks={owned} participating_tasks={joined} />
              )
            })}
          </div>
        </div>
      )}
      {(!nowGuild || !tasks) && (
        <h1>読み込み中です。</h1>
      )}
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
}) {
  const usr = { ...props.user } satisfies User
  if (props.is_me) {
    usr.name += " (You)"
  }

  return (
    <div className={props.class_name}>
      <UserTip user={usr} />
      <div className="flex flex-col gap-3">
        {props.owned_tasks.filter(task => props.showCompletedAndPausedTasks || (!["完了", "保留"].includes(task.status))).map((task) => (
          <OwnerTaskCard task={task} />
        ))}
        {props.participating_tasks.map((task) => (
          <JoinedTaskCard task={task} />
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
