// 採用トップ（/recruit）。デザイン支給 index.html の構成を、現行コンテンツ（overrides.json の
// recruit3:* / recruit2:mv.title、Payload の採用記事、採用タブの職種データ、動画管理）で描画する。
//
// セクション構成（デザイン準拠）:
//   ① メインコピー → ② アイスラインとは？ → ③ 数字で見る（ここから陸地） → ④ アイスラインの仕事
//   → ⑤ カルチャー → ⑥ 人を知る → 埋め込み動画（CMSで設定時） → ⑦ カンパニーデック
//   → ⑧ 募集職種一覧 → ⑨ 動画
// 文章・画像はすべてコンソール（ページ編集）で差し替えられる（編集パスは旧ページから引き継ぎ）。
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { RichBody } from "../components/common/RichBody";
import { EDIT_MODE, ed, edImg, img, repeatSel, txt } from "../lib/editable";
import { useRecruitData } from "../lib/recruitStore";
import { useInterviews } from "../data/interviews";
import { VIDEOS, type VideoItem } from "../data/news";
import { toEmbed } from "../lib/video";
import { RecruitFrame } from "./RecruitFrame";
import { Doodle, Marked, OutlineText, PersonArt, PlayIcon, StatIcon, Venn } from "./parts";
import { JobOverlay } from "./JobOverlay";
import { deptTag } from "./jobTag";

/** 画像未設定時のプレースホルダー（編集モードで枠を見せる用） */
export const PH =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='#eef4f7'/><text x='50%' y='50%' font-size='30' fill='#9fb6c0' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>＋ 画像</text></svg>",
  );

/** 見出し（h2）。mark の部分に波線マーカー。文言はコンソールで編集可 */
function Title({ path, def, mark, label = "見出し" }: { path: string; def: string; mark?: string; label?: string }) {
  return (
    <h2 className="section__title reveal" {...ed(path, label)}>
      <Marked text={txt(path, def)} mark={mark} />
    </h2>
  );
}

/** 英字キッカー（CULTURE / PEOPLE 等。リファレンス由来のラベル） */
function Kicker({ path, def }: { path: string; def: string }) {
  return (
    <span className="kicker reveal" {...ed(path, "英字ラベル")}>
      {txt(path, def)}
    </span>
  );
}

/* ═══════════════ ① メインコピー ═══════════════ */
function Hero() {
  const title = txt("recruit2:mv.title", "すなおな心で、一歩ずつ。\n必要なのは、笑顔とまっすぐさ。");
  const h3 = txt("recruit3:mv.h3", "");
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        {/* あしらいは「つらら列」以外すべて削除（2026-09 改修・デザイン支給の更新） */}
        <Doodle kind="drips" style={{ bottom: "22%", right: "4%" }} />
        <h1 className="hero__copy reveal" {...ed("recruit2:mv.title", "キャッチコピー", { multiline: true })}>
          <OutlineText text={title} accentLast />
        </h1>
        <RichBody
          path="recruit3:mv.subcopy"
          text={txt("recruit3:mv.subcopy", "つくった自分より、そのままの自分。\nそこから、すべてがはじまります。")}
          label="MV サブコピー"
          className="hero__sub reveal"
        />
        {(h3 !== "" || EDIT_MODE) && (
          <RichBody path="recruit3:mv.h3" text={h3 || "（小見出し）"} label="MV 小見出し（任意）" className="hero__sub reveal" style={{ marginTop: 16 }} />
        )}
        <RichBody
          path="recruit3:mv.p"
          text={txt("recruit3:mv.p", "つまずいたときに、話せるか。\nかくさなくていい場所で、\nこまったことは、声に出して。\n\nここから先を、\nいっしょにつくっていきましょう。")}
          label="MV 本文"
          className="hero__body reveal"
        />
      </div>
      <div className="hero__side" aria-hidden>
        Scroll
      </div>
    </section>
  );
}

/* ═══════════════ ② アイスラインとは？ ═══════════════ */
function About() {
  return (
    <section className="section" id="business">
      <div className="container">
        <Doodle kind="drips" style={{ top: -18, left: "14%" }} />
        <Title path="recruit3:about.title" def="アイスラインとは？" mark="アイスライン" />
        <RichBody
          path="recruit3:about.body"
          text={txt("recruit3:about.body", "アイスラインは氷・食・物流の3つの要素から、人の生活を築き上げてきました。\n毎日の食卓の安心を届けることが、私たちの使命です。")}
          label="本文"
          className="text-block text-block--center reveal"
        />
        {/* 図版：氷・食・物流のベン図（デザイン支給のインラインSVG。CMSの画像設定は使わない。2026-09 改修） */}
        <Venn />
      </div>
    </section>
  );
}

/* ═══════════════ ③ 数字で見るアイスライン ═══════════════ */
const MAX_STATS = 12;
/** デザイン支給のイラストアイコンがある枚数（1〜5枚目） */
const STAT_DEFAULTS_ICONS = 5;
const STAT_DEFAULTS = [
  { circle: "創業 [[特大,red:121]] 年", h3: "明治38年、天然氷の販売から", p: "明治38年（1905年）、天然氷の販売から始まりました。氷を扱う技術を軸に、食品卸や物流へと事業を広げながら、120年以上にわたって岡山の食を支えています。" },
  { circle: "[[特大,red:40]] 期連続黒字", h3: "自己資本比率は52.8%", p: "外部環境が揺れるなかでも、40期連続で黒字が続いています。" },
  { circle: "売上 [[特大,red:86]] 億円", h3: "4つの事業で着実に成長", p: "氷・氷菓の製造販売と業務用食材の卸という二本柱に、冷凍冷蔵倉庫とドライアイスを加えた4事業で、着実に成長してきました。" },
];
/** 数字への注釈の既定値（4枚目＝昇給3年連続の「※一部職種例外あり」。デザイン支給準拠・コンソールで編集可） */
const STAT_NOTE_DEFAULTS: Record<number, string> = { 3: "※一部職種例外あり" };

function Stats() {
  const rep = repeatSel("recruit3:stats.count", 3, MAX_STATS, "数字タイルの数");
  return (
    <section className="section on-land" id="data">
      <div className="container">
        <Title path="recruit3:stats.head.jp" def="数字で見るアイスライン" mark="数字" />
        <div className="stats" data-reveal-group {...rep.attrs}>
          {Array.from({ length: MAX_STATS }, (_, i) => {
            const base = `recruit3:stats.${i}`;
            const d = STAT_DEFAULTS[i] ?? { circle: "（数字）", h3: "（見出し）", p: "（本文）" };
            // アイコン：先頭5枚はデザイン支給のイラスト（創業・黒字・売上・昇給・定着）を常に使う。
            // 6枚目以降はコンソールで画像を設定すればそれを、無ければイラストを順繰りに表示（2026-09 改修）
            const icon = i >= STAT_DEFAULTS_ICONS ? img(`${base}.image`, "") : "";
            const note = txt(`${base}.note`, STAT_NOTE_DEFAULTS[i] ?? "");
            return (
              <div key={i} className="stat reveal">
                <div className="stat__icon">
                  {i >= STAT_DEFAULTS_ICONS && (icon !== "" || EDIT_MODE) ? (
                    <ImageWithFallback src={icon || PH} alt="" {...edImg(`${base}.image`, `数字タイル${i + 1} アイコン画像`)} />
                  ) : (
                    <StatIcon index={i} />
                  )}
                </div>
                <RichBody path={`${base}.circle`} text={txt(`${base}.circle`, d.circle)} label={`数字タイル${i + 1} 数字テキスト`} className="stat__number" />
                <div className="stat__label" {...ed(`${base}.h3`, `数字タイル${i + 1} 見出し`)}>
                  {txt(`${base}.h3`, d.h3)}
                </div>
                {/* 数字への注釈（任意。例：昇給の「※一部職種例外あり」） */}
                {(note !== "" || EDIT_MODE) && (
                  <div className="stat__note" {...ed(`${base}.note`, `数字タイル${i + 1} 注釈（任意）`)}>
                    {note || "（注釈・任意）"}
                  </div>
                )}
                <p className="stat__desc" style={{ whiteSpace: "pre-line" }} {...ed(`${base}.p`, `数字タイル${i + 1} 本文`, { multiline: true })}>
                  {txt(`${base}.p`, d.p)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ ④ アイスラインの仕事 ═══════════════ */
function Work() {
  const poemTitle = txt("recruit3:work.poemTitle", "特別じゃないけど、欠かせない。");
  const rawBody = txt(
    "recruit3:work.body",
    "氷は、もう特別なものではありません。\nコンビニでも、飲食店でも、家庭でも。\nどこにでもあって、当たり前に使われています。\n\n氷がなければ、夏の飲み物はぬるいまま。\n食品の鮮度も、守れないかもしれません。\n物流や医療の現場も、少し困るはず。\n\nつくり、運び、届ける。\n目立つことは、あまりありません。\nそれでも、なくなったら誰かが困る。\n\nその仕事を、私たちは今日も、丁寧に続けています。",
  );
  // 旧ページでは本文の1行目に「特別じゃないけど、欠かせない。」が入っていたため、
  // 大コピーと重複しないよう本文の先頭行が大コピーと同じならその行（と続く空行）を除く
  const lines = rawBody.split("\n");
  if (lines[0]?.trim() === poemTitle.trim()) {
    lines.shift();
    while (lines.length && lines[0].trim() === "") lines.shift();
  }
  const body = lines.join("\n");
  return (
    <section className="section on-land" id="work">
      <div className="container">
        <Title path="recruit3:work.title" def="アイスラインの仕事" mark="仕事" />
        <p className="section__lead reveal" style={{ textAlign: "center", whiteSpace: "pre-line" }} {...ed("recruit3:work.strong", "アイスラインの仕事 リード", { multiline: true })}>
          {txt("recruit3:work.strong", "氷と食のフィールドで、暮らしの当たり前を支える。")}
        </p>
        <p className="poem-title reveal" style={{ textAlign: "center", marginTop: 64, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900 }} {...ed("recruit3:work.poemTitle", "アイスラインの仕事 大コピー")}>
          <OutlineText text={poemTitle} accentLast />
        </p>
        <RichBody path="recruit3:work.body" text={body} label="アイスラインの仕事 本文" className="poem reveal" style={{ marginTop: 48 }} />
      </div>
    </section>
  );
}

/* ═══════════════ ⑤ カルチャー ═══════════════ */
const MAX_CULTURE = 8;
const CULTURE_DEFAULTS = [
  { title: "失敗を、隠さなくていい", body: "何かあったらまず話す。そのほうが早く解決できるし、次につながる。そういう空気を、みんなで少しずつ作っています。" },
  { title: "続けることが、形になる", body: "約束したことを守る。それを毎日続けていると、いつの間にかお客様から頼られるようになっている。積み重ねたものだけが、信頼として返ってくる。" },
  { title: "人々の日常に、そっと関わる仕事", body: "氷の製造から、食材の卸、物流、品質管理まで。アイスラインは、食品に関わるあらゆる仕事が一つの会社の中にあります。" },
];

function Culture() {
  const rep = repeatSel("recruit3:culture.count", CULTURE_DEFAULTS.length, MAX_CULTURE, "カルチャーの項目数");
  return (
    <section className="section on-land" id="culture">
      <div className="container">
        <Kicker path="recruit3:culture.en" def="CULTURE" />
        <Title path="recruit3:culture.jp" def="アイスラインのカルチャー" mark="カルチャー" />
        <div className="culture" data-reveal-group {...rep.attrs}>
          {Array.from({ length: MAX_CULTURE }, (_, i) => {
            const d = CULTURE_DEFAULTS[i] ?? { title: "（見出し）", body: "（本文）" };
            return (
              <div key={i} className="culture__item reveal">
                <h3 {...ed(`recruit3:culture.${i}.title`, `カルチャー${i + 1} 見出し`)}>{txt(`recruit3:culture.${i}.title`, d.title)}</h3>
                <p style={{ whiteSpace: "pre-line" }} {...ed(`recruit3:culture.${i}.body`, `カルチャー${i + 1} 本文`, { multiline: true })}>
                  {txt(`recruit3:culture.${i}.body`, d.body)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ ⑥ 人を知る ═══════════════ */
/** 所属・役職（例「アイス事業部 製造｜オペレーター」）を「所属」と「肩書」に分ける */
function splitRole(role: string): { meta: string; job: string } {
  const parts = role.split(/[｜|]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { meta: parts.slice(0, -1).join("　"), job: parts[parts.length - 1] };
  return { meta: role.trim(), job: "" };
}

function People() {
  const { items } = useInterviews();
  return (
    <section className="section on-land" id="people">
      <div className="container">
        <Kicker path="recruit3:people.en" def="PEOPLE" />
        <Title path="recruit3:people.jp" def="人を知る" mark="人" />
        <p className="section__lead reveal" style={{ textAlign: "center" }} {...ed("recruit3:people.lead", "人を知る リード")}>
          {txt("recruit3:people.lead", "働く社員のインタビューを、カードをめくるように読めます。")}
        </p>
        <div className="people-hint reveal">
          <span className="note" {...ed("recruit3:people.hint", "横スクロールの案内")}>{txt("recruit3:people.hint", "横にスクロールできます")}</span>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="#E2E2E2" strokeWidth="2" strokeLinecap="round">
            <path d="M2 7h15M13 2l5 5-5 5" />
          </svg>
        </div>
      </div>
      <div className="people">
        <div className="people-track" data-reveal-group>
          {items.map((iv, i) => {
            const r = splitRole(iv.role);
            return (
              <article key={iv.id} className="p-card reveal">
                {/* 写真は上揃え（object-position: top）。2枚目のアイキャッチがある記事はホバーでフェード切替（2026-09 改修） */}
                <div className={"p-card__photo" + (iv.image2 ? " has-alt" : "")}>
                  {iv.image ? <ImageWithFallback src={iv.image} alt={iv.name} /> : <PersonArt variant={i} />}
                  {iv.image2 && <ImageWithFallback src={iv.image2} alt="" className="p-card__photo-alt" />}
                  {(r.job || iv.category) && <span className="p-card__job">{r.job || iv.category}</span>}
                </div>
                <div className="p-card__body">
                  <p className="p-card__catch">{iv.lead}</p>
                  <div className="p-card__name">{iv.name}</div>
                  <div className="p-card__meta">
                    {r.meta}
                    {iv.years ? `　${iv.years}` : ""}
                  </div>
                  <Link to={`/recruit/interview/${iv.id}`} className="btn btn--corp btn--sm">
                    <span {...ed("recruit3:people.more", "記事リンク文言")}>{txt("recruit3:people.more", "記事を読む")}</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 埋め込み動画（CMS「動画URL」設定時のみ） ═══════════════ */
function Movie() {
  const url = txt("recruit3:movie.url", "");
  const caption = txt("recruit3:movie.caption", "");
  const embed = toEmbed(url);
  if (!embed && !EDIT_MODE) return null;
  return (
    <section className="section on-land" id="intro-movie">
      <div className="container">
        <div className="media-frame media-frame--fill media-frame--movie reveal">
          {embed?.type === "iframe" ? (
            <iframe src={embed.src} title={caption || "紹介動画"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : embed ? (
            <video src={embed.src} controls playsInline />
          ) : (
            <p>（動画URL未設定）</p>
          )}
        </div>
        {(caption !== "" || EDIT_MODE) && (
          <p className="media-frame__caption reveal" style={{ whiteSpace: "pre-line" }} {...ed("recruit3:movie.caption", "動画キャプション", { multiline: true })}>
            {caption || "（動画のキャプションを入力）"}
          </p>
        )}
        {EDIT_MODE && (
          <p className="edit-url" {...ed("recruit3:movie.url", "埋め込み動画URL")} data-edit-video="1">
            {url || "（動画URLを入力：YouTube/Vimeoの共有URL、または動画ファイルをアップロード）"}
          </p>
        )}
      </div>
    </section>
  );
}

/* ═══════════════ ⑦ カンパニーデック ═══════════════ */
const MAX_DECK = 20;
function Deck() {
  const all = Array.from({ length: MAX_DECK }, (_, i) => ({ i, src: img(`recruit3:deck.${i}.image`, "") }));
  const slides = all.filter((s) => s.src !== "");
  // 既定は1枚目。自動送りはしない（前後ボタン・ドット・全画面表示で操作。2026-09 改修）
  const [idx, setIdx] = useState(0);
  const cur = slides.length > 0 ? ((idx % slides.length) + slides.length) % slides.length : 0;
  // 全画面表示（画面いっぱいのビューア。Esc／背景クリックで閉じる、←→で送る）
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      else if (e.key === "ArrowRight") setIdx((v) => v + 1);
      else if (e.key === "ArrowLeft") setIdx((v) => v - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);
  const lead = txt("recruit3:deck.lead", "");
  if (slides.length === 0 && !EDIT_MODE) return null;
  return (
    <section className="section on-land" id="deck">
      <div className="container">
        <Kicker path="recruit3:deck.head.en" def="COMPANY DECK" />
        <Title path="recruit3:deck.head.jp" def="カンパニーデック" />
        {(lead !== "" || EDIT_MODE) && (
          <p className="section__lead reveal" style={{ textAlign: "center", whiteSpace: "pre-line" }} {...ed("recruit3:deck.lead", "カンパニーデック リード", { multiline: true })}>
            {lead || "（見出し下の一文を入力）"}
          </p>
        )}
        <div className="media-grid">
          <div className="media-frame media-frame--fill media-frame--deck reveal">
            {slides.length > 0 ? (
              <>
                {slides.map((s, n) => (
                  <ImageWithFallback key={s.i} src={s.src} alt={`カンパニーデック ${n + 1}枚目`} sizes="720px" loading={n === 0 ? "eager" : "lazy"} className="media-frame__slide" style={{ opacity: n === cur ? 1 : 0 }} />
                ))}
                {slides.length > 1 && (
                  <>
                    <button type="button" className="deck-nav deck-nav--prev" aria-label="前のスライド" onClick={() => setIdx((v) => v - 1)}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3L5 9l6 6" /></svg>
                    </button>
                    <button type="button" className="deck-nav deck-nav--next" aria-label="次のスライド" onClick={() => setIdx((v) => v + 1)}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3l6 6-6 6" /></svg>
                    </button>
                  </>
                )}
              </>
            ) : (
              <p>（編集用の枠に16:9画像を追加するとスライドショーが表示されます）</p>
            )}
          </div>
        </div>
        {slides.length > 1 && (
          <div className="deck-dots">
            {slides.map((s, n) => (
              <button key={s.i} type="button" aria-label={`${n + 1}枚目を表示`} className={n === cur ? "is-on" : ""} onClick={() => setIdx(n)} />
            ))}
          </div>
        )}
        {/* 画像の外に置く全画面ボタン（2026-09 改修） */}
        {slides.length > 0 && (
          <div className="deck-actions">
            <button type="button" className="btn btn--corp btn--sm deck-full-btn" onClick={() => setFull(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" /></svg>
              <span {...ed("recruit3:deck.fullLabel", "デッキ 全画面ボタン文言")}>{txt("recruit3:deck.fullLabel", "全画面で見る")}</span>
            </button>
          </div>
        )}
        {full &&
          slides.length > 0 &&
          createPortal(
            <div className="rc-deck-full" role="dialog" aria-modal="true" aria-label="カンパニーデック（全画面）" onClick={() => setFull(false)}>
              <button type="button" className="rc-deck-full__close" aria-label="閉じる" onClick={() => setFull(false)}>
                <X size={28} />
              </button>
              <div className="rc-deck-full__stage" onClick={(e) => e.stopPropagation()}>
                <ImageWithFallback src={slides[cur].src} alt={`カンパニーデック ${cur + 1}枚目`} sizes="100vw" className="rc-deck-full__img" />
                {slides.length > 1 && (
                  <>
                    <button type="button" className="rc-deck-full__nav rc-deck-full__nav--prev" aria-label="前のスライド" onClick={() => setIdx((v) => v - 1)}>
                      <svg width="26" height="26" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3L5 9l6 6" /></svg>
                    </button>
                    <button type="button" className="rc-deck-full__nav rc-deck-full__nav--next" aria-label="次のスライド" onClick={() => setIdx((v) => v + 1)}>
                      <svg width="26" height="26" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3l6 6-6 6" /></svg>
                    </button>
                  </>
                )}
              </div>
              <p className="rc-deck-full__count" onClick={(e) => e.stopPropagation()}>
                {cur + 1} / {slides.length}
              </p>
            </div>,
            document.body,
          )}
        {EDIT_MODE && (
          <div className="edit-strip">
            {all.map((s) => (
              <div key={s.i}>
                <ImageWithFallback src={s.src || PH} alt={`スライド${s.i + 1}`} {...edImg(`recruit3:deck.${s.i}.image`, `デッキ スライド${s.i + 1}`)} />
                <span>{s.i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════ ⑧ 募集職種一覧 ═══════════════ */
function Jobs() {
  const data = useRecruitData();
  const jobs = data.jobs
    .filter((j) => j.active)
    .map((j, i) => ({ j, i, t: deptTag(j) }))
    .sort((a, b) => a.t.order - b.t.order || a.i - b.i);
  // 表示中の職種は URL のクエリ（?job=<職種ID>）で管理（共有・リロード・戻るで同じ職種が開く）
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = (searchParams.get("job") || "").trim();
  const setOpenId = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    next.delete("entry");
    if (id) next.set("job", id);
    else next.delete("job");
    setSearchParams(next);
  };
  const openJob = data.jobs.find((j) => j.id === openId) ?? null;
  return (
    <section className="section on-land" id="jobs">
      <div className="container">
        <Kicker path="recruit3:jobs.en" def="RECRUIT" />
        <Title path="recruit3:jobs.jp" def="募集職種一覧" mark="募集職種" />
        <p className="section__lead reveal" style={{ textAlign: "center" }} {...ed("recruit3:jobs.lead", "募集職種 リード")}>
          {txt("recruit3:jobs.lead", "職種名を選ぶと、業務内容・PRポイント・諸条件・選考の流れなどの詳細をご覧いただけます。")}
        </p>
        {jobs.length === 0 ? (
          <div className="job-row job-list--empty reveal" style={{ marginTop: 64 }}>
            <p style={{ width: "100%", textAlign: "center" }}>現在募集中の職種はありません。</p>
          </div>
        ) : (
          <ul className="job-list" data-reveal-group>
            {jobs.map(({ j, t }) => (
              <li key={j.id} className="job-row reveal">
                <span className={"acc__tag " + t.cls} style={t.style}>
                  {j.dept}
                </span>
                <span className="job-row__name">{j.title}</span>
                <button type="button" className="btn btn--corp btn--sm job-row__btn" onClick={() => setOpenId(j.id)}>
                  <span {...ed("recruit3:jobs.more", "職種リンク文言")}>{txt("recruit3:jobs.more", "詳細・エントリー")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {openJob && <JobOverlay job={openJob} data={data} onClose={() => setOpenId(null)} />}
    </section>
  );
}

/* ═══════════════ ⑨ 動画 ═══════════════ */
function Videos() {
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const embed = playing ? toEmbed(playing.videoUrl) : null;
  useEffect(() => {
    if (!playing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPlaying(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [playing]);
  return (
    <section className="section on-land" id="movie">
      <div className="container">
        <Kicker path="recruit3:videos.head.en" def="MOVIE" />
        <Title path="recruit3:videos.head.jp" def="はたらく現場の動画" mark="動画" />
        <div className="media-grid" data-reveal-group>
          {VIDEOS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="media-frame media-frame--fill media-frame--btn reveal"
              onClick={() => {
                if (EDIT_MODE) return; // 編集モードでは再生せず選択を優先
                setPlaying(v);
              }}
            >
              <ImageWithFallback src={v.thumb} alt="" sizes="(min-width: 769px) 540px, 100vw" className="media-frame__img" {...edImg(`videos:${v.id}:thumb`, "動画サムネイル")} />
              <span className="media-frame__play">
                <PlayIcon size={40} />
              </span>
              <span className="media-frame__label" {...ed(`recruit3:videos.${v.id}.title`, "動画キャプション")}>
                {txt(`recruit3:videos.${v.id}.title`, v.title)}
              </span>
            </button>
          ))}
        </div>
      </div>
      {playing &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-5" onClick={() => setPlaying(null)} role="dialog" aria-modal="true">
            <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <button type="button" aria-label="閉じる" onClick={() => setPlaying(null)} className="absolute -top-10 right-0 text-white/80 transition-colors hover:text-white">
                <X size={26} />
              </button>
              <div className="aspect-video w-full overflow-hidden rounded-[20px] bg-black">
                {embed?.type === "iframe" && (
                  <iframe src={embed.src + (embed.src.includes("?") ? "&" : "?") + "autoplay=1"} title={playing.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                )}
                {embed?.type === "video" && <video src={embed.src} controls autoPlay playsInline className="h-full w-full" />}
                {!embed && (
                  <div className="flex h-full w-full items-center justify-center text-white/70" style={{ fontSize: 14 }}>
                    動画は準備中です。
                  </div>
                )}
              </div>
              <p className="mt-3 text-white" style={{ fontSize: 15, fontWeight: 700 }}>{playing.title}</p>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

/* ═══════════════ ページ本体 ═══════════════ */
export function RecruitTop() {
  // オープニングは RecruitFrame 側で可否を判定（?job=◯◯ 付きの着地・編集モード等では省く）
  return (
    <RecruitFrame intro landAnchorId="data">
      <Hero />
      <About />
      <Stats />
      <Work />
      <Culture />
      <People />
      <Movie />
      <Deck />
      <Jobs />
      <Videos />
    </RecruitFrame>
  );
}
