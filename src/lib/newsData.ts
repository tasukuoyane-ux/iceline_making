// お知らせ記事の取得層（サーバ専用）。
// Payload（Neon Postgres）から公開記事を取得し、公開サイトが従来使ってきた
// NewsItem 形（src/spa/data/news.ts と同じ）へ変換して返す。
// DB 未設定（POSTGRES_URL なし）や記事0件のときは、移行元の news.json に
// フォールバックする（Payload 移行前後で表示が欠けないための保険）。
import config from '@payload-config'
import { getPayload } from 'payload'
import newsJson from '../content/news.json'
import { Block, toBlocks } from '../spa/data/blocks'

export interface NewsItemData {
  id: string
  date: string
  category: string
  title: string
  blocks: Block[]
}

/** ISO日時 → "YYYY.MM.DD"（必ず日本時間で整形。Vercel は UTC のため
 * サーバーローカル時刻で整形すると日付が1日ずれることがある）。 */
export function formatDateJST(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(d)
    .replace(/\//g, '.')
}

/** Payload の blocks フィールド1件 → 公開サイトの Block 型。 */
function toBlock(b: any): Block | null {
  switch (b?.blockType) {
    case 'paragraph':
      return { type: 'paragraph', text: String(b.text ?? '') }
    case 'h2':
      return { type: 'h2', text: String(b.text ?? '') }
    case 'h3':
      return { type: 'h3', text: String(b.text ?? '') }
    case 'image': {
      // media（アップロード）優先、なければ src 直書き（移行データ・外部URL）。
      const media = typeof b.media === 'object' && b.media ? b.media : null
      const src = String(media?.url || b.src || '')
      if (!src) return null
      const alt = String(b.alt || media?.alt || '')
      return {
        type: 'image',
        src,
        ...(b.href ? { href: String(b.href) } : {}),
        ...(alt ? { alt } : {}),
      }
    }
    case 'video': {
      const src = String(b.src ?? '')
      if (!src) return null
      return { type: 'video', src, ...(b.caption ? { caption: String(b.caption) } : {}) }
    }
    case 'recruitLink': {
      const job = String(b.job ?? '')
      if (!job) return null
      return { type: 'recruitLink', job, ...(b.label ? { label: String(b.label) } : {}) }
    }
    default:
      return null
  }
}

export function toNewsItem(doc: any): NewsItemData {
  return {
    id: String(doc.slug ?? doc.id),
    date: formatDateJST(String(doc.date ?? '')),
    category: String(doc.category ?? 'お知らせ'),
    title: String(doc.title ?? ''),
    blocks: (Array.isArray(doc.blocks) ? doc.blocks : [])
      .map(toBlock)
      .filter(Boolean) as Block[],
  }
}

/** 移行元 news.json（旧CMSのデータ）を NewsItem 形で返す。 */
export function fallbackNews(): NewsItemData[] {
  return (newsJson as any[]).map((n) => ({
    id: n.id,
    date: n.date,
    category: n.category,
    title: n.title,
    blocks: toBlocks(n.blocks ?? n.body),
  }))
}

/** DB 未設定のときは null（ビルドを落とさない）。 */
async function getPayloadSafe() {
  if (!process.env.POSTGRES_URL) return null
  try {
    return await getPayload({ config })
  } catch {
    return null
  }
}

/**
 * 公開済みのお知らせ一覧（新しい順）。
 * DB 接続済みで記事が1件でもあれば Payload が正、それ以外は news.json。
 * DB 接続後の取得エラーは throw する（ISR が古いキャッシュを保持し続けるため、
 * 一時的な DB 障害で「お知らせ0件」が焼き込まれるのを防ぐ）。
 */
export async function fetchPublishedNews(): Promise<NewsItemData[]> {
  const payload = await getPayloadSafe()
  if (!payload) return fallbackNews()
  const res = await payload.find({
    collection: 'news',
    where: { _status: { equals: 'published' } },
    sort: ['-date', '-createdAt'],
    limit: 100,
    depth: 1,
    draft: false,
  })
  if (res.docs.length === 0) return fallbackNews()
  return res.docs.map(toNewsItem)
}

/** slug（旧CMSのID）で1件取得。見つからなければ null。 */
export async function fetchNewsById(id: string): Promise<NewsItemData | null> {
  const payload = await getPayloadSafe()
  if (!payload) return fallbackNews().find((n) => n.id === id) ?? null
  const res = await payload.find({
    collection: 'news',
    where: {
      and: [{ slug: { equals: id } }, { _status: { equals: 'published' } }],
    },
    limit: 1,
    depth: 1,
    draft: false,
  })
  const doc = res.docs[0]
  if (!doc) {
    // DB 稼働中でも移行前の残りがあり得るため news.json も見る
    return fallbackNews().find((n) => n.id === id) ?? null
  }
  return toNewsItem(doc)
}
