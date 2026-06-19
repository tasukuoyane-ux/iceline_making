// コンテンツの下書き管理。ビルド時JSONをベースラインとして読み込み、
// 編集→プレビュー用オーバーライド生成→変更ファイル抽出（公開）まで担う。

import newsJson from "../content/news.json";
import videosJson from "../content/videos.json";
import interviewsJson from "../content/interviews.json";
import imagesJson from "../content/images.json";
import sectionsJson from "../content/sections.json";
import overridesJson from "../content/overrides.json";
import profileSlidesJson from "../content/profileSlides.json";
import contactJson from "../content/contact.json";
import { Block, toBlocks } from "../app/data/blocks";

export type { Block };

export interface NewsItem {
  id: string;
  date: string;
  category: "お知らせ" | "製品" | "採用" | "メディア";
  title: string;
  blocks: Block[];
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
  subtitle: string;
  blocks: Block[];
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
  // 会社紹介資料（採用ページ COMPANY PROFILE のスライド画像URL一覧）
  profileSlides: string[];
  // お問い合わせ設定（送信先メールアドレス）
  contact: { recipient: string };
  // 汎用オーバーライド（全ページの文言・画像。編集された値だけを保持）
  overrides: Record<string, string>;
}

export const NEWS_CATEGORIES: NewsItem["category"][] = ["お知らせ", "製品", "採用", "メディア"];

// 下書き対象 → リポジトリ上のファイルパス
export const FILE_PATHS: Record<keyof Content, string> = {
  news: "src/content/news.json",
  videos: "src/content/videos.json",
  interviews: "src/content/interviews.json",
  images: "src/content/images.json",
  sections: "src/content/sections.json",
  profileSlides: "src/content/profileSlides.json",
  contact: "src/content/contact.json",
  overrides: "src/content/overrides.json",
};

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** ビルド時JSONをベースラインとして取得（旧形式は blocks へ正規化） */
export function baseline(): Content {
  return normalizeContent(
    clone({
      news: newsJson as any[],
      videos: videosJson as VideoItem[],
      interviews: interviewsJson as any[],
      images: imagesJson as ImagesData,
      sections: sectionsJson as any,
      profileSlides: profileSlidesJson as string[],
      contact: contactJson as { recipient: string },
      overrides: overridesJson as Record<string, string>,
    })
  );
}

/** 旧形式(body / paragraphs)を blocks へ揃える。localStorageの古い下書き対策にも使う。 */
export function normalizeContent(c: any): Content {
  c.news = (c.news || []).map((n: any) => ({
    id: n.id,
    date: n.date,
    category: n.category,
    title: n.title,
    blocks: toBlocks(n.blocks ?? n.body),
  }));
  c.interviews = (c.interviews || []).map((iv: any) => ({
    id: iv.id,
    name: iv.name,
    role: iv.role,
    years: iv.years,
    lead: iv.lead,
    subtitle: iv.subtitle ?? "",
    image: iv.image,
    blocks: toBlocks(iv.blocks ?? iv.paragraphs),
  }));
  if (!Array.isArray(c.profileSlides)) c.profileSlides = [""];
  if (!c.contact || typeof c.contact !== "object") c.contact = { recipient: "" };
  if (typeof c.contact.recipient !== "string") c.contact.recipient = "";
  if (!c.overrides) c.overrides = {};
  return c as Content;
}

/* ============ 汎用パスの取得/設定（ページ単位エディタ用） ============ */

function deepGet(obj: any, dotPath: string): any {
  let cur = obj;
  for (const k of dotPath.split(".")) cur = cur?.[k];
  return cur;
}
function deepSet(obj: any, dotPath: string, value: any) {
  const keys = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] === undefined) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

/** data-edit パスから現在値を取得（draft基準） */
export function getValueByPath(d: Content, path: string): string | undefined {
  if (path.startsWith("sections:")) return deepGet(d.sections, path.slice(9));
  if (path.startsWith("images:")) {
    const [g, k] = path.slice(7).split(".");
    return (d.images as any)[g]?.[k];
  }
  if (path.startsWith("news:") || path.startsWith("videos:") || path.startsWith("interviews:")) {
    const colon = path.indexOf(":");
    const kind = path.slice(0, colon);
    const rest = path.slice(colon + 1);
    const sep = rest.indexOf(":");
    const id = rest.slice(0, sep);
    const field = rest.slice(sep + 1);
    const arr: any[] = (d as any)[kind === "news" ? "news" : kind === "videos" ? "videos" : "interviews"];
    const item = arr.find((x) => x.id === id);
    return item ? deepGet(item, field) : undefined;
  }
  return d.overrides[path];
}

/** data-edit パスへ値を設定（新しいContentを返す） */
export function setValueByPath(d: Content, path: string, value: string): Content {
  const next = clone(d);
  if (path.startsWith("sections:")) {
    deepSet(next.sections, path.slice(9), value);
  } else if (path.startsWith("images:")) {
    const [g, k] = path.slice(7).split(".");
    (next.images as any)[g][k] = value;
  } else if (path.startsWith("news:") || path.startsWith("videos:") || path.startsWith("interviews:")) {
    const colon = path.indexOf(":");
    const kind = path.slice(0, colon);
    const rest = path.slice(colon + 1);
    const sep = rest.indexOf(":");
    const id = rest.slice(0, sep);
    const field = rest.slice(sep + 1);
    const arr: any[] = (next as any)[kind === "news" ? "news" : kind === "videos" ? "videos" : "interviews"];
    const item = arr.find((x) => x.id === id);
    if (item) deepSet(item, field, value);
  } else {
    next.overrides[path] = value;
  }
  return next;
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
  "recruitConditions",
  "recruitFlow",
  "recruitFaq",
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
    // 本文は blocks（構造編集のため inline プレビュー対象外）
  });

  draft.videos.forEach((v) => {
    o[`videos:${v.id}:title`] = v.title;
    o[`videos:${v.id}:duration`] = v.duration;
    o[`videos:${v.id}:thumb`] = v.thumb;
  });

  draft.interviews.forEach((iv) => {
    o[`interviews:${iv.id}:lead`] = iv.lead;
    o[`interviews:${iv.id}:subtitle`] = iv.subtitle;
    o[`interviews:${iv.id}:image`] = iv.image;
    // 本文は blocks（構造編集のため inline プレビュー対象外）
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

  // 汎用オーバーライド（全ページの文言・画像）
  Object.entries(draft.overrides || {}).forEach(([k, v]) => {
    o[k] = v;
  });

  return o;
}
