// Vercel 用ビルド。DB（Neon Postgres）が接続済みならマイグレーションを流してから
// Next.js をビルドする。DB 未接続でもビルド自体は通るようにしておく
// （初回セットアップで env より先に push しても、デプロイが赤くならないように）。
//
// 高速化: `payload migrate` は Payload の起動と DB 接続で毎回 15〜20 秒かかる。
// そこで先に pg で DB の `payload_migrations` を直接見て、**未適用の
// マイグレーションがあるときだけ** migrate を実行する（確認クエリは1秒未満）。
//
// 修復: 過去に dev モード（スキーマの動的 push）で DB を触った痕跡
// （batch = -1 の記録）があると、`payload migrate` が対話プロンプトで止まり、
// 非対話のビルドでは**何も適用せず exit 0** してしまう。この痕跡を検出したら、
// push で適用済みと確認できるマイグレーションを適用済みとして記録し、
// dev の記録を消してから migrate を流す。
import { execSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import pg from 'pg'

const run = (cmd, env = {}) =>
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } })

/** src/migrations にあるマイグレーション名（.ts、index 以外）。 */
function migrationNames() {
  try {
    return readdirSync('src/migrations')
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map((f) => f.replace(/\.ts$/, ''))
      .sort()
  } catch {
    return []
  }
}

/**
 * 「このマイグレーションの内容が既に DB に反映されているか」を確かめるクエリ。
 * dev push の痕跡を修復するときだけ使う（通常の適用可否は記録の有無で決まる）。
 * 新しいマイグレーションを追加したらここにも1行足すこと。
 */
const APPLIED_PROBES = {
  // initial（news / media / users）: news テーブルが存在すれば適用済み
  '20260820_061026_initial': "select to_regclass('public.news') is not null as ok",
  // 求人エントリーリンクブロック: news_blocks_recruit_link テーブルがあれば適用済み
  '20260826_092841_recruit_link_block':
    "select to_regclass('public.news_blocks_recruit_link') is not null as ok",
  // 採用記事（interviews）コレクション: interviews テーブルがあれば適用済み
  '20260826_103039_interviews_collection':
    "select to_regclass('public.interviews') is not null as ok",
  // 採用記事の自己紹介・趣味・アイキャッチ動画: interviews.video_src 列があれば適用済み
  '20260901_040403_interview_eyecatch_video':
    "select exists(select 1 from information_schema.columns where table_schema='public' and table_name='interviews' and column_name='video_src') as ok",
}

/** DB を確認・修復し、migrate の実行が必要かを返す。 */
async function checkAndRepair(url) {
  const pool = new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 1,
  })
  try {
    const table = await pool.query(
      "select to_regclass('public.payload_migrations') as t",
    )
    if (!table.rows[0]?.t) return true // まっさらな DB。migrate が全部作る。

    let { rows } = await pool.query('select name, batch from payload_migrations')

    if (rows.some((r) => Number(r.batch) === -1)) {
      console.log(
        '[build] dev push の痕跡（batch=-1）を検出。適用済みマイグレーションを記録して修復します。',
      )
      for (const [name, probe] of Object.entries(APPLIED_PROBES)) {
        if (rows.some((r) => r.name === name)) continue
        const ok = (await pool.query(probe)).rows[0]?.ok
        if (ok) {
          await pool.query(
            'insert into payload_migrations (name, batch, updated_at, created_at) values ($1, 1, now(), now())',
            [name],
          )
          console.log(`[build]   記録: ${name}（push で適用済み）`)
        }
      }
      await pool.query('delete from payload_migrations where batch = -1')
      ;({ rows } = await pool.query('select name, batch from payload_migrations'))
    }

    const recorded = new Set(rows.map((r) => r.name))
    const pending = migrationNames().filter((n) => !recorded.has(n))
    if (pending.length) {
      console.log(`[build] 未適用のマイグレーション: ${pending.join(', ')}`)
      return true
    }
    console.log('[build] マイグレーションはすべて適用済み。payload migrate をスキップします。')
    return false
  } finally {
    await pool.end()
  }
}

// マイグレーションは PgBouncer（pooled）を避け、直結の接続文字列があればそちらを使う。
const migrateUrl =
  process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL

if (migrateUrl && migrationNames().length) {
  const needsMigrate = await checkAndRepair(migrateUrl).catch((err) => {
    console.warn('[build] マイグレーション状態の確認に失敗:', err.message)
    return true // 分からなければ migrate に任せる
  })
  if (needsMigrate) {
    run('npx payload migrate', { POSTGRES_URL: migrateUrl })
  }
} else if (!migrateUrl) {
  console.warn(
    '[build] POSTGRES_URL が未設定のため payload migrate をスキップします。' +
      'Neon(Postgres) を接続すると記事管理画面 /admin が使えるようになります。',
  )
}

// Turbopack でビルドする（webpack 比で大幅に速い）。
// Vercel は .next/cache を次回ビルドへ引き継ぐため、差分ビルドも効く。
run('npx next build --turbopack')
