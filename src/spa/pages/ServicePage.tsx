// 倉庫事業・ドライアイスの販売ページ（サイト構成改修で新設）。
// コピーは内容確定スプレッドシート「倉庫事業」「ドライアイスの販売」シートに準拠
// （「〇〇（要確認）」の未確定箇所は掲載せず、確定後にコンソールから追記できる）。
// デザインは既存の事業部ページ（DivisionPage）のトンマナを踏襲。
// 文言・画像はすべて service:{id}. プレフィックスの汎用オーバーライドで
// 管理コンソールからインライン編集できる。
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { ContactSection } from "../components/common/ContactSection";
import { HEAT } from "../data/heatMap";
import { ed, edImg, txt, img, ratioCols, ratioAttrs, EDIT_MODE } from "../lib/editable";

// 要確認スロットの案内文（未入力の間、公開ページでは項目ごと非表示になる）
const PENDING_HINT = "（未確定：原稿確定後にここへ入力してください）";

// 施設写真（倉庫事業）のマーソンリー表示枠の上限
const MAX_GALLERY_PHOTOS = 10;

// ＋画像の差し替え可能なプレースホルダー（編集前に表示するグレー枠）
const IMG_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#f1f1f3"/><text x="50%" y="50%" font-size="30" fill="#bcbcc2" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋ 画像</text></svg>'
  );

export type ServiceId = "warehouse" | "dryice";

interface ServiceSectionItem {
  title?: string;
  body?: string;
  /** true なら要確認スロット（既定は空。入力されるまで公開ページでは非表示） */
  pending?: boolean;
  /** true なら画像＋テキストの交互レイアウトで表示 */
  image?: boolean;
}
interface ServiceSection {
  en: string;
  jp: string;
  items: ServiceSectionItem[];
}
interface ServiceConfig {
  en: string;
  title: string;
  lead: string;
  overview: string;
  sections: ServiceSection[];
  faq: { q: string; a?: string; pending?: boolean }[];
  /** 施設写真（倉庫事業のみ。キャプションはシートの指定に準拠） */
  photos?: string[];
  /** 外部ショップ導線（ドライアイスのみ） */
  shopUrl?: string;
}

const SERVICES: Record<ServiceId, ServiceConfig> = {
  warehouse: {
    en: "WAREHOUSE",
    title: "倉庫事業",
    lead: "食を預かる、冷たい倉庫。",
    overview:
      "40年以上にわたり、冷凍冷蔵倉庫業を営んできました。岡山市北区青江の物流センターを拠点に、食品製造会社・水産卸・菓子メーカーなど、業種を問わず幅広いお客様の冷凍品の保管を受け入れています。アイスラインが長年培ってきた低温管理の技術と設備を活かし、大切な商品を適切な環境でお預かりしています。",
    sections: [
      {
        en: "FACILITIES",
        jp: "施設・設備",
        items: [
          {
            title: "拠点",
            body:
              "冷凍品の保管に特化した2拠点体制を整えています。\n\n【青江物流センター】\n・F級（-18℃以下）：1,523㎡ / 収容能力 1,970トン\n・C3級（5℃以下）：153㎡ / 収容能力 158トン\n・合計：1,676㎡ / 収容能力 2,128トン\n・ドックシェルター：大型2基・中型11基\n\n【西大寺物流センター】\n・F級（-18℃以下）：1,548.1㎡ / 収容能力 4,252トン\n・ドックシェルター：大型7基\n・移動ラックシステム導入（冷凍庫内）",
            image: true,
          },
          {
            title: "対応温度帯",
            body: "冷凍（F級：-18℃以下）および冷蔵（C3級：5℃以下）に対応しています。",
            image: true,
          },
          { title: "セキュリティ・管理体制", pending: true },
        ],
      },
      {
        en: "PRICE",
        jp: "ご利用料金",
        items: [
          {
            body:
              "保管料は半月ごとの計算（15日締め・月末締め）となっています。保管料のほかに、商品の入出庫時に荷役料（入出庫料）が発生します。荷役料は最初の商品お預かり時に1回のみ徴収します（複数回に分けて出庫される場合も、追加費用は発生しません）。\n詳細な料金については、お問い合わせください。",
          },
        ],
      },
    ],
    faq: [
      {
        q: "どのような商品の保管に対応していますか？",
        a: "冷凍品全般に対応しています。食品製造会社・水産卸・菓子メーカーなど、業種を問わずご利用いただいています。",
      },
      {
        q: "保管料はどのように計算されますか？",
        a: "半月ごとの計算となっています。詳細はお問い合わせください。",
      },
      {
        q: "荷役料はどのように計算されますか？",
        a: "最初の商品お預かり時に1回のみ徴収します。複数回に分けて出庫される場合も、追加の荷役料は発生しません。",
      },
      { q: "最低保管期間はありますか？", pending: true },
      { q: "見学・下見は可能ですか？", pending: true },
    ],
    photos: [
      "移動ラックシステム（冷凍庫内）",
      "たくさんの商品が様々なお客様に出荷される様子",
      "低温管理されたプラットホーム",
      "早朝のトラックの入れ替わりの様子",
      "青江物流センター　外観",
      "青江物流センター　倉庫内",
    ],
  },
  dryice: {
    en: "DRY ICE",
    title: "ドライアイスの販売",
    lead: "必要なとき、必要な量を。",
    overview:
      "ドライアイスは、二酸化炭素を固体にしたもので、約-79℃という極低温の保冷材です。溶けても水が残らないため、食品や精密機器の輸送にも安心してお使いいただけます。\nアイスラインでは40年以上にわたり、ドライアイスの販売を行っています。低温物流・葬儀・スイーツ輸送など、幅広い用途に対応しており、お客様のご要望に合わせたサイズへのカット加工にも対応しています。アイスラインの窓口での直接購入も可能です。",
    sections: [
      {
        en: "LINEUP",
        jp: "製品ラインナップ",
        items: [
          {
            title: "取り扱いサイズ・形状",
            body: "お客様のご要望に合わせてサイズをカットしてお届けします。業務用の大ロットから小口まで対応しています。",
            image: true,
          },
          { pending: true },
          {
            title: "主な用途",
            body:
              "・低温物流・冷凍食品の輸送保冷\n・葬儀・遺体保冷\n・スイーツ・ケーキの輸送\n・その他、冷却・保冷が必要な用途全般",
            image: true,
          },
        ],
      },
      {
        en: "SERVICE",
        jp: "サービスの特徴",
        items: [
          {
            title: "カット加工対応",
            body: "お客様のご要望に合わせてサイズをカットしてお届けします。用途や容器に合わせた細かなサイズ指定にも対応しています。",
          },
          {
            title: "窓口での直接購入",
            body: "アイスラインの窓口にお越しいただき、直接ご購入いただくことも可能です。",
          },
          {
            title: "個人向けECサイト",
            body: "個人のお客様向けには、ECサイトからもご購入いただけます。",
          },
          { pending: true },
        ],
      },
      {
        en: "SHOP",
        jp: "販売サイト",
        items: [{ pending: true }],
      },
    ],
    faq: [
      { q: "最小注文量はどのくらいですか？", pending: true },
      {
        q: "サイズのカット指定はできますか？",
        a: "はい、お客様のご要望に合わせてカットしてお届けしています。詳細はお問い合わせください。",
      },
      {
        q: "窓口での直接購入は可能ですか？",
        a: "はい、アイスラインの窓口にお越しいただき、直接ご購入いただけます。",
      },
      {
        q: "個人での購入は可能ですか？",
        a: "個人のお客様向けには、ECサイトからご購入いただけます。",
      },
      { q: "配送エリアはどこまで対応していますか？", pending: true },
    ],
    shopUrl: "https://www.dry-ice.jp/",
  },
};

export function ServicePage({ service }: { service: ServiceId }) {
  const s = SERVICES[service];
  const base = `service:${service}`;

  return (
    <>
      {/* メインビジュアル（事業部ページと同じ高さ・タイトル中央） */}
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-ink">
        <ImageWithFallback
          src={img(`${base}.mv.image`, IMG_PLACEHOLDER)}
          alt={s.title}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
          {...edImg(`${base}.mv.image`, "メインビジュアル画像")}
        />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-5 text-center pc:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }} {...ed(`${base}.mv.en`, "英語見出し（補助）")}>
              {txt(`${base}.mv.en`, s.en)}
            </p>
            <h1 className="text-white" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.2 }} {...ed(`${base}.mv.title`, "ページタイトル")}>
              {txt(`${base}.mv.title`, s.title)}
            </h1>
            <p className="mt-4 text-white/85" style={{ fontSize: 16 }} {...ed(`${base}.mv.lead`, "MVリード文")}>
              {txt(`${base}.mv.lead`, s.lead)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 事業概要（ブランドレッド背景・上下パディングは通常の半分） */}
      <Section heat={HEAT.foodBiz} className="bg-[#E60012] py-10 tab:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <SectionTitle en="OUR BUSINESS" jp="事業概要" align="center" invert path={`${base}.overview.en`} />
          <p
            className="mt-6 text-left text-white/90 pc:text-center"
            style={{ fontSize: 16, lineHeight: 2.1, whiteSpace: "pre-line" }}
            {...ed(`${base}.overview`, "事業概要", { multiline: true })}
          >
            {txt(`${base}.overview`, s.overview)}
          </p>
          {/* ドライアイス：ECサイトへの導線ボタン */}
          {s.shopUrl && (
            <div className="mt-8">
              <a
                href={s.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white px-8 py-3.5 text-brand transition-colors hover:bg-white/90"
                style={{ fontSize: 15, fontWeight: 700 }}
              >
                <span {...ed(`${base}.overview.shopBtn`, "ECサイトボタン文言")}>
                  {txt(`${base}.overview.shopBtn`, "ドライアイス販売サイトを見る")}
                </span>
                <ArrowRight size={16} />
              </a>
            </div>
          )}
        </div>
      </Section>

      {/* シート構成に沿った各セクション（要確認スロットは未入力の間、公開ページでは非表示） */}
      {s.sections.map((sec, si) => {
        const visible =
          sec.items.some((it, ii) => !it.pending || txt(`${base}.sec.${si}.${ii}.body`, "") !== "") || EDIT_MODE;
        if (!visible) return null;
        return (
        <Section key={si} heat={si % 2 ? HEAT.foodList : HEAT.foodReason}>
          <SectionTitle en={sec.en} jp={sec.jp} path={`${base}.sec.${si}.en`} />
          <div className="mt-12 space-y-10">
            {sec.items.map((it, ii) => {
              const value = txt(`${base}.sec.${si}.${ii}.body`, it.pending ? "" : it.body ?? "");
              if (it.pending && !value && !EDIT_MODE) return null;
              const bodyText = value || (it.pending ? PENDING_HINT : "");
              return it.image ? (
                <motion.div
                  key={ii}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`grid items-center gap-8 pc:[grid-template-columns:var(--ratio)] ${ii % 2 ? "pc:[direction:rtl]" : ""}`}
                  style={{ ["--ratio" as any]: ratioCols(`${base}.sec.${si}.${ii}.ratio`, 60, false) }}
          {...ratioAttrs(`${base}.sec.${si}.${ii}.ratio`, 60, false)}
                >
                  <div className="[direction:ltr] pc:px-12">
                    {it.title && (
                      <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.sec.${si}.${ii}.title`, "見出し")}>
                        {txt(`${base}.sec.${si}.${ii}.title`, it.title)}
                      </h3>
                    )}
                    <p className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed(`${base}.sec.${si}.${ii}.body`, "本文", { multiline: true })}>
                      {bodyText}
                    </p>
                  </div>
                  <ImageWithFallback
                    src={img(`${base}.sec.${si}.${ii}.image`, IMG_PLACEHOLDER)}
                    alt={it.title || sec.jp}
                    className="aspect-[4/3] w-full rounded-2xl border border-border object-cover [direction:ltr]"
                    {...edImg(`${base}.sec.${si}.${ii}.image`, `${it.title || sec.jp} 画像`)}
                  />
                </motion.div>
              ) : (
                <div key={ii} className={it.title ? "rounded-2xl border border-border bg-card p-8" : "max-w-3xl"}>
                  {it.title && (
                    <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.sec.${si}.${ii}.title`, "見出し")}>
                      {txt(`${base}.sec.${si}.${ii}.title`, it.title)}
                    </h3>
                  )}
                  <p
                    className={`mt-3 ${it.pending && !value ? "text-muted-foreground" : "text-foreground/80"}`}
                    style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }}
                    {...ed(`${base}.sec.${si}.${ii}.body`, it.pending ? "本文（要確認・未確定）" : "本文", { multiline: true })}
                  >
                    {bodyText}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
        );
      })}

      {/* お問い合わせ（倉庫事業：よくあるご質問の前。未入力の間は非表示） */}
      {service === "warehouse" && <ContactSection base={base} heat={HEAT.foodList} />}

      {/* よくあるご質問 */}
      <Section heat={HEAT.foodReason}>
        <SectionTitle en="FAQ" jp="よくあるご質問" path={`${base}.faq.en`} />
        <div className="mt-10 space-y-4">
          {s.faq.map((f, i) => {
            const a = txt(`${base}.faq.${i}.a`, f.pending ? "" : f.a ?? "");
            if (f.pending && !a && !EDIT_MODE) return null;
            return (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <p className="flex gap-3" style={{ fontSize: 16, fontWeight: 700 }}>
                <span className="text-brand" style={{ fontFamily: "var(--font-accent)" }}>Q.</span>
                <span {...ed(`${base}.faq.${i}.q`, "質問")}>{txt(`${base}.faq.${i}.q`, f.q)}</span>
              </p>
              <p className="mt-3 flex gap-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2 }}>
                <span className="text-muted-foreground" style={{ fontFamily: "var(--font-accent)", fontWeight: 700 }}>A.</span>
                <span style={{ whiteSpace: "pre-line" }} className={f.pending && !a ? "text-muted-foreground" : ""} {...ed(`${base}.faq.${i}.a`, f.pending ? "回答（要確認・未確定）" : "回答", { multiline: true })}>
                  {a || (f.pending ? PENDING_HINT : "")}
                </span>
              </p>
            </div>
            );
          })}
        </div>
      </Section>

      {/* 施設写真（倉庫事業のみ・よくあるご質問の後・最大10枚のマーソンリー表示。
          画像が設定された枠だけを公開ページに表示する） */}
      {s.photos &&
        (() => {
          const slots = Array.from({ length: MAX_GALLERY_PHOTOS }, (_, i) => ({
            i,
            image: img(`${base}.photo.${i}.image`, ""),
            capDef: s.photos![i] ?? "",
          }));
          const shown = slots.filter((p) => p.image !== "" || EDIT_MODE);
          if (shown.length === 0) return null;
          return (
            <Section heat={HEAT.foodList}>
              <SectionTitle en="GALLERY" jp="施設写真" path={`${base}.gallery.en`} />
              <div className="mt-10 columns-2 gap-5 pc:columns-3">
                {shown.map((p) => (
                  <figure key={p.i} className="mb-5 break-inside-avoid">
                    <ImageWithFallback
                      src={p.image || IMG_PLACEHOLDER}
                      alt={txt(`${base}.photo.${p.i}.caption`, p.capDef)}
                      sizes="(min-width: 1025px) 33vw, 50vw"
                      className={(p.image ? "" : "aspect-[4/3] object-cover ") + "w-full rounded-xl border border-border"}
                      {...edImg(`${base}.photo.${p.i}.image`, `施設写真${p.i + 1}`)}
                    />
                    <figcaption
                      className="mt-2 text-muted-foreground"
                      style={{ fontSize: 13, lineHeight: 1.7 }}
                      {...ed(`${base}.photo.${p.i}.caption`, `施設写真${p.i + 1} キャプション`)}
                    >
                      {txt(`${base}.photo.${p.i}.caption`, p.capDef) || (EDIT_MODE ? "（キャプション・任意）" : "")}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Section>
          );
        })()}

      {/* お問い合わせ導線（＋ドライアイスはオンラインショップ導線） */}
      <Section heat={HEAT.foodList}>
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center pc:py-16">
          <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.6 }} {...ed(`${base}.cta.copy`, "CTAコピー")}>
            {txt(`${base}.cta.copy`, "ご相談・お見積りはお気軽にどうぞ。")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-brand px-8 py-3.5 text-brand-foreground transition-colors hover:bg-brand-dark"
              style={{ fontSize: 15 }}
            >
              お問い合わせ <ArrowRight size={16} />
            </Link>
            {s.shopUrl && (
              <a
                href={s.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-brand px-8 py-3.5 text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
                style={{ fontSize: 15 }}
              >
                オンラインショップ <ArrowRight size={16} />
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* お問い合わせ（ドライアイス：ページ最下部。未入力の間は非表示） */}
      {service === "dryice" && <ContactSection base={base} heat={HEAT.foodReason} />}
    </>
  );
}
