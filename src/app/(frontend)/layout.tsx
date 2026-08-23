import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../../styles/index.css'
import { HideOverridesStyle } from '../../components/HideOverridesStyle'
import overridesData from '../../content/overrides.json'

/** コンソールの「SEO」タブで設定した値（無ければコード側の既定文言）。 */
const OVERRIDES = overridesData as Record<string, string>
const seo = (path: string, fallback = '') => (OVERRIDES[path] ?? '').trim() || fallback

/** サイト全体のフォント（旧 `src/styles/fonts.css` の @import と同じもの）。 */
const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Oswald:wght@500;600;700&display=swap'

/** 旧 `index.html` の内容（メタ情報）をここで再現する。
 * メタディスクリプション・キーワード・OGP画像はコンソールの「SEO」タブから
 * 設定でき、公開（デプロイ）で全ページに反映される。 */
export const metadata: Metadata = {
  title: 'アイスライン2_編集用',
  description: seo(
    'site:seo.description',
    'A corporate website showcasing food and ice cream divisions with dynamic, user-friendly pages for company info, news, recruitment, and contact details.',
  ),
  // サイト全域のキーワード（読点・カンマ区切りをそのまま分割）。
  keywords: seo('site:seo.keywords')
    ? seo('site:seo.keywords')
        .split(/[、,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined,
  // 現行 index.html の noindex, nofollow を維持（公開切替時にここを外す）。
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: 'アイスライン',
    locale: 'ja_JP',
    description: seo(
      'site:seo.description',
      'A corporate website showcasing food and ice cream divisions with dynamic, user-friendly pages for company info, news, recruitment, and contact details.',
    ),
    ...(seo('site:seo.ogImage') ? { images: [seo('site:seo.ogImage')] } : {}),
  },
  twitter: { card: 'summary_large_image' },
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* フォントCSSは非レンダリングブロックで読み込む（media=print → 読込後に all へ）。
            display=swap のため、読込までは代替フォントで即時に文字が描画される。 */}
        <link rel="preload" as="style" href={FONT_CSS} />
        <link rel="stylesheet" href={FONT_CSS} media="print" id="async-font-css" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var l=document.getElementById('async-font-css');if(!l)return;var d=function(){l.media='all'};if(l.sheet){d()}else{l.addEventListener('load',d)}})()",
          }}
        />
        <noscript>
          <link rel="stylesheet" href={FONT_CSS} />
        </noscript>
        {/* 旧 index.html のインラインスタイルを再現 */}
        <style
          dangerouslySetInnerHTML={{
            __html: 'html, body { height: 100%; margin: 0; } #root { height: 100%; }',
          }}
        />
        {/* コンソールの「SPで非表示」「PCで非表示」設定 */}
        <HideOverridesStyle />
      </head>
      <body>
        {/* 旧 index.html と同じ DOM 構造（height:100% の連鎖を維持） */}
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
