// 記事本文のブロック編集（段落 / 見出しH2 / 見出しH3 / 画像[リンク可]）。
// 追加・並べ替え・削除に対応。お知らせ・社員インタビューで共通利用。
import { Block } from "./content";
import { Field, TextInput, TextArea, Button } from "./ui";
import { ImageField } from "./ImageField";

const TYPE_LABEL: Record<Block["type"], string> = {
  paragraph: "段落",
  h2: "見出し（大）",
  h3: "見出し（中）",
  image: "画像",
};

export function BlockEditor({ value, onChange }: { value: Block[]; onChange: (v: Block[]) => void }) {
  const blocks = value || [];

  function update(i: number, patch: Partial<Block>) {
    const next = blocks.slice();
    next[i] = { ...next[i], ...patch } as Block;
    onChange(next);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function remove(i: number) {
    if (!confirm("このブロックを削除しますか？")) return;
    onChange(blocks.filter((_, idx) => idx !== i));
  }
  function add(type: Block["type"]) {
    const block: Block =
      type === "image" ? { type: "image", src: "", href: "", alt: "" } : { type, text: "" };
    onChange([...blocks, block]);
  }

  return (
    <div>
      <div className="space-y-3">
        {blocks.map((b, i) => (
          <div key={i} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {i + 1}. {TYPE_LABEL[b.type]}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
                <Button variant="ghost" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}>↓</Button>
                <Button variant="danger" onClick={() => remove(i)}>削除</Button>
              </div>
            </div>

            {b.type === "image" ? (
              <div className="space-y-2">
                <ImageField label="画像" value={b.src} onChange={(url) => update(i, { src: url })} />
                <Field label="リンクURL（任意）" hint="入力すると画像クリックで別タブで開きます">
                  <TextInput value={b.href ?? ""} onChange={(e) => update(i, { href: e.target.value })} placeholder="https://…" />
                </Field>
                <Field label="キャプション / 代替テキスト（任意）">
                  <TextInput value={b.alt ?? ""} onChange={(e) => update(i, { alt: e.target.value })} />
                </Field>
              </div>
            ) : b.type === "paragraph" ? (
              <TextArea rows={4} value={b.text} onChange={(e) => update(i, { text: e.target.value })} placeholder="段落の本文" />
            ) : (
              <TextInput value={b.text} onChange={(e) => update(i, { text: e.target.value })} placeholder={b.type === "h2" ? "大見出し" : "中見出し"} />
            )}
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-[12px] text-slate-400">
            まだブロックがありません。下のボタンから追加してください。
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => add("paragraph")}>＋ 段落</Button>
        <Button onClick={() => add("h2")}>＋ 見出し（大）</Button>
        <Button onClick={() => add("h3")}>＋ 見出し（中）</Button>
        <Button onClick={() => add("image")}>＋ 画像</Button>
      </div>
    </div>
  );
}
