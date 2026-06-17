import { PlayCircle } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { VIDEOS } from "../data/news";
import { IMG } from "../data/images";

const THUMBS: Record<string, string> = {
  v1: IMG.iceClose,
  v2: IMG.worker1,
  v3: IMG.warehouse,
  v4: IMG.dessert,
};

export function Videos() {
  return (
    <Section heat={HEAT.videoList}>
      <SectionTitle en="MOVIE" jp="動画で知るアイスライン" />
      <p className="mt-4 text-muted-foreground" style={{ fontSize: 15, lineHeight: 1.9 }}>
        氷づくりの現場から、働く人の一日まで。映像でアイスラインをご紹介します。
      </p>
      <div className="mt-10 grid gap-6 tab:grid-cols-2">
        {VIDEOS.map((v) => (
          <button key={v.id} className="group text-left">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-secondary">
              <ImageWithFallback src={THUMBS[v.id]} alt={v.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/45">
                <PlayCircle size={56} className="text-white" />
              </div>
              <span className="absolute bottom-3 right-3 rounded bg-ink/80 px-2 py-0.5 text-white" style={{ fontSize: 12 }}>{v.duration}</span>
            </div>
            <h3 className="mt-3" style={{ fontSize: 16, fontWeight: 700 }}>{v.title}</h3>
          </button>
        ))}
      </div>
    </Section>
  );
}
