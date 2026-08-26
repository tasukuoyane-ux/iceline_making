import { Fragment } from 'react'
import overridesData from '../../../content/overrides.json'
import imagesData from '../../../content/images.json'
import { canOptimize, optSrcSet, optUrl } from '../../../lib/imageOpt'
import { TOP_MV_TEXT_DEFAULT } from '../../../lib/topMvDefaults'
import { parseRich, sizeStyle, splitColorTokens } from '../../../spa/lib/richText'

const OVERRIDES = overridesData as Record<string, string>

// トップページのファーストビュー（ヘッダー枠＋MV）をサーバHTMLとして先行描画する。
// SPA はクライアント描画のため、これが無いと JS 一式の取得・実行が終わるまで
// 真っ白のままになる（モバイルの FCP/LCP が数秒遅れる主因）。
// SPA マウント時に SpaRoot が描画前（useLayoutEffect）に #top-shell を取り除くので、
// 二重表示は起きない。見た目は Top.tsx の Hero と同一になるよう
// Tailwind に依存しないインラインCSSで再現している（Hero 変更時はここも追従させること）。
// MVテキストは1つのボックスで、[[特大:文字]] [[red:文字]] 等の行内トークンにより
// 文字サイズ・文字色を混在できる（2026-08 改修）。
// SPでもPCと同じ構造でMVの中に重ねる（基準サイズは vw 駆動で画像と一緒に縮む）。
const SHELL_CSS = `
#top-shell{pointer-events:none}
#top-shell .ts-hd{height:64px;background:#fff;border-bottom:1px solid rgba(0,0,0,.08)}
#top-shell .ts-mv{position:relative;overflow:hidden;background:#101c24}
#top-shell .ts-img{display:block;width:100%;height:auto;aspect-ratio:1920/800;object-fit:cover}
#top-shell .ts-titlewrap{position:absolute;inset:0;display:flex;align-items:center}
#top-shell .ts-tinner{width:100%;max-width:62%;padding-left:4.5%}
#top-shell .ts-text p{margin:0;white-space:pre-line}
#top-shell .ts-base{font-size:clamp(6px,1.1vw,15px);font-weight:500;line-height:2;color:#101c24}
@media (min-width:1025px){#top-shell .ts-hd{height:80px}}
`

/** 行内装飾トークン（色・サイズ）込みで1行を描画（RichBody の renderLine と同じ規則） */
function renderLine(line: string) {
  return splitColorTokens(line).map((s, i) => {
    const style = { ...(sizeStyle(s.size) ?? {}), ...(s.color ? { color: s.color } : {}) }
    return Object.keys(style).length > 0 ? (
      <span key={i} style={style}>{s.text}</span>
    ) : (
      <Fragment key={i}>{s.text}</Fragment>
    )
  })
}

/** リッチ本文（p＋リスト）を RichBody と同じ規則で描画 */
function Rich({ text, cls }: { text: string; cls: string }) {
  return (
    <div className={`ts-text ${cls}`}>
      {parseRich(text).map((b, i) =>
        b.type === 'ul' ? (
          <ul key={i}>
            {b.lines.map((l, j) => (
              <li key={j}>{renderLine(l)}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.lines[0] ? renderLine(b.lines[0]) : ' '}</p>
        ),
      )}
    </div>
  )
}

/** 汎用オーバーライドの値（editable.ts の txt() と同じ規則） */
function ov(path: string, def: string): string {
  const v = OVERRIDES[path]
  return v !== undefined && v !== '' ? v : def
}

export function TopShell() {
  const mv = (imagesData as { IMG?: Record<string, string> }).IMG?.topMv
  if (!mv) return null
  const text = ov('top:mv.title', TOP_MV_TEXT_DEFAULT)
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
          <div className="ts-tinner">
            <Rich text={text} cls="ts-base" />
          </div>
        </div>
      </section>
    </div>
  )
}
