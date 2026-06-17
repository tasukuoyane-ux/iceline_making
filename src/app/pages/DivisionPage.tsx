import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { Division, DIVISION_INFO, PRODUCTS } from "../data/products";

const MV: Record<Division, { img: string; lead: string }> = {
  food: { img: IMG.foodPlate, lead: "食の現場に、深く根を張る。" },
  ice: { img: IMG.iceMacro, lead: "冷たいものなら、アイスライン。" },
};

export function DivisionPage({ division }: { division: Division }) {
  const info = DIVISION_INFO[division];
  const items = PRODUCTS.filter((p) => p.division === division);
  const mvHeat = division === "food" ? HEAT.foodMv : HEAT.iceMv;
  const reasonHeat = division === "food" ? HEAT.foodReason : HEAT.iceReason;
  const listHeat = division === "food" ? HEAT.foodList : HEAT.iceList;

  return (
    <>
      {/* メインビジュアル（シズル感） */}
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-ink">
        <ImageWithFallback src={MV[division].img} alt={info.label} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/20" />
        <div className="relative mx-auto flex h-full max-w-[1280px] flex-col justify-end px-5 pb-16 pc:px-8 pc:pb-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }}>
              {division === "food" ? "FOOD DIVISION" : "ICE DIVISION"}
            </p>
            <h1 className="text-white" style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.25 }}>{info.label}</h1>
            <p className="mt-3 text-white/85" style={{ fontSize: 18 }}>{MV[division].lead}</p>
          </motion.div>
        </div>
      </section>

      {/* 選ばれる理由（熱量の強化・主語を明確化） */}
      <Section heat={reasonHeat}>
        <div className="grid items-center gap-10 pc:grid-cols-2">
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
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <ImageWithFallback
              src={division === "food" ? IMG.kitchen : IMG.iceClose}
              alt={info.reasonCatch}
              className="aspect-[4/5] w-full rounded-2xl object-cover"
            />
          </motion.div>
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
    </>
  );
}
