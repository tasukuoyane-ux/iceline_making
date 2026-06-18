import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight, ShieldCheck, Snowflake, Sparkles, Palette, Droplets, X } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { Division, DIVISION_INFO, DIVISION_BIZ, ICE_RECIPES, IceRecipeItem, PRODUCTS } from "../data/products";

const MV: Record<Division, { img: string; lead: string }> = {
  food: { img: IMG.foodPlate, lead: "食の現場に、深く根を張る。" },
  ice: { img: IMG.iceMacro, lead: "冷たいものなら、アイスライン。" },
};

// 新たな氷の可能性が広がっていくことを表現した図
function IcePossibilityFigure() {
  const branches = [
    { icon: Palette, label: "色のある氷", note: "視覚で楽しむ" },
    { icon: Sparkles, label: "味のある氷", note: "溶けて広がる香り" },
    { icon: Droplets, label: "機能性の氷", note: "溶けにくい・形状自在" },
    { icon: Snowflake, label: "用途別の氷", note: "業務用からレジャーまで" },
  ];
  return (
    <div className="mt-12 rounded-2xl border border-border bg-card p-8 pc:p-12">
      <div className="grid items-center gap-8 pc:grid-cols-[200px_1fr]">
        {/* 中心：氷 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex aspect-square w-40 flex-col items-center justify-center rounded-full bg-ink text-center text-white"
        >
          <Snowflake className="text-brand" size={36} />
          <span className="mt-2" style={{ fontSize: 18, fontWeight: 700 }}>岡山の氷</span>
          <span className="text-white/60" style={{ fontSize: 11 }}>ICELINE</span>
        </motion.div>
        {/* 枝：広がる可能性 */}
        <div className="grid gap-4 tab:grid-cols-2">
          {branches.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative flex items-start gap-3 rounded-xl border border-border bg-background p-4"
            >
              <span className="absolute -left-4 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-brand/40 pc:block" />
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <b.icon size={20} />
              </span>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>{b.label}</p>
                <p className="mt-0.5 text-muted-foreground" style={{ fontSize: 12 }}>{b.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <p className="mt-8 text-center text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.9 }}>
        一つの氷から、新たな価値へ。アイスラインは氷の可能性を、絶えず広げ続けています。
      </p>
    </div>
  );
}

export function DivisionPage({ division }: { division: Division }) {
  const info = DIVISION_INFO[division];
  const biz = DIVISION_BIZ[division];
  const items = PRODUCTS.filter((p) => p.division === division);
  const [recipe, setRecipe] = useState<IceRecipeItem | null>(null);
  const reasonHeat = division === "food" ? HEAT.foodReason : HEAT.iceReason;
  const listHeat = division === "food" ? HEAT.foodList : HEAT.iceList;

  return (
    <>
      {/* メインビジュアル（シズル感） */}
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-ink">
        <ImageWithFallback src={MV[division].img} alt={info.label} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/20" />
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-16 pc:px-8 pc:pb-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }}>
              {division === "food" ? "FOOD DIVISION" : "ICE DIVISION"}
            </p>
            <h1 className="text-white" style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.25 }}>{info.label}</h1>
            <p className="mt-3 text-white/85" style={{ fontSize: 18 }}>{MV[division].lead}</p>
          </motion.div>
        </div>
      </section>

      {/* 事業概要＋選ばれる理由（左に縦並び・右に画像） */}
      <Section heat={reasonHeat}>
        <div className="grid items-center gap-10 pc:grid-cols-2 pc:items-stretch">
          {/* 左：OUR BUSINESS → WHY CHOSEN を縦並び */}
          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <SectionTitle en="OUR BUSINESS" jp="事業概要" />
              <p className="mt-6 text-brand" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.4 }}>
                {biz.copy}
              </p>
              <p className="mt-6 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1 }}>{biz.body}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <SectionTitle en="WHY CHOSEN" jp="選ばれる理由" />
              <p className="mt-6 text-brand" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.4 }}>
                {info.reasonCatch}
              </p>
              <p className="mt-6 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1 }}>{info.reasonBody}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-muted-foreground" style={{ fontSize: 13 }}>
                <ShieldCheck size={16} className="text-brand" /> FSSC 22000 / ISO 認証取得
              </div>
            </motion.div>
          </div>
          {/* 右：画像（左列の高さに追従） */}
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="pc:h-full">
            <ImageWithFallback
              src={division === "food" ? IMG.kitchen : IMG.iceClose}
              alt={info.reasonCatch}
              className="aspect-[4/5] w-full rounded-2xl object-cover pc:aspect-auto pc:h-full pc:sticky pc:top-24"
            />
          </motion.div>
        </div>
        {division === "ice" && <IcePossibilityFigure />}
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
                <ImageWithFallback src={PRODUCT_IMG[p.id]} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>{p.genre}</span>
                <h3 className="mt-1" style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</h3>
                <p className="mt-2 flex-1 text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.8 }}>{p.catch}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-brand" style={{ fontSize: 13 }}>
                  詳細を見る <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* 氷のレシピ（アイス事業部のみ・縦400px以内／サイト内で完結） */}
      {division === "ice" && (
        <Section heat={HEAT.iceRecipe}>
          <SectionTitle en="ICE RECIPE" jp="氷のレシピ" />
          {/* 複数階層（カテゴリ＞レシピ）を横スクロールで縦400px以内に収める */}
          <div className="mt-6 max-h-[400px] overflow-x-auto overflow-y-hidden pb-3">
            <div className="grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-4 tab:grid-flow-row tab:grid-cols-2 pc:grid-cols-4">
              {ICE_RECIPES.map((cat) => (
                <div key={cat.category} className="flex flex-col rounded-xl border border-border bg-card p-5">
                  <p className="text-brand" style={{ fontSize: 15, fontWeight: 700 }}>{cat.category}</p>
                  <ul className="mt-3 space-y-2">
                    {cat.items.map((it) => (
                      <li key={it.name}>
                        <button
                          type="button"
                          onClick={() => setRecipe(it)}
                          className="group flex w-full items-start justify-between gap-2 border-b border-border/60 pb-2 text-left transition-colors hover:text-brand"
                        >
                          <span>
                            <span className="block" style={{ fontSize: 13, fontWeight: 500 }}>{it.name}</span>
                            <span className="block text-muted-foreground" style={{ fontSize: 11 }}>{it.note}</span>
                          </span>
                          <ChevronRight size={14} className="mt-1 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* レシピ詳細（サイト内モーダル） */}
      {recipe && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-5"
          onClick={() => setRecipe(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => setRecipe(null)}
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-brand"
            >
              <X size={22} />
            </button>
            <p className="text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 12 }}>ICE RECIPE</p>
            <h3 className="mt-2" style={{ fontSize: 24, fontWeight: 700 }}>{recipe.name}</h3>
            <p className="mt-1 text-muted-foreground" style={{ fontSize: 13 }}>{recipe.note}</p>
            <div className="mt-6">
              <p className="text-brand" style={{ fontSize: 14, fontWeight: 700 }}>材料</p>
              <ul className="mt-2 space-y-1">
                {recipe.materials.map((m, i) => (
                  <li key={i} className="text-foreground/80" style={{ fontSize: 14, lineHeight: 1.8 }}>・{m}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <p className="text-brand" style={{ fontSize: 14, fontWeight: 700 }}>作り方</p>
              <ol className="mt-2 space-y-2">
                {recipe.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.7 }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground" style={{ fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
