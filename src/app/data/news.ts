// お知らせ記事（モック）

export interface NewsItem {
  id: string;
  date: string;
  category: "お知らせ" | "製品" | "採用" | "メディア";
  title: string;
  body: string;
}

export const NEWS: NewsItem[] = [
  {
    id: "n-2026-06-01",
    date: "2026.06.01",
    category: "製品",
    title: "夏季向け「フレーバーアイス」新ラインアップを販売開始しました",
    body: "色と味のある氷の新シリーズを、全国の取引先様向けに販売開始いたしました。カクテルやソーダ割りなど、飲食シーンを彩る氷をご提案します。",
  },
  {
    id: "n-2026-05-15",
    date: "2026.05.15",
    category: "お知らせ",
    title: "創業120周年特設ページを公開しました",
    body: "1905年の創業から120年。アイスラインの歩みをまとめた特設ページを公開しました。",
  },
  {
    id: "n-2026-04-20",
    date: "2026.04.20",
    category: "採用",
    title: "2027年度 新卒・中途採用エントリーを受付開始しました",
    body: "食品事業部・アイス事業部それぞれで、営業職・製造職・品質管理職を募集しています。詳しくは採用情報ページをご覧ください。",
  },
  {
    id: "n-2026-03-10",
    date: "2026.03.10",
    category: "メディア",
    title: "地元テレビ番組でアイスラインの氷づくりが紹介されました",
    body: "岡山の老舗製氷会社として、120年続く氷づくりの現場が地元メディアで取り上げられました。",
  },
  {
    id: "n-2026-02-01",
    date: "2026.02.01",
    category: "お知らせ",
    title: "FSSC 22000 認証を更新しました",
    body: "食品安全マネジメントシステムの国際規格 FSSC 22000 の認証を更新しました。これからも安全な製品をお届けします。",
  },
];

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  thumbQuery: string;
}

export const VIDEOS: VideoItem[] = [
  { id: "v1", title: "氷ができるまで｜製造現場ドキュメント", duration: "03:24", thumbQuery: "ice factory" },
  { id: "v2", title: "営業の一日｜現場に通うということ", duration: "04:10", thumbQuery: "delivery van japan" },
  { id: "v3", title: "120年のあゆみ｜アイスラインの歴史", duration: "05:42", thumbQuery: "old japanese shop" },
  { id: "v4", title: "フレーバーアイスのつくり方", duration: "02:38", thumbQuery: "colorful ice" },
];
