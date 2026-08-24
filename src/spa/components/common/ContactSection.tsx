import { Section, SectionTitle } from "./Section";
import { RichBody } from "./RichBody";
import { HeatProfile } from "../../lib/heat";
import { txt, EDIT_MODE } from "../../lib/editable";

/**
 * ページ別の「お問い合わせ」セクション。
 * 本文はページごとに異なる問い合わせ先（部署名・電話番号など）を改行しながら
 * 入力できる（行頭「・」でリスト表示）。未入力の間は公開ページでは
 * セクションごと非表示（コンソールの編集プレビューでは入力枠を表示）。
 */
export function ContactSection({ base, heat }: { base: string; heat: HeatProfile }) {
  const body = txt(`${base}.contact.body`, "");
  if (body === "" && !EDIT_MODE) return null;
  return (
    <Section heat={heat}>
      <SectionTitle en="CONTACT" jp="お問い合わせ" path={`${base}.contact`} />
      <div className="mt-10 rounded-2xl border border-border bg-card p-8">
        <RichBody
          path={`${base}.contact.body`}
          text={body || "（未入力：このページのお問い合わせ先（部署名・電話番号など）をここへ入力してください）"}
          label="お問い合わせ先（改行可）"
          className={body ? "text-foreground/80" : "text-muted-foreground"}
          style={{ fontSize: 15, lineHeight: 2.05 }}
        />
      </div>
    </Section>
  );
}
