import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { CorpHero, ProfileTable } from "../components/common/CompanyParts";
import { HEAT } from "../data/heatMap";
import { IMG } from "../data/images";
import { ed, edImg, img, repeatSel, txt, EDIT_MODE } from "../lib/editable";
import { rt, rich } from "../lib/richInline";

// ─────────────────────────────────────────────────────────
// 株式会社アイスマウンテン（グループ会社）ページ /ice-mountain（2026-09-10 追加）。
// ナビには出さず、フッターの「会社情報」の下に小さく載せる。
// 構成: MV（会社情報と同じ）→ ABOUT US（企業理念と同デザイン）→ 会社概要（同テーブル）
//       → OUR SERVICES（見出し＋リード文＋3列カード。枚数はコンソールで増減）→ /contact への CTA。
// 文言・画像はすべて既定値（このファイル）を持ち、コンソールで上書きできる。
// ─────────────────────────────────────────────────────────

const IMG_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#f1f1f3"/><text x="50%" y="50%" font-size="30" fill="#bcbcc2" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋ 画像</text></svg>'
  );

const ABOUT_DEFAULT =
  "株式会社アイスマウンテンは、アイスライングループの一員として2023年に設立しました。\n氷と食の現場で培ってきた知見を活かし、新しい価値をお届けします。";

const PROFILE: { label: string; value: string }[] = [
  { label: "会社名", value: "株式会社アイスマウンテン" },
  { label: "所在地", value: "〒700-0941 岡山市北区青江2丁目4-6" },
  { label: "TEL", value: "086-224-5235（代）" },
  { label: "設立", value: "2023年" },
  { label: "事業内容", value: "（事業内容を入力してください）" },
];

// サービスカード（既定3枚。コンソールの「追加」「削除」で 1〜MAX_SERVICES 枚）
const MAX_SERVICES = 9;
const SERVICES: { title: string; body: string; url: string; image: string }[] = [
  { title: "サービス 1", body: "サービスの概要を入力してください。対象のお客様、提供する価値、特長などを2〜4行で。", url: "", image: IMG.warehouse },
  { title: "サービス 2", body: "サービスの概要を入力してください。対象のお客様、提供する価値、特長などを2〜4行で。", url: "", image: IMG.iceMv },
  { title: "サービス 3", body: "サービスの概要を入力してください。対象のお客様、提供する価値、特長などを2〜4行で。", url: "", image: IMG.foodMv },
];
const SERVICES_LEAD_DEFAULT = "氷と食の現場で培った知見を、\n新しいサービスとしてお届けします。";

function ServiceCard({ i }: { i: number }) {
  const def = SERVICES[i] ?? { title: "", body: "", url: "", image: "" };
  const base = `icemountain:services.${i}`;
  const title = txt(`${base}.title`, def.title);
  const body = txt(`${base}.body`, def.body);
  const url = txt(`${base}.url`, def.url);
  const linkLabel = txt(`${base}.linkLabel`, "詳しくはこちら");
  const external = /^https?:\/\//.test(url);
  return (
    <div className="flex flex-col">
      <div className="aspect-[3/2] w-full overflow-hidden rounded-xl bg-secondary">
        <ImageWithFallback
          src={img(`${base}.image`, def.image || IMG_PLACEHOLDER)}
          alt={title}
          className="h-full w-full object-cover"
          {...edImg(`${base}.image`, `カード${i + 1} 画像`)}
        />
      </div>
      <h3 className="mt-5" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5 }} {...ed(`${base}.title`, `カード${i + 1} タイトル`)}>
        {rich(title || "（タイトル）")}
      </h3>
      <p className="mt-3 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`${base}.body`, `カード${i + 1} 本文`, { multiline: true })}>
        {rich(body || "（本文）")}
      </p>
      {url !== "" && (
        external ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="group mt-4 inline-flex w-fit items-center gap-1.5 text-brand transition-opacity hover:opacity-75" style={{ fontSize: 14, fontWeight: 600 }}>
            <span {...ed(`${base}.linkLabel`, `カード${i + 1} リンク文言`)}>{rich(linkLabel)}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </a>
        ) : (
          <Link to={url} className="group mt-4 inline-flex w-fit items-center gap-1.5 text-brand transition-opacity hover:opacity-75" style={{ fontSize: 14, fontWeight: 600 }}>
            <span {...ed(`${base}.linkLabel`, `カード${i + 1} リンク文言`)}>{rich(linkLabel)}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        )
      )}
      {EDIT_MODE && (
        <p className="mt-1.5 break-all text-muted-foreground" style={{ fontSize: 11 }} {...ed(`${base}.url`, `カード${i + 1} リンク先URL`)}>
          {url || "（リンク先URL・任意。空ならリンクを表示しません）"}
        </p>
      )}
    </div>
  );
}

export function IceMountain() {
  const rep = repeatSel("icemountain:services.count", SERVICES.length, MAX_SERVICES, "カードの数");
  return (
    <>
      {/* メインビジュアル（会社情報と同じ設計） */}
      <CorpHero base="icemountain:hero" enPath="sectionEn:icemountain.mv" defEn="ICE MOUNTAIN" defTitle="株式会社アイスマウンテン" defImage={IMG.warehouse} />

      {/* ABOUT US（会社情報の企業理念セクションと同デザイン） */}
      <Section heat={HEAT.philosophy} contained={false}>
        <div className="mx-auto max-w-[1150px] px-5 pc:px-8">
          <SectionTitle en="ABOUT US" jp="アイスマウンテンについて" align="center" path="sectionEn:icemountain.about" />
          <p className="mx-auto mt-8 max-w-3xl text-center text-brand pc:max-w-full" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.8, whiteSpace: "pre-line" }} {...ed("icemountain:about.body", "本文", { multiline: true })}>
            {rt("icemountain:about.body", ABOUT_DEFAULT)}
          </p>
        </div>
      </Section>

      {/* 会社概要（会社情報と同デザイン。行はコンソールで増減） */}
      <Section heat={HEAT.companyProfile}>
        <SectionTitle en="PROFILE" jp="会社概要" path="sectionEn:icemountain.profile" />
        <ProfileTable countPath="icemountain:profile.count" rows={PROFILE} max={12} />
      </Section>

      {/* OUR SERVICES（企業理念と同デザインの見出し＋リード文、3列カード） */}
      <Section heat={HEAT.philosophy} contained={false}>
        <div className="mx-auto max-w-[1150px] px-5 pc:px-8">
          <SectionTitle en="OUR SERVICES" jp="事業内容" align="center" path="sectionEn:icemountain.services" />
          <p className="mx-auto mt-8 max-w-3xl text-center text-brand pc:max-w-full" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.8, whiteSpace: "pre-line" }} {...ed("icemountain:services.lead", "リード文", { multiline: true })}>
            {rt("icemountain:services.lead", SERVICES_LEAD_DEFAULT)}
          </p>
          <div className="mt-12 grid gap-x-8 gap-y-12 tab:grid-cols-2 pc:grid-cols-3" {...rep.attrs}>
            {Array.from({ length: MAX_SERVICES }, (_, i) => (
              <ServiceCard key={i} i={i} />
            ))}
          </div>
        </div>
      </Section>

      {/* お問い合わせ CTA（/contact へ） */}
      <Section heat={HEAT.contactForm}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 style={{ fontFamily: "var(--font-accent)", fontSize: 28, fontWeight: 400, letterSpacing: "0.14em", lineHeight: 1.3 }} {...ed("icemountain:cta.title", "見出し")}>
            {rt("icemountain:cta.title", "CONTACT")}
          </h2>
          <p className="mt-5 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed("icemountain:cta.lead", "リード文", { multiline: true })}>
            {rt("icemountain:cta.lead", "サービスについてのご相談はこちらから")}
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center justify-center bg-ink px-10 py-4 text-white transition-opacity hover:opacity-80"
            style={{ fontSize: 15, fontWeight: 700, minWidth: 260 }}
          >
            <span {...ed("icemountain:cta.button", "ボタン文言")}>{rt("icemountain:cta.button", "お問い合わせフォーム")}</span>
          </Link>
          <p className="mt-6" style={{ fontFamily: "var(--font-accent)", fontSize: 26, fontWeight: 500, letterSpacing: "0.04em" }} {...ed("icemountain:cta.tel", "電話番号")}>
            {rt("icemountain:cta.tel", "086-224-5235")}
          </p>
          <p className="mt-4" style={{ fontSize: 13, fontWeight: 700 }} {...ed("icemountain:cta.hoursLabel", "営業時間 見出し")}>
            {rt("icemountain:cta.hoursLabel", "営業時間")}
          </p>
          <p className="mt-1 text-foreground/80" style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-line" }} {...ed("icemountain:cta.hours", "営業時間", { multiline: true })}>
            {rt("icemountain:cta.hours", "月〜金 9:00〜17:00（土日／祝日及び年末年始を除く）")}
          </p>
        </div>
      </Section>
    </>
  );
}
