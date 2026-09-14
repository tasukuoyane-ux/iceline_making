// アイスラインとは？（/recruit/about）。デザイン支給 iceline-saiyo/about.html。
import { ed, repeatSel, txt } from "../lib/editable";
import { rt } from "../lib/richInline";
import { Billboard, EntryBand, Fukidashi, HandNote, LeadText, LowerKv, NextIsland, NumGrid, NUM_DEFAULTS_LONG, SecHead } from "./RsParts";

const LEAD = "**アイスラインは氷・食・物流の3つの要素から、人の生活を築き上げてきました。**\n毎日の食卓の安心を届けることが、私たちの使命です。\n\n氷の製造から、食材の卸、物流、品質管理まで。アイスラインは、食品に関わる4つの事業を一つの会社の中に持っています。176名の社員が、誰かの食卓を、誰かの店を、誰かの日常を——表に出なくても、確かに支えています。";

const BIZ = [
  { title: "氷・氷菓の製造販売", text: "純氷やかき氷、フレーバーアイスまで。1905年から続く、会社の原点となる事業です。低温で品質を守る技術を磨き続けています。" },
  { title: "業務用食材の販売", text: "飲食店や給食の現場へ、業務用食材を届けます。お客様の「いつもの味」を切らさないことが、営業と配送の腕の見せどころです。" },
  { title: "冷凍冷蔵倉庫業", text: "マイナス温度帯の倉庫で、地域の食品流通を支えます。温度と品質の管理は、目立たないけれど欠かせない仕事です。" },
  { title: "ドライアイスの販売", text: "食品の保冷から演出用まで、ドライアイスの加工・配送を行います。夏場は地域の氷需要を一手に引き受けます。" },
];
const MAX_BIZ = 6;

/** 事業アイコン（デザイン支給の線画。5枚目以降は順繰りに使う） */
export function BizIcon({ i }: { i: number }) {
  const common = { className: "culture-card__icon", viewBox: "0 0 68 68", fill: "none", stroke: "#0073C7", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (i % 4) {
    case 0:
      return (
        <svg {...common}>
          <rect x="12" y="12" width="44" height="44" rx="10" />
          <path d="M24 24 L34 34 M44 24 L34 34 M34 34 L34 46" />
        </svg>
      );
    case 1:
      return (
        <svg {...common}>
          <path d="M14 52 Q14 30 34 30 Q54 30 54 52 Z" />
          <path d="M34 30 L34 20 M28 14 Q34 10 40 14" />
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <rect x="10" y="24" width="30" height="22" rx="4" />
          <path d="M40 30 L52 30 L58 38 L58 46 L40 46" />
          <circle cx="21" cy="50" r="5" />
          <circle cx="49" cy="50" r="5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="16" y="26" width="36" height="26" rx="6" />
          <path d="M26 26 L26 18 Q26 14 30 14 L38 14 Q42 14 42 18 L42 26" />
          <path d="M26 60 Q30 54 34 60 Q38 66 42 60" opacity="0.7" />
        </svg>
      );
  }
}

const HISTORY = [
  { year: "1905", text: "明治38年、天然氷の販売から創業。岡山の地で氷とともに歩みはじめる。" },
  { year: "1955", text: "製氷工場を拡張し、純氷の製造販売を本格化。" },
  { year: "1978", text: "業務用食材の卸売事業を開始。「氷」から「食」へフィールドを広げる。" },
  { year: "1996", text: "冷凍冷蔵倉庫業に参入。低温物流の基盤を整える。" },
  { year: "2020", text: "アイスマウンテンにスムージーラインを新設。新しい商品づくりに挑戦。" },
  { year: "2026", text: "創業121年。氷・食・物流の4事業、社員176名。連結売上86億円。" },
];
const MAX_HISTORY = 14;

export function RsAbout() {
  const biz = repeatSel("rs:about.biz.count", BIZ.length, MAX_BIZ, "事業カードの数");
  const hist = repeatSel("rs:history.count", HISTORY.length, MAX_HISTORY, "年表の行数");
  return (
    <>
      <LowerKv en="About" jp="アイスラインとは？" base="rs:about.kv" />

      <section className="island">
        <div className="container">
          <div className="js-reveal">
            <Fukidashi path="rs:about.fuki" def="氷・食・物流の会社です" style={{ marginBottom: 26 }} />
            <LeadText path="rs:about.lead" def={LEAD} />
          </div>

          {/* 4つの事業 */}
          <div className="island__sec">
            <SecHead>
              <Billboard en="Business" jp="4つの事業" base="rs:about.bizHead" />
            </SecHead>
            <div className="culture-grid js-reveal-group" {...biz.attrs}>
              {Array.from({ length: MAX_BIZ }, (_, i) => {
                const d = BIZ[i] ?? { title: "", text: "" };
                return (
                  <div key={i} className="card culture-card">
                    <BizIcon i={i} />
                    <h3 className="culture-card__title" {...ed(`rs:about.biz.${i}.title`, `事業${i + 1} 見出し`)}>{rt(`rs:about.biz.${i}.title`, d.title || "（事業名）")}</h3>
                    <p className="culture-card__text" style={{ whiteSpace: "pre-line" }} {...ed(`rs:about.biz.${i}.text`, `事業${i + 1} 本文`, { multiline: true })}>
                      {rt(`rs:about.biz.${i}.text`, d.text || "（本文）")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 数字で見る（長文版） */}
          <div className="island__sec">
            <SecHead>
              <Billboard en="Numbers" jp="数字で見るアイスライン" base="rs:about.numHead" />
            </SecHead>
            <NumGrid base="rs:aboutNum" defaults={NUM_DEFAULTS_LONG} />
          </div>

          {/* あゆみ */}
          <div className="island__sec">
            <SecHead>
              <Billboard en="History" jp="アイスラインのあゆみ" base="rs:about.histHead" />
              <HandNote path="rs:about.histNote" def="" />
            </SecHead>
            <div className="history js-reveal-group" {...hist.attrs}>
              {Array.from({ length: MAX_HISTORY }, (_, i) => {
                const d = HISTORY[i] ?? { year: "", text: "" };
                return (
                  <div key={i} className="history__item">
                    <p className="history__year" {...ed(`rs:history.${i}.year`, `年表${i + 1} 年`)}>{rt(`rs:history.${i}.year`, d.year || "（年）")}</p>
                    <p className="history__text" style={{ whiteSpace: "pre-line" }} {...ed(`rs:history.${i}.text`, `年表${i + 1} 内容`, { multiline: true })}>
                      {rt(`rs:history.${i}.text`, d.text || "（内容）")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="sea-gap" />
      <NextIsland to="/recruit/work" en="Work" jp={txt("rs:about.next.jp", "つぎは、仕事とカルチャーを知る →")} base="rs:about.next" />
      <EntryBand />
    </>
  );
}
