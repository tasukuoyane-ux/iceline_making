import { Link } from "react-router";
import { SITE, COMPANY_PROFILE } from "../../data/company";
import { ed, txt } from "../../lib/editable";

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
      { to: "/privacy", label: "プライバシーポリシー" },
    ],
  },
];

export function Footer() {
  const addr = COMPANY_PROFILE.find((p) => p.label === "所在地")?.value;
  const tel = COMPANY_PROFILE.find((p) => p.label === "TEL")?.value;
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 pc:grid-cols-[1.4fr_2fr] pc:px-8 pc:py-20">
        <div>
          <div {...ed("footer:brand", "ブランド表記")} style={{ fontFamily: "var(--font-accent)", fontSize: 30, letterSpacing: "0.06em" }}>{txt("footer:brand", "ICELINE")}</div>
          <p {...ed("footer:companyName", "会社名")} className="mt-3 text-white/70" style={{ fontSize: 13 }}>{txt("footer:companyName", SITE.name)}</p>
          <p {...ed("footer:contact", "所在地・連絡先", { multiline: true })} className="mt-4 text-white/60" style={{ fontSize: 13, lineHeight: 1.9, whiteSpace: "pre-line" }}>{txt("footer:contact", `${addr}\nTEL ${tel}`)}</p>
          <p {...ed("footer:tagline", "キャッチコピー")} className="mt-6 text-white/50" style={{ fontSize: 12 }}>{txt("footer:tagline", SITE.subTagline)}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 tab:grid-cols-3">
          {COLS.map((c, ci) => (
            <div key={c.title}>
              <p {...ed(`footer:cols.${ci}.title`, "見出し")} className="mb-4 text-white/50" style={{ fontSize: 12, letterSpacing: "0.1em" }}>{txt(`footer:cols.${ci}.title`, c.title)}</p>
              <ul className="space-y-3">
                {c.links.map((l, li) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-white/85 transition-colors hover:text-brand" style={{ fontSize: 14 }}>
                      <span {...ed(`footer:cols.${ci}.nav.${li}.label`, "ナビ項目")}>{txt(`footer:cols.${ci}.nav.${li}.label`, l.label)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 py-5 text-white/40 pc:px-8" style={{ fontSize: 12 }}>
          © {new Date().getFullYear()} <span {...ed("footer:copyright", "コピーライト")}>{txt("footer:copyright", SITE.name)}</span>
        </div>
      </div>
    </footer>
  );
}
