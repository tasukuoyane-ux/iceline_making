// おすすめパッケージ詳細ページ（/food/packages/:id）。
// 「居酒屋の開業におすすめの商品セット」など、業態・季節に合わせた商品セットの提案ページ。
// セット内容はモックデータ。文言は package:{id}. プレフィックスの汎用オーバーライドで
// 管理コンソールからインライン編集できる。
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ArrowLeft, Package } from "lucide-react";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { ed, txt } from "../lib/editable";

interface PackageItem {
  name: string;
  spec: string;
  note: string;
}
interface PackageDef {
  id: string;
  title: string;
  lead: string;
  body: string;
  items: PackageItem[];
}

const PACKAGES: PackageDef[] = [
  {
    id: "izakaya-starter",
    title: "居酒屋の開業におすすめの商品セット",
    lead: "揚げ物・焼き物・ドリンクまわりの定番をひとまとめに。",
    body:
      "居酒屋の開業時にまず揃えたい定番食材を、ひとつのセットにまとめました。揚げ物・焼き物の主力メニューから、ドリンクに欠かせない氷まで。開業準備の食材選定にかかる時間を大きく減らせます。\n内容・数量はご要望に応じて調整できますので、お気軽にご相談ください。",
    items: [
      { name: "大豆白絞油", spec: "16.5kg缶", note: "揚げ物全般の主力油。コストと使いやすさのバランスが良い定番品。" },
      { name: "輸入鶏もも肉", spec: "2kg×6", note: "から揚げ・焼き鳥など主力メニューの中心食材。" },
      { name: "鶏から揚げ（冷凍）", spec: "1kg", note: "仕込みの手間を減らせる下処理済みタイプ。" },
      { name: "焼餃子（冷凍）", spec: "50個入", note: "焼くだけで提供できる定番の一品メニュー。" },
      { name: "フライドポテト", spec: "1kg×10", note: "スピードメニューの定番。" },
      { name: "枝豆（冷凍）", spec: "500g×20", note: "お通し・スピードメニューに。" },
      { name: "濃口醤油・本みりん", spec: "各1.8L", note: "基本調味料のセット。" },
      { name: "ロッキーアイス", spec: "1kg×12", note: "硬く溶けにくく、ドリンクの味を最後まで守る業務用氷。" },
    ],
  },
  {
    id: "cafe-sweets",
    title: "カフェ・喫茶店の開業におすすめの商品セット",
    lead: "氷カフェ・スイーツ食材で、ドリンクとデザートを手早く。",
    body:
      "カフェ・喫茶店の開業時におすすめの、ドリンク・デザートまわりのセットです。牛乳を注ぐだけで一杯が完成する氷カフェ・フラペリッチを中心に、特別な機械や技術がなくてもメニューの幅を広げられる構成にしています。\n内容・数量はご要望に応じて調整できますので、お気軽にご相談ください。",
    items: [
      { name: "氷カフェ（コーヒー）", spec: "60g×20袋", note: "牛乳を注ぐだけでアイスカフェラテに。機械不要の看板メニュー。" },
      { name: "氷カフェ（抹茶・いちご）", spec: "60g×20袋", note: "季節・客層に合わせたバリエーション展開に。" },
      { name: "フラペリッチ 宇治抹茶小豆入り", spec: "100g×18袋", note: "ブレンダー不要でスムージーが完成。" },
      { name: "雪氷果肉入り（いちご・マンゴー）", spec: "100g×18袋", note: "削り機なしで提供できるかき氷メニュー。" },
      { name: "冷凍ホイップ", spec: "1L×12", note: "ドリンク・デザートのトッピングに。" },
      { name: "バニラアイス", spec: "2L", note: "デザートメニューのベースに。" },
      { name: "シュレッドチーズ", spec: "1kg", note: "トースト・軽食メニューに。" },
      { name: "ROCKYカップ 130g", spec: "130g×12×4合", note: "テイクアウトドリンクに使いやすいカップ入り氷。" },
    ],
  },
  {
    id: "banquet-season",
    title: "ホテル・レストランの宴会シーズンにおすすめの商品セット",
    lead: "繁忙期の仕込みを支える、大容量・時短の定番セット。",
    body:
      "宴会・パーティーが集中するシーズンに向けた、大容量・時短調理の食材セットです。前日注文・翌日配送で、急な宴席の追加にも対応しやすい構成にしています。\n内容・数量はご要望に応じて調整できますので、お気軽にご相談ください。",
    items: [
      { name: "えびフライ", spec: "10尾×10", note: "揚げるだけで主役になる宴会の定番。" },
      { name: "むきえび", spec: "1kg", note: "オードブル・炒め物・サラダに幅広く。" },
      { name: "牛カルビスライス", spec: "1kg", note: "焼き物・鉄板メニューの主力に。" },
      { name: "ホテル・レストラン向け冷凍食品（各種）", spec: "規格多数", note: "オードブルからデザートまで、宴会コースを支えるラインナップ。" },
      { name: "ミックスベジタブル", spec: "1kg", note: "付け合わせ・彩りの時短に。" },
      { name: "業務用精米", spec: "10kg", note: "宴会シーズンの主食を安定確保。" },
      { name: "冷凍ホイップ・バニラアイス", spec: "1L×12 / 2L", note: "デザートビュッフェの定番。" },
      { name: "ドライアイス", spec: "ご要望に応じてカット", note: "デザートの演出・持ち帰り保冷に。" },
    ],
  },
];

export function PackagePage() {
  const { id } = useParams();
  const pkg = PACKAGES.find((p) => p.id === id);

  // 不明なIDはパッケージ一覧（/food の該当セクション）へ誘導
  if (!pkg) {
    return (
      <Section heat={HEAT.foodBiz}>
        <div className="py-20 text-center">
          <p style={{ fontSize: 16 }}>お探しのパッケージが見つかりませんでした。</p>
          <Link to="/food#packages" className="mt-6 inline-flex items-center gap-2 text-brand" style={{ fontSize: 14 }}>
            <ArrowLeft size={16} /> おすすめパッケージ一覧へ戻る
          </Link>
        </div>
      </Section>
    );
  }

  const base = `package:${pkg.id}`;
  return (
    <>
      {/* ヘッダー（事業ページのMVよりコンパクトな帯） */}
      <section className="relative w-full overflow-hidden bg-ink">
        <div className="mx-auto flex min-h-[240px] max-w-[1150px] flex-col items-center justify-center px-5 py-16 text-center pc:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }} {...ed("sectionEn:package.mv", "英語見出し（補助）")}>
              {txt("sectionEn:package.mv", "RECOMMENDED PACKAGE")}
            </p>
            <h1 className="text-white" style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, lineHeight: 1.4 }} {...ed(`${base}.title`, "パッケージ名")}>
              {txt(`${base}.title`, pkg.title)}
            </h1>
            <p className="mt-4 text-white/85" style={{ fontSize: 15 }} {...ed(`${base}.lead`, "リード")}>
              {txt(`${base}.lead`, pkg.lead)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 説明 */}
      <Section heat={HEAT.foodBiz}>
        <div className="mx-auto max-w-3xl">
          <p className="text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed(`${base}.body`, "説明文", { multiline: true })}>
            {txt(`${base}.body`, pkg.body)}
          </p>
        </div>
      </Section>

      {/* セット内容 */}
      <Section heat={HEAT.foodReason}>
        <SectionTitle en="SET CONTENTS" jp="セット内容" path="sectionEn:package.contents" />
        <div className="mt-10 grid gap-5 tab:grid-cols-2">
          {pkg.items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="flex gap-4 rounded-xl border border-border bg-card p-6"
            >
              <Package size={22} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 style={{ fontSize: 16, fontWeight: 700 }} {...ed(`${base}.item.${i}.name`, "商品名")}>
                    {txt(`${base}.item.${i}.name`, it.name)}
                  </h3>
                  <span className="text-muted-foreground" style={{ fontSize: 12 }} {...ed(`${base}.item.${i}.spec`, "規格")}>
                    {txt(`${base}.item.${i}.spec`, it.spec)}
                  </span>
                </div>
                <p className="mt-2 text-foreground/70" style={{ fontSize: 13, lineHeight: 1.9 }} {...ed(`${base}.item.${i}.note`, "説明")}>
                  {txt(`${base}.item.${i}.note`, it.note)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="mt-6 text-muted-foreground" style={{ fontSize: 12 }}>
          ※ セット内容は一例です。業態・規模・メニュー構成に合わせて、商品の組み合わせ・数量を調整のうえご提案します。
        </p>
      </Section>

      {/* CTA */}
      <Section heat={HEAT.foodList}>
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center pc:py-16">
          <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.6 }} {...ed(`${base}.cta`, "CTAコピー")}>
            {txt(`${base}.cta`, "このパッケージについて相談する")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-brand px-8 py-3.5 text-brand-foreground transition-colors hover:bg-brand-dark"
              style={{ fontSize: 15 }}
            >
              お問い合わせ <ArrowRight size={16} />
            </Link>
            <Link
              to="/food#packages"
              className="inline-flex items-center gap-2 border border-border px-8 py-3.5 text-foreground transition-colors hover:border-brand hover:text-brand"
              style={{ fontSize: 15 }}
            >
              <ArrowLeft size={16} /> パッケージ一覧へ戻る
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
