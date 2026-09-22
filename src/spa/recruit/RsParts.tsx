// 採用サイト共通の部品（デザイン支給 iceline-saiyo の HTML 断片を React 化したもの）。
//   Billboard（英字看板＋日本語見出し）／LowerKv（下層 KV）／SecHead／LeadText／EntryBand／NextIsland
//   ／PeopleScroller（インタビューカード）／NumGrid（数字で見る）／Venn（ベン図）／雲・流氷の SVG
// 文言はすべてコンソールで編集できる（編集パスは rs:〜）。
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useInterviews } from "../data/interviews";
import { EDIT_MODE, ed, repeatSel, txt } from "../lib/editable";
import { rt, rich } from "../lib/richInline";

/* ---------- SVG あしらい ---------- */
export function CloudSvg({ style, className = "float -slow" }: { style?: CSSProperties; className?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 300 160" fill="none" opacity="0.9" aria-hidden>
      <path d="M58,122 Q30,122 26,100 Q8,96 12,76 Q16,56 38,58 Q44,32 72,34 Q86,14 112,24 Q136,8 158,26 Q184,16 198,38 Q224,34 232,58 Q254,62 250,84 Q248,108 222,110 Q212,124 192,120 Q170,132 146,126 Q120,134 96,126 Q74,132 58,122 Z" fill="#FFFFFF" />
      <path d="M26,100 Q80,116 146,114 Q196,112 250,90 Q248,108 222,110 Q212,124 192,120 Q170,132 146,126 Q120,134 96,126 Q74,132 58,122 Q30,122 26,100 Z" fill="#DDF1FF" opacity="0.85" />
    </svg>
  );
}

export function FloeSvg({ style }: { style?: CSSProperties }) {
  return (
    <svg className="float -slow" style={style} viewBox="0 0 300 170" fill="none" opacity="0.95" aria-hidden>
      <path d="M18,120 Q2,112 8,94 L34,80 Q30,60 52,56 L74,36 Q92,22 112,34 L138,26 Q166,20 178,44 L214,52 Q240,56 238,82 Q258,90 250,110 Q240,130 214,126 L60,130 Q34,132 18,120 Z" fill="#FFFFFF" />
      <path d="M74,36 L112,34 L138,26 L126,58 L88,68 Z" fill="#CDEBFF" />
      <path d="M178,44 L214,52 L238,82 L196,78 Z" fill="#E4F4FF" />
      <ellipse cx="130" cy="146" rx="100" ry="9" fill="#0073C7" opacity="0.22" />
    </svg>
  );
}

/** 固定の海レイヤー（3D が使えない環境のフォールバック。雪の結晶・流氷・さざ波の線画） */
export function SeaSvg() {
  return (
    <div className="bg-sea" aria-hidden>
      <svg viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
        <defs>
          <g id="rs-flake" strokeWidth="2">
            <line x1="0" y1="-11" x2="0" y2="11" />
            <line x1="-9.5" y1="-5.5" x2="9.5" y2="5.5" />
            <line x1="-9.5" y1="5.5" x2="9.5" y2="-5.5" />
            <line x1="0" y1="-11" x2="-3.5" y2="-7.5" />
            <line x1="0" y1="-11" x2="3.5" y2="-7.5" />
            <line x1="0" y1="11" x2="-3.5" y2="7.5" />
            <line x1="0" y1="11" x2="3.5" y2="7.5" />
          </g>
          <g id="rs-floe">
            <path d="M0,18 Q-14,16 -12,6 L-6,-8 Q0,-16 10,-12 L22,-6 Q30,0 26,10 Q20,20 8,19 Z" />
            <path d="M-4,-2 L2,4 M8,-6 L12,0" strokeWidth="1.5" />
          </g>
          <g id="rs-wave">
            <path d="M0,0 Q9,-8 18,0 Q27,8 36,0" />
          </g>
        </defs>
        <g opacity="0.22">
          <use href="#rs-flake" className="drift" transform="translate(160 170)" />
          <use href="#rs-flake" className="drift" transform="translate(1180 130) scale(0.8)" />
          <use href="#rs-flake" className="drift" transform="translate(420 640) scale(0.7)" />
          <use href="#rs-flake" className="drift" transform="translate(1290 720) scale(1.1)" />
          <use href="#rs-flake" className="drift" transform="translate(90 850) scale(0.9)" />
          <use href="#rs-floe" className="drift" transform="translate(260 420) scale(1.4)" />
          <use href="#rs-floe" className="drift" transform="translate(1120 480) scale(1.1)" />
          <use href="#rs-floe" className="drift" transform="translate(700 880) scale(1.6)" />
          <use href="#rs-wave" transform="translate(80 300)" />
          <use href="#rs-wave" transform="translate(1240 260)" />
          <use href="#rs-wave" transform="translate(540 520)" />
          <use href="#rs-wave" transform="translate(940 760)" />
          <use href="#rs-wave" transform="translate(200 940)" />
        </g>
      </svg>
    </div>
  );
}

/** 波の区切り（ループアニメーション） */
export function WaveDivider() {
  return (
    <div className="wave-divider" aria-hidden>
      <svg viewBox="0 0 2880 60" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.65" preserveAspectRatio="none">
        <path d="M0,30 Q60,10 120,30 T240,30 T360,30 T480,30 T600,30 T720,30 T840,30 T960,30 T1080,30 T1200,30 T1320,30 T1440,30 T1560,30 T1680,30 T1800,30 T1920,30 T2040,30 T2160,30 T2280,30 T2400,30 T2520,30 T2640,30 T2760,30 T2880,30" />
      </svg>
    </div>
  );
}

/* ---------- 見出し ---------- */
/** 英字看板＋日本語見出し。base を渡すと `${base}.en` / `${base}.jp` で編集できる */
export function Billboard({
  en,
  jp,
  tone = "blue",
  as: Tag = "h2",
  base,
  className = "",
  style,
}: {
  en: string;
  jp: string;
  tone?: "blue" | "white";
  as?: "h1" | "h2";
  base?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Tag className={`billboard -${tone} ${className}`.trim()} style={style}>
      <span className="billboard__en" {...(base ? ed(`${base}.en`, "英字見出し") : {})}>
        {base ? rt(`${base}.en`, en) : en}
      </span>
      <span className="billboard__jp" {...(base ? ed(`${base}.jp`, "日本語見出し") : {})}>
        {base ? rt(`${base}.jp`, jp) : jp}
      </span>
    </Tag>
  );
}

/** 下層ページの KV（白い看板見出しのみ。2026-09-21 更新版で雲のあしらいは廃止） */
export function LowerKv({ en, jp, base }: { en: string; jp: string; base: string }) {
  return (
    <section className="lower-kv">
      <div className="lower-kv__inner">
        <Billboard as="h1" tone="white" en={en} jp={jp} base={base} className="js-reveal is-inview" style={{ transitionDelay: "0.15s" }} />
      </div>
    </section>
  );
}

/** セクション見出し行（看板＋右側のリンク等） */
export function SecHead({ children, className = "js-reveal" }: { children: ReactNode; className?: string }) {
  return <div className={`sec-head ${className}`.trim()}>{children}</div>;
}

/** 輪郭ピルボタン（文言はコンソールで編集可） */
export function BtnLine({ to, path, def, white, noArrow }: { to: string; path?: string; def: string; white?: boolean; noArrow?: boolean }) {
  return (
    <Link className={"btn-line" + (white ? " -white" : "")} to={to}>
      <span {...(path ? ed(path, "ボタン文言") : {})}>{path ? rt(path, def) : def}</span>
      {!noArrow && <span className="arrow">→</span>}
    </Link>
  );
}

/** リード文（複数行・**太字** 可）。改行はそのまま、空行で段落間隔 */
export function LeadText({ path, def, className = "lead-text", style, label = "本文" }: { path: string; def: string; className?: string; style?: CSSProperties; label?: string }) {
  return (
    <div className={className} style={{ whiteSpace: "pre-line", ...style }} {...ed(path, label, { multiline: true })}>
      {rt(path, def)}
    </div>
  );
}

/** 手書き風の注釈 */
export function HandNote({ path, def, style }: { path: string; def: string; style?: CSSProperties }) {
  const v = txt(path, def);
  if (v === "" && !EDIT_MODE) return null;
  return (
    <p className="hand-note js-reveal" style={style} {...ed(path, "手書き注釈")}>
      {rich(v || "（注釈・任意）")}
    </p>
  );
}

/** 吹き出しラベル（黄色） */
export function Fukidashi({ path, def, style }: { path: string; def: string; style?: CSSProperties }) {
  const v = txt(path, def);
  if (v === "" && !EDIT_MODE) return null;
  return (
    <p className="fukidashi -yellow" style={style} {...ed(path, "吹き出し")}>
      {rich(v || "（吹き出し・任意）")}
    </p>
  );
}

/* ---------- エントリーCTA帯・次ページ誘導 ---------- */
export function EntryBand() {
  return (
    <section className="entry-band">
      <p className="entry-band__catch js-reveal" {...ed("rs:entryBand.catch", "エントリー帯 キャッチ")}>
        {rt("rs:entryBand.catch", "必要なのは、笑顔とまっすぐさ。")}
      </p>
      <p className="entry-band__text js-reveal" {...ed("rs:entryBand.text", "エントリー帯 本文")}>
        {rt("rs:entryBand.text", "ここから先を、いっしょにつくっていきましょう。")}
      </p>
      <p className="js-reveal">
        <Link className="btn-entry" to="/recruit/entry">
          <span {...ed("rs:entryBand.btn", "エントリー帯 ボタン")}>{rt("rs:entryBand.btn", "エントリーはこちら")}</span>
          <span className="arrow">→</span>
        </Link>
      </p>
    </section>
  );
}

export function NextIsland({ to, en, jp, base }: { to: string; en: string; jp: string; base: string }) {
  return (
    <div className="next-island js-reveal">
      <Link to={to}>
        <span className="en" {...ed(`${base}.en`, "次ページ誘導 英字")}>{rt(`${base}.en`, en)}</span>
        <span className="jp" {...ed(`${base}.jp`, "次ページ誘導 文言")}>{rt(`${base}.jp`, jp)}</span>
      </Link>
    </div>
  );
}

/* ---------- 数字で見る ---------- */
const NUM_DEFAULTS = [
  { label: "創業", value: "121", unit: "年", title: "氷から始まった歴史", text: "明治38年（1905年）、天然氷の販売から始まりました。低温で品質を守るという仕事の芯は、120年以上変わっていません。" },
  { label: "連続黒字", value: "40", unit: "期", title: "盤石な経営基盤", text: "外部環境が揺れるなかでも40期連続で黒字。自己資本比率は52.8%。減給やボーナスカットをせずに来られました。" },
  { label: "売上", value: "86", unit: "億円", title: "一つずつ積み上げて成長", text: "令和8年1月期の実績（連結）。氷・氷菓の製造販売と業務用食材の卸を柱に、4事業で着実に成長してきました。" },
  { label: "昇給", value: "3", unit: "年連続", title: "還元する仕組み", text: "利益は昇給や賞与という形で社員に還元。2025年度は月額1万円のベースアップを実施しました。", note: "※一部職種例外あり" },
  { label: "離職率", value: "1.4", unit: "%", title: "誰もが働きやすい環境を目指して", text: "国内平均14.2%（2024年）と比べても大幅に低い水準。18歳から70代まで、幅広い年代が活躍しています。" },
  { label: "年間休日", value: "120", unit: "日", title: "しっかり休める、だから続けられる", text: "「年間休日120日以上」の水準で、日本の企業平均（約110日）を上回ります。休むときはしっかり休み、働くときは集中する。" },
];
/** 長文版（デザイン支給 index.html 2026-09-21 更新版の「数字で見る」。採用トップで使用） */
export const NUM_DEFAULTS_LONG = [
  { ...NUM_DEFAULTS[0], text: "明治38年（1905年）、天然氷の販売から始まりました。氷を扱う技術を軸に、食品卸や物流へと事業を広げながら、120年以上にわたって岡山の食を支えています。時代とともに扱うものは変わっても、低温で品質を守るという仕事の芯は変わっていません。" },
  { ...NUM_DEFAULTS[1], text: "感染症の流行、物価の高騰、海外情勢の変化。外部環境が揺れるなかでも、40期連続で黒字が続いています。自己資本比率は52.8%。この間、減給やボーナスカットをせずに来られたのは、日々の積み重ねと、支えてくださったお客様のおかげです。" },
  { ...NUM_DEFAULTS[2], text: "令和8年1月期の実績です（連結86億円）。氷・氷菓の製造販売と業務用食材の卸という二本柱に、冷凍冷蔵倉庫とドライアイスを加えた4事業で、着実に成長してきました。目の前の業務を一つずつ積み上げてきた結果の数字です。" },
  { ...NUM_DEFAULTS[3], text: "会社の利益は、昇給や賞与という形で社員に還元しています。一部職種において、2025年度は月額1万円のベースアップを実施しました。定期賞与に加えて決算賞与を支給する年もあり、頑張りが数字で返ってくる仕組みを目指しています。" },
  { ...NUM_DEFAULTS[4], text: "離職率1.4%（2025年）。厚生労働省が発表する国内平均離職率14.2%（2024年）と比較しても、大幅に低い水準です。18歳から70代まで幅広い年代が活躍しており、経営の安定と働きやすい環境づくりが、長く働き続けられる理由になっています。" },
  { ...NUM_DEFAULTS[5], text: "年間休日は120日。就職・転職サイトで人気条件の定番「年間休日120日以上」を満たす水準で、日本の企業平均（約110日）を上回ります。休むときはしっかり休み、働くときは集中する。そのリズムが、離職率1.4%という働きやすさにつながっています。" },
];
const MAX_NUM = 10;

/** 見えたら数字をカウントアップ（1.4s / ease-out cubic。小数は data-count の桁数） */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = parseFloat(value);
    if (Number.isNaN(target) || EDIT_MODE) {
      el.textContent = value;
      return;
    }
    const decimals = (value.split(".")[1] || "").length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      el.textContent = value;
      return;
    }
    el.textContent = "0";
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const duration = 1400;
        let start: number | null = null;
        const step = (ts: number) => {
          if (start === null) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return <span ref={ref} className="value" />;
}

/** 数字カードのグリッド。base 配下（`${base}.count` / `${base}.{i}.label|value|unit|title|text|note`）で編集 */
export function NumGrid({ base, defaults = NUM_DEFAULTS }: { base: string; defaults?: typeof NUM_DEFAULTS }) {
  const rep = repeatSel(`${base}.count`, defaults.length, MAX_NUM, "数字カードの数");
  return (
    <div className="num-grid js-reveal-group" {...rep.attrs}>
      {Array.from({ length: MAX_NUM }, (_, i) => {
        const d = defaults[i] ?? { label: "", value: "", unit: "", title: "", text: "" };
        const b = `${base}.${i}`;
        const value = txt(`${b}.value`, d.value);
        const note = txt(`${b}.note`, (d as { note?: string }).note ?? "");
        return (
          <div key={i} className="card num-card">
            <p className="num-card__label" {...ed(`${b}.label`, `数字${i + 1} ラベル`)}>{rt(`${b}.label`, d.label || "（ラベル）")}</p>
            <p className="num-card__value">
              <span className="value-wrap" {...ed(`${b}.value`, `数字${i + 1} 数値`)}>
                {EDIT_MODE ? value || "0" : <CountUp value={value || "0"} />}
              </span>
              <span className="unit" {...ed(`${b}.unit`, `数字${i + 1} 単位`)}>{rt(`${b}.unit`, d.unit)}</span>
            </p>
            <p className="num-card__title" {...ed(`${b}.title`, `数字${i + 1} 見出し`)}>{rt(`${b}.title`, d.title || "（見出し）")}</p>
            <p className="num-card__text" {...ed(`${b}.text`, `数字${i + 1} 本文`, { multiline: true })} style={{ whiteSpace: "pre-line" }}>
              {rt(`${b}.text`, d.text || "（本文）")}
              {(note !== "" || EDIT_MODE) && (
                <span className="note num-card__note" {...ed(`${b}.note`, `数字${i + 1} 注釈（任意）`)}>
                  {rich(note || "（注釈・任意）")}
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 氷・食・物流のベン図（支給 index.html のまま。アイコンは置かない） ---------- */
export function Venn() {
  return (
    <div className="venn js-reveal" style={{ marginTop: 44 }}>
      <svg viewBox="0 0 420 390" role="img" aria-label="氷・食・物流の3つの要素が重なり、人の生活を支えるベン図">
        <g>
          <circle cx="210" cy="135" r="112" fill="#35BAFF" style={{ mixBlendMode: "multiply" }} opacity="0.9" />
          <circle cx="148" cy="243" r="112" fill="#009DFA" style={{ mixBlendMode: "multiply" }} opacity="0.9" />
          <circle cx="272" cy="243" r="112" fill="#0073C7" style={{ mixBlendMode: "multiply" }} opacity="0.9" />
        </g>
        <text x="210" y="108" textAnchor="middle" fill="#FFFFFF" fontSize="27" fontWeight="700" fontFamily="'Zen Maru Gothic', sans-serif">氷</text>
        <text x="102" y="290" textAnchor="middle" fill="#FFFFFF" fontSize="27" fontWeight="700" fontFamily="'Zen Maru Gothic', sans-serif">食</text>
        <text x="318" y="290" textAnchor="middle" fill="#FFFFFF" fontSize="27" fontWeight="700" fontFamily="'Zen Maru Gothic', sans-serif">物流</text>
        <text x="210" y="218" textAnchor="middle" fill="#FFFFFF" fontSize="17" fontWeight="700" fontFamily="'Zen Maru Gothic', sans-serif">人の生活</text>
      </svg>
    </div>
  );
}

/* ---------- インタビューカード（人を知る） ---------- */
/** 所属・役職（例「アイス事業部 製造｜オペレーター」）を「所属」と「肩書」に分ける */
export function splitRole(role: string): { meta: string; job: string } {
  const parts = role.split(/[｜|]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { meta: parts.slice(0, -1).join("　"), job: parts[parts.length - 1] };
  return { meta: role.trim(), job: "" };
}

/** 写真が無い記事用のプレースホルダー（デザイン支給の線画） */
function PersonPlaceholder({ variant }: { variant: number }) {
  const bg = variant % 2 ? "#0073C7" : "#009DFA";
  return (
    <svg viewBox="0 0 400 300" fill="none" aria-hidden>
      <rect width="400" height="300" fill={bg} />
      <g stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round">
        <circle cx="200" cy="120" r="46" />
        <path d="M120,265 Q126,196 200,194 Q274,196 280,265" />
        <path d="M168,112 Q176,104 184,112 M216,112 Q224,104 232,112 M186,138 Q200,148 214,138" />
      </g>
    </svg>
  );
}

/** インタビューカードの横スクロール。カードは既存の記事ページ（/recruit/interview/:id）へ。
 * 写真は現行仕様（メイン画像・2枚目があればホバーでフェード切替） */
export function PeopleScroller({ style }: { style?: CSSProperties }) {
  const { items } = useInterviews();
  // 記事データの到着で再描画されたとき、snap が2枚目へ追従して1枚目が隠れないよう先頭へ戻す
  const trackRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    const mark = () => {
      touched.current = true;
    };
    t.addEventListener("wheel", mark, { passive: true });
    t.addEventListener("touchstart", mark, { passive: true });
    t.addEventListener("pointerdown", mark, { passive: true });
    return () => {
      t.removeEventListener("wheel", mark);
      t.removeEventListener("touchstart", mark);
      t.removeEventListener("pointerdown", mark);
    };
  }, []);
  // ビューポートに入ったら（出現アニメーションの後に）カードを横に揺らし、横スクロールできることを示す
  useEffect(() => {
    const t = trackRef.current;
    if (!t || EDIT_MODE || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timer = window.setTimeout(() => {
          if (!touched.current) t.classList.add("is-nudge");
        }, 1000);
      },
      { threshold: 0.35 },
    );
    io.observe(t);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    const t = trackRef.current;
    if (!t || touched.current) return;
    t.scrollLeft = 0;
    const id = window.setTimeout(() => {
      if (!touched.current && t.scrollLeft !== 0) t.scrollLeft = 0;
    }, 300);
    return () => window.clearTimeout(id);
  }, [items]);
  // 左右の矢印ボタン（カード 1 枚ぶんスクロール。端では薄くする。2026-09-22 追加）
  const [edge, setEdge] = useState<{ l: boolean; r: boolean }>({ l: true, r: false });
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    const update = () => setEdge({ l: t.scrollLeft <= 2, r: t.scrollLeft + t.clientWidth >= t.scrollWidth - 2 });
    update();
    t.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(t);
    return () => {
      t.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [items]);
  const step = (dir: 1 | -1) => {
    const t = trackRef.current;
    if (!t) return;
    touched.current = true;
    const card = t.querySelector<HTMLElement>(".people-card");
    const w = card ? card.getBoundingClientRect().width + 24 : t.clientWidth * 0.8;
    t.scrollBy({ left: dir * w, behavior: "smooth" });
  };
  return (
    <div className="people-wrap">
      <button type="button" className={"people-nav -prev" + (edge.l ? " is-edge" : "")} aria-label="前のインタビューへ" onClick={() => step(-1)}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 4 L6.5 10 L12.5 16" /></svg>
      </button>
      <button type="button" className={"people-nav -next" + (edge.r ? " is-edge" : "")} aria-label="次のインタビューへ" onClick={() => step(1)}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 4 L13.5 10 L7.5 16" /></svg>
      </button>
    <div ref={trackRef} className="people-scroller js-reveal-group" style={style}>
      {items.map((iv, i) => {
        const r = splitRole(iv.role);
        return (
          <Link key={iv.id} className="card people-card" to={`/recruit/interview/${iv.id}`}>
            <span className={"people-card__visual" + (iv.image2 ? " has-alt" : "")} aria-hidden>
              {iv.image ? <ImageWithFallback src={iv.image} alt="" /> : <PersonPlaceholder variant={i} />}
              {iv.image2 && <ImageWithFallback src={iv.image2} alt="" className="people-card__alt" />}
            </span>
            <span className="people-card__body">
              <span className="people-card__role">{r.job || iv.category}</span>
              <span className="people-card__title">{iv.lead}</span>
              <span className="people-card__name">
                {iv.name}
                {r.meta ? `｜${r.meta}` : ""}
                {iv.years ? `　${iv.years}` : ""}
              </span>
              <span className="people-card__link">
                <span {...ed("rs:people.more", "記事リンク文言")}>{rt("rs:people.more", "記事を読む")}</span>
                <span className="arrow">→</span>
              </span>
            </span>
          </Link>
        );
      })}
    </div>
    </div>
  );
}
