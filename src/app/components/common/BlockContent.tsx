// 記事本文ブロックの公開側レンダラー（段落 / H2 / H3 / 画像[リンク可] / 動画）。
import { Block } from "../../data/blocks";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toEmbed } from "../../lib/video";

// マーカー（蛍光ペン）：文字の下1/3から2px下にアクセントカラーを添える。
// 行高に左右されないよう、ベースライン基準の太い下線で表現。
const MARKER_STYLE: React.CSSProperties = {
  textDecorationLine: "underline",
  textDecorationColor: "rgba(230,0,18,0.38)",
  textDecorationThickness: "0.3em",
  textUnderlineOffset: "-0.18em",
  textDecorationSkipInk: "none",
} as React.CSSProperties;

// 段落テキスト内の **太字** と ==マーカー== を React ノードへ変換。
function renderInline(text: string) {
  const out: (string | JSX.Element)[] = [];
  const re = /\*\*([^*]+)\*\*|==([^=]+)==/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={key++}>{m[1]}</strong>);
    else if (m[2] !== undefined) out.push(<span key={key++} style={MARKER_STYLE}>{m[2]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

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
        if (b.type === "video") {
          const embed = toEmbed(b.src);
          return (
            <figure key={i} className="my-2">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                {embed?.type === "iframe" ? (
                  <iframe
                    src={embed.src}
                    title={b.caption || "動画"}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : embed?.type === "video" ? (
                  <video src={embed.src} controls playsInline className="h-full w-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/70" style={{ fontSize: 14 }}>
                    動画は準備中です。
                  </div>
                )}
              </div>
              {b.caption && (
                <figcaption className="mt-2 text-center text-muted-foreground" style={{ fontSize: 12 }}>
                  {b.caption}
                </figcaption>
              )}
            </figure>
          );
        }
        // paragraph
        return (
          <p key={i} style={{ fontSize: 16, lineHeight: 2.1, whiteSpace: "pre-line" }}>
            {renderInline(b.text)}
          </p>
        );
      })}
    </div>
  );
}
