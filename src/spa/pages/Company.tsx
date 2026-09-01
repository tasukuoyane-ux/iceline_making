import { motion } from "motion/react";
import { ExternalLink, MapPin } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG } from "../data/images";
import { CEO_MESSAGE, COMPANY_PROFILE, HISTORY, PHILOSOPHY, CSR } from "../data/company";
import { ed, edImg, txt, img, ratioCols, ratioAttrs, repeatSel, EDIT_MODE } from "../lib/editable";
import { RichBody } from "../components/common/RichBody";

// ─────────────────────────────────────────────────────────
// 拠点情報（2026-09 追加）。沿革とCSRの間に H2 セクションとして表示し、
// 拠点ごとに Google マップ（住所で検索した埋め込み地図）＋住所・電話番号・
// Google マップへのリンクを載せる。文言はすべてコンソールから編集でき、
// 拠点の数は「拠点の数」（追加・削除ボタン）で 1〜MAX_LOCATIONS に変更できる。
// ─────────────────────────────────────────────────────────
const MAX_LOCATIONS = 8;
const LOCATIONS: { name: string; address: string; tel: string; url: string }[] = [
  {
    name: "本社・食品事業部・青江物流センター",
    address: "〒700-0941 岡山県岡山市北区青江2丁目4-6",
    tel: "本社（総務部）：086-224-5235\n食品事業部 営業部：086-232-3197\n青江物流センター：086-224-3533",
    url: "https://maps.google.com/?cid=4078151803003502361",
  },
  {
    name: "ドライアイスチーム",
    address: "〒700-0941 岡山県岡山市北区青江2丁目3-11",
    tel: "TEL：086-224-5236",
    url: "https://maps.google.com/?cid=17414659884876483349",
  },
  {
    name: "アイス事業部・西大寺物流センター",
    address: "〒704-8122 岡山県岡山市東区西大寺新地150-1",
    tel: "TEL：086-944-8833",
    url: "https://maps.google.com/?cid=4478222050823407717",
  },
  {
    name: "アイス事業部 二日市工場",
    address: "〒700-0843 岡山県岡山市北区二日市町8番",
    tel: "TEL：086-944-8585",
    url: "https://maps.google.com/?cid=15526115832655768239",
  },
  {
    name: "東京オフィス",
    address: "〒101-0064 東京都千代田区神田猿楽町1丁目3-1 北村ビル403",
    tel: "",
    url: "https://share.google/3Mren49rAnV5kmzyC",
  },
];

function LocationCard({ i }: { i: number }) {
  const def = LOCATIONS[i] ?? { name: "", address: "", tel: "", url: "" };
  const base = `company:locations.${i}`;
  const name = txt(`${base}.name`, def.name);
  const address = txt(`${base}.address`, def.address);
  const tel = txt(`${base}.tel`, def.tel);
  const url = txt(`${base}.url`, def.url);
  // 地図の検索クエリは「〒」以降（住所部分）。拠点名は下に表示する
  const q = address.includes("〒") ? address.slice(address.indexOf("〒")) : address;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[4/3] w-full bg-secondary">
        {q.trim() !== "" ? (
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=ja`}
            title={`${name || "拠点"}の地図`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="block h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground" style={{ fontSize: 13 }}>
            （住所を入力すると地図が表示されます）
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5 }} {...ed(`${base}.name`, `拠点${i + 1} 名称`)}>
          {name || "（拠点名）"}
        </h3>
        <p className="mt-3 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`${base}.address`, `拠点${i + 1} 住所`, { multiline: true })}>
          {address || "（住所）"}
        </p>
        {(tel !== "" || EDIT_MODE) && (
          <p className="mt-2 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`${base}.tel`, `拠点${i + 1} 電話番号`, { multiline: true })}>
            {tel || "（電話番号・任意）"}
          </p>
        )}
        {url !== "" && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-brand"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            <MapPin size={14} /> Googleマップで見る <ExternalLink size={12} />
          </a>
        )}
        {EDIT_MODE && (
          <p className="mt-1.5 break-all text-muted-foreground" style={{ fontSize: 11 }} {...ed(`${base}.url`, `拠点${i + 1} GoogleマップURL`)}>
            {url || "（GoogleマップのURL・任意）"}
          </p>
        )}
      </div>
    </div>
  );
}

function Locations() {
  const rep = repeatSel("company:locations.count", LOCATIONS.length, MAX_LOCATIONS, "拠点の数");
  return (
    <Section heat={HEAT.companyProfile}>
      <SectionTitle en="LOCATIONS" jp="拠点情報" path="sectionEn:company.locations" />
      <div className="mt-10 grid gap-6 tab:grid-cols-2 pc:grid-cols-3" {...rep.attrs}>
        {Array.from({ length: MAX_LOCATIONS }, (_, i) => (
          <LocationCard key={i} i={i} />
        ))}
      </div>
    </Section>
  );
}

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
        {/* 年表＋画像の横並び（幅・左右はコンソールの「画像の幅」「左右入れ替え」で調整可能） */}
        <div
          className="mt-10 grid gap-10 pc:[grid-template-columns:var(--ratio)]"
          style={{ ["--ratio" as any]: ratioCols("company:history.ratio", 50, false) }}
          {...ratioAttrs("company:history.ratio", 50, false)}
        >
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

      {/* 拠点情報（沿革とCSRの間・Googleマップ付き。2026-09 追加） */}
      <Locations />

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
