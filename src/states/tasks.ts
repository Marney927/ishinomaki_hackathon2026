import {
  requireUuid,
  requireGuildId,
  requireDate,
  requireStatus,
} from "@/lib/validation"
import { useAuthState } from "@/states/auth"
import { create } from "zustand/react"
import { createClient } from "@/lib/supabase/client"
import { useGuildsState, type Guild } from "@/states/guilds"
import { useUsersState, type User } from "@/states/users"
export type Status =
  "todo" | "in_progress" | "completed" | "cancelled" | "pending"
export type Task = {
  id: string
  guild: Guild
  title: string
  description: string | null
  due_date: Date | null
  owner: User
  status: Status
  is_published: boolean
  participants: User[]
  created_by?: string
}
export type TaskChanges = Partial<
  Pick<Task, "title" | "description" | "status" | "is_published">
> & { due_date?: string | null; owner_id?: string }
export interface TasksState {
  tasks: Map<number, Task[]>
  members: Map<number, User[]>
  loadTasks: (guild_id: number) => Promise<void>
  insert_new_task: (
    guild_id: number,
    title: string,
    description: string | null,
    due_date: Date | null,
    status: Status,
    is_published: boolean,
    owner_id?: string
  ) => Promise<void>
  update_task: (task_id: string, changes: TaskChanges) => Promise<void>
  delete_task: (task_id: string) => Promise<void>
  setParticipation: (task: Task, joined: boolean) => Promise<void>
}
export const useTasksState = create<TasksState>((set, get) => ({
  setParticipation: async (task, joined) => {
    const userId = useAuthState.getState().session?.user.id
    if (!userId) throw new Error("ログインしてください")
    const db = createClient()
    const result = joined
      ? await db
          .from("task_participants")
          .insert({ task_id: task.id, user_id: userId })
      : await db
          .from("task_participants")
          .delete()
          .eq("task_id", task.id)
          .eq("user_id", userId)
    if (result.error && !(joined && result.error.code === "23505"))
      throw result.error
    await get().loadTasks(task.guild.id)
  },
  tasks: new Map(),
  members: new Map(),
  loadTasks: async (guild_id) => {
    const userId = useAuthState.getState().session?.user.id
    const guild = useGuildsState
      .getState()
      .guilds.find((g) => g.id === guild_id)
    if (!guild) throw new Error("ギルドが見つかりません")
    const db = createClient()
    const [rows, memberships] = await Promise.all([
      db
        .from("tasks")
        .select(
          "id, guild_id, title, description, due_date, owner_id, status, is_published, created_by"
        )
        .eq("guild_id", guild_id)
        .order("created_at"),
      db.from("guild_members").select("user_id").eq("guild_id", guild_id),
    ])
    if (rows.error) throw rows.error
    if (memberships.error) throw memberships.error
    const users = await db
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in(
        "id",
        memberships.data.map((m) => m.user_id)
      )
    if (users.error) throw users.error
    const members: User[] = users.data.map((p) => ({
      id: p.id,
      name: p.display_name,
      avatar_url: p.avatar_url,
    }))
    const participants = rows.data.length
      ? await db
          .from("task_participants")
          .select("task_id, user_id")
          .in(
            "task_id",
            rows.data.map((t) => t.id)
          )
      : { data: [], error: null }
    if (participants.error) throw participants.error
    const tasks: Task[] = rows.data.map((t) => {
      const owner = members.find((m) => m.id === t.owner_id)
      if (!owner) throw new Error("タスク担当者を取得できませんでした")
      return {
        ...t,
        guild,
        owner,
        status: t.status as Status,
        due_date: t.due_date ? new Date(t.due_date + "T00:00:00") : null,
        participants: members.filter((m) =>
          participants.data.some(
            (p) => p.task_id === t.id && p.user_id === m.id
          )
        ),
      }
    })
    if (useAuthState.getState().session?.user.id !== userId) return
    set((s) => ({
      tasks: new Map(s.tasks).set(guild_id, tasks),
      members: new Map(s.members).set(guild_id, members),
    }))
  },
  insert_new_task: async (
    guild_id,
    title,
    description,
    due_date,
    status,
    is_published,
    owner_id
  ) => {
    if (!title.trim() || title.trim().length > 200)
      throw new Error("タスク名は1〜200文字で入力してください")
    requireGuildId(guild_id)
    requireStatus(status)
    if (!useAuthState.getState().session)
      throw new Error("ログインしてください")
    if (due_date && Number.isNaN(due_date.getTime()))
      throw new Error("期限の日付が正しくありません")
    const owner = owner_id ?? useUsersState.getState().me?.id
    if (!owner) throw new Error("ログインしてください")
    requireUuid(owner, "担当者ID")
    const membership = await createClient()
      .from("guild_members")
      .select("user_id")
      .eq("guild_id", guild_id)
      .eq("user_id", owner)
      .maybeSingle()
    if (membership.error) throw membership.error
    if (!membership.data)
      throw new Error("担当者はギルドのメンバーから選択してください")
    const date = due_date
      ? `${due_date.getFullYear()}-${String(due_date.getMonth() + 1).padStart(2, "0")}-${String(due_date.getDate()).padStart(2, "0")}`
      : null
    const { error } = await createClient()
      .from("tasks")
      .insert({
        guild_id,
        title: title.trim(),
        description,
        due_date: requireDate(date),
        status,
        is_published,
        owner_id: owner,
      })
    if (error) throw error
    await get().loadTasks(guild_id)
  },
  update_task: async (id, changes) => {
    requireUuid(id, "タスクID")
    if (!useAuthState.getState().session)
      throw new Error("ログインしてください")
    // Explicit allowlist prevents audit/id/guild_id fields being sent at runtime.
    const payload: TaskChanges = {}
    if (changes.title !== undefined) payload.title = changes.title.trim()
    if (changes.description !== undefined)
      payload.description = changes.description
    if (changes.due_date !== undefined)
      payload.due_date = requireDate(changes.due_date)
    if (changes.status !== undefined) {
      requireStatus(changes.status)
      payload.status = changes.status
    }
    if (changes.is_published !== undefined) {
      if (typeof changes.is_published !== "boolean")
        throw new Error("公開設定が正しくありません")
      payload.is_published = changes.is_published
    }
    if (changes.owner_id !== undefined)
      payload.owner_id = requireUuid(changes.owner_id, "担当者ID")
    if (payload.owner_id !== undefined) {
      const db = createClient()
      const task = await db
        .from("tasks")
        .select("guild_id")
        .eq("id", id)
        .single()
      if (task.error) throw task.error
      const member = await db
        .from("guild_members")
        .select("user_id")
        .eq("guild_id", task.data.guild_id)
        .eq("user_id", payload.owner_id)
        .maybeSingle()
      if (member.error) throw member.error
      if (!member.data)
        throw new Error("担当者はギルドのメンバーから選択してください")
    }
    if (!Object.keys(payload).length) return
    if (
      changes.title !== undefined &&
      (!changes.title.trim() || changes.title.trim().length > 200)
    )
      throw new Error("タスク名は1〜200文字で入力してください")
    const { data, error } = await createClient()
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .select("guild_id")
      .single()
    if (error) throw error
    await get().loadTasks(data.guild_id)
  },
  delete_task: async (id) => {
    const { data, error } = await createClient()
      .from("tasks")
      .delete()
      .eq("id", id)
      .select("guild_id")
      .single()
    if (error) throw error
    await get().loadTasks(data.guild_id)
  },
}))
