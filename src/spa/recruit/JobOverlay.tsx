// 職種詳細（/recruit/jobs?job=<職種ID> などで開くオーバーレイ）。
// 採用タブ（CMS）の職種データ（仕事内容／1日の仕事内容／やりがい／PRポイント／人物像／諸条件／
// 拠点マップ／福利厚生／選考の流れ／FAQ／メッセージ）を、デザイン支給 iceline-saiyo のカード調で描画する。
// エントリーはエントリーページ（/recruit/entry?job=<ID>）へ（2026-09-15 全面差し替え）。
import { useEffect } from "react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, txt } from "../lib/editable";
import { rt } from "../lib/richInline";
import type { RecruitBlock, RecruitJob, RecruitPrPoint, RecruitRow, RecruitView } from "../lib/recruitStore";

function useBodyLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
}

function H2({ path, def }: { path?: string; def: string }) {
  return (
    <h2 className="ov__h2" {...(path ? ed(path, "見出し") : {})}>
      {path ? rt(path, def) : def}
    </h2>
  );
}

function BlockSec({ block, defTitle }: { block?: RecruitBlock; defTitle: string }) {
  if (!block || (block.body.trim() === "" && block.image.trim() === "")) return null;
  const hasImage = block.image.trim() !== "";
  return (
    <div className="card ov__sec js-reveal">
      <H2 def={block.title || defTitle} />
      <div className={"ov__block" + (hasImage ? " has-image" : "")}>
        {block.body.trim() !== "" && <p style={{ whiteSpace: "pre-line" }}>{block.body}</p>}
        {hasImage && <ImageWithFallback src={block.image} alt={block.title || defTitle} className="ov__img" />}
      </div>
    </div>
  );
}

function PointsSec({ pr, defTitle }: { pr?: { title: string; points: RecruitPrPoint[] }; defTitle: string }) {
  const points = (pr?.points ?? []).filter((p) => p.title.trim() !== "" || p.body.trim() !== "" || p.image.trim() !== "");
  if (points.length === 0) return null;
  return (
    <div className="card ov__sec js-reveal">
      <H2 def={pr?.title || defTitle} />
      <div className="ov__points">
        {points.map((p, i) => {
          const hasImage = p.image.trim() !== "";
          return (
            <div key={i} className={"ov__point" + (hasImage ? " has-image" : "")}>
              <div>
                {p.title.trim() !== "" && <h4>{p.title}</h4>}
                {p.body.trim() !== "" && <p style={{ whiteSpace: "pre-line" }}>{p.body}</p>}
              </div>
              {hasImage && <ImageWithFallback src={p.image} alt={p.title} className="ov__img" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RowsSec({ rows, path, def }: { rows: RecruitRow[]; path: string; def: string }) {
  const list = rows.filter((r) => r.label.trim() !== "" || r.value.trim() !== "");
  if (list.length === 0) return null;
  return (
    <div className="card ov__sec js-reveal">
      <H2 path={path} def={def} />
      <dl className="ov__dl">
        {list.map((r, i) => (
          <div key={i} style={{ display: "contents" }}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MapSec({ map }: { map?: { title: string; spots: string[] } }) {
  const spots = (map?.spots ?? []).map((s) => s.trim()).filter(Boolean);
  if (spots.length === 0) return null;
  return (
    <div className="card ov__sec js-reveal">
      <H2 def={map?.title || "拠点（Googleマップ）"} />
      <div className={"ov__map" + (spots.length > 1 ? " -two" : "")}>
        {spots.map((s, i) => {
          const q = s.includes("〒") ? s.slice(s.indexOf("〒")) : s;
          return (
            <div key={i}>
              <iframe src={`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=ja`} title={s} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              <p>{s}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlowSec({ job, data }: { job: RecruitJob; data: RecruitView }) {
  const steps =
    job.flow && job.flow.steps?.length
      ? job.flow.steps.map((s) => s.task).filter((s) => s.trim() !== "")
      : (data.flow ?? []).filter((s) => s.trim() !== "");
  if (steps.length === 0) return null;
  return (
    <div className="ov__sec js-reveal">
      <H2 path="rs:ov.flow" def="選考の流れ" />
      <div className="flow-grid">
        {steps.map((s, i) => (
          <div key={i} className="card flow-step">
            <p className="flow-step__title">{s}</p>
          </div>
        ))}
      </div>
      {job.flow?.note && <p className="note" style={{ marginTop: 12 }}>{job.flow.note}</p>}
    </div>
  );
}

function FaqSec({ items }: { items: { q: string; a: string; cat?: string }[] }) {
  const list = items.filter((f) => f.q.trim() !== "");
  if (list.length === 0) return null;
  return (
    <div className="card ov__sec js-reveal">
      <H2 path="rs:ov.faq" def="よくある質問" />
      <div className="ov__faq">
        {list.map((f, i) => (
          <div key={i}>
            <p className="ov__faq-q">
              <span className="q">Q.</span>
              <span>{f.q}</span>
            </p>
            {f.a.trim() !== "" && <p className="ov__faq-a">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function JobOverlay({ job, data, onClose }: { job: RecruitJob; data: RecruitView; onClose: () => void }) {
  useBodyLock();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const title = job.title.replace(/（[^）]*）\s*$/, "");
  const type = /（([^）]*)）\s*$/.exec(job.title)?.[1] ?? "";

  return (
    <div className={"ov" + (job.heroImage ? " has-hero" : "")} role="dialog" aria-modal="true" aria-label={job.title}>
      <button type="button" className="ov__close" aria-label="閉じる" onClick={onClose}>
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 4l12 12M16 4L4 16" />
        </svg>
      </button>

      <section className="lower-kv">
        <div className="lower-kv__inner">
          <h1 className="billboard -white js-reveal is-inview" style={{ transitionDelay: "0.15s" }}>
            <span className="billboard__en" {...ed("rs:ov.kv.en", "職種詳細 英字")}>{rt("rs:ov.kv.en", "Recruit")}</span>
            <span className="billboard__jp">{job.dept}</span>
          </h1>
          <p className="js-reveal is-inview" style={{ marginTop: 26, fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, lineHeight: 1.4, fontFeatureSettings: "'palt' 1", transitionDelay: "0.3s" }}>
            {title}
            {type && <span style={{ marginLeft: 12, fontSize: 15, fontWeight: 500, opacity: 0.9 }}>{type}</span>}
          </p>
          <p className="js-reveal is-inview" style={{ marginTop: 14, transitionDelay: "0.45s" }}>
            <span className="job-row__badge" style={{ borderColor: "#FFFFFF", color: "#FFFFFF" }}>{txt("rs:jobs.badge", "募集中")}</span>
          </p>
        </div>
      </section>

      {/* 見出し直下の画像（採用タブ「見出し下の画像」。未設定なら無し） */}
      {job.heroImage && (
        <div className="container">
          <figure className="ov__hero js-reveal is-inview">
            <ImageWithFallback src={job.heroImage} alt={job.title} />
          </figure>
        </div>
      )}

      <section className="island">
        <div className="container">
          <div className="card ov__sec js-reveal">
            <H2 path="rs:ov.body" def="仕事内容" />
            <div className={"ov__block" + (job.image ? " has-image" : "")}>
              <p style={{ whiteSpace: "pre-line" }}>{job.body}</p>
              {job.image && <ImageWithFallback src={job.image} alt={job.title} className="ov__img" />}
            </div>
          </div>
          <BlockSec block={job.daywork} defTitle="1日の仕事内容" />
          <BlockSec block={job.appeal} defTitle="やりがい・特徴" />
          <PointsSec pr={job.pr} defTitle="この仕事のPRポイント" />
          <PointsSec pr={job.persona} defTitle="求める人物像" />
          <PointsSec pr={job.invite} defTitle="こんな方であればぜひご応募ください" />
          <RowsSec rows={job.conditions?.length ? job.conditions : data.conditions} path="rs:ov.conditions" def="諸条件" />
          <MapSec map={job.map} />
          <RowsSec rows={job.benefits?.length ? job.benefits : data.benefits} path="rs:ov.benefits" def="福利厚生" />
          <FlowSec job={job} data={data} />
          <FaqSec items={data.faq} />
          {job.message.trim() !== "" && (
            <div className="ov__sec js-reveal">
              <p className="ov__message" style={{ whiteSpace: "pre-line" }}>{job.message}</p>
            </div>
          )}
          <div className="ov__actions js-reveal">
            <Link className="btn-entry" to={`/recruit/entry?job=${encodeURIComponent(job.id)}`}>
              <span {...ed("rs:ov.entryBtn", "エントリーボタン文言")}>{rt("rs:ov.entryBtn", "この職種にエントリーする")}</span>
              <span className="arrow">→</span>
            </Link>
            <button type="button" className="btn-line" onClick={onClose}>
              <span {...ed("rs:ov.backBtn", "一覧へ戻るボタン文言")}>{rt("rs:ov.backBtn", "募集職種一覧へ戻る")}</span>
            </button>
          </div>
        </div>
      </section>
      <div className="sea-gap" />
    </div>
  );
}
