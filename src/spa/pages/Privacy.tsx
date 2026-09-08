import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { SITE } from "../data/company";
import { ed, txt } from "../lib/editable";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. 個人情報の取得",
    body: [
      "当社は、お問い合わせ・採用エントリー・お取引等に際して、お名前、会社名、メールアドレス、電話番号、その他必要な範囲で個人情報を取得します。取得にあたっては、適法かつ公正な手段によるものとします。",
    ],
  },
  {
    title: "2. 利用目的",
    body: [
      "取得した個人情報は、次の目的の範囲内で利用します。",
      "・お問い合わせ・ご相談への対応のため",
      "・商品・サービスのご案内、お取引に関する連絡のため",
      "・採用選考および採用に関する連絡のため",
      "・当社サービスの品質向上および新たなサービスの検討のため",
    ],
  },
  {
    title: "3. 第三者への提供",
    body: [
      "当社は、法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。業務委託に伴い取扱いを委託する場合は、委託先に対して適切な監督を行います。",
    ],
  },
  {
    title: "4. Cookie（クッキー）等の利用",
    body: [
      "当社のウェブサイトでは、利便性の向上やアクセス状況の把握のためにCookieを使用する場合があります。Cookieにより個人を特定できる情報を取得することはありません。ブラウザの設定によりCookieの利用を制限することができますが、一部機能がご利用いただけない場合があります。",
    ],
  },
  {
    title: "5. 安全管理",
    body: [
      "当社は、個人情報への不正アクセス、紛失、改ざん、漏えい等を防止するため、必要かつ適切な安全管理措置を講じます。",
    ],
  },
  {
    title: "6. 開示・訂正・削除等の請求",
    body: [
      "ご本人から個人情報の開示・訂正・利用停止・削除等のご請求があった場合、合理的な範囲で速やかに対応します。下記のお問い合わせ窓口までご連絡ください。",
    ],
  },
  {
    title: "7. お問い合わせ窓口",
    body: [
      `${SITE.name}　個人情報お問い合わせ窓口`,
      "本サイトのお問い合わせフォーム、またはお電話にてご連絡ください。",
    ],
  },
  {
    title: "8. 本ポリシーの改定",
    body: [
      "当社は、法令の変更等に応じて、本プライバシーポリシーを予告なく改定することがあります。改定後の内容は、本ページに掲載した時点から効力を生じるものとします。",
    ],
  },
];

export function Privacy() {
  return (
    <>
      {/* 2026-09 改修：黒帯のヒーローを廃止し、デザイン支給どおり本文の先頭に英字ラベル＋見出しを置く */}
      <Section heat={HEAT.companyProfile}>
        <div className="mx-auto max-w-3xl">
          <div className="en-label" {...ed("sectionEn:privacy.mv", "英語見出し（補助）")}>{txt("sectionEn:privacy.mv", "PRIVACY POLICY")}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.35 }}>プライバシーポリシー</h1>
          <p className="mt-6 text-foreground/80" style={{ fontSize: 15, lineHeight: 2 }}>
            {SITE.name}（以下「当社」といいます。）は、お客様の個人情報の保護を重要な責務と認識し、以下の方針に基づき個人情報を適切に取り扱います。
          </p>
          <div className="mt-12 space-y-10">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="border-b border-border pb-2 text-brand" style={{ fontSize: 18, fontWeight: 700 }}>{s.title}</h2>
                <div className="mt-4 space-y-2">
                  {s.body.map((line, i) => (
                    <p key={i} className="text-foreground/80" style={{ fontSize: 14, lineHeight: 1.95 }}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-12 text-right text-muted-foreground" style={{ fontSize: 13 }}>制定日：2026年1月1日</p>
        </div>
      </Section>
    </>
  );
}
