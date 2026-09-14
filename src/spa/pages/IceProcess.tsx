import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { RichBody } from "../components/common/RichBody";
import { HEAT } from "../data/heatMap";
import { IMG } from "../data/images";
import { ed, edImg, img, txt } from "../lib/editable";
import { rt } from "../lib/richInline";
import { DetailSectionBlock, ICE_PROCESS_SECTIONS } from "./DivisionPage";

// ─────────────────────────────────────────────────────────
// 氷・氷菓：製造方法ページ /ice/process（2026-09-14 追加）。
// 氷・氷菓ページにあった「製造の特徴」「氷ができるまで」の2セクションをそのまま移した
// （セクション定義・編集パスは DivisionPage.tsx の DETAIL_PRE.ice のものを共用。
// コンソールでの編集内容は移動前と同じキーに保存される）。
// メニューには出さず、氷・氷菓ページ「氷・氷菓事業の特徴」末尾の CTA「製造方法はこちら」から遷移する。
// ヘッダー（メインビジュアル）は各事業ページと同じ構成で、画像・英字・タイトル・本文を編集できる。
// ─────────────────────────────────────────────────────────
const OVERVIEW_DEFAULT =
  "純度の高い原料水と、工場ごとに最適化した製法。アイスラインの氷が「硬く透明で溶けにくい」理由と、氷ができるまでの工程をご紹介します。";

export function IceProcess() {
  const title = txt("iceprocess:mv.title", "氷の製造方法");
  return (
    <>
      {/* メインビジュアル（各事業ページと同じ構成。既定画像は氷・氷菓ページの MV 画像） */}
      <section className="relative min-h-[40vh] w-full overflow-hidden bg-ink">
        <ImageWithFallback
          src={img("iceprocess:mv.image", IMG.iceMv)}
          alt={title}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
          {...edImg("iceprocess:mv.image", "メインビジュアル画像", { ypos: true })}
        />
        <div className="relative z-10 mx-auto flex min-h-[40vh] max-w-[1150px] flex-col items-center justify-center px-5 py-16 text-center pc:px-8 pc:py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }} {...ed("iceprocess:mv.en", "英語見出し（補助）")}>
              {rt("iceprocess:mv.en", "ICE PROCESS")}
            </p>
            <h1 className="text-white" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.2 }} {...ed("iceprocess:mv.title", "ページタイトル")}>
              {rt("iceprocess:mv.title", "氷の製造方法")}
            </h1>
            <RichBody
              path="iceprocess:overview"
              text={txt("iceprocess:overview", OVERVIEW_DEFAULT)}
              label="ページ本文（タイトル直下）"
              className="mx-auto mt-6 max-w-3xl text-left pc:text-center"
              style={{ fontSize: 16, lineHeight: 2.1, color: "rgba(255,255,255,0.95)" }}
            />
          </motion.div>
        </div>
      </section>

      {/* 製造の特徴 → 氷ができるまで（氷・氷菓ページから移動。内容・編集パスは従来のまま） */}
      {ICE_PROCESS_SECTIONS.map((sec, si) => (
        <DetailSectionBlock key={sec.pathKey ?? si} division="ice" si={si} sec={sec} heat={si % 2 ? HEAT.iceList : HEAT.iceReason} />
      ))}
    </>
  );
}
