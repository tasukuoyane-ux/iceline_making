// 採用ページ 第2案（デザイン比較用）。指示書PDFのデザイン方針に沿った
// カラフルで遊びのあるトーン（配色: #d9ecf2 / #f56a79 / #ff414d / #1aa6b7、
// 全体を貫通するグレイン背景、文章は左右に余白）。
// すべての文言・画像は recruit2: プレフィックスの汎用オーバーライドで
// 管理コンソールからインライン編集でき、画像は差し替え用プレースホルダーを配置。
import { useState, FormEvent } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, MapPin, Clock, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, edImg, txt, img } from "../lib/editable";
import { toEmbed } from "../lib/video";
import {
  RECRUIT_MV,
  RECRUIT_BIZ,
  RECRUIT_PHILOSOPHY,
  RECRUIT_LOCATIONS,
  RECRUIT_CHARM,
  RECRUIT_DAYS,
  RECRUIT_JOBS,
  RECRUIT_TERMS,
  RECRUIT_APPLY,
  INTERVIEWS,
} from "../data/recruit";
import sectionsJson from "../../content/sections.json";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

// 指示書の配色（colorhunt d9ecf2-f56a79-ff414d-1aa6b7）
const PAL = { blue: "#d9ecf2", coral: "#f56a79", red: "#ff414d", teal: "#1aa6b7", ink: "#0f2a33" };
const ACCENTS = [PAL.red, PAL.teal, PAL.coral];

// 差し替え用プレースホルダー（グレー枠 ＋画像）
const PH =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='#eef4f7'/><text x='50%' y='50%' font-size='30' fill='#9fb6c0' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>＋ 画像</text></svg>"
  );

// 全体を貫通する固定背景：ビビッドカラーのパキっとした抽象デザイン
const VIVID_BG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='1440' height='1024' viewBox='0 0 1440 1024' preserveAspectRatio='xMidYMid slice'>" +
      "<rect width='1440' height='1024' fill='#f3fbfd'/>" +
      "<circle cx='150' cy='150' r='290' fill='#ff414d'/>" +
      "<circle cx='1290' cy='250' r='190' fill='#1aa6b7'/>" +
      "<path d='M640 1024 L1010 590 L1380 1024 Z' fill='#f56a79'/>" +
      "<rect x='40' y='780' width='360' height='150' rx='75' fill='#1aa6b7'/>" +
      "<circle cx='1180' cy='880' r='120' fill='#ffd23f'/>" +
      "<circle cx='560' cy='110' r='64' fill='#ffd23f'/>" +
      "<path d='M-20 545 Q 360 400 740 545 T 1480 520' stroke='#ff414d' stroke-width='16' fill='none'/>" +
    "</svg>"
  );

// MV背景画像の既定（差し替え可能）。ビビッドな抽象パターン。
const MV_DEFAULT =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'>" +
      "<rect width='1200' height='800' fill='#12333d'/>" +
      "<circle cx='210' cy='210' r='230' fill='#ff414d'/>" +
      "<circle cx='620' cy='560' r='160' fill='#1aa6b7'/>" +
      "<circle cx='980' cy='250' r='130' fill='#f56a79'/>" +
      "<circle cx='1080' cy='620' r='80' fill='#ffd23f'/>" +
      "<circle cx='430' cy='430' r='70' fill='#ffd23f'/>" +
    "</svg>"
  );

// MVアニメーション用スタイル（低速の背景ループ＋中速のICELINE切り抜き）
function R2Styles() {
  return (
    <style>{`
      .r2-marquee { animation: r2-marquee 55s linear infinite; will-change: transform; }
      @keyframes r2-marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
      .r2-iceline {
        background-image: repeating-linear-gradient(118deg,#ff414d 0 34px,#ff8a3d 34px 68px,#1aa6b7 68px 102px,#f56a79 102px 136px);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent; color: transparent;
        animation: r2-iceline 9s linear infinite; will-change: background-position;
      }
      @keyframes r2-iceline { from { background-position: 0 0; } to { background-position: -544px 0; } }
      @media (prefers-reduced-motion: reduce) {
        .r2-marquee, .r2-iceline { animation: none; }
      }
    `}</style>
  );
}

/** インライン編集可能なテキスト要素 */
function Ed({
  path,
  def,
  label,
  as = "p",
  className,
  style,
  multiline,
}: {
  path: string;
  def: string;
  label?: string;
  as?: any;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}) {
  const Tag: any = as;
  return (
    <Tag className={className} style={style} {...ed(path, label, multiline ? { multiline: true } : undefined)}>
      {txt(path, def)}
    </Tag>
  );
}

/** インライン差し替え可能な画像（既定はプレースホルダー） */
function EdImg({ path, label, className, alt = "" }: { path: string; label?: string; className?: string; alt?: string }) {
  return <ImageWithFallback src={img(path, PH)} alt={alt} className={className} {...edImg(path, label)} />;
}

/** セクション見出し（英字ピル ＋ 日本語見出し） */
function Head({ base, en, jp, center }: { base: string; en: string; jp: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <Ed
        as="span"
        path={`${base}.en`}
        def={en}
        label="英字ラベル"
        className="inline-block rounded-full px-4 py-1 text-white"
        style={{ background: PAL.red, fontFamily: "var(--font-accent)", fontSize: 12, letterSpacing: "0.16em" }}
      />
      <Ed
        as="h2"
        path={`${base}.jp`}
        def={jp}
        label="見出し"
        className="mt-4 block"
        style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.3 }}
      />
    </div>
  );
}

/** 左右に余白を持つセクションコンテナ */
function Sec({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={"relative mx-auto w-full max-w-[1200px] px-6 py-16 pc:px-12 pc:py-24 " + className}>
      {children}
    </section>
  );
}

function Hero() {
  // 低速で右→左にスクロールループする背景画像（差し替え可）
  const bg = img("recruit2:mv.bgImage", MV_DEFAULT);
  return (
    <header className="relative flex h-[88vh] min-h-[520px] items-center justify-center overflow-hidden">
      {/* レイヤー1：低速スクロールする背景画像（同一画像を2枚並べてループ） */}
      <div className="pointer-events-none absolute inset-0">
        <div className="r2-marquee flex h-full" style={{ width: "200%" }}>
          <img
            {...edImg("recruit2:mv.bgImage", "MV背景画像")}
            src={bg}
            alt=""
            className="h-full w-1/2 object-cover"
          />
          <img
            {...edImg("recruit2:mv.bgImage", "MV背景画像")}
            src={bg}
            alt=""
            aria-hidden
            className="h-full w-1/2 object-cover"
          />
        </div>
      </div>

      {/* コントラスト用の暗幕 */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(9,26,33,0.34)" }} />

      {/* レイヤー2：企業名の形（ICELINE）で切り抜かれた中速スクロール要素＋キャッチコピー */}
      <div className="relative z-10 px-6 text-center">
        <div
          className="r2-iceline mx-auto select-none"
          aria-label="ICELINE"
          style={{ fontFamily: "var(--font-accent)", fontWeight: 900, fontSize: "clamp(58px, 17vw, 240px)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
        >
          ICELINE
        </div>
        <Ed
          as="p"
          path="recruit2:mv.title"
          def={RECRUIT_MV.main}
          label="キャッチコピー"
          multiline
          className="mx-auto mt-6 max-w-[20em] text-white"
          style={{ fontSize: "clamp(18px, 3vw, 34px)", fontWeight: 800, lineHeight: 1.5, whiteSpace: "pre-line", textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}
        />
      </div>
    </header>
  );
}

function Biz() {
  return (
    <Sec>
      <Head base="recruit2:biz" en="ABOUT US" jp="事業紹介" />
      <div className="mt-14 space-y-14">
        {RECRUIT_BIZ.map((b, i) => (
          <div
            key={b.dept}
            className={`grid items-center gap-8 rounded-[2rem] bg-white/70 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur pc:grid-cols-2 pc:p-10 ${i % 2 ? "pc:[direction:rtl]" : ""}`}
          >
            <div className="px-2 [direction:ltr] pc:px-6">
              <Ed as="span" path={`recruit2:biz.${i}.dept`} def={b.dept} label="部門名" className="inline-block rounded-full px-3 py-1 text-white" style={{ background: ACCENTS[i % ACCENTS.length], fontSize: 12, fontWeight: 700 }} />
              <Ed as="h3" path={`recruit2:biz.${i}.mission`} def={b.mission} label="ミッション" className="mt-4" style={{ fontSize: 28, fontWeight: 900, color: PAL.ink, lineHeight: 1.4 }} />
              <Ed as="p" path={`recruit2:biz.${i}.body`} def={b.body} label="本文" multiline className="mt-5" style={{ fontSize: 15, lineHeight: 2.1, color: "#334", whiteSpace: "pre-line" }} />
            </div>
            <EdImg path={`recruit2:biz.${i}.image`} label="事業画像" alt={b.mission} className="aspect-[4/3] w-full rounded-[1.5rem] object-cover [direction:ltr]" />
          </div>
        ))}
      </div>
    </Sec>
  );
}

function Philosophy() {
  return (
    <Sec>
      <div className="rounded-[2.5rem] px-6 py-16 text-center pc:px-16 pc:py-20" style={{ background: PAL.blue }}>
        <Head base="recruit2:philo" en="OUR CREED" jp="企業理念" center />
        <Ed as="p" path="recruit2:philo.creed" def={RECRUIT_PHILOSOPHY.creed} label="理念キャッチ" multiline className="mx-auto mt-8 max-w-3xl" style={{ fontSize: "clamp(19px, 2.6vw, 26px)", fontWeight: 800, color: PAL.red, lineHeight: 1.8, whiteSpace: "pre-line" }} />
        <Ed as="p" path="recruit2:philo.body" def={RECRUIT_PHILOSOPHY.body} label="理念本文" multiline className="mx-auto mt-8 max-w-2xl" style={{ fontSize: 15, lineHeight: 2.2, color: "#2b3b40", whiteSpace: "pre-line" }} />
      </div>
    </Sec>
  );
}

function Locations() {
  return (
    <Sec>
      <Head base="recruit2:loc" en="LOCATIONS" jp="拠点情報" />
      <div className="mt-12 grid gap-6 tab:grid-cols-3">
        {RECRUIT_LOCATIONS.map((l, i) => (
          <div key={l.name} className="rounded-[1.5rem] bg-white/70 p-7 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: ACCENTS[i % ACCENTS.length] }}>
              <MapPin size={20} />
            </span>
            <Ed as="h3" path={`recruit2:loc.${i}.name`} def={l.name} label="拠点名" className="mt-4" style={{ fontSize: 18, fontWeight: 800, color: PAL.ink }} />
            <Ed as="p" path={`recruit2:loc.${i}.address`} def={l.address} label="住所" multiline className="mt-2" style={{ fontSize: 14, lineHeight: 1.8, color: "#556" }} />
          </div>
        ))}
      </div>
    </Sec>
  );
}

function Charm() {
  return (
    <Sec>
      <Head base="recruit2:charm" en="OUR CULTURE" jp="仕事の魅力" />
      <div className="mt-12 grid gap-6 pc:grid-cols-3">
        {RECRUIT_CHARM.map((c, i) => (
          <motion.div
            key={c.no}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-[1.75rem] bg-white/80 p-8 shadow-sm ring-1 ring-black/5 backdrop-blur"
          >
            <Ed as="div" path={`recruit2:charm.${i}.no`} def={c.no} label="番号" style={{ fontFamily: "var(--font-accent)", fontSize: 44, fontWeight: 800, color: ACCENTS[i % ACCENTS.length], lineHeight: 1 }} />
            <Ed as="h3" path={`recruit2:charm.${i}.title`} def={c.title} label="タイトル" className="mt-3" style={{ fontSize: 20, fontWeight: 800, color: PAL.ink }} />
            <Ed as="p" path={`recruit2:charm.${i}.body`} def={c.body} label="本文" multiline className="mt-3" style={{ fontSize: 14, lineHeight: 2, color: "#445", whiteSpace: "pre-line" }} />
          </motion.div>
        ))}
      </div>
    </Sec>
  );
}

function Day() {
  const d = RECRUIT_DAYS[0];
  return (
    <Sec>
      <Head base="recruit2:day" en="A DAY" jp="一日の流れ" />
      <div className="mt-10 grid gap-10 pc:grid-cols-[1fr_1fr] pc:items-start">
        <div>
          <p className="inline-flex items-center gap-2" style={{ fontSize: 14, color: PAL.teal, fontWeight: 700 }}>
            <Clock size={16} />
            <Ed as="span" path="recruit2:day.note" def={d.note} label="勤務メモ" />
          </p>
          <ol className="mt-8 space-y-0 border-l-2 pl-6" style={{ borderColor: PAL.coral }}>
            {d.steps.map((s, i) => (
              <li key={i} className="relative mb-7 last:mb-0">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full" style={{ background: PAL.red }} />
                <div className="flex flex-col gap-1 tab:flex-row tab:gap-5">
                  <Ed as="span" path={`recruit2:day.step.${i}.time`} def={s.time} label="時刻" className="w-16 shrink-0" style={{ fontSize: 14, fontWeight: 800, color: PAL.teal }} />
                  <Ed as="p" path={`recruit2:day.step.${i}.task`} def={s.task} label="業務" style={{ fontSize: 15, lineHeight: 1.8, color: "#334" }} />
                </div>
              </li>
            ))}
          </ol>
        </div>
        <EdImg path="recruit2:day.image" label="一日の流れ画像" alt="一日の流れ" className="aspect-[4/3] w-full rounded-[1.5rem] object-cover" />
      </div>
    </Sec>
  );
}

function Jobs() {
  return (
    <Sec>
      <Head base="recruit2:job" en="POSITIONS" jp="業務内容" />
      <div className="mt-12 grid gap-6 tab:grid-cols-2">
        {RECRUIT_JOBS.map((j, i) => (
          <div key={i} className="rounded-[1.5rem] bg-white/80 p-7 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <Ed as="span" path={`recruit2:job.${i}.dept`} def={j.dept} label="部門" style={{ fontSize: 12, color: "#889", fontWeight: 700 }} />
            <Ed as="h3" path={`recruit2:job.${i}.role`} def={j.role} label="職種" className="mt-1" style={{ fontSize: 19, fontWeight: 800, color: ACCENTS[i % ACCENTS.length] }} />
            <Ed as="p" path={`recruit2:job.${i}.body`} def={j.body} label="本文" multiline className="mt-3" style={{ fontSize: 14, lineHeight: 1.95, color: "#445", whiteSpace: "pre-line" }} />
          </div>
        ))}
      </div>
    </Sec>
  );
}

const DECK_STATS = [
  { n: "120", u: "年", l: "創業からの歴史" },
  { n: "5,000", u: "品目超", l: "商品ラインアップ" },
  { n: "47", u: "都道府県", l: "氷が届く範囲" },
  { n: "FSSC", u: "/ISO", l: "認証取得" },
];

function Deck() {
  return (
    <Sec>
      <div className="overflow-hidden rounded-[2.5rem] px-6 py-16 pc:px-16 pc:py-20" style={{ background: PAL.ink }}>
        <div className="text-center">
          <Ed as="span" path="recruit2:deck.en" def="COMPANY DECK" label="英字ラベル" className="inline-block rounded-full px-4 py-1 text-white" style={{ background: PAL.red, fontFamily: "var(--font-accent)", fontSize: 12, letterSpacing: "0.16em" }} />
          <Ed as="h2" path="recruit2:deck.jp" def="数字で見るアイスライン" label="見出し" className="mt-4 text-white" style={{ fontSize: "clamp(24px, 3.6vw, 38px)", fontWeight: 900 }} />
        </div>
        <div className="mt-12 grid grid-cols-2 gap-8 pc:grid-cols-4">
          {DECK_STATS.map((s, i) => (
            <div key={s.l} className="text-center">
              <div style={{ fontFamily: "var(--font-accent)", fontSize: 44, fontWeight: 800, lineHeight: 1, color: ACCENTS[i % ACCENTS.length] }}>
                <Ed as="span" path={`recruit2:deck.stat.${i}.n`} def={s.n} label="数値" />
                <Ed as="span" path={`recruit2:deck.stat.${i}.u`} def={s.u} label="単位" className="text-white/70" style={{ fontSize: 18 }} />
              </div>
              <Ed as="p" path={`recruit2:deck.stat.${i}.l`} def={s.l} label="ラベル" className="mt-2 text-white/70" style={{ fontSize: 13 }} />
            </div>
          ))}
        </div>
        {/* 従前コンテンツの詳細（会社紹介資料スライド：差し替え可能プレースホルダー） */}
        <div className="mt-12 grid gap-5 tab:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <EdImg key={i} path={`recruit2:deck.slide.${i}`} label={`会社紹介スライド${i + 1}`} className="aspect-video w-full rounded-2xl object-cover" />
          ))}
        </div>
      </div>
    </Sec>
  );
}

function People() {
  const video = ((sectionsJson as any).recruit2Video as string) || "";
  const embed = toEmbed(video);
  return (
    <Sec>
      <Head base="recruit2:people" en="PEOPLE" jp="人を知る（記事＋動画）" />
      {/* 動画（管理コンソール「採用2 紹介動画」で設定） */}
      {video && embed && (
        <div className="mt-10 aspect-video w-full overflow-hidden rounded-[1.5rem] bg-black shadow-md">
          {embed.type === "iframe" ? (
            <iframe src={embed.src} title="紹介動画" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <video src={embed.src} controls playsInline className="h-full w-full" />
          )}
        </div>
      )}
      <div className="mt-10 grid gap-6 tab:grid-cols-2 pc:grid-cols-3">
        {INTERVIEWS.map((iv, i) => (
          <Link key={iv.id} to={`/recruit/interview/${iv.id}`} className="group relative overflow-hidden rounded-[1.5rem] shadow-sm ring-1 ring-black/5">
            <div className="aspect-[4/3] overflow-hidden bg-secondary">
              <ImageWithFallback src={iv.image} alt={iv.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" {...edImg(`interviews:${iv.id}:image`)} />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-6">
              <span className="w-fit rounded-full px-2.5 py-0.5 text-white" style={{ background: ACCENTS[i % ACCENTS.length], fontSize: 11, fontWeight: 700 }}>INTERVIEW</span>
              <h3 className="mt-2 text-white" style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.4 }} {...ed(`interviews:${iv.id}:lead`, "タイトル")}>{iv.lead}</h3>
              <span className="mt-2 inline-flex items-center gap-1 text-white/90" style={{ fontSize: 13 }}>記事を読む <ArrowRight size={14} /></span>
            </div>
          </Link>
        ))}
      </div>
      <Link to="/videos" className="mt-8 inline-flex items-center gap-2" style={{ fontSize: 14, color: PAL.teal, fontWeight: 700 }}>
        <PlayCircle size={18} /> 動画で知るアイスライン
      </Link>
    </Sec>
  );
}

function ApplyCta() {
  return (
    <Sec>
      <div className="rounded-[2.5rem] px-6 py-16 text-center pc:px-16 pc:py-20" style={{ background: `linear-gradient(120deg, ${PAL.red}, ${PAL.coral})` }}>
        <Ed as="p" path="recruit2:apply.copy" def={RECRUIT_APPLY.copy} label="応募コピー" multiline className="mx-auto max-w-3xl text-white" style={{ fontSize: "clamp(24px, 3.6vw, 38px)", fontWeight: 900, lineHeight: 1.4, whiteSpace: "pre-line" }} />
        <Ed as="p" path="recruit2:apply.body" def={RECRUIT_APPLY.body} label="応募本文" multiline className="mx-auto mt-6 max-w-2xl text-white/90" style={{ fontSize: 15, lineHeight: 2.2, whiteSpace: "pre-line" }} />
        <a href="#recruit2-entry" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5" style={{ fontSize: 15, fontWeight: 800, color: PAL.red }}>
          エントリーする <ArrowRight size={16} />
        </a>
      </div>
    </Sec>
  );
}

function Conditions() {
  return (
    <Sec>
      <Head base="recruit2:term" en="CONDITIONS" jp="諸条件" />
      <div className="mt-10 overflow-hidden rounded-[1.5rem] bg-white/80 ring-1 ring-black/5 backdrop-blur">
        <table className="w-full">
          <tbody>
            {RECRUIT_TERMS.map((r, i) => (
              <tr key={r.label} className="border-b border-black/5 align-top last:border-0">
                <th className="w-40 px-6 py-4 text-left" style={{ fontSize: 14, fontWeight: 700, color: PAL.teal, background: "rgba(217,236,242,0.5)" }}>{r.label}</th>
                <td className="px-6 py-4">
                  <Ed as="span" path={`recruit2:term.${i}.value`} def={r.value} label="内容" multiline style={{ fontSize: 14, lineHeight: 1.9, color: "#334", whiteSpace: "pre-line" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sec>
  );
}

function EntryForm() {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("エントリーを受け付けました。担当者よりご連絡いたします。");
    (e.target as HTMLFormElement).reset();
  };
  return (
    <section id="recruit2-entry" className="bg-white">
      <div className="mx-auto max-w-2xl px-6 py-20 pc:px-10">
        <Head base="recruit2:entry" en="ENTRY" jp="エントリー" center />
        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="r2-name">お名前 <span style={{ color: PAL.red }}>*</span></Label>
            <Input id="r2-name" required placeholder="山田 太郎" />
          </div>
          <div className="grid gap-2 tab:grid-cols-2 tab:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="r2-email">メールアドレス <span style={{ color: PAL.red }}>*</span></Label>
              <Input id="r2-email" type="email" required placeholder="example@mail.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r2-tel">電話番号</Label>
              <Input id="r2-tel" placeholder="090-0000-0000" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r2-msg">メッセージ</Label>
            <Textarea id="r2-msg" rows={5} placeholder="志望動機やご質問などをご記入ください" />
          </div>
          <Button type="submit" className="w-full text-white" style={{ height: 52, background: PAL.red }}>
            この内容で送信する <ArrowRight size={18} />
          </Button>
          <p className="text-center text-muted-foreground" style={{ fontSize: 12 }}>
            ※ これはプロトタイプです。送信内容は保存されません。
          </p>
        </form>
      </div>
    </section>
  );
}

export function Recruit2() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <R2Styles />
      {/* 全体を貫通する固定背景：ビビッドな抽象デザイン */}
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ backgroundImage: `url(${VIVID_BG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <Hero />
      <Biz />
      <Philosophy />
      <Locations />
      <Charm />
      <Day />
      <Jobs />
      <Deck />
      <People />
      <ApplyCta />
      <Conditions />
      <EntryForm />
    </div>
  );
}
