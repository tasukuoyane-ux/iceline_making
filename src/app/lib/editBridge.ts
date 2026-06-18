// 編集ブリッジ：ライブページが /console の iframe 内（?__edit=1）で動くときに
// ・編集可能要素のハイライト＆クリック選択（→ 親へ postMessage）
// ・親から送られる下書き内容のプレビュー反映（textContent / img.src の書き換え）
// を行う。通常閲覧時は完全に無効（副作用なし）。

import { EDIT_MODE } from "./editable";

type SelectMessage = { source: "iceline-console"; type: "select"; path: string; kind: "text" | "image" };
type DraftMessage = { source: "iceline-console"; type: "draft"; overrides: Record<string, string> };

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

function applyOverrides(overrides: Record<string, string>) {
  lastOverrides = overrides;
  for (const [path, value] of Object.entries(overrides)) {
    // テキスト
    document.querySelectorAll<HTMLElement>(`[data-edit="${cssEscape(path)}"]`).forEach((el) => {
      if (el.textContent !== value) el.textContent = value;
    });
    // 画像（要素自身が img の場合と、内側に img を含む場合の両対応）
    document.querySelectorAll<HTMLElement>(`[data-edit-img="${cssEscape(path)}"]`).forEach((el) => {
      const img = el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
      if (img && img.getAttribute("src") !== value) img.setAttribute("src", value);
    });
  }
}

function cssEscape(s: string): string {
  // 属性セレクタ内で安全に使えるようエスケープ
  return s.replace(/["\\]/g, "\\$&");
}

function findEditable(target: EventTarget | null): { el: HTMLElement; path: string; kind: "text" | "image" } | null {
  let el = target as HTMLElement | null;
  while (el && el !== document.body) {
    if (el.hasAttribute?.("data-edit")) return { el, path: el.getAttribute("data-edit")!, kind: "text" };
    if (el.hasAttribute?.("data-edit-img")) return { el, path: el.getAttribute("data-edit-img")!, kind: "image" };
    el = el.parentElement;
  }
  return null;
}

let activeEl: HTMLElement | null = null;

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
      e.preventDefault();
      e.stopPropagation();
      if (activeEl) activeEl.classList.remove("iceline-edit-active");
      activeEl = hit.el;
      activeEl.classList.add("iceline-edit-active");
      post({ source: "iceline-console", type: "select", path: hit.path, kind: hit.kind } as SelectMessage);
    },
    true
  );

  // 親からのメッセージ（下書きプレビュー）
  window.addEventListener("message", (e: MessageEvent) => {
    const msg = e.data as DraftMessage;
    if (!msg || msg.source !== "iceline-console") return;
    if (msg.type === "draft") applyOverrides(msg.overrides || {});
  });

  // React の描画が落ち着いた頃に、保留中の下書きを再適用
  const reapply = () => applyOverrides(lastOverrides);
  setTimeout(reapply, 300);
  setTimeout(reapply, 1000);

  // 準備完了を親へ通知
  post({ source: "iceline-live", type: "ready", path: location.pathname } as any);
}

function post(message: unknown) {
  try {
    window.parent.postMessage(message, "*");
  } catch {
    /* noop */
  }
}
