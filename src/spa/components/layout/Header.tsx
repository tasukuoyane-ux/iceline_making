import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { SITE } from "../../data/company";
import logoImg from "../../../images/logo.png";
const logo = logoImg.src; // Next の静的画像 import は StaticImageData を返すため URL 文字列に変換
import { cn } from "../ui/utils";
import { ed, edImg, txt, img } from "../../lib/editable";

// ロゴクリックで / へ遷移できるため「TOP」はナビから除外。
// 構成: SHOP（ボタン状・少し離す）→「サービス」（ホバーで4項目のドロップダウン）→
//       会社情報 → お知らせ → お問い合わせ → 採用情報CTA。
// 採用3ページのナビは「コーポレートサイト」「エントリー」の2つのみ（帯なし・透過）。
const SHOP_URL = "https://www.dry-ice.jp/";
// サービス4項目（「サービス」メニューのドロップダウンに格納）
const SERVICE_NAV: { to: string; label: string }[] = [
  { to: "/ice", label: "氷・氷菓" },
  { to: "/food", label: "業務用食材" },
  { to: "/warehouse", label: "倉庫事業" },
  { to: "/dryice", label: "ドライアイス" },
];
const NAV: { to: string; label: string }[] = [
  { to: "/company", label: "会社情報" },
  { to: "/news", label: "お知らせ" },
  { to: "/contact", label: "お問い合わせ" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  // スクロールダウンで上へスライドアウト、スクロールアップで上からスライドイン。
  // ページ上部（ヘッダー高さ以内）では常に表示。小さな揺れで震えないよう
  // 6px 以上の移動で方向を判定する。
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const d = y - lastY;
        if (y < 80) setHidden(false);
        else if (d > 6) setHidden(true);
        else if (d < -6) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const { pathname } = useLocation();
  // 採用ページ（/recruit 配下）は独自ヘッダー（src/spa/recruit/RecruitFrame.tsx）を使うため、
  // このヘッダーは描画されない（App.tsx で切り替え。2026-09 改修）
  const logoSrc = img("header:logo", logo);

  // 「採用情報」CTAクリック時の円形トランジション：
  // ボタン中心から採用ページの背景色（#009BFD）の真円がイーズインしながら1.2秒でビューポート全体を
  // 埋め尽くす。アニメーションは遷移前のページの上（ナビゲーションの下）で行われ、
  // 塗りつぶし完了後に /recruit3 へ遷移する（→ 採用3の背景動画1はその後に再生開始）。
  const navigate = useNavigate();
  const [circle, setCircle] = useState<{ x: number; y: number; scale: number } | null>(null);
  const startCtaTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (circle) return; // 連打ガード
    setOpen(false);
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    // ボタン中心からビューポートの最遠隅までの距離＝必要な円の半径
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    // 基準10pxの円を必要倍率まで scale で拡大する（2%の余白）
    setCircle({ x, y, scale: (radius * 2 * 1.02) / 10 });
    // 塗りつぶし完了（1.2秒）後に採用3へ遷移し、円はフェードアウトして消える
    window.setTimeout(() => navigate("/recruit"), 1200);
    window.setTimeout(() => setCircle(null), 1700);
  };

  return (
    <header
      className={cn(
        "top-0 z-50 w-full border-b transition-transform duration-300",
        // SPメニュー展開中はスライドアウトしない（操作途中で消えないように）
        hidden && !open ? "-translate-y-full" : "translate-y-0",
        "sticky border-border bg-background/90 backdrop-blur",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 pc:h-20 pc:px-8">
        <Link
          to="/"
          className="flex items-center"
          onClick={() => setOpen(false)}
          aria-label={SITE.name}
        >
          <img
            {...edImg("header:logo", "ロゴ")}
            src={logoSrc}
            alt={SITE.name}
            className="h-9 w-auto pc:h-11"
          />
        </Link>

        {/* PC nav */}
        {(
          <nav className="hidden items-center gap-1 pc:flex">
            {/* SHOP（ボタン状・隣のナビから少しだけ離す） */}
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-4 rounded-full border border-brand px-4 py-1.5 text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
              style={{ fontSize: 14 }}
            >
              <span {...ed("header:shop.label", "SHOPボタン")}>{txt("header:shop.label", "オンラインショップ")}</span>
            </a>

            {/* サービス：ホバーで4項目のドロップダウンを開く */}
            <div className="group relative">
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 px-3 py-2 transition-colors group-hover:text-brand",
                  SERVICE_NAV.some((n) => pathname.startsWith(n.to)) ? "text-brand" : "text-foreground",
                )}
                style={{ fontSize: 14 }}
                aria-haspopup="menu"
              >
                サービス
                <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
              </button>
              {/* pt-2 の橋でボタン→パネル間のホバーが途切れないようにする */}
              <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="min-w-[190px] overflow-hidden rounded-xl border border-border bg-background py-1.5 shadow-lg">
                  {SERVICE_NAV.map((n, i) => {
                    const active = pathname.startsWith(n.to);
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className={cn(
                          "block px-5 py-2.5 transition-colors hover:bg-secondary",
                          active ? "text-brand" : "text-foreground",
                        )}
                        style={{ fontSize: 14 }}
                      >
                        <span {...ed(`header:svc.${i}.label`, "サービスナビ項目")}>{txt(`header:svc.${i}.label`, n.label)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {NAV.map((n, i) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn("relative px-3 py-2 transition-colors hover:text-brand", active ? "text-brand" : "text-foreground")}
                  style={{ fontSize: 14 }}
                >
                  <span {...ed(`header:nav.${i}.label`, "ナビ項目")}>{txt(`header:nav.${i}.label`, n.label)}</span>
                  {active && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-brand" />}
                </Link>
              );
            })}

            {/* 採用情報は採用3（採用2踏襲＋動画背景）を表示する */}
            <Link
              to="/recruit"
              onClick={startCtaTransition}
              className="ml-3 inline-flex items-center bg-brand px-5 py-2.5 text-brand-foreground transition-colors hover:bg-[#009BFD] hover:text-white"
              style={{ fontSize: 14 }}
            >
              <span {...ed("header:cta.label", "採用CTA")}>{txt("header:cta.label", "採用情報")}</span>
            </Link>
          </nav>
        )}

        {/* Mobile toggle */}
        <button
          aria-label="メニュー"
          className="pc:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-border bg-background pc:hidden">
          <div className="mx-auto flex max-w-[1400px] flex-col px-5 py-4">
            {(
              <>
                {/* SHOP（ボタン状） */}
                <a
                  href={SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-fit rounded-full border border-brand px-5 py-2 text-brand"
                  style={{ fontSize: 14 }}
                >
                  <span {...ed("header:shop.label", "SHOPボタン")}>{txt("header:shop.label", "オンラインショップ")}</span>
                </a>

                {/* サービス4項目：ラベル付きのひとかたまり */}
                <div className="mt-4 rounded-2xl bg-secondary px-4 py-2">
                  <p className="pt-1.5 text-muted-foreground" style={{ fontSize: 12, fontWeight: 700 }}>サービス</p>
                  {SERVICE_NAV.map((n, i) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={() => setOpen(false)}
                      className="block border-b border-border/60 py-3.5 last:border-0"
                      style={{ fontSize: 15 }}
                    >
                      <span {...ed(`header:svc.${i}.label`, "サービスナビ項目")}>{txt(`header:svc.${i}.label`, n.label)}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-2">
                  {NAV.map((n, i) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={() => setOpen(false)}
                      className="block border-b border-border/60 py-4"
                      style={{ fontSize: 15 }}
                    >
                      <span {...ed(`header:nav.${i}.label`, "ナビ項目")}>{txt(`header:nav.${i}.label`, n.label)}</span>
                    </Link>
                  ))}
                </div>

                <Link
                  to="/recruit"
                  onClick={startCtaTransition}
                  className="mt-4 inline-flex items-center justify-center bg-brand py-3.5 text-brand-foreground transition-colors hover:bg-[#009BFD] hover:text-white"
                >
                  <span {...ed("header:cta.label", "採用CTA")}>{txt("header:cta.label", "採用情報")}</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* 円形トランジション：CTAボタン中心から採用ページの背景色（#009BFD）の真円がビューポート全体へ広がる。
          Z軸はナビゲーション（ヘッダー z-50）の下・他のコンテンツの上（z-40）。
          ページ側のスタッキングコンテキストに閉じ込められないよう body 直下へポータル描画 */}
      {circle &&
        createPortal(
          <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
            <style>{`
              .hdr-cta-circle {
                position: absolute;
                width: 10px;
                height: 10px;
                margin: -5px 0 0 -5px;
                border-radius: 9999px;
                background: #009BFD; /* 採用ページの背景色（Ice Blue）に合わせる。2026-09 改修 */
                animation:
                  hdr-cta-expand 1.2s ease-in forwards,
                  hdr-cta-fade 0.4s ease-out 1.2s forwards;
              }
              @keyframes hdr-cta-expand { from { transform: scale(0); } to { transform: scale(var(--cta-scale)); } }
              @keyframes hdr-cta-fade { from { opacity: 1; } to { opacity: 0; } }
            `}</style>
            <div className="hdr-cta-circle" style={{ left: circle.x, top: circle.y, ["--cta-scale" as any]: circle.scale }} />
          </div>,
          document.body,
        )}
    </header>
  );
}
