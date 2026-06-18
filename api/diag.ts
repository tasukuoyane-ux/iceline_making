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
  try {
    const arr = JSON.parse(process.env.CONSOLE_USERS || "[]");
    out.consoleUsers = {
      parsed: true,
      isArray: Array.isArray(arr),
      count: Array.isArray(arr) ? arr.length : 0,
      usernames: Array.isArray(arr) ? arr.map((u: any) => u?.username) : [],
      firstHasHash: Array.isArray(arr) && arr[0] ? !!arr[0].passwordHash : false,
    };
  } catch (e: any) {
    out.consoleUsers = { parsed: false, error: String(e?.message || e) };
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
