import { CSSProperties, Fragment } from "react";
import { parseRich, splitColorTokens } from "../../lib/richText";
import { edRich } from "../../lib/editable";

/** 1行を行内色トークン（[[red:文字]] / [[#rrggbb:文字]]）込みで描画する */
function renderLine(line: string) {
  const segs = splitColorTokens(line);
  if (segs.length === 1 && !segs[0].color) return segs[0].text;
  return segs.map((s, i) =>
    s.color ? (
      <span key={i} style={{ color: s.color }}>{s.text}</span>
    ) : (
      <Fragment key={i}>{s.text}</Fragment>
    )
  );
}

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
              <li key={j}>{renderLine(l)}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.lines[0] ? renderLine(b.lines[0]) : " "}</p>
        )
      )}
    </div>
  );
}
