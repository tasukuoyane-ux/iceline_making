// /admin（Payload）のメディア（記事の画像・小さな動画）の保存先アダプタ（2026-09 改修）。
//
// 以前は Vercel Blob に保存していたが、Blob の利用上限超過でストアがブロックされると
// 記事の画像がすべて消える事故が起きたため、/console の画像（public/uploads/）と同じく
// リポジトリの public/posts/ に GitHub 経由でコミットする方式に変更した。
//  - 本番（Vercel）: GitHub の Git Data API で public/posts/<ファイル名> をコミット。
//    デプロイが走り、以後は静的ファイル（CDN）として /posts/<ファイル名> で配信される。
//    デプロイ完了までの数分間は src/app/posts/[name]/route.ts が GitHub から取得して配信する
//    （静的ファイルが存在すればそちらが優先されるので、デプロイ後は関数を通らない）。
//  - ローカル開発: public/posts/ に直接書き込む（GitHub は使わない）。コミットは開発者が行う。
//  - Vercel の関数はリクエスト本文が約4.5MBまでのため、1ファイル 4MB が上限
//    （payload.config.ts の upload.limits）。大きな動画は public/videos/ に手動配置して URL 欄へ。
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

import { commitFiles, fetchRepoFile } from '../app/api/_lib/github'

/** リポジトリ内の保存先ディレクトリ（public/ 配下 → URL は /posts/…） */
export const POSTS_DIR = 'public/posts'
/** 公開 URL のプレフィックス */
export const POSTS_URL_PREFIX = '/posts'

/** GitHub へコミットする運用か（Vercel 上、または明示的に指定されたとき） */
function useGitHub(): boolean {
  return Boolean(process.env.VERCEL) || process.env.MEDIA_STORAGE === 'github'
}

function localPath(filename: string): string {
  return path.join(process.cwd(), POSTS_DIR, filename)
}

/** ファイル名がパスとして安全か（Payload が sanitize 済みだが二重に確認） */
function assertSafeName(filename: string): void {
  if (!filename || filename.includes('/') || filename.includes('\\') || filename === '.' || filename === '..') {
    throw new Error(`不正なファイル名です: ${filename}`)
  }
}

/** 公開 URL（/posts/<encodeURIComponent(ファイル名)>） */
export function postFileURL(filename: string): string {
  return `${POSTS_URL_PREFIX}/${encodeURIComponent(filename)}`
}

/** 拡張子から Content-Type を引く（配信用。未知の拡張子は octet-stream） */
export function contentTypeFor(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
  }
  return map[ext] || 'application/octet-stream'
}

/**
 * メディアファイルの内容を取得する（無ければ null）。
 * ローカルの public/posts/ を先に見て、無ければ GitHub（本番ブランチ先端）を見る。
 */
export async function readPostFile(filename: string): Promise<Buffer | null> {
  assertSafeName(filename)
  try {
    return await readFile(localPath(filename))
  } catch {
    /* ローカルに無い（Vercel の関数からは public/ が見えない）→ GitHub へ */
  }
  if (!process.env.GITHUB_TOKEN) return null
  return fetchRepoFile(`${POSTS_DIR}/${filename}`)
}

/** Payload の cloud-storage プラグイン用アダプタ */
export const postsStorageAdapter: Adapter = () => ({
  name: 'github-public-posts',

  generateURL: ({ filename }) => postFileURL(filename),

  handleUpload: async ({ file, req }) => {
    const { filename, buffer } = file
    assertSafeName(filename)
    if (useGitHub()) {
      const who = (req.user as { email?: string } | null)?.email || 'admin'
      // [vercel skip] は付けない：デプロイして静的ファイルとして配信させる
      // （デプロイ完了までは /posts/[name] ルートが GitHub から取得して配信する）
      await commitFiles(
        [{ path: `${POSTS_DIR}/${filename}`, content: buffer.toString('base64'), encoding: 'base64' }],
        `メディア追加: ${filename}（admin）\n\nvia 記事管理 /admin (${who})`,
      )
    } else {
      await mkdir(path.dirname(localPath(filename)), { recursive: true })
      await writeFile(localPath(filename), buffer)
    }
  },

  handleDelete: async ({ filename, req }) => {
    assertSafeName(filename)
    try {
      if (useGitHub()) {
        const who = (req.user as { email?: string } | null)?.email || 'admin'
        // 削除だけのためにデプロイはしない（次のデプロイで CDN からも消える）
        await commitFiles(
          [{ path: `${POSTS_DIR}/${filename}`, delete: true }],
          `メディア削除: ${filename}（admin） [vercel skip]\n\nvia 記事管理 /admin (${who})`,
        )
      } else {
        await unlink(localPath(filename))
      }
    } catch (err) {
      // ファイルが既に無い等。レコードの削除自体は通す
      req.payload.logger.warn({ err, msg: `メディアファイルの削除に失敗: ${filename}` })
    }
  },

  // disablePayloadAccessControl: true のため通常は使われないが、型上必須なので実装しておく
  staticHandler: async (_req, { params: { filename } }) => {
    try {
      const buf = await readPostFile(filename)
      if (!buf) return new Response(null, { status: 404 })
      return new Response(new Uint8Array(buf), {
        headers: { 'Content-Type': contentTypeFor(filename), 'Cache-Control': 'public, max-age=3600' },
      })
    } catch {
      return new Response('Internal Server Error', { status: 500 })
    }
  },
})
