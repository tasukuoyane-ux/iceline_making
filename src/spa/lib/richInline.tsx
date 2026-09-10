// 行内装飾（太字・リンク・文字色・文字サイズ）の React 描画。
// コンソールのテキスト欄に **太字** / [文字](URL) / [[red:文字]] と書くと、
// ページ側でここが strong / a / span に展開する（2026-09-10 追加・サイト全域対応）。
//
//   {rt("company:hero.title", "会社情報")}   … txt() の代わりに使う（編集値→既定値の順に読み、装飾を展開）
//   {rich(someString)}                         … 既に手元にある文字列を装飾付きで描画
//
// トークンが無い文字列はそのまま string を返すので、従来と描画結果は変わらない。
import { CSSProperties, Fragment, ReactNode } from "react";
import { hasInlineMarkup, isExternalHref, sizeStyle, splitColorTokens, type RichSegment } from "./richText";
import { txt } from "./editable";

function segmentToNode(seg: RichSegment, key: number): ReactNode {
  let node: ReactNode = seg.text;
  if (seg.attr) {
    const style: CSSProperties = { ...(sizeStyle(seg.size) ?? {}), ...(seg.color ? { color: seg.color } : {}) };
    node = (
      <span data-rt={seg.attr} style={style}>
        {node}
      </span>
    );
  }
  if (seg.bold) node = <strong className="rt-b">{node}</strong>;
  if (seg.href) {
    node = isExternalHref(seg.href) ? (
      <a className="rt-link" href={seg.href} target="_blank" rel="noopener noreferrer">
        {node}
      </a>
    ) : (
      <a className="rt-link" href={seg.href}>
        {node}
      </a>
    );
  }
  return <Fragment key={key}>{node}</Fragment>;
}

/** 1行（改行を含んでもよい）を装飾付きで描画する。トークンが無ければ文字列をそのまま返す */
export function rich(text: string): ReactNode {
  if (!text || !hasInlineMarkup(text)) return text;
  return splitColorTokens(text).map((s, i) => segmentToNode(s, i));
}

/** txt() の装飾対応版 */
export function rt(path: string, def: string): ReactNode {
  return rich(txt(path, def));
}
