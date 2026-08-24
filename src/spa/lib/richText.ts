// 編集可能な本文（p＋リスト共存）の行パーサ。
// コンソールの本文編集ボックスで、行頭に「・」または「- 」を付けた行は
// リスト項目（li）、それ以外の行は段落（p）として表示する。
// React 側（RichBody）と編集プレビューのDOMパッチ（editBridge）の両方で共用する。

export interface RichBlock {
  type: "p" | "ul";
  lines: string[];
}

/** 行内の色付きセグメント。color が undefined なら既定色 */
export interface RichSegment {
  text: string;
  color?: string;
}

// 行内の文字色トークン: [[red:文字]] または [[#rrggbb:文字]]
const COLOR_TOKEN = /\[\[([^:\]]+):([^\]]*)\]\]/g;
const NAMED_COLORS: Record<string, string> = { red: "#E60012", white: "#ffffff", black: "#111111" };

/** 1行を色トークンで分割する（トークンが無ければ1セグメント） */
export function splitColorTokens(line: string): RichSegment[] {
  const out: RichSegment[] = [];
  let last = 0;
  COLOR_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COLOR_TOKEN.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    const raw = m[1].trim().toLowerCase();
    const color = NAMED_COLORS[raw] ?? (/^#[0-9a-f]{3,8}$/.test(raw) ? raw : undefined);
    out.push({ text: m[2], color });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  if (out.length === 0) out.push({ text: "" });
  return out;
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
