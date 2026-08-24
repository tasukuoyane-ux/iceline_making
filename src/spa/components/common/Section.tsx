import { ReactNode } from "react";
import { HeatProfile, heatStyles } from "../../lib/heat";
import { cn } from "../ui/utils";
import { ed, txt, EDIT_MODE } from "../../lib/editable";

interface SectionProps {
  heat: HeatProfile;
  children: ReactNode;
  className?: string;
  /** コンテナ幅を内側に適用するか */
  contained?: boolean;
  id?: string;
}

// 熱量プロファイルから余白・背景を派生させるセクションラッパ
export function Section({ heat, children, className, contained = true, id }: SectionProps) {
  const s = heatStyles(heat);
  return (
    <section id={id} className={cn(s.sectionPadding, s.surface, className)}>
      <div className={cn(contained && "mx-auto max-w-[1400px] px-5 pc:px-8")}>{children}</div>
    </section>
  );
}

interface SectionTitleProps {
  en?: string;
  jp: string;
  align?: "left" | "center";
  invert?: boolean;
  className?: string;
  /** 英語見出し補助文の編集パス（指定するとコンソールから編集可能になる） */
  path?: string;
}

export function SectionTitle({ en, jp, align = "left", invert, className, path }: SectionTitleProps) {
  const enVal = path ? txt(path, en ?? "") : en ?? "";
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {(enVal !== "" || (path && EDIT_MODE)) && (
        <div
          className={cn("mb-2", invert ? "text-white/85" : "text-brand")}
          style={{ fontFamily: "var(--font-accent)", fontSize: 13, letterSpacing: "0.18em" }}
          {...(path ? ed(path, "英語見出し（補助）") : {})}
        >
          {enVal}
        </div>
      )}
      <h2 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.35 }} className={cn(invert && "text-white")}>
        {jp}
      </h2>
    </div>
  );
}
