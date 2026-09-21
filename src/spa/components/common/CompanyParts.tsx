// 会社情報ページと株式会社アイスマウンテンページ（/ice-mountain）で共有する部品（2026-09-10 追加）。
//  - CorpHero      … メインビジュアル（2026-09-21 から事業ページ共通の PageMv を使う。画像はコンソールで差し替え・縦位置調整可）
//  - ProfileTable  … 罫線テーブルの会社概要（行はコンソールの「追加」「削除」で増減できる）
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ed, edImg, img, repeatSel, txt } from "../../lib/editable";
import { rt } from "../../lib/richInline";
import { PageMv } from "./PageMv";

export function CorpHero({
  base,
  enPath,
  defEn,
  defTitle,
  defImage,
  crumbs,
}: {
  /** 編集パスの接頭辞（例 "company:hero" → <base>.image / <base>.title） */
  base: string;
  /** 英語見出し（補助）の編集パス（例 "sectionEn:company.mv"） */
  enPath: string;
  defEn: string;
  defTitle: string;
  defImage: string;
  /** パンくずリスト（例 [{ label: "会社情報" }]） */
  crumbs?: { label: string; to?: string }[];
}) {
  // 2026-09-21：事業ページと同じ共通部品 PageMv（白背景・30px マージン・ピル型の白座布団・パンくず）で描く
  return <PageMv imgSrc={img(`${base}.image`, defImage)} imgPath={`${base}.image`} enPath={enPath} enDef={defEn} titlePath={`${base}.title`} titleDef={defTitle} crumbs={crumbs} />;
}

/** 会社概要の罫線テーブル。行数はコンソールの「追加」「削除」で 1〜max に変更できる
 * （既定は rows の行数）。各行の項目名・内容ともに編集できる。 */
export function ProfileTable({
  countPath,
  rows,
  max = 12,
  countLabel = "会社概要の行数",
}: {
  /** 行数の編集パス（例 "company:profile.count"。行は "<接頭辞>.<n>.label / .value"） */
  countPath: string;
  rows: { label: string; value: string }[];
  max?: number;
  countLabel?: string;
}) {
  const rep = repeatSel(countPath, rows.length, max, countLabel);
  const prefix = countPath.replace(/count$/, "");
  return (
    <table className="mt-8 w-full border-t border-border">
      <tbody {...rep.attrs}>
        {Array.from({ length: max }, (_, i) => rows[i] ?? { label: "（項目名）", value: "（内容）" }).map((r, i) => (
          <tr key={i} className="border-b border-border align-top">
            {/* 罫線テーブル（デザイン支給：見出し列は座布団なし・太字） */}
            <th className="w-[9em] whitespace-nowrap py-[18px] pl-1 pr-4 text-left" style={{ fontSize: 15, fontWeight: 700 }} {...ed(`${prefix}${i}.label`, `項目名`)}>
              {rt(`${prefix}${i}.label`, r.label)}
            </th>
            <td className="px-1 py-[18px] text-foreground/80" style={{ fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`${prefix}${i}.value`, "内容", { multiline: true })}>
              {rt(`${prefix}${i}.value`, r.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
