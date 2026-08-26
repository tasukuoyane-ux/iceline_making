import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { useNews } from "../data/news";
import { hasVideo } from "../data/blocks";
import { PRODUCT_GENRES, PRODUCTS } from "../data/products";
import { ed, edImg, txt, img, ratioCols, ratioAttrs } from "../lib/editable";
import { RichBody } from "../components/common/RichBody";
import { InlineMovieTag } from "../components/common/MovieBadge";

// トップページ メインビジュアル（TOP専用キーで編集対象を明確化）
const TOP_MV = { img: IMG.topMv, alt: "アイスライン メインビジュアル", key: "topMv" };

// MVのストライプ・白パネル・グラデーション加工は 2026-08 改修で削除
//（src/lib/mvStripes.ts は不使用になった）。
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

// MV直下の対象者別導線（導線1〜4）は 2026-08 改修で削除した。

function Hero() {
  // メインビジュアル：トリミングせず全体表示（PC・SP共通）。
  // オーバーレイ・テキストは配置せず、画像そのものを見せる。
  const s = TOP_MV;
  return (
    <section className="relative w-full overflow-hidden bg-ink">
      {/* LCP要素：遅延させず最優先で読み込む（page.tsx で preload 済み）。
          width/height は読み込み完了前の高さ確保用（レイアウトシフト防止）。
          読み込み後は画像の実寸比が優先されるため、差し替えで比率が変わっても表示は崩れない */}
      <ImageWithFallback
        src={s.img}
        alt={s.alt}
        className="block w-full"
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        width={1920}
        height={800}
        {...edImg(`images:IMG.${s.key}`, "トップ メインビジュアル")}
      />
      {/* ストライプ・白パネル・グラデーションの加工は 2026-08 改修で削除
          （画像をそのまま表示する） */}
      {/* MVテキスト（1つのボックス）。[[特大:文字]] [[大:文字]] で文字サイズ、
          [[red:文字]] [[#0000ff:文字]] で文字色を行内で自在に指定できる
          （[[特大,red:文字]] のように併用可。指定なしの部分は小＝基準サイズ）。
          SPでもPCと同じ構造でMVの中に重ねる（画像と同様に文字も画面幅に比例して
          縮むよう、基準サイズは vw 駆動の clamp にしている） */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-[62%] pl-[4.5%]">
          <RichBody
            path="top:mv.title"
            text={txt("top:mv.title", TOP_MV_TEXT_DEFAULT)}
            label="MVテキスト"
            style={{ fontSize: "clamp(6px, 1.1vw, 15px)", fontWeight: 500, lineHeight: 2.0, color: "#101c24" }}
          />
        </div>
      </div>
    </section>
  );
}

export function Top() {
  const news = useNews() ?? [];
  return (
    <>
      <Hero />

      {/* MV直下の対象者別導線（導線1〜4）は 2026-08 改修で削除 */}

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
        <div
          className="mb-2 text-brand"
          style={{ fontFamily: "var(--font-accent)", fontSize: 13, letterSpacing: "0.18em" }}
          {...ed("sectionEn:top.strength", "英語見出し（補助）")}
        >
          {txt("sectionEn:top.strength", "OUR STRENGTH")}
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.35 }} {...ed("top:strengthV2.title", "強み 見出し（H2）")}>
          {txt("top:strengthV2.title", "私たちの強み")}
        </h2>
        <div
          className="mt-10 grid items-center gap-8 pc:gap-12 pc:[grid-template-columns:var(--ratio)]"
          style={{ ["--ratio" as any]: ratioCols("top:strengthV2.ratio", 50, true) }}
          {...ratioAttrs("top:strengthV2.ratio", 50, true)}
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
          </div>
        </div>
      </Section>

      {/* 事業内容（画像・小見出し・本文・リンクの縦組みカード。2026-08 改修） */}
      <Section heat={HEAT.topGenre}>
        <SectionTitle en="OUR SERVICES" jp="事業内容" path="sectionEn:top.services" />
        <div className="mt-10 grid gap-x-8 gap-y-12 tab:grid-cols-2">
          {SERVICES.map((s, i) => {
            const title = txt(`top:services.${i}.title`, s.title);
            return (
              <div key={s.to} className="flex flex-col">
                {/* 画像 */}
                <Link to={s.to} className="group block">
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-secondary">
                    <ImageWithFallback
                      src={img(`top:services.${i}.image`, s.imgKey ? img(s.imgKey, STRENGTH_PLACEHOLDER) : s.imgDefault!)}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      {...edImg(`top:services.${i}.image`, `事業内容${i + 1} 画像`)}
                    />
                  </div>
                </Link>
                {/* 小見出し */}
                <h3 className="mt-5" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.6 }} {...ed(`top:services.${i}.title`, "事業名")}>
                  {title}
                </h3>
                {/* 本文 */}
                <p
                  className="mt-2 flex-1 text-foreground/80"
                  style={{ fontSize: 13.5, lineHeight: 2.0, whiteSpace: "pre-line" }}
                  {...ed(`top:services.${i}.body`, "事業内容 本文", { multiline: true })}
                >
                  {txt(`top:services.${i}.body`, s.body)}
                </p>
                {/* リンク（事業名＋矢印） */}
                <Link to={s.to} className="group mt-3 inline-flex w-fit items-center gap-1.5 text-brand" style={{ fontSize: 13, fontWeight: 600 }}>
                  <span>{title}</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 商品ジャンル一覧 */}
      <Section heat={HEAT.topGenre}>
        <SectionTitle en="PRODUCTS" jp="商品ジャンル" path="sectionEn:top.products" />
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
                      sizes="50vw"
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
