import { toast } from "@/components/ui/toast"
export function getErrorMessage(error: unknown) {
  let message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "操作に失敗しました"
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : ""
  const original = message
  if (code === "22P02" && /uuid/i.test(message)) {
    message =
      "DBのID型が一致していません。guilds.idがintegerなら、create_guild / join_guildの戻り値と内部変数もintegerか確認してください。"
  } else if (code === "23502" && /created_by|updated_by/.test(message)) {
    message =
      "必須の監査情報を設定できませんでした。テーブル再作成後の監査トリガーを確認してください。"
  } else if (code === "42501") {
    message =
      "この操作の権限がありません。ログイン状態・ギルドの権限・DBのRLSとカラム権限を確認してください。"
  } else if (code === "23503" && /tasks_owner_is_guild_member/.test(message)) {
    message =
      "担当者はギルドのメンバーから選択してください。メンバー一覧を再読み込みしてください。"
  }
  return code ? `${message}\n[${code}] ${original}` : message
}
export function reportError(error: unknown) {
  toast.add({ title: "エラー", description: getErrorMessage(error) })
}
