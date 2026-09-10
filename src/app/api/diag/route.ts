// 診断用: 依存の読み込みと環境変数の有無をハンドラ内で検査して返す。
// import時クラッシュを避けるため、すべてハンドラ内の動的読み込みで行う。
export async function GET(req: Request): Promise<Response> {
  // 一時診断（2026-09-10）: 本番で「採用記事の新規作成」が不明なエラーになる原因を取る。
  // /api/diag?probe=interview-create&key=<閲覧パスワードのハッシュ> で、下書きの採用記事を
  // Local API で作成→即削除し、失敗時はエラー本文とスタックを返す。原因判明後に削除する。
  const u = new URL(req.url);
  if (u.searchParams.get("probe") === "interview-create") {
    const overrides = (await import("../../../content/overrides.json")).default as Record<string, string>;
    if (!u.searchParams.get("key") || u.searchParams.get("key") !== overrides["site:protect.hash"]) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    const res: any = { steps: [] };
    const t0 = Date.now();
    try {
      const { getPayload } = await import("payload");
      const config = (await import("../../../payload.config")).default;
      const payload = await getPayload({ config });
      res.steps.push(`init ${Date.now() - t0}ms`);
      const data: any = {
        name: "＿診断テスト",
        lead: "診断",
        category: "社員インタビュー",
        order: 0,
        role: "",
        years: "",
        subtitle: "",
        intro: "",
        hobby: "",
        image: null,
        imageSrc: "",
        image2: null,
        image2Src: "",
        video: null,
        videoSrc: "",
        blocks: [{ blockType: "paragraph", text: "診断" }],
      };
      let id: any = null;
      try {
        const doc = await payload.create({ collection: "interviews", data, draft: true });
        id = doc.id;
        res.steps.push(`create ok id=${doc.id} slug=${doc.slug} ${Date.now() - t0}ms`);
      } catch (e: any) {
        res.createError = { message: e?.message, name: e?.name, data: e?.data, cause: String(e?.cause?.message ?? e?.cause ?? ""), stack: String(e?.stack || "").split("\n").slice(0, 15) };
      }
      if (id != null) {
        try {
          await payload.delete({ collection: "interviews", id });
          res.steps.push(`delete ok ${Date.now() - t0}ms`);
        } catch (e: any) {
          res.deleteError = { message: e?.message, stack: String(e?.stack || "").split("\n").slice(0, 10) };
        }
      }
    } catch (e: any) {
      res.fatal = { message: e?.message, stack: String(e?.stack || "").split("\n").slice(0, 15) };
    }
    return Response.json(res);
  }

  const out: any = {
    node: process.version,
    env: {
      JWT_SECRET: !!process.env.JWT_SECRET,
      CONSOLE_USERS: !!process.env.CONSOLE_USERS,
      GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
      GITHUB_OWNER: process.env.GITHUB_OWNER || null,
      GITHUB_REPO: process.env.GITHUB_REPO || null,
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      PAYLOAD_SECRET: !!process.env.PAYLOAD_SECRET,
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

  // 依存(jose/bcryptjs)が正しく読み込めるか
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

  return Response.json(out);
}
