// 採用記事（社員インタビュー等）。
// 記事は Payload CMS（/admin の「採用記事」）へ移行済み。実行時に /api/interviews から
// 読み込み、取得完了までは移行元 interviews.json（ビルド同梱）で即時描画する。
import { useEffect, useState } from "react";
import interviewsData from "../../content/interviews.json";
import { Block, toBlocks } from "./blocks";

export interface InterviewItem {
  id: string;
  name: string;
  role: string;
  years: string;
  lead: string;
  subtitle: string;
  image: string;
  /** カテゴリー（採用ページのカードのラベルに表示。旧データは「社員インタビュー」） */
  category: string;
  blocks: Block[];
}

/** ビルド同梱のフォールバック（Payload 移行元の interviews.json） */
const FALLBACK: InterviewItem[] = (interviewsData as any[]).map((iv) => ({
  id: String(iv.id),
  name: String(iv.name ?? ""),
  role: String(iv.role ?? ""),
  years: String(iv.years ?? ""),
  lead: String(iv.lead ?? ""),
  subtitle: String(iv.subtitle ?? ""),
  image: String(iv.image ?? ""),
  category: "社員インタビュー",
  blocks: toBlocks(iv.blocks ?? iv.paragraphs),
}));

let cache: InterviewItem[] | null = null;
let ready = false;
let inflight: Promise<InterviewItem[]> | null = null;
const listeners = new Set<() => void>();

function preloadInterviews(): Promise<InterviewItem[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/interviews")
      .then((r) => {
        if (!r.ok) throw new Error(`interviews api ${r.status}`);
        return r.json();
      })
      .then((data: InterviewItem[]) => {
        cache = Array.isArray(data) && data.length > 0 ? data : FALLBACK;
        ready = true;
        listeners.forEach((l) => l());
        return cache;
      })
      .catch(() => {
        // API 不達（オフライン等）はフォールバックで表示を維持
        ready = true;
        listeners.forEach((l) => l());
        return FALLBACK;
      });
  }
  return inflight;
}

// SPA 読み込みと同時に取得を開始（React マウントと並行して走る）
if (typeof window !== "undefined") preloadInterviews();

/**
 * 採用記事一覧。取得完了までは同梱データ（フォールバック）を返して即時描画し、
 * Payload のデータが届いたら差し替える。ready は「APIの取得を試み終えたか」
 * （記事ページの「見つかりません」判定はこれを待ってから行う）。
 */
export function useInterviews(): { items: InterviewItem[]; ready: boolean } {
  const [, force] = useState(0);
  useEffect(() => {
    if (ready) return;
    const l = () => force((v) => v + 1);
    listeners.add(l);
    preloadInterviews();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { items: cache ?? FALLBACK, ready };
}
