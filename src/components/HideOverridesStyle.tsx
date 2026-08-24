import overridesData from '../content/overrides.json'

/**
 * コンソールの「SPで非表示」「PCで非表示」を反映するスタイル。
 *
 * 非表示設定は overrides.json に `hide:<編集パス>` → 'sp' | 'pc' | 'sp,pc'
 * で保存される（コンソールのトグルで編集）。ここでは公開済みの値から
 * メディアクエリ付きの display:none ルールを生成して焼き込む。
 * 編集プレビュー（?__edit）では editBridge が同じ id の style を
 * 下書きの値で書き換える。
 *
 * ブレークポイントは当サイトの `--breakpoint-pc: 1025px`（theme.css）に合わせる。
 */
const OVERRIDES = overridesData as Record<string, string>

export const HIDE_STYLE_ID = 'iceline-hide-style'

/** CSSの属性値セレクタ用に `"` と `\` をエスケープする。 */
function esc(s: string): string {
  return s.replace(/[\\"]/g, '\\$&')
}

export function buildHideCss(overrides: Record<string, string>): string {
  const sp: string[] = []
  const pc: string[] = []
  const colors: string[] = []
  const flips: string[] = []
  for (const [key, value] of Object.entries(overrides)) {
    if (key.startsWith('hide:') && value) {
      const path = esc(key.slice('hide:'.length))
      const sel = `[data-edit="${path}"],[data-edit-img="${path}"],[data-edit-select="${path}"]`
      if (value.includes('sp')) sp.push(sel)
      if (value.includes('pc')) pc.push(sel)
    }
    // 文字色（コンソールの「文字色」設定。`color:<編集パス>` → #rrggbb）。
    // インラインstyleの色指定にも勝てるよう !important を付ける。
    if (key.startsWith('color:') && /^#[0-9a-fA-F]{3,8}$/.test(value)) {
      const path = esc(key.slice('color:'.length))
      colors.push(`[data-edit="${path}"]{color:${value} !important}`)
    }
    // セクションごと非表示（コンソールのアコーディオン見出しのトグル）。
    // `hidesec:<セクション先頭フィールドのパス>` = "1" のとき、そのフィールドを
    // 含む section / header 要素を丸ごと隠す（:has() で特定）。
    if (key.startsWith('hidesec:') && value === '1') {
      const path = esc(key.slice('hidesec:'.length))
      const inner = `[data-edit="${path}"],[data-edit-img="${path}"],[data-edit-select="${path}"]`
      colors.push(`section:has(${inner}),main header:has(${inner}){display:none !important}`)
    }
    // 画像＋文章の横並びグリッドの「左右入れ替え」（`flip:<比率パス>` = "1"）。
    // PC幅でグリッドの direction を既定と反対向きにして列順を反転する。
    // 既定で direction:rtl のグリッドは data-ratio-rtl="1" が付いており ltr へ反転。
    // 子要素の文字方向は direction:ltr に戻す（列順は親の direction で決まる）。
    if (key.startsWith('flip:') && value === '1') {
      const path = esc(key.slice('flip:'.length))
      flips.push(
        `[data-ratio="${path}"]:not([data-ratio-rtl]){direction:rtl}` +
          `[data-ratio="${path}"][data-ratio-rtl="1"]{direction:ltr}` +
          `[data-ratio="${path}"]>*{direction:ltr}`,
      )
    }
  }
  const rules: string[] = []
  if (sp.length) {
    rules.push(
      `@media (max-width: 1024.98px){${sp.join(',')}{display:none !important}}`,
    )
  }
  if (pc.length) {
    rules.push(
      `@media (min-width: 1025px){${pc.join(',')}{display:none !important}}`,
    )
  }
  if (flips.length) {
    rules.push(`@media (min-width: 1025px){${flips.join('\n')}}`)
  }
  return rules.concat(colors).join('\n')
}

export function HideOverridesStyle() {
  const css = buildHideCss(OVERRIDES)
  return <style id={HIDE_STYLE_ID} dangerouslySetInnerHTML={{ __html: css }} />
}
