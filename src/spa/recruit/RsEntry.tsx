// エントリー（/recruit/entry）。デザイン支給 iceline-saiyo/entry.html（2026-09-21 更新版）。
// ?job=<職種ID> 付きで開くと希望職種が選択済みになる（職種アコーディオン・職種詳細・記事のエントリーリンクから）。
// フォームは従来どおりプロトタイプ（送信内容・添付ファイルは保存・送信されない）。
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ed, txt } from "../lib/editable";
import { rt } from "../lib/richInline";
import { useRecruitData } from "../lib/recruitStore";
import { LeadText, LowerKv } from "./RsParts";

/** ファイル添付（隠した input と「ファイルを選択」ボタン、選択中のファイル名） */
function FileField({ id, name, accept, required }: { id: string; name: string; accept: string; required?: boolean }) {
  const [fileName, setFileName] = useState("");
  return (
    <div className="form__file">
      <label className="form__file-btn" htmlFor={id}>ファイルを選択</label>
      <input type="file" id={id} name={name} accept={accept} required={required} onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? "")} />
      <span className="form__file-name">{fileName || "選択されていません"}</span>
    </div>
  );
}

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
      <LowerKv en="Entry" jp="エントリー" base="rs:entry.kv" />

      <section className="island">
        <div className="container">
          <div className="js-reveal" style={{ textAlign: "center", maxWidth: 720, marginInline: "auto" }}>
            <LeadText path="rs:entry.lead" def={"**必要なのは、笑顔とまっすぐさ。**\nつくった自分より、そのままの自分。そこから、すべてがはじまります。"} />
          </div>

          <form className="form js-reveal" style={{ marginTop: 56 }} onSubmit={onSubmit}>
            <div className="form__row">
              <span className="form__label">お名前<span className="form__req">必須</span></span>
              <div className="form__pair">
                <input type="text" id="f-sei" name="sei" autoComplete="family-name" placeholder="姓）氷室" required aria-label="姓" />
                <input type="text" id="f-mei" name="mei" autoComplete="given-name" placeholder="名）すなお" required aria-label="名" />
              </div>
            </div>
            <div className="form__row">
              <span className="form__label">ふりがな<span className="form__req">必須</span></span>
              <div className="form__pair">
                <input type="text" id="f-sei-kana" name="sei_kana" placeholder="せい）ひむろ" required aria-label="せい" />
                <input type="text" id="f-mei-kana" name="mei_kana" placeholder="めい）すなお" required aria-label="めい" />
              </div>
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-birth">生年月日<span className="form__req">必須</span></label>
              <input type="date" id="f-birth" name="birth" autoComplete="bday" required />
            </div>
            <div className="form__row">
              <span className="form__label">性別<span className="form__opt">任意</span></span>
              <div className="form__radios">
                <label><input type="radio" name="gender" value="male" />男性</label>
                <label><input type="radio" name="gender" value="female" />女性</label>
                <label><input type="radio" name="gender" value="na" />回答しない</label>
              </div>
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-zip">郵便番号<span className="form__req">必須</span></label>
              <input type="text" id="f-zip" name="zip" autoComplete="postal-code" placeholder="例）700-0000" inputMode="numeric" style={{ maxWidth: 220 }} required />
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-address">住所<span className="form__req">必須</span></label>
              <input type="text" id="f-address" name="address" autoComplete="street-address" placeholder="例）岡山県岡山市◯◯区◯◯ 1-2-3" required />
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-tel">電話番号<span className="form__req">必須</span></label>
              <input type="tel" id="f-tel" name="tel" autoComplete="tel" placeholder="例）090-0000-0000" required />
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-email">メールアドレス<span className="form__req">必須</span></label>
              <input type="email" id="f-email" name="email" autoComplete="email" placeholder="例）sunao@example.com" required />
            </div>
            <div className="form__row">
              <label className="form__label" htmlFor="f-status">現在の状況<span className="form__req">必須</span></label>
              <select id="f-status" name="status" required defaultValue="">
                <option value="">選択してください</option>
                <option>在職中</option>
                <option>離職中</option>
                <option>学生（2027年卒）</option>
                <option>学生（2028年卒以降）</option>
              </select>
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
              <label className="form__label" htmlFor="f-timing">入社可能時期<span className="form__opt">任意</span></label>
              <select id="f-timing" name="timing" defaultValue="">
                <option value="">選択してください</option>
                <option>すぐにでも</option>
                <option>1ヶ月以内</option>
                <option>3ヶ月以内</option>
                <option>半年以内</option>
                <option>相談したい</option>
              </select>
            </div>

            <div className="form__row">
              <span className="form__label">履歴書<span className="form__req">必須</span></span>
              <FileField id="f-resume" name="resume" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" required />
              <p className="note" {...ed("rs:entry.resumeNote", "履歴書の注記")}>{rt("rs:entry.resumeNote", "PDF / Word / Excel / 画像（10MBまで）。写真付きを推奨します。")}</p>
            </div>
            <div className="form__row">
              <span className="form__label">職務経歴書<span className="form__opt">任意</span></span>
              <FileField id="f-cv" name="cv" accept=".pdf,.doc,.docx,.xls,.xlsx" />
              <p className="note" {...ed("rs:entry.cvNote", "職務経歴書の注記")}>{rt("rs:entry.cvNote", "中途採用の方はご提出をお願いします（新卒・学生の方は不要です）。")}</p>
            </div>

            <div className="form__row">
              <label className="form__label" htmlFor="f-message">志望動機・自己PR<span className="form__opt">任意</span></label>
              <textarea id="f-message" name="message" placeholder="志望のきっかけ、これまでの経験、聞いてみたいことなど、自由にお書きください。" />
            </div>

            <div className="form__row">
              <label className="form__consent">
                <input type="checkbox" name="privacy" required />
                <span>
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer" data-no-transition>個人情報の取り扱い</Link>
                  に同意する<span className="form__req">必須</span>
                </span>
              </label>
            </div>

            <div className="form__submit">
              <button className="btn-entry" type="submit" disabled={done}>
                <span {...ed("rs:entry.submit", "送信ボタン文言")}>{rt("rs:entry.submit", "この内容でエントリーする")}</span>
                <span className="arrow">→</span>
              </button>
              <p className="note" style={{ marginTop: 14 }} {...ed("rs:entry.note", "フォーム注記")}>
                {rt("rs:entry.note", "※このフォームはプロトタイプのため、送信内容・添付ファイルは保存されません。")}
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
