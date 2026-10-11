import type { User } from "@/states/users.ts"
import type { Guild } from "@/states/guilds.ts"
import type { Task } from "@/states/tasks.ts"

const commonUser1: User = {
  id: "usr_01",
  name: "Alice",
  avatar_url: "https://example.com/avatars/alice.png",
}

const commonUser2: User = {
  id: "usr_02",
  name: "Bob",
  avatar_url: "https://example.com/avatars/bob.png",
}

const commonUser3: User = {
  id: "usr_03",
  name: "Charlie",
  avatar_url: null,
}

const commonUser4: User = {
  id: "usr_04",
  name: "David",
  avatar_url: "https://example.com/avatars/david.png",
}

const commonUser5: User = {
  id: "usr_05",
  name: "Eve",
  avatar_url: null,
}

const commonUser6: User = {
  id: "usr_06",
  name: "Frank",
  avatar_url: "https://example.com/avatars/frank.png",
}

const commonGuild: Guild = {
  id: "gld_01",
  name: "Dev Team Guild",
  owner: commonUser1,
  description: "ソフトウェアエンジニアリングプロジェクトのギルド",
  member_count: 12,
}

export const tasks: Task[] = [
  {
    id: "tsk_01",
    guild: commonGuild,
    title: "データベーススキーマの設計",
    description: "PostgreSQL用のテーブル定義およびインデックス設計を行う。",
    due_date: new Date("2026-10-15T09:00:00Z"),
    owner: commonUser1,
    status: "IN_PROGRESS",
    is_published: true,
  },
  {
    id: "tsk_02",
    guild: commonGuild,
    title: "認証APIの実装",
    description: "OAuth 2.0を利用したログイン処理の実装および単体テスト。",
    due_date: new Date("2026-10-20T18:00:00Z"),
    owner: commonUser1,
    status: "TODO",
    is_published: true,
  },
  {
    id: "tsk_03",
    guild: commonGuild,
    title: "CI/CDパイプラインの初期構築",
    description: "GitHub Actionsによる自動テスト実行環境を構築する。",
    due_date: new Date("2026-10-25T12:00:00Z"),
    owner: commonUser1,
    status: "TODO",
    is_published: false,
  },
  {
    id: "tsk_04",
    guild: commonGuild,
    title: "障害検知アラートの設定",
    description: null,
    due_date: null,
    owner: commonUser1,
    status: "BACKLOG",
    is_published: false,
  },
  {
    id: "tsk_05",
    guild: commonGuild,
    title: "UIコンポーネントライブラリの選定",
    description: "デザインシステムに準拠したコンポーネントライブラリの評価。",
    due_date: new Date("2026-10-12T15:00:00Z"),
    owner: commonUser2,
    status: "DONE",
    is_published: true,
  },
  {
    id: "tsk_06",
    guild: commonGuild,
    title: "レスポンシブレイアウトの検証",
    description: "ビューポート変更時の描画崩れに関する検証。",
    due_date: new Date("2026-10-18T10:00:00Z"),
    owner: commonUser2,
    status: "IN_PROGRESS",
    is_published: true,
  },
  {
    id: "tsk_07",
    guild: commonGuild,
    title: "エンドツーエンドテストの作成",
    description: "Playwrightを使用した主要ユースケースのE2Eテスト実装。",
    due_date: new Date("2026-10-30T17:00:00Z"),
    owner: commonUser3,
    status: "TODO",
    is_published: true,
  },
  {
    id: "tsk_08",
    guild: commonGuild,
    title: "セキュリティ監査準備",
    description: "依存パッケージの脆弱性スキャンおよびレポート出力。",
    due_date: null,
    owner: commonUser4,
    status: "TODO",
    is_published: false,
  },
  {
    id: "tsk_09",
    guild: commonGuild,
    title: "フロントエンドのパフォーマンスチューニング",
    description: "バンドルサイズの削減および初期レンダリング速度の改善。",
    due_date: new Date("2026-11-05T12:00:00Z"),
    owner: commonUser5,
    status: "BACKLOG",
    is_published: true,
  },
  {
    id: "tsk_10",
    guild: commonGuild,
    title: "利用規約改定の反映",
    description: "法務チェック完了後のテキスト変更の適用。",
    due_date: new Date("2026-11-01T00:00:00Z"),
    owner: commonUser6,
    status: "TODO",
    is_published: true,
  },
]
