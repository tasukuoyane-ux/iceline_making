// コンテンツの下書き管理。ビルド時JSONをベースラインとして読み込み、
// 編集→プレビュー用オーバーライド生成→変更ファイル抽出（公開）まで担う。

import videosJson from "../content/videos.json";
import recruitJson from "../content/recruit.json";
import interviewsJson from "../content/interviews.json";
import imagesJson from "../content/images.json";
import sectionsJson from "../content/sections.json";
import overridesJson from "../content/overrides.json";
import profileSlidesJson from "../content/profileSlides.json";
import contactJson from "../content/contact.json";
import { Block, toBlocks } from "../spa/data/blocks";

export type { Block };

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

/* ---- 採用（募集職種）。「採用」タブで編集し、採用3ページに表示される ---- */
export interface RecruitStep {
  time: string;
  task: string;
}
export interface RecruitTimeline {
  note: string;
  image: string;
  steps: RecruitStep[];
}
export interface RecruitJob {
  id: string;
  /** 職種名（募集職種一覧・カード見出しに表示） */
  title: string;
  /** 部門名（例: 食品事業部） */
  dept: string;
  /** 募集中フラグ（OFFにすると公開ページに表示されない。データは残る） */
  active: boolean;
  /** 業務内容 本文 */
  body: string;
  /** 業務内容 画像 */
  image: string;
  /** 1日の流れ */
  day: RecruitTimeline;
  /** キャリアパス */
  career: RecruitTimeline;
  /** 職種別メッセージ（改行可・大きな黒文字で表示） */
  message: string;
  /** 諸条件（表・職種ごと） */
  conditions: RecruitRow[];
  /** 福利厚生（諸条件の色違いの表・職種ごと） */
  benefits: RecruitRow[];
}
export interface RecruitRow {
  label: string;
  value: string;
}
export interface RecruitData {
  jobs: RecruitJob[];
  /** 諸条件のテンプレート（新規職種追加時の初期値。旧データの後方互換フォールバックも兼ねる） */
  conditions: RecruitRow[];
  /** 福利厚生のテンプレート（同上） */
  benefits: RecruitRow[];
}

// 注意: お知らせ（news）は Payload CMS（/admin）へ移行済み。
// コンソールの下書き・公開対象から外している（news.json はもうコミットしない）。
export interface Content {
  videos: VideoItem[];
  interviews: InterviewItem[];
  images: ImagesData;
  sections: any;
  // 採用（募集職種・諸条件・福利厚生）。「採用」タブで編集
  recruit: RecruitData;
  // 会社紹介資料（採用ページ COMPANY PROFILE のスライド画像URL一覧）
  profileSlides: string[];
  // お問い合わせ設定（送信先メールアドレス）
  contact: { recipient: string };
  // 汎用オーバーライド（全ページの文言・画像。編集された値だけを保持）
  overrides: Record<string, string>;
}

// 下書き対象 → リポジトリ上のファイルパス
export const FILE_PATHS: Record<keyof Content, string> = {
  videos: "src/content/videos.json",
  recruit: "src/content/recruit.json",
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

function isPlainObject(v: any): boolean {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/**
 * プレーンオブジェクト同士のみ再帰的にマージする。配列・プリミティブは source を優先し、
 * source 側にキーが無ければ target（＝コード同梱のベースライン）の値を残す。
 *
 * 目的: CMSの古いローカル下書きには、コード側で後から追加された構造キー
 * （例: sections.divisionDetail）が欠けていることがある。これをそのまま公開すると
 * 事業部ページが真っ白になる不具合が起きるため、公開・編集前にベースライン構造で補完する。
 */
export function deepMerge<T>(target: T, source: any): T {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return (source === undefined ? target : source) as T;
  }
  const out: any = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = out[key];
    if (isPlainObject(tv) && isPlainObject(sv)) out[key] = deepMerge(tv, sv);
    else if (sv !== undefined) out[key] = sv;
  }
  return out as T;
}

/**
 * 保存済み下書き（localStorage等）を、現行コードのベースライン構造へ補完して正規化する。
 * 編集者が手を加えていない構造キーが欠落しても、公開時に失われないようにする。
 */
export function healDraft(stored: any): Content {
  return normalizeContent(deepMerge(baseline(), stored));
}

/**
 * ビルド同梱コンテンツ（＝現在の本番公開状態）の署名。
 * デプロイでコンテンツが変わると署名も変わる。これを下書きに紐付けることで、
 * 「本番が更新されたあとに残っている古いローカル下書き」を検出・破棄できる。
 * （古い下書きをそのまま公開して本番を巻き戻す事故を防ぐ）
 */
export function baselineSig(): string {
  const s = JSON.stringify(baseline());
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** ビルド時JSONをベースラインとして取得（旧形式は blocks へ正規化） */
export function baseline(): Content {
  return normalizeContent(
    clone({
      videos: videosJson as VideoItem[],
      recruit: recruitJson as RecruitData,
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
  // 旧下書き（localStorage）に残っている news は Payload 移行済みのため捨てる
  delete c.news;
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
  // 採用データ（キー欠落・型崩れに耐える正規化。古いローカル下書きの補完にも使う）
  c.recruit = normalizeRecruit(c.recruit);
  if (!Array.isArray(c.profileSlides)) c.profileSlides = [""];
  if (!c.contact || typeof c.contact !== "object") c.contact = { recipient: "" };
  if (typeof c.contact.recipient !== "string") c.contact.recipient = "";
  if (!c.overrides) c.overrides = {};
  return c as Content;
}

/** 採用データの正規化（キー欠落・型崩れに耐える） */
export function normalizeRecruit(r: any): RecruitData {
  const rows = (v: any): RecruitRow[] =>
    (Array.isArray(v) ? v : []).map((x: any) => ({
      label: String(x?.label ?? ""),
      value: String(x?.value ?? ""),
    }));
  const timeline = (v: any): RecruitTimeline => ({
    note: String(v?.note ?? ""),
    image: String(v?.image ?? ""),
    steps: (Array.isArray(v?.steps) ? v.steps : []).map((s: any) => ({
      time: String(s?.time ?? ""),
      task: String(s?.task ?? ""),
    })),
  });
  const sharedConditions = rows(r?.conditions);
  const sharedBenefits = rows(r?.benefits);
  return {
    jobs: (Array.isArray(r?.jobs) ? r.jobs : []).map((j: any) => {
      const cond = rows(j?.conditions);
      const bene = rows(j?.benefits);
      return {
        id: String(j?.id ?? ""),
        title: String(j?.title ?? ""),
        dept: String(j?.dept ?? ""),
        active: j?.active !== false,
        body: String(j?.body ?? ""),
        image: String(j?.image ?? ""),
        day: timeline(j?.day),
        career: timeline(j?.career),
        message: String(j?.message ?? ""),
        // 旧データ（職種ごとの設定がない）は共通テンプレートを引き継ぐ
        conditions: cond.length ? cond : clone(sharedConditions),
        benefits: bene.length ? bene : clone(sharedBenefits),
      };
    }),
    conditions: sharedConditions,
    benefits: sharedBenefits,
  };
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
  if (path.startsWith("videos:") || path.startsWith("interviews:")) {
    const colon = path.indexOf(":");
    const kind = path.slice(0, colon);
    const rest = path.slice(colon + 1);
    const sep = rest.indexOf(":");
    const id = rest.slice(0, sep);
    const field = rest.slice(sep + 1);
    const arr: any[] = (d as any)[kind === "videos" ? "videos" : "interviews"];
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
  } else if (path.startsWith("videos:") || path.startsWith("interviews:")) {
    const colon = path.indexOf(":");
    const kind = path.slice(0, colon);
    const rest = path.slice(colon + 1);
    const sep = rest.indexOf(":");
    const id = rest.slice(0, sep);
    const field = rest.slice(sep + 1);
    const arr: any[] = (next as any)[kind === "videos" ? "videos" : "interviews"];
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
  // コード同梱の完全な構造。sections の構造キー欠落（divisionDetail等）を公開時に補完するための保険。
  const full = baseline();
  (Object.keys(FILE_PATHS) as (keyof Content)[]).forEach((key) => {
    if (JSON.stringify(draft[key]) !== JSON.stringify(base[key])) {
      // sections はオブジェクト構造。欠落キーがあるとページが壊れるため必ず完全構造へマージして出力する。
      out[FILE_PATHS[key]] =
        key === "sections" ? deepMerge(clone(full.sections), draft.sections) : draft[key];
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
  "divisionDetail",
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
