// 編集ブリッジ：ライブページが /console の iframe 内（?__edit=1）で動くときに
//  ・編集可能要素のハイライト＆クリック選択（→ 親へ postMessage）
//  ・現在ページの編集可能要素一覧をDOM順でスキャンして親へ送信（ページ単位エディタ用）
//  ・親から送られる下書き内容のプレビュー反映（textContent / img.src の書き換え）
// を行う。通常閲覧時は完全に無効（副作用なし）。

import { EDIT_MODE } from "./editable";

const OUTLINE_STYLE_ID = "iceline-edit-style";

function injectStyle() {
  if (document.getElementById(OUTLINE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = OUTLINE_STYLE_ID;
  style.textContent = `
    [data-edit], [data-edit-img] { cursor: pointer; }
    [data-edit]:hover, [data-edit-img]:hover {
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

// ヘッダー・フッターは全ページ共通のため、各ページの編集対象から除外する。
function isExcludedPath(path: string): boolean {
  return path.startsWith("header:") || path.startsWith("footer:");
}

function applyOverrides(overrides: Record<string, string>) {
  lastOverrides = overrides;
  for (const [path, value] of Object.entries(overrides)) {
    document.querySelectorAll<HTMLElement>(`[data-edit="${cssEscape(path)}"]`).forEach((el) => {
      if (el.textContent !== value) el.textContent = value;
    });
    document.querySelectorAll<HTMLElement>(`[data-edit-img="${cssEscape(path)}"]`).forEach((el) => {
      const im = el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
      if (im && im.getAttribute("src") !== value) im.setAttribute("src", value);
    });
  }
}

interface PageField {
  path: string;
  kind: "text" | "image";
  value: string;
  label: string;
  multiline: boolean;
}

/** 現在ページの編集可能要素をDOM順で収集 */
function scanFields(): PageField[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-edit],[data-edit-img]"));
  const seen = new Set<string>();
  const fields: PageField[] = [];
  for (const el of nodes) {
    const isImg = el.hasAttribute("data-edit-img");
    const path = (isImg ? el.getAttribute("data-edit-img") : el.getAttribute("data-edit"))!;
    if (!path || seen.has(path) || isExcludedPath(path)) continue;
    seen.add(path);
    let value = "";
    if (isImg) {
      const im = el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
      value = im?.getAttribute("src") || "";
    } else {
      value = el.textContent || "";
    }
    const label = el.getAttribute("data-edit-label") || autoLabel(path);
    const multiline = el.hasAttribute("data-edit-multi") || (!isImg && value.length > 40);
    fields.push({ path, kind: isImg ? "image" : "text", value, label, multiline });
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
    if (msg.type === "request-fields") postFields();
    if (msg.type === "scroll-to") {
      const el = document.querySelector<HTMLElement>(`[data-edit="${cssEscape(msg.path)}"],[data-edit-img="${cssEscape(msg.path)}"]`);
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
