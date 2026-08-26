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

type EdOpts = { label?: string; multiline?: boolean; clickThrough?: boolean };

// 各ページの編集対象にしないパス:
//  - header: / footer: … 全ページ共通の要素（ヘッダー・フッター）
//  - news: / interviews: … 記事（お知らせ・採用記事）は Payload CMS（/admin）へ
//    移行済み。ここで編集させると overrides.json に値が落ちて
//    「公開しても反映されない」事故になる。
function isCommon(path: string): boolean {
  return (
    path.startsWith("header:") ||
    path.startsWith("footer:") ||
    path.startsWith("news:") ||
    path.startsWith("interviews:")
  );
}

// data-edit 属性は編集モードに関係なく常に出力する（isCommon を除く）。
//  - 「SPで非表示」「PCで非表示」（hide:）の CSS は属性セレクタで効かせるため、
//    通常閲覧時にも属性が必要。
//  - 参考プロジェクトでは「編集モード時のみ付与」にしていたところ、SSR の HTML に
//    属性が無く React が属性だけのハイドレーション差分をパッチしないため
//    「編集対象が1つも見つからない」不具合が起きた（同じ轍を踏まない）。
// data-* 属性は不活性メタデータで、表示・挙動には一切影響しない。

/** テキスト編集対象の属性を付与 */
export function ed(path: string, label?: string, opts?: EdOpts): Record<string, string> {
  if (isCommon(path)) return {};
  const a: Record<string, string> = { "data-edit": path };
  if (label) a["data-edit-label"] = label;
  if (opts?.multiline) a["data-edit-multi"] = "1";
  // クリックスルー：選択（編集対象化）しつつ、要素本来のクリック動作（タブ切替など）も活かす
  if (opts?.clickThrough) a["data-edit-clickthrough"] = "1";
  return a;
}

/** リッチ本文（p＋リスト共存）の編集対象属性。RichBody コンポーネントが使う。
 * 値はプレーンテキストのまま保存し、行頭「・」「- 」の行をリスト表示する。
 * data-edit-rich を見て editBridge が textContent 書き換えではなく
 * p/ul の再構築でプレビュー反映する。 */
export function edRich(path: string, label?: string, opts?: { list?: boolean }): Record<string, string> {
  if (isCommon(path)) return {};
  // data-edit-rich="list" は「・」の有無に関係なく1行＝1リスト項目として表示するモード
  const a: Record<string, string> = { "data-edit": path, "data-edit-multi": "1", "data-edit-rich": opts?.list ? "list" : "1" };
  if (label) a["data-edit-label"] = label;
  return a;
}

/** 画像編集対象の属性を付与（ImageWithFallback / img に展開される） */
export function edImg(path: string, label?: string): Record<string, string> {
  if (isCommon(path)) return {};
  const a: Record<string, string> = { "data-edit-img": path };
  if (label) a["data-edit-label"] = label;
  return a;
}

/**
 * 選択式（プルダウン）の編集対象。値は汎用オーバーライドに文字列として保存される。
 * 例：背景動画とコンテンツの前後関係の切替。
 *   {...edSel("recruit3:layer.s3", "前後関係", OPTS, cur)}
 * data-edit-options は "値:表示名" を | 区切りで並べたもの。
 */
export function edSel(
  path: string,
  label: string,
  options: { value: string; label: string }[],
  current: string
): Record<string, string> {
  if (isCommon(path)) return {};
  return {
    "data-edit-select": path,
    "data-edit-label": label,
    "data-edit-options": options.map((o) => `${o.value}:${o.label}`).join("|"),
    "data-edit-value": current,
  };
}

/**
 * 繰り返しセクションの「項目数」設定。
 * コンテナに attrs を展開し、子要素を max 個描画しておくと、
 * theme.css の [data-repeat] ルールが設定数を超えた子要素を隠す
 * （公開値は data-edit-value、プレビューの下書きは data-edit-selected で反映）。
 * コンソールには「項目数」のプルダウンとして表示される。
 */
export function repeatSel(
  path: string,
  def: number,
  max: number,
  label = "項目数"
): { count: number; attrs: Record<string, string> } {
  const raw = parseInt(txt(path, String(def)), 10);
  const count = Math.min(max, Math.max(1, Number.isNaN(raw) ? def : raw));
  const options = Array.from({ length: max }, (_, i) => ({ value: String(i + 1), label: `${i + 1}項目` }));
  return {
    count,
    attrs: {
      ...edSel(path, label, options, String(count)),
      "data-repeat": "1",
      // コンソールの「追加」「削除」ボタン用メタ情報：
      // 項目パスの接頭辞（例 "recruit3:culture."）と枠の上限
      "data-repeat-prefix": path.replace(/count$/, ""),
      "data-repeat-max": String(max),
    },
  };
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

/** 画像と文章の横並び比率（画像の幅％）。CMSの「画像の幅％（30〜70）」項目を読む */
export function ratioPct(path: string, defPct: number): number {
  const v = parseInt(txt(path, String(defPct)), 10);
  if (Number.isNaN(v)) return defPct;
  return Math.min(70, Math.max(30, v));
}

/** grid-template-columns 用の値。imageFirst=画像列が先頭（1列目）か */
export function ratioCols(path: string, defImgPct: number, imageFirst: boolean): string {
  const p = ratioPct(path, defImgPct);
  return imageFirst ? `${p}fr ${100 - p}fr` : `${100 - p}fr ${p}fr`;
}

/**
 * 画像と文章の横並びグリッドへ付与する比率マークアップ。
 * コンソールはこの属性から「グリッド内の画像フィールド」と比率設定を対応付け、
 * 画像編集欄にスライダーを表示し、editBridge が --ratio を書き換えて即時プレビューする。
 * defRtl: グリッドが既定で PC の direction:rtl（左右反転表示）を使う場合に true。
 * コンソールの「左右入れ替え」（overrides の flip:<path> = "1"）は
 * この既定を基準に反対向きの direction を CSS で当てる（HideOverridesStyle 参照）。
 */
export function ratioAttrs(path: string, defImgPct: number, imageFirst: boolean, defRtl = false): Record<string, string> {
  return {
    "data-ratio": path,
    "data-ratio-def": String(defImgPct),
    "data-ratio-first": imageFirst ? "1" : "0",
    ...(defRtl ? { "data-ratio-rtl": "1" } : {}),
  };
}
