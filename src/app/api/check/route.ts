// GET /api/check —— 公開前チェックリストの自動検査。
//
// 「機械が判定できる項目」を実際のデプロイに対して検査して返す。
// 結果は /console/check で表示する。
//
// 認証必須（コンソールのトークン）。環境変数の有無や内部状態を返すため、
// /api/diag と同様に未認証には出さない。
//
// 注意（当サイトの運用前提）:
//  - 現在は制作中のため意図的に全ページ noindex。noindex の検査は
//    「出ていればOK」の反転判定にしている。公開切替時にこの判定を反転させること
//    （robots.txt / sitemap / canonical の検査も同時に有効化する）。
import contactSettings from '../../../content/contact.json'
import { verifyRequest } from '../_lib/auth'

export const maxDuration = 60

type Status = 'ok' | 'ng' | 'warn' | 'skip'

export interface CheckResult {
  /** 一意なID（表示・デバッグ用） */
  id: string
  /** チェックリストの項目No（任意） */
  no: string
  title: string
  status: Status
  detail: string
  /** NG/警告のときの対応方法 */
  fix?: string
  /** once=環境・アカウント等の初期設定（一度やればOK）／
   *  recurring=デザイン・コンテンツ修正のたびに確認すべき出力系 */
  scope?: 'once' | 'recurring'
}

/** 初期設定系（一度やればOK）の検査ID。それ以外は毎回確認の扱い。 */
const ONCE_IDS = new Set([
  'env-resend', 'env-contact-from', 'env-contact-recipient', 'env-secrets',
  'env-console-users', 'env-blob',
  'db-conn', 'db-admin-user', 'gh-token',
])

/** 自分自身のデプロイURL（プレビューでもそのデプロイ自身を検査する）。 */
function baseUrl(req: Request): string {
  const h = (name: string) => req.headers.get(name) || ''
  const host = h('x-forwarded-host') || h('host') || 'localhost:3000'
  const proto = h('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

function fetchPath(base: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(base + path, {
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
    ...init,
  })
}

const SECURITY_HEADERS = [
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
]

export async function GET(req: Request): Promise<Response> {
  const auth = await verifyRequest(req).catch(() => null)
  if (!auth) {
    return Response.json(
      { error: 'ログインが必要です（コンソールのトークンを Authorization: Bearer で送信）' },
      { status: 401 },
    )
  }

  const base = baseUrl(req)
  const results: CheckResult[] = []
  const push = (r: CheckResult) => results.push(r)

  // ───────────────────────────── 環境変数
  {
    const key = process.env.RESEND_API_KEY
    push({
      id: 'env-resend', no: '—', title: 'フォーム送信（RESEND_API_KEY）',
      status: key ? 'ok' : 'ng',
      detail: key ? '設定済み。実送信テスト（送信先での受信確認）は手動で実施'
                  : '未設定。お問い合わせフォームは送信エラーになる',
      fix: key ? undefined : 'Resend のAPIキーを発行し、環境変数 RESEND_API_KEY に設定して Redeploy',
    })
    const from = process.env.CONTACT_FROM || ''
    const isShared = !from || /resend\.dev/.test(from)
    push({
      id: 'env-contact-from', no: '—', title: '送信ドメイン認証（CONTACT_FROM）',
      status: isShared ? 'warn' : 'ok',
      detail: isShared
        ? `共有ドメインの差出人（${from || 'onboarding@resend.dev'}）。迷惑メール判定のリスクあり`
        : `自社ドメインの差出人（${from}）`,
      fix: isShared ? 'Resend でドメイン認証（SPF/DKIM/DMARC）を行い、CONTACT_FROM を自社ドメインのアドレスへ' : undefined,
    })
    const recipient = (contactSettings?.recipient || process.env.CONTACT_RECIPIENT || '').trim()
    push({
      id: 'env-contact-recipient', no: '—', title: 'お問い合わせの送信先',
      status: recipient ? 'ok' : 'ng',
      detail: recipient
        ? `設定済み（${contactSettings?.recipient ? 'コンソールの「お問い合わせ設定」' : '環境変数 CONTACT_RECIPIENT'}）`
        : '未設定。フォーム送信がエラーになる',
      fix: recipient ? undefined : '/console のお問い合わせページ「お問い合わせ設定」で送信先を設定して公開（または CONTACT_RECIPIENT を設定）',
    })
    const weak: string[] = []
    for (const name of ['JWT_SECRET', 'PAYLOAD_SECRET'] as const) {
      const v = process.env[name]
      if (!v) weak.push(`${name}: 未設定`)
      else if (v.length < 32) weak.push(`${name}: 短い（${v.length}文字）`)
    }
    push({
      id: 'env-secrets', no: '—', title: 'シークレットの設定と強度',
      status: weak.length === 0 ? 'ok' : 'ng',
      detail: weak.length === 0 ? 'JWT_SECRET / PAYLOAD_SECRET とも32文字以上で設定済み' : weak.join('、'),
      fix: weak.length ? 'openssl rand -hex 32 等で生成した値を設定して Redeploy' : undefined,
    })
    const raw = process.env.CONSOLE_USERS
    let cu: { status: Status; detail: string } = { status: 'ng', detail: '未設定' }
    if (raw) {
      try {
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr) || arr.length === 0) cu = { status: 'ng', detail: '配列でない、または0件' }
        else {
          const broken = arr.filter((u: { passwordHash?: string }) =>
            typeof u?.passwordHash !== 'string' || !/^\$2[aby]\$\d{2}\$.{53}$/.test(u.passwordHash),
          ).length
          cu = broken
            ? { status: 'ng', detail: `${arr.length}件中${broken}件のハッシュが壊れている（$の展開事故？）` }
            : { status: 'ok', detail: `${arr.length}アカウント・ハッシュ形式OK` }
        }
      } catch {
        cu = { status: 'ng', detail: 'JSONとして読めない' }
      }
    }
    push({
      id: 'env-console-users', no: '—', title: 'コンソールのアカウント設定（CONSOLE_USERS）',
      status: cu.status, detail: cu.detail,
      fix: cu.status === 'ok' ? undefined : 'ダッシュボードから1行JSONで貼り直す（シェル経由は$が展開されて壊れる）',
    })
    const blob = Object.entries(process.env).some(
      ([k, v]) => /READ_WRITE_TOKEN$/.test(k) && v?.startsWith('vercel_blob_rw_'),
    )
    push({
      id: 'env-blob', no: '—', title: 'Vercel Blob 接続',
      status: blob ? 'ok' : 'ng',
      detail: blob ? '読み書きトークンあり' : 'トークンが見つからない（画像・動画のアップロード不可）',
      fix: blob ? undefined : 'Storage > Blob で public ストアを作成して Connect（詳細は /api/diag）',
    })
  }

  // ───────────────────────────── 自サイトへのHTTP検査
  try {
    const res = await fetchPath(base, '/')
    const html = res.status === 200 ? await res.text() : ''

    const missing = SECURITY_HEADERS.filter((h) => !res.headers.get(h))
    push({
      id: 'http-sec-headers', no: '—', title: 'セキュリティヘッダー',
      status: missing.length === 0 ? 'ok' : 'ng',
      detail: missing.length === 0 ? '5種（HSTS/nosniff/SAMEORIGIN/Referrer/Permissions）を確認' : `不足: ${missing.join(', ')}`,
      fix: missing.length ? 'next.config.ts の headers() を確認' : undefined,
    })

    // 当サイトは制作中のため意図的に全ページ noindex（判定は一般のサイトと逆）。
    const xrobots = res.headers.get('x-robots-tag') || ''
    const metaNoindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)
    const hasNoindex = /noindex/i.test(xrobots) || metaNoindex
    push({
      id: 'http-noindex', no: '—', title: 'noindex（非公開運用）の維持',
      status: hasNoindex ? 'ok' : 'ng',
      detail: hasNoindex
        ? '想定どおり noindex が出ている（制作中の非公開運用）'
        : 'noindex が外れている。公開前に意図せず検索インデックスされる恐れ',
      fix: hasNoindex
        ? '公開切替時: layout.tsx の metadata.robots を外し、この検査の判定を反転させる（robots.txt / sitemap も追加）'
        : '(frontend)/layout.tsx の metadata.robots を確認（最優先）',
    })

    const checksInHtml: Array<[string, string, RegExp, string, string]> = [
      // id, no, pattern, okDetail, ngFix
      ['http-h1', '—', /<h1[\s>]/i, 'h1 あり', 'ページに h1 を追加する（SPA描画後のみの場合は対象外）'],
      ['http-og', '—', /property="og:title"/i, 'OGP（og:title）出力あり', 'metadata の openGraph を確認'],
      ['http-twitter', '—', /name="twitter:card"/i, 'Twitter Card 出力あり', 'metadata.twitter を確認'],
      ['http-lang', '—', /<html[^>]+lang="ja"/i, 'html lang="ja"', '(frontend)/layout.tsx の lang を確認'],
    ]
    for (const [id, no, re, okDetail, fix] of checksInHtml) {
      const hit = re.test(html)
      push({ id, no, title: okDetail.split('（')[0], status: hit ? 'ok' : id === 'http-h1' ? 'warn' : 'ng', detail: hit ? okDetail : '出力が見つからない', fix: hit ? undefined : fix })
    }

    const viewports = (html.match(/name="viewport"/g) || []).length
    push({
      id: 'http-viewport', no: '—', title: 'viewport の出力回数',
      status: viewports === 1 ? 'ok' : 'ng',
      detail: `${viewports}回`,
      fix: viewports === 1 ? undefined : '二重出力の原因（手書きmeta等）を除去',
    })

    const ogImage = /property="og:image"/i.test(html)
    push({
      id: 'http-og-image', no: '—', title: 'OGP画像の設定',
      status: ogImage ? 'ok' : 'warn',
      detail: ogImage ? 'og:image 出力あり' : 'og:image が未出力（コンソールのSEOタブで既定画像が未設定）',
      fix: ogImage ? undefined : '/console の SEO タブで既定OGP画像を設定して公開（SNSでの見え方に直結）',
    })
  } catch (e) {
    push({ id: 'http-top', no: '—', title: 'トップページの取得', status: 'ng', detail: `取得失敗: ${String((e as Error)?.message || e)}` })
  }

  // 個別URLの検査
  const probe = async (
    id: string, no: string, title: string, path: string,
    judge: (res: Response, body: string) => { status: Status; detail: string; fix?: string },
    init?: RequestInit,
  ) => {
    try {
      const res = await fetchPath(base, path, init)
      const body = await res.text().catch(() => '')
      push({ id, no, title, ...judge(res, body) })
    } catch (e) {
      push({ id, no, title, status: 'ng', detail: `取得失敗: ${String((e as Error)?.message || e)}` })
    }
  }

  // noindex 運用中は robots.txt / sitemap / canonical は対象外（公開切替時に有効化）
  push({ id: 'http-robots', no: '—', title: 'robots.txt', status: 'skip', detail: 'noindex 運用中のため対象外。公開切替時に robots.ts を追加してこの検査を有効化する' })
  push({ id: 'http-sitemap', no: '—', title: 'sitemap.xml', status: 'skip', detail: 'noindex 運用中のため対象外。公開切替時に sitemap.ts を追加してこの検査を有効化する' })
  push({ id: 'http-canonical', no: '—', title: 'canonical', status: 'skip', detail: 'noindex 運用中のため対象外。公開切替時に metadata.alternates.canonical を追加してこの検査を有効化する' })
  // 未知URLは旧構成（Vite + SPA rewrite）と同じく 200 でトップを表示する設計のため、404検査は対象外
  push({ id: 'http-404', no: '—', title: '存在しないURLの応答', status: 'skip', detail: '現状は全URLが 200 でトップ表示（旧構成と同じ設計）。公開切替時に 404 ページの導入を検討する' })

  await probe('http-contact-api', '—', 'フォームAPIの入力検証', '/api/contact', (res) => (
    res.status >= 400 && res.status < 500
      ? { status: 'ok', detail: `空POSTに HTTP ${res.status}（入力検証が働いている）` }
      : { status: 'ng', detail: `空POSTに HTTP ${res.status}`, fix: '/api/contact の実装（必須項目チェック）を確認' }
  ), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })

  await probe('http-graphql', '—', 'GraphQL の無効化', '/api/graphql', (res) => (
    res.status === 404
      ? { status: 'ok', detail: 'POST が 404（無効化済み）' }
      : { status: 'ng', detail: `HTTP ${res.status}`, fix: 'payload.config.ts の graphQL.disable を確認' }
  ), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"query":"{ __typename }"}' })

  // ───────────────────────────── DB（Payload）
  try {
    if (!process.env.POSTGRES_URL) {
      push({ id: 'db-conn', no: '—', title: 'DB接続（Neon / Payload）', status: 'ng', detail: 'POSTGRES_URL 未設定。/admin（記事管理）と手動リストのチーム共有が使えない', fix: 'Vercel Storage > Neon を Connect し、PAYLOAD_SECRET も設定する' })
    } else {
      const { getPayload } = await import('payload')
      const { default: config } = await import('@payload-config')
      const payload = await getPayload({ config })
      push({ id: 'db-conn', no: '—', title: 'DB接続（Neon / Payload）', status: 'ok', detail: '接続OK' })
      const users = await payload.find({ collection: 'users', limit: 1, depth: 0 })
      push({
        id: 'db-admin-user', no: '—', title: '/admin の管理ユーザー',
        status: users.totalDocs > 0 ? 'ok' : 'ng',
        detail: users.totalDocs > 0 ? `${users.totalDocs}名` : '0名。初回アクセス者が管理者になれる状態',
        fix: users.totalDocs > 0 ? undefined : '今すぐ /admin で会社の管理者アカウントを作成する（最優先）',
      })
      const published = await payload.find({ collection: 'news', where: { _status: { equals: 'published' } }, limit: 1, depth: 0 })
      push({
        id: 'db-news', no: '—', title: 'お知らせ記事の取込',
        status: published.totalDocs > 0 ? 'ok' : 'warn',
        detail: `公開記事 ${published.totalDocs}件${published.totalDocs === 0 ? '（未移行なら pnpm migrate:news を実行。0件の間は news.json の内容が表示される）' : ''}`,
      })
    }
  } catch (e) {
    push({ id: 'db-conn', no: '—', title: 'DB接続（Neon / Payload）', status: 'ng', detail: String((e as Error)?.message || e) })
  }

  // ───────────────────────────── GitHub（コンソールの公開フロー）
  {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      push({ id: 'gh-token', no: '—', title: 'GitHubトークン', status: 'ng', detail: '未設定。コンソールの公開が動かない', fix: 'Fine-grained token（対象リポジトリのContents書き込みのみ）を発行して設定' })
    } else {
      try {
        const r = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'iceline-check' },
          signal: AbortSignal.timeout(8000),
        })
        const body: { permissions?: { push?: boolean } } | null = r.ok ? await r.json() : null
        const exp = r.headers.get('github-authentication-token-expiration')
        push({
          id: 'gh-token', no: '—', title: 'GitHubトークン',
          status: r.ok && body?.permissions?.push ? 'ok' : 'ng',
          detail: r.ok
            ? `有効・push${body?.permissions?.push ? '可' : '不可'}${exp ? `・期限 ${exp}` : '・期限情報なし（classicの可能性→Fine-grained推奨）'}`
            : r.status === 401 ? '無効・期限切れ' : `応答 ${r.status}`,
          fix: r.ok && body?.permissions?.push ? undefined : 'トークンを再発行（Fine-grained・対象リポジトリ限定・期限管理）',
        })
      } catch (e) {
        push({ id: 'gh-token', no: '—', title: 'GitHubトークン', status: 'warn', detail: `確認できず: ${String((e as Error)?.message || e)}` })
      }
    }
  }

  const counts = { ok: 0, ng: 0, warn: 0, skip: 0 }
  for (const r of results) {
    counts[r.status]++
    r.scope = ONCE_IDS.has(r.id) ? 'once' : 'recurring'
  }

  return Response.json({
    meta: {
      base,
      vercelEnv: process.env.VERCEL_ENV || 'local',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
      checkedAt: new Date().toISOString(),
      counts,
    },
    results,
  })
}
