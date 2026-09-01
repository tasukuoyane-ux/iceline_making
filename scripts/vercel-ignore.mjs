// Vercel の Ignored Build Step（vercel.json の ignoreCommand）。
// コミットメッセージに [vercel skip] が含まれていればビルドをスキップする（exit 0）。
// コンソールからの画像アップロードは1枚ごとに GitHub へコミットされるが、
// デプロイは「更新（本番へ公開）」のコミットでまとめて行うため、
// アップロードのコミットにはこの印を付けてビルドを走らせない。
const msg = process.env.VERCEL_GIT_COMMIT_MESSAGE || ''
if (/\[vercel skip\]/i.test(msg)) {
  console.log('[vercel-ignore] [vercel skip] を検出。ビルドをスキップします。')
  process.exit(0)
}
process.exit(1)
