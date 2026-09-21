// 採用サイト（/recruit 配下）の共通レイアウト（デザイン支給 iceline-saiyo の骨格）。
//   - 固定背景：空のグラデーション（.bg-sky）／SVG の海（.bg-sea：3D 不可時のフォールバック）／
//     WebGL 3D 背景（bg3d.ts：氷の海→地形→トラック。ページ間で作り直さず動かし続ける）／
//     フィルムグレイン（.grain）／ページ遷移のベール（.page-veil）
//   - 固定ヘッダー（白ロゴ＋RECRUITING SITE・コーポレートサイトへのリンク・赤いエントリー。
//     2026-09-21 更新版：ナビは 2 項目のみでハンバーガー廃止）
//   - フッター（タグライン・トップ各セクションへのアンカーナビ・コピーライト）
//   - #about などのアンカー：ページ遷移後・同一ページ内ともに該当セクションへスクロール
//   - 採用ページ間のリンク：クリック → 3D がズームイン → ベール → 遷移 → ズームアウトで着地
//   - スクロール出現（.js-reveal / .js-reveal-group → .is-inview）
//   - 職種詳細（?job=<ID>）のオーバーレイ
// 子ページは react-router の <Outlet> に描画される（App.tsx のネストルート）。
// スタイルは src/styles/recruit.css（支給 style.css を .rc 配下にスコープしたもの）。
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router";
import "../../styles/recruit.css";
import { EDIT_MODE, ed, edImg, img, txt } from "../lib/editable";
import { rt } from "../lib/richInline";
import { useRecruitData } from "../lib/recruitStore";
import { mountBg3d, type Bg3dHandle } from "./bg3d";
import { SeaSvg } from "./RsParts";
import { JobOverlay } from "./JobOverlay";

const FONT_CSS = "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&family=Baloo+2:wght@600&family=Klee+One&display=swap";
function ensureFonts() {
  if (typeof document === "undefined" || document.getElementById("rc-fonts")) return;
  const l = document.createElement("link");
  l.id = "rc-fonts";
  l.rel = "stylesheet";
  l.href = FONT_CSS;
  document.head.appendChild(l);
}

export const RECRUIT_LOGO_WHITE = "/images/recruit/logo_white.png";

/** フッターナビ（トップの各セクションへのアンカー。文言はコンソールで編集可） */
const FOOTER_NAV: { to: string; label: string; path: string }[] = [
  { to: "/recruit#about", label: "アイスラインとは", path: "rs:nav.about" },
  { to: "/recruit#work", label: "仕事とカルチャー", path: "rs:nav.work" },
  { to: "/recruit#people", label: "人を知る", path: "rs:nav.people" },
  { to: "/recruit#recruit", label: "募集職種", path: "rs:nav.jobs" },
  { to: "/recruit#movie", label: "動画", path: "rs:nav.movie" },
];

/** #hash の要素へスクロール（遅延読み込み直後は要素が無いことがあるので少し待って再試行） */
function scrollToHash(hash: string, smooth: boolean) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return;
  let tries = 0;
  const attempt = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      return;
    }
    if (++tries < 20) window.setTimeout(attempt, 100);
  };
  attempt();
}

function prefersReduce(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RecruitLayout() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bg = useRef<Bg3dHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [veilOff, setVeilOff] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [entering, setEntering] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  // 3D 背景が動いているか（.has-3d：SVG の海を隠し、空のグラデーション等に切り替える）
  const [has3d, setHas3d] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const data = useRecruitData();
  const jobId = params.get("job");
  // 職種詳細オーバーレイ（エントリーページでは ?job= は希望職種の初期値に使うので開かない）
  const job = jobId && location.pathname !== "/recruit/entry" ? data.jobs.find((j) => j.id === jobId) : undefined;

  /* 初期化：フォント・3D 背景・ベール開き・ヒーローのイントロ */
  useEffect(() => {
    ensureFonts();
    const root = rootRef.current;
    const canvas = canvasRef.current;
    let alive = true;
    if (root && canvas && !EDIT_MODE) {
      mountBg3d(canvas, root).then((h) => {
        if (!alive) {
          h?.stop();
          return;
        }
        bg.current = h;
        setHas3d(!!h);
      });
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setEntering(false);
        window.setTimeout(() => setVeilOff(true), 160);
      }),
    );
    const t = window.setTimeout(() => setReady(true), 300);
    return () => {
      alive = false;
      window.clearTimeout(t);
      bg.current?.stop();
      bg.current = null;
    };
  }, []);

  /* ページ遷移後：先頭へ・ズームアウトで着地・ベールを開く */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!location.hash) window.scrollTo(0, 0);
    bg.current?.arrive();
    setLeaving(false);
    setEntering(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setEntering(false);
        window.setTimeout(() => setVeilOff(true), 160);
      }),
    );
  }, [location.pathname]);

  /* #about などのアンカー：初回表示・ページ遷移後・同一ページ内のリンクいずれもセクションへスクロール */
  useEffect(() => {
    if (!location.hash) return;
    const smooth = !first.current && !prefersReduce();
    const t = window.setTimeout(() => scrollToHash(location.hash, smooth), first.current ? 300 : 200);
    return () => window.clearTimeout(t);
  }, [location.key, location.hash]);

  /* ヘッダーの帯（40px 以上スクロールで背景色）＋ SVG の海の視差 */
  useEffect(() => {
    const reduce = prefersReduce();
    let ticking = false;
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      if (reduce || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sea = rootRef.current?.querySelector<HTMLElement>(".bg-sea");
        if (sea) sea.style.transform = `translateY(${window.scrollY * -0.1}px)`;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* 採用ページ間リンクの遷移演出（クリック → ズームイン → ベール → 遷移） */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = prefersReduce();
    const onClick = (e: MouseEvent) => {
      if (EDIT_MODE || reduce) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("data-no-transition")) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/recruit")) return;
      const [path] = href.split(/[?#]/);
      if (path === location.pathname) return; // 同一ページ内（?job= の開閉など）は演出なし
      e.preventDefault();
      setLeaving(true);
      let navigated = false;
      const go = () => {
        if (navigated) return;
        navigated = true;
        navigate(href);
      };
      if (bg.current) {
        bg.current.leave(go);
        window.setTimeout(() => setVeilOff(false), 300);
        window.setTimeout(go, 1200);
      } else {
        window.setTimeout(() => setVeilOff(false), 60);
        window.setTimeout(go, 520);
      }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [navigate, location.pathname]);

  /* スクロール出現（0.9s / ease-out / 0.15s stagger）。後から増えた要素も拾う */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = prefersReduce();
    const all = () => root.querySelectorAll<HTMLElement>(".js-reveal:not(.is-inview), .js-reveal-group:not(.is-inview)");
    if (EDIT_MODE || reduce || !("IntersectionObserver" in window)) {
      const show = () => all().forEach((el) => el.classList.add("is-inview"));
      show();
      const mo = new MutationObserver(show);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    const observe = () => all().forEach((el) => io.observe(el));
    observe();
    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        observe();
      });
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      if (queued) cancelAnimationFrame(queued);
    };
  }, [location.pathname]);

  const closeJob = () => {
    const next = new URLSearchParams(params);
    next.delete("job");
    next.delete("entry");
    setParams(next, { replace: true });
  };

  const corpUrl = txt("rs:nav.corpUrl", "/");
  const cls =
    "rc" +
    (has3d ? " has-3d" : "") +
    (ready ? " is-ready" : "") +
    (veilOff ? " veil-off" : "") +
    (leaving ? " is-leaving" : "") +
    (entering ? " is-entering" : "");

  return (
    <div ref={rootRef} className={cls}>
      <div className="bg-sky" aria-hidden />
      <SeaSvg />
      <div className="bg-3d" aria-hidden>
        <canvas ref={canvasRef} />
      </div>
      <div className="grain" aria-hidden />
      <div className="page-veil" aria-hidden />

      <header className={"header" + (scrolled ? " is-scrolled" : "")}>
        <Link className="header__logo" to="/recruit">
          <img className="header__logo-img" src={img("rs:header.logo", RECRUIT_LOGO_WHITE)} alt={txt("rs:header.alt", "株式会社アイスライン")} width={143} height={70} {...edImg("rs:header.logo", "ヘッダー ロゴ画像（白）")} />
          <span className="header__logo-sub" {...ed("rs:header.sub", "ヘッダー サブ文字")}>{rt("rs:header.sub", "RECRUITING SITE")}</span>
        </Link>
        <nav className="gnav" aria-label="ヘッダーナビゲーション">
          {/^https?:\/\//.test(corpUrl) ? (
            <a className="gnav__corp" href={corpUrl} target="_blank" rel="noopener noreferrer">
              <span {...ed("rs:nav.corp", "コーポレートサイトリンク文言")}>{rt("rs:nav.corp", "コーポレートサイトはこちら")}</span>
            </a>
          ) : (
            <Link className="gnav__corp" to={corpUrl || "/"} data-no-transition>
              <span {...ed("rs:nav.corp", "コーポレートサイトリンク文言")}>{rt("rs:nav.corp", "コーポレートサイトはこちら")}</span>
            </Link>
          )}
          {EDIT_MODE && (
            <span className="note" style={{ color: "#fff", fontSize: 11 }} {...ed("rs:nav.corpUrl", "コーポレートサイトのURL（「/」でこのサイトのトップ）")}>
              {corpUrl || "/"}
            </span>
          )}
          <Link className="gnav__entry" to="/recruit/entry" aria-current={location.pathname === "/recruit/entry" ? "page" : undefined}>
            <span {...ed("rs:nav.entry", "ナビ エントリー")}>{rt("rs:nav.entry", "エントリー")}</span>
          </Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <p className="footer__tagline" {...ed("rs:footer.tagline", "フッター タグライン")}>{rt("rs:footer.tagline", "すなおな心で、一歩ずつ。")}</p>
        <nav className="footer__nav" aria-label="フッターナビゲーション">
          {FOOTER_NAV.map((n) => (
            <Link key={n.to} to={n.to}>
              <span {...ed(n.path, "フッターナビ項目")}>{rt(n.path, n.label)}</span>
            </Link>
          ))}
          <Link to="/recruit/entry">{rt("rs:nav.entry", "エントリー")}</Link>
        </nav>
        <p className="footer__copy" {...ed("rs:footer.copy", "コピーライト")}>{rt("rs:footer.copy", "© ICELINE Co., Ltd.")}</p>
      </footer>

      {job && <JobOverlay job={job} data={data} onClose={closeJob} />}
    </div>
  );
}

