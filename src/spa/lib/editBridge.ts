// 編集ブリッジ：ライブページが /console の iframe 内（?__edit=1）で動くときに
//  ・編集可能要素のハイライト＆クリック選択（→ 親へ postMessage）
//  ・現在ページの編集可能要素一覧をDOM順でスキャンして親へ送信（ページ単位エディタ用）
//  ・親から送られる下書き内容のプレビュー反映（textContent / img.src の書き換え）
// を行う。通常閲覧時は完全に無効（副作用なし）。

import { EDIT_MODE } from "./editable";
import { parseRich } from "./richText";
import { buildHideCss, HIDE_STYLE_ID } from "../../components/HideOverridesStyle";

const OUTLINE_STYLE_ID = "iceline-edit-style";

function injectStyle() {
  if (document.getElementById(OUTLINE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = OUTLINE_STYLE_ID;
  style.textContent = `
    [data-edit], [data-edit-img], [data-edit-select] { cursor: pointer; }
    [data-edit]:hover, [data-edit-img]:hover, [data-edit-select]:hover {
      outline: 2px dashed #16a34a !important;
      outline-offset: 2px;
      background-color: rgba(22,163,74,0.06);
    }
    .iceline-edit-active {
      outline: 2px solid #16a34a !important;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
}

let lastOverrides: Record<string, string> = {};

function cssEscape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}

// 各ページの編集対象から除外するパス:
//  - header: / footer: … 全ページ共通の要素
//  - news: … お知らせ記事は Payload CMS（/admin）へ移行済み
function isExcludedPath(path: string): boolean {
  return path.startsWith("header:") || path.startsWith("footer:") || path.startsWith("news:");
}

/** 「SPで非表示」「PCで非表示」（hide:）の下書きをプレビューへ反映する。
 * 公開側では HideOverridesStyle（サーバ）が同じ id の style を焼き込んでおり、
 * ここでは下書きの値で丸ごと書き換える。 */
function applyHideStyle(overrides: Record<string, string>) {
  let el = document.getElementById(HIDE_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = HIDE_STYLE_ID;
    document.head.appendChild(el);
  }
  const css = buildHideCss(overrides);
  if (el.textContent !== css) el.textContent = css;
}

/** 画像と文章の横並び比率（--ratio）を下書きの値で即時反映する。
 * 対象は data-ratio 属性を持つグリッド要素。値は overrides の <data-ratio> キー
 * （30〜70の数値文字列）で、無ければ data-ratio-def を使う。 */
function applyRatioVars(overrides: Record<string, string>) {
  document.querySelectorAll<HTMLElement>("[data-ratio]").forEach((el) => {
    const path = el.getAttribute("data-ratio")!;
    const def = parseInt(el.getAttribute("data-ratio-def") || "50", 10) || 50;
    const first = el.getAttribute("data-ratio-first") === "1";
    const raw = parseInt(overrides[path] ?? "", 10);
    const p = Math.min(70, Math.max(30, Number.isNaN(raw) ? def : raw));
    const cols = first ? `${p}fr ${100 - p}fr` : `${100 - p}fr ${p}fr`;
    if (el.style.getPropertyValue("--ratio") !== cols) el.style.setProperty("--ratio", cols);
  });
}

/** リッチ本文（data-edit-rich）の中身を値から再構築する。
 * 行頭「・」「- 」の行は ul>li、それ以外は p（RichBody と同じ規則）。 */
function renderRichInto(el: HTMLElement, value: string) {
  el.textContent = "";
  for (const b of parseRich(value, el.getAttribute("data-edit-rich") === "list")) {
    if (b.type === "ul") {
      const ul = document.createElement("ul");
      for (const line of b.lines) {
        const li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      }
      el.appendChild(ul);
    } else {
      const p = document.createElement("p");
      p.textContent = b.lines[0] || " ";
      el.appendChild(p);
    }
  }
}

function applyOverrides(overrides: Record<string, string>) {
  lastOverrides = overrides;
  applyHideStyle(overrides);
  applyRatioVars(overrides);
  // アニメーション設定は animate モジュールが要素へ反映する（DOMパッチ対象外）
  import("./animate").then((m) => m.setAnimOverrides(overrides));
  for (const [path, value] of Object.entries(overrides)) {
    if (path.startsWith("hide:") || path.startsWith("hidesec:") || path.startsWith("anim:") || path.startsWith("color:")) continue; // 専用処理（style/animate）で反映済み
    document.querySelectorAll<HTMLElement>(`[data-edit="${cssEscape(path)}"]`).forEach((el) => {
      if (el.hasAttribute("data-edit-rich")) {
        // リッチ本文：textContent の書き換えでは p/li 構造が壊れるため再構築する
        if (el.getAttribute("data-edit-default") !== value) {
          renderRichInto(el, value);
          el.setAttribute("data-edit-default", value);
        }
      } else if (el.textContent !== value) {
        el.textContent = value;
      }
    });
    document.querySelectorAll<HTMLElement>(`[data-edit-img="${cssEscape(path)}"]`).forEach((el) => {
      const im = el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
      if (im && im.getAttribute("src") !== value) im.setAttribute("src", value);
    });
    // 選択式：選択値を属性として書き戻す。ページ側は CSS でこの属性に反応させることで、
    // 再ビルドなしにプレビューへ即時反映できる（例：前後関係の z-index 切替）。
    document.querySelectorAll<HTMLElement>(`[data-edit-select="${cssEscape(path)}"]`).forEach((el) => {
      if (el.getAttribute("data-edit-selected") !== value) el.setAttribute("data-edit-selected", value);
    });
  }
}

interface PageField {
  path: string;
  kind: "text" | "image" | "select";
  value: string;
  label: string;
  multiline: boolean;
  options?: { value: string; label: string }[];
  /** 画像フィールドが「画像と文章の横並びグリッド」内にある場合の比率設定 */
  ratio?: { path: string; def: number; first: boolean };
  /** 所属セクションの表示名（コンソールのアコーディオングルーピング用） */
  section?: string;
  /** true なら動画URLフィールド（コンソールに動画ファイルのアップロードボタンを表示） */
  video?: boolean;
  /** 繰り返しセクションの「項目数」フィールドのメタ情報（追加・削除ボタン用） */
  repeat?: { prefix: string; max: number };
}

/** 要素が属するセクションの表示名（見出しテキスト）を求める */
function sectionLabelFor(el: HTMLElement): string {
  const sec = el.closest<HTMLElement>("section, header");
  if (sec) {
    if (sec.tagName === "HEADER") return "メインビジュアル";
    // h2 → h1 → h3 の優先順（職種オーバーレイのセクション見出しは h3）
    const h = sec.querySelector("h2") ?? sec.querySelector("h1") ?? sec.querySelector("h3");
    const t = (h?.textContent || "").trim().replace(/\s+/g, " ");
    if (t) return t.length > 24 ? t.slice(0, 24) + "…" : t;
  }
  return "その他";
}

/** data-edit-options（"値:表示名" を | 区切り）をパースする */
function parseOptions(raw: string | null): { value: string; label: string }[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((s) => {
      const i = s.indexOf(":");
      return i < 0 ? { value: s, label: s } : { value: s.slice(0, i), label: s.slice(i + 1) };
    })
    .filter((o) => o.value !== "");
}

/** 現在ページの編集可能要素をDOM順で収集 */
function scanFields(): PageField[] {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-edit],[data-edit-img],[data-edit-select]")
  );
  const seen = new Set<string>();
  const claimedRatios = new Set<string>();
  const fields: PageField[] = [];
  for (const el of nodes) {
    const isImg = el.hasAttribute("data-edit-img");
    const isSel = el.hasAttribute("data-edit-select");
    const path = (isSel
      ? el.getAttribute("data-edit-select")
      : isImg
      ? el.getAttribute("data-edit-img")
      : el.getAttribute("data-edit"))!;
    if (!path || seen.has(path) || isExcludedPath(path)) continue;
    seen.add(path);
    let value = "";
    if (isSel) {
      // 現在の選択値（親からの反映済み属性 → ページ側の既定値 の順で拾う）
      value = el.getAttribute("data-edit-selected") || el.getAttribute("data-edit-value") || "";
    } else if (isImg) {
      const im = el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
      value = im?.getAttribute("src") || "";
    } else if (el.hasAttribute("data-edit-rich")) {
      // リッチ本文は textContent だと改行が失われるため、元の値を属性から拾う
      value = el.getAttribute("data-edit-default") || "";
    } else {
      value = el.textContent || "";
    }
    const label = el.getAttribute("data-edit-label") || autoLabel(path);
    const multiline = !isSel && (el.hasAttribute("data-edit-multi") || (!isImg && value.length > 40));
    // 画像フィールドが比率調整グリッド（data-ratio）内にあれば、比率設定を紐付ける
    // （1つのグリッドに複数画像がある場合は最初の画像フィールドにだけ付ける）
    let ratio: PageField["ratio"];
    if (isImg) {
      const rc = el.closest<HTMLElement>("[data-ratio]");
      const rPath = rc?.getAttribute("data-ratio");
      if (rc && rPath && !claimedRatios.has(rPath)) {
        claimedRatios.add(rPath);
        ratio = {
          path: rPath,
          def: parseInt(rc.getAttribute("data-ratio-def") || "50", 10) || 50,
          first: rc.getAttribute("data-ratio-first") === "1",
        };
      }
    }
    fields.push({
      path,
      kind: isSel ? "select" : isImg ? "image" : "text",
      value,
      label,
      multiline,
      section: sectionLabelFor(el),
      ...(isSel ? { options: parseOptions(el.getAttribute("data-edit-options")) } : {}),
      ...(ratio ? { ratio } : {}),
      ...(el.hasAttribute("data-edit-video") ? { video: true } : {}),
      ...(isSel && el.hasAttribute("data-repeat")
        ? {
            repeat: {
              prefix: el.getAttribute("data-repeat-prefix") || "",
              max: parseInt(el.getAttribute("data-repeat-max") || "0", 10) || 0,
            },
          }
        : {}),
    });
  }
  return fields;
}

function autoLabel(path: string): string {
  // パスから簡易ラベルを生成（最後のセグメント）
  const seg = path.split(/[:.]/).filter(Boolean);
  return seg[seg.length - 1] || path;
}

function post(message: unknown) {
  try {
    window.parent.postMessage(message, "*");
  } catch {
    /* noop */
  }
}

function postFields() {
  post({ source: "iceline-live", type: "page-fields", path: location.pathname, fields: scanFields() });
}

let activeEl: HTMLElement | null = null;

function findEditable(target: EventTarget | null): { el: HTMLElement; path: string } | null {
  let el = target as HTMLElement | null;
  while (el && el !== document.body) {
    if (el.hasAttribute?.("data-edit")) {
      const p = el.getAttribute("data-edit")!;
      return isExcludedPath(p) ? null : { el, path: p };
    }
    if (el.hasAttribute?.("data-edit-img")) {
      const p = el.getAttribute("data-edit-img")!;
      return isExcludedPath(p) ? null : { el, path: p };
    }
    if (el.hasAttribute?.("data-edit-select")) {
      const p = el.getAttribute("data-edit-select")!;
      return isExcludedPath(p) ? null : { el, path: p };
    }
    el = el.parentElement;
  }
  return null;
}

export function initEditBridge() {
  if (!EDIT_MODE) return;
  if (window.self === window.top) return; // iframe 内でのみ動作

  injectStyle();

  // クリックで選択（リンク等の既定動作は抑止）
  document.addEventListener(
    "click",
    (e) => {
      // 職種オーバーレイなど、クリックで後からDOMに現れる編集対象を拾えるよう、
      // どのクリックでも少し待ってから一覧を再送信する
      setTimeout(postFields, 700);
      const hit = findEditable(e.target);
      if (!hit) return;
      // クリックスルー対象（タブ等）は選択ハイライトだけ行い、
      // 既定動作（Reactのonclickによるタブ切替など）はそのまま通す。
      if (!hit.el.hasAttribute("data-edit-clickthrough")) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (activeEl) activeEl.classList.remove("iceline-edit-active");
      activeEl = hit.el;
      activeEl.classList.add("iceline-edit-active");
      post({ source: "iceline-live", type: "select", path: hit.path });
    },
    true
  );

  // 親からのメッセージ
  window.addEventListener("message", (e: MessageEvent) => {
    const msg = e.data;
    if (!msg || msg.source !== "iceline-console") return;
    if (msg.type === "draft") {
      applyOverrides(msg.overrides || {});
      // 下書き反映後に一覧も更新
      postFields();
    }
    // 採用（募集職種）の下書き。件数・並び順が変わるため React 再描画で反映する
    if (msg.type === "recruit") {
      import("./recruitStore").then((m) => m.setRecruitPreview(msg.recruit ?? null));
    }
    if (msg.type === "request-fields") postFields();
    if (msg.type === "scroll-to") {
      const p = cssEscape(msg.path);
      const el = document.querySelector<HTMLElement>(
        `[data-edit="${p}"],[data-edit-img="${p}"],[data-edit-select="${p}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (activeEl) activeEl.classList.remove("iceline-edit-active");
        activeEl = el;
        el.classList.add("iceline-edit-active");
      }
    }
  });

  // 初期化：描画が落ち着いた頃に下書き再適用＋一覧送信
  const sync = () => {
    applyOverrides(lastOverrides);
    postFields();
  };
  setTimeout(sync, 300);
  setTimeout(sync, 900);
  setTimeout(sync, 1800);

  // SPA内遷移（リンククリック等）を検知して再スキャン
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      setTimeout(sync, 400);
      setTimeout(sync, 1000);
    }
  }, 500);

  post({ source: "iceline-live", type: "ready", path: location.pathname });
}
