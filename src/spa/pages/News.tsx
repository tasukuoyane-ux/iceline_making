import { useState } from "react";
import { Link } from "react-router";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { useNews } from "../data/news";
import { hasVideo } from "../data/blocks";
import { cn } from "../components/ui/utils";
import { ed } from "../lib/editable";
import { InlineMovieTag } from "../components/common/MovieBadge";

const CATS = ["すべて", "お知らせ", "製品", "採用", "メディア"] as const;

export function News() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("すべて");
  const news = useNews() ?? [];
  const items = cat === "すべて" ? news : news.filter((n) => n.category === cat);

  return (
    <Section heat={HEAT.newsList}>
      <SectionTitle en="NEWS" jp="お知らせ" path="sectionEn:newsList.title" />

      <div className="mt-8 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "border px-4 py-2 transition-colors",
              cat === c ? "border-brand bg-brand text-brand-foreground" : "border-border bg-white hover:border-brand"
            )}
            style={{ fontSize: 13 }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* リンク（インタラクティブ要素）の背景は無地の白 */}
      <ul className="mt-8 divide-y divide-border rounded-xl bg-white px-5 shadow-sm">
        {items.map((n) => (
          <li key={n.id}>
            <Link to={`/news/${n.id}`} className="flex flex-col gap-2 py-5 transition-colors hover:text-brand tab:flex-row tab:items-center tab:gap-6">
              <span className="text-muted-foreground" style={{ fontSize: 13 }} {...ed(`news:${n.id}:date`)}>{n.date}</span>
              <span className="inline-flex w-fit bg-secondary px-3 py-0.5 text-muted-foreground" style={{ fontSize: 12 }} {...ed(`news:${n.id}:category`)}>{n.category}</span>
              <span className="flex items-center gap-2" style={{ fontSize: 15 }}>
                <span {...ed(`news:${n.id}:title`)}>{n.title}</span>
                {hasVideo(n.blocks) && <InlineMovieTag />}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
