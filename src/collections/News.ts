import type { CollectionConfig } from 'payload'

/** 日付（ISO文字列）を日本時間の YYYY-MM-DD にする（slug 自動生成用）。 */
function jstDatePart(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** 記事の公開・更新・削除時に、公開サイト側のキャッシュを再検証する。
 * Next のリクエストコンテキスト外（移行スクリプト等）では失敗するので握りつぶす。 */
async function revalidateNews(): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout') // 一覧・TOP・詳細（catch-all 配下すべて）
    revalidatePath('/api/news')
  } catch {
    /* no-op（migrate スクリプトなど Next コンテキスト外） */
  }
}

/**
 * お知らせ記事。本文は旧CMS（news.json）と同じブロック構造
 * （paragraph / h2 / h3 / image / video）で保持し、公開サイトは既存の
 * BlockContent コンポーネントでそのまま描画する（表示の互換性を維持）。
 */
export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'お知らせ', plural: 'お知らせ' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'date', '_status'],
    description: '公開サイトの「お知らせ」（/news）に表示される記事。',
    listSearchableFields: ['title', 'slug'],
  },
  versions: { drafts: true },
  access: {
    // 公開済みの記事だけを未ログインでも読めるようにする。
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  hooks: {
    afterChange: [revalidateNews],
    afterDelete: [revalidateNews],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'タイトル' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'ID（URL）',
      admin: {
        position: 'sidebar',
        description:
          '記事のURL（/news/◯◯）になります。空のまま保存すると日付から自動で作られます。公開後の変更はリンク切れのもとになるので避けてください。',
      },
      hooks: {
        beforeValidate: [
          // 空なら日付から `n-YYYY-MM-DD` を生成（旧CMSのID形式と同じ）。
          // 同じ日に複数件あるときは -2, -3 … を付けて重複を避ける。
          async ({ value, data, req, originalDoc }) => {
            const v = typeof value === 'string' ? value.trim() : ''
            if (v) return v
            const date = jstDatePart(String(data?.date || '')) || jstDatePart(new Date().toISOString())
            const base = `n-${date}`
            let candidate = base
            for (let i = 2; i < 100; i++) {
              const dup = await req.payload.find({
                collection: 'news',
                where: { slug: { equals: candidate } },
                limit: 1,
                depth: 0,
                draft: true,
              })
              const hit = dup.docs[0]
              if (!hit || (originalDoc && hit.id === originalDoc.id)) return candidate
              candidate = `${base}-${i}`
            }
            return candidate
          },
        ],
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: '日付',
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy/MM/dd' },
        description: '一覧に表示される日付。新しい順に並びます。',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'カテゴリ',
      defaultValue: 'お知らせ',
      options: ['お知らせ', '製品', '採用', 'メディア'],
      admin: { position: 'sidebar' },
    },
    {
      name: 'blocks',
      type: 'blocks',
      label: '本文',
      minRows: 1,
      blocks: [
        {
          slug: 'paragraph',
          labels: { singular: '段落', plural: '段落' },
          fields: [
            {
              name: 'text',
              type: 'textarea',
              required: true,
              label: '本文',
              admin: {
                description:
                  '**太字**、==マーカー== が使えます。改行はそのまま反映されます。',
              },
            },
          ],
        },
        {
          slug: 'h2',
          labels: { singular: '見出し（大）', plural: '見出し（大）' },
          fields: [{ name: 'text', type: 'text', required: true, label: '見出し' }],
        },
        {
          slug: 'h3',
          labels: { singular: '見出し（中）', plural: '見出し（中）' },
          fields: [{ name: 'text', type: 'text', required: true, label: '見出し' }],
        },
        {
          slug: 'image',
          labels: { singular: '画像', plural: '画像' },
          fields: [
            {
              name: 'media',
              type: 'upload',
              relationTo: 'media',
              label: '画像',
              admin: { description: '通常はこちらにアップロードしてください。' },
            },
            {
              name: 'src',
              type: 'text',
              label: '画像URL（外部/移行データ用）',
              admin: {
                description: '通常は上の「画像」を使用。両方ある場合は「画像」が優先されます。',
              },
            },
            { name: 'href', type: 'text', label: 'リンク先URL' },
            { name: 'alt', type: 'text', label: 'キャプション（alt）' },
          ],
        },
        {
          slug: 'video',
          labels: { singular: '動画', plural: '動画' },
          fields: [
            {
              name: 'src',
              type: 'text',
              required: true,
              label: '動画URL',
              admin: { description: 'YouTube/Vimeo の共有URL、または mp4 直リンク。' },
            },
            { name: 'caption', type: 'text', label: 'キャプション' },
          ],
        },
      ],
    },
  ],
}
