// 画像フィールド：プレビュー＋URL直接入力＋ファイルアップロード。
import { useRef, useState } from "react";
import { uploadImage } from "./api";
import { Field, TextInput, Button } from "./ui";

export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err: any) {
      setError(err.message || "アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <Field label={label} hint={hint}>
        <div className="flex gap-3">
          <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">画像なし</div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… 画像URL" />
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "アップロード中…" : "画像をアップロード"}
              </Button>
              {value && (
                <Button type="button" variant="ghost" onClick={() => onChange("")}>
                  クリア
                </Button>
              )}
            </div>
          </div>
        </div>
      </Field>
      {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
