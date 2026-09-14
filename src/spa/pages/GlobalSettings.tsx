import { Navigate } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section, SectionTitle } from "../components/common/Section";
import { HEAT } from "../data/heatMap";
import { edImg, img, EDIT_MODE } from "../lib/editable";
import { SITE_BG_DEFAULT } from "../lib/siteSettings";

// ─────────────────────────────────────────────────────────
// 全体設定（/__global。2026-09-14 追加）：採用ページ以外の全ページに影響する設定を
// コンソールから編集するための専用ページ。コンソールのページ一覧「全体設定」からだけ開く
// （公開サイトでは表示せずトップへ戻す）。
// 今後の全体設定（全ページ共通の要素など）はこのページにセクションを足していく。
//  - 背景画像: site:bg.image（App.tsx の SiteBg が読む。プレビュー中は editBridge が
//    data-edit-mirror 経由で実際の背景にも即時反映する）
// ─────────────────────────────────────────────────────────
export function GlobalSettings() {
  if (!EDIT_MODE) return <Navigate to="/" replace />;
  return (
    <>
      <section className="relative w-full bg-ink">
        <div className="mx-auto max-w-[1150px] px-5 py-12 text-center pc:px-8">
          <p className="mb-2 text-brand" style={{ fontFamily: "var(--font-accent)", letterSpacing: "0.18em", fontSize: 13 }}>
            GLOBAL SETTINGS
          </p>
          <h1 className="text-white" style={{ fontSize: 32, fontWeight: 900 }}>全体設定</h1>
          <p className="mt-3 text-white/70" style={{ fontSize: 13 }}>
            採用ページ以外のすべてのページに影響する設定です。右の項目を編集して「公開」してください。
          </p>
        </div>
      </section>

      <Section heat={HEAT.companyProfile}>
        <SectionTitle en="BACKGROUND" jp="背景画像" />
        <p className="mt-4 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.9 }}>
          コーポレート各ページの背景に敷く画像です（画面に固定され、コンテンツの下に表示されます）。
          横長で、文字の下に置いても読める淡い画像を推奨します。
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-secondary">
          <ImageWithFallback
            src={img("site:bg.image", SITE_BG_DEFAULT)}
            alt="背景画像"
            className="block aspect-[16/9] w-full object-cover"
            data-keep-size="1"
            {...edImg("site:bg.image", "背景画像（全ページ共通）")}
          />
        </div>
      </Section>
    </>
  );
}
