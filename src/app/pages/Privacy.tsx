import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { SITE } from "../data/company";

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
      <section className="relative h-[32vh] min-h-[240px] w-full overflow-hidden bg-ink">
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-5 text-center pc:px-8">
          <p className="text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }}>PRIVACY POLICY</p>
          <h1 className="mt-3 text-white" style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 900, lineHeight: 1.2 }}>プライバシーポリシー</h1>
        </div>
      </section>

      <Section heat={HEAT.companyProfile}>
        <div className="mx-auto max-w-3xl">
          <p className="text-foreground/80" style={{ fontSize: 15, lineHeight: 2 }}>
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
