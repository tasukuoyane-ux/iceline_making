// GET /posts/<ファイル名> —— /admin でアップロードしたメディアの配信（フォールバック）。
//
// メディアは public/posts/ にコミットされ、デプロイ後は静的ファイル（CDN）として配信される
// （静的ファイルが存在すれば Next/Vercel はこのルートより先にそれを返す）。
// このルートが呼ばれるのは、アップロード直後でまだデプロイに含まれていない間だけで、
// その場合は GitHub（本番ブランチ先端）から取得して返す。ローカル開発でも public/posts/ を読む。
import { contentTypeFor, readPostFile } from '../../../storage/postsStorage'

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }): Promise<Response> {
  const { name } = await ctx.params
  let filename: string
  try {
    filename = decodeURIComponent(name)
  } catch {
    return new Response(null, { status: 400 })
  }
  try {
    const buf = await readPostFile(filename)
    if (!buf) return new Response(null, { status: 404 })
    const type = contentTypeFor(filename)
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': type,
        'Content-Length': String(buf.length),
        // CDN に1日キャッシュ（Vercel のキャッシュはデプロイごとにリセットされるので、
        // デプロイ後は静的ファイルへ自然に切り替わる）
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        ...(type === 'image/svg+xml' ? { 'Content-Security-Policy': "script-src 'none'" } : {}),
      },
    })
  } catch (err) {
    console.error('[posts] 配信エラー:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
