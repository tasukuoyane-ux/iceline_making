// お知らせ記事・動画。実データは src/content/*.json で管理（/console から編集可能）。
import newsData from "../../content/news.json";
import videosData from "../../content/videos.json";

export interface NewsItem {
  id: string;
  date: string;
  category: "お知らせ" | "製品" | "採用" | "メディア";
  title: string;
  body: string;
}

export const NEWS: NewsItem[] = newsData as NewsItem[];

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
