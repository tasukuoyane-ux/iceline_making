// ライブページ側の「編集モード」ヘルパー。
// /console の iframe 内で ?__edit=1 付きで読み込まれた時だけ有効化される。
//
// 使い方（ページ側）:
//   import { ed, edImg } from "../lib/editable";
//   <h2 {...ed("sections:divisionBiz.ice.copy")}>{copy}</h2>
//   <ImageWithFallback {...edImg("images:IMG.iceMacro")} src={...} />
//
// data-edit       : テキスト系の編集対象（下書きは textContent を書き換え）
// data-edit-img   : 画像系の編集対象（下書きは img.src を書き換え）

export const EDIT_MODE: boolean =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("__edit");

/** テキスト編集対象の属性を付与 */
export function ed(path: string): { "data-edit"?: string } {
  return EDIT_MODE ? { "data-edit": path } : {};
}

/** 画像編集対象の属性を付与（ImageWithFallback / img に展開される） */
export function edImg(path: string): { "data-edit-img"?: string } {
  return EDIT_MODE ? { "data-edit-img": path } : {};
}
