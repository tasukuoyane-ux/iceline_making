// スクロール出現（デザイン支給 Iceline_Hojin/site/assets/js/main.js の scroll reveal の移植）。
// `.reveal` 要素が 15% 見えたら `.is-visible` を付ける（1回のみ。CSS は src/styles/corp.css）。
// SPA のルート遷移・遅延読み込みで後から増えた要素は MutationObserver で拾う。
// 採用ページ（.rc 配下）は独自の出現処理（RecruitFrame の useReveal → .is-in）を持つので対象外。
// モーション低減設定では即時表示。

export function bootReveal(root: ParentNode = document): () => void {
  if (typeof window === "undefined") return () => {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supported = "IntersectionObserver" in window;
  const scope: Node = root === document ? document.body : (root as Node);
  const targets = () =>
    Array.from(root.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)")).filter((el) => !el.closest(".rc"));
  if (reduce || !supported) {
    const showAll = () => targets().forEach((el) => el.classList.add("is-visible"));
    showAll();
    const mo = new MutationObserver(showAll);
    mo.observe(scope, { childList: true, subtree: true });
    return () => mo.disconnect();
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    },
    { threshold: 0.15 },
  );
  const observeAll = () => targets().forEach((el) => io.observe(el));
  observeAll();
  let queued = 0;
  const mo = new MutationObserver(() => {
    if (queued) return;
    queued = requestAnimationFrame(() => {
      queued = 0;
      observeAll();
    });
  });
  mo.observe(scope, { childList: true, subtree: true });
  return () => {
    io.disconnect();
    mo.disconnect();
    if (queued) cancelAnimationFrame(queued);
  };
}
