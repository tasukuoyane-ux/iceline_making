import { Link, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { NEWS } from "../data/news";
import { ed } from "../lib/editable";

export function NewsDetail() {
  const { id } = useParams();
  const n = NEWS.find((x) => x.id === id);

  if (!n) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-32 text-center">
        <p>記事が見つかりませんでした。</p>
        <Link to="/news" className="mt-4 inline-block text-brand">お知らせ一覧へ</Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-14 pc:py-20">
      <Link to="/news" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-brand" style={{ fontSize: 13 }}>
        <ChevronLeft size={16} /> お知らせ一覧
      </Link>
      <div className="mt-6 flex items-center gap-4">
        <span className="text-muted-foreground" style={{ fontSize: 13 }} {...ed(`news:${n.id}:date`)}>{n.date}</span>
        <span className="bg-secondary px-3 py-0.5 text-muted-foreground" style={{ fontSize: 12 }} {...ed(`news:${n.id}:category`)}>{n.category}</span>
      </div>
      <h1 className="mt-4" style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.5 }} {...ed(`news:${n.id}:title`)}>{n.title}</h1>
      <div className="mt-8 border-t border-border pt-8">
        <p style={{ fontSize: 15, lineHeight: 2.1 }} {...ed(`news:${n.id}:body`)}>{n.body}</p>
      </div>
    </article>
  );
}
