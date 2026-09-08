// 採用ページ共通のフレーム（デザイン支給 index.html の骨格）。
//   - 青一色のキャンバス（.rc）＋固定の背景線画キャンバス（canvas.ts）
//   - ヘッダー（ロゴ／コーポレートサイト／エントリー）・フッター・追従「動画で知る」ボタン
//   - スクロール出現（.reveal → .is-in）とオープニング（氷の組み上がり）
// overlay=true のときは職種詳細オーバーレイ用（固定・自前スクロール・ヘッダー等なし）になる。
//
// スタイルは src/styles/recruit.css（デザイン支給 style.css を .rc 配下にスコープしたもの）。
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import "../../styles/recruit.css";
import { EDIT_MODE, ed, edImg, img, txt } from "../lib/editable";
import { mountRecruitCanvas, type CanvasHandle } from "./canvas";
import { RoughFilterDefs } from "./parts";

/** 既定の白ロゴ（デザイン支給 logo_white.png） */
export const RECRUIT_LOGO = "/images/recruit/logo_white.png";

// 本文書体は 2026-09 改修で丸ゴ（Zen Maru Gothic）→角ゴ（Zen Kaku Gothic New）に変更（デザイン支給準拠）
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Yusei+Magic&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap";

/** 採用ページ用のWebフォント（Yusei Magic / Zen Kaku Gothic New）を一度だけ読み込む */
function ensureFonts() {
  if (typeof document === "undefined" || document.getElementById("rc-fonts")) return;
  const l = document.createElement("link");
  l.id = "rc-fonts";
  l.rel = "stylesheet";
  l.href = FONT_CSS;
  document.head.appendChild(l);
}

const FrameCtx = createContext<{ goJobs: (e?: React.MouseEvent) => void }>({ goJobs: () => {} });
export const useRecruitFrame = () => useContext(FrameCtx);

/** 「エントリー」導線：採用トップなら募集職種一覧へスクロール、他ページなら /recruit#jobs へ */
export function useGoJobs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (pathname === "/recruit") {
      document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/recruit#jobs");
    }
  };
}

function RecruitHeader({ scrolled, hidden }: { scrolled: boolean; hidden: boolean }) {
  const { goJobs } = useRecruitFrame();
  return (
    <header className={"header" + (scrolled ? " is-scrolled" : "") + (hidden ? " is-hidden" : "")}>
      <Link to="/" className="header__logo" aria-label="株式会社アイスライン">
        <img className="header__logoimg" src={img("recruit3:header.logo", RECRUIT_LOGO)} alt="ICELINE" {...edImg("recruit3:header.logo", "採用ページ ロゴ（白）")} />
        <small {...ed("recruit3:header.sub", "ロゴ横の小文字")}>{txt("recruit3:header.sub", "採用サイト")}</small>
      </Link>
      <nav className="header__nav">
        <Link to="/" className="btn btn--corp">
          <span {...ed("recruit3:header.corp.label", "採用ヘッダー コーポレートサイトリンク")}>{txt("recruit3:header.corp.label", "コーポレートサイトはこちら")}</span>
        </Link>
        <a href="/recruit#jobs" className="btn btn--entry" onClick={goJobs}>
          <span {...ed("recruit3:header.cta.label", "採用CTA（エントリー）")}>{txt("recruit3:header.cta.label", "エントリー")}</span>
        </a>
      </nav>
    </header>
  );
}

function RecruitFooter() {
  const { goJobs } = useRecruitFrame();
  return (
    // フッターのロゴ（青の座布団）とタグラインは、デザイン支給の更新では削除されていたが
    // 「記事ページ下部を 9/7 のデプロイ（f99170a）の仕様に戻す」指示により復帰（2026-09-08）
    <footer className="footer on-land">
      <div className="footer__logo">
        <img className="footer__logoimg" src={img("recruit3:footer.logo", img("recruit3:header.logo", RECRUIT_LOGO))} alt="ICELINE" {...edImg("recruit3:footer.logo", "採用フッター ロゴ（白）")} />
      </div>
      <p className="footer__tag" {...ed("recruit3:footer.tag", "フッター タグライン")}>{txt("recruit3:footer.tag", "すなおな心で、一歩ずつ。")}</p>
      <div className="footer__actions">
        <Link to="/" className="btn btn--corp">
          <span {...ed("recruit3:footer.corp.label", "採用フッター コーポレートサイトリンク")}>{txt("recruit3:footer.corp.label", "コーポレートサイトはこちら")}</span>
        </Link>
        <a href="/recruit#jobs" className="btn btn--entry" onClick={goJobs}>
          <span {...ed("recruit3:footer.cta.label", "採用フッター エントリー")}>{txt("recruit3:footer.cta.label", "エントリー")}</span>
        </a>
      </div>
      <p className="footer__copy" {...ed("recruit3:footer.copy", "コピーライト")}>{txt("recruit3:footer.copy", "© ICELINE Co., Ltd.")}</p>
    </footer>
  );
}

/** 追従「動画で知るアイスライン」ボタン（リンク先は従来どおり /videos） */
function FloatVideo() {
  return (
    <Link to="/videos" className="float-video btn btn--corp">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#009BFD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="7" />
        <path d="M7.5 6.5l4 2.5-4 2.5z" />
      </svg>
      <span {...ed("recruit3:float.label", "追従ボタン 文言")}>{txt("recruit3:float.label", "動画で知るアイスライン")}</span>
    </Link>
  );
}

/**
 * スクロール出現（奥→手前）。root 内の .reveal を IntersectionObserver で監視し、
 * 見えたら .is-in を付ける。後から増えた要素（記事の取得完了など）も MutationObserver で拾う。
 */
function useReveal(rootRef: React.RefObject<HTMLElement | null>, enabled: boolean, ownScroll: boolean, onMutate?: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supported = "IntersectionObserver" in window;
    let io: IntersectionObserver | null = null;
    const showAll = () => root.querySelectorAll<HTMLElement>(".reveal:not(.is-in)").forEach((el) => el.classList.add("is-in"));
    if (reduce || !supported) {
      showAll();
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            const group = el.closest("[data-reveal-group]");
            let delay = 0;
            if (group) {
              const siblings = Array.from(group.querySelectorAll<HTMLElement>(".reveal")).filter((s) => !s.classList.contains("is-in"));
              delay = Math.max(0, siblings.indexOf(el)) * 90;
            }
            el.style.transitionDelay = delay + "ms";
            el.classList.add("is-in");
            io?.unobserve(el);
          }
        },
        { root: ownScroll ? root : null, threshold: 0.2, rootMargin: "0px 0px -5% 0px" },
      );
    }
    const observeAll = () => {
      if (!io) {
        showAll();
        return;
      }
      root.querySelectorAll<HTMLElement>(".reveal:not(.is-in)").forEach((el) => io!.observe(el));
    };
    observeAll();
    // コンテンツの増減（記事の取得完了・編集プレビューの再描画）に追従
    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        observeAll();
        onMutate?.();
      });
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io?.disconnect();
      mo.disconnect();
      if (queued) cancelAnimationFrame(queued);
    };
  }, [rootRef, enabled, ownScroll, onMutate]);
}

export function RecruitFrame({
  children,
  overlay = false,
  ambient = false,
  land = false,
  intro = false,
  landAnchorId,
  className = "",
}: {
  children: ReactNode;
  /** 職種詳細オーバーレイ用（固定・自前スクロール・ヘッダー/フッターなし・静かな背景） */
  overlay?: boolean;
  /** 背景を下層用の静かな情景（積雪＋轍＋陸地）にする（overlay は land 指定が無ければ ambient） */
  ambient?: boolean;
  /** 背景を「全面が緑の陸地・雪なし（トラックと人だけが動く）」にし、文字を黒基調にする
   * （職種詳細・インタビュー記事。2026-09 改修・デザイン支給の data-canvas="land"） */
  land?: boolean;
  /** true ならオープニング（氷の組み上がり）から始める（採用トップのみ） */
  intro?: boolean;
  /** 陸地の地平線の基準要素 id（採用トップ＝数字で見るセクション） */
  landAnchorId?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<CanvasHandle | null>(null);
  const isAmbient = overlay || ambient;
  // オープニングの状態: pending＝判定前（SSR とクライアント初回描画で同じ。コンテンツは非表示）
  // → intro（組み上がり中）／ready（本編）。window に依存する判定（編集モード・モーション低減・
  // ?job= 付き着地）はハイドレーション後の layout effect で行い、SSR との属性不一致を避ける
  const [phase, setPhase] = useState<"pending" | "intro" | "ready">(intro && !overlay ? "pending" : "ready");
  const introDecided = useRef<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);
  // スクロールダウンで上へ消え、スクロールアップで戻る（サイト共通ヘッダーと同じ挙動。2026-09 改修で復帰）
  const [hidden, setHidden] = useState(false);
  const goJobs = useGoJobs();

  useLayoutEffect(() => {
    ensureFonts();
    if (introDecided.current !== null) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasJob = new URLSearchParams(window.location.search).has("job");
    const enabled = intro && !overlay && !EDIT_MODE && !reduceMotion && !hasJob;
    introDecided.current = enabled;
    setPhase(enabled ? "intro" : "ready");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const introActive = phase !== "ready";

  // オープニング中はページ先頭に固定してスクロールを止める
  useEffect(() => {
    if (phase !== "intro") return;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const skip = () => handleRef.current?.skipIntro();
    document.addEventListener("click", skip, { once: true });
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("click", skip);
    };
  }, [phase]);

  // 背景キャンバス（layout effect でオープニングの可否を決めた後に起動する）
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const handle = mountRecruitCanvas({
      canvas,
      root,
      mode: land ? "land" : isAmbient ? "ambient" : "story",
      landAnchorId,
      intro: introDecided.current === true,
      onIntroDone: () => setPhase("ready"),
      getScroll: overlay
        ? () => ({ y: root.scrollTop, max: root.scrollHeight - root.clientHeight })
        : () => ({ y: window.scrollY, max: document.documentElement.scrollHeight - window.innerHeight }),
    });
    handleRef.current = handle;
    return () => {
      handle.stop();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAmbient, land, landAnchorId]);

  // ヘッダーの帯（スクロール後）と、スクロール方向による表示／非表示。
  // ページ上部（80px 以内）では常に表示。小さな揺れで震えないよう 6px 以上の移動で方向を判定する
  useEffect(() => {
    if (overlay) return;
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const d = y - lastY;
        setScrolled(y > 40);
        if (y < 80) setHidden(false);
        else if (d > 6) setHidden(true);
        else if (d < -6) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  // 退避窓の対象要素の再収集（コンテンツの増減時）。関数は固定して監視の張り直しを避ける
  const rescan = useRef(() => handleRef.current?.rescan()).current;
  useReveal(rootRef, !introActive, overlay, rescan);

  return (
    <FrameCtx.Provider value={{ goJobs }}>
      <div ref={rootRef} className={"rc" + (overlay ? " rc--overlay" : "") + (land ? " rc--land" : "") + (introActive ? " is-intro" : "") + (className ? " " + className : "")}>
        <RoughFilterDefs />
        <div className="bg-depth" />
        <canvas ref={canvasRef} id={overlay ? undefined : "story-canvas"} className="story-canvas" />
        {!overlay && <RecruitHeader scrolled={scrolled} hidden={hidden} />}
        {!overlay && <FloatVideo />}
        {/* land モードでは本文全体を陸地用（黒文字）にする */}
        <main className={"page" + (land ? " on-land" : "")}>{children}</main>
        {!overlay && <RecruitFooter />}
      </div>
    </FrameCtx.Provider>
  );
}
