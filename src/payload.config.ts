import path from 'path'
import { fileURLToPath } from 'url'

import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { ja } from '@payloadcms/translations/languages/ja'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Interviews } from './collections/Interviews'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Users } from './collections/Users'
import { postsStorageAdapter } from './storage/postsStorage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// 本番（Vercel）で DB（Neon）が接続済みなのに PAYLOAD_SECRET が無い場合は起動を止める。
// プレースホルダーのまま稼働すると推測可能な鍵でセッション署名・暗号化が行われてしまうため。
// DB 未接続（= /admin がそもそも動かない初期セットアップ段階）では警告に留め、
// サイト本体のデプロイは通す。Neon を Connect したら必ず PAYLOAD_SECRET も設定すること。
if (process.env.VERCEL && process.env.POSTGRES_URL && !process.env.PAYLOAD_SECRET) {
  throw new Error(
    'PAYLOAD_SECRET が未設定です。Vercel の Environment Variables に設定してください（openssl rand -hex 32 等で生成）。',
  )
}

// メディア（/admin の記事添付）の 1 ファイルあたりの上限。
// Vercel の関数はリクエスト本文が約 4.5MB までなので、それより少し小さくしておく
// （超えると Vercel 側で 413 になり、管理画面には分かりにくいエラーしか出ない）。
const MEDIA_MAX_BYTES = 4 * 1024 * 1024

export default buildConfig({
  // 本番では必ず PAYLOAD_SECRET を設定すること（.env.example 参照）。
  // フォールバックは「ローカルで env なしでもビルドが通る」ためだけの値
  // （Vercel 上では上の throw により、この値で稼働することはない）。
  secret: process.env.PAYLOAD_SECRET || 'insecure-placeholder-set-payload-secret',

  // GraphQL は本サイトでは未使用（フロントは Local API）。
  // スキーマの外部露出を避けるため丸ごと無効化する。
  graphQL: { disable: true },

  db: vercelPostgresAdapter({
    pool: { connectionString: process.env.POSTGRES_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),

  editor: lexicalEditor(),

  collections: [News, Interviews, Media, Users],

  // 管理画面は日本語を既定にする（個人ごとに英語へ切り替えも可能）。
  i18n: {
    supportedLanguages: { ja, en },
    fallbackLanguage: 'ja',
  },

  admin: {
    user: 'users',
    dateFormat: 'yyyy/MM/dd',
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' - アイスライン 管理' },
  },

  upload: {
    limits: { fileSize: MEDIA_MAX_BYTES },
    abortOnLimit: true,
    responseOnLimit: 'ファイルは 1 つ 4MB までです。画像は縮小してからアップロードしてください。',
  },

  plugins: [
    // メディアの実体は Vercel Blob ではなく、リポジトリの public/posts/ に GitHub 経由で
    // コミットして /posts/<ファイル名> で配信する（2026-09 改修。src/storage/postsStorage.ts）。
    // disablePayloadAccessControl: Media は誰でも閲覧可（access.read = true）なので、
    // Payload の /api/media/file/… を経由せず静的 URL を直接返す。
    cloudStoragePlugin({
      collections: {
        media: { adapter: postsStorageAdapter, disablePayloadAccessControl: true },
      },
    }),
  ],

  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
