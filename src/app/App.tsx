import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { VideoCta } from "./components/layout/VideoCta";
import { CookieConsent } from "./components/layout/CookieConsent";
import { Top } from "./pages/Top";
import { DivisionPage } from "./pages/DivisionPage";
import { ProductDetail } from "./pages/ProductDetail";
import { Company } from "./pages/Company";
import { Contact } from "./pages/Contact";
import { News } from "./pages/News";
import { NewsDetail } from "./pages/NewsDetail";
import { Videos } from "./pages/Videos";
import { Recruit } from "./pages/Recruit";
import { Recruit2 } from "./pages/Recruit2";
import { Recruit3 } from "./pages/Recruit3";
import { Interview } from "./pages/Interview";
import { RecipeDetail } from "./pages/RecipeDetail";
import { Privacy } from "./pages/Privacy";
import { ConsoleApp } from "../console/ConsoleApp";

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

// 公開サイト本体（ヘッダー・フッター付き）
function Site() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Top />} />
          <Route path="/food" element={<DivisionPage division="food" />} />
          <Route path="/ice" element={<DivisionPage division="ice" />} />
          <Route path="/ice/recipe/:id" element={<RecipeDetail />} />
          <Route path="/food/products/:id" element={<ProductDetail />} />
          <Route path="/ice/products/:id" element={<ProductDetail />} />
          <Route path="/company" element={<Company />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/recruit" element={<Recruit />} />
          <Route path="/recruit2" element={<Recruit2 />} />
          <Route path="/recruit3" element={<Recruit3 />} />
          <Route path="/recruit/interview/:id" element={<Interview />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Top />} />
        </Routes>
      </main>
      <Footer />
      <VideoCta />
      <CookieConsent />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* 社員専用 管理コンソール（ヘッダー・フッターなし） */}
        <Route path="/console/*" element={<ConsoleApp />} />
        {/* 公開サイト */}
        <Route path="/*" element={<Site />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
