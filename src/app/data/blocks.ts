// 記事本文のブロック型。お知らせ・社員インタビューで共通利用。
// 段落 / 見出し(H2,H3) / 画像（任意でリンク付き）を自由な順番で並べられる。

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "image"; src: string; href?: string; alt?: string };

/** 文字列1つ、または文字列配列を段落ブロックへ変換（旧データの後方互換用） */
export function toBlocks(input: unknown): Block[] {
  if (Array.isArray(input)) {
    // Block[] か string[] かを判定
    if (input.length > 0 && typeof input[0] === "object" && input[0] && "type" in (input[0] as any)) {
      return input as Block[];
    }
    return (input as string[]).map((t) => ({ type: "paragraph", text: String(t) }));
  }
  if (typeof input === "string" && input) {
    return [{ type: "paragraph", text: input }];
  }
  return [];
}
