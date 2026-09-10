import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ExternalLink, MapPin } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { IMG } from "../data/images";
import { CEO_MESSAGE, COMPANY_PROFILE, HISTORY, PHILOSOPHY, CSR } from "../data/company";
import { ed, edImg, txt, img, ratioCols, ratioAttrs, repeatSel, EDIT_MODE } from "../lib/editable";
import { rt, rich } from "../lib/richInline";
import { RichBody } from "../components/common/RichBody";
import { CorpHero, ProfileTable } from "../components/common/CompanyParts";

// 画像未設定時のプレースホルダー（編集モードでのみ表示）
const IMG_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#f1f1f3"/><text x="50%" y="50%" font-size="30" fill="#bcbcc2" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">＋ 画像</text></svg>'
  );

// ─────────────────────────────────────────────────────────
// 拠点情報（2026-09 追加）。沿革とCSRの間に H2 セクションとして表示し、
// 拠点ごとに Google マップ（住所で検索した埋め込み地図）＋住所・電話番号・
// Google マップへのリンクを載せる。文言はすべてコンソールから編集でき、
// 拠点の数は「拠点の数」（追加・削除ボタン）で 1〜MAX_LOCATIONS に変更できる。
// ─────────────────────────────────────────────────────────
const MAX_LOCATIONS = 8;
const LOCATIONS: { name: string; address: string; tel: string; url: string }[] = [
  {
    name: "本社・食品事業部・青江物流センター",
    address: "〒700-0941 岡山県岡山市北区青江2丁目4-6",
    tel: "本社（総務部）：086-224-5235\n食品事業部 営業部：086-232-3197\n青江物流センター：086-224-3533",
    url: "https://maps.google.com/?cid=4078151803003502361",
  },
  {
    name: "ドライアイスチーム",
    address: "〒700-0941 岡山県岡山市北区青江2丁目3-11",
    tel: "TEL：086-224-5236",
    url: "https://maps.google.com/?cid=17414659884876483349",
  },
  {
    name: "アイス事業部・西大寺物流センター",
    address: "〒704-8122 岡山県岡山市東区西大寺新地150-1",
    tel: "TEL：086-944-8833",
    url: "https://maps.google.com/?cid=4478222050823407717",
  },
  {
    name: "アイス事業部 二日市工場",
    address: "〒700-0843 岡山県岡山市北区二日市町8番",
    tel: "TEL：086-944-8585",
    url: "https://maps.google.com/?cid=15526115832655768239",
  },
  {
    name: "東京オフィス",
    address: "〒101-0064 東京都千代田区神田猿楽町1丁目3-1 北村ビル403",
    tel: "",
    url: "https://share.google/3Mren49rAnV5kmzyC",
  },
];

function LocationCard({ i }: { i: number }) {
  const def = LOCATIONS[i] ?? { name: "", address: "", tel: "", url: "" };
  const base = `company:locations.${i}`;
  const name = txt(`${base}.name`, def.name);
  const address = txt(`${base}.address`, def.address);
  const tel = txt(`${base}.tel`, def.tel);
  const url = txt(`${base}.url`, def.url);
  // 地図の検索クエリは「〒」以降（住所部分）。拠点名は下に表示する
  const q = address.includes("〒") ? address.slice(address.indexOf("〒")) : address;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[4/3] w-full bg-secondary">
        {q.trim() !== "" ? (
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=ja`}
            title={`${name || "拠点"}の地図`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="block h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground" style={{ fontSize: 13 }}>
            （住所を入力すると地図が表示されます）
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5 }} {...ed(`${base}.name`, `拠点${i + 1} 名称`)}>
          {rich(name || "（拠点名）")}
        </h3>
        <p className="mt-3 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`${base}.address`, `拠点${i + 1} 住所`, { multiline: true })}>
          {rich(address || "（住所）")}
        </p>
        {(tel !== "" || EDIT_MODE) && (
          <p className="mt-2 text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`${base}.tel`, `拠点${i + 1} 電話番号`, { multiline: true })}>
            {rich(tel || "（電話番号・任意）")}
          </p>
        )}
        {url !== "" && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-brand"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            <MapPin size={14} /> Googleマップで見る <ExternalLink size={12} />
          </a>
        )}
        {EDIT_MODE && (
          <p className="mt-1.5 break-all text-muted-foreground" style={{ fontSize: 11 }} {...ed(`${base}.url`, `拠点${i + 1} GoogleマップURL`)}>
            {rich(url || "（GoogleマップのURL・任意）")}
          </p>
        )}
      </div>
    </div>
  );
}

function Locations() {
  const rep = repeatSel("company:locations.count", LOCATIONS.length, MAX_LOCATIONS, "拠点の数");
  return (
    <Section heat={HEAT.companyProfile}>
      <SectionTitle en="LOCATIONS" jp="拠点情報" path="sectionEn:company.locations" />
      <div className="mt-10 grid gap-6 tab:grid-cols-2 pc:grid-cols-3" {...rep.attrs}>
        {Array.from({ length: MAX_LOCATIONS }, (_, i) => (
          <LocationCard key={i} i={i} />
        ))}
      </div>
    </Section>
  );
}

// 沿革の最大行数（コンソールの「追加」で増やせる上限）
const MAX_HISTORY = 30;
// 会社概要の最大行数
const MAX_PROFILE = 12;
// 受賞歴の最大件数
const MAX_AWARDS = 12;

/** 受賞歴（2026-09-10 改修）：1件ごとに「タイトル（白背景）」「本文（透明背景）」の縞模様で表示。
 * 件数はコンソールの「追加」「削除」で 1〜MAX_AWARDS。旧仕様（1行1件のリスト
 * company:awards.items）の入力があれば、その各行を既定のタイトルとして引き継ぐ。
 * 1件目のタイトルが未入力の間は公開ページでは非表示。 */
// 受賞歴の折りたたみ：最初に見せる件数（4件目以降は白くフェードアウトし「すべて見る」で展開）
const AWARDS_VISIBLE = 3;

function Awards() {
  const legacy = txt("company:awards.items", "").split("\n").map((l) => l.trim()).filter(Boolean);
  const rep = repeatSel("company:awards.count", Math.max(1, legacy.length), MAX_AWARDS, "受賞歴の数");
  // アコーディオン（2026-09-10 追加）：表示件数が AWARDS_VISIBLE を超えるときだけ折りたたむ。
  // 折りたたみ時の高さは「先頭3件＋4件目の一部」を実測する（編集プレビューの件数変更にも追従）。
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(EDIT_MODE);
  const [collapsedH, setCollapsedH] = useState(0);
  const [collapsible, setCollapsible] = useState(false);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => {
      const kids = (Array.from(el.children) as HTMLElement[]).filter((k) => getComputedStyle(k).display !== "none");
      setCollapsible(kids.length > AWARDS_VISIBLE);
      let h = 0;
      for (let i = 0; i < AWARDS_VISIBLE && i < kids.length; i++) h += kids[i].offsetHeight;
      const next = kids[AWARDS_VISIBLE];
      if (next) h += Math.min(next.offsetHeight, 88);
      setCollapsedH(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const mo = new MutationObserver(measure);
    mo.observe(el, { attributes: true, childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);
  const collapsed = collapsible && !open;
  if (txt("company:awards.0.title", legacy[0] ?? "") === "" && !EDIT_MODE) return null;
  return (
    <Section heat={HEAT.csr}>
      <SectionTitle en="AWARDS" jp="受賞歴" path="sectionEn:company.awards" />
      <div className="relative mt-10">
        <div
          ref={listRef}
          className="overflow-hidden rounded-2xl border border-border transition-[max-height] duration-500 ease-out"
          style={collapsed && collapsedH > 0 ? { maxHeight: collapsedH } : undefined}
          {...rep.attrs}
        >
          {Array.from({ length: MAX_AWARDS }, (_, i) => {
            const base = `company:awards.${i}`;
            const title = txt(`${base}.title`, legacy[i] ?? "");
            const body = txt(`${base}.body`, "");
            return (
              <div key={i} className="border-t border-border first:border-t-0">
                <div className="bg-white px-6 py-4 pc:px-8">
                  <h3 className={title ? "" : "text-muted-foreground"} style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.6 }} {...ed(`${base}.title`, `受賞歴${i + 1} タイトル`)}>
                    {rich(title || "（受賞名・年など）")}
                  </h3>
                </div>
                {(body !== "" || EDIT_MODE) && (
                  <div className="px-6 py-5 pc:px-8">
                    <RichBody
                      path={`${base}.body`}
                      text={body || "（本文・任意。行頭に「・」で箇条書き）"}
                      label={`受賞歴${i + 1} 本文`}
                      className={body ? "text-foreground/80" : "text-muted-foreground"}
                      style={{ fontSize: 15, lineHeight: 2.05 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* 折りたたみ時：下端を白くフェードアウト */}
        {collapsed && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-44 rounded-b-2xl"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 55%, #ffffff 100%)" }}
          />
        )}
      </div>
      {collapsible && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-7 py-2.5 text-foreground transition-colors hover:bg-secondary"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {open ? "閉じる" : "すべて見る"}
            <ChevronDown size={16} className={"transition-transform " + (open ? "rotate-180" : "")} />
          </button>
        </div>
      )}
    </Section>
  );
}

export function Company() {
  const historyRep = repeatSel("company:history.count", HISTORY.length, MAX_HISTORY, "沿革の行数");
  return (
    <>
      {/* メインビジュアル（2026-09-09 改修）：各事業ページと同じ画像背景＋中央タイトル。
          画像はコンソールの「メインビジュアル画像」で差し替えられる（既定は倉庫の写真）。
          部品は CompanyParts.tsx（/ice-mountain と共用） */}
      <CorpHero base="company:hero" enPath="sectionEn:company.mv" defEn="COMPANY" defTitle="会社情報" defImage={IMG.warehouse} />

      {/* 代表メッセージ（会社情報の熱量ピーク） */}
      <Section heat={HEAT.ceoMessage}>
        <div
          className="grid items-stretch gap-10 pc:[grid-template-columns:var(--ratio)]"
          style={{ ["--ratio" as any]: ratioCols("company:ceo.ratio", 43, true) }}
          {...ratioAttrs("company:ceo.ratio", 43, true)}
        >
          <div className="flex flex-col">
            <SectionTitle en="MESSAGE" jp="代表メッセージ" path="sectionEn:company.message" />
            {/* 代表の写真は2枚登録でき、ホバーで2枚目へフェードする（2026-09-10 改修）。
                2枚目が未設定なら公開ページでは1枚目だけを表示する */}
            {(() => {
              const img2 = img("company:ceo.image2", "");
              // 1枚目は通常フローで縦横比（既定 4:3・コンソールの「縦横比」設定が優先）を守り、
              // 上揃えで置く。高さは文章側に合わせて伸ばさない（2026-09-10 修正）。2枚目は同じ枠に重ねる
              return (
                <div className="group relative mt-6 w-full self-start overflow-hidden rounded-2xl bg-secondary">
                  <ImageWithFallback src={IMG.waterDew} alt="代表メッセージ" className="block aspect-[4/3] w-full object-cover" {...edImg("images:IMG.waterDew", "代表 写真1")} />
                  {(img2 !== "" || EDIT_MODE) && (
                    <ImageWithFallback
                      src={img2 || IMG_PLACEHOLDER}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      {...edImg("company:ceo.image2", "代表 写真2（ホバー時に切替）")}
                    />
                  )}
                </div>
              );
            })()}
            <p className="mt-4 text-muted-foreground" style={{ fontSize: 14 }} {...ed("sections:ceoMessage.name")}>{rich(CEO_MESSAGE.name)}</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            {/* 本文は1つのボックスで編集する（1行＝1段落。2026-09-10 改修。既定は sections.json の段落を結合したもの） */}
            <RichBody
              path="company:ceo.body"
              text={txt("company:ceo.body", CEO_MESSAGE.paragraphs.join("\n"))}
              label="本文（1行＝1段落）"
              className="rich-paras"
              style={{ fontSize: 15, lineHeight: 2.2 }}
            />
          </motion.div>
        </div>
      </Section>

      {/* 企業理念 */}
      <Section heat={HEAT.philosophy} contained={false}>
        <div className="mx-auto max-w-[1150px] px-5 pc:px-8">
          <SectionTitle en="PHILOSOPHY" jp="企業理念" align="center" path="sectionEn:company.philosophy" />
          <p className="mx-auto mt-8 max-w-3xl text-center text-brand pc:max-w-full" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.8, whiteSpace: "pre-line" }} {...ed("sections:philosophy.body")}>
            {rich(PHILOSOPHY.body)}
          </p>
        </div>
      </Section>

      {/* 会社概要 */}
      <Section heat={HEAT.companyProfile}>
        <SectionTitle en="PROFILE" jp="会社概要" path="sectionEn:company.profile" />
        {/* 行はコンソールの「追加」「削除」で増減できる（2026-09-10 改修） */}
        <ProfileTable countPath="company:profile.count" rows={COMPANY_PROFILE} max={MAX_PROFILE} />
      </Section>

      {/* 沿革（PC時：右50%に画像） */}
      <Section heat={HEAT.history}>
        <SectionTitle en="HISTORY" jp="沿革" path="sectionEn:company.history" />
        {/* 年表＋画像の横並び（幅・左右はコンソールの「画像の幅」「左右入れ替え」で調整可能） */}
        <div
          className="mt-10 grid gap-10 pc:[grid-template-columns:var(--ratio)]"
          style={{ ["--ratio" as any]: ratioCols("company:history.ratio", 50, false) }}
          {...ratioAttrs("company:history.ratio", 50, false)}
        >
          {/* 沿革の行はコンソールの「追加」「削除」で 1〜MAX_HISTORY 行に変更できる（既定は同梱データの行数。2026-09 改修） */}
          <ol className="border-l-2 border-border pl-6" {...historyRep.attrs}>
            {Array.from({ length: MAX_HISTORY }, (_, i) => HISTORY[i] ?? { year: "（年）", text: "（内容）" }).map((h, i) => (
              <li key={i} className="relative mb-8 last:mb-0">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand" />
                <div className="flex flex-col gap-1 tab:flex-row tab:gap-6">
                  <span className="text-brand" style={{ fontFamily: "var(--font-accent)", fontSize: 20, fontWeight: 700 }} {...ed(`company:history.${i}.year`, "年")}>{rt(`company:history.${i}.year`, h.year)}</span>
                  <p className="text-foreground/80" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`company:history.${i}.text`, "内容", { multiline: true })}>{rt(`company:history.${i}.text`, h.text)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="hidden pc:block">
            <ImageWithFallback
              src={img("company:historyImage", IMG.warehouse)}
              alt="アイスラインの歩み"
              className="h-full min-h-0 w-full rounded-2xl object-cover"
              {...edImg("company:historyImage", "沿革画像")}
            />
          </div>
        </div>
      </Section>

      {/* 拠点情報（沿革とCSRの間・Googleマップ付き。2026-09 追加） */}
      <Locations />

      {/* CSR */}
      <Section heat={HEAT.csr}>
        <SectionTitle en="CSR" jp="社会的責任への取り組み" path="sectionEn:company.csr" />
        <div className="mt-10 grid gap-6 pc:grid-cols-3">
          {CSR.map((c, i) => (
            <div key={c.title} className="border border-border bg-card p-7">
              <h3 style={{ fontSize: 18, fontWeight: 700 }} {...ed(`company:csr.${i}.title`, "タイトル")}>{rt(`company:csr.${i}.title`, c.title)}</h3>
              <p className="mt-3 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-line" }} {...ed(`company:csr.${i}.text`, "内容", { multiline: true })}>{rt(`company:csr.${i}.text`, c.text)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 受賞歴（タイトル＝白背景／本文＝透明背景の縞模様） */}
      <Awards />
    </>
  );
}
