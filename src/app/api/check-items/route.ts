// /api/check-items —— /console/check の「手動確認リスト」の保存API。
//
//   GET   … 項目一覧と消し込み状態を返す（DB未保存ならシードを返す）
//   PUT   … 項目一覧を丸ごと保存（追加・編集・削除の結果）
//   PATCH … 1項目の消し込み状態（done）を更新。確認者・日時はサーバー側で記録
//
// 保存先は Neon の console_check テーブル（key/value の2行だけの小さなKV）。
// Payload のマイグレーションには載せず、初回アクセス時に CREATE TABLE IF NOT
// EXISTS で作る（記事スキーマと無関係な運用データのため）。
// POSTGRES_URL が無い環境（ローカル等）は storage:'none' を返し、
// クライアント側が localStorage にフォールバックする。
//
// 認証必須（コンソールのトークン）。
import { Pool } from 'pg'

import { verifyRequest } from '../_lib/auth'
import {
  DEFAULT_MANUAL_ITEMS,
  type ManualItem,
  type ManualState,
} from '../../../lib/checkManual'

export const maxDuration = 30

const ITEMS_KEY = 'manual_items'
const STATE_KEY = 'manual_state'

// サーバーレスの再利用インスタンスでプールを使い回す
const g = globalThis as unknown as { __checkPool?: Pool }

function pool(): Pool | null {
  const url = process.env.POSTGRES_URL
  if (!url) return null
  if (!g.__checkPool) g.__checkPool = new Pool({ connectionString: url, max: 1 })
  return g.__checkPool
}

async function ensureTable(p: Pool): Promise<void> {
  await p.query(
    `CREATE TABLE IF NOT EXISTS console_check (
       key text PRIMARY KEY,
       value jsonb NOT NULL,
       updated_at timestamptz NOT NULL DEFAULT now()
     )`,
  )
}

async function readKey<T>(p: Pool, key: string): Promise<T | null> {
  const r = await p.query('SELECT value FROM console_check WHERE key = $1', [key])
  return r.rows.length ? (r.rows[0].value as T) : null
}

async function writeKey(p: Pool, key: string, value: unknown): Promise<void> {
  await p.query(
    `INSERT INTO console_check (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
    [key, JSON.stringify(value)],
  )
}

/** 項目の形式チェック（保存前の最低限の検証） */
function validItems(v: unknown): v is ManualItem[] {
  return (
    Array.isArray(v) &&
    v.length <= 500 &&
    v.every(
      (it) =>
        it &&
        typeof it.id === 'string' && it.id.length > 0 && it.id.length <= 64 &&
        (it.scope === 'once' || it.scope === 'recurring') &&
        typeof it.section === 'string' && it.section.length > 0 && it.section.length <= 100 &&
        typeof it.no === 'string' && it.no.length <= 40 &&
        typeof it.text === 'string' && it.text.length > 0 && it.text.length <= 500,
    )
  )
}

export async function GET(req: Request): Promise<Response> {
  const auth = await verifyRequest(req).catch(() => null)
  if (!auth) return Response.json({ error: 'ログインが必要です' }, { status: 401 })

  const p = pool()
  if (!p) {
    return Response.json({ storage: 'none', items: DEFAULT_MANUAL_ITEMS, state: {} })
  }
  try {
    await ensureTable(p)
    const items = (await readKey<ManualItem[]>(p, ITEMS_KEY)) ?? DEFAULT_MANUAL_ITEMS
    const state = (await readKey<ManualState>(p, STATE_KEY)) ?? {}
    return Response.json({ storage: 'db', items, state })
  } catch (e) {
    console.error('[check-items] GET 失敗:', (e as Error)?.message)
    return Response.json({ storage: 'none', items: DEFAULT_MANUAL_ITEMS, state: {} })
  }
}

export async function PUT(req: Request): Promise<Response> {
  const auth = await verifyRequest(req).catch(() => null)
  if (!auth) return Response.json({ error: 'ログインが必要です' }, { status: 401 })

  const p = pool()
  if (!p) return Response.json({ error: 'db-unavailable' }, { status: 503 })

  const body = (await req.json().catch(() => null)) as { items?: unknown } | null
  if (!body || !validItems(body.items)) {
    return Response.json({ error: '項目の形式が不正です' }, { status: 400 })
  }
  try {
    await ensureTable(p)
    await writeKey(p, ITEMS_KEY, body.items)
    return Response.json({ ok: true })
  } catch (e) {
    console.error('[check-items] PUT 失敗:', (e as Error)?.message)
    return Response.json({ error: 'save-failed' }, { status: 500 })
  }
}

export async function PATCH(req: Request): Promise<Response> {
  const auth = await verifyRequest(req).catch(() => null)
  if (!auth) return Response.json({ error: 'ログインが必要です' }, { status: 401 })

  const p = pool()
  if (!p) return Response.json({ error: 'db-unavailable' }, { status: 503 })

  const body = (await req.json().catch(() => null)) as { id?: string; done?: boolean } | null
  if (!body || typeof body.id !== 'string' || typeof body.done !== 'boolean') {
    return Response.json({ error: 'id と done が必要です' }, { status: 400 })
  }
  try {
    await ensureTable(p)
    const state = (await readKey<ManualState>(p, STATE_KEY)) ?? {}
    state[body.id] = { done: body.done, by: auth.name, at: new Date().toISOString() }
    await writeKey(p, STATE_KEY, state)
    return Response.json({ ok: true, entry: state[body.id] })
  } catch (e) {
    console.error('[check-items] PATCH 失敗:', (e as Error)?.message)
    return Response.json({ error: 'save-failed' }, { status: 500 })
  }
}
