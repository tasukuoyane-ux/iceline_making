'use client'

import dynamic from 'next/dynamic'

// 既存の Vite SPA（react-router）を丸ごとクライアント側で描画する。
// window / localStorage を使うため SSR しない（初期表示の挙動は旧 Vite 版と同じ）。
const SpaRoot = dynamic(() => import('../../../spa/SpaRoot'), { ssr: false })

export function SpaClient() {
  return <SpaRoot />
}
