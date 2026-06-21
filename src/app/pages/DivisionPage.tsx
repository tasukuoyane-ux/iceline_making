import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight, ChevronDown } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { Division, DIVISION_INFO, DIVISION_DETAIL, ICE_RECIPES, PRODUCTS } from "../data/products";
import { ed, edImg, txt, img } from "../lib/editable";

const MV: Record<Division, { img: string; lead: string }> = {
  food: { img: IMG.foodMv, lead: "食の現場に、深く根を張る。" },
  ice: { img: IMG.iceMv, lead: "冷たいものなら、アイスライン。" },
};

// ＋画像の差し替え可能なプレースホルダー（編集前に表示するグレー枠）
const IMG_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#f1f1f3"/><text x="50%" y="50%" font-size="30" fill="#bcbcc2" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋ 画像</text></svg>'
  );

export function DivisionPage({ division }: { division: Division }) {
  // CMSの公開データに欠落があってもページが真っ白にならないよう、すべて任意アクセスで扱う。
  const info = DIVISION_INFO[division];
  const detail = DIVISION_DETAIL[division];
  const divLabel = info?.label ?? (division === "food" ? "食品事業部" : "アイス事業部");
  const items = PRODUCTS.filter((p) => p.division === division);
  const [openCats, setOpenCats] = useState<string[]>([]);
  const toggleCat = (c: string) =>
    setOpenCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const bizHeat = division === "food" ? HEAT.foodBiz : HEAT.iceBiz;
  const reasonHeat = division === "food" ? HEAT.foodReason : HEAT.iceReason;
  const listHeat = division === "food" ? HEAT.foodList : HEAT.iceList;

  return (
    <>
      {/* メインビジュアル（高さは会社情報ページに合わせる・タイトル中央） */}
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-ink">
        <ImageWithFallback src={MV[division].img} alt={divLabel} className="absolute inset-0 h-full w-full object-cover" {...edImg(division === "food" ? "images:IMG.foodMv" : "images:IMG.iceMv", "メインビジュアル画像")} />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-5 text-center pc:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }}>
              {division === "food" ? "FOOD DIVISION" : "ICE DIVISION"}
            </p>
            <h1 className="text-white" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.2 }}>{divLabel}</h1>
            <p className="mt-4 text-white/85" style={{ fontSize: 16 }} {...ed(`division:${division}:mvLead`, "MVリード文")}>{txt(`division:${division}:mvLead`, MV[division].lead)}</p>
          </motion.div>
        </div>
      </section>

      {/* 事業概要 */}
      <Section heat={bizHeat}>
        <div className="mx-auto max-w-3xl text-center">
          <SectionTitle en="OUR BUSINESS" jp="事業概要" align="center" />
          <p className="mt-6 text-left text-foreground/80 pc:text-center" style={{ fontSize: 16, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed(`sections:divisionDetail.${division}.overview`, "事業概要", { multiline: true })}>
            {detail?.overview}
          </p>
        </div>
      </Section>

      {/* サプライチェーン */}
      <Section heat={listHeat}>
        <SectionTitle en="SUPPLY CHAIN" jp="サプライチェーン" />
        <p className="mt-6 max-w-3xl text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed(`sections:divisionDetail.${division}.supplyChain`, "サプライチェーン", { multiline: true })}>
          {detail?.supplyChain}
        </p>
        {division === "food" && (
          <div className="mt-8">
            <ImageWithFallback
              src={img("division:food.supplyChain.image", IMG.foodNetwork || IMG_PLACEHOLDER)}
              alt="サプライチェーン"
              className="w-full rounded-2xl border border-border object-cover"
              {...edImg("division:food.supplyChain.image", "サプライチェーン画像")}
            />
          </div>
        )}
      </Section>

      {/* 事業の特色 */}
      <Section heat={reasonHeat}>
        <SectionTitle en="FEATURES" jp="事業の特色" />
        <div className="mt-12 space-y-16">
          {(detail?.features ?? []).map((g, gi) => (
            <div key={gi}>
              <h3 className="border-b border-border pb-3 text-brand" style={{ fontSize: 22, fontWeight: 800 }} {...ed(`sections:divisionDetail.${division}.features.${gi}.heading`, "特色の見出し")}>
                {g.heading}
              </h3>
              <div className="mt-8 space-y-10">
                {g.items.map((it, ii) =>
                  it.image ? (
                    <motion.div
                      key={ii}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className={`grid items-center gap-8 pc:grid-cols-[2fr_3fr] ${(gi + ii) % 2 ? "pc:[direction:rtl]" : ""}`}
                    >
                      <div className="[direction:ltr] pc:px-12">
                        {it.title && (
                          <h4 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`sections:divisionDetail.${division}.features.${gi}.items.${ii}.title`, "小見出し")}>
                            {it.title}
                          </h4>
                        )}
                        <p className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed(`sections:divisionDetail.${division}.features.${gi}.items.${ii}.body`, "本文", { multiline: true })}>
                          {it.body}
                        </p>
                      </div>
                      {/* ＋画像（差し替え可能なプレースホルダー） */}
                      <ImageWithFallback
                        src={img(`division:${division}.feat.${gi}.${ii}.image`, IMG_PLACEHOLDER)}
                        alt={it.title || g.heading}
                        className="aspect-[4/3] w-full rounded-2xl border border-border object-cover [direction:ltr]"
                        {...edImg(`division:${division}.feat.${gi}.${ii}.image`, `${it.title || g.heading} 画像`)}
                      />
                    </motion.div>
                  ) : (
                    <div key={ii} className="max-w-3xl">
                      {it.title && (
                        <h4 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`sections:divisionDetail.${division}.features.${gi}.items.${ii}.title`, "小見出し")}>
                          {it.title}
                        </h4>
                      )}
                      <p className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed(`sections:divisionDetail.${division}.features.${gi}.items.${ii}.body`, "本文", { multiline: true })}>
                        {it.body}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 選ばれる理由 */}
      <Section heat={bizHeat}>
        <SectionTitle en="WHY CHOSEN" jp="選ばれる理由" />
        <div className="mt-10 grid gap-6 pc:grid-cols-3">
          {(detail?.reasons ?? []).map((r, ri) => (
            <motion.div
              key={ri}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: ri * 0.1 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <div className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{r.no}</div>
              <h3 className="mt-3" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.5 }} {...ed(`sections:divisionDetail.${division}.reasons.${ri}.title`, "選ばれる理由タイトル")}>{r.title}</h3>
              <p className="mt-4 text-foreground/80" style={{ fontSize: 14, lineHeight: 2, whiteSpace: "pre-line" }} {...ed(`sections:divisionDetail.${division}.reasons.${ri}.body`, "選ばれる理由本文", { multiline: true })}>{r.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 商品一覧 */}
      <Section heat={listHeat}>
        <SectionTitle en="PRODUCTS" jp="取り扱い商品" />
        <div className="mt-10 grid gap-6 tab:grid-cols-2 pc:grid-cols-3">
          {items.map((p) => (
            <Link
              key={p.id}
              to={`/${division}/products/${p.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <ImageWithFallback src={PRODUCT_IMG[p.id]} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" {...edImg(`images:PRODUCT_IMG.${p.id}`)} />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="text-muted-foreground" style={{ fontSize: 12 }} {...ed(`product:${p.id}:genre`, "商品ジャンル")}>{txt(`product:${p.id}:genre`, p.genre)}</span>
                <h3 className="mt-1" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`product:${p.id}:name`, "商品名")}>{txt(`product:${p.id}:name`, p.name)}</h3>
                <p className="mt-2 flex-1 text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.8 }} {...ed(`product:${p.id}:catch`, "商品キャッチ")}>{txt(`product:${p.id}:catch`, p.catch)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-brand" style={{ fontSize: 13 }}>
                  詳細を見る <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* 氷のレシピ（アイス事業部のみ・カテゴリごとにアコーディオン展開） */}
      {division === "ice" && (
        <Section heat={HEAT.iceRecipe} id="ice-recipe">
          <SectionTitle en="ICE RECIPE" jp="氷のレシピ" />
          <p className="mt-4 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.9 }}>
            氷カフェ・カクテル氷・雪氷を使った、お店でそのまま使えるレシピメニュー。
          </p>
          <div className="mt-10 space-y-4">
            {ICE_RECIPES.map((cat) => {
              const open = openCats.includes(cat.category);
              return (
                <div key={cat.category} className="overflow-hidden rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => toggleCat(cat.category)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 bg-card px-6 py-5 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-brand" style={{ fontSize: 18, fontWeight: 700 }}>{cat.category}</span>
                      <span className="text-muted-foreground" style={{ fontSize: 12 }}>{cat.items.length}品</span>
                    </span>
                    <ChevronDown
                      size={20}
                      className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="border-t border-border bg-background p-6">
                      <div className="grid grid-cols-2 gap-5 tab:grid-cols-3 pc:grid-cols-4">
                        {cat.items.map((it) => (
                          <Link
                            key={it.id}
                            to={`/ice/recipe/${it.id}`}
                            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
                          >
                            <div className="aspect-[4/3] overflow-hidden bg-secondary">
                              <ImageWithFallback src={it.image} alt={it.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                            <div className="flex flex-1 items-center justify-between gap-2 p-4">
                              <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{it.name}</span>
                              <ChevronRight size={15} className="shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}
