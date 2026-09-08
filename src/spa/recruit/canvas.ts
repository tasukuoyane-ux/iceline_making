// 採用ページの背景キャンバス（デザイン支給 main.js の React/TypeScript 移植）。
//
// 固定キャンバスに、スクロール進捗と連動した4幕構成の線画アニメーションを描く。
//   第1幕 氷の多面体がアイドル位置から中央へダイブ落下
//   第2幕 衝撃波＋3D破片の爆散
//   第3幕 風に流される降雪と積雪
//   第4幕 薄緑の陸地（数字セクション以降）をトラックが周回し轍を残す
// mode="ambient" では、積雪後の静かな情景を時間駆動で描く。
// mode="land"（記事・職種詳細。2026-09 改修）では、画面上端1割の空を除き全面が緑の陸地で、
// 雪（降雪・積雪・停車トラック）は無く、蛇行トラック3台と歩く人・耕す人だけが動く。
//
// 2026-09 改修（移植時）:
//  - 衝突時の白いストロボ点滅は「チカチカする」ため廃止した（元 main.js の strobe ブロック）
//  - 背景線画と重なるテキストの退避窓（.is-over-art）は、重なり判定が数フレーム連続で
//    変わったときだけ切り替える（ヒステリシス）ようにし、境界付近での明滅を防ぐ
//  - React のアンマウントで確実に止められるよう、rAF・イベントを stop() で解除する
//  - 氷（多面体）が重なった箇所だけ文字色を Ink に切り替える（.ice-aware / .is-over-ice。
//    ヒーロー・②は退避窓を出さない代わりにこの色替えで可読性を守る。デザイン支給の更新分）

export type CanvasMode = "story" | "ambient" | "land";

export interface MountOptions {
  canvas: HTMLCanvasElement;
  mode: CanvasMode;
  /** テキスト退避窓・陸地アンカーの探索範囲（採用ページのルート要素） */
  root: HTMLElement;
  /** 陸地の地平線の基準にする要素の id（トップの「数字で見る」セクション） */
  landAnchorId?: string;
  /** true ならオープニング（氷の組み上がり）から始める */
  intro: boolean;
  onIntroDone?: () => void;
  /** スクロール位置の取得元（トップ=window／オーバーレイ=そのスクロール要素） */
  getScroll: () => { y: number; max: number };
  /** 陸地アンカーの画面上の位置（root 基準で offsetTop を使えない場合に指定） */
  getAnchorTop?: (el: HTMLElement) => number;
}

export interface CanvasHandle {
  stop(): void;
  /** オープニングをスキップして本編へ */
  skipIntro(): void;
  /** 退避窓の対象要素を再収集する（コンテンツの再描画後に呼ぶ） */
  rescan(): void;
}

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

// オープニングは約1.2秒（導入150ms／1面45ms×20／余韻300ms）— すぐ凍ってすぐコピー表示（2026-09 改修）
const INTRO_STEP = 45; // 1面あたりのms（ぱきっ間隔）
const INTRO_PRE = 150; // 水色だけを見せる導入のms
const INTRO_TAIL = 300; // 完成後の余韻ms

export function mountRecruitCanvas(opts: MountOptions): CanvasHandle {
  const { canvas, mode, root } = opts;
  const ambient = mode === "ambient";
  const landMode = mode === "land";
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let stopped = false;
  let raf = 0;

  if (!ctx || reduceMotion) {
    // モーション低減時はキャンバスを描かず、オープニングも即終了
    if (opts.intro) opts.onIntroDone?.();
    return { stop() { stopped = true; }, skipIntro() {}, rescan() {} };
  }

  let W = 0;
  let H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- 補助 ---------- */
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t: number) => {
    const c = 1.4;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  };

  const rand = (() => {
    let s = 42;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  })();

  /* ---------- 3D 透視投影 ---------- */
  const FOV = 900;
  function proj(x: number, y: number, z: number, cx: number, cy: number) {
    const s = FOV / (FOV + Math.max(z, -FOV * 0.8));
    return { x: cx + x * s, y: cy + y * s, s };
  }
  function rot3(v: number[], rx: number, ry: number, rz: number): number[] {
    let x = v[0], y = v[1], z = v[2], c: number, s: number, t: number;
    c = Math.cos(rx); s = Math.sin(rx); t = y; y = t * c - z * s; z = t * s + z * c;
    c = Math.cos(ry); s = Math.sin(ry); t = x; x = t * c + z * s; z = -t * s + z * c;
    c = Math.cos(rz); s = Math.sin(rz); t = x; x = t * c - y * s; y = t * s + y * c;
    return [x, y, z];
  }

  /* ---------- 氷の多面体（イコサヘドロンをシード乱数で歪ませたソリッド） ---------- */
  const ICO_T = (1 + Math.sqrt(5)) / 2;
  const GEM_V = [
    [-1, ICO_T, 0], [1, ICO_T, 0], [-1, -ICO_T, 0], [1, -ICO_T, 0],
    [0, -1, ICO_T], [0, 1, ICO_T], [0, -1, -ICO_T], [0, 1, -ICO_T],
    [ICO_T, 0, -1], [ICO_T, 0, 1], [-ICO_T, 0, -1], [-ICO_T, 0, 1],
  ].map((v) => {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    const jitter = 0.86 + rand() * 0.26;
    return [(v[0] / len) * jitter, (v[1] / len) * jitter, (v[2] / len) * jitter];
  });
  const GEM_F = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  const GEM_TINT = GEM_F.map(() => (rand() - 0.5) * 0.22);
  const BUILD_RANK = GEM_F.map((_, fi) => (fi * 7 + 3) % 20);
  const LIGHT = (() => {
    const l = [-0.45, -0.6, 0.66];
    const n = Math.sqrt(l[0] * l[0] + l[1] * l[1] + l[2] * l[2]);
    return [l[0] / n, l[1] / n, l[2] / n];
  })();

  /* ---------- 破片・氷粉・微細片 ---------- */
  const SHARDS = Array.from({ length: 40 }, () => {
    const ang = rand() * Math.PI * 2;
    const pow = 0.4 + rand() * 1.0;
    return {
      vx: Math.cos(ang) * 860 * pow,
      vy: -(320 + rand() * 860) * pow,
      vz: (rand() - 0.5) * 920 * pow,
      size: 24 + rand() * 58,
      shade: 0.35 + rand() * 0.6,
      rx: rand() * Math.PI * 2,
      ry: rand() * Math.PI * 2,
      sx: (rand() - 0.5) * 10,
      sy: (rand() - 0.5) * 10,
      tri: [
        [-1, -0.2 - rand() * 0.8, 0],
        [0.4 + rand() * 0.6, -0.6 + rand() * 0.4, rand() - 0.5],
        [0.1 + rand() * 0.5, 0.7 + rand() * 0.5, rand() - 0.5],
      ],
    };
  });
  const SPARKS = Array.from({ length: 72 }, () => {
    const a2 = rand() * Math.PI * 2;
    const pw = 0.3 + rand() * 1.05;
    return { vx: Math.cos(a2) * 680 * pw, vy: -(160 + rand() * 740) * pw, vz: (rand() - 0.5) * 640 * pw, r: 1 + rand() * 2.6 };
  });
  const MICRO = Array.from({ length: 64 }, () => ({
    ang: rand() * Math.PI * 2,
    pw: 0.25 + rand() * 0.95,
    len: 4 + rand() * 11,
    rot: rand() * Math.PI * 2,
    spin: (rand() - 0.5) * 8,
    seed: rand() * 100,
  }));
  const TREES = Array.from({ length: 7 }, () => ({ fx: 0.06 + rand() * 0.88, off: 26 + rand() * 46, s: 0.7 + rand() * 0.7 }));
  const FLOWERS = Array.from({ length: 12 }, () => ({ fx: rand(), off: 40 + rand() * 90, s: 0.7 + rand() * 0.6 }));
  const FLAKES = Array.from({ length: 200 }, () => ({
    x: rand() * 1.2 - 0.1,
    y: rand(),
    z: 0.22 + rand() * 0.78,
    sway: rand() * Math.PI * 2,
    swayAmp: 14 + rand() * 32,
    spd: 0.045 + rand() * 0.08,
    kind: rand() < 0.4 ? 2 : rand() < 0.65 ? 1 : 0,
    spin: rand() * Math.PI,
  }));

  let target = 0;
  let smooth = 0;
  let time = 0;
  let frame = 0;
  let handoffAt = 0;
  let introBuild: { start: number } | null = null;

  function progress() {
    if (ambient || landMode) return 1;
    const { y, max } = opts.getScroll();
    return max > 0 ? clamp01(y / max) : 0;
  }
  function scrollY() {
    return opts.getScroll().y;
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    ctx!.beginPath();
    ctx!.moveTo(x1, y1);
    ctx!.lineTo(x2, y2);
    ctx!.stroke();
  }

  /* ブラシストローク: わずかに反った二重線（太い淡＋細い濃） */
  function brush(x1: number, y1: number, x2: number, y2: number, w: number, alpha: number, seed: number) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.5) return;
    const nx = -dy / len, ny = dx / len;
    const bow = Math.sin(seed * 12.9898) * len * 0.08;
    const mx = (x1 + x2) / 2 + nx * bow;
    const my = (y1 + y2) / 2 + ny * bow;
    const ga = ctx!.globalAlpha;
    ctx!.globalAlpha = ga * alpha * 0.35;
    ctx!.lineWidth = w * 2.2;
    ctx!.beginPath();
    ctx!.moveTo(x1, y1);
    ctx!.quadraticCurveTo(mx, my, x2, y2);
    ctx!.stroke();
    ctx!.globalAlpha = ga * alpha;
    ctx!.lineWidth = Math.max(0.6, w * 0.8);
    ctx!.beginPath();
    ctx!.moveTo(x1 + nx * w * 0.5, y1 + ny * w * 0.5);
    ctx!.quadraticCurveTo(mx, my, x2, y2);
    ctx!.stroke();
    ctx!.globalAlpha = ga;
  }

  let artRegions: Region[] = [];
  /* 氷（多面体）そのものの領域（ヒーロー・②の文字色替え用） */
  let gemRegion: Region | null = null;

  /* ---------- 薄緑の陸地 ---------- */
  const landEl = opts.landAnchorId ? (root.querySelector<HTMLElement>("#" + opts.landAnchorId) ?? null) : null;
  let landHorizon: number | null = null;
  function drawLand() {
    landHorizon = null;
    if (ambient || !landEl) return;
    const top = opts.getAnchorTop ? opts.getAnchorTop(landEl) : landEl.getBoundingClientRect().top;
    const horizon = top + 60;
    if (horizon > H + 80) return;
    landHorizon = horizon;
    paintLandAt(horizon);
  }

  function paintLandAt(horizon: number) {
    const c = ctx!;
    const hillY = (x: number, base: number, amp: number, f: number, ph: number) =>
      base + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph * 1.7) * amp * 0.4;
    c.fillStyle = "#DFF3D6";
    c.beginPath();
    c.moveTo(0, H);
    for (let x0 = 0; x0 <= W; x0 += 24) c.lineTo(x0, hillY(x0, horizon - 30, 16, 0.006, 1.3));
    c.lineTo(W, H);
    c.closePath();
    c.fill();
    c.fillStyle = "#CDEBC5";
    c.beginPath();
    c.moveTo(0, H);
    for (let x1 = 0; x1 <= W; x1 += 20) c.lineTo(x1, hillY(x1, horizon + 8, 20, 0.004, 0));
    c.lineTo(W, H);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(122, 196, 120, 0.85)";
    for (let bx = 0; bx < W; bx += 110) {
      const by1 = hillY(bx, horizon + 8, 20, 0.004, 0);
      const by2 = hillY(bx + 90, horizon + 8, 20, 0.004, 0);
      brush(bx, by1, bx + 90, by2, 2, 0.7, bx * 0.13);
    }
    c.lineJoin = "round";
    c.lineCap = "round";
    for (const tr of TREES) {
      const tx = tr.fx * W;
      const ty = hillY(tx, horizon + 8, 20, 0.004, 0) + tr.off;
      if (ty < -60 || ty > H + 60) continue;
      const s = tr.s;
      c.strokeStyle = "#5FA463";
      c.fillStyle = "rgba(255,255,255,0.55)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(tx, ty - 10 * s);
      c.stroke();
      c.beginPath();
      c.moveTo(tx - 13 * s, ty - 10 * s);
      c.lineTo(tx, ty - 30 * s);
      c.lineTo(tx + 13 * s, ty - 10 * s);
      c.closePath();
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(tx - 9 * s, ty - 26 * s);
      c.lineTo(tx, ty - 42 * s);
      c.lineTo(tx + 9 * s, ty - 26 * s);
      c.closePath();
      c.fill();
      c.stroke();
    }
    for (const fw of FLOWERS) {
      const fx2 = fw.fx * W;
      const fy2 = hillY(fx2, horizon + 8, 20, 0.004, 0) + fw.off;
      if (fy2 < -20 || fy2 > H + 20) continue;
      c.strokeStyle = "#5FA463";
      c.lineWidth = 1.5;
      line(fx2, fy2, fx2, fy2 - 8 * fw.s);
      c.fillStyle = "#FFFFFF";
      c.beginPath();
      c.arc(fx2, fy2 - 10 * fw.s, 3 * fw.s, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(0,155,253,0.5)";
      c.beginPath();
      c.arc(fx2, fy2 - 10 * fw.s, 1.1 * fw.s, 0, Math.PI * 2);
      c.fill();
    }
  }

  /* ---------- 氷の多面体レンダラ ---------- */
  function renderGem(cx: number, cy: number, ox: number, oy: number, z: number, rx: number, ry: number, rz: number, aMul: number, build?: { count: number; flash: number }) {
    const c = ctx!;
    const R = Math.min(W, H) * 0.15;
    const vp = GEM_V.map((v, vi) => {
      const r = rot3(v, rx, ry, rz);
      const wx = Math.sin(time * 0.0012 + vi * 2.3) * R * 0.02;
      const wy = Math.cos(time * 0.001 + vi * 1.7) * R * 0.02;
      return [r[0] * R + ox + wx, r[1] * R + oy + wy, r[2] * R + z];
    });
    const faces = GEM_F.map((f, fi) => {
      const a = vp[f[0]], b = vp[f[1]], cc = vp[f[2]];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const w2 = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
      let n = [u[1] * w2[2] - u[2] * w2[1], u[2] * w2[0] - u[0] * w2[2], u[0] * w2[1] - u[1] * w2[0]];
      const nl = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
      n = [n[0] / nl, n[1] / nl, n[2] / nl];
      return { f, z: (a[2] + b[2] + cc[2]) / 3, n, tint: GEM_TINT[fi], seed: fi * 3.7, rank: BUILD_RANK[fi] };
    }).sort((a, b) => b.z - a.z);

    c.lineJoin = "round";
    c.lineCap = "round";
    for (const fc of faces) {
      if (build && fc.rank >= build.count) continue;
      const shade = Math.max(0, fc.n[0] * LIGHT[0] + fc.n[1] * LIGHT[1] + fc.n[2] * LIGHT[2]) + fc.tint;
      const front = fc.n[2] < 0;
      const alpha = clamp01(front ? 0.5 + shade * 0.42 : 0.28 + shade * 0.22) * aMul;
      c.fillStyle = shade > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(226,226,226,${alpha})`;
      const pps = fc.f.map((vi) => {
        const pt = vp[vi];
        return proj(pt[0], pt[1], pt[2], cx, cy);
      });
      c.beginPath();
      pps.forEach((pp, idx) => (idx ? c.lineTo(pp.x, pp.y) : c.moveTo(pp.x, pp.y)));
      c.closePath();
      c.fill();
      if (build && fc.rank === build.count - 1 && build.flash > 0) {
        c.fillStyle = `rgba(255,255,255,${0.85 * build.flash})`;
        c.fill();
        const mcx = (pps[0].x + pps[1].x + pps[2].x) / 3;
        const mcy = (pps[0].y + pps[1].y + pps[2].y) / 3;
        c.strokeStyle = `rgba(255,255,255,${build.flash})`;
        for (let sp2 = 0; sp2 < 4; sp2++) {
          const sa2 = sp2 * 1.57 + fc.seed;
          const r1b = 10 + (1 - build.flash) * 16;
          brush(mcx + Math.cos(sa2) * r1b, mcy + Math.sin(sa2) * r1b, mcx + Math.cos(sa2) * (r1b + 9), mcy + Math.sin(sa2) * (r1b + 9), 1.4, build.flash, fc.seed + sp2);
        }
      }
      c.strokeStyle = "#FFFFFF";
      for (let e = 0; e < 3; e++) {
        const a1 = pps[e], a2 = pps[(e + 1) % 3];
        const exd = (a2.x - a1.x) * 0.09, eyd = (a2.y - a1.y) * 0.09;
        brush(a1.x - exd, a1.y - eyd, a2.x + exd, a2.y + eyd, 2.2 * a1.s, 0.78 * aMul, fc.seed + e);
      }
      if (front && aMul > 0.6) {
        c.strokeStyle = `rgba(226,226,226,${0.35 + shade * 0.3})`;
        for (let hh = 0; hh < 3; hh++) {
          const ft = 0.25 + hh * 0.22;
          brush(
            pps[0].x + (pps[1].x - pps[0].x) * ft, pps[0].y + (pps[1].y - pps[0].y) * ft,
            pps[2].x + (pps[1].x - pps[2].x) * ft, pps[2].y + (pps[1].y - pps[2].y) * ft,
            0.9, 0.5 - hh * 0.1, fc.seed + 9 + hh * 7,
          );
        }
      }
    }
    const cp0 = proj(ox, oy, z, cx, cy);
    const spkR = R * 0.7 * cp0.s;
    c.strokeStyle = `rgba(255,255,255,${0.9 * aMul})`;
    c.lineWidth = 1.5;
    [[-0.35, -0.4], [0.3, -0.15], [-0.05, 0.35]].forEach((o, idx) => {
      const sx = cp0.x + o[0] * spkR * 2, sy2 = cp0.y + o[1] * spkR * 2;
      const s = 3 + Math.sin(time * 0.004 + idx * 2) * 1.5;
      line(sx - s, sy2, sx + s, sy2);
      line(sx, sy2 - s, sx, sy2 + s);
    });
    return cp0;
  }

  function gemAnchor(cx: number, cy: number) {
    return { x: (W > 768 ? W * 0.72 : W * 0.5) - cx, y: H * 0.3 - cy };
  }

  /* ---------- 第0幕: 受け渡し落下＋アイドル浮遊 ---------- */
  function drawGemIntro(cx: number, cy: number) {
    if (!handoffAt || time < handoffAt) return;
    const st = clamp01((time - handoffAt) / 1000);
    const an = gemAnchor(cx, cy);
    const startY = -cy - H * 0.35;
    const oy = startY + easeOutBack(st) * (an.y - startY);
    const bob = st >= 1 ? Math.sin(time * 0.0016) * 9 : 0;
    const rot = time * 0.00045;
    const rx = rot + (1 - st) * 5.2;
    const ry = rot * 1.4 + (1 - st) * 3.4;
    const rz = Math.sin(time * 0.0003) * 0.25 + (1 - st) * 1.2;
    const z = 500 - easeOut(st) * 280;
    if (st < 1) {
      const stG = Math.max(0, st - 0.07);
      const oyG = startY + easeOutBack(stG) * (an.y - startY);
      renderGem(cx, cy, an.x, oyG, z, rx + 0.25, ry + 0.3, rz, 0.22);
    }
    const cp = renderGem(cx, cy, an.x, oy + bob, z, rx, ry, rz, 1);
    const rad = Math.min(W, H) * 0.15 * 1.7 * cp.s;
    artRegions.push({ x: cp.x - rad, y: cp.y - rad, w: rad * 2, h: rad * 2 });
    gemRegion = { x: cp.x - rad, y: cp.y - rad, w: rad * 2, h: rad * 2 };
  }

  /* ---------- 第1幕: ダイブ落下 ---------- */
  function drawCube3D(p1: number, cx: number, cy: number) {
    const c = ctx!;
    const an = gemAnchor(cx, cy);
    const t = p1;
    const horiz = t * t * (3 - 2 * t);
    const fall = t * t;
    const ox = an.x * (1 - horiz);
    const oy = an.y + (0 - an.y) * fall;
    const z = 220 - easeOut(t) * 280;
    const rot = time * 0.00045;
    const rx = rot + t * 3.6;
    const ry = rot * 1.4 + t * 4.6;
    const rz = t * 1.4;
    if (fall > 0.12) {
      const R = Math.min(W, H) * 0.15;
      for (let i = 0; i < 10; i++) {
        c.strokeStyle = `rgba(255,255,255,${0.36 * fall * (0.5 + (i % 3) * 0.25)})`;
        const lx = ox + Math.sin(i * 1.7) * R * (1.3 + (i % 4) * 0.45);
        const len = R * (0.8 + (i % 3) * 0.6);
        const lp = proj(lx, oy - R * 2.2 - i * 24 - len, z, cx, cy);
        const lp2 = proj(lx, oy - R * 2.2 - i * 24, z, cx, cy);
        brush(lp.x, lp.y, lp2.x, lp2.y, 1.6, 0.9, i * 2.3);
      }
    }
    if (t > 0.1) {
      const tg = Math.max(0, t - 0.05);
      const horizG = tg * tg * (3 - 2 * tg);
      const fallG = tg * tg;
      renderGem(cx, cy, an.x * (1 - horizG), an.y + (0 - an.y) * fallG, 220 - easeOut(tg) * 280, rot + tg * 3.6, rot * 1.4 + tg * 4.6, tg * 1.4, 0.25);
    }
    const cp0 = renderGem(cx, cy, ox, oy, z, rx, ry, rz, 1);
    const crack = seg(p1, 0.65, 1);
    if (crack > 0) {
      const R2 = Math.min(W, H) * 0.15;
      c.strokeStyle = `rgba(0,119,217,${0.55 * crack})`;
      for (let cN = 0; cN < 3; cN++) {
        const a0 = cN * 2.1 + 0.5;
        let px2 = cp0.x, py2 = cp0.y;
        for (let st2 = 1; st2 <= 3; st2++) {
          const rr2 = (st2 / 3) * R2 * 1.15 * cp0.s * crack;
          const nx2 = cp0.x + Math.cos(a0 + st2 * 0.5) * rr2;
          const ny2 = cp0.y + Math.sin(a0 + st2 * 0.5) * rr2;
          brush(px2, py2, nx2, ny2, 1.4, 0.8, cN * 11 + st2);
          px2 = nx2;
          py2 = ny2;
        }
      }
    }
    const rad = Math.min(W, H) * 0.15 * 1.7 * cp0.s;
    artRegions.push({ x: cp0.x - rad, y: cp0.y - rad, w: rad * 2, h: rad * 2 });
    gemRegion = { x: cp0.x - rad, y: cp0.y - rad, w: rad * 2, h: rad * 2 };
  }

  /* ---------- 衝撃波 ---------- */
  function drawImpact(p: number, cx: number, cy: number) {
    const c = ctx!;
    const t = seg(p, 0.195, 0.3);
    if (t <= 0 || t >= 1) return;
    const e = easeOut(t);
    for (let i = 0; i < 4; i++) {
      const rr = e * Math.min(W, H) * (0.3 + i * 0.15);
      const alpha = (1 - t) * (0.55 - i * 0.11);
      if (alpha <= 0) continue;
      c.strokeStyle = `rgba(255,255,255,${alpha})`;
      c.lineWidth = 2.5 - i * 0.45;
      c.beginPath();
      c.ellipse(cx, cy, rr, rr * 0.32, 0, 0, Math.PI * 2);
      c.stroke();
    }
    const burst = 1 - seg(t, 0, 0.45);
    if (burst > 0) {
      for (let b = 0; b < 14; b++) {
        c.strokeStyle = `rgba(255,255,255,${0.85 * burst * (b % 2 ? 0.6 : 1)})`;
        const a = (b / 14) * Math.PI * 2 + 0.3;
        const r1 = e * 100 + 16;
        const r2 = r1 + (b % 2 ? 24 : 40) * burst;
        brush(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.5, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.5, 1.6, 0.9, b * 3.1);
      }
      c.strokeStyle = `rgba(226,226,226,${0.55 * burst})`;
      for (let u = 0; u < 6; u++) {
        const ux = cx + (u - 2.5) * 26;
        brush(ux, cy - 8, ux + Math.sin(u * 2.4) * 8, cy - 8 - (36 + (u % 3) * 22) * e, 1.2, 0.8, u * 4.7);
      }
    }
    const rad = e * Math.min(W, H) * 0.45;
    artRegions.push({ x: cx - rad, y: cy - rad * 0.5, w: rad * 2, h: rad });
  }

  /* ---------- 第2幕: 3D破片 ---------- */
  const GRAV = 1400;
  function ballistic(v0y: number, t: number, floorY: number) {
    const y = v0y * t + 0.5 * GRAV * t * t;
    if (y <= floorY) return y;
    const disc = Math.sqrt(v0y * v0y + 2 * GRAV * floorY);
    const tHit = (-v0y + disc) / GRAV;
    const vHit = v0y + GRAV * tHit;
    const t2 = t - tHit;
    const y2 = floorY - vHit * 0.45 * t2 + 0.5 * GRAV * t2 * t2;
    return Math.min(y2, floorY);
  }

  function drawShards3D(p2: number, cx: number, cy: number) {
    const c = ctx!;
    const T = 1.35;
    const t = p2 * T;
    const fade = 1 - seg(p2, 0.72, 1);
    const floorY = H * 0.3;
    c.lineJoin = "round";
    SHARDS.forEach((sh, i) => {
      const bx = sh.vx * t;
      const bz = sh.vz * t;
      const by = ballistic(sh.vy, t, floorY);
      const rx = sh.rx + sh.sx * t;
      const ry = sh.ry + sh.sy * t;
      const flicker = 0.5 + 0.5 * Math.sin(sh.rx + sh.sx * t * 2);
      const fillA = (0.45 + 0.45 * sh.shade * flicker) * fade;
      c.fillStyle = sh.shade > 0.6 ? `rgba(255,255,255,${fillA})` : `rgba(226,226,226,${fillA})`;
      const pjs: { x: number; y: number; s: number }[] = [];
      c.beginPath();
      for (let k = 0; k <= 3; k++) {
        const vtx = sh.tri[k % 3];
        const r = rot3([vtx[0] * sh.size, vtx[1] * sh.size, vtx[2] * sh.size], rx, ry, 0);
        const pp = proj(bx + r[0], by + r[1], bz + r[2], cx, cy);
        if (k < 3) pjs.push(pp);
        k ? c.lineTo(pp.x, pp.y) : c.moveTo(pp.x, pp.y);
      }
      c.closePath();
      c.fill();
      c.strokeStyle = `rgba(255,255,255,${fade})`;
      for (let e2 = 0; e2 < 3; e2++) {
        const q1 = pjs[e2], q2 = pjs[(e2 + 1) % 3];
        brush(q1.x, q1.y, q2.x, q2.y, Math.max(0.8, 1.4 * q1.s), 0.85, i * 5.1 + e2);
      }
      c.strokeStyle = `rgba(0,119,217,${0.5 * fade})`;
      brush(pjs[0].x, pjs[0].y, (pjs[1].x + pjs[2].x) / 2, (pjs[1].y + pjs[2].y) / 2, 0.8, 0.7, i * 7.3);
      if (sh.size > 18) brush(pjs[1].x, pjs[1].y, (pjs[0].x + pjs[2].x) / 2, (pjs[0].y + pjs[2].y) / 2, 0.7, 0.6, i * 7.3 + 1);
    });
    const minWH = Math.min(W, H);
    c.strokeStyle = `rgba(255,255,255,${0.8 * fade})`;
    for (const mc of MICRO) {
      const d = easeOut(p2) * (0.2 + mc.pw * 0.85) * minWH;
      const mx = cx + Math.cos(mc.ang) * d;
      const my = cy + Math.sin(mc.ang) * d * 0.72 + p2 * p2 * H * 0.2;
      const rot = mc.rot + mc.spin * p2;
      brush(mx - (Math.cos(rot) * mc.len) / 2, my - (Math.sin(rot) * mc.len) / 2, mx + (Math.cos(rot) * mc.len) / 2, my + (Math.sin(rot) * mc.len) / 2, 1, 0.7, mc.seed);
    }
    for (const sp of SPARKS) {
      const sy = ballistic(sp.vy, t, floorY);
      const pp2 = proj(sp.vx * t, sy, sp.vz * t, cx, cy);
      c.fillStyle = `rgba(255,255,255,${0.7 * fade})`;
      c.beginPath();
      c.arc(pp2.x, pp2.y, sp.r * pp2.s, 0, Math.PI * 2);
      c.fill();
    }
    if (fade > 0.1) {
      const spread = (0.2 + 0.8 * easeOut(p2)) * Math.min(W, H);
      artRegions.push({ x: cx - spread * 0.9, y: cy - spread * 0.6, w: spread * 1.8, h: spread * 1.1 });
    }
  }

  /* ---------- 第3幕: 降雪 ---------- */
  function drawFlakes(alpha: number) {
    const c = ctx!;
    const gust = (Math.sin(time * 0.00016) + Math.sin(time * 0.00007 + 2)) * 0.5;
    const sy0 = scrollY();
    for (const fl of FLAKES) {
      const drift = Math.sin(time * 0.0008 + fl.sway) * fl.swayAmp + gust * 60 * fl.z;
      const fx = ((((fl.x * W + drift + time * 0.02 * gust * fl.z) % (W + 60)) + W + 60) % (W + 60)) - 30;
      const fy = ((fl.y * H + time * fl.spd * fl.z + sy0 * 0.18 * fl.z) % (H + 40)) - 20;
      const size = 1.5 + fl.z * 4.5;
      const a = alpha * (0.3 + fl.z * 0.55);
      c.save();
      c.translate(fx, fy);
      c.rotate(fl.spin + time * 0.0004 * (fl.z - 0.5));
      c.strokeStyle = `rgba(255,255,255,${a})`;
      c.lineWidth = 1.3;
      c.lineCap = "round";
      if (fl.kind === 2) {
        for (let k = 0; k < 6; k++) {
          const an = (k / 6) * Math.PI * 2;
          const tx = Math.cos(an) * size, ty = Math.sin(an) * size;
          line(0, 0, tx, ty);
          line(tx * 0.55, ty * 0.55, tx * 0.55 + Math.cos(an + 0.9) * size * 0.32, ty * 0.55 + Math.sin(an + 0.9) * size * 0.32);
          line(tx * 0.55, ty * 0.55, tx * 0.55 + Math.cos(an - 0.9) * size * 0.32, ty * 0.55 + Math.sin(an - 0.9) * size * 0.32);
        }
      } else if (fl.kind === 1) {
        for (let k2 = 0; k2 < 3; k2++) {
          const an2 = (k2 / 3) * Math.PI;
          line(-Math.cos(an2) * size, -Math.sin(an2) * size, Math.cos(an2) * size, Math.sin(an2) * size);
        }
      } else {
        c.beginPath();
        c.arc(0, 0, size * 0.38, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
  }

  /* ---------- 積雪 ---------- */
  function snowTopAt(x: number, growth: number) {
    const base = H - H * 0.1 * growth;
    return base - Math.sin(x * 0.008) * 8 * growth - Math.sin(x * 0.021 + 2) * 5 * growth;
  }
  function drawSnowGround(growth: number) {
    const c = ctx!;
    if (growth <= 0) return;
    c.fillStyle = "rgba(255,255,255,0.35)";
    c.beginPath();
    c.moveTo(0, H);
    for (let x0 = 0; x0 <= W; x0 += 16) c.lineTo(x0, snowTopAt(x0, growth) - 18 * growth - Math.sin(x0 * 0.013 + 4) * 7 * growth);
    c.lineTo(W, H);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.beginPath();
    c.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) c.lineTo(x, snowTopAt(x, growth));
    c.lineTo(W, H);
    c.closePath();
    c.fill();
    const top = H - H * 0.1 * growth - 26 * growth;
    artRegions.push({ x: 0, y: top, w: W, h: H - top });
  }

  /* ---------- 第4幕: 轍＋トラック（アンビエント） ---------- */
  function drawRuts(growth: number, t: number) {
    const c = ctx!;
    if (t <= 0 || growth <= 0) return;
    const midY = H - H * 0.052 * growth;
    const amp = H * 0.02;
    const headX = ambient ? W * 0.86 : easeOut(t) * (W + 120) - 60;
    const rutY = (x: number, off: number) => midY + Math.sin(x * 0.004 + off) * amp;
    c.save();
    c.strokeStyle = "rgba(0,155,253,0.75)";
    c.lineWidth = 3;
    c.lineCap = "round";
    [-9, 9].forEach((gap) => {
      c.beginPath();
      for (let x = 0; x <= Math.min(headX, W); x += 12) {
        const y = rutY(x, 0) + gap;
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    });
    c.strokeStyle = "rgba(0,119,217,0.55)";
    c.lineWidth = 2;
    for (let x2 = 10; x2 < Math.min(headX, W); x2 += 26) {
      [-9, 9].forEach((gap) => {
        const y2 = rutY(x2, 0) + gap;
        line(x2 - 4, y2 - 3, x2 + 4, y2 + 3);
      });
    }
    if (headX > -40 && headX < W + 60) {
      const bounce = Math.sin(time * 0.02) * 1.6;
      const ty = rutY(Math.max(0, Math.min(headX, W)), 0) - 14 + bounce;
      drawTruck(headX, ty, 1, 1);
    }
    c.restore();
  }

  function drawTruck(x: number, y: number, s: number, dir: number) {
    const c = ctx!;
    for (let e = 0; e < 3; e++) {
      const et = (time * 0.0012 + e * 0.33) % 1;
      const ex = x - dir * (44 + et * 46) * s;
      const ea = (1 - et) * 0.4;
      c.strokeStyle = `rgba(255,255,255,${ea})`;
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(ex, y - (6 + et * 16) * s, (3 + et * 7) * s, 0, Math.PI * 2);
      c.stroke();
    }
    c.save();
    c.translate(x, y);
    c.scale(dir * s, s);
    c.lineJoin = "round";
    c.lineCap = "round";
    c.strokeStyle = "rgba(0,119,217,0.95)";
    c.lineWidth = 2;
    c.strokeRect(-32, -30, 13, 12);
    line(-32, -24, -19, -24);
    line(-25.5, -30, -25.5, -18);
    c.beginPath();
    c.arc(-12, -23, 4.5, 0, Math.PI * 2);
    c.stroke();
    line(-12, -27.5, -11, -30.5);
    c.beginPath();
    c.moveTo(-11, -30.5);
    c.quadraticCurveTo(-8, -32, -7.5, -29.5);
    c.stroke();
    c.beginPath();
    c.arc(-2.5, -22, 3.8, 0, Math.PI * 2);
    c.stroke();
    line(-2.5, -25.8, -2.5, -27.3);
    c.beginPath();
    c.moveTo(1, -27);
    c.quadraticCurveTo(6, -32, 10, -28);
    c.stroke();
    c.strokeStyle = "#D8454F";
    c.lineWidth = 2.5;
    c.strokeRect(-34, -18, 40, 20);
    c.beginPath();
    c.moveTo(6, 2);
    c.lineTo(6, -12);
    c.quadraticCurveTo(6, -14, 8, -14);
    c.lineTo(20, -14);
    c.quadraticCurveTo(24, -14, 26, -10);
    c.lineTo(30, -2);
    c.quadraticCurveTo(31, 2, 28, 2);
    c.closePath();
    c.stroke();
    const wob = time * 0.03;
    [[-22, 4], [18, 4]].forEach((wpos) => {
      c.beginPath();
      c.arc(wpos[0], wpos[1], 5, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(wpos[0] + Math.cos(wob) * 5, wpos[1] + Math.sin(wob) * 5);
      c.lineTo(wpos[0] - Math.cos(wob) * 5, wpos[1] - Math.sin(wob) * 5);
      c.stroke();
    });
    c.restore();
  }

  const LANES = [
    { yf: 0.56, amp: 14, f: 0.005, ph: 1.2, speed: 0.085, dir: 1, s: 0.6, off: 120 },
    { yf: 0.74, amp: 24, f: 0.0038, ph: 3.5, speed: 0.12, dir: -1, s: 0.8, off: 560 },
    { yf: 0.9, amp: 18, f: 0.0032, ph: 5.1, speed: 0.16, dir: 1, s: 1, off: 980 },
  ];
  function drawLandTrucks() {
    const c = ctx!;
    if (landHorizon === null) return;
    LANES.forEach((lane, li) => {
      const baseY = H * lane.yf;
      if (baseY - lane.amp < landHorizon! + 44) return;
      const laneAt = (x: number) => baseY + Math.sin(x * lane.f + lane.ph) * lane.amp + Math.sin(x * lane.f * 2.7 + lane.ph) * lane.amp * 0.35;
      c.strokeStyle = "rgba(95,164,99,0.7)";
      c.lineWidth = 2.5 * lane.s;
      c.lineCap = "round";
      [-7 * lane.s, 7 * lane.s].forEach((gap) => {
        c.beginPath();
        for (let x = 0; x <= W; x += 14) {
          const y = laneAt(x) + gap;
          x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.stroke();
      });
      c.lineWidth = 1.6 * lane.s;
      c.strokeStyle = "rgba(95,164,99,0.5)";
      for (let tx2 = 10; tx2 < W; tx2 += 30) {
        [-7 * lane.s, 7 * lane.s].forEach((gap) => {
          const y2 = laneAt(tx2) + gap;
          line(tx2 - 4 * lane.s, y2 - 3 * lane.s, tx2 + 4 * lane.s, y2 + 3 * lane.s);
        });
      }
      const span = W + 260;
      const prog = (time * lane.speed + lane.off) % span;
      const tx = lane.dir === 1 ? prog - 130 : W + 130 - prog;
      const ty = laneAt(Math.max(0, Math.min(tx, W))) - 12 * lane.s + Math.sin(time * 0.02 + li * 2) * 1.6;
      drawTruck(tx, ty, lane.s, lane.dir);
    });
  }

  /* ---------- 陸の人々（アンビエント） ---------- */
  const WALKERS = [
    { fx0: 0.15, dir: 1, speed: 0.026, off: 70, s: 1 },
    { fx0: 0.62, dir: -1, speed: 0.02, off: 150, s: 0.85 },
    { fx0: 0.4, dir: 1, speed: 0.032, off: 230, s: 1.1 },
  ];
  const FARMERS = [
    { fx: 0.24, off: 190, s: 1, ph: 0 },
    { fx: 0.8, off: 110, s: 0.85, ph: 2.2 },
  ];
  function drawPeople(horizon: number) {
    const c = ctx!;
    c.lineCap = "round";
    c.lineJoin = "round";
    WALKERS.forEach((wk, wI) => {
      const span = W + 60;
      const x = ((((wk.fx0 * W + time * wk.speed * wk.dir) % span) + span) % span) - 30;
      const y = horizon + wk.off;
      if (y > H + 20) return;
      const s = wk.s;
      const gait = Math.sin(time * 0.009 + wI * 2);
      c.strokeStyle = "#1F2430";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y - 24 * s, 4.5 * s, 0, Math.PI * 2);
      c.stroke();
      line(x, y - 19 * s, x, y - 9 * s);
      line(x, y - 16 * s, x + gait * 6 * s, y - 9 * s);
      line(x, y - 16 * s, x - gait * 6 * s, y - 9 * s);
      line(x, y - 9 * s, x + gait * 5.5 * s, y);
      line(x, y - 9 * s, x - gait * 5.5 * s, y);
    });
    for (const fm of FARMERS) {
      const fx3 = fm.fx * W;
      const fy3 = horizon + fm.off;
      if (fy3 > H + 20) continue;
      const fs = fm.s;
      const swing = (Math.sin(time * 0.005 + fm.ph) + 1) / 2;
      c.strokeStyle = "#1F2430";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(fx3 + 3 * fs, fy3 - 22 * fs, 4.5 * fs, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(fx3 + 1 * fs, fy3 - 18 * fs);
      c.quadraticCurveTo(fx3 - 3 * fs, fy3 - 12 * fs, fx3 - 2 * fs, fy3 - 7 * fs);
      c.stroke();
      line(fx3 - 2 * fs, fy3 - 7 * fs, fx3 - 6 * fs, fy3);
      line(fx3 - 2 * fs, fy3 - 7 * fs, fx3 + 3 * fs, fy3);
      const hx = fx3 + (8 + swing * 6) * fs;
      const hy = fy3 - (16 - swing * 13) * fs;
      line(fx3 + 1 * fs, fy3 - 15 * fs, hx, hy);
      c.strokeStyle = "#5FA463";
      c.lineWidth = 2.2;
      line(hx, hy, hx + 6 * fs, hy + (4 + swing * 3) * fs);
      line(hx + 6 * fs, hy + (4 + swing * 3) * fs, hx + 10 * fs, hy + (2 + swing * 3) * fs);
      c.strokeStyle = "rgba(95,164,99,0.8)";
      c.lineWidth = 2;
      for (let sI = 0; sI < 4; sI++) line(fx3 + (10 + sI * 7) * fs, fy3 + 2, fx3 + (13 + sI * 7) * fs, fy3 + 2);
    }
  }

  /* ---------- 背景線画と重なるテキストの退避窓 ---------- */
  let artEls: HTMLElement[] = [];
  // 要素ごとの「重なり判定が連続した回数」。閾値を超えたときだけ状態を切り替える（明滅防止）
  const overCount = new WeakMap<HTMLElement, number>();
  const HYST = 4;
  /* 氷（多面体）が重なった箇所だけ文字色を Ink に切り替える対象
     （ヒーロー・②は退避窓を出さない代わりに、この色替えで可読性を守る） */
  let iceEls: HTMLElement[] = [];
  function rescan() {
    artEls.forEach((el) => el.classList.remove("art-aware", "is-over-art"));
    iceEls.forEach((el) => el.classList.remove("ice-aware", "is-over-ice"));
    iceEls = landMode
      ? []
      : Array.from(root.querySelectorAll<HTMLElement>(".hero__sub, .hero__body, #business p, #business .section__title")).filter(
          (el) => !el.querySelector(".outline-text"),
        );
    iceEls.forEach((el) => el.classList.add("ice-aware"));
    // 退避窓（背景線画と重なった文字に半透明の座布団と枠を出す .is-over-art）は、スクロール中に
    // 一時的に不自然な枠が入るとの指摘で採用ページ全体で廃止した（2026-09-09 ユーザー指示）。
    // 対象要素を集めないことで applyOverlaps は何もしない
    artEls = [];
  }
  rescan();

  function rectsOverlapRatio(r: DOMRect, region: Region) {
    const x = Math.max(r.left, region.x);
    const y = Math.max(r.top, region.y);
    const x2 = Math.min(r.right, region.x + region.w);
    const y2 = Math.min(r.bottom, region.y + region.h);
    if (x2 <= x || y2 <= y) return 0;
    const area = (r.right - r.left) * (r.bottom - r.top);
    return area > 0 ? ((x2 - x) * (y2 - y)) / area : 0;
  }
  function applyIceSwap(region: Region | null, viewH: number) {
    for (const el of iceEls) {
      if (!region) {
        el.classList.remove("is-over-ice");
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > viewH || r.width === 0) {
        el.classList.remove("is-over-ice");
        continue;
      }
      el.classList.toggle("is-over-ice", rectsOverlapRatio(r, region) > 0.08);
    }
  }
  function applyOverlaps(regions: Region[], viewH: number) {
    for (const el of artEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > viewH || r.width === 0) {
        el.classList.remove("is-over-art");
        overCount.set(el, 0);
        continue;
      }
      let over = false;
      for (const rg of regions) {
        if (rectsOverlapRatio(r, rg) > 0.12) {
          over = true;
          break;
        }
      }
      const cur = el.classList.contains("is-over-art");
      if (over === cur) {
        overCount.set(el, 0);
        continue;
      }
      const n = (overCount.get(el) ?? 0) + 1;
      if (n >= HYST) {
        el.classList.toggle("is-over-art", over);
        overCount.set(el, 0);
      } else {
        overCount.set(el, n);
      }
    }
  }

  /* ---------- オープニング ---------- */
  function finishIntroBuild() {
    if (!introBuild) return;
    introBuild = null;
    handoffAt = performance.now() - 2000;
    opts.onIntroDone?.();
  }
  if (opts.intro && !ambient && !landMode) {
    introBuild = { start: performance.now() + INTRO_PRE };
  } else {
    handoffAt = performance.now();
  }
  /* 保険（描画が止まっていても本編へ進める） */
  const introGuard = window.setTimeout(finishIntroBuild, INTRO_PRE + 20 * INTRO_STEP + INTRO_TAIL + 500);

  /* ---------- メインループ ---------- */
  function draw() {
    if (stopped) return;
    const c = ctx!;
    time = performance.now();
    frame++;
    target = progress();
    smooth += (target - smooth) * 0.08;
    const p = ambient ? 1 : smooth;
    c.clearRect(0, 0, W, H);
    artRegions = [];
    gemRegion = null;

    /* 職種詳細・記事（land）: 全面陸地（空は上端1割のみ）・雪なし。トラックと人だけが動く */
    if (landMode) {
      landHorizon = H * 0.1;
      paintLandAt(landHorizon);
      drawLandTrucks();
      drawPeople(landHorizon);
      raf = requestAnimationFrame(draw);
      return;
    }

    const cx = W / 2, cy = H * 0.46;

    if (introBuild) {
      const bt = time - introBuild.start;
      if (bt >= 20 * INTRO_STEP + INTRO_TAIL) {
        finishIntroBuild();
      } else {
        if (bt > 0) {
          const bCount = Math.min(20, Math.floor(bt / INTRO_STEP) + 1);
          const bFlash = Math.max(0, 1 - (bt - (bCount - 1) * INTRO_STEP) / 240);
          const bRot = time * 0.00045;
          const bAn = gemAnchor(cx, cy);
          const settle = clamp01((bt - 20 * INTRO_STEP) / 300);
          renderGem(cx, cy, bAn.x, bAn.y + Math.sin(time * 0.0016) * 9 * settle, 220, bRot, bRot * 1.4, Math.sin(time * 0.0003) * 0.25, 1, { count: bCount, flash: bFlash });
        }
        drawFlakes(0.3);
        raf = requestAnimationFrame(draw);
        return;
      }
    }

    if (ambient) {
      landHorizon = H * 0.52;
      paintLandAt(landHorizon);
      artRegions.push({ x: 0, y: landHorizon, w: W, h: H - landHorizon });
      drawLandTrucks();
      drawPeople(landHorizon);
    } else {
      drawLand();
      drawLandTrucks();
    }

    if (!ambient) {
      const p1 = seg(p, 0, 0.2);
      if (p1 <= 0.001) drawGemIntro(cx, cy);
      else if (p1 < 1) drawCube3D(p1, cx, cy);
      drawImpact(p, cx, cy);
      const p2 = seg(p, 0.2, 0.46);
      if (p2 > 0 && p2 < 1) drawShards3D(p2, cx, cy);
    }

    const snowAlpha = ambient ? 1 : seg(p, 0.3, 0.5);
    if (snowAlpha > 0) drawFlakes(snowAlpha);
    const growth = ambient ? 1 : easeOut(seg(p, 0.42, 0.75));
    drawSnowGround(growth);
    if (ambient) drawRuts(growth, 1);

    // ※ 元デザインの「衝突時の白ストロボ点滅」はここにあったが、チカチカするため廃止（2026-09）

    if (frame % 3 === 0) {
      applyOverlaps(artRegions, H);
      applyIceSwap(gemRegion, H);
    }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);

  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(introGuard);
      window.removeEventListener("resize", resize);
      artEls.forEach((el) => el.classList.remove("art-aware", "is-over-art"));
      iceEls.forEach((el) => el.classList.remove("ice-aware", "is-over-ice"));
    },
    skipIntro() {
      finishIntroBuild();
    },
    rescan,
  };
}
