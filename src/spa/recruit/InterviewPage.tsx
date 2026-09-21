// 社員インタビュー記事（/recruit/interview/:id）。
// 記事の内容は Payload（/admin の「採用記事」）のまま、見た目をデザイン支給 iceline-saiyo の
// 記事デザイン（interview-*.html、2026-09-21 更新版）に合わせて描画する。
//   - ページ上部：人物写真（16:9・.article__photo.-portrait。動画があれば再生ボタン付き）
//   - 見出し：INTERVIEW／タイトル（リード）／サブタイトル／氏名・所属・入社年＋趣味／自己紹介（note）
//   - 本文ブロックの対応：H2 → 次の H3 のセクションラベル（.article__section-label）／H3 → 見出し／
//     段落 → p／画像・動画 → 図版（記事の写真は縦横比を保つ）／求人エントリーリンク → 記事末尾の赤ボタン
//   - 末尾：「採用情報へ戻る」（/recruit#people）「募集職種を見る」（/recruit#recruit）
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { VideoModal, VideoPoster } from "../components/common/VideoMedia";
import { useInterviews } from "../data/interviews";
import { useRecruitData } from "../lib/recruitStore";
import type { Block } from "../data/blocks";
import { toEmbed } from "../lib/video";
import { txt } from "../lib/editable";
import { BtnLine, LowerKv } from "./RsParts";

// 段落テキスト内の **太字** と ==マーカー== （記事エディタの装飾）を描画
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|==([^=]+)==/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={key++}>{m[1]}</strong>);
    else if (m[2] !== undefined) out.push(<span key={key++} className="marker-text">{m[2]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** 本文ブロック → 記事デザイン。H2 はセクションラベルとして次の H3 に添える */
function ArticleBody({ blocks }: { blocks: Block[] }) {
  const out: ReactNode[] = [];
  let label: string | null = null;
  let key = 0;
  const heading = (title?: string) => {
    if (!label && !title) return;
    out.push(
      <h3 key={key++} className="js-reveal">
        {label && <span className="article__section-label">{label}</span>}
        {title}
      </h3>,
    );
    label = null;
  };
  for (const b of blocks) {
    if (b.type === "h2") {
      if (label) heading();
      label = b.text;
    } else if (b.type === "h3") {
      heading(b.text);
    } else if (b.type === "paragraph") {
      if (label) heading();
      out.push(
        <p key={key++} className="js-reveal" style={{ whiteSpace: "pre-line" }}>
          {renderInline(b.text)}
        </p>,
      );
    } else if (b.type === "image") {
      if (label) heading();
      const im = <ImageWithFallback src={b.src} alt={b.alt || ""} />;
      out.push(
        <figure key={key++} className="article__fig js-reveal">
          {b.href ? (
            <a href={b.href} target="_blank" rel="noopener noreferrer">
              {im}
            </a>
          ) : (
            im
          )}
          {b.alt && <figcaption>{b.alt}</figcaption>}
        </figure>,
      );
    } else if (b.type === "video") {
      if (label) heading();
      const embed = toEmbed(b.src);
      out.push(
        <figure key={key++} className="article__fig js-reveal">
          {embed?.type === "iframe" ? (
            <iframe src={embed.src} title={b.caption || "動画"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : embed ? (
            <video src={embed.src} controls playsInline />
          ) : null}
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>,
      );
    }
    // recruitLink は記事末尾の CTA 行で描画する
  }
  if (label) heading();
  return <div className="article__body">{out}</div>;
}

/** 記事内の「求人エントリーリンク」ブロック → エントリーページ（希望職種を選択済み）へ */
function RecruitLinkButton({ b }: { b: Extract<Block, { type: "recruitLink" }> }) {
  const { jobs } = useRecruitData();
  const job = jobs.find((j) => j.id === b.job);
  return (
    <Link to={`/recruit/entry?job=${encodeURIComponent(b.job)}`} className="btn-entry">
      {b.label || (job ? `${job.title}にエントリーする` : "この職種にエントリーする")}
      <span className="arrow">→</span>
    </Link>
  );
}

export function InterviewPage() {
  const { id } = useParams();
  const { items, ready } = useInterviews();
  const iv = items.find((x) => x.id === id);
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <LowerKv en={txt("rs:interview.kv.en", "Interview")} jp={txt("rs:interview.kv.jp", "人を知る")} base="rs:interview.kv" />
      <section className="island">
        <div className="container">
          {!iv ? (
            <div className="js-reveal is-inview" style={{ textAlign: "center" }}>
              {ready && (
                <>
                  <p className="lead-text">記事が見つかりませんでした。</p>
                  <p style={{ marginTop: 28 }}>
                    <BtnLine to="/recruit#people" def="採用情報へ戻る" />
                  </p>
                </>
              )}
            </div>
          ) : (
            <article className="article">
              {/* 人物写真（ページ上部）。動画があれば再生ボタン */}
              {(iv.image !== "" || iv.video !== "") && (
                <figure className="article__photo -portrait js-reveal">
                  {iv.video !== "" ? (
                    <>
                      <VideoPoster image={iv.image} video={iv.video} alt={iv.lead} />
                      <button type="button" className="article__play" aria-label="アイキャッチ動画を再生" onClick={() => setPlaying(true)} />
                    </>
                  ) : (
                    <ImageWithFallback src={iv.image} alt={`${iv.name}のポートレート`} />
                  )}
                </figure>
              )}
              <header className="js-reveal">
                <p className="article__kicker">{txt("rs:interview.kicker", "INTERVIEW")}</p>
                <h2 className="article__title">{iv.lead}</h2>
                {iv.subtitle && <p className="article__sub">{iv.subtitle}</p>}
                <div className="article__meta">
                  <p className="article__name">{iv.name}</p>
                  {iv.role && <span className="job-row__place">{iv.role}</span>}
                  {(iv.years || iv.hobby) && (
                    <span className="note">
                      {iv.years}
                      {iv.years && iv.hobby ? "｜" : ""}
                      {iv.hobby ? `趣味: ${iv.hobby}` : ""}
                    </span>
                  )}
                </div>
                {iv.intro !== "" && (
                  <p className="note" style={{ marginTop: 16, whiteSpace: "pre-line" }}>
                    {iv.intro}
                  </p>
                )}
              </header>
              <ArticleBody blocks={iv.blocks} />
              <div className="article__actions js-reveal">
                {iv.blocks
                  .filter((b): b is Extract<Block, { type: "recruitLink" }> => b.type === "recruitLink")
                  .map((b, i) => (
                    <RecruitLinkButton key={i} b={b} />
                  ))}
                <BtnLine to="/recruit#people" path="rs:interview.backBtn" def="採用情報へ戻る" noArrow />
                <BtnLine to="/recruit#recruit" path="rs:interview.jobsBtn" def="募集職種を見る" />
              </div>
            </article>
          )}
        </div>
      </section>
      {playing && iv && iv.video !== "" && <VideoModal url={iv.video} title={iv.lead} onClose={() => setPlaying(false)} />}

      <div className="sea-gap" />
    </>
  );
}
