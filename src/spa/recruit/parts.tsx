// 採用ページの小さな部品（あしらい線画・アイコン・縁取り文字・波線マーカーなど）。
// SVG はデザイン支給 index.html のものをそのまま React 化している。
import { Fragment, ReactNode } from "react";
import { splitColorTokens } from "../lib/richText";

/** あしらい（スパークル・波線・氷キャラ等）。style で位置を指定して置く */
export function Doodle({ kind, style }: { kind: "gem" | "shaved" | "sparkle" | "wave" | "drips" | "dots" | "circle" | "wave-sm" | "sparkle-sm"; style?: React.CSSProperties }) {
  let svg: ReactNode = null;
  switch (kind) {
    case "gem":
      svg = (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 20l14-9 18 5 4 20-12 14-18-5z" fill="rgba(255,255,255,0.14)" />
          <path d="M28 11l3 15-17-6M31 26l19-10M31 26l5 24" />
          <circle cx="22" cy="34" r="1.6" fill="#FFFFFF" stroke="none" />
          <circle cx="34" cy="37" r="1.6" fill="#FFFFFF" stroke="none" />
          <path d="M25 42c2 2 5 2.5 7 1" strokeWidth="2" />
        </svg>
      );
      break;
    case "shaved":
      svg = (
        <svg width="52" height="58" viewBox="0 0 52 58" fill="none" stroke="#E2E2E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 26c-2-12 6-20 14-20s16 8 14 20" fill="rgba(255,255,255,0.12)" />
          <path d="M10 26h32l-5 24H15z" />
          <path d="M15 34h22M26 6v-3" />
        </svg>
      );
      break;
    case "sparkle":
      svg = (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
          <path d="M14 3v7M14 18v7M3 14h7M18 14h7" />
        </svg>
      );
      break;
    case "sparkle-sm":
      svg = (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
          <path d="M10 2v4M10 14v4M2 10h4M14 10h4" />
        </svg>
      );
      break;
    case "wave":
      svg = (
        <svg width="52" height="16" viewBox="0 0 52 16" fill="none" stroke="#E2E2E2" strokeWidth="2" strokeLinecap="round">
          <path d="M2 9c4-7 9 7 13 0s9 7 13 0 9 7 13 0 5-5 9-6" />
        </svg>
      );
      break;
    case "wave-sm":
      svg = (
        <svg width="46" height="14" viewBox="0 0 46 14" fill="none" stroke="#E2E2E2" strokeWidth="2" strokeLinecap="round">
          <path d="M2 8c4-6 8 6 12 0s8 6 12 0 8 6 12 0" />
        </svg>
      );
      break;
    case "drips":
      svg = (
        <svg width="30" height="34" viewBox="0 0 30 34" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h24M6 3l3 12 3-12M15 3l2 8 2-8M22 3l2 5 2-5" opacity="0.85" />
        </svg>
      );
      break;
    case "dots":
      svg = (
        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
          <path d="M3 17l4-8M10 18l3-9M17 17l3-8" />
        </svg>
      );
      break;
    case "circle":
      svg = (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#E2E2E2" strokeWidth="2">
          <circle cx="8" cy="8" r="5" />
        </svg>
      );
      break;
  }
  return (
    <span className="doodle" style={style} aria-hidden>
      {svg}
    </span>
  );
}

/** 白文字＋Ink縁取りの見出し文字。読点「、」で文節に分け、文節単位で折り返す。
 * text 中の [[red:文字]] はアクセント（紺縁）に。トークンが無いときは
 * accentLast=true なら最後の文節だけをアクセントにする（デザイン既定の見え方） */
export function OutlineText({ text, accentLast = false, block = false }: { text: string; accentLast?: boolean; block?: boolean }) {
  const lines = text.split("\n");
  const hasToken = /\[\[[^\]]*:/.test(text);
  // 文節（「、」で区切り、区切り文字は前の文節に含める）
  const phrases: { text: string; accent: boolean; line: number }[] = [];
  lines.forEach((ln, li) => {
    for (const s of splitColorTokens(ln)) {
      const parts = s.text.split(/(?<=、)/).filter((x) => x !== "");
      for (const p of parts) phrases.push({ text: p, accent: !!s.color, line: li });
    }
  });
  if (!hasToken && accentLast && phrases.length > 0) phrases[phrases.length - 1].accent = true;
  return (
    <>
      {phrases.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && phrases[i - 1].line !== p.line && <br />}
          <span className={"outline-text" + (p.accent ? " outline-text--red" : "") + (block ? " outline-text--block" : "")} data-text={p.text}>
            {p.text}
          </span>
        </Fragment>
      ))}
    </>
  );
}

/** セクション見出しの中身。mark の部分に手書き風の波線マーカーを引く（mark が text に含まれるときだけ）。
 * 文字のグラデーション・グレイン・ベタ影は内側の .section__title__in が担う
 * （出現アニメーションを担う h2 と分けて、GPU 合成時の縁のガタつきを防ぐ。2026-09 改修） */
export function Marked({ text, mark }: { text: string; mark?: string }) {
  let inner: ReactNode;
  if (!mark) inner = <span className="marker">{text}</span>;
  else {
    const i = text.indexOf(mark);
    inner =
      i < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, i)}
          <span className="marker">{mark}</span>
          {text.slice(i + mark.length)}
        </>
      );
  }
  return <span className="section__title__in">{inner}</span>;
}

/** 人物の線画（写真が未設定のときのプレースホルダー）。variant で髪型を変える */
export function PersonArt({ variant = 0, size = 150 }: { variant?: number; size?: number }) {
  const hair = [
    "M59 66c-3-18 9-30 26-30s29 12 26 30M59 66c0 8 3 14 8 18M111 66c0 8-3 14-8 18",
    "M58 56h54M63 56c0-10 9-18 22-18s22 8 22 18",
    "M64 46c4-8 12-12 21-12s17 4 21 12c0 6-4 8-9 8H73c-5 0-9-2-9-8z",
    "M60 54c2-12 12-20 25-20s23 8 25 20l3 8H57z",
    "M62 58c-2-14 8-24 23-24s25 10 23 24",
  ][variant % 5];
  return (
    <svg width={size} height={size} viewBox="0 0 170 170" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="85" cy="62" r="26" />
      <path d={hair} strokeWidth="2.5" />
      <path d="M40 170c4-38 20-56 45-56s41 18 45 56" />
      <path d="M75 71c3 2.5 6 3.5 10 3.5s7-1 10-3.5" strokeWidth="2.5" />
    </svg>
  );
}

/** 氷・食・物流のベン図（「アイスラインとは？」の画像が未設定のときの既定図版） */
export function Venn() {
  const font = "'Zen Maru Gothic', sans-serif";
  return (
    <div className="venn reveal" role="img" aria-label="氷・食・物流の3つの要素が重なり合うベン図">
      <svg viewBox="0 0 360 344" width="500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="132" cy="122" r="92" stroke="#FFFFFF" strokeWidth="2.5" fill="rgba(255,255,255,0.10)" />
        <circle cx="228" cy="122" r="92" stroke="#FFFFFF" strokeWidth="2.5" fill="rgba(255,255,255,0.10)" />
        <circle cx="180" cy="205" r="92" stroke="#FFFFFF" strokeWidth="2.5" fill="rgba(255,255,255,0.10)" />
        <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M180 138v28M166 145l14 7 14-7M166 173l14-7 14 7" opacity="0.9" />
        </g>
        <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(76,60)">
          <path d="M4 12l12-8 14 4 2 14-10 10-14-4z" />
          <path d="M16 4l2 12-14-4M18 16l12-8M18 16l0 16" />
        </g>
        <text x="94" y="126" textAnchor="middle" fontFamily={font} fontWeight="700" fontSize="19" fill="#FFFFFF" letterSpacing="2">氷</text>
        <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(250,62)">
          <path d="M2 18h32c0 8-5 14-10 16h-12c-5-2-10-8-10-16z" />
          <path d="M12 12c-2-3 2-4 0-7M22 12c-2-3 2-4 0-7" />
        </g>
        <text x="268" y="126" textAnchor="middle" fontFamily={font} fontWeight="700" fontSize="19" fill="#FFFFFF" letterSpacing="2">食</text>
        <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(160,228)">
          <rect x="1" y="4" width="26" height="16" rx="2" />
          <path d="M27 9h9l6 6v5h-6" />
          <circle cx="10" cy="23" r="3.5" />
          <circle cx="33" cy="23" r="3.5" />
          <path d="M14 23h15" />
        </g>
        <text x="180" y="283" textAnchor="middle" fontFamily={font} fontWeight="700" fontSize="19" fill="#FFFFFF" letterSpacing="2">物流</text>
      </svg>
    </div>
  );
}

/** 「数字で見る」の既定イラストアイコン（CMSで画像を設定するまでの表示） */
export function StatIcon({ index }: { index: number }) {
  const font = "'Zen Maru Gothic', sans-serif";
  const common = { width: 64, height: 64, viewBox: "0 0 64 64", fill: "none", stroke: "#1F2430", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (index % 5) {
    case 0:
      return (
        <svg {...common}>
          <path d="M9 27L32 10l23 17z" fill="rgba(0,155,253,0.25)" />
          <rect x="14" y="27" width="36" height="27" fill="#FFFFFF" />
          <rect x="27" y="39" width="10" height="15" fill="rgba(0,155,253,0.2)" />
          <rect x="18" y="32" width="6" height="6" fill="#E2E2E2" />
          <rect x="40" y="32" width="6" height="6" fill="#E2E2E2" />
          <path d="M55 27V7" />
          <path d="M55 8h-11l3.5 4-3.5 4h11z" fill="#DFF3D6" />
          <path d="M32 16v7M29 18l6 3M35 18l-6 3" strokeWidth="1.8" />
        </svg>
      );
    case 1:
      return (
        <svg {...common}>
          <rect x="8" y="9" width="48" height="35" rx="5" fill="#FFFFFF" />
          <rect x="14" y="30" width="7" height="10" fill="#E2E2E2" />
          <rect x="25" y="24" width="7" height="16" fill="rgba(0,155,253,0.3)" />
          <rect x="36" y="16" width="7" height="24" fill="rgba(0,155,253,0.55)" />
          <path d="M13 27l13-8 8 4 10-8" strokeWidth="3" />
          <circle cx="49" cy="13" r="6" fill="#DFF3D6" />
          <circle cx="47" cy="12" r="0.8" fill="#1F2430" stroke="none" />
          <circle cx="51" cy="12" r="0.8" fill="#1F2430" stroke="none" />
          <path d="M47 14.5q2 1.6 4 0" strokeWidth="1.6" />
          <path d="M24 44v6M40 44v6" />
          <ellipse cx="24" cy="52.5" rx="4.5" ry="2.5" fill="#E2E2E2" />
          <ellipse cx="40" cy="52.5" rx="4.5" ry="2.5" fill="#E2E2E2" />
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <rect x="8" y="31" width="34" height="10" rx="2.5" fill="#FFFFFF" />
          <rect x="10" y="24" width="34" height="10" rx="2.5" fill="#FFFFFF" />
          <rect x="12" y="17" width="34" height="10" rx="2.5" fill="#FFFFFF" />
          <rect x="24" y="17" width="10" height="10" fill="rgba(0,155,253,0.25)" />
          <text x="29" y="25.5" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="8" fill="#1F2430" stroke="none">¥</text>
          <circle cx="17.5" cy="21" r="0.8" fill="#1F2430" stroke="none" />
          <circle cx="21.5" cy="21" r="0.8" fill="#1F2430" stroke="none" />
          <path d="M17.5 23.4q2 1.6 4 0" strokeWidth="1.6" />
          <circle cx="49" cy="44" r="8.5" fill="#DFF3D6" />
          <circle cx="40" cy="51" r="8.5" fill="#DFF3D6" />
          <text x="49" y="47.5" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="10" fill="#1F2430" stroke="none">¥</text>
          <text x="40" y="54.5" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="10" fill="#1F2430" stroke="none">¥</text>
          <path d="M52 12v5M49.5 14.5h5" strokeWidth="2" />
        </svg>
      );
    case 3:
      return (
        <svg {...common}>
          <path d="M11 56c-4-4-4-9 0-12l3-2h4l3 2c4 3 4 8 0 12-3 2-7 2-10 0z" fill="#FFFFFF" />
          <path d="M14 42l2-3.5h3l2 3.5" />
          <text x="16.5" y="52.5" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="9" fill="#1F2430" stroke="none">¥</text>
          <path d="M26 54c-4.5-4.5-4.5-10.5 0-14l3.5-2.5h4.5l3.5 2.5c4.5 3.5 4.5 9.5 0 14-3.5 2.5-8 2.5-11.5 0z" fill="#DFF3D6" />
          <path d="M29.5 37.5l2.2-4h3l2.2 4" />
          <text x="32" y="49.5" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="10" fill="#1F2430" stroke="none">¥</text>
          <path d="M42 52c-5.5-5.5-5.5-12.5 0-16.5l4-3h5l4 3c5.5 4 5.5 11 0 16.5-4 3-9 3-13 0z" fill="rgba(0,155,253,0.22)" />
          <path d="M46 32.5l2.5-4.5h3.5l2.5 4.5" />
          <text x="48.5" y="46" textAnchor="middle" fontFamily={font} fontWeight="900" fontSize="11" fill="#1F2430" stroke="none">¥</text>
          <path d="M8 26L26 17l14 4 14-12" strokeWidth="3" />
          <path d="M48 8h7v7" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M32 8c-2.4-3.4-8-2.3-8 2.2 0 3.4 4.6 5.8 8 9 3.4-3.2 8-5.6 8-9 0-4.5-5.6-5.6-8-2.2z" fill="rgba(0,155,253,0.25)" />
          <circle cx="14" cy="30" r="6.5" fill="#FFFFFF" />
          <circle cx="12" cy="29.5" r="0.9" fill="#1F2430" stroke="none" />
          <circle cx="16" cy="29.5" r="0.9" fill="#1F2430" stroke="none" />
          <path d="M12 32.4q2 1.7 4 0" strokeWidth="1.6" />
          <path d="M6 52c0-8 3.5-13 8-13s8 5 8 13z" fill="#FFFFFF" />
          <circle cx="32" cy="27" r="7.5" fill="#DFF3D6" />
          <circle cx="29.5" cy="26.5" r="0.9" fill="#1F2430" stroke="none" />
          <circle cx="34.5" cy="26.5" r="0.9" fill="#1F2430" stroke="none" />
          <path d="M29.5 29.8q2.5 2 5 0" strokeWidth="1.6" />
          <path d="M23 52c0-9 4-14.5 9-14.5s9 5.5 9 14.5z" fill="#DFF3D6" />
          <circle cx="50" cy="30" r="6.5" fill="rgba(0,155,253,0.22)" />
          <circle cx="48" cy="29.5" r="0.9" fill="#1F2430" stroke="none" />
          <circle cx="52" cy="29.5" r="0.9" fill="#1F2430" stroke="none" />
          <path d="M48 32.4q2 1.7 4 0" strokeWidth="1.6" />
          <path d="M42 52c0-8 3.5-13 8-13s8 5 8 13z" fill="rgba(0,155,253,0.22)" />
          <path d="M20 44q3-3 5-1M39 43q3-3 5-1" strokeWidth="2" />
        </svg>
      );
  }
}

/** 再生アイコン（メディア枠） */
export function PlayIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="28" cy="28" r="22" />
      <path d="M23 19l14 9-14 9z" />
    </svg>
  );
}

/** 選考の流れの矢印 */
export function FlowArrow() {
  return (
    <span className="flow__arrow">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#E2E2E2" strokeWidth="2" strokeLinecap="round">
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </span>
  );
}

/** 手書きグレイン用の SVG フィルター定義（ページに1つ置く） */
export function RoughFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="rough-text" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="2" seed="8" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.8" />
      </filter>
    </svg>
  );
}
