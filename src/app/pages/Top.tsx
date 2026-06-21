import { Link } from "react-router";
import { ArrowRight, Building2, ShoppingBag, Users } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { NEWS } from "../data/news";
import { hasVideo } from "../data/blocks";
import { PRODUCT_GENRES, PRODUCTS } from "../data/products";
import { ed, edImg, txt, img } from "../lib/editable";
import { InlineMovieTag } from "../components/common/MovieBadge";

// トップページ メインビジュアル（TOP専用キーで編集対象を明確化）
const TOP_MV = { img: IMG.topMv, alt: "アイスライン メインビジュアル", key: "topMv" };

// 「私たちの強み」画像の差し替え用プレースホルダー（編集前のグレー枠）
const STRENGTH_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e2e2e4"/><text x="50%" y="50%" font-size="30" fill="#a9a9af" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋ 画像</text></svg>'
  );

// 強みセクション本文の既定値
const STRENGTH_BODY_DEFAULT =
  "アイスラインが選ばれる理由は、一言で言えば「欠かさない」ことです。需要が読めないときでも、季節が外れているときでも、営業と製造と物流が動いて、約束した量を届ける。それを積み重ねてきた120年があります。\nFSSC・ISO認証に裏打ちされた品質と、5,000品目を超える商品ラインアップで、これからも食を支え続けます。";

const AUDIENCE = [
  { icon: Building2, label: "業務用の氷・食品をお探しの方へ", note: "B2B 顧客向け", to: "/food", external: false },
  { icon: ShoppingBag, label: "オンラインショップはこちら", note: "B2C 消費者向け", to: "https://www.dry-ice.jp/", external: true },
  { icon: Users, label: "採用情報・エントリーはこちら", note: "求職者向け", to: "/recruit", external: false },
];

function Hero() {
  // メインビジュアル：トリミングせず全体表示（PC・SP共通）。
  // オーバーレイ・テキストは配置せず、画像そのものを見せる。
  const s = TOP_MV;
  return (
    <section className="w-full overflow-hidden bg-ink">
      <ImageWithFallback src={s.img} alt={s.alt} className="block w-full" {...edImg(`images:IMG.${s.key}`, "トップ メインビジュアル")} />
    </section>
  );
}

export function Top() {
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
                    <p className="text-muted-foreground" style={{ fontSize: 12 }} {...ed(`top:audience.${i}.note`, "導線サブラベル")}>{txt(`top:audience.${i}.note`, a.note)}</p>
                    <p style={{ fontSize: 15 }} {...ed(`top:audience.${i}.label`, "導線ラベル")}>{txt(`top:audience.${i}.label`, a.label)}</p>
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
            <ul className="divide-y divide-border border-t border-border">
              {NEWS.slice(0, 4).map((n) => (
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

      {/* 私たちの強み（画像＋テキスト：記事と同様のH2/H3/p構成・左右逆レイアウト・背景#d3d3d3） */}
      <Section heat={HEAT.topStrength} className="!bg-[#d3d3d3]">
        <div className="mb-2 text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 13, letterSpacing: "0.18em" }}>
          OUR STRENGTH
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.35 }} {...ed("top:strengthV2.title", "強み 見出し（H2）")}>
          {txt("top:strengthV2.title", "私たちの強み")}
        </h2>
        <div className="mt-10 grid items-center gap-8 pc:grid-cols-2 pc:gap-12">
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
          </div>
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
