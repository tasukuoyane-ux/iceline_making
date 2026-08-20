// 旧CMS（src/content/news.json）のお知らせ記事を Payload へ移行する。
// slug（= 旧ID）で upsert するため何度実行しても安全（冪等）。
//
// 実行: pnpm migrate:news
//   （.env に POSTGRES_URL / PAYLOAD_SECRET が必要）
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { toBlocks } from '../src/spa/data/blocks'

/** "2026.06.01" → "2026-06-01T00:00:00+09:00"（日本時間の0時としてパース） */
function parseDateJST(s: string): string {
  const m = String(s).match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (!m) throw new Error(`日付の形式が不正です: ${s}`)
  const [, y, mo, d] = m
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00+09:00`
}

/** 公開サイトの Block 型 → Payload の blocks フィールド形式 */
function toPayloadBlock(b: any): Record<string, unknown> {
  switch (b.type) {
    case 'paragraph':
    case 'h2':
    case 'h3':
      return { blockType: b.type, text: b.text ?? '' }
    case 'image':
      // 画像は Blob 上の既存URLをそのまま src 直書きで引き継ぐ（Media 再登録しない）
      return { blockType: 'image', src: b.src ?? '', href: b.href ?? '', alt: b.alt ?? '' }
    case 'video':
      return { blockType: 'video', src: b.src ?? '', caption: b.caption ?? '' }
    default:
      throw new Error(`未知のブロック型: ${b.type}`)
  }
}

async function main() {
  const raw = JSON.parse(readFileSync('src/content/news.json', 'utf-8')) as any[]
  const payload = await getPayload({ config })

  let created = 0
  let updated = 0
  for (const n of raw) {
    const data = {
      title: String(n.title || ''),
      slug: String(n.id),
      date: parseDateJST(String(n.date)),
      category: String(n.category || 'お知らせ'),
      blocks: toBlocks(n.blocks ?? n.body).map(toPayloadBlock),
      _status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'news',
      where: { slug: { equals: n.id } },
      limit: 1,
      depth: 0,
      draft: true,
    })

    if (existing.docs[0]) {
      await payload.update({ collection: 'news', id: existing.docs[0].id, data })
      updated++
      console.log(`更新: ${n.id} 「${n.title}」`)
    } else {
      await payload.create({ collection: 'news', data })
      created++
      console.log(`作成: ${n.id} 「${n.title}」`)
    }
  }

  const total = await payload.count({ collection: 'news' })
  console.log(`\n完了: 作成 ${created} 件 / 更新 ${updated} 件（DB内の記事数: ${total.totalDocs} 件）`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
