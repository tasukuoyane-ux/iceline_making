// 採用トップ（/recruit）。デザイン支給 iceline-saiyo/index.html（2026-09-21 更新版：1ページ構成）。
// About（＋数字で見る）／Work（＋カルチャー）／People（＋動画・カンパニーデック）／Recruit（職種アコーディオン）／Movie
// をこのページに集約し、フッターや記事からは #about などのアンカーで戻ってくる。
// 職種は採用タブ（CMS）のデータ。「詳細・エントリー」でその場に概要を開き、
// 「詳細を見る」で職種詳細オーバーレイ（?job=<ID>）、「エントリーする」でエントリーページへ。
// インタビューカードは既存の記事ページ（/recruit/interview/:id）へ（ユーザー指定）。
import { useState } from "react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { VideoModal } from "../components/common/VideoMedia";
import { VIDEOS, type VideoItem } from "../data/news";
import { EDIT_MODE, ed, edImg, img, repeatSel, txt } from "../lib/editable";
import { rt, rich } from "../lib/richInline";
import { useRecruitData, type RecruitJob } from "../lib/recruitStore";
import { Billboard, FloeSvg, HandNote, LeadText, NumGrid, NUM_DEFAULTS_LONG, PeopleScroller, SecHead, Venn, WaveDivider } from "./RsParts";

export const DECK_COVER = "/images/recruit/deck_cover.jpg";

const HERO_LEAD = "必要なのは、笑顔とまっすぐさ。\nつくった自分より、そのままの自分。\nそこから、すべてがはじまります。\n\nつまずいたときに、話せるか。\nかくさなくていい場所で、\nこまったことは、声に出して。\n\nここから先を、\nいっしょにつくっていきましょう。";
const ABOUT_LEAD = "**アイスラインは氷・食・物流の3つの要素から、人の生活を築き上げてきました。**\n毎日の食卓の安心を届けることが、私たちの使命です。";
const WORK_LEAD = "**特別じゃないけど、欠かせない。**\n\n氷は、もう特別なものではありません。\nコンビニでも、飲食店でも、家庭でも。\nどこにでもあって、当たり前に使われています。\n\n氷がなければ、夏の飲み物はぬるいまま。\n食品の鮮度も、守れないかもしれません。\n物流や医療の現場も、少し困るはず。\n\nつくり、運び、届ける。\n目立つことは、あまりありません。\nそれでも、なくなったら誰かが困る。\n\nその仕事を、私たちは今日も、丁寧に続けています。";

/* ---------- カルチャー ---------- */
const CULTURE = [
  { title: "失敗を、隠さなくていい", text: "何かあったらまず話す。そのほうが早く解決できるし、次につながる。そういう空気を、みんなで少しずつ作っています。目安箱を設置し、社員一人ひとりと面談する機会を設け、言われたことを放置しない。小さなことの積み重ねが、この会社の文化になっていくのだと信じています。" },
  { title: "続けることが、形になる", text: "約束したことを守る。それを毎日続けていると、いつの間にかお客様から頼られるようになっている。積み重ねたものだけが、信頼として返ってくる。永年勤続表彰（勤続10年ごと）や、3年連続5%の昇給という形で、続けてきた人にきちんと還元する仕組みがあります。" },
  { title: "人々の日常に、そっと関わる仕事", text: "氷の製造から、食材の卸、物流、品質管理まで。アイスラインは、食品に関わる4つの事業（業務用食材の販売・氷氷菓の製造販売・冷凍冷蔵倉庫業・ドライアイスの販売）を一つの会社の中に持っています。176名の社員が、誰かの食卓を、誰かの店を、誰かの日常を——表に出なくても、確かに支えています。" },
];
const MAX_CULTURE = 6;

function CultureIcon({ i }: { i: number }) {
  const common = { className: "culture-card__icon", viewBox: "0 0 68 68", fill: "none", stroke: "#0073C7", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (i % 3) {
    case 0:
      return (
        <svg {...common}>
          <path d="M14 24 Q14 14 24 14 L44 14 Q54 14 54 24 L54 36 Q54 46 44 46 L30 46 L20 56 L20 46 Q14 44 14 36 Z" />
          <path d="M26 30 L42 30" />
        </svg>
      );
    case 1:
      return (
        <svg {...common}>
          <rect x="16" y="40" width="10" height="14" rx="3" />
          <rect x="29" y="30" width="10" height="24" rx="3" />
          <rect x="42" y="18" width="10" height="36" rx="3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="26" cy="24" r="8" />
          <circle cx="46" cy="28" r="6" />
          <path d="M12 54 Q12 38 26 38 Q40 38 40 54" />
          <path d="M42 52 Q44 40 52 40 Q58 40 58 52" opacity="0.8" />
        </svg>
      );
  }
}

/* ---------- 動画カード（動画管理のデータ。クリックで画面中央に再生） ---------- */
function MovieCard({ v, onPlay }: { v: VideoItem; onPlay: (v: VideoItem) => void }) {
  const playable = v.videoUrl !== "";
  return (
    <div className="movie-card" role={playable ? "button" : undefined} tabIndex={playable ? 0 : undefined} onClick={() => playable && onPlay(v)} onKeyDown={(e) => playable && (e.key === "Enter" || e.key === " ") && onPlay(v)}>
      <span className="movie-card__thumb">
        <ImageWithFallback src={v.thumb} alt="" />
        <span className="movie-card__play" aria-hidden />
      </span>
      <p className="movie-card__title">
        {v.title}
        {v.duration ? <span className="note" style={{ marginLeft: 8 }}>{v.duration}</span> : null}
      </p>
    </div>
  );
}

/* ---------- 募集職種（アコーディオン） ---------- */
/** 諸条件の行から「勤務地」「雇用形態」を拾う（無ければ部門名を勤務地に） */
function jobFacts(j: RecruitJob): { place: string; type: string } {
  const find = (re: RegExp) => (j.conditions ?? []).find((r) => re.test(r.label))?.value.trim() ?? "";
  return { place: find(/勤務地|勤務場所/) || j.dept, type: find(/雇用形態/) };
}
/** 仕事内容の先頭段落（概要として見せる。全文は職種詳細で） */
function firstPara(s: string): string {
  return s.trim().split(/\n\s*\n/)[0]?.trim() ?? "";
}

function JobAccordion({ j }: { j: RecruitJob }) {
  const f = jobFacts(j);
  const summary = firstPara(j.body);
  return (
    <details className="job-acc">
      <summary className="job-row">
        <span className="job-row__place">{j.dept}</span>
        <span className="job-row__name">{j.title}</span>
        <span className="job-row__badge" {...ed("rs:jobs.badge", "募集中バッジ")}>{rt("rs:jobs.badge", "募集中")}</span>
        <span className="job-row__link">
          <span {...ed("rs:jobs.link", "詳細リンク文言")}>{rt("rs:jobs.link", "詳細・エントリー")}</span>
          <span className="arrow">↓</span>
        </span>
      </summary>
      <div className="job-acc__body">
        {summary !== "" && (
          <p style={{ whiteSpace: "pre-line" }}>
            <strong>業務内容:</strong> {summary}
          </p>
        )}
        <p>
          <strong>勤務地:</strong> {f.place}
        </p>
        {f.type !== "" && (
          <p>
            <strong>雇用形態:</strong> {f.type}
          </p>
        )}
        <p className="job-acc__actions">
          <Link className="btn-line" to={`/recruit?job=${encodeURIComponent(j.id)}`} data-no-transition>
            <span {...ed("rs:jobs.detailBtn", "職種詳細ボタン文言")}>{rt("rs:jobs.detailBtn", "詳細を見る")}</span>
          </Link>
          <Link className="btn-entry" to={`/recruit/entry?job=${encodeURIComponent(j.id)}`}>
            <span {...ed("rs:jobs.entryBtn", "エントリーボタン文言")}>{rt("rs:jobs.entryBtn", "この職種にエントリーする")}</span>
            <span className="arrow">→</span>
          </Link>
        </p>
      </div>
    </details>
  );
}

export function RsIndex() {
  const { jobs } = useRecruitData();
  const active = jobs.filter((j) => j.active);
  const culture = repeatSel("rs:culture.count", CULTURE.length, MAX_CULTURE, "カルチャーカードの数");
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  // 動画：1本目を「仕事についての動画」として大きく、2本目以降を「はたらく現場の動画」に並べる
  const feature = VIDEOS[0];
  const rest = VIDEOS.slice(1);
  const deckUrl = txt("rs:deck.url", "");
  const deckCover = img("rs:deck.image", DECK_COVER);

  return (
    <>
      {/* KV: 氷の海（左の流氷は SVG、氷塊・地形・トラックは 3D 背景） */}
      <section className="hero">
        <div className="hero__art" aria-hidden>
          <FloeSvg style={{ left: "-4%", bottom: "6%", width: "min(34vw,420px)" }} />
        </div>
        <div className="hero__inner">
          <p className="hero__hand intro" {...ed("rs:hero.hand", "KV 手書き文字")}>{rt("rs:hero.hand", "株式会社アイスライン 採用サイト")}</p>
          <h1 className="hero__catch intro" style={{ whiteSpace: "pre-line" }} {...ed("rs:hero.catch", "KV キャッチコピー", { multiline: true })}>
            {rt("rs:hero.catch", "すなおな心で、\n一歩ずつ。")}
          </h1>
          <div className="hero__lead intro">
            <LeadText path="rs:hero.lead" def={HERO_LEAD} className="" label="KV 本文" />
          </div>
        </div>
        <div className="scroll-sign" aria-hidden>Scroll</div>
      </section>

      {/* アイスラインとは？ ＋ 数字で見る */}
      <section className="island" id="about">
        <div className="container">
          <SecHead>
            <Billboard en="About" jp="アイスラインとは？" base="rs:idx.about" />
          </SecHead>
          <LeadText path="rs:idx.about.lead" def={ABOUT_LEAD} className="lead-text js-reveal" />
          <Venn />
          <div className="island__sec" id="numbers">
            <SecHead>
              <Billboard en="Numbers" jp="数字で見るアイスライン" base="rs:idx.num" />
            </SecHead>
            <NumGrid base="rs:num" defaults={NUM_DEFAULTS_LONG} />
          </div>
        </div>
      </section>

      <WaveDivider />

      {/* アイスラインの仕事 ＋ CULTURE */}
      <section className="island" id="work" style={{ marginTop: "var(--sea-gap)" }}>
        <div className="container">
          <SecHead>
            <Billboard en="Work" jp="アイスラインの仕事" base="rs:idx.work" />
          </SecHead>
          <div className="js-reveal">
            <h3
              style={{ fontSize: "var(--fs-heading)", fontWeight: 700, lineHeight: 1.6, marginBottom: 28, fontFeatureSettings: "'palt' 1", whiteSpace: "pre-line" }}
              {...ed("rs:work.h2", "仕事 見出し", { multiline: true })}
            >
              {rt("rs:work.h2", "氷と食のフィールドで、暮らしの当たり前を支える。")}
            </h3>
            <LeadText path="rs:work.lead" def={WORK_LEAD} />
          </div>
          <div className="island__sec" id="culture">
            <SecHead>
              <Billboard en="Culture" jp="アイスラインのカルチャー" base="rs:work.cultureHead" />
            </SecHead>
            <div className="culture-grid js-reveal-group" {...culture.attrs}>
              {Array.from({ length: MAX_CULTURE }, (_, i) => {
                const d = CULTURE[i] ?? { title: "", text: "" };
                return (
                  <div key={i} className="card culture-card">
                    <CultureIcon i={i} />
                    <h3 className="culture-card__title" {...ed(`rs:culture.${i}.title`, `カルチャー${i + 1} 見出し`)}>{rt(`rs:culture.${i}.title`, d.title || "（見出し）")}</h3>
                    <p className="culture-card__text" style={{ whiteSpace: "pre-line" }} {...ed(`rs:culture.${i}.text`, `カルチャー${i + 1} 本文`, { multiline: true })}>
                      {rt(`rs:culture.${i}.text`, d.text || "（本文）")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* PEOPLE ＋ 動画 ＋ カンパニーデック */}
      <section className="island" id="people">
        <div className="container">
          <SecHead>
            <Billboard en="People" jp="人を知る" base="rs:idx.people" />
          </SecHead>
          <LeadText path="rs:people.lead" def="働く社員のインタビューを、カードをめくるように読めます。" className="lead-text js-reveal" />
          <HandNote path="rs:idx.people.note" def="→ 横にスクロールできます" style={{ margin: "14px 0 22px" }} />
          <PeopleScroller />

          {feature && (
            <div className="island__sec" id="video">
              <LeadText path="rs:video.lead" def="アイスラインの仕事についての動画です。" className="lead-text js-reveal" style={{ marginBottom: 26 }} />
              <div className="video-feature js-reveal">
                <MovieCard v={feature} onPlay={setPlaying} />
              </div>
            </div>
          )}

          <div className="island__sec" id="deck">
            <SecHead>
              <Billboard en="Company Deck" jp="カンパニーデック" base="rs:deck.head" />
            </SecHead>
            <LeadText path="rs:deck.lead" def="アイスラインの事業、体制、仕事について、詳しく知りたい方へ" className="lead-text js-reveal" />
            <div className="deck js-reveal" style={{ marginTop: 30 }}>
              <figure className="deck__cover">
                <ImageWithFallback src={deckCover} alt="カンパニーデック 表紙" {...edImg("rs:deck.image", "カンパニーデック 表紙画像")} />
              </figure>
              <p style={{ textAlign: "center", marginTop: 22 }}>
                <a className="btn-line" href={deckUrl || deckCover} target="_blank" rel="noopener noreferrer">
                  <span {...ed("rs:deck.btn", "カンパニーデック ボタン文言")}>{rt("rs:deck.btn", "全画面で見る")}</span>
                </a>
              </p>
              {EDIT_MODE && (
                <p className="note" style={{ textAlign: "center", marginTop: 8 }} {...ed("rs:deck.url", "カンパニーデック リンク先URL（PDF など。空なら表紙画像を開く）")}>
                  {rich(deckUrl || "（リンク先URL・任意。空なら表紙画像をそのまま開きます）")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RECRUIT 募集職種一覧 */}
      <section className="island" id="recruit">
        <div className="container">
          <SecHead>
            <Billboard en="Recruit" jp="募集職種一覧" base="rs:idx.recruit" />
          </SecHead>
          <LeadText path="rs:jobs.lead" def="職種名を選ぶと、業務内容・PRポイント・諸条件・選考の流れなどの詳細をご覧いただけます。" className="lead-text js-reveal" />
          <div className="job-list js-reveal-group" style={{ marginTop: 40 }}>
            {active.map((j) => (
              <JobAccordion key={j.id} j={j} />
            ))}
            {active.length === 0 && <p className="note">現在募集中の職種はありません。</p>}
          </div>
        </div>
      </section>

      {/* MOVIE はたらく現場の動画（動画管理の 2 本目以降） */}
      {rest.length > 0 && (
        <section className="island" id="movie">
          <div className="container">
            <SecHead>
              <Billboard en="Movie" jp="はたらく現場の動画" base="rs:work.movieHead" />
              <HandNote path="rs:work.movieNote" def="" />
            </SecHead>
            <div className="movie-grid js-reveal-group">
              {rest.map((v) => (
                <MovieCard key={v.id} v={v} onPlay={setPlaying} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="sea-gap" />
      {playing && <VideoModal url={playing.videoUrl} title={playing.title} onClose={() => setPlaying(null)} />}
    </>
  );
}
