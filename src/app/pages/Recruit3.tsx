// 採用ページ 第3案。
// コンテンツは採用2（Recruit2）を完全に踏襲する（同じコンポーネント・同じ編集キーを共有。
// 採用2側で編集した文言・画像は採用3にもそのまま反映される）。
//
// ■ ビジュアルコンセプト
//  - メインビジュアル（採用2と同じヒーロー）以下では、背景に「スクロール追随の動画」を敷く
//    （最大5本／管理コンソール「採用3 背景動画」で設定）。
//    MV直下＝1本目の先頭フレーム、ページ最下端＝最終本の最終フレーム。
//    スクロール位置をそのまま再生位置に写す（自動再生ではないので上下どちらにも追随する）。
//  - 旧実装の mix-blend-mode:difference（反転合成）は廃止。動画は素の色のまま描画し、
//    上に淡いブルー〜白の薄いベール（採用2の配色 #d9ecf2 系）を重ねて色味を落ち着かせる。
//    コンテンツは動画の前面に通常合成で重なるため、白カード基調の採用2デザインが
//    そのまま読みやすく載る（安心感のあるブレンド）。
//  - 動画が1本も無い場合は採用2と同じパララックス背景（PageBg）を表示する。
//
// ■ z順（下→上）
//    0: 背景動画＋ベール（fixed） → 10: コンテンツ → 20: ヒーロー（MVの間は動画を隠す）
import { useEffect, useRef, useState } from "react";
import sectionsJson from "../../content/sections.json";
import {
  R2Styles,
  PageBg,
  Hero,
  Biz,
  Philosophy,
  CeoMessage,
  Locations,
  Charm,
  Day,
  CareerPath,
  Jobs,
  CompanyProfile,
  DeckVideo,
  People,
  ApplyCta,
  Conditions,
  EntryForm,
} from "./Recruit2";

// ── 背景動画の設定（sections.json / コンソールで編集） ──────────
// キー欠落・型崩れに耐えるフォールバック付きで読む（古い公開JSONでも落ちないように）。
const BG_MAX = 5;
const BG_RAW: any = (sectionsJson as any).recruit3Bg ?? {};
const BG_VIDEOS: string[] = (Array.isArray(BG_RAW.videos) ? BG_RAW.videos : [])
  .filter((v: any) => typeof v === "string" && v.trim() !== "")
  .slice(0, BG_MAX);
const HAS_BG = BG_VIDEOS.length > 0;

// ── 背景動画レイヤー ──────────────────────────────────────
// areaRef（MV以下のコンテンツ領域）のスクロール量 p∈[0,1] を動画本数で等分し、
// i 番目の動画の再生位置に写す。
//  - p=0 … 1本目の先頭フレーム（MV直下がビューポート上端に来る前）
//  - p=1 … 最終本の最終フレーム（領域下端が画面下端に達した位置）
// 自動再生はせず currentTime を直接動かすため、下スクロール／上スクロールの両方に追随する。
function BgVideos({ urls, areaRef }: { urls: string[]; areaRef: React.RefObject<HTMLDivElement> }) {
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  // metadata 読込完了時にも位置を合わせ直すため、計算関数を ref で共有する
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (urls.length === 0) return;
    let queued = false;
    let raf = 0;

    const sync = () => {
      queued = false;
      const area = areaRef.current;
      if (!area) return;
      const y = window.scrollY;
      const rect = area.getBoundingClientRect();
      // 領域の先頭・末尾のドキュメント座標
      const start = y + rect.top;
      const endBottom = y + rect.bottom;
      const finish = Math.max(start + 1, endBottom - window.innerHeight);
      const p = Math.min(1, Math.max(0, (y - start) / (finish - start)));

      const n = urls.length;
      // p=1 でも最終動画のインデックスに収まるよう、わずかに内側へ丸める
      const scaled = Math.min(p * n, n - 1e-6);
      const idx = Math.floor(scaled);
      const local = scaled - idx;
      setActive(idx);

      vids.current.forEach((v, i) => {
        if (!v) return;
        const d = v.duration;
        if (!isFinite(d) || d <= 0) return;
        // 通過済み=最終フレーム / これから=先頭フレーム / 再生中=按分
        const t = i < idx ? d : i > idx ? 0 : local * d;
        const clamped = Math.min(Math.max(t, 0), Math.max(0, d - 0.05));
        // 1フレーム未満の差では seek しない（過剰なシークで再生がガタつくため）
        if (Math.abs(v.currentTime - clamped) > 1 / 30) {
          try {
            v.currentTime = clamped;
          } catch {
            /* seek 不可（未バッファ）なら次フレームで再試行される */
          }
        }
      });
    };
    syncRef.current = sync;

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // 画像読込やフォント適用で高さが変わると終端位置もずれるため再計算する
    const ro = new ResizeObserver(onScroll);
    if (areaRef.current) ro.observe(areaRef.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro.disconnect();
    };
  }, [urls.length, areaRef]);

  if (urls.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {urls.map((src, i) => (
        <video
          key={src + i}
          ref={(el) => {
            vids.current[i] = el;
          }}
          src={src}
          muted
          playsInline
          preload="auto"
          // 表示は現在の区間のみ。切替時のちらつきを避けるため他は透明にして残す
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          style={{ opacity: i === active ? 1 : 0 }}
          onLoadedMetadata={() => syncRef.current()}
          onLoadedData={(e) => {
            // 一部ブラウザは一度再生しないとデコーダが起きず seek が効かないため空打ちする
            const v = e.currentTarget;
            v.play()
              .then(() => v.pause())
              .catch(() => {})
              .finally(() => syncRef.current());
          }}
        />
      ))}
      {/* 淡いブルー〜白のベール。動画の色をそのまま活かしつつ彩度・コントラストを
          そっと抑え、白カード基調のコンテンツが安心して読めるトーンにする。 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(217,236,242,0.50) 0%, rgba(255,255,255,0.38) 45%, rgba(217,236,242,0.50) 100%)",
        }}
      />
    </div>
  );
}

export function Recruit3() {
  // MV以下のコンテンツ領域（背景動画のスクロール進行の基準）
  const areaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <R2Styles />
      {/* 動画が無い場合は採用2と同じパララックス背景 */}
      {!HAS_BG && <PageBg />}

      {/* ヒーロー（採用2と同一）。MV表示中は背景動画より前面に置いて動画を隠す */}
      <div className="relative z-20">
        <Hero />
      </div>

      {/* MV以下：スクロール追随の背景動画（fixed）＋採用2踏襲のコンテンツ */}
      <div ref={areaRef} className="relative">
        {HAS_BG && <BgVideos urls={BG_VIDEOS} areaRef={areaRef} />}
        <div className="relative z-10">
          <Biz />
          <Philosophy />
          <CeoMessage />
          <Locations />
          <Charm />
          <Day />
          <CareerPath />
          <Jobs />
          <CompanyProfile />
          <DeckVideo />
          <People />
          <ApplyCta />
          <Conditions />
          <EntryForm />
        </div>
      </div>
    </div>
  );
}
