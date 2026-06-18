# 管理コンソール（/console）セットアップ・運用ガイド

サイトのコンテンツ（画像・文言・お知らせ・社員インタビュー・動画）を、エンジニア以外の社員が
ブラウザから編集し、ボタン一つで本番サイトへ反映できる管理画面です。

- 管理画面URL: `https://<本番ドメイン>/console`
- 編集 → 画面右上の「更新（本番へ公開）」→ 数十秒〜1分で本番サイトに反映されます。

---

## 仕組み（概要）

```
/console（社員ログイン）
  ├─ 左：本番ページのライブプレビュー（要素をクリックで右側に編集フォーム）
  └─ 右：編集フォーム（お知らせ / 動画 / インタビュー / 画像 / セクション文言）
        │
        └─「更新」ボタン
              → /api/publish が src/content/*.json を GitHub へコミット
              → Vercel が自動で再ビルド & 本番反映
        画像アップロードは /api/upload 経由で Vercel Blob に保存
```

編集対象の実データはすべて `src/content/*.json` に格納されています。
（`news.json` / `videos.json` / `interviews.json` / `images.json` / `sections.json`）

---

## 初期セットアップ（エンジニアが一度だけ実施）

### 1. 依存パッケージのインストール

```bash
pnpm install
```

### 2. 社員アカウントを作る

パスワードのハッシュを生成します（社員ごとに実行）。

```bash
node scripts/hash-password.mjs <社員ID> <表示名> <パスワード>
# 例: node scripts/hash-password.mjs tanaka 田中太郎 himitsu123
```

出力された JSON を集めて、配列形式で環境変数 `CONSOLE_USERS` に設定します。

```json
[
  {"username":"tanaka","name":"田中太郎","passwordHash":"$2a$10$..."},
  {"username":"suzuki","name":"鈴木花子","passwordHash":"$2a$10$..."}
]
```

### 3. GitHub トークンを用意

本番リポジトリの **Contents 書き込み権限** を持つトークンを発行します
（Fine-grained personal access token 推奨：対象リポジトリの Contents = Read and write）。

### 4. Vercel Blob ストアを作成

Vercel ダッシュボード → Storage → Blob でストアを作成し、プロジェクトにリンクします。
`BLOB_READ_WRITE_TOKEN` は自動で注入されます。

### 5. Vercel に環境変数を登録

`.env.example` を参照し、Vercel のプロジェクト設定（Environment Variables）に以下を登録：

| 変数名 | 説明 |
| --- | --- |
| `JWT_SECRET` | ログインセッション署名鍵（長いランダム文字列） |
| `CONSOLE_USERS` | 社員アカウントのJSON配列（上記2で作成） |
| `GITHUB_TOKEN` | GitHub の Contents 書き込みトークン |
| `GITHUB_OWNER` | リポジトリのオーナー（例: `tasukuoyane-ux`） |
| `GITHUB_REPO` | リポジトリ名 |
| `GITHUB_BRANCH` | 本番ブランチ（既定 `main`） |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob（Blobストア作成で自動付与） |

登録後、再デプロイすると `/console` が利用可能になります。

---

## 社員向けの使い方

1. `https://<本番ドメイン>/console` を開き、社員IDとパスワードでログイン。
2. 左のプレビューで、上部のプルダウンから編集したいページを選ぶ。
3. プレビュー内の **編集したい要素（見出し・本文・画像など）をクリック** すると、
   右側に対応する編集フォームが開きます。
   （右側のタブから直接、お知らせや画像などを選んで編集することもできます）
4. テキストを書き換える／画像を「アップロード」または URL で差し替える。
5. お知らせ・動画・インタビューは「＋追加」「削除」もできます。
6. 一通り編集したら、画面右上の **「更新（本番へ公開）」** を押す。
7. 数十秒〜1分ほどで本番サイトに反映されます。

> 編集途中の内容はブラウザに自動保存され、ページを閉じても残ります。
> 「変更を破棄」で、最後に公開した状態に戻せます。

---

## 編集できる項目

| タブ | 対象 |
| --- | --- |
| お知らせ | お知らせ記事（日付・カテゴリ・タイトル・本文）の追加/編集/削除 |
| 動画 | 「動画で知るアイスライン」の動画（タイトル・動画URL・サムネイル）追加/編集/削除 |
| 社員インタビュー | 採用ページの社員インタビュー（氏名・役職・本文・画像）追加/編集/削除 |
| 画像 | トップ・各事業部・商品などの画像差し替え |
| セクション文言 | トップ／事業部／採用／会社情報など各セクションのコピー・本文 |

---

## トラブルシュート

- **ログインできない**: `JWT_SECRET` と `CONSOLE_USERS` が登録されているか確認。
- **「更新」で失敗する**: `GITHUB_TOKEN` の権限（Contents=write）と `GITHUB_OWNER/REPO/BRANCH` を確認。
- **画像アップロードに失敗**: Vercel Blob ストアがリンクされ `BLOB_READ_WRITE_TOKEN` があるか確認。
- **反映されない**: GitHub にコミットは入っているか（Vercel のデプロイログを確認）。
