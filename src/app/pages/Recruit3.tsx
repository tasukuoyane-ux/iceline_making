// 採用ページ 第3案（プレイグラウンド）。
// デザイン検証用。文言・画像はすべてダミー／プレースホルダーで、個数は採用2に合わせている
// （見出し=13セクション + ヒーロー、画像=24、本文≈32）。
//
// ■ ビジュアルコンセプト
//  - ページ全体を貫く「煙」がくねりながら上→下へ連なる。その折れ目に画像を配置する。
//  - 煙の色は最上部=赤 → 黄 → 白 → 最下部=薄い水色のグラデーション。
//  - 背景色は最上部 #333 → 最下部 #dedede のグラデーション。
//  - 最下部にドライアイス画像があり、そこから煙（湯気）が立ち上っているように見せる。
//  - 煙のパスは DOM を実測して各画像の中心を通す（＝折れ目に画像が乗る）。レスポンシブ対応。
//
// ■ 編集
//  - 文言・画像は recruit3: プレフィックスの汎用オーバーライドで管理コンソールから編集可能。
import { FormEvent, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, edImg, txt, img } from "../lib/editable";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

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

// ドライアイス画像（public 配下）
const DRYICE_SRC = "/images/products/dryice_phMain.jpg";

// ── セクション定義（個数は採用2に対応。すべてダミー） ──────────
// images: 折れ目に置く画像の枚数 / bodies: 本文ブロックの数
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

// 煙グラデーションの停止色（上=赤 → 下=水色）。自然な煙に見せるため白寄りの淡い色に。
const SMOKE_STOPS = [
  { off: 0, color: "#ff8a80" },
  { off: 0.3, color: "#ffe6a3" },
  { off: 0.62, color: "#ffffff" },
  { off: 1, color: "#d6f0f7" },
];

type Pt = { x: number; y: number };

// 通過点を滑らかにつなぐパス（Catmull-Rom → ベジェ）
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// ── 部品 ──────────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      @keyframes r3-rise {
        0% { transform: translateY(20px) scale(0.9); opacity: 0; }
        30% { opacity: 0.55; }
        100% { transform: translateY(-120px) scale(1.4); opacity: 0; }
      }
      .r3-steam { animation: r3-rise 6s ease-in infinite; will-change: transform, opacity; }
      @media (prefers-reduced-motion: reduce) { .r3-steam { animation: none; opacity: 0.3; } }
    `}</style>
  );
}

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
  const imgRefs = useRef<(HTMLElement | null)[]>([]);
  const dryIceRef = useRef<HTMLDivElement>(null);
  const imgSides = useRef<number[]>([]); // 各画像の左右符号（-1=左 / +1=右）
  const [smoke, setSmoke] = useState<{ d: string; w: number; h: number }>({ d: "", w: 0, h: 0 });

  // DOM を実測し、各画像の中心とドライアイスを通る煙パスを生成
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const compute = () => {
      const pr = page.getBoundingClientRect();
      const W = page.clientWidth;
      const H = page.scrollHeight;
      // 横の振れ幅（ビューポート比）。PCでは中心±40%＝全幅の80%を横断する。
      const amp = W >= 1024 ? 0.4 : W >= 768 ? 0.32 : 0.2;
      const pts: Pt[] = [{ x: W / 2, y: 0 }];
      imgRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cy = r.top - pr.top + r.height / 2;
        const measuredX = r.left - pr.left + r.width / 2;
        // 左右符号は配置に合わせる。折れ目を大きくするため x を増幅する。
        const sign = imgSides.current[i] ?? (measuredX < W / 2 ? -1 : 1);
        pts.push({ x: W / 2 + sign * W * amp, y: cy });
      });
      if (dryIceRef.current) {
        const r = dryIceRef.current.getBoundingClientRect();
        pts.push({ x: r.left - pr.left + r.width / 2, y: r.top - pr.top + r.height * 0.28 });
      } else {
        pts.push({ x: W / 2, y: H });
      }
      setSmoke({ d: smoothPath(pts), w: W, h: H });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(page);
    window.addEventListener("resize", compute);
    // フォント読込後にも再計算（高さがずれるため）
    (document as any).fonts?.ready?.then(compute).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  // 画像の通し番号（折れ目の左右交互配置に使用）
  let imgSeq = 0;

  return (
    <div
      ref={pageRef}
      className="relative isolate overflow-hidden"
      style={{ background: "linear-gradient(180deg, #333 0%, #5f5f5f 28%, #9a9a9a 60%, #cfcfcf 85%, #dedede 100%)" }}
    >
      <Styles />

      {/* 煙レイヤー（背景・実測パス） */}
      {smoke.d && (
        <svg
          className="pointer-events-none absolute left-0 top-0 z-0"
          width={smoke.w}
          height={smoke.h}
          viewBox={`0 0 ${smoke.w} ${smoke.h}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="r3-smoke" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={smoke.h}>
              {SMOKE_STOPS.map((s) => (
                <stop key={s.off} offset={s.off} stopColor={s.color} />
              ))}
            </linearGradient>
            {/* 自然な煙（細い筋状）：細いストロークを高周波ノイズで大きく変位し、
                アルファを削って繊維・隙間・ちぎれを作る。太い一様な帯にしない。 */}
            <filter id="r3-smoke-a" x="-180%" y="-80%" width="460%" height="260%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.02 0.045" numOctaves={5} seed={11} result="n">
                <animate attributeName="baseFrequency" dur="24s" values="0.02 0.045;0.026 0.055;0.02 0.045" repeatCount="indefinite" />
              </feTurbulence>
              {/* 大きく変位＝細いストロークが煙の筋に伸びる */}
              <feDisplacementMap in="SourceGraphic" in2="n" scale={170} result="w" />
              {/* アルファを急峻にして細い筋・隙間を作る */}
              <feComponentTransfer in="w" result="t">
                <feFuncA type="gamma" amplitude={1.5} exponent={2.4} offset={-0.28} />
              </feComponentTransfer>
              <feGaussianBlur in="t" stdDeviation={1.4} />
            </filter>
            {/* もう少し粗い、大きく渦巻く層 */}
            <filter id="r3-smoke-b" x="-180%" y="-80%" width="460%" height="260%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves={4} seed={4} result="n">
                <animate attributeName="baseFrequency" dur="32s" values="0.008 0.016;0.011 0.021;0.008 0.016" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="n" scale={230} result="w" />
              <feComponentTransfer in="w" result="t">
                <feFuncA type="gamma" amplitude={1.3} exponent={1.8} offset={-0.14} />
              </feComponentTransfer>
              <feGaussianBlur in="t" stdDeviation={2.6} />
            </filter>
          </defs>
          {/* うねり（パス）は維持。細く透けた煙の筋を重ねて自然な立ち上りに */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* ごく薄い量感のためのヘイズ（帯にならない程度に） */}
            <path d={smoke.d} stroke="url(#r3-smoke)" strokeWidth={120} opacity={0.04} style={{ filter: "blur(46px)" }} />
            {/* 大きく渦巻く層 */}
            <path d={smoke.d} stroke="url(#r3-smoke)" strokeWidth={110} opacity={0.34} filter="url(#r3-smoke-b)" />
            {/* 主となる細い筋 */}
            <path d={smoke.d} stroke="url(#r3-smoke)" strokeWidth={64} opacity={0.44} filter="url(#r3-smoke-a)" />
            {/* 明るい細フィラメント */}
            <path d={smoke.d} stroke="#eef6f8" strokeWidth={26} opacity={0.5} filter="url(#r3-smoke-a)" />
          </g>
        </svg>
      )}

      {/* コンテンツ */}
      <div className="relative z-10">
        {/* ヒーロー（暗部の最上部） */}
        <header className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
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
          // エントリーはドライアイス画像の下に移動するため、ここでは描画しない
          if (s.en === "ENTRY") return null;
          return (
            <section key={si} className="mx-auto max-w-5xl px-6 py-16">
              <Heading si={si} en={s.en} />

              <div className="space-y-16">
                  {Array.from({ length: rows }).map((_, k) => {
                    const hasImg = k < s.images;
                    const hasBody = k < s.bodies;
                    if (hasImg) {
                      const seq = imgSeq++;
                      const right = seq % 2 === 1; // 折れ目を左右交互に
                      imgSides.current[seq] = right ? 1 : -1;
                      return (
                        <div
                          key={k}
                          className={
                            "flex flex-col items-center gap-6 tab:flex-row tab:items-center " +
                            (right ? "tab:flex-row-reverse" : "")
                          }
                        >
                          {/* 画像（折れ目に乗る＝煙パスの通過点） */}
                          <div
                            ref={(el) => { imgRefs.current[seq] = el; }}
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
                      <Body key={k} path={`recruit3:s${si}.body${k}`} className="mx-auto max-w-2xl text-center" />
                    );
                  })}
              </div>
            </section>
          );
        })}

        {/* 最下部：ドライアイス画像とフォームを同一グリッドセルで重ねる
            （画像＝背景レイヤー / フォーム＝その上に z 重ね・Y軸で重なる） */}
        <section ref={dryIceRef} className="relative grid w-full pt-16">
          {/* 画像レイヤー（全幅・枠なし・上下端をマスクで背景へフェード） */}
          <div className="relative col-start-1 row-start-1 self-center">
            {/* 立ち上る湯気 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-40 justify-center">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="r3-steam absolute bottom-0 rounded-full bg-white/60 blur-md"
                  style={{ left: `${38 + i * 6}%`, width: 40, height: 70, animationDelay: `${i * 1.1}s` }}
                  aria-hidden
                />
              ))}
            </div>
            <ImageWithFallback
              src={img("recruit3:dryice", DRYICE_SRC)}
              alt="ドライアイス"
              className="block w-full object-cover"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 20%, #000 88%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, #000 20%, #000 88%, transparent 100%)",
              }}
              {...edImg("recruit3:dryice", "ドライアイス画像")}
            />
          </div>

          {/* フォームレイヤー（画像の上に z 重ね） */}
          <div className="relative z-30 col-start-1 row-start-1 w-full max-w-3xl justify-self-center self-center px-6 py-16">
            <Heading si={SECTIONS.length - 1} en="ENTRY" />
            <EntryForm si={SECTIONS.length - 1} />
          </div>
        </section>

        <p className="mx-auto max-w-5xl px-6 pb-28 pt-6 text-center text-xs text-slate-500">
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
