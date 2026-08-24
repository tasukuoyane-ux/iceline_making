import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG } from "../data/images";
import { CEO_MESSAGE, COMPANY_PROFILE, HISTORY, PHILOSOPHY, CSR } from "../data/company";
import { ed, edImg, txt, img, ratioCols, ratioAttrs, EDIT_MODE } from "../lib/editable";
import { RichBody } from "../components/common/RichBody";

export function Company() {
  return (
    <>
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-ink">
        <ImageWithFallback src={IMG.warehouse} alt="会社情報" className="absolute inset-0 h-full w-full object-cover opacity-70" {...edImg("images:IMG.warehouse")} />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-5 text-center pc:px-8">
          <p className="text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }} {...ed("sectionEn:company.mv", "英語見出し（補助）")}>{txt("sectionEn:company.mv", "COMPANY")}</p>
          <h1 className="mt-3 text-white" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.2 }} {...ed("company:hero.title", "会社情報")}>{txt("company:hero.title", "会社情報")}</h1>
        </div>
      </section>

      {/* 代表メッセージ（会社情報の熱量ピーク） */}
      <Section heat={HEAT.ceoMessage}>
        <div
          className="grid items-stretch gap-10 pc:[grid-template-columns:var(--ratio)]"
          style={{ ["--ratio" as any]: ratioCols("company:ceo.ratio", 43, true) }}
          {...ratioAttrs("company:ceo.ratio", 43, true)}
        >
          <div className="flex flex-col">
            <SectionTitle en="MESSAGE" jp="代表メッセージ" path="sectionEn:company.message" />
            <ImageWithFallback src={IMG.waterDew} alt="代表メッセージ" className="mt-6 aspect-[4/3] w-full rounded-2xl object-cover pc:aspect-auto pc:min-h-0 pc:flex-1" {...edImg("images:IMG.waterDew")} />
            <p className="mt-4 text-muted-foreground" style={{ fontSize: 14 }} {...ed("sections:ceoMessage.name")}>{CEO_MESSAGE.name}</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-5">
            {CEO_MESSAGE.paragraphs.map((t, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 2.2, whiteSpace: "pre-line" }} {...ed(`sections:ceoMessage.paragraphs.${i}`)}>{t}</p>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* 企業理念 */}
      <Section heat={HEAT.philosophy} contained={false}>
        <div className="mx-auto max-w-[1400px] px-5 pc:px-8">
          <SectionTitle en="PHILOSOPHY" jp="企業理念" align="center" path="sectionEn:company.philosophy" />
          <p className="mx-auto mt-8 max-w-3xl text-center text-brand pc:max-w-full" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.8, whiteSpace: "pre-line" }} {...ed("sections:philosophy.body")}>
            {PHILOSOPHY.body}
          </p>
        </div>
      </Section>

      {/* 会社概要 */}
      <Section heat={HEAT.companyProfile}>
        <SectionTitle en="PROFILE" jp="会社概要" path="sectionEn:company.profile" />
        <table className="mt-8 w-full border-t border-border">
          <tbody>
            {COMPANY_PROFILE.map((r, i) => (
              <tr key={r.label} className="border-b border-border align-top">
                <th className="w-40 bg-secondary px-5 py-4 text-left text-muted-foreground" style={{ fontSize: 14, fontWeight: 500 }}>{r.label}</th>
                <td className="px-5 py-4" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`company:profile.${i}.value`, r.label, { multiline: true })}>{txt(`company:profile.${i}.value`, r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* 沿革（PC時：右50%に画像） */}
      <Section heat={HEAT.history}>
        <SectionTitle en="HISTORY" jp="沿革" path="sectionEn:company.history" />
        <div className="mt-10 grid gap-10 pc:grid-cols-2">
          <ol className="border-l-2 border-border pl-6">
            {HISTORY.map((h, i) => (
              <li key={h.year} className="relative mb-8 last:mb-0">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand" />
                <div className="flex flex-col gap-1 tab:flex-row tab:gap-6">
                  <span className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 20, fontWeight: 700 }} {...ed(`company:history.${i}.year`, "年")}>{txt(`company:history.${i}.year`, h.year)}</span>
                  <p className="text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`company:history.${i}.text`, "内容", { multiline: true })}>{txt(`company:history.${i}.text`, h.text)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="hidden pc:block">
            <ImageWithFallback
              src={img("company:historyImage", IMG.warehouse)}
              alt="アイスラインの歩み"
              className="h-full min-h-0 w-full rounded-2xl object-cover"
              {...edImg("company:historyImage", "沿革画像")}
            />
          </div>
        </div>
      </Section>

      {/* CSR */}
      <Section heat={HEAT.csr}>
        <SectionTitle en="CSR" jp="社会的責任への取り組み" path="sectionEn:company.csr" />
        <div className="mt-10 grid gap-6 pc:grid-cols-3">
          {CSR.map((c, i) => (
            <div key={c.title} className="border border-border bg-card p-7">
              <h3 style={{ fontSize: 18, fontWeight: 700 }} {...ed(`company:csr.${i}.title`, "タイトル")}>{txt(`company:csr.${i}.title`, c.title)}</h3>
              <p className="mt-3 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`company:csr.${i}.text`, "内容", { multiline: true })}>{txt(`company:csr.${i}.text`, c.text)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 受賞歴（1行につき1件をリスト表示。未入力の間は公開ページでは非表示） */}
      {(txt("company:awards.items", "") !== "" || EDIT_MODE) && (
        <Section heat={HEAT.csr}>
          <SectionTitle en="AWARDS" jp="受賞歴" path="sectionEn:company.awards" />
          <div className="mt-10 rounded-2xl border border-border bg-card p-8">
            <RichBody
              list
              path="company:awards.items"
              text={txt("company:awards.items", "") || "（未入力：受賞歴を1行に1件ずつ入力してください）"}
              label="受賞歴（1行に1件）"
              className={txt("company:awards.items", "") ? "text-foreground/80" : "text-muted-foreground"}
              style={{ fontSize: 15, lineHeight: 2.05 }}
            />
          </div>
        </Section>
      )}
    </>
  );
}
