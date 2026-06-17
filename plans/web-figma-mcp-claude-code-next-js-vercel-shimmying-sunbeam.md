# 株式会社アイスライン コーポレート＋採用サイト プロトタイプ

## Context（背景・目的）

株式会社アイスライン（岡山・創業120年の「氷と食」の会社）のWebサイトを、最終的にはClaude Code（MCP経由）でNext.js実装・Vercelデプロイする。本タスクはその**前段となる動くプロトタイプ**を Figma Make（React + Tailwind v4）上で構築するもの。

添付3資料を一次情報として使用する：
- `______v3.pdf` … **トンマナ表**。6つの評価軸（A〜E）×全37セクションの熱量設計と、参照リファレンス（recruit.co.jp）。
- `_________.pdf` … コーポレートサイト各ページの確定コピー原稿。
- `_____.pdf` … 採用サイト各セクションの確定コピー原稿。

不足情報は https://www.iceline.co.jp/ を参照して補完する。

### ゴール
ユーザー指定の固定7ページ（TOP / 食品事業部 / アイス事業部 / 会社情報 / お問い合わせ / お知らせ / 採用情報）＋トンマナ表で定義された採用サイト全セクション・個別商品ページ・インタビュー記事を、トンマナ表の熱量設計に忠実なデザインで一気に構築する。

---

## デザインの核：熱量（ねつりょう）の設計

トンマナ表は6軸でA（冷／静）〜E（温／動）を定義する。これを**再利用可能な「熱量トークン」**に落とし込み、各セクションへ機械的に適用する。これが本プロトタイプ最大の差別化要素。

| 軸 | 重み | A（低熱量） | E（高熱量） | 実装での表現 |
|---|---|---|---|---|
| レイアウト規則性 | 2 | グリッド・左右対称 | 非グリッド・左右非対称 | カラム数・整列・オフセット配置 |
| エモーショナルさ | 3 | 冷 | 温 | コピーの語気・余白・色温度 |
| 主語 | 1 | 当社/会社 | 私/私たち | 文章の人称・一人称コピー |
| セクション統合 | 1.5 | ブツ切れ（区切り明確） | 1本（地続き） | 区切り線/背景の連続性 |
| 背景 | 0.5 | 白地・淡泊 | 画像・動画・リッチ | 背景の階調・画像/動画使用 |
| 要素の丸み | 0.5 | 角 | 丸 | border-radius スケール |

### 実装：`src/app/lib/heat.ts`
- 型 `HeatProfile = { layout, emotion, subject, cohesion, background, roundness }`（各 'A'|'B'|'C'|'D'|'E'）。
- `heatStyles(profile)` が Tailwind クラス/CSS変数（角丸スケール、背景クラス、余白、アニメ強度）を返すヘルパー。
- 各セクションコンポーネントは自分の HeatProfile を受け取り、見た目を派生させる。トンマナ表の各行（sec no.）の評価値をそのまま定数として保持（`src/app/data/heatMap.ts`）。

### サイト全体のトーン分離
- **コーポレート側**：低〜中熱量（A〜D中心）。クール・誠実・可読性重視。
- **採用側 (`/recruit`)**：高熱量（最大E）。一人称・感情・動きを強める。トンマナ表どおりコーポレートより1段階熱い。

---

## カラー / ブレイクポイント / タイポ

`src/styles/theme.css` のトークンを上書きし、指定パレットを定義（生hexは散らさずCSS変数化）：
- メイン=白 `--background`、サブ=グレー `--muted`、アクセント=赤 `--accent`(例 #E60012系の和の赤)、テキスト=黒。
- ブレイクポイント：SP ≤599px / TAB 600–1024px / PC ≥1025px。Tailwind v4 の `@theme` でカスタムブレイクポイント（`tab`, `pc`）を定義し、`sm/md/lg` の混在を避け指定値に厳密準拠。
- フォント：見出しは力強い和文ゴシック、本文は可読性重視。フォント import は `src/styles/fonts.css` の先頭のみ。
- 実装着手時に `make:aesthetic-stance` skill を確認し、`create_make_theme` でテーマ方向性を固める。

---

## ルーティング（react-router 7 / 既存依存にあり）

`src/app/App.tsx` を `RouterProvider`/`Routes` 構成に変更。共通レイアウト（ヘッダーのグローバルナビ＋フッター＋「動画で知るアイスライン」固定誘導ボタン）でラップ。

| パス | ページ | 主セクション（sec no.） |
|---|---|---|
| `/` | TOP | MVスライダー(1)・ヒーロー3導線(2)・新着情報(3)・当社の強み(4)・商品ジャンル一覧(5) |
| `/food` | 食品事業部 | MV(6)・選ばれる理由(7)・商品一覧(8) |
| `/food/products/:id` | 食品 個別商品 | 個別商品詳細(9) |
| `/ice` | アイス事業部 | MV(10)・選ばれる理由(11)・商品一覧(12) |
| `/ice/products/:id` | アイス 個別商品 | 個別商品詳細(13) |
| `/company` | 会社情報 | 代表メッセージ(14)・会社概要(15)・沿革(16)・企業理念(17)・CSR(18) |
| `/contact` | お問い合わせ | フォーム(19) |
| `/news` | お知らせ | 記事一覧(20)（＋ `/news/:id` 記事詳細） |
| `/videos` | 動画で知るアイスライン | 動画一覧(21) |
| `/recruit` | 採用トップ | MV採用コピー(22)・会社を知る(23-25)・仕事を知る(26-28)・カンパニーデック(29-30)・人を知る(31-32)・募集要項(33-35)・フォーム(36) |
| `/recruit/interview/:id` | インタビュー記事 | 記事(37) |

---

## コンテンツ（確定コピーは資料から転記、不足はiceline.co.jp準拠で補完）

主要原稿は資料に確定済み。`src/app/data/` にページ別データを集約：
- `company.ts`：会社概要（株式会社アイスライン／〒700-0941 岡山市北区青江2-4-6／TEL 086-224-5235／事業内容）、沿革（1905〜2014の年表）、企業理念、代表メッセージ(338字)。
- `strengths.ts`：当社の強み3本（安定供給/スピード/提案力）。
- `products.ts`：食品・アイスの商品一覧＋個別詳細項目（商品名/規格/原材料/アレルゲン/保存方法/賞味期限/FSSC・ISO/活用レシピ）。**商品名等の実データはサンプルで補完しモック化**。
- `news.ts`：お知らせ記事モック。
- `recruit.ts`：採用各セクションの確定コピー（メイン「笑顔と、正直さ。ただそれだけ。」、事業紹介、企業理念、仕事の魅力3本、一日の流れ、業務内容、応募コピー、募集要項）、インタビュー記事モック。
- TOPメインコピー＝案1「氷から、食に応える。」／サブ「今日も、とどこおりなく。」（差し替え容易に定数化）。

---

## 画像

`mcp__plugin_make_unsplash__search_photos`（unsplash skill）で取得し `ImageWithFallback` で表示（ES import バインディングを `src` に渡す）。用途：氷キューブ/シズル食材/工場・製造現場/働く人々/岡山・倉庫。MVは `object-cover`、ロゴ系は `object-contain`。背景熱量が高いセクション（D/E）ほど画像・動画的演出を強める。

---

## コンポーネント構成（`src/app/components/` 配下、shadcn/ui を最優先利用）

- 共通：`layout/Header.tsx`（グローバルナビ＝navigation-menu）、`layout/Footer.tsx`、`layout/VideoCta.tsx`（固定誘導）、`SectionHeat.tsx`（熱量ラッパ）。
- TOP：`top/Hero Slider`（embla-carousel）・`AudienceLinks`・`NewsList`・`Strengths`・`ProductGenres`。
- 事業部：`division/DivisionMV`・`ReasonChosen`・`ProductGrid`・`ProductDetail`（食品/アイス共用、props で熱量・配色切替）。
- 会社情報：`company/CeoMessage`・`CompanyProfileTable`・`HistoryTimeline`・`Philosophy`・`Csr`。
- お問い合わせ/フォーム：`ContactForm`（react-hook-form 7.55.0 + shadcn form/input/select、送信はモック＋sonner トースト）。
- 採用：`recruit/RecruitMV`・`KnowCompany`・`KnowWork`（一日の流れ＝タイムライン）・`CompanyDeck`・`KnowPeople`・`InterviewArticle`・`Requirements`・`RecruitForm`。

UIプリミティブ（button/card/input/accordion/tabs/badge/avatar/carousel/form/select/separator 等）は既存 `src/app/components/ui/*` を必ず使用し、独自実装しない。

---

## 実装順序

1. `make:aesthetic-stance` 確認 → `create_make_theme` → `theme.css`/`fonts.css` でパレット・ブレイクポイント・タイポ確定。
2. `lib/heat.ts` + `data/heatMap.ts`（熱量基盤）。
3. `data/*.ts`（確定コピー転記＋モック補完）。
4. 共通レイアウト＋ルーティング（App.tsx）。
5. コーポレート6ページ＋個別商品（低〜中熱量）。
6. 採用サイト全セクション＋インタビュー（高熱量）。
7. 画像差し込み・レスポンシブ（SP/TAB/PC）調整・微調整。

## 検証

- Vite dev サーバは起動済み。プレビュー面で各ルートを遷移し確認（localhost誘導はしない／`vite build`は実行しない）。
- チェック観点：(1) 全ルートが表示・ナビ遷移可能、(2) コーポレート＜採用 の熱量差が視覚的に出ている、(3) トンマナ表どおりセクション毎に丸み・配置・背景・人称が変化、(4) SP599/TAB1024/PC1025 で崩れない、(5) 確定コピーが正確に反映、(6) フォーム送信モックがトースト表示、(7) 固定「動画で知る」誘導が全ページ表示。
