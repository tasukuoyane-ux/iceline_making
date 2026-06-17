import { Link } from "react-router";
import { SITE, COMPANY_PROFILE } from "../../data/company";

const COLS = [
  {
    title: "事業",
    links: [
      { to: "/food", label: "食品事業部" },
      { to: "/ice", label: "アイス事業部" },
    ],
  },
  {
    title: "会社",
    links: [
      { to: "/company", label: "会社情報" },
      { to: "/news", label: "お知らせ" },
      { to: "/videos", label: "動画で知るアイスライン" },
    ],
  },
  {
    title: "その他",
    links: [
      { to: "/recruit", label: "採用情報" },
      { to: "/contact", label: "お問い合わせ" },
    ],
  },
];

export function Footer() {
  const addr = COMPANY_PROFILE.find((p) => p.label === "所在地")?.value;
  const tel = COMPANY_PROFILE.find((p) => p.label === "TEL")?.value;
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 pc:grid-cols-[1.4fr_2fr] pc:px-8 pc:py-20">
        <div>
          <div style={{ fontFamily: "var(--font-accent)", fontSize: 30, letterSpacing: "0.06em" }}>ICELINE</div>
          <p className="mt-3 text-white/70" style={{ fontSize: 13 }}>{SITE.name}</p>
          <p className="mt-4 text-white/60" style={{ fontSize: 13, lineHeight: 1.9 }}>
            {addr}
            <br />
            TEL {tel}
          </p>
          <p className="mt-6 text-white/50" style={{ fontSize: 12 }}>{SITE.subTagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 tab:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-white/50" style={{ fontSize: 12, letterSpacing: "0.1em" }}>{c.title}</p>
              <ul className="space-y-3">
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-white/85 transition-colors hover:text-brand" style={{ fontSize: 14 }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-5 py-5 text-white/40 pc:px-8" style={{ fontSize: 12 }}>
          © {new Date().getFullYear()} {SITE.name}
        </div>
      </div>
    </footer>
  );
}
