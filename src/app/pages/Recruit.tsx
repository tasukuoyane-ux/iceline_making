import { useState, FormEvent } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, MapPin, PlayCircle, Clock, Upload, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG } from "../data/images";
import { ed, edImg, txt, img } from "../lib/editable";
import profileSlides from "../../content/profileSlides.json";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  RECRUIT_MV,
  RECRUIT_BIZ,
  RECRUIT_PHILOSOPHY,
  RECRUIT_LOCATIONS,
  RECRUIT_CHARM,
  RECRUIT_DAYS,
  RECRUIT_APPLY,
  RECRUIT_JOBS,
  RECRUIT_TERMS,
  RECRUIT_CONDITIONS,
  RECRUIT_FLOW,
  RECRUIT_FAQ,
  INTERVIEWS,
} from "../data/recruit";

function RecruitHero() {
  return (
    <section className="relative flex min-h-[88vh] w-full items-center overflow-hidden bg-ink">
      <ImageWithFallback src={img("recruit:heroImage", IMG.team1)} alt="採用" className="absolute inset-0 h-full w-full object-cover opacity-45" {...edImg("recruit:heroImage", "採用ヒーロー画像")} />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/70 to-brand/30" />
      <div className="relative mx-auto w-full max-w-[1400px] px-5 py-24 pc:px-8">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
          <p className="mb-6 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.2em", fontSize: 14 }}>
            RECRUIT 2027
          </p>
          <h1 className="text-white" style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.15, letterSpacing: "0.01em" }}>
            笑顔と、正直さ。<br />ただ、それだけ。
          </h1>
          <p className="mt-8 max-w-xl text-white/85" style={{ fontSize: 17, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed("sections:recruitMv.sub")}>{RECRUIT_MV.sub}</p>
        </motion.div>
      </div>
    </section>
  );
}

// 一日の流れ・職種ごとの画像（タブ順：食品営業／アイス製造／品質管理）
const DAY_IMAGES = [IMG.kitchen, IMG.iceMacro, IMG.worker2];

// 開閉トグル（インデックス配列）
const toggleIndex = (arr: number[], i: number) =>
  arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i];

export function Recruit() {
  const [dayRole, setDayRole] = useState(0);
  const [openCond, setOpenCond] = useState<number[]>([]);
  const [openFaq, setOpenFaq] = useState<number[]>([]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("エントリーを受け付けました。担当者よりご連絡いたします。");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <>
      <RecruitHero />

      {/* 採用メッセージ（MV本文） */}
      <Section heat={HEAT.recruitMv} className="!bg-[#666666]">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center pc:max-w-[90%]"
          style={{ fontSize: 19, lineHeight: 2.4, fontWeight: 500, whiteSpace: "pre-line" }}
          {...ed("sections:recruitMv.body")}
        >
          {RECRUIT_MV.body}
        </motion.p>
      </Section>

      {/* 会社を知る｜企業理念 */}
      <Section heat={HEAT.recruitPhilosophy} contained={false}>
        <div className="mx-auto max-w-[1400px] px-5 pc:px-8">
          <SectionTitle en="OUR CREED" jp="企業理念" align="center" />
          <p className="mx-auto mt-8 max-w-3xl text-center text-brand" style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.8 }} {...ed("recruit:philosophy.creed", "企業理念キャッチ")}>
            {txt("recruit:philosophy.creed", RECRUIT_PHILOSOPHY.creed)}
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-center text-foreground/80" style={{ fontSize: 15, lineHeight: 2.2, whiteSpace: "pre-line" }} {...ed("recruit:philosophy.body", "企業理念本文", { multiline: true })}>
            {txt("recruit:philosophy.body", RECRUIT_PHILOSOPHY.body)}
          </p>
        </div>
      </Section>

      {/* 会社を知る｜事業紹介 */}
      <Section heat={HEAT.recruitBiz}>
        <SectionTitle en="ABOUT US" jp="事業紹介" />
        <div className="mt-12 space-y-10">
          {RECRUIT_BIZ.map((b, i) => (
            <motion.div
              key={b.dept}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid items-center gap-8 rounded-2xl border border-border bg-card p-8 pc:grid-cols-2 pc:p-12 ${i % 2 ? "pc:[direction:rtl]" : ""}`}
            >
              <div className="[direction:ltr]">
                <span className="text-brand" style={{ fontSize: 13, fontWeight: 700 }} {...ed(`recruit:biz.${i}.dept`, "事業部門名")}>{txt(`recruit:biz.${i}.dept`, b.dept)}</span>
                <h3 className="mt-2 text-brand" style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.4 }} {...ed(`recruit:biz.${i}.mission`, "事業ミッション")}>{txt(`recruit:biz.${i}.mission`, b.mission)}</h3>
                <p className="mt-5 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed(`recruit:biz.${i}.body`, "事業本文", { multiline: true })}>{txt(`recruit:biz.${i}.body`, b.body)}</p>
              </div>
              <ImageWithFallback
                src={img(`recruit:biz.${i}.image`, i % 2 ? IMG.iceMacro : IMG.foodPlate)}
                alt={b.mission}
                className="aspect-[4/3] w-full rounded-2xl object-cover [direction:ltr]"
                {...edImg(`recruit:biz.${i}.image`, "事業画像")}
              />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 会社を知る｜拠点情報 */}
      <Section heat={HEAT.recruitLocation}>
        <SectionTitle en="LOCATIONS" jp="拠点情報" />
        <div className="mt-10 grid gap-5 tab:grid-cols-3">
          {RECRUIT_LOCATIONS.map((l, i) => (
            <div key={l.name} className="rounded-xl border border-border bg-card p-6">
              <MapPin className="text-brand" size={22} />
              <h3 className="mt-3" style={{ fontSize: 17, fontWeight: 700 }} {...ed(`recruit:locations.${i}.name`, "拠点名")}>{txt(`recruit:locations.${i}.name`, l.name)}</h3>
              <p className="mt-2 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.8 }} {...ed(`recruit:locations.${i}.address`, "拠点住所")}>{txt(`recruit:locations.${i}.address`, l.address)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 仕事を知る｜仕事の魅力 */}
      <Section heat={HEAT.recruitCharm} contained={false}>
        <div className="mx-auto max-w-[1400px] px-5 pc:px-8">
          <SectionTitle en="OUR CULTURE" jp="仕事の魅力" />
          <div className="mt-12 space-y-6">
            {RECRUIT_CHARM.map((c, i) => (
              <motion.div
                key={c.no}
                initial={{ opacity: 0, x: i % 2 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col gap-4 rounded-2xl bg-secondary p-8 tab:flex-row tab:items-start tab:gap-8 ${i % 2 ? "tab:ml-auto tab:max-w-3xl" : "tab:max-w-3xl"}`}
              >
                <span className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{c.no}</span>
                <div>
                  <h3 style={{ fontSize: 21, fontWeight: 700 }} {...ed(`recruit:charm.${i}.title`, "仕事の魅力タイトル")}>{txt(`recruit:charm.${i}.title`, c.title)}</h3>
                  <p className="mt-3 text-foreground/80" style={{ fontSize: 15, lineHeight: 2.1, whiteSpace: "pre-line" }} {...ed(`recruit:charm.${i}.body`, "仕事の魅力本文", { multiline: true })}>{txt(`recruit:charm.${i}.body`, c.body)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* 仕事を知る｜一日の流れ（職種タブ切替・PCは右に画像） */}
      <Section heat={HEAT.recruitDay}>
        <SectionTitle en="A DAY" jp="一日の流れ" />
        <div className="mt-8 flex flex-wrap gap-2">
          {RECRUIT_DAYS.map((d, i) => (
            <button
              key={d.role}
              type="button"
              onClick={() => setDayRole(i)}
              className={`rounded-full border px-5 py-2 transition-colors ${dayRole === i ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand"}`}
              style={{ fontSize: 13, fontWeight: 700 }}
              {...ed(`recruit:days.${i}.role`, "職種名")}
            >
              {txt(`recruit:days.${i}.role`, d.role)}
            </button>
          ))}
        </div>
        {/* 全タブをDOMに保持し、非選択タブは hidden（管理コンソールで全タブ編集可能にするため） */}
        {RECRUIT_DAYS.map((d, di) => (
          <div
            key={d.role}
            className={di === dayRole ? "mt-8 grid gap-10 pc:grid-cols-2 pc:items-stretch" : "hidden"}
          >
            {/* 左：その職種のタイムライン */}
            <div>
              <p className="inline-flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 14 }}>
                <Clock size={15} className="text-brand" /> <span {...ed(`recruit:days.${di}.note`, `勤務メモ（${d.role}）`)}>{txt(`recruit:days.${di}.note`, d.note)}</span>
              </p>
              <ol className="mt-8 space-y-0 border-l-2 border-brand/30 pl-6">
                {d.steps.map((s, i) => (
                  <li key={i} className="relative mb-7 last:mb-0">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand" />
                    <div className="flex flex-col gap-1 tab:flex-row tab:gap-6">
                      <span className="w-16 text-brand" style={{ fontSize: 14, fontWeight: 700 }} {...ed(`recruit:days.${di}.steps.${i}.time`, "時刻")}>{txt(`recruit:days.${di}.steps.${i}.time`, s.time)}</span>
                      <p style={{ fontSize: 15, lineHeight: 1.8 }} {...ed(`recruit:days.${di}.steps.${i}.task`, "業務")}>{txt(`recruit:days.${di}.steps.${i}.task`, s.task)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            {/* 右：画像（PCのみ・タブごとに切替／下端をol下端に合わせる） */}
            <div className="hidden pc:relative pc:block">
              <ImageWithFallback
                src={img(`recruit:days.${di}.image`, DAY_IMAGES[di])}
                alt={d.role}
                className="rounded-2xl object-cover pc:absolute pc:inset-0 pc:h-full pc:w-full"
                {...edImg(`recruit:days.${di}.image`, `一日の流れ画像（${d.role}）`)}
              />
            </div>
          </div>
        ))}
      </Section>

      {/* 数字で見るアイスライン */}
      <Section heat={HEAT.recruitDeck} contained={false}>
        <div className="mx-auto max-w-[1400px] px-5 pc:px-8">
          <div className="rounded-[2rem] bg-[#666666] p-10 text-white pc:p-16">
            <SectionTitle en="COMPANY DECK" jp="数字で見るアイスライン" invert />
            <div className="mt-10 grid grid-cols-2 gap-8 pc:grid-cols-4">
              {[
                { n: "120", u: "年", l: "創業からの歴史" },
                { n: "5,000", u: "品目超", l: "商品ラインアップ" },
                { n: "47", u: "都道府県", l: "氷が届く範囲" },
                { n: "FSSC", u: "/ISO", l: "認証取得" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
                    {s.n}<span className="text-white/70" style={{ fontSize: 18 }}>{s.u}</span>
                  </div>
                  <p className="mt-2 text-white/70" style={{ fontSize: 13 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 会社紹介資料（PowerPoint）カルーセル：手動スクロール・各スライド80%幅 */}
      <Section heat={HEAT.recruitDeck}>
        <SectionTitle en="COMPANY PROFILE" jp="会社紹介資料" />
        <p className="mt-4 text-muted-foreground" style={{ fontSize: 14 }}>
          スライドを横スクロールでご覧いただけます。
        </p>
        <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {(profileSlides as string[]).map((url, i) =>
            url ? (
              <div key={i} className="aspect-video w-[80%] shrink-0 snap-center overflow-hidden rounded-xl border border-border bg-secondary/50">
                <ImageWithFallback src={url} alt={`会社紹介資料 ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div
                key={i}
                className="flex aspect-video w-[80%] shrink-0 snap-center flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/50 text-center"
              >
                <span className="text-muted-foreground/60" style={{ fontFamily: "var(--font-accent)", fontSize: 40, fontWeight: 700 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-2 text-muted-foreground" style={{ fontSize: 12 }}>スライド差し替え用プレイスホルダー</span>
              </div>
            )
          )}
        </div>
        <p className="mt-2 text-muted-foreground/80" style={{ fontSize: 11 }}>
          ※ パワーポイント資料の画像（16:9）を管理コンソールの「会社紹介資料」から追加できます。
        </p>
      </Section>

      {/* 人を知る｜インタビュー＆動画 */}
      <Section heat={HEAT.recruitPeople}>
        <SectionTitle en="PEOPLE" jp="人を知る" />
        {/* 公開済みの記事をすべて横スクロールのカルーセルで表示（カードデザインは現状維持） */}
        <div className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
          {INTERVIEWS.map((iv) => (
            <Link
              key={iv.id}
              to={`/recruit/interview/${iv.id}`}
              className="group relative w-[80%] shrink-0 snap-start overflow-hidden rounded-2xl tab:w-[360px] pc:w-[400px]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <ImageWithFallback src={iv.image} alt={iv.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" {...edImg(`interviews:${iv.id}:image`)} />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/85 to-transparent p-7">
                <p className="text-brand" style={{ fontSize: 13, fontWeight: 700 }}>INTERVIEW</p>
                <h3 className="mt-1 text-white" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4 }} {...ed(`interviews:${iv.id}:lead`, "タイトル")}>{iv.lead}</h3>
                {iv.subtitle && (
                  <p className="mt-2 text-white/80" style={{ fontSize: 13, lineHeight: 1.6 }} {...ed(`interviews:${iv.id}:subtitle`, "サブタイトル")}>{iv.subtitle}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-white" style={{ fontSize: 13 }}>
                  記事を読む <ArrowUpRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/videos" className="mt-8 inline-flex items-center gap-2 text-brand" style={{ fontSize: 14 }}>
          <PlayCircle size={18} /> ドキュメンタリー動画も見る
        </Link>
      </Section>

      {/* 募集要項｜応募を促すコピー */}
      <Section heat={HEAT.recruitApply} contained={false}>
        <div className="mx-auto max-w-[1400px] px-5 pc:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center">
            <p className="text-brand" style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.4 }} {...ed("sections:recruitApply.copy")}>{RECRUIT_APPLY.copy}</p>
            <p className="mx-auto mt-6 max-w-2xl text-foreground/80" style={{ fontSize: 15, lineHeight: 2.2, whiteSpace: "pre-line" }} {...ed("sections:recruitApply.body")}>{RECRUIT_APPLY.body}</p>
          </motion.div>
        </div>
      </Section>

      {/* 募集要項｜業務内容 */}
      <Section heat={HEAT.recruitJob}>
        <SectionTitle en="POSITIONS" jp="募集職種" />
        <div className="mt-10 grid gap-6 tab:grid-cols-2">
          {RECRUIT_JOBS.map((j, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-7">
              <span className="text-muted-foreground" style={{ fontSize: 12 }} {...ed(`recruit:jobs.${i}.dept`, "募集部門")}>{txt(`recruit:jobs.${i}.dept`, j.dept)}</span>
              <h3 className="mt-1 text-brand" style={{ fontSize: 18, fontWeight: 700 }} {...ed(`recruit:jobs.${i}.role`, "募集職種")}>{txt(`recruit:jobs.${i}.role`, j.role)}</h3>
              <p className="mt-3 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`recruit:jobs.${i}.body`, "募集職種本文", { multiline: true })}>{txt(`recruit:jobs.${i}.body`, j.body)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 待遇・勤務地（H3アコーディオン） */}
      <Section heat={HEAT.recruitJob}>
        <SectionTitle en="BENEFITS" jp="待遇・勤務地" />
        <p
          className="mt-6 max-w-3xl text-foreground/80"
          style={{ fontSize: 15, lineHeight: 2.1 }}
          {...ed("sections:recruitConditions.lead", "待遇リード", { multiline: true })}
        >
          {RECRUIT_CONDITIONS.lead}
        </p>
        <div className="mt-8 space-y-3">
          {RECRUIT_CONDITIONS.groups.map((g, gi) => {
            const open = openCond.includes(gi);
            return (
              <div key={gi} className="overflow-hidden rounded-xl border border-border">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenCond((a) => toggleIndex(a, gi))}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 bg-card px-6 py-4 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span className="text-brand" style={{ fontSize: 16, fontWeight: 700 }} {...ed(`sections:recruitConditions.groups.${gi}.heading`, "見出し")}>
                      {g.heading}
                    </span>
                    <ChevronDown size={20} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </h3>
                <dl className={open ? "block divide-y divide-border/60 border-t border-border bg-background px-6" : "hidden"}>
                  {g.items.map((it, ii) => (
                    <div key={ii} className="py-4">
                      <dt style={{ fontSize: 14, fontWeight: 700 }} {...ed(`sections:recruitConditions.groups.${gi}.items.${ii}.term`, "項目")}>
                        {it.term}
                      </dt>
                      <dd className="mt-1 text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.9 }} {...ed(`sections:recruitConditions.groups.${gi}.items.${ii}.desc`, "説明", { multiline: true })}>
                        {it.desc}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 募集要項｜諸条件 */}
      <Section heat={HEAT.recruitTerms}>
        <SectionTitle en="CONDITIONS" jp="諸条件" />
        <table className="mt-8 w-full border-t border-border">
          <tbody>
            {RECRUIT_TERMS.map((r, i) => (
              <tr key={r.label} className="border-b border-border align-top">
                <th className="w-40 bg-secondary px-5 py-4 text-left text-muted-foreground" style={{ fontSize: 14, fontWeight: 500 }}>{r.label}</th>
                <td className="px-5 py-4" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`recruit:terms.${i}.value`, "募集要項内容", { multiline: true })}>{txt(`recruit:terms.${i}.value`, r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* 選考フロー */}
      <Section heat={HEAT.recruitDay}>
        <SectionTitle en="FLOW" jp="選考フロー" />
        <p
          className="mt-6 max-w-3xl text-foreground/80"
          style={{ fontSize: 15, lineHeight: 2.1 }}
          {...ed("sections:recruitFlow.lead", "選考フローリード", { multiline: true })}
        >
          {RECRUIT_FLOW.lead}
        </p>
        <ol className="mt-10 border-l-2 border-brand/30 pl-7">
          {RECRUIT_FLOW.steps.map((s, i) => (
            <li key={i} className="relative mb-8 last:mb-0">
              <span
                className="absolute -left-[34px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-brand-foreground"
                style={{ fontFamily: "var(--font-accent)", fontSize: 10, fontWeight: 700 }}
              >
                {s.no}
              </span>
              <h3 className="text-brand" style={{ fontSize: 17, fontWeight: 700 }} {...ed(`sections:recruitFlow.steps.${i}.title`, "ステップ名")}>
                {s.title}
              </h3>
              <p className="mt-2 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9 }} {...ed(`sections:recruitFlow.steps.${i}.body`, "ステップ説明", { multiline: true })}>
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* よくある質問（H3アコーディオン） */}
      <Section heat={HEAT.recruitTerms}>
        <SectionTitle en="FAQ" jp="よくある質問" />
        <div className="mt-8 space-y-3">
          {RECRUIT_FAQ.items.map((f, i) => {
            const open = openFaq.includes(i);
            return (
              <div key={i} className="overflow-hidden rounded-xl border border-border">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenFaq((a) => toggleIndex(a, i))}
                    aria-expanded={open}
                    className="flex w-full items-start justify-between gap-3 bg-card px-6 py-4 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex gap-2">
                      <span className="text-brand" style={{ fontSize: 15, fontWeight: 700 }}>Q.</span>
                      <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6 }} {...ed(`sections:recruitFaq.items.${i}.q`, "質問")}>
                        {f.q}
                      </span>
                    </span>
                    <ChevronDown size={20} className={`mt-0.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </h3>
                <div className={open ? "block border-t border-border bg-background px-6 py-4" : "hidden"}>
                  <div className="flex gap-2">
                    <span className="text-brand" style={{ fontSize: 15, fontWeight: 700 }}>A.</span>
                    <p className="text-foreground/80" style={{ fontSize: 14, lineHeight: 1.95 }} {...ed(`sections:recruitFaq.items.${i}.a`, "回答", { multiline: true })}>
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* エントリーフォーム */}
      <Section heat={HEAT.recruitForm} contained={false}>
        <div className="mx-auto max-w-2xl px-5">
          <SectionTitle en="ENTRY" jp="エントリー" align="center" />
          <form onSubmit={onSubmit} className="mt-10 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="r-name">お名前 <span className="text-brand">*</span></Label>
              <Input id="r-name" required placeholder="山田 太郎" />
            </div>
            <div className="grid gap-2 tab:grid-cols-2 tab:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="r-email">メールアドレス <span className="text-brand">*</span></Label>
                <Input id="r-email" type="email" required placeholder="example@mail.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-tel">電話番号</Label>
                <Input id="r-tel" placeholder="090-0000-0000" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-resume">履歴書アップロード</Label>
              <label
                htmlFor="r-resume"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-4 text-muted-foreground transition-colors hover:border-brand"
              >
                <Upload size={18} className="shrink-0 text-brand" />
                <span style={{ fontSize: 13, lineHeight: 1.6 }}>
                  履歴書・職務経歴書をアップロード
                  <span className="block text-muted-foreground/80" style={{ fontSize: 11 }}>PDF / Word / 画像（5MBまで）</span>
                </span>
              </label>
              <Input id="r-resume" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-msg">メッセージ</Label>
              <Textarea id="r-msg" rows={5} placeholder="志望動機やご質問などをご記入ください" />
            </div>
            <Button type="submit" className="w-full bg-brand text-brand-foreground hover:bg-brand-dark" style={{ height: 52 }}>
              この内容で送信する <ArrowRight size={18} />
            </Button>
            <p className="text-center text-muted-foreground" style={{ fontSize: 12 }}>
              ※ これはプロトタイプです。送信内容は保存されません。
            </p>
          </form>
        </div>
      </Section>
    </>
  );
}
