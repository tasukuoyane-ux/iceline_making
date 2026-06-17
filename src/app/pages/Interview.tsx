import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { INTERVIEWS } from "../data/recruit";
import { INTERVIEW_IMG } from "../data/images";

export function Interview() {
  const { id } = useParams();
  const iv = INTERVIEWS.find((x) => x.id === id);

  if (!iv) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-32 text-center">
        <p>記事が見つかりませんでした。</p>
        <Link to="/recruit" className="mt-4 inline-block text-brand">採用情報へ戻る</Link>
      </div>
    );
  }

  return (
    <article>
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-ink">
        <ImageWithFallback src={INTERVIEW_IMG[iv.id]} alt={iv.name} className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1000px] flex-col justify-end px-5 pb-14 pc:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }}>INTERVIEW</p>
            <h1 className="mt-3 text-white" style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.3 }}>{iv.lead}</h1>
            <p className="mt-4 text-white/85" style={{ fontSize: 15 }}>{iv.role}｜{iv.name}（{iv.years}）</p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-[760px] px-5 py-16 pc:py-24">
        <Link to="/recruit" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-brand" style={{ fontSize: 13 }}>
          <ChevronLeft size={16} /> 採用情報へ戻る
        </Link>
        <div className="mt-8 space-y-7">
          {iv.paragraphs.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: 16, lineHeight: 2.3 }}
            >
              {p}
            </motion.p>
          ))}
        </div>
        <Link to="/recruit" className="mt-12 inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 text-brand-foreground transition-colors hover:bg-brand-dark" style={{ fontSize: 14 }}>
          エントリーする
        </Link>
      </div>
    </article>
  );
}
