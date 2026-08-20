import { fetchPublishedNews } from '../../../lib/newsData'
import { SpaClient } from './SpaClient'

// ISR（5分）。お知らせの公開・更新時は News コレクションの afterChange
// フックが revalidatePath('/', 'layout') で即時に再検証する。
export const revalidate = 300

// 公開サイト全ページの受け皿（catch-all）。ルーティングは SPA 内の
// react-router が担うため、ここでは slug を使わず SPA を描画するだけ。
// 旧構成（Vite + vercel.json の SPA rewrite）と同じく全パスが 200 で
// SPA を返し、未知の URL は SPA 側の `*` ルート（Top 表示）が受ける。
export default async function Page() {
  // お知らせ一覧を HTML に埋め込み、SPA 初回描画時のちらつきを無くす
  // （src/spa/data/news.ts が読み取る。失敗時は埋め込み無し＝SPA が /api/news へ）。
  let newsJson: string | null = null
  try {
    const news = await fetchPublishedNews()
    // </script> によるタグ破壊を防ぐため < をエスケープする
    newsJson = JSON.stringify(news).replace(/</g, '\\u003c')
  } catch {
    newsJson = null
  }

  return (
    <>
      {newsJson !== null && (
        <script
          id="__NEWS_DATA__"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: newsJson }}
        />
      )}
      <SpaClient />
    </>
  )
}
