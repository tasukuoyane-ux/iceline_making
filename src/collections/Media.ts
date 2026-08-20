import type { CollectionConfig } from 'payload'

/**
 * メディア（お知らせ記事用の画像）。実体は Vercel Blob に保存される
 * （payload.config.ts の vercelBlobStorage プラグイン）。
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'メディア', plural: 'メディア' },
  admin: { description: 'お知らせ記事の本文中で使う画像。' },
  access: { read: () => true },
  upload: {
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: '代替テキスト',
      admin: { description: '画像の内容の説明（目の不自由な方の読み上げ・SEO用）。' },
    },
  ],
}
