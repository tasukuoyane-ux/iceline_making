import { Link } from "react-router";
import { ArrowRight, Building2, ShoppingBag, Snowflake } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { useNews } from "../data/news";
import { hasVideo } from "../data/blocks";
import { PRODUCT_GENRES, PRODUCTS } from "../data/products";
import { ed, edImg, txt, img, ratioCols, EDIT_MODE } from "../lib/editable";
import { InlineMovieTag } from "../components/common/MovieBadge";
import { RatioField } from "../components/common/RatioField";

// トップページ メインビジュアル（TOP専用キーで編集対象を明確化）
const TOP_MV = { img: IMG.topMv, alt: "アイスライン メインビジュアル", key: "topMv" };

// MVに重ねる白の斜線ストライプ（45°の破線を帯状に散らしたオーバーレイ）。
// 右から左に向けてだんだん濃くなる（右端は薄く・左に近づくほど白が強い）。
// 擬似乱数は決定的（毎回同じ模様）で、SVGをデータURIとして焼き込む。
const MV_STRIPES = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const lines: string[] = [];
  for (let i = 0; i < 30; i++) {
    const y = -420 + i * 44;
    const dashes: string[] = [];
    for (let j = 0; j < 7; j++) {
      dashes.push(`${Math.round(30 + rnd() * 230)} ${Math.round(40 + rnd() * 200)}`);
    }
    lines.push(
      `<line x1='-900' y1='${y}' x2='2500' y2='${y}' stroke='#fff' stroke-width='15' stroke-dasharray='${dashes.join(" ")}' stroke-dashoffset='${Math.round(rnd() * 600)}'/>`
    );
  }
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'>` +
    // 左=白（不透明）→右=濃いグレー（約2割の不透明度）のマスクで濃度を横方向に変化させる
    `<defs><linearGradient id='f' x1='0' y1='0' x2='1' y2='0'>` +
    `<stop offset='0' stop-color='#ffffff'/><stop offset='0.5' stop-color='#a6a6a6'/><stop offset='1' stop-color='#383838'/>` +
    `</linearGradient><mask id='m'><rect width='1600' height='900' fill='url(#f)'/></mask></defs>` +
    `<g mask='url(#m)'><g transform='rotate(-45 800 450)'>${lines.join("")}</g></g></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
})();

// 「私たちの強み」画像の差し替え用プレースホルダー（編集前のグレー枠）
const STRENGTH_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e2e2e4"/><text x="50%" y="50%" font-size="30" fill="#a9a9af" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋ 画像</text></svg>'
  );

// 強みセクション本文の既定値
const STRENGTH_BODY_DEFAULT =
  "アイスラインが選ばれる理由は、一言で言えば「欠かさない」ことです。需要が読めないときでも、季節が外れているときでも、営業と製造と物流が動いて、約束した量を届ける。それを積み重ねてきた120年があります。\nFSSC・ISO認証に裏打ちされた品質と、5,000品目を超える商品ラインアップで、これからも食を支え続けます。";

// 事業一覧（現在のサイト構成に対応）。倉庫・ドライアイスの画像は各事業ページの
// MV画像（service:*.mv.image）を共有し、コンソールで設定すればトップにも反映される。
const SERVICES: { to: string; en: string; title: string; lead: string; imgKey?: string; imgDefault?: string }[] = [
  { to: "/ice", en: "ICE", title: "氷・氷菓の製造販売", lead: "冷たいものなら、アイスライン。", imgDefault: IMG.iceMv },
  { to: "/food", en: "FOOD", title: "業務用食材の販売", lead: "食の現場に、深く根を張る。", imgDefault: IMG.foodMv },
  { to: "/warehouse", en: "WAREHOUSE", title: "倉庫事業", lead: "食を預かる、冷たい倉庫。", imgKey: "service:warehouse.mv.image" },
  { to: "/dryice", en: "DRY ICE", title: "ドライアイスの販売", lead: "必要なとき、必要な量を。", imgKey: "service:dryice.mv.image" },
];

// MV下の導線。label が1行目、note が2行目（括弧内の補足。無い導線は空文字）。
const AUDIENCE = [
  { icon: Building2, label: "お取引企業様", note: "氷/氷菓・食材・ドライアイス・倉庫", to: "/contact", external: false },
  { icon: Snowflake, label: "一般のお客様", note: "氷/氷菓", to: "/ice", external: false },
  { icon: ShoppingBag, label: "ドライアイスオンラインショップ", note: "", to: "https://www.dry-ice.jp/", external: true },
];

function Hero() {
  // メインビジュアル：トリミングせず全体表示（PC・SP共通）。
  // オーバーレイ・テキストは配置せず、画像そのものを見せる。
  const s = TOP_MV;
  return (
    <section className="relative w-full overflow-hidden bg-ink">
      <ImageWithFallback src={s.img} alt={s.alt} className="block w-full" {...edImg(`images:IMG.${s.key}`, "トップ メインビジュアル")} />
      {/* 白の斜線ストライプオーバーレイ（右→左でだんだん濃くなる） */}
      <img src={MV_STRIPES} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      {/* 左1/3は真っ白のパネル（見出しを乗せる領域）。右端はグラデーションでストライプへ馴染ませる */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 left-1/3 w-[12%] bg-gradient-to-r from-white to-transparent" aria-hidden />
      {/* MV見出し（H2相当・コンソールの「ページ編集」から文言を変更できる） */}
      <div className="absolute inset-y-0 left-0 flex w-1/3 items-center">
        <h2
          className="w-full px-[9%]"
          style={{ fontSize: "clamp(18px, 3.4vw, 46px)", fontWeight: 900, lineHeight: 1.6, color: "#101c24", whiteSpace: "pre-line" }}
          {...ed("top:mv.title", "MV 見出し", { multiline: true })}
        >
          {txt("top:mv.title", "氷と食で、\n日々に応える。")}
        </h2>
      </div>
    </section>
  );
}

export function Top() {
  const news = useNews() ?? [];
  return (
    <>
      <Hero />

      {/* ヒーロー：対象者別3導線 */}
      <Section heat={HEAT.topHero}>
        <div className="grid gap-4 tab:grid-cols-3">
          {AUDIENCE.map((a, i) => {
            const cls = "group flex items-center justify-between border border-border bg-card p-6 transition-colors hover:border-brand";
            const inner = (
              <>
                <div className="flex items-center gap-4">
                  <a.icon className="text-brand" size={28} />
                  <div>
                    <p style={{ fontSize: 15 }} {...ed(`top:audience.${i}.label`, "導線ラベル")}>{txt(`top:audience.${i}.label`, a.label)}</p>
                    {/* 2行目（括弧内の補足）。空の導線では表示しない */}
                    {(txt(`top:audience.${i}.note`, a.note) || EDIT_MODE) && (
                      <p className="text-muted-foreground" style={{ fontSize: 12 }} {...ed(`top:audience.${i}.note`, "導線サブラベル")}>{txt(`top:audience.${i}.note`, a.note)}</p>
                    )}
                  </div>
                </div>
                <ArrowRight className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand" size={20} />
              </>
            );
            return a.external ? (
              <a key={a.to} href={a.to} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={a.to} to={a.to} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </Section>

      {/* 新着情報 */}
      <Section heat={HEAT.topNews}>
        <div className="grid gap-8 pc:grid-cols-[280px_1fr]">
          <SectionTitle en="NEWS" jp="新着情報" />
          <div>
            {/* リンク（インタラクティブ要素）の背景は無地の白 */}
            <ul className="divide-y divide-border rounded-xl bg-white px-5 shadow-sm">
              {news.slice(0, 4).map((n) => (
                <li key={n.id}>
                  <Link to={`/news/${n.id}`} className="flex flex-col gap-1 py-4 transition-colors hover:text-brand tab:flex-row tab:items-center tab:gap-6">
                    <span className="text-muted-foreground" style={{ fontSize: 13 }} {...ed(`news:${n.id}:date`)}>{n.date}</span>
                    <span className="inline-flex w-fit bg-secondary px-3 py-0.5 text-muted-foreground" style={{ fontSize: 12 }} {...ed(`news:${n.id}:category`)}>{n.category}</span>
                    <span className="flex items-center gap-2" style={{ fontSize: 15 }}>
                      <span {...ed(`news:${n.id}:title`)}>{n.title}</span>
                      {hasVideo(n.blocks) && <InlineMovieTag />}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/news" className="mt-6 inline-flex items-center gap-2 text-brand" style={{ fontSize: 14 }}>
              お知らせ一覧 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Section>

      {/* 私たちの強み（画像＋テキスト：記事と同様のH2/H3/p構成・左右逆レイアウト・背景は白） */}
      <Section heat={HEAT.topStrength}>
        <div className="mb-2 text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 13, letterSpacing: "0.18em" }}>
          OUR STRENGTH
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.35 }} {...ed("top:strengthV2.title", "強み 見出し（H2）")}>
          {txt("top:strengthV2.title", "私たちの強み")}
        </h2>
        <div
          className="mt-10 grid items-center gap-8 pc:gap-12 pc:[grid-template-columns:var(--ratio)]"
          style={{ ["--ratio" as any]: ratioCols("top:strengthV2.ratio", 50, true) }}
        >
          {/* 左：画像（差し替え可能） */}
          <ImageWithFallback
            src={img("top:strengthV2.image", STRENGTH_PLACEHOLDER)}
            alt={txt("top:strengthV2.title", "私たちの強み")}
            className="aspect-[4/3] w-full rounded-2xl border border-black/10 object-cover"
            {...edImg("top:strengthV2.image", "強み 画像")}
          />
          {/* 右：テキスト（H3 ＋ 本文） */}
          <div>
            <h3 className="text-brand" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5 }} {...ed("top:strengthV2.subhead", "強み 小見出し（H3）")}>
              {txt("top:strengthV2.subhead", "安定供給")}
            </h3>
            <p className="mt-4 text-foreground/80" style={{ fontSize: 16, lineHeight: 2, whiteSpace: "pre-line" }} {...ed("top:strengthV2.body", "強み 本文", { multiline: true })}>
              {txt("top:strengthV2.body", STRENGTH_BODY_DEFAULT)}
            </p>
            <RatioField path="top:strengthV2.ratio" def={50} />
          </div>
        </div>
      </Section>

      {/* 事業内容（現在のサイト構成：4事業への導線） */}
      <Section heat={HEAT.topGenre}>
        <SectionTitle en="OUR SERVICES" jp="事業内容" />
        <div className="mt-10 grid gap-5 tab:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Link key={s.to} to={s.to} className="group relative overflow-hidden rounded-lg">
              <div className="aspect-[16/8] w-full overflow-hidden bg-secondary">
                <ImageWithFallback
                  src={s.imgKey ? img(s.imgKey, STRENGTH_PLACEHOLDER) : s.imgDefault!}
                  alt={s.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/80 via-ink/30 to-transparent p-6">
                <span className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 12, letterSpacing: "0.18em" }}>{s.en}</span>
                <span className="mt-1 flex items-center gap-2 text-white" style={{ fontSize: 20, fontWeight: 700 }}>
                  <span {...ed(`top:services.${i}.title`, "事業名")}>{txt(`top:services.${i}.title`, s.title)}</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1 text-white/80" style={{ fontSize: 13 }} {...ed(`top:services.${i}.lead`, "事業リード")}>{txt(`top:services.${i}.lead`, s.lead)}</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* 商品ジャンル一覧 */}
      <Section heat={HEAT.topGenre}>
        <SectionTitle en="PRODUCTS" jp="商品ジャンル" />
        <div className="mt-10 grid grid-cols-2 gap-4 tab:grid-cols-3 pc:grid-cols-3">
          {PRODUCT_GENRES.map((g, i) => {
            const p = PRODUCTS.find((pr) => pr.genre === g.label);
            return (
              <Link
                key={g.label}
                to={p ? `/${g.division}/products/${p.id}` : `/${g.division}`}
                className="group relative overflow-hidden rounded-lg"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
                  {p && (
                    <ImageWithFallback
                      src={PRODUCT_IMG[p.id]}
                      alt={g.label}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/70 to-transparent p-5">
                  <span className="text-white" style={{ fontSize: 16, fontWeight: 700 }} {...ed(`top:genre.${i}.label`, "商品ジャンル名")}>{txt(`top:genre.${i}.label`, g.label)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>
    </>
  );
}
