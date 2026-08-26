import type { CollectionConfig } from 'payload'
import { ARTICLE_BLOCKS } from './articleBlocks'

/** 記事の公開・更新・削除時に、公開サイト側のキャッシュを再検証する。
 * Next のリクエストコンテキスト外（移行スクリプト等）では失敗するので握りつぶす。 */
async function revalidateInterviews(): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
    revalidatePath('/api/interviews')
  } catch {
    /* no-op（migrate スクリプトなど Next コンテキスト外） */
  }
}

/**
 * 採用記事（社員インタビュー等）。公開サイトの採用ページ「人を知る」カルーセルと
 * 記事ページ（/recruit/interview/◯◯）に表示される。
 * 本文は旧CMS（interviews.json）と同じブロック構造で保持し、既存の
 * BlockContent コンポーネントでそのまま描画する（表示の互換性を維持）。
 * 求人エントリーリンク（特定職種のエントリーフォームへの導線）ブロックも使える。
 */
export const Interviews: CollectionConfig = {
  slug: 'interviews',
  labels: { singular: '採用記事', plural: '採用記事' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'lead', 'order', '_status'],
    description: '採用ページの「人を知る」と記事ページ（/recruit/interview/◯◯）に表示される記事。',
    listSearchableFields: ['name', 'lead', 'slug', 'category'],
  },
  versions: { drafts: true },
  defaultSort: 'order',
  access: {
    // 公開済みの記事だけを未ログインでも読めるようにする。
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  hooks: {
    afterChange: [revalidateInterviews],
    afterDelete: [revalidateInterviews],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: '氏名（表示名）' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'ID（URL）',
      admin: {
        position: 'sidebar',
        description:
          '記事のURL（/recruit/interview/◯◯）になります。空のまま保存すると自動で作られます。公開後の変更はリンク切れのもとになるので避けてください。',
      },
      hooks: {
        beforeValidate: [
          // 空なら `iv-<ランダム>` を生成（旧CMSのID形式と同じ）。
          async ({ value }) => {
            const v = typeof value === 'string' ? value.trim() : ''
            if (v) return v
            return `iv-${Math.random().toString(36).slice(2, 10)}`
          },
        ],
      },
    },
    {
      // カテゴリーは自由入力（select にすると Postgres の enum になり、
      // カテゴリー追加のたびに DB マイグレーションが必要になるため text 型）。
      name: 'category',
      type: 'text',
      required: true,
      label: 'カテゴリー',
      defaultValue: '社員インタビュー',
      admin: {
        position: 'sidebar',
        description:
          '記事の分類（例: 社員インタビュー／座談会／仕事紹介）。一覧の絞り込みと、採用ページのカードのラベルに使われます。',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: '表示順',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: '採用ページのカルーセルの並び順（小さい順）。同じ値は作成順。',
      },
    },
    { name: 'role', type: 'text', label: '所属・役職', admin: { description: '例: アイス事業部 製造｜オペレーター' } },
    { name: 'years', type: 'text', label: '在籍年数など', admin: { description: '例: 入社5年目（任意）' } },
    { name: 'lead', type: 'text', required: true, label: '見出しコピー（記事タイトル）' },
    { name: 'subtitle', type: 'text', label: 'サブタイトル' },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'メイン画像',
      admin: { description: '記事ページのヒーローと「人を知る」カードに表示。通常はこちらにアップロード。' },
    },
    {
      name: 'imageSrc',
      type: 'text',
      label: 'メイン画像URL（外部/移行データ用）',
      admin: { description: '通常は上の「メイン画像」を使用。両方ある場合は「メイン画像」が優先されます。' },
    },
    {
      name: 'blocks',
      type: 'blocks',
      label: '本文',
      minRows: 1,
      // ブロック定義はお知らせ（news）と共通（articleBlocks.ts）。
      // 「求人エントリーリンク」で特定職種のエントリーフォームへの導線を置ける
      blocks: ARTICLE_BLOCKS,
    },
  ],
}
