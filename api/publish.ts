// POST /api/publish  { files: { "<path>": <jsonValue>, ... }, message }
// 変更ファイルを GitHub に1コミットでまとめてpush → Vercel が自動でビルド・本番反映。
import { verifyRequest } from "./_lib/auth.js";

const GH = "https://api.github.com";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} が未設定です`);
  return v;
}

async function gh(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${GH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "iceline-console",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API エラー (${res.status}): ${text}`);
  }
  return res.json();
}

// 許可するファイルパス（安全のためコンテンツJSONに限定）
const ALLOWED_PREFIX = "src/content/";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  const auth = await verifyRequest(req);
  if (!auth) {
    res.status(401).json({ error: "認証が必要です。再度ログインしてください。" });
    return;
  }

  try {
    const token = env("GITHUB_TOKEN");
    const owner = env("GITHUB_OWNER");
    const repo = env("GITHUB_REPO");
    const branch = process.env.GITHUB_BRANCH || "main";

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const files: Record<string, unknown> = body.files || {};
    const message: string = body.message || `コンテンツ更新（${auth.name}）`;

    const paths = Object.keys(files);
    if (paths.length === 0) {
      res.status(400).json({ error: "変更がありません" });
      return;
    }
    for (const p of paths) {
      if (!p.startsWith(ALLOWED_PREFIX) || p.includes("..")) {
        res.status(400).json({ error: `許可されていないファイルです: ${p}` });
        return;
      }
    }

    // 1. 現在のブランチ先端コミットとツリーを取得
    const ref = await gh(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
    const latestCommitSha = ref.object.sha;
    const latestCommit = await gh(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, token);
    const baseTreeSha = latestCommit.tree.sha;

    // 2. 各ファイルのblobを作成
    const tree = [] as { path: string; mode: "100644"; type: "blob"; sha: string }[];
    for (const path of paths) {
      const content = JSON.stringify(files[path], null, 2) + "\n";
      const blob = await gh(`/repos/${owner}/${repo}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
    }

    // 3. ツリー作成
    const newTree = await gh(`/repos/${owner}/${repo}/git/trees`, token, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree }),
    });

    // 4. コミット作成
    const commit = await gh(`/repos/${owner}/${repo}/git/commits`, token, {
      method: "POST",
      body: JSON.stringify({
        message: `${message}\n\nvia 管理コンソール (${auth.username})`,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    // 5. ブランチを更新（= push、Vercelの自動デプロイがトリガーされる）
    await gh(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });

    res.status(200).json({ ok: true, commit: commit.sha });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "公開処理でエラーが発生しました" });
  }
}
