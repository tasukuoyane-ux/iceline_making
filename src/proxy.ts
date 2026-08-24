// サイト全体の閲覧パスワード保護（コンソールの「SEO」タブから設定・公開で反映）。
//  - site:protect.enabled = "1" かつ site:protect.hash が設定されているときだけ有効
//  - 認証は /api/site-lock がハッシュ一致を確認して Cookie（ハッシュ値）を発行し、
//    ここでは Cookie とビルドに焼き込まれたハッシュの一致だけを見る（平文は扱わない）
//  - /console・/admin・/api は対象外：パスワードを忘れてもコンソールから
//    変更・無効化できる（締め出し防止）
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import overridesData from './content/overrides.json'

const OV = overridesData as Record<string, string>
const VIEW_COOKIE = 'iceline_view'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function gateHtml(next: string, wrong: boolean): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>閲覧パスワード | アイスライン</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         background: #f4f5f7; font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif; }
  .card { width: min(92vw, 380px); background: #fff; border: 1px solid #e4e4e8; border-radius: 14px;
          padding: 36px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); text-align: center; }
  h1 { margin: 0; font-size: 17px; color: #16232b; }
  p { margin: 10px 0 0; font-size: 12.5px; line-height: 1.9; color: #6b7280; }
  .err { color: #E60012; font-weight: 700; }
  input { width: 100%; box-sizing: border-box; margin-top: 20px; padding: 12px 14px; font-size: 15px;
          border: 1px solid #d4d4d8; border-radius: 8px; outline: none; }
  input:focus { border-color: #E60012; }
  button { width: 100%; margin-top: 12px; padding: 13px; font-size: 14px; font-weight: 700; color: #fff;
           background: #E60012; border: 0; border-radius: 8px; cursor: pointer; }
  button:hover { background: #c30010; }
</style>
</head>
<body>
  <form class="card" method="POST" action="/api/site-lock">
    <h1>このサイトの閲覧にはパスワードが必要です</h1>
    <p>閲覧用パスワードを入力してください。</p>
    ${wrong ? '<p class="err">パスワードが違います。</p>' : ''}
    <input type="password" name="password" autofocus required autocomplete="current-password" placeholder="パスワード" />
    <input type="hidden" name="next" value="${escapeHtml(next)}" />
    <button type="submit">閲覧する</button>
  </form>
</body>
</html>`
}

export function proxy(req: NextRequest) {
  const enabled = (OV['site:protect.enabled'] || '') === '1'
  const hash = OV['site:protect.hash'] || ''
  if (!enabled || hash === '') return NextResponse.next()
  if (req.cookies.get(VIEW_COOKIE)?.value === hash) return NextResponse.next()

  const u = req.nextUrl
  const wrong = u.searchParams.get('pw') === 'ng'
  const sp = new URLSearchParams(u.search)
  sp.delete('pw')
  const q = sp.toString()
  const next = u.pathname + (q ? `?${q}` : '')
  return new NextResponse(gateHtml(next, wrong), {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export const config = {
  // 対象：公開ページのみ。API・管理画面・コンソール・静的ファイル
  // （拡張子付きパス＝public/ 配下の画像等）は除外する。
  matcher: ['/((?!api|admin|console|_next|favicon\\.ico|robots\\.txt|.*\\..*).*)'],
}
