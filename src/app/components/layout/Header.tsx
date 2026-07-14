import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { SITE } from "../../data/company";
import logo from "../../../images/logo.png";
import { cn } from "../ui/utils";
import { ed, edImg, txt, img } from "../../lib/editable";

// ロゴクリックで / へ遷移できるため「TOP」はナビから除外。
// 旧「TOP」の位置に外部ショップ（SHOP）リンクを配置。
const NAV: { to: string; label: string; external?: boolean }[] = [
  { to: "https://www.dry-ice.jp/", label: "SHOP", external: true },
  { to: "/food", label: "食品事業部" },
  { to: "/ice", label: "アイス事業部" },
  { to: "/company", label: "会社情報" },
  { to: "/news", label: "お知らせ" },
  { to: "/contact", label: "お問い合わせ" },
  { to: "/recruit2", label: "採用2" },
  { to: "/recruit3", label: "採用3" },
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
          {NAV.map((n, i) => {
            if (n.external) {
              return (
                <a
                  key={n.to}
                  href={n.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative px-3 py-2 text-foreground transition-colors hover:text-brand"
                  style={{ fontSize: 14 }}
                >
                  <span {...ed(`header:nav.${i}.label`, "ナビ項目")}>{txt(`header:nav.${i}.label`, n.label)}</span>
                </a>
              );
            }
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
          <Link
            to="/recruit"
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
          <div className="mx-auto flex max-w-[1400px] flex-col px-5 py-2">
            {NAV.map((n, i) =>
              n.external ? (
                <a
                  key={n.to}
                  href={n.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-4"
                  style={{ fontSize: 15 }}
                >
                  <span {...ed(`header:nav.${i}.label`, "ナビ項目")}>{txt(`header:nav.${i}.label`, n.label)}</span>
                </a>
              ) : (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-4"
                  style={{ fontSize: 15 }}
                >
                  <span {...ed(`header:nav.${i}.label`, "ナビ項目")}>{txt(`header:nav.${i}.label`, n.label)}</span>
                </Link>
              )
            )}
            <Link
              to="/recruit"
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