// ライブページ側の「編集モード」ヘルパー。
// /console の iframe 内で ?__edit=1 付きで読み込まれた時だけ有効化される。
//
// 2系統のパスがある:
//  - 既存の型付きJSON（news:/videos:/interviews:/sections:/images:）… 既定値もJSONにある
//  - 汎用オーバーライド（その他のパス）… 既定値はコード内、編集値だけ overrides.json に保存
//
// 使い方（ページ側）:
//   import { ed, edImg, txt, img } from "../lib/editable";
//   // 型付き（従来どおり）:
//   <h2 {...ed("sections:divisionBiz.ice.copy")}>{copy}</h2>
//   // 汎用オーバーライド（全ページ対応・既定値はコードに残す）:
//   <h3 {...ed("product:dry-ice:name", "商品名")}>{txt("product:dry-ice:name", p.name)}</h3>
//   <img {...edImg("product:dry-ice:image","商品画像")} src={img("product:dry-ice:image", PRODUCT_IMG[id])} />
//
// data-edit       : テキスト編集対象（下書き/公開は textContent を反映）
// data-edit-img   : 画像編集対象（下書き/公開は img.src を反映）
// data-edit-label : 右パネルでの表示名
// data-edit-multi : 複数行（textarea で編集）

import overridesData from "../../content/overrides.json";

const OVERRIDES = overridesData as Record<string, string>;

export const EDIT_MODE: boolean =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("__edit");

type EdOpts = { label?: string; multiline?: boolean };

// 全ページ共通の要素（ヘッダー・フッター）は各ページの編集対象にしない。
function isCommon(path: string): boolean {
  return path.startsWith("header:") || path.startsWith("footer:");
}

/** テキスト編集対象の属性を付与 */
export function ed(path: string, label?: string, opts?: EdOpts): Record<string, string> {
  if (!EDIT_MODE || isCommon(path)) return {};
  const a: Record<string, string> = { "data-edit": path };
  if (label) a["data-edit-label"] = label;
  if (opts?.multiline) a["data-edit-multi"] = "1";
  return a;
}

/** 画像編集対象の属性を付与（ImageWithFallback / img に展開される） */
export function edImg(path: string, label?: string): Record<string, string> {
  if (!EDIT_MODE || isCommon(path)) return {};
  const a: Record<string, string> = { "data-edit-img": path };
  if (label) a["data-edit-label"] = label;
  return a;
}

/** 汎用オーバーライドのテキスト値（編集済みなら override、無ければ既定値） */
export function txt(path: string, def: string): string {
  const v = OVERRIDES[path];
  return v !== undefined && v !== "" ? v : def;
}

/** 汎用オーバーライドの画像URL（編集済みなら override、無ければ既定値） */
export function img(path: string, def: string): string {
  const v = OVERRIDES[path];
  return v !== undefined && v !== "" ? v : def;
}
