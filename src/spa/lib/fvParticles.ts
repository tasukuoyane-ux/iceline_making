// 微粒子パーティクル（デザイン支給 Iceline_Hojin/site/assets/js/fv-particles.js の TypeScript 移植）。
// 氷の微粒子が「散る（drift）→集まる（gather）→シルエット形成・赤グラデ（hold）→爆散（burst）」を繰り返す。
//   トップFV（hero=false）: 食材8種のシルエット。
//   下層ヒーロー（hero=true）: ページ内容に応じたシルエット（会社情報＝本社ビル・結晶）。
// 2026-09 改修: トップFVは「オブジェクトを形作るまで（drift＋gather）」と「解体後にオブジェクトが無い時間
// （drift）」を元の 1/3 にできるよう、timing で倍率を渡せるようにした（ユーザー指定）。

export type ShapeName =
  | "fish" | "grapes" | "lemonWedge" | "carrot" | "orange" | "broccoli" | "cup" | "strawberry"
  | "kakigori" | "iceball" | "icecube" | "crystal" | "warehouse" | "box" | "truck" | "dryice" | "building";

type Ctx = CanvasRenderingContext2D;

/* ---------- シルエット描画（340px 正方・中心原点） ---------- */
const DRAW: Record<ShapeName, (o: Ctx) => void> = {
  fish(o) {
    o.beginPath(); o.ellipse(-18, 8, 102, 60, 0, 0, 7); o.fill();
    o.beginPath(); o.moveTo(62, 8); o.lineTo(148, -48); o.lineTo(148, 62); o.closePath(); o.fill();
    o.beginPath(); o.moveTo(-70, -42); o.quadraticCurveTo(-10, -100, 50, -34); o.closePath(); o.fill();
    o.beginPath(); o.moveTo(-45, 60); o.lineTo(-20, 96); o.lineTo(8, 62); o.closePath(); o.fill();
  },
  grapes(o) {
    const r = 30;
    const b = [[-85, -25], [-45, -43], [-5, -53], [38, -45], [75, -23],
      [-68, 10], [-28, -1], [12, -11], [52, 1],
      [-45, 37], [-5, 29], [35, 31], [-20, 61], [18, 57], [0, 83]];
    for (const p of b) { o.beginPath(); o.arc(p[0], p[1], r, 0, 7); o.fill(); }
    o.save(); o.translate(78, -50); o.rotate(-0.55); o.fillRect(-6, -68, 12, 72); o.restore();
  },
  lemonWedge(o) {
    o.save(); o.rotate(0.4);
    o.beginPath(); o.arc(0, -25, 122, 0, Math.PI); o.closePath(); o.fill();
    o.globalCompositeOperation = "destination-out";
    o.lineWidth = 11;
    for (let i = 1; i < 5; i++) {
      const a = (Math.PI * i) / 5;
      o.beginPath(); o.moveTo(0, -25); o.lineTo(Math.cos(a) * 102, -25 + Math.sin(a) * 102); o.stroke();
    }
    o.beginPath(); o.arc(0, -25, 102, 0, Math.PI); o.stroke();
    o.globalCompositeOperation = "source-over";
    o.restore();
  },
  carrot(o) {
    o.save(); o.rotate(0.55);
    o.beginPath();
    o.ellipse(0, -78, 42, 27, 0, Math.PI, 0);
    o.lineTo(13, 105); o.quadraticCurveTo(0, 130, -13, 105);
    o.closePath(); o.fill();
    o.lineWidth = 15; o.lineCap = "round";
    o.beginPath(); o.moveTo(-18, -95); o.lineTo(-52, -148); o.stroke();
    o.beginPath(); o.moveTo(0, -100); o.lineTo(2, -160); o.stroke();
    o.beginPath(); o.moveTo(18, -95); o.lineTo(48, -145); o.stroke();
    o.restore();
  },
  orange(o) {
    const R = 150, ring = 118, flesh = 106;
    o.beginPath(); o.arc(0, 0, R, 0, 7); o.fill();
    o.globalCompositeOperation = "destination-out";
    o.beginPath(); o.arc(0, 0, ring, 0, 7); o.fill();
    o.globalCompositeOperation = "source-over";
    o.beginPath(); o.arc(0, 0, flesh, 0, 7); o.fill();
    o.globalCompositeOperation = "destination-out";
    o.lineWidth = 14;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      o.beginPath(); o.moveTo(0, 0); o.lineTo(Math.cos(a) * flesh, Math.sin(a) * flesh); o.stroke();
    }
    o.beginPath(); o.arc(0, 0, 18, 0, 7); o.fill();
    o.globalCompositeOperation = "source-over";
  },
  broccoli(o) {
    const h = [[-70, -25, 40], [-28, -58, 46], [28, -55, 45], [70, -22, 38], [0, -18, 48], [-45, 8, 36], [45, 10, 36]];
    for (const p of h) { o.beginPath(); o.arc(p[0], p[1], p[2], 0, 7); o.fill(); }
    o.beginPath(); o.moveTo(-24, 20); o.lineTo(-32, 100); o.lineTo(32, 100); o.lineTo(24, 20); o.closePath(); o.fill();
  },
  cup(o) {
    o.save(); o.translate(0, 10);
    o.save(); o.rotate(0.16); o.fillRect(10, -158, 28, 130); o.restore();
    const w = [[-34, -52, 26], [0, -66, 30], [34, -52, 26], [-16, -84, 22], [16, -84, 22], [0, -102, 20]];
    for (const p of w) { o.beginPath(); o.arc(p[0], p[1], p[2], 0, 7); o.fill(); }
    o.fillRect(-80, -34, 160, 16);
    o.beginPath(); o.moveTo(-70, -18); o.lineTo(70, -18); o.lineTo(50, 118); o.lineTo(-50, 118); o.closePath(); o.fill();
    o.restore();
  },
  strawberry(o) {
    o.beginPath();
    o.moveTo(-95, -30);
    o.bezierCurveTo(-95, -90, -45, -118, 0, -118);
    o.bezierCurveTo(45, -118, 95, -90, 95, -30);
    o.bezierCurveTo(95, 45, 45, 110, 0, 130);
    o.bezierCurveTo(-45, 110, -95, 45, -95, -30);
    o.closePath(); o.fill();
    o.beginPath(); o.moveTo(0, -160); o.lineTo(-34, -116); o.lineTo(34, -116); o.closePath(); o.fill();
  },
  kakigori(o) {
    o.beginPath(); o.arc(0, -32, 82, Math.PI, 0); o.fill();
    o.beginPath(); o.arc(0, -78, 52, Math.PI, 0); o.fill();
    o.fillRect(-82, -34, 164, 26);
    o.beginPath(); o.moveTo(-95, 0); o.lineTo(95, 0); o.lineTo(62, 110); o.lineTo(-62, 110); o.closePath(); o.fill();
  },
  iceball(o) {
    o.beginPath(); o.arc(0, 0, 108, 0, 7); o.fill();
    o.globalCompositeOperation = "destination-out";
    o.lineWidth = 9;
    o.beginPath(); o.moveTo(-76, -62); o.lineTo(18, -96); o.stroke();
    o.beginPath(); o.moveTo(52, -78); o.lineTo(92, -8); o.stroke();
    o.beginPath(); o.moveTo(-96, 20); o.lineTo(-30, 58); o.stroke();
    o.globalCompositeOperation = "source-over";
  },
  icecube(o) {
    const r = 26;
    o.beginPath();
    o.moveTo(-85 + r, -85); o.arcTo(85, -85, 85, 85, r); o.arcTo(85, 85, -85, 85, r);
    o.arcTo(-85, 85, -85, -85, r); o.arcTo(-85, -85, 85, -85, r);
    o.closePath(); o.fill();
    o.globalCompositeOperation = "destination-out";
    o.lineWidth = 12;
    o.beginPath(); o.moveTo(-40, -95); o.lineTo(-95, -40); o.stroke();
    o.beginPath(); o.moveTo(20, -95); o.lineTo(-95, 20); o.stroke();
    o.globalCompositeOperation = "source-over";
  },
  crystal(o) {
    o.lineCap = "round";
    for (let i = 0; i < 6; i++) {
      o.save(); o.rotate((i * Math.PI) / 3);
      o.fillRect(-8, -118, 16, 118);
      o.lineWidth = 14;
      o.beginPath(); o.moveTo(0, -72); o.lineTo(-32, -100); o.stroke();
      o.beginPath(); o.moveTo(0, -72); o.lineTo(32, -100); o.stroke();
      o.beginPath(); o.moveTo(0, -36); o.lineTo(-24, -60); o.stroke();
      o.beginPath(); o.moveTo(0, -36); o.lineTo(24, -60); o.stroke();
      o.restore();
    }
  },
  warehouse(o) {
    o.beginPath(); o.moveTo(-122, -18); o.lineTo(0, -96); o.lineTo(122, -18); o.closePath(); o.fill();
    o.fillRect(-110, -18, 220, 128);
    o.globalCompositeOperation = "destination-out";
    o.fillRect(-26, 30, 52, 80);
    o.fillRect(-82, 4, 30, 30);
    o.fillRect(52, 4, 30, 30);
    o.globalCompositeOperation = "source-over";
  },
  box(o) {
    o.fillRect(-82, -55, 164, 145);
    o.beginPath(); o.moveTo(-82, -55); o.lineTo(-14, -108); o.lineTo(-4, -55); o.closePath(); o.fill();
    o.beginPath(); o.moveTo(82, -55); o.lineTo(14, -108); o.lineTo(4, -55); o.closePath(); o.fill();
    o.globalCompositeOperation = "destination-out";
    o.fillRect(-6, -55, 12, 145);
    o.globalCompositeOperation = "source-over";
  },
  truck(o) {
    o.fillRect(-120, -50, 155, 100);
    o.beginPath(); o.moveTo(35, -22); o.lineTo(92, -22); o.lineTo(115, 8); o.lineTo(115, 50); o.lineTo(35, 50); o.closePath(); o.fill();
    o.beginPath(); o.arc(-70, 62, 26, 0, 7); o.fill();
    o.beginPath(); o.arc(78, 62, 26, 0, 7); o.fill();
    o.globalCompositeOperation = "destination-out";
    o.fillRect(48, -12, 40, 26);
    o.globalCompositeOperation = "source-over";
  },
  dryice(o) {
    const r = 20;
    o.beginPath();
    o.moveTo(-78 + r, -8); o.arcTo(78, -8, 78, 118, r); o.arcTo(78, 118, -78, 118, r);
    o.arcTo(-78, 118, -78, -8, r); o.arcTo(-78, -8, 78, -8, r);
    o.closePath(); o.fill();
    o.lineWidth = 17; o.lineCap = "round";
    o.beginPath(); o.moveTo(-45, -35); o.bezierCurveTo(-70, -65, -25, -85, -48, -122); o.stroke();
    o.beginPath(); o.moveTo(2, -35); o.bezierCurveTo(-20, -70, 25, -90, 4, -132); o.stroke();
    o.beginPath(); o.moveTo(48, -35); o.bezierCurveTo(28, -60, 70, -82, 50, -115); o.stroke();
  },
  building(o) {
    o.fillRect(-95, -55, 82, 175);
    o.fillRect(3, -108, 92, 228);
    o.globalCompositeOperation = "destination-out";
    o.lineWidth = 9;
    for (let y = -86; y < 110; y += 30) { o.beginPath(); o.moveTo(10, y); o.lineTo(88, y); o.stroke(); }
    for (let y2 = -34; y2 < 110; y2 += 30) { o.beginPath(); o.moveTo(-88, y2); o.lineTo(-20, y2); o.stroke(); }
    o.beginPath(); o.moveTo(49, -108); o.lineTo(49, 120); o.stroke();
    o.globalCompositeOperation = "source-over";
  },
};

/** トップFV の食材シルエット（デザイン支給の順） */
export const FV_TOP_SHAPES: ShapeName[] = ["fish", "grapes", "lemonWedge", "carrot", "orange", "broccoli", "cup", "strawberry"];

function sample(name: ShapeName): { x: number; y: number }[] {
  const S = 340;
  const oc = document.createElement("canvas");
  oc.width = S;
  oc.height = S;
  const o = oc.getContext("2d")!;
  o.clearRect(0, 0, S, S);
  o.fillStyle = "#000";
  o.strokeStyle = "#000";
  o.save();
  o.translate(S / 2, S / 2);
  DRAW[name](o);
  o.restore();
  const d = o.getImageData(0, 0, S, S).data;
  const pts: { x: number; y: number }[] = [];
  for (let y = 0; y < S; y += 5) for (let x = 0; x < S; x += 5) {
    if (d[(y * S + x) * 4 + 3] > 128) pts.push({ x: x / S - 0.5, y: y / S - 0.5 });
  }
  return pts;
}

const GRAYS = [[201, 208, 213], [214, 220, 224], [191, 200, 206], [197, 216, 226]];
function redAt(t: number): number[] {
  const top = [249, 167, 155], mid = [232, 68, 60], bot = [179, 0, 14];
  const a = t < 0.5 ? top : mid, b = t < 0.5 ? mid : bot, u = (t < 0.5 ? t : t - 0.5) * 2;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function lerpCol(c: number[], target: number[], k: number) {
  c[0] += (target[0] - c[0]) * k; c[1] += (target[1] - c[1]) * k; c[2] += (target[2] - c[2]) * k;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; s: number; ph: number;
  gray: number[]; col: number[];
  tx: number; ty: number; sx: number; sy: number; has: boolean; d: number; gt: number;
}

export interface FvTiming {
  /** 散らばっている（オブジェクトが無い）時間の倍率 */
  driftMul?: number;
  /** 集まってオブジェクトを形作るまでの時間の倍率 */
  gatherMul?: number;
  /** false を返している間はシルエット（赤いオブジェクト）を作らず、散らばったまま漂い続ける
   * （トップ：メインビジュアルが画面内にあるときだけ形作る。2026-09 改修） */
  canGather?: () => boolean;
}

/**
 * キャンバスに微粒子アニメーションを起動する。戻り値は停止関数（アンマウント時に呼ぶ）。
 * @param hero true=下層ヒーロー用（右寄せ・粒子少なめ）、false=トップFV用
 */
export function mountFvParticles(cv: HTMLCanvasElement, names: ShapeName[], hero: boolean, timing: FvTiming = {}): () => void {
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let P: Particle[] = [];
  const shapes = names.map(sample);
  let state: "drift" | "gather" | "hold" | "burst" = "drift";
  let tS = 0;
  let shapeIdx = 0;
  const DUR = {
    drift: (hero ? 3.2 : 3.6) * (timing.driftMul ?? 1),
    gather: 1.92 * (timing.gatherMul ?? 1),
    hold: 3.4,
    burst: 1.4,
  };
  let raf = 0;
  let stopped = false;

  function center() {
    const mob = W < 768;
    if (hero) return { cx: W * (mob ? 0.5 : 0.8), cy: H * 0.52, sc: Math.min(W, H) * 0.95 };
    // シルエットは従来比 1.25 倍（コピーへの重なり許容 ※デザイン指定）
    return { cx: W * (mob ? 0.5 : 0.66), cy: H * (mob ? 0.36 : 0.44), sc: Math.min(W, H) * (mob ? 1 : 0.85) };
  }
  function resize() {
    W = cv.clientWidth;
    H = cv.clientHeight;
    cv.width = W * DPR;
    cv.height = H * DPR;
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function init() {
    const div = hero ? 1100 : 900, cap = hero ? 750 : 1600, floor = hero ? 320 : 700;
    const n = Math.min(cap, Math.max(floor, Math.floor((W * H) / div)));
    P = [];
    for (let i = 0; i < n; i++) {
      const g = GRAYS[i % GRAYS.length];
      P.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        s: Math.random() < 0.7 ? 2 + Math.random() * 1.6 : 3.6 + Math.random() * 1.8,
        ph: Math.random() * 6.28,
        gray: g, col: [g[0], g[1], g[2]],
        tx: 0, ty: 0, sx: 0, sy: 0, has: false, d: 0, gt: 0,
      });
    }
  }
  function assign() {
    const pts = shapes[shapeIdx], sc = center();
    const idx = P.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    const n = Math.min(pts.length, P.length);
    for (const p of P) p.has = false;
    for (let m = 0; m < n; m++) {
      const p = P[idx[m]], pt = pts[m % pts.length];
      p.has = true;
      p.tx = sc.cx + pt.x * sc.sc; p.ty = sc.cy + pt.y * sc.sc;
      p.sx = p.x; p.sy = p.y;
      p.d = Math.random() * 0.28; p.gt = pt.y + 0.5;
    }
  }
  let last = 0;
  function frame(now: number) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    tS += dt;
    const time = now / 1000;
    if (state === "drift" && tS >= DUR.drift) {
      if (timing.canGather && !timing.canGather()) tS = DUR.drift; // 形作れない位置なら漂い続ける（次フレームで再判定）
      else { state = "gather"; tS = 0; assign(); }
    }
    else if (state === "gather" && tS >= DUR.gather + 0.3) { state = "hold"; tS = 0; }
    else if (state === "hold" && tS >= DUR.hold) {
      state = "burst"; tS = 0;
      const sc = center();
      for (const p of P) {
        if (!p.has) continue;
        const dx = p.x - sc.cx, dy = p.y - sc.cy, L = Math.sqrt(dx * dx + dy * dy) || 1;
        const v = 90 + Math.random() * 180;
        p.vx = (dx / L) * v / 60 + (Math.random() - 0.5) * 2;
        p.vy = (dy / L) * v / 60 + (Math.random() - 0.5) * 2;
      }
    } else if (state === "burst" && tS >= DUR.burst) { state = "drift"; tS = 0; shapeIdx = (shapeIdx + 1) % shapes.length; }

    ctx!.clearRect(0, 0, W, H);
    for (const p2 of P) {
      const active = p2.has && (state === "gather" || state === "hold");
      if (active && state === "gather") {
        const t = Math.max(0, Math.min(1, (tS - p2.d) / DUR.gather));
        const e = ease(t);
        p2.x = p2.sx + (p2.tx - p2.sx) * e + Math.sin(time * 2 + p2.ph) * (1 - e) * 4;
        p2.y = p2.sy + (p2.ty - p2.sy) * e + Math.cos(time * 1.7 + p2.ph) * (1 - e) * 4;
        if (t > 0.55) lerpCol(p2.col, redAt(p2.gt), dt * 5);
      } else if (active && state === "hold") {
        p2.x = p2.tx + Math.sin(time * 2.2 + p2.ph) * 1.4;
        p2.y = p2.ty + Math.cos(time * 1.9 + p2.ph) * 1.4;
        lerpCol(p2.col, redAt(p2.gt), dt * 5);
      } else {
        p2.x += p2.vx + Math.sin(time * 0.7 + p2.ph) * 0.18;
        p2.y += p2.vy + Math.cos(time * 0.6 + p2.ph) * 0.18;
        if (state === "burst" && p2.has) { p2.vx *= 0.96; p2.vy *= 0.96; }
        else { p2.vx *= 0.999; p2.vy *= 0.999; }
        if (p2.x < -8) p2.x = W + 8;
        if (p2.x > W + 8) p2.x = -8;
        if (p2.y < -8) p2.y = H + 8;
        if (p2.y > H + 8) p2.y = -8;
        lerpCol(p2.col, p2.gray, dt * 2.2);
      }
      ctx!.fillStyle = "rgb(" + (p2.col[0] | 0) + "," + (p2.col[1] | 0) + "," + (p2.col[2] | 0) + ")";
      ctx!.fillRect(p2.x - p2.s / 2, p2.y - p2.s / 2, p2.s, p2.s);
    }
    raf = requestAnimationFrame(frame);
  }

  resize();
  init();
  window.addEventListener("resize", resize);
  if (reduced) {
    // モーション低減：形作った状態を1枚だけ描く
    assign();
    ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      const col = p.has ? redAt(p.gt) : p.gray;
      if (p.has) { p.x = p.tx; p.y = p.ty; }
      ctx.fillStyle = "rgb(" + (col[0] | 0) + "," + (col[1] | 0) + "," + (col[2] | 0) + ")";
      ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    return () => window.removeEventListener("resize", resize);
  }
  raf = requestAnimationFrame((t) => {
    last = t;
    raf = requestAnimationFrame(frame);
  });
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}
