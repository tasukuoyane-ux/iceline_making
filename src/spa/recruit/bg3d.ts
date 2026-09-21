// 採用サイトの WebGL 3D背景（デザイン支給 result/iceline-saiyo/site/assets/js/bg3d.js の移植）。
// スクロール連動：氷の海 → 氷がはじける → グレーの地形が隆起 → 白い箱トラックの車列。
// three.js r128 は cdnjs から実行時に読み込む（グローバル THREE）。読み込めない・WebGL 不可・
// モーション低減時は何もしない（SVG の海が表示されたまま）。
// SPA では採用ページ間の遷移でこの背景を再生成せず、RecruitLayout がマウントしている間ずっと動かす。
// ページ遷移のズーム（leave / arrive）は返り値の API で行う。
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const THREE: any;

const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
export const RECRUIT_TRUCK_LOGO = "/images/recruit/logo.png";

let threePromise: Promise<boolean> | null = null;
function loadThree(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).THREE) return Promise.resolve(true);
  if (threePromise) return threePromise;
  threePromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = THREE_SRC;
    s.async = true;
    s.onload = () => resolve(!!(window as any).THREE);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return threePromise;
}

export interface Bg3dHandle {
  /** クリック→景色へダイブ（ズームイン）。done は頂点で呼ばれる */
  leave: (done: () => void) => void;
  /** 着地：ズームインした状態から引いて始める（ページ遷移直後に呼ぶ） */
  arrive: () => void;
  stop: () => void;
}

/** 起動できたら handle を返す（できなければ null）。has-3d クラスは呼び出し側（RecruitLayout）が state で付ける */
export async function mountBg3d(canvas: HTMLCanvasElement, root: HTMLElement): Promise<Bg3dHandle | null> {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return null;
  const ok = await loadThree();
  if (!ok || !canvas.isConnected) return null;

  let renderer: any;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const C = {
    sea: 0x009dfa,
    seaDeep: 0x0073c7,
    ice: 0xeaf6ff,
    terrain: 0xe6e4e0,
    white: 0xe9eef2, // トラックの車体: 大気の青に寄せたオフホワイト（背景に溶かす。2026-09-21 支給更新）
    ink: 0x5c6b77, // シャシー・車輪: コントラストを弱める
    bumper: 0xc9cfd4,
    shadow: 0x66bdf2,
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C.sea, 70, 190);
  const BASE_FOV = 26,
    BASE_Z = 82;
  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 400);
  camera.position.set(0, 15, BASE_Z);
  camera.lookAt(0, 3.5, -6);

  let trans: { mode: "arrive" | "leave" | "idle"; t0: number; dur: number; done: (() => void) | null } = { mode: "arrive", t0: performance.now(), dur: 950, done: null };
  const easeInCubic = (t: number) => t * t * t;
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const gradData = new Uint8Array([110, 190, 255]);
  const gradientMap = new THREE.DataTexture(gradData, 3, 1, THREE.LuminanceFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;
  function toonMat(color: number, opts?: { transparent?: boolean; opacity?: number }) {
    const m = new THREE.MeshToonMaterial({ color, gradientMap });
    if (opts && opts.transparent) {
      m.transparent = true;
      m.opacity = opts.opacity != null ? opts.opacity : 1;
    }
    return m;
  }
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.55);
  sun.position.set(18, 30, 20);
  scene.add(sun);

  const smoothstep = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  const shadowGeo = new THREE.CircleGeometry(1, 20);
  shadowGeo.rotateX(-Math.PI / 2);
  function makeShadow(sx: number, sz: number, opacity: number) {
    const s = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: C.shadow, transparent: true, opacity: opacity || 0.5, depthWrite: false }));
    s.scale.set(sx, 1, sz);
    return s;
  }

  /* 地形 */
  const TER_W = 220,
    TER_D = 90,
    SEG_X = 72,
    SEG_Z = 30;
  const terGeo = new THREE.PlaneGeometry(TER_W, TER_D, SEG_X, SEG_Z);
  terGeo.rotateX(-Math.PI / 2);
  const terrain = new THREE.Mesh(terGeo, toonMat(C.terrain));
  terrain.position.set(0, 0, -8);
  scene.add(terrain);
  function targetH(x: number, z: number) {
    const h = 1.7 * Math.sin(x * 0.09 + 1.3) + 1.3 * Math.cos(z * 0.16 - 0.7) + 0.9 * Math.sin((x * 0.5 + z) * 0.07) + 1.5 * Math.sin(x * 0.023 + z * 0.041 + 2.0);
    return Math.max(0.4, h) * 1.05;
  }
  const seaMesh = new THREE.Mesh(new THREE.PlaneGeometry(700, 500), new THREE.MeshBasicMaterial({ color: C.sea }));
  seaMesh.rotateX(-Math.PI / 2);
  seaMesh.position.y = 0.02;
  scene.add(seaMesh);

  function makeRidge(colorHex: number, height: number, z: number, seed: number) {
    const shape = new THREE.Shape();
    shape.moveTo(-240, -2);
    for (let rx = -240; rx <= 240; rx += 8) {
      const ry = height * (0.55 + 0.45 * Math.sin(rx * 0.018 + seed)) * (0.72 + 0.28 * Math.sin(rx * 0.043 + seed * 2.3));
      shape.lineTo(rx, Math.max(0.5, ry));
    }
    shape.lineTo(240, -2);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: colorHex, fog: false }));
    mesh.position.set(0, 0, z);
    scene.add(mesh);
    return mesh;
  }
  makeRidge(0x35baff, 14, -64, 1.7);
  makeRidge(0x0073c7, 8.5, -57, 4.2);

  const pos = terGeo.attributes.position;
  const vCount = pos.count;
  const vTarget = new Float32Array(vCount);
  const vThresh = new Float32Array(vCount);
  const maxDist = Math.sqrt(110 * 110 + 45 * 45);
  for (let i = 0; i < vCount; i++) {
    const vx = pos.getX(i),
      vz = pos.getZ(i);
    vTarget[i] = targetH(vx, vz);
    const d = Math.sqrt(vx * vx + vz * vz) / maxDist;
    vThresh[i] = 0.1 + d * 0.5 + ((((Math.sin(vx * 12.9898 + vz * 78.233) * 43758.5453) % 1) + 1) % 1) * 0.08;
    pos.setY(i, -2.2);
  }
  function terrainReveal(x: number, z: number, p: number) {
    const d = Math.sqrt(x * x + z * z) / maxDist;
    return smoothstep(0.1 + d * 0.5, 0.28 + d * 0.5, p);
  }
  function terrainYAt(x: number, z: number, p: number) {
    return -2.2 + (targetH(x, z) + 2.2) * terrainReveal(x, z, p);
  }

  /* 氷塊 */
  type Chunk = { mesh: any; shadow: any; baseY: number; baseS: number; phase: number; burstAt: number; state: number; t0: number };
  const iceChunks: Chunk[] = [];
  const NUM_ICE = 42;
  const icePlaced: { x: number; z: number; s: number }[] = [];
  for (let c = 0; c < NUM_ICE; c++) {
    const g = new THREE.IcosahedronGeometry(1, 0);
    const gp = g.attributes.position;
    for (let vi = 0; vi < gp.count; vi++) {
      gp.setXYZ(vi, gp.getX(vi) * rand(0.86, 1.16), gp.getY(vi) * rand(0.72, 1.1), gp.getZ(vi) * rand(0.86, 1.16));
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, toonMat(C.ice, { transparent: true, opacity: 1 }));
    let cx = 0,
      cz = 0,
      s = 1,
      tries = 0,
      okPos = true;
    do {
      cx = (Math.random() < 0.5 ? -1 : 1) * rand(26, 85);
      cz = rand(-38, 16);
      s = rand(1.2, 3.4);
      okPos = true;
      for (const p of icePlaced) {
        const dx2 = p.x - cx,
          dz2 = p.z - cz;
        if (Math.sqrt(dx2 * dx2 + dz2 * dz2) < (p.s + s) * 1.6) {
          okPos = false;
          break;
        }
      }
    } while (!okPos && ++tries < 50);
    icePlaced.push({ x: cx, z: cz, s });
    m.scale.setScalar(s);
    m.position.set(cx, rand(1.2, 5.5), cz);
    m.rotation.y = rand(0, 3);
    const dd = Math.sqrt(cx * cx + cz * cz) / maxDist;
    scene.add(m);
    const sh = makeShadow(s * 1.15, s * 0.7, 0.4);
    sh.position.set(cx, 0.06, cz);
    scene.add(sh);
    iceChunks.push({ mesh: m, shadow: sh, baseY: m.position.y, baseS: s, phase: rand(0, Math.PI * 2), burstAt: Math.max(0.05, 0.06 + dd * 0.5 + rand(-0.03, 0.05)), state: 0, t0: 0 });
  }
  const shardGeo = new THREE.TetrahedronGeometry(0.5, 0);
  const shards: { mesh: any; vel: any; rot: any; life: number }[] = [];
  function spawnShards(p3: any, scale: number) {
    for (let k = 0; k < 10; k++) {
      const sm = new THREE.Mesh(shardGeo, toonMat(C.ice, { transparent: true, opacity: 1 }));
      sm.scale.setScalar(rand(0.4, 1.0) * scale * 0.5);
      sm.position.copy(p3);
      scene.add(sm);
      shards.push({ mesh: sm, vel: new THREE.Vector3(rand(-7, 7), rand(4, 11), rand(-7, 7)), rot: new THREE.Vector3(rand(-5, 5), rand(-5, 5), rand(-5, 5)), life: 0 });
    }
  }

  /* 荷台ロゴ（支給ロゴを段階リサンプリングで高解像度化） */
  function makeLogoTexture() {
    const cv = document.createElement("canvas");
    cv.width = 1144;
    cv.height = 560;
    const ctx = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.premultiplyAlpha = true; // 透過 PNG をそのまま貼る（プレートを作らない。2026-09-21 支給更新）
    const img = new Image();
    img.onload = () => {
      let src: HTMLImageElement | HTMLCanvasElement = img,
        w = img.naturalWidth,
        h = img.naturalHeight;
      while (w * 2 <= cv.width * 0.92) {
        const step = document.createElement("canvas");
        step.width = w * 2;
        step.height = h * 2;
        const sctx = step.getContext("2d")!;
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = "high";
        sctx.drawImage(src, 0, 0, step.width, step.height);
        src = step;
        w *= 2;
        h *= 2;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, cv.width, cv.height);
      const dw = cv.width * 0.92;
      const dh = (dw * img.naturalHeight) / img.naturalWidth;
      ctx.drawImage(src, (cv.width - dw) / 2, (cv.height - dh) / 2, dw, dh);
      tex.needsUpdate = true;
    };
    img.src = RECRUIT_TRUCK_LOGO;
    return tex;
  }
  // 透過 PNG の背景は車体の白が透ける。color で大気色に少し沈め、遠景として浮かないようにする
  const logoMat = new THREE.MeshBasicMaterial({ map: makeLogoTexture(), transparent: true, color: 0xd8e2ea });

  /* 白い箱トラック */
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.42, 18);
  wheelGeo.rotateX(Math.PI / 2);
  function roundedBoxGeo(w: number, h: number, d: number, r: number) {
    r = Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01);
    const hw = w / 2 - r,
      hh = h / 2 - r;
    const shape = new THREE.Shape();
    shape.absarc(hw, hh, r, 0, Math.PI / 2, false);
    shape.absarc(-hw, hh, r, Math.PI / 2, Math.PI, false);
    shape.absarc(-hw, -hh, r, Math.PI, Math.PI * 1.5, false);
    shape.absarc(hw, -hh, r, Math.PI * 1.5, Math.PI * 2, false);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelOffset: -0.005, bevelSegments: 4, curveSegments: 6 });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }
  const chassisGeo = roundedBoxGeo(7.0, 0.45, 2.4, 0.14);
  const boxBodyGeo = roundedBoxGeo(4.7, 2.7, 2.6, 0.24);
  const roofGeo = roundedBoxGeo(4.8, 0.16, 2.7, 0.07);
  const cabGeo = roundedBoxGeo(1.9, 1.85, 2.3, 0.3);
  const glassGeo = roundedBoxGeo(0.14, 0.72, 2.0, 0.06);
  const bumperGeo = roundedBoxGeo(0.34, 0.5, 2.34, 0.15);
  function makeBoxTruck() {
    const g = new THREE.Group();
    const chassis = new THREE.Mesh(chassisGeo, toonMat(C.ink));
    chassis.position.y = 0.95;
    g.add(chassis);
    const box = new THREE.Mesh(boxBodyGeo, toonMat(C.white));
    box.position.set(-1.15, 2.55, 0);
    g.add(box);
    const roof = new THREE.Mesh(roofGeo, toonMat(C.bumper));
    roof.position.set(-1.15, 3.96, 0);
    g.add(roof);
    const logoGeo = new THREE.PlaneGeometry(3.3, 1.65);
    const logoR = new THREE.Mesh(logoGeo, logoMat);
    logoR.position.set(-1.15, 2.55, 1.315);
    g.add(logoR);
    const logoL = new THREE.Mesh(logoGeo, logoMat);
    logoL.position.set(-1.15, 2.55, -1.315);
    logoL.rotation.y = Math.PI;
    g.add(logoL);
    const cab = new THREE.Mesh(cabGeo, toonMat(C.white));
    cab.position.set(2.35, 1.98, 0);
    g.add(cab);
    const glass = new THREE.Mesh(glassGeo, toonMat(C.ink));
    glass.position.set(3.28, 2.42, 0);
    g.add(glass);
    const bumper = new THREE.Mesh(bumperGeo, toonMat(C.bumper));
    bumper.position.set(3.32, 1.12, 0);
    g.add(bumper);
    [2.5, -2.2].forEach((wx) => {
      const wl = new THREE.Mesh(wheelGeo, toonMat(C.ink));
      wl.position.set(wx, 0.5, 1.0);
      g.add(wl);
      const wr = wl.clone();
      wr.position.z = -1.0;
      g.add(wr);
    });
    const sh = makeShadow(4.6, 1.8, 0.45);
    sh.position.y = 0.08;
    g.add(sh);
    return g;
  }
  const trucks = [
    // レーンを奥へ下げ、縮小＋フォグで「遠景の車列」として溶け込ませる（2026-09-21 支給更新）
    { lane: -2, speed: 11, dir: 1, appearAt: 0.35, x: 0, group: null as any },
    { lane: -10, speed: 9, dir: -1, appearAt: 0.5, x: 0, group: null as any },
    { lane: -17, speed: 13, dir: 1, appearAt: 0.65, x: 0, group: null as any },
  ].map((t, idx) => {
    const g = makeBoxTruck();
    g.scale.setScalar(0.82);
    if (t.dir < 0) g.rotation.y = Math.PI;
    g.visible = false;
    t.x = -t.dir * (90 + idx * 40);
    g.position.x = t.x;
    scene.add(g);
    t.group = g;
    return t;
  });

  /* 進行度・リサイズ・ループ */
  let progress = 0,
    shown = 0;
  function readProgress() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress = Math.min(1, window.scrollY / max);
  }
  window.addEventListener("scroll", readProgress, { passive: true });
  readProgress();
  function resize() {
    const w = window.innerWidth,
      h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  let lastTerrainP = -1;
  let raf = 0;
  let stopped = false;
  function tick() {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const diff = progress - shown;
    shown += diff * (0.06 + 0.12 * Math.min(1, Math.abs(diff) * 2.5));
    if (Math.abs(shown - lastTerrainP) > 0.0005) {
      lastTerrainP = shown;
      for (let i = 0; i < vCount; i++) {
        const k = smoothstep(vThresh[i], vThresh[i] + 0.18, shown);
        pos.setY(i, -2.2 + (vTarget[i] + 2.2) * k);
      }
      pos.needsUpdate = true;
      terGeo.computeVertexNormals();
    }
    for (const ch of iceChunks) {
      if (ch.state === 0) {
        ch.mesh.position.y = ch.baseY + Math.sin(time * 1.1 + ch.phase) * 0.5;
        ch.mesh.rotation.y += dt * 0.15;
        const bobK = 1 - (ch.mesh.position.y - ch.baseY) * 0.08;
        ch.shadow.scale.set(ch.baseS * 1.15 * bobK, 1, ch.baseS * 0.7 * bobK);
        if (shown > ch.burstAt) {
          ch.state = 1;
          ch.t0 = time;
          spawnShards(ch.mesh.position, ch.baseS);
        }
      } else if (ch.state === 1) {
        const q = (time - ch.t0) / 0.4;
        if (q >= 1) {
          ch.state = 2;
          ch.mesh.visible = false;
          ch.shadow.visible = false;
        } else {
          const sc = ch.baseS * (1 + 0.5 * Math.sin(Math.PI * Math.min(q * 2, 1))) * (1 - smoothstep(0.3, 1, q));
          ch.mesh.scale.setScalar(Math.max(0.001, sc));
          ch.mesh.material.opacity = 1 - q;
          ch.shadow.material.opacity = 0.4 * (1 - q);
        }
      } else if (ch.state === 2) {
        if (shown < ch.burstAt - 0.04) {
          ch.state = 3;
          ch.t0 = time;
          ch.mesh.visible = true;
          ch.shadow.visible = true;
          ch.mesh.position.y = ch.baseY;
        }
      } else if (ch.state === 3) {
        const qr = (time - ch.t0) / 0.45;
        if (qr >= 1) {
          ch.state = 0;
          ch.mesh.scale.setScalar(ch.baseS);
          ch.mesh.material.opacity = 1;
          ch.shadow.material.opacity = 0.4;
        } else {
          const er = 1 - Math.pow(1 - qr, 3);
          ch.mesh.scale.setScalar(Math.max(0.001, ch.baseS * er));
          ch.mesh.material.opacity = er;
          ch.shadow.material.opacity = 0.4 * er;
        }
      }
    }
    for (let si = shards.length - 1; si >= 0; si--) {
      const sh = shards[si];
      sh.life += dt;
      sh.vel.y -= 14 * dt;
      sh.mesh.position.addScaledVector(sh.vel, dt);
      sh.mesh.rotation.x += sh.rot.x * dt;
      sh.mesh.rotation.y += sh.rot.y * dt;
      sh.mesh.material.opacity = Math.max(0, 1 - sh.life / 1.1);
      if (sh.life > 1.1) {
        scene.remove(sh.mesh);
        sh.mesh.material.dispose();
        shards.splice(si, 1);
      }
    }
    trucks.forEach((tr, ti) => {
      const active = shown > tr.appearAt;
      if (active && !tr.group.visible) {
        tr.group.visible = true;
        tr.x = -tr.dir * 100;
      }
      if (tr.group.visible) {
        const boost = active ? 1 : 2.4;
        tr.x += tr.dir * tr.speed * boost * dt;
        if (tr.dir > 0 && tr.x > 110) {
          if (active) tr.x = -110;
          else {
            tr.group.visible = false;
            return;
          }
        }
        if (tr.dir < 0 && tr.x < -110) {
          if (active) tr.x = 110;
          else {
            tr.group.visible = false;
            return;
          }
        }
        const gy = terrainYAt(tr.x, tr.lane - 8, shown);
        tr.group.position.set(tr.x, Math.max(gy, 0) + 0.05 + Math.sin(time * 9 + ti) * 0.04, tr.lane);
        tr.group.rotation.z = Math.sin(time * 7 + ti * 2) * 0.012;
      }
    });
    let zoomK = 0;
    if (trans.mode === "arrive") {
      const qa = Math.min((performance.now() - trans.t0) / trans.dur, 1);
      zoomK = 1 - easeOutCubic(qa);
      if (qa >= 1) trans.mode = "idle";
    } else if (trans.mode === "leave") {
      const ql = Math.min((performance.now() - trans.t0) / trans.dur, 1);
      zoomK = easeInCubic(ql);
      if (ql >= 1 && trans.done) {
        const cb = trans.done;
        trans.done = null;
        cb();
      }
    }
    camera.position.y = 15 - shown * 3 - zoomK * 5;
    camera.position.x = Math.sin(time * 0.06) * 0.8;
    camera.position.z = BASE_Z - zoomK * 48;
    camera.fov = BASE_FOV - zoomK * 11;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 3.5 - shown * 1.5, -6);
    renderer.render(scene, camera);
  }
  tick();

  return {
    leave(done) {
      if (trans.mode === "leave") return;
      trans = { mode: "leave", t0: performance.now(), dur: 720, done };
    },
    arrive() {
      readProgress();
      trans = { mode: "arrive", t0: performance.now(), dur: 950, done: null };
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", readProgress);
      window.removeEventListener("resize", resize);
      try {
        renderer.dispose();
      } catch {
        /* noop */
      }
    },
  };
}
