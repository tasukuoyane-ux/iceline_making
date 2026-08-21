// 採用ページ 第3案。
//
// ■ ページ構成（2026-08 改修）
//   1. メインビジュアル（採用2と同じヒーロー。ICELINE切り抜き帯は白 #fff）
//   2. 事業へのリンク（4事業のグリッド。ホバー/タップでオーバーレイ展開）
//   3. カルチャー（①②③の3項目リスト）
//   4. 仕事の魅力（2項目・画像に見出しを重ねる）
//   5. 人を知る（3Dカルーセル。中央の1枚だけが正面）
//   6. 募集職種一覧（CMS「採用」タブで管理。クリックでオーバーレイに
//      業務内容/1日の流れ/キャリアパス/職種別メッセージ/諸条件/福利厚生/FAQ/エントリー）
//
// ■ ビジュアルコンセプト（従来どおり）
//   MV以下では背景に「スクロール追随の動画」を敷く（最大5本／コンソール「採用3 背景動画」）。
//   動画が1本も無い場合は採用2と同じパララックス背景（PageBg）を表示する。
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import sectionsJson from "../../content/sections.json";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, edImg, txt, img, ratioCols, ratioAttrs } from "../lib/editable";
import { useRecruitData, RecruitJob, RecruitRow, RecruitTimeline, RecruitView } from "../lib/recruitStore";
import { IMG } from "../data/images";
import { INTERVIEWS } from "../data/recruit";
import { R2Styles, PageBg, Hero, EntryForm, Sec, Head, Ed, PAL, ACCENTS, PH } from "./Recruit2";

// ── 背景動画の設定（sections.json / コンソールで編集） ──────────
const BG_MAX = 5;
const BG_RAW: any = (sectionsJson as any).recruit3Bg ?? {};
const BG_VIDEOS: string[] = (Array.isArray(BG_RAW.videos) ? BG_RAW.videos : [])
  .filter((v: any) => typeof v === "string" && v.trim() !== "")
  .slice(0, BG_MAX);
const HAS_BG = BG_VIDEOS.length > 0;

// ── 背景動画レイヤー（従来実装のまま） ──────────────────────
function BgVideos({ urls, areaRef }: { urls: string[]; areaRef: React.RefObject<HTMLDivElement> }) {
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (urls.length === 0) return;
    let queued = false;
    let raf = 0;

    const sync = () => {
      queued = false;
      const area = areaRef.current;
      if (!area) return;
      const y = window.scrollY;
      const rect = area.getBoundingClientRect();
      const start = y + rect.top;
      const endBottom = y + rect.bottom;
      const finish = Math.max(start + 1, endBottom - window.innerHeight);
      const p = Math.min(1, Math.max(0, (y - start) / (finish - start)));

      const n = urls.length;
      const scaled = Math.min(p * n, n - 1e-6);
      const idx = Math.floor(scaled);
      const local = scaled - idx;
      setActive(idx);

      vids.current.forEach((v, i) => {
        if (!v) return;
        const d = v.duration;
        if (!isFinite(d) || d <= 0) return;
        const t = i < idx ? d : i > idx ? 0 : local * d;
        const clamped = Math.min(Math.max(t, 0), Math.max(0, d - 0.05));
        if (Math.abs(v.currentTime - clamped) > 1 / 30) {
          try {
            v.currentTime = clamped;
          } catch {
            /* seek 不可（未バッファ）なら次フレームで再試行される */
          }
        }
      });
    };
    syncRef.current = sync;

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const ro = new ResizeObserver(onScroll);
    if (areaRef.current) ro.observe(areaRef.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro.disconnect();
    };
  }, [urls.length, areaRef]);

  if (urls.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {urls.map((src, i) => (
        <video
          key={src + i}
          ref={(el) => {
            vids.current[i] = el;
          }}
          src={src}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          style={{ opacity: i === active ? 1 : 0 }}
          onLoadedMetadata={() => syncRef.current()}
          onLoadedData={(e) => {
            const v = e.currentTarget;
            v.play()
              .then(() => v.pause())
              .catch(() => {})
              .finally(() => syncRef.current());
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(217,236,242,0.50) 0%, rgba(255,255,255,0.38) 45%, rgba(217,236,242,0.50) 100%)",
        }}
      />
    </div>
  );
}

/** モーダル表示中は背面のスクロールを止める */
function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/* ═══════════════ 2. 事業へのリンク ═══════════════ */

// メニューの4事業に対応。タイル画像の既定はサイト各所の既存画像を流用（差し替え可）。
const BIZ_LINKS = [
  {
    to: "/ice",
    en: "ICE",
    name: "氷・氷菓",
    imgDef: () => img("recruit3:bizlink.0.image", IMG.iceMv || PH),
    h1: "事業について",
    t1: "業務用の氷からコンビニ向けのカップ氷、味や色のついた氷まで。岡山から全国の飲食・レジャー施設へ届けています。",
    h2: "この事業で働く",
    t2: "製造スタッフ・品質管理職が活躍中。「氷といえばアイスライン」の棚を全国につくる挑戦を、現場から支えます。",
  },
  {
    to: "/food",
    en: "FOOD",
    name: "業務用食材",
    imgDef: () => img("recruit3:bizlink.1.image", IMG.foodMv || PH),
    h1: "事業について",
    t1: "飲食店・食品メーカー・食品問屋へ、業務用食材をルート配送と提案営業で届けます。岡山県内トップシェアの食品商社事業です。",
    h2: "この事業で働く",
    t2: "営業職が活躍中。毎日現場に通うからこそ気づける困りごとに、伴走しながら応えます。",
  },
  {
    to: "/warehouse",
    en: "WAREHOUSE",
    name: "倉庫事業",
    imgDef: () => img("recruit3:bizlink.2.image", img("service:warehouse.mv.image", PH)),
    h1: "事業について",
    t1: "冷凍・冷蔵倉庫で食品をお預かりし、低温物流の基盤を支えています。食を預かる、冷たい倉庫です。",
    h2: "この事業で働く",
    t2: "在庫管理・入出庫のオペレーションを通じて、食の安定供給を裏側から支える仕事です。",
  },
  {
    to: "/dryice",
    en: "DRY ICE",
    name: "ドライアイス",
    imgDef: () => img("recruit3:bizlink.3.image", img("service:dryice.mv.image", PH)),
    h1: "事業について",
    t1: "ドライアイスの製造・加工・販売。食品の鮮度保持や低温輸送に欠かせない存在です。",
    h2: "この事業で働く",
    t2: "製造・加工スタッフが活躍中。手順を守り、安全に、確実に。その積み重ねが信頼になります。",
  },
];

function BizLinks() {
  const [open, setOpen] = useState<number | null>(null);
  useBodyLock(open !== null);
  const b = open !== null ? BIZ_LINKS[open] : null;

  return (
    <Sec>
      <Head base="recruit3:bizlink" en="OUR BUSINESS" jp="事業を知る" center />
      <p className="mt-4 text-center" style={{ fontSize: 14, color: PAL.ink }}>
        <Ed as="span" path="recruit3:bizlink.lead" def="4つの事業が、食の日常を支えています。クリックすると詳細が開きます。" label="事業リンク リード" />
      </p>

      {/* 4マスのグリッド（SP=2列 / PC=4列） */}
      <div className="mt-10 grid grid-cols-2 gap-4 pc:grid-cols-4 pc:gap-5">
        {BIZ_LINKS.map((l, i) => (
          <button
            key={l.to}
            type="button"
            onClick={() => setOpen(i)}
            aria-haspopup="dialog"
            className="group relative block overflow-hidden rounded-[1.25rem] text-left shadow-[0_14px_30px_rgba(15,42,51,0.14)]"
          >
            <div className="aspect-[3/4] w-full overflow-hidden bg-secondary">
              <ImageWithFallback
                src={l.imgDef()}
                alt={txt(`recruit3:bizlink.${i}.name`, l.name)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                {...edImg(`recruit3:bizlink.${i}.image`, `事業画像（${l.name}）`)}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/65 via-black/15 to-transparent p-4 pb-5 text-center">
              <span style={{ fontFamily: "var(--font-accent)", fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,0.85)" }}>{l.en}</span>
              <span
                className="mt-1 text-white"
                style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 900, textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}
                {...ed(`recruit3:bizlink.${i}.name`, "事業名")}
              >
                {txt(`recruit3:bizlink.${i}.name`, l.name)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* オーバーレイ：上部に画像、下部に見出し＋文章（PC=2カラム / SP=1カラム）。
          ページ側のスタッキングコンテキスト（relative z-10）に閉じ込められて
          サイトヘッダーの背面に潜らないよう、body 直下へポータル描画する */}
      {b && open !== null && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="閉じる"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
            >
              <X size={20} style={{ color: PAL.ink }} />
            </button>
            {/* 上部：画像 */}
            <div className="aspect-[16/7] w-full overflow-hidden bg-secondary">
              <ImageWithFallback src={b.imgDef()} alt={txt(`recruit3:bizlink.${open}.name`, b.name)} className="h-full w-full object-cover" />
            </div>
            {/* 下部：見出し＋文章（2カラム、SPは1カラム） */}
            <div className="p-6 pc:p-9">
              <p style={{ fontFamily: "var(--font-accent)", fontSize: 12, letterSpacing: "0.2em", color: PAL.red }}>{b.en}</p>
              <h3 className="mt-1" style={{ fontSize: 24, fontWeight: 900, color: PAL.ink }}>
                {txt(`recruit3:bizlink.${open}.name`, b.name)}
              </h3>
              <div className="mt-6 grid gap-6 pc:grid-cols-2 pc:gap-8">
                {([
                  ["h1", "t1", b.h1, b.t1],
                  ["h2", "t2", b.h2, b.t2],
                ] as const).map(([hk, tk, hDef, tDef]) => (
                  <div key={hk}>
                    <h4
                      className="border-l-4 pl-3"
                      style={{ borderColor: ACCENTS[open % ACCENTS.length], fontSize: 17, fontWeight: 800, color: PAL.ink }}
                      {...ed(`recruit3:bizlink.${open}.${hk}`, "オーバーレイ見出し")}
                    >
                      {txt(`recruit3:bizlink.${open}.${hk}`, hDef)}
                    </h4>
                    <p
                      className="mt-3"
                      style={{ fontSize: 14, lineHeight: 2.0, color: "#1c2b30", whiteSpace: "pre-line" }}
                      {...ed(`recruit3:bizlink.${open}.${tk}`, "オーバーレイ本文", { multiline: true })}
                    >
                      {txt(`recruit3:bizlink.${open}.${tk}`, tDef)}
                    </p>
                  </div>
                ))}
              </div>
              <Link to={b.to} className="mt-8 inline-flex items-center gap-2" style={{ fontSize: 14, fontWeight: 800, color: PAL.teal }}>
                事業ページを見る <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </Sec>
  );
}

/* ═══════════════ 3. カルチャー ═══════════════ */

const CULTURE_DEFAULTS = [
  {
    title: "失敗を、隠さなくていい",
    body: "何かあったらまず話す。そのほうが早く解決できるし、次につながる。そういう空気を、みんなで少しずつ作っています。目安箱を置いて、全員と面談して、言われたことを放置しない。小さなことの積み重ねが、この会社の文化になっていくのだと信じています。",
  },
  {
    title: "続けることが、形になる",
    body: "約束したことを守る。それを毎日続けていると、いつの間にかお客様から頼られるようになっている。積み重ねたものだけが、信頼として返ってくる。そんな仕事のあり方が、この会社には根づいています。",
  },
  {
    title: "人々の日常に、そっと関わる仕事",
    body: "氷の製造から、食材の卸、物流、品質管理まで。アイスラインは、食品に関わるあらゆる仕事が一つの会社の中にあります。誰かの食卓を、誰かの店を、誰かの日常を——表に出なくても、確かに支えている。この仕事を続けた時間は、知識としてではなく、体の感覚として残っていきます。",
  },
];
const CULTURE_NUMS = ["①", "②", "③"];

function Culture() {
  return (
    <Sec>
      <Head base="recruit3:culture" en="CULTURE" jp="アイスラインのカルチャー" />
      <ol className="mt-12 divide-y divide-black/10 overflow-hidden rounded-[1.5rem] bg-white/85 shadow-[0_16px_36px_rgba(15,42,51,0.10)] backdrop-blur">
        {CULTURE_DEFAULTS.map((c, i) => (
          <li key={i} className="flex gap-5 p-6 pc:gap-8 pc:p-9">
            <span
              aria-hidden
              className="shrink-0"
              style={{ fontSize: "clamp(28px, 3.4vw, 40px)", fontWeight: 900, color: ACCENTS[i % ACCENTS.length], lineHeight: 1.2 }}
            >
              {CULTURE_NUMS[i]}
            </span>
            <div>
              <h3 style={{ fontSize: "clamp(18px, 2.4vw, 24px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.5 }} {...ed(`recruit3:culture.${i}.title`, `カルチャー${i + 1} 見出し`)}>
                {txt(`recruit3:culture.${i}.title`, c.title)}
              </h3>
              <p className="mt-3" style={{ fontSize: 15, lineHeight: 2.1, color: "#1c2b30", whiteSpace: "pre-line" }} {...ed(`recruit3:culture.${i}.body`, `カルチャー${i + 1} 本文`, { multiline: true })}>
                {txt(`recruit3:culture.${i}.body`, c.body)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Sec>
  );
}

/* ═══════════════ 4. 仕事の魅力（2項目） ═══════════════ */

const CHARM3_DEFAULTS = [
  {
    title: "現場との距離が、近い",
    body: "配送も製造も品質管理も、お客様や商品のすぐそばに現場があります。自分の仕事が誰の役に立っているかが、毎日見える。この距離の近さが、仕事の手応えになります。",
  },
  {
    title: "氷から食まで、広がるフィールド",
    body: "製氷、食材卸、物流、品質管理。食に関わる仕事が一つの会社の中にそろっています。部門を越えて経験を広げながら、自分の得意を見つけられる環境です。",
  },
];

function Charm3() {
  return (
    <Sec>
      <Head base="recruit3:charm" en="ATTRACTIVE" jp="仕事の魅力" />
      <div className="mt-12 space-y-12 pc:space-y-16">
        {CHARM3_DEFAULTS.map((c, i) => {
          const imageLeft = i % 2 === 0; // 1項目目=画像左 / 2項目目=画像右
          return (
            <div
              key={i}
              className="grid items-center gap-6 pc:gap-10 pc:[grid-template-columns:var(--ratio)]"
              style={{ ["--ratio" as any]: ratioCols(`recruit3:charm.${i}.ratio`, 50, imageLeft) }}
          {...ratioAttrs(`recruit3:charm.${i}.ratio`, 50, imageLeft)}
            >
              {/* 画像（見出しを重ねる。文字影で目立たせる） */}
              <div className={"relative overflow-hidden rounded-[1.5rem] shadow-[0_18px_40px_rgba(15,42,51,0.16)] " + (imageLeft ? "pc:order-1" : "pc:order-2")}>
                <ImageWithFallback
                  src={img(`recruit3:charm.${i}.image`, img(`recruit2:charm.${i}.image`, PH))}
                  alt={txt(`recruit3:charm.${i}.title`, c.title)}
                  className="aspect-[4/3] w-full object-cover"
                  {...edImg(`recruit3:charm.${i}.image`, `魅力${i + 1} 画像`)}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <h3
                  className="absolute bottom-5 left-6 right-6 text-white"
                  style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 900, lineHeight: 1.5, textShadow: "0 2px 14px rgba(0,0,0,0.65), 0 0 4px rgba(0,0,0,0.4)" }}
                  {...ed(`recruit3:charm.${i}.title`, `魅力${i + 1} 見出し`)}
                >
                  {txt(`recruit3:charm.${i}.title`, c.title)}
                </h3>
              </div>
              {/* 本文 */}
              <p
                className={imageLeft ? "pc:order-2" : "pc:order-1"}
                style={{ fontSize: 15, lineHeight: 2.2, color: "#1c2b30", whiteSpace: "pre-line" }}
                {...ed(`recruit3:charm.${i}.body`, `魅力${i + 1} 本文`, { multiline: true })}
              >
                {txt(`recruit3:charm.${i}.body`, c.body)}
              </p>
            </div>
          );
        })}
      </div>
    </Sec>
  );
}

/* ═══════════════ 5. 人を知る（3Dカルーセル） ═══════════════ */

function People3D() {
  const [idx, setIdx] = useState(0);
  const n = INTERVIEWS.length;
  if (n === 0) return null;

  // i枚目の「中央からの符号付き距離」（循環）
  const rel = (i: number) => {
    let d = (i - idx) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };
  const prev = () => setIdx((v) => (v - 1 + n) % n);
  const next = () => setIdx((v) => (v + 1) % n);

  return (
    <Sec>
      <Head base="recruit3:people" en="PEOPLE" jp="人を知る" center />
      <p className="mt-4 text-center" style={{ fontSize: 14, color: PAL.ink }}>
        <Ed as="span" path="recruit3:people.lead" def="働く社員のインタビューを、カードをめくるように読めます。" label="人を知る リード" />
      </p>

      {/* 3Dカルーセル：3枚が見えていて、中央の1枚だけが正面を向く */}
      <div className="relative mt-10" style={{ height: "min(120vw, 480px)" }}>
        <div className="absolute inset-0" style={{ perspective: 1200 }}>
          {INTERVIEWS.map((iv, i) => {
            const d = rel(i);
            const visible = Math.abs(d) <= 1;
            const center = d === 0;
            const card = (
              <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-secondary shadow-[0_20px_50px_rgba(15,42,51,0.25)]">
                <ImageWithFallback
                  src={iv.image || PH}
                  alt={iv.name}
                  className="h-full w-full object-cover"
                  {...(center ? edImg(`interviews:${iv.id}:image`, "インタビュー画像") : {})}
                />
                {/* 画像の中にタイトルと名前 */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/15 to-transparent p-6 text-left">
                  <span className="w-fit rounded-full px-2.5 py-0.5 text-white" style={{ background: ACCENTS[i % ACCENTS.length], fontSize: 11, fontWeight: 700 }}>
                    INTERVIEW
                  </span>
                  <span className="mt-3 text-white" style={{ fontSize: "clamp(17px, 2.2vw, 22px)", fontWeight: 900, lineHeight: 1.5, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }} {...(center ? ed(`interviews:${iv.id}:lead`, "タイトル") : {})}>
                    {iv.lead}
                  </span>
                  <span className="mt-1.5 text-white/85" style={{ fontSize: 13 }}>
                    {iv.name}
                    {iv.role ? `｜${iv.role}` : ""}
                  </span>
                  {center && (
                    <span className="mt-3 inline-flex items-center gap-1 text-white" style={{ fontSize: 13, fontWeight: 700 }}>
                      記事を読む <ArrowRight size={14} />
                    </span>
                  )}
                </div>
              </div>
            );
            return (
              <div
                key={iv.id}
                className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out"
                style={{
                  width: "min(72vw, 320px)",
                  aspectRatio: "3 / 4",
                  // translateX(±105%) で中央カードとX軸上で重ならない間隔を確保。
                  // rotateY は正方向（左カードは右側が奥、右カードは左側が奥へ傾く）
                  transform: `translate(-50%, -50%) translateX(${d * 105}%) rotateY(${d * 35}deg) scale(${center ? 1 : 0.82})`,
                  transformStyle: "preserve-3d",
                  zIndex: 10 - Math.abs(d),
                  opacity: visible ? 1 : 0,
                  pointerEvents: visible ? "auto" : "none",
                }}
              >
                {center ? (
                  <Link to={`/recruit/interview/${iv.id}`} className="block h-full w-full">
                    {card}
                  </Link>
                ) : (
                  <button type="button" className="block h-full w-full" onClick={() => setIdx(i)} aria-label={`${iv.name}のカードを中央へ`}>
                    {card}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 前後ボタン */}
        <button
          type="button"
          onClick={prev}
          aria-label="前のカード"
          className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-slate-50 pc:left-4"
        >
          <ChevronLeft size={22} style={{ color: PAL.ink }} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="次のカード"
          className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-slate-50 pc:right-4"
        >
          <ChevronRight size={22} style={{ color: PAL.ink }} />
        </button>
      </div>

      {/* 現在位置インジケーター */}
      <div className="mt-6 flex justify-center gap-2">
        {INTERVIEWS.map((iv, i) => (
          <button
            key={iv.id}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`${i + 1}枚目`}
            className="h-2 rounded-full transition-all"
            style={{ width: i === idx ? 22 : 8, background: i === idx ? PAL.red : "rgba(15,42,51,0.25)" }}
          />
        ))}
      </div>
    </Sec>
  );
}

/* ═══════════════ 6. 募集職種一覧（CMS管理） ═══════════════ */

/** オーバーレイ内のセクション見出し */
function OvHead({ en, jp }: { en: string; jp: string }) {
  return (
    <div>
      <span
        className="inline-block rounded-full px-4 py-1 text-white"
        style={{ background: PAL.red, fontFamily: "var(--font-accent)", fontSize: 12, letterSpacing: "0.16em" }}
      >
        {en}
      </span>
      <h3 className="mt-3" style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.3 }}>
        {jp}
      </h3>
    </div>
  );
}

/** 1日の流れ／キャリアパス共通のタイムライン（現状デザイン踏襲） */
function Timeline({ t, timeWidth = 88 }: { t: RecruitTimeline; timeWidth?: number }) {
  return (
    <div className="mt-8 grid gap-10 pc:grid-cols-[1fr_1fr] pc:items-start">
      <div>
        {t.note && (
          <p className="inline-flex items-center gap-2" style={{ fontSize: 14, color: PAL.teal, fontWeight: 700 }}>
            <Clock size={16} />
            <span>{t.note}</span>
          </p>
        )}
        <ol className="mt-8 space-y-0 border-l-2 pl-6" style={{ borderColor: PAL.coral }}>
          {t.steps.map((s, i) => (
            <li key={i} className="relative mb-7 last:mb-0">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full" style={{ background: PAL.red }} />
              <div className="flex flex-col gap-1 tab:flex-row tab:gap-5">
                <span className="shrink-0" style={{ width: timeWidth, fontSize: 14, fontWeight: 800, color: PAL.teal }}>{s.time}</span>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "#334", whiteSpace: "pre-line" }}>{s.task}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      {t.image ? (
        <ImageWithFallback src={t.image} alt={t.note} className="aspect-[4/3] w-full rounded-[1.5rem] object-cover" />
      ) : null}
    </div>
  );
}

/** 諸条件・福利厚生の表（現状の諸条件デザイン踏襲。tint で色違い） */
function RowsTable({ rows, tint }: { rows: RecruitRow[]; tint: "teal" | "coral" }) {
  const th =
    tint === "teal"
      ? { color: PAL.teal, background: "rgba(217,236,242,0.5)" }
      : { color: PAL.coral, background: "rgba(245,106,121,0.12)" };
  return (
    <div className="mt-8 overflow-hidden rounded-[1.5rem] bg-white/90 ring-1 ring-black/5">
      <table className="w-full">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-black/5 align-top last:border-0">
              <th className="w-40 px-6 py-4 text-left" style={{ fontSize: 14, fontWeight: 700, ...th }}>{r.label}</th>
              <td className="px-6 py-4">
                <span style={{ fontSize: 14, lineHeight: 1.9, color: "#334", whiteSpace: "pre-line" }}>{r.value}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** よくある質問（旧採用ページのアコーディオンを踏襲） */
function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) => setOpen((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]));
  return (
    <div className="mt-8 space-y-3">
      {items.map((f, i) => {
        const isOpen = open.includes(i);
        return (
          <div key={i} className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <h4>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-slate-50"
              >
                <span className="flex gap-2">
                  <span style={{ fontSize: 15, fontWeight: 700, color: PAL.red }}>Q.</span>
                  <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6, color: PAL.ink }}>{f.q}</span>
                </span>
                <ChevronDown size={20} className={`mt-0.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "#55707a" }} />
              </button>
            </h4>
            <div className={isOpen ? "block border-t border-black/10 px-6 py-4" : "hidden"}>
              <div className="flex gap-2">
                <span style={{ fontSize: 15, fontWeight: 700, color: PAL.red }}>A.</span>
                <p style={{ fontSize: 14, lineHeight: 1.95, color: "#334", whiteSpace: "pre-line" }}>{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 職種の詳細オーバーレイ（業務内容〜エントリーフォーム） */
function JobOverlay({ job, jobIndex, data, onClose }: { job: RecruitJob; jobIndex: number; data: RecruitView; onClose: () => void }) {
  useBodyLock(true);
  const accent = ACCENTS[jobIndex % ACCENTS.length];
  // ページ側のスタッキングコンテキストに閉じ込められないよう body 直下へポータル描画
  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] overflow-y-auto bg-[#f4f9fb]">
      {/* ヘッダー（スクロールしても閉じられるよう sticky） */}
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1000px] items-center gap-3 px-6 py-4">
          <span className="rounded-full px-3 py-1 text-white" style={{ background: accent, fontSize: 12, fontWeight: 700 }}>{job.dept}</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: PAL.ink }}>{job.title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
          >
            <X size={22} style={{ color: PAL.ink }} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1000px] px-6 pb-24 pt-12">
        {/* 業務内容 */}
        <section>
          <OvHead en="POSITION" jp="業務内容" />
          <div className="mt-8 grid items-center gap-8 rounded-[1.75rem] bg-white p-6 shadow-[0_16px_36px_rgba(15,42,51,0.12)] pc:grid-cols-2 pc:gap-10 pc:p-9">
            <div className="pc:order-2">
              {job.image ? (
                <ImageWithFallback src={job.image} alt={job.title} className="aspect-[4/3] w-full rounded-[1.25rem] object-cover" />
              ) : (
                <img src={PH} alt="" className="aspect-[4/3] w-full rounded-[1.25rem] object-cover" />
              )}
            </div>
            <div className="pc:order-1">
              <p style={{ color: PAL.red, fontWeight: 800, fontSize: 15 }}>{job.dept}</p>
              <h4 className="mt-2" style={{ color: PAL.teal, fontWeight: 900, fontSize: "clamp(20px, 2.6vw, 26px)", lineHeight: 1.45 }}>{job.title}</h4>
              <p className="mt-4" style={{ color: "#1c2b30", fontSize: 15, lineHeight: 2.0, whiteSpace: "pre-line" }}>{job.body}</p>
            </div>
          </div>
        </section>

        {/* 1日の流れ */}
        <section className="mt-20">
          <OvHead en="A DAY" jp="1日の流れ" />
          <Timeline t={job.day} timeWidth={64} />
        </section>

        {/* キャリアパス */}
        <section className="mt-20">
          <OvHead en="CAREER PATH" jp="キャリアパス" />
          <Timeline t={job.career} timeWidth={96} />
        </section>

        {/* 職種別メッセージ（短文・改行・大きな黒文字） */}
        {job.message && (
          <section className="mt-24 text-center">
            <p
              style={{
                fontSize: "clamp(24px, 4vw, 42px)",
                fontWeight: 900,
                color: "#111",
                lineHeight: 1.9,
                whiteSpace: "pre-line",
              }}
            >
              {job.message}
            </p>
          </section>
        )}

        {/* 諸条件（職種ごと。旧データは共通テンプレートにフォールバック） */}
        <section className="mt-24">
          <OvHead en="CONDITIONS" jp="諸条件" />
          <RowsTable rows={job.conditions?.length ? job.conditions : data.conditions} tint="teal" />
        </section>

        {/* 福利厚生（職種ごと・諸条件の色違い） */}
        <section className="mt-20">
          <OvHead en="BENEFITS" jp="福利厚生" />
          <RowsTable rows={job.benefits?.length ? job.benefits : data.benefits} tint="coral" />
        </section>

        {/* よくある質問（現状踏襲） */}
        <section className="mt-20">
          <OvHead en="FAQ" jp="よくある質問" />
          <FaqList items={data.faq} />
        </section>

        {/* エントリーフォーム（現状踏襲） */}
        <section className="mt-20 overflow-hidden rounded-[1.75rem] shadow-[0_16px_36px_rgba(15,42,51,0.10)]">
          <EntryForm />
        </section>
      </div>
    </div>,
    document.body,
  );
}

function JobsSection() {
  const data = useRecruitData();
  const jobs = data.jobs.filter((j) => j.active);
  // 表示中の職種はURLのクエリパラメータ（?job=<職種ID>）で管理する。
  // 職種ごとに固有のURLになり、共有・リロード・戻る操作でも同じ職種が開く。
  // 既存のクエリ（編集モードの __edit 等）は保持する。
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("job");
  const setOpenId = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("job", id);
    else next.delete("job");
    setSearchParams(next);
  };
  const openIndex = jobs.findIndex((j) => j.id === openId);
  const openJob = openIndex >= 0 ? jobs[openIndex] : null;

  return (
    <Sec>
      <Head base="recruit3:jobs" en="RECRUIT" jp="募集職種一覧" center />
      <p className="mt-4 text-center" style={{ fontSize: 14, color: PAL.ink }}>
        <Ed as="span" path="recruit3:jobs.lead" def="職種名を選ぶと、業務内容・1日の流れ・キャリアパス・諸条件をご覧いただけます。" label="募集職種 リード" />
      </p>

      {jobs.length === 0 ? (
        <p className="mt-10 rounded-[1.25rem] bg-white/85 p-10 text-center" style={{ fontSize: 14, color: "#55707a" }}>
          現在募集中の職種はありません。
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-black/5 overflow-hidden rounded-[1.5rem] bg-white/90 shadow-[0_16px_36px_rgba(15,42,51,0.12)] backdrop-blur">
          {jobs.map((j, i) => (
            <li key={j.id}>
              <button
                type="button"
                onClick={() => setOpenId(j.id)}
                className="group flex w-full flex-wrap items-center gap-3 px-6 py-5 text-left transition-colors hover:bg-[#f4f9fb] pc:gap-5 pc:px-9"
              >
                <span className="rounded-full px-3 py-1 text-white" style={{ background: ACCENTS[i % ACCENTS.length], fontSize: 12, fontWeight: 700 }}>
                  {j.dept}
                </span>
                <span style={{ fontSize: "clamp(16px, 2vw, 19px)", fontWeight: 800, color: PAL.ink }}>{j.title}</span>
                <span className="ml-auto inline-flex items-center gap-1 transition-transform group-hover:translate-x-1" style={{ fontSize: 13, fontWeight: 700, color: PAL.teal }}>
                  詳しく見る <ArrowRight size={15} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {openJob && <JobOverlay job={openJob} jobIndex={openIndex} data={data} onClose={() => setOpenId(null)} />}
    </Sec>
  );
}

/* ═══════════════ ページ本体 ═══════════════ */

export function Recruit3() {
  // MV以下のコンテンツ領域（背景動画のスクロール進行の基準）
  const areaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <R2Styles />
      {/* 動画が無い場合は採用2と同じパララックス背景 */}
      {!HAS_BG && <PageBg />}

      {/* 1. メインビジュアル（ICELINE切り抜き帯は白）。MV表示中は背景動画より前面に置いて動画を隠す */}
      <div className="relative z-20">
        <Hero bandColor="#fff" />
      </div>

      {/* MV以下：スクロール追随の背景動画（fixed）＋新構成のコンテンツ */}
      <div ref={areaRef} className="relative">
        {HAS_BG && <BgVideos urls={BG_VIDEOS} areaRef={areaRef} />}
        <div className="relative z-10">
          {/* 2. 事業へのリンク */}
          <BizLinks />
          {/* 3. カルチャー */}
          <Culture />
          {/* 4. 仕事の魅力 */}
          <Charm3 />
          {/* 5. 人を知る */}
          <People3D />
          {/* 6. 募集職種一覧 */}
          <JobsSection />
        </div>
      </div>
    </div>
  );
}
