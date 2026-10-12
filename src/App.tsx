import "./index.css"
import { useEffect, useState } from "react"
import { GuildsTable } from "@/guilds"
import { Login } from "@/login"
import { Profile } from "@/profile"
import { Tasks } from "@/tasks"
import { GuildsSettings } from "@/guildsSettings"
import { useGuildsState, type Guild } from "@/states/guilds"
import { useAuthState } from "@/states/auth"
import { useUsersState } from "@/states/users"
import { useTasksState } from "@/states/tasks"
import { NavMenu, PageBreadcrumb } from "@/components/navMenu"
import { reportError } from "@/lib/errors"
import { Button } from "@/components/ui/button"
export type View =
  | { type: "home" }
  | { type: "auth" }
  | { type: "guildView"; guild: Guild }
  | { type: "profile" }
  | { type: "guildConfig"; guild: Guild }
export function App() {
  const session = useAuthState((s) => s.session)
  const recovering = useAuthState((s) => s.recovering)
  const [nowView, setView] = useState<View>({ type: "home" })
  const [lastGuildId, setLastGuildId] = useState<number | null>(null)
  const navigate = (view: View) => {
    if ("guild" in view) setLastGuildId(view.guild.id)
    setView(view)
  }
  const [initialized, setInitialized] = useState(false)
  const [readyUser, setReadyUser] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const guilds = useGuildsState((s) => s.guilds)
  useEffect(() => {
    let stop = () => {}
    let active = true
    try {
      stop = useAuthState.getState().startAuthListener()
      void useAuthState
        .getState()
        .initialize()
        .catch(reportError)
        .finally(() => {
          if (active) setInitialized(true)
        })
    } catch (e) {
      reportError(e)
      setInitialized(true)
    }
    return () => {
      active = false
      stop()
    }
  }, [])
  const userId = session?.user.id
  const email = session?.user.email
  useEffect(() => {
    let active = true
    setLastGuildId(null)
    setReadyUser(null)
    setFailed(false)
    setView({ type: "home" })
    useUsersState.setState({ me: null })
    useGuildsState.setState({ guilds: [] })
    useTasksState.setState({ tasks: new Map(), members: new Map() })
    if (userId) {
      void (async () => {
        await useUsersState
          .getState()
          .loadMe(userId, email?.split("@")[0] ?? "Member")
        if (!active) return
        await useGuildsState.getState().loadGuilds()
        if (active) setReadyUser(userId)
      })().catch((e) => {
        if (active) {
          reportError(e)
          setFailed(true)
        }
      })
    }
    return () => {
      active = false
    }
  }, [userId, email, retry])
  if (!initialized) return <p className="p-6">認証を確認しています。</p>
  if (!session) return <Login />
  if (recovering)
    return (
      <div className="login-page">
        <Profile recovery />
      </div>
    )
  if (readyUser !== userId)
    return (
      <div className="p-6">
        {failed ? (
          <>
            <p>
              データを取得できませんでした。DBの適用状態・接続設定を確認してください。
            </p>
            <Button onClick={() => setRetry((r) => r + 1)}>再試行</Button>
            <Button
              onClick={() =>
                void useAuthState.getState().logout().catch(reportError)
              }
            >
              ログアウト
            </Button>
          </>
        ) : (
          "読み込み中です。"
        )}
      </div>
    )
  const guild =
    "guild" in nowView
      ? guilds.find((g) => g.id === nowView.guild.id)
      : undefined
  return (
    <div className="app-shell">
      <NavMenu
        state={guild && "guild" in nowView ? { ...nowView, guild } : nowView}
        setView={navigate}
        activeGuild={
          nowView.type === "profile"
            ? guilds.find((g) => g.id === lastGuildId)
            : undefined
        }
      />
      <main className="app-workspace">
        <PageBreadcrumb state={nowView} setView={navigate} />
        {nowView.type === "home" && (
          <GuildsTable
            openGuild={(guild) => navigate({ type: "guildView", guild })}
            openSettings={(guild) => navigate({ type: "guildConfig", guild })}
          />
        )}
        {nowView.type === "auth" && <Login />}
        {nowView.type === "profile" && <Profile />}
        {nowView.type === "guildView" && guild && (
          <Tasks
            key={guild.id}
            guild={guild}
            openSettings={() => navigate({ type: "guildConfig", guild })}
          />
        )}
        {nowView.type === "guildConfig" && guild && (
          <GuildsSettings
            key={guild.id}
            guild={guild}
            onDeleted={() => setView({ type: "home" })}
          />
        )}
      </main>
    </div>
  )
}
export default App
