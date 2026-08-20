'use client'

import dynamic from 'next/dynamic'

// 管理コンソールはブラウザ専用（localStorage・iframe を使う）なので SSR しない。
const ConsoleApp = dynamic(
  () => import('../../../console/ConsoleApp').then((m) => m.ConsoleApp),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-[13px] text-slate-500">読み込み中…</div>
    ),
  },
)

export default function ConsolePage() {
  return <ConsoleApp />
}
