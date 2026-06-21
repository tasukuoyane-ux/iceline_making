// 記事本文のブロック編集（段落 / 見出しH2 / 見出しH3 / 画像[リンク可]）。
// 追加・並べ替え・削除に対応。お知らせ・社員インタビューで共通利用。
import { useRef, useState } from "react";
import { Block } from "./content";
import { Field, TextInput, TextArea, Button } from "./ui";
import { ImageField } from "./ImageField";
import { uploadImage } from "./api";

const TYPE_LABEL: Record<Block["type"], string> = {
  paragraph: "段落",
  h2: "見出し（大）",
  h3: "見出し（中）",
  image: "画像",
  video: "動画",
};

// 動画ファイル（mov/mp4/webm等）を直接アップロードして公開URLを返すボタン
function VideoUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadImage(file); // 任意のファイル種別に対応（Blobへ保存）
      onUploaded(url);
    } catch (err: any) {
      setError(err.message || "アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  }
  return (
    <div className="space-y-1">
      <input ref={ref} type="file" accept="video/*,.webm,.mp4,.mov,.m4v,.ogv" className="hidden" onChange={handle} />
      <Button type="button" onClick={() => ref.current?.click()} disabled={uploading}>
        {uploading ? "アップロード中…" : "動画ファイルをアップロード"}
      </Button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}

// 段落エディタ：選択範囲を **太字** / ==マーカー== で囲む。
function ParagraphEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrap(mark: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const sel = value.slice(start, end);
    const next = value.slice(0, start) + mark + sel + mark + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      // 選択ありは中身を選択維持、選択なしはマーク間にカーソル
      const a = start + mark.length;
      const b = end + mark.length;
      ta.setSelectionRange(sel ? a : a, sel ? b : a);
    });
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <Button onClick={() => wrap("**")}><span className="font-bold">B</span> 太字</Button>
        <Button onClick={() => wrap("==")}>
          <span style={{ textDecorationLine: "underline", textDecorationColor: "rgba(230,0,18,0.5)", textDecorationThickness: "0.3em", textUnderlineOffset: "-0.12em" }}>M</span> マーカー
        </Button>
        <span className="text-[11px] text-slate-400">文字を選択して適用</span>
      </div>
      <TextArea ref={ref as any} rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder="段落の本文" />
    </div>
  );
}

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
      type === "image"
        ? { type: "image", src: "", href: "", alt: "" }
        : type === "video"
        ? { type: "video", src: "", caption: "" }
        : { type, text: "" };
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
            ) : b.type === "video" ? (
              <div className="space-y-2">
                <Field label="動画URL" hint="YouTube・Vimeo の共有URL、または mp4・webm・mov 等の直リンク。下のボタンから動画ファイルを直接アップロードもできます。">
                  <TextInput value={b.src} onChange={(e) => update(i, { src: e.target.value })} placeholder="https://… または .mp4 / .webm / .mov" />
                </Field>
                <VideoUploadButton onUploaded={(url) => update(i, { src: url })} />
                <Field label="キャプション（任意）">
                  <TextInput value={b.caption ?? ""} onChange={(e) => update(i, { caption: e.target.value })} />
                </Field>
              </div>
            ) : b.type === "paragraph" ? (
              <ParagraphEditor value={b.text} onChange={(text) => update(i, { text })} />
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
        <Button onClick={() => add("video")}>＋ 動画</Button>
      </div>
    </div>
  );
}
