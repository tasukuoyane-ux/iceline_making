import { Section, SectionTitle } from "./Section";
import { HeatProfile } from "../../lib/heat";
import { ed, txt, EDIT_MODE } from "../../lib/editable";

/**
 * ページ別の「お問い合わせ」セクション。
 * 本文はページごとに異なる問い合わせ先（部署名・電話番号など）を改行しながら
 * 入力できる。未入力の間は公開ページではセクションごと非表示
 * （コンソールの編集プレビューでは入力枠を表示）。
 */
export function ContactSection({ base, heat }: { base: string; heat: HeatProfile }) {
  const body = txt(`${base}.contact.body`, "");
  if (body === "" && !EDIT_MODE) return null;
  return (
    <Section heat={heat}>
      <SectionTitle en="CONTACT" jp="お問い合わせ" path={`${base}.contact.en`} />
      <div className="mt-10 rounded-2xl border border-border bg-card p-8">
        <p
          className={body ? "text-foreground/80" : "text-muted-foreground"}
          style={{ fontSize: 15, lineHeight: 2.05, whiteSpace: "pre-line" }}
          {...ed(`${base}.contact.body`, "お問い合わせ先（改行可）", { multiline: true })}
        >
          {body || "（未入力：このページのお問い合わせ先（部署名・電話番号など）をここへ入力してください）"}
        </p>
      </div>
    </Section>
  );
}
