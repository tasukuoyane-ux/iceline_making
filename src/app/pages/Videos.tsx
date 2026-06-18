import { useState } from "react";
import { PlayCircle, X } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { VIDEOS, VideoItem } from "../data/news";
import { ed, edImg, EDIT_MODE } from "../lib/editable";
import sections from "../../content/sections.json";

// YouTube/Vimeo の共有URLを埋め込みURLへ変換。それ以外はそのまま（mp4等の直リンク想定）。
function toEmbed(url: string): { type: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { type: "video", src: url };
}

export function Videos() {
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const embed = playing ? toEmbed(playing.videoUrl) : null;

  return (
    <Section heat={HEAT.videoList}>
      <SectionTitle en="MOVIE" jp="動画で知るアイスライン" />
      <p className="mt-4 text-muted-foreground" style={{ fontSize: 15, lineHeight: 1.9 }} {...ed("sections:videosIntro")}>
        {sections.videosIntro}
      </p>
      <div className="mt-10 grid gap-6 tab:grid-cols-2">
        {VIDEOS.map((v) => (
          <button
            key={v.id}
            type="button"
            className="group text-left"
            onClick={() => {
              if (EDIT_MODE) return; // 編集モードでは再生せず選択を優先
              setPlaying(v);
            }}
          >
            <div className="relative aspect-video overflow-hidden rounded-lg bg-secondary">
              <ImageWithFallback
                src={v.thumb}
                alt={v.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                {...edImg(`videos:${v.id}:thumb`)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/45">
                <PlayCircle size={56} className="text-white" />
              </div>
              <span className="absolute bottom-3 right-3 rounded bg-ink/80 px-2 py-0.5 text-white" style={{ fontSize: 12 }} {...ed(`videos:${v.id}:duration`)}>{v.duration}</span>
            </div>
            <h3 className="mt-3" style={{ fontSize: 16, fontWeight: 700 }} {...ed(`videos:${v.id}:title`)}>{v.title}</h3>
          </button>
        ))}
      </div>

      {/* 動画プレイヤー（モーダル） */}
      {playing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-5" onClick={() => setPlaying(null)}>
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => setPlaying(null)}
              className="absolute -top-10 right-0 text-white/80 transition-colors hover:text-white"
            >
              <X size={26} />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              {embed?.type === "iframe" && (
                <iframe
                  src={embed.src}
                  title={playing.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {embed?.type === "video" && (
                <video src={embed.src} controls autoPlay className="h-full w-full" />
              )}
              {!embed && (
                <div className="flex h-full w-full items-center justify-center text-white/70" style={{ fontSize: 14 }}>
                  動画は準備中です。
                </div>
              )}
            </div>
            <p className="mt-3 text-white" style={{ fontSize: 15, fontWeight: 700 }}>{playing.title}</p>
          </div>
        </div>
      )}
    </Section>
  );
}
