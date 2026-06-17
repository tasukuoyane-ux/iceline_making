import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG } from "../data/images";
import { CEO_MESSAGE, COMPANY_PROFILE, HISTORY, PHILOSOPHY, CSR } from "../data/company";

export function Company() {
  return (
    <>
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-ink">
        <ImageWithFallback src={IMG.warehouse} alt="会社情報" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative mx-auto flex h-full max-w-[1280px] flex-col justify-end px-5 pb-12 pc:px-8">
          <p className="text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }}>COMPANY</p>
          <h1 className="text-white" style={{ fontSize: 38, fontWeight: 900 }}>会社情報</h1>
        </div>
      </section>

      {/* 代表メッセージ（会社情報の熱量ピーク） */}
      <Section heat={HEAT.ceoMessage}>
        <div className="grid gap-10 pc:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionTitle en="MESSAGE" jp="代表メッセージ" />
            <ImageWithFallback src={IMG.waterDew} alt="代表メッセージ" className="mt-6 aspect-[4/3] w-full rounded-2xl object-cover" />
            <p className="mt-4 text-muted-foreground" style={{ fontSize: 14 }}>{CEO_MESSAGE.name}</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-5">
            {CEO_MESSAGE.paragraphs.map((t, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 2.2 }}>{t}</p>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* 企業理念 */}
      <Section heat={HEAT.philosophy} contained={false}>
        <div className="mx-auto max-w-[1280px] px-5 pc:px-8">
          <SectionTitle en="PHILOSOPHY" jp="企業理念" align="center" />
          <p className="mx-auto mt-8 max-w-3xl text-center text-brand" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.8 }}>
            {PHILOSOPHY.body}
          </p>
        </div>
      </Section>

      {/* 会社概要 */}
      <Section heat={HEAT.companyProfile}>
        <SectionTitle en="PROFILE" jp="会社概要" />
        <table className="mt-8 w-full border-t border-border">
          <tbody>
            {COMPANY_PROFILE.map((r) => (
              <tr key={r.label} className="border-b border-border align-top">
                <th className="w-40 bg-secondary px-5 py-4 text-left text-muted-foreground" style={{ fontSize: 14, fontWeight: 500 }}>{r.label}</th>
                <td className="px-5 py-4" style={{ fontSize: 14, lineHeight: 1.9 }}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* 沿革 */}
      <Section heat={HEAT.history}>
        <SectionTitle en="HISTORY" jp="沿革" />
        <ol className="mt-10 border-l-2 border-border pl-6">
          {HISTORY.map((h) => (
            <li key={h.year} className="relative mb-8 last:mb-0">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand" />
              <div className="flex flex-col gap-1 tab:flex-row tab:gap-6">
                <span className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 20, fontWeight: 700 }}>{h.year}</span>
                <p className="text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9 }}>{h.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* CSR */}
      <Section heat={HEAT.csr}>
        <SectionTitle en="CSR" jp="社会的責任への取り組み" />
        <div className="mt-10 grid gap-6 pc:grid-cols-3">
          {CSR.map((c) => (
            <div key={c.title} className="border border-border bg-card p-7">
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{c.title}</h3>
              <p className="mt-3 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.9 }}>{c.text}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
