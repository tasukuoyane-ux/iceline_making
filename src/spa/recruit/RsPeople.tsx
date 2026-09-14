// 人を知る（/recruit/people）。デザイン支給 iceline-saiyo/people.html。
// カードは既存のインタビュー記事（/recruit/interview/:id）へ遷移する（ユーザー指定）。
// 支給 HTML にあった「代表インタビュー詳細」のインライン記事は、カードから記事ページへ飛ぶため置かない。
import { txt } from "../lib/editable";
import { EntryBand, HandNote, LeadText, LowerKv, NextIsland, PeopleScroller } from "./RsParts";

export function RsPeople() {
  return (
    <>
      <LowerKv en="People" jp="人を知る" base="rs:people.kv" cloud={{ right: "5%", top: "15%", width: "min(24vw,300px)" }} />

      <section className="island">
        <div className="container">
          <div className="js-reveal">
            <LeadText path="rs:people.lead" def="働く社員のインタビューを、カードをめくるように読めます。" />
            <HandNote path="rs:people.note" def="→ 横にスクロールできます" style={{ marginTop: 14 }} />
          </div>
          <PeopleScroller style={{ marginTop: 34 }} />
        </div>
      </section>

      <div className="sea-gap" />
      <NextIsland to="/recruit/jobs" en="Recruit" jp={txt("rs:people.next.jp", "つぎは、募集職種を見る →")} base="rs:people.next" />
      <EntryBand />
    </>
  );
}
