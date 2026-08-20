// スクロール連動アニメーション。
// 管理コンソールの「ページ編集」で各要素（ブロック）に設定した
// `anim:<編集パス>` → "<種類>|<オフセットpx>|<移動量px>" を読み、
// [data-edit] / [data-edit-img] 属性で要素を特定して IntersectionObserver で発火する。
//
//  種類: fade-b/t/l/r（フェードイン・出現元は下/上/左/右）
//        slide-b/t/l/r（スライドイン・不透明度は変えない）
//  オフセット: 要素がビューポート下端から N px 入った時点で開始（0=見えたら即）
//  移動量: 出現時に移動する距離（px）
//
// 公開サイトではビルド同梱の overrides.json、コンソールのプレビュー中は
// editBridge 経由の下書きが適用される（setAnimOverrides）。
import overridesData from "../../content/overrides.json";

const PUBLISHED = overridesData as Record<string, string>;
let current: Record<string, string> = PUBLISHED;

interface AnimCfg {
  type: string;
  offset: number;
  amount: number;
}

export const ANIM_PREFIX = "anim:";

function parse(v: string): AnimCfg | null {
  const [type, offset, amount] = (v || "").split("|");
  if (!type) return null;
  return { type, offset: Math.max(0, Number(offset) || 0), amount: Number(amount) || 40 };
}

function initialTransform(c: AnimCfg): string {
  const a = c.amount;
  switch (c.type) {
    case "fade-b":
    case "slide-b":
      return `translate3d(0, ${a}px, 0)`;
    case "fade-t":
    case "slide-t":
      return `translate3d(0, ${-a}px, 0)`;
    case "fade-l":
    case "slide-l":
      return `translate3d(${-a}px, 0, 0)`;
    case "fade-r":
    case "slide-r":
      return `translate3d(${a}px, 0, 0)`;
    default:
      return "";
  }
}

function reduced(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function cssEscape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}

// オフセット値ごとに IntersectionObserver を使い回す
const observers = new Map<number, IntersectionObserver>();
function observerFor(offset: number): IntersectionObserver {
  let ob = observers.get(offset);
  if (!ob) {
    ob = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.transition = "transform 0.8s cubic-bezier(.22,.61,.36,1), opacity 0.8s ease";
          el.style.transform = "";
          el.style.opacity = "";
          ob!.unobserve(el);
        }
      },
      { rootMargin: `0px 0px ${-offset}px 0px`, threshold: 0 },
    );
    observers.set(offset, ob);
  }
  return ob;
}

function cleanup(el: HTMLElement) {
  delete el.dataset.animApplied;
  el.style.transition = "";
  el.style.transform = "";
  el.style.opacity = "";
}

/** 現在の overrides から対象要素を探して初期状態＋監視をセットする（何度呼んでも安全） */
export function applyAnimations(): void {
  if (typeof document === "undefined" || reduced()) return;
  for (const [key, val] of Object.entries(current)) {
    if (!key.startsWith(ANIM_PREFIX)) continue;
    const path = cssEscape(key.slice(ANIM_PREFIX.length));
    const cfg = parse(val);
    document
      .querySelectorAll<HTMLElement>(`[data-edit="${path}"],[data-edit-img="${path}"]`)
      .forEach((el) => {
        if (!cfg) {
          if (el.dataset.animApplied) cleanup(el);
          return;
        }
        // 同じ設定で初期化済みならスキップ（発火後の再スキャンで隠し直さない）
        if (el.dataset.animApplied === val) return;
        el.dataset.animApplied = val;
        el.style.transition = "none";
        el.style.transform = initialTransform(cfg);
        if (cfg.type.startsWith("fade")) el.style.opacity = "0";
        // 初期スタイルの反映後に監視を開始（即時発火でもトランジションが効くように）
        requestAnimationFrame(() => observerFor(cfg.offset).observe(el));
      });
  }
}

/** コンソールのプレビュー用：下書きの overrides を反映し、変更された要素は再生し直す */
export function setAnimOverrides(next: Record<string, string>): void {
  if (typeof document === "undefined") return;
  const prev = current;
  current = next;
  // 変更・削除されたキーの要素を一旦リセットして再適用（エディタで動きを確認できるように）
  const keys = new Set<string>();
  for (const k of Object.keys(prev)) if (k.startsWith(ANIM_PREFIX)) keys.add(k);
  for (const k of Object.keys(next)) if (k.startsWith(ANIM_PREFIX)) keys.add(k);
  for (const k of keys) {
    if ((prev[k] || "") === (next[k] || "")) continue;
    const path = cssEscape(k.slice(ANIM_PREFIX.length));
    document
      .querySelectorAll<HTMLElement>(`[data-edit="${path}"],[data-edit-img="${path}"]`)
      .forEach(cleanup);
  }
  applyAnimations();
}
