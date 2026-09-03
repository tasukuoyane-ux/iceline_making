// 倉庫事業・ドライアイスの販売ページ（サイト構成改修で新設）。
// コピーは内容確定スプレッドシート「倉庫事業」「ドライアイスの販売」シートに準拠
// （「〇〇（要確認）」の未確定箇所は掲載せず、確定後にコンソールから追記できる）。
// デザインは既存の事業部ページ（DivisionPage）のトンマナを踏襲。
// 文言・画像はすべて service:{id}. プレフィックスの汎用オーバーライドで
// 管理コンソールからインライン編集できる。
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { ContactSection } from "../components/common/ContactSection";
import { RichBody } from "../components/common/RichBody";
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

// ピクトグラムの差し替え用プレースホルダー（小さな「＋」）
const PICTO_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><text x="50%" y="54%" font-size="30" fill="#bcbcc2" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋</text></svg>'
  );

export type ServiceId = "warehouse" | "dryice";

interface ServiceSectionItem {
  title?: string;
  body?: string;
  /** true なら要確認スロット（既定は空。入力されるまで公開ページでは非表示） */
  pending?: boolean;
  /** true なら画像＋テキストの交互レイアウトで表示 */
  image?: boolean;
  /** true なら本文の下にCTAボタン（文言・リンク先はコンソールで編集可能） */
  cta?: boolean;
  /** true なら白い枠付きカードに画像＋文章を載せる（事業部ページの card レイアウトを流用。2026-09 改修） */
  card?: boolean;
  /** true なら画像と文章の左右を既定と逆にする（card / image のとき） */
  flip?: boolean;
}
interface ServiceSection {
  en: string;
  jp: string;
  items: ServiceSectionItem[];
  /** 編集パス用のセクションキー。未指定なら表示順の添字を使う。
   * セクションの追加・削除で既存の編集パス（service:*.sec.<キー>.*）が
   * ずれないよう、並びを変えたセクションには明示的に付与すること。 */
  pathKey?: string;
  /** true なら「写真＋キャプション1行」×6枚のグリッド（items は使わない。
   * 写真が1枚も設定されるまで公開ページでは非表示） */
  photoGrid?: boolean;
  /** true なら「ピクトグラム＋1行キャプション」のグリッド（items の title がキャプションの既定値） */
  pictos?: boolean;
  /** true なら見出し付き項目（カード）を PC で 2 列のグリッドに並べる（2026-09 改修） */
  cardGrid?: boolean;
  /** 手順タイル（STEP n・写真＋工程名＋説明）の枠数。氷ページ「氷ができるまで」の流用（2026-09 改修）。
   * 各枠の文言・写真はコンソールで編集でき、stepDefaults が工程名の既定値 */
  steps?: number;
  stepDefaults?: string[];
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
        // 後続セクションの追加でも編集パスがずれないよう添字を固定
        pathKey: "0",
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
      // 施設・設備の下：写真＋キャプション1行 ×6枚のグリッド（2026-08 追加）
      {
        en: "PHOTOS",
        jp: "フォトギャラリー",
        pathKey: "facphotos",
        items: [],
        photoGrid: true,
      },
      {
        en: "PRICE",
        jp: "ご利用料金",
        // 添字ベースだった旧編集パス（sec.1.*）を維持する固定キー
        pathKey: "1",
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
    // 2026-08 改修：ドライアイスについて／主な用途／ご利用上の注意／購入の流れ／店舗情報を追加。
    // 既存セクション（製品ラインナップ・サービスの特徴・販売サイト）は pathKey で
    // 再編前の編集パス（sec.0 / sec.1 / sec.2）を維持する。
    sections: [
      // ドライアイスについて（業務用食材「サプライチェーン」と同じ画像＋文章レイアウト。
      // 本文が入力されるまで公開ページでは非表示）
      {
        en: "ABOUT",
        jp: "ドライアイスについて",
        pathKey: "about",
        items: [{ title: "（見出し）", pending: true, image: true, card: true }],
      },
      {
        en: "LINEUP",
        jp: "製品ラインナップ",
        pathKey: "0",
        items: [
          {
            title: "取り扱いサイズ・形状",
            body: "お客様のご要望に合わせてサイズをカットしてお届けします。業務用の大ロットから小口まで対応しています。",
            image: true,
            card: true,
            flip: true,
          },
          { pending: true },
        ],
      },
      // 主な用途（旧・製品ラインナップ内の項目を独立セクション化。
      // 画像＋文章レイアウトで、文章側は行頭「・」によりリスト（li）表示）
      {
        en: "USES",
        jp: "主な用途",
        pathKey: "uses",
        items: [
          {
            body:
              "・低温物流・冷凍食品の輸送保冷\n・葬儀・遺体保冷\n・スイーツ・ケーキの輸送\n・その他、冷却・保冷が必要な用途全般",
            image: true,
            card: true,
          },
        ],
      },
      // サービスの特徴：ピクトグラム＋1行キャプションの組み合わせ（2026-08 改修。
      // カード・ボタン風の表示を廃止。title がキャプションの既定値）
      {
        en: "SERVICE",
        jp: "サービスの特徴",
        pathKey: "1",
        pictos: true,
        items: [
          { title: "カット加工対応" },
          { title: "窓口での直接購入" },
          { title: "個人向けECサイト" },
        ],
      },
      {
        en: "NOTES",
        jp: "ご利用上の注意",
        pathKey: "notes",
        items: [{ pending: true }],
      },
      // 購入の流れ：本文の下にECサイト（別タブ）へのボタン（文言・リンク先はコンソールで編集可能）。
      // 2026-09 改修：手順タイル（STEP 1〜3）を追加。工程名の既定値は既存の案内文
      // （窓口・EC／カット加工／受け取り）に沿ったもので、写真・説明はコンソールから追記できる
      {
        en: "FLOW",
        jp: "購入の流れ",
        pathKey: "purchase",
        items: [{ pending: true, cta: true }],
        steps: 3,
        stepDefaults: ["ご注文・お問い合わせ（窓口・電話・ECサイト）", "サイズ・数量のご相談（カット加工対応）", "お受け取り（窓口・配送）"],
      },
      // 店舗情報（H3＋本文の組を4つ。入力されるまで公開ページでは非表示。PC では 2 列のカード）
      {
        en: "STORES",
        jp: "店舗情報",
        pathKey: "stores",
        cardGrid: true,
        items: [
          { title: "（見出し）", pending: true },
          { title: "（見出し）", pending: true },
          { title: "（見出し）", pending: true },
          { title: "（見出し）", pending: true },
        ],
      },
      {
        en: "SHOP",
        jp: "販売サイト",
        pathKey: "2",
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

/** 手順タイル（STEP n・写真＋工程名＋説明）。氷ページ「氷ができるまで」の流用（2026-09 改修）。
 * 工程名の既定値は defaults。写真・説明は未入力の間は非表示（編集モードでは枠を表示）。 */
function ServiceSteps({ base, count, defaults }: { base: string; count: number; defaults: string[] }) {
  const steps = Array.from({ length: count }, (_, i) => {
    const sb = `${base}.step.${i}`;
    return {
      sb,
      i,
      title: txt(`${sb}.title`, defaults[i] ?? ""),
      body: txt(`${sb}.body`, ""),
      image: img(`${sb}.image`, ""),
    };
  });
  const visible = steps.filter((s) => EDIT_MODE || s.title !== "" || s.body !== "" || s.image !== "");
  if (visible.length === 0) return null;
  const cols = Math.min(5, Math.max(1, visible.length));
  return (
    <div
      className="mt-12 grid grid-cols-1 gap-x-6 gap-y-8 tab:grid-cols-3 pc:gap-x-10 pc:[grid-template-columns:repeat(var(--pcols),minmax(0,1fr))]"
      style={{ ["--pcols" as any]: cols }}
    >
      {visible.map((s, n) => (
        <div key={s.i} className="relative rounded-2xl border border-border bg-card p-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary">
            <ImageWithFallback
              src={s.image || IMG_PLACEHOLDER}
              alt={s.title || `STEP ${n + 1}`}
              className="h-full w-full object-cover"
              {...edImg(`${s.sb}.image`, `手順${s.i + 1} 写真`)}
            />
            <span
              className="absolute left-0 top-0 bg-brand px-2.5 py-1 text-brand-foreground"
              style={{ fontFamily: "var(--font-accent)", fontSize: 11, letterSpacing: "0.08em" }}
            >
              STEP {n + 1}
            </span>
          </div>
          <p className="mt-3" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6 }} {...ed(`${s.sb}.title`, `手順${s.i + 1} 工程名`)}>
            {s.title || (EDIT_MODE ? "（工程名）" : "")}
          </p>
          {(s.body || EDIT_MODE) && (
            <p className="mt-1 text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-line" }} {...ed(`${s.sb}.body`, `手順${s.i + 1} 説明`, { multiline: true })}>
              {s.body || "（説明・任意）"}
            </p>
          )}
          {/* 次の手順への矢印（PC のみ・行末では表示しない） */}
          {n < visible.length - 1 && (n + 1) % cols !== 0 && (
            <ChevronRight size={20} className="absolute top-[calc(50%-10px)] hidden text-brand pc:block" style={{ right: -30 }} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ServicePage({ service }: { service: ServiceId }) {
  const s = SERVICES[service];
  const base = `service:${service}`;

  return (
    <>
      {/* メインビジュアル（画像はオーバーレイなしでそのまま見せる・タイトル中央・
          タイトル直下に旧「事業概要」の本文を置く。文章量に応じて高さが伸びる。2026-09 改修） */}
      <section className="relative min-h-[40vh] w-full overflow-hidden bg-ink">
        <ImageWithFallback
          src={img(`${base}.mv.image`, IMG_PLACEHOLDER)}
          alt={s.title}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
          {...edImg(`${base}.mv.image`, "メインビジュアル画像")}
        />
        <div className="relative z-10 mx-auto flex min-h-[40vh] max-w-[1150px] flex-col items-center justify-center px-5 py-16 text-center pc:px-8 pc:py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }} {...ed(`${base}.mv.en`, "英語見出し（補助）")}>
              {txt(`${base}.mv.en`, s.en)}
            </p>
            <h1 className="text-white" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.2 }} {...ed(`${base}.mv.title`, "ページタイトル")}>
              {txt(`${base}.mv.title`, s.title)}
            </h1>
            {/* 旧「事業概要」セクションの本文（編集パスは従来のまま） */}
            <RichBody
              path={`${base}.overview`}
              text={txt(`${base}.overview`, s.overview)}
              label="ページ本文（タイトル直下）"
              className="mx-auto mt-6 max-w-3xl text-left pc:text-center"
              style={{ fontSize: 16, lineHeight: 2.1, color: "rgba(255,255,255,0.95)" }}
            />
            {/* ドライアイス：ECサイトへの導線ボタン（旧事業概要セクションから移設） */}
            {s.shopUrl && (
              <div className="mt-8" style={{ textShadow: "none" }}>
                <a
                  href={s.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-brand px-8 py-3.5 text-brand-foreground transition-colors hover:bg-brand-dark"
                  style={{ fontSize: 15, fontWeight: 700 }}
                >
                  <span {...ed(`${base}.overview.shopBtn`, "ECサイトボタン文言")}>
                    {txt(`${base}.overview.shopBtn`, "ドライアイス販売サイトを見る")}
                  </span>
                  <ArrowRight size={16} />
                </a>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* シート構成に沿った各セクション（要確認スロットは未入力の間、公開ページでは非表示） */}
      {s.sections.map((sec, si) => {
        const sk = sec.pathKey ?? String(si);

        // 写真＋キャプション1行 ×6枚のグリッド（倉庫事業「フォトギャラリー」）。
        // 写真が1枚も設定されるまで公開ページでは非表示
        if (sec.photoGrid) {
          const slots = Array.from({ length: 6 }, (_, i) => ({
            i,
            image: img(`${base}.sec.${sk}.photo.${i}.image`, ""),
          })).filter((p) => p.image !== "" || EDIT_MODE);
          if (slots.length === 0) return null;
          return (
            <Section key={si} heat={si % 2 ? HEAT.foodList : HEAT.foodReason}>
              <SectionTitle en={sec.en} jp={sec.jp} path={`${base}.sec.${sk}`} />
              <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 pc:grid-cols-3">
                {slots.map((p) => (
                  <figure key={p.i}>
                    <ImageWithFallback
                      src={p.image || IMG_PLACEHOLDER}
                      alt={txt(`${base}.sec.${sk}.photo.${p.i}.caption`, "")}
                      sizes="(min-width: 1025px) 33vw, 50vw"
                      className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
                      {...edImg(`${base}.sec.${sk}.photo.${p.i}.image`, `写真${p.i + 1}`)}
                    />
                    <figcaption
                      className="mt-2 text-muted-foreground"
                      style={{ fontSize: 13, lineHeight: 1.7 }}
                      {...ed(`${base}.sec.${sk}.photo.${p.i}.caption`, `写真${p.i + 1} キャプション`)}
                    >
                      {txt(`${base}.sec.${sk}.photo.${p.i}.caption`, "") || (EDIT_MODE ? "（キャプション）" : "")}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Section>
          );
        }

        // ピクトグラム＋1行キャプションのグリッド（ドライアイス「サービスの特徴」）。
        // カード・ボタン風の表示は使わない
        if (sec.pictos) {
          const slots = Array.from({ length: 6 }, (_, i) => ({
            i,
            icon: img(`${base}.sec.${sk}.pic.${i}.icon`, ""),
            caption: txt(`${base}.sec.${sk}.pic.${i}.caption`, sec.items[i]?.title ?? ""),
          })).filter((p) => p.caption !== "" || p.icon !== "" || EDIT_MODE);
          return (
            <Section key={si} heat={si % 2 ? HEAT.foodList : HEAT.foodReason}>
              <SectionTitle en={sec.en} jp={sec.jp} path={`${base}.sec.${sk}`} />
              {/* 白い座布団（外枠）に載せる（2026-09 改修） */}
              <div className="mt-12 rounded-2xl border border-border bg-card p-6 pc:p-10">
              <div className="mx-auto grid max-w-4xl grid-cols-2 gap-x-6 gap-y-10 tab:grid-cols-3">
                {slots.map((p) => (
                  <div key={p.i} className="flex flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-secondary">
                      <ImageWithFallback
                        src={p.icon || PICTO_PLACEHOLDER}
                        alt=""
                        className="h-11 w-11 object-contain"
                        {...edImg(`${base}.sec.${sk}.pic.${p.i}.icon`, `特徴${p.i + 1} ピクトグラム`)}
                      />
                    </div>
                    <p
                      className="mt-3"
                      style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.6 }}
                      {...ed(`${base}.sec.${sk}.pic.${p.i}.caption`, `特徴${p.i + 1} キャプション`)}
                    >
                      {p.caption || (EDIT_MODE ? "（キャプション）" : "")}
                    </p>
                  </div>
                ))}
              </div>
              </div>
            </Section>
          );
        }

        const stepsVisible = !!sec.steps;
        const visible =
          sec.items.some((it, ii) => !it.pending || txt(`${base}.sec.${sk}.${ii}.body`, "") !== "") ||
          stepsVisible ||
          EDIT_MODE;
        if (!visible) return null;
        return (
        <Section key={si} heat={si % 2 ? HEAT.foodList : HEAT.foodReason}>
          <SectionTitle en={sec.en} jp={sec.jp} path={`${base}.sec.${sk}`} />
          {/* 手順タイル（購入の流れ）：本文より上に置く */}
          {sec.steps && <ServiceSteps base={`${base}.sec.${sk}`} count={sec.steps} defaults={sec.stepDefaults ?? []} />}
          <div className={sec.cardGrid ? "mt-12 grid gap-6 pc:grid-cols-2" : "mt-12 space-y-10"}>
            {sec.items.map((it, ii) => {
              const ib = `${base}.sec.${sk}.${ii}`;
              const value = txt(`${ib}.body`, it.pending ? "" : it.body ?? "");
              if (it.pending && !value && !EDIT_MODE) return null;
              const bodyText = value || (it.pending ? PENDING_HINT : "");
              // 本文下のCTAボタン（文言・リンク先はコンソールで編集可能）
              const ctaBtn = it.cta && (
                <div className="mt-6 [direction:ltr]">
                  <a
                    href={txt(`${ib}.cta.url`, s.shopUrl || "/contact")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-brand px-8 py-3.5 text-brand-foreground transition-colors hover:bg-brand-dark"
                    style={{ fontSize: 15 }}
                  >
                    <span {...ed(`${ib}.cta.label`, "CTAボタン文言")}>
                      {txt(`${ib}.cta.label`, "オンラインショップで購入する")}
                    </span>
                    <ArrowRight size={16} />
                  </a>
                  {EDIT_MODE && (
                    <p className="mt-1.5 break-all text-muted-foreground" style={{ fontSize: 11 }} {...ed(`${ib}.cta.url`, "CTAリンク先URL")}>
                      {txt(`${ib}.cta.url`, s.shopUrl || "/contact")}
                    </p>
                  )}
                </div>
              );
              // 画像と文章の左右（既定：偶数番目は画像が右。flip で反転）
              const rtl = (ii % 2 === 1) !== !!it.flip;
              // 白い枠付きカード（事業部ページの card レイアウトを流用。2026-09 改修）
              if (it.card) {
                return (
                  <motion.div
                    key={ii}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl border border-border bg-card p-6 pc:p-8"
                  >
                    <div
                      className={`grid items-center gap-6 pc:gap-8 pc:[grid-template-columns:var(--ratio)] ${rtl ? "pc:[direction:rtl]" : ""}`}
                      style={{ ["--ratio" as any]: ratioCols(`${ib}.ratio`, 45, false) }}
                      {...ratioAttrs(`${ib}.ratio`, 45, false, rtl)}
                    >
                      <div className="[direction:ltr]">
                        {it.title && (
                          <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${ib}.title`, "見出し")}>
                            {txt(`${ib}.title`, it.title)}
                          </h3>
                        )}
                        <RichBody
                          path={`${ib}.body`}
                          text={bodyText}
                          label="本文"
                          className="mt-3 text-foreground/80"
                          style={{ fontSize: 15, lineHeight: 2.05 }}
                        />
                        {ctaBtn}
                      </div>
                      <ImageWithFallback
                        src={img(`${ib}.image`, IMG_PLACEHOLDER)}
                        alt={it.title || sec.jp}
                        className="aspect-[4/3] w-full rounded-xl object-cover [direction:ltr]"
                        {...edImg(`${ib}.image`, `${it.title || sec.jp} 画像`)}
                      />
                    </div>
                  </motion.div>
                );
              }
              return it.image ? (
                <motion.div
                  key={ii}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`grid items-center gap-8 pc:[grid-template-columns:var(--ratio)] ${rtl ? "pc:[direction:rtl]" : ""}`}
                  style={{ ["--ratio" as any]: ratioCols(`${ib}.ratio`, 60, false) }}
          {...ratioAttrs(`${ib}.ratio`, 60, false, rtl)}
                >
                  <div className="[direction:ltr] pc:px-12">
                    {it.title && (
                      <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${ib}.title`, "見出し")}>
                        {txt(`${ib}.title`, it.title)}
                      </h3>
                    )}
                    <RichBody
                      path={`${ib}.body`}
                      text={bodyText}
                      label="本文"
                      className="mt-3 text-foreground/80"
                      style={{ fontSize: 15, lineHeight: 2.05 }}
                    />
                    {ctaBtn}
                  </div>
                  <ImageWithFallback
                    src={img(`${ib}.image`, IMG_PLACEHOLDER)}
                    alt={it.title || sec.jp}
                    className="aspect-[4/3] w-full rounded-2xl border border-border object-cover [direction:ltr]"
                    {...edImg(`${ib}.image`, `${it.title || sec.jp} 画像`)}
                  />
                </motion.div>
              ) : (
                <div key={ii} className={it.title ? "rounded-2xl border border-border bg-card p-8" : "max-w-3xl"}>
                  {it.title && (
                    <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${ib}.title`, "見出し")}>
                      {txt(`${ib}.title`, it.title)}
                    </h3>
                  )}
                  <RichBody
                    path={`${ib}.body`}
                    text={bodyText}
                    label={it.pending ? "本文（要確認・未確定）" : "本文"}
                    className={`mt-3 ${it.pending && !value ? "text-muted-foreground" : "text-foreground/80"}`}
                    style={{ fontSize: 15, lineHeight: 2.05 }}
                  />
                  {ctaBtn}
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
        <SectionTitle en="FAQ" jp="よくあるご質問" path={`${base}.faq`} />
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
              <SectionTitle en="GALLERY" jp="施設写真" path={`${base}.gallery`} />
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
