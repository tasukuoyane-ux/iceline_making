// 商品データ。掲載項目は確定資料に準拠、個別の商品実データはモックで補完。

export type Division = "food" | "ice";

export interface Product {
  id: string;
  division: Division;
  name: string;
  genre: string;
  catch: string;
  image: string; // unsplash query key（実装で画像import）
  spec: string;
  netWeight: string;
  ingredients: string;
  allergens: string;
  storage: string;
  bestBefore: string;
  certification: string;
  recipe?: string;
}

export const PRODUCT_GENRES: { label: string; division: Division }[] = [
  { label: "業務用氷", division: "ice" },
  { label: "カップ氷", division: "ice" },
  { label: "フレーバーアイス", division: "ice" },
  { label: "ドライアイス", division: "food" },
  { label: "冷凍食品", division: "food" },
  { label: "業務用食材", division: "food" },
];

export const PRODUCTS: Product[] = [
  // アイス事業部
  {
    id: "ice-cube-pro",
    division: "ice",
    name: "業務用 純氷キューブ",
    genre: "業務用氷",
    catch: "飲食の現場を支える、欠かさない氷。",
    image: "ice cubes glass",
    spec: "角氷 / 約25mm角",
    netWeight: "1.1kg / 袋",
    ingredients: "水",
    allergens: "なし",
    storage: "−18℃以下で保存",
    bestBefore: "製造日より製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
  },
  {
    id: "cup-ice-coffee",
    division: "ice",
    name: "コーヒー用 カップ入り氷",
    genre: "カップ氷",
    catch: "コンビニのアイスコーヒーに、最適化された氷。",
    image: "iced coffee cup",
    spec: "カップ入りクラッシュ / ロック",
    netWeight: "240g / 個",
    ingredients: "水",
    allergens: "なし",
    storage: "−18℃以下で保存",
    bestBefore: "製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
  },
  {
    id: "flavored-ice",
    division: "ice",
    name: "フレーバーアイス（色・味付き）",
    genre: "フレーバーアイス",
    catch: "誰も作っていなかった、色と味のある氷。",
    image: "colorful flavored ice",
    spec: "色付き / 味付きキューブ",
    netWeight: "500g / 袋",
    ingredients: "水、糖類、香料、着色料",
    allergens: "商品により異なる（表示参照）",
    storage: "−18℃以下で保存",
    bestBefore: "製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
    recipe: "カクテルやソーダ割りに。溶けるほど色と香りが広がります。",
  },
  // 食品事業部
  {
    id: "dry-ice",
    division: "food",
    name: "ドライアイス",
    genre: "ドライアイス",
    catch: "温度の面から、低温物流を支える。",
    image: "dry ice fog",
    spec: "ブロック / ペレット / スライス",
    netWeight: "用途に応じて加工",
    ingredients: "二酸化炭素（固体）",
    allergens: "なし",
    storage: "専用保冷容器で保管",
    bestBefore: "—（昇華性）",
    certification: "FSSC 22000 / ISO 準拠の管理",
  },
  {
    id: "frozen-foods",
    division: "food",
    name: "ホテル・レストラン向け冷凍食品",
    genre: "冷凍食品",
    catch: "プロの厨房に、確かな品質を。",
    image: "frozen food kitchen",
    spec: "業務用冷凍食材",
    netWeight: "商品により異なる",
    ingredients: "商品により異なる（表示参照）",
    allergens: "商品により異なる（表示参照）",
    storage: "−18℃以下で保存",
    bestBefore: "商品表示に準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
  },
  {
    id: "pro-ingredients",
    division: "food",
    name: "業務用食材",
    genre: "業務用食材",
    catch: "現場の困りごとに、先回りする品揃え。",
    image: "restaurant ingredients",
    spec: "5,000品目超の取り扱い",
    netWeight: "商品により異なる",
    ingredients: "商品により異なる（表示参照）",
    allergens: "商品により異なる（表示参照）",
    storage: "商品により異なる",
    bestBefore: "商品表示に準ずる",
    certification: "FSSC 22000 / ISO 認証管理",
  },
];

// MV下・事業紹介セクション（コピー＋事業内容 約200文字）
export const DIVISION_BIZ: Record<
  Division,
  { copy: string; body: string }
> = {
  food: {
    copy: "食の現場に、深く根を張る。",
    body:
      "岡山市北区青江の物流センターから、5,000品目を超える商品が、毎日岡山県全域へ届けられています。県内シェアトップ——それは特別な営業力によるものではなく、日々の配送を一日も欠かさず積み重ねてきた結果です。食の選択肢を広げ、お客様の「欲しい」に応えるために、一人一人が日々の仕事と向き合っています。",
  },
  ice: {
    copy: "岡山の氷を、日本の氷に。",
    body:
      "取引先は、量販店、テーマパーク、飲食店など多岐にわたります。届けている商品も一つではありません。ロッキーアイス、味付き氷、デザートのメニュー提案を含めた商品など、相手に応じて組み合わせが変わります。透明な氷から始まったアイスラインの歴史は、今も少しずつ広がっています。色のある氷、味のある氷——まだ誰も作っていなかった商品も、ここから生まれています。",
  },
};

// 氷のレシピ（複数階層）。出典: https://www.iceline.co.jp/services/ice/recipe/
export const ICE_RECIPES: {
  category: string;
  items: { name: string; note: string }[];
}[] = [
  {
    category: "かき氷",
    items: [
      { name: "いちごミルク", note: "純氷のふわふわ食感" },
      { name: "抹茶あずき", note: "宇治抹茶と粒あん" },
      { name: "マンゴーレモン", note: "果実感たっぷり" },
    ],
  },
  {
    category: "ドリンク",
    items: [
      { name: "アイスコーヒー", note: "溶けにくいロック氷" },
      { name: "クラフトレモネード", note: "色付き氷で華やかに" },
      { name: "フルーツソーダ", note: "味付き氷が溶けて変化" },
    ],
  },
  {
    category: "カクテル",
    items: [
      { name: "モヒート", note: "クラッシュアイス" },
      { name: "ジントニック", note: "大粒の透明氷" },
    ],
  },
  {
    category: "デザート",
    items: [
      { name: "フローズンフルーツ", note: "凍らせて即一品" },
      { name: "アイスフラワー", note: "花を閉じ込めた氷" },
    ],
  },
];

export const DIVISION_INFO: Record<
  Division,
  { label: string; reasonCatch: string; reasonBody: string }
> = {
  food: {
    label: "食品事業部",
    reasonCatch: "現場に通い続けるから、見えることがある。",
    reasonBody:
      "担当者はルートと営業を兼務しています。毎日現場に通うからこそ、在庫の変化も、売れ筋の移り変わりも、現場の空気も見えてくる。気になることがあればその場で提案し、依頼を待つのではなく、必要なものを先回りして考える。お客様一社一社の状況を丁寧に把握しながら、長く寄り添える関係を積み上げていきます。",
  },
  ice: {
    label: "アイス事業部",
    reasonCatch: "氷を、再定義する。",
    reasonBody:
      "人気テーマパークのメニューから、コンビニエンスストア、街の喫茶店まで。アイスラインの氷は、全国の食の現場で使われています。選ばれ続けている理由はシンプルです。欠品を出さないことを、最優先にしているから。季節の波があっても、急な需要の変動があっても、営業と製造が動いて在庫を調整する。そして、氷そのものを進化させ続けています。色のある氷、味のある氷——誰も作っていなかった商品を、市場に送り出し続けています。「冷たいものならアイスライン」——そう覚えてもらえるように、岡山から全国へ動いています。",
  },
};
