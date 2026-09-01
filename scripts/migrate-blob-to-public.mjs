// Vercel Blob 上の画像・動画をリポジトリの public/uploads/ へ移行する一括スクリプト（2026-09）。
//
//   node scripts/migrate-blob-to-public.mjs          # 実行（ダウンロード＋JSON書き換え）
//   node scripts/migrate-blob-to-public.mjs --dry    # 対象URLとサイズの確認だけ
//
// 対象: src/content/*.json に書かれている Blob の URL（public ストアなのでトークン不要。
// ただし Blob ストアがブロック中は 403 になるので、解除後に実行すること）。
//  - ファイルは public/uploads/<Blob 上のファイル名> に保存（既にあれば再ダウンロードしない）
//  - JSON 内の URL を /uploads/<ファイル名> に置換
//  - 95MB を超えるファイル（GitHub の 100MB 制限）は取り込まず、一覧に出す（再エンコードして手動配置）
//  - Payload（/admin）の記事添付は DB 管理のため対象外（Blob のまま）
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs'
import { join, basename } from 'node:path'

//   node scripts/migrate-blob-to-public.mjs --originals
//     recover-from-image-cache.mjs で最適化キャッシュから仮回収した画像（scripts/blob-recovery-map.json）を、
//     Blob 解除後に元ファイルで差し替える（JSON 内のパスも元の拡張子に合わせて書き換える）
const DRY = process.argv.includes('--dry')
const ORIGINALS = process.argv.includes('--originals')
const CONTENT_DIR = 'src/content'
const OUT_DIR = 'public/uploads'
const MAP_FILE = 'scripts/blob-recovery-map.json'
const MAX_BYTES = 95 * 1024 * 1024
const BLOB_RE = /https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"']+/g

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'))
const texts = Object.fromEntries(files.map((f) => [f, readFileSync(join(CONTENT_DIR, f), 'utf8')]))
const recoveryMap = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, 'utf8')) : {}
const urls = ORIGINALS
  ? Object.keys(recoveryMap).filter((u) => !recoveryMap[u].original)
  : [...new Set(Object.values(texts).flatMap((t) => t.match(BLOB_RE) || []))]
console.log(`${ORIGINALS ? '元ファイルへ差し替える' : 'Blob'} URL: ${urls.length} 件`)

mkdirSync(OUT_DIR, { recursive: true })
const replaced = new Map() // 置換前の文字列 -> /uploads/...
const skipped = []

for (const url of urls) {
  const name = decodeURIComponent(basename(new URL(url).pathname))
  const dest = join(OUT_DIR, name)
  const rel = `/uploads/${encodeURIComponent(name)}`
  if (ORIGINALS) {
    // 仮回収ファイル（webp 等）を元ファイルで置き換え、JSON のパスも元の名前へ
    const prev = recoveryMap[url]
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > MAX_BYTES) throw new Error('95MB超')
      if (!DRY) {
        writeFileSync(dest, buf)
        if (prev.file !== name && existsSync(join(OUT_DIR, prev.file))) unlinkSync(join(OUT_DIR, prev.file))
        recoveryMap[url] = { ...prev, rel, file: name, recovered: 'original', original: true }
      }
      if (prev.rel !== rel) replaced.set(prev.rel, rel)
      console.log(`  ${DRY ? '確認' : '差替'} ${name}（${(buf.length / 1024 / 1024).toFixed(1)}MB）`)
    } catch (err) {
      skipped.push({ url, name, why: err.message })
      console.log(`  × ${name}: ${err.message}`)
    }
    continue
  }
  if (existsSync(dest)) {
    console.log(`  済 ${name}（${(statSync(dest).size / 1024 / 1024).toFixed(1)}MB）`)
    if (statSync(dest).size <= MAX_BYTES) replaced.set(url, rel)
    else skipped.push({ url, name, why: '95MB超（手動で再エンコード）' })
    continue
  }
  try {
    const res = await fetch(url)
    if (!res.ok) {
      skipped.push({ url, name, why: `HTTP ${res.status}${res.status === 403 ? '（Blob がブロック中の可能性）' : ''}` })
      console.log(`  × ${name}: HTTP ${res.status}`)
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const mb = (buf.length / 1024 / 1024).toFixed(1)
    if (buf.length > MAX_BYTES) {
      skipped.push({ url, name, why: `${mb}MB（95MB超。再エンコードして public/videos/ へ手動配置）` })
      console.log(`  ! ${name}: ${mb}MB → 取り込まない`)
      continue
    }
    if (!DRY) writeFileSync(dest, buf)
    replaced.set(url, rel)
    console.log(`  ${DRY ? '確認' : '保存'} ${name}（${mb}MB）`)
  } catch (err) {
    skipped.push({ url, name, why: err.message })
    console.log(`  × ${name}: ${err.message}`)
  }
}

if (!DRY) {
  for (const [f, t] of Object.entries(texts)) {
    let next = t
    for (const [url, rel] of replaced) next = next.split(url).join(rel)
    if (next !== t) {
      writeFileSync(join(CONTENT_DIR, f), next)
      console.log(`書き換え: ${f}`)
    }
  }
  if (ORIGINALS) writeFileSync(MAP_FILE, JSON.stringify(recoveryMap, null, 2) + '\n')
}

console.log(`\n移行: ${replaced.size} 件 / 未処理: ${skipped.length} 件`)
for (const s of skipped) console.log(`  - ${s.name}: ${s.why}\n      ${s.url}`)
if (skipped.length) process.exitCode = 1
