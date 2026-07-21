// 採用ページ 第3案（プレイグラウンド）。
// デザイン検証用。文言・画像はすべてダミー／プレースホルダーで、個数は採用2に合わせている
// （見出し=13セクション + ヒーロー、画像=24、本文≈32）。
//
// ■ ビジュアルコンセプト
//  - ページ全体の背景に「スクロール追随の動画」を敷く（最大5本／管理コンソールで設定）。
//    ページ最上部＝1本目の先頭フレーム、最後の文字コンテンツ＝最終本の最終フレーム。
//    スクロール位置をそのまま再生位置に写す（自動再生ではないので上下どちらにも追随する）。
//  - 動画とコンテンツの前後関係もコンソールから切替可能（既定＝動画が背面）。
//    「前面」の場合は動画レイヤーに mix-blend-mode:difference を掛け、文字を反転で浮かび上がらせる。
//  - 背景色は最上部 #333 → 最下部 #dedede のグラデーション（動画未設定時の下地）。
//
// ■ 編集
//  - 文言・画像は recruit3: プレフィックスの汎用オーバーライドで管理コンソールから編集可能。
//  - 背景動画は sections.json の recruit3Bg（コンソール「コンテンツ管理 → 採用3 背景動画」）。
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, edImg, txt, img } from "../lib/editable";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import sectionsJson from "../../content/sections.json";

// ── ダミーテキスト ─────────────────────────────────────────
const DUMMY_BODY =
  "ここにダミーテキストが入ります。実際の原稿が決まるまでのプレースホルダーとして表示しています。レイアウトや余白、行間の確認にご利用ください。";
const DUMMY_HEAD = "見出しダミーテキスト";

// 差し替え用の画像プレースホルダー（グレー枠）
const PH =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='#e7ebee'/><text x='50%' y='50%' font-size='30' fill='#9aa4ad' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>＋ 画像</text></svg>"
  );

// ── 背景動画の設定（sections.json / コンソールで編集） ──────────
// キー欠落・型崩れに耐えるフォールバック付きで読む（古い公開JSONでも落ちないように）。
const BG_MAX = 5;
const BG_RAW: any = (sectionsJson as any).recruit3Bg ?? {};
const BG_VIDEOS: string[] = (Array.isArray(BG_RAW.videos) ? BG_RAW.videos : [])
  .filter((v: any) => typeof v === "string" && v.trim() !== "")
  .slice(0, BG_MAX);
// "front" = 動画がコンテンツの前面（文字は difference 合成）／既定は "back"
const BG_LAYER: "back" | "front" = BG_RAW.layer === "front" ? "front" : "back";

// ── セクション定義（個数は採用2に対応。すべてダミー） ──────────
// images: 画像の枚数 / bodies: 本文ブロックの数
const SECTIONS: { en: string; images: number; bodies: number }[] = [
  { en: "BUSINESS", images: 2, bodies: 2 },
  { en: "PHILOSOPHY", images: 0, bodies: 2 },
  { en: "MESSAGE", images: 1, bodies: 1 },
  { en: "LOCATIONS", images: 3, bodies: 3 },
  { en: "CULTURE", images: 3, bodies: 3 },
  { en: "A DAY", images: 1, bodies: 1 },
  { en: "CAREER", images: 4, bodies: 4 },
  { en: "POSITIONS", images: 4, bodies: 4 },
  { en: "PROFILE", images: 3, bodies: 1 },
  { en: "MOVIE", images: 0, bodies: 1 },
  { en: "PEOPLE", images: 3, bodies: 3 },
  { en: "CONDITIONS", images: 0, bodies: 6 },
  { en: "ENTRY", images: 0, bodies: 1 },
];

// ── 背景動画レイヤー ──────────────────────────────────────
// スクロール量 p∈[0,1] を動画本数で等分し、i 番目の動画の再生位置に写す。
//  - p=0 … 1本目の先頭フレーム（ページ最上部）
//  - p=1 … 最終本の最終フレーム（最後の文字コンテンツが画面下端に達した位置）
// 自動再生はせず currentTime を直接動かすため、下スクロール／上スクロールの両方に追随する。
function BgVideos({
  urls,
  layer,
  pageRef,
  endRef,
}: {
  urls: string[];
  layer: "back" | "front";
  pageRef: React.RefObject<HTMLDivElement>;
  endRef: React.RefObject<HTMLElement>;
}) {
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
      const page = pageRef.current;
      if (!page) return;
      const y = window.scrollY;
      // ページ先頭のドキュメント座標
      const start = y + page.getBoundingClientRect().top;
      // 「最後の文字コンテンツ」の下端が画面下端に来た時点を終端とする
      const endEl = endRef.current;
      const endBottom = endEl
        ? y + endEl.getBoundingClientRect().bottom
        : start + page.scrollHeight;
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
    if (pageRef.current) ro.observe(pageRef.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro.disconnect();
    };
  }, [urls.length, pageRef, endRef]);

  if (urls.length === 0) return null;

  return (
    <div
      className={
        "pointer-events-none fixed inset-0 " + (layer === "front" ? "z-20" : "z-[1]")
      }
      // 前面配置時：動画をコンテンツへ difference 合成し、下の文字を反転色で浮かび上がらせる
      style={layer === "front" ? { mixBlendMode: "difference" } : undefined}
      aria-hidden
    >
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
    </div>
  );
}

// ── 部品 ──────────────────────────────────────────────────

// セクション見出し（英字＋日本語・中央寄せ・すりガラスのチップ）
function Heading({ si, en }: { si: number; en: string }) {
  return (
    <div className="relative z-10 mx-auto mb-10 w-fit text-center">
      <span className="block rounded-full bg-white/55 px-6 py-3 shadow-sm backdrop-blur-md">
        <span
          className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-500"
          {...ed(`recruit3:s${si}.en`, "英字ラベル")}
        >
          {txt(`recruit3:s${si}.en`, en)}
        </span>
        <span
          className="mt-1 block text-xl font-bold text-slate-800 pc:text-2xl"
          {...ed(`recruit3:s${si}.jp`, "見出し")}
        >
          {txt(`recruit3:s${si}.jp`, DUMMY_HEAD)}
        </span>
      </span>
    </div>
  );
}

// 本文カード（すりガラス）
function Body({ path, className = "" }: { path: string; className?: string }) {
  return (
    <p
      className={
        "rounded-2xl bg-white/60 p-6 text-sm leading-loose text-slate-700 shadow-sm backdrop-blur-md " +
        className
      }
      {...ed(path, "本文", { multiline: true })}
    >
      {txt(path, DUMMY_BODY)}
    </p>
  );
}

export function Recruit3() {
  const pageRef = useRef<HTMLDivElement>(null);
  // 「最後の文字コンテンツ」＝背景動画の終端を決める基準要素
  const endRef = useRef<HTMLParagraphElement>(null);

  // 画像の通し番号（左右交互配置に使用）
  let imgSeq = 0;

  return (
    <div ref={pageRef} className="relative isolate overflow-hidden">
      {/* z順（下→上）：1) 背景色（動画未設定時の下地） */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: "linear-gradient(180deg, #333 0%, #5f5f5f 28%, #9a9a9a 60%, #cfcfcf 85%, #dedede 100%)" }}
        aria-hidden
      />

      {/* 2) 背景動画（背面指定なら z-[1]／前面指定なら z-20 + difference 合成） */}
      <BgVideos urls={BG_VIDEOS} layer={BG_LAYER} pageRef={pageRef} endRef={endRef} />

      {/* 3) コンテンツ */}
      <div className="relative z-10">
        {/* ヒーロー（暗部の最上部） */}
        <header className="mx-auto flex min-h-[70vh] max-w-[1400px] flex-col items-center justify-center px-6 py-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">RECRUIT — PLAYGROUND</p>
          <h1
            className="mt-6 text-4xl font-bold leading-tight text-white pc:text-6xl"
            style={{ whiteSpace: "pre-line", textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
            {...ed("recruit3:hero.title", "メインコピー", { multiline: true })}
          >
            {txt("recruit3:hero.title", "メインコピー\nダミーテキスト")}
          </h1>
          <p
            className="mt-6 max-w-xl text-sm leading-loose text-white/70"
            {...ed("recruit3:hero.sub", "サブコピー")}
          >
            {txt("recruit3:hero.sub", DUMMY_BODY)}
          </p>
        </header>

        {/* 各セクション */}
        {SECTIONS.map((s, si) => {
          const rows = Math.max(s.images, s.bodies);
          // エントリーは専用セクションとして最後に描画するため、ここでは描画しない
          if (s.en === "ENTRY") return null;
          return (
            <section key={si} className="mx-auto max-w-[1400px] px-6 py-16 pc:px-10">
              <Heading si={si} en={s.en} />

              <div className="space-y-16">
                  {Array.from({ length: rows }).map((_, k) => {
                    const hasImg = k < s.images;
                    const hasBody = k < s.bodies;
                    if (hasImg) {
                      const seq = imgSeq++;
                      const right = seq % 2 === 1; // 左右交互に
                      return (
                        <div
                          key={k}
                          className={
                            "flex flex-col items-center gap-8 tab:flex-row tab:items-center tab:gap-12 " +
                            (right ? "tab:flex-row-reverse" : "")
                          }
                        >
                          {/* 画像 */}
                          <div
                            className={
                              "w-[86%] shrink-0 rounded-2xl bg-white/80 p-2 shadow-lg backdrop-blur-sm tab:w-1/2 " +
                              (right ? "self-end tab:self-auto" : "self-start tab:self-auto")
                            }
                          >
                            <ImageWithFallback
                              src={img(`recruit3:s${si}.img${k}`, PH)}
                              alt=""
                              className="aspect-[4/3] w-full rounded-xl object-cover"
                              {...edImg(`recruit3:s${si}.img${k}`, "画像")}
                            />
                          </div>
                          {/* 本文 */}
                          <div className="w-full tab:w-1/2">
                            {hasBody ? <Body path={`recruit3:s${si}.body${k}`} /> : null}
                          </div>
                        </div>
                      );
                    }
                    // 画像なしの本文ブロック（中央寄せ）
                    return (
                      <Body key={k} path={`recruit3:s${si}.body${k}`} className="mx-auto max-w-3xl text-center" />
                    );
                  })}
              </div>
            </section>
          );
        })}

        {/* 最下部：エントリー */}
        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <Heading si={SECTIONS.length - 1} en="ENTRY" />
          <EntryForm si={SECTIONS.length - 1} />
        </section>

        <p
          ref={endRef}
          className="mx-auto max-w-[1400px] px-6 pb-28 pt-6 text-center text-xs text-slate-500"
        >
          ※ 採用3はデザイン検証用のプレイグラウンドです。文言・画像はすべてダミーです。
        </p>
      </div>
    </div>
  );
}

// エントリーフォーム（最終セクション）
function EntryForm({ si }: { si: number }) {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("エントリーを受け付けました（プロトタイプ）。");
    (e.target as HTMLFormElement).reset();
  };
  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-md">
      <p className="text-center text-sm leading-loose text-slate-700" {...ed(`recruit3:s${si}.body0`, "リード", { multiline: true })}>
        {txt(`recruit3:s${si}.body0`, DUMMY_BODY)}
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="r3-name">お名前 *</Label>
          <Input id="r3-name" required placeholder="山田 太郎" />
        </div>
        <div className="grid gap-2 tab:grid-cols-2 tab:gap-4">
          <div className="grid gap-2">
            <Label htmlFor="r3-email">メールアドレス *</Label>
            <Input id="r3-email" type="email" required placeholder="example@mail.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r3-tel">電話番号</Label>
            <Input id="r3-tel" placeholder="090-0000-0000" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="r3-msg">メッセージ</Label>
          <Textarea id="r3-msg" rows={5} placeholder="ダミーのメッセージ欄" />
        </div>
        <Button type="submit" className="w-full" style={{ height: 48 }}>
          この内容で送信する <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  );
}
