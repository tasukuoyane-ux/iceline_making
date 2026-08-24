import { CSSProperties } from "react";
import { parseRich } from "../../lib/richText";
import { edRich } from "../../lib/editable";

/**
 * 編集可能な本文ブロック（段落とリストの共存）。
 * text はプレーンテキストで、行頭に「・」または「- 」を付けた行が
 * リスト項目（li）、それ以外の行が段落（p）として表示される。
 * 見た目のスタイル（余白・リストマーカー）は theme.css の
 * [data-edit-rich] ルールで定義している。
 */
export function RichBody({
  path,
  text,
  label,
  className,
  style,
  list,
}: {
  path: string;
  text: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** true なら「・」の有無に関係なく1行＝1リスト項目として表示（例：受賞歴） */
  list?: boolean;
}) {
  return (
    <div className={className} style={style} {...edRich(path, label, { list })} data-edit-default={text}>
      {parseRich(text, list).map((b, i) =>
        b.type === "ul" ? (
          <ul key={i}>
            {b.lines.map((l, j) => (
              <li key={j}>{l}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.lines[0] || " "}</p>
        )
      )}
    </div>
  );
}
