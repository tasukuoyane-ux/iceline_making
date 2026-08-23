// トップMVに重ねる白の斜線ストライプ（45°の破線を散らしたオーバーレイ）。
// 濃淡は不透明度ではなく「ストライプの量」で表現する：
// 右端は破線が疎らで、左に近づくほど破線が密になり、左1/3の真っ白パネルへつながる。
// 擬似乱数は決定的（毎回同じ模様）で、SVGをデータURIとして焼き込む。
// Top.tsx（SPA）と TopShell（サーバ先行描画）の両方から使う純関数モジュール。
export const MV_STRIPES = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const W = 1600;
  const H = 900;
  const SPACING = 46; // 対角線同士の間隔（垂直距離では約33px）
  // x位置ごとのストライプ密度。左1/3は真っ白パネルで隠れるため、
  // 「パネル右端で最密（ほぼ連続線）→ 右端で疎ら」になるよう可視領域基準で変化させる
  const PANEL = W / 3;
  const density = (x: number) => {
    const t = Math.min(1, Math.max(0, 1 - (x - PANEL) / (W - PANEL)));
    return 0.06 + 0.94 * t * t;
  };
  const parts: string[] = [];
  // 右上がり45°の対角線 y = c - x に沿って、密度に応じた破線セグメントを刻む
  for (let c = 40; c < W + H; c += SPACING) {
    let x = Math.max(0, c - H);
    const xEnd = Math.min(W, c);
    while (x < xEnd) {
      const d = density(x);
      const dash = 30 + rnd() * (60 + 160 * d); // 密なほど破線が長い
      const gap = 20 + rnd() * (40 + 280 * (1 - d)); // 疎なほど隙間が広い
      if (rnd() < d) {
        const x2 = Math.min(xEnd, x + dash);
        parts.push(`<line x1='${x.toFixed(0)}' y1='${(c - x).toFixed(0)}' x2='${x2.toFixed(0)}' y2='${(c - x2).toFixed(0)}'/>`);
      }
      x += dash + gap;
    }
  }
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice'>` +
    `<g stroke='#fff' stroke-width='15'>${parts.join("")}</g></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
})();
