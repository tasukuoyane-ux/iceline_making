// 募集職種の勤務地（部門名）タグの色分け（デザイン規定：本社=紺／食品事業部=濃青／
// ドライアイスチーム=水色／両工場=青緑／西大寺工場=緑／二日市工場=赤）。
// 一覧はこの並び順（カラーホイール順）でグルーピング表示する。
import type { CSSProperties } from "react";
import { jobGroupColor, type RecruitJob } from "../lib/recruitStore";

/** 勤務地（部門名）ごとのタグ色。デザイン規定の並び順（紺→濃青→水色→青緑→緑→赤）も返す */
export function deptTag(job: RecruitJob): { cls: string; order: number; style?: CSSProperties } {
  const d = job.dept || "";
  if (d.includes("本社")) return { cls: "tag--hq", order: 0 };
  if (d.includes("食品")) return { cls: "tag--food", order: 1 };
  if (d.includes("ドライアイス")) return { cls: "tag--dry", order: 2 };
  if (d.includes("西大寺") && d.includes("二日市")) return { cls: "tag--both", order: 3 };
  if (d.includes("西大寺")) return { cls: "tag--saidaiji", order: 4 };
  if (d.includes("二日市")) return { cls: "tag--futsukaichi", order: 5 };
  return { cls: "", order: 6, style: { background: jobGroupColor(job.group) } };
}

