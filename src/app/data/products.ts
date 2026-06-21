// 商品データ。掲載項目は確定資料に準拠、個別の商品実データはモックで補完。
// 事業部セクションのコピーは src/content/sections.json で管理（/console から編集可能）。
import sections from "../../content/sections.json";

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
  { label: "ロッキーアイス", division: "ice" },
  { label: "雪氷", division: "ice" },
  { label: "氷カフェ", division: "ice" },
  { label: "ドライアイス", division: "food" },
  { label: "冷凍食品", division: "food" },
  { label: "業務用食材", division: "food" },
];

export const PRODUCTS: Product[] = [
  // アイス事業部（iceline.co.jp/services/ice より）
  {
    id: "rocky-ice",
    division: "ice",
    name: "ロッキーアイス",
    genre: "ロッキーアイス",
    catch: "硬く、透明で、溶けにくい。",
    image: "rocky ice",
    spec: "角氷（チャック）1kg・2kg・3kg／ROCKY 650・カップ各種／プレミアムロックアイス／板氷・ブロック氷",
    netWeight: "1kg×12袋 ほか規格多数",
    ingredients: "水",
    allergens: "なし",
    storage: "−18℃以下で保存",
    bestBefore: "製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
    recipe: "独自の製氷技術で凍らせた、硬く透明で溶けにくい氷。飲み物や食品本来の味を、最後まで引き立てます。",
  },
  {
    id: "snow-ice",
    division: "ice",
    name: "雪氷（かき氷用）",
    genre: "雪氷",
    catch: "ふわふわに削れる、かき氷の氷。",
    image: "snow shaved ice",
    spec: "プレーン／いちご／マンゴー／シチリア産レモン",
    netWeight: "プレーン 200g×15／フレーバー 100g×18袋",
    ingredients: "水（フレーバーは果汁・糖類・香料 等）",
    allergens: "商品により異なる（表示参照）",
    storage: "−18℃以下で保存",
    bestBefore: "製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
  },
  {
    id: "ice-cafe",
    division: "ice",
    name: "氷カフェ",
    genre: "氷カフェ",
    catch: "溶けるほどに、味が広がる。",
    image: "ice cafe coffee",
    spec: "コーヒー／抹茶／いちご／ほうじ茶",
    netWeight: "60g×20袋×8",
    ingredients: "水、コーヒー・抹茶 等（商品により異なる）",
    allergens: "商品により異なる（表示参照）",
    storage: "−18℃以下で保存",
    bestBefore: "製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
    recipe: "牛乳やソーダを注ぐだけ。氷が溶けるほどに、本格的なカフェの一杯になります。",
  },
  {
    id: "cocktail-ice",
    division: "ice",
    name: "カクテル氷",
    genre: "カクテル氷",
    catch: "果汁を凍らせた、味と彩りの氷。",
    image: "cocktail fruit ice",
    spec: "マンゴー／青りんご／巨峰／レモン",
    netWeight: "80g×20袋×6",
    ingredients: "果汁、糖類、香料、着色料 等（商品により異なる）",
    allergens: "商品により異なる（表示参照）",
    storage: "−18℃以下で保存",
    bestBefore: "製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
    recipe: "ジュースやお酒に浮かべて。溶けるほどに、色と香りが広がります。",
  },
  {
    id: "frappe-rich",
    division: "ice",
    name: "フラペリッチ",
    genre: "フラペリッチ",
    catch: "注ぐだけの、フローズンドリンク。",
    image: "frozen frappe drink",
    spec: "宇治抹茶／コーヒー",
    netWeight: "100g×18袋×6",
    ingredients: "商品により異なる（表示参照）",
    allergens: "商品により異なる（表示参照）",
    storage: "−18℃以下で保存",
    bestBefore: "製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
    recipe: "牛乳を注いで混ぜるだけ。お店品質のフラッペが、手早く一杯仕上がります。",
  },
  {
    id: "carbonated-ice",
    division: "ice",
    name: "炭酸氷",
    genre: "炭酸氷",
    catch: "溶けると弾ける、炭酸入りの氷。",
    image: "sparkling soda ice",
    spec: "プレーン／レモン／メロン／ソーダ／グレープ／カップ／2Lドリンク用",
    netWeight: "1kg×8袋／カップ 7oz×1,000／2L×6 ほか",
    ingredients: "水、二酸化炭素（フレーバーは糖類・香料 等）",
    allergens: "商品により異なる（表示参照）",
    storage: "−18℃以下で保存",
    bestBefore: "製造ロットに準ずる",
    certification: "FSSC 22000 / ISO 認証工場製造",
  },
  // 食品事業部（iceline.co.jp/services/dryice より）
  {
    id: "dry-ice",
    division: "food",
    name: "ドライアイス",
    genre: "ドライアイス",
    catch: "幅広い用途に活躍する、−79℃。",
    image: "dry ice fog",
    spec: "ブロック（1kg〜約20kg）／各種スライス加工｜用途：舞台演出・柿の渋抜き・医療品/検体輸送・溶接 など",
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
> = sections.divisionBiz;

// 氷のレシピ。iceline.co.jp/services/ice/recipe/ のレシピメニューを移植。
// 画像は public/images/recipes/ にローカル保存したものを使用。
const RECIPE_IMG = "/images/recipes/";
export interface IceRecipeItem {
  id: string;
  name: string;
  image: string;
  materials: string[];
  steps: string[];
}
export const ICE_RECIPES: {
  category: string;
  items: IceRecipeItem[];
}[] = [
  {
    category: "ソフトドリンク",
    items: [
      {
        id: "frapperich-matcha-azuki",
        name: "フラペリッチ抹茶小豆",
        image: RECIPE_IMG + "drink02.jpg",
        materials: ["フラペリッチ／抹茶小豆 1袋", "牛乳 140〜160cc"],
        steps: ["フラペリッチと牛乳を容器に入れ、よく混ぜ合わせる"],
      },
      {
        id: "frapperich-choco",
        name: "フラペリッチショコラチョコチップ＆クランチ",
        image: RECIPE_IMG + "drink03.jpg",
        materials: ["フラペリッチ／ショコラチョコチップ＆クランチ 1袋", "牛乳 140〜160cc"],
        steps: ["フラペリッチと牛乳を容器に入れ、よく混ぜ合わせる"],
      },
      {
        id: "ichigo-milk-smoothie",
        name: "いちごミルクスムージー",
        image: RECIPE_IMG + "drink04.jpg",
        materials: ["雪氷／いちご果肉 1袋", "牛乳 140cc"],
        steps: ["雪氷と牛乳を容器に入れてよく混ぜる", "グラスに注ぐ"],
      },
      {
        id: "ole",
        name: "オーレ（コーヒー・抹茶・いちご・ココア）",
        image: RECIPE_IMG + "drink05.jpg",
        materials: ["氷カフェ／各種 1袋", "牛乳 150cc", "ガムシロップ お好みで"],
        steps: ["氷カフェをグラスに入れる", "牛乳を注ぐ"],
      },
      {
        id: "matcha-azuki",
        name: "抹茶あずき",
        image: RECIPE_IMG + "drink06.jpg",
        materials: ["氷カフェ／抹茶 1袋", "牛乳 140cc", "ゆであずき 30g"],
        steps: ["氷カフェをグラスに入れる", "牛乳を注ぐ", "あずきをトッピングする"],
      },
      {
        id: "vanilla-float",
        name: "バニラアイスフロート",
        image: RECIPE_IMG + "drink07.jpg",
        materials: ["氷カフェ／各種またはカクテル氷 1袋", "牛乳 130cc", "バニラアイス 30g"],
        steps: ["氷カフェをグラスに入れる", "牛乳を注ぐ", "バニラアイスをのせる"],
      },
      {
        id: "mango-orange",
        name: "マンゴーオレンジ",
        image: RECIPE_IMG + "drink08.jpg",
        materials: ["カクテル氷／マンゴー 1袋", "オレンジジュース 150cc"],
        steps: ["カクテル氷をグラスに入れる", "オレンジジュースを注ぐ"],
      },
      {
        id: "lychee-grape",
        name: "ライチグレープ",
        image: RECIPE_IMG + "drink10.jpg",
        materials: ["カクテル氷／巨峰 1袋", "ライチジュース 140cc"],
        steps: ["カクテル氷をグラスに入れる", "ライチジュースを注ぐ"],
      },
      {
        id: "tonyu",
        name: "豆乳",
        image: RECIPE_IMG + "drink11.jpg",
        materials: ["氷カフェ／各種またはカクテル氷 1袋", "豆乳 150cc", "ガムシロップ お好みで"],
        steps: ["氷カフェをグラスに入れる", "豆乳を注ぐ"],
      },
      {
        id: "tonyu-ichigo-banana",
        name: "豆乳いちごバナナシェイク",
        image: RECIPE_IMG + "drink12.jpg",
        materials: ["氷カフェ／いちご 1袋", "バナナ 100g", "豆乳 50cc", "練乳 小さじ1", "いちごソース 大さじ1", "ミント 1枚"],
        steps: ["バナナ・豆乳・練乳をなめらかになるまでブレンドする", "氷カフェを加えて軽く混ぜる", "グラスに注ぎ、いちごソースをかけ、ミントを飾る"],
      },
    ],
  },
  {
    category: "アルコール",
    items: [
      {
        id: "kahlua",
        name: "氷カフェカルーア",
        image: RECIPE_IMG + "drink13.jpg",
        materials: ["氷カフェ／コーヒー 1袋", "牛乳 110cc", "コーヒーリキュール 40cc"],
        steps: ["氷カフェをグラスに入れる", "リキュールを注ぐ", "牛乳を注ぐ"],
      },
      {
        id: "strawberry-cassis",
        name: "ストロベリーカシス",
        image: RECIPE_IMG + "drink14.jpg",
        materials: ["氷カフェ／いちご 1袋", "カシスリキュール 30cc", "トニックウォーター 適量"],
        steps: ["氷カフェをグラスに入れる", "リキュールを注ぐ", "トニックウォーターを注ぐ"],
      },
      {
        id: "crush-mango-orange",
        name: "クラッシュマンゴーオレンジ",
        image: RECIPE_IMG + "drink15.jpg",
        materials: ["カクテル氷／マンゴー 1袋", "ウォッカ 30cc", "オレンジジュース 140cc"],
        steps: ["カクテル氷をグラスに入れる", "ウォッカを注ぐ", "オレンジジュースを注ぐ"],
      },
      {
        id: "shari-mango-cocktail",
        name: "シャリシャリマンゴーとどっさり果実のカクテル",
        image: RECIPE_IMG + "drink16.jpg",
        materials: ["カクテル氷／マンゴー 1袋", "マンゴーリキュール 30cc", "ソーダ 90cc", "カットフルーツ 適量"],
        steps: ["フルーツをグラスに入れる", "カクテル氷を加える", "リキュールを注ぐ", "ソーダを注ぐ"],
      },
      {
        id: "double-apple",
        name: "ダブルアップルカクテル",
        image: RECIPE_IMG + "drink17.jpg",
        materials: ["カクテル氷／青りんご 1袋", "青りんごリキュール 30cc", "トニックウォーター 適量"],
        steps: ["氷をグラスに入れる", "リキュールを注ぐ", "トニックウォーターを注ぐ"],
      },
      {
        id: "lychee-grape-cocktail",
        name: "ライチグレープカクテル",
        image: RECIPE_IMG + "drink18.jpg",
        materials: ["カクテル氷／巨峰 1袋", "カシスリキュール 40cc", "トニックウォーター 適量"],
        steps: ["氷をグラスに入れる", "リキュールを注ぐ", "トニックウォーターを注ぐ"],
      },
      {
        id: "lemon-sour",
        name: "レモンサワー",
        image: RECIPE_IMG + "drink19.jpg",
        materials: ["カクテル氷／レモン 1袋", "サワー 150cc"],
        steps: ["氷をグラスに入れる", "サワーをゆっくり注ぐ"],
      },
      {
        id: "frozen-lemon-sour",
        name: "シャリシャリフローズンレモンサワー",
        image: RECIPE_IMG + "drink21.jpg",
        materials: ["雪氷／レモンシチリア産果汁 1袋", "サワー 150cc"],
        steps: ["グラスにサワーを注ぐ", "雪氷を加える"],
      },
    ],
  },
  {
    category: "デザート",
    items: [
      {
        id: "kakigori-ichigo-mango",
        name: "かき氷／いちご・マンゴー",
        image: RECIPE_IMG + "dessert01.jpg",
        materials: ["雪氷 1袋", "シロップ 70〜100cc", "冷凍フルーツ お好みで"],
        steps: ["雪氷を器に盛る", "シロップをかける", "冷凍フルーツをお好みで添える"],
      },
      {
        id: "kakigori-mango",
        name: "かき氷／マンゴー果肉入り",
        image: RECIPE_IMG + "dessert02.jpg",
        materials: ["雪氷／マンゴー果肉入り 1袋", "練乳 お好みで"],
        steps: ["雪氷／マンゴー果肉入りを器に盛る", "練乳をお好みでかける"],
      },
      {
        id: "dalmatian",
        name: "ダルメシアンアイスクリーム",
        image: RECIPE_IMG + "dessert03.jpg",
        materials: ["氷カフェ／コーヒー 1袋", "バニラアイス 100cc", "ホイップクリーム 20cc", "クッキーまたはビスケット 1枚", "ミント 1枚"],
        steps: ["氷カフェとバニラアイスをブレンドする", "ホイップクリームとクッキーと共に盛り付ける", "ミントを飾る"],
      },
      {
        id: "matcha-anmitsu",
        name: "抹茶あんみつ",
        image: RECIPE_IMG + "dessert04.jpg",
        materials: ["氷カフェ／抹茶 1袋", "ゆであずき 30g", "バニラアイス 30g", "白玉 2個", "甘栗 1/2個"],
        steps: ["氷カフェを器に盛る", "残りの材料をバランスよく飾る"],
      },
    ],
  },
];

// 全レシピをフラットに取得（個別ページ用）
export const ALL_RECIPES: (IceRecipeItem & { category: string })[] = ICE_RECIPES.flatMap(
  (c) => c.items.map((it) => ({ ...it, category: c.category }))
);
export const findRecipe = (id: string) => ALL_RECIPES.find((r) => r.id === id);

export const DIVISION_INFO: Record<
  Division,
  { label: string; reasonCatch: string; reasonBody: string }
> = (sections.divisionInfo || {}) as any;

// 事業部ページ詳細（事業概要 / サプライチェーン / 事業の特色 / 選ばれる理由）。
// 文言は src/content/sections.json で管理（/console から編集可能）。
export interface DivisionFeatureItem {
  title: string;
  body: string;
  image: boolean;
}
export interface DivisionDetail {
  overview: string;
  supplyChain: string;
  features: { heading: string; items: DivisionFeatureItem[] }[];
  reasons: { no: string; title: string; body: string }[];
}
export const DIVISION_DETAIL: Record<Division, DivisionDetail> = (sections.divisionDetail || {}) as any;
