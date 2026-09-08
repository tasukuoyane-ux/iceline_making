// 下層ページのヒーロー（デザイン支給 Iceline_Hojin の .page-hero）。
// 微粒子パーティクルがページ内容のシルエット（会社情報＝本社ビル・結晶）を形作る。
// ※ 氷・氷菓／業務用食材／倉庫事業／ドライアイスのメインビジュアルは
//    ユーザー指定により従来どおり画像背景のまま（このコンポーネントは使わない）。
import { useEffect, useRef, type ReactNode } from "react";
import { mountFvParticles, type ShapeName } from "../../lib/fvParticles";

export function ParticleHero({ shapes, compact, children }: { shapes: ShapeName[]; compact?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return mountFvParticles(cv, shapes, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section className={"page-hero grain" + (compact ? " page-hero--compact" : "")}>
      <canvas ref={ref} className="hero-canvas" aria-hidden />
      <div className="hero-inner">{children}</div>
    </section>
  );
}
