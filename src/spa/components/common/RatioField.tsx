// 画像と文章の横並び比率（画像の幅％）を管理コンソールから編集するための不可視項目。
// 30〜70 の半角数字を入力する（3:7〜7:3）。値は overrides.json に保存される。
import { ed, txt } from "../../lib/editable";

const HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

export function RatioField({ path, def }: { path: string; def: number }) {
  return (
    <span {...ed(path, "画像の幅％（30〜70）")} style={HIDDEN}>
      {txt(path, String(def))}
    </span>
  );
}
