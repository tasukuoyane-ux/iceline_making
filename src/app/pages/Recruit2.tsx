// 採用ページ 第2案（デザイン比較用）。指示書PDFのデザイン方針に沿った
// カラフルで遊びのあるトーン（配色: #d9ecf2 / #f56a79 / #ff414d / #1aa6b7、
// 全体を貫通するグレイン背景、文章は左右に余白）。
// すべての文言・画像は recruit2: プレフィックスの汎用オーバーライドで
// 管理コンソールからインライン編集でき、画像は差し替え用プレースホルダーを配置。
import { useState, useEffect, useRef, FormEvent } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Clock, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, edImg, txt, img, EDIT_MODE } from "../lib/editable";
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
import profileSlides from "../../content/profileSlides.json";
import bgImage2 from "../../images/ICELINE_background_2.png";
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

// MV背景スライドの既定（差し替え可能・縦横比 9:16 の縦長）。pronets風に複数の画像が継ぎ足されながら流れる。
// 各スライドはビビッドカラーの抽象パターンを既定にし、管理コンソールから個別に差し替え可能。
const MV_SLIDE_DEFAULTS = [
  ["#12333d", "#ff414d", "#ffd23f"],
  ["#0f2a33", "#1aa6b7", "#f56a79"],
  ["#132e36", "#f56a79", "#1ec8dd"],
  ["#0d2730", "#ffd23f", "#ff414d"],
].map(([base, c1, c2], i) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='900' height='1600' viewBox='0 0 900 1600'>" +
      "<rect width='900' height='1600' fill='" + base + "'/>" +
      "<circle cx='" + (200 + i * 60) + "' cy='430' r='330' fill='" + c1 + "'/>" +
      "<circle cx='640' cy='1120' r='240' fill='" + c2 + "'/>" +
      "<circle cx='720' cy='340' r='120' fill='" + c1 + "'/>" +
      "<circle cx='300' cy='1300' r='110' fill='" + c2 + "'/>" +
    "</svg>"
  )
);

// MVスライド枚数（既定と同数。差し替えは recruit2:mv.slide.{i}）
const MV_SLIDE_COUNT = MV_SLIDE_DEFAULTS.length;

// ICELINEの文字型に「切り抜かれた」ビビッドカラーの帯（文字部分が透明の穴＝背後の画像が覗く）。
// 字面（cap height）を帯の高さと一致させ、帯を 88vh で描画すると「文字自体が 88vh」になる。
const ICE_KNOCK = (() => {
  const h = 240;               // 帯の高さ＝ビューポート高（88vh で描画）
  // 文字の cap height が帯より少し大きくなるフォントサイズにし、上下を帯でクリップ。
  // → 各文字が帯（＝ビューポート）の高さを上端から下端まで埋める。
  const fontSize = 384;        // cap height ≒ 0.716em × 384 ≈ 275 > h(240) → 帯いっぱいに充填
  const cap = fontSize * 0.716; // 大文字の高さ（近似）
  const baselineY = h / 2 + cap / 2; // 字面を帯の中央に置く（上下対称にはみ出してクリップ）
  const w = 1960;              // ICELINE 1語＋左右の余白（帯連結時の語間になる）
  const color = "#1ec8dd";
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>" +
      "<defs><mask id='k'>" +
        "<rect width='" + w + "' height='" + h + "' fill='white'/>" +
        "<text x='" + w / 2 + "' y='" + baselineY + "' fill='black' font-family='Arial Black, Arial, sans-serif' font-weight='900' font-size='" + fontSize + "' letter-spacing='-6' text-anchor='middle'>ICELINE</text>" +
      "</mask></defs>" +
      "<rect width='" + w + "' height='" + h + "' fill='" + color + "' mask='url(#k)'/>" +
    "</svg>";
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
})();

// MVアニメーション用スタイル（画像マーキー＝低速 / 切り抜き帯＝高速、どちらも右→左ループ。
// スクロールインジケーターは右下で縦に流れる）
function R2Styles() {
  return (
    <style>{`
      .r2-marquee { animation: r2-scroll 50s linear infinite; will-change: transform; }
      .r2-fast { animation: r2-scroll 24s linear infinite; will-change: transform; }
      @keyframes r2-scroll { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
      .r2-scrollline { position: relative; width: 1px; height: 64px; background: rgba(11,37,48,0.35); overflow: hidden; }
      .r2-scrollline::after { content: ""; position: absolute; inset: 0; transform: translateY(-100%); background: #ff414d; animation: r2-scrolldown 1.8s cubic-bezier(.76,0,.24,1) infinite; }
      @keyframes r2-scrolldown { 0% { transform: translateY(-100%); } 60%,100% { transform: translateY(100%); } }
      @media (prefers-reduced-motion: reduce) {
        .r2-marquee, .r2-fast { animation: none; }
        .r2-scrollline::after { animation: none; }
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
  // 背後のスライド画像（差し替え可・4枚）。複数枚が継ぎ足されながら流れ、ICELINEの穴から覗く。
  const slides = Array.from({ length: MV_SLIDE_COUNT }, (_, i) =>
    img(`recruit2:mv.slide.${i}`, MV_SLIDE_DEFAULTS[i])
  );
  return (
    <header className="relative flex h-[88vh] min-h-[560px] items-center justify-center overflow-hidden" style={{ background: PAL.blue }}>
      {/* レイヤー1（下）：4枚の画像スライド。
          通常時 … 継ぎ足されながら右→左へ流れ続けるマーキー（pronets風）。
          編集時 … 全4枚を静止した横1行（4列）で表示し、コンソールから1枚ずつ差し替え可能にする。 */}
      {EDIT_MODE ? (
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-1">
          {slides.map((src, i) => (
            <img
              key={i}
              {...edImg(`recruit2:mv.slide.${i}`, `MVスライド画像${i + 1}`)}
              src={src}
              alt=""
              className="h-full w-full object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-stretch overflow-hidden">
          <div className="r2-marquee flex h-full items-stretch" style={{ width: "max-content" }}>
            {[...slides, ...slides].map((src, i) => (
              // 各スライドは縦横比 9:16（高さ88vh基準）の縦長
              <div key={i} className="h-full shrink-0" style={{ width: "calc(88vh * 9 / 16)" }} aria-hidden={i >= slides.length}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 画像に薄いティントを重ね、切り抜きの視認性を上げる */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(15,42,51,0.30)" }} />

      {/* レイヤー2（上）：ICELINEの形に切り抜かれたビビッド帯。帯・文字の高さ＝背景画像の高さ（88vh）。
          横方向は画面に収まらなくてよいので maxWidth:none で自然幅のまま右→左ループ。 */}
      <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
        <div className="r2-fast flex items-center" style={{ width: "max-content", height: "88vh" }}>
          <img src={ICE_KNOCK} alt="ICELINE" style={{ height: "88vh", width: "auto", maxWidth: "none" }} />
          <img src={ICE_KNOCK} alt="" aria-hidden style={{ height: "88vh", width: "auto", maxWidth: "none" }} />
        </div>
      </div>

      {/* キャッチコピー（MV内のコンテンツは上記＋これのみ） */}
      <div className="relative z-10 px-6 text-center">
        <Ed
          as="p"
          path="recruit2:mv.title"
          def={RECRUIT_MV.main}
          label="キャッチコピー"
          multiline
          className="mx-auto max-w-[20em]"
          style={{ color: "#0b2530", fontSize: "clamp(24px, 4.4vw, 56px)", fontWeight: 900, lineHeight: 1.4, whiteSpace: "pre-line", textShadow: "0 2px 22px rgba(255,255,255,0.6)" }}
        />
      </div>

      {/* スクロールインジケーター（右下・縦書き＋流れる縦線） */}
      <div className="pointer-events-none absolute bottom-6 right-4 z-20 flex flex-col items-center gap-3 pc:right-6">
        <span
          style={{
            writingMode: "vertical-rl",
            fontFamily: "var(--font-accent)",
            fontSize: 12,
            letterSpacing: "0.24em",
            fontWeight: 700,
            color: "#0b2530",
          }}
        >
          Scroll
        </span>
        <span className="r2-scrollline" aria-hidden />
      </div>
    </header>
  );
}

/** 大きな英字見出し＋小さな日本語（Toda / pronets 風） */
function BigHead({ base, en, jp, center }: { base: string; en: string; jp: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <Ed
        as="h2"
        path={`${base}.en`}
        def={en}
        label="英字見出し"
        style={{ fontFamily: "var(--font-accent)", fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.02 }}
      />
      <Ed
        as="p"
        path={`${base}.jp`}
        def={jp}
        label="見出し（日本語）"
        className="mt-3"
        style={{ fontSize: 15, fontWeight: 700, color: PAL.ink, letterSpacing: "0.08em" }}
      />
    </div>
  );
}

function Biz() {
  return (
    <Sec>
      {/* 画像1のレイアウト：見出し ＋ 2事業部のボックスを中央寄せ（本文は非表示） */}
      <BigHead base="recruit2:biz" en="Our Business" jp="事業内容を知る" center />
      <div className="mt-14 flex flex-wrap items-start justify-center gap-8 pc:gap-10">
        {RECRUIT_BIZ.map((b, i) => (
          <div key={b.dept} className="w-full max-w-[420px] rounded-[1.75rem] bg-white p-4 shadow-[0_18px_40px_rgba(15,42,51,0.12)] tab:w-[42%]">
            <EdImg
              path={`recruit2:biz.${i}.image`}
              label="事業画像"
              alt={b.mission}
              className="aspect-[4/5] w-full rounded-[1.25rem] object-cover"
            />
            <div className="px-2 pb-2 pt-5 text-center">
              <Ed as="span" path={`recruit2:biz.${i}.dept`} def={b.dept} label="部門名" className="inline-block rounded-full px-3 py-1 text-white" style={{ background: ACCENTS[i % ACCENTS.length], fontSize: 12, fontWeight: 700 }} />
              <Ed as="h3" path={`recruit2:biz.${i}.mission`} def={b.mission} label="ミッション" className="mt-4" style={{ fontSize: 22, fontWeight: 900, color: PAL.ink, lineHeight: 1.4 }} />
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

function Philosophy() {
  // 画像2のデザイン：ティール背景に、随所へ白いソフト領域。中央に大きな理念テキスト（pronets風）。
  return (
    <section className="relative overflow-hidden px-6 py-24 pc:py-32">
      {/* 白いソフト領域（pronets風の白抜き） */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[70%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0))" }} />
        <div className="absolute right-[8%] top-[12%] h-40 w-40 rounded-3xl bg-white/70" />
        <div className="absolute left-[6%] bottom-[10%] h-52 w-52 rounded-3xl bg-white/50" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <Ed
          as="p"
          path="recruit2:philo.en"
          def="Our Creed"
          label="英字ラベル"
          style={{ fontFamily: "var(--font-accent)", fontSize: 13, fontWeight: 800, letterSpacing: "0.18em", color: PAL.red }}
        />
        <Ed
          as="p"
          path="recruit2:philo.creed"
          def={RECRUIT_PHILOSOPHY.creed}
          label="理念キャッチ"
          multiline
          className="mt-8"
          style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 900, color: PAL.ink, lineHeight: 2.0, whiteSpace: "pre-line" }}
        />
        <Ed
          as="p"
          path="recruit2:philo.body"
          def={RECRUIT_PHILOSOPHY.body}
          label="理念本文"
          multiline
          className="mx-auto mt-10 max-w-2xl"
          style={{ fontSize: "clamp(15px, 1.7vw, 18px)", lineHeight: 2.4, color: PAL.ink, whiteSpace: "pre-line" }}
        />
      </div>
    </section>
  );
}

/** 装飾の三角形（Toda / pronets 風のカラフルな飾り） */
function Deco({ className, color, rotate = 0 }: { className?: string; color: string; rotate?: number }) {
  return (
    <span
      className={"pointer-events-none absolute " + (className || "")}
      style={{ width: 34, height: 30, background: color, clipPath: "polygon(50% 0, 100% 100%, 0 100%)", transform: `rotate(${rotate}deg)` }}
      aria-hidden
    />
  );
}

function Locations() {
  // 画像3のデザイン：中央見出し＋装飾、拠点カード（画像＋ラベル）。画像は差し替え可能。
  return (
    <Sec>
      <div className="relative text-center">
        <Deco className="left-[18%] top-0" color={PAL.teal} rotate={-18} />
        <Deco className="left-[26%] top-8" color={PAL.red} rotate={20} />
        <Deco className="right-[20%] top-1" color={PAL.red} rotate={12} />
        <Deco className="right-[27%] top-9" color={PAL.teal} rotate={-24} />
        <BigHead base="recruit2:loc" en="Locations" jp="拠点情報" center />
      </div>

      <div className="mt-14 flex flex-wrap justify-center gap-8 tab:gap-10">
        {RECRUIT_LOCATIONS.map((l, i) => (
          <div key={l.name} className="w-full max-w-[360px] text-center tab:w-[30%]">
            <EdImg
              path={`recruit2:loc.${i}.image`}
              label="拠点画像"
              alt={l.name}
              className="aspect-[4/3] w-full rounded-[1.5rem] object-cover shadow-[0_16px_36px_rgba(15,42,51,0.14)]"
            />
            <Ed as="h3" path={`recruit2:loc.${i}.name`} def={l.name} label="拠点名" className="mt-5" style={{ fontSize: 18, fontWeight: 800, color: PAL.ink }} />
            <Ed as="p" path={`recruit2:loc.${i}.address`} def={l.address} label="住所" multiline className="mt-2" style={{ fontSize: 14, lineHeight: 1.8, color: "#0d323b" }} />
          </div>
        ))}
      </div>
    </Sec>
  );
}

// 仕事の魅力の各ブロックのリード（既定・編集可）
const CHARM_LEADS = ["何かあったら、まず話す。", "毎日の約束が、信頼になる。", "食のすべてに、そっと関わる。"];

function Charm() {
  // 画像1のレイアウト：横長ヒーロー画像の上にタイトル、その下にリード＋本文。
  return (
    <Sec>
      <Head base="recruit2:charm" en="OUR CULTURE" jp="仕事の魅力" />
      <div className="mt-12 space-y-16">
        {RECRUIT_CHARM.map((c, i) => (
          <motion.div
            key={c.no}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* 横長ヒーロー画像＋タイトル（オーバーレイの色ボックス） */}
            <div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_18px_40px_rgba(15,42,51,0.14)]">
              <EdImg path={`recruit2:charm.${i}.image`} label="ヒーロー画像" alt={c.title} className="aspect-[16/6] w-full object-cover" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4">
                <Ed as="span" path={`recruit2:charm.${i}.title`} def={c.title} label="タイトル" className="inline-block rounded-md px-6 py-3 text-center text-white" style={{ background: ACCENTS[i % ACCENTS.length], fontSize: "clamp(17px, 2.4vw, 26px)", fontWeight: 900, lineHeight: 1.3 }} />
              </div>
            </div>
            {/* リード＋本文 */}
            <div className="mx-auto mt-8 max-w-2xl text-center">
              <Ed as="p" path={`recruit2:charm.${i}.lead`} def={CHARM_LEADS[i] || c.title} label="リード" multiline style={{ fontSize: "clamp(20px, 2.8vw, 30px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.6, whiteSpace: "pre-line" }} />
              <Ed as="p" path={`recruit2:charm.${i}.body`} def={c.body} label="本文" multiline className="mt-5" style={{ fontSize: 15, lineHeight: 2.1, color: "#1c2b30", whiteSpace: "pre-line" }} />
            </div>
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

// キャリアパス（既定・編集可）。タブで最大4種類を切り替え。各タブは一日の流れと同じデザイン。
const CAREER_STEPS_DEFAULT = [
  { time: "1年目", task: "先輩に同行しながら基礎を習得。担当業務を一つずつ覚える。" },
  { time: "2〜3年目", task: "自分の担当を持って独り立ち。後輩のサポートも始める。" },
  { time: "4〜5年目", task: "チームのまとめ役として、計画・調整を担う。" },
  { time: "6年目〜", task: "リーダー・管理職として部門を牽引する。" },
];
const CAREER_PATHS = [
  { label: "営業職", note: "食品事業部 営業職のステップ例" },
  { label: "製造職", note: "アイス事業部 製造職のステップ例" },
  { label: "品質管理", note: "品質管理部門のステップ例" },
  { label: "総合職", note: "総合職のステップ例" },
];

function CareerPath() {
  const [tab, setTab] = useState(0);
  return (
    <Sec>
      <Head base="recruit2:career" en="CAREER PATH" jp="キャリアパス" />

      {/* タブ（最大4種類） */}
      <div className="mt-8 flex flex-wrap gap-2">
        {CAREER_PATHS.map((p, pi) => {
          const active = pi === tab;
          return (
            <button
              key={pi}
              type="button"
              onClick={() => setTab(pi)}
              className="rounded-full px-5 py-2 transition-colors"
              style={{ background: active ? PAL.teal : "rgba(255,255,255,0.65)", color: active ? "#fff" : PAL.ink, fontWeight: 700, fontSize: 14 }}
            >
              <Ed as="span" path={`recruit2:career.${pi}.label`} def={p.label} label={`タブ名${pi + 1}`} />
            </button>
          );
        })}
      </div>

      {/* 各タブのコンテンツ（全タブをDOMに保持し、非アクティブは非表示＝consoleで全て編集可） */}
      {CAREER_PATHS.map((p, pi) => (
        <div key={pi} className={pi === tab ? "" : "hidden"}>
          <div className="mt-8 grid gap-10 pc:grid-cols-[1fr_1fr] pc:items-start">
            <div>
              <p className="inline-flex items-center gap-2" style={{ fontSize: 14, color: PAL.teal, fontWeight: 700 }}>
                <Clock size={16} />
                <Ed as="span" path={`recruit2:career.${pi}.note`} def={p.note} label="メモ" />
              </p>
              <ol className="mt-8 space-y-0 border-l-2 pl-6" style={{ borderColor: PAL.coral }}>
                {CAREER_STEPS_DEFAULT.map((s, i) => (
                  <li key={i} className="relative mb-7 last:mb-0">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full" style={{ background: PAL.red }} />
                    <div className="flex flex-col gap-1 tab:flex-row tab:gap-5">
                      <Ed as="span" path={`recruit2:career.${pi}.step.${i}.time`} def={s.time} label="時期" className="w-24 shrink-0" style={{ fontSize: 14, fontWeight: 800, color: PAL.teal }} />
                      <Ed as="p" path={`recruit2:career.${pi}.step.${i}.task`} def={s.task} label="内容" multiline style={{ fontSize: 15, lineHeight: 1.8, color: "#334", whiteSpace: "pre-line" }} />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <EdImg path={`recruit2:career.${pi}.image`} label="キャリアパス画像" alt="キャリアパス" className="aspect-[4/3] w-full rounded-[1.5rem] object-cover" />
          </div>
        </div>
      ))}
    </Sec>
  );
}

/**
 * 画像2レイアウトの行：赤ラベル＋青リード＋黒本文＋横に画像。
 * 画像の左右は console のテキスト項目「画像の位置（left / right）」で切り替え。
 */
function Image2Row({ base, red, blue, black, defaultSide, imgLabel = "画像" }: { base: string; red: string; blue: string; black: string; defaultSide: "left" | "right"; imgLabel?: string }) {
  const side = (txt(`${base}.side`, defaultSide) || defaultSide).trim().toLowerCase();
  const imageLeft = side === "left";
  return (
    <div className="grid items-center gap-8 rounded-[1.75rem] bg-white p-6 shadow-[0_16px_36px_rgba(15,42,51,0.12)] pc:grid-cols-2 pc:gap-10 pc:p-9">
      <div className={imageLeft ? "pc:order-1" : "pc:order-2"}>
        <EdImg path={`${base}.image`} label={imgLabel} alt={blue} className="aspect-[4/3] w-full rounded-[1.25rem] object-cover" />
      </div>
      <div className={imageLeft ? "pc:order-2" : "pc:order-1"}>
        <Ed as="p" path={`${base}.red`} def={red} label="赤ラベル" style={{ color: PAL.red, fontWeight: 800, fontSize: 15, letterSpacing: "0.02em" }} />
        <Ed as="h3" path={`${base}.blue`} def={blue} label="青リード" className="mt-2" style={{ color: PAL.teal, fontWeight: 900, fontSize: "clamp(20px, 2.6vw, 26px)", lineHeight: 1.45 }} />
        <Ed as="p" path={`${base}.black`} def={black} label="本文（黒）" multiline className="mt-4" style={{ color: "#1c2b30", fontSize: 15, lineHeight: 2.0, whiteSpace: "pre-line" }} />
        {/* 画像の左右位置（console で left / right を入力） */}
        <Ed as="span" path={`${base}.side`} def={defaultSide} label="画像の位置（left / right）" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }} />
      </div>
    </div>
  );
}

function Jobs() {
  // 画像2のレイアウト：赤タイトル・青リード・黒本文・横に画像（左右は console 切替）
  return (
    <Sec>
      <Head base="recruit2:job" en="POSITIONS" jp="業務内容" />
      <div className="mt-12 space-y-8">
        {RECRUIT_JOBS.map((j, i) => (
          <Image2Row
            key={i}
            base={`recruit2:job.${i}`}
            red={j.dept}
            blue={j.role}
            black={j.body}
            defaultSide={i % 2 === 0 ? "right" : "left"}
            imgLabel="業務画像"
          />
        ))}
      </div>
    </Sec>
  );
}

function CeoMessage() {
  // 業務内容と同じ画像2レイアウト
  return (
    <Sec>
      <Head base="recruit2:ceo" en="MESSAGE" jp="代表者メッセージ" />
      <div className="mt-12">
        <Image2Row
          base="recruit2:ceo"
          red="代表取締役メッセージ"
          blue="誠実さを、いちばんの力に。"
          black={"お客様に愛され、社員が胸を張れる。その二つを同時に目指してきました。\n特別な才能より、約束を守り続けられること。目の前の一人に、誠実に向き合えること。\nその積み重ねが、アイスラインの信頼をつくってきました。次は、あなたと一緒に。"}
          defaultSide="right"
          imgLabel="代表者画像"
        />
      </div>
    </Sec>
  );
}

// 会社紹介資料（カンパニーデック）。従来の採用ページと同じ profileSlides.json を共有。
function CompanyProfile() {
  const slides = [...(profileSlides as string[])];
  while (slides.length < 3) slides.push(""); // 未設定でも最低3枚のプレースホルダーを表示
  return (
    <Sec>
      <Head base="recruit2:profile" en="COMPANY PROFILE" jp="会社紹介資料" />
      <p className="mt-4" style={{ fontSize: 14, color: PAL.ink }}>スライドを横スクロールでご覧いただけます。</p>
      <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
        {slides.map((url, i) =>
          url ? (
            <div key={i} className="aspect-video w-[80%] shrink-0 snap-center overflow-hidden rounded-xl bg-white shadow-[0_16px_36px_rgba(15,42,51,0.12)] tab:w-[60%]">
              <ImageWithFallback src={url} alt={`会社紹介資料 ${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div key={i} className="flex aspect-video w-[80%] shrink-0 snap-center flex-col items-center justify-center rounded-xl bg-white/80 text-center tab:w-[60%]">
              <span className="text-[#9fb6c0]" style={{ fontFamily: "var(--font-accent)", fontSize: 40, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-2 text-[#6b8790]" style={{ fontSize: 12 }}>スライド差し替え用プレイスホルダー</span>
            </div>
          )
        )}
      </div>
      <p className="mt-2" style={{ fontSize: 11, color: "#0d323b" }}>
        ※ パワーポイント資料の画像（16:9）を管理コンソールの「会社紹介資料」から追加できます。
      </p>
    </Sec>
  );
}

// カンパニーデック直下の動画埋め込みセクション（URLは console のテキスト項目で設定）
function DeckVideo() {
  const url = txt("recruit2:movie.url", "");
  const embed = url ? toEmbed(url) : null;
  return (
    <Sec>
      <Head base="recruit2:movie" en="MOVIE" jp="動画で知る" />
      <div className="mt-10 aspect-video w-full overflow-hidden rounded-[1.5rem] bg-black shadow-[0_16px_36px_rgba(15,42,51,0.14)]">
        {embed ? (
          embed.type === "iframe" ? (
            <iframe src={embed.src} title="動画" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <video src={embed.src} controls playsInline className="h-full w-full" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: "#0d2730", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
            動画URLを設定してください（console の「動画URL」項目）
          </div>
        )}
      </div>
      {/* console 用：動画URL（テキスト項目。YouTube / Vimeo / mp4 等） */}
      <span {...ed("recruit2:movie.url", "動画URL（YouTube / Vimeo / mp4）")} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{url}</span>
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
      {/* 画像3のデザイン：画像の下に白いボックスでテキスト */}
      <div className="mt-10 grid gap-6 tab:grid-cols-2 pc:grid-cols-3">
        {INTERVIEWS.map((iv, i) => (
          <Link key={iv.id} to={`/recruit/interview/${iv.id}`} className="group flex flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_16px_36px_rgba(15,42,51,0.12)]">
            <div className="aspect-[4/3] overflow-hidden bg-secondary">
              <ImageWithFallback src={iv.image} alt={iv.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" {...edImg(`interviews:${iv.id}:image`)} />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <span className="w-fit rounded-full px-2.5 py-0.5 text-white" style={{ background: ACCENTS[i % ACCENTS.length], fontSize: 11, fontWeight: 700 }}>INTERVIEW</span>
              <h3 className="mt-3" style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.4, color: PAL.ink }} {...ed(`interviews:${iv.id}:lead`, "タイトル")}>{iv.lead}</h3>
              <p className="mt-2" style={{ fontSize: 13, color: "#55707a" }}>{iv.name}</p>
              <span className="mt-4 inline-flex items-center gap-1" style={{ fontSize: 13, color: PAL.teal, fontWeight: 700 }}>記事を読む <ArrowRight size={14} /></span>
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

/**
 * ページ背景：指定画像を全幅で敷き、スクロールに合わせてゆっくり縦パララックス。
 * ページ最上部で画像の上端、ページ最下端で画像の下端がビューポートに合う。
 */
function PageBg() {
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      const ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1.79;
      const rendered = window.innerWidth * ratio; // 全幅表示時の画像の高さ
      const pan = Math.max(0, rendered - window.innerHeight); // パン可能量
      img.style.transform = `translate3d(0, ${-(progress * pan)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    img.addEventListener("load", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      img.removeEventListener("load", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "#f6efef" }}>
      <img ref={imgRef} src={bgImage2} alt="" className="absolute left-0 top-0 w-full" style={{ willChange: "transform" }} />
    </div>
  );
}

export function Recruit2() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <R2Styles />
      {/* 背景：ティール→白のグラデーション＋ぼかし要素 */}
      <PageBg />
      <Hero />
      <Biz />
      <Philosophy />
      <CeoMessage />
      <Locations />
      <Charm />
      <Day />
      <CareerPath />
      <Jobs />
      <CompanyProfile />
      <DeckVideo />
      <People />
      <ApplyCta />
      <Conditions />
      <EntryForm />
    </div>
  );
}
