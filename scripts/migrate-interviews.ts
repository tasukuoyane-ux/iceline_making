// 旧CMS（src/content/interviews.json）の採用記事（社員インタビュー）を Payload へ移行する。
// slug（= 旧ID）で upsert するため何度実行しても安全（冪等）。
//
// 実行: npm run migrate:interviews
//   （.env に POSTGRES_URL が必要）
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { toBlocks } from '../src/spa/data/blocks'

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
    case 'recruitLink':
      return { blockType: 'recruitLink', job: b.job ?? '', label: b.label ?? '' }
    default:
      throw new Error(`未知のブロック型: ${b.type}`)
  }
}

async function main() {
  const raw = JSON.parse(readFileSync('src/content/interviews.json', 'utf-8')) as any[]
  const payload = await getPayload({ config })

  let created = 0
  let updated = 0
  let order = 0
  for (const iv of raw) {
    const data = {
      slug: String(iv.id),
      name: String(iv.name || ''),
      role: String(iv.role || ''),
      years: String(iv.years || ''),
      lead: String(iv.lead || ''),
      subtitle: String(iv.subtitle || ''),
      // メイン画像は Blob 上の既存URLを src 直書きで引き継ぐ
      imageSrc: String(iv.image || ''),
      category: '社員インタビュー',
      order: order++,
      blocks: toBlocks(iv.blocks ?? iv.paragraphs).map(toPayloadBlock),
      _status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'interviews',
      where: { slug: { equals: iv.id } },
      limit: 1,
      depth: 0,
      draft: true,
    })

    if (existing.docs[0]) {
      await payload.update({ collection: 'interviews', id: existing.docs[0].id, data })
      updated++
      console.log(`更新: ${iv.id} 「${iv.name}」`)
    } else {
      await payload.create({ collection: 'interviews', data })
      created++
      console.log(`作成: ${iv.id} 「${iv.name}」`)
    }
  }

  const total = await payload.count({ collection: 'interviews' })
  console.log(`\n完了: 作成 ${created} 件 / 更新 ${updated} 件（DB内の採用記事数: ${total.totalDocs} 件）`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
