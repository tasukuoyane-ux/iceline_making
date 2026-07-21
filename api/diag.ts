// 診断用: 依存の読み込みと環境変数の有無を handler 内で検査して返す。
// import時クラッシュを避けるため、すべて handler 内の動的読み込みで行う。
export default async function handler(_req: any, res: any) {
  const out: any = {
    node: process.version,
    env: {
      JWT_SECRET: !!process.env.JWT_SECRET,
      CONSOLE_USERS: !!process.env.CONSOLE_USERS,
      GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
      GITHUB_OWNER: process.env.GITHUB_OWNER || null,
      GITHUB_REPO: process.env.GITHUB_REPO || null,
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    },
  };

  // CONSOLE_USERS が正しいJSON配列か
  // 注: このエンドポイントは未認証で叩けるため、ユーザー名そのものは返さない（件数のみ）。
  try {
    const arr = JSON.parse(process.env.CONSOLE_USERS || "[]");
    out.consoleUsers = {
      parsed: true,
      isArray: Array.isArray(arr),
      count: Array.isArray(arr) ? arr.length : 0,
      firstHasHash: Array.isArray(arr) && arr[0] ? !!arr[0].passwordHash : false,
    };
  } catch (e: any) {
    out.consoleUsers = { parsed: false, error: String(e?.message || e) };
  }

  // GITHUB_TOKEN が「存在するか」だけでなく「今も有効か」を確認する。
  // 公開（push）が 401 Bad credentials で失敗する原因のほとんどはトークンの期限切れ。
  const ghToken = process.env.GITHUB_TOKEN;
  if (!ghToken) {
    out.github = { token: "未設定" };
  } else {
    try {
      const owner = process.env.GITHUB_OWNER;
      const repo = process.env.GITHUB_REPO;
      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "iceline-console-diag",
        },
      });
      out.github = {
        token: r.status === 401 ? "無効・期限切れ" : r.ok ? "有効" : `応答 ${r.status}`,
        status: r.status,
        // 書き込み権限があるか（push できるか）
        canPush: r.ok ? !!(await r.json())?.permissions?.push : null,
        // 期限が近いトークンはこのヘッダで分かる（fine-grained PAT のみ）
        expiration: r.headers.get("github-authentication-token-expiration"),
      };
    } catch (e: any) {
      out.github = { token: "確認できず", error: String(e?.message || e) };
    }
  }

  // 依存(jose/bcryptjs)が静的importでバンドルされているか
  try {
    const jose: any = await import("jose");
    out.jose = typeof jose.SignJWT === "function" ? "ok" : "loaded-no-SignJWT";
  } catch (e: any) {
    out.jose = "ERROR: " + String(e?.message || e);
  }
  try {
    const bcrypt: any = (await import("bcryptjs")).default;
    out.bcryptjs = typeof bcrypt.compare === "function" ? "ok" : "loaded-no-compare";
  } catch (e: any) {
    out.bcryptjs = "ERROR: " + String(e?.message || e);
  }

  res.status(200).json(out);
}
