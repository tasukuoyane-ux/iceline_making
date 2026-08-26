import type { Block } from 'payload'
import recruitJson from '../content/recruit.json'

// 求人エントリーリンク用の職種一覧（採用CMSのデータから生成。
// 職種の追加・変更は次のデプロイで案内文に反映される）
export const RECRUIT_JOB_OPTIONS: { value: string; label: string }[] = (
  (recruitJson as any).jobs ?? []
).map((j: { id: string; title: string; dept: string }) => ({
  value: j.id,
  label: `${j.title}（${j.dept}）`,
}))

/**
 * 記事本文のブロック定義（お知らせ・採用記事で共通）。
 * 旧CMSと同じブロック構造（paragraph / h2 / h3 / image / video / recruitLink）で保持し、
 * 公開サイトは既存の BlockContent コンポーネントでそのまま描画する（表示の互換性を維持）。
 */
export const ARTICLE_BLOCKS: Block[] = [
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
          description: '**太字**、==マーカー== が使えます。改行はそのまま反映されます。',
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
  {
    slug: 'recruitLink',
    labels: { singular: '求人エントリーリンク', plural: '求人エントリーリンク' },
    fields: [
      {
        // DB上は text 型（select にすると Postgres の enum になり、
        // コンソールで職種を追加するたびに DB マイグレーションが必要になるため）。
        // 管理画面ではカスタムコンポーネント（JobSelectField）により、
        // /console で登録されている職種のドロップダウンとして表示される。
        name: 'job',
        type: 'text',
        required: true,
        label: '職種',
        admin: {
          description:
            '採用ページの該当職種のエントリーフォームへのリンクボタンになります（記事の末尾に置くのがおすすめです）。職種の追加・変更は公開（デプロイ）後に選択肢へ反映されます。',
          components: {
            Field: '/components/payload/JobSelectField#JobSelectField',
          },
        },
        hooks: {
          // コピー＆ペースト由来の前後の空白でリンクが壊れないように保存時に除去
          beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)],
        },
      },
      {
        name: 'label',
        type: 'text',
        label: 'ボタン文言',
        admin: { description: '空欄なら「この職種にエントリーする」と表示されます。' },
      },
    ],
  },
]
