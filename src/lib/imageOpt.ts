// 画像最適化URLヘルパー（サーバ・クライアント共用の純関数）。
// Vercel の画像最適化（/_next/image）を経由させ、元ファイルを一切変更せずに
// WebP 変換＋端末幅に応じた縮小配信を行う（例：2.6MB の PNG → 数十KB）。
// 対象は next.config.ts の images.remotePatterns に列挙したホストと
// 同一オリジン（public/ 配下）のみ。それ以外は素の URL のまま返す。

export const OPT_WIDTHS = [384, 640, 828, 1080, 1200, 1920];

// リモート最適化を許可するホスト（next.config.ts の remotePatterns と一致させること）
const OPT_HOSTS = new Set([
  "tlnao3m7wsd1mzf2.public.blob.vercel-storage.com",
  "images.unsplash.com",
]);

/** この src を /_next/image 経由で配信できるか */
export function canOptimize(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("//")) return false;
  if (/\.svg(\?|#|$)/i.test(src)) return false; // SVG は最適化対象外（既定で拒否される）
  if (src.startsWith("/")) return true; // 同一オリジン（public/ 配下）
  try {
    const u = new URL(src);
    return u.protocol === "https:" && OPT_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

/** 幅 w 用の最適化URL（w は Next 既定の deviceSizes/imageSizes に含まれる値を使うこと） */
export function optUrl(src: string, w: number, q = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${q}`;
}

/** レスポンシブ srcset（w ディスクリプタ） */
export function optSrcSet(src: string, widths: number[] = OPT_WIDTHS): string {
  return widths.map((w) => `${optUrl(src, w)} ${w}w`).join(", ");
}
