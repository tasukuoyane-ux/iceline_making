// エントリー（/recruit/entry）。デザイン支給 iceline-saiyo/entry.html。
// ?job=<職種ID> 付きで開くと希望職種が選択済みになる（職種詳細・記事のエントリーリンクから）。
// フォームは従来どおりプロトタイプ（送信内容は保存・送信されない）。
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { ed, txt } from "../lib/editable";
import { rt } from "../lib/richInline";
import { useRecruitData } from "../lib/recruitStore";
import { Fukidashi, LeadText, LowerKv } from "./RsParts";

export function RsEntry() {
  const { jobs } = useRecruitData();
  const [params] = useSearchParams();
  const initial = params.get("job") || "";
  const [done, setDone] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDone(true);
    toast.success("エントリーを受け付けました。担当者よりご連絡いたします。");
    window.setTimeout(() => document.querySelector(".form__done")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  return (
    <>
      <LowerKv en="Entry" jp="エントリー" base="rs:entry.kv" cloud={{ right: "6%", top: "16%", width: "min(22vw,280px)" }} />

      <section className="island">
        <div className="container">
          <div className="js-reveal" style={{ textAlign: "center", maxWidth: 720, marginInline: "auto" }}>
            <Fukidashi path="rs:entry.fuki" def="履歴書は、あとからで大丈夫です" style={{ marginBottom: 24 }} />
            <LeadText path="rs:entry.lead" def="**必要なのは、笑顔とまっすぐさ。**\nつくった自分より、そのままの自分。そこから、すべてがはじまります。" />
          </div>

          <form className="form js-reveal" style={{ marginTop: 56 }} onSubmit={onSubmit}>
            <div className="form__row">
              <label className="form__label" htmlFor="f-name">お名前<span className="form__req">必須</span></label>
              <input type="text" id="f-name" name="name" autoComplete="name" placeholder="例）氷室 すなお" required />
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-kana">ふりがな<span className="form__req">必須</span></label>
              <input type="text" id="f-kana" name="kana" placeholder="例）ひむろ すなお" required />
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-email">メールアドレス<span className="form__req">必須</span></label>
              <input type="email" id="f-email" name="email" autoComplete="email" placeholder="例）sunao@example.com" required />
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-tel">電話番号<span className="form__opt">任意</span></label>
              <input type="tel" id="f-tel" name="tel" autoComplete="tel" placeholder="例）086-000-0000" />
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-job">希望職種<span className="form__req">必須</span></label>
              <select id="f-job" name="job" required defaultValue={initial}>
                <option value="">選択してください</option>
                {jobs
                  .filter((j) => j.active)
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}（{j.dept}）
                    </option>
                  ))}
                <option value="undecided">まだ決めていない（相談したい）</option>
              </select>
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-message">メッセージ<span className="form__opt">任意</span></label>
              <textarea id="f-message" name="message" placeholder="気になっていること、聞いてみたいこと、何でもどうぞ。" />
            </div>
            <div className="form__submit">
              <button className="btn-entry" type="submit" disabled={done}>
                <span {...ed("rs:entry.submit", "送信ボタン文言")}>{rt("rs:entry.submit", "この内容でエントリーする")}</span>
                <span className="arrow">→</span>
              </button>
              <p className="note" style={{ marginTop: 14 }} {...ed("rs:entry.note", "フォーム注記")}>
                {rt("rs:entry.note", "※このフォームはプロトタイプのため、送信内容は保存されません。")}
              </p>
            </div>
            {done && (
              <div className="card form__done">
                <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{txt("rs:entry.doneTitle", "エントリーありがとうございます！")}</p>
                <p style={{ fontSize: 14.5, color: "var(--ink-soft)", whiteSpace: "pre-line" }}>{txt("rs:entry.doneText", "担当者から3営業日以内にご連絡いたします。")}</p>
              </div>
            )}
          </form>
        </div>
      </section>

      <div className="sea-gap" />
    </>
  );
}
