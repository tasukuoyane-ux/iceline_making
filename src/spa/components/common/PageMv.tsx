import { type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { RichBody } from "./RichBody";
import { Breadcrumbs } from "./Breadcrumbs";
import { ed, edImg, txt } from "../../lib/editable";
import { rt } from "../../lib/richInline";

// ─────────────────────────────────────────────────────────
// 事業ページ・会社情報・アイスマウンテン共通のメインビジュアル（2026-09-21 改修。参考：LINEヤフー サービスページ）。
//   - 白背景のセクションの中に、パンくずリスト（crumbs。例「ホーム｜サービス｜氷・氷菓の製造販売」）→ 左右下 30px マージン・角丸 18px の画像
//   - 画像の上（左寄せ・上下中央）に白い座布団（角丸 8px）を敷き、黒文字のページタイトルと赤文字の英語見出し
//   - 「ページ本文（タイトル直下）」は黒文字で画像の下に置く（overviewPath 省略時は無し。children はその後ろ：ECボタン等）
// 画像・英語見出し・タイトル・本文の編集パスは呼び出し側が渡す（従来のパスをそのまま使う）。
// ─────────────────────────────────────────────────────────
export function PageMv({
  imgSrc,
  imgPath,
  imgStyle,
  enPath,
  enDef,
  titlePath,
  titleDef,
  overviewPath,
  overviewDef = "",
  overviewLabel = "ページ本文（タイトル直下）",
  crumbs,
  children,
}: {
  imgSrc: string;
  /** 画像の編集パス（コンソールの「メインビジュアル画像」。縦位置スライダー付き） */
  imgPath: string;
  imgStyle?: CSSProperties;
  enPath: string;
  enDef: string;
  titlePath: string;
  titleDef: string;
  overviewPath?: string;
  overviewDef?: string;
  overviewLabel?: string;
  /** パンくずリスト（先頭は「ホーム」を自動で付ける）。to があればリンク */
  crumbs?: { label: string; to?: string }[];
  children?: ReactNode;
}) {
  const title = txt(titlePath, titleDef);
  return (
    <section className="w-full bg-white">
      {/* パンくずリスト（画像の上・左寄せ） */}
      {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
      {/* 画像（左右 30px・下 30px のマージン、角丸 18px） */}
      <div className="px-[30px] pb-[30px] pt-3">
        <div className="relative min-h-[40vh] w-full overflow-hidden rounded-[18px] bg-secondary" data-mv>
          <ImageWithFallback
            src={imgSrc}
            alt={title}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
            style={imgStyle}
            {...edImg(imgPath, "メインビジュアル画像", { ypos: true })}
          />
          <div className="relative z-10 mx-auto flex min-h-[40vh] max-w-[1150px] flex-col items-start justify-center px-6 py-16 pc:px-12 pc:py-20">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col items-start">
              {/* 白い座布団＋黒文字のページタイトル */}
              <h1 className="bg-white px-6 py-2 text-foreground" style={{ fontSize: "clamp(28px, 4.6vw, 46px)", fontWeight: 800, lineHeight: 1.25, borderRadius: 8 }} {...ed(titlePath, "ページタイトル")}>
                {rt(titlePath, titleDef)}
              </h1>
              {/* 英語見出し（補助）：小さめの白い座布団に赤文字 */}
              <p className="mt-2 bg-white px-3 py-1 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.12em", fontSize: 12, fontWeight: 600, borderRadius: 8 }} {...ed(enPath, "英語見出し（補助）")}>
                {rt(enPath, enDef)}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      {/* 旧「事業概要」の本文：黒文字で画像の下に置く */}
      {(overviewPath || children) && (
        <div className="mx-auto max-w-[1150px] px-5 pb-16 pt-6 pc:px-8 pc:pb-20 pc:pt-8">
          {overviewPath && (
            <RichBody
              path={overviewPath}
              text={txt(overviewPath, overviewDef)}
              label={overviewLabel}
              className="mx-auto max-w-3xl text-left text-foreground"
              style={{ fontSize: 17, fontWeight: 700, lineHeight: 2.1 }}
            />
          )}
          {children}
        </div>
      )}
    </section>
  );
}
