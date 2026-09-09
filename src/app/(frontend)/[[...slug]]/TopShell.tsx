import { Fragment } from 'react'
import overridesData from '../../../content/overrides.json'
import { TOP_MV_TEXT_DEFAULT } from '../../../lib/topMvDefaults'
import { parseRich, sizeStyle, splitColorTokens } from '../../../spa/lib/richText'

const OVERRIDES = overridesData as Record<string, string>

// トップページのファーストビュー（ヘッダー枠＋FV）をサーバHTMLとして先行描画する。
// SPA はクライアント描画のため、これが無いと JS 一式の取得・実行が終わるまで
// 真っ白のままになる（モバイルの FCP/LCP が数秒遅れる主因）。
// SPA マウント時に SpaRoot が描画前（useLayoutEffect）に #top-shell を取り除くので、
// 二重表示は起きない。見た目は Top.tsx の Hero（2026-09 改修：微粒子パーティクルの FV。
// キャンバスは JS 起動後に描かれるため、ここでは淡いグレー地＋コピーだけを再現）と同一になるよう
// Tailwind に依存しないインラインCSSで再現している（Hero 変更時はここも追従させること）。
// MVテキストは1つのボックスで、[[特大:文字]] [[red:文字]] 等の行内トークンにより
// 文字サイズ・文字色を混在できる（2026-08 改修）。
const SHELL_CSS = `
#top-shell{pointer-events:none}
#top-shell .ts-hd{height:64px;background:#fff;border-bottom:1px solid rgba(0,0,0,.08)}
#top-shell .ts-fv{position:relative;overflow:hidden;background:transparent;height:min(94vh,860px);min-height:540px}
#top-shell .ts-copy{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}
#top-shell .ts-inner{max-width:1400px;margin-inline:auto;padding-inline:20px;text-shadow:0 0 12px rgba(246,248,249,.95),0 0 4px rgba(246,248,249,.95)}
#top-shell .ts-text p{margin:0;white-space:pre-line;font-size:13px;line-height:2.05;font-weight:500;color:rgba(10,10,10,.8)}
#top-shell .ts-text p:first-child{font-family:"Zen Kaku Gothic New","Noto Sans JP",sans-serif;font-size:clamp(10px,1.333vw,18.67px);line-height:1.4;letter-spacing:.04em;color:#0a0a0a}
@media (max-width:767px){#top-shell .ts-fv{height:min(86vh,700px)}}
@media (min-width:1025px){#top-shell .ts-hd{height:80px}#top-shell .ts-inner{padding-inline:48px}#top-shell .ts-text p{font-size:14px}#top-shell .ts-text p:first-child{font-size:clamp(10px,1.333vw,18.67px)}}
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
function Rich({ text }: { text: string }) {
  return (
    <div className="ts-text">
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
  const text = ov('top:mv.title', TOP_MV_TEXT_DEFAULT)
  return (
    <div id="top-shell" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      {/* ヘッダーと同じ高さの白帯（SPA描画時のレイアウトずれ防止） */}
      <div className="ts-hd" />
      <section className="ts-fv">
        <div className="ts-copy">
          <div className="ts-inner">
            <Rich text={text} />
          </div>
        </div>
      </section>
    </div>
  )
}
