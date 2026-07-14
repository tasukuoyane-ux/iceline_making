// 採用ページ 第3案（プレイグラウンド）。
// デザインを作り込まず、装飾を最小限にした「プレーン」な土台。
// ここを起点に採用ページのレイアウト・演出を自由に試すための実験用ページ。
//
// - 文言・画像は recruit3: プレフィックスの汎用オーバーライドで管理コンソールから編集可能
// - データは既存の RECRUIT_* を流用（data/recruit.ts）
// - 配色や装飾は付けず、デザイントークン（background / foreground / muted 等）のみ使用
import { FormEvent, ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ed, edImg, txt } from "../lib/editable";
import {
  RECRUIT_MV,
  RECRUIT_BIZ,
  RECRUIT_PHILOSOPHY,
  RECRUIT_JOBS,
  RECRUIT_TERMS,
  RECRUIT_APPLY,
  INTERVIEWS,
} from "../data/recruit";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

// 差し替え用プレースホルダー（グレー枠）
const PH =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='#eef0f2'/><text x='50%' y='50%' font-size='28' fill='#9aa4ad' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>＋ 画像</text></svg>"
  );

// セクションの共通ラッパー（中央寄せ・上下余白のみ）
function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-16 pc:py-20">{children}</div>
    </section>
  );
}

// セクション見出し（EN小見出し ＋ 日本語見出し）
function Heading({ base, en, jp }: { base: string; en: string; jp: string }) {
  return (
    <header className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{en}</p>
      <h2
        className="mt-2 text-2xl font-bold text-foreground pc:text-3xl"
        {...ed(`${base}.jp`, "見出し")}
      >
        {txt(`${base}.jp`, jp)}
      </h2>
    </header>
  );
}

// ヒーロー（プレーン）
function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-24 pc:py-28">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          RECRUIT
        </p>
        <h1
          className="mt-4 text-3xl font-bold leading-tight text-foreground pc:text-5xl"
          style={{ whiteSpace: "pre-line" }}
          {...ed("recruit3:mv.main", "メインコピー", { multiline: true })}
        >
          {txt("recruit3:mv.main", RECRUIT_MV.main)}
        </h1>
        <p
          className="mt-6 max-w-2xl text-sm leading-loose text-muted-foreground pc:text-base"
          style={{ whiteSpace: "pre-line" }}
          {...ed("recruit3:mv.sub", "サブコピー")}
        >
          {txt("recruit3:mv.sub", RECRUIT_MV.sub)}
        </p>
        <a
          href="#recruit3-entry"
          className="mt-10 inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background"
        >
          エントリーする <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

// 事業紹介
function Business() {
  return (
    <Section>
      <Heading base="recruit3:biz" en="BUSINESS" jp="事業を知る" />
      <div className="grid gap-8 tab:grid-cols-2">
        {RECRUIT_BIZ.map((b, i) => (
          <article key={b.dept} className="rounded-lg border border-border p-6">
            <p className="text-xs font-semibold text-muted-foreground">{b.dept}</p>
            <h3
              className="mt-2 text-lg font-bold text-foreground"
              {...ed(`recruit3:biz.${i}.mission`, "ミッション")}
            >
              {txt(`recruit3:biz.${i}.mission`, b.mission)}
            </h3>
            <p
              className="mt-3 text-sm leading-loose text-muted-foreground"
              {...ed(`recruit3:biz.${i}.body`, "本文", { multiline: true })}
            >
              {txt(`recruit3:biz.${i}.body`, b.body)}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}

// 理念
function Philosophy() {
  return (
    <Section>
      <Heading base="recruit3:philosophy" en="PHILOSOPHY" jp="私たちの考え" />
      <blockquote
        className="border-l-2 border-foreground pl-6 text-xl font-bold leading-relaxed text-foreground"
        {...ed("recruit3:philosophy.creed", "信条")}
      >
        {txt("recruit3:philosophy.creed", RECRUIT_PHILOSOPHY.creed)}
      </blockquote>
      <p
        className="mt-6 text-sm leading-loose text-muted-foreground"
        {...ed("recruit3:philosophy.body", "本文", { multiline: true })}
      >
        {txt("recruit3:philosophy.body", RECRUIT_PHILOSOPHY.body)}
      </p>
    </Section>
  );
}

// 募集職種
function Jobs() {
  return (
    <Section>
      <Heading base="recruit3:jobs" en="JOBS" jp="募集職種" />
      <div className="grid gap-4">
        {RECRUIT_JOBS.map((j, i) => (
          <article key={`${j.dept}-${j.role}`} className="rounded-lg border border-border p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-semibold text-muted-foreground">{j.dept}</span>
              <h3 className="text-base font-bold text-foreground">{j.role}</h3>
            </div>
            <p
              className="mt-3 text-sm leading-loose text-muted-foreground"
              {...ed(`recruit3:jobs.${i}.body`, "職種説明", { multiline: true })}
            >
              {txt(`recruit3:jobs.${i}.body`, j.body)}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}

// 社員インタビュー
function People() {
  return (
    <Section>
      <Heading base="recruit3:people" en="PEOPLE" jp="人を知る" />
      <div className="grid gap-6 tab:grid-cols-3">
        {INTERVIEWS.map((iv) => (
          <Link
            key={iv.id}
            to={`/recruit/interview/${iv.id}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border"
          >
            <div className="aspect-[4/3] overflow-hidden bg-secondary">
              <ImageWithFallback
                src={iv.image || PH}
                alt={iv.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                {...edImg(`interviews:${iv.id}:image`)}
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-bold leading-snug text-foreground">{iv.lead}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{iv.name}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                記事を読む <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

// 諸条件
function Terms() {
  return (
    <Section>
      <Heading base="recruit3:term" en="CONDITIONS" jp="諸条件" />
      <table className="w-full border-collapse">
        <tbody>
          {RECRUIT_TERMS.map((r, i) => (
            <tr key={r.label} className="border-b border-border align-top">
              <th className="w-40 py-4 pr-4 text-left text-sm font-semibold text-foreground">
                {r.label}
              </th>
              <td className="py-4 text-sm leading-relaxed text-muted-foreground">
                <span {...ed(`recruit3:term.${i}.value`, "内容", { multiline: true })}>
                  {txt(`recruit3:term.${i}.value`, r.value)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

// 応募CTA ＋ エントリーフォーム
function Entry() {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("エントリーを受け付けました。担当者よりご連絡いたします。");
    (e.target as HTMLFormElement).reset();
  };
  return (
    <section id="recruit3-entry">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <p
          className="text-center text-2xl font-bold leading-relaxed text-foreground"
          style={{ whiteSpace: "pre-line" }}
          {...ed("recruit3:apply.copy", "応募コピー", { multiline: true })}
        >
          {txt("recruit3:apply.copy", RECRUIT_APPLY.copy)}
        </p>
        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="r3-name">お名前 *</Label>
            <Input id="r3-name" required placeholder="山田 太郎" />
          </div>
          <div className="grid gap-2 tab:grid-cols-2 tab:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="r3-email">メールアドレス *</Label>
              <Input id="r3-email" type="email" required placeholder="example@mail.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r3-tel">電話番号</Label>
              <Input id="r3-tel" placeholder="090-0000-0000" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r3-msg">メッセージ</Label>
            <Textarea id="r3-msg" rows={5} placeholder="志望動機やご質問などをご記入ください" />
          </div>
          <Button type="submit" className="w-full" style={{ height: 48 }}>
            この内容で送信する <ArrowRight size={16} />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            ※ これはプロトタイプです。送信内容は保存されません。
          </p>
        </form>
      </div>
    </section>
  );
}

export function Recruit3() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Business />
      <Philosophy />
      <Jobs />
      <People />
      <Terms />
      <Entry />
    </div>
  );
}
