// アイキャッチ動画まわりの共通部品（2026-09 改修）。
//  - VideoPoster: 画像があればその画像、無ければ動画の1フレーム目（YouTube はサムネイル）を描画
//  - VideoModal : 画面中央のオーバーレイで動画を大きく再生（YouTube/Vimeo は iframe、直リンクは <video>）
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toEmbed, videoPoster } from "../../lib/video";

/** 動画のポスター（静止画）。image が空なら動画の1フレーム目相当を表示する */
export function VideoPoster({
  image,
  video,
  alt,
  className,
  fallback,
  ...rest
}: {
  image: string;
  video: string;
  alt: string;
  className?: string;
  /** 画像も動画も無いときに表示する画像URL */
  fallback?: string;
} & Record<string, unknown>) {
  if (image) return <ImageWithFallback src={image} alt={alt} className={className} {...rest} />;
  const p = videoPoster(video);
  if (p?.type === "video") {
    return <video src={p.src} muted playsInline preload="metadata" aria-label={alt} className={className} />;
  }
  if (p?.type === "image") return <ImageWithFallback src={p.src} alt={alt} className={className} {...rest} />;
  if (fallback) return <ImageWithFallback src={fallback} alt={alt} className={className} {...rest} />;
  return <div className={className} style={{ background: "#0f2a33" }} aria-label={alt} />;
}

/** 画面中央のオーバーレイ動画プレイヤー（body 直下へポータル描画・背面スクロールを止める） */
export function VideoModal({ url, title, onClose }: { url: string; title?: string; onClose: () => void }) {
  const embed = toEmbed(url);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-5"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 transition-colors hover:text-white"
        >
          <X size={26} />
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl">
          {embed?.type === "iframe" && (
            <iframe
              src={embed.src + (embed.src.includes("?") ? "&" : "?") + "autoplay=1"}
              title={title || "動画"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {embed?.type === "video" && <video src={embed.src} controls autoPlay playsInline className="h-full w-full" />}
          {!embed && (
            <div className="flex h-full w-full items-center justify-center text-white/70" style={{ fontSize: 14 }}>
              動画は準備中です。
            </div>
          )}
        </div>
        {title && (
          <p className="mt-3 text-white" style={{ fontSize: 15, fontWeight: 700 }}>
            {title}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
