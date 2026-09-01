import { useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft, PlayCircle } from "lucide-react";
import { useInterviews } from "../data/interviews";
import { hasVideo } from "../data/blocks";
import { ed, txt } from "../lib/editable";
import { BlockContent } from "../components/common/BlockContent";
import { MovieBadge } from "../components/common/MovieBadge";
import { VideoModal, VideoPoster } from "../components/common/VideoMedia";

export function Interview() {
  const { id } = useParams();
  // 記事は Payload（/admin の「採用記事」）から取得。取得完了までは同梱データで即時描画
  const { items, ready } = useInterviews();
  const iv = items.find((x) => x.id === id);
  // アイキャッチ動画のオーバーレイ再生（2026-09 改修）
  const [playing, setPlaying] = useState(false);

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
          {/* アイキャッチ：メイン画像。動画付きで画像が無い場合は動画の1フレーム目を表示 */}
          <VideoPoster image={iv.image} video={iv.video} alt={iv.name} className="h-full w-full object-cover opacity-80" />
        </motion.div>
        {(hasVideo(iv.blocks) || iv.video !== "") && <MovieBadge className="!right-5 !top-5" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />

        {/* アイキャッチ動画の再生ボタン（クリックで画面中央のオーバーレイに大きく表示） */}
        {iv.video !== "" && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="アイキャッチ動画を再生"
            className="group absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full text-white transition-transform hover:scale-105"
            style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.5))" }}
          >
            <PlayCircle size={84} strokeWidth={1.4} className="opacity-90 transition-opacity group-hover:opacity-100" />
          </button>
        )}

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
            {/* 自己紹介・趣味（/admin の採用記事で入力。未入力の項目は非表示。2026-09 追加） */}
            {(iv.intro !== "" || iv.hobby !== "") && (
              <div className="mt-5 max-w-[34em] space-y-1.5 text-white/80" style={{ fontSize: 14, lineHeight: 1.9 }}>
                {iv.intro !== "" && (
                  <p style={{ whiteSpace: "pre-line" }}>{iv.intro}</p>
                )}
                {iv.hobby !== "" && (
                  <p style={{ whiteSpace: "pre-line" }}>
                    <span className="mr-2 text-brand" style={{ fontWeight: 700 }}>趣味</span>
                    {iv.hobby}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* アイキャッチ動画のオーバーレイ再生 */}
      {playing && iv.video !== "" && <VideoModal url={iv.video} title={iv.lead} onClose={() => setPlaying(false)} />}

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
