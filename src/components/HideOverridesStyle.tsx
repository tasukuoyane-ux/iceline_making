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
  return rules.concat(colors).join('\n')
}

export function HideOverridesStyle() {
  const css = buildHideCss(OVERRIDES)
  return <style id={HIDE_STYLE_ID} dangerouslySetInnerHTML={{ __html: css }} />
}
