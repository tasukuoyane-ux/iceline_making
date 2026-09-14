// 採用トップ（/recruit）。デザイン支給 iceline-saiyo/index.html。
import { Link } from "react-router";
import { ed, txt } from "../lib/editable";
import { rt } from "../lib/richInline";
import { useRecruitData } from "../lib/recruitStore";
import { Billboard, BtnLine, CloudSvg, EntryBand, FloeSvg, HandNote, LeadText, NumGrid, PeopleScroller, SecHead, Venn, WaveDivider } from "./RsParts";

const HERO_LEAD = "必要なのは、笑顔とまっすぐさ。\nつくった自分より、そのままの自分。\nそこから、すべてがはじまります。\n\nつまずいたときに、話せるか。\nかくさなくていい場所で、\nこまったことは、声に出して。\n\nここから先を、\nいっしょにつくっていきましょう。";
const ABOUT_LEAD = "アイスラインは**氷・食・物流**の3つの要素から、人の生活を築き上げてきました。\n毎日の食卓の安心を届けることが、私たちの使命です。";
const WORK_LEAD = "**氷と食のフィールドで、暮らしの当たり前を支える。**\n\n氷は、もう特別なものではありません。コンビニでも、飲食店でも、家庭でも。どこにでもあって、当たり前に使われています。\n\nつくり、運び、届ける。目立つことは、あまりありません。それでも、なくなったら誰かが困る。その仕事を、私たちは今日も、丁寧に続けています。";
const RECRUIT_LEAD = "本社・工場・営業の現場で、いっしょに働く仲間を募集しています。\n職種名を選ぶと、業務内容・PRポイント・諸条件・選考の流れなどの詳細をご覧いただけます。";

export function RsIndex() {
  const { jobs } = useRecruitData();
  const active = jobs.filter((j) => j.active);
  const pills = active.slice(0, 6);
  return (
    <>
      {/* KV: 氷の海 */}
      <section className="hero">
        <div className="hero__art" aria-hidden>
          <FloeSvg style={{ left: "-4%", bottom: "6%", width: "min(34vw,420px)" }} />
          <CloudSvg className="float -slower" style={{ right: "5%", top: "10%", width: "min(26vw,320px)" }} />
          <CloudSvg style={{ left: "6%", top: "7%", width: "min(15vw,180px)" }} />
        </div>
        <div className="hero__inner">
          <p className="hero__hand intro" {...ed("rs:hero.hand", "KV 手書き文字")}>{rt("rs:hero.hand", "アイスライン株式会社 採用サイト")}</p>
          <h1 className="hero__catch intro" style={{ whiteSpace: "pre-line" }} {...ed("rs:hero.catch", "KV キャッチコピー", { multiline: true })}>
            {rt("rs:hero.catch", "すなおな心で、\n一歩ずつ。")}
          </h1>
          <div className="hero__lead intro">
            <LeadText path="rs:hero.lead" def={HERO_LEAD} className="" label="KV 本文" />
          </div>
        </div>
        <div className="scroll-sign" aria-hidden>Scroll</div>
      </section>

      {/* About ダイジェスト＋数字で見る */}
      <section className="island">
        <div className="container">
          <SecHead>
            <Billboard en="About" jp="アイスラインとは？" base="rs:idx.about" />
            <BtnLine to="/recruit/about" path="rs:idx.about.btn" def="くわしく知る" />
          </SecHead>
          <LeadText path="rs:idx.about.lead" def={ABOUT_LEAD} className="lead-text js-reveal" />
          <Venn />
          <div className="island__sec">
            <SecHead>
              <Billboard en="Numbers" jp="数字で見るアイスライン" base="rs:idx.num" />
            </SecHead>
            <NumGrid base="rs:num" />
          </div>
        </div>
      </section>

      <WaveDivider />

      {/* Work ダイジェスト */}
      <section className="island" style={{ marginTop: "var(--sea-gap)" }}>
        <div className="container">
          <SecHead>
            <Billboard en="Work" jp="アイスラインの仕事" base="rs:idx.work" />
            <BtnLine to="/recruit/work" path="rs:idx.work.btn" def="仕事とカルチャーを見る" />
          </SecHead>
          <LeadText path="rs:idx.work.lead" def={WORK_LEAD} className="lead-text js-reveal" />
        </div>
      </section>

      {/* People ダイジェスト */}
      <section className="island">
        <div className="container">
          <SecHead>
            <Billboard en="People" jp="人を知る" base="rs:idx.people" />
            <BtnLine to="/recruit/people" path="rs:idx.people.btn" def="インタビュー一覧へ" />
          </SecHead>
          <HandNote path="rs:idx.people.note" def="→ 横にスクロールできます" style={{ marginBottom: 22 }} />
          <PeopleScroller />
        </div>
      </section>

      {/* Recruit ダイジェスト */}
      <section className="island">
        <div className="container">
          <SecHead>
            <Billboard en="Recruit" jp="募集職種" base="rs:idx.recruit" />
            <BtnLine to="/recruit/jobs" path="rs:idx.recruit.btn" def="募集職種一覧へ" />
          </SecHead>
          <LeadText path="rs:idx.recruit.lead" def={RECRUIT_LEAD} className="lead-text js-reveal" />
          <div className="field-pills js-reveal-group" style={{ marginTop: 36 }}>
            {pills.map((j) => (
              <Link key={j.id} className="field-pill" to={`/recruit/jobs?job=${encodeURIComponent(j.id)}`}>
                {j.title.replace(/（[^）]*）\s*$/, "")}
              </Link>
            ))}
            <Link className="field-pill" to="/recruit/jobs">
              {txt("rs:idx.recruit.more", "ほか全{n}職種").replace("{n}", String(active.length))}
            </Link>
          </div>
        </div>
      </section>

      <EntryBand />
    </>
  );
}
