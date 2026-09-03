import type { CollectionConfig } from 'payload'

/**
 * メディア（記事用の画像・採用記事のアイキャッチ動画）。
 * 実体はリポジトリの public/posts/ に GitHub 経由でコミットされ、/posts/<ファイル名> で配信される
 * （src/storage/postsStorage.ts。以前の Vercel Blob は 2026-09 に廃止）。
 * Vercel の関数の本文上限のため 1ファイル 4MB まで（payload.config.ts の upload.limits）。
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'メディア', plural: 'メディア' },
  admin: {
    description:
      '記事の本文中で使う画像と、採用記事のアイキャッチ動画（mp4 等）。1ファイル 4MB まで。' +
      '4MB を超える動画はエンジニアに依頼して public/videos/ に配置し、「アイキャッチ動画URL」欄に /videos/ファイル名.mp4 を入力してください。',
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
