import { Link } from "react-router";
import { PlayCircle } from "lucide-react";

// 全ページ共通の固定誘導ボタン（資料: 動画で知るアイスライン）
export function VideoCta() {
  return (
    <Link
      to="/videos"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-brand-foreground shadow-lg transition-all hover:bg-brand-dark hover:shadow-xl pc:bottom-8 pc:right-8"
      style={{ fontSize: 14 }}
    >
      <PlayCircle size={20} />
      <span className="hidden tab:inline">動画で知るアイスライン</span>
      <span className="tab:hidden">動画で知る</span>
    </Link>
  );
}
