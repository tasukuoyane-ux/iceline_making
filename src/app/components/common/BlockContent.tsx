// 記事本文ブロックの公開側レンダラー（段落 / H2 / H3 / 画像[リンク可]）。
import { Block } from "../../data/blocks";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export function BlockContent({ blocks, className = "" }: { blocks: Block[]; className?: string }) {
  return (
    <div className={"space-y-6 " + className}>
      {blocks.map((b, i) => {
        if (b.type === "h2") {
          return (
            <h2 key={i} className="pt-2" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.5 }}>
              {b.text}
            </h2>
          );
        }
        if (b.type === "h3") {
          return (
            <h3 key={i} className="pt-1 text-brand" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.6 }}>
              {b.text}
            </h3>
          );
        }
        if (b.type === "image") {
          const imgEl = (
            <ImageWithFallback
              src={b.src}
              alt={b.alt || ""}
              className="w-full rounded-xl object-cover"
            />
          );
          return (
            <figure key={i} className="my-2">
              {b.href ? (
                <a href={b.href} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-90">
                  {imgEl}
                </a>
              ) : (
                imgEl
              )}
              {b.alt && (
                <figcaption className="mt-2 text-center text-muted-foreground" style={{ fontSize: 12 }}>
                  {b.alt}
                </figcaption>
              )}
            </figure>
          );
        }
        // paragraph
        return (
          <p key={i} style={{ fontSize: 16, lineHeight: 2.1, whiteSpace: "pre-line" }}>
            {b.text}
          </p>
        );
      })}
    </div>
  );
}
