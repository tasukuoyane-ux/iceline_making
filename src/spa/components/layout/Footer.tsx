import { Link } from "react-router";
import { SITE, COMPANY_PROFILE } from "../../data/company";
import { ed, txt, img } from "../../lib/editable";

// フッター（デザイン支給 Iceline_Hojin の .site-footer）。
// 左＝白ロゴ画像＋所在地・TEL、右＝事業／会社／その他の3列リンク、下段コピーライト。
// 2026-09 改修：文字の「ICELINE」・会社名・タグラインをロゴ画像（デザイン支給 logo-white.png）に置き換えた。
const LOGO_WHITE = "/images/logo-white.png";

// sub: true の項目は一回り小さい文字で表示（会社情報の下の「株式会社アイスマウンテン」。2026-09-10 追加。ナビには出さない）
const COLS: { title: string; links: { to: string; label: string; sub?: boolean }[] }[] = [
  {
    title: "事業",
    links: [
      { to: "/ice", label: "氷・氷菓の製造販売" },
      { to: "/food", label: "業務用食材の販売" },
      { to: "/warehouse", label: "倉庫事業" },
      { to: "/dryice", label: "ドライアイスの販売" },
    ],
  },
  {
    title: "会社",
    links: [
      { to: "/company", label: "会社情報" },
      { to: "/ice-mountain", label: "株式会社アイスマウンテン", sub: true },
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
    <footer className="bg-[#666666] text-white">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 pc:grid-cols-[1.4fr_2fr] pc:px-8 pc:py-16">
        <div>
          <img src={img("footer:logo", LOGO_WHITE)} alt={`${SITE.nameEn} ${SITE.name}`} className="h-[52px] w-auto" loading="lazy" />
          <p {...ed("footer:contact", "所在地・連絡先", { multiline: true })} className="mt-4 text-white/60" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }}>{txt("footer:contact", `${addr}\nTEL ${tel}`)}</p>
        </div>
        <nav className="grid grid-cols-2 gap-8 tab:grid-cols-3" aria-label="フッターナビゲーション">
          {COLS.map((c, ci) => (
            <div key={c.title}>
              <p {...ed(`footer:cols.${ci}.title`, "見出し")} className="mb-4 text-white/50" style={{ fontSize: 13 }}>{txt(`footer:cols.${ci}.title`, c.title)}</p>
              <ul className="space-y-3">
                {c.links.map((l, li) => (
                  <li key={l.to} className={l.sub ? "-mt-1.5 pl-3" : undefined}>
                    <Link to={l.to} className="text-white/85 transition-colors hover:text-brand" style={{ fontSize: l.sub ? 12 : 14 }}>
                      <span {...ed(`footer:cols.${ci}.nav.${li}.label`, "ナビ項目")}>{txt(`footer:cols.${ci}.nav.${li}.label`, l.label)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 py-5 text-white/40 pc:px-8" style={{ fontSize: 13 }}>
          © {new Date().getFullYear()} <span {...ed("footer:copyright", "コピーライト")}>{txt("footer:copyright", SITE.name)}</span>
        </div>
      </div>
    </footer>
  );
}
