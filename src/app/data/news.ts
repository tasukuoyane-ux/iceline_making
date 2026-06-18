// お知らせ記事・動画。実データは src/content/*.json で管理（/console から編集可能）。
import newsData from "../../content/news.json";
import videosData from "../../content/videos.json";
import { Block, toBlocks } from "./blocks";

export interface NewsItem {
  id: string;
  date: string;
  category: "お知らせ" | "製品" | "採用" | "メディア";
  title: string;
  // 本文はブロック構成（段落/見出し/画像）。旧データ(body文字列)も後方互換で読む。
  blocks: Block[];
}

export const NEWS: NewsItem[] = (newsData as any[]).map((n) => ({
  id: n.id,
  date: n.date,
  category: n.category,
  title: n.title,
  blocks: toBlocks(n.blocks ?? n.body),
}));

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  /** サムネイル画像URL */
  thumb: string;
  /** 動画本体URL（YouTube/Vimeo の共有URL、または mp4 等の直リンク）。空なら準備中表示 */
  videoUrl: string;
}

export const VIDEOS: VideoItem[] = videosData as VideoItem[];
