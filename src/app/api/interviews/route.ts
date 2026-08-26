// GET /api/interviews — 公開済み採用記事の一覧（表示順、本文ブロック込み）。
// 記事数が少ないため一覧APIが全文を返し、SPA はこの1リクエストで
// カルーセル・記事ページのすべてを賄う。
import { fetchPublishedInterviews } from '../../../lib/interviewsData'

// ISR キャッシュ（5分）。記事の公開・更新時は Interviews コレクションの
// afterChange フックが revalidatePath で即時に再検証する。
export const revalidate = 300

export async function GET(): Promise<Response> {
  const items = await fetchPublishedInterviews()
  return Response.json(items)
}
