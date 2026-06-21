// 動画を含む記事に表示する「+MOVIE」バッジ。
// 画像（サムネイル・メイン画像）の右上に重ねる用途を想定（absolute 配置済み）。
import { PlayCircle } from "lucide-react";

// 文字リスト（サムネイルなし）の行内に置く小さな「+MOVIE」タグ。
export function InlineMovieTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={"inline-flex w-fit items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-brand-foreground " + className}
      style={{ fontFamily: "var(--font-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}
    >
      <PlayCircle size={12} /> +MOVIE
    </span>
  );
}

export function MovieBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-brand-foreground shadow-md " +
        className
      }
      style={{ fontFamily: "var(--font-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}
    >
      <PlayCircle size={13} /> +MOVIE
    </span>
  );
}
