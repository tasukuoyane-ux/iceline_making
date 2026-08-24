// 編集可能な本文（p＋リスト共存）の行パーサ。
// コンソールの本文編集ボックスで、行頭に「・」または「- 」を付けた行は
// リスト項目（li）、それ以外の行は段落（p）として表示する。
// React 側（RichBody）と編集プレビューのDOMパッチ（editBridge）の両方で共用する。

export interface RichBlock {
  type: "p" | "ul";
  lines: string[];
}

const LIST_PREFIX = /^(?:・|-\s+)\s*(.*)$/;

export function parseRich(value: string, forceList = false): RichBlock[] {
  const blocks: RichBlock[] = [];
  for (const raw of (value || "").split("\n")) {
    const m = raw.match(LIST_PREFIX);
    if (m || (forceList && raw.trim() !== "")) {
      // forceList（例：受賞歴）は「・」の有無に関係なく1行＝1項目のリストにする
      const line = m ? m[1] : raw;
      const last = blocks[blocks.length - 1];
      if (last && last.type === "ul") last.lines.push(line);
      else blocks.push({ type: "ul", lines: [line] });
    } else if (!forceList) {
      blocks.push({ type: "p", lines: [raw] });
    }
  }
  return blocks;
}
