// 職種詳細（/recruit?job=<職種ID> で開くオーバーレイ）。
// デザイン支給 job/*.html の構成（仕事内容／PRポイント／人物像／諸条件／福利厚生／選考の流れ）を
// 採用タブ（CMS）の職種データで描画し、旧オーバーレイにあった拠点マップ・FAQ・職種別メッセージ・
// エントリーフォームも引き継ぐ。記事の「求人エントリーリンク」（&entry=1）で開いたときは
// エントリーフォームまで自動スクロールする。
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, txt } from "../lib/editable";
import type { RecruitBlock, RecruitJob, RecruitPrPoint, RecruitRow, RecruitTimeline, RecruitView } from "../lib/recruitStore";
import { RecruitFrame } from "./RecruitFrame";
import { FlowArrow, Marked, OutlineText } from "./parts";
import { deptTag } from "./jobTag";

/** モーダル表示中は背面のスクロールを止める */
function useBodyLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
}

function SecTitle({ path, def, mark }: { path: string; def: string; mark?: string }) {
  return (
    <h2 className="section__title reveal" {...ed(path, "見出し")}>
      <Marked text={txt(path, def)} mark={mark} />
    </h2>
  );
}

/** H2＋本文＋画像（任意）のブロック（1日の仕事内容／やりがい・特徴） */
function BlockSec({ block, defTitle, base }: { block?: RecruitBlock; defTitle: string; base: string }) {
  if (!block || (block.body.trim() === "" && block.image.trim() === "")) return null;
  const hasImage = block.image.trim() !== "";
  return (
    <section className="ov-sec">
      <h2 className="section__title reveal">
        <Marked text={block.title || defTitle} />
      </h2>
      <div className={"iv-block iv-block--lead reveal" + (hasImage ? " has-image" : "")} data-ov={base}>
        {block.body.trim() !== "" && <p style={{ whiteSpace: "pre-line" }}>{block.body}</p>}
        {hasImage && <ImageWithFallback src={block.image} alt={block.title || defTitle} className="iv-block__img" />}
      </div>
    </section>
  );
}

/** H2＋任意個数の H4/本文/画像（PRポイント／求める人物像／こんな方であれば…） */
function PointsSec({ pr, defTitle, mark }: { pr?: { title: string; points: RecruitPrPoint[] }; defTitle: string; mark?: string }) {
  const points = (pr?.points ?? []).filter((p) => p.title.trim() !== "" || p.body.trim() !== "" || p.image.trim() !== "");
  if (points.length === 0) return null;
  return (
    <section className="ov-sec">
      <h2 className="section__title reveal">
        <Marked text={pr?.title || defTitle} mark={mark} />
      </h2>
      <div className="iv-block reveal">
        {points.map((p, i) => {
          const hasImage = p.image.trim() !== "";
          return (
            <div key={i} className={"ov-point" + (hasImage ? " ov-point--img" : "")}>
              <div>
                {p.title.trim() !== "" && <h4>{p.title}</h4>}
                {p.body.trim() !== "" && <p style={{ whiteSpace: "pre-line" }}>{p.body}</p>}
              </div>
              {hasImage && <ImageWithFallback src={p.image} alt={p.title} className="iv-block__img" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 諸条件・福利厚生の表 */
function RowsSec({ rows, path, def, mark }: { rows: RecruitRow[]; path: string; def: string; mark?: string }) {
  const list = rows.filter((r) => r.label.trim() !== "" || r.value.trim() !== "");
  if (list.length === 0) return null;
  return (
    <section className="ov-sec">
      <SecTitle path={path} def={def} mark={mark} />
      <div className="iv-block reveal">
        <dl className="cond-dl">
          {list.map((r, i) => (
            <div key={i} style={{ display: "contents" }}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** 拠点（Googleマップ） */
function MapSec({ map }: { map?: { title: string; spots: string[] } }) {
  const spots = (map?.spots ?? []).map((s) => s.trim()).filter(Boolean);
  if (spots.length === 0) return null;
  return (
    <section className="ov-sec">
      <h2 className="section__title reveal">
        <Marked text={map?.title || "拠点（Googleマップ）"} mark="拠点" />
      </h2>
      <div className={"iv-block reveal"}>
        <div className={"ov-map" + (spots.length > 1 ? " ov-map--2" : "")}>
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
    </section>
  );
}

/** 選考の流れ（ピルの横並び） */
function FlowSec({ job, data }: { job: RecruitJob; data: RecruitView }) {
  const t: RecruitTimeline =
    job.flow && job.flow.steps?.length
      ? job.flow
      : { note: "", image: "", steps: (data.flow ?? []).filter((s) => s.trim() !== "").map((s, i) => ({ time: `STEP${i + 1}`, task: s })) };
  const steps = t.steps.filter((s) => s.task.trim() !== "");
  if (steps.length === 0) return null;
  return (
    <section className="ov-sec">
      <SecTitle path="recruit3:ov.flow.jp" def="選考の流れ" />
      <div className="flow flow--center reveal">
        {steps.map((s, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <FlowArrow />}
            <span className="flow__step">{s.task}</span>
          </span>
        ))}
      </div>
      {t.note && <p className="note flow__note reveal">{t.note}</p>}
    </section>
  );
}

/** よくある質問（カテゴリ＝アコーディオン。Q&A はカテゴリの中に一覧表示） */
function FaqSec({ items }: { items: { q: string; a: string; cat?: string }[] }) {
  const groups: { name: string; items: { q: string; a: string }[] }[] = [];
  for (const f of items) {
    if (f.q.trim() === "") continue;
    const name = (f.cat || "").trim() || "その他";
    const g = groups.find((x) => x.name === name);
    if (g) g.items.push(f);
    else groups.push({ name, items: [f] });
  }
  const single = groups.length === 1 && groups[0].name === "その他";
  const [open, setOpen] = useState<string[]>(single ? ["その他"] : []);
  if (groups.length === 0) return null;
  const toggle = (name: string) => setOpen((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));
  return (
    <section className="ov-sec">
      <SecTitle path="recruit3:ov.faq.jp" def="よくある質問" mark="質問" />
      <div className="accordion reveal" style={{ marginTop: 0 }}>
        {groups.map((g) => {
          const isOpen = open.includes(g.name);
          return (
            <div key={g.name} className={"acc" + (isOpen ? " is-open" : "")}>
              <button type="button" className="acc__head" aria-expanded={isOpen} onClick={() => toggle(g.name)}>
                <span className="acc__tag">FAQ</span>
                <span>{g.name}</span>
                <span className="acc__icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M10 3v14M3 10h14" /></svg>
                </span>
              </button>
              <div className="acc__panel" style={{ maxHeight: isOpen ? "none" : 0 }}>
                <div className="acc__body">
                  {g.items.map((f, i) => (
                    <div key={i} className="faq-item">
                      <div className="faq-item__q">
                        <span className="q">Q</span>
                        <span>{f.q}</span>
                      </div>
                      {f.a.trim() !== "" && <p className="faq-item__a">{f.a}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** エントリーフォーム（プロトタイプ：送信内容は保存されない） */
function EntryForm({ job, sectionRef }: { job: RecruitJob; sectionRef: React.RefObject<HTMLElement | null> }) {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("エントリーを受け付けました。担当者よりご連絡いたします。");
    (e.target as HTMLFormElement).reset();
  };
  return (
    <section ref={sectionRef as any} id="entry" className="section--tight">
      <form className="entry-form reveal" onSubmit={onSubmit}>
        <h2 className="section__title section__title--center" {...ed("recruit2:entry.jp", "エントリー 見出し")}>
          <Marked text={txt("recruit2:entry.jp", "エントリー")} />
        </h2>
        <p className="note entry-form__note" {...ed("recruit3:entry.note", "エントリー 注記")}>
          {txt("recruit3:entry.note", "下記フォームからご応募ください。担当者よりご連絡いたします。")}
        </p>
        <div className="field">
          <label className="field__label" htmlFor="rc-job">希望職種</label>
          <input type="text" id="rc-job" name="job" defaultValue={`${job.title}（${job.dept}）`} readOnly />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="rc-name">氏名 <span className="req">必須</span></label>
            <input type="text" id="rc-name" name="name" placeholder="例）山田 太郎" required />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="rc-kana">フリガナ</label>
            <input type="text" id="rc-kana" name="kana" placeholder="例）ヤマダ タロウ" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="rc-tel">電話番号</label>
            <input type="tel" id="rc-tel" name="tel" placeholder="例）086-000-0000" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="rc-email">メールアドレス <span className="req">必須</span></label>
            <input type="email" id="rc-email" name="email" placeholder="例）taro@example.com" required />
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="rc-message">志望動機・自己PR・ご質問など（任意）</label>
          <textarea id="rc-message" name="message" rows={5} placeholder="ご自由にお書きください" />
        </div>
        <div className="field">
          <label className="check">
            <input type="checkbox" required />
            <span>個人情報の取り扱いに同意する <span className="req">必須</span></span>
          </label>
        </div>
        <div className="entry-form__submit">
          <button className="btn btn--entry" type="submit">この内容でエントリーする</button>
        </div>
        <p className="note" style={{ textAlign: "center", marginTop: 16 }}>※ これはプロトタイプです。送信内容は保存されません。</p>
      </form>
    </section>
  );
}

export function JobOverlay({ job, data, onClose }: { job: RecruitJob; data: RecruitView; onClose: () => void }) {
  useBodyLock();
  const entryRef = useRef<HTMLElement | null>(null);
  const [showCta, setShowCta] = useState(false);
  const tag = deptTag(job);

  // Escape で閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 記事のエントリーリンク（&entry=1）から開かれたときはフォームまで自動スクロール
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("entry") !== "1") return;
    const t = window.setTimeout(() => entryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToEntry = () => entryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return createPortal(
    <div role="dialog" aria-modal="true" className="contents" onScrollCapture={(e) => setShowCta((e.target as HTMLElement).scrollTop > 240)}>
      {/* 背景は land モード（全面が緑の陸地・雪なし・文字は黒基調。2026-09 改修・デザイン支給 job/*.html 準拠） */}
      <RecruitFrame overlay land>
        {/* 上部バー（sticky）：部門タグ＋職種名＋閉じる＋エントリー */}
        <div className="ov-bar">
          <div className="ov-bar__inner">
            <span className={"acc__tag " + tag.cls} style={tag.style}>{job.dept}</span>
            <span className="ov-bar__title">{job.title}</span>
            {showCta && (
              <button type="button" className="btn btn--entry" onClick={scrollToEntry}>
                エントリー
              </button>
            )}
            <button type="button" className="ov-bar__close" aria-label="閉じる" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4l12 12M16 4L4 16" /></svg>
            </button>
          </div>
        </div>

        <section className="iv-hero ov-hero">
          <span className="kicker reveal" {...ed("recruit3:ov.kicker", "職種詳細 英字ラベル")}>{txt("recruit3:ov.kicker", "RECRUIT")}</span>
          <h1 className="iv-hero__catch reveal">
            <OutlineText text={job.title.replace(/（[^）]*）\s*$/, "")} />
          </h1>
          <p className="iv-hero__sub reveal">
            <span className={"acc__tag " + tag.cls} style={tag.style}>{job.dept}</span>
            {/（[^）]*）\s*$/.test(job.title) ? `　${job.title.match(/（([^）]*)）\s*$/)![1]}` : ""}
          </p>
        </section>

        <div className="container iv-body">
          {/* 仕事内容 */}
          <section className="ov-sec" style={{ marginTop: 0 }}>
            <SecTitle path="recruit3:ov.body.jp" def="仕事内容" />
            <div className={"iv-block iv-block--lead reveal" + (job.image ? " has-image" : "")}>
              <p style={{ whiteSpace: "pre-line" }}>{job.body}</p>
              {job.image && <ImageWithFallback src={job.image} alt={job.title} className="iv-block__img" />}
            </div>
          </section>

          <BlockSec block={job.daywork} defTitle="1日の仕事内容" base="daywork" />
          <BlockSec block={job.appeal} defTitle="やりがい・特徴" base="appeal" />
          <PointsSec pr={job.pr} defTitle="この仕事のPRポイント" mark="PRポイント" />
          <PointsSec pr={job.persona} defTitle="求める人物像" mark="人物像" />
          <PointsSec pr={job.invite} defTitle="こんな方であればぜひご応募ください" />
          <RowsSec rows={job.conditions?.length ? job.conditions : data.conditions} path="recruit3:ov.conditions.jp" def="諸条件" />
          <MapSec map={job.map} />
          <RowsSec rows={job.benefits?.length ? job.benefits : data.benefits} path="recruit3:ov.benefits.jp" def="福利厚生" />
          <FlowSec job={job} data={data} />
          <FaqSec items={data.faq} />

          {/* 職種別メッセージ（短文・大きな縁取り文字） */}
          {job.message.trim() !== "" && (
            <p className="ov-message reveal">
              <OutlineText text={job.message} />
            </p>
          )}

          <EntryForm job={job} sectionRef={entryRef} />

          <div className="iv-actions reveal">
            <button type="button" className="btn btn--corp" onClick={onClose}>
              募集職種一覧へ戻る
            </button>
          </div>
        </div>
      </RecruitFrame>
    </div>,
    document.body,
  );
}
