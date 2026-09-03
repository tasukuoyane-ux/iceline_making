// 動画ファイル（mp4 / webm / mov 等）をアップロードして公開URLを返すボタン（2026-09-03 復活）。
// ファイル本体はブラウザから Vercel Blob へ直接送るので、大きな動画でもアップロードできる。
// 動画URL欄（記事本文の動画ブロック・セクション動画・採用の背景動画・動画一覧）で共通利用。
import { useRef, useState } from "react";
import { uploadVideo } from "./api";
import { Button } from "./ui";

export function VideoUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const { url } = await uploadVideo(file, setProgress);
      onUploaded(url);
    } catch (err: any) {
      setError(err?.message || "アップロードに失敗しました");
    } finally {
      setProgress(null);
      if (ref.current) ref.current.value = "";
    }
  }

  const busy = progress !== null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input ref={ref} type="file" accept="video/*,.webm,.mp4,.mov,.m4v,.ogv" className="hidden" onChange={handle} />
        <Button type="button" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? `アップロード中… ${progress}%` : "動画ファイルをアップロード"}
        </Button>
        {busy && (
          <div className="h-1.5 w-32 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
