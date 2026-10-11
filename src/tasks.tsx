import { type Guild, useGuildsState } from "@/states/guilds.ts"
import { useUsersState } from "@/states/users.ts"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button.tsx"
import { Checkbox } from "@/components/ui/checkbox.tsx"
import { Label } from "@/components/ui/label.tsx"
import { useTasksState } from "@/states/tasks.ts"
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

export function Tasks(props: {guildId: string}) {
  const guildsState = useGuildsState();
  const tasksState = useTasksState();
  //const nowGuild = guildsState.guilds.find((guild) => guild.id === props.guildId);
  const nowGuild = { // FIXME this is a mock
    id: "UNKNOWN",
    name: "tech team",
    owner: useUsersState.getState().me,
    description: "A tech team for some developments.",
    member_count: 3,
  } satisfies Guild;

  //const tasks = tasksState.tasks.get(nowGuild.id);
  const task_users = tasks.flatMap(task => [task.owner, ...task.participants])

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
              <Checkbox id="whetherShowCompletedOrPausedTasks" />
              <Label
                htmlFor="whetherShowCompletedOrPausedTasks"
                className="ml-1 block"
              >
                完了 / 中止のタスクを表示
              </Label>
            </div>
          </div>
          <div>
            {
            }
          </div>
        </div>
      )}
      {(!nowGuild || !tasks) && (
        <h1>読み込み中です。</h1>
      )}
    </div>
  )
}

export function OwnerTaskCard(props: {title: string, description: string, due_date?: Date}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
        <CardAction>Card Action</CardAction>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  )
}