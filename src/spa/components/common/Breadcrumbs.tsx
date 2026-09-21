// パンくずリスト（2026-09-21 追加。メインビジュアル PageMv の画像の上に置く）。
// 先頭に「ホーム」を自動で付け、区切りは「｜」。最後の項目は現在ページ（リンクなし・太字）。
// 例：ホーム｜サービス｜氷・氷菓の製造販売
import { Link } from "react-router";

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  const all = [{ label: "ホーム", to: "/" }, ...items];
  return (
    <nav aria-label="パンくずリスト" className="px-[30px] pt-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ fontSize: 12, letterSpacing: "0.04em", lineHeight: 1.8 }}>
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={i} className="flex items-center gap-x-2">
              {i > 0 && (
                <span aria-hidden className="text-muted-foreground">
                  ｜
                </span>
              )}
              {last || !c.to ? (
                <span className="text-foreground" style={{ fontWeight: last ? 700 : 400 }} aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link to={c.to} className="text-muted-foreground transition-colors hover:text-brand">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
