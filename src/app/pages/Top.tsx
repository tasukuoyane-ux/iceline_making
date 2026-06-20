import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Building2, ShoppingBag, Users } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { SITE, STRENGTHS } from "../data/company";
import { NEWS } from "../data/news";
import { PRODUCT_GENRES, PRODUCTS } from "../data/products";
import { ed, edImg, txt, img } from "../lib/editable";

const SLIDES = [
  { img: IMG.iceMacro, alt: "氷のクローズアップ", key: "iceMacro" },
  { img: IMG.foodPlate, alt: "食の現場", key: "foodPlate" },
  { img: IMG.icedCoffee, alt: "カップ氷の飲料", key: "icedCoffee" },
];

const AUDIENCE = [
  { icon: Building2, label: "業務用の氷・食品をお探しの方へ", note: "B2B 顧客向け", to: "/food", external: false },
  { icon: ShoppingBag, label: "オンラインショップはこちら", note: "B2C 消費者向け", to: "https://www.dry-ice.jp/", external: true },
  { icon: Users, label: "採用情報・エントリーはこちら", note: "求職者向け", to: "/recruit", external: false },
];

function Hero() {
  // メインビジュアル：1枚目の画像をトリミングせず全体表示（PC・SP共通）
  const s = SLIDES[0];
  return (
    <section className="relative w-full overflow-hidden bg-ink">
      <ImageWithFallback src={s.img} alt={s.alt} className="block w-full" {...edImg(`images:IMG.${s.key}`)} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
      <div className="absolute inset-0">
        <div className="mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-6 pc:px-8 pc:pb-14">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="mb-2 text-white/80 pc:mb-4" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.2em", fontSize: 13 }}>
              SINCE 1905 — <span {...ed("sections:site.yearsLabel")}>{SITE.yearsLabel}</span>
            </p>
            <h1 className="text-white" style={{ fontSize: "clamp(26px, 4.4vw, 52px)", fontWeight: 900, lineHeight: 1.18 }} {...ed("sections:site.tagline")}>
              {SITE.tagline}
            </h1>
            <p className="mt-2 text-white/85 pc:mt-4" style={{ fontSize: "clamp(13px, 1.6vw, 18px)" }} {...ed("sections:site.subTagline")}>
              {SITE.subTagline}
            </p>
          </motion.div>
        </div>
      </div>
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
                    <span style={{ fontSize: 15 }} {...ed(`news:${n.id}:title`)}>{n.title}</span>
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

      {/* 当社の強み（TOPの熱量ピーク） */}
      <Section heat={HEAT.topStrength} contained={false}>
        <div className="mx-auto max-w-[1400px] px-5 pc:px-8">
          <SectionTitle en="OUR STRENGTH" jp="私たちの強み" />
          <p className="mt-4 max-w-2xl text-muted-foreground" style={{ fontSize: 16, lineHeight: 2, whiteSpace: "pre-line" }} {...ed("top:strength.lead", "強み リード文", { multiline: true })}>
            {txt("top:strength.lead", "需要が読めないときも、季節が外れているときも。約束した量を、欠かさず届ける。\nその積み重ねが、120年のアイスラインです。")}
          </p>
          <div className="mt-12 grid gap-6 pc:grid-cols-3">
            {STRENGTHS.map((s, idx) => (
              <motion.div
                key={s.no}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                className="rounded-2xl border border-border bg-card p-8"
              >
                <div className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 40, fontWeight: 700 }} {...ed(`top:strength.${idx}.no`, "強み 番号")}>{txt(`top:strength.${idx}.no`, s.no)}</div>
                <h3 className="mt-2" style={{ fontSize: 22, fontWeight: 700 }} {...ed(`top:strength.${idx}.title`, "強み タイトル")}>{txt(`top:strength.${idx}.title`, s.title)}</h3>
                <p className="mt-4 text-muted-foreground" style={{ fontSize: 14, lineHeight: 2, whiteSpace: "pre-line" }} {...ed(`top:strength.${idx}.body`, "強み 本文", { multiline: true })}>{txt(`top:strength.${idx}.body`, s.body)}</p>
              </motion.div>
            ))}
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
