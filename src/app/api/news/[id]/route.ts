// GET /api/news/:id — お知らせ1件（slug = 旧CMSのID）。
// 現状の SPA は一覧APIだけで詳細も描画できるため、このルートは
// 記事数の増加や深いリンクの最適化に備えた将来用。
import { fetchNewsById } from '../../../../lib/newsData'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params
  const item = await fetchNewsById(id)
  if (!item) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }
  return Response.json(item, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  })
}
