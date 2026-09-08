import { useState } from "react";
import { X } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { VIDEOS, VideoItem } from "../data/news";
import { ed, edImg, EDIT_MODE } from "../lib/editable";
import { toEmbed } from "../lib/video";
import sections from "../../content/sections.json";

export function Videos() {
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const embed = playing ? toEmbed(playing.videoUrl) : null;

  return (
    <Section heat={HEAT.videoList}>
      <SectionTitle en="MOVIE" jp="動画で知るアイスライン" path="sectionEn:videos.movie" />
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
              {/* 再生ボタン（デザイン支給の .video-card .play：赤い円） */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/90 transition-transform group-hover:scale-110">
                  <svg viewBox="0 0 16 16" className="ml-0.5 h-5 w-5 fill-white" aria-hidden><path d="M4 2l10 6-10 6z" /></svg>
                </span>
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
