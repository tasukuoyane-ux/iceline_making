import overridesData from '../../../content/overrides.json'
import imagesData from '../../../content/images.json'
import { canOptimize, optSrcSet, optUrl } from '../../../lib/imageOpt'

const OVERRIDES = overridesData as Record<string, string>

// トップページのファーストビュー（ヘッダー枠＋MV）をサーバHTMLとして先行描画する。
// SPA はクライアント描画のため、これが無いと JS 一式の取得・実行が終わるまで
// 真っ白のままになる（モバイルの FCP/LCP が数秒遅れる主因）。
// SPA マウント時に SpaRoot が描画前（useLayoutEffect）に #top-shell を取り除くので、
// 二重表示は起きない。見た目は Top.tsx の Hero と同一になるよう
// Tailwind に依存しないインラインCSSで再現している（Hero 変更時はここも追従させること）。
const SHELL_CSS = `
#top-shell{pointer-events:none}
#top-shell .ts-hd{height:64px;background:#fff;border-bottom:1px solid rgba(0,0,0,.08)}
#top-shell .ts-mv{position:relative;overflow:hidden;background:#101c24}
#top-shell .ts-img{display:block;width:100%;height:auto;aspect-ratio:1920/800;object-fit:cover}
#top-shell .ts-titlewrap{position:absolute;top:0;bottom:0;left:0;width:33.3333%;display:flex;align-items:center}
#top-shell .ts-title{width:100%;padding:0 9%;margin:0;font-size:clamp(18px,3.4vw,46px);font-weight:900;line-height:1.6;color:#101c24;white-space:pre-line}
@media (min-width:1025px){#top-shell .ts-hd{height:80px}}
`

export function TopShell() {
  const mv = (imagesData as { IMG?: Record<string, string> }).IMG?.topMv
  if (!mv) return null
  const title = (OVERRIDES['top:mv.title'] ?? '').trim() || '氷と食で、\n日々に応える。'
  const opt = canOptimize(mv)
  return (
    <div id="top-shell" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      {/* ヘッダーと同じ高さの白帯（SPA描画時のレイアウトずれ防止） */}
      <div className="ts-hd" />
      <section className="ts-mv">
        <img
          src={opt ? optUrl(mv, 1080) : mv}
          srcSet={opt ? optSrcSet(mv) : undefined}
          sizes="100vw"
          fetchPriority="high"
          alt=""
          className="ts-img"
        />
        {/* ストライプ・白パネル・グラデーションの加工は 2026-08 改修で削除（Top.tsx の Hero と同一） */}
        <div className="ts-titlewrap">
          <h2 className="ts-title">{title}</h2>
        </div>
      </section>
    </div>
  )
}
