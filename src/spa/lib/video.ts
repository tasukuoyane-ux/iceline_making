// 動画URLの埋め込み判定。YouTube/Vimeo の共有URLは iframe 埋め込みURLへ変換し、
// それ以外（mp4 / webm / mov 等の直リンク・アップロードファイル）は <video> 再生扱いにする。
export type Embed = { type: "iframe" | "video"; src: string };

const YT_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

export function toEmbed(url: string): Embed | null {
  if (!url) return null;
  const yt = url.match(YT_RE);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(VIMEO_RE);
  if (vimeo) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { type: "video", src: url };
}

/**
 * 動画の「1フレーム目」相当の静止画の出し方を判定する（アイキャッチ動画のポスター用）。
 *  - YouTube: サムネイル画像URL（image）
 *  - mp4 等の直リンク: <video preload="metadata"> で1フレーム目を描画（video）
 *  - Vimeo など取得できないもの: null（呼び出し側でプレースホルダー表示）
 */
export function videoPoster(url: string): { type: "image" | "video"; src: string } | null {
  if (!url) return null;
  const yt = url.match(YT_RE);
  if (yt) return { type: "image", src: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` };
  if (VIMEO_RE.test(url)) return null;
  // #t=0.001 を付けると iOS Safari でも1フレーム目が描画される
  return { type: "video", src: url.includes("#") ? url : `${url}#t=0.001` };
}
