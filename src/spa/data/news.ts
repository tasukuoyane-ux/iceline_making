// お知らせ記事・動画。
// 記事は Payload CMS（/admin で編集）へ移行済み。サーバが HTML に埋め込む
// __NEWS_DATA__（なければ /api/news への fetch）から実行時に読み込む。
// 動画は従来どおり src/content/videos.json（/console から編集可能）。
import { useEffect, useState } from "react";
import videosData from "../../content/videos.json";
import { Block } from "./blocks";

export interface NewsItem {
  id: string;
  date: string;
  category: "お知らせ" | "製品" | "採用" | "メディア";
  title: string;
  // 本文はブロック構成（段落/見出し/画像/動画）。
  blocks: Block[];
}

const SNAPSHOT_KEY = "iceline-news-snapshot";

/** サーバが (frontend)/[[...slug]]/page.tsx で埋め込んだ一覧データ。 */
function readEmbedded(): NewsItem[] | null {
  if (typeof document === "undefined") return null;
  try {
    const el = document.getElementById("__NEWS_DATA__");
    if (el?.textContent) {
      const data = JSON.parse(el.textContent);
      if (Array.isArray(data)) return data as NewsItem[];
    }
  } catch {
    /* no-op */
  }
  return null;
}

/** 前回訪問時のスナップショット（初期描画のちらつき防止）。 */
function readSnapshot(): NewsItem[] | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data as NewsItem[];
    }
  } catch {
    /* no-op */
  }
  return null;
}

function writeSnapshot(data: NewsItem[]): void {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data));
  } catch {
    /* no-op */
  }
}

const embedded = typeof window !== "undefined" ? readEmbedded() : null;
let cache: NewsItem[] | null = embedded ?? (typeof window !== "undefined" ? readSnapshot() : null);
let inflight: Promise<NewsItem[]> | null = null;

if (embedded) writeSnapshot(embedded);

/** 一覧の取得（埋め込みデータがあれば fetch はしない）。 */
export function preloadNews(): Promise<NewsItem[]> {
  if (embedded) return Promise.resolve(embedded);
  if (!inflight) {
    inflight = fetch("/api/news")
      .then((r) => {
        if (!r.ok) throw new Error(`news api ${r.status}`);
        return r.json();
      })
      .then((data: NewsItem[]) => {
        cache = data;
        writeSnapshot(data);
        return data;
      })
      .catch(() => {
        inflight = null;
        return cache ?? [];
      });
  }
  return inflight;
}

// SPA 読み込みと同時に取得を開始（React マウントと並行して走る）
if (typeof window !== "undefined") preloadNews();

/** お知らせ一覧。null はロード中（ロード完了までは「0件」と区別する）。 */
export function useNews(): NewsItem[] | null {
  const [data, setData] = useState<NewsItem[] | null>(cache);
  useEffect(() => {
    if (data) return;
    let on = true;
    preloadNews().then((d) => {
      if (on) setData(d);
    });
    return () => {
      on = false;
    };
  }, [data]);
  return data;
}

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
