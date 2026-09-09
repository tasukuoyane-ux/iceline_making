import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, X } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG } from "../data/images";
import { useNews } from "../data/news";
import { hasVideo } from "../data/blocks";
import { ed, edImg, txt, img, ratioCols, ratioAttrs, EDIT_MODE } from "../lib/editable";
import { RichBody } from "../components/common/RichBody";
import { InlineMovieTag } from "../components/common/MovieBadge";
import { FV_TOP_SHAPES, mountFvParticles } from "../lib/fvParticles";

// MVテキストの既定文言はサーバ先行描画（TopShell）と共用する
import { TOP_MV_TEXT_DEFAULT } from "../../lib/topMvDefaults";

// 「私たちの強み」画像の差し替え用プレースホルダー（編集前のグレー枠）
const STRENGTH_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e2e2e4"/><text x="50%" y="50%" font-size="30" fill="#a9a9af" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋ 画像</text></svg>'
  );

// 強みセクション本文の既定値
const STRENGTH_BODY_DEFAULT =
  "アイスラインが選ばれる理由は、一言で言えば「欠かさない」ことです。需要が読めないときでも、季節が外れているときでも、営業と製造と物流が動いて、約束した量を届ける。それを積み重ねてきた120年があります。\nFSSC・ISO認証に裏打ちされた品質と、5,000品目を超える商品ラインアップで、これからも食を支え続けます。";

// 事業一覧（現在のサイト構成に対応）。画像・小見出し・本文はコンソールから編集できる。
// 倉庫・ドライアイスの画像既定は各事業ページのMV画像（service:*.mv.image）を共有。
const SERVICES: { to: string; title: string; body: string; imgKey?: string; imgDefault?: string }[] = [
  {
    to: "/ice",
    title: "氷・氷菓の製造販売",
    body: "業務用かち割り氷から味付き氷・氷菓まで、自社工場で製造し全国の飲食店・量販店へ届けています。冷たいものなら、アイスライン。",
    imgDefault: IMG.iceMv,
  },
  {
    to: "/food",
    title: "業務用食材の販売",
    body: "岡山県内トップシェアの食品商社として、5,000品目を超える業務用食材をホテル・飲食店・食品メーカーへ提案・配送しています。",
    imgDefault: IMG.foodMv,
  },
  {
    to: "/warehouse",
    title: "倉庫事業",
    body: "冷凍・冷蔵倉庫で食品をお預かりし、入出庫・在庫管理まで低温物流の基盤を支えています。食を預かる、冷たい倉庫です。",
    imgKey: "service:warehouse.mv.image",
  },
  {
    to: "/dryice",
    title: "ドライアイスの販売",
    body: "ドライアイスの製造・加工・販売。食品の鮮度保持や低温輸送に欠かせない冷熱を、必要なときに必要な量だけお届けします。",
    imgKey: "service:dryice.mv.image",
  },
];

// ─────────────────────────────────────────────────────────
// 商品コラージュ（自社開発商品）。7枚の写真を不揃いなタイルで敷き詰め、
// 見出し（H2＋p）をタイルの一角に置く。SP・PC を問わず同じ配置を保つため、
// グリッドは 4列×10行の比率指定（gridArea は "行開始 / 列開始 / 行終了 / 列終了"）。
// PC は写真にホバーで薄くなり黒文字の説明が出る。SP はタップでオーバーレイ表示。
// （2026-09-08 に正方形タイル4列へ変えたが、翌日「edae2cd の仕様に戻す」指示でこの構成へ復帰）
// ─────────────────────────────────────────────────────────
// 見出しは左右の写真の上辺（2行目）に上端を揃える
const COLLAGE_HEAD_AREA = "2 / 2 / 4 / 4";
const COLLAGE_TILES: { area: string; title: string; body: string; imgKey?: string; imgDefault?: string }[] = [
  { area: "2 / 1 / 6 / 2", title: "無色透明かち割り氷", body: "硬く透明で溶けにくい業務用の氷。飲み物の味を損なわず、最後まで冷たさを保ちます。", imgDefault: IMG.iceClose },
  { area: "6 / 1 / 11 / 2", title: "氷カフェ", body: "コーヒーや果汁を凍らせた氷菓。牛乳を注ぐだけで、溶けるほどに味が深まる一杯に。", imgDefault: IMG.icedCoffee },
  { area: "4 / 2 / 11 / 3", title: "氷・氷菓", body: "自社工場で製造する氷から味付き氷・氷菓まで。冷たいものなら、アイスライン。", imgDefault: IMG.iceMv },
  { area: "4 / 3 / 7 / 4", title: "かき氷用 雪氷", body: "ふわふわに削れる、かき氷専用の氷。季節メニューの主役に。", imgDefault: IMG.iceBlue },
  { area: "7 / 3 / 11 / 4", title: "業務用食材", body: "5,000品目を超える業務用食材を、ホテル・飲食店・食品メーカーへお届けします。", imgDefault: IMG.foodMv },
  { area: "2 / 4 / 6 / 5", title: "冷凍冷蔵倉庫", body: "食品をお預かりし、入出庫・在庫管理まで低温物流の基盤を支えます。", imgDefault: IMG.warehouse },
  { area: "6 / 4 / 11 / 5", title: "ドライアイス", body: "食品の鮮度保持や低温輸送に欠かせない冷熱を、必要なときに必要な量だけ。", imgKey: "service:dryice.mv.image" },
];
const COLLAGE_LEAD_DEFAULT = "氷・氷菓から業務用食材、倉庫、ドライアイスまで。\n現場の声から生まれた商品とサービスをご紹介します。";

// 見出しのないバナー導線（コラージュの下）。画像・文言・リンク先はコンソールから編集できる。
// リンク先は「#〜」でページ内アンカー、「/〜」でサイト内ページ、「https://〜」で外部サイト（別タブ）。
const BANNERS: { title: string; sub: string; href: string; imgDefault: string }[] = [
  { title: "採用情報", sub: "私たちと一緒に働きませんか", href: "/recruit", imgDefault: IMG.warehouse },
  { title: "動画で知るアイスライン", sub: "製造現場や仕事の様子を動画で", href: "/videos", imgDefault: IMG.iceClose },
  { title: "お問い合わせ", sub: "商品・サービスのご相談はこちら", href: "/contact", imgDefault: IMG.foodMv },
];

/** リンク先の種類に応じて a / Link を出し分ける */
function wrapLink(href: string, className: string, children: ReactNode) {
  if (/^https?:/i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

/** 編集モード限定：リンク先URLをテキストとして編集するための行 */
function EditableLinkHint({ path, label, href }: { path: string; label: string; href: string }) {
  if (!EDIT_MODE) return null;
  return (
    <p className="mt-1.5 break-all text-muted-foreground" style={{ fontSize: 11 }} {...ed(path, label)}>
      {href}
    </p>
  );
}

/** コラージュの写真タイル。PC はホバーで写真が薄くなり黒文字の説明、SP はタップでオーバーレイ */
function CollageTile({ i, def }: { i: number; def: (typeof COLLAGE_TILES)[number] }) {
  const base = `top:collage.${i}`;
  const [open, setOpen] = useState(false);
  const title = txt(`${base}.title`, def.title);
  const body = txt(`${base}.body`, def.body);
  const src = img(`${base}.image`, def.imgKey ? img(def.imgKey, STRENGTH_PLACEHOLDER) : def.imgDefault!);
  return (
    <div className="group relative min-h-0 min-w-0 overflow-hidden rounded-lg bg-white" style={{ gridArea: def.area }}>
      <button type="button" onClick={() => setOpen(true)} className="block h-full w-full" aria-label={`${title} の説明を表示`}>
        <ImageWithFallback
          src={src}
          alt={title}
          sizes="(min-width: 1025px) 30vw, 40vw"
          className="h-full w-full object-cover transition-opacity duration-300 pc:group-hover:opacity-20"
          {...edImg(`${base}.image`, `コラージュ写真${i + 1}`)}
        />
      </button>
      {/* PC：ホバーで写真の上に黒文字の説明を表示 */}
      <div className="pointer-events-none absolute inset-0 hidden flex-col items-center justify-center p-4 text-center text-ink opacity-0 transition-opacity duration-300 pc:flex pc:group-hover:opacity-100">
        <h3 style={{ fontSize: "clamp(13px, 1.2vw, 18px)", fontWeight: 700, lineHeight: 1.5 }} {...ed(`${base}.title`, `コラージュ写真${i + 1} 見出し`)}>
          {title}
        </h3>
        <p className="mt-2" style={{ fontSize: "clamp(10px, 0.85vw, 13px)", lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`${base}.body`, `コラージュ写真${i + 1} 説明`, { multiline: true })}>
          {body}
        </p>
      </div>
      {/* SP：タップでオーバーレイ表示（PC幅では出さない） */}
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 p-6 pc:hidden"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <ImageWithFallback src={src} alt={title} className="aspect-[4/3] w-full object-cover" />
            <div className="p-5">
              <h3 className="text-ink" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5 }}>{title}</h3>
              <p className="mt-2 text-foreground/80" style={{ fontSize: 13.5, lineHeight: 1.9, whiteSpace: "pre-line" }}>{body}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow"
              aria-label="閉じる"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * メインビジュアル（2026-09 改修）。デザイン支給の FV：氷の微粒子が食材のシルエットを形作っては爆散する
 * パーティクル（fvParticles.ts）。コピーは従来どおり1つのテキストボックス（[[特大,red:氷]] 等の行内トークン対応）。
 * 「形作るまでの時間」と「解体後にオブジェクトが無い時間」はデザイン支給の 1/3（ユーザー指定）。
 * 2026-09-09 改修：キャンバスは画面に固定（背景画像の上・本文の下）にし、メインビジュアルより下へ
 * スクロールしても微粒子が連続して漂う。赤いオブジェクトを形作るのはメインビジュアルが画面内にあるときだけ。
 */
function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fvRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    // シルエット（赤いオブジェクト）はメインビジュアルの中だけ：MVがほぼ画面内にある間だけ形作り、
    // 形作ったオブジェクトはページに固定（scrollOffset）してMVと一緒に上へ流れ、MVを離れたら即解体する
    const canGather = () => {
      const h = fvRef.current?.offsetHeight || 1;
      return window.scrollY < h * 0.35;
    };
    const stop = mountFvParticles(cv, FV_TOP_SHAPES, false, {
      driftMul: 1 / 3,
      gatherMul: 1 / 3,
      canGather,
      scrollOffset: () => window.scrollY,
    });
    // スクロールでコピーがフェードアウト
    const onScroll = () => {
      const h = fvRef.current?.offsetHeight || 1;
      const y = Math.min(window.scrollY, h);
      if (copyRef.current) copyRef.current.style.opacity = String(Math.max(0, 1 - y / (h * 0.75)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      stop();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <>
      {/* 微粒子キャンバス（画面固定・背景画像の上・本文の下） */}
      <canvas ref={canvasRef} className="fv-canvas-fixed" aria-hidden />
      <section ref={fvRef} className="fv" aria-label="メインビジュアル">
        <div ref={copyRef} className="fv-copy2">
          <div className="fv-copy2-inner">
            <RichBody path="top:mv.title" text={txt("top:mv.title", TOP_MV_TEXT_DEFAULT)} label="MVテキスト" className="fv-copy2-rich" />
          </div>
        </div>
      </section>
    </>
  );
}

export function Top() {
  const news = useNews() ?? [];
  return (
    <>
      <Hero />

      {/* 新着情報 */}
      <Section heat={HEAT.topNews}>
        <div className="grid gap-8 pc:grid-cols-[280px_1fr]">
          <SectionTitle en="NEWS" jp="新着情報" path="sectionEn:top.news" />
          <div>
            {/* リンク（インタラクティブ要素）の背景は無地の白 */}
            <ul className="divide-y divide-border rounded-xl bg-white px-5 shadow-sm">
              {news.slice(0, 4).map((n) => (
                <li key={n.id}>
                  <Link to={`/news/${n.id}`} className="flex flex-col gap-1 py-4 transition-colors hover:text-brand tab:flex-row tab:items-center tab:gap-6">
                    {/* 日付・カテゴリは固定幅（横並び時）にして、記事名の文頭位置を全行で揃える（2026-09 改修） */}
                    <span className="shrink-0 text-muted-foreground tab:w-[6.5em]" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }} {...ed(`news:${n.id}:date`)}>{n.date}</span>
                    <span className="inline-flex w-fit shrink-0 justify-center bg-secondary px-3 py-0.5 text-muted-foreground tab:w-[6.5em]" style={{ fontSize: 12 }} {...ed(`news:${n.id}:category`)}>{n.category}</span>
                    <span className="flex min-w-0 flex-1 items-center gap-2" style={{ fontSize: 15 }}>
                      <span {...ed(`news:${n.id}:title`)}>{n.title}</span>
                      {hasVideo(n.blocks) && <InlineMovieTag />}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/news" className="group mt-6 inline-flex items-center gap-2 text-brand transition-opacity hover:opacity-75" style={{ fontSize: 14 }}>
              お知らせ一覧 <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </Section>

      {/* アイスラインの特徴（画像＋テキスト：記事と同様のH2/H3/p構成・左右逆レイアウト・背景は白） */}
      <Section heat={HEAT.topStrength}>
        <div
          className="en-label"
          {...ed("sectionEn:top.strength", "英語見出し（補助）")}
        >
          {txt("sectionEn:top.strength", "OUR BUSINESS")}
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.35 }} {...ed("top:strengthV2.title", "強み 見出し（H2）")}>
          {txt("top:strengthV2.title", "アイスラインの特徴")}
        </h2>
        <div
          className="mt-7 grid items-center gap-8 pc:gap-12 pc:[grid-template-columns:var(--ratio)]"
          style={{ ["--ratio" as any]: ratioCols("top:strengthV2.ratio", 50, true) }}
          {...ratioAttrs("top:strengthV2.ratio", 50, true)}
        >
          {/* 左：画像（差し替え可能） */}
          <ImageWithFallback
            src={img("top:strengthV2.image", STRENGTH_PLACEHOLDER)}
            alt={txt("top:strengthV2.title", "アイスラインの特徴")}
            className="aspect-[4/3] w-full rounded-2xl border border-black/10 object-cover"
            {...edImg("top:strengthV2.image", "強み 画像")}
          />
          {/* 右：テキスト（H3 ＋ 本文） */}
          <div className="pc:px-4">
            <h3 className="text-brand" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5 }} {...ed("top:strengthV2.subhead", "強み 小見出し（H3）")}>
              {txt("top:strengthV2.subhead", "氷を祖業に、低温のプロフェッショナルとして広がった事業")}
            </h3>
            <p className="mt-4 text-foreground/80" style={{ fontSize: 16, lineHeight: 2, whiteSpace: "pre-line" }} {...ed("top:strengthV2.body", "強み 本文", { multiline: true })}>
              {txt("top:strengthV2.body", STRENGTH_BODY_DEFAULT)}
            </p>
          </div>
        </div>
      </Section>

      {/* 事業内容（白カードに文章と画像を横並び。カードごとに左右が交互に入れ替わる。
          左右はコンソールの「左右入れ替え」、幅は「画像の幅」スライダーでも調整できる。2026-09 改修。
          カードのシャドウは無し（枠線のみ）） */}
      <Section heat={HEAT.topGenre}>
        <SectionTitle en="OUR SERVICES" jp="事業内容" path="sectionEn:top.services" />
        <div className="mt-7 flex flex-col gap-6">
          {SERVICES.map((s, i) => {
            const base = `top:services.${i}`;
            const title = txt(`${base}.title`, s.title);
            const rtl = i % 2 === 1;
            return (
              <div key={s.to} className="rounded-2xl border border-black/10 bg-white p-6 pc:p-10">
                <div
                  className={`grid items-center gap-6 pc:gap-12 pc:[grid-template-columns:var(--ratio)] ${rtl ? "pc:[direction:rtl]" : ""}`}
                  style={{ ["--ratio" as any]: ratioCols(`${base}.ratio`, 42, false) }}
                  {...ratioAttrs(`${base}.ratio`, 42, false, rtl)}
                >
                  {/* 文章（小見出し・本文・リンク） */}
                  <div className="[direction:ltr] pc:px-2">
                    <h3 className="text-brand" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5 }} {...ed(`${base}.title`, "事業名")}>
                      {title}
                    </h3>
                    <p
                      className="mt-4 text-foreground/85"
                      style={{ fontSize: 16, lineHeight: 1.9, whiteSpace: "pre-line" }}
                      {...ed(`${base}.body`, "事業内容 本文", { multiline: true })}
                    >
                      {txt(`${base}.body`, s.body)}
                    </p>
                    <Link to={s.to} className="group mt-4 inline-flex w-fit items-center gap-1.5 text-brand transition-opacity hover:opacity-75" style={{ fontSize: 14 }}>
                      <span>{title}</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  {/* 画像 */}
                  <Link to={s.to} className="group block [direction:ltr]">
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-secondary">
                      <ImageWithFallback
                        src={img(`${base}.image`, s.imgKey ? img(s.imgKey, STRENGTH_PLACEHOLDER) : s.imgDefault!)}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        {...edImg(`${base}.image`, `事業内容${i + 1} 画像`)}
                      />
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 商品コラージュ（自社開発商品。見出しH2＋pをタイルの一角に置く。SP・PC同一配置。edae2cd の仕様） */}
      <Section heat={HEAT.topGenre}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "13fr 20fr 10fr 13fr",
            gridTemplateRows: "repeat(10, minmax(0, 1fr))",
            aspectRatio: "1265 / 650",
            gap: "clamp(6px, 1.2vw, 16px)",
          }}
        >
          {/* 見出し（英語補助・H2・直下のp＝2行）。上端を左右の写真の上辺に揃え、幅に比例して縮む。
              余白は文字サイズ比（em）にして SP でも枠に収まるようにする */}
          <div className="min-w-0 self-start" style={{ gridArea: COLLAGE_HEAD_AREA, lineHeight: 1 }}>
            <div
              className="text-brand"
              style={{ fontFamily: "var(--font-accent)", fontSize: "clamp(6px, 0.95vw, 13px)", lineHeight: 1.2, letterSpacing: "0.18em" }}
              {...ed("sectionEn:top.products.en", "英語見出し（補助）")}
            >
              {txt("sectionEn:top.products.en", "PRODUCTS")}
            </div>
            <h2 style={{ marginTop: "0.25em", fontSize: "clamp(11px, 2.2vw, 30px)", fontWeight: 700, lineHeight: 1.3 }} {...ed("sectionEn:top.products.jp", "大見出し（H2）")}>
              {txt("sectionEn:top.products.jp", "自社開発商品")}
            </h2>
            <p
              className="text-foreground/80"
              style={{ marginTop: "0.6em", fontSize: "clamp(6px, 1vw, 14px)", lineHeight: 1.7, whiteSpace: "pre-line" }}
              {...ed("top:collage.lead", "見出し直下の文章（2行）", { multiline: true })}
            >
              {txt("top:collage.lead", COLLAGE_LEAD_DEFAULT)}
            </p>
          </div>
          {COLLAGE_TILES.map((t, i) => (
            <CollageTile key={i} i={i} def={t} />
          ))}
        </div>
      </Section>

      {/* バナー導線（見出しなし・3枚横並び・暗いオーバーレイに白文字・クリックでCMS指定のリンク先へ） */}
      <Section heat={HEAT.topGenre} className="pt-0">
        <h2 className="sr-only">バナー導線</h2>
        <div className="grid grid-cols-3 gap-3 pc:gap-6">
          {BANNERS.map((b, i) => {
            const base = `top:banner.${i}`;
            const href = txt(`${base}.href`, b.href);
            const title = txt(`${base}.title`, b.title);
            return (
              <div key={i}>
                {wrapLink(
                  href,
                  "group block",
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary pc:aspect-[16/10]">
                    <ImageWithFallback
                      src={img(`${base}.image`, b.imgDefault)}
                      alt={title}
                      sizes="33vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      {...edImg(`${base}.image`, `バナー${i + 1} 画像`)}
                    />
                    <div className="absolute inset-0 bg-ink/55 transition-colors group-hover:bg-ink/45" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white">
                      <span style={{ fontSize: "clamp(11px, 1.5vw, 22px)", fontWeight: 700, lineHeight: 1.4 }} {...ed(`${base}.title`, `バナー${i + 1} 見出し`)}>
                        {title}
                      </span>
                      <span className="mt-1 text-white/90" style={{ fontSize: "clamp(8px, 0.9vw, 13px)", lineHeight: 1.6 }} {...ed(`${base}.sub`, `バナー${i + 1} 文言`)}>
                        {txt(`${base}.sub`, b.sub)}
                      </span>
                    </div>
                  </div>
                )}
                <EditableLinkHint path={`${base}.href`} label={`バナー${i + 1} リンク先URL`} href={href} />
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
