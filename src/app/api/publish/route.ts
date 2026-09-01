// POST /api/publish  { files: { "<path>": <jsonValue>, ... }, message }
// 変更ファイルを GitHub に1コミットでまとめてpush → Vercel が自動でビルド・本番反映。
// （コンソールからアップロードした画像は /api/upload の時点で public/uploads/ に
//   コミット済み。ここでは JSON だけをコミットし、そのデプロイで画像も一緒に公開される）
import { verifyRequest } from "../_lib/auth";
import { commitFiles } from "../_lib/github";

// 許可するファイルパス（安全のためコンテンツJSONに限定）
const ALLOWED_PREFIX = "src/content/";

export async function POST(req: Request): Promise<Response> {
  const auth = await verifyRequest(req);
  if (!auth) {
    return Response.json({ error: "認証が必要です。再度ログインしてください。" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const files: Record<string, unknown> = body?.files || {};
    const message: string = body?.message || `コンテンツ更新（${auth.name}）`;

    const paths = Object.keys(files);
    if (paths.length === 0) {
      return Response.json({ error: "変更がありません" }, { status: 400 });
    }
    for (const p of paths) {
      if (!p.startsWith(ALLOWED_PREFIX) || p.includes("..")) {
        return Response.json({ error: `許可されていないファイルです: ${p}` }, { status: 400 });
      }
    }

    const { sha } = await commitFiles(
      paths.map((path) => ({
        path,
        content: JSON.stringify(files[path], null, 2) + "\n",
        encoding: "utf-8" as const,
      })),
      `${message}\n\nvia 管理コンソール (${auth.username})`
    );

    return Response.json({ ok: true, commit: sha });
  } catch (err: any) {
    return Response.json({ error: err?.message || "公開処理でエラーが発生しました" }, { status: 500 });
  }
}
