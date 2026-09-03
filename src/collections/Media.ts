import type { CollectionConfig } from 'payload'

/**
 * メディア（記事用の画像・採用記事のアイキャッチ動画）。
 * 実体は本番では Vercel Blob（ブラウザから直接アップロード。大きな動画も可）、
 * Blob 未設定の環境では public/posts/（src/storage/postsStorage.ts）に保存される。
 * 切り替えは payload.config.ts を参照。
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'メディア', plural: 'メディア' },
  admin: {
    description:
      '記事の本文中で使う画像と、採用記事のアイキャッチ動画（mp4 等）。動画もそのままアップロードできます（ブラウザから直接保存されるため、容量の大きな動画でも可。ただし表示速度のため 1 本 50MB 程度までを推奨）。',
  },
  access: { read: () => true },
  upload: {
    // 動画は採用記事の「アイキャッチ動画（ファイル）」用（2026-09 追加）
    mimeTypes: ['image/*', 'video/*'],
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
