'use client'

/**
 * /console/check —— 公開前チェックリストの実装セルフチェック画面。
 *
 * - 「機械が判定できる項目」は /api/check が実際のデプロイを検査して返す
 * - 上位タブ: 「毎回の確認」／「初期設定」。下位タブ: NG／警告／OK／対象外
 * - 自動検査タイル: 初期設定タブは全展開から潰し込み、毎回タブは展開式
 * - 手動確認リスト: トグルで消し込み（OKにした項目は「確認済み n件」に
 *   畳まれる）。項目は「項目を編集」のオーバーレイで追加・編集・削除できる。
 *   保存は /api/check-items 経由で Neon（チーム共有）。DBが無い環境では
 *   localStorage（この端末のみ）に自動フォールバック
 *
 * ログインは /console と同じアカウント・localStorage キーを共用する。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getToken, isTokenExpired, setAuth } from '../../../../console/api'
import {
  DEFAULT_MANUAL_ITEMS,
  SECTION_NOTES,
  type ManualItem,
  type ManualState,
  type ManualScope,
} from '../../../../lib/checkManual'

type Scope = ManualScope
type Status = 'ok' | 'ng' | 'warn' | 'skip'

interface CheckResult {
  id: string
  no: string
  title: string
  status: Status
  detail: string
  fix?: string
  scope?: Scope
}

interface CheckResponse {
  meta: {
    base: string
    vercelEnv: string
    commit: string | null
    checkedAt: string
    counts: { ok: number; ng: number; warn: number; skip: number }
  }
  results: CheckResult[]
}

const STATUS_META: Record<Status, { label: string; chip: string; tab: string }> = {
  ng: { label: 'NG', chip: 'bg-red-100 text-red-800', tab: 'text-red-700' },
  warn: { label: '警告', chip: 'bg-amber-100 text-amber-800', tab: 'text-amber-700' },
  ok: { label: 'OK', chip: 'bg-green-100 text-green-800', tab: 'text-green-700' },
  skip: { label: '対象外', chip: 'bg-slate-100 text-slate-500', tab: 'text-slate-500' },
}

const STATUS_ORDER: Status[] = ['ng', 'warn', 'ok', 'skip']

const SCOPE_META: Record<Scope, { label: string; hint: string }> = {
  recurring: { label: '毎回の確認', hint: 'デザイン・コンテンツ修正のたびに確認する項目' },
  once: {
    label: '初期設定',
    hint: '環境・アカウント等。一度OKになれば原則そのまま。確認した行はたたんで潰し込んでいく',
  },
}

const LS_ITEMS = 'iceline-check-items'
const LS_STATE = 'iceline-check-state'

function readLs<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export default function CheckPage() {
  const [authed, setAuthed] = useState<boolean | null>(null) // null = 判定前
  const [data, setData] = useState<CheckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [scopeTab, setScopeTab] = useState<Scope>('recurring')
  const [statusTab, setStatusTab] = useState<Status>('ng')
  /** 自動検査タイル: 既定の開閉（初期設定=展開・毎回=たたむ）から反転させたID */
  const [toggled, setToggled] = useState<Set<string>>(new Set())

  // ── 手動確認リスト ──
  const [manualItems, setManualItems] = useState<ManualItem[]>(DEFAULT_MANUAL_ITEMS)
  const [manualState, setManualState] = useState<ManualState>({})
  const [manualStorage, setManualStorage] = useState<'db' | 'local'>('local')
  const [showDone, setShowDone] = useState<Set<string>>(new Set())
  const manualLoaded = useRef(false)

  // ── 編集オーバーレイ ──
  const [editorOpen, setEditorOpen] = useState(false)
  const [draft, setDraft] = useState<ManualItem[]>([])
  const [saving, setSaving] = useState(false)

  const authHeader = (): Record<string, string> => {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const loadManual = useCallback(async () => {
    if (manualLoaded.current) return
    try {
      const res = await fetch('/api/check-items', { headers: authHeader(), cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as {
        storage: 'db' | 'none'
        items: ManualItem[]
        state: ManualState
      }
      if (body.storage === 'db') {
        setManualItems(body.items)
        setManualState(body.state)
        setManualStorage('db')
      } else {
        setManualItems(readLs<ManualItem[]>(LS_ITEMS) ?? body.items)
        setManualState(readLs<ManualState>(LS_STATE) ?? {})
        setManualStorage('local')
      }
      manualLoaded.current = true
    } catch {
      setManualItems(readLs<ManualItem[]>(LS_ITEMS) ?? DEFAULT_MANUAL_ITEMS)
      setManualState(readLs<ManualState>(LS_STATE) ?? {})
      setManualStorage('local')
    }
  }, [])

  const run = useCallback(async () => {
    const token = getToken()
    if (!token || isTokenExpired(token)) {
      setAuthed(false)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    void loadManual()
    try {
      const res = await fetch('/api/check', { headers: authHeader(), cache: 'no-store' })
      if (res.status === 401) {
        setAuthed(false)
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as CheckResponse
      setData(body)
      setAuthed(true)
      setToggled(new Set()) // 再検査したら開閉状態を既定に戻す
      const inScope = body.results.filter((r) => (r.scope ?? 'recurring') === scopeTab)
      const first = STATUS_ORDER.find((s) => inScope.some((r) => r.status === s)) ?? 'ok'
      setStatusTab(first)
    } catch (e) {
      setError(`検査に失敗しました: ${String((e as Error)?.message || e)}`)
      setAuthed(true)
    } finally {
      setLoading(false)
    }
  }, [scopeTab, loadManual])

  useEffect(() => {
    void run()
    // 初回マウント時のみ実行（scopeTab変更での再検査はしない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const body = (await res.json()) as {
        token?: string
        user?: { username: string; name: string }
        error?: string
      }
      if (!res.ok || !body.token || !body.user) {
        setError(body.error || 'ログインに失敗しました')
        return
      }
      setAuth(body.token, body.user)
      setPassword('')
      await run()
    } catch (e) {
      setError(`ログインに失敗しました: ${String((e as Error)?.message || e)}`)
    }
  }

  // ───────── 自動検査タイル
  const defaultExpanded = (r: CheckResult) => (r.scope ?? 'recurring') === 'once'
  const isExpanded = (r: CheckResult) =>
    toggled.has(r.id) ? !defaultExpanded(r) : defaultExpanded(r)
  const toggleTile = (r: CheckResult) =>
    setToggled((prev) => {
      const next = new Set(prev)
      if (next.has(r.id)) next.delete(r.id)
      else next.add(r.id)
      return next
    })

  const inScope = (data?.results ?? []).filter((r) => (r.scope ?? 'recurring') === scopeTab)
  const byStatus = (s: Status) => inScope.filter((r) => r.status === s)
  const shown = byStatus(statusTab)
  const scopeNg = (scope: Scope) =>
    (data?.results ?? []).filter((r) => (r.scope ?? 'recurring') === scope && r.status === 'ng').length

  const allExpanded = shown.length > 0 && shown.every(isExpanded)
  const setAll = (target: boolean) =>
    setToggled((prev) => {
      const next = new Set(prev)
      for (const r of shown) {
        if (target !== defaultExpanded(r)) next.add(r.id)
        else next.delete(r.id)
      }
      return next
    })

  const selectScope = (s: Scope) => {
    setScopeTab(s)
    const rows = (data?.results ?? []).filter((r) => (r.scope ?? 'recurring') === s)
    setStatusTab(STATUS_ORDER.find((st) => rows.some((r) => r.status === st)) ?? 'ok')
  }

  // ───────── 手動確認リスト（消し込み）
  const isDone = (id: string) => !!manualState[id]?.done

  const toggleDone = async (id: string) => {
    const next = !isDone(id)
    const entry = { done: next, at: new Date().toISOString() }
    setManualState((s) => {
      const merged = { ...s, [id]: entry }
      if (manualStorage === 'local') localStorage.setItem(LS_STATE, JSON.stringify(merged))
      return merged
    })
    if (manualStorage === 'db') {
      try {
        await fetch('/api/check-items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ id, done: next }),
        })
      } catch {
        /* 楽観更新のまま。次回ロードでDBと同期される */
      }
    }
  }

  const manualInScope = manualItems.filter((it) => it.scope === scopeTab)
  const sections: string[] = []
  for (const it of manualInScope) if (!sections.includes(it.section)) sections.push(it.section)
  const manualDoneCount = manualInScope.filter((it) => isDone(it.id)).length

  // ───────── 編集オーバーレイ
  const openEditor = () => {
    setDraft(manualInScope.map((it) => ({ ...it })))
    setEditorOpen(true)
  }

  const updateDraft = (id: string, patch: Partial<ManualItem>) =>
    setDraft((d) => d.map((it) => (it.id === id ? { ...it, ...patch } : it)))

  const addDraftRow = () =>
    setDraft((d) => [
      ...d,
      {
        id: crypto.randomUUID(),
        scope: scopeTab,
        section: d.length ? d[d.length - 1].section : '新しいグループ',
        no: '',
        text: '',
      },
    ])

  const saveDraft = async () => {
    const cleaned = draft
      .map((it) => ({ ...it, section: it.section.trim(), no: it.no.trim(), text: it.text.trim() }))
      .filter((it) => it.text !== '')
    for (const it of cleaned) if (!it.section) it.section = 'その他'
    const merged = [...manualItems.filter((it) => it.scope !== scopeTab), ...cleaned]
    setSaving(true)
    try {
      if (manualStorage === 'db') {
        const res = await fetch('/api/check-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ items: merged }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        localStorage.setItem(LS_ITEMS, JSON.stringify(merged))
      }
      setManualItems(merged)
      setEditorOpen(false)
    } catch (e) {
      setError(`項目の保存に失敗しました: ${String((e as Error)?.message || e)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-[1700px] px-4 py-8 md:px-8">
        {/* ── ヘッダー ── */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">実装セルフチェック</h1>
            <p className="mt-1 text-[12px] text-slate-500">
              公開前チェックリストの自動検査。{' '}
              <a href="/console" className="underline underline-offset-2">
                /console へ戻る
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {data && !loading && (
              <span className="hidden text-[12px] text-slate-500 md:inline">
                {data.meta.vercelEnv}
                {data.meta.commit ? ` / ${data.meta.commit}` : ''} ・{' '}
                {new Date(data.meta.checkedAt).toLocaleString('ja-JP')} ・ {data.meta.base}
              </span>
            )}
            {authed && !loading && (
              <button
                onClick={() => void run()}
                className="rounded bg-slate-900 px-4 py-2 text-[13px] font-bold text-white hover:opacity-80"
              >
                再検査
              </button>
            )}
          </div>
        </header>

        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</p>
        )}

        {/* ── チェック中のアニメーション ── */}
        {loading && (
          <div className="mt-10">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block size-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
              />
              <p className="text-[14px] font-bold">
                チェック中…
                <span className="ml-2 font-normal text-slate-500">
                  実際のデプロイに対して検査しています（10秒ほどかかります）
                </span>
              </p>
            </div>
            <ul className="mt-5 grid gap-2 xl:grid-cols-2" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <li
                  key={i}
                  className="h-9 animate-pulse rounded border border-slate-200 bg-white"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </ul>
          </div>
        )}

        {authed === false && !loading && (
          <form
            onSubmit={login}
            className="mx-auto mt-16 w-full max-w-sm rounded border border-slate-200 bg-white p-5"
          >
            <p className="text-[13px] font-bold">コンソールのアカウントでログイン</p>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="社員ID"
              autoComplete="username"
              className="mt-3 block w-full rounded border border-slate-300 px-3 py-2 text-[13px]"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              autoComplete="current-password"
              className="mt-2 block w-full rounded border border-slate-300 px-3 py-2 text-[13px]"
            />
            <button
              type="submit"
              className="mt-3 w-full rounded bg-slate-900 px-4 py-2 text-[13px] font-bold text-white hover:opacity-80"
            >
              ログインして検査する
            </button>
          </form>
        )}

        {data && !loading && (
          <>
            {/* ── 上位タブ ── */}
            <div className="mt-6 flex gap-1 rounded-lg bg-slate-200/70 p-1 md:max-w-xl">
              {(Object.keys(SCOPE_META) as Scope[]).map((s) => {
                const ng = scopeNg(s)
                return (
                  <button
                    key={s}
                    onClick={() => selectScope(s)}
                    aria-pressed={scopeTab === s}
                    className={`flex-1 rounded-md px-3 py-2 text-[13px] font-bold transition ${
                      scopeTab === s ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {SCOPE_META[s].label}
                    {ng > 0 && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-800">
                        NG {ng}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[12px] text-slate-500">{SCOPE_META[scopeTab].hint}</p>

            {/* ── 本文 ── */}
            <div className="mt-4 items-start gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
              <section>
                <div className="flex items-end justify-between gap-4 border-b border-slate-200">
                  <div className="flex gap-4">
                    {STATUS_ORDER.map((s) => {
                      const n = byStatus(s).length
                      return (
                        <button
                          key={s}
                          onClick={() => setStatusTab(s)}
                          aria-pressed={statusTab === s}
                          className={`-mb-px border-b-2 px-1 pb-2 text-[13px] font-bold transition ${
                            statusTab === s
                              ? `border-slate-900 ${STATUS_META[s].tab}`
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {STATUS_META[s].label} {n}
                        </button>
                      )
                    })}
                  </div>
                  {shown.length > 0 && (
                    <button
                      onClick={() => setAll(!allExpanded)}
                      className="pb-2 text-[12px] text-slate-500 underline underline-offset-2 hover:text-slate-700"
                    >
                      {allExpanded ? 'すべてたたむ' : 'すべて展開'}
                    </button>
                  )}
                </div>

                {shown.length === 0 ? (
                  <p className="mt-6 text-[13px] text-slate-500">
                    {STATUS_META[statusTab].label} の項目はありません。
                  </p>
                ) : (
                  <ul className="mt-4 grid items-start gap-2 xl:grid-cols-2">
                    {shown.map((r) => {
                      const expanded = isExpanded(r)
                      const dimmed = scopeTab === 'once' && !expanded
                      return (
                        <li
                          key={r.id}
                          className={`overflow-hidden rounded border border-slate-200 bg-white transition ${
                            dimmed ? 'opacity-55' : ''
                          }`}
                        >
                          <button
                            onClick={() => toggleTile(r)}
                            aria-expanded={expanded}
                            title={dimmed ? 'たたみ済み（クリックで再展開）' : undefined}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold ${STATUS_META[r.status].chip}`}
                            >
                              {STATUS_META[r.status].label}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                              {r.title}
                            </span>
                            <span
                              aria-hidden
                              className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                            >
                              ›
                            </span>
                          </button>
                          {expanded && (
                            <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
                              <p className="text-[12px] leading-[1.8] text-slate-700">{r.detail}</p>
                              {r.fix && (
                                <p className="mt-1.5 text-[12px] leading-[1.8] text-slate-900">
                                  <b>対応:</b> {r.fix}
                                </p>
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              {/* ── 手動確認リスト（右レール） ── */}
              <aside className="mt-10 lg:sticky lg:top-6 lg:mt-0 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pb-6">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <h2 className="text-[14px] font-bold">
                      手動確認リスト
                      <span className="ml-2 text-[12px] font-normal text-slate-500">
                        {manualDoneCount}/{manualInScope.length} 済み
                      </span>
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {manualStorage === 'db' ? 'チーム共有（DB保存）' : 'この端末のみ（DB未接続）'}
                    </p>
                  </div>
                  <button
                    onClick={openEditor}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-100"
                  >
                    項目を編集
                  </button>
                </div>
                <p className="mt-2 text-[12px] text-slate-500">
                  機械判定できない項目。確認できたら ○ を押して消し込む。
                </p>

                {sections.map((section) => {
                  const items = manualInScope.filter((it) => it.section === section)
                  const openItems = items.filter((it) => !isDone(it.id))
                  const doneItems = items.filter((it) => isDone(it.id))
                  const doneOpen = showDone.has(section)
                  return (
                    <div key={section} className="mt-4 rounded border border-slate-200 bg-white p-4">
                      <h3 className="text-[13px] font-bold">
                        {section}
                        <span className="ml-2 text-[11px] font-normal text-slate-400">
                          {doneItems.length}/{items.length}
                        </span>
                      </h3>
                      {SECTION_NOTES[section] && (
                        <p className="mt-1 text-[12px] text-slate-500">{SECTION_NOTES[section]}</p>
                      )}

                      {openItems.length === 0 && (
                        <p className="mt-2 text-[12px] text-green-700">すべて確認済み 🎉</p>
                      )}
                      <ul className="mt-2 space-y-1.5">
                        {openItems.map((it) => (
                          <li key={it.id} className="flex items-start gap-2 text-[12px] leading-[1.7]">
                            <button
                              onClick={() => void toggleDone(it.id)}
                              title="確認済みにする"
                              className="mt-0.5 size-4 shrink-0 rounded-full border border-slate-300 text-[10px] leading-none text-transparent transition hover:border-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              ✓
                            </button>
                            {it.no && (
                              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-500">
                                No.{it.no}
                              </span>
                            )}
                            <span>{it.text}</span>
                          </li>
                        ))}
                      </ul>

                      {/* 確認済みは畳む */}
                      {doneItems.length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() =>
                              setShowDone((prev) => {
                                const next = new Set(prev)
                                if (next.has(section)) next.delete(section)
                                else next.add(section)
                                return next
                              })
                            }
                            aria-expanded={doneOpen}
                            className="text-[11px] text-slate-400 underline underline-offset-2 hover:text-slate-600"
                          >
                            {doneOpen ? '確認済みをたたむ' : `確認済み ${doneItems.length}件を表示`}
                          </button>
                          {doneOpen && (
                            <ul className="mt-1.5 space-y-1.5 opacity-60">
                              {doneItems.map((it) => {
                                const st = manualState[it.id]
                                return (
                                  <li
                                    key={it.id}
                                    className="flex items-start gap-2 text-[12px] leading-[1.7]"
                                  >
                                    <button
                                      onClick={() => void toggleDone(it.id)}
                                      title="未確認に戻す"
                                      className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-green-600 text-[10px] leading-none text-white hover:bg-slate-400"
                                    >
                                      ✓
                                    </button>
                                    {it.no && (
                                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-500">
                                        No.{it.no}
                                      </span>
                                    )}
                                    <span className="line-through decoration-slate-400">
                                      {it.text}
                                      {st?.by && (
                                        <span className="ml-1 text-[11px] text-slate-400 no-underline">
                                          （{st.by}）
                                        </span>
                                      )}
                                    </span>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </aside>
            </div>
          </>
        )}
      </div>

      {/* ── 項目編集オーバーレイ ── */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditorOpen(false)
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h2 className="text-[15px] font-bold">
                  手動確認リストの編集 — {SCOPE_META[scopeTab].label}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  自動検査の項目はコード（/api/check）側で管理。ここで編集できるのは手動確認リストのみ。
                  文言を空にした行は削除される
                </p>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                aria-label="閉じる"
                className="rounded px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <datalist id="check-sections">
                {Array.from(new Set(draft.map((d) => d.section))).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <div className="grid grid-cols-[9rem_5rem_1fr_2rem] items-center gap-2 text-[11px] font-bold text-slate-400">
                <span>グループ</span>
                <span>No</span>
                <span>チェック内容</span>
                <span />
              </div>
              <ul className="mt-1 space-y-1.5">
                {draft.map((it) => (
                  <li key={it.id} className="grid grid-cols-[9rem_5rem_1fr_2rem] items-start gap-2">
                    <input
                      value={it.section}
                      onChange={(e) => updateDraft(it.id, { section: e.target.value })}
                      list="check-sections"
                      placeholder="グループ"
                      className="rounded border border-slate-300 px-2 py-1.5 text-[12px]"
                    />
                    <input
                      value={it.no}
                      onChange={(e) => updateDraft(it.id, { no: e.target.value })}
                      placeholder="No"
                      className="rounded border border-slate-300 px-2 py-1.5 text-[12px]"
                    />
                    <textarea
                      value={it.text}
                      onChange={(e) => updateDraft(it.id, { text: e.target.value })}
                      rows={Math.min(4, Math.max(1, Math.ceil(it.text.length / 40)))}
                      placeholder="チェック内容（空にすると削除）"
                      className="resize-none rounded border border-slate-300 px-2 py-1.5 text-[12px] leading-[1.6]"
                    />
                    <button
                      onClick={() => setDraft((d) => d.filter((x) => x.id !== it.id))}
                      title="この行を削除"
                      className="mt-1 rounded px-1.5 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={addDraftRow}
                className="mt-3 rounded border border-dashed border-slate-300 px-3 py-1.5 text-[12px] text-slate-500 hover:border-slate-400 hover:text-slate-700"
              >
                ＋ 行を追加
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
              <span className="text-[11px] text-slate-400">
                保存先: {manualStorage === 'db' ? 'チーム共有（DB）' : 'この端末のみ（DB未接続）'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditorOpen(false)}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => void saveDraft()}
                  disabled={saving}
                  className="rounded bg-slate-900 px-4 py-2 text-[13px] font-bold text-white hover:opacity-80 disabled:opacity-40"
                >
                  {saving ? '保存中…' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
