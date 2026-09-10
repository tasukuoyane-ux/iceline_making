import path from 'path'
import { fileURLToPath } from 'url'

import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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

/**
 * Blob の read-write トークンを名前を問わず探す。
 * Vercel はストア名によって `<ストア名>_READ_WRITE_TOKEN` で注入することがある。
 */
function findBlobToken(): string | undefined {
  const direct = process.env.BLOB_READ_WRITE_TOKEN
  if (direct?.startsWith('vercel_blob_rw_')) return direct
  for (const [key, value] of Object.entries(process.env)) {
    if (/READ_WRITE_TOKEN$/.test(key) && value?.startsWith('vercel_blob_rw_')) {
      return value
    }
  }
  return undefined
}

const blobToken = findBlobToken()

// 本番（Vercel）で DB（Neon）が接続済みなのに PAYLOAD_SECRET が無い場合は起動を止める。
// プレースホルダーのまま稼働すると推測可能な鍵でセッション署名・暗号化が行われてしまうため。
// DB 未接続（= /admin がそもそも動かない初期セットアップ段階）では警告に留め、
// サイト本体のデプロイは通す。Neon を Connect したら必ず PAYLOAD_SECRET も設定すること。
if (process.env.VERCEL && process.env.POSTGRES_URL && !process.env.PAYLOAD_SECRET) {
  throw new Error(
    'PAYLOAD_SECRET が未設定です。Vercel の Environment Variables に設定してください（openssl rand -hex 32 等で生成）。',
  )
}

// GitHub コミット保存（Blob 未設定時のフォールバック）での 1 ファイル上限。
// Vercel の関数はリクエスト本文が約 4.5MB までなので、それより少し小さくしておく。
// Blob 有効時はブラウザから Blob へ直接送るため、この上限は掛からない。
const GITHUB_MEDIA_MAX_BYTES = 4 * 1024 * 1024

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

  ...(blobToken
    ? {}
    : {
        upload: {
          limits: { fileSize: GITHUB_MEDIA_MAX_BYTES },
          abortOnLimit: true,
          responseOnLimit: 'ファイルは 1 つ 4MB までです。画像は縮小してからアップロードしてください。',
        },
      }),

  // メディア（/admin の記事添付：画像・動画）の保存先。
  //  - 本番: Vercel Blob（2026-09-03 に Pro 化に伴い復帰）。ブラウザから Blob へ直接アップロード
  //    するので大きな動画も扱える。disablePayloadAccessControl で Blob の URL を直接返す
  //    （Media は誰でも閲覧可なので /api/media/file/… を経由させない）。
  //  - Blob トークンが無い環境（ローカル開発など）: public/posts/ への保存
  //    （src/storage/postsStorage.ts。Vercel 上なら GitHub コミット、ローカルなら直接書き込み）。
  // vercelBlobStorage は無効時でも呼ぶこと（管理画面の importMap にクライアント側
  // アップロード処理を登録するため。呼ばないとローカルで生成した importMap が本番で欠ける）。
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(blobToken),
      collections: { media: { disablePayloadAccessControl: true } },
      token: blobToken,
      clientUploads: true,
    }),
    ...(blobToken
      ? []
      : [
          cloudStoragePlugin({
            collections: {
              media: { adapter: postsStorageAdapter, disablePayloadAccessControl: true },
            },
          }),
        ]),
  ],

  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
