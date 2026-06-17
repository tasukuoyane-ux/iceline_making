import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { SITE } from "../../data/company";
import logo from "../../imports/logo.png";
import { cn } from "../ui/utils";

const NAV = [
  { to: "/", label: "TOP" },
  { to: "/food", label: "食品事業部" },
  { to: "/ice", label: "アイス事業部" },
  { to: "/company", label: "会社情報" },
  { to: "/news", label: "お知らせ" },
  { to: "/contact", label: "お問い合わせ" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 pc:h-20 pc:px-8">
        <Link
          to="/"
          className="flex items-baseline gap-2"
          onClick={() => setOpen(false)}
        >
          <span
            className="text-ink"
            style={{
              fontFamily: "var(--font-accent)",
              fontSize: 26,
              letterSpacing: "0.06em",
            }}
          >
            ICELINE
          </span>
          <span
            className="hidden text-muted-foreground tab:inline"
            style={{ fontSize: 12 }}
          >
            {SITE.name}
          </span>
        </Link>

        {/* PC nav */}
        <nav className="hidden items-center gap-1 pc:flex">
          {NAV.map((n) => {
            const active =
              n.to === "/"
                ? pathname === "/"
                : pathname.startsWith(n.to);
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
                {n.label}
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
            採用情報
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
          <div className="mx-auto flex max-w-[1280px] flex-col px-5 py-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-4"
                style={{ fontSize: 15 }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/recruit"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center bg-brand py-3.5 text-brand-foreground"
            >
              採用情報
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}