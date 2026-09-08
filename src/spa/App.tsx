import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { VideoCta } from "./components/layout/VideoCta";
import { CookieConsent } from "./components/layout/CookieConsent";
import { Top } from "./pages/Top";
import { bootReveal } from "./lib/reveal";

// パフォーマンス対応：トップ以外のページと管理コンソールは遅延読み込み
// （ルート別チャンクに分割）し、初回に読むJS量を減らす。
const DivisionPage = lazy(() => import("./pages/DivisionPage").then((m) => ({ default: m.DivisionPage })));
const ServicePage = lazy(() => import("./pages/ServicePage").then((m) => ({ default: m.ServicePage })));
const PackagePage = lazy(() => import("./pages/PackagePage").then((m) => ({ default: m.PackagePage })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then((m) => ({ default: m.ProductDetail })));
const Company = lazy(() => import("./pages/Company").then((m) => ({ default: m.Company })));
const Contact = lazy(() => import("./pages/Contact").then((m) => ({ default: m.Contact })));
const News = lazy(() => import("./pages/News").then((m) => ({ default: m.News })));
const NewsDetail = lazy(() => import("./pages/NewsDetail").then((m) => ({ default: m.NewsDetail })));
const Videos = lazy(() => import("./pages/Videos").then((m) => ({ default: m.Videos })));
// 採用ページ：2026-09 改修でデザイン支給（青キャンバス＋線画アニメーション）の新構成に全面入れ替え。
// 採用トップ・職種詳細オーバーレイ・インタビュー記事は src/spa/recruit/ 配下（独自ヘッダー・フッター付き）
const RecruitTop = lazy(() => import("./recruit/RecruitTop").then((m) => ({ default: m.RecruitTop })));
const InterviewPage = lazy(() => import("./recruit/InterviewPage").then((m) => ({ default: m.InterviewPage })));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail").then((m) => ({ default: m.RecipeDetail })));
const Privacy = lazy(() => import("./pages/Privacy").then((m) => ({ default: m.Privacy })));
const ConsoleApp = lazy(() => import("../console/ConsoleApp").then((m) => ({ default: m.ConsoleApp })));

// 基本背景（採用ページ以外）：淡いグレー地（#F6F8F9）に微粒子を散らした背景（デザイン支給準拠。
// 2026-09 改修。旧プリズム画像 BG_Prism.jpg は使わない）。
// 採用系ページは各ページ独自の背景（青キャンバス＋線画）を持つため白のまま。
function SiteBg() {
  const { pathname } = useLocation();
  const isRecruit = pathname.startsWith("/recruit");
  return <div className={"pointer-events-none fixed inset-0 -z-10 " + (isRecruit ? "bg-background" : "site-bg")} aria-hidden />;
}

// スクロール出現（.reveal → .is-visible）の起動。採用ページ以外で有効
function RevealBoot() {
  const { pathname } = useLocation();
  const isRecruit = pathname.startsWith("/recruit");
  useEffect(() => {
    if (isRecruit) return;
    return bootReveal();
  }, [isRecruit]);
  return null;
}

// スクロール連動アニメーション（コンソールの「ページ編集」で各要素に設定）の起動。
// SPA遷移後の描画タイミングに合わせて数回スキャンする。
function AnimateBoot() {
  const { pathname } = useLocation();
  useEffect(() => {
    let alive = true;
    const run = () => {
      if (!alive) return;
      import("./lib/animate").then((m) => alive && m.applyAnimations());
    };
    const timers = [60, 400, 1200].map((ms) => setTimeout(run, ms));
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [pathname]);
  return null;
}

// 旧採用URL（/recruit2・/recruit3）→ /recruit へのリダイレクト。
// ?job=◯◯（職種オーバーレイ）や #jobs（アンカー）を維持して転送する
function RecruitRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/recruit${search}${hash}`} replace />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // ハッシュ付き遷移時は該当セクションへスクロール（描画後に実行）
      const id = hash.slice(1);
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
        else window.scrollTo(0, 0);
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// 公開サイト本体（ヘッダー・フッター付き）。
// 採用系ページ（/recruit 配下）はデザイン専用のヘッダー・フッター・追従ボタンを自前で持つため、
// サイト共通のヘッダー・フッター・「動画で知る」ボタンは出さない（2026-09 改修）
function Site() {
  const { pathname } = useLocation();
  const isRecruit = pathname.startsWith("/recruit");
  return (
    <div className="flex min-h-screen flex-col">
      <SiteBg />
      <AnimateBoot />
      <RevealBoot />
      {!isRecruit && <Header />}
      <main className="flex-1">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Top />} />
            <Route path="/food" element={<DivisionPage division="food" />} />
            <Route path="/ice" element={<DivisionPage division="ice" />} />
            <Route path="/ice/recipe/:id" element={<RecipeDetail />} />
            <Route path="/food/products/:id" element={<ProductDetail />} />
            <Route path="/food/packages/:id" element={<PackagePage />} />
            <Route path="/ice/products/:id" element={<ProductDetail />} />
            <Route path="/warehouse" element={<ServicePage service="warehouse" />} />
            <Route path="/dryice" element={<ServicePage service="dryice" />} />
            <Route path="/company" element={<Company />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/recruit" element={<RecruitTop />} />
            {/* 旧URL（/recruit2・/recruit3）は /recruit へリダイレクト（クエリ・ハッシュ維持） */}
            <Route path="/recruit2" element={<RecruitRedirect />} />
            <Route path="/recruit3" element={<RecruitRedirect />} />
            <Route path="/recruit/interview/:id" element={<InterviewPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Top />} />
          </Routes>
        </Suspense>
      </main>
      {!isRecruit && <Footer />}
      {!isRecruit && <VideoCta />}
      <CookieConsent />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          {/* 社員専用 管理コンソール（ヘッダー・フッターなし） */}
          <Route path="/console/*" element={<ConsoleApp />} />
          {/* 公開サイト */}
          <Route path="/*" element={<Site />} />
        </Routes>
      </Suspense>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
