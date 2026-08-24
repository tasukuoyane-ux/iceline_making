// 採用（募集職種）データの読み出し層。
// 通常はビルド同梱の src/content/recruit.json（+ sections.json の FAQ）を返し、
// /console の編集プレビュー中は editBridge 経由で送られてくる下書きで差し替える
// （職種の追加・削除・並べ替えは件数が変わり DOM パッチでは表現できないため、
//  React 再描画で反映する。参考プロジェクトの worksStore と同じ方式）。
import { useSyncExternalStore } from "react";
import recruitJson from "../../content/recruit.json";
import sectionsJson from "../../content/sections.json";

export interface RecruitStep {
  time: string;
  task: string;
}
export interface RecruitTimeline {
  note: string;
  image: string;
  steps: RecruitStep[];
}
export interface RecruitJob {
  id: string;
  title: string;
  dept: string;
  active: boolean;
  body: string;
  image: string;
  day: RecruitTimeline;
  career: RecruitTimeline;
  message: string;
  /** 選考の流れ（1日の流れと同じタイムライン形式。旧データでは未設定の場合がある） */
  flow?: RecruitTimeline;
  /** 諸条件（職種ごと。旧データでは未設定の場合がある） */
  conditions?: RecruitRow[];
  /** 福利厚生（職種ごと。旧データでは未設定の場合がある） */
  benefits?: RecruitRow[];
}
export interface RecruitRow {
  label: string;
  value: string;
}
export interface FaqItem {
  q: string;
  a: string;
}
export interface RecruitView {
  jobs: RecruitJob[];
  conditions: RecruitRow[];
  benefits: RecruitRow[];
  faq: FaqItem[];
  /** 選考の流れ（全職種共通のフローチャートのステップ） */
  flow?: string[];
}

/** ビルド同梱データ（公開状態） */
const PUBLISHED: RecruitView = {
  jobs: ((recruitJson as any).jobs ?? []) as RecruitJob[],
  conditions: ((recruitJson as any).conditions ?? []) as RecruitRow[],
  benefits: ((recruitJson as any).benefits ?? []) as RecruitRow[],
  faq: (((sectionsJson as any).recruitFaq?.items ?? []) as FaqItem[]),
  flow: ((recruitJson as any).flow ?? ["エントリー", "書類選考", "面接（1〜2回）", "内定"]) as string[],
};

let preview: RecruitView | null = null;
const listeners = new Set<() => void>();

/** editBridge から呼ばれる：コンソールの下書きをプレビューに反映 */
export function setRecruitPreview(data: RecruitView | null): void {
  preview = data;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** 採用データ（プレビュー中は下書き、通常は公開状態） */
export function useRecruitData(): RecruitView {
  return useSyncExternalStore(subscribe, () => preview ?? PUBLISHED, () => PUBLISHED);
}
