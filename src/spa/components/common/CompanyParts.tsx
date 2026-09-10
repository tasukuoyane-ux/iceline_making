// 会社情報ページと株式会社アイスマウンテンページ（/ice-mountain）で共有する部品（2026-09-10 追加）。
//  - CorpHero      … 画像背景＋中央タイトルのメインビジュアル（画像はコンソールで差し替え・縦位置調整可）
//  - ProfileTable  … 罫線テーブルの会社概要（行はコンソールの「追加」「削除」で増減できる）
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ed, edImg, img, repeatSel, txt } from "../../lib/editable";
import { rt } from "../../lib/richInline";

export function CorpHero({
  base,
  enPath,
  defEn,
  defTitle,
  defImage,
}: {
  /** 編集パスの接頭辞（例 "company:hero" → <base>.image / <base>.title） */
  base: string;
  /** 英語見出し（補助）の編集パス（例 "sectionEn:company.mv"） */
  enPath: string;
  defEn: string;
  defTitle: string;
  defImage: string;
}) {
  return (
    <section className="relative min-h-[40vh] w-full overflow-hidden bg-ink">
      <ImageWithFallback
        src={img(`${base}.image`, defImage)}
        alt={txt(`${base}.title`, defTitle)}
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        {...edImg(`${base}.image`, "メインビジュアル画像", { ypos: true })}
      />
      <div className="relative z-10 mx-auto flex min-h-[40vh] max-w-[1150px] flex-col items-center justify-center px-5 py-16 text-center pc:px-8 pc:py-20">
        <div style={{ textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}>
          <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }} {...ed(enPath, "英語見出し（補助）")}>
            {rt(enPath, defEn)}
          </p>
          <h1 className="text-white" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.2 }} {...ed(`${base}.title`, "ページタイトル")}>
            {rt(`${base}.title`, defTitle)}
          </h1>
        </div>
      </div>
    </section>
  );
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
