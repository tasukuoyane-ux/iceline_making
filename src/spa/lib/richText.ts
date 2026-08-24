// 編集可能な本文（p＋リスト共存）の行パーサ。
// コンソールの本文編集ボックスで、行頭に「・」または「- 」を付けた行は
// リスト項目（li）、それ以外の行は段落（p）として表示する。
// React 側（RichBody）と編集プレビューのDOMパッチ（editBridge）の両方で共用する。

export interface RichBlock {
  type: "p" | "ul";
  lines: string[];
}

/** 行内の装飾付きセグメント。color / size が undefined なら既定のまま */
export interface RichSegment {
  text: string;
  color?: string;
  size?: RichSize;
}
export type RichSize = "xl" | "lg" | "sm";

// 行内の装飾トークン: [[属性:文字]]。属性は「,」「・」「+」区切りで複数指定できる。
//   文字色 … red / white / black / #rrggbb
//   文字サイズ … 特大(xl) / 大(lg) / 小(sm)
// 例: [[red:文字]] [[特大:文字]] [[特大,red:文字]]
const DECOR_TOKEN = /\[\[([^:\]]+):([^\]]*)\]\]/g;
const NAMED_COLORS: Record<string, string> = { red: "#E60012", white: "#ffffff", black: "#111111" };
const SIZE_NAMES: Record<string, RichSize> = { xl: "xl", "特大": "xl", lg: "lg", "大": "lg", sm: "sm", "小": "sm" };

/** サイズトークンのインラインスタイル（要素の基準サイズに対する倍率） */
export function sizeStyle(size?: RichSize): { fontSize: string; fontWeight?: number; lineHeight?: number } | undefined {
  if (size === "xl") return { fontSize: "3em", fontWeight: 900, lineHeight: 1.6 };
  if (size === "lg") return { fontSize: "1.6em", fontWeight: 800, lineHeight: 1.6 };
  if (size === "sm") return { fontSize: "1em" };
  return undefined;
}

/** 1行を装飾トークンで分割する（トークンが無ければ1セグメント） */
export function splitColorTokens(line: string): RichSegment[] {
  const out: RichSegment[] = [];
  let last = 0;
  DECOR_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DECOR_TOKEN.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    const seg: RichSegment = { text: m[2] };
    for (const part of m[1].split(/[,，・+]/)) {
      const p = part.trim().toLowerCase();
      if (!p) continue;
      if (NAMED_COLORS[p]) seg.color = NAMED_COLORS[p];
      else if (/^#[0-9a-f]{3,8}$/.test(p)) seg.color = p;
      else if (SIZE_NAMES[p]) seg.size = SIZE_NAMES[p];
      // 未知の属性は無視（トークン自体は消費してテキストだけ表示する）
    }
    out.push(seg);
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
