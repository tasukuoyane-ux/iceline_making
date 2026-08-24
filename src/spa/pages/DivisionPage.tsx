import { useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight, ChevronDown, Search } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { ContactSection } from "../components/common/ContactSection";
import { RichBody } from "../components/common/RichBody";
import { Input } from "../components/ui/input";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { Division, ICE_RECIPES, PRODUCTS } from "../data/products";
import { ed, edImg, txt, img, ratioCols, ratioAttrs, EDIT_MODE } from "../lib/editable";

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
// コンテンツは内容確定スプレッドシートの「氷・氷菓の製造販売」「業務用食材の販売」
// シートに準拠。セクション名もシート通り。
// シート上で「〇〇（要確認）」となっている箇所は pending スロットとして実装し、
// 公開ページでは未入力の間は非表示、コンソール（編集モード）では入力枠を表示する。
// 文言・画像は division:{division}. プレフィックスの汎用オーバーライドで編集可能。
// ─────────────────────────────────────────────────────────
const PENDING_HINT = "（未確定：原稿確定後にここへ入力してください）";

interface DetailItem {
  title?: string;
  body?: string;
  /** true なら要確認スロット（既定は空。入力されるまで公開ページでは非表示） */
  pending?: boolean;
  /** true なら画像＋テキストの交互レイアウトで表示 */
  image?: boolean;
  /** true なら画像枠を縦長2枚（斜め区切り）で表示（image と併用） */
  splitImage?: boolean;
  /** true なら本文の右側（SPでは下）に画像を置ける（未設定の間は公開ページでは文章のみ） */
  sideImage?: boolean;
  /** true なら本文の右側（SPでは下）に画像3枚のマーソンリーを表示 */
  masonryImages?: boolean;
  /** 既存アップロード画像を引き継ぐ場合の明示キー */
  imgKey?: string;
}
interface DetailSection {
  en: string;
  jp: string;
  items: DetailItem[];
  /** true なら項目の下に工程フロー（写真＋工程名、最大10ステップ）を表示 */
  flow?: boolean;
  /** 編集パス用のセクションキー。未指定なら表示順の添字を使う。
   * セクションの追加・削除で既存の編集パス（division:*.sec.<キー>.*）が
   * ずれないよう、並びを変えたセクションには明示的に付与すること。 */
  pathKey?: string;
}
interface FaqItem {
  q: string;
  a?: string;
  pending?: boolean;
}

const OVERVIEW: Record<Division, string> = {
  food:
    "岡山県内において、外食産業向け食品商社としてトップシェアを持つ事業です。国内外200社以上の仕入れ先から調達した5,000品目を超える商品を取り扱い、ホテル・レストランをはじめとする飲食店・食品メーカーへ届けています。食用油・輸入鶏肉をはじめとする定番品から、世界中の食材まで幅広く対応しています。",
  ice:
    "アイスラインは、1905年の創業以来、氷の製造・販売を中核事業として展開してきました。西大寺物流センター（営業部・製造部）を拠点に、業務用かち割り氷から独自開発の味付き氷・氷菓まで、幅広いラインナップを全国の飲食店・量販店・テーマパークなどに供給しています。国際食品安全認証FSSC22000を取得し、製造から出荷までの全工程において品質管理を徹底しています。"
};

// 商品一覧（製品ラインナップ／取り扱い商品カテゴリ）より上のセクション
const DETAIL_PRE: Record<Division, DetailSection[]> = {
  // 業務用食材：見出し構成の再編（2026-08 改修）。
  // 事業概要（現状踏襲）→ サプライチェーン → 事業の特徴（4項目）→ 品質保証への取り組み（3項目）。
  // 中身はすべて入れ替え予定のため空欄（要確認スロット）。本文が入力されるまで
  // 公開ページでは各セクションごと非表示になる。レイアウトはいずれも
  // 旧「万全の物流体制」「事業の特徴」と同じ画像＋テキストの交互配置。
  // pathKey は再編前の添字ベースの編集パス（sec.0〜3）と衝突しない固有キー。
  food: [
    {
      en: "SUPPLY CHAIN",
      jp: "サプライチェーン",
      pathKey: "supply",
      items: [{ title: "（見出し）", pending: true, image: true }],
    },
    {
      en: "FEATURES",
      jp: "事業の特徴",
      pathKey: "features",
      items: [
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
      ],
    },
    // 万全の物流体制（2026-08 追加）：「事業の特徴」と同じデザイン・コンテンツ量
    // （画像＋テキストの交互配置・4項目）。本文が入力されるまで公開ページでは非表示。
    {
      en: "LOGISTICS",
      jp: "万全の物流体制",
      pathKey: "logistics",
      items: [
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
      ],
    },
    {
      en: "QUALITY",
      jp: "品質保証への取り組み",
      pathKey: "quality",
      items: [
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
      ],
    },
  ],
  ice: [
    // 選ばれる理由（「業務用食材」の「万全の物流体制」と同じ画像交互レイアウト・3点）。
    // 3点とも要確認スロット：本文が入力されるまで公開ページでは非表示。
    // pathKey "reasons"：後から挿入したセクションなので、既存セクションの
    // 編集パス（sec.0 / sec.2）を変えないよう添字ではなく固有キーを使う。
    {
      en: "REASONS",
      jp: "選ばれる理由",
      pathKey: "reasons",
      items: [
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true },
      ],
    },
    {
      en: "MANUFACTURING",
      jp: "製造の特徴",
      pathKey: "0",
      items: [
        {
          title: "原料水について",
          body:
            "西大寺工場では、逆浸透膜（RO膜）でろ過した水を使用しています。不純物を除去した純度の高い水を原料とすることで、安定した品質の氷を製造しています。",
          image: true,
          splitImage: true,
        },
        {
          title: "製法について",
          body:
            "製氷方法は、工場と製品によって異なります。\n二日市工場ではカングリット製法を採用しています。135kgの大きな氷の塊からカットして加工していく方法で、かち割り氷や小さな氷など多様なサイズに対応できることが特徴です。製氷に時間を要しますが、大型の氷から精密に加工できる点が強みです。\n西大寺工場ではターボ製氷（氷柱方式）を採用しています。90〜120分という短いサイクルで製氷できるため、需要の変動に柔軟に対応できる生産体制を整えています。\n氷の品質は、不純物をどれだけ取り除けるかで決まります。水の純度が高いほど透明で硬く、溶けにくい氷になります。ロッキーアイスが「硬く透明で溶けにくい」のは、原料水の純度を高め、低温でじっくり凍らせる工程を徹底しているからです。",
          image: true,
          splitImage: true,
        },
        // 旧「品質保証」セクションのコンテンツ（3つ目の項目としてここへ移動）
        {
          title: "品質保証",
          body:
            "国際食品安全認証「FSSC22000」を取得しています。食品安全マネジメントシステムの国際規格に基づき、原料の受け入れから製造・検査・出荷までの全工程において、定められた基準に沿った管理を行っています。",
          sideImage: true,
        },
        // 「製造能力・設備」（見出し＋文言のみの要確認スロット）は 2026-08 改修で削除
      ],
    },
    {
      en: "PROCESS",
      jp: "氷ができるまで",
      pathKey: "2",
      items: [
        { body: "氷カフェ（コーヒー）を例に、製造工程をご紹介します。" },
      ],
      flow: true,
    },
  ],
};

// 商品一覧より下のセクション（お客様の声・環境など）
const DETAIL_POST: Record<Division, DetailSection[]> = {
  food: [
    { en: "VOICES", jp: "お客様の声・導入事例", items: [{ pending: true }] },
    { en: "ENVIRONMENT", jp: "環境への取り組み", items: [{ pending: true }] },
  ],
  ice: [
    { en: "VOICES", jp: "お客様の声・導入事例", items: [{ pending: true }] },
    {
      en: "ENVIRONMENT",
      jp: "環境への取り組み",
      items: [
        {
          body:
            "2022年竣工の西大寺物流センターでは、自然冷媒を使用した冷却設備を導入しています。自然冷媒はオゾン層破壊係数がゼロで、代替フロンと比べて地球温暖化係数が大幅に低く、環境負荷を抑えた製造・保管を実現しています。",
        },
        { pending: true },
      ],
    },
  ],
};

const FAQ: Record<Division, FaqItem[]> = {
  food: [
    { q: "取引を始めるにはどうすればよいですか？", a: "まずはお問い合わせフォームまたはお電話にてご連絡ください。" },
    { q: "取り扱い商品のリストは確認できますか？", pending: true },
    { q: "最小発注ロットはどのくらいですか？", pending: true },
    { q: "配送エリアはどこまで対応していますか？", a: "岡山県全域への配送に対応しています。" },
    { q: "前日注文した商品はいつ届きますか？", a: "翌日の配送でお届けしています。" },
    { q: "アレルギー情報は確認できますか？", pending: true },
  ],
  ice: [
    { q: "最小発注ロットはどのくらいですか？", pending: true },
    { q: "配送エリアはどこまで対応していますか？", pending: true },
    { q: "OEM・PB対応は可能ですか？", pending: true },
    { q: "サンプルの取り寄せは可能ですか？", pending: true },
    { q: "FSSC22000以外の認証取得状況を教えてください。", pending: true },
  ],
};

// ─────────────────────────────────────────────────────────
// 氷・氷菓の製品ラインナップ（シートのカテゴリ分け通り）。
// products は既存の商品詳細ページ（/ice/products/:id）との対応。
// 炭酸氷はシート未掲載だが、既存詳細ページを残すため氷カフェ・カクテル用アイスに含める。
// ─────────────────────────────────────────────────────────
const ICE_CATEGORIES: { name: string; desc: string; skus: string; products: string[] }[] = [
  {
    name: "製氷（ロッキーアイスシリーズ）",
    desc:
      "純度の高い原料水を低温でじっくり凍らせた、硬く透明で溶けにくい業務用かち割り氷です。溶けても飲み物の味を損なわず、食品本来のおいしさをそのままお届けします。",
    skus:
      "・ロッキーアイス チャック付き（1kg×12）\n・ロッキーアイス 2kg（2kg×6）\n・ロッキーアイス 3kg（3kg×4）\n・ROCKY650（650g×18）\n・プレミアムな氷 オンザロックICE（6個×8×2台）オンザロック専用\n・アイス平（1.7kg×6）板状アイス\n・ブロックアイス（3.75kg×4）\n・ROCKYカップ 130g（130g×12×4合）\n・ROCKYカップ 180g（180g×12×3合）",
    products: ["rocky-ice"],
  },
  {
    name: "雪氷・雪氷果肉入り",
    desc:
      "かき氷用に削った氷を個包装した商品です。氷削り機やブレンダーマシンなしで、かき氷・スムージーを作ることができます。一袋使い切りタイプで衛生的に使用することができ、原価計算も容易です。",
    skus:
      "・雪氷（200g）\n・雪氷果肉入り いちご（100g×18袋）\n・雪氷果肉入り マンゴー（100g×18袋）\n・雪氷果肉入り レモン（100g×18袋）",
    products: ["snow-ice"],
  },
  {
    name: "氷カフェ・カクテル用アイス",
    desc:
      "通常の氷をドリンクに入れると、時間とともに飲み物が薄くなってしまいます。氷カフェはそんな飲食店の長年の課題に応えた商品です。コーヒーや果汁などを凍らせてチップアイス状にクラッシュしているため、氷が溶けるほどに味が深まっていきます。グラスに入れて牛乳を注ぐだけでアイスカフェラテを作ることができ、特別な機械も技術も必要ありません。一袋使い切りの個包装なので衛生的に使用でき、原価の計算もしやすく、人手不足の飲食現場でもすぐに導入しやすい商品です。",
    skus:
      "氷カフェ（60g×20袋）\n・コーヒー\n・抹茶\n・いちご\n・ほうじ茶\n\nカクテル用アイス（80g×20袋）\n・マンゴー\n・巨峰\n・青りんご\n・レモン",
    products: ["ice-cafe", "cocktail-ice", "carbonated-ice"],
  },
  {
    name: "フラペリッチ",
    desc:
      "抹茶やコーヒーの氷を細かく削り、小豆やチョコチップとクランチをあらかじめ混ぜ込んで個包装しています。牛乳を注ぐだけでスムージーを作ることができ、ブレンダーも専門の技術も事前の仕込みも必要ありません。ドリンク1杯あたりのコストが明確になるため、原価管理もしやすくなります。設備投資なしに新メニューを導入できる点が、多くの飲食店に選ばれている理由です。",
    skus: "・フラペリッチ 宇治抹茶小豆入り（100g×18袋）\n・フラペリッチ コーヒー",
    products: ["frappe-rich"],
  },
];

// ─────────────────────────────────────────────────────────
// 事業概要の下に置く商品ラインナップ導線タイル（氷・氷菓のみ）。
// 画像・名称・リンク先はすべてコンソールから編集可能
// （キー: ice:lineupNav.{i}.image / .name / .href）。
// リンク先は「#〜」でページ内アンカー、「/〜」でサイト内ページ、
// 「https://〜」で外部サイト（別タブ）として扱う。
// ─────────────────────────────────────────────────────────
const ICE_LINEUP_NAV: { name: string; href: string; img: string }[] = [
  { name: "無色透明\nかち割り氷", href: "/ice/products/rocky-ice", img: IMG.iceClose },
  { name: "味・色付き氷", href: "/ice/products/ice-cafe", img: IMG.icedCoffee },
  { name: "コンビニ向け", href: "#ice-lineup", img: IMG.iceBlue },
];

// ─────────────────────────────────────────────────────────
// 製品ラインナップに追加するドライアイス（製氷の上に表示）。
// 内容は「ドライアイスの販売」ページに準拠。「詳細を見る」はECサイトへ。
// インデックス式の ice:lineup.{ci}.* とは独立した ice:lineup.dryice.* キーで管理し、
// 既存カテゴリの保存済みオーバーライドがずれないようにしている。
// ─────────────────────────────────────────────────────────
const DRYICE_LINEUP = {
  name: "ドライアイス",
  desc:
    "ドライアイスは、二酸化炭素を固体にしたもので、約-79℃という極低温の保冷材です。溶けても水が残らないため、食品や精密機器の輸送にも安心してお使いいただけます。低温物流・葬儀・スイーツ輸送など幅広い用途に対応しており、お客様のご要望に合わせたサイズへのカット加工にも対応しています。個人のお客様向けには、ECサイトからもご購入いただけます。",
  skus:
    "・ブロック（1kg〜約20kg）\n・各種スライス加工\n・ご要望に応じたサイズへのカット対応\n\n【主な用途】\n・低温物流・冷凍食品の輸送保冷\n・葬儀・遺体保冷\n・スイーツ・ケーキの輸送\n・その他、冷却・保冷が必要な用途全般",
  ecUrl: "https://www.dry-ice.jp/",
};

// 活用提案・メニューレシピ（シート準拠の確定原稿）
const ICE_RECIPE_STORY =
  "通常の氷をドリンクに入れると、溶けるにつれて飲み物の味が薄くなっていきます。これは飲食店にとって長年の課題でした。氷カフェはその発想を逆転させた商品です。氷そのものをコーヒーや果汁にすることで、溶けるほどに味が深まっていく。牛乳を注ぐだけでアイスカフェラテを作ることができ、特別な機械は不要です。アイスラインの氷菓は、透明・無味・無臭という「普通の氷」の常識にとどまらず、氷そのものを素材として捉え直した商品群です。";

// ─────────────────────────────────────────────────────────
// 業務用食材の検索モックアップ。
// 今後 5,000 品目の食品データベースに接続した検索機能を実装予定。
// ここではその UI イメージとして約30品目のモックデータで動作する。
// ─────────────────────────────────────────────────────────
interface FoodDbItem {
  name: string;
  category: string;
  temp: "常温" | "冷蔵" | "冷凍";
  spec: string;
  /** 既存の商品詳細ページがある場合のリンク先 */
  to?: string;
}
const FOOD_DB: FoodDbItem[] = [
  { name: "大豆白絞油", category: "食用油", temp: "常温", spec: "16.5kg缶" },
  { name: "晴れの国 大豆白絞油（PB）", category: "食用油", temp: "常温", spec: "16.5kg缶" },
  { name: "キャノーラ油", category: "食用油", temp: "常温", spec: "16.5kg缶" },
  { name: "ピュアオリーブオイル", category: "食用油", temp: "常温", spec: "5L" },
  { name: "純正ごま油", category: "食用油", temp: "常温", spec: "1,650g" },
  { name: "輸入鶏もも肉", category: "鶏肉・畜肉", temp: "冷凍", spec: "2kg×6" },
  { name: "輸入鶏むね肉", category: "鶏肉・畜肉", temp: "冷凍", spec: "2kg×6" },
  { name: "若鶏手羽先", category: "鶏肉・畜肉", temp: "冷凍", spec: "2kg" },
  { name: "豚バラスライス", category: "鶏肉・畜肉", temp: "冷凍", spec: "1kg" },
  { name: "牛カルビスライス", category: "鶏肉・畜肉", temp: "冷凍", spec: "1kg" },
  { name: "えびフライ", category: "冷凍食品", temp: "冷凍", spec: "10尾×10" },
  { name: "鶏から揚げ", category: "冷凍食品", temp: "冷凍", spec: "1kg" },
  { name: "フライドポテト シューストリング", category: "冷凍食品", temp: "冷凍", spec: "1kg×10" },
  { name: "焼餃子", category: "冷凍食品", temp: "冷凍", spec: "50個入" },
  { name: "ミックスベジタブル", category: "冷凍食品", temp: "冷凍", spec: "1kg" },
  { name: "ホテル・レストラン向け冷凍食品（各種）", category: "冷凍食品", temp: "冷凍", spec: "規格多数", to: "/food/products/frozen-foods" },
  { name: "濃口醤油", category: "調味料", temp: "常温", spec: "1.8L×6" },
  { name: "本みりん", category: "調味料", temp: "常温", spec: "1.8L×6" },
  { name: "業務用マヨネーズ", category: "調味料", temp: "冷蔵", spec: "1kg" },
  { name: "トマトケチャップ", category: "調味料", temp: "常温", spec: "1kg" },
  { name: "がらスープの素", category: "調味料", temp: "常温", spec: "1kg" },
  { name: "薄力小麦粉", category: "乾物・粉類", temp: "常温", spec: "1kg×15" },
  { name: "パン粉", category: "乾物・粉類", temp: "常温", spec: "1kg×10" },
  { name: "片栗粉", category: "乾物・粉類", temp: "常温", spec: "1kg×15" },
  { name: "業務用精米", category: "乾物・粉類", temp: "常温", spec: "10kg" },
  { name: "冷凍ホイップ", category: "デザート・乳製品", temp: "冷凍", spec: "1L×12" },
  { name: "バニラアイス", category: "デザート・乳製品", temp: "冷凍", spec: "2L" },
  { name: "シュレッドチーズ", category: "デザート・乳製品", temp: "冷蔵", spec: "1kg" },
  { name: "むきえび", category: "水産品", temp: "冷凍", spec: "1kg" },
  { name: "ドライアイス", category: "その他", temp: "冷凍", spec: "ご要望に応じてカット", to: "/food/products/dry-ice" },
  { name: "業務用食材（その他）", category: "その他", temp: "常温", spec: "5,000品目以上", to: "/food/products/pro-ingredients" },
];
const FOOD_TEMPS = ["すべて", "常温", "冷蔵", "冷凍"] as const;

function FoodSearchMock() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("すべて");
  const [temp, setTemp] = useState<(typeof FOOD_TEMPS)[number]>("すべて");
  const cats = useMemo(() => ["すべて", ...Array.from(new Set(FOOD_DB.map((i) => i.category)))], []);
  const hits = useMemo(
    () =>
      FOOD_DB.filter(
        (i) =>
          (cat === "すべて" || i.category === cat) &&
          (temp === "すべて" || i.temp === temp) &&
          (query.trim() === "" || (i.name + i.category + i.spec).toLowerCase().includes(query.trim().toLowerCase()))
      ),
    [query, cat, temp]
  );

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card p-6 pc:p-8">
      {/* 検索ボックス */}
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="商品名・カテゴリで検索（例：鶏肉、食用油）"
          className="h-12 pl-11"
          aria-label="商品検索"
        />
      </div>

      {/* カテゴリ・温度帯フィルタ */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`rounded-full border px-4 py-1.5 transition-colors ${
              cat === c ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-foreground hover:border-brand hover:text-brand"
            }`}
            style={{ fontSize: 13 }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>温度帯：</span>
        {FOOD_TEMPS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTemp(t)}
            className={`rounded-full border px-3.5 py-1 transition-colors ${
              temp === t ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-foreground hover:border-brand hover:text-brand"
            }`}
            style={{ fontSize: 12 }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 検索結果 */}
      <p className="mt-6 text-muted-foreground" style={{ fontSize: 13 }}>
        {hits.length}件を表示
      </p>
      <div className="mt-3 grid gap-3 tab:grid-cols-2 pc:grid-cols-3">
        {hits.map((i) => {
          const inner = (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-flex bg-secondary px-2.5 py-0.5 text-muted-foreground" style={{ fontSize: 11 }}>{i.category}</span>
                <span
                  className={`inline-flex px-2.5 py-0.5 text-white ${i.temp === "冷凍" ? "bg-brand" : i.temp === "冷蔵" ? "bg-[#4a90b8]" : "bg-[#8a8a8a]"}`}
                  style={{ fontSize: 11 }}
                >
                  {i.temp}
                </span>
              </div>
              <p className="mt-2" style={{ fontSize: 15, fontWeight: 700 }}>{i.name}</p>
              <p className="mt-1 text-muted-foreground" style={{ fontSize: 12 }}>{i.spec}</p>
              {i.to && (
                <span className="mt-2 inline-flex items-center gap-1 text-brand" style={{ fontSize: 12 }}>
                  詳細を見る <ArrowRight size={12} />
                </span>
              )}
            </>
          );
          return i.to ? (
            <Link key={i.name} to={i.to} className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand">
              {inner}
            </Link>
          ) : (
            <div key={i.name} className="rounded-xl border border-border bg-background p-4">
              {inner}
            </div>
          );
        })}
      </div>
      {hits.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground" style={{ fontSize: 14 }}>
          該当する商品が見つかりませんでした。条件を変えてお試しください。
        </p>
      )}

      <p className="mt-6 text-muted-foreground" style={{ fontSize: 12 }}>
        ※ 商品検索は開発中の機能イメージ（モックアップ）です。現在は約5,000品目のうち一部の商品のみを表示しています。
      </p>
    </div>
  );
}

// おすすめパッケージ（/food/packages/:id の3ページへの導線）
export const FOOD_PACKAGES: { id: string; title: string; lead: string }[] = [
  { id: "izakaya-starter", title: "居酒屋の開業におすすめの商品セット", lead: "揚げ物・焼き物・ドリンクまわりの定番をひとまとめに。" },
  { id: "cafe-sweets", title: "カフェ・喫茶店の開業におすすめの商品セット", lead: "氷カフェ・スイーツ食材で、ドリンクとデザートを手早く。" },
  { id: "banquet-season", title: "ホテル・レストランの宴会シーズンにおすすめの商品セット", lead: "繁忙期の仕込みを支える、大容量・時短の定番セット。" },
];

// ─────────────────────────────────────────────────────────

/** 編集モード限定：リンク先URLをテキストとして編集するための行 */
function EditableLinkHint({ path, label, href }: { path: string; label: string; href: string }) {
  if (!EDIT_MODE) return null;
  return (
    <p className="mt-1.5 break-all text-muted-foreground" style={{ fontSize: 11 }} {...ed(path, label)}>
      {href}
    </p>
  );
}

/** 商品ラインナップ導線タイル（画像＋グレーオーバーレイ＋白文字。全体がボタン） */
function LineupNavTile({ i, def }: { i: number; def: { name: string; href: string; img: string } }) {
  const base = `ice:lineupNav.${i}`;
  const name = txt(`${base}.name`, def.name);
  const href = txt(`${base}.href`, def.href);
  const inner = (
    <>
      <ImageWithFallback
        src={img(`${base}.image`, def.img || IMG_PLACEHOLDER)}
        alt={name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        {...edImg(`${base}.image`, `ラインナップ導線${i + 1} 画像`)}
      />
      {/* グレーのオーバーレイ */}
      <div className="absolute inset-0 bg-ink/50 transition-colors group-hover:bg-ink/35" />
      <span
        className="absolute inset-0 flex items-center justify-center px-4 text-center text-white"
        style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.6, whiteSpace: "pre-line" }}
        {...ed(`${base}.name`, `ラインナップ導線${i + 1} 名称`)}
      >
        {name}
      </span>
    </>
  );
  const cls = "group relative block aspect-[16/9] overflow-hidden rounded-xl border border-border";
  return (
    <div>
      {/^https?:/i.test(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
      ) : href.startsWith("#") ? (
        <a href={href} className={cls}>{inner}</a>
      ) : (
        <Link to={href} className={cls}>{inner}</Link>
      )}
      <EditableLinkHint path={`${base}.href`} label={`ラインナップ導線${i + 1} リンク先URL`} href={href} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 氷ができるまで：工程フロー。
// 写真＋工程名＋説明のステップを最大10まで表示できる。
// ステップ1は常に表示し、2以降は工程名・説明・写真のいずれかが
// コンソールで入力されると公開ページに現れる（削除は入力を空に戻す）。
// ─────────────────────────────────────────────────────────
const MAX_PROCESS_STEPS = 10;

function IceProcessFlow() {
  const steps = Array.from({ length: MAX_PROCESS_STEPS }, (_, i) => {
    const base = `division:ice.process.step.${i}`;
    return {
      base,
      i,
      title: txt(`${base}.title`, ""),
      body: txt(`${base}.body`, ""),
      image: img(`${base}.image`, ""),
    };
  });
  const visible = steps.filter((s) => s.i === 0 || EDIT_MODE || s.title !== "" || s.body !== "" || s.image !== "");
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-10 tab:grid-cols-3 pc:grid-cols-5 pc:gap-x-8">
      {visible.map((s, n) => (
        <div key={s.i} className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-secondary">
            <ImageWithFallback
              src={s.image || IMG_PLACEHOLDER}
              alt={s.title || `工程${n + 1}`}
              className="h-full w-full object-cover"
              {...edImg(`${s.base}.image`, `工程${s.i + 1} 写真`)}
            />
            <span
              className="absolute left-0 top-0 bg-brand px-2.5 py-1 text-brand-foreground"
              style={{ fontFamily: "var(--font-accent)", fontSize: 11, letterSpacing: "0.08em" }}
            >
              STEP {n + 1}
            </span>
          </div>
          <p className="mt-3" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6 }} {...ed(`${s.base}.title`, `工程${s.i + 1} 工程名`)}>
            {s.title || (EDIT_MODE || s.i === 0 ? "（工程名）" : "")}
          </p>
          {(s.body || EDIT_MODE) && (
            <p className="mt-1 text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-line" }} {...ed(`${s.base}.body`, `工程${s.i + 1} 説明`, { multiline: true })}>
              {s.body || "（説明・任意）"}
            </p>
          )}
          {/* 次の工程への矢印（行末で折り返す位置でも軽く見えるよう控えめに） */}
          {n < visible.length - 1 && (
            <ChevronRight
              size={20}
              className="absolute top-[calc(37.5%-10px)] hidden text-brand pc:block"
              style={{ right: -26 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** ドライアイスの商品カード（ECサイトへ外部リンク） */
function DryIceLineupCard({ ecUrl }: { ecUrl: string }) {
  const p = PRODUCTS.find((x) => x.id === "dry-ice");
  if (!p) return null;
  return (
    <a
      href={ecUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <ImageWithFallback src={PRODUCT_IMG[p.id]} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" {...edImg(`images:PRODUCT_IMG.${p.id}`)} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h4 style={{ fontSize: 16, fontWeight: 700 }} {...ed(`product:${p.id}:name`, "商品名")}>{txt(`product:${p.id}:name`, p.name)}</h4>
        <p className="mt-1 flex-1 text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.8 }} {...ed(`product:${p.id}:catch`, "商品キャッチ")}>{txt(`product:${p.id}:catch`, p.catch)}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-brand" style={{ fontSize: 13 }}>
          詳細を見る（ECサイト） <ArrowRight size={14} />
        </span>
      </div>
    </a>
  );
}

/** 要確認スロット対応の項目レンダラ（sk はセクションの編集パスキー） */
function DetailItemBlock({ division, sk, ii, it, secJp }: { division: Division; sk: string; ii: number; it: DetailItem; secJp: string }) {
  const base = `division:${division}.sec.${sk}.${ii}`;
  const value = txt(`${base}.body`, it.pending ? "" : it.body ?? "");
  if (it.pending && !value && !EDIT_MODE) return null;
  const bodyText = value || (it.pending ? PENDING_HINT : "");

  // 本文の右側（SPでは下）に画像3枚のマーソンリー（1枚目は縦長で2段ぶち抜き）
  if (it.masonryImages) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid items-center gap-8 pc:[grid-template-columns:var(--ratio)]"
        style={{ ["--ratio" as any]: ratioCols(`${base}.ratio`, 60, false) }}
          {...ratioAttrs(`${base}.ratio`, 60, false)}
      >
        <div className="pc:px-12">
          {it.title && (
            <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.title`, "見出し")}>
              {txt(`${base}.title`, it.title)}
            </h3>
          )}
          <RichBody path={`${base}.body`} text={bodyText} label="本文" className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05 }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ImageWithFallback
            src={img(`${base}.image`, IMG_PLACEHOLDER)}
            alt={`${it.title || secJp} 画像1`}
            className="row-span-2 h-full w-full rounded-2xl border border-border object-cover"
            {...edImg(`${base}.image`, `${it.title || secJp} 画像1（縦長）`)}
          />
          <ImageWithFallback
            src={img(`${base}.image2`, IMG_PLACEHOLDER)}
            alt={`${it.title || secJp} 画像2`}
            className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
            {...edImg(`${base}.image2`, `${it.title || secJp} 画像2`)}
          />
          <ImageWithFallback
            src={img(`${base}.image3`, IMG_PLACEHOLDER)}
            alt={`${it.title || secJp} 画像3`}
            className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
            {...edImg(`${base}.image3`, `${it.title || secJp} 画像3`)}
          />
        </div>
      </motion.div>
    );
  }

  if (it.image) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`grid items-center gap-8 pc:[grid-template-columns:var(--ratio)] ${ii % 2 ? "pc:[direction:rtl]" : ""}`}
        style={{ ["--ratio" as any]: ratioCols(`${base}.ratio`, 60, false) }}
          {...ratioAttrs(`${base}.ratio`, 60, false, ii % 2 === 1)}
      >
        <div className="[direction:ltr] pc:px-12">
          {it.title && (
            <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.title`, "見出し")}>
              {txt(`${base}.title`, it.title)}
            </h3>
          )}
          <RichBody path={`${base}.body`} text={bodyText} label="本文" className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05 }} />
        </div>
        {it.splitImage ? (
          /* 縦長画像2枚を斜めの区切りで並べ、全体で従来の 4:3 の枠に収める */
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl [direction:ltr]">
            <div className="absolute inset-y-0 left-0 w-[58%]" style={{ clipPath: "polygon(0 0, 96.5% 0, 74% 100%, 0 100%)" }}>
              <ImageWithFallback
                src={img(it.imgKey ?? `${base}.image`, IMG_PLACEHOLDER)}
                alt={`${it.title || secJp} 画像1`}
                className="h-full w-full object-cover"
                {...edImg(it.imgKey ?? `${base}.image`, `${it.title || secJp} 画像1（左）`)}
              />
            </div>
            <div className="absolute inset-y-0 right-0 w-[58%]" style={{ clipPath: "polygon(27.6% 0, 100% 0, 100% 100%, 5.2% 100%)" }}>
              <ImageWithFallback
                src={img(`${base}.image2`, IMG_PLACEHOLDER)}
                alt={`${it.title || secJp} 画像2`}
                className="h-full w-full object-cover"
                {...edImg(`${base}.image2`, `${it.title || secJp} 画像2（右）`)}
              />
            </div>
          </div>
        ) : (
          <ImageWithFallback
            src={img(it.imgKey ?? `${base}.image`, IMG_PLACEHOLDER)}
            alt={it.title || secJp}
            className="aspect-[4/3] w-full rounded-2xl border border-border object-cover [direction:ltr]"
            {...edImg(it.imgKey ?? `${base}.image`, `${it.title || secJp} 画像`)}
          />
        )}
      </motion.div>
    );
  }

  // 本文の右側（SPでは下）に画像を置けるレイアウト。
  // 画像未設定の間は公開ページでは従来どおり文章のみ表示する。
  if (it.sideImage && (img(`${base}.image`, "") !== "" || EDIT_MODE)) {
    return (
      <div
        className="grid items-center gap-8 pc:[grid-template-columns:var(--ratio)]"
        style={{ ["--ratio" as any]: ratioCols(`${base}.ratio`, 40, false) }}
          {...ratioAttrs(`${base}.ratio`, 40, false)}
      >
        <div>
          {it.title && (
            <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.title`, "見出し")}>
              {txt(`${base}.title`, it.title)}
            </h3>
          )}
          <RichBody path={`${base}.body`} text={bodyText} label="本文" className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05 }} />
        </div>
        <ImageWithFallback
          src={img(`${base}.image`, IMG_PLACEHOLDER)}
          alt={it.title || secJp}
          className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
          {...edImg(`${base}.image`, `${it.title || secJp} 画像`)}
        />
      </div>
    );
  }
  return (
    <div className={it.title ? "rounded-2xl border border-border bg-card p-8" : "max-w-3xl"}>
      {it.title && (
        <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.title`, "見出し")}>
          {txt(`${base}.title`, it.title)}
        </h3>
      )}
      <RichBody
        path={`${base}.body`}
        text={bodyText}
        label={it.pending ? "本文（要確認・未確定）" : "本文"}
        className={`mt-3 ${it.pending && !value ? "text-muted-foreground" : "text-foreground/80"}`}
        style={{ fontSize: 15, lineHeight: 2.05 }}
      />
    </div>
  );
}

/** セクション（全項目が未入力の要確認スロットなら公開ページでは丸ごと非表示） */
function DetailSectionBlock({ division, si, sec, heat }: { division: Division; si: number; sec: DetailSection; heat: any }) {
  const sk = sec.pathKey ?? String(si);
  const visible = sec.items.some((it, ii) => !it.pending || txt(`division:${division}.sec.${sk}.${ii}.body`, "") !== "");
  if (!visible && !EDIT_MODE) return null;
  return (
    <Section heat={heat}>
      <SectionTitle en={sec.en} jp={sec.jp} path={`division:${division}.sec.${sk}`} />
      <div className="mt-12 space-y-10">
        {sec.items.map((it, ii) => (
          <DetailItemBlock key={ii} division={division} sk={sk} ii={ii} it={it} secJp={sec.jp} />
        ))}
        {sec.flow && <IceProcessFlow />}
      </div>
    </Section>
  );
}

/** 商品カード（既存の商品詳細ページへの導線） */
function ProductCard({ division, id }: { division: Division; id: string }) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return null;
  return (
    <Link
      to={`/${division}/products/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <ImageWithFallback src={PRODUCT_IMG[p.id]} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" {...edImg(`images:PRODUCT_IMG.${p.id}`)} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h4 style={{ fontSize: 16, fontWeight: 700 }} {...ed(`product:${p.id}:name`, "商品名")}>{txt(`product:${p.id}:name`, p.name)}</h4>
        <p className="mt-1 flex-1 text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.8 }} {...ed(`product:${p.id}:catch`, "商品キャッチ")}>{txt(`product:${p.id}:catch`, p.catch)}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-brand" style={{ fontSize: 13 }}>
          詳細を見る <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export function DivisionPage({ division }: { division: Division }) {
  const mv = MV[division];
  const divTitle = txt(`division:${division}.mv.title`, mv.title);
  const [openCats, setOpenCats] = useState<string[]>([]);
  const toggleCat = (c: string) =>
    setOpenCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const bizHeat = division === "food" ? HEAT.foodBiz : HEAT.iceBiz;
  const reasonHeat = division === "food" ? HEAT.foodReason : HEAT.iceReason;
  const listHeat = division === "food" ? HEAT.foodList : HEAT.iceList;

  // 氷ができるまで（活用提案）内の要確認スロット
  const recipePendingVal = txt(`division:ice.recipeIdeas.pending`, "");

  return (
    <>
      {/* メインビジュアル（高さは会社情報ページに合わせる・タイトル中央・タイトルも編集可能） */}
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-ink">
        <ImageWithFallback src={MV[division].img} alt={divTitle} loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" {...edImg(division === "food" ? "images:IMG.foodMv" : "images:IMG.iceMv", "メインビジュアル画像")} />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-5 text-center pc:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-3 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }} {...ed(`division:${division}.mv.en`, "英語見出し（補助）")}>
              {txt(`division:${division}.mv.en`, mv.en)}
            </p>
            <h1 className="text-white" style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.2 }} {...ed(`division:${division}.mv.title`, "ページタイトル")}>
              {divTitle}
            </h1>
            <p className="mt-4 text-white/85" style={{ fontSize: 16 }} {...ed(`division:${division}:mvLead`, "MVリード文")}>{txt(`division:${division}:mvLead`, mv.lead)}</p>
          </motion.div>
        </div>
      </section>

      {/* 事業概要（ブランドレッド背景・上下パディングは通常の半分。赤帯はタイトル＋本文まで） */}
      <Section heat={bizHeat} className="bg-[#E60012] py-10 tab:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <SectionTitle en="OUR BUSINESS" jp="事業概要" align="center" invert path={`division:${division}.overview`} />
          <RichBody
            path={`division:${division}.overview`}
            text={txt(`division:${division}.overview`, OVERVIEW[division])}
            label="事業概要"
            className="mt-6 text-left text-white/90 pc:text-center"
            style={{ fontSize: 16, lineHeight: 2.1 }}
          />
        </div>
      </Section>

      {/* 氷・氷菓：商品ラインナップ導線（赤帯の外・画像＋グレーオーバーレイ＋白文字のボタン） */}
      {division === "ice" && (
        <Section heat={bizHeat} className="bg-transparent py-10 tab:py-12">
          <div className="mx-auto grid max-w-5xl gap-5 tab:grid-cols-3">
            {ICE_LINEUP_NAV.map((def, i) => (
              <LineupNavTile key={i} i={i} def={def} />
            ))}
          </div>
        </Section>
      )}

      {/* 商品一覧より上のセクション（シート準拠） */}
      {DETAIL_PRE[division].map((sec, si) => (
        <DetailSectionBlock key={si} division={division} si={si} sec={sec} heat={si % 2 ? listHeat : reasonHeat} />
      ))}

      {/* ── 氷・氷菓：製品ラインナップ（シートのカテゴリ分け通り） ── */}
      {division === "ice" && (
        <Section heat={listHeat} id="ice-lineup">
          <SectionTitle en="LINEUP" jp="製品ラインナップ" path="division:ice.lineup" />
          <div className="mt-12 space-y-16">
            {/* ドライアイス（内容は「ドライアイスの販売」ページ準拠・詳細はECサイトへ） */}
            <div>
              <h3 className="border-b border-border pb-3 text-brand" style={{ fontSize: 22, fontWeight: 800 }} {...ed("ice:lineup.dryice.name", "カテゴリ名")}>
                {txt("ice:lineup.dryice.name", DRYICE_LINEUP.name)}
              </h3>
              <p className="mt-5 max-w-3xl text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed("ice:lineup.dryice.desc", "カテゴリ説明", { multiline: true })}>
                {txt("ice:lineup.dryice.desc", DRYICE_LINEUP.desc)}
              </p>
              <div className="mt-8 grid gap-8 pc:grid-cols-[1fr_2fr]">
                {/* 規格一覧 */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-muted-foreground" style={{ fontSize: 12, letterSpacing: "0.08em" }}>規格一覧</p>
                  <p className="mt-3" style={{ fontSize: 14, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed("ice:lineup.dryice.skus", "規格一覧", { multiline: true })}>
                    {txt("ice:lineup.dryice.skus", DRYICE_LINEUP.skus)}
                  </p>
                </div>
                {/* ECサイトへの導線カード */}
                <div className="grid content-start gap-5 tab:grid-cols-2 pc:grid-cols-3">
                  <div>
                    <DryIceLineupCard ecUrl={txt("ice:lineup.dryice.ecUrl", DRYICE_LINEUP.ecUrl)} />
                    <EditableLinkHint path="ice:lineup.dryice.ecUrl" label="ドライアイス ECサイトURL" href={txt("ice:lineup.dryice.ecUrl", DRYICE_LINEUP.ecUrl)} />
                  </div>
                </div>
              </div>
            </div>
            {ICE_CATEGORIES.map((cat, ci) => (
              <div key={ci}>
                <h3 className="border-b border-border pb-3 text-brand" style={{ fontSize: 22, fontWeight: 800 }} {...ed(`ice:lineup.${ci}.name`, "カテゴリ名")}>
                  {txt(`ice:lineup.${ci}.name`, cat.name)}
                </h3>
                <p className="mt-5 max-w-3xl text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed(`ice:lineup.${ci}.desc`, "カテゴリ説明", { multiline: true })}>
                  {txt(`ice:lineup.${ci}.desc`, cat.desc)}
                </p>
                <div className="mt-8 grid gap-8 pc:grid-cols-[1fr_2fr]">
                  {/* 規格一覧 */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <p className="text-muted-foreground" style={{ fontSize: 12, letterSpacing: "0.08em" }}>規格一覧</p>
                    <p className="mt-3" style={{ fontSize: 14, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed(`ice:lineup.${ci}.skus`, "規格一覧", { multiline: true })}>
                      {txt(`ice:lineup.${ci}.skus`, cat.skus)}
                    </p>
                  </div>
                  {/* 対応する商品詳細ページ */}
                  <div className="grid content-start gap-5 tab:grid-cols-2 pc:grid-cols-3">
                    {cat.products.map((id) => (
                      <ProductCard key={id} division="ice" id={id} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 業務用食材：取り扱い商品カテゴリ（検索モックアップ） ── */}
      {division === "food" && (
        <Section heat={listHeat}>
          <SectionTitle en="PRODUCTS" jp="取り扱い商品カテゴリ" path="division:food.products" />
          <p className="mt-6 max-w-3xl text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed("division:food.products.intro", "取り扱い商品カテゴリ 説明", { multiline: true })}>
            {txt("division:food.products.intro", "取扱商品の主要カテゴリは食用油・輸入鶏肉をはじめとする業務用食材です。")}
          </p>
          {/* 要確認：カテゴリ一覧と代表商品名 */}
          {(txt("division:food.products.categories", "") || EDIT_MODE) && (
            <p className="mt-4 max-w-3xl text-muted-foreground" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed("division:food.products.categories", "カテゴリ一覧と代表商品名（要確認・未確定）", { multiline: true })}>
              {txt("division:food.products.categories", PENDING_HINT)}
            </p>
          )}
          <FoodSearchMock />
        </Section>
      )}

      {/* ── 業務用食材：おすすめパッケージ ── */}
      {division === "food" && (
        <Section heat={reasonHeat} id="packages">
          <SectionTitle en="PACKAGES" jp="おすすめパッケージ" path="division:food.packages" />
          <p className="mt-4 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.9 }}>
            業態や季節に合わせて、よく使われる商品を組み合わせたおすすめのセットをご提案しています。
          </p>
          <div className="mt-10 grid gap-6 pc:grid-cols-3">
            {FOOD_PACKAGES.map((pkg, i) => (
              <Link
                key={pkg.id}
                to={`/food/packages/${pkg.id}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-8 transition-colors hover:border-brand"
              >
                <span className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.5 }} {...ed(`package:${pkg.id}.title`, "パッケージ名")}>
                  {txt(`package:${pkg.id}.title`, pkg.title)}
                </h3>
                <p className="mt-3 flex-1 text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.9 }} {...ed(`package:${pkg.id}.lead`, "リード")}>
                  {txt(`package:${pkg.id}.lead`, pkg.lead)}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-brand" style={{ fontSize: 13 }}>
                  セット内容を見る <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ── 氷・氷菓：活用提案・メニューレシピ ── */}
      {division === "ice" && (
        <Section heat={HEAT.iceRecipe} id="ice-recipe">
          <SectionTitle en="RECIPE IDEAS" jp="活用提案・メニューレシピ" path="division:ice.recipeIdeas" />
          {/* 氷カフェが生まれた理由 */}
          <div className="mt-10 rounded-2xl border border-border bg-card p-8">
            <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed("division:ice.recipeIdeas.storyTitle", "見出し")}>
              {txt("division:ice.recipeIdeas.storyTitle", "氷カフェが生まれた理由")}
            </h3>
            <p className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed("division:ice.recipeIdeas.story", "本文", { multiline: true })}>
              {txt("division:ice.recipeIdeas.story", ICE_RECIPE_STORY)}
            </p>
          </div>

          {/* メニューレシピ（既存のレシピアコーディオン） */}
          <h3 className="mt-14" style={{ fontSize: 20, fontWeight: 700 }}>メニューレシピ</h3>
          <p className="mt-3 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.9 }}>
            氷カフェ・カクテル氷・雪氷を使った、お店でそのまま使えるレシピメニュー。
          </p>
          {/* 要確認：QRコード案内のレシピ内容・動画コンテンツ */}
          {(recipePendingVal || EDIT_MODE) && (
            <p className="mt-3 max-w-3xl text-muted-foreground" style={{ fontSize: 14, lineHeight: 2, whiteSpace: "pre-line" }} {...ed("division:ice.recipeIdeas.pending", "メニューレシピ補足（要確認・未確定）", { multiline: true })}>
              {recipePendingVal || PENDING_HINT}
            </p>
          )}
          <div className="mt-8 space-y-4">
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

      {/* 商品一覧より下のセクション（お客様の声・環境への取り組み） */}
      {DETAIL_POST[division].map((sec, si) => (
        <DetailSectionBlock key={si} division={division} si={si + 10} sec={sec} heat={si % 2 ? reasonHeat : bizHeat} />
      ))}

      {/* よくあるご質問（回答が未確定の設問は公開ページでは非表示） */}
      {(FAQ[division].some((f, i) => !f.pending || txt(`division:${division}.faq.${i}.a`, "") !== "") || EDIT_MODE) && (
        <Section heat={reasonHeat}>
          <SectionTitle en="FAQ" jp="よくあるご質問" path={`division:${division}.faq`} />
          <div className="mt-10 space-y-4">
            {FAQ[division].map((f, i) => {
              const a = txt(`division:${division}.faq.${i}.a`, f.pending ? "" : f.a ?? "");
              if (f.pending && !a && !EDIT_MODE) return null;
              return (
                <div key={i} className="rounded-xl border border-border bg-card p-6">
                  <p className="flex gap-3" style={{ fontSize: 16, fontWeight: 700 }}>
                    <span className="text-brand" style={{ fontFamily: "var(--font-accent)" }}>Q.</span>
                    <span {...ed(`division:${division}.faq.${i}.q`, "質問")}>{txt(`division:${division}.faq.${i}.q`, f.q)}</span>
                  </p>
                  <p className="mt-3 flex gap-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2 }}>
                    <span className="text-muted-foreground" style={{ fontFamily: "var(--font-accent)", fontWeight: 700 }}>A.</span>
                    <span style={{ whiteSpace: "pre-line" }} className={f.pending && !a ? "text-muted-foreground" : ""} {...ed(`division:${division}.faq.${i}.a`, f.pending ? "回答（要確認・未確定）" : "回答", { multiline: true })}>
                      {a || (f.pending ? PENDING_HINT : "")}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* お問い合わせ（ページ別の問い合わせ先。未入力の間は非表示） */}
      <ContactSection base={`division:${division}`} heat={listHeat} />
    </>
  );
}
