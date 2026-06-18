// コンテンツの下書き管理。ビルド時JSONをベースラインとして読み込み、
// 編集→プレビュー用オーバーライド生成→変更ファイル抽出（公開）まで担う。

import newsJson from "../content/news.json";
import videosJson from "../content/videos.json";
import interviewsJson from "../content/interviews.json";
import imagesJson from "../content/images.json";
import sectionsJson from "../content/sections.json";

export interface NewsItem {
  id: string;
  date: string;
  category: "お知らせ" | "製品" | "採用" | "メディア";
  title: string;
  body: string;
}
export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  thumb: string;
  videoUrl: string;
}
export interface InterviewItem {
  id: string;
  name: string;
  role: string;
  years: string;
  lead: string;
  paragraphs: string[];
  image: string;
}
export interface ImagesData {
  IMG: Record<string, string>;
  PRODUCT_IMG: Record<string, string>;
  INTERVIEW_IMG: Record<string, string>;
}

export interface Content {
  news: NewsItem[];
  videos: VideoItem[];
  interviews: InterviewItem[];
  images: ImagesData;
  sections: any;
}

export const NEWS_CATEGORIES: NewsItem["category"][] = ["お知らせ", "製品", "採用", "メディア"];

// 下書き対象 → リポジトリ上のファイルパス
export const FILE_PATHS: Record<keyof Content, string> = {
  news: "src/content/news.json",
  videos: "src/content/videos.json",
  interviews: "src/content/interviews.json",
  images: "src/content/images.json",
  sections: "src/content/sections.json",
};

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** ビルド時JSONをベースラインとして取得 */
export function baseline(): Content {
  return clone({
    news: newsJson as NewsItem[],
    videos: videosJson as VideoItem[],
    interviews: interviewsJson as InterviewItem[],
    images: imagesJson as ImagesData,
    sections: sectionsJson as any,
  });
}

/** ベース（既定はビルド時JSON）と比較し、変更があったファイルのみ {path: 内容} で返す */
export function changedFiles(draft: Content, base: Content = baseline()): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  (Object.keys(FILE_PATHS) as (keyof Content)[]).forEach((key) => {
    if (JSON.stringify(draft[key]) !== JSON.stringify(base[key])) {
      out[FILE_PATHS[key]] = draft[key];
    }
  });
  return out;
}

// sections.json のうち、文字列リーフを data-edit パスへ平坦化する対象トップキー
const SECTION_FLATTEN_KEYS = [
  "site",
  "videosIntro",
  "divisionBiz",
  "divisionInfo",
  "recruitMv",
  "recruitApply",
  "philosophy",
  "ceoMessage",
];

function flatten(prefix: string, value: any, out: Record<string, string>) {
  if (typeof value === "string") {
    out[prefix] = value;
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(`${prefix}.${i}`, v, out));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => flatten(prefix ? `${prefix}.${k}` : k, v, out));
  }
}

/**
 * 下書き全体を data-edit パス → 値 のマップへ変換（iframeプレビュー用）。
 * ブリッジ側は [data-edit] にテキスト、[data-edit-img] に画像srcを適用する。
 */
export function buildOverrides(draft: Content): Record<string, string> {
  const o: Record<string, string> = {};

  draft.news.forEach((n) => {
    o[`news:${n.id}:date`] = n.date;
    o[`news:${n.id}:category`] = n.category;
    o[`news:${n.id}:title`] = n.title;
    o[`news:${n.id}:body`] = n.body;
  });

  draft.videos.forEach((v) => {
    o[`videos:${v.id}:title`] = v.title;
    o[`videos:${v.id}:duration`] = v.duration;
    o[`videos:${v.id}:thumb`] = v.thumb;
  });

  draft.interviews.forEach((iv) => {
    o[`interviews:${iv.id}:lead`] = iv.lead;
    o[`interviews:${iv.id}:image`] = iv.image;
    iv.paragraphs.forEach((p, i) => {
      o[`interviews:${iv.id}:paragraphs.${i}`] = p;
    });
  });

  (["IMG", "PRODUCT_IMG", "INTERVIEW_IMG"] as const).forEach((group) => {
    Object.entries(draft.images[group]).forEach(([k, url]) => {
      o[`images:${group}.${k}`] = url;
    });
  });

  const sectionsFlat: Record<string, string> = {};
  SECTION_FLATTEN_KEYS.forEach((k) => flatten(k, draft.sections[k], sectionsFlat));
  Object.entries(sectionsFlat).forEach(([k, v]) => {
    o[`sections:${k}`] = v;
  });

  return o;
}
