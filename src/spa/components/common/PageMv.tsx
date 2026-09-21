import { type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { RichBody } from "./RichBody";
import { ed, edImg, txt } from "../../lib/editable";
import { rt } from "../../lib/richInline";

// ─────────────────────────────────────────────────────────
// 事業ページ共通のメインビジュアル（2026-09-21 改修。参考：LINEヤフー サービスページ）。
//   - 白背景のセクションの中に、上下左右 30px のマージン・角丸 18px の画像カードを置く
//   - 画像の上（左寄せ・上下中央）に白い座布団を敷き、黒文字でページタイトルと英語見出し
//   - 「ページ本文（タイトル直下）」は黒文字で画像カードの下に置く（children はその後ろ：ECボタン等）
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
  overviewDef,
  overviewLabel = "ページ本文（タイトル直下）",
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
  overviewPath: string;
  overviewDef: string;
  overviewLabel?: string;
  children?: ReactNode;
}) {
  const title = txt(titlePath, titleDef);
  return (
    <section className="w-full bg-white">
      {/* 画像カード（30px マージン・角丸 18px） */}
      <div className="p-[30px]">
        <div className="relative min-h-[40vh] w-full overflow-hidden rounded-[18px] bg-secondary">
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
              <h1 className="bg-white px-4 py-2 text-foreground" style={{ fontSize: "clamp(30px, 4.6vw, 48px)", fontWeight: 900, lineHeight: 1.25 }} {...ed(titlePath, "ページタイトル")}>
                {rt(titlePath, titleDef)}
              </h1>
              {/* 英語見出し（補助）：小さめの白い座布団 */}
              <p className="mt-2 bg-white px-3 py-1 text-foreground" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.12em", fontSize: 14, fontWeight: 700 }} {...ed(enPath, "英語見出し（補助）")}>
                {rt(enPath, enDef)}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      {/* 旧「事業概要」の本文：黒文字で画像カードの下に置く */}
      <div className="mx-auto max-w-[1150px] px-5 pb-16 pt-6 pc:px-8 pc:pb-20 pc:pt-8">
        <RichBody
          path={overviewPath}
          text={txt(overviewPath, overviewDef)}
          label={overviewLabel}
          className="mx-auto max-w-3xl text-left text-foreground"
          style={{ fontSize: 17, fontWeight: 700, lineHeight: 2.1 }}
        />
        {children}
      </div>
    </section>
  );
}
