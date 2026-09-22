import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Minus, Plus, Search } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { ContactSection } from "../components/common/ContactSection";
import { RichBody } from "../components/common/RichBody";
import { PageMv } from "../components/common/PageMv";
import { Input } from "../components/ui/input";
import { HEAT } from "../data/heatMap";
import { IMG, PRODUCT_IMG } from "../data/images";
import { Division, ICE_RECIPES } from "../data/products";
import { ed, edImg, txt, img, ratioCols, ratioAttrs, repeatSel, EDIT_MODE } from "../lib/editable";
import { rt, rich } from "../lib/richInline";

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
  /** true なら白カードの中に画像と文章を横並びで表示（製造体制・こだわり） */
  card?: boolean;
  /** true なら画像の一部が文章の下に回り込むレイアウト（透過PNG向け・枠や座布団なし）。
   * 画像の幅（サイズ）・左右はコンソールの「画像の幅」「左右入れ替え」、縦横比・透明度は
   * 画像欄の「縦横比」「透明度」で調整できる（2026-09 改修） */
  overlapImage?: boolean;
  /** overlapImage 用：本文の上に大きく赤字で出す短いテキスト（例「No.1」）の既定値。
   * コンソールの「強調テキスト」で編集。空にすると公開ページでは非表示（2026-09-14 追加） */
  badge?: string;
  /** true なら 画像 → 中央寄せの赤い見出し → 本文 の縦積みレイアウト（サプライチェーン。2026-09-14 追加） */
  stackImage?: boolean;
  /** 既存アップロード画像を引き継ぐ場合の明示キー */
  imgKey?: string;
}
interface DetailSection {
  en: string;
  jp: string;
  items: DetailItem[];
  /** true なら項目の下に工程フロー（写真＋工程名、最大10ステップ）を表示 */
  flow?: boolean;
  /** セクション末尾の大きな CTA ボタン（例: 氷・氷菓事業の特徴 → 製造方法ページ。2026-09-14 追加）。
   * 文言はコンソールの「CTAボタン文言」で編集できる */
  cta?: { label: string; to: string };
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
    // 岡山県内トップシェア（2026-09 改修）：旧「事業の特徴」の1項目目を独立した
    // H2 セクションに格上げ。本文・画像は features.0 から topshare.0 へ移行済み
    // （overrides.json）。見出しはセクション見出し（H2）として表示するため項目側に
    // H3 は置かない。サプライチェーンより上に置く（2026-09 並び替え。pathKey で編集パスは不変）。
    {
      en: "TOP SHARE",
      jp: "岡山県内トップシェア",
      pathKey: "topshare",
      items: [{ pending: true, image: true, overlapImage: true, badge: "No.1" }],
    },
    {
      en: "SUPPLY CHAIN",
      jp: "サプライチェーン",
      pathKey: "supply",
      // 2026-09-14: 画像（工程図）→ 中央寄せの赤い見出し → 本文 の縦積み
      items: [{ title: "（見出し）", pending: true, image: true, stackImage: true }],
    },
    {
      en: "FEATURES",
      jp: "事業の特徴",
      pathKey: "features",
      // 旧1項目目（岡山県内トップシェア）は上の独立セクションへ移動（2026-09 改修）
      items: [
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
      // 3項目目はコンソールの「消す」指定により削除（2026-08 改修）
      // 2項目目（幅広い調達網）は画像が文章の下に回り込むレイアウト（2026-09 改修）
      items: [
        { title: "（見出し）", pending: true, image: true },
        { title: "（見出し）", pending: true, image: true, overlapImage: true },
      ],
    },
  ],
  ice: [
    // 旧「選ばれる理由」は 2026-08 改修で「製造体制」「こだわり」へ分割したのち、
    // 「製造体制」セクションと「こだわり」の3項目目はコンソールの「消す」指定により削除。
    // カードの中に画像と文章が横並びのレイアウト・要確認スロット
    // （本文が入力されるまで公開ページでは非表示）。
    // pathKey は固有キーで、既存セクションの編集パス（sec.0 / sec.2）に影響しない。
    {
      en: "COMMITMENT",
      jp: "こだわり",
      pathKey: "kodawari",
      items: [
        { title: "（見出し）", pending: true, card: true },
        { title: "（見出し）", pending: true, card: true },
      ],
      // セクション末尾：製造方法ページ（/ice/process）への大きな CTA（2026-09-14 追加）
      cta: { label: "製造方法はこちら", to: "/ice/process" },
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

// 氷・氷菓ページから製造方法ページ（/ice/process。IceProcess.tsx）へ移したセクション（2026-09-14）。
// 定義・編集パス（sec.0 / sec.2）はそのまま共用し、氷・氷菓ページ側では表示しない
const ICE_PROCESS_KEYS = ["0", "2"];
export const ICE_PROCESS_SECTIONS: DetailSection[] = DETAIL_PRE.ice.filter((sec) => ICE_PROCESS_KEYS.includes(sec.pathKey ?? ""));

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
// 氷・氷菓の製品ラインナップ（2026-09-21 改修：手描きラフ準拠）。
// 先頭の製氷（ロッキーアイスシリーズ）は 2:3 の画像＋テキストの横組みで大きく、
// それ以外の商品は 3 列組のカード（3:2 の画像／H3／コピー／こんな使い方／規格一覧アコーディオン）。
// カードはコンソールで枚数を増減できる（ice:lineup.items.count、上限 MAX_LINEUP_ITEMS）。
// product は既存の商品詳細ページ（/ice/products/:id）との対応（画像のリンク先。コンソールで変更可）。
// 旧デザインの「カテゴリ説明」は、製氷は本文として残し、他の商品は「こんな使い方」に要約して引き継いだ。
// ─────────────────────────────────────────────────────────
type LineupItem = { name: string; copy: string; body: string; usage: string; skus: string; product: string };
const ICE_LINEUP_HERO: LineupItem = {
  name: "製氷（ロッキーアイスシリーズ）",
  copy: "硬く透明で、溶けにくい。",
  body:
    "純度の高い原料水を低温でじっくり凍らせた、硬く透明で溶けにくい業務用かち割り氷です。溶けても飲み物の味を損なわず、食品本来のおいしさをそのままお届けします。",
  usage:
    "ハイボールやロックに。溶けにくいので、最後の一口まで味が薄まりません。バー・居酒屋の定番から、量販店のかち割り氷まで幅広くお使いいただけます。",
  skus:
    "・ロッキーアイス チャック付き（1kg×12）\n・ロッキーアイス 2kg（2kg×6）\n・ロッキーアイス 3kg（3kg×4）\n・ROCKY650（650g×18）\n・プレミアムな氷 オンザロックICE（6個×8×2台）オンザロック専用\n・アイス平（1.7kg×6）板状アイス\n・ブロックアイス（3.75kg×4）\n・ROCKYカップ 130g（130g×12×4合）\n・ROCKYカップ 180g（180g×12×3合）",
  product: "rocky-ice",
};
const MAX_LINEUP_ITEMS = 9;
const ICE_LINEUP_ITEMS: LineupItem[] = [
  {
    name: "雪氷・雪氷果肉入り",
    copy: "ふわふわに削った、かき氷の氷。",
    body: "",
    usage:
      "氷削り機やブレンダーマシンなしで、かき氷・スムージーに。一袋使い切りタイプなので衛生的に使え、原価計算も容易です。",
    skus: "・雪氷（200g）\n・雪氷果肉入り いちご（100g×18袋）\n・雪氷果肉入り マンゴー（100g×18袋）\n・雪氷果肉入り レモン（100g×18袋）",
    product: "snow-ice",
  },
  {
    name: "氷カフェ",
    copy: "溶けるほどに、味が広がる。",
    body: "",
    usage:
      "グラスに入れて牛乳を注ぐだけでアイスカフェラテに。コーヒーや抹茶を凍らせたチップアイスなので、溶けても薄まらず味が深まります。特別な機械も技術も不要です。",
    skus: "氷カフェ（60g×20袋）\n・コーヒー\n・抹茶\n・いちご\n・ほうじ茶",
    product: "ice-cafe",
  },
  {
    name: "カクテル用アイス",
    copy: "味と彩りの、果汁氷。",
    body: "",
    usage:
      "果汁を凍らせた氷をグラスに入れて、炭酸やお酒を注ぐだけでフルーツカクテルに。溶けるほどに果実の味と色が広がります。",
    skus: "カクテル用アイス（80g×20袋）\n・マンゴー\n・巨峰\n・青りんご\n・レモン",
    product: "cocktail-ice",
  },
  {
    name: "フラペリッチ",
    copy: "注ぐだけの、フローズンドリンク。",
    body: "",
    usage:
      "牛乳を注ぐだけでスムージーに。抹茶やコーヒーの氷に小豆やチョコチップ、クランチをあらかじめ混ぜ込んでいるので、ブレンダーも仕込みも不要。設備投資なしで新メニューを導入できます。",
    skus: "・フラペリッチ 宇治抹茶小豆入り（100g×18袋）\n・フラペリッチ コーヒー",
    product: "frappe-rich",
  },
  {
    name: "炭酸氷",
    copy: "溶けると弾ける、炭酸入りの氷。",
    body: "",
    usage: "ドリンクに入れると、溶けるにつれて炭酸が弾けます。ソフトドリンクやカクテルの演出に。",
    skus: "",
    product: "carbonated-ice",
  },
];

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
  { name: "輸入鶏もも肉", category: "食肉", temp: "冷凍", spec: "2kg×6" },
  { name: "輸入鶏むね肉", category: "食肉", temp: "冷凍", spec: "2kg×6" },
  { name: "若鶏手羽先", category: "食肉", temp: "冷凍", spec: "2kg" },
  { name: "豚バラスライス", category: "食肉", temp: "冷凍", spec: "1kg" },
  { name: "牛カルビスライス", category: "食肉", temp: "冷凍", spec: "1kg" },
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

/** 1行に収める見出し（2026-09-21 追加）。style.fontSize（clamp 等）を最大として、親幅からはみ出す場合だけ
 * 縮小して折り返さずに表示する。文言の変更（コンソール編集）やリサイズで再計算する。 */
function FitOneLine({ style, className, children, ...rest }: { style: CSSProperties; className?: string; children: ReactNode } & Record<string, unknown>) {
  const ref = useRef<HTMLParagraphElement>(null);
  const maxSize = String(style.fontSize ?? "");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = maxSize;
      const base = parseFloat(getComputedStyle(el).fontSize) || 0;
      const avail = el.clientWidth;
      const need = el.scrollWidth;
      if (base > 0 && need > avail && avail > 0) el.style.fontSize = `${Math.floor(base * (avail / need) * 100) / 100}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    const mo = new MutationObserver(fit);
    mo.observe(el, { childList: true, characterData: true, subtree: true });
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [maxSize]);
  return (
    <p ref={ref} className={className} style={{ ...style, whiteSpace: "nowrap", maxWidth: "100%" }} {...rest}>
      {children}
    </p>
  );
}

/** 編集モード限定：リンク先URLをテキストとして編集するための行 */
function EditableLinkHint({ path, label, href }: { path: string; label: string; href: string }) {
  if (!EDIT_MODE) return null;
  return (
    <p className="mt-1.5 break-all text-muted-foreground" style={{ fontSize: 11 }} {...ed(path, label)}>
      {rich(href)}
    </p>
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
  // PCの列数：6個以上のときは半分の個数（四捨五入）で改行して行を揃える
  // （例 6個→3+3、7個→4+3。5個以下は従来どおり最大5列の1行）。
  const pcCols = visible.length >= 6 ? Math.round(visible.length / 2) : 5;
  return (
    <div
      className="mt-4 grid grid-cols-2 gap-x-6 gap-y-10 tab:grid-cols-3 pc:gap-x-8 pc:[grid-template-columns:repeat(var(--pcols),minmax(0,1fr))]"
      style={{ ["--pcols" as any]: pcCols }}
    >
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
            {rich(s.title || (EDIT_MODE || s.i === 0 ? "（工程名）" : ""))}
          </p>
          {(s.body || EDIT_MODE) && (
            <p className="mt-1 text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-line" }} {...ed(`${s.base}.body`, `工程${s.i + 1} 説明`, { multiline: true })}>
              {rich(s.body || "（説明・任意）")}
            </p>
          )}
          {/* 次の工程への矢印（PCの行末＝折り返し位置では表示しない） */}
          {n < visible.length - 1 && (n + 1) % pcCols !== 0 && (
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
              {rt(`${base}.title`, it.title)}
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

  // 白カードの中に画像と文章が横並び（製造体制・こだわり）。
  // カードごとに画像とテキストの左右が交互に入れ替わる（奇数番目は画像が左）。
  // 左右はコンソールの「左右入れ替え」、幅は「画像の幅」スライダーでも調整できる
  if (it.card) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border bg-card p-6 pc:p-8"
      >
        <div
          className={`grid items-center gap-6 pc:gap-8 pc:[grid-template-columns:var(--ratio)] ${ii % 2 ? "pc:[direction:rtl]" : ""}`}
          style={{ ["--ratio" as any]: ratioCols(`${base}.ratio`, 45, false) }}
          {...ratioAttrs(`${base}.ratio`, 45, false, ii % 2 === 1)}
        >
          <div className="[direction:ltr]">
            {it.title && (
              <h3 className="text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.title`, "見出し")}>
                {rt(`${base}.title`, it.title)}
              </h3>
            )}
            <RichBody path={`${base}.body`} text={bodyText} label="本文" className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05 }} />
          </div>
          <ImageWithFallback
            src={img(`${base}.image`, IMG_PLACEHOLDER)}
            alt={it.title || secJp}
            className="aspect-[4/3] w-full rounded-xl object-cover [direction:ltr]"
            {...edImg(`${base}.image`, `${it.title || secJp} 画像`)}
          />
        </div>
      </motion.div>
    );
  }

  // 画像の一部が文章の下に回り込むレイアウト（岡山県内トップシェア・幅広い調達網。2026-09 改修）。
  // PC では画像を右側の列（幅＝「画像の幅」設定・既定 45%）に置き、文章ブロックを同じ行で
  // グリッドの全幅に張って重ねる。文章の最大幅は 65% 固定で、「画像の幅」を変えても文章側は
  // 変わらず画像だけが拡大・縮小する（重なり量は画像の幅に応じて変わる）。文章が前面（z-10）で、
  // 画像には枠・角丸・座布団を付けず、透過PNGがそのまま文章の下へ入る。
  // 画像列は「左右入れ替え」で左にも置ける（その場合は文章が右寄せになる）。
  // 縦横比（既定＝画像そのままの比率）は切り抜かずに収める（object-contain）。
  // SP では文章 → 画像の縦積み（画像は横幅 70% で中央）。
  if (it.overlapImage) {
    const imgPath = it.imgKey ?? `${base}.image`;
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid items-center gap-8 pc:gap-0 pc:[grid-template-columns:var(--ratio)]"
        style={{ ["--ratio" as any]: ratioCols(`${base}.ratio`, 45, false) }}
        {...ratioAttrs(`${base}.ratio`, 45, false)}
      >
        <div className="relative z-10 min-w-0 [direction:ltr] pc:col-start-1 pc:col-end-3 pc:row-start-1 pc:max-w-[65%]">
          {/* 強調テキスト（例「No.1」）：大きく赤字。空なら公開ページでは出さない（2026-09-14 追加） */}
          {(() => {
            const badge = txt(`${base}.badge`, it.badge ?? "");
            if (badge === "" && !EDIT_MODE) return null;
            // 折り返さず 1 行に収める（H2＋3px＝33px を最大に、幅に合わせて縮小。2026-09-22 ユーザー指定）
            return (
              <FitOneLine
                className={"mb-4 " + (badge ? "text-brand" : "text-muted-foreground")}
                style={{ fontFamily: "var(--font-accent)", fontSize: 33, fontWeight: 900, lineHeight: 1.2, letterSpacing: "0.02em" }}
                {...ed(`${base}.badge`, "強調テキスト（例: No.1）")}
              >
                {rich(badge || "（強調テキスト・任意）")}
              </FitOneLine>
            );
          })()}
          {it.title && (
            <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`${base}.title`, "見出し")}>
              {rt(`${base}.title`, it.title)}
            </h3>
          )}
          <RichBody path={`${base}.body`} text={bodyText} label="本文" className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05 }} />
        </div>
        <div className="[direction:ltr] pc:col-start-2 pc:row-start-1">
          <ImageWithFallback
            src={img(imgPath, IMG_PLACEHOLDER)}
            alt={it.title || secJp}
            className="mx-auto h-auto w-[70%] object-contain pc:w-full"
            {...edImg(imgPath, `${it.title || secJp} 画像（文章の下に回り込む）`, { opacity: true })}
          />
          {/* 画像の下：右から左へ消えていく赤いライン（2026-09-14 追加。太さ 6px・幅は画像幅） */}
          <div
            aria-hidden
            className="mx-auto mt-4 h-[6px] w-[70%] pc:w-full"
            style={{ background: "linear-gradient(to left, #E60012 0%, rgba(230,0,18,0.85) 45%, rgba(230,0,18,0) 100%)" }}
          />
        </div>
      </motion.div>
    );
  }

  // 画像（工程図など）を先頭に、赤い見出しを中央寄せ、本文を下に縦積み（サプライチェーン。2026-09-14 改修）
  if (it.stackImage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <ImageWithFallback
          src={img(it.imgKey ?? `${base}.image`, IMG_PLACEHOLDER)}
          alt={it.title || secJp}
          className="aspect-[16/9] w-full max-w-3xl rounded-2xl border border-border bg-card object-cover"
          data-keep-size="1"
          {...edImg(it.imgKey ?? `${base}.image`, `${it.title || secJp} 画像`)}
        />
        {it.title && (
          <h3 className="mt-8 text-center text-brand" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.6 }} {...ed(`${base}.title`, "見出し（赤・中央）")}>
            {rt(`${base}.title`, it.title)}
          </h3>
        )}
        <RichBody path={`${base}.body`} text={bodyText} label="本文" className="mt-4 w-full max-w-3xl text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05 }} />
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
              {rt(`${base}.title`, it.title)}
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
              {rt(`${base}.title`, it.title)}
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
          {rt(`${base}.title`, it.title)}
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
export function DetailSectionBlock({
  division,
  si,
  sec,
  heat,
  compact,
}: {
  division: Division;
  si: number;
  sec: DetailSection;
  heat: any;
  /** true なら縦マージン（セクション余白・見出し下・項目間）を 20% 詰める */
  compact?: boolean;
}) {
  const sk = sec.pathKey ?? String(si);
  const visible = sec.items.some((it, ii) => !it.pending || txt(`division:${division}.sec.${sk}.${ii}.body`, "") !== "");
  if (!visible && !EDIT_MODE) return null;
  return (
    <Section heat={heat} compact={compact}>
      <SectionTitle en={sec.en} jp={sec.jp} path={`division:${division}.sec.${sk}`} />
      <div className={compact ? "mt-[2.4rem] space-y-8" : "mt-12 space-y-10"}>
        {sec.items.map((it, ii) => (
          <DetailItemBlock key={ii} division={division} sk={sk} ii={ii} it={it} secJp={sec.jp} />
        ))}
        {sec.flow && <IceProcessFlow />}
      </div>
      {/* セクション末尾の大きな CTA ボタン（文言はコンソールで編集可） */}
      {sec.cta && (
        <div className="mt-12 text-center">
          <Link
            to={sec.cta.to}
            className="inline-flex items-center justify-center gap-3 bg-brand px-12 py-5 text-brand-foreground transition-colors hover:bg-brand-dark"
            style={{ fontSize: 18, fontWeight: 700, minWidth: 320 }}
          >
            <span {...ed(`division:${division}.sec.${sk}.cta.label`, "CTAボタン文言")}>{rt(`division:${division}.sec.${sk}.cta.label`, sec.cta.label)}</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      )}
    </Section>
  );
}

/** 製品ラインナップ：商品画像のスライドショー（2026-09-21 改修）。
 * 画像は最大 MAX_SLIDES 枚（編集パス `${base}.image` `${base}.image2` … ）。2枚以上あるときだけ左右ボタンを表示し、
 * 自動では進まない。1枚目をクリックするとリンク先（既存の商品詳細ページ。コンソールで変更可）へ。
 * 編集モードでは全スロットを縦に並べて表示する（空のスロットはプレースホルダー）。 */
const MAX_SLIDES = 5;
function slidePath(base: string, n: number) {
  return n === 0 ? `${base}.image` : `${base}.image${n + 1}`;
}
function LineupImage({ base, label, def, aspect }: { base: string; label: string; def: LineupItem; aspect: string }) {
  const href = txt(`${base}.href`, def.product ? `/ice/products/${def.product}` : "");
  const name = txt(`${base}.name`, def.name);
  const [idx, setIdx] = useState(0);
  const slides = Array.from({ length: MAX_SLIDES }, (_, n) => img(slidePath(base, n), n === 0 ? PRODUCT_IMG[def.product] || IMG_PLACEHOLDER : "")).filter((src) => src !== "");
  const boxCls = `${aspect} w-full overflow-hidden rounded-xl bg-secondary`;

  if (EDIT_MODE) {
    return (
      <div className="space-y-2">
        {Array.from({ length: MAX_SLIDES }, (_, n) => {
          const path = slidePath(base, n);
          const src = img(path, n === 0 ? PRODUCT_IMG[def.product] || IMG_PLACEHOLDER : "");
          return (
            <div key={n} className={boxCls + (src ? "" : " flex items-center justify-center text-muted-foreground")} style={src ? undefined : { fontSize: 12 }}>
              {src ? (
                <ImageWithFallback src={src} alt={name} className="h-full w-full object-cover" {...edImg(path, `${label} 画像${n + 1}${n === 0 ? "" : "（任意）"}`)} />
              ) : (
                <span {...edImg(path, `${label} 画像${n + 1}（任意）`)}>画像{n + 1}（任意・クリックして設定）</span>
              )}
            </div>
          );
        })}
        <EditableLinkHint path={`${base}.href`} label={`${label} リンク先URL（空ならリンクなし）`} href={href || "（リンク先URL・任意）"} />
      </div>
    );
  }

  const cur = Math.min(idx, slides.length - 1);
  const track = (
    <div className="flex h-full w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${cur * 100}%)` }}>
      {slides.map((src, n) => (
        <ImageWithFallback key={n} src={src} alt={n === 0 ? name : `${name} ${n + 1}`} className="h-full w-full shrink-0 object-cover" data-keep-size="1" />
      ))}
    </div>
  );
  return (
    <div className="relative">
      {href ? (
        <Link to={href} className={"group block " + boxCls}>
          {track}
        </Link>
      ) : (
        <div className={boxCls}>{track}</div>
      )}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="前の画像"
            onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition-colors hover:bg-brand hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="次の画像"
            onClick={() => setIdx((i) => (i + 1) % slides.length)}
            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition-colors hover:bg-brand hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
          <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
            {slides.map((_, n) => (
              <span key={n} className={"h-1.5 w-1.5 rounded-full " + (n === cur ? "bg-brand" : "bg-white/80")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** 製品ラインナップ：「こんな使い方」ボックス（薄紅色の座布団にラベル＋本文。枠線・アイコンなし） */
function LineupUsage({ base, label, def }: { base: string; label: string; def: LineupItem }) {
  const usage = txt(`${base}.usage`, def.usage);
  if (!usage && !EDIT_MODE) return null;
  return (
    <div className="mt-5 rounded-xl bg-brand/[0.04] p-4 pc:p-5">
      <p className="text-brand" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>
        <span {...ed(`${base}.usageLabel`, `${label} 使い方ラベル`)}>{rt(`${base}.usageLabel`, "こんな使い方")}</span>
      </p>
      <p className="mt-2" style={{ fontSize: 14, lineHeight: 1.95, whiteSpace: "pre-line" }} {...ed(`${base}.usage`, `${label} こんな使い方`, { multiline: true })}>
        {rich(usage || "（使い方の提案を入力してください）")}
      </p>
    </div>
  );
}

/** 製品ラインナップ：規格一覧アコーディオン（「・」始まりの行数を種類数として表示。編集モードでは既定で開く） */
function LineupSkus({ base, label, def }: { base: string; label: string; def: LineupItem }) {
  const [open, setOpen] = useState(EDIT_MODE);
  const skus = txt(`${base}.skus`, def.skus);
  const count = skus.split(/\r?\n/).filter((l) => l.trim().startsWith("・")).length;
  if (!skus && !EDIT_MODE) return null;
  return (
    <div className="mt-5 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-brand"
      >
        <span className="flex items-center gap-1.5" style={{ fontSize: 14, fontWeight: 700 }}>
          {open ? <Minus size={15} className="shrink-0 text-brand" /> : <Plus size={15} className="shrink-0 text-brand" />}
          規格一覧
          {count > 0 && (
            <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>（{count}種）</span>
          )}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="pb-4" style={{ fontSize: 14, lineHeight: 2, whiteSpace: "pre-line" }} {...ed(`${base}.skus`, `${label} 規格一覧`, { multiline: true })}>
            {rich(skus || "（規格一覧を入力してください。「・」で始めた行が種類数として数えられます）")}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 製品ラインナップ先頭：製氷（ロッキーアイスシリーズ）。2:3 の画像の横に H3／コピー／本文／こんな使い方／規格一覧 */
function LineupHero() {
  const base = "ice:lineup.hero";
  const def = ICE_LINEUP_HERO;
  const label = "製氷";
  const body = txt(`${base}.body`, def.body);
  return (
    <div className="rounded-2xl border border-border bg-card p-6 pc:p-8">
      <div className="grid gap-8 pc:grid-cols-[2fr_3fr] pc:gap-12">
        <div className="mx-auto w-full max-w-[420px] pc:max-w-none">
          <LineupImage base={base} label={label} def={def} aspect="aspect-[2/3]" />
        </div>
        <div className="flex flex-col justify-center">
          <h3 style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.4 }} {...ed(`${base}.name`, `${label} 商品名`)}>
            {rt(`${base}.name`, def.name)}
          </h3>
          <p className="mt-3 text-brand" style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.5 }} {...ed(`${base}.copy`, `${label} コピー`)}>
            {rt(`${base}.copy`, def.copy)}
          </p>
          {(body || EDIT_MODE) && (
            <p className="mt-4" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed(`${base}.body`, `${label} 本文`, { multiline: true })}>
              {rich(body || "（本文・任意）")}
            </p>
          )}
          <LineupUsage base={base} label={label} def={def} />
          <LineupSkus base={base} label={label} def={def} />
        </div>
      </div>
    </div>
  );
}

/** 製品ラインナップ：3 列組の商品カード。3:2 の画像の下に H3／コピー／（本文・任意）／こんな使い方／規格一覧 */
function LineupCard({ i }: { i: number }) {
  const def = ICE_LINEUP_ITEMS[i] ?? { name: "", copy: "", body: "", usage: "", skus: "", product: "" };
  const base = `ice:lineup.items.${i}`;
  const label = `商品${i + 1}`;
  const body = txt(`${base}.body`, def.body);
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <LineupImage base={base} label={label} def={def} aspect="aspect-[3/2]" />
      <h3 className="mt-4" style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.5 }} {...ed(`${base}.name`, `${label} 商品名`)}>
        {rt(`${base}.name`, def.name || "（商品名）")}
      </h3>
      <p className="mt-2 text-brand" style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.5 }} {...ed(`${base}.copy`, `${label} コピー`)}>
        {rt(`${base}.copy`, def.copy || "（コピー）")}
      </p>
      {(body || EDIT_MODE) && (
        <p className="mt-3" style={{ fontSize: 14, lineHeight: 1.95, whiteSpace: "pre-line" }} {...ed(`${base}.body`, `${label} 本文（任意・空なら非表示）`, { multiline: true })}>
          {rich(body || "（本文・任意。空なら表示しません）")}
        </p>
      )}
      <LineupUsage base={base} label={label} def={def} />
      <div className="mt-auto">
        <LineupSkus base={base} label={label} def={def} />
      </div>
    </div>
  );
}

export function DivisionPage({ division }: { division: Division }) {
  const mv = MV[division];
  const divTitle = txt(`division:${division}.mv.title`, mv.title);
  const [openCats, setOpenCats] = useState<string[]>([]);
  // 製品ラインナップの商品カード枚数（コンソールの「追加」「削除」で増減）
  const lineupRep = repeatSel("ice:lineup.items.count", ICE_LINEUP_ITEMS.length, MAX_LINEUP_ITEMS, "商品カードの数");
  const toggleCat = (c: string) =>
    setOpenCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const bizHeat = division === "food" ? HEAT.foodBiz : HEAT.iceBiz;
  const reasonHeat = division === "food" ? HEAT.foodReason : HEAT.iceReason;
  const listHeat = division === "food" ? HEAT.foodList : HEAT.iceList;

  // 氷ができるまで（活用提案）内の要確認スロット
  const recipePendingVal = txt(`division:ice.recipeIdeas.pending`, "");

  return (
    <>
      {/* メインビジュアル（2026-09-21 改修：白背景・30px マージン・角丸 18px の画像カード、
          白い座布団に黒文字のタイトル／英語見出し、本文は黒文字でカードの下。共通部品 PageMv）。
          業務用食材のMV画像は既定で上揃え（縦位置はコンソールの「縦位置」スライダーで上書き可） */}
      <PageMv
        imgSrc={MV[division].img}
        imgPath={division === "food" ? "images:IMG.foodMv" : "images:IMG.iceMv"}
        imgStyle={division === "food" ? { objectPosition: "center top" } : undefined}
        enPath={`division:${division}.mv.en`}
        enDef={mv.en}
        titlePath={`division:${division}.mv.title`}
        titleDef={mv.title}
        overviewPath={`division:${division}.overview`}
        overviewDef={OVERVIEW[division]}
        crumbs={[{ label: txt("nav:services", "サービス") }, { label: divTitle }]}
      />

      {/* 商品一覧より上のセクション（シート準拠） */}
      {DETAIL_PRE[division]
        .filter((sec) => !(division === "ice" && ICE_PROCESS_KEYS.includes(sec.pathKey ?? "")))
        .map((sec, si) => (
          <DetailSectionBlock key={sec.pathKey ?? si} division={division} si={si} sec={sec} heat={si % 2 ? listHeat : reasonHeat} />
        ))}

      {/* ── 氷・氷菓：製品ラインナップ（2026-09-21 改修：手描きラフ準拠。
          先頭に製氷を横組みで大きく、以下は 3 列組の商品カード。カード枚数はコンソールで増減） ── */}
      {division === "ice" && (
        <Section heat={listHeat} id="ice-lineup">
          <SectionTitle en="LINEUP" jp="製品ラインナップ" path="division:ice.lineup" />
          <div className="mt-12">
            <LineupHero />
          </div>
          <div className="mt-8 grid gap-6 tab:grid-cols-2 pc:grid-cols-3" {...lineupRep.attrs}>
            {Array.from({ length: MAX_LINEUP_ITEMS }, (_, i) => (
              <LineupCard key={i} i={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ── 業務用食材：取り扱い商品カテゴリ（検索モックアップ） ── */}
      {division === "food" && (
        <Section heat={listHeat}>
          <SectionTitle en="PRODUCTS" jp="取り扱い商品カテゴリ" path="division:food.products" />
          <p className="mt-6 max-w-3xl text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed("division:food.products.intro", "取り扱い商品カテゴリ 説明", { multiline: true })}>
            {rt("division:food.products.intro", "取扱商品の主要カテゴリは食用油・輸入鶏肉をはじめとする業務用食材です。")}
          </p>
          {/* 要確認：カテゴリ一覧と代表商品名 */}
          {(txt("division:food.products.categories", "") || EDIT_MODE) && (
            <p className="mt-4 max-w-3xl text-muted-foreground" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed("division:food.products.categories", "カテゴリ一覧と代表商品名（要確認・未確定）", { multiline: true })}>
              {rt("division:food.products.categories", PENDING_HINT)}
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
                  {rt(`package:${pkg.id}.title`, pkg.title)}
                </h3>
                <p className="mt-3 flex-1 text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.9 }} {...ed(`package:${pkg.id}.lead`, "リード")}>
                  {rt(`package:${pkg.id}.lead`, pkg.lead)}
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
              {rt("division:ice.recipeIdeas.storyTitle", "氷カフェが生まれた理由")}
            </h3>
            <p className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }} {...ed("division:ice.recipeIdeas.story", "本文", { multiline: true })}>
              {rt("division:ice.recipeIdeas.story", ICE_RECIPE_STORY)}
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
              {rich(recipePendingVal || PENDING_HINT)}
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

      {/* 商品一覧より下のセクション（お客様の声・環境への取り組み）。
          業務用食材ではコンテンツの縦マージンを 20% 詰める（2026-09 改修） */}
      {DETAIL_POST[division].map((sec, si) => (
        <DetailSectionBlock
          key={si}
          division={division}
          si={si + 10}
          sec={sec}
          heat={si % 2 ? reasonHeat : bizHeat}
          compact={division === "food"}
        />
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
                    <span {...ed(`division:${division}.faq.${i}.q`, "質問")}>{rt(`division:${division}.faq.${i}.q`, f.q)}</span>
                  </p>
                  <p className="mt-3 flex gap-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2 }}>
                    <span className="text-muted-foreground" style={{ fontFamily: "var(--font-accent)", fontWeight: 700 }}>A.</span>
                    <span style={{ whiteSpace: "pre-line" }} className={f.pending && !a ? "text-muted-foreground" : ""} {...ed(`division:${division}.faq.${i}.a`, f.pending ? "回答（要確認・未確定）" : "回答", { multiline: true })}>
                      {rich(a || (f.pending ? PENDING_HINT : ""))}
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
