// GitHub へのコミット共通処理（/api/publish と /api/upload で共用）。
// Git Data API（blob → tree → commit → ref 更新）で複数ファイルを1コミットにまとめる。
// ref 更新が他のコミットと競合した場合（同時アップロード等）は先頭を取り直して再試行する。

const GH = "https://api.github.com";

export class GhError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} が未設定です`);
  return v;
}

export function ghConfig() {
  return {
    token: env("GITHUB_TOKEN"),
    owner: env("GITHUB_OWNER"),
    repo: env("GITHUB_REPO"),
    branch: process.env.GITHUB_BRANCH || "main",
  };
}

export async function gh(path: string, token: string, init?: RequestInit) {
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
    // 401/403 は GITHUB_TOKEN の失効・権限不足であることがほとんど。
    // 生のGitHub応答だけでは対処が分からないため、何をすべきかを添える。
    if (res.status === 401) {
      throw new GhError(
        401,
        "GitHubの認証に失敗しました（Bad credentials）。公開用アクセストークン（GITHUB_TOKEN）の" +
          "有効期限が切れているか、無効化されています。GitHubで新しいトークンを発行し、" +
          "Vercelの環境変数 GITHUB_TOKEN を更新して再デプロイしてください。"
      );
    }
    if (res.status === 403) {
      throw new GhError(
        403,
        "GitHubへの書き込みが拒否されました（403）。GITHUB_TOKEN にこのリポジトリへの" +
          "contents:write 権限があるか確認してください。"
      );
    }
    throw new GhError(res.status, `GitHub API エラー (${res.status}): ${text}`);
  }
  return res.json();
}

export interface CommitFile {
  /** リポジトリ内のパス（例: src/content/overrides.json, public/uploads/photo.jpg） */
  path: string;
  /** 内容。encoding が base64 ならバイナリの base64 文字列 */
  content: string;
  encoding: "utf-8" | "base64";
}

/**
 * 複数ファイルを1コミットでブランチ先端に積む（= push。Vercel の自動デプロイがトリガーされる）。
 * 同じパスが既にあれば上書きになる。ref 更新の競合（422/409）は最大4回まで再試行。
 */
export async function commitFiles(files: CommitFile[], message: string): Promise<{ sha: string }> {
  const { token, owner, repo, branch } = ghConfig();

  // 1. 各ファイルの blob を作成（blob は親コミットに依存しないので再試行時も使い回せる）
  const tree: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];
  for (const f of files) {
    const blob = await gh(`/repos/${owner}/${repo}/git/blobs`, token, {
      method: "POST",
      body: JSON.stringify({ content: f.content, encoding: f.encoding }),
    });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      // 2. 現在のブランチ先端コミットとツリーを取得
      const ref = await gh(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
      const latestCommitSha: string = ref.object.sha;
      const latestCommit = await gh(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, token);

      // 3. ツリー作成（既存ツリーに差分を重ねる）
      const newTree = await gh(`/repos/${owner}/${repo}/git/trees`, token, {
        method: "POST",
        body: JSON.stringify({ base_tree: latestCommit.tree.sha, tree }),
      });

      // 4. コミット作成
      const commit = await gh(`/repos/${owner}/${repo}/git/commits`, token, {
        method: "POST",
        body: JSON.stringify({ message, tree: newTree.sha, parents: [latestCommitSha] }),
      });

      // 5. ブランチを更新（他のコミットが先に入っていると 422 で失敗 → 再試行）
      await gh(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      });
      return { sha: commit.sha };
    } catch (err) {
      lastErr = err;
      const status = err instanceof GhError ? err.status : 0;
      if (status !== 422 && status !== 409) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("GitHub へのコミットに失敗しました（競合の再試行上限）");
}
