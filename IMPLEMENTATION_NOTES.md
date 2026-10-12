# 動作確認メモ

## 確認済み
- guild_schema.sql / rls.sql を読み取り、カラム・integer/UUID・RPC・操作権限を照合。
- DBにはSQLを実行していません。RLS・権限設定は変更していません。
- 監査カラムはクライアントから送らず、既存DBトリガーに委ねます。
- pnpm build でTypeScriptと本番バンドルを検証。

## Supabaseで手動確認する操作
1. 提供されたschemaとRLSが実DBに適用済みであることを確認。
2. 登録・ログイン・再読込でセッション復元・ログアウト。初回ログイン時にprofilesが作成されること。
3. 表示名の保存と再読込。
4. ギルド作成、再読込後の一覧取得、名前・説明保存。
5. 管理者から共有されたUUIDで別ユーザーが参加。キャンセルでは参加しないこと。
6. 担当者の＋からタスク作成、期限なし・期限あり、編集、状態変更、公開フラグ変更、削除。
7. 作成者またはギルド所有者のみ編集・削除できること。他ギルドのデータを参照できないこと。
8. エラー時の通知と再試行、複数アカウント切替後に以前のデータが表示されないこと。
9. GitHub SecretsにVITE_SUPABASE_URLとVITE_SUPABASE_PUBLISHABLE_KEYを設定し、Pagesで同じ操作を確認。

## 未実装・制限
- 現在の招待コード取得: 取得RPCは未提供で、secret_uuid_v4のSELECTも許可されていません。再発行RPCは接続済みで、返された新コードを表示・コピーできます。
  sql/invite_rpc_proposal.sql は現在コード取得専用RPCの提案。エージェントによるDB実行はなし。画面は接続済み。既存の再発行RPCは置き換えません。
- 追加提供されたrotate_guild_invite_code / remove_guild_member / delete_guildを定義どおり接続済み。DB適用済みかは手動確認が必要です。
- 所有者変更は直接UPDATEでは許可されないため、所有者限定transfer_guild_owner RPCのSQL案と画面を追加。DB適用は未実行です。
- タスク参加/退出・プロフィール画像変更は実装済み。Realtimeは未実装。
- is_publishedは保存できますが、現行RLSではギルド内の全タスクをメンバーが参照できます。
- メール確認が有効なら、example.comの仮アドレスでは確認メールを受信できません。
- Chromeでテスト通信による画面・操作検証を実施。実DB・確認メールの配送・GitHub上の動作は未検証。

## 追加RPCの手動確認
- 所有者で設定画面を開き、再発行のキャンセルでは変更されないこと。再発行後のコードをコピーし、別ユーザーが参加できること。旧コードで参加できないこと。
- 所有者以外に再発行・メンバー削除・ギルド削除の操作を表示しないこと。RPC側でも権限エラーになること。
- メンバー削除後の人数・一覧を確認。担当タスクがあるメンバーは削除が拒否されること。タスク編集で担当者変更後に再確認。
- remove_guild_memberはtask_participantsを削除しません。削除したメンバーの参加情報がDBに残る点は、必要なら別途SQL変更を検討してください。
- テスト用ギルドで削除を確認。関連タスク・参加情報・メンバーが消え、一覧画面に戻ること。キャンセルでは削除されないこと。

## 新しいテーブル定義との照合
- 「テーブル定義.sql」はguilds / guild_members / tasks / task_participantsをDROPして再作成します。DBでは実行していません。
- integer / UUID / date / nullable description・due_date / status・担当者外部キーは現在のコードと整合します。
- created_by・updated_byはNOT NULLかつDEFAULTなし。以前のset_audit_fieldsトリガーで埋める設計ですが、新定義にはそのトリガーがありません。DROPで既存トリガー・ポリシー・テーブル権限は失われるため、新定義だけでは作成・更新の動作を保証できません。
- フロントから監査値を送る方法は既存rls.sqlのカラム権限と衝突するため採用していません。監査値はauth.uid()でDBが設定します。
- sql/table_rebuild_recovery_proposal.sqlを作成。元のguild_schema.sql / rls.sqlに基づく監査トリガー・参加者所属チェック・RLS・権限の復旧案です。未実行。適用前にユーザー確認と実DBの状態確認が必要です。
- profilesは新しい定義に含まれないため、以前のprofiles定義・トリガーを前提としています。
- ギルド作成・参加は定義済みRPCを維持。ギルドとメンバーの作成を個別のINSERTへ分割しません。
- タスク作成・更新でUUID・integer・date・status、担当者のギルド所属を検証。更新ペイロードは許可カラムに限定し、id / guild_id / 監査項目を送信しません。
- タイトル200文字・ギルド名120文字は以前の定義とUIの入力上限として維持。新定義にはこの長さCHECKがありません。
- 手動確認: 作成時のcreated_by / updated_byがログイン本人、更新時にcreated_by / created_atが保持され、updated_by / updated_atが更新されること。期限NULL、日付のみ、他ギルド担当者の拒否を確認してください。

## ギルド作成RPCの400調査
- HTTP 400だけでは原因を断定できません。レスポンスのcode/message/detailsで確認が必要です。
- guild_schema_old.sqlはcreate_guild / join_guildがreturns uuidかつ内部v_id uuid。新テーブルはinteger。旧RPCが残ると型不整合になる可能性があります。
- sql/guild_rpc_diagnostics.sqlは読み取り専用の定義・型確認SQLです。
- sql/guild_rpc_integer_migration_proposal.sqlは、型不整合確認後に使うRPC修正案。未実行。実行にはユーザー確認が必要です。テーブルを削除せず、元の新schemaにあるinteger RPCへ合わせます。
- フロントは作成前に認証ユーザーとプロフィールを確認し、定義済み引数p_name / p_descriptionを明示。
- エラー表示にDBのcode/messageを残し、型不一致・監査情報欠落・権限不足を区別します。実DBでの作成成功は未確認です。

## タスク作成エラー23502
- 実際のエラー: tasks.created_byがNULLでNOT NULL違反。監査トリガーの欠落・無効化・定義不整合が原因候補。
- sql/tasks_audit_fix_proposal.sqlを追加。既存schemaのset_audit_fields関数とtasks用BEFORE INSERT OR UPDATEトリガーを復旧します。
- 未実行。DB適用前にユーザー確認が必要です。RLS・カラム権限・テーブルデータは変更しません。
- 適用後、アプリでタスク作成・編集を再確認。作成者の監査値は担当者ではなくauth.uid()。更新ではcreated_by/created_atを保持し、updated_by/updated_atのみ更新。

## 招待コードの初期表示
- ギルド設定を開くと所有者限定get_guild_invite_code(integer)で現在のsecret_uuid_v4を取得・表示。取得中表示・失敗時の再試行あり。
- sql/invite_rpc_proposal.sqlをDBに適用する必要があります。未実行。適用前の確認が必要です。
- 取得RPCはguilds.owner_idとauth.uid()を直接照合。secret_uuid_v4への直接SELECT権限は増やしません。
- 手動確認: 所有者で開いた直後のコード表示・コピー、再発行後の表示、設定画面を開き直した際の値、所有者以外の拒否。

## 画面モック対応（2026-10-12）
- 共通ヘッダー、左サイドバー、パンくず、モバイルメニュー、青/白の配色を実装。既存shadcn/ui・Zustandを維持。
- トップ、ギルドトップ、設定、タスク詳細、プロフィール、ログインの6画面をモックに合わせて改修。
- 背景はimagegenで生成した風景素材。src/assets/guild-landscape.pngを使用。
- ギルド並び替え（名前/人数/アクセス順）と端末内のアカウント別アクセス記録を追加。アクセス履歴はブラウザ間で同期しません。
- タスクカードのハンドルをドラッグして担当者変更。現行RLSに合わせ、作成者またはギルド所有者のみ移動可能。タッチ/キーボード操作にも対応。
- タスク詳細の閲覧・編集、参加/退出、参加メンバー表示、状態の日本語ラベル・色分けを追加。期限はDBに合わせ任意、タイトル200文字・ギルド名120文字を維持。
- ギルド設定に参加日付きメンバー表とマスター選択を追加。マスター変更はsql/transfer_guild_owner_proposal.sqlの適用が必要（未実行）。
- テーブル再作成後、タスク参加にはtask_participantsの監査トリガーが必要。sql/task_participants_audit_proposal.sqlを用意（未実行）。既に有効な場合は追加適用不要。
- 画像変更は5MB以下のPNG/JPG/GIFを256px正方形の静止画に縮小し、既存profiles.avatar_urlに保存。GIFのアニメーションは保持しません。Storageバケットの追加は不要。
- メール変更、現在のパスワード確認付きパスワード変更、表示/非表示、パスワード再設定メールとリンク受信後の更新画面を追加。
- 確認メール/再設定メールには受信可能なメールアドレスが必要。Supabase AuthのRedirect URLsに公開URL・開発URLを登録する必要があります。メール配送とリンクの受信は実アカウントで手動確認。
- 利用規約/プライバシーポリシーの原稿は未提供のため、モックの該当リンクは追加していません。

## デザイン・操作検証
- pnpm buildでTypeScriptと本番ビルドを確認。
- Chromeヘッドレス、1536×1024 / 390×844で検証。全Supabase通信をテストデータで置き換え、実DBへの書き込みはなし。
- ログイン、一覧/詳細/設定/プロフィール遷移、タスク編集、ドラッグ担当変更、参加/退出、招待コード初期取得、表示名保存、画像保存、メール/パスワード変更、モバイルメニューを検証。ブラウザ例外0件。
- output/design-review/に6画面とモバイル2画面のスクリーンショットを保存。画像内のデータは検証用です。
- 追加手動確認: 実DBでの参加監査値・所有者移譲後の管理権限・他ユーザーの編集拒否・メール確認/再設定リンク・モバイル実機のドラッグ。
