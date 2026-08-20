// 動画URLの埋め込み判定。YouTube/Vimeo の共有URLは iframe 埋め込みURLへ変換し、
// それ以外（mp4 / webm / mov 等の直リンク・アップロードファイル）は <video> 再生扱いにする。
export type Embed = { type: "iframe" | "video"; src: string };

export function toEmbed(url: string): Embed | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { type: "video", src: url };
}
