// 仕事とカルチャー（/recruit/work）。デザイン支給 iceline-saiyo/work.html。
// 「はたらく現場の動画」は動画管理（/console の動画）のデータを表示し、クリックで画面中央に再生する。
import { useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { VideoModal } from "../components/common/VideoMedia";
import { VIDEOS } from "../data/news";
import { ed, repeatSel, txt } from "../lib/editable";
import { rt } from "../lib/richInline";
import { Billboard, EntryBand, Fukidashi, HandNote, LeadText, LowerKv, NextIsland, SecHead } from "./RsParts";

const LEAD = "**特別じゃないけど、欠かせない。**\n\n氷は、もう特別なものではありません。\nコンビニでも、飲食店でも、家庭でも。\nどこにでもあって、当たり前に使われています。\n\n氷がなければ、夏の飲み物はぬるいまま。\n食品の鮮度も、守れないかもしれません。\n物流や医療の現場も、少し困るはず。\n\nつくり、運び、届ける。\n目立つことは、あまりありません。\nそれでも、なくなったら誰かが困る。\n\nその仕事を、私たちは今日も、丁寧に続けています。";

const CULTURE = [
  { title: "失敗を、隠さなくていい", text: "何かあったらまず話す。そのほうが早く解決できるし、次につながる。そういう空気を、みんなで少しずつ作っています。目安箱を設置し、社員一人ひとりと面談する機会を設け、言われたことを放置しない。小さなことの積み重ねが、この会社の文化になっていくのだと信じています。" },
  { title: "続けることが、形になる", text: "約束したことを守る。それを毎日続けていると、いつの間にかお客様から頼られるようになっている。積み重ねたものだけが、信頼として返ってくる。永年勤続表彰（勤続10年ごと）や、3年連続5%の昇給という形で、続けてきた人にきちんと還元する仕組みがあります。" },
  { title: "人々の日常に、そっと関わる仕事", text: "氷の製造から、食材の卸、物流、品質管理まで。アイスラインは、食品に関わる4つの事業を一つの会社の中に持っています。176名の社員が、誰かの食卓を、誰かの店を、誰かの日常を——表に出なくても、確かに支えています。" },
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

export function RsWork() {
  const rep = repeatSel("rs:culture.count", CULTURE.length, MAX_CULTURE, "カルチャーカードの数");
  const [playing, setPlaying] = useState<{ url: string; title: string } | null>(null);
  return (
    <>
      <LowerKv en="Work" jp="仕事とカルチャー" base="rs:work.kv" cloud={{ right: "6%", top: "14%", width: "min(26vw,320px)" }} />

      <section className="island">
        <div className="container">
          <div className="js-reveal">
            <h2
              style={{ fontSize: "var(--fs-heading)", fontWeight: 700, lineHeight: 1.6, marginBottom: 28, fontFeatureSettings: "'palt' 1", whiteSpace: "pre-line" }}
              {...ed("rs:work.h2", "仕事 見出し", { multiline: true })}
            >
              {rt("rs:work.h2", "氷と食のフィールドで、\n暮らしの当たり前を支える。")}
            </h2>
            <LeadText path="rs:work.lead" def={LEAD} />
          </div>

          {/* CULTURE */}
          <div className="island__sec">
            <SecHead>
              <Billboard en="Culture" jp="アイスラインのカルチャー" base="rs:work.cultureHead" />
              <Fukidashi path="rs:work.fuki" def="かざらない空気が、自慢です" />
            </SecHead>
            <div className="culture-grid js-reveal-group" {...rep.attrs}>
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

          {/* 動画 */}
          {VIDEOS.length > 0 && (
            <div className="island__sec">
              <SecHead>
                <Billboard en="Movie" jp="はたらく現場の動画" base="rs:work.movieHead" />
                <HandNote path="rs:work.movieNote" def="" />
              </SecHead>
              <div className="movie-grid js-reveal-group">
                {VIDEOS.map((v) => (
                  <div key={v.id} className="movie-card" role={v.videoUrl ? "button" : undefined} tabIndex={v.videoUrl ? 0 : undefined} onClick={() => v.videoUrl && setPlaying({ url: v.videoUrl, title: v.title })}>
                    <span className="movie-card__thumb">
                      <ImageWithFallback src={v.thumb} alt="" />
                      <span className="movie-card__play" aria-hidden />
                    </span>
                    <p className="movie-card__title">
                      {v.title}
                      {v.duration ? <span className="note" style={{ marginLeft: 8 }}>{v.duration}</span> : null}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      {playing && <VideoModal url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}

      <div className="sea-gap" />
      <NextIsland to="/recruit/people" en="People" jp={txt("rs:work.next.jp", "つぎは、働く人を知る →")} base="rs:work.next" />
      <EntryBand />
    </>
  );
}
