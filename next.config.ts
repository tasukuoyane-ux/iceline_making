import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 型チェックはローカルで行う運用（旧構成も strict:false・型検査なし）。
  typescript: { ignoreBuildErrors: true },
  // 画像最適化（/_next/image）。SPA は <img> のまま src/lib/imageOpt.ts の
  // ヘルパーで最適化URLを組み立てるため、許可ホストをここに列挙する
  // （imageOpt.ts の OPT_HOSTS と一致させること）。
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tlnao3m7wsd1mzf2.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    qualities: [75],
    // 変換結果のキャッシュ（Blob 上の元画像はURLが不変なので長めに保持）
    minimumCacheTTL: 2678400,
  },
}

const config = withPayload(nextConfig)

// withPayload は管理画面のダークモード判定用に Critical-CH ヘッダを
// 全パスへ付けるが、Critical-CH はブラウザに「ヒント付きで初回リクエスト
// をやり直させる」ため、フロント全ページの初回表示がドキュメント2往復に
// なる。フロントにダークモード対応は無いので、このヘッダ群（Accept-CH /
// Critical-CH / Vary）は管理画面（/admin）だけに絞る。
const payloadHeaders = config.headers?.bind(config)
config.headers = async () => {
  const rules = payloadHeaders ? await payloadHeaders() : []
  return [
    ...rules.map((rule) =>
      rule.headers.some((h) => h.key === 'Critical-CH')
        ? { ...rule, source: '/admin/:path*' }
        : rule,
    ),
    // セキュリティヘッダー（Next.js は自動では付けない）。
    // X-Frame-Options は SAMEORIGIN: /console が本サイトを iframe で
    // プレビューする（同一オリジン）ため、DENY にはしないこと。
    {
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ]
}

export default config
