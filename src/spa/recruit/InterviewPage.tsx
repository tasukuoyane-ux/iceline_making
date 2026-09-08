// 社員インタビュー記事（/recruit/interview/:id）。
// 記事の内容は Payload（/admin の「採用記事」）のまま、見た目をデザイン支給 interview/*.html に
// 合わせて描画する。本文ブロックは
//   H2 → セクション見出し（波線マーカー）／ H3 → 紙窓の見出し／ 段落 → 紙窓の本文
//   画像・動画 → 氷フレームの写真枠／ 求人エントリーリンク → 赤ボタン
// に対応させる。背景は職種詳細と同じ land モード（全面が緑の陸地・雪なし・文字は黒基調。2026-09 改修）。
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { VideoModal, VideoPoster } from "../components/common/VideoMedia";
import { useInterviews } from "../data/interviews";
import { useRecruitData } from "../lib/recruitStore";
import type { Block } from "../data/blocks";
import { toEmbed } from "../lib/video";
import { ed, txt } from "../lib/editable";
import { RecruitFrame } from "./RecruitFrame";
import { Marked, OutlineText, PersonArt, PlayIcon } from "./parts";

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

/** ブロック列を「セクション（H2）→ 紙窓（H3＋段落）／写真枠／リンク」に組み直して描画 */
function Article({ blocks }: { blocks: Block[] }) {
  const { jobs } = useRecruitData();
  type Sec = { title?: string; items: ReactNode[] };
  const secs: Sec[] = [];
  let cur: Sec = { items: [] };
  let win: { title?: string; paras: string[] } | null = null;
  let key = 0;
  const flushWin = () => {
    if (!win) return;
    const w = win;
    cur.items.push(
      <div key={key++} className="iv-block reveal">
        {w.title && <h3>{w.title}</h3>}
        {w.paras.map((p, i) => (
          <p key={i} style={{ whiteSpace: "pre-line" }}>{renderInline(p)}</p>
        ))}
      </div>,
    );
    win = null;
  };
  for (const b of blocks) {
    if (b.type === "h2") {
      flushWin();
      if (cur.title || cur.items.length) secs.push(cur);
      cur = { title: b.text, items: [] };
    } else if (b.type === "h3") {
      flushWin();
      win = { title: b.text, paras: [] };
    } else if (b.type === "paragraph") {
      if (!win) win = { paras: [] };
      win.paras.push(b.text);
    } else if (b.type === "image") {
      flushWin();
      const im = <ImageWithFallback src={b.src} alt={b.alt || ""} />;
      cur.items.push(
        <figure key={key++} className="iv-photo reveal">
          <div className="iv-photo__ph">{b.href ? <a href={b.href} target="_blank" rel="noopener noreferrer">{im}</a> : im}</div>
          {b.alt && <figcaption>{b.alt}</figcaption>}
        </figure>,
      );
    } else if (b.type === "video") {
      flushWin();
      const embed = toEmbed(b.src);
      cur.items.push(
        <figure key={key++} className="iv-photo reveal">
          <div className="iv-photo__ph">
            {embed?.type === "iframe" ? (
              <iframe src={embed.src} title={b.caption || "動画"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : embed ? (
              <video src={embed.src} controls playsInline />
            ) : null}
          </div>
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>,
      );
    } else if (b.type === "recruitLink") {
      flushWin();
      const job = jobs.find((j) => j.id === b.job);
      cur.items.push(
        <p key={key++} className="iv-link reveal">
          <Link to={`/recruit?job=${encodeURIComponent(b.job)}&entry=1`} className="btn btn--entry">
            {b.label || (job ? `${job.title}にエントリーする` : "この職種にエントリーする")}
          </Link>
        </p>,
      );
    }
  }
  flushWin();
  if (cur.title || cur.items.length) secs.push(cur);
  return (
    <>
      {secs.map((s, i) => (
        <section key={i} className="iv-section">
          {s.title && (
            <h2 className="section__title reveal">
              <Marked text={s.title} />
            </h2>
          )}
          {s.items}
        </section>
      ))}
    </>
  );
}

export function InterviewPage() {
  const { id } = useParams();
  const { items, ready } = useInterviews();
  const iv = items.find((x) => x.id === id);
  const [playing, setPlaying] = useState(false);
  const idx = Math.max(0, items.findIndex((x) => x.id === id));

  return (
    <RecruitFrame land>
      {!iv ? (
        ready ? (
          <div className="iv-notfound">
            <p>記事が見つかりませんでした。</p>
            <Link to="/recruit" className="btn btn--corp">採用情報へ戻る</Link>
          </div>
        ) : (
          <div className="iv-notfound" />
        )
      ) : (
        <>
          <section className="iv-hero">
            <span className="kicker reveal" {...ed("sectionEn:interview.mv", "英字ラベル")}>{txt("sectionEn:interview.mv", "INTERVIEW")}</span>
            <h1 className="iv-hero__catch reveal">
              <OutlineText text={iv.lead} />
            </h1>
            {iv.subtitle && <p className="iv-hero__sub reveal">{iv.subtitle}</p>}
            <div className="iv-meta reveal">
              <div className="iv-meta__photo">
                {iv.image ? <ImageWithFallback src={iv.image} alt={iv.name} /> : <PersonArt variant={idx} size={96} />}
              </div>
              <div>
                <div className="iv-meta__name">{iv.name}</div>
                <p className="iv-meta__role">
                  {iv.role}
                  {iv.years && (
                    <>
                      <br />
                      {iv.years}
                    </>
                  )}
                </p>
                {iv.intro !== "" && <p className="iv-meta__intro">{iv.intro}</p>}
                {iv.hobby !== "" && (
                  <p className="iv-meta__hobby">
                    <strong>趣味</strong>
                    {iv.hobby}
                  </p>
                )}
              </div>
            </div>
            {/* アイキャッチ動画（設定時のみ。クリックで画面中央に大きく再生） */}
            {iv.video !== "" && (
              <div className="container" style={{ marginTop: 40 }}>
                <figure className="iv-photo reveal">
                  <div className="iv-photo__ph">
                    <VideoPoster image={iv.image} video={iv.video} alt={iv.lead} />
                    <button type="button" className="iv-photo__play" aria-label="アイキャッチ動画を再生" onClick={() => setPlaying(true)}>
                      <PlayIcon size={72} />
                    </button>
                  </div>
                </figure>
              </div>
            )}
          </section>
          {playing && iv.video !== "" && <VideoModal url={iv.video} title={iv.lead} onClose={() => setPlaying(false)} />}

          <div className="container iv-body">
            <Article blocks={iv.blocks} />
            <div className="iv-actions reveal">
              <Link to="/recruit#people" className="btn btn--corp">採用情報へ戻る</Link>
              <Link to="/recruit#jobs" className="btn btn--entry">エントリー</Link>
            </div>
          </div>
        </>
      )}
    </RecruitFrame>
  );
}
