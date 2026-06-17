import { useState } from "react";
import { Link } from "react-router";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { NEWS } from "../data/news";
import { cn } from "../components/ui/utils";

const CATS = ["すべて", "お知らせ", "製品", "採用", "メディア"] as const;

export function News() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("すべて");
  const items = cat === "すべて" ? NEWS : NEWS.filter((n) => n.category === cat);

  return (
    <Section heat={HEAT.newsList}>
      <SectionTitle en="NEWS" jp="お知らせ" />

      <div className="mt-8 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "border px-4 py-2 transition-colors",
              cat === c ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand"
            )}
            style={{ fontSize: 13 }}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="mt-8 divide-y divide-border border-t border-border">
        {items.map((n) => (
          <li key={n.id}>
            <Link to={`/news/${n.id}`} className="flex flex-col gap-2 py-5 transition-colors hover:text-brand tab:flex-row tab:items-center tab:gap-6">
              <span className="text-muted-foreground" style={{ fontSize: 13 }}>{n.date}</span>
              <span className="inline-flex w-fit bg-secondary px-3 py-0.5 text-muted-foreground" style={{ fontSize: 12 }}>{n.category}</span>
              <span style={{ fontSize: 15 }}>{n.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
