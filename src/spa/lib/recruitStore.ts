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
/** 見出し（H2）＋本文＋画像 のシンプルなコンテンツブロック */
export interface RecruitBlock {
  title: string;
  body: string;
  image: string;
}
/** PRポイントの1項目（H3＋本文＋画像は任意） */
export interface RecruitPrPoint {
  title: string;
  body: string;
  image: string;
}
/** 職種の分類（募集職種一覧・オーバーレイのピルの色分けに使う。2026-09 改修）
 *  - food : 食品事業部（ドライアイス・営業・倉庫）→ 赤
 *  - ice  : アイス事業部（生産・品質・製造・商品開発）→ 青
 *  - admin: 総務部 → グレー
 *  - ""   : 未分類 → 黒
 * CMS（採用タブ）の「分類」プルダウンで設定する。 */
export type JobGroup = "food" | "ice" | "admin" | "";
export const JOB_GROUPS: { value: JobGroup; label: string; color: string; hint: string }[] = [
  { value: "food", label: "食品事業部", color: "#ff414d", hint: "ドライアイス・営業・倉庫" },
  { value: "ice", label: "アイス事業部", color: "#2563eb", hint: "生産・品質・製造・商品開発" },
  { value: "admin", label: "総務部", color: "#6b7a82", hint: "" },
  { value: "", label: "未分類", color: "#111111", hint: "" },
];
/** 分類に対応するピルの色（未分類・不明な値は黒） */
export function jobGroupColor(group: string | undefined): string {
  return JOB_GROUPS.find((g) => g.value === (group ?? ""))?.color ?? "#111111";
}

export interface RecruitJob {
  id: string;
  title: string;
  dept: string;
  /** 分類（ピルの色分け）。未設定・空は「未分類」 */
  group?: JobGroup | string;
  active: boolean;
  body: string;
  image: string;
  day: RecruitTimeline;
  career: RecruitTimeline;
  message: string;
  /** 1日の仕事内容（H2＋本文＋画像。旧データでは未設定の場合がある） */
  daywork?: RecruitBlock;
  /** やりがい・特徴（H2＋本文＋画像。旧データでは未設定の場合がある） */
  appeal?: RecruitBlock;
  /** この仕事のPRポイント（H2＋任意個数の H3/本文/画像。旧データでは未設定の場合がある） */
  pr?: { title: string; points: RecruitPrPoint[] };
  /** 求める人物像（PRポイントと同じ構造。旧データでは未設定の場合がある） */
  persona?: { title: string; points: RecruitPrPoint[] };
  /** こんな方であればぜひご応募ください（同上） */
  invite?: { title: string; points: RecruitPrPoint[] };
  /** 拠点（Googleマップ）。spots の各行が「拠点名＋住所」で、行ごとに地図を埋め込み表示 */
  map?: { title: string; spots: string[] };
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
  /** カテゴリ名（よくある質問の1階層目のアコーディオン。空・未設定は「その他」） */
  cat?: string;
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
