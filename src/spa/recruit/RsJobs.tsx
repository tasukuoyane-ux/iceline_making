// 募集職種一覧（/recruit/jobs）。デザイン支給 iceline-saiyo/jobs.html。
// 職種は採用タブ（CMS）のデータ。「詳細・エントリー」で職種詳細オーバーレイ（?job=<ID>）を開く。
import { Link } from "react-router";
import { ed, repeatSel } from "../lib/editable";
import { rt } from "../lib/richInline";
import { useRecruitData } from "../lib/recruitStore";
import { Billboard, EntryBand, HandNote, LeadText, LowerKv, SecHead } from "./RsParts";

const FLOW = [
  { title: "エントリー", text: "フォームから気軽にご応募ください。履歴書はあとからで大丈夫です。" },
  { title: "面談", text: "かしこまらないおしゃべりに近い面談です。気になることは何でも聞いてください。" },
  { title: "職場見学", text: "工場や営業の現場を実際に見て、働くイメージをつかんでもらいます。" },
  { title: "内定", text: "入社日はご都合に合わせて相談できます。ここから、いっしょに一歩ずつ。" },
];
const MAX_FLOW = 6;

export function RsJobs() {
  const { jobs } = useRecruitData();
  const active = jobs.filter((j) => j.active);
  const flow = repeatSel("rs:flow.count", FLOW.length, MAX_FLOW, "選考ステップの数");
  return (
    <>
      <LowerKv en="Recruit" jp="募集職種一覧" base="rs:jobs.kv" cloud={{ right: "5%", top: "15%", width: "min(24vw,300px)" }} />

      <section className="island">
        <div className="container">
          <LeadText path="rs:jobs.lead" def="職種名を選ぶと、業務内容・PRポイント・諸条件・選考の流れなどの詳細をご覧いただけます。" className="lead-text js-reveal" />
          <div className="job-list js-reveal-group" style={{ marginTop: 40 }}>
            {active.map((j) => (
              <div key={j.id} className="job-row">
                <span className="job-row__place">{j.dept}</span>
                <span className="job-row__name">{j.title}</span>
                <span className="job-row__badge" {...ed("rs:jobs.badge", "募集中バッジ")}>{rt("rs:jobs.badge", "募集中")}</span>
                <Link className="job-row__link" to={`/recruit/jobs?job=${encodeURIComponent(j.id)}`} data-no-transition>
                  <span {...ed("rs:jobs.link", "詳細リンク文言")}>{rt("rs:jobs.link", "詳細・エントリー")}</span>
                  <span className="arrow">→</span>
                </Link>
              </div>
            ))}
            {active.length === 0 && <p className="note">現在募集中の職種はありません。</p>}
          </div>

          {/* 選考の流れ */}
          <div className="island__sec">
            <SecHead>
              <Billboard en="Flow" jp="選考の流れ" base="rs:jobs.flowHead" />
              <HandNote path="rs:jobs.flowNote" def="" />
            </SecHead>
            <div className="flow-grid js-reveal-group" {...flow.attrs}>
              {Array.from({ length: MAX_FLOW }, (_, i) => {
                const d = FLOW[i] ?? { title: "", text: "" };
                return (
                  <div key={i} className="card flow-step">
                    <p className="flow-step__title" {...ed(`rs:flow.${i}.title`, `ステップ${i + 1} 見出し`)}>{rt(`rs:flow.${i}.title`, d.title || "（見出し）")}</p>
                    <p className="flow-step__text" style={{ whiteSpace: "pre-line" }} {...ed(`rs:flow.${i}.text`, `ステップ${i + 1} 本文`, { multiline: true })}>
                      {rt(`rs:flow.${i}.text`, d.text || "（本文）")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="sea-gap" />
      <EntryBand />
    </>
  );
}
