// 編集可能な本文（p＋リスト共存）の行パーサ。
// コンソールの本文編集ボックスで、行頭に「・」または「- 」を付けた行は
// リスト項目（li）、それ以外の行は段落（p）として表示する。
// React 側（RichBody / richInline）と編集プレビューのDOMパッチ（editBridge）の両方で共用する。
//
// 行内の装飾トークン（2026-09-10 に太字・リンクを追加。サイト全域のテキスト欄で使える）:
//   [[red:文字]] [[特大:文字]] [[特大,red:文字]] … 文字色・文字サイズ
//   **文字**                                    … 太字
//   [表示文字](https://example.com/)              … リンク（外部URLは別タブで開く）
// トークンは入れ子にできる（例: **[[red:文字]]**、[**文字**](URL)）。

export interface RichBlock {
  type: "p" | "ul";
  lines: string[];
}

/** 行内の装飾付きセグメント。color / size / bold / href が undefined なら既定のまま */
export interface RichSegment {
  text: string;
  color?: string;
  size?: RichSize;
  /** 元の [[属性:…]] の属性文字列（DOM→テキストの復元用。color/size の元） */
  attr?: string;
  bold?: boolean;
  href?: string;
}
export type RichSize = "xl" | "lg" | "sm";

// 行内トークン（左から順に最初に見つかったものを処理する）:
//   1. [[属性:文字]]   2. **文字**   3. [文字](URL)
const INLINE_TOKEN =
  /\[\[([^:\]]+):([^\]]*)\]\]|\*\*([^*\n]+?)\*\*|\[([^\[\]\n]+)\]\(((?:https?:\/\/|mailto:|tel:|\/)[^\s)]*)\)/g;
const NAMED_COLORS: Record<string, string> = { red: "#E60012", white: "#ffffff", black: "#111111" };
const SIZE_NAMES: Record<string, RichSize> = { xl: "xl", "特大": "xl", lg: "lg", "大": "lg", sm: "sm", "小": "sm" };

/** 文字列に装飾トークンが含まれるか（含まれなければプレーン文字列のまま描画してよい） */
export function hasInlineMarkup(text: string): boolean {
  INLINE_TOKEN.lastIndex = 0;
  return INLINE_TOKEN.test(text);
}

/** サイズトークンのインラインスタイル（要素の基準サイズに対する倍率）。
 * 大は特大の約7割（トップMVモックの「氷と食で、…」の「と」のサイズ感）。 */
export function sizeStyle(size?: RichSize): { fontSize: string; fontWeight?: number; lineHeight?: number } | undefined {
  if (size === "xl") return { fontSize: "3em", fontWeight: 900, lineHeight: 1.6 };
  if (size === "lg") return { fontSize: "2.1em", fontWeight: 900, lineHeight: 1.6 };
  if (size === "sm") return { fontSize: "1em" };
  return undefined;
}

/** [[属性:…]] の属性文字列（「,」「・」「+」区切り）を color / size に解釈する */
function parseAttr(attr: string): Pick<RichSegment, "color" | "size"> {
  const out: Pick<RichSegment, "color" | "size"> = {};
  for (const part of attr.split(/[,，・+]/)) {
    const p = part.trim().toLowerCase();
    if (!p) continue;
    if (NAMED_COLORS[p]) out.color = NAMED_COLORS[p];
    else if (/^#[0-9a-f]{3,8}$/.test(p)) out.color = p;
    else if (SIZE_NAMES[p]) out.size = SIZE_NAMES[p];
    // 未知の属性は無視（トークン自体は消費してテキストだけ表示する）
  }
  return out;
}

type Base = Omit<RichSegment, "text">;

function parseInline(text: string, base: Base, depth: number, out: RichSegment[]) {
  if (depth > 3 || text === "") {
    if (text !== "") out.push({ ...base, text });
    return;
  }
  const re = new RegExp(INLINE_TOKEN.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ ...base, text: text.slice(last, m.index) });
    if (m[1] !== undefined) {
      // [[属性:文字]]：内側でも **太字** / リンクを使える
      const attr = m[1];
      parseInline(m[2], { ...base, ...parseAttr(attr), attr: (base.attr ? base.attr + "," : "") + attr }, depth + 1, out);
    } else if (m[3] !== undefined) {
      parseInline(m[3], { ...base, bold: true }, depth + 1, out);
    } else {
      parseInline(m[4], { ...base, href: m[5] }, depth + 1, out);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ ...base, text: text.slice(last) });
}

/** 1行を装飾トークンで分割する（トークンが無ければ1セグメント）。
 * 名前は互換のため「splitColorTokens」のまま（太字・リンクも扱う） */
export function splitColorTokens(line: string): RichSegment[] {
  const out: RichSegment[] = [];
  parseInline(line, {}, 0, out);
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

// ─────────────────────────────────────────────────────────
// DOM ヘルパー（編集プレビュー用：editBridge が使う）
// ─────────────────────────────────────────────────────────

/** 外部URL（別タブで開く）か */
export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href);
}

/** 1セグメントをDOMノードにする（a > strong > span の入れ子。richInline.tsx の React 版と同じ構造） */
function segmentToNode(seg: RichSegment): Node {
  let node: Node = document.createTextNode(seg.text);
  if (seg.attr) {
    const sp = document.createElement("span");
    sp.setAttribute("data-rt", seg.attr);
    if (seg.color) sp.style.color = seg.color;
    const sz = sizeStyle(seg.size);
    if (sz) {
      sp.style.fontSize = sz.fontSize;
      if (sz.fontWeight) sp.style.fontWeight = String(sz.fontWeight);
      if (sz.lineHeight) sp.style.lineHeight = String(sz.lineHeight);
    }
    sp.appendChild(node);
    node = sp;
  }
  if (seg.bold) {
    const st = document.createElement("strong");
    st.className = "rt-b";
    st.appendChild(node);
    node = st;
  }
  if (seg.href) {
    const a = document.createElement("a");
    a.className = "rt-link";
    a.href = seg.href;
    if (isExternalHref(seg.href)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    a.appendChild(node);
    node = a;
  }
  return node;
}

/** 行内トークン付きの文字列を要素の末尾へ流し込む */
export function appendInline(node: Node, text: string) {
  for (const seg of splitColorTokens(text)) node.appendChild(segmentToNode(seg));
}

/** 描画済みDOMから、装飾トークン付きの元テキストを復元する
 * （コンソールへ現在値を送るとき、textContent だと太字・リンク等の記法が失われるため） */
export function serializeInline(el: Node): string {
  let s = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      s += n.nodeValue ?? "";
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const e = n as HTMLElement;
    const inner = serializeInline(e);
    if (e.tagName === "A" && e.classList.contains("rt-link")) s += `[${inner}](${e.getAttribute("href") ?? ""})`;
    else if (e.tagName === "STRONG" && e.classList.contains("rt-b")) s += `**${inner}**`;
    else if (e.hasAttribute("data-rt")) s += `[[${e.getAttribute("data-rt")}:${inner}]]`;
    else s += inner;
  });
  return s;
}
