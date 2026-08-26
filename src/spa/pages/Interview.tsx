import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useInterviews } from "../data/interviews";
import { hasVideo } from "../data/blocks";
import { ed, edImg, txt } from "../lib/editable";
import { BlockContent } from "../components/common/BlockContent";
import { MovieBadge } from "../components/common/MovieBadge";

export function Interview() {
  const { id } = useParams();
  // 記事は Payload（/admin の「採用記事」）から取得。取得完了までは同梱データで即時描画
  const { items, ready } = useInterviews();
  const iv = items.find((x) => x.id === id);

  if (!iv) {
    // Payload 側にだけある新しい記事の可能性があるため、取得完了までは判定しない
    if (!ready) return null;
    return (
      <div className="mx-auto max-w-3xl px-5 py-32 text-center">
        <p>記事が見つかりませんでした。</p>
        <Link to="/recruit" className="mt-4 inline-block text-brand">採用情報へ戻る</Link>
      </div>
    );
  }

  const pre = `interviews:${iv.id}`;

  return (
    <article className="bg-background">
      {/* ===== ヒーロー ===== */}
      <section className="relative flex h-[78vh] min-h-[520px] w-full items-end overflow-hidden bg-ink">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <ImageWithFallback src={iv.image} alt={iv.name} className="h-full w-full object-cover opacity-80" {...edImg(`${pre}:image`, "メイン画像")} />
        </motion.div>
        {hasVideo(iv.blocks) && <MovieBadge className="!right-5 !top-5" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />

        <div className="relative mx-auto w-full max-w-[1100px] px-5 pb-16 pc:px-8 pc:pb-24">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: "easeOut" }}>
            <p className="mb-5 flex items-center gap-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.28em", fontSize: 13 }}>
              <span className="inline-block h-px w-10 bg-brand" />
              <span {...ed("sectionEn:interview.mv", "英語見出し（補助）")}>{txt("sectionEn:interview.mv", "INTERVIEW")}</span>
            </p>
            <h1
              className="max-w-[18em] text-white"
              style={{ fontSize: "clamp(34px, 5.2vw, 60px)", fontWeight: 900, lineHeight: 1.28, letterSpacing: "0.01em" }}
              {...ed(`${pre}:lead`, "見出しコピー")}
            >
              {iv.lead}
            </h1>
            {iv.subtitle && (
              <p
                className="mt-5 max-w-[28em] text-white/80"
                style={{ fontSize: "clamp(15px, 2vw, 20px)", fontWeight: 500, lineHeight: 1.6 }}
                {...ed(`${pre}:subtitle`, "サブタイトル")}
              >
                {iv.subtitle}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-white/85">
              <span style={{ fontSize: 20, fontWeight: 700 }} {...ed(`${pre}:name`, "氏名")}>{iv.name}</span>
              <span className="text-white/55" style={{ fontSize: 13 }} {...ed(`${pre}:role`, "所属・役職")}>{iv.role}</span>
              <span className="text-white/55" style={{ fontSize: 13 }} {...ed(`${pre}:years`, "在籍年数")}>{iv.years}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== 本文（エディトリアル） ===== */}
      <div className="mx-auto max-w-[760px] px-5 py-16 pc:py-24">
        <Link to="/recruit" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-brand" style={{ fontSize: 13 }}>
          <ChevronLeft size={16} /> 採用情報へ戻る
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10"
        >
          <BlockContent blocks={iv.blocks} className="[&>p]:text-foreground/90" />
        </motion.div>
      </div>

      {/* フッター前のCTAセクション（JOIN US）は 2026-08 改修で削除。
          エントリー導線は本文の「求人エントリーリンク」ブロックで記事ごとに設置する */}
    </article>
  );
}
