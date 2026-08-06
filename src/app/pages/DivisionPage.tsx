import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight, ChevronDown } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { Division, ICE_RECIPES, PRODUCTS } from "../data/products";
import { ed, edImg, txt, img } from "../lib/editable";

// メインビジュアル。タイトルは内容確定シートのページ名を既定とし、コンソールから編集可能。
const MV: Record<Division, { img: string; en: string; title: string; lead: string }> = {
  food: { img: IMG.foodMv, en: "FOOD DIVISION", title: "業務用食材の販売", lead: "食の現場に、深く根を張る。" },
  ice: { img: IMG.iceMv, en: "ICE DIVISION", title: "氷・氷菓の製造販売", lead: "冷たいものなら、アイスライン。" },
};

// ＋画像の差し替え可能なプレースホルダー（編集前に表示するグレー枠）
const IMG_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#f1f1f3"/><text x="50%" y="50%" font-size="30" fill="#bcbcc2" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋ 画像</text></svg>'
  );

// ─────────────────────────────────────────────────────────
// 「取り扱い商品」より上のコンテンツ。内容確定スプレッドシートの
// 「氷・氷菓の製造販売」「業務用食材の販売」シートに準拠
// （「〇〇（要確認）」の未確定箇所は掲載せず、確定後にコンソールから追記できる）。
// 文言・画像は division:{division}. プレフィックスの汎用オーバーライドで編集可能。
// imgKey は旧レイアウトでアップロード済みの実写真を引き継ぐための明示キー。
// ─────────────────────────────────────────────────────────
interface DetailItem {
  title?: string;
  body: string;
  /** true なら画像＋テキストの交互レイアウトで表示 */
  image?: boolean;
  /** 既存アップロード画像を引き継ぐ場合の明示キー */
  imgKey?: string;
}
interface DetailSection {
  en: string;
  jp: string;
  items: DetailItem[];
}

const OVERVIEW: Record<Division, string> = {
  food:
    "岡山県内において、外食産業向け食品商社としてトップシェアを持つ事業です。国内外200社以上の仕入れ先から調達した5,000品目を超える商品を取り扱い、ホテル・レストランをはじめとする飲食店・食品メーカーへ届けています。食用油・輸入鶏肉をはじめとする定番品から、世界中の食材まで幅広く対応しています。",
  ice:
    "アイスラインは、1905年の創業以来、氷の製造・販売を中核事業として展開してきました。西大寺物流センター（営業部・製造部）を拠点に、業務用かち割り氷から独自開発の味付き氷・氷菓まで、幅広いラインナップを全国の飲食店・量販店・テーマパークなどに供給しています。国際食品安全認証FSSC22000を取得し、製造から出荷までの全工程において品質管理を徹底しています。",
};

const DETAIL: Record<Division, DetailSection[]> = {
  food: [
    {
      en: "FEATURES",
      jp: "事業の特徴",
      items: [
        {
          title: "5,000品目を同時に動かせるということ",
          body:
            "食品には必ず賞味期限があります。1品目でも管理を誤れば廃棄になり、欠品すれば取引先の現場が止まります。5,000品目以上を扱う以上、その管理を誤らないための体制を、日々整えています。\nアイスラインの5,000品目は、単なる取扱品目数ではありません。長年の販売データをもとに抽出した、お客様が実際に必要としている在庫のある商品群です。毎月の棚卸しと受発注管理システムによる在庫管理を組み合わせ、動いている商品・動いていない商品の動向をリアルタイムで把握できる仕組みを整えています。冷凍品・チルド品の賞味期限チェックを徹底し、フードロスを極力抑えた運用を実現しています。",
          image: true,
        },
        {
          title: "現場に通い続けるから、見えることがある",
          body:
            "担当者は配送と営業を兼務しています。定期的に同じお客様のもとへ足を運ぶからこそ、在庫の変化も、売れ筋の移り変わりも、現場の空気も見えてきます。気になることがあればその場で提案し、依頼を待つのではなく、必要なものを先回りして考えることを大切にしています。お客様一社一社の状況を把握しながら、長く寄り添える関係を積み上げていきたいと思っています。",
          image: true,
        },
      ],
    },
    {
      en: "LOGISTICS",
      jp: "万全の物流体制",
      items: [
        {
          title: "拠点",
          body:
            "岡山市北区青江に物流センターを構え、商品の在庫・出荷管理を行っています。取扱商品が多岐にわたるため、温度帯の異なる商品も適切な環境で管理できる体制を整えています。",
          image: true,
          imgKey: "division:food.feat.0.0.image",
        },
        {
          title: "配送体制",
          body:
            "42台の車両により、岡山県全域への配送を行っています。1日あたり平均900件以上の配送を担い、前日注文・翌日配送を基本としています。常温・冷凍の2温度帯に対応しており、近距離の配送には保冷車も使用しています。担当者は配送と営業を兼務し、日々の納品の中で在庫状況や現場のニーズを直接把握できる体制を整えています。",
          image: true,
          imgKey: "division:food.feat.0.1.image",
        },
        {
          title: "受発注の体制",
          body:
            "受発注業務には管理システムを導入し、注文内容を正確かつタイムリーに処理しています。新商品の情報やお得な特売情報は、システム上での通知および紙媒体での配布により、お客様へお届けしています。システム未登録のお客様へは、担当者が直接チラシを手渡しするなど、情報が行き届く体制を維持しています。",
          image: true,
          imgKey: "division:food.feat.1.1.image",
        },
        {
          title: "取引先ごとの対応",
          body:
            "取引先の業態・規模・メニュー構成は一社ごとに異なります。標準化された商品提供にとどまらず、一社一社の要望に応じた商品の組み合わせや配送頻度の調整など、きめ細かな対応を行っています。",
        },
      ],
    },
    {
      en: "QUALITY",
      jp: "品質保証への取り組み",
      items: [
        {
          title: "試食による確認",
          body:
            "数十年にわたり社内での試食会を継続しており、直近6年で実施頻度をさらに高めています。各メーカーによるプレゼンテーションの場としても機能しており、新商品やリニューアル品を中心に、仕入れ担当者が市場動向と照らし合わせながら取り扱いを判断しています。確認を通じて、お客様に商品の特長や使い方をより具体的にお伝えできるようにしています。",
        },
        {
          title: "国内外からの調達",
          body:
            "取り扱う商品は、国内メーカーのものだけでなく、海外からの輸入品も多く含まれます。仕入れ先は国内外合わせて200社以上にのぼり、原産国はロシア・カナダ・中国・東南アジア・ポルトガル周辺など世界中に及びます。幅広い調達先を持つことで、季節や用途に応じた商品選定の幅を広げています。",
        },
        {
          title: "衛生管理",
          body:
            "物流センター内は常に整理整頓された状態を維持しています。通路に物を置かず棚に収めるというルールを全従業員が徹底し、安全で衛生的な保管・出荷環境を確保しています。",
        },
      ],
    },
  ],
  ice: [
    {
      en: "MANUFACTURING",
      jp: "製造の特徴",
      items: [
        {
          title: "原料水について",
          body:
            "西大寺工場では、逆浸透膜（RO膜）でろ過した水を使用しています。不純物を除去した純度の高い水を原料とすることで、安定した品質の氷を製造しています。",
          image: true,
        },
        {
          title: "製法について",
          body:
            "製氷方法は、工場と製品によって異なります。\n二日市工場ではカングリット製法を採用しています。135kgの大きな氷の塊からカットして加工していく方法で、かち割り氷や小さな氷など多様なサイズに対応できることが特徴です。製氷に時間を要しますが、大型の氷から精密に加工できる点が強みです。\n西大寺工場ではターボ製氷（氷柱方式）を採用しています。90〜120分という短いサイクルで製氷できるため、需要の変動に柔軟に対応できる生産体制を整えています。\n氷の品質は、不純物をどれだけ取り除けるかで決まります。水の純度が高いほど透明で硬く、溶けにくい氷になります。ロッキーアイスが「硬く透明で溶けにくい」のは、原料水の純度を高め、低温でじっくり凍らせる工程を徹底しているからです。",
          image: true,
        },
      ],
    },
    {
      en: "QUALITY",
      jp: "品質保証",
      items: [
        {
          body:
            "国際食品安全認証「FSSC22000」を取得しています。食品安全マネジメントシステムの国際規格に基づき、原料の受け入れから製造・検査・出荷までの全工程において、定められた基準に沿った管理を行っています。",
        },
      ],
    },
  ],
};

export function DivisionPage({ division }: { division: Division }) {
  const mv = MV[division];
  const divTitle = txt(`division:${division}.mv.title`, mv.title);
  const items = PRODUCTS.filter((p) => p.division === division);
  const [openCats, setOpenCats] = useState<string[]>([]);
  const toggleCat = (c: string) =>
    setOpenCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const bizHeat = division === "food" ? HEAT.foodBiz : HEAT.iceBiz;
  const reasonHeat = division === "food" ? HEAT.foodReason : HEAT.iceReason;
  const listHeat = division === "food" ? HEAT.foodList : HEAT.iceList;

  return (
    <>
      {/* メインビジュアル（高さは会社情報ページに合わせる・タイトル中央・タイトルも編集可能） */}
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-ink">
        <ImageWithFallback src={MV[division].img} alt={divTitle} className="absolute inset-0 h-full w-full object-cover" {...edImg(division === "food" ? "images:IMG.foodMv" : "images:IMG.iceMv", "メインビジュアル画像")} />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-5 text-center pc:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }}>
              {mv.en}
            </p>
            <h1 className="text-white" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.2 }} {...ed(`division:${division}.mv.title`, "ページタイトル")}>
              {divTitle}
            </h1>
            <p className="mt-4 text-white/85" style={{ fontSize: 16 }} {...ed(`division:${division}:mvLead`, "MVリード文")}>{txt(`division:${division}:mvLead`, mv.lead)}</p>
          </motion.div>
        </div>
      </section>

      {/* 事業概要 */}
      <Section heat={bizHeat}>
        <div className="mx-auto max-w-3xl text-center">
          <SectionTitle en="OUR BUSINESS" jp="事業概要" align="center" />
          <p className="mt-6 text-left text-foreground/80 pc:text-center" style={{ fontSize: 16, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed(`division:${division}.overview`, "事業概要", { multiline: true })}>
            {txt(`division:${division}.overview`, OVERVIEW[division])}
          </p>
        </div>
      </Section>

      {/* サプライチェーン（業務用食材のみ・シート準拠） */}
      {division === "food" && (
        <Section heat={listHeat}>
          <SectionTitle en="SUPPLY CHAIN" jp="サプライチェーン" />
          <p className="mt-6 max-w-3xl text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed("division:food.supplyChain.body", "サプライチェーン", { multiline: true })}>
            {txt(
              "division:food.supplyChain.body",
              "お客様のニーズに応じた商品を国内外から調達し、岡山市北区青江の物流センターで保管し、岡山県全域のお客様へ届けています。前日注文・翌日配送を基本とし、受発注から配送までを一貫した体制で運用しています。"
            )}
          </p>
          <div className="mt-8">
            <ImageWithFallback
              src={img("division:food.supplyChain.image", IMG.foodNetwork || IMG_PLACEHOLDER)}
              alt="サプライチェーン"
              className="w-full rounded-2xl border border-border object-cover"
              {...edImg("division:food.supplyChain.image", "サプライチェーン画像")}
            />
          </div>
        </Section>
      )}

      {/* シート構成に沿った各セクション */}
      {DETAIL[division].map((sec, si) => (
        <Section key={si} heat={si % 2 ? listHeat : reasonHeat}>
          <SectionTitle en={sec.en} jp={sec.jp} />
          <div className="mt-12 space-y-10">
            {sec.items.map((it, ii) => {
              const base = `division:${division}.sec.${si}.${ii}`;
              return it.image ? (
                <motion.div
                  key={ii}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`grid items-center gap-8 pc:grid-cols-[2fr_3fr] ${ii % 2 ? "pc:[direction:rtl]" : ""}`}
                >
                  <div className="[direction:ltr] pc:px-12">
                    {it.title && (
                      <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.title`, "見出し")}>
                        {txt(`${base}.title`, it.title)}
                      </h3>
                    )}
                    <p className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed(`${base}.body`, "本文", { multiline: true })}>
                      {txt(`${base}.body`, it.body)}
                    </p>
                  </div>
                  <ImageWithFallback
                    src={img(it.imgKey ?? `${base}.image`, IMG_PLACEHOLDER)}
                    alt={it.title || sec.jp}
                    className="aspect-[4/3] w-full rounded-2xl border border-border object-cover [direction:ltr]"
                    {...edImg(it.imgKey ?? `${base}.image`, `${it.title || sec.jp} 画像`)}
                  />
                </motion.div>
              ) : (
                <div key={ii} className={it.title ? "rounded-2xl border border-border bg-card p-8" : "max-w-3xl"}>
                  {it.title && (
                    <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.title`, "見出し")}>
                      {txt(`${base}.title`, it.title)}
                    </h3>
                  )}
                  <p className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed(`${base}.body`, "本文", { multiline: true })}>
                    {txt(`${base}.body`, it.body)}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      ))}

      {/* 商品一覧（以下は現状維持） */}
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
