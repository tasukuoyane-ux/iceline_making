/**
 * /console/check の「手動確認リスト」の型と初期データ。
 *
 * 項目は /api/check-items 経由で Neon（console_check テーブル）に保存され、
 * 画面から追加・編集・削除できる。DBにまだ保存が無いときは、この初期データが
 * そのまま表示される（＝初期データはシードであり、保存後はDB側が正）。
 */

export type ManualScope = 'once' | 'recurring'

export interface ManualItem {
  /** 安定ID。シードは 'm01'…、画面から追加した項目は UUID */
  id: string
  scope: ManualScope
  /** 表示上のグループ名（自由入力。同名同士がまとまる） */
  section: string
  /** チェックリストの項目No（任意） */
  no: string
  text: string
}

/** 消し込み状態。キーは ManualItem.id */
export type ManualState = Record<string, { done: boolean; by?: string; at?: string }>

/** セクション名に対する補足（表示のみ。編集対象外） */
export const SECTION_NOTES: Record<string, string> = {
  '公開切替時（noindex 解除）':
    '切替日が決まったら着手。noindex の解除はコード修正（layout.tsx の metadata.robots）を伴う。',
}

export const DEFAULT_MANUAL_ITEMS: ManualItem[] = [
  // ── 毎回の確認 ──
  { id: 'm01', scope: 'recurring', section: '実機・目視で確認（修正のたび）', no: '', text: 'iPhone / Android 実機＋Chrome 以外のブラウザ（Safari・Firefox・Edge）で主要ページ（トップ・事業部・採用3・会社情報・お問い合わせ）' },
  { id: 'm02', scope: 'recurring', section: '実機・目視で確認（修正のたび）', no: '', text: '採用3の背景動画のスクロール連動 — 実機・低速回線（開発者ツールのスロットリング）で確認' },
  { id: 'm03', scope: 'recurring', section: '実機・目視で確認（修正のたび）', no: '', text: '「動画で知る」（/videos）の再生・サムネイル表示' },
  { id: 'm04', scope: 'recurring', section: '実機・目視で確認（修正のたび）', no: '', text: 'tel: / mailto: リンクの実機タップ' },
  { id: 'm05', scope: 'recurring', section: '実機・目視で確認（修正のたび）', no: '', text: '横スクロールの発生・要素の重なり・文字200%ズーム' },
  { id: 'm06', scope: 'recurring', section: '原稿・コンテンツ（追加・修正のたび）', no: '', text: '追加・修正した文言の校正（第三者チェック）と、日付・年数（創業年数など）の鮮度' },
  { id: 'm07', scope: 'recurring', section: '原稿・コンテンツ（追加・修正のたび）', no: '', text: '新規画像の alt 設定（お知らせ記事は /admin の画像ブロックのキャプション欄）' },
  { id: 'm08', scope: 'recurring', section: 'フォーム・記事', no: '', text: 'お問い合わせフォームの実送信テスト（設定した送信先での受信確認）' },
  { id: 'm09', scope: 'recurring', section: 'フォーム・記事', no: '', text: 'お知らせ記事の追加・編集は /admin（記事管理）で行う（console では編集不可）。公開後に /news への反映を確認' },
  // ── 初期設定 ──
  { id: 'm10', scope: 'once', section: 'Vercel ダッシュボードで確認（約10分）', no: '', text: 'Deployment Protection（プレビューURLの保護）が有効か — Settings > Deployment Protection' },
  { id: 'm11', scope: 'once', section: 'Vercel ダッシュボードで確認（約10分）', no: '', text: '環境変数の適用環境が分離されているか（本番専用の値が Preview に共有されていないか）' },
  { id: 'm12', scope: 'once', section: 'Vercel ダッシュボードで確認（約10分）', no: '', text: 'チームのプランが Pro 以上か（Hobby の商用利用は規約違反）・Spend Management（利用上限・使用量アラート）の設定' },
  { id: 'm13', scope: 'once', section: 'Vercel ダッシュボードで確認（約10分）', no: '', text: 'デプロイ失敗時の通知先（メール/Slack）と、Instant Rollback（直前デプロイへの切替）を一度試しておく' },
  { id: 'm14', scope: 'once', section: '外部サービスで確認', no: '', text: 'GitHubトークンの種類（Fine-grained か）・対象リポジトリ限定か・有効期限の管理（期限は自動検査にも表示）' },
  { id: 'm15', scope: 'once', section: '外部サービスで確認', no: '', text: 'Vercel Blob のストアが public で作成されているか（private だと画像・動画の表示不可）' },
  { id: 'm16', scope: 'once', section: '外部サービスで確認', no: '', text: 'Neon（Postgres）のプラン・容量・バックアップ/ポイントインタイム復元の設定確認' },
  { id: 'm17', scope: 'once', section: '外部サービスで確認', no: '', text: 'CONSOLE_USERS のアカウント棚卸し（退職者の削除・パスワード強度）と /admin の管理ユーザー整理' },
  { id: 'm18', scope: 'once', section: '公開切替時（noindex 解除）', no: '', text: '切替日時の決定・DNS切替手順（MX等メール系レコードの保全・TTL事前短縮・切り戻し手順）' },
  { id: 'm19', scope: 'once', section: '公開切替時（noindex 解除）', no: '', text: 'noindex の解除（layout.tsx の metadata.robots）＋ robots.txt / sitemap の追加 ＋ /api/check の noindex 判定の反転（コード修正）' },
  { id: 'm20', scope: 'once', section: '運用改善', no: '', text: '死活監視（UptimeRobot 等）の導入と、コード変更を PR＋プレビューURL確認で行う運用' },
]
