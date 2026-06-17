import { Link, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PRODUCTS } from "../data/products";
import { PRODUCT_IMG } from "../data/images";

export function ProductDetail() {
  const { id } = useParams();
  const p = PRODUCTS.find((pr) => pr.id === id);

  if (!p) {
    return (
      <div className="mx-auto max-w-[1280px] px-5 py-32 text-center">
        <p>商品が見つかりませんでした。</p>
        <Link to="/" className="mt-4 inline-block text-brand">TOPへ戻る</Link>
      </div>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: "商品名", value: p.name },
    { label: "規格", value: p.spec },
    { label: "内容量", value: p.netWeight },
    { label: "原材料", value: p.ingredients },
    { label: "アレルゲン", value: p.allergens },
    { label: "保存方法", value: p.storage },
    { label: "賞味期限", value: p.bestBefore },
    { label: "認証情報", value: p.certification },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-12 pc:px-8 pc:py-16">
      <Link to={`/${p.division}`} className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-brand" style={{ fontSize: 13 }}>
        <ChevronLeft size={16} /> {p.division === "food" ? "食品事業部" : "アイス事業部"}へ戻る
      </Link>

      <div className="mt-6 grid gap-10 pc:grid-cols-2">
        <ImageWithFallback src={PRODUCT_IMG[p.id]} alt={p.name} className="aspect-square w-full rounded-2xl object-cover" />
        <div>
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{p.genre}</span>
          <h1 className="mt-1" style={{ fontSize: 32, fontWeight: 900 }}>{p.name}</h1>
          <p className="mt-3 text-brand" style={{ fontSize: 16, fontWeight: 700 }}>{p.catch}</p>

          <table className="mt-8 w-full border-t border-border">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border align-top">
                  <th className="w-32 bg-secondary px-4 py-3 text-left text-muted-foreground" style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</th>
                  <td className="px-4 py-3" style={{ fontSize: 14, lineHeight: 1.8 }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {p.recipe && (
            <div className="mt-6 rounded-lg bg-secondary p-5">
              <p className="text-brand" style={{ fontSize: 13, fontWeight: 700 }}>活用レシピ（動画連携予定）</p>
              <p className="mt-2" style={{ fontSize: 14, lineHeight: 1.9 }}>{p.recipe}</p>
            </div>
          )}

          <Link to="/contact" className="mt-8 inline-flex items-center justify-center rounded-md bg-brand px-6 py-3 text-brand-foreground transition-colors hover:bg-brand-dark" style={{ fontSize: 14 }}>
            この商品について問い合わせる
          </Link>
        </div>
      </div>
    </div>
  );
}
