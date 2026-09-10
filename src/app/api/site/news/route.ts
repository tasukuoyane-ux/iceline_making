// GET /api/site/news — 公開済みお知らせの一覧（新しい順、本文ブロック込み）。
// 記事数が少ないため一覧APIが全文を返し、SPA はこの1リクエストで
// 一覧・TOP・詳細のすべてを賄う。
import { fetchPublishedNews } from '../../../../lib/newsData'

// 注意: /api/news・/api/interviews は Payload の REST（/admin の保存先）と同じパスなので
// ここに置かない（2026-09-10: 自前ルートが優先されて管理画面の保存が 405 になっていた）。

// ISR キャッシュ（5分）。記事の公開・更新時は News コレクションの
// afterChange フックが revalidatePath で即時に再検証する。
export const revalidate = 300

export async function GET(): Promise<Response> {
  const items = await fetchPublishedNews()
  return Response.json(items)
}
