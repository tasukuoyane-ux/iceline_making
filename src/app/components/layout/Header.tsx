import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { SITE } from "../../data/company";
import logo from "../../../images/logo.png";
import { cn } from "../ui/utils";
import { ed, edImg, txt, img } from "../../lib/editable";

// ロゴクリックで / へ遷移できるため「TOP」はナビから除外。
// 構成: SHOP（ボタン状・少し離す）→ サービス4項目（ひとかたまりのピル）→
//       会社情報 → お知らせ → お問い合わせ → 採用情報CTA。
const SHOP_URL = "https://www.dry-ice.jp/";
// サービス（概念上のグループ。「サービス」というメニュー自体は置かず、
// 4項目を角丸の下地でひとかたまりに見せる）
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
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 pc:h-20 pc:px-8">
        <Link
          to="/"
          className="flex items-center"
          onClick={() => setOpen(false)}
          aria-label={SITE.name}
        >
          <img
            {...edImg("header:logo", "ロゴ")}
            src={img("header:logo", logo)}
            alt={SITE.name}
            className="h-9 w-auto pc:h-11"
          />
        </Link>

        {/* PC nav */}
        <nav className="hidden items-center gap-1 pc:flex">
          {/* SHOP（ボタン状・隣のナビから少しだけ離す） */}
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-4 rounded-full border border-brand px-4 py-1.5 text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
            style={{ fontSize: 14 }}
          >
            <span {...ed("header:shop.label", "SHOPボタン")}>{txt("header:shop.label", "SHOP")}</span>
          </a>

          {/* サービス4項目：角丸の下地でひとかたまりに。アクティブ項目は白チップ */}
          <div className="mr-2 flex items-center rounded-full bg-secondary p-1">
            {SERVICE_NAV.map((n, i) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 transition-colors",
                    active
                      ? "bg-background text-brand shadow-sm"
                      : "text-foreground hover:text-brand",
                  )}
                  style={{ fontSize: 14 }}
                >
                  <span {...ed(`header:svc.${i}.label`, "サービスナビ項目")}>{txt(`header:svc.${i}.label`, n.label)}</span>
                </Link>
              );
            })}
          </div>

          {NAV.map((n, i) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "relative px-3 py-2 transition-colors hover:text-brand",
                  active ? "text-brand" : "text-foreground",
                )}
                style={{ fontSize: 14 }}
              >
                <span {...ed(`header:nav.${i}.label`, "ナビ項目")}>{txt(`header:nav.${i}.label`, n.label)}</span>
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 bg-brand" />
                )}
              </Link>
            );
          })}
          {/* 採用情報は採用3（採用2踏襲＋動画背景）を表示する */}
          <Link
            to="/recruit3"
            className="ml-3 inline-flex items-center bg-brand px-5 py-2.5 text-brand-foreground transition-colors hover:bg-brand-dark"
            style={{ fontSize: 14 }}
          >
            <span {...ed("header:cta.label", "採用CTA")}>{txt("header:cta.label", "採用情報")}</span>
          </Link>
        </nav>

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
            {/* SHOP（ボタン状） */}
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex w-fit rounded-full border border-brand px-5 py-2 text-brand"
              style={{ fontSize: 14 }}
            >
              <span {...ed("header:shop.label", "SHOPボタン")}>{txt("header:shop.label", "SHOP")}</span>
            </a>

            {/* サービス4項目：角丸の下地でひとかたまりに */}
            <div className="mt-4 rounded-2xl bg-secondary px-4 py-1">
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
              to="/recruit3"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center bg-brand py-3.5 text-brand-foreground"
            >
              <span {...ed("header:cta.label", "採用CTA")}>{txt("header:cta.label", "採用情報")}</span>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}