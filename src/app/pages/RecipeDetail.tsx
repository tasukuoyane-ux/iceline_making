import { Link, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { findRecipe } from "../data/products";
import { ed, edImg, txt, img } from "../lib/editable";

export function RecipeDetail() {
  const { id } = useParams();
  const recipe = id ? findRecipe(id) : undefined;

  if (!recipe) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-32 text-center">
        <p>レシピが見つかりませんでした。</p>
        <Link to="/ice" className="mt-4 inline-block text-brand">アイス事業部へ戻る</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 pc:py-16">
      <Link
        to="/ice#ice-recipe"
        className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-brand"
        style={{ fontSize: 13 }}
      >
        <ChevronLeft size={16} /> 氷のレシピへ戻る
      </Link>

      <div className="mt-6">
        <span className="inline-flex bg-secondary px-3 py-1 text-muted-foreground" style={{ fontSize: 12 }}>
          {recipe.category}
        </span>
        <h1 className="mt-3" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.35 }} {...ed(`recipe:${recipe.id}:name`, "レシピ名")}>{txt(`recipe:${recipe.id}:name`, recipe.name)}</h1>
      </div>

      <ImageWithFallback
        {...edImg(`recipe:${recipe.id}:image`, "レシピ画像")}
        src={img(`recipe:${recipe.id}:image`, recipe.image)}
        alt={recipe.name}
        className="mt-8 aspect-[4/3] w-full rounded-2xl bg-secondary object-cover"
      />

      <div className="mt-10 grid gap-10 tab:grid-cols-[260px_1fr]">
        {/* 材料 */}
        <div>
          <h2 className="border-b-2 border-brand pb-2 text-brand" style={{ fontSize: 18, fontWeight: 700 }}>材料</h2>
          <ul className="mt-4 space-y-2">
            {recipe.materials.map((m, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-border/60 pb-2 text-foreground/80" style={{ fontSize: 14 }} {...ed(`recipe:${recipe.id}:materials.${i}`, `材料${i + 1}`)}>
                {txt(`recipe:${recipe.id}:materials.${i}`, m)}
              </li>
            ))}
          </ul>
        </div>

        {/* 作り方 */}
        <div>
          <h2 className="border-b-2 border-brand pb-2 text-brand" style={{ fontSize: 18, fontWeight: 700 }}>作り方</h2>
          <ol className="mt-4 space-y-4">
            {recipe.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 1.8 }}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground" style={{ fontSize: 13, fontWeight: 700 }}>
                  {i + 1}
                </span>
                <span className="pt-0.5" style={{ whiteSpace: "pre-line" }} {...ed(`recipe:${recipe.id}:steps.${i}`, `作り方${i + 1}`, { multiline: true })}>{txt(`recipe:${recipe.id}:steps.${i}`, s)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
