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
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Clock, PlayCircle, X } from "lucide-react";
import sectionsJson from "../../content/sections.json";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, edImg, edSel, repeatSel, txt, img, ratioCols, ratioAttrs, EDIT_MODE } from "../lib/editable";
import { useRecruitData, RecruitBlock, RecruitJob, RecruitPrPoint, RecruitRow, RecruitTimeline, RecruitView } from "../lib/recruitStore";
import { IMG } from "../data/images";
import { INTERVIEWS } from "../data/recruit";
import { VIDEOS, VideoItem } from "../data/news";
import { toEmbed } from "../lib/video";
import { R2Styles, PageBg, Hero, EntryForm, Sec, Head, Ed, PAL, ACCENTS, PH } from "./Recruit2";
import { RichBody } from "../components/common/RichBody";

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
      {/* ティントは敷かない：背景動画は元動画の色味のまま表示する（2026-08 改修） */}
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
            className="group relative block overflow-hidden rounded-[0.625rem] text-left shadow-[0_14px_30px_rgba(15,42,51,0.14)]"
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

      {/* 企業理念（4枚のカードの下・H3＋本文。本文が入力されるまで公開ページでは非表示） */}
      {(txt("recruit3:bizlink.philosophy.body", "") !== "" || EDIT_MODE) && (
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <h3
            style={{ fontSize: "clamp(18px, 2.4vw, 24px)", fontWeight: 900, color: PAL.ink }}
            {...ed("recruit3:bizlink.philosophy.title", "企業理念 見出し（H3）")}
          >
            {txt("recruit3:bizlink.philosophy.title", "企業理念")}
          </h3>
          <p
            className="mt-4"
            style={{ fontSize: 15, lineHeight: 2.1, color: "#1c2b30", whiteSpace: "pre-line" }}
            {...ed("recruit3:bizlink.philosophy.body", "企業理念 本文", { multiline: true })}
          >
            {txt("recruit3:bizlink.philosophy.body", "") || "（本文を入力してください）"}
          </p>
        </div>
      )}

      {/* 編集モード限定：カードクリックで開く展開内容（オーバーレイ）の常時展開表示。
          公開ページではオーバーレイは開いている間しかDOMに無く、編集モードでは
          カードのクリックが要素選択に使われて開けないため、ここで編集できるようにする */}
      {EDIT_MODE && (
        <div className="mt-10 space-y-6">
          <p className="text-center" style={{ fontSize: 12, fontWeight: 700, color: PAL.ink, opacity: 0.65 }}>
            ▼ 編集用の展開表示（公開ページではカードをクリックしたときのオーバーレイに表示されます）
          </p>
          {BIZ_LINKS.map((l, i) => (
            <div key={l.to} className="rounded-[0.625rem] bg-white/95 p-6 shadow-md">
              <p style={{ fontFamily: "var(--font-accent)", fontSize: 12, letterSpacing: "0.2em", color: PAL.red }} {...ed(`recruit3:bizlink.${i}.en`, `英語ラベル（${l.name}）`)}>
                {txt(`recruit3:bizlink.${i}.en`, l.en)}
              </p>
              <h3 className="mt-1" style={{ fontSize: 20, fontWeight: 900, color: PAL.ink }}>
                {txt(`recruit3:bizlink.${i}.name`, l.name)}
              </h3>
              <div className="mt-4 grid gap-6 pc:grid-cols-2 pc:gap-8">
                {([
                  ["h1", "t1", l.h1, l.t1],
                  ["h2", "t2", l.h2, l.t2],
                ] as const).map(([hk, tk, hDef, tDef]) => (
                  <div key={hk}>
                    <h4
                      className="border-l-4 pl-3"
                      style={{ borderColor: ACCENTS[i % ACCENTS.length], fontSize: 16, fontWeight: 800, color: PAL.ink }}
                      {...ed(`recruit3:bizlink.${i}.${hk}`, `展開見出し（${l.name}）`)}
                    >
                      {txt(`recruit3:bizlink.${i}.${hk}`, hDef)}
                    </h4>
                    <p
                      className="mt-3"
                      style={{ fontSize: 14, lineHeight: 2.0, color: "#1c2b30", whiteSpace: "pre-line" }}
                      {...ed(`recruit3:bizlink.${i}.${tk}`, `展開本文（${l.name}）`, { multiline: true })}
                    >
                      {txt(`recruit3:bizlink.${i}.${tk}`, tDef)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
          <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[0.75rem] bg-white shadow-2xl">
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
              <p style={{ fontFamily: "var(--font-accent)", fontSize: 12, letterSpacing: "0.2em", color: PAL.red }} {...ed(`recruit3:bizlink.${open}.en`, "英語ラベル")}>{txt(`recruit3:bizlink.${open}.en`, b.en)}</p>
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
// 項目数はコンソールの「項目数」プルダウンで 1〜8 に変更できる（既定3）
const MAX_CULTURE = 8;

function Culture() {
  const rep = repeatSel("recruit3:culture.count", CULTURE_DEFAULTS.length, MAX_CULTURE, "カルチャーの項目数");
  const items = Array.from(
    { length: MAX_CULTURE },
    (_, i) => CULTURE_DEFAULTS[i] ?? { title: "（見出し）", body: "（本文）" }
  );
  return (
    <Sec>
      <Head base="recruit3:culture" en="CULTURE" jp="アイスラインのカルチャー" />
      <ol
        className="mt-12 divide-y divide-black/10 overflow-hidden rounded-[0.75rem] bg-white/85 shadow-[0_16px_36px_rgba(15,42,51,0.10)] backdrop-blur"
        {...rep.attrs}
      >
        {items.map((c, i) => (
          <li key={i} className="p-6 pc:p-9">
            {/* 丸数字（①②③）の番号表記は 2026-08 改修で廃止 */}
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

/* ═══════════════ 4. アイスラインの仕事 ═══════════════ */

// 画像と文字（H2・強調p・通常p）が横並びのセクション（カルチャーの前に表示）。
// PCの左右はコンソールの「左右入れ替え」で反転できるが、DOM順は画像が先頭のため
// SPでは常に上＝画像・下＝文言になる（flip は PC 幅のみに効く）。
function Work3() {
  return (
    <Sec>
      <div
        className="grid items-center gap-8 pc:gap-12 pc:[grid-template-columns:var(--ratio)]"
        style={{ ["--ratio" as any]: ratioCols("recruit3:work.ratio", 50, true) }}
        {...ratioAttrs("recruit3:work.ratio", 50, true)}
      >
        {/* 画像（SPでは上に表示） */}
        <ImageWithFallback
          src={img("recruit3:work.image", PH)}
          alt={txt("recruit3:work.title", "アイスラインの仕事")}
          className="aspect-[4/3] w-full rounded-[0.75rem] object-cover shadow-[0_18px_40px_rgba(15,42,51,0.16)]"
          {...edImg("recruit3:work.image", "アイスラインの仕事 画像")}
        />
        {/* 文言（H2＋強調p＋通常p） */}
        <div>
          <h2
            style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.3 }}
            {...ed("recruit3:work.title", "アイスラインの仕事 見出し（H2）")}
          >
            {txt("recruit3:work.title", "アイスラインの仕事")}
          </h2>
          <p
            className="mt-5"
            style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 800, lineHeight: 1.9, color: PAL.ink, whiteSpace: "pre-line" }}
            {...ed("recruit3:work.strong", "アイスラインの仕事 本文（強調）", { multiline: true })}
          >
            <strong>{txt("recruit3:work.strong", "氷と食のフィールドで、暮らしの当たり前を支える。")}</strong>
          </p>
          <p
            className="mt-4"
            style={{ fontSize: 15, lineHeight: 2.2, color: "#1c2b30", whiteSpace: "pre-line" }}
            {...ed("recruit3:work.body", "アイスラインの仕事 本文", { multiline: true })}
          >
            {txt(
              "recruit3:work.body",
              "氷の製造から、業務用食材の卸、低温物流、品質管理まで。アイスラインの仕事は、食に関わる現場のすぐそばにあります。自分の仕事が誰の役に立っているかが毎日見える。その手応えを積み重ねられる環境です。"
            )}
          </p>
        </div>
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
              <div className="relative h-full w-full overflow-hidden rounded-[0.75rem] bg-secondary shadow-[0_20px_50px_rgba(15,42,51,0.25)]">
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
function OvHead({ en, jp, base }: { en: string; jp: string; base?: string }) {
  // base を渡すと英字ラベル（<base>.en）と見出し（<base>.jp）がコンソールから
  // 編集可能になり、セクション単位の機能（非表示・文字色など）も各ページと同様に使える
  return (
    <div>
      <span
        className="inline-block rounded-full px-4 py-1 text-white"
        style={{ background: PAL.red, fontFamily: "var(--font-accent)", fontSize: 12, letterSpacing: "0.16em" }}
        {...(base ? ed(`${base}.en`, "英字ラベル") : {})}
      >
        {base ? txt(`${base}.en`, en) : en}
      </span>
      <h3
        className="mt-3"
        style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.3 }}
        {...(base ? ed(`${base}.jp`, "見出し") : {})}
      >
        {base ? txt(`${base}.jp`, jp) : jp}
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
        <ImageWithFallback src={t.image} alt={t.note} className="aspect-[4/3] w-full rounded-[0.75rem] object-cover" />
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
    <div className="mt-8 overflow-hidden rounded-[0.75rem] bg-white/90 ring-1 ring-black/5">
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

/** よくある質問のQ&Aアコーディオン（1カテゴリ分。旧採用ページのデザイン踏襲） */
function FaqQaList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) => setOpen((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]));
  return (
    <div className="space-y-3">
      {items.map((f, i) => {
        const isOpen = open.includes(i);
        return (
          <div key={i} className="overflow-hidden rounded-md border border-black/10 bg-white">
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

/** よくある質問（カテゴリを1階層目のアコーディオンにした2階層構成。
 * カテゴリは CMS の「採用 > よくある質問」で各Q&Aに設定する（未設定は「その他」）。
 * カテゴリの並びはQ&Aの並び順における初出順。 */
function FaqList({ items }: { items: { q: string; a: string; cat?: string }[] }) {
  const groups: { name: string; items: { q: string; a: string }[] }[] = [];
  for (const f of items) {
    const name = (f.cat || "").trim() || "その他";
    const g = groups.find((x) => x.name === name);
    if (g) g.items.push(f);
    else groups.push({ name, items: [f] });
  }
  const [openCats, setOpenCats] = useState<string[]>([]);
  const toggleCat = (name: string) =>
    setOpenCats((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));
  // カテゴリが1つも設定されていない（全て「その他」）場合は従来どおり1階層で表示
  if (groups.length === 1 && groups[0].name === "その他") {
    return (
      <div className="mt-8">
        <FaqQaList items={groups[0].items} />
      </div>
    );
  }
  return (
    <div className="mt-8 space-y-4">
      {groups.map((g) => {
        const isOpen = openCats.includes(g.name);
        return (
          <div key={g.name} className="overflow-hidden rounded-[0.625rem] border border-black/10 bg-white/95">
            <button
              type="button"
              onClick={() => toggleCat(g.name)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition-colors hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span style={{ fontSize: 16, fontWeight: 900, color: PAL.ink }}>{g.name}</span>
                <span style={{ fontSize: 12, color: "#55707a" }}>{g.items.length}件</span>
              </span>
              <ChevronDown size={20} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "#55707a" }} />
            </button>
            {isOpen && (
              <div className="border-t border-black/10 bg-[#f8fbfc] p-4 pc:p-5">
                <FaqQaList items={g.items} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** H2＋本文＋画像のシンプルなセクション（1日の仕事内容／やりがい・特徴）。
 * 本文か画像が入力されるまで表示しない（旧データの職種でも安全に非表示になる）。 */
function OvBlockSec({ block, defTitle }: { block?: RecruitBlock; defTitle: string }) {
  if (!block || (block.body.trim() === "" && block.image.trim() === "")) return null;
  const hasImage = block.image.trim() !== "";
  return (
    <section className="mt-20">
      <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.3 }}>
        {block.title || defTitle}
      </h2>
      <div className={`mt-6 grid items-center gap-8 ${hasImage ? "pc:grid-cols-2 pc:gap-10" : ""}`}>
        {block.body.trim() !== "" && (
          <p style={{ color: "#1c2b30", fontSize: 15, lineHeight: 2.0, whiteSpace: "pre-line" }}>{block.body}</p>
        )}
        {hasImage && (
          <ImageWithFallback src={block.image} alt={block.title || defTitle} className="aspect-[4/3] w-full rounded-[0.75rem] object-cover" />
        )}
      </div>
    </section>
  );
}

/** この仕事のPRポイント（H2の下に H3＋本文＋画像（任意）の項目を任意の数表示）。
 * 項目が1つも無い間は表示しない。 */
function OvPrSec({ pr, accent }: { pr?: { title: string; points: RecruitPrPoint[] }; accent: string }) {
  const points = (pr?.points ?? []).filter((p) => p.title.trim() !== "" || p.body.trim() !== "" || p.image.trim() !== "");
  if (points.length === 0) return null;
  return (
    <section className="mt-20">
      <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, color: PAL.ink, lineHeight: 1.3 }}>
        {pr?.title || "この仕事のPRポイント"}
      </h2>
      <div className="mt-6 space-y-6">
        {points.map((p, i) => {
          const hasImage = p.image.trim() !== "";
          return (
            <div key={i} className="rounded-[0.875rem] bg-white p-6 shadow-[0_16px_36px_rgba(15,42,51,0.10)] pc:p-8">
              <div className={`grid items-center gap-6 ${hasImage ? "pc:grid-cols-2 pc:gap-10" : ""}`}>
                <div>
                  {p.title.trim() !== "" && (
                    <h3 className="border-l-4 pl-3" style={{ borderColor: accent, fontSize: 18, fontWeight: 800, color: PAL.ink, lineHeight: 1.5 }}>
                      {p.title}
                    </h3>
                  )}
                  {p.body.trim() !== "" && (
                    <p className={p.title.trim() !== "" ? "mt-3" : ""} style={{ color: "#1c2b30", fontSize: 15, lineHeight: 2.0, whiteSpace: "pre-line" }}>
                      {p.body}
                    </p>
                  )}
                </div>
                {hasImage && (
                  <ImageWithFallback src={p.image} alt={p.title} className="aspect-[4/3] w-full rounded-[0.625rem] object-cover" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 職種の詳細オーバーレイ（業務内容〜エントリーフォーム） */
function JobOverlay({ job, jobIndex, data, onClose }: { job: RecruitJob; jobIndex: number; data: RecruitView; onClose: () => void }) {
  useBodyLock(true);
  const accent = ACCENTS[jobIndex % ACCENTS.length];
  // スクロールダウンでヘッダー右上に「エントリー」への追尾アンカーボタンを表示
  const [showEntryCta, setShowEntryCta] = useState(false);
  const entryRef = useRef<HTMLElement | null>(null);
  // ページ側のスタッキングコンテキストに閉じ込められないよう body 直下へポータル描画
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] overflow-y-auto bg-[#f4f9fb]"
      onScroll={(e) => setShowEntryCta((e.target as HTMLElement).scrollTop > 240)}
    >
      {/* ヘッダー（スクロールしても閉じられるよう sticky） */}
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/95 backdrop-blur">
        {/* SPでは「バッジ＋職種名＋閉じる」「エントリー」の2行段組にして潰れを防ぐ */}
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 pc:px-6 pc:py-4">
          <span className="shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-white" style={{ background: accent, fontSize: 12, fontWeight: 700 }}>
            {job.dept}
          </span>
          <span className="min-w-0 flex-1 truncate" style={{ fontSize: 17, fontWeight: 900, color: PAL.ink }}>{job.title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-slate-100 pc:order-5"
          >
            <X size={22} style={{ color: PAL.ink }} />
          </button>
          {showEntryCta && (
            <button
              type="button"
              onClick={() => entryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="basis-full rounded-full px-4 py-2 text-white transition-opacity hover:opacity-85 pc:order-4 pc:basis-auto"
              style={{ background: PAL.red, fontSize: 13, fontWeight: 800 }}
            >
              エントリー
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1000px] px-6 pb-24 pt-12">
        {/* 業務内容（2026-08 改修：セクション見出し（黒文字）と英字ラベル（赤ピル）は
            表示せず、コンテンツのカードだけを表示する） */}
        <section>
          <div className="grid items-center gap-8 rounded-[0.875rem] bg-white p-6 shadow-[0_16px_36px_rgba(15,42,51,0.12)] pc:grid-cols-2 pc:gap-10 pc:p-9">
            <div className="pc:order-2">
              {job.image ? (
                <ImageWithFallback src={job.image} alt={job.title} className="aspect-[4/3] w-full rounded-[0.625rem] object-cover" />
              ) : (
                <img src={PH} alt="" className="aspect-[4/3] w-full rounded-[0.625rem] object-cover" />
              )}
            </div>
            <div className="pc:order-1">
              <p style={{ color: PAL.red, fontWeight: 800, fontSize: 15 }}>{job.dept}</p>
              <h4 className="mt-2" style={{ color: PAL.teal, fontWeight: 900, fontSize: "clamp(20px, 2.6vw, 26px)", lineHeight: 1.45 }}>{job.title}</h4>
              <p className="mt-4" style={{ color: "#1c2b30", fontSize: 15, lineHeight: 2.0, whiteSpace: "pre-line" }}>{job.body}</p>
            </div>
          </div>
        </section>

        {/* 1日の仕事内容（H2＋本文＋画像。CMSの職種編集で入力。未入力の間は非表示） */}
        <OvBlockSec block={job.daywork} defTitle="1日の仕事内容" />

        {/* やりがい・特徴（H2＋本文＋画像。同上） */}
        <OvBlockSec block={job.appeal} defTitle="やりがい・特徴" />

        {/* この仕事のPRポイント（H2＋任意個数の H3/本文/画像。項目が無い間は非表示） */}
        <OvPrSec pr={job.pr} accent={accent} />

        {/* 諸条件（職種ごと。旧データは共通テンプレートにフォールバック） */}
        <section className="mt-24">
          <OvHead en="CONDITIONS" jp="諸条件" base="recruit3:ov.conditions" />
          <RowsTable rows={job.conditions?.length ? job.conditions : data.conditions} tint="teal" />
        </section>

        {/* 福利厚生（職種ごと・諸条件の色違い） */}
        <section className="mt-20">
          <OvHead en="BENEFITS" jp="福利厚生" base="recruit3:ov.benefits" />
          <RowsTable rows={job.benefits?.length ? job.benefits : data.benefits} tint="coral" />
        </section>

        {/* 選考の流れ（1日の流れと同じタイムライン形式・職種ごと。
            旧データは共通「選考の流れ」（文字列）をステップに変換して表示） */}
        {(() => {
          const flowT: RecruitTimeline =
            job.flow && job.flow.steps?.length
              ? job.flow
              : {
                  note: "",
                  image: "",
                  steps: (data.flow ?? [])
                    .filter((s) => s.trim() !== "")
                    .map((s, i) => ({ time: `STEP${i + 1}`, task: s })),
                };
          if (flowT.steps.length === 0) return null;
          return (
            <section className="mt-20">
              <OvHead en="FLOW" jp="選考の流れ" base="recruit3:ov.flow" />
              <Timeline t={flowT} timeWidth={96} />
            </section>
          );
        })()}

        {/* よくある質問（カテゴリを1階層目にした2階層アコーディオン） */}
        <section className="mt-20">
          <OvHead en="FAQ" jp="よくある質問" base="recruit3:ov.faq" />
          <FaqList items={data.faq} />
        </section>

        {/* 職種別メッセージ（短文・改行・大きな黒文字。エントリーフォームの直前に表示） */}
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

        {/* エントリーフォーム（現状踏襲） */}
        <section
          ref={entryRef as any}
          className="mt-20 overflow-hidden rounded-[0.875rem] shadow-[0_16px_36px_rgba(15,42,51,0.10)]"
        >
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
    <Sec id="jobs" className="scroll-mt-20">
      <Head base="recruit3:jobs" en="RECRUIT" jp="募集職種一覧" center />
      <p className="mt-4 text-center" style={{ fontSize: 14, color: PAL.ink }}>
        <Ed as="span" path="recruit3:jobs.lead" def="職種名を選ぶと、業務内容・1日の流れ・キャリアパス・諸条件をご覧いただけます。" label="募集職種 リード" />
      </p>

      {jobs.length === 0 ? (
        <p className="mt-10 rounded-[0.625rem] bg-white/85 p-10 text-center" style={{ fontSize: 14, color: "#55707a" }}>
          現在募集中の職種はありません。
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-black/5 overflow-hidden rounded-[0.75rem] bg-white/90 shadow-[0_16px_36px_rgba(15,42,51,0.12)] backdrop-blur">
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
                  <span {...ed("recruit3:jobs.more", "職種リンク文言")}>{txt("recruit3:jobs.more", "詳細・エントリー")}</span> <ArrowRight size={15} />
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

/* ═══════════════ MV内の追記（サブコピー＋H3・本文） ═══════════════ */

// メインビジュアルのキャッチコピー下に表示する追記。未入力の間は公開ページでは非表示。
function HeroExtra() {
  const sub = txt("recruit3:mv.subcopy", "");
  const h3 = txt("recruit3:mv.h3", "");
  const p = txt("recruit3:mv.p", "");
  if (sub === "" && h3 === "" && p === "" && !EDIT_MODE) return null;
  const shadow = "0 2px 18px rgba(255,255,255,0.65)";
  return (
    <div className="mx-auto mt-5 max-w-[34em]">
      {(sub !== "" || EDIT_MODE) && (
        <Ed
          as="p"
          path="recruit3:mv.subcopy"
          def="（サブコピー）"
          label="MV サブコピー"
          multiline
          style={{ color: "#0b2530", fontSize: "clamp(14px, 1.9vw, 20px)", fontWeight: 800, lineHeight: 1.8, whiteSpace: "pre-line", textShadow: shadow }}
        />
      )}
      {(h3 !== "" || p !== "" || EDIT_MODE) && (
        <div className="mt-4">
          {(h3 !== "" || EDIT_MODE) && (
            <Ed
              as="h3"
              path="recruit3:mv.h3"
              def="（見出し）"
              label="MV 小見出し（H3）"
              style={{ color: "#0b2530", fontSize: "clamp(15px, 1.7vw, 19px)", fontWeight: 900, lineHeight: 1.6, textShadow: shadow }}
            />
          )}
          {(p !== "" || EDIT_MODE) && (
            <Ed
              as="p"
              path="recruit3:mv.p"
              def="（本文）"
              label="MV 本文"
              multiline
              className="mt-1.5"
              style={{ color: "#0b2530", fontSize: "clamp(12px, 1.4vw, 15px)", lineHeight: 1.9, whiteSpace: "pre-line", textShadow: shadow }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ 数字で見るアイスライン ═══════════════ */

// 横長の白カードを縦に積み、カードを左右交互に少しずらして配置する（2026-08 モック準拠。
// スマホでも少しずらす）。カード内は左＝赤の縦罫付き見出し＋本文、右＝赤い円
// （大きな白文字）と左に重なる水色の円（透過PNG）。
// カード数はコンソールの「追加」「削除」で 1〜12 に変更できる（既定3）。
const MAX_STATS = 12;

function Stats3() {
  const rep = repeatSel("recruit3:stats.count", 3, MAX_STATS, "数字タイルの数");
  return (
    <Sec>
      <Head base="recruit3:stats.head" en="COMPANY DECK" jp="数字で見るアイスライン" />
      <div className="mt-10 space-y-6" {...rep.attrs}>
        {Array.from({ length: MAX_STATS }, (_, i) => {
          const base = `recruit3:stats.${i}`;
          const icon = img(`${base}.image`, "");
          return (
            <div
              key={i}
              className={
                "flex w-[92%] items-center gap-5 rounded-[0.875rem] bg-white px-6 py-7 shadow-[0_16px_36px_rgba(15,42,51,0.10)] pc:w-[72%] pc:gap-8 pc:px-9 " +
                (i % 2 ? "ml-auto" : "mr-auto")
              }
            >
              {/* 左：見出し（赤の縦罫）＋本文 */}
              <div className="min-w-0 flex-1">
                <h3
                  className="border-l-4 pl-3"
                  style={{ borderColor: PAL.red, fontSize: 17, fontWeight: 900, color: PAL.red, lineHeight: 1.5 }}
                  {...ed(`${base}.h3`, `数字タイル${i + 1} 見出し`)}
                >
                  {txt(`${base}.h3`, "（見出し）")}
                </h3>
                <p
                  className="mt-3 pl-3"
                  style={{ fontSize: 13, lineHeight: 1.95, color: "#1c2b30", whiteSpace: "pre-line" }}
                  {...ed(`${base}.p`, `数字タイル${i + 1} 本文`, { multiline: true })}
                >
                  {txt(`${base}.p`, "（本文）")}
                </p>
              </div>
              {/* 右：赤い円（大きな白文字）＋左に重なる水色の円（透過PNG画像） */}
              <div className="relative h-32 w-40 shrink-0 pc:h-44 pc:w-56">
                <div
                  className="absolute right-0 top-0 flex h-32 w-32 items-center justify-center rounded-full px-4 text-center pc:h-44 pc:w-44 pc:px-5"
                  style={{ background: PAL.red }}
                >
                  <span
                    style={{ color: "#fff", fontSize: "clamp(20px, 2.4vw, 32px)", fontWeight: 900, lineHeight: 1.3, whiteSpace: "pre-line" }}
                    {...ed(`${base}.circle`, `数字タイル${i + 1} 円内テキスト`)}
                  >
                    {txt(`${base}.circle`, "00")}
                  </span>
                </div>
                <div
                  className="absolute left-0 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full pc:h-20 pc:w-20"
                  style={{ background: "#cfe6f2" }}
                >
                  {(icon !== "" || EDIT_MODE) && (
                    <ImageWithFallback
                      src={icon || PH}
                      alt=""
                      className="h-9 w-9 rounded-full object-contain pc:h-12 pc:w-12"
                      {...edImg(`${base}.image`, `数字タイル${i + 1} アイコン画像（透過PNG）`)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Sec>
  );
}

/* ═══════════════ 埋め込み動画（人を知るの後） ═══════════════ */

// 中央揃え・PCで800px幅の埋め込み動画。URL未設定の間は公開ページでは非表示。
// YouTube/Vimeoの共有URLは iframe（最大化ボタン付き）、mp4等の直リンクは
// <video controls>（全画面ボタン付き）で再生される。
function Movie3() {
  const url = txt("recruit3:movie.url", "");
  const embed = toEmbed(url);
  if (!embed && !EDIT_MODE) return null;
  return (
    <Sec>
      <div className="mx-auto w-full max-w-[800px]">
        <div className="aspect-video w-full overflow-hidden rounded-[0.625rem] bg-black shadow-[0_14px_30px_rgba(15,42,51,0.18)]">
          {embed?.type === "iframe" ? (
            <iframe
              src={embed.src}
              title="紹介動画"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : embed ? (
            <video src={embed.src} controls playsInline className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/70" style={{ fontSize: 14 }}>
              （動画URL未設定）
            </div>
          )}
        </div>
        {EDIT_MODE && (
          <p
            className="mt-2 break-all rounded bg-white/85 px-2 py-1"
            style={{ fontSize: 11, color: PAL.ink }}
            {...ed("recruit3:movie.url", "埋め込み動画URL")}
            data-edit-video="1"
          >
            {url || "（動画URLを入力：YouTube/Vimeoの共有URL、または動画ファイルをアップロード）"}
          </p>
        )}
      </div>
    </Sec>
  );
}

/* ═══════════════ カンパニーデック（スライドショー） ═══════════════ */

// 16:9 画像のスライドショー（中央揃え・PCで800px幅）。最大20枚まで登録でき、
// 画像が設定された枠だけが順に表示される（1枚も無い間は公開ページでは非表示）。
// 編集モードでは全枠をグリッドで静止表示し、1枚ずつ差し替えられる。
const MAX_DECK = 20;

function Deck3() {
  const all = Array.from({ length: MAX_DECK }, (_, i) => ({ i, src: img(`recruit3:deck.${i}.image`, "") }));
  const slides = all.filter((s) => s.src !== "");
  const [idx, setIdx] = useState(0);
  const cur = slides.length > 0 ? idx % slides.length : 0;

  // 5秒ごとに自動送り（2枚以上あるときだけ。プレビューでも本番と同じ挙動）
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0 && !EDIT_MODE) return null;
  return (
    <Sec>
      <Head base="recruit3:deck.head" en="COMPANY DECK" jp="カンパニーデック" center />
      <div className="mx-auto mt-10 w-full max-w-[800px]">
        {/* 本番と同じスライドショー表示（プレビューでも同じ見た目）。 */}
        {slides.length > 0 ? (
          <div className="relative">
            <div className="relative aspect-video w-full overflow-hidden rounded-[0.625rem] bg-secondary shadow-[0_14px_30px_rgba(15,42,51,0.14)]">
              {slides.map((s, n) => (
                <ImageWithFallback
                  key={s.i}
                  src={s.src}
                  alt={`カンパニーデック ${n + 1}枚目`}
                  sizes="800px"
                  loading={n === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                  style={{ opacity: n === cur ? 1 : 0 }}
                />
              ))}
            </div>
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="前のスライド"
                  onClick={() => setIdx((v) => (v - 1 + slides.length) % slides.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow-md transition-colors hover:bg-white"
                >
                  <ChevronLeft size={20} style={{ color: PAL.ink }} />
                </button>
                <button
                  type="button"
                  aria-label="次のスライド"
                  onClick={() => setIdx((v) => v + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow-md transition-colors hover:bg-white"
                >
                  <ChevronRight size={20} style={{ color: PAL.ink }} />
                </button>
                <div className="mt-4 flex justify-center gap-2">
                  {slides.map((s, n) => (
                    <button
                      key={s.i}
                      type="button"
                      aria-label={`${n + 1}枚目を表示`}
                      onClick={() => setIdx(n)}
                      className="h-2 w-2 rounded-full transition-colors"
                      style={{ background: n === cur ? PAL.red : "rgba(22,35,43,0.25)" }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* 画像未設定（編集モードのみ到達）：空のプレースホルダー */
          <div className="flex aspect-video w-full items-center justify-center rounded-[0.625rem] bg-secondary" style={{ fontSize: 13, color: "#7a8a92" }}>
            （下の編集用の枠に16:9画像を追加するとスライドショーが表示されます）
          </div>
        )}

        {/* 編集用：全枠を1行の横スクロールで表示（画像をクリックして差し替え） */}
        {EDIT_MODE && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-3">
            {all.map((s) => (
              <div key={s.i} className="relative aspect-video w-56 shrink-0 overflow-hidden rounded bg-secondary">
                <ImageWithFallback
                  src={s.src || PH}
                  alt={`スライド${s.i + 1}`}
                  className="h-full w-full object-cover"
                  {...edImg(`recruit3:deck.${s.i}.image`, `デッキ スライド${s.i + 1}`)}
                />
                <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 text-white" style={{ fontSize: 10 }}>
                  {s.i + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sec>
  );
}

/* ═══════════════ 動画（動画で知るアイスライン・2×2グリッド） ═══════════════ */

// 「動画で知るアイスライン」の動画一覧を2列グリッドで表示し、
// クリックすると画面中央のモーダルで拡大再生する。
// 動画・サムネイルはコンソールの「動画管理」（/videos と共通データ）で管理。
function Videos3() {
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const embed = playing ? toEmbed(playing.videoUrl) : null;
  useBodyLock(playing !== null);
  return (
    <Sec>
      <Head base="recruit3:videos.head" en="MOVIE" jp="動画" center />
      <div className="mx-auto mt-10 grid w-full max-w-[900px] grid-cols-2 gap-4 pc:gap-5">
        {VIDEOS.map((v) => (
          <button
            key={v.id}
            type="button"
            className="group text-left"
            onClick={() => {
              if (EDIT_MODE) return; // 編集モードでは再生せず選択を優先
              setPlaying(v);
            }}
          >
            <div className="relative aspect-video overflow-hidden rounded-[0.625rem] bg-secondary shadow-[0_10px_24px_rgba(15,42,51,0.14)]">
              <ImageWithFallback
                src={v.thumb}
                alt={v.title}
                sizes="(min-width: 1025px) 450px, 50vw"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                {...edImg(`videos:${v.id}:thumb`)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/45">
                <PlayCircle size={48} className="text-white" />
              </div>
            </div>
            <h3 className="mt-2" style={{ fontSize: 14, fontWeight: 800, color: PAL.ink }} {...ed(`videos:${v.id}:title`)}>
              {v.title}
            </h3>
          </button>
        ))}
      </div>

      {/* 拡大再生モーダル（画面中央・body直下へポータル描画） */}
      {playing &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-5"
            onClick={() => setPlaying(null)}
          >
            <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setPlaying(null)}
                className="absolute -top-10 right-0 text-white/80 transition-colors hover:text-white"
              >
                <X size={26} />
              </button>
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                {embed?.type === "iframe" && (
                  <iframe
                    src={embed.src + (embed.src.includes("?") ? "&" : "?") + "autoplay=1"}
                    title={playing.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
                {embed?.type === "video" && <video src={embed.src} controls autoPlay playsInline className="h-full w-full" />}
                {!embed && (
                  <div className="flex h-full w-full items-center justify-center text-white/70" style={{ fontSize: 14 }}>
                    動画は準備中です。
                  </div>
                )}
              </div>
              <p className="mt-3 text-white" style={{ fontSize: 15, fontWeight: 700 }}>{playing.title}</p>
            </div>
          </div>,
          document.body,
        )}
    </Sec>
  );
}

/* ═══════════════ メインビジュアル（種類切替） ═══════════════ */

// MVの種類：現状どおり（ICELINE帯）／画像1枚／動画1本／画像スライドショー。
// コンソールのプルダウンで切替。編集プレビューでは全種類を描画してCSSで
// 即時切替し、公開ページでは選択された種類だけを描画する。
const MV_TYPE_OPTS = [
  { value: "hero", label: "現状どおり（ICELINE帯）" },
  { value: "image", label: "画像1枚" },
  { value: "video", label: "動画1本" },
  { value: "slideshow", label: "画像スライドショー" },
];
const MV_TYPE_CSS = ["hero", "image", "video", "slideshow"]
  .map(
    (t) =>
      `[data-mv-root][data-edit-selected="${t}"] [data-mv-variant]:not([data-mv-variant="${t}"]),` +
      `[data-mv-root]:not([data-edit-selected])[data-edit-value="${t}"] [data-mv-variant]:not([data-mv-variant="${t}"]){display:none}`
  )
  .join("\n");

/** 画像/スライドショーMVに重ねるテキスト（特大・大・小。行内の色は [[red:文字]] 等で指定） */
function MvRichText() {
  const xl = txt("recruit3:mvtext.xl", "");
  const lg = txt("recruit3:mvtext.lg", "");
  const sm = txt("recruit3:mvtext.sm", "");
  if (xl === "" && lg === "" && sm === "" && !EDIT_MODE) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center">
      <div className="pointer-events-auto mx-auto w-full max-w-[1200px] px-6 pc:px-12">
        {(xl !== "" || EDIT_MODE) && (
          <RichBody
            path="recruit3:mvtext.xl"
            text={xl || "（特大テキスト）"}
            label="MVテキスト（特大）"
            style={{ fontSize: "clamp(30px, 5.4vw, 60px)", fontWeight: 900, lineHeight: 1.6, color: "#16232b" }}
          />
        )}
        {(lg !== "" || EDIT_MODE) && (
          <RichBody
            path="recruit3:mvtext.lg"
            text={lg || "（大テキスト）"}
            label="MVテキスト（大）"
            className="mt-4"
            style={{ fontSize: "clamp(18px, 2.6vw, 28px)", fontWeight: 800, lineHeight: 1.9, color: "#16232b" }}
          />
        )}
        {(sm !== "" || EDIT_MODE) && (
          <RichBody
            path="recruit3:mvtext.sm"
            text={sm || "（小テキスト）"}
            label="MVテキスト（小）"
            className="mt-5"
            style={{ fontSize: "clamp(12px, 1.4vw, 16px)", fontWeight: 600, lineHeight: 2.1, color: "#16232b" }}
          />
        )}
      </div>
    </div>
  );
}

function MvImage() {
  const src = img("recruit3:mvimg.image", "");
  return (
    <div className="relative w-full overflow-hidden bg-secondary">
      <ImageWithFallback
        src={src || PH}
        alt=""
        loading="eager"
        sizes="100vw"
        className="aspect-[4/3] w-full object-cover tab:aspect-[1920/800]"
        {...edImg("recruit3:mvimg.image", "MV画像（1枚）")}
      />
      <MvRichText />
    </div>
  );
}

function MvVideo() {
  const url = txt("recruit3:mvvideo.url", "");
  return (
    <div className="relative w-full overflow-hidden bg-black">
      {url !== "" ? (
        <video src={url} autoPlay muted loop playsInline className="aspect-[4/3] w-full object-cover tab:aspect-[1920/800]" />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center tab:aspect-[1920/800]" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
          （MV動画未設定）
        </div>
      )}
      {EDIT_MODE && (
        <p
          className="absolute bottom-2 left-2 z-10 max-w-[90%] break-all rounded bg-white/85 px-2 py-1"
          style={{ fontSize: 11, color: PAL.ink }}
          {...ed("recruit3:mvvideo.url", "MV動画URL")}
          data-edit-video="1"
        >
          {url || "（MV動画のURLを入力、または動画ファイルをアップロード）"}
        </p>
      )}
    </div>
  );
}

const MAX_MV_SLIDES = 8;

function MvSlideshow() {
  const all = Array.from({ length: MAX_MV_SLIDES }, (_, i) => ({ i, src: img(`recruit3:mvslide.${i}.image`, "") }));
  const slides = all.filter((s) => s.src !== "");
  const [idx, setIdx] = useState(0);
  const cur = slides.length > 0 ? idx % slides.length : 0;
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  return (
    <div className="relative w-full overflow-hidden bg-secondary">
      <div className="relative aspect-[4/3] w-full tab:aspect-[1920/800]">
        {slides.length > 0 ? (
          slides.map((s, n) => (
            <ImageWithFallback
              key={s.i}
              src={s.src}
              alt=""
              sizes="100vw"
              loading={n === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              style={{ opacity: n === cur ? 1 : 0 }}
            />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ color: "#7a8a92", fontSize: 13 }}>
            （スライド画像未設定：編集モード下部の枠から追加してください）
          </div>
        )}
        <MvRichText />
      </div>
      {EDIT_MODE && (
        <div className="relative z-10 flex gap-2 overflow-x-auto bg-white/85 p-2">
          {all.map((s) => (
            <div key={s.i} className="relative aspect-video w-32 shrink-0 overflow-hidden rounded bg-secondary">
              <ImageWithFallback src={s.src || PH} alt="" className="h-full w-full object-cover" {...edImg(`recruit3:mvslide.${s.i}.image`, `MVスライド${s.i + 1}`)} />
              <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 text-white" style={{ fontSize: 10 }}>{s.i + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ ページ本体 ═══════════════ */

export function Recruit3() {
  // MV以下のコンテンツ領域（背景動画のスクロール進行の基準）
  const areaRef = useRef<HTMLDivElement>(null);
  const mvType = txt("recruit3:mv.type", "hero");

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <R2Styles />
      {/* 動画が無い場合は採用2と同じパララックス背景 */}
      {!HAS_BG && <PageBg />}

      <style>{MV_TYPE_CSS}</style>

      {/* メインビジュアル以下：スクロール追随の背景動画（fixed）＋新構成のコンテンツ。
          2026-08 改修：MVを背景動画の領域内へ移し、「現状どおり（ICELINE帯）」は
          独自背景（スライドマーキー・水色地・ティント）を持たない透過表示にして、
          背景動画がメインビジュアルから適用されるようにした */}
      <div ref={areaRef} className="relative">
        {HAS_BG && <BgVideos urls={BG_VIDEOS} areaRef={areaRef} />}
        <div className="relative z-10">
          {/* 1. メインビジュアル（種類はコンソールのプルダウンで切替） */}
          <div data-mv-root="1" {...edSel("recruit3:mv.type", "メインビジュアルの種類", MV_TYPE_OPTS, mvType)}>
            {(EDIT_MODE || mvType === "hero") && (
              <div data-mv-variant="hero">
                <Hero bandColor="#fff" bare extra={<HeroExtra />} />
              </div>
            )}
            {(EDIT_MODE || mvType === "image") && (
              <div data-mv-variant="image">
                <MvImage />
              </div>
            )}
            {(EDIT_MODE || mvType === "video") && (
              <div data-mv-variant="video">
                <MvVideo />
              </div>
            )}
            {(EDIT_MODE || mvType === "slideshow") && (
              <div data-mv-variant="slideshow">
                <MvSlideshow />
              </div>
            )}
          </div>
          {/* 2. 事業へのリンク */}
          <BizLinks />
          {/* 2.5. 数字で見るアイスライン（最低3枚のタイル・最大12枚まで追加可能） */}
          <Stats3 />
          {/* 3. アイスラインの仕事（画像＋文言の横並び。カルチャーの前） */}
          <Work3 />
          {/* 4. カルチャー */}
          <Culture />
          {/* 5. 人を知る */}
          <People3D />
          {/* 5.5. 埋め込み動画（URL未設定の間は非表示） */}
          <Movie3 />
          {/* 5.6. カンパニーデック（スライドショー。画像未設定の間は非表示） */}
          <Deck3 />
          {/* 6. 募集職種一覧 */}
          <JobsSection />
          {/* 7. 動画（動画で知るアイスライン・2×2グリッド） */}
          <Videos3 />
        </div>
      </div>
    </div>
  );
}
