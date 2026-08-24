// サイト閲覧パスワードの認証。ゲートページ（src/proxy.ts）のフォームから
// POST され、SHA-256 ハッシュが一致したら閲覧 Cookie（値＝ハッシュ）を発行する。
// パスワードを変更するとハッシュが変わるため、既存 Cookie は自動的に無効になる。
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import overridesData from '../../../content/overrides.json'

const VIEW_COOKIE = 'iceline_view'
const COOKIE_DAYS = 30

export async function POST(req: Request) {
  const fd = await req.formData()
  const pw = String(fd.get('password') ?? '')
  let next = String(fd.get('next') ?? '/')
  if (!next.startsWith('/') || next.startsWith('//')) next = '/'

  const stored = (overridesData as Record<string, string>)['site:protect.hash'] || ''
  const digest = createHash('sha256').update(pw, 'utf8').digest('hex')
  const url = new URL(next, new URL(req.url).origin)

  if (stored !== '' && digest === stored) {
    const res = NextResponse.redirect(url, 303)
    res.cookies.set(VIEW_COOKIE, digest, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * COOKIE_DAYS,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  }
  url.searchParams.set('pw', 'ng')
  return NextResponse.redirect(url, 303)
}
