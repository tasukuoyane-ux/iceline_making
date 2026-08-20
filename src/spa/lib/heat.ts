// 熱量（ねつりょう）設計システム
// トンマナ表の6軸（A=低熱量/冷・静 〜 E=高熱量/温・動）を
// 再利用可能なスタイルトークンへ翻訳する。

export type HeatLevel = "A" | "B" | "C" | "D" | "E";

export interface HeatProfile {
  /** レイアウト規則性: A=グリッド左右対称 〜 E=非グリッド左右非対称 */
  layout: HeatLevel;
  /** エモーショナルさ: A=冷 〜 E=温（最重要・重み3） */
  emotion: HeatLevel;
  /** 主語: A=会社 〜 E=私 */
  subject: HeatLevel;
  /** セクション統合: A=ブツ切れ 〜 E=地続き */
  cohesion: HeatLevel;
  /** 背景: A=白地淡泊 〜 E=画像/動画リッチ */
  background: HeatLevel;
  /** 要素の丸み: A=角 〜 E=丸 */
  roundness: HeatLevel;
}

const ORDER: HeatLevel[] = ["A", "B", "C", "D", "E"];
const rank = (l: HeatLevel) => ORDER.indexOf(l);

/** 6軸を重み付き平均した総合熱量スコア（0〜1）。重み: emotion3, layout2, cohesion1.5, subject1, background0.5, roundness0.5 */
export function heatScore(p: HeatProfile): number {
  const w = { emotion: 3, layout: 2, cohesion: 1.5, subject: 1, background: 0.5, roundness: 0.5 };
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const sum =
    rank(p.emotion) * w.emotion +
    rank(p.layout) * w.layout +
    rank(p.cohesion) * w.cohesion +
    rank(p.subject) * w.subject +
    rank(p.background) * w.background +
    rank(p.roundness) * w.roundness;
  return sum / (4 * total); // rank最大4で正規化
}

const ROUNDNESS: Record<HeatLevel, string> = {
  A: "rounded-none",
  B: "rounded-sm",
  C: "rounded-lg",
  D: "rounded-2xl",
  E: "rounded-[2rem]",
};

const SECTION_PADDING: Record<HeatLevel, string> = {
  A: "py-14 tab:py-16",
  B: "py-16 tab:py-20",
  C: "py-20 tab:py-24",
  D: "py-24 tab:py-32",
  E: "py-28 tab:py-40",
};

export interface HeatStyles {
  /** 要素の角丸クラス */
  radius: string;
  /** セクションの縦余白クラス */
  sectionPadding: string;
  /** 背景クラス（淡泊な白〜リッチなグレー/ダーク） */
  surface: string;
  /** 主語の人称ヒント（コピー選択の指針） */
  voice: "corporate" | "we" | "i";
  /** アニメーション強度（0=静 〜 1=動） */
  motion: number;
  /** 総合熱量スコア */
  score: number;
}

export function heatStyles(p: HeatProfile): HeatStyles {
  const score = heatScore(p);
  const surface =
    rank(p.background) <= 0
      ? "bg-background"
      : rank(p.background) === 1
      ? "bg-secondary/40"
      : rank(p.background) === 2
      ? "bg-secondary"
      : "bg-ink text-white";
  const voice = rank(p.subject) >= 3 ? "i" : rank(p.subject) >= 1 ? "we" : "corporate";
  return {
    radius: ROUNDNESS[p.roundness],
    sectionPadding: SECTION_PADDING[p.emotion],
    surface,
    voice,
    motion: Math.min(1, rank(p.emotion) / 4 + rank(p.layout) / 8),
    score,
  };
}

/** A〜Eを HeatProfile に手早く変換するヘルパー（順序: layout,emotion,subject,cohesion,background,roundness） */
export function heat(
  layout: HeatLevel,
  emotion: HeatLevel,
  subject: HeatLevel,
  cohesion: HeatLevel,
  background: HeatLevel,
  roundness: HeatLevel
): HeatProfile {
  return { layout, emotion, subject, cohesion, background, roundness };
}
