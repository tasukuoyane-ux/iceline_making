import { preload } from 'react-dom'
import { fetchPublishedNews } from '../../../lib/newsData'
import { canOptimize, optSrcSet, optUrl } from '../../../lib/imageOpt'
import imagesData from '../../../content/images.json'
import { SpaClient } from './SpaClient'

// ISR（5分）。お知らせの公開・更新時は News コレクションの afterChange
// フックが revalidatePath('/', 'layout') で即時に再検証する。
export const revalidate = 300

// 公開サイト全ページの受け皿（catch-all）。ルーティングは SPA 内の
// react-router が担うため、ここでは slug を使わず SPA を描画するだけ。
// 旧構成（Vite + vercel.json の SPA rewrite）と同じく全パスが 200 で
// SPA を返し、未知の URL は SPA 側の `*` ルート（Top 表示）が受ける。
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  // トップページの LCP（メインビジュアル画像）を最優先でプリロードする。
  // SPA はクライアント描画のため、これが無いと「JS実行後」まで画像発見が遅れる。
  const { slug } = await params
  if (!slug?.length) {
    const mv = (imagesData as { IMG?: Record<string, string> }).IMG?.topMv
    if (mv && canOptimize(mv)) {
      preload(optUrl(mv, 1080), {
        as: 'image',
        fetchPriority: 'high',
        imageSrcSet: optSrcSet(mv),
        imageSizes: '100vw',
      })
    } else if (mv) {
      preload(mv, { as: 'image', fetchPriority: 'high' })
    }
  }
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
