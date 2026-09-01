// Blob がブロック中でも、本番の画像最適化キャッシュ（/_next/image・最大31日保持）から
// 最適化済み画像（q=75・最大幅は閲覧実績のある幅）を回収して public/uploads/ に取り込む。
//   node scripts/recover-from-image-cache.mjs [--dry]
// 回収した画像は元画像より画質が落ちるため、Blob 解除後に
//   node scripts/migrate-blob-to-public.mjs --originals
// で元ファイルに差し替えられるよう、対応表を scripts/blob-recovery-map.json に残す。
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const DRY = process.argv.includes('--dry')
const SITE = 'https://iceline-making.vercel.app'
const CONTENT_DIR = 'src/content'
const OUT_DIR = 'public/uploads'
const MAP_FILE = 'scripts/blob-recovery-map.json'
const WIDTHS = [3840, 2048, 1920, 1200, 1080, 828, 750, 640, 384]
const BLOB_RE = /https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"']+/g
const EXT_BY_TYPE = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'image/gif': 'gif' }

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'))
const texts = Object.fromEntries(files.map((f) => [f, readFileSync(join(CONTENT_DIR, f), 'utf8')]))
const urls = [...new Set(Object.values(texts).flatMap((t) => t.match(BLOB_RE) || []))]
const map = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, 'utf8')) : {}
mkdirSync(OUT_DIR, { recursive: true })

const replaced = new Map()
const failed = []
console.log(`Blob URL: ${urls.length} 件`)
for (const url of urls) {
  const name = decodeURIComponent(basename(new URL(url).pathname))
  const stem = name.replace(/\.[^.]+$/, '')
  if (!/\.(jpe?g|png|webp|avif|gif)$/i.test(name)) {
    failed.push({ url, name, why: '画像以外（動画・SVG等）は最適化キャッシュに無い' })
    console.log(`  - ${name}: 対象外`)
    continue
  }
  // 既に元ファイルで取り込み済みならスキップ
  if (map[url]?.original) { replaced.set(url, map[url].rel); continue }
  let got = null
  for (const w of WIDTHS) {
    const res = await fetch(`${SITE}/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`, {
      headers: { Accept: 'image/webp,image/*,*/*;q=0.8' },
    })
    const type = (res.headers.get('content-type') || '').split(';')[0]
    if (res.ok && EXT_BY_TYPE[type]) {
      got = { w, type, buf: Buffer.from(await res.arrayBuffer()), cache: res.headers.get('x-vercel-cache') }
      break
    }
  }
  if (!got) {
    failed.push({ url, name, why: 'どの幅もキャッシュに無い' })
    console.log(`  × ${name}: キャッシュなし`)
    continue
  }
  const outName = `${stem}.${EXT_BY_TYPE[got.type]}`
  const rel = `/uploads/${encodeURIComponent(outName)}`
  if (!DRY) writeFileSync(join(OUT_DIR, outName), got.buf)
  map[url] = { rel, file: outName, recovered: `optimized w=${got.w} ${got.type}`, original: false }
  replaced.set(url, rel)
  console.log(`  ${DRY ? '確認' : '保存'} ${outName}（w=${got.w} ${got.type} ${(got.buf.length / 1024).toFixed(0)}KB ${got.cache}）`)
}

if (!DRY) {
  for (const [f, t] of Object.entries(texts)) {
    let next = t
    for (const [url, rel] of replaced) next = next.split(url).join(rel)
    if (next !== t) { writeFileSync(join(CONTENT_DIR, f), next); console.log(`書き換え: ${f}`) }
  }
  writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + '\n')
}
console.log(`\n回収: ${replaced.size} 件 / 未回収: ${failed.length} 件`)
for (const s of failed) console.log(`  - ${s.name}: ${s.why}`)
