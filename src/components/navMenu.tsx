import { useIsMobile } from "@/hooks/use-mobile"
import { useState } from "react"
import {
  Home,
  UsersRound,
  UserRound,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
} from "lucide-react"
import type { View } from "@/App"
import { useAuthState } from "@/states/auth"
import { useUsersState } from "@/states/users"
import { reportError } from "@/lib/errors"
import { UserAvatar } from "@/components/user_tip"
import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
export function NavMenu({
  state,
  setView,
  activeGuild,
}: {
  state: View
  activeGuild?: import("@/states/guilds").Guild
  setView: (view: View) => void
}) {
  const isMobile = useIsMobile()
  const me = useUsersState((s) => s.me)
  const [mobileOpen, setMobileOpen] = useState(false)
  const guild = "guild" in state ? state.guild : activeGuild
  const go = (view: View) => {
    setView(view)
    setMobileOpen(false)
  }
  const logout = () => void useAuthState.getState().logout().catch(reportError)
  return (
    <>
      <header className="app-header">
        <Button
          variant="ghost"
          size="icon"
          className="mobile-menu"
          aria-label="メニュー"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu />
        </Button>
        <button className="brand-button" onClick={() => go({ type: "home" })}>
          <Brand />
        </button>
        {me && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="header-user" />}>
              <UserAvatar user={me} />
              <span>{me.name}</span>
              <ChevronDown size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => go({ type: "profile" })}>
                <UserRound />
                プロフィール設定
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="メニューを閉じる"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        inert={isMobile && !mobileOpen}
        className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}
      >
        <nav aria-label="メインメニュー">
          <button
            className={`side-link ${state.type === "home" ? "active" : ""}`}
            onClick={() => go({ type: "home" })}
          >
            <Home />
            ホーム
          </button>
          {guild && (
            <button
              className={`side-link ${state.type.startsWith("guild") ? "active" : ""}`}
              onClick={() => go({ type: "guildView", guild })}
            >
              <UsersRound />
              ギルドトップ
            </button>
          )}
          <button
            className={`side-link ${state.type === "profile" ? "active" : ""}`}
            onClick={() => go({ type: "profile" })}
          >
            <UserRound />
            プロフィール
          </button>
        </nav>
        <button className="side-link logout-link" onClick={logout}>
          <LogOut />
          ログアウト
        </button>
      </aside>
    </>
  )
}
export function PageBreadcrumb({
  state,
  setView,
}: {
  state: View
  setView: (view: View) => void
}) {
  if (state.type === "home") return null
  return (
    <nav className="page-breadcrumb" aria-label="パンくず">
      <button onClick={() => setView({ type: "home" })}>ホーム</button>
      <ChevronRight size={16} />
      {"guild" in state ? (
        <>
          <button
            onClick={() => setView({ type: "guildView", guild: state.guild })}
          >
            ギルドトップ
          </button>
          {state.type === "guildConfig" && (
            <>
              <ChevronRight size={16} />
              <span>ギルド設定</span>
            </>
          )}
        </>
      ) : (
        <span>プロフィール設定</span>
      )}
    </nav>
  )
}
